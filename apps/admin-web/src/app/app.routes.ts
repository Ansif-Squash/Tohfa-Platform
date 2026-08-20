/**
 * Route table.
 *
 * Every non-public route declares the permission it needs. That permission code
 * MUST exist in docs/rbac.json — the nav in shell.component.ts is generated
 * from this same list, so a screen and its nav entry cannot disagree.
 */
import type { Routes } from '@angular/router';
import { permissionGuard } from './core/permission.guard';

export interface NavRoute {
  path: string;
  label: string;
  permission: string;
}

/** Drives both the router and the sidebar. Add a screen here, once. */
export const NAV: readonly NavRoute[] = [
  { path: 'warehouses', label: 'Warehouses', permission: 'warehouse.all.view' },
  { path: 'pricing', label: 'Fair Price', permission: 'pricing.fair_price.view' },
  { path: 'listings', label: 'Listings', permission: 'listing.approve' },
  // TODO(STORY-ADMIN-*): farmers, orders, inventory, finance, audits.
];

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'warehouses' },

  {
    path: 'warehouses',
    canActivate: [permissionGuard('warehouse.all.view')],
    // TODO(STORY-ADMIN-02): replace with the real warehouses screen.
    loadComponent: async () =>
      (await import('./shared/data-table/data-table.component')).DataTableComponent,
  },

  {
    path: 'forbidden',
    loadComponent: async () =>
      (await import('./layout/shell.component')).ForbiddenComponent,
  },

  { path: '**', redirectTo: '' },
];
