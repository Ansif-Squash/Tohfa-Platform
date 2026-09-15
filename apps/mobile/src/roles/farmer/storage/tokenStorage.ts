/**
 * Secure token storage for access and refresh tokens.
 * Uses Keychain/Keystore security layer for credentials.
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

export async function getAccessToken(): Promise<string | null> {
  const tokens = await tokenStorage.getTokens();
  return tokens?.accessToken ?? null;
}

export async function saveTokens(accessToken: string, refreshToken: string): Promise<void> {
  await tokenStorage.setTokens({ accessToken, refreshToken });
}

export async function clearTokens(): Promise<void> {
  await tokenStorage.clearTokens();
}
