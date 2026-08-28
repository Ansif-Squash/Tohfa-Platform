import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';

export interface GoodsReceipt {
  id: string;
  grnNumber: string;
  purchaseOrderId: string;
  warehouseId: string;
  farmerId: string;
  grossQtyKg: string;
  acceptedQtyKg: string;
  rejectedQtyKg: string;
  rejectionReason: string | null;
  vehicleNumber: string | null;
  photos: string[];
  status: 'AWAITING_QC' | 'ACCEPTED' | 'PARTIALLY_ACCEPTED' | 'REJECTED' | 'COUNTER_OFFERED';
  receivedBy: string;
  receivedAt: string;
  poNumber?: string;
  cropName?: string;
  grade?: string;
}

export interface ListGoodsReceiptsResponse {
  items: GoodsReceipt[];
  page: {
    nextCursor: string | null;
    hasMore: boolean;
  };
}

export interface GoodsReceiptCreatePayload {
  purchaseOrderId: string;
  warehouseId: string;
  grossQtyKg: string;
  vehicleNumber?: string | undefined;
  photos?: string[] | undefined;
  remarks?: string | undefined;
}

export interface QualityCheckItemInput {
  parameter: 'APPEARANCE' | 'SIZE_UNIFORMITY' | 'MOISTURE' | 'DAMAGE_PEST' | 'FRESHNESS';
  score?: number | undefined;
  passed: boolean;
  measuredValue?: number | undefined;
  remarks?: string | undefined;
  photoKeys?: string[] | undefined;
}

export interface QualityCheckPayload {
  assignedGrade: 'GRADE_1' | 'GRADE_2' | 'GRADE_3' | 'REJECT';
  outcome: 'ACCEPTED' | 'PARTIALLY_ACCEPTED' | 'REJECTED';
  acceptedQtyKg: string;
  rejectedQtyKg?: string | undefined;
  rejectionReason?: string | undefined;
  items: QualityCheckItemInput[];
  priceAdjustment?: string | undefined;
  defectNotes?: string | undefined;
  photos?: string[] | undefined;
  storageLocation?: string | undefined;
}

export interface QualityCounterOfferPayload {
  pricePerKg: string;
  quantityKg: string;
  message?: string | undefined;
}

@Injectable({ providedIn: 'root' })
export class GoodsReceiptService {
  private readonly http = inject(HttpClient);

  list(params?: {
    warehouseId?: string;
    status?: string;
    purchaseOrderId?: string;
    cursor?: string;
    limit?: number;
  }): Observable<ListGoodsReceiptsResponse> {
    return this.http.get<ListGoodsReceiptsResponse>('/v1/admin/goods-receipts', {
      params: params as Record<string, string>,
    });
  }

  getById(id: string): Observable<GoodsReceipt> {
    return this.http.get<GoodsReceipt>(`/v1/admin/goods-receipts/${id}`);
  }

  createGoodsReceipt(payload: GoodsReceiptCreatePayload): Observable<GoodsReceipt> {
    return this.http.post<GoodsReceipt>('/v1/admin/goods-receipts', payload);
  }

  recordQualityCheck(id: string, payload: QualityCheckPayload): Observable<unknown> {
    return this.http.post(`/v1/admin/goods-receipts/${id}/quality-check`, payload);
  }

  sendCounterOffer(id: string, payload: QualityCounterOfferPayload): Observable<unknown> {
    return this.http.post(`/v1/admin/goods-receipts/${id}/counter-offer`, payload);
  }
}
