import { CommonModule } from '@angular/common';
import { TohfaTableComponent } from '../../shared/tohfa-table.component';
import { ChangeDetectionStrategy, Component, inject, signal, type OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RbacService } from '../../core/rbac.service';
import { PricingService, type FairPrice, type FairPriceCreate } from './pricing.service';

@Component({
  selector: 'tohfa-fair-price-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TohfaTableComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        display: block;
        font-family: 'Manrope', sans-serif;
      }
      .page-header {
        margin-bottom: var(--tohfa-space-lg, 24px);
      }
      .page-title {
        font-size: var(--tohfa-font-size-h1, 30px);
        font-weight: 700;
        color: var(--tohfa-neutral-900, #1f2937);
        letter-spacing: -0.01em;
        margin: 0 0 4px 0;
      }
      .toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--tohfa-space-lg, 24px);
        gap: var(--tohfa-space-md, 16px);
        flex-wrap: wrap;
        background: var(--tohfa-neutral-50, #f9fafb);
        border: 1px solid var(--tohfa-neutral-200, #eceff3);
        padding: var(--tohfa-space-md, 16px);
        border-radius: var(--tohfa-radius-md, 8px);
      }
      .filters {
        display: flex;
        gap: var(--tohfa-space-sm, 8px);
        align-items: center;
        flex-wrap: wrap;
      }
      select,
      input {
        padding: 9px var(--tohfa-space-md, 12px);
        border: 1.5px solid var(--tohfa-neutral-300, #e5e7eb);
        border-radius: var(--tohfa-radius-sm, 6px);
        background: var(--tohfa-white, #ffffff);
        font-family: 'Manrope', sans-serif;
        font-size: var(--tohfa-font-size-body, 14px);
        color: var(--tohfa-neutral-900, #1f2937);
        outline: none;
        transition: border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
      }
      select:hover,
      input:hover {
        border-color: var(--tohfa-neutral-400, #d1d5db);
      }
      select:focus,
      input:focus {
        border-color: var(--tohfa-primary, #2f7d32);
        box-shadow: 0 0 0 3px rgba(47, 125, 50, 0.14);
        background: var(--tohfa-primary-pale, #f4fbf4);
      }
      .btn-primary {
        background: var(--tohfa-primary, #2f7d32);
        color: var(--tohfa-white, #ffffff);
        padding: 9px var(--tohfa-space-lg, 24px);
        border: none;
        border-radius: var(--tohfa-radius-button, 8px);
        font-family: 'Manrope', sans-serif;
        font-weight: 600;
        cursor: pointer;
        font-size: var(--tohfa-font-size-body, 14px);
        transition: background 0.15s ease;
      }
      .btn-primary:hover {
        background: var(--tohfa-primary-dark, #1b5e20);
      }
      .money-val {
        font-family: var(--tohfa-font-mono, monospace);
        font-weight: 700;
        color: var(--tohfa-primary-dark, #1b5e20);
      }
      .grade-badge {
        display: inline-block;
        padding: 4px 10px;
        border-radius: var(--tohfa-radius-full, 999px);
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        background: var(--tohfa-neutral-100, #f3f4f6);
        color: var(--tohfa-neutral-700, #4b5563);
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
      .drawer-header h3 {
        margin: 0;
        font-size: var(--tohfa-font-size-title);
        color: var(--tohfa-on-surface);
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
      .form-group select,
      .form-group textarea {
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
    <div class="page-header">
      <h1 class="page-title">Fair Price Intelligence</h1>
    </div>

    <div class="toolbar">
      <div class="filters">
        <select [(ngModel)]="filterGrade" (change)="loadFairPrices()">
          <option value="">All Grades</option>
          <option value="GRADE_1">Grade 1</option>
          <option value="GRADE_2">Grade 2</option>
          <option value="GRADE_3">Grade 3</option>
          <option value="REJECT">Reject</option>
        </select>
        <input
          type="date"
          [(ngModel)]="filterEffectiveOn"
          (change)="loadFairPrices()"
          placeholder="Effective On"
        />
        <button class="btn-secondary" (click)="resetFilters()">Reset</button>
      </div>

      <button
        *ngIf="canSetCeiling()"
        class="btn-primary"
        (click)="openCreateDrawer()"
      >
        + Set New Ceiling
      </button>
    </div>

    <tohfa-table
      [rows]="fairPrices()"
      [colspan]="6"
      emptyMessage="No fair price ceilings in effect."
    >
      <ng-template #header>
        <th>Crop</th>
        <th>Grade</th>
        <th>Ceiling Price (₹/kg)</th>
        <th>Frequency</th>
        <th>Effective Window</th>
        <th>Notes</th>
      </ng-template>

      <ng-template #row let-item>
        <td>
          <strong>{{ item.cropName }}</strong>
        </td>
        <td>
          <span class="grade-badge">{{ item.grade }}</span>
        </td>
        <td class="money-val">₹{{ item.ceilingPrice }}</td>
        <td>{{ item.frequency }}</td>
        <td>
          {{ item.effectiveFrom }} &rarr;
          {{ item.effectiveTo ? item.effectiveTo : 'Open' }}
        </td>
        <td>{{ item.notes || '—' }}</td>
      </ng-template>
    </tohfa-table>

    <!-- Create Ceiling Drawer -->
    <div class="drawer-backdrop" *ngIf="isDrawerOpen()">
      <div class="drawer">
        <div class="drawer-header">
          <h3>Set Fair Price Ceiling</h3>
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
            <label>Ceiling Price (₹/kg)</label>
            <input
              type="text"
              [(ngModel)]="formCeilingPrice"
              placeholder="52.00"
            />
          </div>

          <div class="form-group">
            <label>Update Frequency</label>
            <select [(ngModel)]="formFrequency">
              <option value="WEEKLY">WEEKLY</option>
              <option value="DAILY">DAILY</option>
            </select>
          </div>

          <div class="form-group">
            <label>Effective From Date</label>
            <input type="date" [(ngModel)]="formEffectiveFrom" />
          </div>

          <div class="form-group">
            <label>Notes / Justification</label>
            <textarea
              rows="3"
              [(ngModel)]="formNotes"
              placeholder="Market committee review notes..."
            ></textarea>
          </div>
        </div>

        <div class="drawer-footer">
          <button class="btn-secondary" (click)="closeDrawer()">Cancel</button>
          <button class="btn-primary" [disabled]="isSubmitting()" (click)="submitCeiling()">
            {{ isSubmitting() ? 'Saving...' : 'Save Ceiling' }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class FairPriceListComponent implements OnInit {
  private readonly pricingService = inject(PricingService);
  private readonly rbac = inject(RbacService);

  readonly fairPrices = signal<FairPrice[]>([]);
  readonly isDrawerOpen = signal(false);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  filterGrade = '';
  filterEffectiveOn = '';

  formCropId = '';
  formGrade: 'GRADE_1' | 'GRADE_2' | 'GRADE_3' | 'REJECT' = 'GRADE_1';
  formCeilingPrice = '';
  formFrequency: 'DAILY' | 'WEEKLY' = 'WEEKLY';
  formEffectiveFrom = new Date().toISOString().slice(0, 10);
  formNotes = '';

  ngOnInit(): void {
    this.loadFairPrices();
  }

  canSetCeiling(): boolean {
    return this.rbac.can('pricing.fair_price.set');
  }

  loadFairPrices(): void {
    this.pricingService
      .listFairPrices({
        ...(this.filterGrade ? { grade: this.filterGrade } : {}),
        ...(this.filterEffectiveOn ? { effectiveOn: this.filterEffectiveOn } : {}),
      })
      .subscribe({
        next: (res) => this.fairPrices.set(res.items),
        error: () => this.fairPrices.set([]),
      });
  }

  resetFilters(): void {
    this.filterGrade = '';
    this.filterEffectiveOn = '';
    this.loadFairPrices();
  }

  openCreateDrawer(): void {
    this.errorMessage.set(null);
    this.isDrawerOpen.set(true);
  }

  closeDrawer(): void {
    this.isDrawerOpen.set(false);
  }

  submitCeiling(): void {
    if (!this.formCropId || !this.formCeilingPrice || !this.formEffectiveFrom) {
      this.errorMessage.set('Crop ID, Ceiling Price, and Effective Date are required.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const payload: FairPriceCreate = {
      cropId: this.formCropId.trim(),
      grade: this.formGrade,
      ceilingPrice: this.formCeilingPrice.trim(),
      frequency: this.formFrequency,
      effectiveFrom: this.formEffectiveFrom,
      ...(this.formNotes ? { notes: this.formNotes.trim() } : {}),
    };

    this.pricingService.createFairPrice(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closeDrawer();
        this.loadFairPrices();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err?.problem?.detail || err?.message || 'Failed to set fair price ceiling.');
      },
    });
  }
}
