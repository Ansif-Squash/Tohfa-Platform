import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RbacService } from '../../core/rbac.service';
import { BulkUpdateComponent } from './bulk-update.component';
import { FairPriceListComponent } from './fair-price-list.component';
import { PriceHistoryComponent } from './price-history.component';
import { RetailPricingComponent } from './retail-pricing.component';

export type PricingTab = 'fair-prices' | 'bulk-update' | 'retail-prices' | 'history';

@Component({
  selector: 'tohfa-pricing-shell',
  standalone: true,
  imports: [
    CommonModule,
    FairPriceListComponent,
    BulkUpdateComponent,
    RetailPricingComponent,
    PriceHistoryComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        display: block;
      }
      .page-header {
        margin-bottom: var(--tohfa-space-xl);
      }
      .page-header h1 {
        margin: 0 0 var(--tohfa-space-xs) 0;
        font-size: var(--tohfa-font-size-headline);
        color: var(--tohfa-on-surface);
      }
      .page-header p {
        margin: 0;
        color: var(--tohfa-neutral-grey700);
        font-size: var(--tohfa-font-size-body);
      }
      .tabs {
        display: flex;
        gap: var(--tohfa-space-sm);
        border-bottom: 2px solid var(--tohfa-neutral-grey100);
        margin-bottom: var(--tohfa-space-xl);
      }
      .tab-btn {
        padding: var(--tohfa-space-md) var(--tohfa-space-lg);
        background: transparent;
        border: none;
        border-bottom: 2px solid transparent;
        margin-bottom: -2px;
        font-family: var(--tohfa-font-sans);
        font-size: var(--tohfa-font-size-body);
        font-weight: var(--tohfa-font-weight-medium);
        color: var(--tohfa-neutral-grey700);
        cursor: pointer;
      }
      .tab-btn:hover {
        color: var(--tohfa-on-surface);
      }
      .tab-btn.active {
        color: var(--tohfa-primary);
        border-bottom-color: var(--tohfa-primary);
        font-weight: var(--tohfa-font-weight-semibold);
      }
    `,
  ],
  template: `
    <div class="page-header">
      <h1>Pricing & Market Ceilings</h1>
      <p>Manage fair price ceilings (BR-08) and customer retail prices (BR-09).</p>
    </div>

    <div class="tabs">
      <button
        class="tab-btn"
        [class.active]="activeTab() === 'fair-prices'"
        (click)="activeTab.set('fair-prices')"
      >
        Fair Price Ceilings
      </button>

      <button
        *ngIf="canBulkUpdate()"
        class="tab-btn"
        [class.active]="activeTab() === 'bulk-update'"
        (click)="activeTab.set('bulk-update')"
      >
        Bulk Update
      </button>

      <button
        class="tab-btn"
        [class.active]="activeTab() === 'retail-prices'"
        (click)="activeTab.set('retail-prices')"
      >
        Retail Pricing
      </button>

      <button
        class="tab-btn"
        [class.active]="activeTab() === 'history'"
        (click)="activeTab.set('history')"
      >
        Price History
      </button>
    </div>

    <div class="tab-content">
      <tohfa-fair-price-list *ngIf="activeTab() === 'fair-prices'"></tohfa-fair-price-list>
      <tohfa-bulk-update *ngIf="activeTab() === 'bulk-update' && canBulkUpdate()"></tohfa-bulk-update>
      <tohfa-retail-pricing *ngIf="activeTab() === 'retail-prices'"></tohfa-retail-pricing>
      <tohfa-price-history *ngIf="activeTab() === 'history'"></tohfa-price-history>
    </div>
  `,
})
export class PricingShellComponent {
  private readonly rbac = inject(RbacService);

  readonly activeTab = signal<PricingTab>('fair-prices');

  canBulkUpdate(): boolean {
    return this.rbac.can('pricing.fair_price.bulk_update');
  }
}
