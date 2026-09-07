import { CommonModule } from '@angular/common';

import { Component, inject, signal, type OnInit } from '@angular/core';

import { FormsModule } from '@angular/forms';

import { RouterLink } from '@angular/router';

import { RbacService } from '../../core/rbac.service';

import { AllocationDashboardComponent } from './allocation-dashboard.component';

import {

  AdminInventoryService,

  type BatchSummary,

  type Warehouse,

} from './inventory.service';

import { StockLedgerListComponent } from './stock-ledger-list.component';
 
@Component({

  selector: 'tohfa-inventory-shell',

  standalone: true,

  imports: [

    CommonModule,

    FormsModule,

    RouterLink,

    StockLedgerListComponent,

    AllocationDashboardComponent,

  ],

  styles: [

    `

      /* ============================================================

         TOHFA DESIGN SYSTEM TOKENS (v1.0 — September 2026)

         Same token set as tohfa-allocation-dashboard, so both views

         render identically wherever they're used together.

         ============================================================ */

      :host {

        /* Brand */

        --tohfa-primary: #2f7d32;

        --tohfa-primary-dark: #1b5e20;

        --tohfa-primary-light: #e8f5e9;

        --tohfa-primary-pale: #f4fbf4;
 
        /* Semantic */

        --tohfa-success: #16a34a;

        --tohfa-success-light: #f0fdf4;

        --tohfa-warning: #d97706;

        --tohfa-warning-light: #fffbeb;

        --tohfa-error: #dc2626;

        --tohfa-error-light: #fef2f2;

        --tohfa-info: #2563eb;

        --tohfa-info-light: #eff6ff;

        --tohfa-purple: #7c3aed;

        --tohfa-purple-light: #f5f3ff;
 
        /* Neutral scale */

        --tohfa-neutral-950: #111827;

        --tohfa-neutral-900: #1f2937;

        --tohfa-neutral-800: #374151;

        --tohfa-neutral-700: #4b5563;

        --tohfa-neutral-600: #6b7280;

        --tohfa-neutral-500: #9ca3af;

        --tohfa-neutral-400: #d1d5db;

        --tohfa-neutral-300: #e5e7eb;

        --tohfa-neutral-200: #e5e7eb;

        --tohfa-neutral-100: #f3f4f6;

        --tohfa-neutral-50: #f9fafb;

        --tohfa-neutral-white: #ffffff;

        --tohfa-neutral-black: var(--tohfa-neutral-950);
 
        /* Surfaces */

        --tohfa-surface: var(--tohfa-neutral-50);

        --tohfa-on-surface: var(--tohfa-neutral-800);
 
        /* Typography */

        --tohfa-font-sans: 'Manrope', -apple-system, BlinkMacSystemFont, sans-serif;

        --tohfa-font-size-title-1: 24px; /* H2 */

        --tohfa-font-size-title-2: 20px; /* H3 */

        --tohfa-font-size-body-small: 14px;

        --tohfa-font-size-body-medium: 14px;

        --tohfa-font-size-footnote: 13px;

        --tohfa-font-size-caption: 12px;

        --tohfa-font-weight-semibold: 600;

        --tohfa-font-weight-bold: 700;
 
        /* Spacing (8px base grid) */

        --tohfa-space-xs: 4px;

        --tohfa-space-sm: 8px;

        --tohfa-space-md: 16px;

        --tohfa-space-lg: 24px;

        --tohfa-space-xl: 32px;

        --tohfa-space-xxl: 48px;
 
        /* Radius */

        --tohfa-radius-input: 8px;

        --tohfa-radius-card-min: 8px;

        --tohfa-radius-card-max: 12px;

        --tohfa-radius-badge: 999px;
 
        /* Elevation */

        --tohfa-shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.07), 0 1px 2px rgba(0, 0, 0, 0.04);

        --tohfa-shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04);
 
        display: block;

        font-family: var(--tohfa-font-sans);

        background: var(--tohfa-neutral-50);

      }
 
      * {

        box-sizing: border-box;

      }
 
      .container {

        padding: var(--tohfa-space-xl);

        max-width: 1400px;

        margin: 0 auto;

      }
 
      /* ---------- Page header ---------- */

      .page-header {

        display: flex;

        align-items: center;

        gap: var(--tohfa-space-md);

        margin-bottom: var(--tohfa-space-lg);

      }

      .page-header-icon {

        width: 44px;

        height: 44px;

        flex-shrink: 0;

        border-radius: var(--tohfa-radius-card-min);

        background: var(--tohfa-primary-light);

        color: var(--tohfa-primary-dark);

        display: flex;

        align-items: center;

        justify-content: center;

        font-size: 18px;

        font-weight: var(--tohfa-font-weight-bold);

      }

      .title {

        font-size: var(--tohfa-font-size-title-1);

        font-weight: var(--tohfa-font-weight-bold);

        color: var(--tohfa-neutral-black);

        margin: 0;

        letter-spacing: -0.01em;

      }

      .subtitle {

        font-size: var(--tohfa-font-size-body-small);

        color: var(--tohfa-neutral-600);

        margin: var(--tohfa-space-xs) 0 0 0;

      }
 
      /* ---------- Tabs ---------- */

      .tabs {

        display: flex;

        gap: var(--tohfa-space-xs);

        border-bottom: 1px solid var(--tohfa-neutral-200);

        margin-bottom: var(--tohfa-space-xl);

      }

      .tab-btn {

        padding: var(--tohfa-space-sm) var(--tohfa-space-lg);

        font-family: var(--tohfa-font-sans);

        font-size: var(--tohfa-font-size-body-medium);

        font-weight: var(--tohfa-font-weight-semibold);

        color: var(--tohfa-neutral-600);

        background: transparent;

        border: none;

        border-bottom: 2px solid transparent;

        cursor: pointer;

        display: inline-flex;

        align-items: center;

        gap: var(--tohfa-space-sm);

        transition: color 0.15s ease, border-color 0.15s ease;

      }

      .tab-btn:hover {

        color: var(--tohfa-neutral-900);

      }

      .tab-btn.active {

        color: var(--tohfa-neutral-900);

        border-bottom-color: var(--tohfa-primary);

      }

      .tab-dot {

        width: 8px;

        height: 8px;

        border-radius: 999px;

        flex-shrink: 0;

        background: var(--tohfa-neutral-300);

      }

      .tab-btn.active .tab-dot {

        background: var(--tohfa-primary);

      }

      .tab-dot-ledger {

        background: var(--tohfa-info-light);

      }

      .tab-btn.active .tab-dot-ledger {

        background: var(--tohfa-info);

      }

      .tab-dot-batches {

        background: var(--tohfa-purple-light);

      }

      .tab-btn.active .tab-dot-batches {

        background: var(--tohfa-purple);

      }

      .tab-dot-allocations {

        background: var(--tohfa-primary-light);

      }

      .tab-btn.active .tab-dot-allocations {

        background: var(--tohfa-primary);

      }

      .tab-dot-low-stock {

        background: var(--tohfa-warning-light);

      }

      .tab-btn.active .tab-dot-low-stock {

        background: var(--tohfa-warning);

      }

      .tab-badge {

        padding: 1px var(--tohfa-space-sm);

        border-radius: var(--tohfa-radius-badge);

        font-size: var(--tohfa-font-size-caption);

        font-weight: var(--tohfa-font-weight-semibold);

        background: var(--tohfa-warning-light);

        color: var(--tohfa-warning);

      }
 
      /* ---------- Table card ---------- */

      .table-card {

        background: var(--tohfa-neutral-white);

        border: 1px solid var(--tohfa-neutral-100);

        border-top: 3px solid var(--tohfa-primary);

        border-radius: var(--tohfa-radius-card-max);

        box-shadow: var(--tohfa-shadow-sm);

        overflow: hidden;

      }

      table {

        width: 100%;

        border-collapse: collapse;

      }

      th,

      td {

        padding: var(--tohfa-space-md) var(--tohfa-space-lg);

        text-align: left;

        border-bottom: 1px solid var(--tohfa-neutral-100);

        font-size: var(--tohfa-font-size-body-small);

        color: var(--tohfa-on-surface);

      }

      th {

        background: var(--tohfa-primary-pale);

        font-size: var(--tohfa-font-size-footnote);

        font-weight: var(--tohfa-font-weight-semibold);

        color: var(--tohfa-primary-dark);

        text-transform: uppercase;

        letter-spacing: 0.03em;

        border-bottom: 1px solid var(--tohfa-primary-light);

      }

      tbody tr {

        height: 56px;

        transition: background-color 0.12s ease;

      }

      tbody tr:nth-child(even) {

        background: var(--tohfa-neutral-50);

      }

      tbody tr:hover {

        background: var(--tohfa-primary-light);

      }

      tbody tr:last-child td {

        border-bottom: none;

      }

      td code {

        font-family: 'SFMono-Regular', Consolas, monospace;

        font-size: var(--tohfa-font-size-caption);

        background: var(--tohfa-primary-pale);

        color: var(--tohfa-primary-dark);

        padding: 2px 6px;

        border-radius: 4px;

      }
 
      /* ---------- Status badges (semantic — color carries meaning here) ---------- */

      .badge {

        display: inline-flex;

        align-items: center;

        padding: 3px var(--tohfa-space-sm);

        border-radius: var(--tohfa-radius-badge);

        font-size: var(--tohfa-font-size-caption);

        font-weight: var(--tohfa-font-weight-semibold);

        letter-spacing: 0.02em;

      }

      .badge-active {

        background: var(--tohfa-success-light);

        color: var(--tohfa-success);

      }

      .badge-depleted {

        background: var(--tohfa-warning-light);

        color: var(--tohfa-warning);

      }

      .badge-expired {

        background: var(--tohfa-error-light);

        color: var(--tohfa-error);

      }
 
      .low-stock-alert {

        display: inline-flex;

        align-items: center;

        gap: 4px;

        color: var(--tohfa-warning);

        font-weight: var(--tohfa-font-weight-bold);

      }
 
      .action-link {

        display: inline-block;

        color: var(--tohfa-primary-dark);

        background: var(--tohfa-primary-light);

        font-weight: var(--tohfa-font-weight-semibold);

        font-size: var(--tohfa-font-size-caption);

        padding: 4px var(--tohfa-space-sm);

        border-radius: var(--tohfa-radius-badge);

        text-decoration: none;
        text-align: center;

        transition: background-color 0.15s ease;

      }

      .action-link:hover {

        background: var(--tohfa-primary);

        color: var(--tohfa-neutral-white);

      }
 
      .empty {

        padding: var(--tohfa-space-xxl);

        text-align: center;

        color: var(--tohfa-neutral-500);

        font-size: var(--tohfa-font-size-body-small);

      }

    `,

  ],

  template: `
<div class="container">
<div class="page-header">
<div class="page-header-icon">W</div>
<div>
<h1 class="title">Warehouse & Inventory Management</h1>
<p class="subtitle">Monitor stock ledger movements, active batches, allocations, and stock thresholds</p>
</div>
</div>
 
      <div class="tabs">
<button

          type="button"

          class="tab-btn"

          [class.active]="activeTab() === 'ledger'"

          (click)="activeTab.set('ledger')"

          *ngIf="canViewLedger()"
>
<span class="tab-dot tab-dot-ledger"></span>

          Stock Ledger
</button>
 
        <button

          type="button"

          class="tab-btn"

          [class.active]="activeTab() === 'batches'"

          (click)="activeTab.set('batches')"

          *ngIf="canViewBatches()"
>
<span class="tab-dot tab-dot-batches"></span>

          Batches
</button>
 
        <button

          type="button"

          class="tab-btn"

          [class.active]="activeTab() === 'allocations'"

          (click)="activeTab.set('allocations')"

          *ngIf="canViewAllocations()"
>
<span class="tab-dot tab-dot-allocations"></span>

          Allocations
</button>
 
        <button

          type="button"

          class="tab-btn"

          [class.active]="activeTab() === 'low-stock'"

          (click)="activeTab.set('low-stock')"

          *ngIf="canViewBatches()"
>
<span class="tab-dot tab-dot-low-stock"></span>

          Low Stock Alerts
<span class="tab-badge" *ngIf="lowStockCount() > 0">{{ lowStockCount() }}</span>
</button>
</div>
 
      <!-- Tab 1: Stock Ledger -->
<div *ngIf="activeTab() === 'ledger'">
<tohfa-stock-ledger-list></tohfa-stock-ledger-list>
</div>
 
      <!-- Tab 2: Batches -->
<div *ngIf="activeTab() === 'batches'" class="table-card">
<table>
<thead>
<tr>
<th>Batch Code</th>
<th>Crop</th>
<th>Grade</th>
<th>Warehouse</th>
<th>Status</th>
<th>Received</th>
<th>Available</th>
<th>Received Date</th>
<th>Action</th>
</tr>
</thead>
<tbody>
<tr *ngFor="let b of batches()">
<td>
<code>{{ b.batchCode }}</code>
</td>
<td>{{ b.cropName || b.cropId }}</td>
<td>{{ b.grade }}</td>
<td>{{ b.warehouseName || b.warehouseId }}</td>
<td>
<span

                  class="badge"

                  [ngClass]="{

                    'badge-active': b.status === 'ACTIVE',

                    'badge-depleted': b.status === 'DEPLETED',

                    'badge-expired': b.status === 'EXPIRED'

                  }"
>

                  {{ b.status }}
</span>
</td>
<td>{{ b.qtyReceivedKg ?? b.qtyReceived ?? '0.000' }} kg</td>
<td>
<strong>{{ b.qtyAvailableKg ?? b.qtyAvailable ?? '0.000' }} kg</strong>
</td>
<td>{{ b.receivedOn | date: 'mediumDate' }}</td>
<td>
<a [routerLink]="['/inventory/batches', b.id]" class="action-link">View Details</a>
</td>
</tr>
<tr *ngIf="batches().length === 0">
<td colspan="9" class="empty">No inventory batches recorded.</td>
</tr>
</tbody>
</table>
</div>
 
      <!-- Tab 3: Allocations -->
<div *ngIf="activeTab() === 'allocations'">
<tohfa-allocation-dashboard></tohfa-allocation-dashboard>
</div>
 
      <!-- Tab 4: Low Stock Alerts -->
<div *ngIf="activeTab() === 'low-stock'" class="table-card">
<table>
<thead>
<tr>
<th>Batch Code</th>
<th>Crop</th>
<th>Grade</th>
<th>Warehouse</th>
<th>Available Qty</th>
<th>Initial Qty</th>
<th>Indicator</th>
<th>Action</th>
</tr>
</thead>
<tbody>
<tr *ngFor="let b of lowStockBatches()">
<td>
<code>{{ b.batchCode }}</code>
</td>
<td>{{ b.cropName || b.cropId }}</td>
<td>{{ b.grade }}</td>
<td>{{ b.warehouseName || b.warehouseId }}</td>
<td>
<span class="low-stock-alert">{{ b.qtyAvailable }} kg</span>
</td>
<td>{{ b.qtyReceived }} kg</td>
<td>
<span class="badge badge-depleted">LOW STOCK</span>
</td>
<td>
<a [routerLink]="['/inventory/batches', b.id]" class="action-link">Inspect Batch</a>
</td>
</tr>
<tr *ngIf="lowStockBatches().length === 0">
<td colspan="8" class="empty">All warehouse stock levels are healthy.</td>
</tr>
</tbody>
</table>
</div>
</div>

  `,

})

