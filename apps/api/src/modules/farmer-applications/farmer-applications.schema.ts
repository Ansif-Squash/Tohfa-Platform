import { z } from 'zod';

const mobileRegex = /^\+[1-9][0-9]{7,14}$/;
const pincodeRegex = /^[1-9][0-9]{5}$/;
const aadhaarLast4Regex = /^[0-9]{4}$/;

export const createFarmerApplicationBody = z.object({
  mobile: z.string().regex(mobileRegex, { message: 'Must be a valid E.164 mobile number (+91...)' }),
  fullName: z.string().trim().min(2).max(120),
  preferredLocale: z.enum(['en', 'ta']).default('en'),
});
export type CreateFarmerApplicationBody = z.infer<typeof createFarmerApplicationBody>;

export const farmerApplicationIdParams = z.object({
  id: z.string().uuid(),
});
export type FarmerApplicationIdParams = z.infer<typeof farmerApplicationIdParams>;

export const updateStepParams = z.object({
  id: z.string().uuid(),
  step: z.coerce.number().int().min(1).max(5),
});
export type UpdateStepParams = z.infer<typeof updateStepParams>;

export const step1PersonalSchema = z.object({
  fullName: z.string().min(2).max(120).optional(),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'UNDISCLOSED']).optional(),
  aadhaarLast4: z.string().regex(aadhaarLast4Regex).optional(),
  aadhaarToken: z.string().optional(),
  farmingExperienceYears: z.number().int().min(0).max(120).optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  village: z.string().optional(),
  taluk: z.string().optional(),
  district: z.string().optional(),
  pincode: z.string().regex(pincodeRegex).optional(),
  preferredLocale: z.enum(['en', 'ta']).optional(),
});
export type Step1Personal = z.infer<typeof step1PersonalSchema>;

export const farmItemSchema = z.object({
  name: z.string().min(1),
  totalAreaAcres: z.number().positive(),
  organicSince: z.string().optional(),
  waterSource: z.string().optional(),
  primaryCrops: z.array(z.string()).optional(),
});
export type FarmItem = z.infer<typeof farmItemSchema>;

export const step2FarmDetailsSchema = z.object({
  farms: z.array(farmItemSchema).min(1),
});
export type Step2FarmDetails = z.infer<typeof step2FarmDetailsSchema>;

export const step3LocationSchema = z.object({
  gpsCaptured: z.boolean().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  fmbPolygon: z
    .object({
      type: z.literal('Polygon'),
      coordinates: z.array(z.array(z.array(z.number()))),
    })
    .optional(),
  village: z.string().optional(),
  taluk: z.string().optional(),
  district: z.string().optional(),
});
export type Step3Location = z.infer<typeof step3LocationSchema>;

export const documentItemSchema = z.object({
  docType: z.enum(['ID_PROOF', 'FARM_DOC', 'CERTIFICATE', 'OTHER']),
  fileUrl: z.string().url(),
  fileName: z.string().optional(),
});
export type DocumentItem = z.infer<typeof documentItemSchema>;

export const step4DocumentsSchema = z.object({
  documents: z.array(documentItemSchema).min(1),
});
export type Step4Documents = z.infer<typeof step4DocumentsSchema>;

export const step5ReviewSchema = z.object({
  confirmed: z.boolean().optional(),
  notes: z.string().optional(),
});
export type Step5Review = z.infer<typeof step5ReviewSchema>;

export const updateFarmerProfileBody = z
  .object({
    fullName: z.string().min(2).max(120).optional(),
    farmingExperienceYears: z.number().int().min(0).max(120).optional(),
    address: z.string().optional(),
    preferredLocale: z.enum(['en', 'ta']).optional(),
    // BR-33: Aadhaar and mobile are locked fields.
    mobile: z.any().optional(),
    aadhaar: z.any().optional(),
    aadhaarNumber: z.any().optional(),
  });
export type UpdateFarmerProfileBody = z.infer<typeof updateFarmerProfileBody>;

export const listAdminApplicationsQuery = z.object({
  status: z.enum(['SUBMITTED', 'DOCS_REVIEW', 'FARM_VERIFICATION', 'AUDIT', 'APPROVED', 'REJECTED']).optional(),
  zoneId: z.string().uuid().optional(),
  submittedAfter: z.string().datetime().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListAdminApplicationsQuery = z.infer<typeof listAdminApplicationsQuery>;

export const approveApplicationBody = z.object({
  zoneId: z.string().uuid().optional(),
  note: z.string().max(500).optional(),
});
export type ApproveApplicationBody = z.infer<typeof approveApplicationBody>;

export const rejectApplicationBody = z.object({
  reasonCode: z.enum(['DOCUMENTS_INVALID', 'LAND_NOT_VERIFIED', 'DUPLICATE_APPLICANT', 'OUTSIDE_SERVICE_AREA', 'OTHER']),
  reason: z.string().trim().min(5).max(500),
});
export type RejectApplicationBody = z.infer<typeof rejectApplicationBody>;

export const requestInfoApplicationBody = z.object({
  message: z.string().trim().min(5).max(1000),
  requiredSteps: z.array(z.number().int().min(1).max(5)).optional(),
});
export type RequestInfoApplicationBody = z.infer<typeof requestInfoApplicationBody>;

