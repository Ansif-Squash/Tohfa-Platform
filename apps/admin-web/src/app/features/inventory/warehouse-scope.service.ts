/**
 * Warehouse selection scope for the S-28 screens.
 *
 * BR-30: a Sub Warehouse Admin is scoped to their assigned warehouse. In the UI
 * the warehouse selector is then LOCKED — and this must hold in the export path
 * too, which is why every screen builds its query (table AND export) through
 * this service's `currentWarehouseId()`.
 *
 * No role comparison appears here: the lock is derived from permission scopes
 * (`warehouse.all.view`) and the warehouse assignments carried by the user
 * profile from `GET /v1/auth/me`.
 */
import { Injectable, computed, inject, signal } from '@angular/core';
import type { RoleAssignment } from '../../core/auth.service';
import { AuthService } from '../../core/auth.service';
import { RbacService } from '../../core/rbac.service';
import { InventoryService, type WarehouseView } from './inventory.service';

@Injectable({ providedIn: 'root' })
export class WarehouseScopeService {
  private readonly auth = inject(AuthService);
  private readonly rbac = inject(RbacService);
  private readonly inventory = inject(InventoryService);

  /** Warehouse ids assigned to this user's roles (Sub Warehouse Admins). */
  private readonly assigned = computed<string[]>(() => {
    const profile = this.auth.user();
    if (profile === null) return [];
    return distinctWarehouseIds(profile.roles);
  });

  /** True when the selector must be locked to the assigned warehouse(s). */
  readonly locked = computed<boolean>(
    () => !this.rbac.can('warehouse.all.view') && this.assigned().length > 0,
  );

  readonly assignedIds = this.assigned;

  /** Options for an unlocked selector, from GET /warehouses (BR-24 master list). */
  readonly options = signal<readonly WarehouseView[]>([]);

  /** The warehouse every query (table and export) is currently scoped to. */
  private readonly selected = signal<string>('');

  /** True once the initial selection has been derived (assignments/options). */
  private readonly ready = signal(false);

  readonly isReady = this.ready.asReadonly();

  /** Called once per screen; resolves the locked selection or fetches options. */
  init(): void {
    if (this.ready()) return;
    if (this.locked()) {
      this.selected.set(this.assigned()[0] ?? '');
      this.ready.set(true);
      return;
    }
    this.inventory.listWarehouses().subscribe({
      next: (res) => {
        this.options.set(res.items ?? []);
        this.ready.set(true);
      },
      error: () => {
        this.options.set([]);
        this.ready.set(true);
      },
    });
  }

  currentWarehouseId(): string {
    return this.selected();
  }

  /** Choose a warehouse; refused when the selector is locked (BR-30). */
  select(warehouseId: string): void {
    if (this.locked() && !this.assigned().includes(warehouseId)) return;
    this.selected.set(warehouseId);
  }
}

/** Warehouse ids from role assignments, keeping order, dropping empties. */
function distinctWarehouseIds(roles: readonly RoleAssignment[]): string[] {
  const out: string[] = [];
  for (const role of roles) {
    const id = role.warehouseId;
    if (id !== undefined && id !== null && id.length > 0 && !out.includes(id)) {
      out.push(id);
    }
  }
  return out;
}