export class InventoryShellComponent implements OnInit {

  private readonly inventoryService = inject(AdminInventoryService);

  private readonly rbacService = inject(RbacService);
 
  readonly activeTab = signal<'ledger' | 'batches' | 'allocations' | 'low-stock'>('ledger');

  readonly batches = signal<BatchSummary[]>([]);

  readonly warehouses = signal<Warehouse[]>([]);
 
  readonly lowStockBatches = signal<BatchSummary[]>([]);

  readonly lowStockCount = signal<number>(0);
 
  /**

   * Low-stock threshold is read from system_config.low_stock_threshold_kg on the server

   * (S-28 specification gap: no source document defines this value — the client

   * must confirm). Defaults to null until loaded; batches are not filtered until

   * the threshold is known.

   */

  private lowStockThresholdKg: number | null = null;
 
  ngOnInit(): void {

    if (this.canViewBatches()) {

      this.loadThresholdThenBatches();

    }

  }
 
  canViewLedger(): boolean {

    return (

      this.rbacService.can('inventory.stock_ledger.view_own') ||

      this.rbacService.can('inventory.stock_ledger.view_all')

    );

  }
 
  canViewBatches(): boolean {

    return this.rbacService.can('inventory.batch.view');

  }
 
  canViewAllocations(): boolean {

    return this.rbacService.can('allocation.dashboard.view');

  }
 
