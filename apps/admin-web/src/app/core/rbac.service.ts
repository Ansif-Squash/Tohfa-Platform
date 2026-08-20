/**
 * RBAC in the browser.
 *
 * IMPORTANT: this is a UI-ONLY convenience. It decides which nav items and
 * buttons to render. It is NOT security — every one of these permissions is
 * re-checked server-side by `requirePermission`. Never treat a client-side
 * `can()` as an authorization decision.
 *
 * The matrix is the same `docs/rbac.json` the API loads; angular.json copies it
 * into /assets at build time so both sides cannot drift.
 */
import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { RoleCode, ScopeLevel } from '@tohfa/shared-types';

export interface RbacPermission {
  code: string;
  module: string;
  description?: string;
  grants: Partial<Record<RoleCode, ScopeLevel>>;
  predicate?: string;
}

export interface RbacDocument {
  version: string;
  roles: Array<{ code: RoleCode; name: string; level: number; colorHex?: string | null }>;
  permissions: RbacPermission[];
}

@Injectable({ providedIn: 'root' })
export class RbacService {
  private readonly http = inject(HttpClient);

  private readonly document = signal<RbacDocument | null>(null);
  private readonly roles = signal<readonly RoleCode[]>([]);

  readonly loaded = computed(() => this.document() !== null);
  readonly version = computed(() => this.document()?.version ?? 'unloaded');
  readonly activeRoles = this.roles.asReadonly();

  /** Called once by APP_INITIALIZER (see app.config.ts). */
  async load(): Promise<void> {
    if (this.document() !== null) return;
    const doc = await firstValueFrom(this.http.get<RbacDocument>('/assets/rbac.json'));
    this.document.set(doc);
  }

  /** Set after login, from the roles in the access token. */
  setRoles(roles: readonly RoleCode[]): void {
    this.roles.set([...roles]);
  }

  /** Highest scope the current roles hold for `permissionCode`. */
  scopeFor(permissionCode: string): ScopeLevel {
    const doc = this.document();
    if (doc === null) return 'none';

    const permission = doc.permissions.find((entry) => entry.code === permissionCode);
    if (permission === undefined) return 'none';

    const rank: Record<ScopeLevel, number> = {
      none: 0,
      view: 1,
      own: 2,
      conditional: 3,
      all: 4,
    };

    let best: ScopeLevel = 'none';
    for (const role of this.roles()) {
      const level = permission.grants[role] ?? 'none';
      if (rank[level] > rank[best]) best = level;
    }
    return best;
  }

  /** True when the permission is granted at any level above `none`. */
  can(permissionCode: string): boolean {
    return this.scopeFor(permissionCode) !== 'none';
  }

  /** True when the permission allows mutation (i.e. is not read-only). */
  canMutate(permissionCode: string): boolean {
    const scope = this.scopeFor(permissionCode);
    return scope !== 'none' && scope !== 'view';
  }

  /** Brand colour for a role badge, straight from the matrix. */
  colorFor(role: RoleCode): string {
    return this.document()?.roles.find((entry) => entry.code === role)?.colorHex ?? '#0F6E56';
  }
}
