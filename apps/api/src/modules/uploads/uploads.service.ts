import crypto from 'node:crypto';
import path from 'node:path';
import type { Actor } from '../../auth/requireAuth.js';
import { config } from '../../config.js';
import { pool } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import { defaultBlobStorage, type BlobStorage, type SignedUploadTarget } from '../../storage/blobStorage.js';
import { isAllowedMimeType, sniffMimeType, stripExifAndGps } from '../../storage/imageProcessor.js';
import { uploadsRepo, type UploadsRepo } from './uploads.repo.js';
import type { SignUploadBody } from './uploads.schema.js';

function getExtension(mimeType: string, fileName?: string): string {
  if (fileName !== undefined && fileName.length > 0) {
    const parsedExt = path.extname(fileName).toLowerCase();
    if (parsedExt.length > 0 && /^\.[a-z0-9]+$/.test(parsedExt)) {
      return parsedExt;
    }
  }

  switch (mimeType) {
    case 'image/jpeg':
      return '.jpg';
    case 'image/png':
      return '.png';
    case 'image/webp':
      return '.webp';
    case 'application/pdf':
      return '.pdf';
    default:
      return '.bin';
  }
}

export interface UploadsService {
  signUpload(actor: Actor, input: SignUploadBody): Promise<SignedUploadTarget>;
  processAndSanitizeImage(key: string, buffer: Buffer): Promise<{ sanitizedBuffer: Buffer; mimeType: string }>;
}

export function createUploadsService(
  storage: BlobStorage = defaultBlobStorage,
  repo: UploadsRepo = uploadsRepo,
): UploadsService {
  return {
    async signUpload(actor, input) {
      if (!isAllowedMimeType(input.contentType)) {
        throw new AppError('VALIDATION_FAILED', {
          status: 422,
          detail: `contentType '${input.contentType}' is not permitted.`,
        });
      }

      // Generate server-side UUID storage key to prevent path traversal
      const ext = getExtension(input.contentType, input.fileName);
      const uuid = crypto.randomUUID();
      const storageKey = `${input.purpose.toLowerCase()}/${uuid}${ext}`;

      const isPublic =
        input.purpose === 'LISTING_PHOTO' ||
        input.purpose === 'PROFILE_PHOTO' ||
        input.purpose === 'POD_PHOTO';

      const uploadTarget = await storage.generateUploadTarget({
        key: storageKey,
        contentType: input.contentType,
        sizeBytes: input.sizeBytes,
        purpose: input.purpose,
        expiresInMinutes: 15,
      });

      // Record in the uploads audit table
      await repo.createUpload(pool, {
        storageKey,
        bucket: config.AZURE_BLOB_CONTAINER,
        mimeType: input.contentType,
        sizeBytes: input.sizeBytes,
        uploadedBy: actor.userId,
        isPublic,
      });

      return uploadTarget;
    },

    async processAndSanitizeImage(key, buffer) {
      // Validate magic bytes to avoid MIME spoofing
      const detectedMime = sniffMimeType(buffer);
      if (detectedMime === null || !detectedMime.startsWith('image/')) {
        throw new AppError('VALIDATION_FAILED', {
          status: 422,
          detail: 'File content does not match a valid image format.',
        });
      }

      // BR-16: Re-encode image and strip all EXIF and GPS tags
      const { buffer: sanitizedBuffer, mimeType } = await stripExifAndGps(buffer);

      // Save stripped buffer back to storage
      await storage.upload(key, sanitizedBuffer, mimeType);

      return { sanitizedBuffer, mimeType };
    },
  };
}

export const uploadsService = createUploadsService();
