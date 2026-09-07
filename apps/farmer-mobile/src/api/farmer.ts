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
        messageKey: 'dashboard.banner.certExpired',
      };
    }

    const unverifiedCert = certs.find(
      (c) => c.blocksListings && c.verificationStatus === 'UNVERIFIED',
    );
    if (unverifiedCert) {
      return {
        isBlocked: true,
        reason: 'CERT_UNVERIFIED',
        messageKey: 'dashboard.banner.certUnverified',
      };
    }
  }

  // Check profile level market block
  if (profile.isMarketBlocked) {
    if (profile.marketBlockReason === 'CERT_EXPIRED') {
      return {
        isBlocked: true,
        reason: 'CERT_EXPIRED',
        messageKey: 'dashboard.banner.certExpired',
      };
    }
    if (profile.marketBlockReason === 'CERT_UNVERIFIED') {
      return {
        isBlocked: true,
        reason: 'CERT_UNVERIFIED',
        messageKey: 'dashboard.banner.certUnverified',
      };
    }
    return {
      isBlocked: true,
      reason: profile.marketBlockReason ?? 'BLOCKED',
      messageKey: 'dashboard.banner.marketBlocked',
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
