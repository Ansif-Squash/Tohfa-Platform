import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Column, DataTableComponent, Row } from '../../shared/data-table/data-table.component';
import { RbacService } from '../../core/rbac.service';
import { AdminPricingService, FairPrice } from './pricing.service';

@Component({
  selector: 'tohfa-fair-price-list',
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
        align-items: center;
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
      .action-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--tohfa-space-md);
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
      .secondary-btn {
        background: transparent;
        color: var(--tohfa-text-main);
        border: 1px solid rgba(4, 52, 44, 0.2);
        padding: var(--tohfa-space-sm) var(--tohfa-space-lg);
        border-radius: var(--tohfa-radius-button-standard);
        cursor: pointer;
      }
      .form-panel {
        background: var(--tohfa-surface);
        border: 1px solid rgba(4, 52, 44, 0.12);
        border-radius: var(--tohfa-radius-card-max);
        padding: var(--tohfa-space-xl);
        margin-bottom: var(--tohfa-space-xl);
      }
      .form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--tohfa-space-md);
      }
      .sticky-footer {
        position: sticky;
        bottom: 0;
        background: var(--tohfa-surface);
        padding: var(--tohfa-space-md);
        border-top: 1px solid rgba(4, 52, 44, 0.12);
        display: flex;
        justify-content: flex-end;
        gap: var(--tohfa-space-md);
        margin-top: var(--tohfa-space-lg);
      }
      .error-banner {
        color: var(--tohfa-error);
        font-size: var(--tohfa-font-size-footnote);
        margin-top: var(--tohfa-space-xs);
      }
    `,
  ],
  template: `
    <div class="action-header">
      <h2>Fair Price Ceilings</h2>
      <button
        *ngIf="canSetCeiling"
        type="button"
        class="primary-btn"
        (click)="toggleForm()"
      >
        {{ showForm() ? 'Close Form' : '+ Set New Ceiling' }}
      </button>
    </div>

    <!-- Set New Ceiling Form (SUPER_ADMIN write affordance) -->
    <div *ngIf="showForm() && canSetCeiling" class="form-panel">
      <h3>Set New Fair Price Ceiling</h3>
      <div class="form-grid">
        <div class="filter-group">
          <label>Crop ID</label>
          <input type="text" [(ngModel)]="newCropId" placeholder="e.g. UUID or Crop ID" />
        </div>
        <div class="filter-group">
          <label>Grade</label>
          <select [(ngModel)]="newGrade">
            <option value="GRADE_1">GRADE_1</option>
            <option value="GRADE_2">GRADE_2</option>
            <option value="GRADE_3">GRADE_3</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Ceiling Price (Rs/kg)</label>
          <input type="text" [(ngModel)]="newCeilingPrice" placeholder="e.g. 52.00" />
        </div>
        <div class="filter-group">
          <label>Frequency</label>
          <select [(ngModel)]="newFrequency">
            <option value="WEEKLY">WEEKLY</option>
            <option value="DAILY">DAILY</option>
            <option value="MONTHLY">MONTHLY</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Effective From (Date)</label>
          <input type="date" [(ngModel)]="newEffectiveFrom" />
        </div>
      </div>
      <div *ngIf="formError()" class="error-banner">{{ formError() }}</div>
      <div class="sticky-footer">
        <button type="button" class="secondary-btn" (click)="toggleForm()">Cancel</button>
        <button type="button" class="primary-btn" (click)="submitCeiling()">Save Ceiling</button>
      </div>
    </div>

    <!-- Filter Controls -->
    <div class="filter-bar">
      <div class="filter-group">
        <label>Crop ID</label>
        <input type="text" [(ngModel)]="filterCropId" (input)="loadData()" placeholder="Filter crop..." />
      </div>
      <div class="filter-group">
        <label>Grade</label>
        <select [(ngModel)]="filterGrade" (change)="loadData()">
          <option value="">All Grades</option>
          <option value="GRADE_1">GRADE_1</option>
          <option value="GRADE_2">GRADE_2</option>
          <option value="GRADE_3">GRADE_3</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Effective On</label>
        <input type="date" [(ngModel)]="filterEffectiveOn" (change)="loadData()" />
      </div>
    </div>

    <!-- Data Table -->
    <tohfa-data-table
      [columns]="columns"
      [rows]="items()"
      [total]="total()"
      [page]="page()"
      (pageChange)="onPageChange($event)"
      emptyMessage="No active fair price ceilings found for the criteria."
    />
  `,
})
export class FairPriceListComponent implements OnInit {
  private readonly pricingService = inject(AdminPricingService);
  private readonly rbacService = inject(RbacService);

  readonly items = signal<FairPrice[]>([]);
  readonly total = signal<number>(0);
  readonly page = signal<number>(1);
  readonly showForm = signal<boolean>(false);
  readonly formError = signal<string | null>(null);

  filterCropId = '';
  filterGrade = '';
  filterEffectiveOn = '';

  newCropId = '';
  newGrade = 'GRADE_1';
  newCeilingPrice = '';
  newFrequency = 'WEEKLY';
  newEffectiveFrom = new Date().toISOString().split('T')[0];

  get canSetCeiling(): boolean {
    return this.rbacService.can('pricing.fair_price.set');
  }

  readonly columns: Column<FairPrice>[] = [
    { key: 'cropName', header: 'Crop', format: (val, row) => (val as string) || row.cropId },
    { key: 'grade', header: 'Grade' },
    { key: 'ceilingPrice', header: 'Ceiling Price (Rs/kg)', align: 'right', format: (val) => String(val) },
    { key: 'frequency', header: 'Frequency' },
    {
      key: 'effectiveFrom',
      header: 'Effective Range',
      format: (_, row) => {
        const from = row.effectiveFrom || '—';
        const to = row.effectiveTo || 'Open';
        return `${from} to ${to}`;
      },
    },
  ];

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.pricingService
      .listFairPrices({
        cropId: this.filterCropId || undefined,
        grade: this.filterGrade || undefined,
        effectiveOn: this.filterEffectiveOn || undefined,
      })
      .subscribe({
        next: (res) => {
          this.items.set(res.items);
          this.total.set(res.items.length);
        },
        error: (err) => {
          console.error('Failed to load fair prices', err);
        },
      });
  }

  toggleForm(): void {
    this.showForm.set(!this.showForm());
    this.formError.set(null);
  }

  submitCeiling(): void {
    if (!this.newCropId || !this.newCeilingPrice || !this.newEffectiveFrom) {
      this.formError.set('Please fill out all required fields.');
      return;
    }

    this.pricingService
      .createFairPrice({
        cropId: this.newCropId,
        grade: this.newGrade,
        ceilingPrice: this.newCeilingPrice,
        frequency: this.newFrequency,
        effectiveFrom: this.newEffectiveFrom,
      })
      .subscribe({
        next: () => {
          this.showForm.set(false);
          this.formError.set(null);
          this.loadData();
        },
        error: (err) => {
          const detail = err.error?.detail || err.error?.message || 'Failed to save ceiling.';
          this.formError.set(detail);
        },
      });
  }

  onPageChange(newPage: number): void {
    this.page.set(newPage);
  }
}
