import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RbacService } from '../../core/rbac.service';
import { AdminPricingService, ApiProblem, FairPriceCreate } from './pricing.service';

export interface BulkPreviewRow extends FairPriceCreate {
  index: number;
  error?: string;
}

@Component({
  selector: 'tohfa-bulk-update',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        display: block;
      }
      .panel {
        background: var(--tohfa-surface);
        border: 1px solid rgba(4, 52, 44, 0.12);
        border-radius: var(--tohfa-radius-card-max);
        padding: var(--tohfa-space-xl);
        margin-bottom: var(--tohfa-space-xl);
      }
      textarea {
        width: 100%;
        height: 140px;
        font-family: monospace;
        padding: var(--tohfa-space-md);
        border: 1px solid rgba(4, 52, 44, 0.2);
        border-radius: var(--tohfa-radius-input-standard);
        font-size: var(--tohfa-font-size-body-small);
        margin-bottom: var(--tohfa-space-md);
      }
      .preview-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: var(--tohfa-space-md);
      }
      .preview-table th,
      .preview-table td {
        padding: var(--tohfa-space-md);
        border-bottom: 1px solid rgba(4, 52, 44, 0.08);
        text-align: left;
        font-size: var(--tohfa-font-size-body-small);
      }
      .preview-table th {
        background: var(--tohfa-surface);
        font-weight: var(--tohfa-font-weight-semibold);
      }
      .row-error {
        background: rgba(220, 38, 38, 0.08);
      }
      .error-text {
        color: var(--tohfa-error);
        font-size: var(--tohfa-font-size-caption);
        font-weight: var(--tohfa-font-weight-semibold);
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
        margin-right: var(--tohfa-space-sm);
      }
      .banner-error {
        color: var(--tohfa-error);
        background: rgba(220, 38, 38, 0.06);
        padding: var(--tohfa-space-md);
        border-radius: var(--tohfa-radius-input-standard);
        margin-bottom: var(--tohfa-space-md);
      }
      .success-banner {
        color: var(--tohfa-primary);
        background: rgba(15, 110, 86, 0.08);
        padding: var(--tohfa-space-md);
        border-radius: var(--tohfa-radius-input-standard);
        margin-bottom: var(--tohfa-space-md);
      }
    `,
  ],
  template: `
    <h2>Bulk Fair Price Update</h2>
    <p>Paste JSON array or CSV format (cropId, grade, ceilingPrice, frequency, effectiveFrom):</p>

    <div *ngIf="!canBulkUpdate" class="banner-error">
      You have read-only permissions. Bulk updates require SUPER_ADMIN access.
    </div>

    <div class="panel">
      <textarea
        [(ngModel)]="rawText"
        placeholder='[&#10;  { "cropId": "11112222-...", "grade": "GRADE_1", "ceilingPrice": "52.00", "effectiveFrom": "2026-08-26" }&#10;]'
        [disabled]="!canBulkUpdate"
      ></textarea>

      <div>
        <button type="button" class="secondary-btn" (click)="parseText()" [disabled]="!canBulkUpdate">
          Parse & Preview
        </button>
        <button
          *ngIf="rows().length > 0 && canBulkUpdate"
          type="button"
          class="primary-btn"
          (click)="submitBulk()"
        >
          Submit Bulk Update ({{ rows().length }} rows)
        </button>
      </div>
    </div>

    <div *ngIf="globalError()" class="banner-error">
      {{ globalError() }}
    </div>

    <div *ngIf="successMessage()" class="success-banner">
      {{ successMessage() }}
    </div>

    <!-- Preview Table -->
    <div *ngIf="rows().length > 0" class="panel">
      <h3>Preview Batch</h3>
      <table class="preview-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Crop ID</th>
            <th>Grade</th>
            <th>Proposed Ceiling</th>
            <th>Effective From</th>
            <th>Status / Errors</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let row of rows()" [class.row-error]="!!row.error">
            <td>{{ row.index + 1 }}</td>
            <td>{{ row.cropId }}</td>
            <td>{{ row.grade }}</td>
            <td>{{ row.ceilingPrice }}</td>
            <td>{{ row.effectiveFrom }}</td>
            <td>
              <span *ngIf="row.error" class="error-text">❌ {{ row.error }}</span>
              <span *ngIf="!row.error" style="color: var(--tohfa-primary)">✓ Ready</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
})
export class BulkUpdateComponent {
  private readonly pricingService = inject(AdminPricingService);
  private readonly rbacService = inject(RbacService);

