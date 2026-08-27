import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal, type OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RbacService } from '../../core/rbac.service';
import { PricingService, type RetailPrice, type RetailPriceCreate } from './pricing.service';

@Component({
  selector: 'tohfa-retail-pricing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        display: block;
      }
      .toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--tohfa-space-lg);
        gap: var(--tohfa-space-md);
      }
      .filters {
        display: flex;
        gap: var(--tohfa-space-sm);
      }
      select,
      input {
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
        font-weight: var(--tohfa-font-weight-semibold);
        cursor: pointer;
        font-size: var(--tohfa-font-size-body-small);
      }
      .table-card {
        background: var(--tohfa-neutral-white);
        border-radius: var(--tohfa-radius-card-max);
        box-shadow: 0 1px 3px rgba(4, 52, 44, 0.08);
        overflow: hidden;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        text-align: left;
      }
      th,
      td {
        padding: var(--tohfa-space-md) var(--tohfa-space-lg);
        border-bottom: 1px solid var(--tohfa-neutral-grey100);
        font-size: var(--tohfa-font-size-body-small);
      }
      th {
        background: var(--tohfa-surface);
        font-weight: var(--tohfa-font-weight-semibold);
        font-size: var(--tohfa-font-size-footnote);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .price-val {
        font-family: var(--tohfa-font-mono);
        font-weight: var(--tohfa-font-weight-bold);
        color: var(--tohfa-on-surface);
      }
      .ceiling-val {
        font-family: var(--tohfa-font-mono);
        color: var(--tohfa-neutral-grey700);
      }
      .grade-badge {
        display: inline-block;
        padding: var(--tohfa-space-xs) var(--tohfa-space-sm);
        border-radius: var(--tohfa-radius-pill);
        font-size: var(--tohfa-font-size-caption);
        background: var(--tohfa-neutral-grey100);
      }
      .empty-row {
        text-align: center;
        padding: var(--tohfa-space-xxl);
        color: var(--tohfa-neutral-grey500);
      }
      /* Drawer */
      .drawer-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.4);
        z-index: 100;
        display: flex;
        justify-content: flex-end;
      }
      .drawer {
        width: 480px;
        max-width: 100%;
        height: 100%;
        background: var(--tohfa-neutral-white);
        box-shadow: -4px 0 16px rgba(0, 0, 0, 0.15);
        display: flex;
        flex-direction: column;
      }
      .drawer-header {
        padding: var(--tohfa-space-lg) var(--tohfa-space-xl);
        border-bottom: 1px solid var(--tohfa-neutral-grey100);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .drawer-body {
        padding: var(--tohfa-space-xl);
        flex: 1;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: var(--tohfa-space-md);
      }
      .drawer-footer {
        padding: var(--tohfa-space-lg) var(--tohfa-space-xl);
        border-top: 1px solid var(--tohfa-neutral-grey100);
        display: flex;
        justify-content: flex-end;
        gap: var(--tohfa-space-md);
        background: var(--tohfa-surface);
      }
      .form-group {
        display: flex;
        flex-direction: column;
        gap: var(--tohfa-space-xs);
      }
      .form-group label {
        font-size: var(--tohfa-font-size-footnote);
        font-weight: var(--tohfa-font-weight-semibold);
        color: var(--tohfa-on-surface);
        text-transform: uppercase;
      }
      .form-group input,
      .form-group select {
        width: 100%;
        box-sizing: border-box;
      }
      .error-banner {
        padding: var(--tohfa-space-sm) var(--tohfa-space-md);
        background: rgba(226, 75, 74, 0.1);
        border: 1px solid var(--tohfa-danger);
        color: var(--tohfa-danger);
        border-radius: var(--tohfa-radius-input);
        font-size: var(--tohfa-font-size-body-small);
      }
      .btn-secondary {
        background: var(--tohfa-neutral-grey100);
        color: var(--tohfa-on-surface);
        padding: var(--tohfa-space-sm) var(--tohfa-space-lg);
        border: none;
        border-radius: var(--tohfa-radius-button);
        cursor: pointer;
        font-weight: var(--tohfa-font-weight-semibold);
      }
    `,
  ],
  template: `
    <div class="toolbar">
      <div class="filters">
        <select [(ngModel)]="filterGrade" (change)="loadRetailPrices()">
          <option value="">All Grades</option>
          <option value="GRADE_1">Grade 1</option>
          <option value="GRADE_2">Grade 2</option>
          <option value="GRADE_3">Grade 3</option>
          <option value="REJECT">Reject</option>
        </select>
      </div>

      <button
        *ngIf="canSetRetailPrice()"
        class="btn-primary"
        (click)="openCreateDrawer()"
      >
        + Set Retail Price
      </button>
    </div>

    <div class="table-card">
      <table>
        <thead>
          <tr>
            <th>Crop</th>
            <th>Grade</th>
            <th>Retail Price (₹/kg)</th>
            <th>Governing Ceiling (₹/kg)</th>
            <th>Markup %</th>
            <th>GST Incl.</th>
            <th>Effective Window</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let item of retailPrices()">
            <td>
              <strong>{{ item.cropName }}</strong>
            </td>
            <td>
              <span class="grade-badge">{{ item.grade }}</span>
            </td>
            <td class="price-val">₹{{ item.price }}</td>
            <td class="ceiling-val">₹{{ item.ceilingPrice }}</td>
            <td>{{ item.markupPct !== null ? item.markupPct + '%' : '—' }}</td>
            <td>{{ item.gstInclusive ? 'Yes' : 'No' }}</td>
            <td>
              {{ item.effectiveFrom }} &rarr;
              {{ item.effectiveTo ? item.effectiveTo : 'Open' }}
            </td>
          </tr>
          <tr *ngIf="retailPrices().length === 0">
            <td colspan="7" class="empty-row">No active retail prices found.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create Retail Price Drawer -->
    <div class="drawer-backdrop" *ngIf="isDrawerOpen()">
      <div class="drawer">
        <div class="drawer-header">
          <h3>Set Retail Price</h3>
          <button class="btn-secondary" (click)="closeDrawer()">✕</button>
        </div>

        <div class="drawer-body">
          <div class="error-banner" *ngIf="errorMessage()">
            {{ errorMessage() }}
          </div>

          <div class="form-group">
            <label>Crop ID (UUID)</label>
            <input
              type="text"
              [(ngModel)]="formCropId"
              placeholder="e.g. 00000000-0000-0000-0000-000000000000"
            />
          </div>

          <div class="form-group">
            <label>Grade</label>
            <select [(ngModel)]="formGrade">
              <option value="GRADE_1">Grade 1 (Premium)</option>
              <option value="GRADE_2">Grade 2 (Standard)</option>
              <option value="GRADE_3">Grade 3 (Economy)</option>
              <option value="REJECT">Reject</option>
            </select>
          </div>

          <div class="form-group">
            <label>Retail Price (₹/kg)</label>
            <input
              type="text"
              [(ngModel)]="formPrice"
              placeholder="e.g. 50.00"
            />
            <small style="color: var(--tohfa-neutral-grey700);">
              Must be at or below the governing fair price ceiling (BR-09a).
            </small>
          </div>

          <div class="form-group">
            <label>Markup Percentage (%)</label>
            <input
              type="number"
              [(ngModel)]="formMarkupPct"
              placeholder="e.g. 15"
            />
          </div>

          <div class="form-group">
            <label>
              <input type="checkbox" [(ngModel)]="formGstInclusive" />
              GST Inclusive
            </label>
          </div>

          <div class="form-group">
            <label>Effective From Date</label>
            <input type="date" [(ngModel)]="formEffectiveFrom" />
          </div>
        </div>

        <div class="drawer-footer">
          <button class="btn-secondary" (click)="closeDrawer()">Cancel</button>
          <button class="btn-primary" [disabled]="isSubmitting()" (click)="submitRetailPrice()">
            {{ isSubmitting() ? 'Saving...' : 'Save Retail Price' }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class RetailPricingComponent implements OnInit {
  private readonly pricingService = inject(PricingService);
  private readonly rbac = inject(RbacService);

  readonly retailPrices = signal<RetailPrice[]>([]);
  readonly isDrawerOpen = signal(false);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  filterGrade = '';

  formCropId = '';
  formGrade: 'GRADE_1' | 'GRADE_2' | 'GRADE_3' | 'REJECT' = 'GRADE_1';
  formPrice = '';
  formMarkupPct: number | undefined = undefined;
  formGstInclusive = true;
  formEffectiveFrom = new Date().toISOString().slice(0, 10);

  ngOnInit(): void {
    this.loadRetailPrices();
  }

  canSetRetailPrice(): boolean {
    return this.rbac.can('pricing.retail_price.set');
  }

  loadRetailPrices(): void {
    this.pricingService
      .listRetailPrices({
        ...(this.filterGrade ? { grade: this.filterGrade } : {}),
      })
      .subscribe({
        next: (res) => this.retailPrices.set(res.items),
        error: () => this.retailPrices.set([]),
      });
  }

  openCreateDrawer(): void {
    this.errorMessage.set(null);
    this.isDrawerOpen.set(true);
  }

  closeDrawer(): void {
    this.isDrawerOpen.set(false);
  }

  submitRetailPrice(): void {
    if (!this.formCropId || !this.formPrice || !this.formEffectiveFrom) {
      this.errorMessage.set('Crop ID, Retail Price, and Effective Date are required.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const payload: RetailPriceCreate = {
      cropId: this.formCropId.trim(),
      grade: this.formGrade,
      price: this.formPrice.trim(),
      ...(this.formMarkupPct !== undefined ? { markupPct: this.formMarkupPct } : {}),
      gstInclusive: this.formGstInclusive,
      effectiveFrom: this.formEffectiveFrom,
    };

    this.pricingService.createRetailPrice(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closeDrawer();
        this.loadRetailPrices();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const meta = err?.problem?.meta;
        if (err?.problem?.code === 'PRICE_ABOVE_CEILING' && meta?.ceilingPrice) {
          this.errorMessage.set(
            `Price ₹${meta.attemptedPrice} exceeds fair price ceiling of ₹${meta.ceilingPrice}.`,
          );
        } else {
          this.errorMessage.set(err?.problem?.detail || err?.message || 'Failed to set retail price.');
        }
      },
    });
  }
}
