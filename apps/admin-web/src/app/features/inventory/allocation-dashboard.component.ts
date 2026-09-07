import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal, type OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { RbacService } from '../../core/rbac.service';
import {
  AdminInventoryService,
  type AllocationItem,
  type Warehouse,
} from './inventory.service';

@Component({
  selector: 'tohfa-allocation-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [
    `
      /* ============================================================
         TOHFA DESIGN SYSTEM TOKENS (v1.0 — September 2026)
         Scoped to this component so it renders correctly even if a
         global token sheet isn't loaded yet.
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
      
        margin: 0 auto;
      }

      /* ---------- Header ---------- */
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--tohfa-space-lg);
        flex-wrap: wrap;
        gap: var(--tohfa-space-md);
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

      /* ---------- Filters ---------- */
      .filters {
        display: flex;
        gap: var(--tohfa-space-md);
        align-items: center;
        margin-bottom: var(--tohfa-space-xl);
        background: var(--tohfa-neutral-white);
        border: 1px solid var(--tohfa-neutral-100);
        padding: var(--tohfa-space-md);
        border-radius: var(--tohfa-radius-card-min);
      }
      .filter-label {
        font-size: var(--tohfa-font-size-footnote);
        font-weight: var(--tohfa-font-weight-semibold);
        color: var(--tohfa-neutral-700);
      }
      select {
        min-height: 44px;
        padding: var(--tohfa-space-sm) var(--tohfa-space-md);
        border: 1px solid var(--tohfa-neutral-300);
        border-radius: var(--tohfa-radius-input);
        background: var(--tohfa-neutral-white);
        font-family: var(--tohfa-font-sans);
        font-size: var(--tohfa-font-size-body-small);
        color: var(--tohfa-on-surface);
        transition: border-color 0.15s ease, box-shadow 0.15s ease;
      }
      select:focus-visible {
        outline: none;
        border-color: var(--tohfa-primary);
        box-shadow: 0 0 0 3px var(--tohfa-primary-light);
      }
      select:disabled {
        background: var(--tohfa-neutral-50);
        color: var(--tohfa-neutral-500);
        cursor: not-allowed;
      }

      /* ---------- Bucket cards ---------- */
      .buckets-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: var(--tohfa-space-lg);
        margin-bottom: var(--tohfa-space-xxl);
      }
      .bucket-card {
        background: var(--tohfa-neutral-white);
        border: 1px solid var(--tohfa-neutral-100);
        border-radius: var(--tohfa-radius-card-max);
        box-shadow: var(--tohfa-shadow-sm);
        padding: var(--tohfa-space-lg);
        display: flex;
        flex-direction: column;
        gap: var(--tohfa-space-md);
        transition: box-shadow 0.15s ease, border-color 0.15s ease;
        border-top:6px solid green;
      }
      .bucket-card:hover {
        box-shadow: var(--tohfa-shadow-md);
     
      }
      .bucket-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: var(--tohfa-space-sm);
      }
      .bucket-header-text {
        display: flex;
        align-items: center;
        gap: var(--tohfa-space-sm);
      }
      .bucket-icon {
        width: 36px;
        height: 36px;
        flex-shrink: 0;
        border-radius: var(--tohfa-radius-card-min);
        background: var(--tohfa-primary-light);
        color: var(--tohfa-primary-dark);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 15px;
        font-weight: var(--tohfa-font-weight-bold);
      }
      .bucket-title {
        font-size: var(--tohfa-font-size-title-2);
        font-weight: var(--tohfa-font-weight-bold);
        color: var(--tohfa-neutral-black);
        margin: 0;
      }
      .bucket-pct {
        font-size: var(--tohfa-font-size-caption);
        font-weight: var(--tohfa-font-weight-semibold);
        color: var(--tohfa-primary-dark);
        background: var(--tohfa-primary-light);
        padding: 2px var(--tohfa-space-sm);
        border-radius: var(--tohfa-radius-badge);
        white-space: nowrap;
      }
      .bucket-metric-main {
        display: flex;
        flex-direction: column;
      }
      .metric-main-value {
        font-size: 32px;
        font-weight: var(--tohfa-font-weight-bold);
        color: var(--tohfa-neutral-black);
        line-height: 1.2;
      }
      .metric-main-label {
        font-size: var(--tohfa-font-size-footnote);
        color: var(--tohfa-neutral-600);
        margin-top: 2px;
      }
      .bucket-metrics-sub {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: var(--tohfa-space-sm);
        border-top: 1px solid var(--tohfa-neutral-100);
        padding-top: var(--tohfa-space-md);
      }
      .sub-metric {
        display: flex;
        flex-direction: column;
      }
      .sub-value {
        font-size: var(--tohfa-font-size-body-small);
        font-weight: var(--tohfa-font-weight-semibold);
        color: var(--tohfa-neutral-black);
      }
      .sub-label {
        font-size: var(--tohfa-font-size-caption);
        color: var(--tohfa-neutral-500);
        margin-top: 2px;
      }

      /* ---------- Table ---------- */
      .table-card {
        background: var(--tohfa-neutral-white);
        border: 1px solid var(--tohfa-neutral-100);
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
        background: var(--tohfa-surface);
        font-size: var(--tohfa-font-size-footnote);
        font-weight: var(--tohfa-font-weight-semibold);
        color: var(--tohfa-neutral-700);
        text-transform: uppercase;
        letter-spacing: 0.03em;
      }
      tbody tr {
        height: 56px;
        transition: background-color 0.1s ease;
      }
      tbody tr:hover {
        background: var(--tohfa-primary-pale);
      }
      td code {
        font-family: 'SFMono-Regular', Consolas, monospace;
        font-size: var(--tohfa-font-size-caption);
        background: var(--tohfa-neutral-100);
        color: var(--tohfa-neutral-700);
        padding: 2px 6px;
        border-radius: 4px;
      }

      .badge {
        display: inline-block;
        padding: 3px var(--tohfa-space-sm);
        border-radius: var(--tohfa-radius-badge);
        font-size: var(--tohfa-font-size-caption);
        font-weight: var(--tohfa-font-weight-semibold);
        letter-spacing: 0.02em;
      }
      .badge-online {
        background: var(--tohfa-primary);
        color: var(--tohfa-neutral-white);
      }
      .badge-live {
        background: var(--tohfa-primary-light);
        color: var(--tohfa-primary-dark);
      }
      .badge-reserve {
        background: var(--tohfa-neutral-800);
        color: var(--tohfa-neutral-white);
      }
      .badge-buffer {
        background: var(--tohfa-neutral-100);
        color: var(--tohfa-neutral-600);
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
      <div class="header">
        <div>
          <h1 class="title">Channel Allocation Dashboard</h1>
          <p class="subtitle">Real-time breakdown of stock across the 70/10/10/10 distribution channels (BR-12)</p>
        </div>
      </div>

      <div class="filters">
        <span class="filter-label">Warehouse</span>
        <select
          [(ngModel)]="selectedWarehouseId"
          (ngModelChange)="loadAllocations()"
          [disabled]="isWarehouseSelectorLocked()"
        >
          <option value="" *ngIf="!isWarehouseSelectorLocked()">All Warehouses</option>
          <option *ngFor="let wh of warehouses()" [value]="wh.id">{{ wh.name }} ({{ wh.code }})</option>
        </select>
      </div>

      <div class="buckets-grid">
        <!-- ONLINE -->
        <div class="bucket-card">
          <div class="bucket-header">
            <div class="bucket-header-text">
              <span class="bucket-icon">O</span>
              <h2 class="bucket-title">Online Retail</h2>
            </div>
            <span class="bucket-pct">70% Target</span>
          </div>
          <div class="bucket-metric-main">
            <span class="metric-main-value">{{ onlineMetrics().available }} kg</span>
            <span class="metric-main-label">Available for E-Commerce</span>
          </div>
          <div class="bucket-metrics-sub">
            <div class="sub-metric">
              <span class="sub-value">{{ onlineMetrics().allocated }} kg</span>
              <span class="sub-label">Allocated</span>
            </div>
            <div class="sub-metric">
              <span class="sub-value">{{ onlineMetrics().consumed }} kg</span>
              <span class="sub-label">Consumed</span>
            </div>
            <div class="sub-metric">
              <span class="sub-value">{{ onlineMetrics().reserved }} kg</span>
              <span class="sub-label">Reserved</span>
            </div>
          </div>
        </div>

        <!-- LIVE MARKET -->
        <div class="bucket-card">
          <div class="bucket-header">
            <div class="bucket-header-text">
              <span class="bucket-icon">L</span>
              <h2 class="bucket-title">Live Market</h2>
            </div>
            <span class="bucket-pct">10% Target</span>
          </div>
          <div class="bucket-metric-main">
            <span class="metric-main-value">{{ liveMarketMetrics().available }} kg</span>
            <span class="metric-main-label">Available for Market Days</span>
          </div>
          <div class="bucket-metrics-sub">
            <div class="sub-metric">
              <span class="sub-value">{{ liveMarketMetrics().allocated }} kg</span>
              <span class="sub-label">Allocated</span>
            </div>
            <div class="sub-metric">
              <span class="sub-value">{{ liveMarketMetrics().consumed }} kg</span>
              <span class="sub-label">Consumed</span>
            </div>
            <div class="sub-metric">
              <span class="sub-value">{{ liveMarketMetrics().reserved }} kg</span>
              <span class="sub-label">Reserved</span>
            </div>
          </div>
        </div>

        <!-- RESERVE -->
        <div class="bucket-card">
          <div class="bucket-header">
            <div class="bucket-header-text">
              <span class="bucket-icon">R</span>
              <h2 class="bucket-title">Strategic Reserve</h2>
            </div>
            <span class="bucket-pct">10% Target</span>
          </div>
          <div class="bucket-metric-main">
            <span class="metric-main-value">{{ reserveMetrics().available }} kg</span>
            <span class="metric-main-label">Held in Reserve (BR-13)</span>
          </div>
          <div class="bucket-metrics-sub">
            <div class="sub-metric">
              <span class="sub-value">{{ reserveMetrics().allocated }} kg</span>
              <span class="sub-label">Allocated</span>
            </div>
            <div class="sub-metric">
              <span class="sub-value">{{ reserveMetrics().consumed }} kg</span>
              <span class="sub-label">Consumed</span>
            </div>
            <div class="sub-metric">
              <span class="sub-value">{{ reserveMetrics().reserved }} kg</span>
              <span class="sub-label">Reserved</span>
            </div>
          </div>
        </div>

        <!-- BUFFER -->
        <div class="bucket-card">
          <div class="bucket-header">
            <div class="bucket-header-text">
              <span class="bucket-icon">B</span>
              <h2 class="bucket-title">Rounding Buffer</h2>
            </div>
            <span class="bucket-pct">10% + Remainder</span>
          </div>
          <div class="bucket-metric-main">
            <span class="metric-main-value">{{ bufferMetrics().available }} kg</span>
            <span class="metric-main-label">Remainder Buffer (BR-12a)</span>
          </div>
          <div class="bucket-metrics-sub">
            <div class="sub-metric">
              <span class="sub-value">{{ bufferMetrics().allocated }} kg</span>
              <span class="sub-label">Allocated</span>
            </div>
            <div class="sub-metric">
              <span class="sub-value">{{ bufferMetrics().consumed }} kg</span>
              <span class="sub-label">Consumed</span>
            </div>
            <div class="sub-metric">
              <span class="sub-value">{{ bufferMetrics().reserved }} kg</span>
              <span class="sub-label">Reserved</span>
            </div>
          </div>
        </div>
      </div>

      <div class="table-card">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Batch Code</th>
              <th>Channel</th>
              <th>Allocated</th>
              <th>Consumed</th>
              <th>Reserved</th>
              <th>Available</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of allocations()">
              <td>{{ item.allocationDate || (item.createdAt | date: 'mediumDate') || '—' }}</td>
              <td>
                <code>{{ item.batchCode || item.batchId }}</code>
                <span *ngIf="item.cropName" style="margin-left: 6px; font-weight: 500;">({{ item.cropName }})</span>
              </td>
              <td>
                <span
                  class="badge"
                  [ngClass]="{
                    'badge-online': item.channel === 'ONLINE',
                    'badge-live': item.channel === 'LIVE_MARKET',
                    'badge-reserve': item.channel === 'RESERVE',
                    'badge-buffer': item.channel === 'BUFFER'
                  }"
                >
                  {{ item.channel }}
                </span>
              </td>
              <td>{{ item.allocatedQtyKg ?? item.allocatedQty ?? '0.000' }} kg</td>
              <td>{{ item.consumedQtyKg ?? item.consumedQty ?? '0.000' }} kg</td>
              <td>{{ item.reservedQtyKg ?? item.reservedQty ?? '0.000' }} kg</td>
              <td>
                <strong>{{ item.availableQtyKg ?? item.availableQty ?? '0.000' }} kg</strong>
              </td>
            </tr>
            <tr *ngIf="allocations().length === 0">
              <td colspan="7" class="empty">No channel allocations found for this selection.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class AllocationDashboardComponent implements OnInit {
  private readonly inventoryService = inject(AdminInventoryService);
  private readonly rbacService = inject(RbacService);
  private readonly authService = inject(AuthService);

  readonly allocations = signal<AllocationItem[]>([]);
  readonly warehouses = signal<Warehouse[]>([]);
  selectedWarehouseId = '';

  readonly onlineMetrics = computed(() => this.computeBucket('ONLINE'));
  readonly liveMarketMetrics = computed(() => this.computeBucket('LIVE_MARKET'));
  readonly reserveMetrics = computed(() => this.computeBucket('RESERVE'));
  readonly bufferMetrics = computed(() => this.computeBucket('BUFFER'));

  ngOnInit(): void {
    this.loadWarehouses();
  }

  isWarehouseSelectorLocked(): boolean {
    const user = this.authService.user();
    const subWhRole = user?.roles.find((r) => r.code === 'SUB_WH_ADMIN');
    return !!subWhRole?.warehouseId;
  }

  loadWarehouses(): void {
    this.inventoryService.listWarehouses().subscribe({
      next: (res) => {
        this.warehouses.set(res.items);
        const user = this.authService.user();
        const subWhRole = user?.roles.find((r) => r.code === 'SUB_WH_ADMIN');
        if (subWhRole?.warehouseId) {
          this.selectedWarehouseId = subWhRole.warehouseId;
        }
        this.loadAllocations();
      },
      error: () => this.loadAllocations(),
    });
  }

  loadAllocations(): void {
    this.inventoryService
      .listAllocations({
        warehouseId: this.selectedWarehouseId || undefined,
        limit: 100,
      })
      .subscribe({
        next: (res) => this.allocations.set(res.items),
        error: () => this.allocations.set([]),
      });
  }

  private computeBucket(channel: string) {
    const items = this.allocations().filter((a) => a.channel === channel);
    const parseQty = (val: unknown) => {
      const n = Number(val);
      return isNaN(n) ? 0 : n;
    };
    const allocated = items.reduce(
      (sum, a) => sum + parseQty(a.allocatedQtyKg ?? a.allocatedQty),
      0,
    );
    const consumed = items.reduce(
      (sum, a) => sum + parseQty(a.consumedQtyKg ?? a.consumedQty),
      0,
    );
    const reserved = items.reduce(
      (sum, a) => sum + parseQty(a.reservedQtyKg ?? a.reservedQty),
      0,
    );
    const available = items.reduce(
      (sum, a) => sum + parseQty(a.availableQtyKg ?? a.availableQty),
      0,
    );

    return {
      allocated: allocated.toFixed(3),
      consumed: consumed.toFixed(3),
      reserved: reserved.toFixed(3),
      available: available.toFixed(3),
    };
  }
}