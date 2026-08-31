/**
 * S-28 screen 1 — Stock Ledger.
 *
 * A filterable, server-side-paged table over the append-only stock ledger
 * (BR-37). Filters (warehouse, batch, movement type, date range) are sent as
 * query parameters — rows are never filtered in the browser, and paging uses
 * the spec's cursor parameters because the ledger is unbounded.
 *
 * Scope trap (BR-30): for a Sub Warehouse Admin the warehouse selector is
 * locked to the assigned warehouse through WarehouseScopeService, and the CSV
 * export reuses the SAME scoped rows the table rendered — the export path
 * cannot drop the warehouse filter because it builds from the same query.
 */
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  type OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RbacService } from '../../core/rbac.service';
import { type Column, DataTableComponent, type Row } from '../../shared/data-table/data-table.component';
import {
  InventoryService,
  type StockLedgerEntry,
  type StockMovementType,
} from './inventory.service';
import { INVENTORY_STRINGS } from './inventory.strings';
import { WarehouseScopeService } from './warehouse-scope.service';

const MOVEMENT_TYPES: readonly StockMovementType[] = [
  'RECEIPT',
  'SALE',
  'TRANSFER_OUT',
  'TRANSFER_IN',
  'ADJUSTMENT',
  'WASTAGE',
  'RETURN_IN',
  'RESERVATION',
  'RELEASE',
];

