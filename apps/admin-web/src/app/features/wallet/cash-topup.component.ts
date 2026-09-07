import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CashTopupService, type WalletTransactionResponse } from './cash-topup.service';

@Component({
  selector: 'tohfa-cash-topup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        display: block;
        padding-bottom: 88px; /* Space for sticky footer */
        font-family: 'Manrope', sans-serif;
      }
      .page-container {
     
        margin: 0 auto;
        padding: var(--tohfa-space-xxl, 48px) var(--tohfa-space-xl, 32px);
      }
      .page-header {
        margin-bottom: var(--tohfa-space-xl, 32px);
      }
      .page-header h1 {
        margin: 0 0 4px 0;
        font-size: var(--tohfa-font-size-h1, 30px);
        font-weight: 700;
        color: var(--tohfa-neutral-900, #1f2937);
        letter-spacing: -0.01em;
      }
      .page-header p {
        margin: 0;
        color: var(--tohfa-neutral-600, #6b7280);
        font-size: var(--tohfa-font-size-body, 14px);
      }

      /* ---------- Card ---------- */
      .card {
        background: var(--tohfa-white, #ffffff);
        border: 1px solid var(--tohfa-neutral-300, #e5e7eb);
        border-radius: var(--tohfa-radius-lg, 12px);
        padding: var(--tohfa-space-xl, 32px);
        box-shadow: 0 1px 3px rgba(17, 24, 39, 0.05);
        margin-bottom: var(--tohfa-space-xl, 32px);
      }

      /* ---------- Form ---------- */
      .form-group {
        margin-bottom: var(--tohfa-space-lg, 16px);
      }
      .form-group label {
        display: block;
        font-size: 13px;
        font-weight: 700;
        color: var(--tohfa-neutral-800, #374151);
        margin-bottom: 6px;
      }
      .form-group .hint {
        font-size: 12px;
        color: var(--tohfa-neutral-500, #9ca3af);
        margin-top: 6px;
      }
      .form-control {
        width: 100%;
        padding: 10px var(--tohfa-space-md, 12px);
        border: 1.5px solid var(--tohfa-neutral-300, #e5e7eb);
        border-radius: var(--tohfa-radius-sm, 6px);
        font-size: var(--tohfa-font-size-body, 14px);
        font-family: inherit;
        color: var(--tohfa-neutral-900, #1f2937);
        background: var(--tohfa-white, #ffffff);
        box-sizing: border-box;
        outline: none;
        transition: border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
      }
      .form-control:hover {
        border-color: var(--tohfa-neutral-400, #d1d5db);
      }
      .form-control:focus {
        border-color: var(--tohfa-primary, #2f7d32);
        box-shadow: 0 0 0 3px rgba(47, 125, 50, 0.14);
        background: var(--tohfa-primary-pale, #f4fbf4);
      }
      .form-control.is-invalid {
        border-color: var(--tohfa-error, #dc2626);
      }
      .form-control.is-invalid:focus {
        box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.14);
        background: var(--tohfa-error-light, #fef2f2);
      }
      .error-text {
        font-size: 12px;
        font-weight: 600;
        color: var(--tohfa-error, #dc2626);
        margin-top: 6px;
      }

      /* ---------- Alerts ---------- */
      .alert {
        padding: var(--tohfa-space-md, 12px) var(--tohfa-space-lg, 16px);
        border-radius: var(--tohfa-radius-md, 8px);
        margin-bottom: var(--tohfa-space-lg, 16px);
        font-size: var(--tohfa-font-size-body, 14px);
        border: 1px solid transparent;
      }
      .alert-danger {
        background: var(--tohfa-error-light, #fef2f2);
        color: #991b1b;
        border-color: rgba(220, 38, 38, 0.25);
        font-weight: 600;
      }
      .alert-success {
        background: var(--tohfa-success-light, #f0fdf4);
        color: var(--tohfa-primary-dark, #1b5e20);
        border-color: rgba(22, 163, 74, 0.25);
      }
      .alert-success strong {
        color: var(--tohfa-success, #16a34a);
      }

      /* ---------- Quick amount chips ---------- */
      .quick-chips {
        display: flex;
        gap: 8px;
        margin-top: 10px;
        flex-wrap: wrap;
      }
      .chip-btn {
        background: var(--tohfa-primary-pale, #f4fbf4);
        border: 1.5px solid var(--tohfa-primary-light, #e8f5e9);
        border-radius: var(--tohfa-radius-full, 999px);
        padding: 6px 14px;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        color: var(--tohfa-primary-dark, #1b5e20);
        transition: background-color 0.15s ease, border-color 0.15s ease, transform 0.1s ease;
      }
      .chip-btn:hover {
        background: var(--tohfa-primary, #2f7d32);
        border-color: var(--tohfa-primary, #2f7d32);
        color: #fff;
        transform: translateY(-1px);
      }

      /* ---------- Sticky footer ---------- */
      .sticky-footer {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: var(--tohfa-white, #ffffff);
        border-top: 1px solid var(--tohfa-neutral-300, #e5e7eb);
        padding: var(--tohfa-space-md, 12px) var(--tohfa-space-xl, 32px);
        display: flex;
        justify-content: flex-end;
        gap: var(--tohfa-space-md, 12px);
        box-shadow: 0 -8px 20px rgba(17, 24, 39, 0.06);
        z-index: 100;
      }
      .btn {
        padding: 10px 22px;
        border-radius: var(--tohfa-radius-sm, 6px);
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        border: none;
        transition: background-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
      }
      .btn-secondary {
        background: var(--tohfa-neutral-100, #f3f4f6);
        color: var(--tohfa-neutral-800, #374151);
        border: 1px solid var(--tohfa-neutral-300, #e5e7eb);
      }
      .btn-secondary:hover {
        background: var(--tohfa-neutral-200, #eceff3);
      }
      .btn-primary {
        background: var(--tohfa-primary, #2f7d32);
        color: #fff;
        box-shadow: 0 1px 2px rgba(27, 94, 32, 0.25);
      }
      .btn-primary:hover:not(:disabled) {
        background: var(--tohfa-primary-dark, #1b5e20);
        box-shadow: 0 4px 10px rgba(27, 94, 32, 0.3);
        transform: translateY(-1px);
      }
      .btn-primary:disabled {
        opacity: 0.55;
        cursor: not-allowed;
        transform: none;
      }

      /* ---------- Transaction summary ---------- */
      .tx-summary {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: var(--tohfa-space-md, 12px);
        margin-top: var(--tohfa-space-md, 12px);
      }
      .tx-summary-item {
        background: var(--tohfa-white, #ffffff);
        border: 1px solid rgba(22, 163, 74, 0.2);
        padding: var(--tohfa-space-sm, 10px) var(--tohfa-space-md, 12px);
        border-radius: var(--tohfa-radius-sm, 6px);
      }
      .tx-summary-item span {
        display: block;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--tohfa-neutral-500, #9ca3af);
        margin-bottom: 2px;
      }
      .tx-summary-item strong {
        font-size: 17px;
        font-weight: 700;
        color: var(--tohfa-neutral-900, #1f2937);
      }
    `,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Admin Cash Top-Up</h1>
        <p>Convert physical customer cash into wallet credit with fiscal receipt accountability.</p>
      </div>

      <div *ngIf="errorMessage()" class="alert alert-danger">
        {{ errorMessage() }}
      </div>

      <div *ngIf="successResult() as res" class="alert alert-success">
        <strong>Cash top-up processed successfully!</strong>
        <div class="tx-summary">
          <div class="tx-summary-item">
            <span>Transaction ID</span>
            <strong>{{ res.id }}</strong>
          </div>
          <div class="tx-summary-item">
            <span>New Wallet Balance</span>
            <strong>₹{{ res.balanceAfter }}</strong>
          </div>
        </div>
      </div>

      <div class="card">
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="customerId">Customer ID *</label>
            <input
              id="customerId"
              type="text"
              class="form-control"
              [class.is-invalid]="isFieldInvalid('customerId')"
              formControlName="customerId"
              placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
            />
            <div *ngIf="isFieldInvalid('customerId')" class="error-text">
              Valid Customer UUID is required.
            </div>
          </div>

          <div class="form-group">
            <label for="warehouseId">Warehouse ID *</label>
            <input
              id="warehouseId"
              type="text"
              class="form-control"
              [class.is-invalid]="isFieldInvalid('warehouseId')"
              formControlName="warehouseId"
              placeholder="e.g. 3f1b7c2e-2a44-4f0e-9b1a-6b0d2f0f1a01"
            />
            <div *ngIf="isFieldInvalid('warehouseId')" class="error-text">
              Valid Warehouse UUID is required.
            </div>
          </div>

          <div class="form-group">
            <label for="amount">Top-Up Amount (INR) *</label>
            <input
              id="amount"
              type="text"
              class="form-control"
              [class.is-invalid]="isFieldInvalid('amount')"
              formControlName="amount"
              placeholder="500.00"
            />
            <div class="quick-chips">
              <button type="button" class="chip-btn" (click)="setAmount('500.00')">₹500</button>
              <button type="button" class="chip-btn" (click)="setAmount('1000.00')">₹1,000</button>
              <button type="button" class="chip-btn" (click)="setAmount('2000.00')">₹2,000</button>
              <button type="button" class="chip-btn" (click)="setAmount('5000.00')">₹5,000</button>
              <button type="button" class="chip-btn" (click)="setAmount('10000.00')">₹10,000 (Cap)</button>
            </div>
            <div class="hint">Maximum INR 10,000.00 per cash transaction (BR-19).</div>
            <div *ngIf="isFieldInvalid('amount')" class="error-text">
              Amount must be a positive number up to 10,000.00.
            </div>
          </div>

          <div class="form-group">
            <label for="fiscalCashTag">Fiscal Cash Receipt Tag *</label>
            <input
              id="fiscalCashTag"
              type="text"
              class="form-control"
              [class.is-invalid]="isFieldInvalid('fiscalCashTag')"
              formControlName="fiscalCashTag"
              placeholder="e.g. OOTY-2026-08-18-0042"
            />
            <div class="hint">Physical receipt code recorded from the counter register (BR-18a).</div>
            <div *ngIf="isFieldInvalid('fiscalCashTag')" class="error-text">
              Fiscal cash tag is mandatory (3-60 characters).
            </div>
          </div>

          <div class="form-group">
            <label for="remarks">Remarks (Optional)</label>
            <textarea
              id="remarks"
              class="form-control"
              formControlName="remarks"
              rows="3"
              placeholder="e.g. Cash received at counter 2."
            ></textarea>
          </div>
        </form>
      </div>

      <div class="sticky-footer">
        <button type="button" class="btn btn-secondary" (click)="onCancel()">
          Cancel
        </button>
        <button
          type="button"
          class="btn btn-primary"
          [disabled]="form.invalid || loading()"
          (click)="onSubmit()"
        >
          <span *ngIf="loading()">Processing...</span>
          <span *ngIf="!loading()">Process Cash Top-up</span>
        </button>
      </div>
    </div>
  `,
})
export class CashTopupComponent {
  private readonly fb = inject(FormBuilder);
  private readonly cashTopupService = inject(CashTopupService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successResult = signal<WalletTransactionResponse | null>(null);

  readonly form = this.fb.group({
    customerId: ['', [Validators.required, Validators.pattern(/^[0-9a-fA-F-]{36}$/)]],
    warehouseId: ['', [Validators.required, Validators.pattern(/^[0-9a-fA-F-]{36}$/)]],
    amount: [
      '',
      [
        Validators.required,
        Validators.pattern(/^[0-9]{1,5}(\.[0-9]{1,2})?$/),
        (control: any) => {
          const val = Number(control.value);
          if (isNaN(val) || val <= 0) return { min: true };
          if (val > 10000) return { max: true };
          return null;
        },
      ],
    ],
    fiscalCashTag: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(60)]],
    remarks: ['', [Validators.maxLength(300)]],
  });

  isFieldInvalid(field: string): boolean {
    const control = this.form.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  setAmount(amount: string): void {
    this.form.patchValue({ amount });
    this.form.get('amount')?.markAsDirty();
  }

  onCancel(): void {
    this.form.reset();
    this.errorMessage.set(null);
    this.successResult.set(null);
  }

  onSubmit(): void {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }

    const { customerId, warehouseId, amount, fiscalCashTag, remarks } = this.form.value;
    if (!customerId || !warehouseId || !amount || !fiscalCashTag) return;

    this.loading.set(true);
    this.errorMessage.set(null);
    this.successResult.set(null);

    const idempotencyKey = `cash_topup_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    this.cashTopupService
      .processCashTopup(
        customerId,
        {
          warehouseId,
          amount,
          fiscalCashTag,
          remarks: remarks || undefined,
        },
        idempotencyKey,
      )
      .subscribe({
        next: (result) => {
          this.loading.set(false);
          this.successResult.set(result);
          this.form.reset();
        },
        error: (err) => {
          this.loading.set(false);
          const detail = err?.error?.detail || err?.error?.title || err?.message || 'Failed to process cash top-up.';
          this.errorMessage.set(detail);
        },
      });
  }
}