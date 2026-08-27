import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PricingService, type BulkFairPriceItem, type FairPriceCreate } from './pricing.service';

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
        background: var(--tohfa-neutral-white);
        border-radius: var(--tohfa-radius-card-max);
        padding: var(--tohfa-space-xl);
        box-shadow: 0 1px 3px rgba(4, 52, 44, 0.08);
      }
      .instructions {
        margin-bottom: var(--tohfa-space-lg);
        font-size: var(--tohfa-font-size-body);
        color: var(--tohfa-on-surface);
      }
      .raw-input {
        width: 100%;
        font-family: var(--tohfa-font-mono);
        font-size: var(--tohfa-font-size-body-small);
        padding: var(--tohfa-space-md);
        border: 1px solid var(--tohfa-neutral-grey300);
        border-radius: var(--tohfa-radius-input);
        margin-bottom: var(--tohfa-space-md);
        box-sizing: border-box;
      }
      .actions {
        display: flex;
        gap: var(--tohfa-space-md);
        margin-bottom: var(--tohfa-space-xl);
      }
      .btn-primary {
        background: var(--tohfa-primary);
        color: var(--tohfa-neutral-white);
        padding: var(--tohfa-space-sm) var(--tohfa-space-lg);
        border: none;
        border-radius: var(--tohfa-radius-button);
        font-family: var(--tohfa-font-sans);
        font-weight: var(--tohfa-font-weight-semibold);
        cursor: pointer;
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
      .btn-primary:disabled,
      .btn-secondary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: var(--tohfa-space-md);
      }
      th,
      td {
        padding: var(--tohfa-space-sm) var(--tohfa-space-md);
        border-bottom: 1px solid var(--tohfa-neutral-grey100);
        font-size: var(--tohfa-font-size-body-small);
        text-align: left;
      }
      th {
        background: var(--tohfa-surface);
        font-size: var(--tohfa-font-size-footnote);
        text-transform: uppercase;
        font-weight: var(--tohfa-font-weight-semibold);
      }
      .row-error {
        background: rgba(226, 75, 74, 0.08);
      }
      .error-text {
        color: var(--tohfa-danger);
        font-weight: var(--tohfa-font-weight-medium);
        font-size: var(--tohfa-font-size-footnote);
      }
      .row-success {
        background: rgba(23, 52, 4, 0.08);
      }
      .success-banner {
        padding: var(--tohfa-space-md);
        background: rgba(23, 52, 4, 0.1);
        border: 1px solid var(--tohfa-success);
        color: var(--tohfa-success);
        border-radius: var(--tohfa-radius-input);
        margin-bottom: var(--tohfa-space-lg);
        font-weight: var(--tohfa-font-weight-semibold);
      }
      .error-banner {
        padding: var(--tohfa-space-md);
        background: rgba(226, 75, 74, 0.1);
        border: 1px solid var(--tohfa-danger);
        color: var(--tohfa-danger);
        border-radius: var(--tohfa-radius-input);
        margin-bottom: var(--tohfa-space-lg);
      }
    `,
  ],
  template: `
    <div class="panel">
      <h2>Bulk Fair Price Update</h2>
      <p class="instructions">
        Paste CSV or JSON rows of ceiling price updates. Format:
        <code>cropId,grade,ceilingPrice,frequency,effectiveFrom</code>
      </p>

      <div class="success-banner" *ngIf="successMessage()">
        {{ successMessage() }}
      </div>

      <div class="error-banner" *ngIf="generalError()">
        {{ generalError() }}
      </div>

      <textarea
        class="raw-input"
        rows="6"
        [(ngModel)]="rawInputText"
        placeholder="e.g.&#10;00000000-0000-0000-0000-000000000001,GRADE_1,52.00,WEEKLY,2026-09-01&#10;00000000-0000-0000-0000-000000000001,GRADE_2,45.00,WEEKLY,2026-09-01"
      ></textarea>

      <div class="actions">
        <button class="btn-secondary" (click)="parseInput()">Parse & Preview</button>
        <button
          class="btn-primary"
          [disabled]="parsedItems().length === 0 || isSubmitting()"
          (click)="submitBatch()"
        >
          {{ isSubmitting() ? 'Applying Update...' : 'Apply ' + parsedItems().length + ' Updates' }}
        </button>
      </div>

      <div *ngIf="parsedItems().length > 0">
        <h3>Preview Batch ({{ parsedItems().length }} rows)</h3>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Crop ID</th>
              <th>Grade</th>
              <th>Ceiling Price (₹)</th>
              <th>Frequency</th>
              <th>Effective From</th>
              <th>Status / Validation</th>
            </tr>
          </thead>
          <tbody>
            <tr
              *ngFor="let row of parsedItems(); let i = index"
              [class.row-error]="row.status === 'error'"
              [class.row-success]="row.status === 'success'"
            >
              <td>{{ i + 1 }}</td>
              <td><code>{{ row.cropId }}</code></td>
              <td>{{ row.grade }}</td>
              <td><strong>₹{{ row.ceilingPrice }}</strong></td>
              <td>{{ row.frequency }}</td>
              <td>{{ row.effectiveFrom }}</td>
              <td>
                <span *ngIf="row.status === 'error'" class="error-text">
                  ⚠️ {{ row.errorMessage }}
                </span>
                <span *ngIf="row.status === 'success'">✅ Applied</span>
                <span *ngIf="row.status === 'pending' || !row.status">Ready</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class BulkUpdateComponent {
  private readonly pricingService = inject(PricingService);

  rawInputText = '';
  readonly parsedItems = signal<BulkFairPriceItem[]>([]);
  readonly isSubmitting = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly generalError = signal<string | null>(null);

  parseInput(): void {
    this.generalError.set(null);
    this.successMessage.set(null);
    const text = this.rawInputText.trim();
    if (!text) {
      this.parsedItems.set([]);
      return;
    }

    const items: BulkFairPriceItem[] = [];

    // Try parsing as JSON first
    if (text.startsWith('[') && text.endsWith(']')) {
      try {
        const json = JSON.parse(text) as Array<Record<string, unknown>>;
        for (const j of json) {
          items.push({
            cropId: String(j['cropId'] ?? ''),
            grade: (String(j['grade'] ?? 'GRADE_1')) as 'GRADE_1' | 'GRADE_2' | 'GRADE_3' | 'REJECT',
            ceilingPrice: String(j['ceilingPrice'] ?? ''),
            frequency: (String(j['frequency'] ?? 'WEEKLY')) as 'DAILY' | 'WEEKLY',
            effectiveFrom: String(j['effectiveFrom'] ?? ''),
            status: 'pending',
          });
        }
      } catch {
        this.generalError.set('Invalid JSON format.');
        return;
      }
    } else {
      // Parse as CSV
      const lines = text.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const parts = trimmed.split(',').map((p) => p.trim());
        if (parts.length >= 3) {
          items.push({
            cropId: parts[0] ?? '',
            grade: (parts[1] ?? 'GRADE_1') as 'GRADE_1' | 'GRADE_2' | 'GRADE_3' | 'REJECT',
            ceilingPrice: parts[2] ?? '',
            frequency: (parts[3] ?? 'WEEKLY') as 'DAILY' | 'WEEKLY',
            effectiveFrom: parts[4] ?? new Date().toISOString().slice(0, 10),
            status: 'pending',
          });
        }
      }
    }

    this.parsedItems.set(items);
  }

  submitBatch(): void {
    const items = this.parsedItems();
    if (items.length === 0) return;

    this.isSubmitting.set(true);
    this.generalError.set(null);
    this.successMessage.set(null);

    const payload: FairPriceCreate[] = items.map((i) => ({
      cropId: i.cropId,
      grade: i.grade,
      ceilingPrice: i.ceilingPrice,
      frequency: i.frequency,
      effectiveFrom: i.effectiveFrom,
    }));

    this.pricingService.bulkUpsertFairPrices(payload).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        this.successMessage.set(`Successfully applied ${res.applied} fair price ceilings!`);
        this.parsedItems.update((current) =>
          current.map((item) => ({ ...item, status: 'success', errorMessage: undefined })),
        );
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const metaErrors = err?.problem?.meta?.errors as Array<{
          index: number;
          field: string;
          message: string;
        }>;

        if (Array.isArray(metaErrors) && metaErrors.length > 0) {
          const errorMap = new Map<number, string>();
          for (const me of metaErrors) {
            errorMap.set(me.index, me.message);
          }

          this.parsedItems.update((current) =>
            current.map((item, idx) => {
              const msg = errorMap.get(idx);
              if (msg) {
                return { ...item, status: 'error', errorMessage: msg };
              }
              return { ...item, status: 'pending', errorMessage: undefined };
            }),
          );

          this.generalError.set('Bulk update rejected: Please fix the highlighted rows above.');
        } else {
          this.generalError.set(err?.problem?.detail || err?.message || 'Bulk update failed.');
        }
      },
    });
  }
}
