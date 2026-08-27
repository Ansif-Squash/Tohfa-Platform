import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PricingService, type FairPrice } from './pricing.service';

@Component({
  selector: 'tohfa-price-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        display: block;
      }
      .panel {
        background: var(--tohfa-neutral-white);
        border-radius: var(--tohfa-radius-card-max);
        padding: var(--tohfa-space-xl);
        box-shadow: 0 1px 3px rgba(4, 52, 44, 0.08);
      }
      .query-bar {
        display: flex;
        gap: var(--tohfa-space-md);
        align-items: flex-end;
        flex-wrap: wrap;
        margin-bottom: var(--tohfa-space-xl);
      }
      .field {
        display: flex;
        flex-direction: column;
        gap: var(--tohfa-space-xs);
      }
      label {
        font-size: var(--tohfa-font-size-footnote);
        font-weight: var(--tohfa-font-weight-semibold);
        color: var(--tohfa-on-surface);
        text-transform: uppercase;
      }
      input,
      select {
        padding: var(--tohfa-space-sm) var(--tohfa-space-md);
        border: 1px solid var(--tohfa-neutral-grey300);
        border-radius: var(--tohfa-radius-input);
        background: var(--tohfa-neutral-white);
        font-family: var(--tohfa-font-sans);
        font-size: var(--tohfa-font-size-body-small);
      }
      .btn-primary {
        background: var(--tohfa-primary);
        color: var(--tohfa-neutral-white);
        padding: var(--tohfa-space-sm) var(--tohfa-space-lg);
        border: none;
        border-radius: var(--tohfa-radius-button);
        cursor: pointer;
        font-weight: var(--tohfa-font-weight-semibold);
        font-size: var(--tohfa-font-size-body-small);
      }
      table {
        width: 100%;
        border-collapse: collapse;
        text-align: left;
      }
      th,
      td {
        padding: var(--tohfa-space-md);
        border-bottom: 1px solid var(--tohfa-neutral-grey100);
        font-size: var(--tohfa-font-size-body-small);
      }
      th {
        background: var(--tohfa-surface);
        font-weight: var(--tohfa-font-weight-semibold);
        font-size: var(--tohfa-font-size-footnote);
        text-transform: uppercase;
      }
      .money-val {
        font-family: var(--tohfa-font-mono);
        font-weight: var(--tohfa-font-weight-bold);
      }
      .empty-row {
        text-align: center;
        padding: var(--tohfa-space-xxl);
        color: var(--tohfa-neutral-grey500);
      }
    `,
  ],
  template: `
    <div class="panel">
      <h2>Fair Price Ceiling History</h2>

      <div class="query-bar">
        <div class="field">
          <label>Crop ID (UUID) *</label>
          <input
            type="text"
            [(ngModel)]="cropId"
            placeholder="Enter Crop UUID"
          />
        </div>

        <div class="field">
          <label>Grade</label>
          <select [(ngModel)]="grade">
            <option value="">All Grades</option>
            <option value="GRADE_1">Grade 1</option>
            <option value="GRADE_2">Grade 2</option>
            <option value="GRADE_3">Grade 3</option>
            <option value="REJECT">Reject</option>
          </select>
        </div>

        <div class="field">
          <label>From Date</label>
          <input type="date" [(ngModel)]="from" />
        </div>

        <div class="field">
          <label>To Date</label>
          <input type="date" [(ngModel)]="to" />
        </div>

        <button class="btn-primary" [disabled]="!cropId" (click)="loadHistory()">
          Search History
        </button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Crop</th>
            <th>Grade</th>
            <th>Ceiling Price (₹/kg)</th>
            <th>Frequency</th>
            <th>Effective From</th>
            <th>Effective To</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let item of history()">
            <td>{{ item.cropName }}</td>
            <td>{{ item.grade }}</td>
            <td class="money-val">₹{{ item.ceilingPrice }}</td>
            <td>{{ item.frequency }}</td>
            <td>{{ item.effectiveFrom }}</td>
            <td>{{ item.effectiveTo ? item.effectiveTo : 'Current (Open)' }}</td>
            <td>{{ item.notes || '—' }}</td>
          </tr>
          <tr *ngIf="history().length === 0">
            <td colspan="7" class="empty-row">
              {{ hasSearched() ? 'No history records found for this crop.' : 'Enter a crop ID to search ceiling history.' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
})
export class PriceHistoryComponent {
  private readonly pricingService = inject(PricingService);

  cropId = '';
  grade = '';
  from = '';
  to = '';

  readonly history = signal<FairPrice[]>([]);
  readonly hasSearched = signal(false);

  loadHistory(): void {
    if (!this.cropId.trim()) return;

    this.hasSearched.set(true);
    this.pricingService
      .getFairPriceHistory({
        cropId: this.cropId.trim(),
        ...(this.grade ? { grade: this.grade } : {}),
        ...(this.from ? { from: this.from } : {}),
        ...(this.to ? { to: this.to } : {}),
      })
      .subscribe({
        next: (res) => this.history.set(res.items),
        error: () => this.history.set([]),
      });
  }
}
