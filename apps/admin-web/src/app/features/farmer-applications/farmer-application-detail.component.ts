import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal, type OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RbacService } from '../../core/rbac.service';
import {
  AdminFarmerApplicationsService,
  type FarmerApplicationDetail,
  type StatusTimeline,
} from './farmer-applications.service';

@Component({
  selector: 'tohfa-farmer-application-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        display: block;
        font-family: 'Manrope', sans-serif;
      }

      .detail-container {
        display: flex;
        flex-direction: column;
        gap: var(--tohfa-space-lg, 16px);
        padding-bottom: 100px;
      }

      /* ---------- Cards ---------- */
      .card {
        background: var(--tohfa-white, #ffffff);
        border: 1px solid var(--tohfa-neutral-300, #e5e7eb);
        border-radius: var(--tohfa-radius-lg, 12px);
        padding: var(--tohfa-space-xl, 32px);
        box-shadow: 0 1px 3px rgba(17, 24, 39, 0.05);
      }
      .section-title {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: var(--tohfa-font-size-h3, 20px);
        font-weight: 700;
        margin: 0 0 var(--tohfa-space-lg, 16px) 0;
        color: var(--tohfa-neutral-900, #1f2937);
        border-bottom: 1px solid var(--tohfa-neutral-200, #eceff3);
        padding-bottom: var(--tohfa-space-md, 12px);
      }
      .section-title .step-chip {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 26px;
        height: 26px;
        border-radius: 50%;
        background: var(--tohfa-primary-light, #e8f5e9);
        color: var(--tohfa-primary-dark, #1b5e20);
        font-size: 13px;
        font-weight: 800;
      }

      /* ---------- Field grid ---------- */
      .grid-2 {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        gap: var(--tohfa-space-lg, 16px);
      }
      .field label {
        display: block;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--tohfa-neutral-500, #9ca3af);
        margin-bottom: 6px;
      }
      .field .val {
        font-size: var(--tohfa-font-size-body, 14px);
        font-weight: 600;
        color: var(--tohfa-neutral-900, #1f2937);
      }
      .field .val a {
        color: var(--tohfa-info, #2563eb);
        font-weight: 600;
        text-decoration: none;
      }
      .field .val a:hover {
        text-decoration: underline;
      }
      .farm-block + .farm-block {
        margin-top: var(--tohfa-space-lg, 16px);
        padding-top: var(--tohfa-space-lg, 16px);
        border-top: 1px dashed var(--tohfa-neutral-200, #eceff3);
      }
      .doc-block {
        padding: var(--tohfa-space-md, 12px) 0;
        border-bottom: 1px solid var(--tohfa-neutral-100, #f3f4f6);
      }
      .doc-block:last-child {
        border-bottom: none;
      }

      /* ---------- Sticky footer ---------- */
      .sticky-footer {
        position: fixed;
        bottom: 0;
        left: 240px;
        right: 0;
        background: var(--tohfa-white, #ffffff);
        border-top: 1px solid var(--tohfa-neutral-300, #e5e7eb);
        padding: var(--tohfa-space-md, 12px) var(--tohfa-space-xl, 32px);
        box-shadow: 0 -8px 20px rgba(17, 24, 39, 0.06);
        display: flex;
        justify-content: space-between;
        align-items: center;
        z-index: 10;
      }

      /* ---------- Buttons ---------- */
      .btn {
        padding: 10px 20px;
        border-radius: var(--tohfa-radius-sm, 6px);
        font-weight: 700;
        font-size: 13px;
        border: none;
        cursor: pointer;
        transition: background-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
      }
      .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
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
      .btn-danger {
        background: var(--tohfa-error, #dc2626);
        color: #fff;
        box-shadow: 0 1px 2px rgba(220, 38, 38, 0.25);
      }
      .btn-danger:hover:not(:disabled) {
        background: #b91c1c;
        box-shadow: 0 4px 10px rgba(220, 38, 38, 0.3);
        transform: translateY(-1px);
      }
      .btn-secondary {
        background: var(--tohfa-neutral-100, #f3f4f6);
        color: var(--tohfa-neutral-800, #374151);
        border: 1px solid var(--tohfa-neutral-300, #e5e7eb);
        text-decoration: none;
      }
      .btn-secondary:hover:not(:disabled) {
        background: var(--tohfa-neutral-200, #eceff3);
      }
      .actions-group {
        display: flex;
        gap: 10px;
      }

      /* ---------- Modals ---------- */
      .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(17, 24, 39, 0.5);
        backdrop-filter: blur(2px);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 100;
      }
      .modal-card {
        background: var(--tohfa-white, #ffffff);
        padding: var(--tohfa-space-xl, 32px);
        border-radius: var(--tohfa-radius-xl, 16px);
        box-shadow: 0 16px 40px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.06);
        width: 100%;
        max-width: 480px;
      }
      .modal-card h3 {
        margin: 0 0 8px 0;
        font-size: 18px;
        font-weight: 700;
        color: var(--tohfa-neutral-900, #1f2937);
      }
      .modal-card p {
        margin: 0 0 var(--tohfa-space-md, 12px) 0;
        font-size: 13px;
        color: var(--tohfa-neutral-600, #6b7280);
      }
      .modal-card label {
        display: block;
        font-size: 12px;
        font-weight: 700;
        color: var(--tohfa-neutral-700, #4b5563);
        margin-bottom: 6px;
        margin-top: var(--tohfa-space-md, 12px);
      }
      .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: var(--tohfa-space-lg, 16px);
      }

      textarea,
      select {
        width: 100%;
        padding: 10px var(--tohfa-space-md, 12px);
        border-radius: var(--tohfa-radius-sm, 6px);
        border: 1.5px solid var(--tohfa-neutral-300, #e5e7eb);
        background: var(--tohfa-white, #ffffff);
        font-family: 'Manrope', sans-serif;
        font-size: var(--tohfa-font-size-body, 14px);
        color: var(--tohfa-neutral-900, #1f2937);
        outline: none;
        transition: border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
      }
      textarea:hover,
      select:hover {
        border-color: var(--tohfa-neutral-400, #d1d5db);
      }
      textarea:focus,
      select:focus {
        border-color: var(--tohfa-primary, #2f7d32);
        box-shadow: 0 0 0 3px rgba(47, 125, 50, 0.14);
        background: var(--tohfa-primary-pale, #f4fbf4);
      }
      textarea {
        min-height: 90px;
        resize: vertical;
      }

      /* ---------- Timeline ---------- */
      .timeline-step {
        padding: var(--tohfa-space-md, 12px) 0 var(--tohfa-space-md, 12px) var(--tohfa-space-lg, 16px);
        border-left: 2px solid var(--tohfa-primary-light, #e8f5e9);
        position: relative;
      }
      .timeline-step:last-child {
        border-left-color: transparent;
      }
      .timeline-step::before {
        content: '';
        position: absolute;
        left: -6px;
        top: 20px;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: var(--tohfa-primary, #2f7d32);
        box-shadow: 0 0 0 3px var(--tohfa-primary-light, #e8f5e9);
      }
      .timeline-step strong {
        font-size: 13px;
        font-weight: 700;
        color: var(--tohfa-neutral-900, #1f2937);
        text-transform: uppercase;
        letter-spacing: 0.03em;
      }
      .timeline-step .timestamp {
        font-size: 12px;
        color: var(--tohfa-neutral-500, #9ca3af);
        margin-left: 6px;
      }
      .timeline-step p {
        margin: 6px 0 0 0;
        font-size: 13px;
        color: var(--tohfa-neutral-600, #6b7280);
      }
    `,
  ],
  template: `
    <div class="detail-container" *ngIf="app(); else loading">
      <!-- Step 1: Personal -->
      <div class="card">
        <h2 class="section-title"><span class="step-chip">1</span>Personal Details</h2>
        <div class="grid-2">
          <div class="field">
            <label>Full Name</label>
            <div class="val">{{ app()?.fullName }}</div>
          </div>
          <div class="field">
            <label>Mobile</label>
            <div class="val">{{ app()?.mobile }}</div>
          </div>
          <div class="field">
            <label>Aadhaar (BR-33 Masked)</label>
            <div class="val">{{ maskedAadhaar() }}</div>
          </div>
          <div class="field">
            <label>Farming Experience</label>
            <div class="val">{{ app()?.step1Personal?.farmingExperienceYears ?? 'N/A' }} years</div>
          </div>
          <div class="field">
            <label>Address</label>
            <div class="val">{{ app()?.step1Personal?.addressLine1 ?? 'N/A' }}</div>
          </div>
        </div>
      </div>

      <!-- Step 2: Farm Details -->
      <div class="card">
        <h2 class="section-title"><span class="step-chip">2</span>Farm Details</h2>
        <div *ngFor="let farm of app()?.step2FarmDetails?.farms; let i = index" class="farm-block grid-2">
          <div class="field">
            <label>Farm Name</label>
            <div class="val">{{ farm.name }}</div>
          </div>
          <div class="field">
            <label>Total Area (Acres)</label>
            <div class="val">{{ farm.totalAreaAcres }} acres</div>
          </div>
          <div class="field">
            <label>Water Source</label>
            <div class="val">{{ farm.waterSource ?? 'N/A' }}</div>
          </div>
        </div>
      </div>

      <!-- Step 3: Location & FMB -->
      <div class="card">
        <h2 class="section-title"><span class="step-chip">3</span>Location & Geometry</h2>
        <div class="grid-2">
          <div class="field">
            <label>GPS Coordinates</label>
            <div class="val">
              Lat: {{ app()?.step3Location?.latitude ?? 'N/A' }}, Lng: {{ app()?.step3Location?.longitude ?? 'N/A' }}
            </div>
          </div>
          <div class="field">
            <label>FMB Polygon Geometry</label>
            <div class="val">
              {{ app()?.step3Location?.fmbPolygon ? 'FMB Polygon Captured (' + app()?.step3Location?.fmbPolygon?.coordinates?.[0]?.length + ' points)' : 'Not captured' }}
            </div>
          </div>
        </div>
      </div>

      <!-- Step 4: Documents -->
      <div class="card">
        <h2 class="section-title"><span class="step-chip">4</span>Uploaded Documents</h2>
        <div *ngFor="let doc of app()?.step4Documents?.documents" class="doc-block grid-2">
          <div class="field">
            <label>Document Type</label>
            <div class="val">{{ doc.docType }}</div>
          </div>
          <div class="field">
            <label>File URL</label>
            <div class="val">
              <a [href]="doc.fileUrl" target="_blank" rel="noopener">View Uploaded Document →</a>
            </div>
          </div>
        </div>
      </div>

      <!-- Status Timeline -->
      <div class="card" *ngIf="timeline()">
        <h2 class="section-title">Status Audit Timeline</h2>
        <div *ngFor="let step of timeline()?.steps" class="timeline-step">
          <strong>{{ step.status }}</strong><span class="timestamp">{{ step.reachedAt | date: 'medium' }}</span>
          <p *ngIf="step.note">{{ step.note }}</p>
        </div>
      </div>

      <!-- Sticky Action Footer -->
      <div class="sticky-footer">
        <a class="btn btn-secondary" routerLink="/farmer-applications">← Back to Queue</a>

        <div class="actions-group" *ngIf="canMutate()">
          <button class="btn btn-secondary" (click)="showInfoModal.set(true)">
            Request More Info
          </button>
          <button class="btn btn-danger" (click)="showRejectModal.set(true)">
            Reject
          </button>
          <button class="btn btn-primary" (click)="showApproveModal.set(true)">
            Approve Application
          </button>
        </div>
      </div>

      <!-- Approve Modal -->
      <div class="modal-backdrop" *ngIf="showApproveModal()">
        <div class="modal-card">
          <h3>Approve Application</h3>
          <p>This will allocate a TOHFA Farmer ID and activate the account.</p>
          <textarea [(ngModel)]="approveNote" placeholder="Optional approval note"></textarea>
          <div class="modal-actions">
            <button class="btn btn-secondary" (click)="showApproveModal.set(false)">Cancel</button>
            <button class="btn btn-primary" (click)="confirmApprove()">Confirm Approval</button>
          </div>
        </div>
      </div>

      <!-- Reject Modal -->
      <div class="modal-backdrop" *ngIf="showRejectModal()">
        <div class="modal-card">
          <h3>Reject Application</h3>
          <label>Reason Code</label>
          <select [(ngModel)]="rejectReasonCode">
            <option value="DOCUMENTS_INVALID">Documents Invalid</option>
            <option value="LAND_NOT_VERIFIED">Land Not Verified</option>
            <option value="DUPLICATE_APPLICANT">Duplicate Applicant</option>
            <option value="OUTSIDE_SERVICE_AREA">Outside Service Area</option>
            <option value="OTHER">Other</option>
          </select>
          <label>Explanation (Min 5 chars)</label>
          <textarea [(ngModel)]="rejectReason" placeholder="State reason clearly"></textarea>
          <div class="modal-actions">
            <button class="btn btn-secondary" (click)="showRejectModal.set(false)">Cancel</button>
            <button class="btn btn-danger" [disabled]="rejectReason.length < 5" (click)="confirmReject()">Reject Application</button>
          </div>
        </div>
      </div>

      <!-- Request Info Modal -->
      <div class="modal-backdrop" *ngIf="showInfoModal()">
        <div class="modal-card">
          <h3>Request More Information</h3>
          <textarea [(ngModel)]="infoMessage" placeholder="Specify required information"></textarea>
          <div class="modal-actions">
            <button class="btn btn-secondary" (click)="showInfoModal.set(false)">Cancel</button>
            <button class="btn btn-primary" [disabled]="infoMessage.length < 5" (click)="confirmRequestInfo()">Send Request</button>
          </div>
        </div>
      </div>
    </div>

    <ng-template #loading>
      <div class="card"><p>Loading application...</p></div>
    </ng-template>
  `,
})
export class FarmerApplicationDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(AdminFarmerApplicationsService);
  private readonly rbac = inject(RbacService);

  readonly app = signal<FarmerApplicationDetail | null>(null);
  readonly timeline = signal<StatusTimeline | null>(null);

  readonly canMutate = computed(() => this.rbac.canMutate('farmer.application.approve'));

  readonly maskedAadhaar = computed(() => {
    const last4 = this.app()?.step1Personal?.aadhaarLast4;
    return last4 ? `••••••••${last4}` : '••••••••••••';
  });

  showApproveModal = signal(false);
  showRejectModal = signal(false);
  showInfoModal = signal(false);

  approveNote = '';
  rejectReasonCode = 'DOCUMENTS_INVALID';
  rejectReason = '';
  infoMessage = '';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadApplication(id);
    }
  }

  loadApplication(id: string): void {
    this.service.getById(id).subscribe({
      next: (res) => this.app.set(res),
      error: () => this.router.navigate(['/farmer-applications']),
    });

    this.service.getStatusTimeline(id).subscribe({
      next: (res) => this.timeline.set(res),
      error: () => {
        // Timeline is non-critical; if it fails the rest of the detail page still works
        this.timeline.set(null);
      },
    });
  }

  confirmApprove(): void {
    const id = this.app()?.id;
    if (!id) return;
    this.service.approve(id, this.approveNote ? { note: this.approveNote } : {}).subscribe({
      next: (res) => {
        this.app.set(res);
        this.showApproveModal.set(false);
        this.loadApplication(id);
      },
    });
  }

  confirmReject(): void {
    const id = this.app()?.id;
    if (!id || this.rejectReason.length < 5) return;
    this.service.reject(id, { reasonCode: this.rejectReasonCode, reason: this.rejectReason }).subscribe({
      next: (res) => {
        this.app.set(res);
        this.showRejectModal.set(false);
        this.loadApplication(id);
      },
    });
  }

  confirmRequestInfo(): void {
    const id = this.app()?.id;
    if (!id || this.infoMessage.length < 5) return;
    this.service.requestInfo(id, { message: this.infoMessage }).subscribe({
      next: (res) => {
        this.app.set(res);
        this.showInfoModal.set(false);
        this.loadApplication(id);
      },
    });
  }
}