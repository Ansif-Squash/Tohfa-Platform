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
      .kpi-cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: var(--tohfa-space-lg);
        margin-bottom: var(--tohfa-space-xl);
      }
      .kpi-card {
        background: var(--tohfa-surface-container-lowest, #fff);
        border: 1px solid var(--tohfa-neutral-grey200, #e2e8f0);
        border-radius: var(--tohfa-radius-lg, 12px);
        padding: var(--tohfa-space-lg);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      }
      .kpi-label {
        font-size: var(--tohfa-font-size-caption, 12px);
        color: var(--tohfa-neutral-grey600, #718096);
        text-transform: uppercase;
        font-weight: 600;
        letter-spacing: 0.05em;
        margin-bottom: var(--tohfa-space-xs);
      }
      .kpi-value {
        font-size: 28px;
        font-weight: 700;
        color: var(--tohfa-on-surface, #1a202c);
      }
      .kpi-value.accent {
        color: #2b6cb0;
      }
      .filter-bar {
        display: flex;
        gap: var(--tohfa-space-md);
        align-items: center;
        margin-bottom: var(--tohfa-space-lg);
        flex-wrap: wrap;
      }
      .filter-btn {
        padding: var(--tohfa-space-sm) var(--tohfa-space-md);
        border: 1px solid var(--tohfa-neutral-grey300, #cbd5e0);
        background: #fff;
        border-radius: var(--tohfa-radius-full, 9999px);
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
        color: #4a5568;
        transition: all 0.15s ease;
      }
      .filter-btn.active {
        background: #2b6cb0;
        color: #fff;
        border-color: #2b6cb0;
      }
      .table-card {
        background: #fff;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      }
      table {
        width: 100%;
        border-collapse: collapse;
        text-align: left;
        font-size: 14px;
      }
      th {
        background: #f7fafc;
        padding: 12px 16px;
        font-weight: 600;
        color: #4a5568;
        border-bottom: 1px solid #e2e8f0;
      }
      td {
        padding: 14px 16px;
        border-bottom: 1px solid #edf2f7;
        color: #2d3748;
      }
      tr:last-child td {
        border-bottom: none;
      }
      tr:hover td {
        background: #f8fafc;
      }
      .badge {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
      }
      .badge-D0_7 { background: #c6f6d5; color: #22543d; }
      .badge-D8_15 { background: #fefcbf; color: #744210; }
      .badge-D16_30 { background: #feebc8; color: #7b341e; }
      .badge-D30_PLUS { background: #fed7d7; color: #742a2a; }
      .btn {
        padding: 8px 14px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        border: none;
        transition: all 0.15s ease;
      }
      .btn-primary {
        background: #2b6cb0;
        color: #fff;
      }
      .btn-primary:hover {
        background: #2c5282;
      }
      .btn-secondary {
        background: #edf2f7;
        color: #4a5568;
      }
      .btn-secondary:hover {
        background: #e2e8f0;
      }
      .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.45);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 100;
      }
      .modal-box {
        background: #fff;
        border-radius: 12px;
        padding: 24px;
        width: 100%;
        max-width: 480px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      }
      .modal-box h2 {
        margin: 0 0 16px 0;
        font-size: 20px;
      }
      .form-group {
        margin-bottom: 16px;
      }
      .form-group label {
        display: block;
        font-size: 13px;
        font-weight: 600;
        color: #4a5568;
        margin-bottom: 6px;
      }
      .form-group input, .form-group select, .form-group textarea {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid #cbd5e0;
        border-radius: 8px;
        font-size: 14px;
        box-sizing: border-box;
      }
      .dual-approval-notice {
        background: #fffaf0;
        border: 1px solid #fbd38d;
        border-radius: 8px;
        padding: 12px;
        font-size: 13px;
        color: #7b341e;
        margin-bottom: 16px;
      }
      .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 20px;
      }
      .empty-state {
        text-align: center;
        padding: 40px;
        color: #718096;
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
      <div class="kpi-card">
        <div class="kpi-label">Total Outstanding Dues</div>
        <div class="kpi-value accent">₹{{ totals().totalDue }}</div>
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
        class="filter-btn"
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
              <div style="font-size: 12px; color: #718096;" *ngIf="due.tohfaFarmerId">
                {{ due.tohfaFarmerId }}
              </div>
            </td>
            <td><code>{{ due.purchaseOrderId.slice(0, 8) }}...</code></td>
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
          ⚠️ <strong>Dual Approval Required (BR-31):</strong> Amounts exceeding ₹10,000 are created in <code>PENDING_APPROVAL</code> and require a second approval from a Super Admin before release.
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
