import { z } from 'zod';

export const CertificationType = {
  PGS: 'PGS',
  NPOP: 'NPOP',
} as const;
export type CertificationType = (typeof CertificationType)[keyof typeof CertificationType];

export const VerificationStatus = {
  UNVERIFIED: 'UNVERIFIED',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
} as const;
export type VerificationStatus = (typeof VerificationStatus)[keyof typeof VerificationStatus];

export const certificationIdParam = z.object({
  id: z.string().uuid(),
});
export type CertificationIdParam = z.infer<typeof certificationIdParam>;

export const certificationCreateSchema = z
  .object({
    certType: z.enum(['PGS', 'NPOP']),
    certNumber: z.string().trim().min(1).max(80),
    issuingBody: z.string().trim().min(1).max(160),
    issuedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Must be a valid date YYYY-MM-DD' }),
    expiresOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Must be a valid date YYYY-MM-DD' }),
    documentUrl: z.string().url().optional(),
  })
  .refine((data) => data.expiresOn > data.issuedOn, {
    message: 'expiresOn must be after issuedOn',
    path: ['expiresOn'],
  });
export type CertificationCreate = z.infer<typeof certificationCreateSchema>;

export const verifyCertificationBody = z.object({
  portalReference: z.string().max(120).optional(),
  note: z.string().max(500).optional(),
});
export type VerifyCertificationBody = z.infer<typeof verifyCertificationBody>;

export const unverifyCertificationBody = z.object({
  reason: z.string().trim().min(5).max(500),
});
export type UnverifyCertificationBody = z.infer<typeof unverifyCertificationBody>;

export const listCertificationsQuery = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListCertificationsQuery = z.infer<typeof listCertificationsQuery>;
