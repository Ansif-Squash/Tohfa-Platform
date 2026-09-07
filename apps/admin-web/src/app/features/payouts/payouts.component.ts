import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal, type OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RbacService } from '../../core/rbac.service';
import { PayoutsService, type AgeBucket, type PayoutDue } from './payouts.service';

@Component({
  selector: 'tohfa-payouts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        display: block;
        padding: var(--tohfa-space-xxl, 48px);
        font-family: 'Manrope', sans-serif;
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

      /* ---------- KPI cards ---------- */
      .kpi-cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: var(--tohfa-space-lg, 16px);
        margin-bottom: var(--tohfa-space-xl, 32px);
      }
      .kpi-card {
        position: relative;
        background: var(--tohfa-white, #ffffff);
        border: 1px solid var(--tohfa-neutral-300, #e5e7eb);
        border-radius: var(--tohfa-radius-lg, 12px);
        padding: var(--tohfa-space-lg, 16px) var(--tohfa-space-lg, 16px) var(--tohfa-space-lg, 16px) 20px;
        overflow: hidden;
        box-shadow: 0 1px 3px rgba(17, 24, 39, 0.05);
      }
      .kpi-card::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 4px;
        background: var(--accent, var(--tohfa-primary, #2f7d32));
      }
      .kpi-card.accent { --accent: var(--tohfa-info, #2563eb); }
      .kpi-label {
        font-size: var(--tohfa-font-size-caption, 12px);
        color: var(--tohfa-neutral-600, #6b7280);
        text-transform: uppercase;
        font-weight: 700;
        letter-spacing: 0.06em;
        margin-bottom: 8px;
      }
      .kpi-value {
        font-size: 28px;
        font-weight: 700;
        color: var(--tohfa-neutral-900, #1f2937);
      }
      .kpi-value.accent {
        color: var(--tohfa-info, #2563eb);
      }
        .kpi-value.green {
        color: green;
      }

      /* ---------- Filter bar ---------- */
      .filter-bar {
        display: flex;
        gap: 8px;
        align-items: center;
        margin-bottom: var(--tohfa-space-lg, 16px);
        flex-wrap: wrap;
      }
      .filter-btn {
        padding: 8px 16px;
        border: 1.5px solid var(--tohfa-neutral-300, #e5e7eb);
        background: var(--tohfa-white, #ffffff);
        border-radius: var(--tohfa-radius-full, 999px);
        cursor: pointer;
        font-size: 13px;
        font-weight: 600;
        color: var(--tohfa-neutral-700, #4b5563);
        transition: all 0.15s ease;
      }
      .filter-btn:hover {
        border-color: var(--tohfa-neutral-400, #d1d5db);
        background: var(--tohfa-neutral-50, #f9fafb);
      }
      .filter-btn.active {
        background: var(--tohfa-primary, #2f7d32);
        color: #fff;
        border-color: var(--tohfa-primary, #2f7d32);
      }
      .filter-btn.critical.active {
        background: var(--tohfa-error, #dc2626);
        border-color: var(--tohfa-error, #dc2626);
      }

      /* ---------- Table ---------- */
      .table-card {
        background: var(--tohfa-white, #ffffff);
        border: 1px solid var(--tohfa-neutral-300, #e5e7eb);
        border-radius: var(--tohfa-radius-lg, 12px);
        overflow: hidden;
        box-shadow: 0 1px 3px rgba(17, 24, 39, 0.05);
      }
      table {
        width: 100%;
        border-collapse: collapse;
        text-align: left;
        font-size: var(--tohfa-font-size-body, 14px);
      }
      th {
        background: var(--tohfa-neutral-50, #f9fafb);
        padding: var(--tohfa-space-md, 12px) var(--tohfa-space-lg, 16px);
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--tohfa-neutral-600, #6b7280);
        border-bottom: 1px solid var(--tohfa-neutral-300, #e5e7eb);
      }
      td {
        padding: var(--tohfa-space-md, 12px) var(--tohfa-space-lg, 16px);
        border-bottom: 1px solid var(--tohfa-neutral-100, #f3f4f6);
        color: var(--tohfa-neutral-900, #1f2937);
        vertical-align: middle;
      }
      tr:last-child td {
        border-bottom: none;
      }
      tr:hover td {
        background: var(--tohfa-primary-pale, #f4fbf4);
      }
      .farmer-id {
        font-size: 12px;
        color: var(--tohfa-neutral-500, #9ca3af);
        margin-top: 2px;
      }
      .po-code {
        font-family: 'Manrope', monospace;
        font-size: 12px;
        font-weight: 600;
        background: var(--tohfa-neutral-100, #f3f4f6);
        color: var(--tohfa-neutral-700, #4b5563);
        padding: 3px 8px;
        border-radius: var(--tohfa-radius-sm, 6px);
      }

      /* ---------- Ageing badges ---------- */
      .badge {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 4px 11px;
        border-radius: var(--tohfa-radius-full, 999px);
        font-size: 11px;
        font-weight: 700;
        border: 1px solid transparent;
        white-space: nowrap;
      }
      .badge-D0_7 {
        background: var(--tohfa-success-light, #f0fdf4);
        color: var(--tohfa-success, #16a34a);
        border-color: rgba(22, 163, 74, 0.22);
      }
      .badge-D8_15 {
        background: var(--tohfa-warning-light, #fffbeb);
        color: var(--tohfa-warning, #d97706);
        border-color: rgba(217, 119, 6, 0.22);
      }
      .badge-D16_30 {
        background: #fff1e6;
        color: #c2410c;
        border-color: rgba(194, 65, 12, 0.22);
      }
      .badge-D30_PLUS {
        background: var(--tohfa-error-light, #fef2f2);
        color: var(--tohfa-error, #dc2626);
        border-color: rgba(220, 38, 38, 0.22);
      }

      /* ---------- Buttons ---------- */
      .btn {
        padding: 8px 16px;
        border-radius: var(--tohfa-radius-sm, 6px);
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        border: none;
        transition: background-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
      }
      .btn:disabled {
        opacity: 0.55;
        cursor: not-allowed;
        transform: none;
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
      .btn-secondary {
        background: var(--tohfa-neutral-100, #f3f4f6);
        color: var(--tohfa-neutral-800, #374151);
        border: 1px solid var(--tohfa-neutral-300, #e5e7eb);
      }
      .btn-secondary:hover {
        background: var(--tohfa-neutral-200, #eceff3);
      }

      /* ---------- Modal ---------- */
      .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(17, 24, 39, 0.5);
        backdrop-filter: blur(2px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 100;
      }
      .modal-box {
        background: var(--tohfa-white, #ffffff);
        border-radius: var(--tohfa-radius-xl, 16px);
        padding: var(--tohfa-space-xl, 32px);
        width: 100%;
        max-width: 480px;
        box-shadow: 0 16px 40px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.06);
      }
      .modal-box h2 {
        margin: 0 0 var(--tohfa-space-lg, 16px) 0;
        font-size: 20px;
        font-weight: 700;
        color: var(--tohfa-neutral-900, #1f2937);
      }
      .form-group {
        margin-bottom: var(--tohfa-space-lg, 16px);
      }
      .form-group label {
        display: block;
        font-size: 12px;
        font-weight: 700;
        color: var(--tohfa-neutral-700, #4b5563);
        margin-bottom: 6px;
      }
      .form-group input,
      .form-group select,
      .form-group textarea {
        width: 100%;
        padding: 9px var(--tohfa-space-md, 12px);
        border: 1.5px solid var(--tohfa-neutral-300, #e5e7eb);
        border-radius: var(--tohfa-radius-sm, 6px);
        font-size: var(--tohfa-font-size-body, 14px);
        font-family: inherit;
        color: var(--tohfa-neutral-900, #1f2937);
        background: var(--tohfa-white, #ffffff);
        outline: none;
        box-sizing: border-box;
        transition: border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
      }
      .form-group input:hover,
      .form-group select:hover,
      .form-group textarea:hover {
        border-color: var(--tohfa-neutral-400, #d1d5db);
      }
      .form-group input:focus,
      .form-group select:focus,
      .form-group textarea:focus {
        border-color: var(--tohfa-primary, #2f7d32);
        box-shadow: 0 0 0 3px rgba(47, 125, 50, 0.14);
        background: var(--tohfa-primary-pale, #f4fbf4);
      }
      .form-group input:disabled {
        background: var(--tohfa-neutral-100, #f3f4f6);
        color: var(--tohfa-neutral-500, #9ca3af);
      }

      .dual-approval-notice {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        background: var(--tohfa-warning-light, #fffbeb);
        border: 1px solid rgba(217, 119, 6, 0.3);
        border-radius: var(--tohfa-radius-md, 8px);
        padding: var(--tohfa-space-md, 12px);
        font-size: 13px;
        line-height: 1.5;
        color: #92400e;
        margin-bottom: var(--tohfa-space-lg, 16px);
      }
      .dual-approval-notice code {
        background: rgba(217, 119, 6, 0.14);
        padding: 1px 5px;
        border-radius: 4px;
        font-size: 12px;
      }

      .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: var(--tohfa-space-lg, 16px);
      }

      .empty-state {
        text-align: center;
        padding: var(--tohfa-space-xxl, 48px);
        color: var(--tohfa-neutral-600, #6b7280);
        font-weight: 500;
      }
    `,
  ],
  template: `
    <div class="page-header">
      <h1>Farmer Payouts & Dues</h1>
      <p>Manage aged farmer dues and execute dual-approval settlements (BR-31)</p>
    </div>

    <!-- KPI Summary -->
    <div class="kpi-cards">
      <div class="kpi-card green">
        <div class="kpi-label">Total Outstanding Dues</div>
        <div class="kpi-value green">₹{{ totals().totalDue }}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Farmers Awaiting Payout</div>
        <div class="kpi-value">{{ totals().farmerCount }}</div>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="filter-bar">
      <button
        class="filter-btn"
        [class.active]="selectedBucket() === null"
        (click)="setBucket(null)"
      >
        All Dues
      </button>
      <button
        class="filter-btn"
        [class.active]="selectedBucket() === 'D0_7'"
        (click)="setBucket('D0_7')"
      >
        0-7 Days
      </button>
      <button
        class="filter-btn"
        [class.active]="selectedBucket() === 'D8_15'"
        (click)="setBucket('D8_15')"
      >
        8-15 Days
      </button>
      <button
        class="filter-btn"
        [class.active]="selectedBucket() === 'D16_30'"
        (click)="setBucket('D16_30')"
      >
        16-30 Days
      </button>
      <button
        class="filter-btn critical"
        [class.active]="selectedBucket() === 'D30_PLUS'"
        (click)="setBucket('D30_PLUS')"
      >
        30+ Days (Critical)
      </button>
    </div>

    <!-- Dues Table -->
    <div class="table-card">
      <table *ngIf="dues().length > 0; else emptyTpl">
        <thead>
          <tr>
            <th>Farmer</th>
            <th>PO Number</th>
            <th>Due Since</th>
            <th>Ageing</th>
            <th>Amount Due</th>
            <th *ngIf="canInitiate()">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let due of dues()">
            <td>
              <strong>{{ due.farmerName }}</strong>
              <div class="farmer-id" *ngIf="due.tohfaFarmerId">
                {{ due.tohfaFarmerId }}
              </div>
            </td>
            <td><span class="po-code">{{ due.purchaseOrderId.slice(0, 8) }}...</span></td>
            <td>{{ due.dueSince }}</td>
            <td>
              <span class="badge badge-{{ due.ageBucket }}">
                {{ due.ageDays }} days ({{ due.ageBucket }})
              </span>
            </td>
            <td><strong>₹{{ due.amountDue }}</strong></td>
            <td *ngIf="canInitiate()">
              <button class="btn btn-primary" (click)="openInitiateModal(due)">
                Initiate Payout
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <ng-template #emptyTpl>
        <div class="empty-state">No outstanding farmer dues in this filter.</div>
      </ng-template>
    </div>

    <!-- Initiate Payout Modal -->
    <div class="modal-backdrop" *ngIf="showModal()">
      <div class="modal-box">
        <h2>Initiate Farmer Payout</h2>

        <div class="form-group">
          <label>Farmer Name</label>
          <input type="text" [value]="selectedDue()?.farmerName" disabled />
        </div>

        <div class="form-group">
          <label>Amount (₹)</label>
          <input
            type="number"
            step="0.01"
            [(ngModel)]="payoutAmount"
            placeholder="0.00"
          />
        </div>

        <div class="form-group">
          <label>Payment Mode</label>
          <select [(ngModel)]="payoutMode">
            <option value="IMPS">IMPS (Instant)</option>
            <option value="NEFT">NEFT</option>
            <option value="UPI">UPI</option>
          </select>
        </div>

        <div class="form-group">
          <label>Remarks</label>
          <textarea [(ngModel)]="payoutRemarks" rows="2" placeholder="Optional notes..."></textarea>
        </div>

        <div class="dual-approval-notice" *ngIf="isDualApprovalRequired()">
          <span>⚠️</span>
          <span><strong>Dual Approval Required (BR-31):</strong> Amounts exceeding ₹10,000 are created in <code>PENDING_APPROVAL</code> and require a second approval from a Super Admin before release.</span>
        </div>

        <div class="modal-actions">
          <button class="btn btn-secondary" (click)="closeModal()">Cancel</button>
          <button class="btn btn-primary" (click)="submitPayout()" [disabled]="submitting()">
            {{ submitting() ? 'Submitting...' : 'Confirm & Release' }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class PayoutsComponent implements OnInit {
  private readonly payoutsService = inject(PayoutsService);
  private readonly rbac = inject(RbacService);

  readonly dues = signal<PayoutDue[]>([]);
  readonly totals = signal<{ totalDue: string; farmerCount: number }>({ totalDue: '0.00', farmerCount: 0 });
  readonly selectedBucket = signal<AgeBucket | null>(null);

  readonly showModal = signal(false);
  readonly selectedDue = signal<PayoutDue | null>(null);
  readonly submitting = signal(false);

  payoutAmount = '';
  payoutMode: 'IMPS' | 'NEFT' | 'UPI' = 'IMPS';
  payoutRemarks = '';

  canInitiate(): boolean {
    return this.rbac.can('payout.farmer.initiate');
  }

  isDualApprovalRequired(): boolean {
    const val = parseFloat(this.payoutAmount);
    return !isNaN(val) && val > 10000;
  }

  ngOnInit(): void {
    this.loadDues();
  }

  setBucket(bucket: AgeBucket | null): void {
    this.selectedBucket.set(bucket);
    this.loadDues();
  }

  loadDues(): void {
    const bucket = this.selectedBucket();
    this.payoutsService.listPayoutDues(bucket ? { ageBucket: bucket } : {}).subscribe({
      next: (res) => {
        this.dues.set(res.items);
        this.totals.set(res.totals);
      },
    });
  }

  openInitiateModal(due: PayoutDue): void {
    this.selectedDue.set(due);
    this.payoutAmount = due.amountDue;
    this.payoutMode = 'IMPS';
    this.payoutRemarks = `Settlement for PO ${due.purchaseOrderId}`;
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.selectedDue.set(null);
  }

  submitPayout(): void {
    const due = this.selectedDue();
    if (!due || !this.payoutAmount) return;

    this.submitting.set(true);
    const key = `payout-${due.id}-${Date.now()}`;

    this.payoutsService
      .createPayout(
        {
          farmerId: due.farmerId,
          amount: parseFloat(this.payoutAmount).toFixed(2),
          mode: this.payoutMode,
          dueIds: [due.id],
          remarks: this.payoutRemarks,
        },
        key,
      )
      .subscribe({
        next: (_res) => {
          this.submitting.set(false);
          this.closeModal();
          this.loadDues();
        },
        error: (err) => {
          this.submitting.set(false);
          alert(`Failed to initiate payout: ${err?.error?.detail || err.message}`);
        },
      });
  }
}