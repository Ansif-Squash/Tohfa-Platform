import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Column, DataTableComponent } from '../../shared/data-table/data-table.component';
import { RbacService } from '../../core/rbac.service';
import { AdminPricingService, ApiProblem, FairPrice, RetailPrice } from './pricing.service';

@Component({
  selector: 'tohfa-retail-pricing',
  standalone: true,
  imports: [CommonModule, FormsModule, DataTableComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        display: block;
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
      .form-group {
        display: flex;
        flex-direction: column;
        gap: var(--tohfa-space-xs);
      }
      .form-group label {
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
      .ceiling-info {
        font-size: var(--tohfa-font-size-caption);
        color: var(--tohfa-primary);
        margin-top: var(--tohfa-space-xs);
        font-weight: var(--tohfa-font-weight-semibold);
      }
      .field-error {
        color: var(--tohfa-error);
        font-size: var(--tohfa-font-size-caption);
        margin-top: var(--tohfa-space-xs);
      }
      .primary-btn {
        background: var(--tohfa-primary);
        color: #fff;
        padding: var(--tohfa-space-sm) var(--tohfa-space-lg);
        border-radius: var(--tohfa-radius-button-standard);
        border: none;
        cursor: pointer;
        font-weight: var(--tohfa-font-weight-medium);
        margin-top: var(--tohfa-space-md);
      }
      .filter-bar {
        display: flex;
        gap: var(--tohfa-space-md);
        margin-bottom: var(--tohfa-space-lg);
      }
    `,
  ],
  template: `
    <h2>Retail Pricing</h2>

    <!-- Form to Set Retail Price -->
    <div *ngIf="canSetRetailPrice" class="form-panel">
      <h3>Set Customer-Facing Retail Price</h3>
      <div class="form-grid">
        <div class="form-group">
          <label>Crop ID</label>
          <input
            type="text"
            [(ngModel)]="newCropId"
            (change)="fetchGoverningCeiling()"
            placeholder="Crop UUID"
          />
        </div>
        <div class="form-group">
          <label>Grade</label>
          <select [(ngModel)]="newGrade" (change)="fetchGoverningCeiling()">
            <option value="GRADE_1">GRADE_1</option>
            <option value="GRADE_2">GRADE_2</option>
            <option value="GRADE_3">GRADE_3</option>
          </select>
        </div>
        <div class="form-group">
          <label>Retail Price (Rs/kg)</label>
          <input type="text" [(ngModel)]="newRetailPrice" placeholder="e.g. 45.00" />
          <div *ngIf="governingCeiling()" class="ceiling-info">
            Governing Ceiling: Rs {{ governingCeiling() }}/kg
          </div>
          <div *ngIf="fieldError()" class="field-error">
            ⚠️ {{ fieldError() }}
          </div>
        </div>
        <div class="form-group">
          <label>Effective From</label>
          <input type="date" [(ngModel)]="newEffectiveFrom" />
        </div>
      </div>
      <button type="button" class="primary-btn" (click)="submitRetailPrice()">Save Retail Price</button>
    </div>

    <!-- Filter Bar -->
    <div class="filter-bar">
      <div class="form-group">
        <label>Crop ID</label>
        <input type="text" [(ngModel)]="filterCropId" (input)="loadData()" placeholder="Filter crop..." />
      </div>
      <div class="form-group">
        <label>Grade</label>
        <select [(ngModel)]="filterGrade" (change)="loadData()">
          <option value="">All Grades</option>
          <option value="GRADE_1">GRADE_1</option>
          <option value="GRADE_2">GRADE_2</option>
          <option value="GRADE_3">GRADE_3</option>
        </select>
      </div>
    </div>

    <!-- Table -->
    <tohfa-data-table
      [columns]="columns"
      [rows]="items()"
      [total]="total()"
      [page]="page()"
      (pageChange)="onPageChange($event)"
      emptyMessage="No retail prices configured."
    />
  `,
})
export class RetailPricingComponent implements OnInit {
  private readonly pricingService = inject(AdminPricingService);
  private readonly rbacService = inject(RbacService);

  readonly items = signal<RetailPrice[]>([]);
  readonly total = signal<number>(0);
  readonly page = signal<number>(1);
  readonly governingCeiling = signal<string | null>(null);
  readonly fieldError = signal<string | null>(null);

  filterCropId = '';
  filterGrade = '';

  newCropId = '';
  newGrade = 'GRADE_1';
  newRetailPrice = '';
  newEffectiveFrom = new Date().toISOString().split('T')[0];

  get canSetRetailPrice(): boolean {
    return this.rbacService.can('pricing.retail_price.set');
  }

  readonly columns: Column<RetailPrice>[] = [
    { key: 'cropName', header: 'Crop', format: (val, row) => (val as string) || row.cropId },
    { key: 'grade', header: 'Grade' },
    { key: 'price', header: 'Retail Price (Rs/kg)', align: 'right', format: (val) => String(val) },
    { key: 'effectiveFrom', header: 'Effective From' },
  ];

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.pricingService
      .listRetailPrices({
        cropId: this.filterCropId || undefined,
        grade: this.filterGrade || undefined,
      })
      .subscribe({
        next: (res) => {
          this.items.set(res.items);
          this.total.set(res.items.length);
        },
        error: (err) => {
          console.error('Failed to load retail prices', err);
        },
      });
  }

  fetchGoverningCeiling(): void {
    if (!this.newCropId) {
      this.governingCeiling.set(null);
      return;
    }
    this.pricingService
      .listFairPrices({ cropId: this.newCropId, grade: this.newGrade })
      .subscribe({
        next: (res) => {
          if (res.items && res.items.length > 0) {
            this.governingCeiling.set(res.items[0].ceilingPrice);
          } else {
            this.governingCeiling.set(null);
          }
        },
      });
  }

  submitRetailPrice(): void {
    if (!this.newCropId || !this.newRetailPrice || !this.newEffectiveFrom) {
      this.fieldError.set('All fields are required.');
      return;
    }
    this.fieldError.set(null);

    this.pricingService
      .createRetailPrice({
        cropId: this.newCropId,
        grade: this.newGrade,
        price: this.newRetailPrice,
        effectiveFrom: this.newEffectiveFrom,
      })
      .subscribe({
        next: () => {
          this.loadData();
          this.newRetailPrice = '';
          this.fieldError.set(null);
        },
        error: (err) => {
          const problem = err.error as ApiProblem;
          const ceiling = (problem?.meta?.ceilingPrice as string) || this.governingCeiling();
          if (err.status === 422 && ceiling) {
            this.fieldError.set(
              `Retail price (${this.newRetailPrice}) exceeds maximum allowed ceiling of ${ceiling}.`,
            );
          } else {
            this.fieldError.set(problem?.detail || problem?.title || 'Failed to set retail price.');
          }
        },
      });
  }

  onPageChange(newPage: number): void {
    this.page.set(newPage);
  }
}
