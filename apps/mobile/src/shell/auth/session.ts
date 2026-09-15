/**
 * Shell session state.
 *
 * Pure TypeScript — no React, no JSX. Module-scoped state plus a
 * subscribe/notify observable, mirroring how ../api/client.ts already keeps its
 * access token and auth-failure callback at module scope. Keeping React out
 * means every decision in here is unit-testable in vitest's node environment
 * (apps/mobile has no vitest config, so there is no DOM), and RootShell.tsx
 * reduces to "subscribe, then render the current status".
 *
 * This module is the ONE place that configures the shared API client's token
 * storage and 401 handler. Doing it here rather than in each role's App.tsx is
 * what makes "one store, one 401 path" true — see `initializeSession()`.
 */
import type {
  AuthenticatedUser,
  LoginResponse,
  LoginSuccess,
  RoleAssignment,
  VerifyOtpRequest,
  VerifyOtpResponse,
} from '@tohfa/shared-types';
import { RoleCode } from '@tohfa/shared-types';
import { configureTokenStorage, setAccessToken, setOnAuthFailure } from '../api/client';
import { tokenStorage } from '../storage/tokenStorage';
import { login, logout, verifyOtp } from './api';

/* ------------------------------------------------------------------ *
 * Pure predicates
 * ------------------------------------------------------------------ */

/**
 * Whether the server will ask this login to pick a role.
 *
 * SAFETY-CRITICAL: this is a VERBATIM mirror of the condition in
 * apps/api/src/modules/auth/auth.service.ts:
 *
 *     if (roleAssignments.length > 1 && input.roleCode === undefined)
 *
 * Change it only in lockstep with that line. It is written `> 1` and
 * `=== undefined` deliberately — not `>= 1`, and not a truthiness test on
 * `roleCode`. A `!roleCode` form would classify an empty-string roleCode as
 * "not requested" and diverge from the server, which is why
 * ./session.test.ts pins the empty-string case.
 */
export function requiresRoleSelection(
  availableRoles: readonly RoleAssignment[],
  roleCode: RoleCode | undefined,
): boolean {
  return availableRoles.length > 1 && roleCode === undefined;
}

/**
 * Roles the admin console offers in its role picker.
 *
 * Listed explicitly rather than computed by excluding FARMER and CUSTOMER: a
 * role code added to enums.ts later must not become admin-selectable merely by
 * existing. ./session.test.ts carries a drift test so the addition fails loudly
 * instead of silently.
 *
 * FARMER_ADMIN IS an admin console role despite the name — it is the staff role
 * that administers farmers, not a role held by a farmer.
 */
export const ADMIN_SELECTABLE_ROLE_CODES: readonly RoleCode[] = [
  RoleCode.SUPER_ADMIN,
  RoleCode.TOHFA_ADMIN,
  RoleCode.FARMER_ADMIN,
  RoleCode.MAIN_WH_ADMIN,
  RoleCode.SUB_WH_ADMIN,
];

/**
 * Narrow a set of role assignments to the ones the admin picker should show.
 *
 * This is a UX convenience only, NOT a security boundary — real authorization
 * is enforced server-side on every request (root CLAUDE.md §2.1). Filtering a
 * code out of this list does not deny anything.
 */
export function filterAdminSelectableRoles(roles: readonly RoleAssignment[]): RoleAssignment[] {
  return roles.filter((assignment) => ADMIN_SELECTABLE_ROLE_CODES.includes(assignment.code));
}

/**
 * Tell the two `POST /auth/otp/verify` response shapes apart.
 *
 * `OtpVerifiedWithoutAccount` is the only member carrying `verified`;
 * `LoginSuccess` is the only one carrying tokens. Both halves are checked so
 * that a malformed payload matching neither shape is treated as "not a
 * session" rather than adopted as one.
 */
export function isLoginSuccess(response: VerifyOtpResponse): response is LoginSuccess {
  return !('verified' in response) && typeof (response as LoginSuccess).accessToken === 'string';
}

/**
 * Thrown when an OTP verified against a mobile number that has no account yet.
 *
 * A named class rather than a bare Error so the UI can map this to its own
 * message without inspecting `error.message` — root CLAUDE.md §2.7 forbids
 * user-facing English in components, and a raw exception string is exactly
 * that, smuggled in through an error path.
 */
