import { api } from './client';

export interface FarmerProfile {
  id: string;
  tohfaFarmerId: string;
  fullName: string;
  mobile: string;
  aadhaarLast4: string | null;
  dob?: string | null;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | null;
  farmingExperienceYears?: number | null;
  address?: string | null;
  zoneId?: string | null;
  kycStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  overallRating?: number | null;
  ratingTier?: 'POOR' | 'MODERATE' | 'GOOD' | 'EXCELLENT' | null;
  subscriptionTier: 'FREE' | 'PAID';
  subscriptionValidTo?: string | null;
  isMarketBlocked: boolean;
  marketBlockReason?: string | null;
  preferredLocale?: 'ta' | 'en';
}

export interface FarmerProfileUpdate {
  fullName?: string | undefined;
  dob?: string | undefined;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | undefined;
  farmingExperienceYears?: number | undefined;
  address?: string | undefined;
  preferredLocale?: 'ta' | 'en' | undefined;
}


export interface Certification {
  id: string;
  certType: 'PGS' | 'NPOP' | 'OTHER';
  certNumber: string;
  issuingBody: string;
  issuedOn: string;
  expiresOn: string;
  documentUrl?: string | null;
  verificationStatus: 'UNVERIFIED' | 'VERIFIED' | 'REJECTED';
  verifiedAt?: string | null;
  verifiedBy?: string | null;
  daysToExpiry: number;
  blocksListings: boolean;
}

export interface CertificationCreate {
  certType: 'PGS' | 'NPOP' | 'OTHER';
  certNumber: string;
  issuingBody: string;
  issuedOn: string;
  expiresOn: string;
  documentUrl?: string | undefined;
}


export interface SystemConfig {
  certExpiryWarningDays: number;
}

export type FarmRatingCategoryCode =
  | 'CERTIFICATION'
  | 'SOIL_LAND'
  | 'FARMING_PRACTICES'
  | 'ENVIRONMENTAL'
  | 'PRODUCE_QUALITY'
  | 'TRACEABILITY'
  | 'SOCIAL_LABOR'
  | 'FINANCIAL'
  | 'MARKET_RELATIONS'
  | 'INNOVATION';

export type FarmRatingTier = 'POOR' | 'MODERATE' | 'GOOD' | 'EXCELLENT';

export interface FarmRatingModule {
  categoryCode: FarmRatingCategoryCode;
  score: number | null;
  maxScore: number;
}

export interface FarmRating {
  farmerId: string;
  periodLabel: string;
  status: 'DRAFT' | 'COMPLETE';
  modules: FarmRatingModule[];
  overallRating: number | null;
  ratingTier: FarmRatingTier | null;
  ratedAt: string | null;
}

/**
 * BR-06: the 10 farm-rating categories, in the fixed order the server always
 * returns them in (also the display order). `nameKey` is a farmer i18n key
 * but deliberately typed `string`, not `TranslationKey` -- this module has no
 * dependency on `i18n/farmer`, the same reason `evalMarketBlock`'s
 * `messageKey` above is untyped. Callers do `t(nameKey as TranslationKey)`.
 */
export const FARM_RATING_CATEGORIES: ReadonlyArray<{
  code: FarmRatingCategoryCode;
  nameKey: string;
}> = [
  { code: 'CERTIFICATION', nameKey: 'farmer.profile.rating.cat.certification' },
  { code: 'SOIL_LAND', nameKey: 'farmer.profile.rating.cat.soil' },
  { code: 'FARMING_PRACTICES', nameKey: 'farmer.profile.rating.cat.practices' },
  { code: 'ENVIRONMENTAL', nameKey: 'farmer.profile.rating.cat.environment' },
  { code: 'PRODUCE_QUALITY', nameKey: 'farmer.profile.rating.cat.yield' },
  { code: 'TRACEABILITY', nameKey: 'farmer.profile.rating.cat.traceability' },
  { code: 'SOCIAL_LABOR', nameKey: 'farmer.profile.rating.cat.social' },
  { code: 'FINANCIAL', nameKey: 'farmer.profile.rating.cat.financial' },
  { code: 'MARKET_RELATIONS', nameKey: 'farmer.profile.rating.cat.market' },
  { code: 'INNOVATION', nameKey: 'farmer.profile.rating.cat.innovation' },
];

