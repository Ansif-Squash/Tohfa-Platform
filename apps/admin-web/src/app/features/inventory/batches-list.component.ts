/**
 * S-28 screen 2a — Inventory Batches list (route into batch detail).
 *
 * Server-side filtering (warehouse, grade, status) and cursor paging over
 * GET /admin/batches; a Sub Warehouse Admin's selector is locked (BR-30) via
 * WarehouseScopeService. Clicking a row opens the batch detail screen.
 */
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal, type OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { type Column, DataTableComponent, type Row } from '../../shared/data-table/data-table.component';
import {
  InventoryService,
  type BatchStatus,
  type BatchView,
  type ProduceGrade,
} from './inventory.service';
import { INVENTORY_STRINGS } from './inventory.strings';
import { WarehouseScopeService } from './warehouse-scope.service';

const GRADES: readonly ProduceGrade[] = ['GRADE_1', 'GRADE_2', 'GRADE_3', 'REJECT'];
const STATUSES: readonly BatchStatus[] = ['ACTIVE', 'DEPLETED', 'EXPIRED', 'WRITTEN_OFF'];

@Component({
  selector: 'tohfa-batches-list',
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
      .error {
        color: var(--tohfa-danger);
        font-size: var(--tohfa-font-size-body-small);
      }
    `,
  ],
  template: `
    <div class="page-container">
      <div class="title-group">
        <h1>{{ s.batches.title }}</h1>
        <p>{{ s.batches.subtitle }}</p>
      </div>

      <div class="filters">
        <label>
          {{ s.batches.filterWarehouse }}
          <select
            id="batches-warehouse-filter"
            [ngModel]="warehouseId"
            (ngModelChange)="onWarehouseChange($event)"
            [disabled]="scope.locked()"
          >
            <option *ngIf="!scope.locked()" value="">{{ s.stockLedger.allWarehouses }}</option>
            <option *ngFor="let w of warehouseOptions()" [value]="w.id">{{ w.name }}</option>
          </select>
        </label>
        <label>
          {{ s.batches.filterGrade }}
          <select id="batches-grade-filter" [(ngModel)]="grade" (ngModelChange)="reload()">
            <option value="">{{ s.batches.allGrades }}</option>
            <option *ngFor="let g of grades" [value]="g">{{ g }}</option>
          </select>
        </label>
        <label>
          {{ s.batches.filterStatus }}
          <select id="batches-status-filter" [(ngModel)]="status" (ngModelChange)="reload()">
            <option value="">{{ s.batches.allStatuses }}</option>
            <option *ngFor="let st of statuses" [value]="st">{{ st }}</option>
          </select>
        </label>
      </div>

      <p class="error" *ngIf="error()">{{ s.common.loadFailed }}</p>

      <tohfa-data-table
        id="batches-table"
        [columns]="columns"
        [rows]="batches()"
        [cursorMode]="true"
        [hasMore]="hasMore()"
        [loadMoreLabel]="s.stockLedger.loadMore"
        [emptyMessage]="s.batches.empty"
        [clickable]="true"
        (loadMore)="loadMore()"
        (rowClick)="openDetail($event)"
      />
    </div>
  `,
})
export class BatchesListComponent implements OnInit {
  private readonly inventory = inject(InventoryService);
  private readonly router = inject(Router);

  readonly scope = inject(WarehouseScopeService);
  readonly s = INVENTORY_STRINGS;

  readonly batches = signal<BatchView[]>([]);
  readonly hasMore = signal(false);
  readonly error = signal(false);

  grade: ProduceGrade | '' = '';
  status: BatchStatus | '' = '';
  private cursor: string | null = null;

  readonly grades = GRADES;
  readonly statuses = STATUSES;

  readonly columns: readonly Column[] = [
    { key: 'batchCode', header: INVENTORY_STRINGS.batches.columns.batchCode },
    {
      key: 'cropName',
      header: INVENTORY_STRINGS.batches.columns.crop,
      format: (value) => (value === undefined || value === null ? '—' : String(value)),
    },
    { key: 'grade', header: INVENTORY_STRINGS.batches.columns.grade },
    {
      key: 'warehouseId',
      header: INVENTORY_STRINGS.batches.columns.warehouseId,
      format: (value) => `${String(value).slice(0, 8)}…`,
    },
    {
      key: 'qtyReceivedKg',
      header: INVENTORY_STRINGS.batches.columns.qtyReceivedKg,
      align: 'right',
    },
    {
      key: 'qtyAvailableKg',
      header: INVENTORY_STRINGS.batches.columns.qtyAvailableKg,
      align: 'right',
    },
    { key: 'status', header: INVENTORY_STRINGS.batches.columns.status },
    { key: 'receivedOn', header: INVENTORY_STRINGS.batches.columns.receivedOn },
    {
      key: 'expiryOn',
      header: INVENTORY_STRINGS.batches.columns.expiryOn,
      format: (value) => (value === null || value === undefined ? '—' : String(value)),
    },
  ];

  ngOnInit(): void {
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

  openDetail(row: Row): void {
    const id = row['id'];
    if (typeof id === 'string') {
      void this.router.navigate(['/inventory/batches', id]);
    }
  }

  private fetch(): void {
    this.error.set(false);
    const params: Record<string, string> = {};
    const warehouseId = this.scope.currentWarehouseId();
    if (warehouseId.length > 0) params['warehouseId'] = warehouseId;
    if (this.grade.length > 0) params['grade'] = this.grade;
    if (this.status.length > 0) params['status'] = this.status;
    if (this.cursor !== null) params['cursor'] = this.cursor;
    params['limit'] = '50';

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

