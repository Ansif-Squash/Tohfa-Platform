import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';

export interface CashTopupRequest {
  amount: string;
  warehouseId: string;
  fiscalCashTag: string;
  remarks?: string | undefined;
}

export interface WalletTransactionResponse {
  id: string;
  walletId: string;
  txnType: string;
  amount: string;
  balanceAfter: string;
  refType: string | null;
  refId: string | null;
  fiscalCashTag: string | null;
  warehouseId: string | null;
  performedBy: string | null;
  performedAt: string;
  remarks: string | null;
}

@Injectable({ providedIn: 'root' })
export class CashTopupService {
  private readonly http = inject(HttpClient);

  processCashTopup(
    customerId: string,
    req: CashTopupRequest,
    idempotencyKey?: string,
  ): Observable<WalletTransactionResponse> {
    const headers: Record<string, string> = {};
    if (idempotencyKey) {
      headers['idempotency-key'] = idempotencyKey;
    }
    return this.http.post<WalletTransactionResponse>(
      `/v1/admin/wallets/${customerId}/cash-topup`,
      req,
      { headers },
    );
  }
}
