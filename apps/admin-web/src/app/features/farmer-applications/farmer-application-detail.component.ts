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
      .detail-container {
        display: flex;
        flex-direction: column;
        gap: var(--tohfa-space-xl);
        padding-bottom: 100px;
      }
      .card {
        background: #fff;
        border-radius: var(--tohfa-radius-card);
        padding: var(--tohfa-space-xl);
        box-shadow: var(--tohfa-shadow-card);
      }
      .section-title {
        font-size: var(--tohfa-font-size-title);
        font-weight: var(--tohfa-font-weight-bold);
        margin-bottom: var(--tohfa-space-lg);
        color: var(--tohfa-primary);
        border-bottom: 1px solid rgba(4, 52, 44, 0.08);
        padding-bottom: var(--tohfa-space-sm);
      }
      .grid-2 {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: var(--tohfa-space-md);
      }
      .field label {
        display: block;
        font-size: var(--tohfa-font-size-caption);
        color: rgba(4, 52, 44, 0.6);
        margin-bottom: var(--tohfa-space-xs);
      }
      .field .val {
        font-weight: var(--tohfa-font-weight-semibold);
        color: var(--tohfa-on-surface);
      }
      .sticky-footer {
        position: fixed;
        bottom: 0;
        left: 240px;
        right: 0;
        background: #fff;
        padding: var(--tohfa-space-lg) var(--tohfa-space-xl);
        box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.08);
        display: flex;
        justify-content: space-between;
        align-items: center;
        z-index: 10;
      }
      .btn {
        padding: var(--tohfa-space-md) var(--tohfa-space-xl);
        border-radius: var(--tohfa-radius-button);
        font-weight: var(--tohfa-font-weight-bold);
        border: none;
        cursor: pointer;
      }
      .btn-primary {
        background: var(--tohfa-primary);
        color: #fff;
      }
      .btn-danger {
        background: #c62828;
        color: #fff;
      }
      .btn-secondary {
        background: var(--tohfa-surface-variant);
        color: var(--tohfa-on-surface);
      }
      .actions-group {
        display: flex;
        gap: var(--tohfa-space-md);
      }
      .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 100;
      }
      .modal-card {
        background: #fff;
        padding: var(--tohfa-space-xl);
        border-radius: var(--tohfa-radius-card);
        width: 100%;
        max-width: 500px;
      }
      textarea,
      select {
        width: 100%;
        padding: var(--tohfa-space-md);
        border-radius: var(--tohfa-radius-button);
        border: 1px solid rgba(4, 52, 44, 0.2);
        margin: var(--tohfa-space-md) 0;
      }
      .timeline-step {
        padding: var(--tohfa-space-md) 0;
        border-left: 2px solid var(--tohfa-primary);
        padding-left: var(--tohfa-space-lg);
        position: relative;
      }
      .timeline-step::before {
        content: '';
        position: absolute;
        left: -6px;
        top: 20px;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: var(--tohfa-primary);
      }
    `,
  ],
  template: `
    <div class="detail-container" *ngIf="app(); else loading">
      <!-- Step 1: Personal -->
      <div class="card">
        <h2 class="section-title">Step 1: Personal Details</h2>
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
        <h2 class="section-title">Step 2: Farm Details</h2>
        <div *ngFor="let farm of app()?.step2FarmDetails?.farms; let i = index" class="grid-2">
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
        <h2 class="section-title">Step 3: Location & Geometry</h2>
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
        <h2 class="section-title">Step 4: Uploaded Documents</h2>
        <div *ngFor="let doc of app()?.step4Documents?.documents" class="grid-2" style="margin-bottom: 8px;">
          <div class="field">
            <label>Document Type</label>
            <div class="val">{{ doc.docType }}</div>
          </div>
          <div class="field">
            <label>File URL</label>
            <div class="val">
              <a [href]="doc.fileUrl" target="_blank" rel="noopener">View Uploaded Document</a>
            </div>
          </div>
        </div>
      </div>

      <!-- Status Timeline -->
      <div class="card" *ngIf="timeline()">
        <h2 class="section-title">Status Audit Timeline</h2>
        <div *ngFor="let step of timeline()?.steps" class="timeline-step">
          <strong>{{ step.status }}</strong> — <span>{{ step.reachedAt | date: 'medium' }}</span>
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
          <div style="display: flex; justify-content: flex-end; gap: 8px;">
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
          <div style="display: flex; justify-content: flex-end; gap: 8px;">
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
          <div style="display: flex; justify-content: flex-end; gap: 8px;">
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
