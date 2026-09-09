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
      /* =========================================================
         TOHFA DESIGN SYSTEM TOKENS (v1.0 · September 2026)
         ========================================================= */
      :host {
        display: block;
        padding: 48px;
        font-family: 'Manrope', -apple-system, BlinkMacSystemFont, sans-serif;

        /* --- Brand palette --- */
        --tohfa-primary: #2f7d32;
        --tohfa-primary-dark: #1b5e20;
        --tohfa-primary-light: #e8f5e9;
        --tohfa-primary-pale: #f4fbf4;

        /* --- Semantic colors --- */
        --tohfa-success: #16a34a;
        --tohfa-success-light: #f0fdf4;
        --tohfa-warning: #d97706;
        --tohfa-warning-light: #fffbeb;
        --tohfa-error: #dc2626;
        --tohfa-error-light: #fef2f2;
        --tohfa-info: #2563eb;
        --tohfa-info-light: #eff6ff;
        --tohfa-purple: #7c3aed;
        --tohfa-purple-light: #f5f3ff;

        /* --- Neutral scale --- */
        --tohfa-neutral-950: #111827;
        --tohfa-neutral-900: #1f2937;
        --tohfa-neutral-800: #374151;
        --tohfa-neutral-700: #4b5563;
        --tohfa-neutral-600: #6b7280;
        --tohfa-neutral-500: #9ca3af;
        --tohfa-neutral-400: #d1d5db;
        --tohfa-neutral-300: #e5e7eb;
        --tohfa-neutral-100: #f3f4f6;
        --tohfa-neutral-50: #f9fafb;
        --tohfa-white: #ffffff;

        /* --- Type scale (size / weight / line-height) --- */
        --tohfa-display: 700 36px/44px 'Manrope';
        --tohfa-h1: 700 30px/38px 'Manrope';
        --tohfa-h2: 700 24px/32px 'Manrope';
        --tohfa-h3: 600 20px/28px 'Manrope';
        --tohfa-h4: 600 18px/26px 'Manrope';
        --tohfa-body-lg: 400 16px/24px 'Manrope';
        --tohfa-body: 400 14px/20px 'Manrope';
        --tohfa-body-md: 500 14px/20px 'Manrope';
        --tohfa-small: 400 13px/18px 'Manrope';
        --tohfa-caption: 400 12px/16px 'Manrope';
        --tohfa-button-text: 600 14px/20px 'Manrope';
        --tohfa-table-header: 600 13px/18px 'Manrope';

        /* --- Spacing (8px grid) --- */
        --tohfa-space-xs: 4px;
        --tohfa-space-sm: 8px;
        --tohfa-space-compact: 12px;
        --tohfa-space-md: 16px;
        --tohfa-space-input: 20px;
        --tohfa-space-card: 24px;
        --tohfa-space-section: 32px;
        --tohfa-space-lg: 40px;
        --tohfa-space-page: 48px;

        /* --- Radius --- */
        --tohfa-radius-xs: 4px;
        --tohfa-radius-sm: 6px;
        --tohfa-radius-md: 8px;
        --tohfa-radius-lg: 12px;
        --tohfa-radius-xl: 16px;
        --tohfa-radius-full: 999px;

        /* --- Shadows --- */
        --tohfa-shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.07), 0 1px 2px rgba(0, 0, 0, 0.04);
        --tohfa-shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04);
        --tohfa-shadow-lg: 0 16px 40px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.06);

        color: var(--tohfa-neutral-900);
        background: var(--tohfa-primary-pale);

        /* Map onto tohfa-table's expected variable names so the shared
           table inherits this exact palette. */
        --tohfa-neutral-100: var(--tohfa-neutral-100);
        --tohfa-neutral-300: var(--tohfa-neutral-300);
        --tohfa-neutral-400: var(--tohfa-neutral-400);
        --tohfa-neutral-600: var(--tohfa-neutral-600);
        --tohfa-neutral-700: var(--tohfa-neutral-700);
        --tohfa-on-surface: var(--tohfa-neutral-900);
        --tohfa-surface-variant: var(--tohfa-neutral-50);
        --tohfa-font-size-small: 12px;
        --tohfa-font-size-body: 14px;
        --tohfa-font-weight-semibold: 600;
      }

      /* =========================================================
         PAGE HEADER
         ========================================================= */
      .page-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: var(--tohfa-space-md);
        margin-bottom: var(--tohfa-space-section);
      }
      .page-header .heading-block {
        display: flex;
        align-items: center;
        gap: var(--tohfa-space-md);
      }
      .page-header .badge-icon {
        width: 48px;
        height: 48px;
        border-radius: var(--tohfa-radius-lg);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 22px;
        
        box-shadow: var(--tohfa-shadow-md);
      }
      .page-header h1 {
        margin: 0;
        font: var(--tohfa-h1);
        letter-spacing: -0.01em;
        color: var(--tohfa-neutral-950);
      }
      .page-header p {
        margin: 2px 0 0 0;
        font: var(--tohfa-body);
        color: var(--tohfa-neutral-600);
      }
      .page-header .header-chip {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 14px;
        border-radius: var(--tohfa-radius-full);
        background: var(--tohfa-primary-light);
        color: var(--tohfa-primary-dark);
        font: var(--tohfa-body-md);
        white-space: nowrap;
      }

      /* =========================================================
         KPI CARDS
         ========================================================= */
      .kpi-cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: var(--tohfa-space-md);
        margin-bottom: var(--tohfa-space-section);
      }
      .kpi-card {
        position: relative;
        overflow: hidden;
        background: var(--tohfa-white);
        border: 1px solid var(--tohfa-neutral-300);
        border-radius: var(--tohfa-radius-lg);
        padding: var(--tohfa-space-card);
        box-shadow: var(--tohfa-shadow-sm);
        transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
      }
      .kpi-card::before {
        content: '';
        position: absolute;
        inset: 0 0 auto 0;
        height: 4px;
        background: green;
      }
      .kpi-card:hover {
        transform: translateY(-2px);
        box-shadow: var(--tohfa-shadow-md);
        border-color: var(--tohfa-neutral-400);
      }
      .kpi-card.accent-primary { --accent: linear-gradient(90deg, var(--tohfa-primary), var(--tohfa-primary-dark)); }
      .kpi-card.accent-info { --accent: var(--tohfa-info); }
      .kpi-card.accent-purple { --accent: var(--tohfa-purple); }
      .kpi-card.accent-success { --accent: var(--tohfa-success); }

      .kpi-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: var(--tohfa-space-sm);
      }
      .kpi-label {
        font: var(--tohfa-caption);
        color: var(--tohfa-neutral-600);
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }
      .kpi-icon {
        width: 32px;
        height: 32px;
        border-radius: var(--tohfa-radius-md);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 15px;
      }
      .kpi-card.accent-primary .kpi-icon { background: var(--tohfa-primary-light); color: var(--tohfa-primary-dark); }
      .kpi-card.accent-info .kpi-icon { background: var(--tohfa-info-light); color: var(--tohfa-info); }
      .kpi-card.accent-purple .kpi-icon { background: var(--tohfa-purple-light); color: var(--tohfa-purple); }
      .kpi-card.accent-success .kpi-icon { background: var(--tohfa-success-light); color: var(--tohfa-success); }

      .kpi-value {
        font: var(--tohfa-display);
        font-size: 30px;
        line-height: 1.15;
        color: var(--tohfa-neutral-950);
      }
      .kpi-sub {
        margin-top: 4px;
        font: var(--tohfa-small);
        color: var(--tohfa-neutral-500);
      }

      /* =========================================================
         FILTER BAR
         ========================================================= */
      .filter-bar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--tohfa-space-compact);
        margin-bottom: var(--tohfa-space-md);
        background: var(--tohfa-white);
        border: 1px solid var(--tohfa-neutral-300);
        padding: var(--tohfa-space-compact) var(--tohfa-space-md);
        border-radius: var(--tohfa-radius-md);
        box-shadow: var(--tohfa-shadow-sm);
      }
      .filter-group {
        display: flex;
        align-items: center;
        gap: var(--tohfa-space-sm);
      }
      .filter-group label {
        font: var(--tohfa-body-md);
        color: var(--tohfa-neutral-700);
      }
      .filter-select,
      .search-input {
        padding: 9px var(--tohfa-space-md, 12px);
        border: 1.5px solid var(--tohfa-neutral-300, #e5e7eb);
        border-radius: var(--tohfa-radius-sm, 6px);
        font: var(--tohfa-font-size-body, 14px)/20px 'Manrope', sans-serif;
        color: var(--tohfa-neutral-900, #1f2937);
        background: var(--tohfa-white, #ffffff);
        outline: none;
        transition: border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
      }
      .filter-select:hover,
      .search-input:hover {
        border-color: var(--tohfa-neutral-500);
      }
      .filter-select:focus,
      .search-input:focus {
        border-color: var(--tohfa-primary);
        box-shadow: 0 0 0 3px rgba(47, 125, 50, 0.14);
      }
      .search-input {
        width: 260px;
      }
      .filter-bar .result-count {
        margin-left: auto;
        font: var(--tohfa-small);
        color: var(--tohfa-neutral-600);
      }

      /* =========================================================
         DATA TABLE CARD / LOADING
         ========================================================= */
      .data-table-card {
        background: var(--tohfa-white);
        border: 1px solid var(--tohfa-neutral-300);
        border-radius: var(--tohfa-radius-lg);
        overflow: hidden;
        box-shadow: var(--tohfa-shadow-sm);
      }
      .empty-state {
        text-align: center;
        padding: var(--tohfa-space-lg);
        color: var(--tohfa-neutral-600);
        font: var(--tohfa-body);
      }
      .empty-state .spinner {
        width: 20px;
        height: 20px;
        margin: 0 auto var(--tohfa-space-sm);
        border: 3px solid var(--tohfa-primary-light);
        border-top-color: var(--tohfa-primary);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      /* =========================================================
         TABLE CELL CONTENT
         ========================================================= */
      .wh-code {
        font-family: 'SFMono-Regular', Menlo, monospace;
        font: var(--tohfa-small);
        font-weight: 600;
        color: var(--tohfa-primary-dark);
        background: var(--tohfa-primary-light);
        padding: 3px 8px;
        border-radius: var(--tohfa-radius-sm);
        letter-spacing: 0.02em;
      }
      .wh-name {
        font: var(--tohfa-body-md);
        color: var(--tohfa-neutral-950);
      }
      .wh-city {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font: var(--tohfa-body);
        color: var(--tohfa-neutral-700);
      }
      .wh-capacity {
        font: var(--tohfa-body-md);
        color: var(--tohfa-neutral-900);
      }
      .wh-capacity .unit {
        color: var(--tohfa-neutral-500);
        font-weight: 400;
      }
        .text-left {
  text-align: left;
  vertical-align: middle;
  font-size:16px;
}

      .badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 12px;
        border-radius: var(--tohfa-radius-full);
        font: var(--tohfa-caption);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        line-height: 1;
      }
      .badge::before {
        content: '';
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: currentColor;
      }
      .badge.main {
        background: var(--tohfa-info-light);
        color: var(--tohfa-info);
      }
      .badge.sub {
        background: var(--tohfa-purple-light);
        color: var(--tohfa-purple);
      }
      .badge.active {
        background: var(--tohfa-success-light);
        color: var(--tohfa-success);
      }
    `,
  ],
  template: `
    <!-- Header -->
    <div class="page-header">
      <div class="heading-block">
        <div class="badge-icon">🏬</div>
        <div>
          <h1>Warehouse Hubs</h1>
          <p>Fixed collection and regional distribution network across The Nilgiris.</p>
        </div>
      </div>
    </div>

    <!-- KPIs -->
    <div class="kpi-cards">
      <div class="kpi-card accent-primary">
        <div class="kpi-top">
          <span class="kpi-label">Total Warehouses</span>
          <span class="kpi-icon">📦</span>
        </div>
        <div class="kpi-value">{{ warehouses().length }}</div>
        <div class="kpi-sub">Across all hub types</div>
      </div>

      <div class="kpi-card accent-info">
        <div class="kpi-top">
          <span class="kpi-label">Main Central Hubs</span>
          <span class="kpi-icon">🏢</span>
        </div>
        <div class="kpi-value">{{ countByType('MAIN') }}</div>
        <div class="kpi-sub">Primary distribution points</div>
      </div>

      <div class="kpi-card accent-purple">
        <div class="kpi-top">
          <span class="kpi-label">Sub Warehouse Hubs</span>
          <span class="kpi-icon">🏗️</span>
        </div>
        <div class="kpi-value">{{ countByType('SUB') }}</div>
        <div class="kpi-sub">Regional collection points</div>
      </div>

      <div class="kpi-card accent-success">
        <div class="kpi-top">
          <span class="kpi-label">Total Capacity</span>
          <span class="kpi-icon">⚖️</span>
        </div>
        <div class="kpi-value">{{ totalCapacityKg() | number }}</div>
        <div class="kpi-sub">kilograms combined</div>
      </div>
    </div>

    <!-- Filters -->
    <div class="filter-bar">
      <div class="filter-group">
        <label>Search</label>
        <input
          type="text"
          class="search-input"
          placeholder="Filter by name or code..."
          [ngModel]="searchQuery()"
          (ngModelChange)="onSearchChange($event)"
        />
      </div>
      <div class="filter-group">
        <label>Type</label>
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
      <span class="result-count" *ngIf="!loading()">
        {{ filteredWarehouses().length }} of {{ warehouses().length }} shown
      </span>
    </div>

    <!-- Loading state -->
    <div class="data-table-card" *ngIf="loading()">
      <div class="empty-state">
        <div class="spinner"></div>
        Loading warehouses...
      </div>
    </div>

    <!-- Data Table -->
    <tohfa-table
      *ngIf="!loading()"
      [rows]="filteredWarehouses()"
      [colspan]="6"
      emptyMessage="No warehouses found matching criteria."
    >
      <ng-template #header>
  <th class="text-left">Code</th>
  <th class="text-left">Warehouse Name</th>
  <th class="text-left">Type</th>
  <th class="text-left">City / Location</th>
  <th class="text-left">Capacity (kg)</th>
  <th class="text-left">Status</th>
</ng-template>

      <ng-template #row let-wh>
        <td><span class="wh-code">{{ wh.code }}</span></td>
        <td><span class="wh-name">{{ wh.name }}</span></td>
        <td>
          <span class="badge" [class.main]="wh.type === 'MAIN'" [class.sub]="wh.type === 'SUB'">
            {{ wh.type }}
          </span>
        </td>
        <td><span class="wh-city">📍 {{ wh.city || 'The Nilgiris' }}</span></td>
        <td>
          <span class="wh-capacity">
            {{ wh.capacityKg ? (wh.capacityKg | number) : '—' }}
            <span class="unit" *ngIf="wh.capacityKg">kg</span>
          </span>
        </td>
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