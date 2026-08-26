import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal, type OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  AdminFarmerApplicationsService,
  type FarmerApplicationSummary,
} from './farmer-applications.service';

@Component({
  selector: 'tohfa-farmer-applications-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      .container {
        display: flex;
        flex-direction: column;
        gap: var(--tohfa-space-lg);
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .title {
        font-size: var(--tohfa-font-size-headline);
        font-weight: var(--tohfa-font-weight-bold);
        color: var(--tohfa-on-surface);
      }
      .filters {
        display: flex;
        gap: var(--tohfa-space-md);
        background: var(--tohfa-surface-variant);
        padding: var(--tohfa-space-md);
        border-radius: var(--tohfa-radius-card);
      }
      select,
      input {
        padding: var(--tohfa-space-sm) var(--tohfa-space-md);
        border: 1px solid rgba(4, 52, 44, 0.15);
        border-radius: var(--tohfa-radius-button);
        background: #fff;
        font-size: var(--tohfa-font-size-body);
      }
      table {
        width: 100%;
        border-collapse: collapse;
        background: #fff;
        border-radius: var(--tohfa-radius-card);
        overflow: hidden;
        box-shadow: var(--tohfa-shadow-card);
      }
      th,
      td {
        padding: var(--tohfa-space-md) var(--tohfa-space-lg);
        text-align: left;
        border-bottom: 1px solid rgba(4, 52, 44, 0.08);
      }
      th {
        background: var(--tohfa-surface-variant);
        font-weight: var(--tohfa-font-weight-bold);
        color: var(--tohfa-on-surface);
      }
      .status-badge {
        display: inline-block;
        padding: var(--tohfa-space-xs) var(--tohfa-space-sm);
        border-radius: var(--tohfa-radius-chip);
        font-size: var(--tohfa-font-size-footnote);
        font-weight: var(--tohfa-font-weight-semibold);
      }
      .status-SUBMITTED {
        background: #e3f2fd;
        color: #1565c0;
      }
      .status-DOCS_REVIEW {
        background: #fff3e0;
        color: #e65100;
      }
      .status-FARM_VERIFICATION {
        background: #f3e5f5;
        color: #7b1fa2;
      }
      .status-AUDIT {
        background: #e0f2f1;
        color: #00695c;
      }
      .status-APPROVED {
        background: #e8f5e9;
        color: #2e7d32;
      }
      .status-REJECTED {
        background: #ffebee;
        color: #c62828;
      }
      .btn {
        padding: var(--tohfa-space-xs) var(--tohfa-space-md);
        border-radius: var(--tohfa-radius-button);
        text-decoration: none;
        background: var(--tohfa-primary);
        color: #fff;
        font-weight: var(--tohfa-font-weight-semibold);
      }
      .empty {
        padding: var(--tohfa-space-xl);
        text-align: center;
        color: rgba(4, 52, 44, 0.6);
      }
    `,
  ],
  template: `
    <div class="container">
      <div class="header">
        <h1 class="title">Farmer Registration Applications</h1>
      </div>

      <div class="filters">
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

      <table>
        <thead>
          <tr>
            <th>Applicant Name</th>
            <th>Mobile</th>
            <th>Status</th>
            <th>Progress</th>
            <th>Submitted At</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let item of applications()">
            <td><strong>{{ item.fullName }}</strong></td>
            <td>{{ item.mobile }}</td>
            <td>
              <span class="status-badge status-{{ item.status }}">{{ item.status }}</span>
            </td>
            <td>Step {{ item.currentStep }} of 5</td>
            <td>{{ item.submittedAt ? (item.submittedAt | date: 'mediumDate') : 'In Draft' }}</td>
            <td>
              <a class="btn" [routerLink]="['/farmer-applications', item.id]">Review</a>
            </td>
          </tr>
          <tr *ngIf="applications().length === 0">
            <td colspan="6" class="empty">No farmer applications found in queue.</td>
          </tr>
        </tbody>
      </table>
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