/**
 * BR-06 tier bands (POOR &lt;50, MODERATE 50-69, GOOD 70-84, EXCELLENT 85+) are
 * computed server-side against `overallRating` -- this only maps the tier
 * code the server already returns to a label key, it does not re-derive it.
 */
export const FARM_RATING_TIER_LABEL_KEY: Record<FarmRatingTier, string> = {
  POOR: 'farmer.profile.rating.tier.poor',
  MODERATE: 'farmer.profile.rating.tier.moderate',
  GOOD: 'farmer.profile.rating.tier.good',
  EXCELLENT: 'farmer.profile.rating.tier.excellent',
};

export interface FarmRatingModuleView {
  categoryCode: FarmRatingCategoryCode;
  nameKey: string;
  score: number | null;
  maxScore: number;
  isRated: boolean;
}

export interface FarmRatingView {
  /** False when the farmer has never been rated (overallRating is null). A DRAFT
   * rating with some modules scored and others not is still `isRated: true` here --
   * each module's own `isRated` flag is what drives that row's empty state. */
  isRated: boolean;
  overallRating: number | null;
  ratingTier: FarmRatingTier | null;
  tierLabelKey: string | null;
  ratedAt: string | null;
  /** Always exactly the 10 canonical categories, in order, even if the server
   * response omitted one -- a missing module is treated the same as a null score. */
  modules: FarmRatingModuleView[];
}

/**
 * Pure mapping from the wire shape to what the three farmer-facing surfaces
 * (Profile summary card, Dashboard mini-card, FarmRatingsScreen detail) need
 * to render, including the "never rated" and "partially scored" empty states.
 * Kept here (not in a screen) so it has one, independently-testable
 * implementation instead of three copies.
 */
export function deriveFarmRatingView(rating: FarmRating | null | undefined): FarmRatingView {
  const modules: FarmRatingModuleView[] = FARM_RATING_CATEGORIES.map(({ code, nameKey }) => {
    const found = rating?.modules.find((m) => m.categoryCode === code);
    const score = found?.score ?? null;
    return {
      categoryCode: code,
      nameKey,
      score,
      maxScore: found?.maxScore ?? 10,
      isRated: score !== null,
    };
  });

  const ratingTier = rating?.ratingTier ?? null;
  return {
    isRated: (rating?.overallRating ?? null) !== null,
    overallRating: rating?.overallRating ?? null,
    ratingTier,
    tierLabelKey: ratingTier ? FARM_RATING_TIER_LABEL_KEY[ratingTier] : null,
    ratedAt: rating?.ratedAt ?? null,
    modules,
  };
}

/**
 * BR-33: Masks Aadhaar number to display only the last 4 digits.
 */
export function maskAadhaar(last4: string | null | undefined): string {
  if (!last4) return '—';
  return `•••• •••• ${last4}`;
}

/**
 * BR-33: Masks Mobile number to hide all but country code and last 3 digits.
 */
export function maskMobile(mobile: string | null | undefined): string {
  if (!mobile) return '—';
  if (mobile.length <= 5) return mobile;
  const prefix = mobile.slice(0, 3);
  const suffix = mobile.slice(-3);
  return `${prefix} ••••• ••${suffix}`;
}

/**
 * Evaluates certificate warning based on server-provided daysToExpiry and threshold.
 * Threshold is derived from system config or API, never hardcoded in the component (CLAUDE.md §2.7).
 */
export function evalCertificateWarning(
  daysToExpiry: number,
  thresholdDays: number = 30,
): { isWarning: boolean; isExpired: boolean; daysRemaining: number } {
  const isExpired = daysToExpiry < 0;
  const isWarning = isExpired || daysToExpiry <= thresholdDays;
  return {
    isWarning,
    isExpired,
    daysRemaining: daysToExpiry,
  };
}

