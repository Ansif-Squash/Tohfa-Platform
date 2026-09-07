import { describe, it, expect, beforeEach, vi } from 'vitest';
import { request, setAccessToken, setOnAuthFailure } from '../api/client';
import { tokenStorage } from '../storage/tokenStorage';
import { saveRegistrationDraft, getRegistrationDraft, clearRegistrationDraft } from '../storage/registrationDraft';

describe('Token Refresh Concurrency & Mid-Session Recovery (S-46)', () => {
  beforeEach(async () => {
    vi.restoreAllMocks();
    setAccessToken('expired-access-token');
    await tokenStorage.setTokens({
      accessToken: 'expired-access-token',
      refreshToken: 'valid-refresh-token-round-1',
    });
    await clearRegistrationDraft();
  });

  it('collapses five concurrent 401s into exactly one POST /auth/refresh call and replays all five successfully', async () => {
    let refreshCallCount = 0;
    let dataCallCount = 0;

    // Mock global fetch to simulate 401 on expired-access-token, successful refresh, and success on retry
    global.fetch = vi.fn(async (url: RequestInfo | URL, options?: RequestInit) => {
      const urlStr = String(url);
      const headers = (options?.headers ?? {}) as Record<string, string>;
      const authHeader = headers['Authorization'] || headers['authorization'] || '';

      if (urlStr.includes('/auth/refresh')) {
        refreshCallCount++;
        return new Response(
          JSON.stringify({
            accessToken: 'refreshed-access-token',
            refreshToken: 'valid-refresh-token-round-2', // rotated refresh token
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }

      // Any normal API endpoint
      if (urlStr.includes('/farmers/profile') || urlStr.includes('/listings')) {
        dataCallCount++;
        if (authHeader === 'Bearer expired-access-token') {
          return new Response(
            JSON.stringify({
              type: 'https://tohfa.in/probs/unauthorized',
              title: 'Unauthorized',
              status: 401,
              code: 'UNAUTHORIZED',
              detail: 'Access token expired',
            }),
            { status: 401, headers: { 'Content-Type': 'application/problem+json' } },
          );
        }

        if (authHeader === 'Bearer refreshed-access-token') {
          return new Response(
            JSON.stringify({
              success: true,
              data: 'protected-data',
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          );
        }
      }

      return new Response(JSON.stringify({ status: 'ok' }), { status: 200 });
    });

    // Fire 5 concurrent requests with the expired token
    const promises = [
      request<{ success: boolean }>('/farmers/profile'),
      request<{ success: boolean }>('/listings'),
      request<{ success: boolean }>('/farmers/profile'),
      request<{ success: boolean }>('/listings'),
      request<{ success: boolean }>('/farmers/profile'),
    ];

    const results = await Promise.all(promises);

    // 1. All 5 requests succeeded after replay
    expect(results).toHaveLength(5);
    for (const res of results) {
      expect(res.success).toBe(true);
    }

    // 2. Exactly ONE refresh request was made! (collapsed concurrency)
    expect(refreshCallCount).toBe(1);

    // 3. 5 initial 401 calls + 5 replayed 200 calls = 10 calls
    expect(dataCallCount).toBe(10);

    // 4. Token storage has been updated with the new rotated tokens
    const currentTokens = await tokenStorage.getTokens();
    expect(currentTokens?.accessToken).toBe('refreshed-access-token');
    expect(currentTokens?.refreshToken).toBe('valid-refresh-token-round-2');
  });

  it('genuinely failed refresh clears tokens and triggers auth failure without discarding in-progress registration draft', async () => {
    // Farmer had an active draft in progress
    await saveRegistrationDraft({
      applicationId: 'app-draft-46',
      currentStep: 3,
      step1: { fullName: 'Ramanathan', mobile: '9876543210' },
    });

    let authFailureNotified = false;
    setOnAuthFailure(() => {
      authFailureNotified = true;
    });

    // Mock refresh failure (e.g. 401 on refresh endpoint because refresh token expired/revoked)
    global.fetch = vi.fn(async (url: RequestInfo | URL) => {
      const urlStr = String(url);
      if (urlStr.includes('/auth/refresh')) {
        return new Response(
          JSON.stringify({
            type: 'https://tohfa.in/probs/unauthorized',
            title: 'Refresh token revoked',
            status: 401,
            code: 'UNAUTHORIZED',
          }),
          { status: 401, headers: { 'Content-Type': 'application/problem+json' } },
        );
      }

      return new Response(
        JSON.stringify({
          type: 'https://tohfa.in/probs/unauthorized',
          title: 'Unauthorized',
          status: 401,
          code: 'UNAUTHORIZED',
        }),
        { status: 401, headers: { 'Content-Type': 'application/problem+json' } },
      );
    });

    // Make request that fails with 401 and refresh fails
    await expect(request('/farmers/profile')).rejects.toThrow();

    // 1. Keychain/tokens were cleared
    const tokens = await tokenStorage.getTokens();
    expect(tokens).toBeNull();

    // 2. Auth failure callback was called to return user to login
    expect(authFailureNotified).toBe(true);

    // 3. Draft was NOT lost / NOT discarded!
    const preservedDraft = await getRegistrationDraft();
    expect(preservedDraft).not.toBeNull();
    expect(preservedDraft?.applicationId).toBe('app-draft-46');
    expect(preservedDraft?.step1?.fullName).toBe('Ramanathan');
  });
});