export class NoAccountForOtpError extends Error {
  constructor() {
    super('The code was verified but no account exists for that number.');
    this.name = 'NoAccountForOtpError';
  }
}

/* ------------------------------------------------------------------ *
 * State
 * ------------------------------------------------------------------ */

export type SessionState =
  | { readonly status: 'initializing' }
  | { readonly status: 'anonymous' }
  | { readonly status: 'roleSelectionRequired'; readonly availableRoles: readonly RoleAssignment[] }
  | {
      readonly status: 'authenticated';
      readonly user: AuthenticatedUser;
      readonly activeRoleCode: RoleCode;
    };

let state: SessionState = { status: 'initializing' };
const listeners = new Set<() => void>();

/**
 * The credentials behind an in-flight role selection.
 *
 * TRADEOFF, stated plainly: this holds a password in memory for the few seconds
 * between "the server asked which role" and "the user tapped one". It is
 * required because the API has no separate confirm-role endpoint — role
 * selection is literally a second `POST /auth/login` with `roleCode` set, so
 * the password must be re-sent. apps/admin-web already works this way, holding
 * mobile and password in plain component fields across both login calls, so
 * this matches the shipped pattern rather than introducing a new exposure.
 * It is cleared the moment it is consumed, on sign-out, and on a failed login.
 */
let pendingPasswordLogin: { mobile: string; password: string } | null = null;

let initialized = false;

function setState(next: SessionState): void {
  state = next;
  for (const listener of listeners) {
    listener();
  }
}

export function getSessionState(): SessionState {
  return state;
}

