import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal, type OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TohfaTableComponent } from '../../shared/tohfa-table.component';
import { WarehousesService, type WarehouseItem } from './warehouses.service';

@Component({
  selector: 'tohfa-warehouses',
  standalone: true,
  imports: [CommonModule, FormsModule, TohfaTableComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        display: block;
        padding: var(--tohfa-space-xl);

        /* Map this page's tokens to the names tohfa-table expects,
           so the shared table inherits the same look as the rest of the page. */
        --tohfa-neutral-100: var(--tohfa-surface-container-low, #f8fafc);
        --tohfa-neutral-300: var(--tohfa-neutral-grey200, #e2e8f0);
        --tohfa-neutral-400: var(--tohfa-neutral-grey300, #cbd5e0);
        --tohfa-neutral-600: var(--tohfa-neutral-grey600, #718096);
        --tohfa-neutral-700: var(--tohfa-neutral-grey700, #4a5568);
        --tohfa-on-surface: var(--tohfa-on-surface, #1a202c);
        --tohfa-surface-variant: var(--tohfa-surface-container-low, #f8fafc);
        --tohfa-primary-pale: var(--tohfa-surface-container-lowest-hover, #f1f5f9);
        --tohfa-radius-card: var(--tohfa-radius-lg, 12px);
        --tohfa-shadow-card: 0 1px 3px rgba(0, 0, 0, 0.05);
        --tohfa-space-md: var(--tohfa-space-md, 12px);
        --tohfa-space-lg: var(--tohfa-space-lg, 16px);
        --tohfa-space-xl: var(--tohfa-space-xxl, 48px);
        --tohfa-font-size-small: var(--tohfa-font-size-caption, 12px);
        --tohfa-font-size-body: var(--tohfa-font-size-body, 14px);
        --tohfa-font-weight-semibold: 600;
      }

      .page-header {
        margin-bottom: var(--tohfa-space-xl);
      }
      .page-header h1 {
        margin: 0 0 var(--tohfa-space-xs) 0;
        font-size: var(--tohfa-font-size-headline);
        font-weight: 700;
        color: var(--tohfa-on-surface);
      }
      .page-header p {
        margin: 0;
        color: var(--tohfa-neutral-grey700);
        font-size: var(--tohfa-font-size-body);
      }

      /* ---------- KPI cards ---------- */
      .kpi-cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: var(--tohfa-space-lg);
        margin-bottom: var(--tohfa-space-xl);
      }
      .kpi-card {
        background: var(--tohfa-surface-container-lowest, #fff);
        border: 1px solid var(--tohfa-neutral-grey200, #e2e8f0);
        border-radius: var(--tohfa-radius-lg, 12px);
        padding: var(--tohfa-space-lg);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        transition: box-shadow 0.15s ease, border-color 0.15s ease;
      }
      .kpi-card:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        border-color: var(--tohfa-neutral-grey300, #cbd5e0);
      }
      .kpi-label {
        font-size: var(--tohfa-font-size-caption, 12px);
        color: var(--tohfa-neutral-grey600, #718096);
        text-transform: uppercase;
        font-weight: 600;
        letter-spacing: 0.05em;
        margin-bottom: 6px;
      }
      .kpi-value {
        font-size: 28px;
        font-weight: 700;
        color: var(--tohfa-on-surface, #1a202c);
        line-height: 1.2;
      }

      /* ---------- Filter bar ---------- */
      .filter-bar {
        display: flex;
        flex-wrap: wrap;
        gap: var(--tohfa-space-md);
        margin-bottom: var(--tohfa-space-lg);
        background: var(--tohfa-surface-container-low, #f8fafc);
        padding: var(--tohfa-space-md);
        border-radius: var(--tohfa-radius-md, 8px);
        align-items: center;
      }
      .filter-group {
        display: flex;
        align-items: center;
        gap: var(--tohfa-space-xs);
      }
      .filter-group label {
        font-size: var(--tohfa-font-size-body-sm, 14px);
        font-weight: 500;
        color: var(--tohfa-neutral-grey700, #4a5568);
      }
      .filter-select,
      .search-input {
        padding: 8px 12px;
        border: 1px solid var(--tohfa-neutral-grey300, #cbd5e0);
        border-radius: var(--tohfa-radius-sm, 6px);
        font-size: 14px;
        background: #fff;
        outline: none;
        transition: border-color 0.15s ease, box-shadow 0.15s ease;
      }
      .filter-select:focus,
      .search-input:focus {
        border-color: #2b6cb0;
        box-shadow: 0 0 0 3px rgba(43, 108, 176, 0.12);
      }
      .search-input {
        width: 240px;
      }

      /* ---------- Loading state card ---------- */
      .data-table-card {
        background: var(--tohfa-surface-container-lowest, #fff);
        border: 1px solid var(--tohfa-neutral-grey200, #e2e8f0);
        border-radius: var(--tohfa-radius-lg, 12px);
        overflow: hidden;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      }
      .empty-state {
        text-align: center;
        padding: var(--tohfa-space-xxl);
        color: var(--tohfa-neutral-grey600);
      }

      /* ---------- Table cell content ---------- */
      .wh-code {
        font-family: monospace;
        font-weight: 600;
        background: #edf2f7;
        padding: 2px 6px;
        border-radius: 4px;
      }
      .badge {
        display: inline-block;
        padding: 3px 10px;
        border-radius: 9999px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.03em;
      }
      .badge.main {
        background: #ebf8ff;
        color: #2b6cb0;
        border: 1px solid #bee3f8;
      }
      .badge.sub {
        background: #f0fff4;
        color: #22543d;
        border: 1px solid #c6f6d5;
      }
      .badge.active {
        background: #e6fffa;
        color: #234e52;
      }
    `,
  ],
  template: `
    <div class="page-header">
      <h1>Warehouse Hubs (BR-23)</h1>
      <p>Fixed collection and regional distribution network across The Nilgiris.</p>
    </div>

    <!-- KPIs -->
    <div class="kpi-cards">
      <div class="kpi-card">
        <div class="kpi-label">Total Warehouses</div>
        <div class="kpi-value">{{ warehouses().length }}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Main Central Hubs</div>
        <div class="kpi-value">{{ countByType('MAIN') }}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Sub Warehouse Hubs</div>
        <div class="kpi-value">{{ countByType('SUB') }}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Total Capacity</div>
        <div class="kpi-value">{{ totalCapacityKg() | number }} kg</div>
      </div>
    </div>

    <!-- Filters -->
    <div class="filter-bar">
      <div class="filter-group">
        <label>Search:</label>
        <input
          type="text"
          class="search-input"
          placeholder="Filter by name or code..."
          [ngModel]="searchQuery()"
          (ngModelChange)="onSearchChange($event)"
        />
      </div>
      <div class="filter-group">
        <label>Type:</label>
        <select
          class="filter-select"
          [ngModel]="selectedType()"
          (ngModelChange)="onTypeChange($event)"
        >
          <option value="">All Types</option>
          <option value="MAIN">MAIN Central Hub</option>
          <option value="SUB">SUB Hub</option>
        </select>
      </div>
    </div>

    <!-- Loading state -->
    <div class="data-table-card" *ngIf="loading()">
      <div class="empty-state">Loading warehouses...</div>
    </div>

    <!-- Data Table -->
    <tohfa-table
      *ngIf="!loading()"
      [rows]="filteredWarehouses()"
      [colspan]="6"
      emptyMessage="No warehouses found matching criteria."
    >
      <ng-template #header>
        <th>Code</th>
        <th>Warehouse Name</th>
        <th>Type</th>
        <th>City / Location</th>
        <th>Capacity (kg)</th>
        <th>Status</th>
      </ng-template>

      <ng-template #row let-wh>
        <td><span class="wh-code">{{ wh.code }}</span></td>
        <td><strong>{{ wh.name }}</strong></td>
        <td>
          <span class="badge" [class.main]="wh.type === 'MAIN'" [class.sub]="wh.type === 'SUB'">
            {{ wh.type }}
          </span>
        </td>
        <td>{{ wh.city || 'The Nilgiris' }}</td>
        <td>{{ wh.capacityKg ? (wh.capacityKg | number) + ' kg' : '—' }}</td>
        <td>
          <span class="badge active">Active</span>
        </td>
      </ng-template>
    </tohfa-table>
  `,
})
export class WarehousesComponent implements OnInit {
  private readonly warehousesService = inject(WarehousesService);

  readonly warehouses = signal<WarehouseItem[]>([]);
  readonly loading = signal<boolean>(true);
  readonly searchQuery = signal<string>('');
  readonly selectedType = signal<string>('');

  ngOnInit(): void {
    this.loadWarehouses();
  }

  loadWarehouses(): void {
    this.loading.set(true);
    this.warehousesService.list().subscribe({
      next: (res) => {
        this.warehouses.set(res.items);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load warehouses:', err);
        this.loading.set(false);
      },
    });
  }

  countByType(type: 'MAIN' | 'SUB'): number {
    return this.warehouses().filter((w) => w.type === type).length;
  }

  totalCapacityKg(): number {
    return this.warehouses().reduce((sum, w) => sum + (w.capacityKg || 0), 0);
  }

  filteredWarehouses(): WarehouseItem[] {
    const q = this.searchQuery().toLowerCase().trim();
    const type = this.selectedType();

    return this.warehouses().filter((w) => {
      const matchQ = !q || w.name.toLowerCase().includes(q) || w.code.toLowerCase().includes(q);
      const matchType = !type || w.type === type;
      return matchQ && matchType;
    });
  }

  onSearchChange(val: string): void {
    this.searchQuery.set(val);
  }

  onTypeChange(val: string): void {
    this.selectedType.set(val);
  }
}