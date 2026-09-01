import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';

export interface WarehouseItem {
  id: string;
  code: string;
  name: string;
  type: 'MAIN' | 'SUB';
  city: string | null;
  capacityKg: number | null;
  isActive: boolean;
  createdAt: string;
}

export interface ListWarehousesResponse {
  items: WarehouseItem[];
  page: number;
  pageSize: number;
  total: number;
}

@Injectable({ providedIn: 'root' })
export class WarehousesService {
  private readonly http = inject(HttpClient);

  list(filters: { q?: string; type?: string } = {}): Observable<ListWarehousesResponse> {
    let params = new HttpParams();
    if (filters.q) params = params.set('q', filters.q);
    if (filters.type) params = params.set('type', filters.type);
    return this.http.get<ListWarehousesResponse>('/v1/warehouses', { params });
  }

  getById(id: string): Observable<WarehouseItem> {
    return this.http.get<WarehouseItem>(`/v1/warehouses/${id}`);
  }
}
