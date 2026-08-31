import type { Routes } from '@angular/router';
import { authGuard, guestGuard, permissionGuard } from './core/permission.guard';

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
  { path: 'listings', label: 'Listings', permission: 'listing.queue.view_pending' },
  { path: 'goods-receipts', label: 'Goods Receipts', permission: 'inventory.goods_receipt.record' },
  { path: 'inventory', label: 'Inventory & Stock', permission: 'inventory.stock_ledger.view_own' },
  { path: 'allocations', label: 'Allocations', permission: 'allocation.dashboard.view' },
  { path: 'wallet/cash-topup', label: 'Cash Top-up', permission: 'wallet.cash_topup.process' },
];

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: async () =>
      (await import('./features/auth/login.component')).LoginComponent,
  },

  {
    path: '',
    canActivate: [authGuard],
    loadComponent: async () =>
      (await import('./layout/shell.component')).ShellComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'farmer-applications' },

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
        canActivate: [permissionGuard('listing.queue.view_pending')],
        loadComponent: async () =>
          (await import('./features/listings/listings-queue.component')).ListingsQueueComponent,
      },

      {
        path: 'goods-receipts',
        canActivate: [permissionGuard('inventory.goods_receipt.record')],
        loadComponent: async () =>
          (await import('./features/goods-receipt/goods-receipt-list.component'))
            .GoodsReceiptListComponent,
      },

      {
        path: 'inventory',
        canActivate: [permissionGuard('inventory.stock_ledger.view_own')],
        loadComponent: async () =>
          (await import('./features/inventory/inventory-shell.component'))
            .InventoryShellComponent,
      },

      {
        path: 'inventory/batches/:id',
        canActivate: [permissionGuard('inventory.batch.view')],
        loadComponent: async () =>
          (await import('./features/inventory/batch-detail.component'))
            .BatchDetailComponent,
      },

      {
        path: 'allocations',
        canActivate: [permissionGuard('allocation.dashboard.view')],
        loadComponent: async () =>
          (await import('./features/inventory/allocation-dashboard.component'))
            .AllocationDashboardComponent,
      },

      {
        path: 'wallet/cash-topup',
        canActivate: [permissionGuard('wallet.cash_topup.process')],
        loadComponent: async () =>
          (await import('./features/wallet/cash-topup.component')).CashTopupComponent,
      },

      {
        path: 'forbidden',
        loadComponent: async () =>
          (await import('./layout/shell.component')).ForbiddenComponent,
      },
    ],
  },

  { path: '**', redirectTo: '' },
];
