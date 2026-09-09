import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal, type OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TohfaTableComponent } from '../../shared/tohfa-table.component';
import {
  AdminFarmerApplicationsService,
  type FarmerApplicationSummary,
} from './farmer-applications.service';

@Component({
  selector: 'tohfa-farmer-applications-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TohfaTableComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        display: block;
        font-family: 'Manrope', sans-serif;
      }

      .container {
        display: flex;
        flex-direction: column;
        gap: var(--tohfa-space-lg, 16px);
      }

      /* ---------- Header ---------- */
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 4px;
      }
      .title {
        font-size: var(--tohfa-font-size-h1, 30px);
        font-weight: 700;
        color: var(--tohfa-neutral-900, #1f2937);
        letter-spacing: -0.01em;
        margin: 0;
      }
      .subtitle {
        margin: 4px 0 0 0;
        font-size: var(--tohfa-font-size-body, 14px);
        color: var(--tohfa-neutral-600, #6b7280);
      }
      .count-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 14px;
        border-radius: var(--tohfa-radius-full, 999px);
        background: var(--tohfa-primary-light, #e8f5e9);
        color: var(--tohfa-primary-dark, #1b5e20);
        font-weight: 700;
        font-size: 13px;
      }

      /* ---------- Filters ---------- */
      .filters {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--tohfa-space-md, 12px);
        background: var(--tohfa-neutral-50, #f9fafb);
        border: 1px solid var(--tohfa-neutral-200, #eceff3);
        padding: var(--tohfa-space-md, 12px);
        border-radius: var(--tohfa-radius-md, 8px);
      }
      .filters label {
        font-size: 13px;
        font-weight: 600;
        color: var(--tohfa-neutral-700, #4b5563);
      }

      select,
      input {
        padding: 9px var(--tohfa-space-md, 12px);
        border: 1.5px solid var(--tohfa-neutral-300, #e5e7eb);
        border-radius: var(--tohfa-radius-sm, 6px);
        background: var(--tohfa-white, #ffffff);
        font-size: var(--tohfa-font-size-body, 14px);
        color: var(--tohfa-neutral-900, #1f2937);
        outline: none;
        transition: border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
      }
      select {
        cursor: pointer;
        min-width: 200px;
      }
      select:hover,
      input:hover {
        border-color: var(--tohfa-neutral-400, #d1d5db);
      }
      select:focus,
      input:focus {
        border-color: var(--tohfa-primary, #2f7d32);
        box-shadow: 0 0 0 3px rgba(47, 125, 50, 0.14);
        background: var(--tohfa-primary-pale, #f4fbf4);
      }

      /* ---------- Status badges (semantic, per lifecycle stage) ---------- */
      .status-badge {
        display: inline-block;
        padding: 5px 13px;
        border-radius: var(--tohfa-radius-full, 999px);
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        border: 1px solid transparent;
        white-space: nowrap;
        line-height: 1.4;
      }
      .status-SUBMITTED {
        background: var(--tohfa-info-light, #eff6ff);
        color: var(--tohfa-info, #2563eb);
        border-color: rgba(37, 99, 235, 0.22);
      }
      .status-DOCS_REVIEW {
        background: var(--tohfa-warning-light, #fffbeb);
        color: var(--tohfa-warning, #d97706);
        border-color: rgba(217, 119, 6, 0.22);
      }
      .status-FARM_VERIFICATION {
        background: var(--tohfa-purple-light, #f5f3ff);
        color: var(--tohfa-purple, #7c3aed);
        border-color: rgba(124, 58, 237, 0.22);
      }
      .status-AUDIT {
        background: #e6fffa;
        color: #0f766e;
        border-color: rgba(15, 118, 110, 0.2);
      }
      .status-APPROVED {
        background: var(--tohfa-success-light, #f0fdf4);
        color: var(--tohfa-success, #16a34a);
        border-color: rgba(22, 163, 74, 0.22);
      }
      .status-REJECTED {
        background: var(--tohfa-error-light, #fef2f2);
        color: var(--tohfa-error, #dc2626);
        border-color: rgba(220, 38, 38, 0.22);
      }

      /* ---------- Progress ---------- */
      .progress-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 5px 12px;
        border-radius: var(--tohfa-radius-sm, 6px);
        background: var(--tohfa-neutral-100, #f3f4f6);
        color: var(--tohfa-neutral-700, #4b5563);
        font-size: 12px;
        font-weight: 700;
        white-space: nowrap;
      }
        
      .text-left {
  text-align: left;
  vertical-align: middle;
  font-size:16px;
}
      .progress-badge .dot {
        width: 5px;
        height: 5px;
        border-radius: 999px;
        background: var(--tohfa-neutral-300, #e5e7eb);
      }
      .progress-badge .dot.filled {
        background: var(--tohfa-primary, #2f7d32);
      }

      /* ---------- Action button ---------- */
      .btn {
        display: inline-flex;
        align-items: center;
        padding: 7px 16px;
        border-radius: var(--tohfa-radius-sm, 6px);
        text-decoration: none;
        background: var(--tohfa-primary, #2f7d32);
        color: #fff;
        font-weight: 600;
        font-size: 13px;
        box-shadow: 0 1px 2px rgba(27, 94, 32, 0.25);
        transition: background-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
      }
      .btn:hover {
        background: var(--tohfa-primary-dark, #1b5e20);
        box-shadow: 0 4px 10px rgba(27, 94, 32, 0.3);
        transform: translateY(-1px);
      }
    `,
  ],
  template: `
    <div class="container">
      <div class="header">
        <div>
          <h1 class="title">Farmer Registration Applications</h1>
          <p class="subtitle">Review and manage farmer onboarding applications.</p>
        </div>
        <span class="count-pill">{{ applications().length }} in queue</span>
      </div>

      <div class="filters">
        <label>Status:</label>
        <select [(ngModel)]="selectedStatus" (ngModelChange)="loadApplications()">
          <option value="">All Statuses</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="DOCS_REVIEW">Documents Review</option>
          <option value="FARM_VERIFICATION">Farm Verification</option>
          <option value="AUDIT">Audit</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      <tohfa-table
        [rows]="applications()"
        [colspan]="6"
        emptyMessage="No farmer applications found in queue."
      >
        <ng-template #header>
          <th class="text-left">Applicant Name</th>
          <th class="text-left">Mobile</th>
          <th class="text-left">Status</th>
          <th class="text-left">Progress</th>
          <th class="text-left">Submitted At</th>
          <th class="text-left">Action</th>
        </ng-template>

        <ng-template #row let-item>
          <td><strong>{{ item.fullName }}</strong></td>
          <td>{{ item.mobile }}</td>
          <td>
            <span class="status-badge status-{{ item.status }}">{{ item.status.replace('_', ' ') }}</span>
          </td>
          <td>
            <span class="progress-badge">
              <span class="dots">
                <span class="dot" *ngFor="let s of [1,2,3,4,5]" [class.filled]="s <= item.currentStep"></span>
              </span>
              Step {{ item.currentStep }}/5
            </span>
          </td>
          <td>{{ item.submittedAt ? (item.submittedAt | date: 'mediumDate') : 'In Draft' }}</td>
          <td>
            <a class="btn" [routerLink]="['/farmer-applications', item.id]">Review</a>
          </td>
        </ng-template>
      </tohfa-table>
    </div>
  `,
})
export class FarmerApplicationsListComponent implements OnInit {
  private readonly service = inject(AdminFarmerApplicationsService);

  readonly applications = signal<FarmerApplicationSummary[]>([]);
  selectedStatus = '';

  ngOnInit(): void {
    this.loadApplications();
  }

  loadApplications(): void {
    this.service.list(this.selectedStatus ? { status: this.selectedStatus } : {}).subscribe({
      next: (res) => {
        this.applications.set(res.items);
      },
      error: () => {
        this.applications.set([]);
      },
    });
  }
}