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
      .container {
        padding: var(--tohfa-space-xl);
        max-width: 1400px;
        margin: 0 auto;
      }
      .page-header {
        margin-bottom: var(--tohfa-space-lg);
      }
      .title {
        font-size: var(--tohfa-font-size-title-1);
        font-weight: var(--tohfa-font-weight-bold);
        color: var(--tohfa-neutral-black);
        margin: 0;
      }
      .subtitle {
        font-size: var(--tohfa-font-size-body-small);
        color: var(--tohfa-neutral-grey600);
        margin: var(--tohfa-space-xs) 0 0 0;
      }
      .tabs {
        display: flex;
        gap: var(--tohfa-space-xs);
        border-bottom: 1px solid var(--tohfa-neutral-grey200);
        margin-bottom: var(--tohfa-space-xl);
      }
      .tab-btn {
        padding: var(--tohfa-space-sm) var(--tohfa-space-lg);
        font-family: var(--tohfa-font-sans);
        font-size: var(--tohfa-font-size-body-medium);
        font-weight: var(--tohfa-font-weight-semibold);
        color: var(--tohfa-neutral-grey600);
        background: transparent;
        border: none;
        border-bottom: 2px solid transparent;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: var(--tohfa-space-xs);
        transition: all 0.15s ease-in-out;
      }
      .tab-btn:hover {
        color: var(--tohfa-primary);
      }
      .tab-btn.active {
        color: var(--tohfa-primary);
        border-bottom-color: var(--tohfa-primary);
      }
      .tab-badge {
        padding: 2px var(--tohfa-space-xs);
        border-radius: var(--tohfa-radius-badge);
        font-size: var(--tohfa-font-size-caption);
        background: var(--tohfa-status-warning-bg);
        color: var(--tohfa-status-warning-text);
      }
      .table-card {
        background: var(--tohfa-neutral-white);
        border-radius: var(--tohfa-radius-card-max);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
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
        border-bottom: 1px solid var(--tohfa-neutral-grey100);
        font-size: var(--tohfa-font-size-body-small);
      }
      th {
        background: var(--tohfa-surface);
        font-weight: var(--tohfa-font-weight-semibold);
        color: var(--tohfa-neutral-grey700);
      }
      .badge {
        display: inline-flex;
        align-items: center;
        padding: 4px var(--tohfa-space-sm);
        border-radius: var(--tohfa-radius-badge);
        font-size: var(--tohfa-font-size-footnote);
        font-weight: var(--tohfa-font-weight-semibold);
      }
      .badge-active {
        background: var(--tohfa-status-success-bg);
        color: var(--tohfa-status-success-text);
      }
      .badge-depleted {
        background: var(--tohfa-status-warning-bg);
        color: var(--tohfa-status-warning-text);
      }
      .badge-expired {
        background: var(--tohfa-status-error-bg);
        color: var(--tohfa-status-error-text);
      }
      .low-stock-alert {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        color: var(--tohfa-status-warning-text);
        font-weight: var(--tohfa-font-weight-bold);
      }
      .action-link {
        color: var(--tohfa-primary);
        font-weight: var(--tohfa-font-weight-semibold);
        text-decoration: none;
      }
      .empty {
        padding: var(--tohfa-space-xxl);
        text-align: center;
        color: var(--tohfa-neutral-grey500);
      }
    `,
  ],
  template: `
    <div class="container">
      <div class="page-header">
        <h1 class="title">Warehouse & Inventory Management</h1>
        <p class="subtitle">Monitor stock ledger movements, active batches, allocations, and stock thresholds</p>
      </div>

      <div class="tabs">
        <button
          type="button"
          class="tab-btn"
          [class.active]="activeTab() === 'ledger'"
          (click)="activeTab.set('ledger')"
          *ngIf="canViewLedger()"
        >
          Stock Ledger
        </button>

        <button
          type="button"
          class="tab-btn"
          [class.active]="activeTab() === 'batches'"
          (click)="activeTab.set('batches')"
          *ngIf="canViewBatches()"
        >
          Batches
        </button>

        <button
          type="button"
          class="tab-btn"
          [class.active]="activeTab() === 'allocations'"
          (click)="activeTab.set('allocations')"
          *ngIf="canViewAllocations()"
        >
          Allocations
        </button>

        <button
          type="button"
          class="tab-btn"
          [class.active]="activeTab() === 'low-stock'"
          (click)="activeTab.set('low-stock')"
          *ngIf="canViewBatches()"
        >
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
