import type { RoleCodeWithColor } from '@tohfa/design-tokens';
import { request, setAccessToken } from './client';
import { saveTokens, clearTokens } from '../storage/tokenStorage';

export interface UserRole {
  code: RoleCodeWithColor;
}

/**
 * `GET /v1/auth/me`, as the server actually answers it today (see
 * apps/api/src/modules/auth/auth.service.ts `getMe`): `id`, `fullName`,
 * `mobile`, `email`, `userType`, `preferredLocale`, `roles`, `permissions`.
 *
 * `status`, `farmerId` and `applicationId` are declared optional on purpose:
 * this app routes on them (see `resolveRouteAfterAuth`) but `/auth/me` does
 * NOT return them, so they are always `undefined` in practice. That is a
 * specification gap — the application-pending gate below can therefore never
 * fire, and a farmer whose application is still under review lands on
 * MainTabs. Fixing it needs `/v1/auth/me` (and `docs/openapi.yaml`) to carry
 * the farmer's application status; do not "fix" it by guessing a field name
 * here. Typing them as required was the trap: it told TypeScript a field
 * exists that the wire never carries.
 */
export interface UserMe {
  id: string;
  mobile?: string;
  fullName?: string;
  email?: string | null;
  userType?: string;
  preferredLocale?: string;
  status?: string;
  farmerId?: string | null;
  applicationId?: string | null;
  roles: UserRole[];
  permissions?: string[];
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
  /**
   * The server sends `requiresRoleSelection: false` as a LITERAL on every
   * successful login and OTP verify (apps/api/src/modules/auth/auth.service.ts
   * returns it in both token branches). It is declared here — even though it
   * carries no information — because omitting it made
   * `'requiresRoleSelection' in outcome` look to TypeScript like a safe
   * discriminant for the role-selection branch, when at runtime that `in`
   * test is true for a perfectly successful login too. Declaring it means the
   * `in` form no longer narrows, so the mistake is a compile error rather
   * than a crash after a real login. Branch on `isRoleSelectionRequired()`.
   */
  requiresRoleSelection?: false;
  tokenType?: string;
  expiresIn?: number;
  user: UserMe;
  /**
   * BR-39, additive/optional. Only ever present on a `POST /auth/otp/verify`
   * response when the request carried a `linkToken` — i.e. an OAuth identity
   * was just linked (to a new or existing account) as part of this OTP
   * verification. Absent on every other success response (plain OTP verify,
   * password login, OAuth login of an already-linked identity).
   */
  oauthProfile?: OAuthProfile;
}

/**
 * Whatever of these the provider actually returned (BR-39). None are
 * guaranteed — mirrors `docs/openapi.yaml`'s `OAuthProfile` schema.
 */
export interface OAuthProfile {
  fullName?: string | null;
  email?: string | null;
  photoUrl?: string | null;
}

/**
 * `POST /auth/oauth/{provider}` when the verified provider identity has no
 * linked TOHFA account yet (BR-39). No account is created and no tokens are
 * issued — the client must run the normal mobile+OTP challenge and pass
 * `linkToken` to `verifyOtp()` to complete the link.
 */
export interface OAuthNotLinked {
  status: 'NOT_LINKED';
  profile: OAuthProfile;
  linkToken: string;
}

export type OAuthProviderCode = 'GOOGLE' | 'FACEBOOK';

/** `POST /auth/oauth/{provider}`'s three possible outcomes (BR-39). */
export type OAuthLoginOutcome = LoginOutcome | OAuthNotLinked;

/**
 * The safe way to detect the NOT_LINKED outcome. Mirrors
 * `isRoleSelectionRequired`'s reasoning: check the literal discriminant
 * rather than `'status' in outcome`, since a future success response could
 * gain an unrelated `status` field.
 */
export function isOAuthNotLinked(res: OAuthLoginOutcome): res is OAuthNotLinked {
  return (res as Partial<OAuthNotLinked>).status === 'NOT_LINKED';
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

/**
 * The ONLY safe way to tell the two login outcomes apart. Never use
 * `'requiresRoleSelection' in outcome`: the success response carries that key
 * with the value `false`, so the `in` test is true for both outcomes and the
 * role-selection branch then dereferences an `availableRoles` that isn't
 * there.
 */
export function isRoleSelectionRequired(res: OAuthLoginOutcome): res is RoleSelectionRequired {
  return (res as Partial<RoleSelectionRequired>).requiresRoleSelection === true;
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

/**
 * BR-39: log in with a verified Google/Facebook token. `provider` is
 * uppercase here (matching this file's other provider-ish conventions) but
 * sent lowercase in the URL, matching `docs/openapi.yaml`'s
 * `OAuthProvider` enum (`google` | `facebook`) and
 * apps/api/src/modules/auth/auth.schema.ts's `oauthProviders`.
 *
 * `roleCode` is only for completing a role selection the server already
 * asked for (an OAuth-linked account with more than one admin role) — same
 * convention as `loginWithPassword`.
 */
export async function loginWithOAuth(
  provider: OAuthProviderCode,
  token: string,
  opts?: { deviceId?: string; platform?: 'ios' | 'android' | 'web'; roleCode?: string },
): Promise<OAuthLoginOutcome> {
  const providerPath = provider === 'GOOGLE' ? 'google' : 'facebook';
  const res = await request<OAuthLoginOutcome>(`/auth/oauth/${providerPath}`, {
    method: 'POST',
    body: { token, ...opts },
  });
  if (
    !isOAuthNotLinked(res) &&
    !isRoleSelectionRequired(res) &&
    res.accessToken &&
    res.refreshToken
  ) {
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
  /**
   * BR-39, optional. The `linkToken` returned by `loginWithOAuth()`'s
   * NOT_LINKED outcome — carries it through so the server links (or creates
   * and links) the account atomically. Omitted on a plain mobile+OTP verify.
   */
  linkToken?: string;
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
