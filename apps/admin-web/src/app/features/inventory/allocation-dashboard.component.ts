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
      .container {
        padding: var(--tohfa-space-xl);
        max-width: 1400px;
        margin: 0 auto;
      }
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
      }
      .subtitle {
        font-size: var(--tohfa-font-size-body-small);
        color: var(--tohfa-neutral-grey600);
        margin: var(--tohfa-space-xs) 0 0 0;
      }
      .filters {
        display: flex;
        gap: var(--tohfa-space-md);
        align-items: center;
        margin-bottom: var(--tohfa-space-xl);
        background: var(--tohfa-surface);
        padding: var(--tohfa-space-md);
        border-radius: var(--tohfa-radius-card-min);
      }
      select {
        min-height: 44px;
        padding: var(--tohfa-space-sm) var(--tohfa-space-md);
        border: 1px solid var(--tohfa-neutral-grey300);
        border-radius: var(--tohfa-radius-input);
        background: var(--tohfa-neutral-white);
        font-family: var(--tohfa-font-sans);
        font-size: var(--tohfa-font-size-body-small);
        color: var(--tohfa-on-surface);
      }
      select:disabled {
        background: var(--tohfa-surface);
        cursor: not-allowed;
      }
      .buckets-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: var(--tohfa-space-lg);
        margin-bottom: var(--tohfa-space-xxl);
      }
      .bucket-card {
        background: var(--tohfa-neutral-white);
        border-radius: var(--tohfa-radius-card-max);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        padding: var(--tohfa-space-xl);
        border-top: 4px solid var(--tohfa-primary);
        display: flex;
        flex-direction: column;
        gap: var(--tohfa-space-md);
      }
      .bucket-card-live {
        border-top-color: var(--tohfa-secondary);
      }
      .bucket-card-reserve {
        border-top-color: var(--tohfa-accent);
      }
      .bucket-card-buffer {
        border-top-color: var(--tohfa-neutral-grey500);
      }
      .bucket-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .bucket-title {
        font-size: var(--tohfa-font-size-title-2);
        font-weight: var(--tohfa-font-weight-bold);
        color: var(--tohfa-neutral-black);
        margin: 0;
      }
      .bucket-pct {
        font-size: var(--tohfa-font-size-footnote);
        font-weight: var(--tohfa-font-weight-semibold);
        color: var(--tohfa-neutral-grey600);
        background: var(--tohfa-surface);
        padding: 2px var(--tohfa-space-sm);
        border-radius: var(--tohfa-radius-badge);
      }
      .bucket-metric-main {
        display: flex;
        flex-direction: column;
      }
      .metric-main-value {
        font-size: 2rem;
        font-weight: var(--tohfa-font-weight-bold);
        color: var(--tohfa-primary);
      }
      .metric-main-label {
        font-size: var(--tohfa-font-size-footnote);
        color: var(--tohfa-neutral-grey600);
      }
      .bucket-metrics-sub {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: var(--tohfa-space-sm);
        border-top: 1px solid var(--tohfa-neutral-grey100);
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
        color: var(--tohfa-neutral-grey500);
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
        padding: 3px var(--tohfa-space-sm);
        border-radius: var(--tohfa-radius-badge);
        font-size: var(--tohfa-font-size-footnote);
        font-weight: var(--tohfa-font-weight-semibold);
      }
      .badge-online {
        background: var(--tohfa-status-success-bg);
        color: var(--tohfa-status-success-text);
      }
      .badge-live {
        background: var(--tohfa-status-warning-bg);
        color: var(--tohfa-status-warning-text);
      }
      .badge-reserve {
        background: var(--tohfa-surface);
        color: var(--tohfa-neutral-grey700);
      }
      .badge-buffer {
        background: var(--tohfa-surface);
        color: var(--tohfa-neutral-grey600);
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
      <div class="header">
        <div>
          <h1 class="title">Channel Allocation Dashboard</h1>
          <p class="subtitle">Real-time breakdown of stock across the 70/10/10/10 distribution channels (BR-12)</p>
        </div>
      </div>

      <div class="filters">
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
            <h2 class="bucket-title">Online Retail</h2>
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
        <div class="bucket-card bucket-card-live">
          <div class="bucket-header">
            <h2 class="bucket-title">Live Market</h2>
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
        <div class="bucket-card bucket-card-reserve">
          <div class="bucket-header">
            <h2 class="bucket-title">Strategic Reserve</h2>
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
        <div class="bucket-card bucket-card-buffer">
          <div class="bucket-header">
            <h2 class="bucket-title">Rounding Buffer</h2>
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
