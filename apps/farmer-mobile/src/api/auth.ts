import type { RoleCodeWithColor } from '@tohfa/design-tokens';
import { request, setAccessToken } from './client';
import { saveTokens, clearTokens } from '../storage/tokenStorage';

export interface UserRole {
  code: RoleCodeWithColor;
}

export interface UserMe {
  userId: string;
  mobile?: string;
  fullName?: string;
  status: string;
  farmerId?: string | null;
  applicationId?: string | null;
  roles: UserRole[];
}

export interface OtpResponse {
  status: string;
  resendAvailableAt: string;
  otpExpiresAt: string;
  attemptsRemaining: number;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  user: UserMe;
}

export interface ApplicationStatusResponse {
  id: string;
  status: 'SUBMITTED' | 'DOCS_REVIEW' | 'FARM_VERIFICATION' | 'AUDIT' | 'APPROVED' | 'REJECTED';
  step: number;
  submittedAt: string;
  notes?: string;
  reviewerName?: string;
}

export interface RenderOtpStateInput {
  resendAvailableAt?: string | null | undefined;
  attemptsRemaining?: number | null | undefined;
  now?: number | undefined;
}

export interface RenderOtpStateResult {
  canResend: boolean;
  secondsUntilResend: number;
  attemptsRemaining: number;
  isLocked: boolean;
}

export function renderOtpState(input: RenderOtpStateInput): RenderOtpStateResult {
  const now = input.now ?? Date.now();
  const attemptsRemaining = input.attemptsRemaining ?? 3;
  const isLocked = attemptsRemaining <= 0;

  let secondsUntilResend = 0;
  if (input.resendAvailableAt) {
    const targetMs = new Date(input.resendAvailableAt).getTime();
    const diffMs = targetMs - now;
    if (diffMs > 0) {
      secondsUntilResend = Math.ceil(diffMs / 1000);
    }
  }

  // If locked, we must allow the farmer to request a new challenge
  const canResend = isLocked || secondsUntilResend === 0;

  return {
    canResend,
    secondsUntilResend,
    attemptsRemaining,
    isLocked,
  };
}

export function resolveRouteAfterAuth(me: UserMe): {
  name: 'ApplicationStatus' | 'MainTabs';
  params?: { applicationId: string };
} {
  const isApproved = me.status === 'ACTIVE' || me.status === 'APPROVED';
  if (!isApproved && me.applicationId) {
    return {
      name: 'ApplicationStatus',
      params: { applicationId: me.applicationId },
    };
  }
  return { name: 'MainTabs' };
}

export async function loginWithPassword(body: {
  mobile: string;
  password?: string;
}): Promise<TokenResponse> {
  const res = await request<TokenResponse>('/auth/login', {
    method: 'POST',
    body: {
      ...body,
      roleCode: 'FARMER',
    },
  });
  if (res.accessToken && res.refreshToken) {
    setAccessToken(res.accessToken);
    await saveTokens(res.accessToken, res.refreshToken);
  }
  return res;
}

export async function requestOtp(body: {
  mobile: string;
  purpose: 'LOGIN' | 'REGISTER' | 'PASSWORD_RESET';
}): Promise<OtpResponse> {
  return await request<OtpResponse>('/auth/otp/send', {
    method: 'POST',
    body,
  });
}

export async function verifyOtp(body: {
  mobile: string;
  code: string;
  purpose?: string;
}): Promise<TokenResponse> {
  const res = await request<TokenResponse>('/auth/otp/verify', {
    method: 'POST',
    body: {
      ...body,
      purpose: body.purpose ?? 'LOGIN',
      roleCode: 'FARMER',
    },
  });
  if (res.accessToken && res.refreshToken) {
    setAccessToken(res.accessToken);
    await saveTokens(res.accessToken, res.refreshToken);
  }
  return res;
}

export async function forgotPassword(body: { mobile: string }): Promise<{ message: string }> {
  return await request<{ message: string }>('/auth/forgot-password', {
    method: 'POST',
    body,
  });
}

export async function resetPassword(body: {
  token: string;
  password: string;
}): Promise<{ message: string }> {
  return await request<{ message: string }>('/auth/reset-password', {
    method: 'POST',
    body,
  });
}

export async function fetchMe(): Promise<UserMe> {
  return await request<UserMe>('/auth/me');
}

export async function fetchApplicationStatus(
  applicationId: string,
): Promise<ApplicationStatusResponse> {
  return await request<ApplicationStatusResponse>(`/farmers/applications/${applicationId}/status`);
}

export async function logout(): Promise<void> {
  setAccessToken(null);
  await clearTokens();
}
