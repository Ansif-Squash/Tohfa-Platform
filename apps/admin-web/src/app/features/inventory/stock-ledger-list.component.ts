import { CommonModule } from '@angular/common';
import { Component, inject, signal, type OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { RbacService } from '../../core/rbac.service';
import {
  AdminInventoryService,
  type StockLedgerEntry,
  type Warehouse,
} from './inventory.service';

/**
 * Centralized UI strings dictionary (reporting admin-web i18n gap).
 */
export const INVENTORY_STRINGS = {
  title: 'Stock Ledger',
  subtitle: 'Append-only inventory movement ledger across warehouses',
  warehouseFilter: 'Warehouse',
  allWarehouses: 'All Warehouses',
  movementFilter: 'Movement Type',
  allMovements: 'All Movements',
  exportButton: 'Export CSV',
  emptyMessage: 'No stock movements recorded for the selected criteria.',
  tableHeaders: {
    dateTime: 'Date / Time',
    warehouse: 'Warehouse',
    batch: 'Batch',
    movementType: 'Type',
    qtyDelta: 'Quantity Delta',
    balanceAfter: 'Balance After',
    remarks: 'Remarks',
  },
} as const;

@Component({
  selector: 'tohfa-stock-ledger-list',
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
        flex-wrap: wrap;
        margin-bottom: var(--tohfa-space-lg);
        background: var(--tohfa-surface);
        padding: var(--tohfa-space-md);
        border-radius: var(--tohfa-radius-card-min);
      }
      .filter-group {
        display: flex;
        flex-direction: column;
        gap: var(--tohfa-space-xs);
      }
      .filter-group label {
        font-size: var(--tohfa-font-size-footnote);
        font-weight: var(--tohfa-font-weight-semibold);
        color: var(--tohfa-neutral-grey700);
      }
      select,
      input {
        min-height: 44px;
        padding: var(--tohfa-space-sm) var(--tohfa-space-md);
        border: 1px solid var(--tohfa-neutral-grey300);
        border-radius: var(--tohfa-radius-input);
        background: var(--tohfa-neutral-white);
        font-family: var(--tohfa-font-sans);
        font-size: var(--tohfa-font-size-body-small);
        color: var(--tohfa-on-surface);
      }
      select:focus,
      input:focus {
        outline: none;
        border-color: var(--tohfa-primary);
        box-shadow: 0 0 0 2px var(--tohfa-primary-light);
      }
      select:disabled {
        background: var(--tohfa-surface);
        cursor: not-allowed;
      }
      .btn {
        min-height: 44px;
        padding: var(--tohfa-space-sm) var(--tohfa-space-lg);
        border-radius: var(--tohfa-radius-button);
        font-family: var(--tohfa-font-sans);
        font-weight: var(--tohfa-font-weight-semibold);
        font-size: var(--tohfa-font-size-body-small);
        cursor: pointer;
        border: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--tohfa-space-xs);
        transition: background 0.15s ease-in-out;
      }
      .btn-outline {
        background: var(--tohfa-neutral-white);
        color: var(--tohfa-primary);
        border: 1px solid var(--tohfa-primary);
      }
      .btn-outline:hover {
        background: var(--tohfa-surface);
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
        font-size: var(--tohfa-font-size-footnote);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .badge {
        display: inline-flex;
        align-items: center;
        padding: 4px var(--tohfa-space-sm);
        border-radius: var(--tohfa-radius-badge);
        font-size: var(--tohfa-font-size-footnote);
        font-weight: var(--tohfa-font-weight-semibold);
      }
      .badge-positive {
        background: var(--tohfa-status-success-bg);
        color: var(--tohfa-status-success-text);
      }
      .badge-negative {
        background: var(--tohfa-status-error-bg);
        color: var(--tohfa-status-error-text);
      }
      .badge-neutral {
        background: var(--tohfa-surface);
        color: var(--tohfa-neutral-grey700);
      }
      .empty {
        padding: var(--tohfa-space-xxl);
        text-align: center;
        color: var(--tohfa-neutral-grey500);
      }
      .pager {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: var(--tohfa-space-md);
        padding: var(--tohfa-space-lg);
        border-top: 1px solid var(--tohfa-neutral-grey100);
      }
    `,
  ],
  template: `
    <div class="container">
      <div class="header">
        <div>
          <h1 class="title">{{ strings.title }}</h1>
          <p class="subtitle">{{ strings.subtitle }}</p>
        </div>
        <button
          type="button"
          class="btn btn-outline"
          (click)="exportCsv()"
          [disabled]="entries().length === 0"
          *ngIf="canExport()"
        >
          {{ strings.exportButton }}
        </button>
      </div>

      <div class="filters">
        <div class="filter-group">
          <label>{{ strings.warehouseFilter }}</label>
          <select
            [(ngModel)]="selectedWarehouseId"
            (ngModelChange)="onFilterChange()"
            [disabled]="isWarehouseSelectorLocked()"
          >
            <option value="" *ngIf="!isWarehouseSelectorLocked()">{{ strings.allWarehouses }}</option>
            <option *ngFor="let wh of warehouses()" [value]="wh.id">{{ wh.name }} ({{ wh.code }})</option>
          </select>
        </div>

        <div class="filter-group">
          <label>{{ strings.movementFilter }}</label>
          <select [(ngModel)]="selectedMovementType" (ngModelChange)="onFilterChange()">
            <option value="">{{ strings.allMovements }}</option>
            <option value="RECEIPT">RECEIPT</option>
            <option value="DISPATCH">DISPATCH</option>
            <option value="ALLOCATION_ONLINE">ALLOCATION_ONLINE</option>
            <option value="ALLOCATION_LIVE_MARKET">ALLOCATION_LIVE_MARKET</option>
            <option value="ALLOCATION_RESERVE">ALLOCATION_RESERVE</option>
            <option value="ALLOCATION_BUFFER">ALLOCATION_BUFFER</option>
            <option value="RESERVATION_HOLD">RESERVATION_HOLD</option>
            <option value="RESERVATION_RELEASE">RESERVATION_RELEASE</option>
            <option value="CONSUMPTION">CONSUMPTION</option>
            <option value="WRITE_OFF">WRITE_OFF</option>
            <option value="ADJUSTMENT_UP">ADJUSTMENT_UP</option>
            <option value="ADJUSTMENT_DOWN">ADJUSTMENT_DOWN</option>
          </select>
        </div>

        <div class="filter-group">
          <label>From Date</label>
          <input type="date" [(ngModel)]="fromDate" (ngModelChange)="onFilterChange()" />
        </div>

        <div class="filter-group">
          <label>To Date</label>
          <input type="date" [(ngModel)]="toDate" (ngModelChange)="onFilterChange()" />
        </div>
      </div>

      <div class="table-card">
        <table>
          <thead>
            <tr>
              <th>{{ strings.tableHeaders.dateTime }}</th>
              <th>{{ strings.tableHeaders.warehouse }}</th>
              <th>{{ strings.tableHeaders.batch }}</th>
              <th>{{ strings.tableHeaders.movementType }}</th>
              <th>{{ strings.tableHeaders.qtyDelta }}</th>
              <th>{{ strings.tableHeaders.balanceAfter }}</th>
              <th>{{ strings.tableHeaders.remarks }}</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let entry of entries()">
              <td>{{ entry.createdAt | date: 'medium' }}</td>
              <td>{{ getWarehouseName(entry.warehouseId) }}</td>
              <td>
                <code>{{ entry.batchCode || entry.batchId }}</code>
              </td>
              <td>
                <span class="badge badge-neutral">{{ entry.movementType }}</span>
              </td>
              <td>
                <span
                  class="badge"
                  [ngClass]="{
                    'badge-positive': isPositive(entry.qtyDelta),
                    'badge-negative': !isPositive(entry.qtyDelta)
                  }"
                >
                  {{ entry.qtyDelta }} kg
                </span>
              </td>
              <td>
                <strong>{{ entry.balanceAfter }} kg</strong>
              </td>
              <td>{{ entry.remarks || '—' }}</td>
            </tr>
            <tr *ngIf="entries().length === 0">
              <td colspan="7" class="empty">{{ strings.emptyMessage }}</td>
            </tr>
          </tbody>
        </table>

        <div class="pager" *ngIf="hasMore() || cursorHistory.length > 0">
          <button
            type="button"
            class="btn btn-outline"
            [disabled]="cursorHistory.length === 0"
            (click)="previousPage()"
          >
            Previous
          </button>
          <button
            type="button"
            class="btn btn-outline"
            [disabled]="!hasMore()"
            (click)="nextPage()"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  `,
})
export class StockLedgerListComponent implements OnInit {
  private readonly inventoryService = inject(AdminInventoryService);
  private readonly rbacService = inject(RbacService);
  private readonly authService = inject(AuthService);

  readonly strings = INVENTORY_STRINGS;
  readonly entries = signal<StockLedgerEntry[]>([]);
  readonly warehouses = signal<Warehouse[]>([]);
  readonly hasMore = signal<boolean>(false);
  readonly nextCursor = signal<string | null>(null);

  selectedWarehouseId = '';
  selectedMovementType = '';
  fromDate = '';
  toDate = '';
  cursorHistory: string[] = [];
  currentCursor: string | undefined = undefined;

  ngOnInit(): void {
    this.loadWarehouses();
  }

  canExport(): boolean {
    return this.rbacService.can('report.export.file');
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
        this.loadLedger();
      },
      error: () => this.loadLedger(),
    });
  }

  loadLedger(): void {
    this.inventoryService
      .listStockLedger({
        warehouseId: this.selectedWarehouseId || undefined,
        movementType: this.selectedMovementType || undefined,
        fromDate: this.fromDate || undefined,
        toDate: this.toDate || undefined,
        cursor: this.currentCursor,
        limit: 20,
      })
      .subscribe({
        next: (res) => {
          this.entries.set(res.items);
          this.nextCursor.set(res.page.nextCursor);
          this.hasMore.set(res.page.hasMore);
        },
        error: () => {
          this.entries.set([]);
          this.nextCursor.set(null);
          this.hasMore.set(false);
        },
      });
  }

  onFilterChange(): void {
    this.cursorHistory = [];
    this.currentCursor = undefined;
    this.loadLedger();
  }

  nextPage(): void {
    if (!this.nextCursor()) return;
    if (this.currentCursor) {
      this.cursorHistory.push(this.currentCursor);
    }
    this.currentCursor = this.nextCursor()!;
    this.loadLedger();
  }

  previousPage(): void {
    this.currentCursor = this.cursorHistory.pop();
    this.loadLedger();
  }

  getWarehouseName(warehouseId: string): string {
    const found = this.warehouses().find((w) => w.id === warehouseId);
    return found ? `${found.name} (${found.code})` : warehouseId;
  }

  isPositive(qtyDelta: string): boolean {
    return !qtyDelta.startsWith('-');
  }

  exportCsv(): void {
    this.inventoryService.exportStockLedgerCsv(this.entries());
  }
}