  /**

   * Fetch low_stock_threshold_kg from system_config first, then load batches.

   * If the config endpoint is unavailable (e.g. pre-S-31 API), defaults to 50

   * and logs the gap so it is visible in the browser console.

   */

  loadThresholdThenBatches(): void {

    this.inventoryService.getSystemConfig('low_stock_threshold_kg').subscribe({

      next: (cfg) => {

        this.lowStockThresholdKg = typeof cfg.value === 'number' ? cfg.value : 50;

        this.loadBatches();

      },

      error: () => {

        // S-28 specification gap: low_stock_threshold_kg endpoint not yet available.

        // Falling back to system_config seed value of 50 kg until /v1/admin/config is built.

        console.warn(

          '[inventory-shell] Could not read low_stock_threshold_kg from system_config; ' +

          'defaulting to 50 kg. This is a known specification gap (S-28) — ' +

          'the client must confirm the correct threshold.',

        );

        this.lowStockThresholdKg = 50;

        this.loadBatches();

      },

    });

  }
 
  loadBatches(): void {

    const threshold = this.lowStockThresholdKg ?? 50;

    this.inventoryService.listBatches({ limit: 100 }).subscribe({

      next: (res) => {

        this.batches.set(res.items);

        const low = res.items.filter(

          (b) => Number(b.qtyAvailable) > 0 && Number(b.qtyAvailable) < threshold,

        );

        this.lowStockBatches.set(low);

        this.lowStockCount.set(low.length);

      },

      error: () => {

        this.batches.set([]);

        this.lowStockBatches.set([]);

        this.lowStockCount.set(0);

      },

    });

  }

}
 