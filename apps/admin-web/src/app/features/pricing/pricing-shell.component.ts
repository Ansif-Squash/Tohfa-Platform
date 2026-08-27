import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { BulkUpdateComponent } from './bulk-update.component';
import { FairPriceListComponent } from './fair-price-list.component';
import { PriceHistoryComponent } from './price-history.component';
import { RetailPricingComponent } from './retail-pricing.component';

export type PricingTab = 'fair-prices' | 'bulk' | 'retail' | 'history';

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
        padding: var(--tohfa-space-lg);
      }
      .tab-bar {
        display: flex;
        gap: var(--tohfa-space-sm);
        border-bottom: 2px solid rgba(4, 52, 44, 0.1);
        margin-bottom: var(--tohfa-space-xl);
      }
      .tab-btn {
        background: transparent;
        border: none;
        padding: var(--tohfa-space-md) var(--tohfa-space-lg);
        font-size: var(--tohfa-font-size-body-standard);
        font-weight: var(--tohfa-font-weight-medium);
        color: var(--tohfa-text-secondary);
        cursor: pointer;
        border-bottom: 2px solid transparent;
        margin-bottom: -2px;
      }
      .tab-btn.active {
        color: var(--tohfa-primary);
        border-bottom-color: var(--tohfa-primary);
        font-weight: var(--tohfa-font-weight-semibold);
      }
    `,
  ],
  template: `
    <div class="tab-bar">
      <button
        type="button"
        class="tab-btn"
        [class.active]="activeTab() === 'fair-prices'"
        (click)="setTab('fair-prices')"
      >
        Fair Price Ceilings
      </button>
      <button
        type="button"
        class="tab-btn"
        [class.active]="activeTab() === 'bulk'"
        (click)="setTab('bulk')"
      >
        Bulk Update
      </button>
      <button
        type="button"
        class="tab-btn"
        [class.active]="activeTab() === 'retail'"
        (click)="setTab('retail')"
      >
        Retail Pricing
      </button>
      <button
        type="button"
        class="tab-btn"
        [class.active]="activeTab() === 'history'"
        (click)="setTab('history')"
      >
        Price History
      </button>
    </div>

    <ng-container [ngSwitch]="activeTab()">
      <tohfa-fair-price-list *ngSwitchCase="'fair-prices'" />
      <tohfa-bulk-update *ngSwitchCase="'bulk'" />
      <tohfa-retail-pricing *ngSwitchCase="'retail'" />
      <tohfa-price-history *ngSwitchCase="'history'" />
    </ng-container>
  `,
})
export class PricingShellComponent {
  readonly activeTab = signal<PricingTab>('fair-prices');

  setTab(tab: PricingTab): void {
    this.activeTab.set(tab);
  }
}
