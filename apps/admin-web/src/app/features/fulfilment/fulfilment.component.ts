import { CommonModule } from '@angular/common';
import { Component, inject, signal, type OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RbacService } from '../../core/rbac.service';
import {
  FulfilmentService,
  type AdminOrderSummary,
} from './fulfilment.service';

@Component({
  selector: 'tohfa-fulfilment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <header class="page-header">
        <div>
          <h1 class="title">Warehouse Fulfilment</h1>
          <p class="subtitle">Pack, dispatch, and verify customer handover OTPs.</p>
        </div>
      </header>

      <!-- Filter Tabs -->
      <div class="filter-bar">
        <div class="tabs">
          <button
            *ngFor="let tab of statusTabs"
            class="tab-btn"
            [class.active]="selectedStatus() === tab.value"
            (click)="selectStatus(tab.value)">
            {{ tab.label }}
          </button>
        </div>
      </div>

      <!-- Error / Success Alert -->
      <div *ngIf="errorMessage()" class="alert alert-error">
        <span>{{ errorMessage() }}</span>
        <button class="close-btn" (click)="errorMessage.set(null)">✕</button>
      </div>
      <div *ngIf="successMessage()" class="alert alert-success">
        <span>{{ successMessage() }}</span>
        <button class="close-btn" (click)="successMessage.set(null)">✕</button>
      </div>

      <!-- Orders Table -->
      <div class="table-card">
        <div *ngIf="loading()" class="loading-state">Loading orders...</div>

        <table *ngIf="!loading() && orders().length > 0" class="data-table">
          <thead>
            <tr>
              <th>Order Number</th>
              <th>Placed At</th>
              <th>Items</th>
              <th>Type</th>
              <th>Total Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let order of orders()">
              <td class="bold">{{ order.orderNumber }}</td>
              <td>{{ order.placedAt | date: 'medium' }}</td>
              <td>{{ order.itemCount }}</td>
              <td>
                <span class="badge" [class.badge-pickup]="order.fulfillmentType === 'PICKUP'" [class.badge-delivery]="order.fulfillmentType === 'DELIVERY'">
                  {{ order.fulfillmentType }}
                </span>
              </td>
              <td>₹{{ order.totalAmount }}</td>
              <td>
                <span class="status-badge" [attr.data-status]="order.status">
                  {{ order.status }}
                </span>
              </td>
              <td class="actions-cell">
                <!-- Pack action -->
                <button
                  *ngIf="order.status === 'CONFIRMED' && rbac.can('order.mark_packed')"
                  class="action-btn btn-pack"
                  (click)="packOrder(order)">
                  Pack
                </button>

                <!-- Dispatch action -->
                <button
                  *ngIf="order.status === 'PACKED' && rbac.can('order.dispatch')"
                  class="action-btn btn-dispatch"
                  (click)="dispatchOrder(order)">
                  {{ order.fulfillmentType === 'PICKUP' ? 'Ready for Pickup' : 'Dispatch' }}
                </button>

                <!-- Handover OTP Verification action -->
                <button
                  *ngIf="(order.status === 'READY_FOR_PICKUP' || order.status === 'DISPATCHED') && rbac.can('order.pickup_otp.verify')"
                  class="action-btn btn-otp"
                  (click)="openOtpModal(order)">
                  Verify Handover OTP
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div *ngIf="!loading() && orders().length === 0" class="empty-state">
          <p>No orders found for the selected status.</p>
        </div>
      </div>

      <!-- OTP Verification Dialog -->
      <div *ngIf="selectedOrderForOtp()" class="modal-backdrop">
        <div class="modal-card">
          <div class="modal-header">
            <h2 class="modal-title">Handover Verification</h2>
            <button class="close-btn" (click)="closeOtpModal()">✕</button>
          </div>
          <div class="modal-body">
            <p class="modal-desc">
              Ask customer for their 4-digit handover OTP to complete delivery/pickup for
              <strong>{{ selectedOrderForOtp()?.orderNumber }}</strong>.
            </p>

            <div class="form-group">
              <label for="otpInput">Enter 4-Digit OTP</label>
              <input
                id="otpInput"
                type="text"
                maxlength="4"
                pattern="[0-9]{4}"
                placeholder="••••"
                class="otp-input"
                [(ngModel)]="otpCode"
                autofocus />
            </div>

            <div *ngIf="otpError()" class="alert alert-error">
              {{ otpError() }}
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeOtpModal()">Cancel</button>
            <button
              class="btn btn-primary"
              [disabled]="otpCode.length !== 4 || submittingOtp()"
              (click)="submitOtp()">
              {{ submittingOtp() ? 'Verifying...' : 'Complete Handover' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .container {
        padding: var(--tohfa-space-xl);
        max-width: 1400px;
        margin: 0 auto;
      }
      .page-header {
        margin-bottom: var(--tohfa-space-lg);
      }
      .title {
        font-size: var(--tohfa-font-size-title-1);
        font-weight: var(--tohfa-font-weight-bold);
        color: var(--tohfa-neutral-black);
        margin: 0;
      }
      .subtitle {
        font-size: var(--tohfa-font-size-body-small);
        color: var(--tohfa-neutral-grey600);
        margin: var(--tohfa-space-xs) 0 0 0;
      }
      .filter-bar {
        margin-bottom: var(--tohfa-space-lg);
      }
      .tabs {
        display: flex;
        gap: var(--tohfa-space-xs);
        border-bottom: 1px solid var(--tohfa-neutral-grey200);
        overflow-x: auto;
      }
      .tab-btn {
        padding: var(--tohfa-space-sm) var(--tohfa-space-md);
        font-family: var(--tohfa-font-sans);
        font-size: var(--tohfa-font-size-body-small);
        font-weight: var(--tohfa-font-weight-semibold);
        color: var(--tohfa-neutral-grey600);
        background: transparent;
        border: none;
        border-bottom: 2px solid transparent;
        cursor: pointer;
        white-space: nowrap;
        transition: all 0.15s ease-in-out;
      }
      .tab-btn:hover {
        color: var(--tohfa-primary);
      }
      .tab-btn.active {
        color: var(--tohfa-primary);
        border-bottom-color: var(--tohfa-primary);
      }
      .alert {
        padding: var(--tohfa-space-md);
        border-radius: var(--tohfa-radius-input);
        margin-bottom: var(--tohfa-space-md);
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: var(--tohfa-font-size-body-small);
      }
      .alert-error {
        background: #fee2e2;
        color: #991b1b;
        border: 1px solid #f87171;
      }
      .alert-success {
        background: #dcfce7;
        color: #166534;
        border: 1px solid #86efac;
      }
      .close-btn {
        background: none;
        border: none;
        cursor: pointer;
        font-size: var(--tohfa-font-size-body-large);
        color: inherit;
      }
      .table-card {
        background: #fff;
        border-radius: var(--tohfa-radius-card-max);
        box-shadow: var(--tohfa-shadow-card);
        overflow: hidden;
      }
      .data-table {
        width: 100%;
        border-collapse: collapse;
        text-align: left;
      }
      .data-table th,
      .data-table td {
        padding: var(--tohfa-space-md) var(--tohfa-space-lg);
        border-bottom: 1px solid rgba(4, 52, 44, 0.08);
        font-size: var(--tohfa-font-size-body-small);
      }
      .data-table th {
        background: var(--tohfa-surface);
        font-weight: var(--tohfa-font-weight-semibold);
        color: var(--tohfa-neutral-grey700);
        text-transform: uppercase;
        font-size: var(--tohfa-font-size-footnote);
        letter-spacing: 0.04em;
      }
      .bold {
        font-weight: var(--tohfa-font-weight-semibold);
      }
      .badge {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 9999px;
        font-size: var(--tohfa-font-size-footnote);
        font-weight: var(--tohfa-font-weight-medium);
      }
      .badge-pickup {
        background: #e0e7ff;
        color: #3730a3;
      }
      .badge-delivery {
        background: #ede9fe;
        color: #5b21b6;
      }
      .status-badge {
        display: inline-block;
        padding: 4px 10px;
        border-radius: 9999px;
        font-size: var(--tohfa-font-size-footnote);
        font-weight: var(--tohfa-font-weight-semibold);
        background: #f3f4f6;
        color: #374151;
      }
      .status-badge[data-status='CONFIRMED'] {
        background: #dbeafe;
        color: #1e40af;
      }
      .status-badge[data-status='PACKED'] {
        background: #fef3c7;
        color: #92400e;
      }
      .status-badge[data-status='READY_FOR_PICKUP'] {
        background: #e0e7ff;
        color: #3730a3;
      }
      .status-badge[data-status='DISPATCHED'] {
        background: #fef08a;
        color: #854d0e;
      }
      .status-badge[data-status='PICKED_UP'],
      .status-badge[data-status='DELIVERED'] {
        background: #dcfce7;
        color: #166534;
      }
      .actions-cell {
        display: flex;
        gap: var(--tohfa-space-xs);
      }
      .action-btn {
        padding: 6px 12px;
        border-radius: var(--tohfa-radius-input);
        font-size: var(--tohfa-font-size-footnote);
        font-weight: var(--tohfa-font-weight-semibold);
        cursor: pointer;
        border: none;
        transition: opacity 0.15s;
      }
      .action-btn:hover {
        opacity: 0.9;
      }
      .btn-pack {
        background: var(--tohfa-primary);
        color: #fff;
      }
      .btn-dispatch {
        background: #0284c7;
        color: #fff;
      }
      .btn-otp {
        background: #059669;
        color: #fff;
      }
      .loading-state,
      .empty-state {
        padding: var(--tohfa-space-xl);
        text-align: center;
        color: var(--tohfa-neutral-grey600);
      }
      .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }
      .modal-card {
        background: #fff;
        border-radius: var(--tohfa-radius-card-max);
        width: 100%;
        max-width: 440px;
        box-shadow: var(--tohfa-shadow-card);
        overflow: hidden;
      }
      .modal-header {
        padding: var(--tohfa-space-lg);
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid var(--tohfa-neutral-grey200);
      }
      .modal-title {
        font-size: var(--tohfa-font-size-title-3);
        font-weight: var(--tohfa-font-weight-bold);
        margin: 0;
      }
      .modal-body {
        padding: var(--tohfa-space-lg);
      }
      .modal-desc {
        font-size: var(--tohfa-font-size-body-small);
        color: var(--tohfa-neutral-grey600);
        margin-top: 0;
      }
      .form-group {
        margin-bottom: var(--tohfa-space-md);
      }
      .form-group label {
        display: block;
        font-size: var(--tohfa-font-size-footnote);
        font-weight: var(--tohfa-font-weight-semibold);
        color: var(--tohfa-neutral-grey700);
        margin-bottom: var(--tohfa-space-xs);
      }
      .otp-input {
        width: 100%;
        padding: var(--tohfa-space-md);
        font-size: 24px;
        letter-spacing: 12px;
        text-align: center;
        border: 2px solid var(--tohfa-neutral-grey300);
        border-radius: var(--tohfa-radius-input);
        outline: none;
        box-sizing: border-box;
      }
      .otp-input:focus {
        border-color: var(--tohfa-primary);
      }
      .modal-footer {
        padding: var(--tohfa-space-md) var(--tohfa-space-lg);
        background: var(--tohfa-surface);
        display: flex;
        justify-content: flex-end;
        gap: var(--tohfa-space-sm);
        border-top: 1px solid var(--tohfa-neutral-grey200);
      }
      .btn {
        padding: var(--tohfa-space-sm) var(--tohfa-space-md);
        border-radius: var(--tohfa-radius-input);
        font-weight: var(--tohfa-font-weight-semibold);
        cursor: pointer;
        border: none;
      }
      .btn-secondary {
        background: #fff;
        border: 1px solid var(--tohfa-neutral-grey300);
        color: var(--tohfa-neutral-grey700);
      }
      .btn-primary {
        background: var(--tohfa-primary);
        color: #fff;
      }
      .btn-primary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    `,
  ],
})
export class FulfilmentComponent implements OnInit {
  readonly rbac = inject(RbacService);
  private readonly service = inject(FulfilmentService);

  readonly statusTabs = [
    { label: 'All Orders', value: 'ALL' },
    { label: 'Confirmed', value: 'CONFIRMED' },
    { label: 'Packed', value: 'PACKED' },
    { label: 'Ready for Pickup', value: 'READY_FOR_PICKUP' },
    { label: 'Dispatched', value: 'DISPATCHED' },
    { label: 'Completed', value: 'PICKED_UP' },
  ];

  selectedStatus = signal<string>('ALL');
  orders = signal<AdminOrderSummary[]>([]);
  loading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // OTP Dialog state
  selectedOrderForOtp = signal<AdminOrderSummary | null>(null);
  otpCode = '';
  otpError = signal<string | null>(null);
  submittingOtp = signal<boolean>(false);

  ngOnInit(): void {
    this.loadOrders();
  }

  selectStatus(status: string): void {
    this.selectedStatus.set(status);
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.service.listOrders({ status: this.selectedStatus() }).subscribe({
      next: (res) => {
        this.orders.set(res.items);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.detail || 'Failed to load orders.');
        this.loading.set(false);
      },
    });
  }

  packOrder(order: AdminOrderSummary): void {
    this.service.packOrder(order.id).subscribe({
      next: () => {
        this.successMessage.set(`Order ${order.orderNumber} marked as PACKED.`);
        this.loadOrders();
      },
      error: (err) => {
        this.errorMessage.set(err.error?.detail || 'Failed to pack order.');
      },
    });
  }

  dispatchOrder(order: AdminOrderSummary): void {
    this.service.dispatchOrder(order.id).subscribe({
      next: () => {
        this.successMessage.set(`Order ${order.orderNumber} updated.`);
        this.loadOrders();
      },
      error: (err) => {
        this.errorMessage.set(err.error?.detail || 'Failed to dispatch order.');
      },
    });
  }

  openOtpModal(order: AdminOrderSummary): void {
    this.selectedOrderForOtp.set(order);
    this.otpCode = '';
    this.otpError.set(null);
  }

  closeOtpModal(): void {
    this.selectedOrderForOtp.set(null);
    this.otpCode = '';
    this.otpError.set(null);
  }

  submitOtp(): void {
    const order = this.selectedOrderForOtp();
    if (!order || this.otpCode.length !== 4) return;

    this.submittingOtp.set(true);
    this.otpError.set(null);

    this.service.verifyOtp(order.id, this.otpCode).subscribe({
      next: () => {
        this.submittingOtp.set(false);
        this.closeOtpModal();
        this.successMessage.set(`Handover completed successfully for ${order.orderNumber}.`);
        this.loadOrders();
      },
      error: (err) => {
        this.submittingOtp.set(false);
        this.otpError.set(err.error?.detail || 'Invalid OTP code.');
      },
    });
  }
}
