/**
 * Express request augmentation.
 *
 * `actor` is set by requireAuth, `scope` by requirePermission, `validated` by
 * the validate() middleware, `traceId` by the correlation middleware in app.ts.
 * All are optional because they only exist after their middleware has run.
 */
import type { Actor } from '../auth/requireAuth.js';
import type { ResolvedScope } from '../rbac/requirePermission.js';
import type { ValidatedStore } from '../http/validate.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      actor?: Actor;
      scope?: ResolvedScope;
      validated?: ValidatedStore;
      traceId?: string;
    }
  }
}

export {};