@Component({
  selector: 'tohfa-stock-ledger',
  standalone: true,
  imports: [CommonModule, FormsModule, DataTableComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        display: block;
      }
      .page-container {
        display: flex;
        flex-direction: column;
        gap: var(--tohfa-space-lg);
      }
      .header-toolbar {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        flex-wrap: wrap;
        gap: var(--tohfa-space-md);
      }
      .title-group h1 {
        font-size: var(--tohfa-font-size-headline);
        font-weight: var(--tohfa-font-weight-bold);
        color: var(--tohfa-on-surface);
        margin: 0 0 var(--tohfa-space-xs) 0;
      }
      .title-group p {
        color: var(--tohfa-neutral-grey700);
        margin: 0;
        font-size: var(--tohfa-font-size-body-small);
      }
      .filters {
        display: flex;
        gap: var(--tohfa-space-sm);
        flex-wrap: wrap;
        align-items: flex-end;
      }
      .filters label {
        display: flex;
        flex-direction: column;
        gap: var(--tohfa-space-xs);
        font-size: var(--tohfa-font-size-caption);
        color: var(--tohfa-neutral-grey700);
      }
      .filters select,
      .filters input {
        padding: var(--tohfa-space-xs) var(--tohfa-space-md);
        border: 1px solid var(--tohfa-neutral-grey300);
        border-radius: var(--tohfa-radius-input);
        font-size: var(--tohfa-font-size-body-small);
        font-family: var(--tohfa-font-sans);
        min-height: var(--tohfa-min-touch-target);
        background: var(--tohfa-neutral-white);
        color: var(--tohfa-on-surface);
      }
      .filters select:disabled {
        background: var(--tohfa-neutral-grey100);
        cursor: not-allowed;
      }
      .locked-hint {
        font-size: var(--tohfa-font-size-caption);
        color: var(--tohfa-neutral-grey700);
      }
      .btn-primary {
        background: var(--tohfa-primary);
        color: var(--tohfa-neutral-white);
        padding: var(--tohfa-space-sm) var(--tohfa-space-lg);
        border: none;
        border-radius: var(--tohfa-radius-button);
        font-weight: var(--tohfa-font-weight-semibold);
        cursor: pointer;
        font-size: var(--tohfa-font-size-body-small);
      }
      .btn-primary:hover {
        background: var(--tohfa-primary-pressed);
      }
      .btn-secondary {
        background: var(--tohfa-neutral-grey100);
        color: var(--tohfa-on-surface);
        padding: var(--tohfa-space-sm) var(--tohfa-space-lg);
        border: 1px solid var(--tohfa-neutral-grey300);
        border-radius: var(--tohfa-radius-button);
        cursor: pointer;
        font-weight: var(--tohfa-font-weight-semibold);
        font-size: var(--tohfa-font-size-body-small);
      }
      .error {
        color: var(--tohfa-danger);
        font-size: var(--tohfa-font-size-body-small);
      }
    `,
  ],
  template: `
    <div class="page-container">
      <div class="header-toolbar">
        <div class="title-group">
          <h1>{{ s.stockLedger.title }}</h1>
          <p>{{ s.stockLedger.subtitle }}</p>
        </div>
        <button
          id="ledger-export-btn"
          type="button"
          class="btn-secondary"
          *ngIf="rbac.can('report.export.file')"
          (click)="exportCsv()"
        >
          {{ s.stockLedger.export }}
        </button>
      </div>

      <div class="filters">
        <label>
          {{ s.stockLedger.filterWarehouse }}
          <select
            id="ledger-warehouse-filter"
            [ngModel]="warehouseId"
            (ngModelChange)="onWarehouseChange($event)"
            [disabled]="scope.locked()"
          >
            <option *ngIf="!scope.locked()" value="">{{ s.stockLedger.allWarehouses }}</option>
            <option *ngFor="let id of warehouseOptions()" [value]="id">
              {{ warehouseLabel(id) }}
            </option>
          </select>
          <span class="locked-hint" *ngIf="scope.locked()">
            {{ s.stockLedger.warehouseLockedHint }}
          </span>
        </label>

        <label>
          {{ s.stockLedger.filterBatchId }}
          <input id="ledger-batch-filter" type="text" [(ngModel)]="batchId" placeholder="UUID" />
        </label>

        <label>
          {{ s.stockLedger.filterMovementType }}
          <select id="ledger-type-filter" [(ngModel)]="txnType">
            <option value="">{{ s.stockLedger.allMovementTypes }}</option>
            <option *ngFor="let t of movementTypes" [value]="t">{{ t }}</option>
          </select>
        </label>

        <label>
          {{ s.stockLedger.filterFrom }}
          <input id="ledger-from-filter" type="date" [(ngModel)]="fromDate" />
        </label>

        <label>
          {{ s.stockLedger.filterTo }}
          <input id="ledger-to-filter" type="date" [(ngModel)]="toDate" />
        </label>

        <button id="ledger-apply-btn" type="button" class="btn-primary" (click)="reload()">
          {{ s.stockLedger.apply }}
        </button>
        <button id="ledger-reset-btn" type="button" class="btn-secondary" (click)="reset()">
          {{ s.stockLedger.reset }}
        </button>
      </div>

      <p class="error" *ngIf="error()">{{ s.common.loadFailed }}</p>

      <tohfa-data-table
        id="ledger-table"
        [columns]="columns"
        [rows]="entries()"
        [cursorMode]="true"
        [hasMore]="hasMore()"
        [loadMoreLabel]="s.stockLedger.loadMore"
        [emptyMessage]="s.stockLedger.empty"
        [clickable]="true"
        (loadMore)="loadMore()"
        (rowClick)="openBatch($event)"
      />
    </div>
  `,
})
export class StockLedgerComponent implements OnInit {
  private readonly inventory = inject(InventoryService);
  private readonly router = inject(Router);

  readonly rbac = inject(RbacService);
  readonly scope = inject(WarehouseScopeService);
  readonly s = INVENTORY_STRINGS;

  readonly entries = signal<StockLedgerEntry[]>([]);
  readonly hasMore = signal(false);
  readonly error = signal(false);

  batchId = '';
  txnType: StockMovementType | '' = '';
  fromDate = '';
  toDate = '';
  private cursor: string | null = null;

  readonly movementTypes = MOVEMENT_TYPES;

  readonly columns: readonly Column[] = [
    { key: 'performedAt', header: INVENTORY_STRINGS.stockLedger.columns.performedAt },
    {
      key: 'batchId',
      header: INVENTORY_STRINGS.stockLedger.columns.batchId,
      format: (value) => shortId(value),
    },
    { key: 'txnType', header: INVENTORY_STRINGS.stockLedger.columns.txnType },
    {
      key: 'qtyDeltaKg',
      header: INVENTORY_STRINGS.stockLedger.columns.qtyDeltaKg,
      align: 'right',
    },
    {
      key: 'balanceAfterKg',
      header: INVENTORY_STRINGS.stockLedger.columns.balanceAfterKg,
      align: 'right',
    },
    {
      key: 'refType',
      header: INVENTORY_STRINGS.stockLedger.columns.ref,
      format: (value, row) =>
        value === null || value === undefined ? '—' : `${String(value)} ${shortId(row['refId'])}`,
    },
    {
      key: 'remarks',
      header: INVENTORY_STRINGS.stockLedger.columns.remarks,
      format: (value) => (value === null || value === undefined ? '—' : String(value)),
    },
  ];

  ngOnInit(): void {
    // Resolve the warehouse scope BEFORE the first query so a locked Sub
    // Warehouse Admin never fires an unscoped request.
    this.scope.init();
    this.reload();
  }

  /** Options shown in the selector: assigned warehouses when locked. */
  warehouseOptions(): readonly string[] {
    if (this.scope.locked()) return this.scope.assignedIds();
    return this.scope.options().map((w) => w.id);
  }

  warehouseLabel(id: string): string {
    if (this.scope.locked()) return id;
    const match = this.scope.options().find((w) => w.id === id);
    return match !== undefined ? `${match.name} (${id.slice(0, 8)}…)` : id;
  }

  get warehouseId(): string {
    return this.scope.currentWarehouseId();
  }

  onWarehouseChange(value: string): void {
    this.scope.select(value);
    this.reload();
  }

  reset(): void {
    this.batchId = '';
    this.txnType = '';
    this.fromDate = '';
    this.toDate = '';
    this.reload();
  }

  reload(): void {
    this.cursor = null;
    this.entries.set([]);
    this.fetch();
  }

  loadMore(): void {
    this.fetch();
  }

  openBatch(row: Row): void {
    const batchId = row['batchId'];
    if (typeof batchId === 'string') {
      void this.router.navigate(['/inventory/batches', batchId]);
    }
  }

  /**
   * CSV export. Built from the rows the table rendered — those rows came from
   * the same server-side-scoped, cursor-paged query as the table, so the
   * export path carries exactly the warehouse scope of the table (BR-30).
   */
  exportCsv(): void {
    const header = [
      'performedAt',
      'batchId',
      'warehouseId',
      'txnType',
      'qtyDeltaKg',
      'balanceAfterKg',
      'refType',
      'refId',
      'remarks',
    ];
    const lines = [header.map(csvField).join(',')];
    for (const entry of this.entries()) {
      lines.push(
        [
          entry.performedAt,
          entry.batchId,
          entry.warehouseId,
          entry.txnType,
          entry.qtyDeltaKg,
          entry.balanceAfterKg,
          entry.refType ?? '',
          entry.refId ?? '',
          entry.remarks ?? '',
        ]
          .map(csvField)
          .join(','),
      );
    }
    const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `stock-ledger-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  private fetch(): void {
    this.error.set(false);
    this.inventory.listStockLedger(this.buildQuery(this.cursor)).subscribe({
      next: (res) => {
        this.entries.update((prev) => [...prev, ...res.items]);
        this.cursor = res.page.nextCursor;
        this.hasMore.set(res.page.hasMore);
      },
      error: () => {
        this.error.set(true);
        this.hasMore.set(false);
      },
    });
  }

  /** One query builder for the table — and therefore for the export. */
  private buildQuery(cursor: string | null): Record<string, string> {
    const params: Record<string, string> = {};
    const warehouseId = this.scope.currentWarehouseId();
    if (warehouseId.length > 0) params['warehouseId'] = warehouseId;
    if (this.batchId.trim().length > 0) params['batchId'] = this.batchId.trim();
    if (this.txnType.length > 0) params['txnType'] = this.txnType;
    if (this.fromDate.length > 0) params['from'] = new Date(this.fromDate).toISOString();
    if (this.toDate.length > 0) params['to'] = new Date(this.toDate).toISOString();
    if (cursor !== null) params['cursor'] = cursor;
    return params;
  }
}

function shortId(value: unknown): string {
  const id = value === null || value === undefined ? '' : String(value);
  return id.length > 8 ? `${id.slice(0, 8)}…` : id;
}

function csvField(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

