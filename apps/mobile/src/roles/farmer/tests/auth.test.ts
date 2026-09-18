import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  isOAuthNotLinked,
  isRoleSelectionRequired,
  loginWithOAuth,
  loginWithPassword,
  renderOtpState,
  resolveRouteAfterAuth,
  verifyOtp,
} from '../api/auth';

describe('User Story 42 (S-42) Auth Tests', () => {
  describe('BR-32: Server-driven OTP state assertions', () => {
    it('BR-32: resend timer counts down from server resendAvailableAt timestamp', () => {
      const now = Date.now();
      const resendAvailableAt = new Date(now + 45000).toISOString();

      const state = renderOtpState({
        resendAvailableAt,
        attemptsRemaining: 3,
        now,
      });

      expect(state.canResend).toBe(false);
      expect(state.secondsUntilResend).toBe(45);
    });

    it('BR-32: allows immediate resend when resendAvailableAt timestamp is in the past', () => {
      const now = Date.now();
      const resendAvailableAt = new Date(now - 1000).toISOString();

      const state = renderOtpState({
        resendAvailableAt,
        attemptsRemaining: 3,
        now,
      });

      expect(state.canResend).toBe(true);
      expect(state.secondsUntilResend).toBe(0);
    });

    it('BR-32: attempts indicator is driven by server attemptsRemaining', () => {
      const now = Date.now();
      const state = renderOtpState({
        resendAvailableAt: new Date(now + 60000).toISOString(),
        attemptsRemaining: 2,
        now,
      });

      expect(state.attemptsRemaining).toBe(2);
      expect(state.isLocked).toBe(false);
    });

    it('BR-32: locked challenge displays server-driven state and request new challenge action when attemptsRemaining is 0', () => {
      const now = Date.now();
      const state = renderOtpState({
        resendAvailableAt: new Date(now + 60000).toISOString(),
        attemptsRemaining: 0,
        now,
      });

      expect(state.isLocked).toBe(true);
      expect(state.canResend).toBe(true); // Must allow requesting a new challenge
    });
  });

  /**
   * Regression guard for the login that succeeded on the server but left the
   * farmer stranded on the Login screen with "Something went wrong".
   *
   * The server returns `requiresRoleSelection: false` alongside the tokens on
   * every successful login, so the old `'requiresRoleSelection' in outcome`
   * test in LoginScreen was true for a *successful* single-role login and the
   * screen then read `outcome.availableRoles[0]`, which threw a TypeError.
   * The throw was not an `ApiError`, so it surfaced as the generic error, and
   * because it happened before `fetchMe()` the server never saw a second
   * request.
   */
  describe('Login outcome discrimination', () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    /** Exactly what apps/api returns for a single-role farmer password login. */
    const successBody = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      tokenType: 'Bearer',
      expiresIn: 900,
      requiresRoleSelection: false,
      user: {
        id: 'user-123',
        fullName: 'Test Farmer',
        userType: 'FARMER',
        roles: [{ code: 'FARMER' }],
        preferredLocale: 'en',
      },
    };

    function stubFetchOnce(body: unknown): void {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => ({
          ok: true,
          status: 200,
          text: async () => JSON.stringify(body),
        })),
      );
    }

    it('a successful login is NOT a role-selection prompt, even though it carries requiresRoleSelection:false', async () => {
      stubFetchOnce(successBody);

      const outcome = await loginWithPassword({ mobile: '+919870000002', password: 'x' });

      expect(isRoleSelectionRequired(outcome)).toBe(false);
      // The mistake this guards against: `in` is true here, which is why the
      // screen must not use it to branch.
      expect('requiresRoleSelection' in outcome).toBe(true);
    });

    it('a real role-selection prompt is still detected', async () => {
      stubFetchOnce({
        requiresRoleSelection: true,
        availableRoles: [{ code: 'FARMER' }, { code: 'CUSTOMER' }],
      });

      const outcome = await loginWithPassword({ mobile: '+919870000002', password: 'x' });

      expect(isRoleSelectionRequired(outcome)).toBe(true);
      if (isRoleSelectionRequired(outcome)) {
        expect(outcome.availableRoles[0]?.code).toBe('FARMER');
      }
    });

    it('a successful login routes a single-role farmer to MainTabs without touching availableRoles', async () => {
      stubFetchOnce(successBody);

      const outcome = await loginWithPassword({ mobile: '+919870000002', password: 'x' });
      if (isRoleSelectionRequired(outcome)) {
        throw new Error('single-role login must not require role selection');
      }

      // The shape `/v1/auth/me` really answers with: no `status`, no
      // `applicationId`, no `userId`.
      const me = {
        id: 'user-123',
        fullName: 'Test Farmer',
        mobile: '+919870000002',
        email: null,
        userType: 'FARMER',
        preferredLocale: 'en',
        roles: [{ code: 'FARMER' as const }],
        permissions: ['listing.create'],
      };

      expect(resolveRouteAfterAuth(me).name).toBe('MainTabs');
    });
  });

  /**
   * BR-39: Google/Facebook OAuth is login/linking only, never a bypass of
   * mobile+OTP. See docs/rules.md BR-39 for the full rule and its
   * `BR-39a`..`BR-39f` test contract; these cover the mobile client's slice
   * of it (`loginWithOAuth`'s three response shapes and `verifyOtp`'s
   * `linkToken` passthrough) without a real device or provider SDK.
   */
  describe('BR-39: OAuth login/linking outcomes', () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    function stubFetchOnce(body: unknown): ReturnType<typeof vi.fn> {
      const fetchMock = vi.fn(async () => ({
        ok: true,
        status: 200,
        text: async () => JSON.stringify(body),
      }));
      vi.stubGlobal('fetch', fetchMock);
      return fetchMock;
    }

    it('BR-39a: an already-linked identity logs in exactly like a password login (token pair, not NOT_LINKED or role-selection)', async () => {
      stubFetchOnce({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        tokenType: 'Bearer',
        expiresIn: 900,
        requiresRoleSelection: false,
        user: {
          id: 'user-123',
          fullName: 'Test Farmer',
          userType: 'FARMER',
          roles: [{ code: 'FARMER' }],
          preferredLocale: 'en',
        },
      });

      const outcome = await loginWithOAuth('GOOGLE', 'a-verified-google-id-token');

      expect(isOAuthNotLinked(outcome)).toBe(false);
      expect(isRoleSelectionRequired(outcome)).toBe(false);
      if (!isOAuthNotLinked(outcome) && !isRoleSelectionRequired(outcome)) {
        expect(outcome.accessToken).toBe('access-token');
        expect(outcome.user.userType).toBe('FARMER');
      }
    });

    it('BR-39a: an already-linked identity held by an account with multiple roles asks for role selection, same as password login', async () => {
      stubFetchOnce({
        requiresRoleSelection: true,
        availableRoles: [{ code: 'FARMER' }, { code: 'CUSTOMER' }],
      });

      const outcome = await loginWithOAuth('GOOGLE', 'a-verified-google-id-token');

      expect(isOAuthNotLinked(outcome)).toBe(false);
      expect(isRoleSelectionRequired(outcome)).toBe(true);
      if (isRoleSelectionRequired(outcome)) {
        expect(outcome.availableRoles[0]?.code).toBe('FARMER');
      }
    });

    it('BR-39b: an unlinked identity returns NOT_LINKED with a profile and linkToken, never a token pair', async () => {
      const fetchMock = stubFetchOnce({
        status: 'NOT_LINKED',
        profile: { fullName: 'New Farmer', email: 'new.farmer@example.com', photoUrl: null },
        linkToken: 'signed-link-token',
      });

      const outcome = await loginWithOAuth('FACEBOOK', 'a-verified-facebook-token');

      expect(isOAuthNotLinked(outcome)).toBe(true);
      if (isOAuthNotLinked(outcome)) {
        expect(outcome.linkToken).toBe('signed-link-token');
        expect(outcome.profile.fullName).toBe('New Farmer');
        expect('accessToken' in outcome).toBe(false);
      }

      // This hit the network exactly once (the OAuth login itself) -- no
      // second call to persist tokens that were never issued.
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('BR-39c/d: verifyOtp forwards an optional linkToken to the server and surfaces the resulting oauthProfile', async () => {
      const fetchMock = stubFetchOnce({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        tokenType: 'Bearer',
        expiresIn: 900,
        requiresRoleSelection: false,
        user: {
          id: 'user-456',
          fullName: 'New Farmer',
          userType: 'CUSTOMER',
          roles: [{ code: 'CUSTOMER' }],
          preferredLocale: 'en',
        },
        oauthProfile: { fullName: 'New Farmer', email: 'new.farmer@example.com', photoUrl: null },
      });

      const outcome = await verifyOtp({
        challengeId: 'challenge-1',
        code: '123456',
        linkToken: 'signed-link-token',
      });

      const [, requestInit] = fetchMock.mock.calls[0] as [string, RequestInit];
      const sentBody = JSON.parse(requestInit.body as string) as Record<string, unknown>;
      expect(sentBody.linkToken).toBe('signed-link-token');

      expect(isRoleSelectionRequired(outcome)).toBe(false);
      if (!isRoleSelectionRequired(outcome)) {
        expect(outcome.oauthProfile?.email).toBe('new.farmer@example.com');
      }
    });

    it('a plain mobile+OTP verify (no linkToken) omits linkToken from the request body', async () => {
      const fetchMock = stubFetchOnce({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        tokenType: 'Bearer',
        expiresIn: 900,
        requiresRoleSelection: false,
        user: {
          id: 'user-123',
          fullName: 'Test Farmer',
          userType: 'FARMER',
          roles: [{ code: 'FARMER' }],
          preferredLocale: 'en',
        },
      });

      await verifyOtp({ challengeId: 'challenge-1', code: '123456' });

      const [, requestInit] = fetchMock.mock.calls[0] as [string, RequestInit];
      const sentBody = JSON.parse(requestInit.body as string) as Record<string, unknown>;
      expect('linkToken' in sentBody).toBe(false);
    });
  });

  describe('Farmer Routing Rules', () => {
    it('Routing: pending farmer is routed to application-status timeline', () => {
      const me = {
        id: 'user-123',
        status: 'PENDING_APPROVAL',
        farmerId: 'farmer-123',
        applicationId: 'app-456',
        roles: [{ code: 'FARMER' as const }],
      };

      const route = resolveRouteAfterAuth(me);
      expect(route.name).toBe('ApplicationStatus');
      expect(route.params).toEqual({ applicationId: 'app-456' });
    });

    it('Routing: approved farmer is routed to main tab dashboard', () => {
      const me = {
        id: 'user-123',
        status: 'ACTIVE',
        farmerId: 'farmer-123',
        applicationId: 'app-456',
        roles: [{ code: 'FARMER' as const }],
      };

      const route = resolveRouteAfterAuth(me);
      expect(route.name).toBe('MainTabs');
    });
  });
});
