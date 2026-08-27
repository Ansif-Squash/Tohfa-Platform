import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Column, DataTableComponent } from '../../shared/data-table/data-table.component';
import { AdminPricingService, FairPrice } from './pricing.service';

@Component({
  selector: 'tohfa-price-history',
  standalone: true,
  imports: [CommonModule, FormsModule, DataTableComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        display: block;
      }
      .filter-bar {
        display: flex;
        gap: var(--tohfa-space-md);
        align-items: flex-end;
        margin-bottom: var(--tohfa-space-lg);
        flex-wrap: wrap;
      }
      .filter-group {
        display: flex;
        flex-direction: column;
        gap: var(--tohfa-space-xs);
      }
      .filter-group label {
        font-size: var(--tohfa-font-size-caption);
        color: var(--tohfa-text-secondary);
        font-weight: var(--tohfa-font-weight-medium);
      }
      input, select {
        padding: var(--tohfa-space-sm) var(--tohfa-space-md);
        border: 1px solid rgba(4, 52, 44, 0.2);
        border-radius: var(--tohfa-radius-input-standard);
        font-size: var(--tohfa-font-size-body-small);
      }
      .primary-btn {
        background: var(--tohfa-primary);
        color: #fff;
        padding: var(--tohfa-space-sm) var(--tohfa-space-lg);
        border-radius: var(--tohfa-radius-button-standard);
        border: none;
        cursor: pointer;
        font-weight: var(--tohfa-font-weight-medium);
      }
    `,
  ],
  template: `
    <h2>Fair Price History</h2>
    <p>View complete audit history of price ceilings for a crop and grade.</p>

    <div class="filter-bar">
      <div class="filter-group">
        <label>Crop ID (Required)</label>
        <input type="text" [(ngModel)]="filterCropId" placeholder="Enter crop UUID..." />
      </div>
      <div class="filter-group">
        <label>Grade</label>
        <select [(ngModel)]="filterGrade">
          <option value="">All Grades</option>
          <option value="GRADE_1">GRADE_1</option>
          <option value="GRADE_2">GRADE_2</option>
          <option value="GRADE_3">GRADE_3</option>
        </select>
      </div>
      <div class="filter-group">
        <label>From Date</label>
        <input type="date" [(ngModel)]="filterFrom" />
      </div>
      <div class="filter-group">
        <label>To Date</label>
        <input type="date" [(ngModel)]="filterTo" />
      </div>
      <button type="button" class="primary-btn" (click)="loadHistory()">Query History</button>
    </div>

    <tohfa-data-table
      [columns]="columns"
      [rows]="items()"
      [total]="total()"
      [page]="page()"
      (pageChange)="onPageChange($event)"
      emptyMessage="Enter a Crop ID above and click Query History."
    />
  `,
})
export class PriceHistoryComponent {
  private readonly pricingService = inject(AdminPricingService);

  readonly items = signal<FairPrice[]>([]);
  readonly total = signal<number>(0);
  readonly page = signal<number>(1);

  filterCropId = '';
  filterGrade = '';
  filterFrom = '';
  filterTo = '';

  readonly columns: Column<FairPrice>[] = [
    { key: 'cropName', header: 'Crop', format: (val, row) => (val as string) || row.cropId },
    { key: 'grade', header: 'Grade' },
    { key: 'ceilingPrice', header: 'Ceiling Price (Rs/kg)', align: 'right', format: (val) => String(val) },
    { key: 'frequency', header: 'Frequency' },
    { key: 'effectiveFrom', header: 'Effective From' },
    { key: 'effectiveTo', header: 'Effective To', format: (val) => (val as string) || 'Open' },
  ];

  loadHistory(): void {
    if (!this.filterCropId) return;

    this.pricingService
      .getFairPriceHistory({
        cropId: this.filterCropId,
        grade: this.filterGrade || undefined,
        from: this.filterFrom || undefined,
        to: this.filterTo || undefined,
      })
      .subscribe({
        next: (res) => {
          this.items.set(res.items);
          this.total.set(res.items.length);
        },
        error: (err) => {
          console.error('Failed to load price history', err);
        },
      });
  }

  onPageChange(newPage: number): void {
    this.page.set(newPage);
  }
}
