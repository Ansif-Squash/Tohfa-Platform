/**
 * S-28 screen 4 — Low Stock indicator.
 *
 * Batches ranked by remaining quantity, lowest first, with the batch API's own
 * status flags (DEPLETED / EXPIRED / WRITTEN_OFF) marking critical rows.
 *
 * The low-stock threshold is a business threshold. No endpoint exposes one, and
 * CLAUDE.md §2.7 forbids constants in components — so the gap is stated on the
 * screen (inventory.strings lowStock.thresholdGapNote) instead of inventing a
 * cut-off. Nothing here filters by quantity: every row still comes from the
 * same server-side scoped, cursor-paged batch query (BR-30), and ordering is
 * presentational only.
 */
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  type OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { type Column, DataTableComponent, type Row } from '../../shared/data-table/data-table.component';
import { InventoryService, type BatchView } from './inventory.service';
import { INVENTORY_STRINGS } from './inventory.strings';
import { WarehouseScopeService } from './warehouse-scope.service';

/** Statuses the batch API itself flags as not sellable/available. */
export const CRITICAL_STATUSES: readonly BatchView['status'][] = [
  'DEPLETED',
  'EXPIRED',
  'WRITTEN_OFF',
];

/** Parses a Quantity string into integer milli-kg for exact comparisons. */
function toMilliKg(value: string): number {
  return Math.round(parseFloat(value) * 1000);
}

/** Ascending by remaining quantity — lowest stock first (presentational only). */
export function orderBatchesAscending(rows: readonly BatchView[]): readonly BatchView[] {
  return [...rows].sort((a, b) => toMilliKg(a.qtyAvailableKg) - toMilliKg(b.qtyAvailableKg));
}

@Component({
  selector: 'tohfa-low-stock',
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
      .gap-note {
        font-size: var(--tohfa-font-size-caption);
        color: var(--tohfa-neutral-grey700);
        margin: 0;
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
      .filters select {
        padding: var(--tohfa-space-xs) var(--tohfa-space-md);
        border: 1px solid var(--tohfa-neutral-grey300);
        border-radius: var(--tohfa-radius-input);
        font-size: var(--tohfa-font-size-body-small);
        min-height: var(--tohfa-min-touch-target);
        background: var(--tohfa-neutral-white);
        color: var(--tohfa-on-surface);
      }
      .filters select:disabled {
        background: var(--tohfa-neutral-grey100);
        cursor: not-allowed;
      }
      .summary {
        font-size: var(--tohfa-font-size-body-small);
        font-weight: var(--tohfa-font-weight-semibold);
        color: var(--tohfa-danger);
        margin: 0;
      }
      .error {
        color: var(--tohfa-danger);
        font-size: var(--tohfa-font-size-body-small);
      }
    `,
  ],
  template: `
    <div class="page-container">
      <div class="title-group">
        <h1>{{ s.lowStock.title }}</h1>
        <p>{{ s.lowStock.subtitle }}</p>
      </div>

      <p class="gap-note">{{ s.lowStock.thresholdGapNote }}</p>

      <div class="filters">
        <label>
          {{ s.batches.filterWarehouse }}
          <select
            id="low-stock-warehouse-filter"
            [ngModel]="warehouseId"
            (ngModelChange)="onWarehouseChange($event)"
            [disabled]="scope.locked()"
          >
            <option *ngIf="!scope.locked()" value="">{{ s.stockLedger.allWarehouses }}</option>
            <option *ngFor="let w of warehouseOptions()" [value]="w.id">{{ w.name }}</option>
          </select>
          <span class="gap-note" *ngIf="scope.locked()">{{ s.stockLedger.warehouseLockedHint }}</span>
        </label>
      </div>

      <p class="summary" *ngIf="criticalCount() > 0">
        {{ s.lowStock.criticalStatuses }}: {{ criticalCount() }}
      </p>

      <p class="error" *ngIf="error()">{{ s.common.loadFailed }}</p>

      <tohfa-data-table
        id="low-stock-table"
        [columns]="columns"
        [rows]="orderedBatches()"
        [cursorMode]="true"
        [hasMore]="hasMore()"
        [loadMoreLabel]="s.stockLedger.loadMore"
        [emptyMessage]="s.lowStock.empty"
        (rowClick)="openBatch($event)"
      />
    </div>
  `,
})
export class LowStockComponent implements OnInit {
  private readonly inventory = inject(InventoryService);
  private readonly router = inject(Router);

  readonly scope = inject(WarehouseScopeService);
  readonly s = INVENTORY_STRINGS;

  readonly batches = signal<BatchView[]>([]);
  readonly hasMore = signal(false);
  readonly error = signal(false);
  private cursor: string | null = null;

  /** Lowest remaining quantity first, across the loaded pages. */
  readonly orderedBatches = computed<readonly BatchView[]>(() =>
    orderBatchesAscending(this.batches()),
  );

  readonly criticalCount = computed(
    () => this.batches().filter((batch) => CRITICAL_STATUSES.includes(batch.status)).length,
  );

  readonly columns: readonly Column[] = [
    { key: 'batchCode', header: INVENTORY_STRINGS.lowStock.columns.batchCode },
    {
      key: 'cropName',
      header: INVENTORY_STRINGS.lowStock.columns.crop,
      format: (value) => (value === undefined || value === null ? '—' : String(value)),
    },
    { key: 'grade', header: INVENTORY_STRINGS.lowStock.columns.grade },
    {
      key: 'qtyAvailableKg',
      header: INVENTORY_STRINGS.lowStock.columns.qtyAvailableKg,
      align: 'right',
    },
    {
      key: 'status',
      header: INVENTORY_STRINGS.lowStock.columns.status,
      format: (value, row) =>
        CRITICAL_STATUSES.includes(row['status'] as BatchView['status'])
          ? `⚠ ${String(value)}`
          : String(value),
    },
  ];

  ngOnInit(): void {
    // Resolve the warehouse scope BEFORE the first query so a locked Sub
    // Warehouse Admin never fires an unscoped request.
    this.scope.init();
    this.reload();
  }

  warehouseOptions(): readonly { id: string; name: string }[] {
    if (this.scope.locked()) {
      return this.scope.assignedIds().map((id) => ({ id, name: id }));
    }
    return this.scope.options().map((w) => ({ id: w.id, name: w.name }));
  }

  get warehouseId(): string {
    return this.scope.currentWarehouseId();
  }

  onWarehouseChange(value: string): void {
    this.scope.select(value);
    this.reload();
  }

  reload(): void {
    this.cursor = null;
    this.batches.set([]);
    this.fetch();
  }

  loadMore(): void {
    this.fetch();
  }

  openBatch(row: Row): void {
    const id = row['id'];
    if (typeof id === 'string') {
      void this.router.navigate(['/inventory/batches', id]);
    }
  }

  private fetch(): void {
    this.error.set(false);
    const params: Record<string, string> = { limit: '50' };
    const warehouseId = this.scope.currentWarehouseId();
    if (warehouseId.length > 0) params['warehouseId'] = warehouseId;
    if (this.cursor !== null) params['cursor'] = this.cursor;

    this.inventory.listBatches(params).subscribe({
      next: (res) => {
        this.batches.update((prev) => [...prev, ...res.items]);
        this.cursor = res.page.nextCursor;
        this.hasMore.set(res.page.hasMore);
      },
      error: () => {
        this.error.set(true);
        this.hasMore.set(false);
      },
    });
  }
}