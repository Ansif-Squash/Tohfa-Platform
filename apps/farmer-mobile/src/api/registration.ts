/**
 * Typed API client methods for Farmer Registration (S-43).
 */
import { request } from './client';

export interface CreateFarmerApplicationPayload {
  mobile: string;
  fullName: string;
  preferredLocale?: 'en' | 'ta';
}

export interface FarmerApplicationResponse {
  id: string;
  farmerId?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'DOCS_REVIEW' | 'FARM_VERIFICATION' | 'AUDIT' | 'APPROVED' | 'REJECTED';
  step: number;
  submittedAt?: string;
  createdAt: string;
}

export interface SignUploadPayload {
  purpose: 'FARMER_DOCUMENT' | 'CERTIFICATE';
  filename: string;
  contentType: string;
}

export interface SignUploadResponse {
  uploadUrl: string;
  fileUrl: string;
  resumable?: boolean;
}

export async function createFarmerApplication(
  body: CreateFarmerApplicationPayload,
): Promise<FarmerApplicationResponse> {
  return await request<FarmerApplicationResponse>('/farmers/applications', {
    method: 'POST',
    body,
  });
}

export async function saveFarmerApplicationStep(
  applicationId: string,
  step: number,
  payload: unknown,
): Promise<FarmerApplicationResponse> {
  return await request<FarmerApplicationResponse>(
    `/farmers/applications/${applicationId}/steps/${step}`,
    {
      method: 'PATCH',
      body: payload,
    },
  );
}

export async function submitFarmerApplication(
  applicationId: string,
  idempotencyKey: string,
): Promise<FarmerApplicationResponse> {
  return await request<FarmerApplicationResponse>(
    `/farmers/applications/${applicationId}/submit`,
    {
      method: 'POST',
      idempotencyKey,
    },
  );
}

export async function signUpload(
  body: SignUploadPayload,
): Promise<SignUploadResponse> {
  return await request<SignUploadResponse>('/uploads/sign', {
    method: 'POST',
    body,
  });
}
