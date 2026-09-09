import { CommonModule } from '@angular/common';
import { TohfaTableComponent } from '../../shared/tohfa-table.component';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PricingService, type FairPrice } from './pricing.service';

@Component({
  selector: 'tohfa-price-history',
  standalone: true,
  imports: [CommonModule, FormsModule, TohfaTableComponent],
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
      .money-val {
        font-family: var(--tohfa-font-mono);
        font-weight: var(--tohfa-font-weight-bold);
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

      <tohfa-table
        [rows]="history()"
        [colspan]="7"
        [emptyMessage]="hasSearched() ? 'No history records found for this crop.' : 'Enter a crop ID to search ceiling history.'"
      >
        <ng-template #header>
          <th>Crop</th>
          <th>Grade</th>
          <th>Ceiling Price (₹/kg)</th>
          <th>Frequency</th>
          <th>Effective From</th>
          <th>Effective To</th>
          <th>Notes</th>
        </ng-template>

        <ng-template #row let-item>
          <td>{{ item.cropName }}</td>
          <td>{{ item.grade }}</td>
          <td class="money-val">₹{{ item.ceilingPrice }}</td>
          <td>{{ item.frequency }}</td>
          <td>{{ item.effectiveFrom }}</td>
          <td>{{ item.effectiveTo ? item.effectiveTo : 'Current (Open)' }}</td>
          <td>{{ item.notes || '—' }}</td>
        </ng-template>
      </tohfa-table>
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
