import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  type OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RbacService } from '../../core/rbac.service';
import {
  GoodsReceiptService,
  type GoodsReceipt,
  type QualityCheckItemInput,
} from './goods-receipt.service';
import { GOODS_RECEIPT_STRINGS } from './goods-receipt.strings';

@Component({
  selector: 'tohfa-goods-receipt-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        display: block;
      }
      .page-container {
        display: flex;
        flex-direction: column;
        gap: var(--tohfa-space-lg);
      }
      .header-toolbar {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        flex-wrap: wrap;
        gap: var(--tohfa-space-md);
      }
      .title-group h1 {
        font-size: var(--tohfa-font-size-headline);
        font-weight: var(--tohfa-font-weight-bold);
        color: var(--tohfa-on-surface);
        margin: 0 0 var(--tohfa-space-xs) 0;
      }
      .title-group p {
        color: rgba(4, 52, 44, 0.6);
        margin: 0;
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
      .btn-primary:hover {
        background: var(--tohfa-primary-pressed);
      }
      .btn-secondary {
        background: var(--tohfa-neutral-grey100);
        color: var(--tohfa-on-surface);
        padding: var(--tohfa-space-xs) var(--tohfa-space-md);
        border: 1px solid var(--tohfa-neutral-grey300);
        border-radius: var(--tohfa-radius-button);
        cursor: pointer;
        font-weight: var(--tohfa-font-weight-semibold);
        font-size: var(--tohfa-font-size-caption);
      }
      .filter-tabs {
        display: flex;
        gap: var(--tohfa-space-xs);
        border-bottom: 1px solid var(--tohfa-neutral-grey200);
        padding-bottom: var(--tohfa-space-xs);
      }
      .tab-btn {
        padding: var(--tohfa-space-xs) var(--tohfa-space-md);
        border: none;
        background: none;
        border-radius: var(--tohfa-radius-pill);
        font-size: var(--tohfa-font-size-body-small);
        cursor: pointer;
        color: var(--tohfa-on-surface);
        font-weight: var(--tohfa-font-weight-medium);
      }
      .tab-btn.active {
        background: var(--tohfa-primary);
        color: #fff;
        font-weight: var(--tohfa-font-weight-bold);
      }
      .table-card {
        background: #fff;
        border-radius: var(--tohfa-radius-card-max);
        box-shadow: 0 1px 3px rgba(4, 52, 44, 0.08);
        overflow-x: auto;
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
        color: var(--tohfa-on-surface);
      }
      .mono-text {
        font-family: var(--tohfa-font-mono);
        font-weight: var(--tohfa-font-weight-bold);
      }
      .status-badge {
        display: inline-block;
        padding: var(--tohfa-space-xs) var(--tohfa-space-sm);
        border-radius: var(--tohfa-radius-pill);
        font-size: var(--tohfa-font-size-caption);
        font-weight: var(--tohfa-font-weight-bold);
      }
      .status-AWAITING_QC {
        background: #fff3e0;
        color: #e65100;
      }
      .status-ACCEPTED {
        background: #e8f5e9;
        color: #2e7d32;
      }
      .status-PARTIALLY_ACCEPTED {
        background: #e0f2f1;
        color: #00695c;
      }
      .status-REJECTED {
        background: #ffebee;
        color: #c62828;
      }
      .status-COUNTER_OFFERED {
        background: #ede7f6;
        color: #512da8;
      }
      .action-btns {
        display: flex;
        gap: var(--tohfa-space-xs);
      }
      .empty-cell {
        text-align: center;
        padding: var(--tohfa-space-xxl);
        color: var(--tohfa-neutral-grey500);
      }
      /* Drawer Modals */
      .drawer-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.45);
        z-index: 100;
        display: flex;
        justify-content: flex-end;
      }
      .drawer {
        width: 540px;
        max-width: 100%;
        height: 100%;
        background: #fff;
        box-shadow: -4px 0 20px rgba(0, 0, 0, 0.15);
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
      }
      .form-group input,
      .form-group select,
      .form-group textarea {
        width: 100%;
        box-sizing: border-box;
        padding: var(--tohfa-space-sm) var(--tohfa-space-md);
        border: 1px solid var(--tohfa-neutral-grey300);
        border-radius: var(--tohfa-radius-input);
        font-family: var(--tohfa-font-sans);
        font-size: var(--tohfa-font-size-body-small);
      }
      .qc-item-card {
        background: var(--tohfa-surface);
        padding: var(--tohfa-space-md);
        border-radius: var(--tohfa-radius-card);
        display: flex;
        flex-direction: column;
        gap: var(--tohfa-space-xs);
        border: 1px solid var(--tohfa-neutral-grey200);
      }
      .qc-item-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .error-banner {
        padding: var(--tohfa-space-sm) var(--tohfa-space-md);
        background: rgba(226, 75, 74, 0.1);
        border: 1px solid var(--tohfa-danger);
        color: var(--tohfa-danger);
        border-radius: var(--tohfa-radius-input);
        font-size: var(--tohfa-font-size-body-small);
      }
    `,
  ],
  template: `
    <div class="page-container">
      <div class="header-toolbar">
        <div class="title-group">
          <h1>{{ s.title }}</h1>
          <p>{{ s.subtitle }}</p>
        </div>

        <button
          *ngIf="canRecordGrn()"
          class="btn-primary"
          (click)="openReceiveDrawer()"
        >
          {{ s.receiveButton }}
        </button>
      </div>

      <div class="filter-tabs">
        <button
          class="tab-btn"
          [class.active]="selectedStatus === ''"
          (click)="setStatusFilter('')"
        >
          {{ s.tabs.all }}
        </button>
        <button
          class="tab-btn"
          [class.active]="selectedStatus === 'AWAITING_QC'"
          (click)="setStatusFilter('AWAITING_QC')"
        >
          {{ s.tabs.awaitingQc }}
        </button>
        <button
          class="tab-btn"
          [class.active]="selectedStatus === 'ACCEPTED'"
          (click)="setStatusFilter('ACCEPTED')"
        >
          {{ s.tabs.accepted }}
        </button>
        <button
          class="tab-btn"
          [class.active]="selectedStatus === 'PARTIALLY_ACCEPTED'"
          (click)="setStatusFilter('PARTIALLY_ACCEPTED')"
        >
          {{ s.tabs.partiallyAccepted }}
        </button>
        <button
          class="tab-btn"
          [class.active]="selectedStatus === 'REJECTED'"
          (click)="setStatusFilter('REJECTED')"
        >
          {{ s.tabs.rejected }}
        </button>
        <button
          class="tab-btn"
          [class.active]="selectedStatus === 'COUNTER_OFFERED'"
          (click)="setStatusFilter('COUNTER_OFFERED')"
        >
          {{ s.tabs.counterOffered }}
        </button>
      </div>

      <div class="table-card">
        <table>
          <thead>
            <tr>
              <th>{{ s.table.grnNumber }}</th>
              <th>{{ s.table.poNumber }}</th>
              <th>{{ s.table.crop }}</th>
              <th>{{ s.table.grossQty }}</th>
              <th>{{ s.table.acceptedQty }}</th>
              <th>{{ s.table.rejectedQty }}</th>
              <th>{{ s.table.vehicleNumber }}</th>
              <th>{{ s.table.status }}</th>
              <th>{{ s.table.actions }}</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of receipts()">
              <td class="mono-text">{{ item.grnNumber }}</td>
              <td class="mono-text">{{ item.poNumber || item.purchaseOrderId.slice(0, 8) }}</td>
              <td>
                <strong>{{ item.cropName || 'Produce' }}</strong>
                <span *ngIf="item.grade"> ({{ item.grade }})</span>
              </td>
              <td>{{ item.grossQtyKg }}</td>
              <td>{{ item.acceptedQtyKg }}</td>
              <td>{{ item.rejectedQtyKg }}</td>
              <td>{{ item.vehicleNumber || '—' }}</td>
              <td>
                <span class="status-badge status-{{ item.status }}">{{ item.status }}</span>
              </td>
              <td>
                <div class="action-btns">
                  <button
                    *ngIf="item.status === 'AWAITING_QC' && canPerformQc()"
                    class="btn-secondary"
                    (click)="openQcDrawer(item)"
                  >
                    Perform QC
                  </button>
                  <button
                    *ngIf="item.status === 'AWAITING_QC' && canCounter()"
                    class="btn-secondary"
                    (click)="openCounterDrawer(item)"
                  >
                    Counter
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="receipts().length === 0">
              <td colspan="9" class="empty-cell">{{ s.table.emptyMessage }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- New Intake Drawer -->
      <div class="drawer-backdrop" *ngIf="isReceiveOpen()">
        <div class="drawer">
          <div class="drawer-header">
            <h3>{{ s.modal.receiveTitle }}</h3>
            <button class="btn-secondary" (click)="closeDrawers()">✕</button>
          </div>
          <div class="drawer-body">
            <div class="error-banner" *ngIf="errorMessage()">
              {{ errorMessage() }}
            </div>
            <div class="form-group">
              <label>{{ s.modal.poId }}</label>
              <input type="text" [(ngModel)]="receivePoId" placeholder="e.g. 6b5a4c3d-..." />
            </div>
            <div class="form-group">
              <label>{{ s.modal.warehouseId }}</label>
              <input type="text" [(ngModel)]="receiveWarehouseId" placeholder="e.g. 3f1b7c2e-..." />
            </div>
            <div class="form-group">
              <label>{{ s.modal.grossQty }}</label>
              <input type="text" [(ngModel)]="receiveGrossQty" placeholder="250.000" />
            </div>
            <div class="form-group">
              <label>{{ s.modal.vehicleNumber }}</label>
              <input type="text" [(ngModel)]="receiveVehicleNumber" placeholder="TN43AB1234" />
            </div>
            <div class="form-group">
              <label>{{ s.modal.photos }}</label>
              <input type="text" [(ngModel)]="receivePhotos" placeholder="https://cdn.tohfa.in/grn/photo1.jpg" />
            </div>
          </div>
          <div class="drawer-footer">
            <button class="btn-secondary" (click)="closeDrawers()">{{ s.modal.cancel }}</button>
            <button class="btn-primary" [disabled]="submitting()" (click)="submitReceive()">
              {{ submitting() ? 'Submitting...' : s.modal.submitReceive }}
            </button>
          </div>
        </div>
      </div>

      <!-- 5-Point Quality Check Drawer -->
      <div class="drawer-backdrop" *ngIf="isQcOpen()">
        <div class="drawer">
          <div class="drawer-header">
            <h3>{{ s.modal.qcTitle }}</h3>
            <button class="btn-secondary" (click)="closeDrawers()">✕</button>
          </div>
          <div class="drawer-body">
            <div class="error-banner" *ngIf="errorMessage()">
              {{ errorMessage() }}
            </div>

            <div class="form-group">
              <label>{{ s.modal.assignedGrade }}</label>
              <select [(ngModel)]="qcAssignedGrade">
                <option value="GRADE_1">Grade 1 (Premium)</option>
                <option value="GRADE_2">Grade 2 (Standard)</option>
                <option value="GRADE_3">Grade 3 (Economy)</option>
                <option value="REJECT">Reject</option>
              </select>
            </div>

            <div class="form-group">
              <label>{{ s.modal.outcome }}</label>
              <select [(ngModel)]="qcOutcome" (change)="onOutcomeChange()">
                <option value="ACCEPTED">ACCEPTED (Full)</option>
                <option value="PARTIALLY_ACCEPTED">PARTIALLY_ACCEPTED</option>
                <option value="REJECTED">REJECTED (Full)</option>
              </select>
            </div>

            <div class="form-group">
              <label>{{ s.modal.acceptedQty }}</label>
              <input type="text" [(ngModel)]="qcAcceptedQty" />
            </div>

            <div class="form-group">
              <label>{{ s.modal.rejectedQty }}</label>
              <input type="text" [(ngModel)]="qcRejectedQty" />
            </div>

            <div class="form-group" *ngIf="qcRejectedQty !== '0.000' && qcRejectedQty !== '0'">
              <label>{{ s.modal.rejectionReason }}</label>
              <textarea rows="2" [(ngModel)]="qcRejectionReason" placeholder="Describe defects..."></textarea>
            </div>

            <h4 style="margin: 8px 0 4px 0;">5-Point Quality Checklist</h4>
            <div class="qc-item-card" *ngFor="let item of qcItems; let i = index">
              <div class="qc-item-row">
                <strong>{{ getPointLabel(item.parameter) }}</strong>
                <label>
                  <input type="checkbox" [(ngModel)]="item.passed" /> Pass
                </label>
              </div>
              <div style="display: flex; gap: 8px;">
                <input
                  type="number"
                  [(ngModel)]="item.score"
                  placeholder="Score (0-10)"
                  min="0"
                  max="10"
                  style="width: 120px;"
                />
                <input
                  type="text"
                  [(ngModel)]="item.remarks"
                  placeholder="Remarks / Observations"
                  style="flex: 1;"
                />
              </div>
            </div>
          </div>
          <div class="drawer-footer">
            <button class="btn-secondary" (click)="closeDrawers()">{{ s.modal.cancel }}</button>
            <button class="btn-primary" [disabled]="submitting()" (click)="submitQc()">
              {{ submitting() ? 'Recording...' : s.modal.submitQc }}
            </button>
          </div>
        </div>
      </div>

      <!-- Counter-Offer Drawer -->
      <div class="drawer-backdrop" *ngIf="isCounterOpen()">
        <div class="drawer">
          <div class="drawer-header">
            <h3>{{ s.modal.counterTitle }}</h3>
            <button class="btn-secondary" (click)="closeDrawers()">✕</button>
          </div>
          <div class="drawer-body">
            <div class="error-banner" *ngIf="errorMessage()">
              {{ errorMessage() }}
            </div>
            <div class="form-group">
              <label>{{ s.modal.counterPrice }}</label>
              <input type="text" [(ngModel)]="counterPrice" placeholder="45.00" />
            </div>
            <div class="form-group">
              <label>{{ s.modal.counterQty }}</label>
              <input type="text" [(ngModel)]="counterQty" />
            </div>
            <div class="form-group">
              <label>{{ s.modal.counterMessage }}</label>
              <textarea rows="3" [(ngModel)]="counterMessage" placeholder="Reason for counter offer..."></textarea>
            </div>
          </div>
          <div class="drawer-footer">
            <button class="btn-secondary" (click)="closeDrawers()">{{ s.modal.cancel }}</button>
            <button class="btn-primary" [disabled]="submitting()" (click)="submitCounter()">
              {{ submitting() ? 'Sending...' : s.modal.submitCounter }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class GoodsReceiptListComponent implements OnInit {
  readonly s = GOODS_RECEIPT_STRINGS;
  private readonly service = inject(GoodsReceiptService);
  private readonly rbac = inject(RbacService);

  readonly receipts = signal<GoodsReceipt[]>([]);
  readonly isReceiveOpen = signal(false);
  readonly isQcOpen = signal(false);
  readonly isCounterOpen = signal(false);
  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  selectedStatus = '';
  activeReceipt: GoodsReceipt | null = null;

  // Receive form
  receivePoId = '';
  receiveWarehouseId = '';
  receiveGrossQty = '';
  receiveVehicleNumber = '';
  receivePhotos = '';

  // QC form
  qcAssignedGrade: 'GRADE_1' | 'GRADE_2' | 'GRADE_3' | 'REJECT' = 'GRADE_1';
  qcOutcome: 'ACCEPTED' | 'PARTIALLY_ACCEPTED' | 'REJECTED' = 'ACCEPTED';
  qcAcceptedQty = '';
  qcRejectedQty = '0.000';
  qcRejectionReason = '';
  qcItems: QualityCheckItemInput[] = [
    { parameter: 'APPEARANCE', score: 8, passed: true },
    { parameter: 'SIZE_UNIFORMITY', score: 8, passed: true },
    { parameter: 'MOISTURE', score: 8, passed: true },
    { parameter: 'DAMAGE_PEST', score: 8, passed: true },
    { parameter: 'FRESHNESS', score: 8, passed: true },
  ];

  // Counter form
  counterPrice = '';
  counterQty = '';
  counterMessage = '';

  ngOnInit(): void {
    this.loadReceipts();
  }

  canRecordGrn(): boolean {
    return this.rbac.can('inventory.goods_receipt.record');
  }

  canPerformQc(): boolean {
    return this.rbac.can('inventory.quality_check.perform');
  }

  canCounter(): boolean {
    return this.rbac.can('inventory.quality.counter_offer');
  }

  setStatusFilter(status: string): void {
    this.selectedStatus = status;
    this.loadReceipts();
  }

  loadReceipts(): void {
    this.service
      .list(this.selectedStatus ? { status: this.selectedStatus } : {})
      .subscribe({
        next: (res) => {
          this.receipts.set(res.items);
        },
        error: () => {
          this.receipts.set([]);
        },
      });
  }

  openReceiveDrawer(): void {
    this.errorMessage.set(null);
    this.isReceiveOpen.set(true);
  }

  openQcDrawer(grn: GoodsReceipt): void {
    this.activeReceipt = grn;
    this.qcAcceptedQty = grn.grossQtyKg;
    this.qcRejectedQty = '0.000';
    this.qcOutcome = 'ACCEPTED';
    this.errorMessage.set(null);
    this.isQcOpen.set(true);
  }

  openCounterDrawer(grn: GoodsReceipt): void {
    this.activeReceipt = grn;
    this.counterQty = grn.grossQtyKg;
    this.errorMessage.set(null);
    this.isCounterOpen.set(true);
  }

  closeDrawers(): void {
    this.isReceiveOpen.set(false);
    this.isQcOpen.set(false);
    this.isCounterOpen.set(false);
    this.activeReceipt = null;
    this.errorMessage.set(null);
  }

  onOutcomeChange(): void {
    if (!this.activeReceipt) return;
    const gross = Number(this.activeReceipt.grossQtyKg);
    if (this.qcOutcome === 'ACCEPTED') {
      this.qcAcceptedQty = gross.toFixed(3);
      this.qcRejectedQty = '0.000';
    } else if (this.qcOutcome === 'REJECTED') {
      this.qcAcceptedQty = '0.000';
      this.qcRejectedQty = gross.toFixed(3);
    }
  }

  getPointLabel(parameter: string): string {
    switch (parameter) {
      case 'APPEARANCE':
        return this.s.qcPoints.appearance;
      case 'SIZE_UNIFORMITY':
        return this.s.qcPoints.sizeUniformity;
      case 'MOISTURE':
        return this.s.qcPoints.moisture;
      case 'DAMAGE_PEST':
        return this.s.qcPoints.damagePest;
      case 'FRESHNESS':
        return this.s.qcPoints.freshness;
      default:
        return parameter;
    }
  }

  submitReceive(): void {
    if (!this.receivePoId || !this.receiveWarehouseId || !this.receiveGrossQty) {
      this.errorMessage.set('Please provide PO ID, Warehouse ID, and Gross Quantity.');
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    const photos = this.receivePhotos
      ? this.receivePhotos.split(',').map((p) => p.trim()).filter(Boolean)
      : [];

    this.service
      .createGoodsReceipt({
        purchaseOrderId: this.receivePoId,
        warehouseId: this.receiveWarehouseId,
        grossQtyKg: this.receiveGrossQty,
        vehicleNumber: this.receiveVehicleNumber || undefined,
        photos,
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.closeDrawers();
          this.loadReceipts();
        },
        error: (err) => {
          this.submitting.set(false);
          this.errorMessage.set(err.error?.detail ?? err.message ?? 'Failed to receive goods.');
        },
      });
  }

  submitQc(): void {
    if (!this.activeReceipt) return;
    this.submitting.set(true);
    this.errorMessage.set(null);

    this.service
      .recordQualityCheck(this.activeReceipt.id, {
        assignedGrade: this.qcAssignedGrade,
        outcome: this.qcOutcome,
        acceptedQtyKg: this.qcAcceptedQty,
        rejectedQtyKg: this.qcRejectedQty,
        rejectionReason: this.qcRejectionReason || undefined,
        items: this.qcItems,
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.closeDrawers();
          this.loadReceipts();
        },
        error: (err) => {
          this.submitting.set(false);
          this.errorMessage.set(err.error?.detail ?? err.message ?? 'Failed to record quality check.');
        },
      });
  }

  submitCounter(): void {
    if (!this.activeReceipt || !this.counterPrice || !this.counterQty) {
      this.errorMessage.set('Price and Quantity are required for counter-offer.');
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    this.service
      .sendCounterOffer(this.activeReceipt.id, {
        pricePerKg: this.counterPrice,
        quantityKg: this.counterQty,
        message: this.counterMessage || undefined,
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.closeDrawers();
          this.loadReceipts();
        },
        error: (err) => {
          this.submitting.set(false);
          this.errorMessage.set(err.error?.detail ?? err.message ?? 'Failed to send counter-offer.');
        },
      });
  }
}
