/**
 * The reusable admin data table.
 *
 * Every list screen in the console uses this: same paging controls, same empty
 * state, same column definition shape. Screens supply columns + rows; they do
 * not restyle the table.
 *
 * ```html
 * <tohfa-data-table
 *   [columns]="columns"
 *   [rows]="warehouses()"
 *   [total]="total()"
 *   [page]="page()"
 *   (pageChange)="page.set($event)" />
 * ```
 */
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

export type Row = Record<string, unknown>;

export interface Column<T extends Row = Row> {
  /** Property on the row. */
  key: keyof T & string;
  header: string;
  /** Optional formatter; defaults to String(value). Use for Money and dates. */
  format?: (value: unknown, row: T) => string;
  align?: 'left' | 'right';
}

@Component({
  selector: 'tohfa-data-table',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        display: block;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        background: #fff;
        border-radius: var(--tohfa-radius-card-max);
        overflow: hidden;
      }
      th,
      td {
        padding: var(--tohfa-space-md) var(--tohfa-space-lg);
        text-align: left;
        border-bottom: 1px solid rgba(4, 52, 44, 0.08);
        font-size: var(--tohfa-font-size-body-small);
      }
      th {
        background: var(--tohfa-surface);
        font-weight: var(--tohfa-font-weight-semibold);
        font-size: var(--tohfa-font-size-footnote);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .right {
        text-align: right;
      }
      .empty,
      .pager {
        padding: var(--tohfa-space-xl);
        display: flex;
        gap: var(--tohfa-space-md);
        align-items: center;
      }
      .pager {
        justify-content: flex-end;
        font-size: var(--tohfa-font-size-body-small);
      }
      button[disabled] {
        opacity: 0.4;
        cursor: not-allowed;
      }
      tbody tr.clickable-row {
        cursor: pointer;
      }
      tbody tr.clickable-row:hover {
        background: var(--tohfa-neutral-grey100);
      }
      .load-more {
        padding: var(--tohfa-space-md);
        display: flex;
        justify-content: center;
      }
      .load-more button {
        padding: var(--tohfa-space-xs) var(--tohfa-space-lg);
        border: 1px solid var(--tohfa-neutral-grey300);
        border-radius: var(--tohfa-radius-button);
        background: var(--tohfa-surface);
        color: var(--tohfa-on-surface);
        font-weight: var(--tohfa-font-weight-semibold);
        cursor: pointer;
      }
    `,
  ],
  template: `
    <table *ngIf="rows && rows.length > 0; else emptyState">
      <thead>
        <tr>
          <th *ngFor="let column of columns" [class.right]="column.align === 'right'">
            {{ column.header }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          *ngFor="let row of rows"
          [class.clickable-row]="clickable"
          (click)="clickable && rowClick.emit(row)"
        >
          <td *ngFor="let column of columns" [class.right]="column.align === 'right'">
            {{ render(column, row) }}
          </td>
        </tr>
      </tbody>
    </table>

    <ng-template #emptyState>
      <div class="empty tohfa-card">{{ emptyMessage }}</div>
    </ng-template>

    <div class="pager" *ngIf="!cursorMode && total > pageSize">
      <span>{{ rangeLabel }}</span>
      <button type="button" [disabled]="page <= 1" (click)="goTo(page - 1)">Previous</button>
      <button type="button" [disabled]="page >= lastPage" (click)="goTo(page + 1)">Next</button>
    </div>

    <div class="load-more" *ngIf="cursorMode && hasMore">
      <button type="button" (click)="loadMore.emit()">{{ loadMoreLabel }}</button>
    </div>
  `,
})
export class DataTableComponent {
  @Input() columns: readonly Column[] = [];
  @Input() rows: readonly Row[] = [];
  @Input() total = 0;
  @Input() page = 1;
  @Input() pageSize = 20;
  @Input() emptyMessage = 'Nothing to show yet.';
  /**
   * Cursor paging mode for append-only, unbounded sources (stock ledger).
   * The numbered pager needs a total; a cursor source has none, so it shows a
   * Load-more control driven by `hasMore` instead.
   */
  @Input() cursorMode = false;
  @Input() hasMore = false;
  @Input() loadMoreLabel = 'Load more';
  /** Optional clickable rows (e.g. open batch detail from the ledger). */
  @Input() clickable = false;

  @Output() readonly pageChange = new EventEmitter<number>();
  @Output() readonly loadMore = new EventEmitter<void>();
  @Output() readonly rowClick = new EventEmitter<Row>();

  get lastPage(): number {
    return Math.max(1, Math.ceil(this.total / this.pageSize));
  }

  get rangeLabel(): string {
    if (this.total === 0) return '0 of 0';
    const first = (this.page - 1) * this.pageSize + 1;
    const last = Math.min(this.page * this.pageSize, this.total);
    return `${first}–${last} of ${this.total}`;
  }

  render(column: Column, row: Row): string {
    const value = row[column.key];
    if (column.format !== undefined) return column.format(value, row);
    return value === null || value === undefined ? '—' : String(value);
  }

  goTo(page: number): void {
    if (page < 1 || page > this.lastPage) return;
    this.pageChange.emit(page);
  }
}
