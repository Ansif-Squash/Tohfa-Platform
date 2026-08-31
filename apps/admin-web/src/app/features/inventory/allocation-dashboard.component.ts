/**
 * S-28 screen 3 — Allocation Dashboard.
 *
 * Renders the four allocation buckets — ONLINE, LIVE_MARKET, RESERVE, BUFFER —
 * with allocated, consumed, reserved and available per bucket, read from
 * GET /admin/allocations (BR-12). All figures come from the API response; the
 * client only sums the API's Quantity strings exactly (integer milli-units).
 *
 * The warehouse selector is locked for a Sub Warehouse Admin (BR-30) through
 * WarehouseScopeService, so the dashboard query itself carries the scope.
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
import { type Column, DataTableComponent } from '../../shared/data-table/data-table.component';
import {
  type AllocationChannel,
  InventoryService,
  sumQuantities,
  type AllocationView,
} from './inventory.service';
import { INVENTORY_STRINGS } from './inventory.strings';
import { WarehouseScopeService } from './warehouse-scope.service';

export const CHANNELS: readonly AllocationChannel[] = ['ONLINE', 'LIVE_MARKET', 'RESERVE', 'BUFFER'];

/** One rendered bucket card: the channel plus exact sums of API quantities. */
export interface BucketCard {
  channel: AllocationChannel;
  allocated: string;
  consumed: string;
  reserved: string;
  available: string;
  /** True when the API response omits the metric for every row in the bucket. */
  reservedNotExposed: boolean;
  availableNotExposed: boolean;
}

const EMPTY_BUCKET: BucketCard = {
  channel: 'ONLINE',
  allocated: '0.000',
  consumed: '0.000',
  reserved: '0.000',
  available: '0.000',
  reservedNotExposed: true,
  availableNotExposed: true,
};

export const EMPTY_BUCKETS: readonly BucketCard[] = CHANNELS.map((channel) => ({
  ...EMPTY_BUCKET,
  channel,
}));

/**
 * Aggregates allocation rows into the four channel buckets (BR-12). All
 * arithmetic is exact — Quantity strings are summed as integer milli-units,
 * never with floats — and every displayed figure comes from the API response.
 */
export function computeBucketCards(rows: readonly AllocationView[]): readonly BucketCard[] {
  return CHANNELS.map((channel) => {
    const inBucket = rows.filter((row) => row.channel === channel);
    const reservedExposed = inBucket.some((row) => row.reservedQtyKg !== undefined);
    const availableExposed = inBucket.some((row) => row.availableQtyKg !== undefined);
    return {
      channel,
      allocated: sumQuantities(inBucket.map((row) => row.allocatedQtyKg)),
      consumed: sumQuantities(inBucket.map((row) => row.consumedQtyKg)),
      reserved: reservedExposed ? sumQuantities(inBucket.map((row) => row.reservedQtyKg)) : '0.000',
      available: availableExposed
        ? sumQuantities(inBucket.map((row) => row.availableQtyKg))
        : '0.000',
      reservedNotExposed: !reservedExposed,
      availableNotExposed: !availableExposed,
    };
  });
}

