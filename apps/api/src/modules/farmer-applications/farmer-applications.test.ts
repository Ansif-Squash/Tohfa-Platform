import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { RoleCode } from '@tohfa/shared-types';
import { anActor, databaseReady, describeIfDatabase, IDS } from '../../test/factories.js';
import {
  createFarmerApplicationsService,
  isValidTransition,
} from './farmer-applications.service.js';
import type {
  FarmerApplicationRow,
  FarmerApplicationsRepo,
  FarmerProfileRow,
  StatusHistoryRow,
} from './farmer-applications.repo.js';

function mockFarmerApplicationsRepo(initialApp?: Partial<FarmerApplicationRow>): FarmerApplicationsRepo {
  let appState: FarmerApplicationRow | null = initialApp
    ? ({
        id: initialApp.id ?? '11111111-1111-1111-1111-111111111111',
        mobile: initialApp.mobile ?? '+919812345678',
        full_name: initialApp.full_name ?? 'Murugan S',
        preferred_locale: initialApp.preferred_locale ?? 'en',
        status: initialApp.status ?? 'SUBMITTED',
        is_draft: initialApp.is_draft ?? true,
        current_step: initialApp.current_step ?? 1,
        completed_steps: initialApp.completed_steps ?? [],
        step1_personal: initialApp.step1_personal ?? {},
        step2_farm_details: initialApp.step2_farm_details ?? {},
        step3_location: initialApp.step3_location ?? {},
        step4_documents: initialApp.step4_documents ?? {},
        user_id: initialApp.user_id ?? '00000000-0000-0000-0000-000000000002',
        farmer_id: initialApp.farmer_id ?? null,
        submitted_at: initialApp.submitted_at ?? null,
        created_at: new Date(),
        updated_at: null,
      } as FarmerApplicationRow)
    : null;

  const history: StatusHistoryRow[] = [];

  const mockProfile: FarmerProfileRow = {
    id: IDS.farmer,
    user_id: '00000000-0000-0000-0000-000000000002',
    tohfa_farmer_id: 'TOHFA-F-2026-0001',
    full_name: 'Murugan S',
    mobile: '+919812345678',
    preferred_locale: 'ta',
    zone_id: IDS.zoneNorth,
    zone_name: 'Ooty North',
    farming_experience_years: 15,
    address_line1: '12 Organic Valley',
    village: 'Ithalar',
    taluk: 'Ooty',
    district: 'The Nilgiris',
    aadhaar_last4: '4321',
    kyc_status: 'VERIFIED',
    application_status: 'APPROVED',
    overall_rating: 4.8,
    is_market_blocked: false,
    market_block_reason: null,
    created_at: new Date(),
  };

  return {
    createApplication: async (_db, params) => {
      appState = {
        id: '11111111-1111-1111-1111-111111111111',
        mobile: params.mobile,
        full_name: params.fullName,
        preferred_locale: params.preferredLocale,
        status: 'SUBMITTED',
        is_draft: true,
        current_step: 1,
        completed_steps: [],
        step1_personal: {},
        step2_farm_details: {},
        step3_location: {},
        step4_documents: {},
        user_id: params.userId ?? null,
        farmer_id: null,
        submitted_at: null,
        created_at: new Date(),
        updated_at: null,
      };
      return appState;
    },
    findById: async (_db, id) => {
      if (appState && appState.id === id) return appState;
      return null;
    },
    findLiveByMobile: async (_db, mobile) => {
      if (appState && appState.mobile === mobile && appState.status !== 'APPROVED' && appState.status !== 'REJECTED') {
        return appState;
      }
      return null;
    },
    updateStepData: async (_db, id, step, stepData, completedSteps) => {
      if (appState && appState.id === id) {
        if (step === 1) appState.step1_personal = stepData;
        if (step === 2) appState.step2_farm_details = stepData;
        if (step === 3) appState.step3_location = stepData;
        if (step === 4) appState.step4_documents = stepData;
        appState.completed_steps = completedSteps;
        return appState;
      }
      return null;
    },
    transitionStatus: async (_db, id, fromStatus, toStatus) => {
      if (appState && appState.id === id) {
        appState.status = toStatus;
        if (toStatus === 'DOCS_REVIEW') {
          appState.is_draft = false;
          appState.submitted_at = new Date();
        }
        history.push({
          id: '22222222-2222-2222-2222-222222222222',
          application_id: id,
          from_status: fromStatus,
          to_status: toStatus,
          actor_id: null,
          note: null,
          created_at: new Date(),
        });
        return appState;
      }
      throw new Error('Application not found');
    },
    getStatusHistory: async () => history,
    listAdminApplications: async () => ({
      items: appState ? [appState] : [],
      nextCursor: null,
      hasMore: false,
    }),
    findFarmerByUserId: async () => mockProfile,
    findFarmerById: async () => mockProfile,
    updateFarmerProfile: async () => mockProfile,
    allocateNextTohfaFarmerId: async () => 'TOHFA-F-2026-0002',
  };
}

