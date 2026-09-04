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
      .container {
        display: flex;
        flex-direction: column;
        gap: var(--tohfa-space-lg);
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        color:blue;
      }
      .title {
        font-size: var(--tohfa-font-size-headline);
        font-weight: 800;
        color: #14532D;
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
    `,
  ],
  template: `
    <div class="container">
      <div class="header">
        <h1 class="title">Farmer Registration Application</h1>
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

      <tohfa-table
        [rows]="applications()"
        [colspan]="6"
        emptyMessage="No farmer applications found in queue."
      >
        <ng-template #header>
          <th>Applicant Name</th>
          <th>Mobile</th>
          <th>Status</th>
          <th>Progress</th>
          <th>Submitted At</th>
          <th>Action</th>
        </ng-template>

        <ng-template #row let-item>
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