/**
 * BR-01 & BR-02: Determines market block state.
 * Market is blocked if profile is marked blocked, or any certificate blocks listings (expired or unverified).
 */
export function evalMarketBlock(
  profile: Partial<FarmerProfile>,
  certs?: Certification[],
): { isBlocked: boolean; reason: string | null; messageKey: string | null } {
  // Check explicit certificate flags
  if (certs && certs.length > 0) {
    const expiredCert = certs.find((c) => c.blocksListings && c.daysToExpiry < 0);
    if (expiredCert) {
      return {
        isBlocked: true,
        reason: 'CERT_EXPIRED',
        messageKey: 'farmer.dashboard.banner.certExpired',
      };
    }

    const unverifiedCert = certs.find(
      (c) => c.blocksListings && c.verificationStatus === 'UNVERIFIED',
    );
    if (unverifiedCert) {
      return {
        isBlocked: true,
        reason: 'CERT_UNVERIFIED',
        messageKey: 'farmer.dashboard.banner.certUnverified',
      };
    }
  }

  // Check profile level market block
  if (profile.isMarketBlocked) {
    if (profile.marketBlockReason === 'CERT_EXPIRED') {
      return {
        isBlocked: true,
        reason: 'CERT_EXPIRED',
        messageKey: 'farmer.dashboard.banner.certExpired',
      };
    }
    if (profile.marketBlockReason === 'CERT_UNVERIFIED') {
      return {
        isBlocked: true,
        reason: 'CERT_UNVERIFIED',
        messageKey: 'farmer.dashboard.banner.certUnverified',
      };
    }
    return {
      isBlocked: true,
      reason: profile.marketBlockReason ?? 'BLOCKED',
      messageKey: 'farmer.dashboard.banner.marketBlocked',
    };
  }

  return { isBlocked: false, reason: null, messageKey: null };
}

/**
 * Fetch own farmer profile.
 * x-permission: farmer.profile.view_own (BR-36)
 */
export async function getMyFarmerProfile(): Promise<FarmerProfile> {
  return api.get<FarmerProfile>('/farmers/me');
}

/**
 * Update own profile.
 * Aadhaar and mobile are never included in the payload (BR-33).
 */
export async function updateMyFarmerProfile(data: FarmerProfileUpdate): Promise<FarmerProfile> {
  return api.patch<FarmerProfile>('/farmers/me', data);
}

/**
 * List own PGS/NPOP certifications.
 * x-permission: certification.manage_own (BR-36)
 */
export async function getMyCertifications(
  cursor?: string,
  limit: number = 20,
): Promise<{ items: Certification[]; page: { nextCursor: string | null; hasMore: boolean } }> {
  let url = `/farmers/me/certifications?limit=${limit}`;
  if (cursor) url += `&cursor=${encodeURIComponent(cursor)}`;
  return api.get<{ items: Certification[]; page: { nextCursor: string | null; hasMore: boolean } }>(
    url,
  );
}

/**
 * Create a new certification starting UNVERIFIED (BR-02).
 */
export async function createCertification(data: CertificationCreate): Promise<Certification> {
  return api.post<Certification>('/farmers/me/certifications', data);
}

/**
 * Reads system config (defaulting gracefully to 30 if endpoint not available).
 */
export async function getSystemConfig(): Promise<SystemConfig> {
  try {
    return await api.get<SystemConfig>('/config/farmer');
  } catch {
    // Specification gap: server has no public /config/farmer endpoint, fallback to business standard 30
    return { certExpiryWarningDays: 30 };
  }
}

/**
 * Fetch the current farmer's 10-category farm rating (BR-06).
 * x-permission: farmer.rating.view_own
 */
export async function getMyFarmRating(): Promise<FarmRating> {
  return api.get<FarmRating>('/farmers/me/rating');
}
