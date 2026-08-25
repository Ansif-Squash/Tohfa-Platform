import { z } from 'zod';
import { ALLOWED_MIME_TYPES } from '../../storage/imageProcessor.js';

export const UploadPurpose = {
  FARMER_DOCUMENT: 'FARMER_DOCUMENT',
  CERTIFICATE: 'CERTIFICATE',
  LISTING_PHOTO: 'LISTING_PHOTO',
  GRN_PHOTO: 'GRN_PHOTO',
  QC_PHOTO: 'QC_PHOTO',
  POD_PHOTO: 'POD_PHOTO',
  PROFILE_PHOTO: 'PROFILE_PHOTO',
  ISSUE_PHOTO: 'ISSUE_PHOTO',
} as const;

export type UploadPurpose = (typeof UploadPurpose)[keyof typeof UploadPurpose];

export const signUploadBody = z.object({
  purpose: z.enum([
    UploadPurpose.FARMER_DOCUMENT,
    UploadPurpose.CERTIFICATE,
    UploadPurpose.LISTING_PHOTO,
    UploadPurpose.GRN_PHOTO,
    UploadPurpose.QC_PHOTO,
    UploadPurpose.POD_PHOTO,
    UploadPurpose.PROFILE_PHOTO,
    UploadPurpose.ISSUE_PHOTO,
  ]),
  contentType: z.enum(ALLOWED_MIME_TYPES, {
    errorMap: () => ({
      message: `contentType must be one of: ${ALLOWED_MIME_TYPES.join(', ')}`,
    }),
  }),
  sizeBytes: z.number().int().min(1).max(26_214_400, {
    message: 'File size must not exceed 25 MiB (26214400 bytes).',
  }),
  fileName: z.string().max(200).optional(),
});
export type SignUploadBody = z.infer<typeof signUploadBody>;

export const signUploadResponse = z.object({
  uploadUrl: z.string().url(),
  fileUrl: z.string().url(),
  method: z.enum(['PUT', 'POST']),
  headers: z.record(z.string()),
  expiresAt: z.string().datetime(),
  resumable: z.boolean(),
});
export type SignUploadResponse = z.infer<typeof signUploadResponse>;
