import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';

/**
 * Mirrors docs/openapi.yaml `FarmRatingModule`. `categoryCode` is not a closed
 * enum on the wire — which modules are active is data (`rating_categories.is_active`),
 * so this client never hardcodes the 5 names; it always renders what the API returns.
 */
export interface FarmRatingModule {
  categoryCode: string;
  name: string;
  score: number | null;
  maxScore: number;
}

export type RatingTier = 'POOR' | 'MODERATE' | 'GOOD' | 'EXCELLENT';

/** Mirrors docs/openapi.yaml `FarmRating` — the response shape shared by all 3 endpoints. */
export interface FarmRating {
  farmerId: string;
  modules: FarmRatingModule[];
  overallRating: number | null;
  ratingTier: RatingTier | null;
  ratedBy: string | null;
  ratedAt: string | null;
  notes: string | null;
}

export interface FarmRatingModuleInput {
  categoryCode: string;
  score: number;
}

/** Mirrors docs/openapi.yaml `FarmRatingUpdateRequest`. */
export interface FarmRatingUpdateRequest {
  modules: FarmRatingModuleInput[];
  notes?: string | undefined;
}

@Injectable({ providedIn: 'root' })
export class FarmRatingService {
  private readonly http = inject(HttpClient);

  getFarmerRating(farmerId: string): Observable<FarmRating> {
    return this.http.get<FarmRating>(`/v1/admin/farmers/${farmerId}/rating`);
  }

  submitFarmerRating(farmerId: string, payload: FarmRatingUpdateRequest): Observable<FarmRating> {
    return this.http.put<FarmRating>(`/v1/admin/farmers/${farmerId}/rating`, payload);
  }
}
