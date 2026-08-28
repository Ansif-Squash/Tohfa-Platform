import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  type OnDestroy,
  type OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RbacService } from '../../core/rbac.service';
import { LISTINGS_STRINGS } from './listings-queue.strings';
import {
  ListingsService,
  type AdminListing,
  type ApproveListingPayload,
  type CounterOfferPayload,
  type RejectListingPayload,
} from './listings.service';

type ModalMode = 'none' | 'approve' | 'counter' | 'reject';

@Component({
  selector: 'tohfa-listings-queue',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        display: block;
      }
      .page-header {
        margin-bottom: var(--tohfa-space-lg);
      }
      .page-title {
        font-family: var(--tohfa-font-sans);
        font-size: var(--tohfa-font-size-title3);
        font-weight: var(--tohfa-font-weight-bold);
        color: var(--tohfa-on-surface);
        margin: 0 0 var(--tohfa-space-xs) 0;
      }
      .page-subtitle {
        font-size: var(--tohfa-font-size-body-small);
        color: var(--tohfa-neutral-grey600);
        margin: 0;
      }
      .toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--tohfa-space-lg);
        gap: var(--tohfa-space-md);
        flex-wrap: wrap;
      }
      .filters {
        display: flex;
        gap: var(--tohfa-space-sm);
        align-items: center;
        flex-wrap: wrap;
      }
      select,
      input,
      textarea {
        padding: var(--tohfa-space-sm) var(--tohfa-space-md);
        border: 1px solid var(--tohfa-neutral-grey300);
        border-radius: var(--tohfa-radius-input);
        background: var(--tohfa-neutral-white);
        font-family: var(--tohfa-font-sans);
        font-size: var(--tohfa-font-size-body-small);
        color: var(--tohfa-on-surface);
      }
      select:focus,
      input:focus,
      textarea:focus {
        outline: none;
        border-color: var(--tohfa-primary);
        box-shadow: 0 0 0 2px var(--tohfa-primary-light);
      }
      .btn {
        min-height: 44px;
        padding: var(--tohfa-space-sm) var(--tohfa-space-lg);
        border-radius: var(--tohfa-radius-button);
        font-family: var(--tohfa-font-sans);
        font-weight: var(--tohfa-font-weight-semibold);
        font-size: var(--tohfa-font-size-body-small);
        cursor: pointer;
        border: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--tohfa-space-xs);
        transition: background 0.15s ease-in-out;
      }
      .btn-primary {
        background: var(--tohfa-primary);
        color: var(--tohfa-neutral-white);
      }
      .btn-primary:hover:not(:disabled) {
        background: var(--tohfa-primary-pressed);
      }
      .btn-secondary {
        background: var(--tohfa-neutral-grey100);
        color: var(--tohfa-on-surface);
      }
      .btn-secondary:hover:not(:disabled) {
        background: var(--tohfa-neutral-grey200);
      }
      .btn-danger {
        background: var(--tohfa-status-error-bg);
        color: var(--tohfa-status-error-text);
        border: 1px solid var(--tohfa-status-error-border);
      }
      .btn-danger:hover:not(:disabled) {
        background: var(--tohfa-status-error-border);
      }
      .btn-sm {
        min-height: 32px;
        padding: var(--tohfa-space-xs) var(--tohfa-space-sm);
        font-size: var(--tohfa-font-size-caption);
      }
      .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .table-card {
        background: var(--tohfa-neutral-white);
        border-radius: var(--tohfa-radius-card-max);
        box-shadow: 0 1px 3px rgba(4, 52, 44, 0.08);
        overflow: hidden;
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
        letter-spacing: 0.04em;
        color: var(--tohfa-on-surface);
      }
      .money-val {
        font-family: var(--tohfa-font-mono);
        font-weight: var(--tohfa-font-weight-bold);
        color: var(--tohfa-primary-pressed);
      }
      .ceiling-val {
        font-family: var(--tohfa-font-mono);
        color: var(--tohfa-neutral-grey600);
        font-size: var(--tohfa-font-size-caption);
      }
      .badge {
        display: inline-block;
        padding: var(--tohfa-space-xs) var(--tohfa-space-sm);
        border-radius: var(--tohfa-radius-pill);
        font-size: var(--tohfa-font-size-caption);
        font-weight: var(--tohfa-font-weight-semibold);
      }
      .badge-grade {
        background: var(--tohfa-neutral-grey100);
        color: var(--tohfa-on-surface);
      }
      .badge-pending {
        background: var(--tohfa-status-warning-bg);
        color: var(--tohfa-status-warning-text);
      }
      .badge-countered {
        background: var(--tohfa-surface);
        color: var(--tohfa-primary);
        border: 1px solid var(--tohfa-primary-light);
      }
      .badge-accepted {
        background: var(--tohfa-status-success-bg);
        color: var(--tohfa-status-success-text);
      }
      .badge-rejected {
        background: var(--tohfa-status-error-bg);
        color: var(--tohfa-status-error-text);
      }
      .badge-withdrawn {
        background: var(--tohfa-neutral-grey100);
        color: var(--tohfa-neutral-grey600);
      }
      .badge-routed-away {
        background: var(--tohfa-status-warning-bg);
        color: var(--tohfa-status-warning-text);
        border: 1px dashed var(--tohfa-status-warning-border);
        font-weight: var(--tohfa-font-weight-bold);
      }
      .countdown-cell {
        font-family: var(--tohfa-font-mono);
        font-weight: var(--tohfa-font-weight-semibold);
      }
      .countdown-active {
        color: var(--tohfa-primary-pressed);
      }
      .countdown-lapsed {
        color: var(--tohfa-status-error-text);
      }
      .actions-cell {
        display: flex;
        gap: var(--tohfa-space-xs);
        align-items: center;
        flex-wrap: wrap;
      }
      .empty-row {
        text-align: center;
        padding: var(--tohfa-space-xxl);
        color: var(--tohfa-neutral-grey500);
      }

      /* Modal / Drawer Overlay */
      .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(4, 52, 44, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: var(--tohfa-space-md);
      }
      .modal-dialog {
        background: var(--tohfa-neutral-white);
        border-radius: var(--tohfa-radius-card-max);
        width: 100%;
        max-width: 540px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        max-height: 90vh;
      }
      .modal-header {
        padding: var(--tohfa-space-lg);
        border-bottom: 1px solid var(--tohfa-neutral-grey100);
      }
      .modal-title {
        margin: 0 0 var(--tohfa-space-xs) 0;
        font-size: var(--tohfa-font-size-title4);
        color: var(--tohfa-on-surface);
      }
      .modal-desc {
        margin: 0;
        font-size: var(--tohfa-font-size-body-small);
        color: var(--tohfa-neutral-grey600);
      }
      .modal-body {
        padding: var(--tohfa-space-lg);
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: var(--tohfa-space-md);
      }
      .form-group {
        display: flex;
        flex-direction: column;
        gap: var(--tohfa-space-xs);
      }
      .form-label {
        font-size: var(--tohfa-font-size-footnote);
        font-weight: var(--tohfa-font-weight-semibold);
        color: var(--tohfa-on-surface);
      }
      .modal-footer {
        padding: var(--tohfa-space-md) var(--tohfa-space-lg);
        border-top: 1px solid var(--tohfa-neutral-grey100);
        display: flex;
        justify-content: flex-end;
        gap: var(--tohfa-space-sm);
        background: var(--tohfa-surface);
      }
      .alert-banner {
        padding: var(--tohfa-space-sm) var(--tohfa-space-md);
        border-radius: var(--tohfa-radius-input);
        margin-bottom: var(--tohfa-space-md);
        font-size: var(--tohfa-font-size-body-small);
      }
      .alert-error {
        background: var(--tohfa-status-error-bg);
        color: var(--tohfa-status-error-text);
        border: 1px solid var(--tohfa-status-error-border);
      }
      .alert-success {
        background: var(--tohfa-status-success-bg);
        color: var(--tohfa-status-success-text);
        border: 1px solid var(--tohfa-status-success-border);
      }
    `,
  ],
  template: `
    <div class="page-header">
      <h1 class="page-title">{{ strings.TITLE }}</h1>
      <p class="page-subtitle">{{ strings.SUBTITLE }}</p>
    </div>

    <!-- Alert Messages -->
    <div class="alert-banner alert-error" *ngIf="errorMessage()">
      {{ errorMessage() }}
    </div>
    <div class="alert-banner alert-success" *ngIf="successMessage()">
      {{ successMessage() }}
    </div>

    <!-- Toolbar & Filters -->
    <div class="toolbar">
      <div class="filters">
        <select [ngModel]="statusFilter()" (ngModelChange)="onStatusFilterChange($event)">
          <option value="ALL">{{ strings.FILTER_ALL }}</option>
          <option value="PENDING_APPROVAL">{{ strings.FILTER_PENDING }}</option>
          <option value="COUNTER_OFFERED">{{ strings.FILTER_COUNTERED }}</option>
          <option value="ACCEPTED">{{ strings.FILTER_ACCEPTED }}</option>
          <option value="REJECTED">{{ strings.FILTER_REJECTED }}</option>
          <option value="WITHDRAWN">{{ strings.FILTER_WITHDRAWN }}</option>
        </select>
        <input
          type="text"
          [placeholder]="strings.SEARCH_PLACEHOLDER"
          [ngModel]="searchQuery()"
          (ngModelChange)="searchQuery.set($event)"
        />
      </div>

      <button class="btn btn-secondary btn-sm" (click)="loadQueue()" [disabled]="isLoading()">
        {{ strings.REFRESH_BTN }}
      </button>
    </div>

    <!-- Listings Queue Data Table -->
    <div class="table-card">
      <table>
        <thead>
          <tr>
            <th>{{ strings.COL_LISTING_NO }}</th>
            <th>{{ strings.COL_FARMER }}</th>
            <th>{{ strings.COL_CROP }}</th>
            <th>{{ strings.COL_QUANTITY }}</th>
            <th>{{ strings.COL_PRICING }}</th>
            <th>{{ strings.COL_STATUS }}</th>
            <th>{{ strings.COL_ROUNDS }}</th>
            <th>{{ strings.COL_COUNTDOWN }}</th>
            <th>{{ strings.COL_ACTIONS }}</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let item of filteredListings()">
            <!-- Listing ID -->
            <td>
              <strong>{{ item.listingNumber || item.id.substring(0, 8) }}</strong>
            </td>

            <!-- Farmer -->
            <td>
              <div>{{ item.farmerName || 'Farmer' }}</div>
              <small class="ceiling-val">{{ item.tohfaFarmerId || item.farmerId.substring(0, 8) }}</small>
            </td>

            <!-- Crop & Grade -->
            <td>
              <div>{{ item.cropName }}</div>
              <span class="badge badge-grade">{{ item.grade }}</span>
            </td>

            <!-- Quantity -->
            <td>{{ item.quantityKg }} kg</td>

            <!-- Pricing -->
            <td>
              <div class="money-val">&#8377;{{ item.askingPricePerKg }}</div>
              <div class="ceiling-val">Ceiling: &#8377;{{ item.ceilingPricePerKg }}</div>
            </td>

            <!-- Status -->
            <td>
              <span
                class="badge"
                [ngClass]="{
                  'badge-pending': item.status === 'PENDING_APPROVAL',
                  'badge-countered': item.status === 'COUNTER_OFFERED',
                  'badge-accepted': item.status === 'ACCEPTED',
                  'badge-rejected': item.status === 'REJECTED',
                  'badge-withdrawn': item.status === 'WITHDRAWN'
                }"
              >
                {{ item.status }}
              </span>
            </td>

            <!-- Rounds -->
            <td>
              <span>{{ item.counterRoundsUsed || 0 }} / 3</span>
            </td>

            <!-- Live Synchronized Countdown Timer -->
            <td class="countdown-cell">
              <ng-container *ngIf="item.activeCounterOffer?.expiresAt; else noOffer">
                <span
                  [ngClass]="{
                    'countdown-active': getRemainingSecs(item) > 0,
                    'countdown-lapsed': getRemainingSecs(item) <= 0
                  }"
                >
                  {{ formatCountdown(item) }}
                </span>
              </ng-container>
              <ng-template #noOffer>
                <span class="ceiling-val">{{ strings.NO_OFFER }}</span>
              </ng-template>
            </td>

            <!-- Actions (RBAC + Routed Away Gate) -->
            <td>
              <!-- BR-29: Routed Away Self-Approval Indicator -->
              <div *ngIf="item.routedAway" class="badge badge-routed-away" [title]="strings.ROUTED_AWAY_TOOLTIP">
                {{ strings.ROUTED_AWAY_BADGE }}
              </div>

              <!-- Action Buttons for Non-Routed Listings -->
              <div class="actions-cell" *ngIf="!item.routedAway">
                <!-- Approve Button -->
                <button
                  *ngIf="canApprove() && (item.status === 'PENDING_APPROVAL' || item.status === 'COUNTER_OFFERED')"
                  class="btn btn-primary btn-sm"
                  (click)="openApproveModal(item)"
                >
                  {{ strings.BTN_APPROVE }}
                </button>

                <!-- Counter-Offer Button -->
                <button
                  *ngIf="canCounter() && (item.status === 'PENDING_APPROVAL' || item.status === 'COUNTER_OFFERED')"
                  class="btn btn-secondary btn-sm"
                  [disabled]="item.counterRoundsUsed >= 3"
                  [title]="item.counterRoundsUsed >= 3 ? strings.ROUNDS_EXHAUSTED : ''"
                  (click)="openCounterModal(item)"
                >
                  {{ strings.BTN_COUNTER }}
                </button>

                <!-- Reject Button -->
                <button
                  *ngIf="canReject() && (item.status === 'PENDING_APPROVAL' || item.status === 'COUNTER_OFFERED')"
                  class="btn btn-danger btn-sm"
                  (click)="openRejectModal(item)"
                >
                  {{ strings.BTN_REJECT }}
                </button>
              </div>
            </td>
          </tr>

          <tr *ngIf="filteredListings().length === 0">
            <td colspan="9" class="empty-row">
              {{ strings.EMPTY_QUEUE }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Dialogs -->

    <!-- 1. APPROVE MODAL -->
    <div class="modal-backdrop" *ngIf="modalMode() === 'approve' && selectedListing()">
      <div class="modal-dialog">
        <div class="modal-header">
          <h2 class="modal-title">{{ strings.APPROVE_TITLE }}</h2>
          <p class="modal-desc">{{ strings.APPROVE_DESC }}</p>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">{{ strings.LABEL_DEST_WAREHOUSE }} *</label>
            <select [(ngModel)]="approvePayload.warehouseId">
              <option value="">{{ strings.SELECT_WAREHOUSE_PLACEHOLDER }}</option>
              <option *ngFor="let w of warehouses()" [value]="w.id">
                {{ w.name }} ({{ w.code }}) - {{ w.type }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">{{ strings.LABEL_DELIVERY_DATE }}</label>
            <input type="date" [(ngModel)]="approvePayload.expectedDeliveryDate" />
          </div>

          <div class="form-group">
            <label class="form-label">{{ strings.LABEL_APPROVE_NOTE }}</label>
            <textarea
              rows="3"
              [placeholder]="strings.APPROVE_NOTE_PLACEHOLDER"
              [(ngModel)]="approvePayload.note"
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="closeModal()">{{ strings.BTN_CANCEL }}</button>
          <button
            class="btn btn-primary"
            (click)="submitApprove()"
            [disabled]="!approvePayload.warehouseId || isSubmitting()"
          >
            {{ strings.BTN_CONFIRM_APPROVE }}
          </button>
        </div>
      </div>
    </div>

    <!-- 2. COUNTER-OFFER MODAL -->
    <div class="modal-backdrop" *ngIf="modalMode() === 'counter' && selectedListing()">
      <div class="modal-dialog">
        <div class="modal-header">
          <h2 class="modal-title">{{ strings.COUNTER_TITLE }}</h2>
          <p class="modal-desc">{{ strings.COUNTER_DESC }}</p>
        </div>
        <div class="modal-body">
          <div class="alert-banner alert-error" *ngIf="selectedListing()!.counterRoundsUsed >= 3">
            {{ strings.ROUNDS_EXHAUSTED }}
          </div>

          <small class="ceiling-val">
            {{ strings.ROUNDS_REMAINING(selectedListing()!.counterRoundsUsed) }}
          </small>

          <div class="form-group">
            <label class="form-label">{{ strings.LABEL_COUNTER_PRICE }} *</label>
            <input
              type="text"
              placeholder="e.g. 48.00"
              [(ngModel)]="counterPayload.pricePerKg"
            />
            <small class="ceiling-val">
              Ceiling: &#8377;{{ selectedListing()!.ceilingPricePerKg }} | Farmer Asking: &#8377;{{ selectedListing()!.askingPricePerKg }}
            </small>
          </div>

          <div class="form-group">
            <label class="form-label">{{ strings.LABEL_COUNTER_QTY }} *</label>
            <input
              type="text"
              placeholder="e.g. 150.000"
              [(ngModel)]="counterPayload.quantityKg"
            />
            <small class="ceiling-val">Farmer Listed Quantity: {{ selectedListing()!.quantityKg }} kg</small>
          </div>

          <div class="form-group">
            <label class="form-label">{{ strings.LABEL_COUNTER_MSG }}</label>
            <textarea
              rows="3"
              [placeholder]="strings.COUNTER_MSG_PLACEHOLDER"
              [(ngModel)]="counterPayload.message"
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="closeModal()">{{ strings.BTN_CANCEL }}</button>
          <button
            class="btn btn-primary"
            (click)="submitCounter()"
            [disabled]="
              !counterPayload.pricePerKg ||
              !counterPayload.quantityKg ||
              selectedListing()!.counterRoundsUsed >= 3 ||
              isSubmitting()
            "
          >
            {{ strings.BTN_CONFIRM_COUNTER }}
          </button>
        </div>
      </div>
    </div>

    <!-- 3. REJECT MODAL -->
    <div class="modal-backdrop" *ngIf="modalMode() === 'reject' && selectedListing()">
      <div class="modal-dialog">
        <div class="modal-header">
          <h2 class="modal-title">{{ strings.REJECT_TITLE }}</h2>
          <p class="modal-desc">{{ strings.REJECT_DESC }}</p>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">{{ strings.LABEL_REJECT_CODE }} *</label>
            <select [(ngModel)]="rejectPayload.reasonCode">
              <option value="QUALITY_CONCERN">Quality Concern (Grade Mismatch)</option>
              <option value="PRICE_UNACCEPTABLE">Price Unacceptable</option>
              <option value="NO_DEMAND">No Current Market Demand</option>
              <option value="CERT_ISSUE">Certification / Verification Issue</option>
              <option value="DUPLICATE">Duplicate Listing</option>
              <option value="OTHER">Other Reason</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">{{ strings.LABEL_REJECT_REASON }} *</label>
            <textarea
              rows="4"
              [placeholder]="strings.REJECT_REASON_PLACEHOLDER"
              [(ngModel)]="rejectPayload.reason"
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="closeModal()">{{ strings.BTN_CANCEL }}</button>
          <button
            class="btn btn-danger"
            (click)="submitReject()"
            [disabled]="!rejectPayload.reason || rejectPayload.reason.length < 5 || isSubmitting()"
          >
            {{ strings.BTN_CONFIRM_REJECT }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class ListingsQueueComponent implements OnInit, OnDestroy {
  private readonly service = inject(ListingsService);
  private readonly rbac = inject(RbacService);

  readonly strings = LISTINGS_STRINGS;

  // RBAC permissions — computed so they react if the active role changes mid-session
  readonly canApprove = computed(() => this.rbac.can('listing.approve'));
  readonly canReject = computed(() => this.rbac.can('listing.reject'));
  readonly canCounter = computed(() => this.rbac.can('listing.counter_offer.send'));

  // State signals
  readonly listings = signal<AdminListing[]>([]);
  readonly warehouses = this.service.warehouses;
  readonly statusFilter = signal<string>('PENDING_APPROVAL');
  readonly searchQuery = signal<string>('');
  readonly isLoading = signal<boolean>(false);
  readonly isSubmitting = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  // Modal signals & payloads
  readonly modalMode = signal<ModalMode>('none');
  readonly selectedListing = signal<AdminListing | null>(null);

  approvePayload: ApproveListingPayload = { warehouseId: '' };
  counterPayload: CounterOfferPayload = { pricePerKg: '', quantityKg: '' };
  rejectPayload: RejectListingPayload = { reasonCode: 'PRICE_UNACCEPTABLE', reason: '' };

  // Timer interval ID for live countdown tick
  private timerIntervalId: ReturnType<typeof setInterval> | null = null;
  readonly timerTick = signal<number>(Date.now());

  ngOnInit(): void {
    this.loadQueue();
    this.service.fetchWarehouses().subscribe({ error: () => {} });

    // Tick the countdown timer every second
    this.timerIntervalId = setInterval(() => {
      this.timerTick.set(Date.now());
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.timerIntervalId !== null) {
      clearInterval(this.timerIntervalId);
      this.timerIntervalId = null;
    }
  }

  loadQueue(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.service.listAdminQueue({ status: this.statusFilter() }).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.listings.set(res.body?.items ?? []);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err?.error?.detail || err?.message || this.strings.ERROR_GENERIC);
      },
    });
  }

  onStatusFilterChange(status: string): void {
    this.statusFilter.set(status);
    this.loadQueue();
  }

  filteredListings(): AdminListing[] {
    // Read the timer tick so the template recomputes on tick
    this.timerTick();
    const query = this.searchQuery().trim().toLowerCase();
    const items = this.listings();
    if (!query) return items;

    return items.filter((item) => {
      return (
        item.cropName.toLowerCase().includes(query) ||
        (item.farmerName && item.farmerName.toLowerCase().includes(query)) ||
        (item.tohfaFarmerId && item.tohfaFarmerId.toLowerCase().includes(query)) ||
        (item.listingNumber && item.listingNumber.toLowerCase().includes(query))
      );
    });
  }

  getRemainingSecs(item: AdminListing): number {
    return this.service.getRemainingSeconds(item.activeCounterOffer?.expiresAt);
  }

  formatCountdown(item: AdminListing): string {
    const secs = this.getRemainingSecs(item);
    return this.service.formatCountdown(secs);
  }

  openApproveModal(listing: AdminListing): void {
    this.selectedListing.set(listing);
    this.approvePayload = {
      // Always start empty \u2014 forces the user to actively pick a warehouse.
      // Avoids the race where warehouses haven't loaded yet and [0] is undefined.
      warehouseId: '',
      expectedDeliveryDate: '',
      note: '',
    };
    this.modalMode.set('approve');
  }

  openCounterModal(listing: AdminListing): void {
    this.selectedListing.set(listing);
    this.counterPayload = {
      pricePerKg: listing.askingPricePerKg,
      quantityKg: listing.quantityKg,
      message: '',
    };
    this.modalMode.set('counter');
  }

  openRejectModal(listing: AdminListing): void {
    this.selectedListing.set(listing);
    this.rejectPayload = {
      reasonCode: 'PRICE_UNACCEPTABLE',
      reason: '',
    };
    this.modalMode.set('reject');
  }

  closeModal(): void {
    this.modalMode.set('none');
    this.selectedListing.set(null);
  }

  submitApprove(): void {
    const listing = this.selectedListing();
    if (!listing) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    this.service.approveListing(listing.id, this.approvePayload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closeModal();
        this.successMessage.set(this.strings.SUCCESS_APPROVED);
        this.loadQueue();
        setTimeout(() => this.successMessage.set(null), 5000);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err?.error?.detail || err?.message || this.strings.ERROR_GENERIC);
      },
    });
  }

  submitCounter(): void {
    const listing = this.selectedListing();
    if (!listing) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    this.service.sendCounterOffer(listing.id, this.counterPayload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closeModal();
        this.successMessage.set(this.strings.SUCCESS_COUNTERED);
        this.loadQueue();
        setTimeout(() => this.successMessage.set(null), 5000);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err?.error?.detail || err?.message || this.strings.ERROR_GENERIC);
      },
    });
  }

  submitReject(): void {
    const listing = this.selectedListing();
    if (!listing) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    this.service.rejectListing(listing.id, this.rejectPayload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closeModal();
        this.successMessage.set(this.strings.SUCCESS_REJECTED);
        this.loadQueue();
        setTimeout(() => this.successMessage.set(null), 5000);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err?.error?.detail || err?.message || this.strings.ERROR_GENERIC);
      },
    });
  }
}
