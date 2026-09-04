import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ContentChild, Input, TemplateRef } from '@angular/core';

/**
 * Usage:
 * <tohfa-table [rows]="applications()" [colspan]="6" emptyMessage="No farmer applications found in queue.">
 *   <ng-template #header>
 *     <th>Applicant Name</th>
 *     ...
 *   </ng-template>
 *   <ng-template #row let-item>
 *     <td>{{ item.fullName }}</td>
 *     ...
 *   </ng-template>
 * </tohfa-table>
 */
@Component({
  selector: 'tohfa-table',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        display: block;
      }

      .table-card {
        background: #fff;
        border: 1px solid var(--tohfa-neutral-300, #e5e7eb);
        border-radius: var(--tohfa-radius-card, 12px);
        overflow: hidden;
        box-shadow: var(--tohfa-shadow-card, 0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04));
      }

      table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0 8px; /* horizontal 0, vertical gap between rows */
  padding:10px;
}

      /* ---------- Header ---------- */
      thead th {
        text-align: left;
        padding: var(--tohfa-space-md, 12px) var(--tohfa-space-lg, 16px);
        background: var(--tohfa-surface-variant, #f9fafb);
        border-bottom: 1px solid var(--tohfa-neutral-300, #e5e7eb);
        font-size: var(--tohfa-font-size-small, 13px);
        font-weight: var(--tohfa-font-weight-semibold, 600);
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--tohfa-neutral-600, #6b7280);
        white-space: nowrap;
      }
      thead th:first-child { border-top-left-radius: var(--tohfa-radius-card, 12px); }
      thead th:last-child { border-top-right-radius: var(--tohfa-radius-card, 12px); }

      /* ---------- Body ---------- */
      tbody tr {
        border-bottom: 1px solid var(--tohfa-neutral-100, #f3f4f6);
        transition: background-color 0.15s ease;
      }
      tbody tr:last-child {
        border-bottom: none;
      }
      tbody tr:not(.empty-row):hover {
        background: var(--tohfa-primary-pale, #f4fbf4);
      }
     tbody td {
  padding: var(--tohfa-space-lg, 20px) var(--tohfa-space-xl, 24px);
  font-size: var(--tohfa-font-size-body, 14px);
  color: var(--tohfa-on-surface, #1f2937);
  vertical-align: middle;
  line-height: 1.4;
}

/* ---------- Empty state ---------- */
.empty-row td {
  padding: var(--tohfa-space-xl, 48px) var(--tohfa-space-lg, 16px);
}
      .empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 10px;
        text-align: center;
        color: var(--tohfa-neutral-600, #6b7280);
      }
      .empty svg {
        width: 32px;
        height: 32px;
        color: var(--tohfa-neutral-400, #d1d5db);
        margin-bottom: 2px;
      }
      .empty-text {
        font-size: var(--tohfa-font-size-body, 14px);
        font-weight: var(--tohfa-font-weight-semibold, 600);
        color: var(--tohfa-neutral-700, #4b5563);
      }
    `,
  ],
  template: `
    <div class="table-card">
      <table>
        <thead>
          <tr>
            <ng-container *ngTemplateOutlet="headerTpl"></ng-container>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let item of rows">
            <ng-container *ngTemplateOutlet="rowTpl; context: { $implicit: item }"></ng-container>
          </tr>
          <tr class="empty-row" *ngIf="rows.length === 0">
            <td [attr.colspan]="colspan">
              <div class="empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="4" width="18" height="16" rx="2"></rect>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                  <line x1="8" y1="15" x2="12" y2="15"></line>
                </svg>
                <span class="empty-text">{{ emptyMessage }}</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
})
export class TohfaTableComponent<T = any> {
  @Input() rows: T[] = [];
  @Input() colspan = 1;
  @Input() emptyMessage = 'No records found.';

  @ContentChild('header', { static: true }) headerTpl!: TemplateRef<any>;
  @ContentChild('row', { static: true }) rowTpl!: TemplateRef<any>;
}