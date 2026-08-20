/**
 * Route guard backed by docs/rbac.json.
 *
 * Again: this only hides UI. The API re-checks every permission. Its purpose is
 * to stop an admin landing on a screen that will only 403 at them.
 *
 * ```ts
 * { path: 'pricing', canActivate: [permissionGuard('pricing.fair_price.view')], ... }
 * ```
 */
import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { RbacService } from './rbac.service';

export function permissionGuard(permissionCode: string): CanActivateFn {
  return () => {
    const rbac = inject(RbacService);
    const router = inject(Router);

    if (rbac.can(permissionCode)) return true;

    return router.createUrlTree(['/forbidden'], {
      queryParams: { permission: permissionCode },
    });
  };
}

/** Guard for screens that mutate: `view` scope is not enough. */
export function mutationGuard(permissionCode: string): CanActivateFn {
  return () => {
    const rbac = inject(RbacService);
    const router = inject(Router);

    if (rbac.canMutate(permissionCode)) return true;

    return router.createUrlTree(['/forbidden'], {
      queryParams: { permission: permissionCode, reason: 'read-only' },
    });
  };
}
