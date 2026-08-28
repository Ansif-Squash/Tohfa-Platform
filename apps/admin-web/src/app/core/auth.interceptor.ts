/**
 * Attaches the access token and a correlation id to every API call, and turns
 * the API's problem+json into a typed error the UI can switch on.
 *
 * Token storage is in-memory + sessionStorage. Handles 401 token refresh once
 * without request storms. Redirects to /login if unauthorized.
 */
import {
  HttpClient,
  HttpErrorResponse,
  type HttpEvent,
  type HttpHandlerFn,
  type HttpInterceptorFn,
  type HttpRequest,
} from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, filter, switchMap, take, throwError, type Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import type { Problem } from '@tohfa/shared-types';

const ACCESS_TOKEN_KEY = 'tohfa.accessToken';
const REFRESH_TOKEN_KEY = 'tohfa.refreshToken';

@Injectable({ providedIn: 'root' })
export class TokenStore {
  private readonly tokenSignal = signal<string | null>(
    typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(ACCESS_TOKEN_KEY) : null,
  );
  private readonly refreshTokenSignal = signal<string | null>(
    typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(REFRESH_TOKEN_KEY) : null,
  );

  get(): string | null {
    return this.tokenSignal();
  }

  getRefresh(): string | null {
    return this.refreshTokenSignal();
  }

  set(token: string, refreshToken?: string): void {
    this.tokenSignal.set(token);
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
    }
    if (refreshToken !== undefined) {
      this.refreshTokenSignal.set(refreshToken);
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      }
    }
  }

  clear(): void {
    this.tokenSignal.set(null);
    this.refreshTokenSignal.set(null);
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(ACCESS_TOKEN_KEY);
      sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  }
}

/** Thrown to subscribers so components can branch on `problem.code`. */
export class ApiError extends Error {
  constructor(readonly problem: Problem) {
    super(problem.detail ?? problem.title);
    this.name = 'ApiError';
  }
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

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  const tokens = inject(TokenStore);
  const http = inject(HttpClient);
  const router = inject(Router);
  const token = tokens.get();

  const isApiCall = request.url.startsWith('/v1');
  const isAuthEndpoint = request.url.includes('/auth/login') || request.url.includes('/auth/refresh');

  const addTokenHeader = (req: HttpRequest<unknown>, t: string | null) => {
    return isApiCall && t !== null
      ? req.clone({
          setHeaders: {
            Authorization: `Bearer ${t}`,
            'x-correlation-id': crypto.randomUUID(),
          },
        })
      : req;
  };

  const decorated = addTokenHeader(request, token);

  return next(decorated).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && !isAuthEndpoint) {
        const refresh = tokens.getRefresh();
        if (refresh) {
          if (!isRefreshing) {
            isRefreshing = true;
            refreshTokenSubject.next(null);

            return http
              .post<{ accessToken: string; refreshToken: string }>('/v1/auth/refresh', {
                refreshToken: refresh,
              })
              .pipe(
                switchMap((res) => {
                  isRefreshing = false;
                  tokens.set(res.accessToken, res.refreshToken);
                  refreshTokenSubject.next(res.accessToken);
                  return next(addTokenHeader(request, res.accessToken));
                }),
                catchError((refreshErr) => {
                  isRefreshing = false;
                  tokens.clear();
                  router.navigate(['/login']);
                  return throwError(() => refreshErr);
                }),
              );
          } else {
            return refreshTokenSubject.pipe(
              filter((t): t is string => t !== null),
              take(1),
              switchMap((newToken) => next(addTokenHeader(request, newToken))),
            );
          }
        }
        tokens.clear();
        router.navigate(['/login']);
      }

      if (error instanceof HttpErrorResponse && isProblem(error.error)) {
        return throwError(() => new ApiError(error.error as Problem));
      }
      return throwError(() => error);
    }),
  );
};