describe('Farmer Applications & BR-33/BR-36 Test Contracts', () => {
  describe('State Machine Transitions', () => {
    it('allows legal forward transitions and rejects illegal skips', () => {
      expect(isValidTransition('SUBMITTED', 'DOCS_REVIEW')).toBe(true);
      expect(isValidTransition('DOCS_REVIEW', 'FARM_VERIFICATION')).toBe(true);
      expect(isValidTransition('FARM_VERIFICATION', 'AUDIT')).toBe(true);
      expect(isValidTransition('AUDIT', 'APPROVED')).toBe(true);

      // Rejection is possible from any non-terminal state
      expect(isValidTransition('SUBMITTED', 'REJECTED')).toBe(true);
      expect(isValidTransition('DOCS_REVIEW', 'REJECTED')).toBe(true);
      expect(isValidTransition('FARM_VERIFICATION', 'REJECTED')).toBe(true);
      expect(isValidTransition('AUDIT', 'REJECTED')).toBe(true);

      // Illegal skips and rollbacks
      expect(isValidTransition('SUBMITTED', 'APPROVED')).toBe(false);
      expect(isValidTransition('DOCS_REVIEW', 'AUDIT')).toBe(false);
      expect(isValidTransition('APPROVED', 'SUBMITTED')).toBe(false);
      expect(isValidTransition('REJECTED', 'APPROVED')).toBe(false);
    });

    it('throws INVALID_STATE_TRANSITION on illegal state transition attempt', async () => {
      const repo = mockFarmerApplicationsRepo({
        id: '11111111-1111-1111-1111-111111111111',
        status: 'SUBMITTED',
      });
      const service = createFarmerApplicationsService(repo);
      const actor = anActor({ userId: IDS.userSuperAdmin });

      await expect(
        service.transitionStatus(actor, '11111111-1111-1111-1111-111111111111', 'APPROVED'),
      ).rejects.toThrow(expect.objectContaining({ code: 'INVALID_STATE_TRANSITION' }));
    });
  });

  describe('BR-33: Locked Fields & Masked Aadhaar', () => {
    it('BR-33: farmer cannot update locked mobile or Aadhaar fields', async () => {
      const repo = mockFarmerApplicationsRepo();
      const service = createFarmerApplicationsService(repo);
      const actor = anActor({ userId: '00000000-0000-0000-0000-000000000002' });

      // Attempt to patch mobile
      await expect(
        service.updateMyProfile(actor, {
          mobile: '+919999999999',
          fullName: 'Hacker Name',
        }),
      ).rejects.toThrow(expect.objectContaining({ code: 'FIELD_LOCKED' }));

      // Attempt to patch aadhaar
      await expect(
        service.updateMyProfile(actor, {
          aadhaar: '123456789012',
        }),
      ).rejects.toThrow(expect.objectContaining({ code: 'FIELD_LOCKED' }));
    });

    it('BR-33: farmer profile response returns masked aadhaar_last4 only, never raw 12-digit number', async () => {
      const repo = mockFarmerApplicationsRepo();
      const service = createFarmerApplicationsService(repo);
      const actor = anActor({ userId: '00000000-0000-0000-0000-000000000002' });

      const profile = (await service.getMyProfile(actor)) as Record<string, unknown>;
      expect(profile).toHaveProperty('aadhaarLast4', '4321');
      expect(profile).not.toHaveProperty('aadhaar');
      expect(profile).not.toHaveProperty('aadhaarNumber');
      expect(profile).not.toHaveProperty('aadhaar_token');
    });
  });

  describe('BR-36: Own-Data Scoping', () => {
    it('BR-36: accessing another farmer application returns 404 NOT_FOUND, not 403', async () => {
      const repo = mockFarmerApplicationsRepo({
        id: '11111111-1111-1111-1111-111111111111',
        user_id: '00000000-0000-0000-0000-000000000002', // Belongs to Farmer 2
      });
      const service = createFarmerApplicationsService(repo);

      // Farmer 9 attempts to read Farmer 2's application
      const attackerActor = anActor({
        userId: '00000000-0000-0000-0000-000000000009',
        roles: [{ code: RoleCode.FARMER }],
      });

      await expect(
        service.getStatusTimeline(attackerActor, '11111111-1111-1111-1111-111111111111'),
      ).rejects.toThrow(expect.objectContaining({ code: 'NOT_FOUND' }));

      await expect(
        service.updateStep(attackerActor, '11111111-1111-1111-1111-111111111111', 1, {
          fullName: 'Malicious Update',
        }),
      ).rejects.toThrow(expect.objectContaining({ code: 'NOT_FOUND' }));
    });
  });

  describe('5-Step Draft & Submit Validation', () => {
    it('refuses submit if mandatory ID_PROOF or FARM_DOC is missing', async () => {
      const repo = mockFarmerApplicationsRepo({
        id: '11111111-1111-1111-1111-111111111111',
        user_id: '00000000-0000-0000-0000-000000000002',
        step4_documents: {
          documents: [
            // Only CERTIFICATE is attached (optional) — missing mandatory ID_PROOF and FARM_DOC
            { docType: 'CERTIFICATE', fileUrl: 'https://blob.storage/cert.pdf' },
          ],
        },
      });
      const service = createFarmerApplicationsService(repo);
      const actor = anActor({ userId: '00000000-0000-0000-0000-000000000002' });

      await expect(
        service.submitApplication(actor, '11111111-1111-1111-1111-111111111111'),
      ).rejects.toThrow(expect.objectContaining({ code: 'VALIDATION_FAILED' }));
    });

    it('submits successfully when ID_PROOF and FARM_DOC are provided', async () => {
      const repo = mockFarmerApplicationsRepo({
        id: '11111111-1111-1111-1111-111111111111',
        user_id: '00000000-0000-0000-0000-000000000002',
        status: 'SUBMITTED',
        step4_documents: {
          documents: [
            { docType: 'ID_PROOF', fileUrl: 'https://blob.storage/aadhaar.pdf' },
            { docType: 'FARM_DOC', fileUrl: 'https://blob.storage/patta.pdf' },
          ],
        },
      });
      const service = createFarmerApplicationsService(repo);
      const actor = anActor({ userId: '00000000-0000-0000-0000-000000000002' });

      const submitted = (await service.submitApplication(
        actor,
        '11111111-1111-1111-1111-111111111111',
      )) as Record<string, unknown>;

      expect(submitted.status).toBe('DOCS_REVIEW');
      expect(submitted.isDraft).toBe(false);
    });
  });

  describe('HTTP Route Integration (Schema Validation)', () => {
    const app = createApp();

    it('POST /v1/farmers/applications rejects invalid mobile format', async () => {
      const res = await request(app)
        .post('/v1/farmers/applications')
        .send({
          mobile: '9812345678', // Missing + prefix
          fullName: 'Murugan S',
        });

      expect(res.status).toBe(422);
      expect(res.body.code).toBe('VALIDATION_FAILED');
    });

    it('PATCH /v1/farmers/applications/:id/steps/99 rejects invalid step number with 422', async () => {
      const res = await request(app)
        .patch('/v1/farmers/applications/11111111-1111-1111-1111-111111111111/steps/99')
        .send({});

      expect(res.status).toBe(422);
      expect(res.body.code).toBe('VALIDATION_FAILED');
    });

    it('GET /v1/admin/farmer-applications requires authentication', async () => {
      const res = await request(app).get('/v1/admin/farmer-applications');
      expect(res.status).toBe(401);
    });

    it('POST /v1/admin/farmer-applications/:id/reject requires reasonCode and min length reason', async () => {
      const adminToken = (await import('../../auth/jwt.js')).signAccessToken({
        sub: IDS.userSuperAdmin,
        roles: [{ code: 'SUPER_ADMIN' }],
        farmerId: null,
        customerId: null,
      });

      const res = await request(app)
        .post('/v1/admin/farmer-applications/11111111-1111-1111-1111-111111111111/reject')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reasonCode: 'INVALID_ENUM',
          reason: 'bad',
        });

      expect(res.status).toBe(422);
      expect(res.body.code).toBe('VALIDATION_FAILED');
    });
  });

  describeIfDatabase('Integration against PostgreSQL', () => {
    const app = createApp();
    const uniqueMobile = `+9198${Date.now().toString().slice(-8)}`;

    it('creates draft, updates steps, and checks duplicate live constraint', async () => {
      if (!(await databaseReady('farmer_applications'))) return;

      // 1. Create Draft
      const createRes = await request(app)
        .post('/v1/farmers/applications')
        .send({
          mobile: uniqueMobile,
          fullName: 'Palanisamy K',
          preferredLocale: 'ta',
        });

      expect(createRes.status).toBe(201);
      const appId = createRes.body.id;
      expect(appId).toBeDefined();

      // 2. Reject duplicate live application for same mobile
      const dupRes = await request(app)
        .post('/v1/farmers/applications')
        .send({
          mobile: uniqueMobile,
          fullName: 'Palanisamy K Duplicate',
        });

      expect(dupRes.status).toBe(409);
      expect(dupRes.body.code).toBe('CONFLICT');

      // 3. Save Step 3 Location with GPS & Polygon
      const step3Res = await request(app)
        .patch(`/v1/farmers/applications/${appId}/steps/3`)
        .send({
          gpsCaptured: true,
          latitude: 11.4102,
          longitude: 76.695,
          village: 'Ithalar',
          taluk: 'Ooty',
          district: 'The Nilgiris',
          fmbPolygon: {
            type: 'Polygon',
            coordinates: [
              [
                [76.6948, 11.41],
                [76.6953, 11.41],
                [76.6953, 11.4105],
                [76.6948, 11.4105],
                [76.6948, 11.41],
              ],
            ],
          },
        });

      expect(step3Res.status).toBe(200);
      expect(step3Res.body.completedSteps).toContain(3);
    });
  });
});
