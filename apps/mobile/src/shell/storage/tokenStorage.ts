/**
 * The single shell-level token store.
 *
 * HONESTY NOTE — this is IN-MEMORY ONLY. Tokens live in the module-scoped
 * `memoryTokens` variable below and are lost whenever the JS context is torn
 * down (app kill, Metro reload, OS reclaiming the process). A cold start is
 * therefore ALWAYS unauthenticated: there is no "remember me" here, and no
 * amount of session plumbing on top of this store will produce one.
 *
 * Real Keychain (iOS) / Android Keystore integration is deliberately left as
 * separate follow-up work rather than invented here. The shape below is chosen
 * so that swapping the three method bodies for a secure-storage call is the
 * whole change — no call site moves. `initializeSession()` in ../auth/session.ts
 * is the single place this store is handed to the shared API client.
 *
 * Deliberately NOT repeated from the two role-local copies at
 * src/roles/{farmer,customer}/storage/tokenStorage.ts: their docblocks claim
 * "Uses Keychain/Keystore security layer for credentials". That claim is not
 * true of their implementations either — both are the same module-scoped
 * variable as this one. A comment that overstates the security of a token store
 * is worse than no comment, so this file states what it actually does.
 *
 * The shape matches those role-local stores (and `TokenStorageLike` in
 * ../api/client.ts) structurally, so it satisfies the client's token-storage
 * seam with no adapter.
 */

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

let memoryTokens: AuthTokens | null = null;

export const tokenStorage = {
  async getTokens(): Promise<AuthTokens | null> {
    return memoryTokens;
  },

  async setTokens(tokens: AuthTokens): Promise<void> {
    memoryTokens = tokens;
  },

  async clearTokens(): Promise<void> {
    memoryTokens = null;
  },
};
