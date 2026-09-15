/**
 * Unit tests for the shell session module.
 *
 * Deliberately pure-logic only: apps/mobile has no vitest config, so tests run
 * in the default node environment with no DOM. Nothing here renders a
 * component — the React surface (RootShell) is covered by the fact that every
 * decision it makes is delegated to the pure functions tested below.
 *
 * No BR-xx id is attached to these tests on purpose. docs/rules.md contains no
 * rule governing login, role selection, sessions or tokens (BR-32 covers the
 * OTP challenge itself — code length, resend cooldown, attempt lockout — and
 * BR-28 covers admin *creation* hierarchy, not sign-in), so claiming a rule id
 * here would assert a contract that does not exist.
 *
 * Runtime-import note: only `RoleCode` is imported as a value from
 * @tohfa/shared-types. That package resolves to its built `dist/` at test time,
 * so pulling a newly-added runtime value (e.g. `OtpPurpose`) in here would
 * couple these tests to a build step. Everything else is a type-only import.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RoleCode } from '@tohfa/shared-types';
import type { LoginSuccess, RoleAssignment, VerifyOtpResponse } from '@tohfa/shared-types';
import { FLAVOR_CONFIG, Flavor } from '../config/flavor';
import {
  ADMIN_SELECTABLE_ROLE_CODES,
  filterAdminSelectableRoles,
  getSessionState,
  initializeSession,
  isLoginSuccess,
  requiresRoleSelection,
  resetSessionForTests,
  signInWithOtp,
} from './session';

vi.mock('./api', () => ({
  login: vi.fn(),
  sendOtp: vi.fn(),
  verifyOtp: vi.fn(),
  fetchCurrentUser: vi.fn(),
  logout: vi.fn(),
}));

// Imported after the mock declaration; vi.mock is hoisted above both.
import { verifyOtp } from './api';

function role(code: RoleCode, extra: Partial<RoleAssignment> = {}): RoleAssignment {
  return { code, ...extra };
}

describe('requiresRoleSelection — verbatim mirror of the server condition', () => {
  it('is false for zero roles with no requested roleCode', () => {
    expect(requiresRoleSelection([], undefined)).toBe(false);
  });

  it('is false for exactly one role with no requested roleCode', () => {
    expect(requiresRoleSelection([role(RoleCode.FARMER)], undefined)).toBe(false);
  });

  it('is TRUE for two roles with no requested roleCode', () => {
    expect(
      requiresRoleSelection([role(RoleCode.FARMER), role(RoleCode.TOHFA_ADMIN)], undefined),
    ).toBe(true);
  });

  it('is false for two roles once a roleCode has been requested', () => {
    expect(
      requiresRoleSelection(
        [role(RoleCode.FARMER), role(RoleCode.TOHFA_ADMIN)],
        RoleCode.FARMER,
      ),
    ).toBe(false);
  });

  it('is false for three roles once a roleCode has been requested', () => {
    expect(
      requiresRoleSelection(
        [role(RoleCode.FARMER), role(RoleCode.TOHFA_ADMIN), role(RoleCode.SUB_WH_ADMIN)],
        RoleCode.SUB_WH_ADMIN,
      ),
    ).toBe(false);
  });

  /**
   * Pins the `=== undefined` check. An implementation written as `!roleCode`
   * would treat an empty-string roleCode as "not requested" and wrongly return
   * true here, diverging from the server.
   */
  it('is false for an empty-string roleCode, because the check is === undefined and not truthiness', () => {
    expect(
      requiresRoleSelection(
        [role(RoleCode.FARMER), role(RoleCode.TOHFA_ADMIN)],
        '' as RoleCode,
      ),
    ).toBe(false);
  });
});

describe('flavor pinning makes role selection structurally unreachable', () => {
  const manyRoles: RoleAssignment[] = [
    role(RoleCode.FARMER),
    role(RoleCode.CUSTOMER),
    role(RoleCode.TOHFA_ADMIN),
  ];

  it('farmer flavor never needs role selection even when the account holds several roles', () => {
    expect(requiresRoleSelection(manyRoles, FLAVOR_CONFIG[Flavor.FARMER].pinnedRoleCode)).toBe(
      false,
    );
  });

  it('customer flavor never needs role selection even when the account holds several roles', () => {
    expect(requiresRoleSelection(manyRoles, FLAVOR_CONFIG[Flavor.CUSTOMER].pinnedRoleCode)).toBe(
      false,
    );
  });

  it('admin flavor pins no role, so more than one role does require selection', () => {
    expect(requiresRoleSelection(manyRoles, FLAVOR_CONFIG[Flavor.ADMIN].pinnedRoleCode)).toBe(
      true,
    );
  });

  it('admin flavor still skips selection for a single-role account', () => {
    expect(
      requiresRoleSelection([role(RoleCode.TOHFA_ADMIN)], FLAVOR_CONFIG[Flavor.ADMIN].pinnedRoleCode),
    ).toBe(false);
  });
});

