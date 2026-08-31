/**
 * S-28 screen 2b — Batch Detail.
 *
 * Shows one batch (GET /admin/batches/{id}) with its ledger-derived quantity
 * and the full movement history for that batch (GET /admin/stock-ledger?batchId
 * — server-side filtered, cursor paged). Quantities are ledger-derived; they
 * are never edited here (BR-37). A batch outside the caller's warehouse scope
 * reads as 404 with an empty body from the API (BR-30), rendered as "not found".
 */
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal, type OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { type Column, DataTableComponent } from '../../shared/data-table/data-table.component';
import { InventoryService, type BatchView, type StockLedgerEntry } from './inventory.service';
import { INVENTORY_STRINGS } from './inventory.strings';

@Component({
  selector: 'tohfa-batch-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, DataTableComponent],
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
      .back-link {
        color: var(--tohfa-primary);
        text-decoration: none;
        font-size: var(--tohfa-font-size-body-small);
        font-weight: var(--tohfa-font-weight-semibold);
      }
      .summary-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: var(--tohfa-space-md);
      }
      .summary-card {
        background: var(--tohfa-neutral-white);
        border-radius: var(--tohfa-radius-card);
        padding: var(--tohfa-space-lg);
      }
      .summary-card dt {
        font-size: var(--tohfa-font-size-caption);
        color: var(--tohfa-neutral-grey700);
        margin: 0 0 var(--tohfa-space-xs) 0;
      }
      .summary-card dd {
        font-size: var(--tohfa-font-size-body);
        font-weight: var(--tohfa-font-weight-semibold);
        color: var(--tohfa-on-surface);
        margin: 0;
        font-family: var(--tohfa-font-mono);
      }
      .section-title {
        font-size: var(--tohfa-font-size-title);
        font-weight: var(--tohfa-font-weight-bold);
        color: var(--tohfa-on-surface);
        margin: var(--tohfa-space-md) 0 0 0;
      }
      .note {
        font-size: var(--tohfa-font-size-caption);
        color: var(--tohfa-neutral-grey700);
      }
      .not-found {
        color: var(--tohfa-danger);
        font-size: var(--tohfa-font-size-body);
      }
    `,
  ],
  template: `
    <div class="page-container">
      <a class="back-link" routerLink="/inventory/batches">{{ s.batchDetail.back }}</a>

      <ng-container *ngIf="batch() !== null; else notFound">
        <div class="title-group">
          <h1>{{ s.batchDetail.title }} — {{ batch()!.batchCode }}</h1>
          <p>{{ s.batchDetail.derivedNote }}</p>
        </div>

        <dl class="summary-grid">
          <div class="summary-card">
            <dt>{{ s.batchDetail.fields.qtyAvailableKg }}</dt>
            <dd>{{ batch()!.qtyAvailableKg }}</dd>
          </div>
          <div class="summary-card">
            <dt>{{ s.batchDetail.fields.qtyReceivedKg }}</dt>
            <dd>{{ batch()!.qtyReceivedKg }}</dd>
          </div>
          <div class="summary-card">
            <dt>{{ s.batchDetail.fields.grade }}</dt>
            <dd>{{ batch()!.grade }}</dd>
          </div>
          <div class="summary-card">
            <dt>{{ s.batchDetail.fields.status }}</dt>
            <dd>{{ batch()!.status }}</dd>
          </div>
          <div class="summary-card">
            <dt>{{ s.batchDetail.fields.warehouse }}</dt>
            <dd>{{ batch()!.warehouseId }}</dd>
          </div>
          <div class="summary-card">
            <dt>{{ s.batchDetail.fields.receivedOn }}</dt>
            <dd>{{ batch()!.receivedOn }}</dd>
          </div>
          <div class="summary-card">
            <dt>{{ s.batchDetail.fields.expiryOn }}</dt>
            <dd>{{ batch()!.expiryOn ?? '—' }}</dd>
          </div>
          <div class="summary-card">
            <dt>{{ s.batchDetail.fields.storageLocation }}</dt>
            <dd>{{ batch()!.storageLocation ?? '—' }}</dd>
          </div>
        </dl>

        <h2 class="section-title">{{ s.batchDetail.sectionMovements }}</h2>
        <tohfa-data-table
          id="batch-movements-table"
          [columns]="columns"
          [rows]="movements()"
          [cursorMode]="true"
          [hasMore]="hasMore()"
          [loadMoreLabel]="s.stockLedger.loadMore"
          [emptyMessage]="s.stockLedger.empty"
          (loadMore)="loadMore()"
        />
      </ng-container>

      <ng-template #notFound>
        <p class="not-found" *ngIf="!loading()">{{ s.batchDetail.notFound }}</p>
        <p class="note" *ngIf="loading()">{{ s.common.loading }}</p>
      </ng-template>
    </div>
  `,
})
export class BatchDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly inventory = inject(InventoryService);

  readonly s = INVENTORY_STRINGS;

  readonly batch = signal<BatchView | null>(null);
  readonly movements = signal<StockLedgerEntry[]>([]);
  readonly hasMore = signal(false);
  readonly loading = signal(true);
  private cursor: string | null = null;

  readonly columns: readonly Column[] = [
    { key: 'performedAt', header: INVENTORY_STRINGS.stockLedger.columns.performedAt },
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
      key: 'remarks',
      header: INVENTORY_STRINGS.stockLedger.columns.remarks,
      format: (value) => (value === null || value === undefined ? '—' : String(value)),
    },
  ];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id === null) {
      this.loading.set(false);
      return;
    }

    this.inventory.getBatch(id).subscribe({
      next: (batch) => this.batch.set(batch),
      error: () => this.batch.set(null),
      complete: () => this.loading.set(false),
    });

    this.fetchMovements(id);
  }

  loadMore(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id !== null) this.fetchMovements(id);
  }

  private fetchMovements(batchId: string): void {
    const params: Record<string, string> = { batchId };
    if (this.cursor !== null) params['cursor'] = this.cursor;
    this.inventory.listStockLedger(params).subscribe({
      next: (res) => {
        this.movements.update((prev) => [...prev, ...res.items]);
        this.cursor = res.page.nextCursor;
        this.hasMore.set(res.page.hasMore);
      },
      error: () => this.hasMore.set(false),
    });
  }
}

