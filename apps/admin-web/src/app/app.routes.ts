import type { Routes } from '@angular/router';
import { authGuard, guestGuard, permissionGuard } from './core/permission.guard';

export interface NavRoute {
  path: string;
  label: string;
  /** Primary permission code gating the screen (docs/rbac.json). */
  permission: string;
  /**
   * Alternative permission codes that ALSO grant the screen — the sidebar shows
   * the entry when ANY of them is granted. Example: the stock ledger is
   * reachable via `inventory.stock_ledger.view_all` (warehouse leadership) and
   * `inventory.stock_ledger.view_own` (Sub Warehouse Admin, BR-30). Every code
   * listed here must exist in docs/rbac.json.
   */
  anyPermissions?: readonly string[];
}

/** Drives both the router and the sidebar. Add a screen here, once. */
export const NAV: readonly NavRoute[] = [
  { path: 'farmer-applications', label: 'Farmer Applications', permission: 'farmer.application.list_pending' },
  { path: 'warehouses', label: 'Warehouses', permission: 'warehouse.all.view' },
  {
    path: 'inventory/stock-ledger',
    label: 'Stock Ledger',
    permission: 'inventory.stock_ledger.view_all',
    anyPermissions: ['inventory.stock_ledger.view_own'],
  },
  { path: 'inventory/batches', label: 'Inventory Batches', permission: 'inventory.batch.view' },
  { path: 'inventory/allocations', label: 'Allocation Dashboard', permission: 'allocation.dashboard.view' },
  { path: 'inventory/low-stock', label: 'Low Stock', permission: 'inventory.batch.view' },
  { path: 'pricing', label: 'Fair Price', permission: 'pricing.fair_price.view' },
  { path: 'listings', label: 'Listings', permission: 'listing.queue.view_pending' },
  { path: 'goods-receipts', label: 'Goods Receipts', permission: 'inventory.goods_receipt.record' },
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
        canActivate: [permissionGuard('listing.approve')],
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

      // S-28 admin warehouse screens — each registered once in NAV above.
      {
        path: 'inventory/stock-ledger',
        canActivate: [
          permissionGuard(['inventory.stock_ledger.view_all', 'inventory.stock_ledger.view_own']),
        ],
        loadComponent: async () =>
          (await import('./features/inventory/stock-ledger.component')).StockLedgerComponent,
      },
      {
        path: 'inventory/batches',
        canActivate: [permissionGuard('inventory.batch.view')],
        loadComponent: async () =>
          (await import('./features/inventory/batches-list.component')).BatchesListComponent,
      },
      {
        path: 'inventory/batches/:id',
        canActivate: [permissionGuard('inventory.batch.view')],
        loadComponent: async () =>
          (await import('./features/inventory/batch-detail.component')).BatchDetailComponent,
      },
      {
        path: 'inventory/allocations',
        canActivate: [permissionGuard('allocation.dashboard.view')],
        loadComponent: async () =>
          (await import('./features/inventory/allocation-dashboard.component'))
            .AllocationDashboardComponent,
      },
      {
        path: 'inventory/low-stock',
        canActivate: [permissionGuard('inventory.batch.view')],
        loadComponent: async () =>
          (await import('./features/inventory/low-stock.component')).LowStockComponent,
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
