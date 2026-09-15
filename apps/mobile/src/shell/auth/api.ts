/**
 * Typed wrappers over the shared client for the `/v1/auth/*` endpoints.
 *
 * Wiring only — no business logic, no state, no error translation. Deciding
 * what a response *means* (role selection, adopting a session, what to do with
 * an OTP that verified against no account) belongs in ./session.ts; this file
 * exists so that exactly one place knows the paths and the response types.
 *
 * Paths are relative: ../api/client.ts prefixes `/v1`.
 */
import type {
  CurrentUserProfile,
  LoginRequest,
  LoginResponse,
  SendOtpRequest,
  SendOtpResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
} from '@tohfa/shared-types';
import { api } from '../api/client';

/**
 * `LoginResponse` is a union: a multi-role account that sent no `roleCode` gets
 * the role-selection shape back instead of tokens.
 */
export function login(body: LoginRequest): Promise<LoginResponse> {
  return api.post<LoginResponse>('/auth/login', body);
}

export function sendOtp(body: SendOtpRequest): Promise<SendOtpResponse> {
  return api.post<SendOtpResponse>('/auth/otp/send', body);
}

/**
 * Returns `VerifyOtpResponse`, which is a union of two shapes but NOT the same
 * union as `login`'s:
 *
 *  - It cannot return the role-selection shape. `verifyOtp` in
 *    apps/api/src/modules/auth/auth.service.ts writes
 *    `requiresRoleSelection: false` as a literal and has no branch that asks
 *    for a role, so role selection is reachable only through password login.
 *  - It CAN return `OtpVerifiedWithoutAccount` — a `{ verified: true }` payload
 *    with no tokens, when the code verifies for a mobile number that has no
 *    user row yet (the registration path).
 */
export function verifyOtp(body: VerifyOtpRequest): Promise<VerifyOtpResponse> {
  return api.post<VerifyOtpResponse>('/auth/otp/verify', body);
}

export function fetchCurrentUser(): Promise<CurrentUserProfile> {
  return api.get<CurrentUserProfile>('/auth/me');
}

export function logout(): Promise<void> {
  return api.post<void>('/auth/logout', {});
}