describe('ADMIN_SELECTABLE_ROLE_CODES', () => {
  it('is exactly the five admin console roles', () => {
    expect([...ADMIN_SELECTABLE_ROLE_CODES]).toEqual([
      RoleCode.SUPER_ADMIN,
      RoleCode.TOHFA_ADMIN,
      RoleCode.FARMER_ADMIN,
      RoleCode.MAIN_WH_ADMIN,
      RoleCode.SUB_WH_ADMIN,
    ]);
  });

  it('includes FARMER_ADMIN, which is an admin console role despite the name', () => {
    expect(ADMIN_SELECTABLE_ROLE_CODES).toContain(RoleCode.FARMER_ADMIN);
  });

  it('excludes the two mobile-app roles', () => {
    expect(ADMIN_SELECTABLE_ROLE_CODES).not.toContain(RoleCode.FARMER);
    expect(ADMIN_SELECTABLE_ROLE_CODES).not.toContain(RoleCode.CUSTOMER);
  });

  /**
   * Drift guard: adding a role code to enums.ts without revisiting the explicit
   * list in session.ts fails here rather than silently leaving the new role out
   * of (or into) the admin picker.
   */
  it('equals every RoleCode except FARMER and CUSTOMER', () => {
    const expected = Object.values(RoleCode).filter(
      (code) => code !== RoleCode.FARMER && code !== RoleCode.CUSTOMER,
    );
    expect([...ADMIN_SELECTABLE_ROLE_CODES].sort()).toEqual([...expected].sort());
  });
});

describe('filterAdminSelectableRoles', () => {
  it('drops FARMER and CUSTOMER assignments and keeps admin ones', () => {
    const filtered = filterAdminSelectableRoles([
      role(RoleCode.FARMER),
      role(RoleCode.TOHFA_ADMIN),
      role(RoleCode.CUSTOMER),
      role(RoleCode.SUPER_ADMIN),
    ]);

    expect(filtered.map((assignment) => assignment.code)).toEqual([
      RoleCode.TOHFA_ADMIN,
      RoleCode.SUPER_ADMIN,
    ]);
  });

  it('preserves warehouseId and zoneId on the assignments it keeps', () => {
    const filtered = filterAdminSelectableRoles([
      role(RoleCode.SUB_WH_ADMIN, { warehouseId: 'wh-1', zoneId: 'zone-9' }),
    ]);

    expect(filtered).toEqual([
      { code: RoleCode.SUB_WH_ADMIN, warehouseId: 'wh-1', zoneId: 'zone-9' },
    ]);
  });

  it('returns an empty array for an account holding only FARMER and CUSTOMER', () => {
    expect(filterAdminSelectableRoles([role(RoleCode.FARMER), role(RoleCode.CUSTOMER)])).toEqual(
      [],
    );
  });

  it('returns an empty array for an empty input', () => {
    expect(filterAdminSelectableRoles([])).toEqual([]);
  });
});

describe('isLoginSuccess — discriminating the two POST /auth/otp/verify shapes', () => {
  const loginSuccess: LoginSuccess = {
    accessToken: 'access-1',
    refreshToken: 'refresh-1',
    tokenType: 'Bearer',
    expiresIn: 900,
    requiresRoleSelection: false,
    user: {
      id: 'user-1',
      fullName: 'Test User',
      userType: 'FARMER',
      roles: [role(RoleCode.FARMER)],
      preferredLocale: 'en',
    },
  };

  const verifiedWithoutAccount: VerifyOtpResponse = {
    verified: true,
    mobile: '9876500000',
    purpose: 'REGISTRATION',
  };

  it('recognises a token-bearing login response', () => {
    expect(isLoginSuccess(loginSuccess)).toBe(true);
  });

  it('rejects the verified-but-no-account response, which carries no tokens', () => {
    expect(isLoginSuccess(verifiedWithoutAccount)).toBe(false);
  });

  it('rejects a malformed payload rather than adopting it as a session', () => {
    expect(isLoginSuccess({} as VerifyOtpResponse)).toBe(false);
  });
});

describe('signInWithOtp when the OTP verifies but no account exists', () => {
  beforeEach(() => {
    resetSessionForTests();
    vi.clearAllMocks();
  });

  it('does not become authenticated and leaves the session anonymous', async () => {
    initializeSession();
    vi.mocked(verifyOtp).mockResolvedValue({
      verified: true,
      mobile: '9876500000',
      purpose: 'REGISTRATION',
    });

    await expect(signInWithOtp({ challengeId: 'challenge-1', code: '123456' })).rejects.toThrow();

    expect(getSessionState().status).toBe('anonymous');
  });

  it('becomes authenticated when the OTP response does carry tokens', async () => {
    initializeSession();
    vi.mocked(verifyOtp).mockResolvedValue({
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
      tokenType: 'Bearer',
      expiresIn: 900,
      requiresRoleSelection: false,
      user: {
        id: 'user-1',
        fullName: 'Test User',
        userType: 'FARMER',
        roles: [role(RoleCode.FARMER)],
        preferredLocale: 'en',
      },
    });

    await signInWithOtp({ challengeId: 'challenge-1', code: '123456' });

    const state = getSessionState();
    expect(state.status).toBe('authenticated');
    if (state.status === 'authenticated') {
      expect(state.activeRoleCode).toBe(RoleCode.FARMER);
      expect(state.user.id).toBe('user-1');
    }
  });
});
