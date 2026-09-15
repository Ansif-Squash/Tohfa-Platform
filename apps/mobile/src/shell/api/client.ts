/**
 * Typed API client — shared by every role flavour.
 *
 * One place that knows about base URLs, bearer tokens, correlation ids and
 * problem+json. Screens call `api.get<T>(path)` and catch `ApiError`, branching
 * on `error.problem.code` — never on the message text.
 *
 * This lives in src/shell/ because all three binaries ship it. That placement
 * is what forces the token-storage seam below: src/tests/cross_role_import_guard
 * .test.ts enforces that nothing under src/shell/ may import from src/roles/,
 * and shared transport code has no business hard-depending on one specific
 * role's copy of a token store anyway.
 */
import type { ErrorCode, Problem } from '@tohfa/shared-types';

/**
 * TODO(STORY-MOB-01): move to react-native-config so the URL comes from the
 * build flavour. 10.0.2.2 is the Android emulator's view of the host machine.
 */
export const API_BASE_URL = 'http://10.0.2.2:3000';

export function resolveUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (normalizedPath === '/healthz' || normalizedPath.startsWith('/v1/')) {
    return `${API_BASE_URL}${normalizedPath}`;
  }
  return `${API_BASE_URL}/v1${normalizedPath}`;
}

export class ApiError extends Error {
  constructor(readonly problem: Problem) {
    super(problem.detail ?? problem.title);
    this.name = 'ApiError';
  }

  is(code: ErrorCode): boolean {
    return this.problem.code === code;
  }
}

export class NetworkError extends Error {
  constructor(cause: unknown) {
    super('The network is unavailable. Your work is saved on this device.');
    this.name = 'NetworkError';
    Object.defineProperty(this, 'cause', { value: cause, enumerable: false });
  }
}

export interface StoredAuthTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * The slice of a role's token store that the refresh path needs. Each role's
 * own src/roles/<role>/storage/tokenStorage.ts already satisfies this
 * structurally, so no adapter is required at the call site.
 */
export interface TokenStorageLike {
  getTokens(): Promise<StoredAuthTokens | null>;
  setTokens(tokens: StoredAuthTokens): Promise<void>;
  clearTokens(): Promise<void>;
}

let accessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;
let onAuthFailureCallback: (() => void) | null = null;
let tokenStorage: TokenStorageLike | null = null;

/**
 * Injected once at app startup by each role's App.tsx. Until it is called the
 * client still works for every unauthenticated call; only the silent
 * refresh-on-401 path needs a store, and it degrades to "refresh failed"
 * rather than crashing when there is none.
 */
export function configureTokenStorage(storage: TokenStorageLike | null): void {
  tokenStorage = storage;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function setOnAuthFailure(callback: (() => void) | null): void {
  onAuthFailureCallback = callback;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE' | undefined;
  body?: unknown | undefined;
  /** Required on every non-idempotent write. See docs/rules.md. */
  idempotencyKey?: string | undefined;
  signal?: AbortSignal | undefined;
  _isRetry?: boolean | undefined;
}

function correlationId(): string {
  // RN has no crypto.randomUUID on older Androids; this is only a log key.
  return `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Collapses concurrent 401s into a single POST /auth/refresh call.
 * Other in-flight requests queue behind this promise.
 */
export async function refreshAuthTokens(): Promise<string | null> {
  if (refreshPromise !== null) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    // Read the store once, up front: a configureTokenStorage() call racing
    // this refresh must not swap the store out from under it halfway through.
    const storage = tokenStorage;
    try {
      if (storage === null) {
        // No store configured is not a crash, it is simply a refresh that
        // cannot happen — same fallthrough as a missing refresh token.
        throw new Error('No token storage configured');
      }

      const tokens = await storage.getTokens();
      if (!tokens?.refreshToken) {
        throw new Error('No refresh token available');
      }

      const refreshUrl = resolveUrl('/auth/refresh');
      const response = await fetch(refreshUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'x-correlation-id': correlationId(),
        },
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
      });

      if (!response.ok) {
        throw new Error(`Token refresh rejected with status ${response.status}`);
      }

      const payload = (await response.json()) as { accessToken: string; refreshToken: string };
      setAccessToken(payload.accessToken);
      await storage.setTokens({
        accessToken: payload.accessToken,
        refreshToken: payload.refreshToken,
      });
      return payload.accessToken;
    } catch {
      // Genuinely failed refresh: clear Keychain/tokens without clearing registration draft
      setAccessToken(null);
      await storage?.clearTokens();
      onAuthFailureCallback?.();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'x-correlation-id': correlationId(),
  };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (accessToken !== null) headers['Authorization'] = `Bearer ${accessToken}`;
  if (options.idempotencyKey !== undefined) {
    headers['Idempotency-Key'] = options.idempotencyKey;
  }

  let response: Response;
  try {
    response = await fetch(resolveUrl(path), {
      method: options.method ?? 'GET',
      headers,
      ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
      ...(options.signal === undefined ? {} : { signal: options.signal }),
    });
  } catch (error) {
    throw new NetworkError(error);
  }

  // Handle mid-session 401 token expiry with collapsed refresh and single retry
  const isAuthEndpoint =
    path.includes('/auth/login') ||
    path.includes('/auth/refresh') ||
    path.includes('/auth/otp');

  if (response.status === 401 && !options._isRetry && !isAuthEndpoint) {
    const newAccessToken = await refreshAuthTokens();
    if (newAccessToken !== null) {
      return request<T>(path, {
        ...options,
        _isRetry: true,
      });
    }
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  const payload: unknown = text.length === 0 ? null : JSON.parse(text);

  if (!response.ok) {
    if (isProblem(payload)) throw new ApiError(payload);
    throw new ApiError({
      type: 'about:blank',
      title: 'Request failed',
      status: response.status,
      code: 'INTERNAL',
    });
  }

  return payload as T;
}

function isProblem(value: unknown): value is Problem {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    'status' in value &&
    'title' in value
  );
}

export const api = {
  get: <T>(path: string, signal?: AbortSignal): Promise<T> =>
    request<T>(path, signal === undefined ? {} : { signal }),
  post: <T>(path: string, body: unknown, idempotencyKey?: string): Promise<T> =>
    request<T>(path, {
      method: 'POST',
      body,
      ...(idempotencyKey === undefined ? {} : { idempotencyKey }),
    }),
  patch: <T>(path: string, body: unknown): Promise<T> =>
    request<T>(path, { method: 'PATCH', body }),
  put: <T>(path: string, body: unknown): Promise<T> =>
    request<T>(path, { method: 'PUT', body }),
  delete: <T>(path: string): Promise<T> =>
    request<T>(path, { method: 'DELETE' }),
};
