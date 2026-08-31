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
        padding-bottom: 80px; /* Space for sticky footer */
      }
      .page-container {
        max-width: 800px;
        margin: 0 auto;
        padding: var(--tohfa-space-xl);
      }
      .page-header {
        margin-bottom: var(--tohfa-space-xl);
      }
      .page-header h1 {
        margin: 0 0 var(--tohfa-space-xs) 0;
        font-size: var(--tohfa-font-size-headline);
        color: var(--tohfa-on-surface);
      }
      .page-header p {
        margin: 0;
        color: var(--tohfa-neutral-grey700);
        font-size: var(--tohfa-font-size-body);
      }
      .card {
        background: var(--tohfa-neutral-white);
        border-radius: var(--tohfa-radius-card-max);
        padding: var(--tohfa-space-xl);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        margin-bottom: var(--tohfa-space-xl);
      }
      .form-group {
        margin-bottom: var(--tohfa-space-lg);
      }
      .form-group label {
        display: block;
        font-size: var(--tohfa-font-size-body);
        font-weight: var(--tohfa-font-weight-medium);
        color: var(--tohfa-on-surface);
        margin-bottom: var(--tohfa-space-xs);
      }
      .form-group .hint {
        font-size: var(--tohfa-font-size-footnote);
        color: var(--tohfa-neutral-grey500);
        margin-top: var(--tohfa-space-xs);
      }
      .form-control {
        width: 100%;
        padding: var(--tohfa-space-md);
        border: 1px solid var(--tohfa-neutral-grey300);
        border-radius: var(--tohfa-radius-input);
        font-size: var(--tohfa-font-size-body);
        font-family: inherit;
        box-sizing: border-box;
        transition: border-color 0.2s ease;
      }
      .form-control:focus {
        outline: none;
        border-color: var(--tohfa-primary);
      }
      .form-control.is-invalid {
        border-color: var(--tohfa-danger);
      }
      .error-text {
        font-size: var(--tohfa-font-size-footnote);
        color: var(--tohfa-danger);
        margin-top: var(--tohfa-space-xs);
      }
      .alert {
        padding: var(--tohfa-space-md) var(--tohfa-space-lg);
        border-radius: var(--tohfa-radius-input);
        margin-bottom: var(--tohfa-space-lg);
        font-size: var(--tohfa-font-size-body);
      }
      .alert-danger {
        background: #fde8e8;
        color: var(--tohfa-color-deep-maroon);
        border: 1px solid #f8b4b4;
      }
      .alert-success {
        background: #def7ec;
        color: var(--tohfa-color-success-dark-green);
        border: 1px solid #bcf0da;
      }
      .quick-chips {
        display: flex;
        gap: var(--tohfa-space-sm);
        margin-top: var(--tohfa-space-sm);
        flex-wrap: wrap;
      }
      .chip-btn {
        background: var(--tohfa-color-background-cream);
        border: 1px solid var(--tohfa-neutral-grey300);
        border-radius: 20px;
        padding: var(--tohfa-space-xs) var(--tohfa-space-md);
        font-size: var(--tohfa-font-size-body-small);
        cursor: pointer;
        color: var(--tohfa-neutral-grey700);
        transition: all 0.15s ease;
      }
      .chip-btn:hover {
        background: var(--tohfa-neutral-grey100);
        color: var(--tohfa-on-surface);
      }
      .sticky-footer {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: var(--tohfa-neutral-white);
        border-top: 1px solid var(--tohfa-neutral-grey100);
        padding: var(--tohfa-space-md) var(--tohfa-space-xl);
        display: flex;
        justify-content: flex-end;
        gap: var(--tohfa-space-md);
        box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
        z-index: 100;
      }
      .btn {
        padding: var(--tohfa-space-md) var(--tohfa-space-xl);
        border-radius: var(--tohfa-radius-button);
        font-size: var(--tohfa-font-size-body);
        font-weight: var(--tohfa-font-weight-semibold);
        cursor: pointer;
        border: none;
        transition: background-color 0.2s ease;
      }
      .btn-secondary {
        background: var(--tohfa-neutral-grey100);
        color: var(--tohfa-neutral-grey700);
      }
      .btn-secondary:hover {
        background: var(--tohfa-neutral-grey300);
      }
      .btn-primary {
        background: var(--tohfa-primary);
        color: var(--tohfa-neutral-white);
      }
      .btn-primary:hover:not(:disabled) {
        background: var(--tohfa-primary-pressed);
      }
      .btn-primary:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .tx-summary {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: var(--tohfa-space-md);
        margin-top: var(--tohfa-space-md);
      }
      .tx-summary-item {
        background: var(--tohfa-neutral-white);
        padding: var(--tohfa-space-sm) var(--tohfa-space-md);
        border-radius: var(--tohfa-radius-input);
      }
      .tx-summary-item span {
        display: block;
        font-size: var(--tohfa-font-size-footnote);
        color: var(--tohfa-neutral-grey700);
      }
      .tx-summary-item strong {
        font-size: var(--tohfa-font-size-body-large);
        color: var(--tohfa-on-surface);
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
