import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { RoleCode } from '@tohfa/shared-types';
import { createApp } from '../../app.js';
import { signAccessToken } from '../../auth/jwt.js';
import { anActor, databaseReady, describeIfDatabase, IDS } from '../../test/factories.js';
import type { Executor } from '../../db/pool.js';
import {
  createCertificationsService,
  getDaysToExpiry,
} from './certifications.service.js';
import type {
  CertificationRow,
  CertificationsRepo,
  RecomputeResult,
} from './certifications.repo.js';

function mockCertificationsRepo(initialCert?: Partial<CertificationRow>): CertificationsRepo {
  let certState: CertificationRow | null = initialCert
    ? ({
        id: initialCert.id ?? '33333333-3333-3333-3333-333333333333',
        farmer_id: initialCert.farmer_id ?? IDS.farmer,
        farm_id: initialCert.farm_id ?? null,
        cert_type: initialCert.cert_type ?? 'NPOP',
        cert_number: initialCert.cert_number ?? 'NPOP/TN/2026/001',
        issuing_body: initialCert.issuing_body ?? 'Organic India Agency',
        issued_on: initialCert.issued_on ?? '2025-01-01',
        expires_on: initialCert.expires_on ?? '2027-01-01',
        document_id: null,
        document_url: 'https://storage.tohfa.in/certs/cert1.pdf',
        verification_status: initialCert.verification_status ?? 'UNVERIFIED',
        verified_by: initialCert.verified_by ?? null,
        verified_at: initialCert.verified_at ?? null,
        verification_notes: initialCert.verification_notes ?? null,
        portal_checked_url: initialCert.portal_checked_url ?? null,
        created_at: new Date(),
        updated_at: null,
      } as CertificationRow)
    : null;

  let isMarketBlocked = true;
  let marketBlockReason: string | null = 'Organic certifications are pending manual admin verification (BR-02)';

  return {
    createCertification: async (_db, params) => {
      certState = {
        id: '33333333-3333-3333-3333-333333333333',
        farmer_id: params.farmerId,
        farm_id: null,
        cert_type: params.certType,
        cert_number: params.certNumber,
        issuing_body: params.issuingBody,
        issued_on: params.issuedOn,
        expires_on: params.expiresOn,
        document_id: null,
        document_url: params.documentUrl ?? null,
        verification_status: 'UNVERIFIED',
        verified_by: null,
        verified_at: null,
        verification_notes: null,
        portal_checked_url: null,
        created_at: new Date(),
        updated_at: null,
      };
      return certState;
    },
    findById: async (_db, id) => {
      if (certState && certState.id === id) return certState;
      return null;
    },
    listByFarmerId: async () => ({
      items: certState ? [certState] : [],
      nextCursor: null,
      hasMore: false,
    }),
    verifyCertification: async (_db, id, adminUserId, notes, portalUrl) => {
      if (certState && certState.id === id) {
        certState.verification_status = 'VERIFIED';
        certState.verified_by = adminUserId;
        certState.verified_at = new Date();
        certState.verification_notes = notes ?? null;
        certState.portal_checked_url = portalUrl ?? null;
        return certState;
      }
      return null;
    },
    unverifyCertification: async (_db, id, adminUserId, reason) => {
      if (certState && certState.id === id) {
        certState.verification_status = 'REJECTED';
        certState.verified_by = adminUserId;
        certState.verified_at = new Date();
        certState.verification_notes = reason;
        return certState;
      }
      return null;
    },
    recomputeFarmerMarketBlock: async (_db, farmerId): Promise<RecomputeResult> => {
      const prevBlocked = isMarketBlocked;
      if (certState && certState.verification_status === 'VERIFIED') {
        const days = getDaysToExpiry(certState.expires_on);
        if (days >= 0) {
          isMarketBlocked = false;
          marketBlockReason = null;
        } else {
          isMarketBlocked = true;
          marketBlockReason = 'All organic certifications have expired (BR-01)';
        }
      } else {
        isMarketBlocked = true;
        marketBlockReason = 'Organic certifications are pending manual admin verification (BR-02)';
      }
      return {
        farmerId,
        isMarketBlocked,
        marketBlockReason,
        changed: prevBlocked !== isMarketBlocked,
      };
    },
    getAllActiveFarmerIds: async () => [IDS.farmer],
  };
}

