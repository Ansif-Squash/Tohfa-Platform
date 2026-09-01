import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { type Observable } from 'rxjs';

export type AgeBucket = 'D0_7' | 'D8_15' | 'D16_30' | 'D30_PLUS';

export interface PayoutDue {
  id: string;
  farmerId: string;
  tohfaFarmerId: string | null;
  farmerName: string;
  purchaseOrderId: string;
  goodsReceiptId: string | null;
  amountDue: string;
  dueSince: string;
  ageDays: number;
  ageBucket: AgeBucket;
}

export interface PayoutDuesTotals {
  totalDue: string;
  farmerCount: number;
}

export interface PayoutResponse {
  id: string;
  payoutNumber: string;
  farmerId: string;
  farmerName: string;
  amount: string;
  mode: 'UPI' | 'IMPS' | 'NEFT';
  status: string;
  requiresDualApproval: boolean;
  initiatedBy: string;
  approvedBy: string[];
  approvedAt: string | null;
  gatewayPayoutId: string | null;
  failureReason: string | null;
  paidAt: string | null;
  remarks: string | null;
  createdAt: string;
  updatedAt: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class PayoutsService {
  private readonly http = inject(HttpClient);

  listPayoutDues(query: {
    farmerId?: string;
    ageBucket?: AgeBucket;
    limit?: number;
    cursor?: string;
  } = {}): Observable<{ items: PayoutDue[]; page: { nextCursor: string | null; hasMore: boolean }; totals: PayoutDuesTotals }> {
    let params = new HttpParams();
    if (query.farmerId) params = params.set('farmerId', query.farmerId);
    if (query.ageBucket) params = params.set('ageBucket', query.ageBucket);
    if (query.limit) params = params.set('limit', String(query.limit));
    if (query.cursor) params = params.set('cursor', query.cursor);

    return this.http.get<{ items: PayoutDue[]; page: { nextCursor: string | null; hasMore: boolean }; totals: PayoutDuesTotals }>(
      '/v1/admin/payout-dues',
      { params },
    );
  }

  createPayout(body: {
    farmerId: string;
    amount: string;
    mode: 'UPI' | 'IMPS' | 'NEFT';
    bankAccountId?: string;
    dueIds?: string[];
    remarks?: string;
  }, idempotencyKey?: string): Observable<PayoutResponse> {
    const headers: Record<string, string> = {};
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }
    return this.http.post<PayoutResponse>(
      '/v1/admin/payouts',
      body,
      { headers },
    );
  }

  approvePayout(payoutId: string, note?: string, idempotencyKey?: string): Observable<PayoutResponse> {
    const headers: Record<string, string> = {};
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }
    return this.http.post<PayoutResponse>(
      `/v1/admin/payouts/${payoutId}/approve`,
      { note },
      { headers },
    );
  }
}
