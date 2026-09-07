import { request, setAccessToken } from './client';
import { saveTokens, clearTokens } from '../storage/tokenStorage';

export interface CustomerUser {
  id: string;
  mobile: string;
  fullName: string;
  status: string;
  roles: Array<{ code: string }>;
  preferredLocale?: string;
  email?: string | null;
}

export interface RegisterCustomerInput {
  mobile: string;
  fullName: string;
  password: string;
  email?: string;
  preferredLocale?: 'en' | 'ta';
  preferredWarehouseId?: string;
}

export interface RegistrationAcceptedResponse {
  userId: string;
  status: 'PENDING_OTP';
  otpExpiresAt: string;
  resendAvailableAt: string;
  challengeId?: string;
  attemptsRemaining?: number;
  _mockCode?: string;
}

export interface SendOtpInput {
  mobile: string;
  purpose: 'REGISTRATION' | 'LOGIN' | 'PASSWORD_RESET';
}

export interface OtpChallengeResponse {
  challengeId: string;
  expiresAt: string;
  resendAvailableAt: string;
  attemptsRemaining: number;
  _mockCode?: string;
}

export interface VerifyOtpInput {
  challengeId: string;
  code: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: CustomerUser;
}

export interface LoginInput {
  mobile: string;
  password: string;
}

export interface ForgotPasswordInput {
  mobile: string;
}

export interface ResetPasswordInput {
  challengeId: string;
  code: string;
  newPassword: string;
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

/**
 * Enforce BR-32: 6-digit OTP, 60s cooldown timer, and 3-attempt lockout.
 * All values are computed strictly from server-provided `resendAvailableAt`
 * and `attemptsRemaining`, never from a client-local counter.
 */
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

  const canResend = isLocked || secondsUntilResend === 0;

  return {
    canResend,
    secondsUntilResend,
    attemptsRemaining,
    isLocked,
  };
}

export async function registerCustomer(input: RegisterCustomerInput): Promise<RegistrationAcceptedResponse> {
  const cleanMobile = input.mobile.startsWith('+') ? input.mobile.trim() : `+91${input.mobile.trim()}`;
  return request<RegistrationAcceptedResponse>('/auth/register/customer', {
    method: 'POST',
    body: {
      ...input,
      mobile: cleanMobile,
      preferredLocale: input.preferredLocale ?? 'en',
    },
  });
}

export async function sendOtp(input: SendOtpInput): Promise<OtpChallengeResponse> {
  const cleanMobile = input.mobile.startsWith('+') ? input.mobile.trim() : `+91${input.mobile.trim()}`;
  return request<OtpChallengeResponse>('/auth/otp/send', {
    method: 'POST',
    body: {
      mobile: cleanMobile,
      purpose: input.purpose,
    },
  });
}

export async function verifyOtp(input: VerifyOtpInput): Promise<AuthResponse> {
  const res = await request<AuthResponse>('/auth/otp/verify', {
    method: 'POST',
    body: {
      challengeId: input.challengeId,
      code: input.code.trim(),
    },
  });

  if (res.accessToken && res.refreshToken) {
    await saveTokens(res.accessToken, res.refreshToken);
    setAccessToken(res.accessToken);
  }

  return res;
}

export async function loginWithPassword(input: LoginInput): Promise<AuthResponse> {
  const cleanMobile = input.mobile.startsWith('+') ? input.mobile.trim() : `+91${input.mobile.trim()}`;
  const res = await request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: {
      mobile: cleanMobile,
      password: input.password,
    },
  });

  if (res.accessToken && res.refreshToken) {
    await saveTokens(res.accessToken, res.refreshToken);
    setAccessToken(res.accessToken);
  }

  return res;
}

export async function forgotPassword(input: ForgotPasswordInput): Promise<OtpChallengeResponse> {
  const cleanMobile = input.mobile.startsWith('+') ? input.mobile.trim() : `+91${input.mobile.trim()}`;
  return request<OtpChallengeResponse>('/auth/forgot-password', {
    method: 'POST',
    body: { mobile: cleanMobile },
  });
}

export async function resetPassword(input: ResetPasswordInput): Promise<void> {
  await request<void>('/auth/reset-password', {
    method: 'POST',
    body: {
      challengeId: input.challengeId,
      code: input.code.trim(),
      newPassword: input.newPassword,
    },
  });
}

export async function fetchMe(): Promise<CustomerUser> {
  return request<CustomerUser>('/auth/me');
}

export async function logout(): Promise<void> {
  try {
    await request<void>('/auth/logout', { method: 'POST' });
  } catch {
    // Ignore network error on logout
  } finally {
    await clearTokens();
    setAccessToken(null);
  }
}