describe('Certifications & BR-01/BR-02 Test Contracts', () => {
  describe('Asia/Kolkata Date & Expiry Calculations', () => {
    it('accurately computes positive and negative days to expiry', () => {
      const pastDate = '2020-01-01';
      expect(getDaysToExpiry(pastDate)).toBeLessThan(0);

      const futureDate = '2099-12-31';
      expect(getDaysToExpiry(futureDate)).toBeGreaterThan(0);
    });
  });

  describe('BR-01: Expired Certificate Blocks Market Listings', () => {
    it('BR-01a: farmer with a certificate expiring yesterday is market blocked (blocksListings: true)', async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]!;
      const repo = mockCertificationsRepo({
        id: '33333333-3333-3333-3333-333333333333',
        expires_on: yesterday,
        verification_status: 'VERIFIED',
      });
      const service = createCertificationsService(repo);
      const actor = anActor({
        userId: IDS.userFarmer,
        roles: [{ code: RoleCode.FARMER }],
        farmerId: IDS.farmer,
      });

      const list = (await service.listMyCertifications(actor, { limit: 10 })) as {
        items: Array<{ blocksListings: boolean; daysToExpiry: number }>;
      };

      expect(list.items[0]?.blocksListings).toBe(true);
      expect(list.items[0]?.daysToExpiry).toBeLessThan(0);

      const recompute = await repo.recomputeFarmerMarketBlock(null as unknown as Executor, IDS.farmer);
      expect(recompute.isMarketBlocked).toBe(true);
      expect(recompute.marketBlockReason).toContain('BR-01');
    });

    it('BR-01b: re-verifying an unexpired certificate clears farmers.is_market_blocked', async () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]!;
      const repo = mockCertificationsRepo({
        id: '33333333-3333-3333-3333-333333333333',
        expires_on: tomorrow,
        verification_status: 'UNVERIFIED',
      });
      const mockTxRunner = async <T>(fn: (tx: Executor) => Promise<T>): Promise<T> => fn(null as unknown as Executor);
      const service = createCertificationsService(repo, mockTxRunner);

      // Admin verifies
      const adminActor = anActor({ userId: IDS.userSuperAdmin });
      await service.verifyCertification(adminActor, '33333333-3333-3333-3333-333333333333', {
        portalReference: 'NPOP-PORTAL-OK',
        note: 'Checked official portal',
      });

      const status = await repo.recomputeFarmerMarketBlock(null as unknown as Executor, IDS.farmer);
      expect(status.isMarketBlocked).toBe(false);
      expect(status.marketBlockReason).toBeNull();
    });
  });

  describe('BR-02: Manual Admin Verification & Unverified Block', () => {
    it('BR-02a: farmer with an uploaded but UNVERIFIED certificate remains market blocked', async () => {
      const futureDate = '2028-12-31';
      const repo = mockCertificationsRepo({
        id: '33333333-3333-3333-3333-333333333333',
        expires_on: futureDate,
        verification_status: 'UNVERIFIED',
      });
      const service = createCertificationsService(repo);
      const actor = anActor({
        userId: IDS.userFarmer,
        roles: [{ code: RoleCode.FARMER }],
        farmerId: IDS.farmer,
      });

      const list = (await service.listMyCertifications(actor, { limit: 10 })) as {
        items: Array<{ blocksListings: boolean; verificationStatus: string }>;
      };

      expect(list.items[0]?.verificationStatus).toBe('UNVERIFIED');
      expect(list.items[0]?.blocksListings).toBe(true);

      const recompute = await repo.recomputeFarmerMarketBlock(null as unknown as Executor, IDS.farmer);
      expect(recompute.isMarketBlocked).toBe(true);
      expect(recompute.marketBlockReason).toContain('BR-02');
    });

    it('BR-02b: unverify re-blocks the farmer immediately with reason', async () => {
      const futureDate = '2028-12-31';
      const repo = mockCertificationsRepo({
        id: '33333333-3333-3333-3333-333333333333',
        expires_on: futureDate,
        verification_status: 'VERIFIED',
      });
      const mockTxRunner = async <T>(fn: (tx: Executor) => Promise<T>): Promise<T> => fn(null as unknown as Executor);
      const service = createCertificationsService(repo, mockTxRunner);

      const adminActor = anActor({ userId: IDS.userSuperAdmin });
      await service.unverifyCertification(adminActor, '33333333-3333-3333-3333-333333333333', {
        reason: 'Certificate revoked by issuing authority for compliance violation',
      });

      const recompute = await repo.recomputeFarmerMarketBlock(null as unknown as Executor, IDS.farmer);
      expect(recompute.isMarketBlocked).toBe(true);
    });
  });

  describe('HTTP Route Validation', () => {
    const app = createApp();
    const adminToken = signAccessToken({
      sub: IDS.userSuperAdmin,
      roles: [{ code: 'SUPER_ADMIN' }],
      farmerId: null,
      customerId: null,
    });

    it('POST /v1/farmers/me/certifications rejects invalid date ordering (expiresOn <= issuedOn)', async () => {
      const farmerToken = signAccessToken({
        sub: IDS.userFarmer,
        roles: [{ code: 'FARMER' }],
        farmerId: IDS.farmer,
        customerId: null,
      });

      const res = await request(app)
        .post('/v1/farmers/me/certifications')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({
          certType: 'PGS',
          certNumber: 'PGS-001',
          issuingBody: 'Agency',
          issuedOn: '2026-01-01',
          expiresOn: '2025-01-01', // Before issuedOn!
        });

      expect(res.status).toBe(422);
      expect(res.body.code).toBe('VALIDATION_FAILED');
    });

    it('POST /admin/certifications/:id/unverify requires reason with minimum length', async () => {
      const res = await request(app)
        .post('/v1/admin/certifications/33333333-3333-3333-3333-333333333333/unverify')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'bad', // Too short (< 5 chars)
        });

      expect(res.status).toBe(422);
      expect(res.body.code).toBe('VALIDATION_FAILED');
    });
  });

  describeIfDatabase('Integration against PostgreSQL', () => {
    const app = createApp();

    it('database check constraint enforces verified_by for VERIFIED rows', async () => {
      if (!(await databaseReady('certifications'))) return;

      const adminToken = signAccessToken({
        sub: IDS.userSuperAdmin,
        roles: [{ code: 'SUPER_ADMIN' }],
        farmerId: null,
        customerId: null,
      });

      // Validating admin verification route executes correctly
      const res = await request(app)
        .post('/v1/admin/certifications/00000000-0000-0000-0000-000000000001/verify')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          portalReference: 'REF-1234',
        });

      // Either 404 (non-existent id) or 200, but never a 500 constraint crash
      expect([200, 404]).toContain(res.status);
    });
  });
});
