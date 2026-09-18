import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  deriveFarmRatingView,
  getMyFarmRating,
  FARM_RATING_CATEGORIES,
  FARM_RATING_TIER_LABEL_KEY,
  type FarmRating,
} from '../api/farmer';
import { setAccessToken } from '../api/client';

describe('BR-06: Farm Rating (10-category framework, farmer-facing surfaces)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setAccessToken(null);
  });

  describe('getMyFarmRating()', () => {
    it('requests GET /v1/farmers/me/rating and returns the response unchanged', async () => {
      const fixture: FarmRating = {
        farmerId: 'farmer-1',
        periodLabel: '2026-Q3',
        status: 'COMPLETE',
        modules: FARM_RATING_CATEGORIES.map(({ code }) => ({
          categoryCode: code,
          score: 7,
          maxScore: 10,
        })),
        overallRating: 70,
        ratingTier: 'GOOD',
        ratedAt: '2026-09-01T00:00:00.000Z',
      };

      let requestedUrl = '';
      let requestedMethod = '';
      global.fetch = vi.fn(async (url: RequestInfo | URL, options?: RequestInit) => {
        requestedUrl = String(url);
        requestedMethod = options?.method ?? 'GET';
        return new Response(JSON.stringify(fixture), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }) as typeof fetch;

      const result = await getMyFarmRating();

      expect(requestedUrl).toContain('/farmers/me/rating');
      expect(requestedMethod).toBe('GET');
      expect(result).toEqual(fixture);
    });
  });

  describe('deriveFarmRatingView()', () => {
    it('BR-06: a never-rated farmer (rating is null) shows "not yet rated" for the overall score and all 10 categories', () => {
      const view = deriveFarmRatingView(null);

      expect(view.isRated).toBe(false);
      expect(view.overallRating).toBeNull();
      expect(view.ratingTier).toBeNull();
      expect(view.tierLabelKey).toBeNull();
      expect(view.ratedAt).toBeNull();
      expect(view.modules).toHaveLength(10);
      view.modules.forEach((mod) => {
        expect(mod.isRated).toBe(false);
        expect(mod.score).toBeNull();
      });
    });

    it('BR-06: a DRAFT rating with some modules scored and others not renders each category\'s own state independently, without treating the partial data as an error', () => {
      const partial: FarmRating = {
        farmerId: 'farmer-1',
        periodLabel: '2026-Q3',
        status: 'DRAFT',
        modules: [
          { categoryCode: 'CERTIFICATION', score: 8, maxScore: 10 },
          { categoryCode: 'SOIL_LAND', score: 6, maxScore: 10 },
          // Every other category not yet scored by the admin.
          ...FARM_RATING_CATEGORIES.filter(
            (c) => c.code !== 'CERTIFICATION' && c.code !== 'SOIL_LAND',
          ).map(({ code }) => ({ categoryCode: code, score: null, maxScore: 10 })),
        ],
        overallRating: null,
        ratingTier: null,
        ratedAt: null,
      };

      const view = deriveFarmRatingView(partial);

      // Overall isn't rated yet even though two categories are scored.
      expect(view.isRated).toBe(false);
      expect(view.tierLabelKey).toBeNull();

      const cert = view.modules.find((m) => m.categoryCode === 'CERTIFICATION');
      const soil = view.modules.find((m) => m.categoryCode === 'SOIL_LAND');
      const financial = view.modules.find((m) => m.categoryCode === 'FINANCIAL');

      expect(cert?.isRated).toBe(true);
      expect(cert?.score).toBe(8);
      expect(soil?.isRated).toBe(true);
      expect(soil?.score).toBe(6);
      expect(financial?.isRated).toBe(false);
      expect(financial?.score).toBeNull();
    });

    it('BR-06: a COMPLETE rating maps the server tier code to the right label key and always returns categories in the fixed canonical order', () => {
      const shuffledInput: FarmRating = {
        farmerId: 'farmer-1',
        periodLabel: '2026-Q3',
        status: 'COMPLETE',
        // Deliberately out of canonical order, to prove the view re-orders
        // by category code rather than trusting server array order.
        modules: [
          { categoryCode: 'INNOVATION', score: 6, maxScore: 10 },
          { categoryCode: 'CERTIFICATION', score: 9, maxScore: 10 },
          { categoryCode: 'MARKET_RELATIONS', score: 7, maxScore: 10 },
          { categoryCode: 'FINANCIAL', score: 5, maxScore: 10 },
          { categoryCode: 'SOCIAL_LABOR', score: 8, maxScore: 10 },
          { categoryCode: 'TRACEABILITY', score: 6, maxScore: 10 },
          { categoryCode: 'PRODUCE_QUALITY', score: 7, maxScore: 10 },
          { categoryCode: 'ENVIRONMENTAL', score: 8, maxScore: 10 },
          { categoryCode: 'FARMING_PRACTICES', score: 9, maxScore: 10 },
          { categoryCode: 'SOIL_LAND', score: 8, maxScore: 10 },
        ],
        overallRating: 73,
        ratingTier: 'GOOD',
        ratedAt: '2026-09-01T00:00:00.000Z',
      };

      const view = deriveFarmRatingView(shuffledInput);

      expect(view.isRated).toBe(true);
      expect(view.overallRating).toBe(73);
      expect(view.tierLabelKey).toBe(FARM_RATING_TIER_LABEL_KEY.GOOD);
      expect(view.ratedAt).toBe('2026-09-01T00:00:00.000Z');
      expect(view.modules.map((m) => m.categoryCode)).toEqual(
        FARM_RATING_CATEGORIES.map((c) => c.code),
      );
      expect(view.modules.every((m) => m.isRated)).toBe(true);
    });

    it('BR-06: tier label keys cover all four bands (POOR/MODERATE/GOOD/EXCELLENT)', () => {
      expect(FARM_RATING_TIER_LABEL_KEY.POOR).toBe('farmer.profile.rating.tier.poor');
      expect(FARM_RATING_TIER_LABEL_KEY.MODERATE).toBe('farmer.profile.rating.tier.moderate');
      expect(FARM_RATING_TIER_LABEL_KEY.GOOD).toBe('farmer.profile.rating.tier.good');
      expect(FARM_RATING_TIER_LABEL_KEY.EXCELLENT).toBe('farmer.profile.rating.tier.excellent');
    });
  });
});