  rawText = '';
  readonly rows = signal<BulkPreviewRow[]>([]);
  readonly globalError = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  get canBulkUpdate(): boolean {
    return this.rbacService.can('pricing.fair_price.bulk_update');
  }

  parseText(): void {
    this.globalError.set(null);
    this.successMessage.set(null);
    const text = this.rawText.trim();
    if (!text) {
      this.rows.set([]);
      return;
    }

    try {
      if (text.startsWith('[') || text.startsWith('{')) {
        const parsed = JSON.parse(text);
        const list = Array.isArray(parsed) ? parsed : [parsed];
        const previewRows: BulkPreviewRow[] = list.map((item, idx) => ({
          index: idx,
          cropId: item.cropId || '',
          grade: item.grade || 'GRADE_1',
          ceilingPrice: String(item.ceilingPrice || ''),
          frequency: item.frequency || 'WEEKLY',
          effectiveFrom: item.effectiveFrom || new Date().toISOString().split('T')[0],
          notes: item.notes,
        }));
        this.rows.set(previewRows);
      } else {
        // CSV line parsing: cropId,grade,ceilingPrice,frequency,effectiveFrom
        const lines = text.split('\n').filter((l) => l.trim().length > 0);
        const previewRows: BulkPreviewRow[] = lines.map((line, idx) => {
          const parts = line.split(',').map((p) => p.trim());
          return {
            index: idx,
            cropId: parts[0] || '',
            grade: parts[1] || 'GRADE_1',
            ceilingPrice: parts[2] || '',
            frequency: parts[3] || 'WEEKLY',
            effectiveFrom: parts[4] || new Date().toISOString().split('T')[0],
          };
        });
        this.rows.set(previewRows);
      }
    } catch {
      this.globalError.set('Failed to parse content. Please ensure valid JSON or CSV format.');
    }
  }

  submitBulk(): void {
    if (this.rows().length === 0) return;

    this.globalError.set(null);
    this.successMessage.set(null);

    // Clear previous row errors
    const currentRows = this.rows().map((r) => ({ ...r, error: undefined }));
    this.rows.set(currentRows);

    const payload: FairPriceCreate[] = currentRows.map((r) => ({
      cropId: r.cropId,
      grade: r.grade,
      ceilingPrice: r.ceilingPrice,
      frequency: r.frequency,
      effectiveFrom: r.effectiveFrom,
      notes: r.notes,
    }));

    this.pricingService.bulkUpsertFairPrices(payload).subscribe({
      next: (res) => {
        this.successMessage.set(`Successfully applied ${res.applied} price ceilings in bulk.`);
        this.rows.set([]);
        this.rawText = '';
      },
      error: (err) => {
        const problem = err.error as ApiProblem;
        if (problem && problem.errors && problem.errors.length > 0) {
          const updated = [...this.rows()];
          problem.errors.forEach((e) => {
            const idx = e.index ?? 0;
            if (updated[idx]) {
              updated[idx] = { ...updated[idx], error: e.message };
            }
          });
          this.rows.set(updated);
          this.globalError.set(`Bulk update rejected: ${problem.errors.length} validation errors found.`);
        } else {
          this.globalError.set(problem?.detail || problem?.title || 'Failed to apply bulk update.');
        }
      },
    });
  }
}
