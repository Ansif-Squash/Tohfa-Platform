import { CommonModule } from '@angular/common';
import { Component, inject, signal, type OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminInventoryService, type BatchSummary } from './inventory.service';

@Component({
  selector: 'tohfa-batch-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  styles: [
    `
      .container {
        padding: var(--tohfa-space-xl);
        max-width: 1200px;
        margin: 0 auto;
      }
      .back-link {
        display: inline-flex;
        align-items: center;
        gap: var(--tohfa-space-xs);
        color: var(--tohfa-primary);
        font-weight: var(--tohfa-font-weight-semibold);
        text-decoration: none;
        margin-bottom: var(--tohfa-space-lg);
      }
      .card {
        background: var(--tohfa-neutral-white);
        border-radius: var(--tohfa-radius-card-max);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        padding: var(--tohfa-space-xl);
        margin-bottom: var(--tohfa-space-xl);
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        border-bottom: 1px solid var(--tohfa-neutral-grey100);
        padding-bottom: var(--tohfa-space-lg);
        margin-bottom: var(--tohfa-space-lg);
        flex-wrap: wrap;
        gap: var(--tohfa-space-md);
      }
      .batch-code {
        font-size: var(--tohfa-font-size-title-1);
        font-weight: var(--tohfa-font-weight-bold);
        color: var(--tohfa-neutral-black);
        margin: 0;
      }
      .badge {
        display: inline-flex;
        align-items: center;
        padding: var(--tohfa-space-xs) var(--tohfa-space-md);
        border-radius: var(--tohfa-radius-badge);
        font-size: var(--tohfa-font-size-body-small);
        font-weight: var(--tohfa-font-weight-semibold);
      }
      .badge-active {
        background: var(--tohfa-status-success-bg);
        color: var(--tohfa-status-success-text);
      }
      .badge-depleted {
        background: var(--tohfa-status-warning-bg);
        color: var(--tohfa-status-warning-text);
      }
      .badge-expired,
      .badge-written-off {
        background: var(--tohfa-status-error-bg);
        color: var(--tohfa-status-error-text);
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: var(--tohfa-space-lg);
      }
      .meta-item {
        display: flex;
        flex-direction: column;
        gap: var(--tohfa-space-xs);
      }
      .meta-label {
        font-size: var(--tohfa-font-size-footnote);
        font-weight: var(--tohfa-font-weight-semibold);
        color: var(--tohfa-neutral-grey600);
        text-transform: uppercase;
      }
      .meta-value {
        font-size: var(--tohfa-font-size-body-large);
        font-weight: var(--tohfa-font-weight-medium);
        color: var(--tohfa-neutral-black);
      }
      .meta-value-highlight {
        color: var(--tohfa-primary);
        font-weight: var(--tohfa-font-weight-bold);
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      th,
      td {
        padding: var(--tohfa-space-md) var(--tohfa-space-lg);
        text-align: left;
        border-bottom: 1px solid var(--tohfa-neutral-grey100);
        font-size: var(--tohfa-font-size-body-small);
      }
      th {
        background: var(--tohfa-surface);
        font-weight: var(--tohfa-font-weight-semibold);
        color: var(--tohfa-neutral-grey700);
      }
      .badge-pos {
        background: var(--tohfa-status-success-bg);
        color: var(--tohfa-status-success-text);
      }
      .badge-neg {
        background: var(--tohfa-status-error-bg);
        color: var(--tohfa-status-error-text);
      }
      .empty {
        padding: var(--tohfa-space-xl);
        text-align: center;
        color: var(--tohfa-neutral-grey500);
      }
    `,
  ],
  template: `
    <div class="container" *ngIf="batch() as b">
      <a routerLink="/inventory" class="back-link">← Back to Stock & Inventory</a>

      <div class="card">
        <div class="header">
          <div>
            <h1 class="batch-code">Batch: {{ b.batchCode }}</h1>
            <p class="meta-label">ID: {{ b.id }}</p>
          </div>
          <span
            class="badge"
            [ngClass]="{
              'badge-active': b.status === 'ACTIVE',
              'badge-depleted': b.status === 'DEPLETED',
              'badge-expired': b.status === 'EXPIRED',
              'badge-written-off': b.status === 'WRITTEN_OFF'
            }"
          >
            {{ b.status }}
          </span>
        </div>

        <div class="grid">
          <div class="meta-item">
            <span class="meta-label">Crop</span>
            <span class="meta-value">{{ b.cropName || b.cropId }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Grade</span>
            <span class="meta-value">{{ b.grade }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Warehouse</span>
            <span class="meta-value">{{ b.warehouseName || b.warehouseId }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Available Quantity</span>
            <span class="meta-value meta-value-highlight">{{ b.qtyAvailable }} kg</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Initial Received</span>
            <span class="meta-value">{{ b.qtyReceived }} kg</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Received On</span>
            <span class="meta-value">{{ b.receivedOn | date: 'mediumDate' }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Expiry Date</span>
            <span class="meta-value">{{ b.expiryOn ? (b.expiryOn | date: 'mediumDate') : 'Unspecified' }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Storage Location</span>
            <span class="meta-value">{{ b.storageLocation || 'Default Bay' }}</span>
          </div>
        </div>
      </div>

      <div class="card">
        <h2>Movement History</h2>
        <table>
          <thead>
            <tr>
              <th>Date / Time</th>
              <th>Movement Type</th>
              <th>Quantity Delta</th>
              <th>Balance After</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let m of b.movements">
              <td>{{ m.createdAt | date: 'medium' }}</td>
              <td>{{ m.movementType }}</td>
              <td>
                <span class="badge" [ngClass]="m.qtyDelta.startsWith('-') ? 'badge-neg' : 'badge-pos'">
                  {{ m.qtyDelta }} kg
                </span>
              </td>
              <td>
                <strong>{{ m.balanceAfter }} kg</strong>
              </td>
              <td>{{ m.remarks || '—' }}</td>
            </tr>
            <tr *ngIf="!b.movements || b.movements.length === 0">
              <td colspan="5" class="empty">No movement history recorded yet.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class BatchDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly inventoryService = inject(AdminInventoryService);

  readonly batch = signal<BatchSummary | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/inventory']);
      return;
    }

    this.inventoryService.getBatch(id).subscribe({
      next: (res) => this.batch.set(res),
      error: () => this.router.navigate(['/inventory']),
    });
  }
}
