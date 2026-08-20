/**
 * Attaches the access token and a correlation id to every API call, and turns
 * the API's problem+json into a typed error the UI can switch on.
 *
 * Token storage is deliberately in-memory + sessionStorage rather than a
 * long-lived localStorage entry: the admin console handles payouts.
 */
import {
  HttpErrorResponse,
  type HttpEvent,
  type HttpHandlerFn,
  type HttpInterceptorFn,
  type HttpRequest,
} from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { throwError, type Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import type { Problem } from '@tohfa/shared-types';

const ACCESS_TOKEN_KEY = 'tohfa.accessToken';

@Injectable({ providedIn: 'root' })
export class TokenStore {
  private token: string | null = null;

  get(): string | null {
    this.token ??= sessionStorage.getItem(ACCESS_TOKEN_KEY);
    return this.token;
  }

  set(token: string): void {
    this.token = token;
    sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
  }

  clear(): void {
    this.token = null;
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
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

export const authInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  const tokens = inject(TokenStore);
  const token = tokens.get();

  // Only decorate our own API; never leak the bearer token to a third party.
  const isApiCall = request.url.startsWith('/v1');

  const decorated =
    isApiCall && token !== null
      ? request.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`,
            'x-correlation-id': crypto.randomUUID(),
          },
        })
      : request;

  return next(decorated).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        if (error.status === 401) tokens.clear();
        if (isProblem(error.error)) {
          return throwError(() => new ApiError(error.error as Problem));
        }
      }
      return throwError(() => error);
    }),
  );
};
