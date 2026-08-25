import { describe, expect, it } from 'vitest';
import request from 'supertest';
import sharp from 'sharp';
import { createApp } from '../../app.js';
import { signAccessToken } from '../../auth/jwt.js';
import { InMemoryBlobStorage } from '../../storage/blobStorage.js';
import { sniffMimeType, stripExifAndGps, type AllowedMimeType } from '../../storage/imageProcessor.js';
import { anActor, databaseReady, describeIfDatabase, IDS } from '../../test/factories.js';
import { createUploadsService } from './uploads.service.js';
import type { UploadsRepo } from './uploads.repo.js';

function mockUploadsRepo(): UploadsRepo {
  return {
    createUpload: async (_db, params) => ({
      id: '00000000-0000-0000-0000-000000000001',
      storage_key: params.storageKey,
      bucket: params.bucket,
      mime_type: params.mimeType,
      size_bytes: String(params.sizeBytes),
      checksum: null,
      entity_type: params.entityType ?? null,
      entity_id: params.entityId ?? null,
      is_public: params.isPublic ?? false,
      uploaded_by: params.uploadedBy ?? null,
      created_at: new Date(),
    }),
    findByKey: async () => null,
    findById: async () => null,
  };
}

describe('Uploads Module & BR-16 Privacy Test Contract', () => {
  describe('BR-16: Server-side EXIF and GPS Stripping', () => {
    it('BR-16: uploaded image has no EXIF or GPS after processing', async () => {
      // 1. Create a genuine JPEG image with GPS and EXIF metadata
      const rawImageWithExif = await sharp({
        create: {
          width: 50,
          height: 50,
          channels: 3,
          background: { r: 120, g: 180, b: 90 },
        },
      })
        .withMetadata({
          orientation: 1,
          exif: {
            IFD0: {
              Make: 'FarmCameraPhone',
              Model: 'Model-X',
              ImageDescription: 'Coonoor Organic Tea Plantation GPS: 11.3530, 76.7959',
            },
          },
        })
        .jpeg()
        .toBuffer();

      // Verify the fixture contains EXIF metadata before stripping
      const initialMeta = await sharp(rawImageWithExif).metadata();
      expect(initialMeta.exif).toBeDefined();

      // 2. Process image through the stripping pipeline
      const { buffer: cleanBuffer, mimeType } = await stripExifAndGps(rawImageWithExif);
      expect(mimeType).toBe('image/jpeg');

      // 3. Assert on the parsed metadata of the stored object: no EXIF or GPS tags remain
      const cleanMeta = await sharp(cleanBuffer).metadata();
      expect(cleanMeta.exif).toBeUndefined();
      expect(cleanMeta.width).toBe(50);
      expect(cleanMeta.height).toBe(50);
    });
  });

  describe('MIME Detection & Magic Byte Sniffing', () => {
    it('sniffs true MIME type from magic numbers', async () => {
      const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
      expect(sniffMimeType(jpegBuffer)).toBe('image/jpeg');

      const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]);
      expect(sniffMimeType(pngBuffer)).toBe('image/png');

      const pdfBuffer = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31]);
      expect(sniffMimeType(pdfBuffer)).toBe('application/pdf');

      const fakeBuffer = Buffer.from([0x00, 0x01, 0x02, 0x03]);
      expect(sniffMimeType(fakeBuffer)).toBeNull();
    });
  });

  describe('Upload Signing Service', () => {
    it('generates a secure UUID storage key and does not use client fileName for the path', async () => {
      const storage = new InMemoryBlobStorage();
      const repo = mockUploadsRepo();
      const service = createUploadsService(storage, repo);

      const actor = anActor({ userId: IDS.userSuperAdmin });
      const target = await service.signUpload(actor, {
        purpose: 'CERTIFICATE',
        contentType: 'application/pdf',
        sizeBytes: 500000,
        fileName: '../../etc/passwd.pdf', // Path traversal attack attempt
      });

      expect(target.method).toBe('PUT');
      expect(target.resumable).toBe(false);
      expect(target.uploadUrl).not.toContain('..');
      expect(target.uploadUrl).toContain('certificate/');
      expect(target.fileUrl).toContain('.pdf');
    });

    it('rejects disallowed MIME type with 422', async () => {
      const storage = new InMemoryBlobStorage();
      const repo = mockUploadsRepo();
      const service = createUploadsService(storage, repo);
      const actor = anActor();

      await expect(
        service.signUpload(actor, {
          purpose: 'LISTING_PHOTO',
          contentType: 'text/html' as unknown as AllowedMimeType,
          sizeBytes: 1000,
        }),
      ).rejects.toThrow(expect.objectContaining({ status: 422 }));
    });
  });

  describe('HTTP Schema Validation', () => {
    const app = createApp();
    const token = signAccessToken({
      sub: IDS.userSuperAdmin,
      roles: [{ code: 'SUPER_ADMIN' }],
      farmerId: null,
      customerId: null,
    });

    it('rejects file size > 25 MiB with 422', async () => {
      const res = await request(app)
        .post('/v1/uploads/sign')
        .set('Authorization', `Bearer ${token}`)
        .send({
          purpose: 'LISTING_PHOTO',
          contentType: 'image/jpeg',
          sizeBytes: 30000000, // > 25 MiB
        });

      expect(res.status).toBe(422);
      expect(res.body.code).toBe('VALIDATION_FAILED');
    });

    it('rejects unauthenticated calls with 401', async () => {
      const res = await request(app)
        .post('/v1/uploads/sign')
        .send({
          purpose: 'LISTING_PHOTO',
          contentType: 'image/jpeg',
          sizeBytes: 1000,
        });

      expect(res.status).toBe(401);
    });
  });

  describeIfDatabase('Integration against PostgreSQL', () => {
    const app = createApp();
    const token = signAccessToken({
      sub: IDS.userSuperAdmin,
      roles: [{ code: 'SUPER_ADMIN' }],
      farmerId: null,
      customerId: null,
    });

    it('returns 201 with signed target for valid payload', async () => {
      if (!(await databaseReady('uploads'))) return;

      const res = await request(app)
        .post('/v1/uploads/sign')
        .set('Authorization', `Bearer ${token}`)
        .send({
          purpose: 'LISTING_PHOTO',
          contentType: 'image/jpeg',
          sizeBytes: 1048576,
          fileName: 'fresh-carrots.jpg',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('uploadUrl');
      expect(res.body).toHaveProperty('fileUrl');
      expect(res.body).toHaveProperty('method', 'PUT');
      expect(res.body).toHaveProperty('expiresAt');
      expect(res.body).toHaveProperty('resumable', false);
    });
  });
});