export function subscribeToSession(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Wire the shared API client to the shell token store, once.
 *
 * Idempotent: the guard matters because a re-render or a second mounted root
 * must not repoint the client at a fresh store and silently drop the token the
 * running session is using — the bug this replaces, where each role's App.tsx
 * called `configureTokenStorage` with its own role-local store on mount.
 *
 * The auth-failure callback deliberately knows nothing about navigation. It
 * clears the session, and RootShell re-renders to the login screen because the
 * status changed — not because anything told it to navigate.
 *
 * Because ../storage/tokenStorage.ts is in-memory only, there is nothing to
 * rehydrate and a cold start is always anonymous. This function exists anyway
 * so that swapping in Keychain/Keystore later needs no call-site change: the
 * rehydrate would happen here.
 */
export function initializeSession(): void {
  if (initialized) {
    return;
  }
  initialized = true;

  configureTokenStorage(tokenStorage);
  setOnAuthFailure(() => {
    void tokenStorage.clearTokens();
    pendingPasswordLogin = null;
    setState({ status: 'anonymous' });
  });

  setState({ status: 'anonymous' });
}

/* ------------------------------------------------------------------ *
 * Session transitions
 * ------------------------------------------------------------------ */

/**
 * Which role this session is acting as.
 *
 * An explicitly requested role wins. Otherwise the first assignment is used,
 * which covers "exactly one role" and "several, none requested" with the same
 * expression. Returns `undefined` for an empty roles array — indexing is guarded
 * rather than asserted, because `noUncheckedIndexedAccess` is on for a reason
 * and a non-null assertion here would leak `undefined` into the theme lookup.
 */
function resolveActiveRoleCode(
  roles: readonly RoleAssignment[],
  requestedRoleCode: RoleCode | undefined,
): RoleCode | undefined {
  if (requestedRoleCode !== undefined) {
    return requestedRoleCode;
  }
  return roles[0]?.code;
}

/**
 * Take a token-bearing login response and become authenticated.
 *
 * EMPTY ROLES: a real server edge case (the login path returns whatever
 * `effectiveRoles` resolved to). This fails CLOSED — tokens are discarded and
 * the session returns to anonymous — rather than fabricating a default role.
 * Inventing an authorization fact on the client is precisely what root
 * CLAUDE.md §2.1 forbids, and a session with a guessed role would theme and
 * route as something the server never granted. The thrown error surfaces as the
 * generic request-failure message; it is not a crash.
 */
async function adoptSession(
  response: LoginSuccess,
  requestedRoleCode: RoleCode | undefined,
): Promise<void> {
  const activeRoleCode = resolveActiveRoleCode(response.user.roles, requestedRoleCode);

  if (activeRoleCode === undefined) {
    setAccessToken(null);
    await tokenStorage.clearTokens();
    pendingPasswordLogin = null;
    setState({ status: 'anonymous' });
    throw new Error('Login succeeded but the account carries no role assignment.');
  }

  setAccessToken(response.accessToken);
  await tokenStorage.setTokens({
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
  });
  pendingPasswordLogin = null;

  setState({ status: 'authenticated', user: response.user, activeRoleCode });
}

export async function signInWithPassword(input: {
  mobile: string;
  password: string;
  roleCode: RoleCode | undefined;
}): Promise<void> {
  // Retained before the call so `selectRole` can re-send them; cleared below on
  // every exit path except "the server asked which role".
  pendingPasswordLogin = { mobile: input.mobile, password: input.password };

  let response: LoginResponse;
  try {
    response = await login({
      mobile: input.mobile,
      password: input.password,
      roleCode: input.roleCode,
    });
  } catch (error) {
    pendingPasswordLogin = null;
    throw error;
  }

  if (response.requiresRoleSelection) {
    /**
     * Consistency guard. We sent a `roleCode`, so by the server's own condition
     * role selection was unreachable — yet here it is. That is a contract
     * violation between client and server, and the wrong response to it is to
     * render a role picker: this code also runs inside the farmer and customer
     * binaries, where a picker must be structurally impossible (see
     * ../config/flavor.ts). Failing loudly keeps that guarantee honest.
     */
    if (!requiresRoleSelection(response.availableRoles, input.roleCode)) {
      pendingPasswordLogin = null;
      throw new Error(
        'Server asked for role selection despite a pinned roleCode — auth contract violation.',
      );
    }

    setState({ status: 'roleSelectionRequired', availableRoles: response.availableRoles });
    return;
  }

  await adoptSession(response, input.roleCode);
}

/**
 * Complete a role selection.
 *
 * There is no confirm-role endpoint: this is a second `POST /auth/login` with
 * the retained credentials plus the chosen role.
 */
export async function selectRole(roleCode: RoleCode): Promise<void> {
  if (state.status !== 'roleSelectionRequired') {
    throw new Error('selectRole is only valid while a role selection is pending.');
  }

  const pending = pendingPasswordLogin;
  if (pending === null) {
    // Credentials were dropped (sign-out, an auth failure, a reload). There is
    // nothing to re-send, so the only honest move is back to the login screen.
    setState({ status: 'anonymous' });
    throw new Error('Role selection expired. Please sign in again.');
  }

  await signInWithPassword({ mobile: pending.mobile, password: pending.password, roleCode });
}

/**
 * Sign in from a verified OTP challenge.
 *
 * `verifyOtp` can answer with `OtpVerifiedWithoutAccount` — the code was right
 * but no user row exists for that number yet (the registration path). That
 * response carries no tokens, so there is no session to adopt: the state stays
 * anonymous and the caller gets an error to render. Assuming tokens here would
 * mean pretending to be authenticated with none.
 */
export async function signInWithOtp(input: VerifyOtpRequest): Promise<void> {
  const response = await verifyOtp(input);

  if (!isLoginSuccess(response)) {
    setState({ status: 'anonymous' });
    throw new NoAccountForOtpError();
  }

  // An OTP login cannot request a role: verifyOtp has no role-selection branch.
  await adoptSession(response, undefined);
}

/**
 * Sign out.
 *
 * The server call is best-effort. A logout that fails on a dead network must
 * still clear the device, otherwise the user is stuck signed in with no way to
 * reach the network that would let them out.
 */
export async function signOut(): Promise<void> {
  try {
    await logout();
  } catch {
    // Intentionally swallowed — see above.
  }

  setAccessToken(null);
  await tokenStorage.clearTokens();
  pendingPasswordLogin = null;
  setState({ status: 'anonymous' });
}

/** Clears every piece of module state, including the initialize guard, so tests are isolated. */
export function resetSessionForTests(): void {
  listeners.clear();
  state = { status: 'initializing' };
  pendingPasswordLogin = null;
  initialized = false;
  setAccessToken(null);
  setOnAuthFailure(null);
  configureTokenStorage(null);
  void tokenStorage.clearTokens();
}
