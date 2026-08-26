import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import type { ApplicationStatus } from '@tohfa/shared-types';

export interface FarmerApplicationSummary {
  id: string;
  mobile: string;
  fullName: string;
  preferredLocale: 'en' | 'ta';
  status: ApplicationStatus;
  currentStep: number;
  completedSteps: number[];
  submittedAt: string | null;
  createdAt: string;
}

export interface FarmerApplicationDetail extends FarmerApplicationSummary {
  step1Personal: {
    fullName?: string;
    dob?: string;
    gender?: string;
    aadhaarLast4?: string;
    farmingExperienceYears?: number;
    addressLine1?: string;
    village?: string;
    taluk?: string;
    district?: string;
    pincode?: string;
  };
  step2FarmDetails: {
    farms?: Array<{
      name: string;
      totalAreaAcres: number;
      organicSince?: string;
      waterSource?: string;
      primaryCrops?: string[];
    }>;
  };
  step3Location: {
    gpsCaptured?: boolean;
    latitude?: number;
    longitude?: number;
    village?: string;
    taluk?: string;
    district?: string;
    fmbPolygon?: {
      type: 'Polygon';
      coordinates: number[][][];
    };
  };
  step4Documents: {
    documents?: Array<{
      docType: string;
      fileUrl: string;
      fileName?: string;
    }>;
  };
}

export interface ListApplicationsResponse {
  items: FarmerApplicationSummary[];
  page: {
    nextCursor: string | null;
    hasMore: boolean;
  };
}

export interface StatusTimeline {
  applicationId: string;
  status: string;
  submittedAt: string | null;
  expectedDecisionBy: string;
  steps: Array<{
    status: string;
    reachedAt: string;
    note?: string | null;
  }>;
}

@Injectable({ providedIn: 'root' })
export class AdminFarmerApplicationsService {
  private readonly http = inject(HttpClient);

  list(filters: {
    status?: string;
    zoneId?: string;
    submittedAfter?: string;
    cursor?: string;
    limit?: number;
  }): Observable<ListApplicationsResponse> {
    let params = new HttpParams();
    if (filters.status) params = params.set('status', filters.status);
    if (filters.zoneId) params = params.set('zoneId', filters.zoneId);
    if (filters.submittedAfter) params = params.set('submittedAfter', filters.submittedAfter);
    if (filters.cursor) params = params.set('cursor', filters.cursor);
    if (filters.limit) params = params.set('limit', filters.limit.toString());

    return this.http.get<ListApplicationsResponse>('/v1/admin/farmer-applications', { params });
  }

  getById(id: string): Observable<FarmerApplicationDetail> {
    return this.http.get<FarmerApplicationDetail>(`/v1/admin/farmer-applications/${id}`);
  }

  getStatusTimeline(id: string): Observable<StatusTimeline> {
    return this.http.get<StatusTimeline>(`/v1/farmers/applications/${id}/status`);
  }

  approve(
    id: string,
    body: { zoneId?: string; note?: string } = {},
  ): Observable<FarmerApplicationDetail> {
    return this.http.post<FarmerApplicationDetail>(
      `/v1/admin/farmer-applications/${id}/approve`,
      body,
      {
        headers: { 'Idempotency-Key': crypto.randomUUID() },
      },
    );
  }

  reject(
    id: string,
    body: { reasonCode: string; reason: string },
  ): Observable<FarmerApplicationDetail> {
    return this.http.post<FarmerApplicationDetail>(
      `/v1/admin/farmer-applications/${id}/reject`,
      body,
      {
        headers: { 'Idempotency-Key': crypto.randomUUID() },
      },
    );
  }

  requestInfo(
    id: string,
    body: { message: string; requiredSteps?: number[] },
  ): Observable<FarmerApplicationDetail> {
    return this.http.post<FarmerApplicationDetail>(
      `/v1/admin/farmer-applications/${id}/request-info`,
      body,
      {
        headers: { 'Idempotency-Key': crypto.randomUUID() },
      },
    );
  }
}
