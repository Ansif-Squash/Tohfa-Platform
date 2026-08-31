/**
 * API client for the S-28 warehouse screens.
 *
 * Endpoints come from docs/openapi.yaml: GET /admin/batches, GET /admin/batches/{id},
 * GET /admin/stock-ledger, GET /admin/allocations and GET /warehouses.
 *
 * All list endpoints page with the spec's cursor parameters — the client never
 * fetches a whole collection and filters in the browser (10k+ ledger rows would
 * both freeze the UI and put other warehouses' rows on the wire).
 */
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';

export type ProduceGrade = 'GRADE_1' | 'GRADE_2' | 'GRADE_3' | 'REJECT';
export type BatchStatus = 'ACTIVE' | 'DEPLETED' | 'EXPIRED' | 'WRITTEN_OFF';
export type StockMovementType =
  | 'RECEIPT'
  | 'SALE'
  | 'TRANSFER_OUT'
  | 'TRANSFER_IN'
  | 'ADJUSTMENT'
  | 'WASTAGE'
  | 'RETURN_IN'
  | 'RESERVATION'
  | 'RELEASE';
export type AllocationChannel = 'ONLINE' | 'LIVE_MARKET' | 'RESERVE' | 'BUFFER';

export interface BatchView {
  /** Rows render through the shared DataTable, whose Row is Record<string, unknown>. */
  [key: string]: unknown;
  id: string;
  batchCode: string;
  warehouseId: string;
  cropId: string;
  cropName?: string;
  grade: ProduceGrade;
  goodsReceiptId: string | null;
  sourceFarmerId: string | null;
  qtyReceivedKg: string;
  qtyAvailableKg: string;
  costPerKg?: string | null;
  storageLocation: string | null;
  receivedOn: string;
  expiryOn: string | null;
  status: BatchStatus;
}

export interface StockLedgerEntry {
  /** Rows render through the shared DataTable, whose Row is Record<string, unknown>. */
  [key: string]: unknown;
  id: string;
  batchId: string;
  warehouseId: string;
  txnType: StockMovementType;
  qtyDeltaKg: string;
  balanceAfterKg: string;
  refType: string | null;
  refId: string | null;
  performedBy: string | null;
  performedAt: string;
  remarks: string | null;
}

/** Shape returned by the API (docs/openapi.yaml `Allocation`). */
export interface AllocationView {
  /** Rows render through the shared DataTable, whose Row is Record<string, unknown>. */
  [key: string]: unknown;
  id: string;
  warehouseId: string;
  cropId: string;
  cropName?: string;
  grade?: string;
  allocationDate: string;
  channel: AllocationChannel;
  allocatedQtyKg: string;
  consumedQtyKg: string;
  reservedQtyKg?: string;
  availableQtyKg?: string;
  computedBy: 'AUTO' | 'MANUAL';
  overriddenBy?: string | null;
}

export interface WarehouseView {
  id: string;
  name: string;
  code?: string;
  type?: string;
}

export interface PageMeta {
  nextCursor: string | null;
  hasMore: boolean;
}

export interface PagedResponse<T> {
  items: T[];
  page: PageMeta;
}

export interface ListBatchesParams {
  warehouseId?: string;
  cropId?: string;
  grade?: ProduceGrade;
  status?: BatchStatus;
  cursor?: string;
  limit?: number;
}

export interface ListStockLedgerParams {
  batchId?: string;
  warehouseId?: string;
  txnType?: StockMovementType;
  from?: string;
  to?: string;
  cursor?: string;
  limit?: number;
}

export interface ListAllocationsParams {
  warehouseId?: string;
  allocationDate?: string;
  channel?: AllocationChannel;
  cursor?: string;
  limit?: number;
}

const LEDGER_PAGE_LIMIT = 100;

/** Sums Quantity strings exactly in integer milli-units (no float drift). */
export function sumQuantities(values: Array<string | undefined | null>): string {
  let milli = 0;
  for (const value of values) {
    if (value === undefined || value === null || value === '') continue;
    milli += Math.round(parseFloat(value) * 1000);
  }
  const sign = milli < 0 ? '-' : '';
  const abs = Math.abs(milli);
  const whole = Math.floor(abs / 1000);
  const rest = (abs % 1000).toString().padStart(3, '0');
  return `${sign}${whole}.${rest}`;
}

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private readonly http = inject(HttpClient);

  // ── Warehouses (selector options) ──────────────────────────────────────────

  listWarehouses(): Observable<{ items: WarehouseView[]; total: number }> {
    return this.http.get<{ items: WarehouseView[]; total: number }>('/v1/warehouses', {
      params: { pageSize: '100' },
    });
  }

  // ── Batches ────────────────────────────────────────────────────────────────

  listBatches(params: ListBatchesParams = {}): Observable<PagedResponse<BatchView>> {
    return this.http.get<PagedResponse<BatchView>>('/v1/admin/batches', {
      params: this.toParams(params),
    });
  }

  getBatch(id: string): Observable<BatchView> {
    return this.http.get<BatchView>(`/v1/admin/batches/${id}`);
  }

  // ── Stock ledger (append-only, cursor paged) ───────────────────────────────

  listStockLedger(
    params: ListStockLedgerParams = {},
  ): Observable<PagedResponse<StockLedgerEntry>> {
    return this.http.get<PagedResponse<StockLedgerEntry>>('/v1/admin/stock-ledger', {
      params: this.toParams({ limit: LEDGER_PAGE_LIMIT, ...params }),
    });
  }

  // ── Allocations ────────────────────────────────────────────────────────────

  listAllocations(params: ListAllocationsParams = {}): Observable<PagedResponse<AllocationView>> {
    return this.http.get<PagedResponse<AllocationView>>('/v1/admin/allocations', {
      params: this.toParams(params),
    });
  }

  /**
   * Sums Quantity strings (kg, 3 decimals) exactly: parses into integer
   * milli-units so floating-point drift cannot appear in bucket totals.
   */
  sumQty(values: Array<string | undefined | null>): string {
    return sumQuantities(values);
  }

  private toParams(params: object): Record<string, string> {
    const out: Record<string, string> = {};
    for (const [key, value] of Object.entries(params)) {
      if ((typeof value === 'string' || typeof value === 'number') && `${value}`.length > 0) {
        out[key] = `${value}`;
      }
    }
    return out;
  }
}
