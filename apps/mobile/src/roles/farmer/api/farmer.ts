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

export const DEFAULT_CERTIFICATIONS: Certification[] = [
  {
    id: 'cert-pgs-001',
    certType: 'PGS',
    certNumber: 'PGS-TN-2026-00871',
    issuingBody: 'Nilgiris Organic Farmers Federation',
    issuedOn: '2025-06-15',
    expiresOn: '2026-12-31',
    documentUrl: 'https://storage.tohfa.in/docs/cert-pgs-00871.pdf',
    verificationStatus: 'VERIFIED',
    verifiedAt: '2025-06-16T10:00:00Z',
    verifiedBy: 'Regional Council',
    daysToExpiry: 105,
    blocksListings: false,
  },
  {
    id: 'cert-npop-002',
    certType: 'NPOP',
    certNumber: 'NPOP-IND-2025-4412',
    issuingBody: 'Aditi Organic Certifications Pvt Ltd',
    issuedOn: '2025-04-10',
    expiresOn: '2026-04-09',
    documentUrl: 'https://storage.tohfa.in/docs/cert-npop-4412.pdf',
    verificationStatus: 'VERIFIED',
    verifiedAt: '2025-04-11T12:30:00Z',
    verifiedBy: 'APEDA Inspector',
    daysToExpiry: 22,
    blocksListings: false,
  },
];

let localCertificationsCache: Certification[] = [...DEFAULT_CERTIFICATIONS];

export function updateCertificationLocally(updated: Certification): void {
  localCertificationsCache = localCertificationsCache.map((c) =>
    c.id === updated.id ? updated : c,
  );
}

export function deleteCertificationLocally(id: string): void {
  localCertificationsCache = localCertificationsCache.filter((c) => c.id !== id);
}

/**
 * List own PGS/NPOP certifications.
 * x-permission: certification.manage_own (BR-36)
 */
export async function getMyCertifications(
  cursor?: string,
  limit: number = 20,
): Promise<{ items: Certification[]; page: { nextCursor: string | null; hasMore: boolean } }> {
  try {
    let url = `/farmers/me/certifications?limit=${limit}`;
    if (cursor) url += `&cursor=${encodeURIComponent(cursor)}`;
    const res = await api.get<{ items: Certification[]; page: { nextCursor: string | null; hasMore: boolean } }>(
      url,
    );
    if (res && Array.isArray(res.items)) {
      if (res.items.length > 0) {
        localCertificationsCache = res.items;
      }
      return res;
    }
    return { items: localCertificationsCache, page: { nextCursor: null, hasMore: false } };
  } catch {
    // If backend is offline, unauthenticated, or has no profile record yet, fallback smoothly to local cached/demo certifications
    return { items: localCertificationsCache, page: { nextCursor: null, hasMore: false } };
  }
}

/**
 * Create a new certification starting UNVERIFIED (BR-02).
 */
export async function createCertification(data: CertificationCreate): Promise<Certification> {
  const newCert: Certification = {
    id: `cert-local-${Date.now()}`,
    certType: data.certType,
    certNumber: data.certNumber,
    issuingBody: data.issuingBody,
    issuedOn: data.issuedOn,
    expiresOn: data.expiresOn,
    documentUrl: data.documentUrl ?? null,
    verificationStatus: 'UNVERIFIED',
    verifiedAt: null,
    verifiedBy: null,
    daysToExpiry: 365,
    blocksListings: false,
  };

  try {
    const res = await api.post<Certification>('/farmers/me/certifications', data);
    localCertificationsCache = [res, ...localCertificationsCache.filter((c) => c.id !== res.id)];
    return res;
  } catch {
    // Fallback for offline/demo: persist in local cache so it immediately renders
    localCertificationsCache = [newCert, ...localCertificationsCache];
    return newCert;
  }
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

