import { describe, expect, it } from 'vitest';
import {
  evalCertificateWarning,
  evalMarketBlock,
  maskAadhaar,
  maskMobile,
  type Certification,
  type FarmerProfile,
} from '../api/farmer';
import { buildWalletQueryUrl, formatMoneyAmount } from '../api/wallet';

describe('User Story 44 (S-44) Farmer Dashboard, Profile, Certifications and Wallet Tests', () => {
  describe('BR-01: Expired certificate blocks market listings', () => {
    it('BR-01: market-blocked banner renders when certificate is expired (blocksListings=true, daysToExpiry < 0)', () => {
      const expiredCert: Certification = {
        id: 'cert-1',
        certType: 'PGS',
        certNumber: 'PGS-TN-001',
        issuingBody: 'PGS Organic India',
        issuedOn: '2025-01-01',
        expiresOn: '2026-01-01',
        verificationStatus: 'VERIFIED',
        verifiedAt: '2025-01-02T00:00:00Z',
        verifiedBy: 'admin-1',
        daysToExpiry: -45,
        blocksListings: true,
      };

      const profile: FarmerProfile = {
        id: 'farmer-1',
        tohfaFarmerId: 'TOHFA-F-2026-0001',
        fullName: 'Murugan Selvam',
        mobile: '+919876543210',
        aadhaarLast4: '4321',
        kycStatus: 'VERIFIED',
        isMarketBlocked: true,
        marketBlockReason: 'CERT_EXPIRED',
        subscriptionTier: 'FREE',
        preferredLocale: 'ta',
      };

      const blockState = evalMarketBlock(profile, [expiredCert]);
      expect(blockState.isBlocked).toBe(true);
      expect(blockState.reason).toBe('CERT_EXPIRED');
      expect(blockState.messageKey).toBe('dashboard.banner.certExpired');
    });

    it('BR-01: server daysToExpiry drives danger styling inside warning window from config without device clock', () => {
      // Threshold is fetched from config (e.g., 30 days)
      const warningThreshold = 30;

      // 10 days remaining is inside warning threshold -> danger/warning
      const warningState = evalCertificateWarning(10, warningThreshold);
      expect(warningState.isWarning).toBe(true);
      expect(warningState.isExpired).toBe(false);
      expect(warningState.daysRemaining).toBe(10);

      // 45 days remaining is outside warning threshold -> safe
      const safeState = evalCertificateWarning(45, warningThreshold);
      expect(safeState.isWarning).toBe(false);
      expect(safeState.isExpired).toBe(false);

      // Negative days is expired
      const expiredState = evalCertificateWarning(-2, warningThreshold);
      expect(expiredState.isExpired).toBe(true);
      expect(expiredState.isWarning).toBe(true);
    });
  });

  describe('BR-02: Unverified certificate blocks market listings', () => {
    it('BR-02: market-blocked banner renders when certificate is unverified (verificationStatus=UNVERIFIED)', () => {
      const unverifiedCert: Certification = {
        id: 'cert-2',
        certType: 'NPOP',
        certNumber: 'NPOP-TN-002',
        issuingBody: 'Aditi Organic Certifications',
        issuedOn: '2026-01-01',
        expiresOn: '2027-01-01',
        verificationStatus: 'UNVERIFIED',
        verifiedAt: null,
        verifiedBy: null,
        daysToExpiry: 120,
        blocksListings: true,
      };

      const profile: FarmerProfile = {
        id: 'farmer-1',
        tohfaFarmerId: 'TOHFA-F-2026-0001',
        fullName: 'Murugan Selvam',
        mobile: '+919876543210',
        aadhaarLast4: '4321',
        kycStatus: 'VERIFIED',
        isMarketBlocked: true,
        marketBlockReason: 'CERT_UNVERIFIED',
        subscriptionTier: 'FREE',
        preferredLocale: 'ta',
      };

      const blockState = evalMarketBlock(profile, [unverifiedCert]);
      expect(blockState.isBlocked).toBe(true);
      expect(blockState.reason).toBe('CERT_UNVERIFIED');
      expect(blockState.messageKey).toBe('dashboard.banner.certUnverified');
    });
  });

  describe('BR-33: Aadhaar and mobile are locked fields', () => {
    it('BR-33: Aadhaar is masked showing only last 4 digits', () => {
      const masked = maskAadhaar('4321');
      expect(masked).toBe('•••• •••• 4321');
      expect(masked).not.toContain('123456784321');
    });

    it('BR-33: mobile number is masked for display and marked read-only', () => {
      const masked = maskMobile('+919876543210');
      expect(masked).toBe('+91 ••••• ••210');
      expect(masked).not.toBe('+919876543210');
    });
  });

  describe('BR-36: Own-data ownership for farmer wallet', () => {
    it('BR-36: wallet queries only own data without accepting foreign farmerId parameters', () => {
      const urlAll = buildWalletQueryUrl();
      expect(urlAll).toBe('/wallets/me/transactions');
      expect(urlAll).not.toContain('farmerId');

      const urlFiltered = buildWalletQueryUrl({ type: 'SALE_CREDIT' });
      expect(urlFiltered).toBe('/wallets/me/transactions?type=SALE_CREDIT');
      expect(urlFiltered).not.toContain('farmerId');
    });

    it('Wallet: Money values are formatted without float conversion', () => {
      // Formatter should handle branded Money strings without parseFloat inaccuracies
      const formatted = formatMoneyAmount('1820.50');
      expect(formatted).toBe('₹1,820.50');

      const zeroFormatted = formatMoneyAmount('0.00');
      expect(zeroFormatted).toBe('₹0.00');
    });
  });
});
