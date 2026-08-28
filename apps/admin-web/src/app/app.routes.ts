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
  { path: 'farmer-applications', label: 'Farmer Applications', permission: 'farmer.application.list_pending' },
  { path: 'warehouses', label: 'Warehouses', permission: 'warehouse.all.view' },
  { path: 'pricing', label: 'Fair Price', permission: 'pricing.fair_price.view' },
  { path: 'listings', label: 'Listings', permission: 'listing.approve' },
];

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'farmer-applications' },

  {
    path: 'login',
    loadComponent: async () =>
      (await import('./features/auth/login.component')).LoginComponent,
  },

  {
    path: 'farmer-applications',
    canActivate: [permissionGuard('farmer.application.list_pending')],
    loadComponent: async () =>
      (await import('./features/farmer-applications/farmer-applications-list.component'))
        .FarmerApplicationsListComponent,
  },

  {
    path: 'farmer-applications/:id',
    canActivate: [permissionGuard('farmer.application.view')],
    loadComponent: async () =>
      (await import('./features/farmer-applications/farmer-application-detail.component'))
        .FarmerApplicationDetailComponent,
  },

  {
    path: 'warehouses',
    canActivate: [permissionGuard('warehouse.all.view')],
    loadComponent: async () =>
      (await import('./shared/data-table/data-table.component')).DataTableComponent,
  },

  {
    path: 'pricing',
    canActivate: [permissionGuard('pricing.fair_price.view')],
    loadComponent: async () =>
      (await import('./features/pricing/pricing-shell.component')).PricingShellComponent,
  },

  {
    path: 'listings',
    canActivate: [permissionGuard('listing.approve')],
    loadComponent: async () =>
      (await import('./features/listings/listings-queue.component')).ListingsQueueComponent,
  },

  {
    path: 'forbidden',
    loadComponent: async () =>
      (await import('./layout/shell.component')).ForbiddenComponent,
  },

  { path: '**', redirectTo: '' },
];