@Component({
  selector: 'tohfa-allocation-dashboard',
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
      .bucket-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: var(--tohfa-space-md);
      }
      .bucket-card {
        border-radius: var(--tohfa-radius-card-max);
        padding: var(--tohfa-space-lg);
        border: 1px solid var(--tohfa-neutral-grey200);
      }
      .bucket-ONLINE {
        background: var(--tohfa-color-deep-teal);
      }
      .bucket-LIVE_MARKET {
        background: var(--tohfa-color-tohfa-orange);
      }
      .bucket-RESERVE {
        background: var(--tohfa-color-deep-blue);
      }
      .bucket-BUFFER {
        background: var(--tohfa-color-brown-accent);
      }
      .bucket-card h3 {
        margin: 0 0 var(--tohfa-space-md) 0;
        color: var(--tohfa-neutral-white);
        font-size: var(--tohfa-font-size-title);
      }
      .metric-row {
        display: flex;
        justify-content: space-between;
        gap: var(--tohfa-space-md);
        padding: var(--tohfa-space-xs) 0;
        color: var(--tohfa-neutral-white);
        font-size: var(--tohfa-font-size-body-small);
        border-top: 1px solid var(--tohfa-neutral-grey300);
      }
      .metric-row .value {
        font-family: var(--tohfa-font-mono);
        font-weight: var(--tohfa-font-weight-bold);
      }
      .gap-note {
        font-size: var(--tohfa-font-size-caption);
        color: var(--tohfa-neutral-grey700);
      }
      .section-title {
        font-size: var(--tohfa-font-size-title);
        font-weight: var(--tohfa-font-weight-bold);
        color: var(--tohfa-on-surface);
        margin: var(--tohfa-space-md) 0 0 0;
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
        <h1>{{ s.allocations.title }}</h1>
        <p>{{ s.allocations.subtitle }}</p>
      </div>

      <div class="filters">
        <label>
          {{ s.allocations.filterWarehouse }}
          <select
            id="allocations-warehouse-filter"
            [ngModel]="warehouseId"
            (ngModelChange)="onWarehouseChange($event)"
            [disabled]="scope.locked()"
          >
            <option *ngIf="!scope.locked()" value="">{{ s.stockLedger.allWarehouses }}</option>
            <option *ngFor="let w of warehouseOptions()" [value]="w.id">{{ w.name }}</option>
          </select>
          <span class="gap-note" *ngIf="scope.locked()">{{ s.stockLedger.warehouseLockedHint }}</span>
        </label>

        <label>
          {{ s.allocations.filterChannel }}
          <select
            id="allocations-channel-filter"
            [(ngModel)]="channel"
            (ngModelChange)="reload()"
          >
            <option value="">{{ s.allocations.allChannels }}</option>
            <option *ngFor="let c of channels" [value]="c">{{ s.allocations.buckets[c] }}</option>
          </select>
        </label>
      </div>

      <p class="error" *ngIf="error()">{{ s.common.loadFailed }}</p>

      <div class="bucket-grid" *ngIf="!error()">
        <div *ngFor="let bucket of buckets()" [class]="'bucket-card bucket-' + bucket.channel">
          <h3>{{ s.allocations.buckets[bucket.channel] }}</h3>
          <div class="metric-row">
            <span>{{ s.allocations.metrics.allocated }}</span>
            <span class="value">{{ bucket.allocated }}</span>
          </div>
          <div class="metric-row">
            <span>{{ s.allocations.metrics.consumed }}</span>
            <span class="value">{{ bucket.consumed }}</span>
          </div>
          <div class="metric-row">
            <span>{{ s.allocations.metrics.reserved }}</span>
            <span class="value">{{ bucket.reservedNotExposed ? '—' : bucket.reserved }}</span>
          </div>
          <div class="metric-row">
            <span>{{ s.allocations.metrics.available }}</span>
            <span class="value">{{ bucket.availableNotExposed ? '—' : bucket.available }}</span>
          </div>
        </div>
      </div>

      <p class="gap-note" *ngIf="gapNoteVisible()">{{ s.allocations.reservedGapNote }}</p>

      <h2 class="section-title">{{ s.allocations.perBatchHeading }}</h2>
      <tohfa-data-table
        id="allocations-table"
        [columns]="columns"
        [rows]="allocations()"
        [cursorMode]="true"
        [hasMore]="hasMore()"
        [loadMoreLabel]="s.stockLedger.loadMore"
        [emptyMessage]="s.allocations.empty"
        (loadMore)="loadMore()"
      />
    </div>
  `,
})
export class AllocationDashboardComponent implements OnInit {
  private readonly inventory = inject(InventoryService);

  readonly scope = inject(WarehouseScopeService);
  readonly s = INVENTORY_STRINGS;

  readonly allocations = signal<AllocationView[]>([]);
  readonly hasMore = signal(false);
  readonly error = signal(false);
  readonly buckets = signal<readonly BucketCard[]>(EMPTY_BUCKETS);

  readonly channels = CHANNELS;
  channel: AllocationChannel | '' = '';
  private cursor: string | null = null;

  /** Shown when the API omits reserved/available for a whole bucket. */
  readonly gapNoteVisible = computed(() =>
    this.buckets().some((bucket) => bucket.reservedNotExposed || bucket.availableNotExposed),
  );

  readonly columns: readonly Column[] = [
    { key: 'allocationDate', header: INVENTORY_STRINGS.allocations.perBatchColumns.allocationDate },
    {
      key: 'cropName',
      header: INVENTORY_STRINGS.allocations.perBatchColumns.crop,
      format: (value) => (value === undefined || value === null ? '—' : String(value)),
    },
    {
      key: 'grade',
      header: INVENTORY_STRINGS.allocations.perBatchColumns.grade,
      format: (value) => (value === undefined || value === null ? '—' : String(value)),
    },
    { key: 'channel', header: INVENTORY_STRINGS.allocations.perBatchColumns.channel },
    {
      key: 'allocatedQtyKg',
      header: INVENTORY_STRINGS.allocations.perBatchColumns.allocatedQtyKg,
      align: 'right',
    },
    {
      key: 'consumedQtyKg',
      header: INVENTORY_STRINGS.allocations.perBatchColumns.consumedQtyKg,
      align: 'right',
    },
    {
      key: 'availableQtyKg',
      header: INVENTORY_STRINGS.allocations.perBatchColumns.availableQtyKg,
      align: 'right',
      format: (value) => (value === undefined || value === null ? '—' : String(value)),
    },
    { key: 'computedBy', header: INVENTORY_STRINGS.allocations.perBatchColumns.computedBy },
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
    this.allocations.set([]);
    this.buckets.set(EMPTY_BUCKETS);
    this.fetch();
  }

  loadMore(): void {
    this.fetch();
  }

  private fetch(): void {
    this.error.set(false);
    const params: Record<string, string> = { limit: '50' };
    const warehouseId = this.scope.currentWarehouseId();
    if (warehouseId.length > 0) params['warehouseId'] = warehouseId;
    if (this.channel.length > 0) params['channel'] = this.channel;
    if (this.cursor !== null) params['cursor'] = this.cursor;

    this.inventory.listAllocations(params).subscribe({
      next: (res) => {
        this.allocations.update((prev) => [...prev, ...res.items]);
        this.cursor = res.page.nextCursor;
        this.hasMore.set(res.page.hasMore);
        this.buckets.set(computeBucketCards(this.allocations()));
      },
      error: () => {
        this.error.set(true);
        this.hasMore.set(false);
      },
    });
  }
}
