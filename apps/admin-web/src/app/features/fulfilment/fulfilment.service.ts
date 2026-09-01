import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { type Observable } from 'rxjs';

export interface AdminOrderSummary {
  id: string;
  orderNumber: string;
  status: string;
  channel: string;
  fulfillmentType: string;
  warehouseId: string;
  itemCount: number;
  totalAmount: string;
  paymentStatus: string;
  deliveryDate: string | null;
  placedAt: string;
}

export interface AdminOrderDetail extends AdminOrderSummary {
  subtotal: string;
  deliveryFee: string;
  discount: string;
  gstAmount: string;
  deliverySlot: string | null;
  deliveryAddressId: string | null;
  otpRequired: boolean;
  cancellationReason: string | null;
  deliveredAt: string | null;
  items: Array<{
    id: string;
    productId: string;
    name: string;
    grade: string;
    qtyKg: string;
    fulfilledQtyKg?: string;
    unitPrice: string;
    gstRate?: number;
    gstAmount?: string;
    lineTotal: string;
  }>;
}

@Injectable({
  providedIn: 'root',
})
export class FulfilmentService {
  private readonly http = inject(HttpClient);
  private readonly base = '/v1/admin/orders';

  listOrders(query: {
    status?: string;
    warehouseId?: string;
    limit?: number;
    cursor?: string;
  } = {}): Observable<{ items: AdminOrderSummary[]; page: { nextCursor: string | null; hasMore: boolean } }> {
    let params = new HttpParams();
    if (query.status && query.status !== 'ALL') params = params.set('status', query.status);
    if (query.warehouseId) params = params.set('warehouseId', query.warehouseId);
    if (query.limit) params = params.set('limit', String(query.limit));
    if (query.cursor) params = params.set('cursor', query.cursor);

    return this.http.get<{ items: AdminOrderSummary[]; page: { nextCursor: string | null; hasMore: boolean } }>(
      this.base,
      { params },
    );
  }

  assignWarehouse(orderId: string, warehouseId: string, reason?: string): Observable<AdminOrderDetail> {
    return this.http.post<AdminOrderDetail>(
      `${this.base}/${orderId}/assign-warehouse`,
      { warehouseId, reason },
    );
  }

  packOrder(orderId: string, packedLines?: Array<{ orderItemId: string; fulfilledQtyKg: string }>): Observable<AdminOrderDetail> {
    return this.http.post<AdminOrderDetail>(
      `${this.base}/${orderId}/pack`,
      { packedLines },
    );
  }

  dispatchOrder(orderId: string, details: { vehicleNumber?: string; deliveryPartnerId?: string; expectedArrival?: string } = {}): Observable<AdminOrderDetail> {
    return this.http.post<AdminOrderDetail>(
      `${this.base}/${orderId}/dispatch`,
      details,
    );
  }

  verifyOtp(orderId: string, otp: string, podPhotoUrl?: string): Observable<AdminOrderDetail> {
    return this.http.post<AdminOrderDetail>(
      `${this.base}/${orderId}/verify-otp`,
      { otp, podPhotoUrl },
    );
  }
}
