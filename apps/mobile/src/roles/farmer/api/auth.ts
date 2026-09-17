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

/**
 * Role families this single app knows how to route to. FARMER/FARMER_ADMIN
 * both land in the farmer MainTabs (an elected farmer-admin still farms);
 * CUSTOMER lands in the customer screens. Anything else (warehouse/super/
 * tohfa admin roles) has no screens in this app yet.
 */
export type ResolvedAppRole = 'FARMER' | 'CUSTOMER' | 'UNSUPPORTED';

export function resolveAppRole(roles: UserRole[]): ResolvedAppRole {
  if (roles.some((r) => r.code === 'FARMER' || r.code === 'FARMER_ADMIN')) {
    return 'FARMER';
  }
  if (roles.some((r) => r.code === 'CUSTOMER')) {
    return 'CUSTOMER';
  }
  return 'UNSUPPORTED';
}

export interface OtpResponse {
  challengeId: string;
  status: string;
  resendAvailableAt: string;
  otpExpiresAt: string;
  attemptsRemaining: number;
  _mockCode?: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  user: UserMe;
}

/**
 * The real server response shape when a login request omits `roleCode` and
 * the account holds more than one role (mirrors
 * apps/api/src/modules/auth/auth.service.ts's `requiresRoleSelection` branch:
 * `roleAssignments.length > 1 && input.roleCode === undefined`). No tokens
 * are issued yet in this case.
 */
export interface RoleSelectionRequired {
  requiresRoleSelection: true;
  availableRoles: UserRole[];
}

export type LoginOutcome = TokenResponse | RoleSelectionRequired;

function isRoleSelectionRequired(res: LoginOutcome): res is RoleSelectionRequired {
  return 'requiresRoleSelection' in res && res.requiresRoleSelection === true;
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
  name: 'ApplicationStatus' | 'MainTabs' | 'CustomerMain' | 'Unsupported';
  params?: { applicationId: string };
} {
  const role = resolveAppRole(me.roles);
  if (role === 'CUSTOMER') {
    return { name: 'CustomerMain' };
  }
  if (role === 'UNSUPPORTED') {
    return { name: 'Unsupported' };
  }
  // FARMER: same application-pending gate as before.
  const isApproved = me.status === 'ACTIVE' || me.status === 'APPROVED';
  if (!isApproved && me.applicationId) {
    return {
      name: 'ApplicationStatus',
      params: { applicationId: me.applicationId },
    };
  }
  return { name: 'MainTabs' };
}

/**
 * This is now the ONE shared login for every role in this single app --
 * `roleCode` is deliberately omitted (not hardcoded to 'FARMER' any more) so
 * the server decides based on the account's real role assignments, exactly
 * like apps/admin-web's login already does for its 5 roles. Pass `roleCode`
 * only when completing a role selection the server already asked for.
 */
export async function loginWithPassword(body: {
  mobile: string;
  password?: string;
  roleCode?: string;
}): Promise<LoginOutcome> {
  const res = await request<LoginOutcome>('/auth/login', {
    method: 'POST',
    body,
  });
  if (!isRoleSelectionRequired(res) && res.accessToken && res.refreshToken) {
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
  challengeId: string;
  code: string;
}): Promise<LoginOutcome> {
  const res = await request<LoginOutcome>('/auth/otp/verify', {
    method: 'POST',
    body,
  });
  if (!isRoleSelectionRequired(res) && res.accessToken && res.refreshToken) {
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
  challengeId: string;
  code: string;
  newPassword: string;
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
