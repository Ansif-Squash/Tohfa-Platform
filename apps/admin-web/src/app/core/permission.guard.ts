/**
 * Route guard backed by docs/rbac.json and AuthService.
 *
 * Checks authentication first: redirects to /login if unauthenticated.
 * Then checks permission: redirects to /forbidden if unauthorized.
 */
import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { NAV } from '../app.routes';
import { AuthService } from './auth.service';
import { RbacService } from './rbac.service';

export function permissionGuard(permissionCode: string): CanActivateFn {
  return (route) => {
    const auth = inject(AuthService);
    const rbac = inject(RbacService);
    const router = inject(Router);

    if (!auth.isAuthenticated()) {
      return router.createUrlTree(['/login']);
    }

    if (rbac.can(permissionCode)) return true;

    // If attempting to access default route but lack permission, forward to first accessible route
    if (route.routeConfig?.path === 'farmer-applications') {
      const target = rbac.firstAllowedPath(NAV);
      if (target !== '/farmer-applications') {
        return router.createUrlTree([target]);
      }
    }

    return router.createUrlTree(['/forbidden'], {
      queryParams: { permission: permissionCode },
    });
  };
}

/** Guard for screens that mutate: `view` scope is not enough. */
export function mutationGuard(permissionCode: string): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const rbac = inject(RbacService);
    const router = inject(Router);

    if (!auth.isAuthenticated()) {
      return router.createUrlTree(['/login']);
    }

    if (rbac.canMutate(permissionCode)) return true;

    return router.createUrlTree(['/forbidden'], {
      queryParams: { permission: permissionCode, reason: 'read-only' },
    });
  };
}

/** Guard for public/auth screens: redirects already-authenticated users to dashboard. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const rbac = inject(RbacService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    const target = rbac.firstAllowedPath(NAV);
    return router.createUrlTree([target]);
  }
  return true;
};

/** Guard for authenticated routes: redirects unauthenticated users to /login. */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }
  return true;
};


