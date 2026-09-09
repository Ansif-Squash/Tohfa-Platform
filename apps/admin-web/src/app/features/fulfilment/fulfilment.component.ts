import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal, type OnInit } from '@angular/core';
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
        <div class="page-header-text">
          <span class="page-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
              <path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>
            </svg>
          </span>
          <div>
            <h1 class="title">Warehouse Fulfilment</h1>
            <p class="subtitle">Pack, dispatch, and verify customer handover OTPs.</p>
          </div>
        </div>
      </header>

      <!-- Summary strip -->
      <div class="stat-grid">
        <div class="stat-card stat-primary">
          <span class="stat-label">Total Orders</span>
          <span class="stat-value">{{ orders().length }}</span>
        </div>
        <div class="stat-card stat-info">
          <span class="stat-label">Awaiting Pack</span>
          <span class="stat-value">{{ countByStatus('CONFIRMED') }}</span>
        </div>
        <div class="stat-card stat-warning">
          <span class="stat-label">Packed</span>
          <span class="stat-value">{{ countByStatus('PACKED') }}</span>
        </div>
        <div class="stat-card stat-purple">
          <span class="stat-label">Out for Handover</span>
          <span class="stat-value">{{ countByStatus('READY_FOR_PICKUP') + countByStatus('DISPATCHED') }}</span>
        </div>
        <div class="stat-card stat-success">
          <span class="stat-label">Completed</span>
          <span class="stat-value">{{ countByStatus('PICKED_UP') + countByStatus('DELIVERED') }}</span>
        </div>
      </div>

      <!-- Filter bar: tabs + search -->
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

        <div class="search-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.3-4.3"/>
          </svg>
          <input
            type="text"
            placeholder="Search order number…"
            [ngModel]="searchTerm()"
            (ngModelChange)="searchTerm.set($event)" />
        </div>
      </div>

      <!-- Error / Success Alert -->
      <div *ngIf="errorMessage()" class="alert alert-error">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span class="alert-text">{{ errorMessage() }}</span>
        <button class="close-btn" aria-label="Dismiss" (click)="errorMessage.set(null)">✕</button>
      </div>
      <div *ngIf="successMessage()" class="alert alert-success">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        <span class="alert-text">{{ successMessage() }}</span>
        <button class="close-btn" aria-label="Dismiss" (click)="successMessage.set(null)">✕</button>
      </div>

      <!-- Orders Table -->
      <div class="table-card">
        <div *ngIf="loading()" class="state-block">
          <div class="skeleton-row" *ngFor="let i of [1, 2, 3, 4]">
            <span class="skeleton skeleton-sm"></span>
            <span class="skeleton skeleton-lg"></span>
            <span class="skeleton skeleton-md"></span>
          </div>
        </div>

        <table *ngIf="!loading() && filteredOrders().length > 0" class="data-table">
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
            <tr *ngFor="let order of filteredOrders()">
              <td class="bold">{{ order.orderNumber }}</td>
              <td>{{ order.placedAt | date: 'medium' }}</td>
              <td>{{ order.itemCount }}</td>
              <td>
                <span
                  class="badge"
                  [class.badge-pickup]="order.fulfillmentType === 'PICKUP'"
                  [class.badge-delivery]="order.fulfillmentType === 'DELIVERY'">
                  {{ order.fulfillmentType }}
                </span>
              </td>
              <td>₹{{ order.totalAmount }}</td>
              <td>
                <span class="status-badge" [attr.data-status]="order.status">
                  <span class="status-dot"></span>
                  {{ formatStatus(order.status) }}
                </span>
              </td>
              <td class="actions-cell">
                <span *ngIf="!canAct(order)" class="no-action" title="No action available">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </span>

                <!-- Pack action -->
                <button
                  *ngIf="order.status === 'CONFIRMED' && rbac.can('order.mark_packed')"
                  class="action-btn btn-pack"
                  (click)="packOrder(order)">
                  <span class="action-icon">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
                      <path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>
                    </svg>
                  </span>
                  Pack
                </button>

                <!-- Dispatch action -->
                <button
                  *ngIf="order.status === 'PACKED' && rbac.can('order.dispatch')"
                  class="action-btn btn-dispatch"
                  (click)="dispatchOrder(order)">
                  <span class="action-icon">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M14 18V6a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h1"/>
                      <path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
                      <circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>
                    </svg>
                  </span>
                  {{ order.fulfillmentType === 'PICKUP' ? 'Ready for Pickup' : 'Dispatch' }}
                </button>

                <!-- Handover OTP Verification action -->
                <button
                  *ngIf="(order.status === 'READY_FOR_PICKUP' || order.status === 'DISPATCHED') && rbac.can('order.pickup_otp.verify')"
                  class="action-btn btn-otp"
                  (click)="openOtpModal(order)">
                  <span class="action-icon">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>
                    </svg>
                  </span>
                  Verify OTP
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div *ngIf="!loading() && filteredOrders().length === 0" class="state-block empty-state">
          <svg class="empty-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
            <path d="m3.3 7 8.7 5 8.7-5"/>
            <path d="M12 22V12"/>
          </svg>
          <p class="empty-title">No orders found</p>
          <p class="empty-desc">{{ searchTerm() ? 'Try a different order number.' : 'No orders match the selected status.' }}</p>
        </div>
      </div>

      <!-- OTP Verification Dialog -->
      <div *ngIf="selectedOrderForOtp()" class="modal-backdrop" (click)="closeOtpModal()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2 class="modal-title">Handover Verification</h2>
            <button class="close-btn" aria-label="Close" (click)="closeOtpModal()">✕</button>
          </div>
          <div class="modal-body">
            <p class="modal-desc">
              Ask the customer for their 4-digit handover OTP to complete delivery/pickup for
              <strong>{{ selectedOrderForOtp()?.orderNumber }}</strong>.
            </p>

            <div class="form-group">
              <label for="otpInput">Enter 4-digit OTP</label>
              <input
                id="otpInput"
                type="text"
                inputmode="numeric"
                maxlength="4"
                pattern="[0-9]{4}"
                placeholder="••••"
                class="otp-input"
                [class.input-error]="otpError()"
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
              {{ submittingOtp() ? 'Verifying…' : 'Complete Handover' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      /* =====================================================================
         TOHFA palette + type/spacing/radius scale, scoped to this component
         so the whole file is self-contained (no external tokens import).
         Values copied 1:1 from the TOHFA Design System v1.0.
         ===================================================================== */
      :host {
        --tohfa-primary: #2f7d32;
        --tohfa-primary-dark: #1b5e20;
        --tohfa-primary-light: #e8f5e9;
        --tohfa-primary-pale: #f4fbf4;

        --tohfa-success: #16a34a;
        --tohfa-success-light: #f0fdf4;
        --tohfa-warning: #d97706;
        --tohfa-warning-light: #fffbeb;
        --tohfa-error: #dc2626;
        --tohfa-error-light: #fef2f2;
        --tohfa-info: #2563eb;
        --tohfa-info-light: #eff6ff;
        --tohfa-purple: #7c3aed;
        --tohfa-purple-light: #f5f3ff;

        --tohfa-neutral-950: #111827;
        --tohfa-neutral-900: #1f2937;
        --tohfa-neutral-800: #374151;
        --tohfa-neutral-700: #4b5563;
        --tohfa-neutral-600: #6b7280;
        --tohfa-neutral-500: #9ca3af;
        --tohfa-neutral-400: #d1d5db;
        --tohfa-neutral-300: #e5e7eb;
        --tohfa-neutral-100: #f3f4f6;
        --tohfa-neutral-50: #f9fafb;
        --tohfa-white: #ffffff;

        --tohfa-shadow-lg: 0 16px 40px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.06);

        display: block;
        font-family: 'Manrope', -apple-system, BlinkMacSystemFont, sans-serif;
      }

      .container {
        padding: 48px;
        margin: 0 auto;
      }

      /* ---------- Header ---------- */
      .page-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 24px;
      }
      .page-header-text {
        display: flex;
        align-items: center;
        gap: 14px;
      }
      .page-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 44px;
        height: 44px;
        flex-shrink: 0;
        border-radius: 12px;
        background: var(--tohfa-primary-light);
        color: var(--tohfa-primary);
      }
      .title {
        font-size: 30px;
        line-height: 38px;
        font-weight: 700;
        color: var(--tohfa-neutral-900);
        letter-spacing: -0.01em;
        margin: 0;
      }
      .subtitle {
        font-size: 14px;
        line-height: 20px;
        color: var(--tohfa-neutral-600);
        margin: 4px 0 0 0;
      }

      /* ---------- Summary strip ---------- */
      .stat-grid {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 16px;
        margin-bottom: 32px;
      }
      .stat-card {
        position: relative;
        background: var(--tohfa-white);
        border: 1px solid var(--tohfa-neutral-300);
        border-radius: 12px;
        padding: 16px 20px;
        display: flex;
        flex-direction: column;
        gap: 6px;
        transition: box-shadow 0.15s ease, transform 0.15s ease;
      }
      .stat-card:hover {
        box-shadow: 0 4px 12px rgba(17, 24, 39, 0.06);
        transform: translateY(-1px);
      }
   

      .stat-label {
        font-size: 12px;
        font-weight: 600;
        color: var(--tohfa-neutral-600);
      }
      .stat-value {
        font-size: 26px;
        font-weight: 700;
        color: green;
        letter-spacing: -0.01em;
      }
   

      /* ---------- Filter bar: tabs + search ---------- */
      .filter-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 16px;
        flex-wrap: wrap;
      }
      .tabs {
        display: flex;
        gap: 4px;
        border-bottom: 1px solid var(--tohfa-neutral-300);
        overflow-x: auto;
      }
      .tab-btn {
        padding: 10px 14px;
        font-family: inherit;
        font-size: 13px;
        font-weight: 700;
        color: var(--tohfa-neutral-500);
        background: transparent;
        border: none;
        border-radius: 8px 8px 0 0;
        border-bottom: 2px solid transparent;
        cursor: pointer;
        white-space: nowrap;
        transition: color 0.15s ease-in-out, border-color 0.15s ease-in-out, background-color 0.15s ease-in-out;
      }
      .tab-btn:hover {
        color: var(--tohfa-primary);
        background: var(--tohfa-primary-pale);
      }
      .tab-btn:focus-visible {
        outline: 2px solid var(--tohfa-primary);
        outline-offset: 2px;
        border-radius: 4px;
      }
      .tab-btn.active {
        color: var(--tohfa-primary);
        background: var(--tohfa-primary-pale);
        border-bottom-color: var(--tohfa-primary);
      }

      .search-box {
        display: flex;
        align-items: center;
        gap: 8px;
        background: var(--tohfa-white);
        border: 1px solid var(--tohfa-neutral-300);
        border-radius: 8px;
        padding: 8px 12px;
        min-width: 240px;
        max-height: 40px;
        color: var(--tohfa-neutral-500);
        transition: border-color 0.15s ease, box-shadow 0.15s ease;
      }
      .search-box:focus-within {
        border-color: var(--tohfa-primary);
        box-shadow: 0 0 0 3px rgba(47, 125, 50, 0.12);
      }
      .search-box input {
        border: none;
        outline: none;
        font-family: inherit;
        font-size: 13px;
        color: var(--tohfa-neutral-900);
        background: transparent;
        width: 100%;
      }
      .search-box input::placeholder { color: var(--tohfa-neutral-500); }

      /* ---------- Alerts ---------- */
      .alert {
        padding: 12px 16px;
        border-radius: 8px;
        margin-bottom: 12px;
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 13px;
        font-weight: 600;
        border: 1px solid transparent;
      }
      .alert-text { flex: 1; }
      .alert-error {
        background: var(--tohfa-error-light);
        color: #991b1b;
        border-color: rgba(220, 38, 38, 0.25);
      }
      .alert-error svg { color: var(--tohfa-error); flex-shrink: 0; }
      .alert-success {
        background: var(--tohfa-success-light);
        color: var(--tohfa-primary-dark);
        border-color: rgba(22, 163, 74, 0.25);
      }
      .alert-success svg { color: var(--tohfa-success); flex-shrink: 0; }
      .close-btn {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 16px;
        color: inherit;
        opacity: 0.6;
        line-height: 1;
        padding: 0;
        flex-shrink: 0;
      }
      .close-btn:hover { opacity: 1; }

      /* ---------- Table card ---------- */
      .table-card {
        background: var(--tohfa-white);
        border: 1px solid var(--tohfa-neutral-300);
        border-radius: 12px;
        overflow-x: auto;
        overflow-y: hidden;
      }

      /* ---------- Orders table ---------- */
      .data-table {
        width: 100%;
        min-width: 1000px;
        border-collapse: separate;
        border-spacing: 0;
        table-layout: fixed;
        text-align: left;
      }

      .data-table th,
      .data-table td {
        padding: 14px 16px;
        border-bottom: 1px solid var(--tohfa-neutral-100);
        font-size: 14px;
        line-height: 20px;
        color: var(--tohfa-neutral-900);
        text-align: left;
        vertical-align: middle;
      }

      .data-table th {
        background: var(--tohfa-neutral-50);
        font-size: 12px;
        line-height: 18px;
        font-weight: 700;
        color: var(--tohfa-neutral-600);
        text-transform: uppercase;
        letter-spacing: 0.04em;
        border-bottom: 1px solid var(--tohfa-neutral-300);
        white-space: nowrap;
      }

      .data-table th:nth-child(1), .data-table td:nth-child(1) { width: 17%; }
      .data-table th:nth-child(2), .data-table td:nth-child(2) { width: 20%; }
      .data-table th:nth-child(3), .data-table td:nth-child(3) { width: 8%; }
      .data-table th:nth-child(4), .data-table td:nth-child(4) { width: 13%; }
      .data-table th:nth-child(5), .data-table td:nth-child(5) { width: 14%; }
      .data-table th:nth-child(6), .data-table td:nth-child(6) { width: 14%; }
      .data-table th:nth-child(7), .data-table td:nth-child(7) { width: 14%; }

      .data-table tbody tr:hover td { background: var(--tohfa-primary-pale); }
      .data-table tbody tr:last-child td { border-bottom: none; }

      .data-table .bold { font-weight: 700; color: var(--tohfa-neutral-900); }

      .actions-cell {
        text-align: left;
        white-space: nowrap;
        vertical-align: middle;
      }
      .no-action {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 30px;
        height: 30px;
        border-radius: 999px;
        background: var(--tohfa-neutral-100);
        color: var(--tohfa-neutral-400);
      }

      /* ---------- Fulfilment type badge ---------- */
      .badge {
        display: inline-block;
        padding: 3px 10px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.03em;
        background: var(--tohfa-neutral-100);
        color: var(--tohfa-neutral-700);
      }
      .badge-pickup { background: var(--tohfa-info-light); color: var(--tohfa-info); }
      .badge-delivery { background: var(--tohfa-purple-light); color: var(--tohfa-purple); }

      /* ---------- Order status badge ---------- */
      .status-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 11px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.02em;
        background: var(--tohfa-neutral-100);
        color: var(--tohfa-neutral-700);
      }
      .status-dot {
        width: 6px;
        height: 6px;
        border-radius: 999px;
        background: currentColor;
        flex-shrink: 0;
      }
      .status-badge[data-status='CONFIRMED'] { background: var(--tohfa-info-light); color: var(--tohfa-info); }
      .status-badge[data-status='PACKED'] { background: var(--tohfa-warning-light); color: var(--tohfa-warning); }
      .status-badge[data-status='READY_FOR_PICKUP'] { background: var(--tohfa-purple-light); color: var(--tohfa-purple); }
      .status-badge[data-status='DISPATCHED'] { background: var(--tohfa-warning-light); color: #c2410c; }
      .status-badge[data-status='PICKED_UP'],
      .status-badge[data-status='DELIVERED'] { background: var(--tohfa-success-light); color: var(--tohfa-success); }
      .status-badge[data-status='CANCELLED'] { background: var(--tohfa-error-light); color: var(--tohfa-error); }

      /* ---------- Action buttons ----------
         Pill-shaped chips with a translucent icon badge on the left,
         a fixed min-width so mixed-length labels (Pack / Verify OTP /
         Ready for Pickup) still line up into a clean column. */
      .action-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        min-width: 152px;
        min-height: 36px;
        padding: 6px 14px 6px 6px;
        border-radius: 999px;
        font-family: inherit;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.01em;
        cursor: pointer;
        border: none;
        white-space: nowrap;
        transition: background-color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
      }
      .action-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 22px;
        height: 22px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.22);
        flex-shrink: 0;
      }
      .btn-pack { background: var(--tohfa-success); color: var(--tohfa-white); }
      .btn-pack:hover { background: var(--tohfa-primary-dark); transform: translateY(-1px); box-shadow: 0 3px 8px rgba(27, 94, 32, 0.25); }
      .btn-dispatch { background: var(--tohfa-info); color: var(--tohfa-white); }
      .btn-dispatch:hover { background: #1d4ed8; transform: translateY(-1px); box-shadow: 0 3px 8px rgba(37, 99, 235, 0.25); }
      .btn-otp { background: var(--tohfa-success); color: var(--tohfa-white); }
      .btn-otp:hover { background: #15803d; transform: translateY(-1px); box-shadow: 0 3px 8px rgba(22, 163, 74, 0.25); }

      .data-table td { overflow: hidden; text-overflow: ellipsis; }
      .data-table td:nth-child(4),
      .data-table td:nth-child(6),
      .data-table td:nth-child(7) { overflow: visible; text-overflow: clip; }

      /* ---------- Loading / empty states ---------- */
      .state-block { padding: 32px 48px; }
      .skeleton-row { display: flex; align-items: center; gap: 16px; padding: 12px 0; }
      .skeleton {
        display: block;
        border-radius: 6px;
        background: var(--tohfa-neutral-100);
        animation: tohfa-pulse 1.4s ease-in-out infinite;
      }
      .skeleton-sm { width: 70px; height: 14px; }
      .skeleton-md { width: 90px; height: 14px; }
      .skeleton-lg { width: 220px; height: 14px; flex: 1; }
      @keyframes tohfa-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }
      @media (prefers-reduced-motion: reduce) { .skeleton { animation: none; } }

      .empty-state { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 4px; }
      .empty-icon { color: var(--tohfa-neutral-400); margin-bottom: 8px; }
      .empty-title { font-size: 16px; font-weight: 700; color: var(--tohfa-neutral-900); margin: 0; }
      .empty-desc { font-size: 14px; color: var(--tohfa-neutral-600); margin: 0; }

      /* ---------- Modal ---------- */
      .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(17, 24, 39, 0.5);
        backdrop-filter: blur(2px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        z-index: 1000;
      }
      .modal-card {
        background: var(--tohfa-white);
        border-radius: 16px;
        width: 100%;
        max-width: 440px;
        box-shadow: var(--tohfa-shadow-lg);
        overflow: hidden;
      }
      .modal-header {
        padding: 16px 32px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid var(--tohfa-neutral-300);
      }
      .modal-title { font-size: 20px; line-height: 28px; font-weight: 600; color: var(--tohfa-neutral-900); margin: 0; }
      .modal-body { padding: 32px; }
      .modal-desc { font-size: 14px; color: var(--tohfa-neutral-600); margin-top: 0; line-height: 20px; }
      .form-group { margin-bottom: 12px; }
      .form-group label { display: block; font-size: 13px; font-weight: 700; color: var(--tohfa-neutral-700); margin-bottom: 8px; }
      .otp-input {
        width: 100%;
        padding: 20px 16px;
        font-family: inherit;
        font-size: 26px;
        font-weight: 700;
        letter-spacing: 14px;
        text-align: center;
        color: var(--tohfa-neutral-900);
        border: 2px solid var(--tohfa-neutral-300);
        border-radius: 8px;
        outline: none;
        box-sizing: border-box;
        transition: border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
      }
      .otp-input:focus {
        border-color: var(--tohfa-primary);
        box-shadow: 0 0 0 3px rgba(47, 125, 50, 0.14);
        background: var(--tohfa-primary-pale);
      }
      .otp-input.input-error { border-color: var(--tohfa-error); }
      .otp-input.input-error:focus {
        box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.12);
        background: var(--tohfa-error-light);
      }
      .modal-footer {
        padding: 12px 32px;
        background: var(--tohfa-neutral-50);
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        border-top: 1px solid var(--tohfa-neutral-300);
      }
      .btn {
        padding: 9px 18px;
        border-radius: 8px;
        font-weight: 700;
        font-size: 14px;
        cursor: pointer;
        border: none;
        transition: background-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
      }
      .btn-secondary { background: var(--tohfa-white); border: 1px solid var(--tohfa-neutral-300); color: var(--tohfa-neutral-700); }
      .btn-secondary:hover { background: var(--tohfa-neutral-100); }
      .btn-primary { background: var(--tohfa-primary); color: var(--tohfa-white); box-shadow: 0 1px 2px rgba(27, 94, 32, 0.25); }
      .btn-primary:hover:not(:disabled) {
        background: var(--tohfa-primary-dark);
        box-shadow: 0 4px 10px rgba(27, 94, 32, 0.3);
        transform: translateY(-1px);
      }
      .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
      .btn:focus-visible,
      .action-btn:focus-visible,
      .otp-input:focus-visible {
        outline: 2px solid var(--tohfa-primary);
        outline-offset: 2px;
      }

      /* ---------- Responsive ---------- */
      @media (max-width: 1100px) {
        .stat-grid { grid-template-columns: repeat(3, 1fr); }
      }
      @media (max-width: 640px) {
        .container { padding: 16px; }
        .stat-grid { grid-template-columns: repeat(2, 1fr); }
        .filter-bar { flex-direction: column; align-items: stretch; }
        .search-box { min-width: 0; }
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
  searchTerm = signal<string>('');
  orders = signal<AdminOrderSummary[]>([]);
  loading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Orders filtered client-side by the search box, on top of the
  // server-side status filter already applied by loadOrders().
  filteredOrders = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) return this.orders();
    return this.orders().filter((o) => o.orderNumber.toLowerCase().includes(term));
  });

  // OTP Dialog state
  selectedOrderForOtp = signal<AdminOrderSummary | null>(null);
  otpCode = '';
  otpError = signal<string | null>(null);
  submittingOtp = signal<boolean>(false);

  ngOnInit(): void {
    this.loadOrders();
  }

  countByStatus(status: string): number {
    return this.orders().filter((o) => o.status === status).length;
  }

  // Turns 'READY_FOR_PICKUP' into 'Ready For Pickup' instead of the
  // raw enum casing the titlecase pipe left untouched on underscores.
  formatStatus(status: string): string {
    return status
      .toLowerCase()
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  // Whether this row has any action available, so the Actions cell can
  // show a quiet dash instead of empty space when there's nothing to do.
  canAct(order: AdminOrderSummary): boolean {
    return (
      (order.status === 'CONFIRMED' && this.rbac.can('order.mark_packed')) ||
      (order.status === 'PACKED' && this.rbac.can('order.dispatch')) ||
      ((order.status === 'READY_FOR_PICKUP' || order.status === 'DISPATCHED') &&
        this.rbac.can('order.pickup_otp.verify'))
    );
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