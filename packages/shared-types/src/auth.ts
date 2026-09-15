/**
 * Authentication contracts.
 *
 * These mirror the API's auth module (apps/api/src/modules/auth/) and are the
 * canonical client-side shape of every `/v1/auth/*` request and response. Each
 * type here was written by reading auth.service.ts and auth.schema.ts, not by
 * inferring from a screen's usage — where a screen's local interface disagrees
 * with this file, this file is right and the screen is stale.
 *
 * Pattern note: the `as const` object plus derived union type below follows
 * enums.ts. Optional properties are written `?: T | undefined` because every
 * consumer of this package compiles under `exactOptionalPropertyTypes: true`,
 * where a bare `?: T` forbids explicitly passing `undefined`.
 */
import type { RoleCode } from './enums.js';

/** Client platform reported at login, used for session/device bookkeeping. */
export const AuthPlatform = {
  IOS: 'ios',
  ANDROID: 'android',
  WEB: 'web',
} as const;
export type AuthPlatform = (typeof AuthPlatform)[keyof typeof AuthPlatform];

/**
 * Why an OTP challenge was issued. The API declares this list in
 * apps/api/src/modules/auth/auth.schema.ts; this is the client-side mirror and
 * must stay in step with it. BR-32 governs the challenge itself (6-digit code,
 * 60-second resend cooldown, 3-attempt lockout).
 */
export const OtpPurpose = {
  REGISTRATION: 'REGISTRATION',
  LOGIN: 'LOGIN',
  PASSWORD_RESET: 'PASSWORD_RESET',
  MOBILE_CHANGE: 'MOBILE_CHANGE',
  DELIVERY: 'DELIVERY',
  PICKUP: 'PICKUP',
} as const;
export type OtpPurpose = (typeof OtpPurpose)[keyof typeof OtpPurpose];

/** `POST /auth/login` request body. */
export interface LoginRequest {
  mobile: string;
  password: string;
  deviceId?: string | undefined;
  platform?: AuthPlatform | undefined;
  /**
   * The server's Zod schema accepts `roleCode` as a plain `string`, but the
   * only values that mean anything are role codes — narrowed deliberately so a
   * typo is a compile error rather than a silent role-selection re-prompt.
   */
  roleCode?: RoleCode | undefined;
}

/** One role the user holds, as returned by the login endpoints. */
export interface RoleAssignment {
  code: RoleCode;
  warehouseId?: string | undefined;
  zoneId?: string | undefined;
}

/**
 * The signed-in user as returned by a successful login.
 *
 * The identifier field is `id`, NOT `userId`: apps/mobile/src/roles/farmer/api/
 * auth.ts declares a local `UserMe` interface using `userId`, which does not
 * match what the server sends. This is the corrected canonical shape.
 */
export interface AuthenticatedUser {
  id: string;
  fullName: string;
  userType: string;
  roles: RoleAssignment[];
  preferredLocale: string;
}

/** Login succeeded and tokens were issued. */
export interface LoginSuccess {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  requiresRoleSelection: false;
  user: AuthenticatedUser;
}

/**
 * The user holds more than one role and did not say which one they want, so no
 * tokens were issued. Resolved by calling `POST /auth/login` a second time with
 * `roleCode` set — there is no separate confirm-role endpoint.
 */
export interface RoleSelectionRequired {
  requiresRoleSelection: true;
  availableRoles: RoleAssignment[];
}

/**
 * `POST /auth/login` response — discriminated on `requiresRoleSelection`.
 *
 * Only the password login path can produce `RoleSelectionRequired`;
 * `POST /auth/otp/verify` hard-codes `requiresRoleSelection: false` and so can
 * only ever return `LoginSuccess` (see `VerifyOtpResponse`).
 */
export type LoginResponse = LoginSuccess | RoleSelectionRequired;

/** `POST /auth/otp/send` request body. */
export interface SendOtpRequest {
  mobile: string;
  purpose: OtpPurpose;
}

/** `POST /auth/otp/send` response. */
export interface SendOtpResponse {
  challengeId: string;
  expiresAt: string;
  resendAvailableAt: string;
  attemptsRemaining: number;
  /**
   * Present ONLY when the API runs in test mode or with the mock SMS provider.
   * Never branch production behaviour on it — in a real deployment it is absent.
   */
  _mockCode?: string | undefined;
}

/** `POST /auth/otp/verify` request body. */
export interface VerifyOtpRequest {
  challengeId: string;
  code: string;
}

/**
 * The OTP verified, but no user row exists for that mobile number yet, so no
 * tokens were issued. This is the registration path: the code proves the phone
 * number, and account creation happens afterwards.
 */
export interface OtpVerifiedWithoutAccount {
  verified: true;
  mobile: string;
  purpose: OtpPurpose;
}

/**
 * `POST /auth/otp/verify` response.
 *
 * `LoginSuccess` has no `verified` field, so `'verified' in response` is the
 * discriminant (equivalently, a present `requiresRoleSelection`). Note this
 * union has no role-selection member: verifyOtp writes
 * `requiresRoleSelection: false` literally and has no branch that asks for a
 * role, so role selection is reachable only through password login.
 */
export type VerifyOtpResponse = LoginSuccess | OtpVerifiedWithoutAccount;

/**
 * A role assignment as returned by `GET /auth/me`. Richer than login's
 * `RoleAssignment` on purpose: /auth/me resolves the warehouse and zone names
 * for display, which the login endpoints do not.
 */
export interface CurrentUserRoleAssignment extends RoleAssignment {
  warehouseName?: string | undefined;
  zoneName?: string | undefined;
}

/** `GET /auth/me` response. */
export interface CurrentUserProfile {
  id: string;
  mobile: string;
  fullName: string;
  email?: string | undefined;
  userType: string;
  preferredLocale: string;
  roles: CurrentUserRoleAssignment[];
  permissions: string[];
}
