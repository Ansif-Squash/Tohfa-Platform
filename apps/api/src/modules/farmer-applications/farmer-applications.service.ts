import { writeAuditLog } from '../../audit/auditLog.js';
import type { Actor } from '../../auth/requireAuth.js';
import { pool, withTransaction } from '../../db/pool.js';
import { eventBus } from '../../events/bus.js';
import { AppError } from '../../http/problem.js';
import {
  farmerApplicationsRepo,
  type ApplicationStatus,
  type FarmerApplicationRow,
  type FarmerApplicationsRepo,
} from './farmer-applications.repo.js';
import {
  step1PersonalSchema,
  step2FarmDetailsSchema,
  step3LocationSchema,
  step4DocumentsSchema,
  step5ReviewSchema,
  type ApproveApplicationBody,
  type CreateFarmerApplicationBody,
  type ListAdminApplicationsQuery,
  type RejectApplicationBody,
  type RequestInfoApplicationBody,
  type UpdateFarmerProfileBody,
} from './farmer-applications.schema.js';

const VALID_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  SUBMITTED: ['DOCS_REVIEW', 'REJECTED'],
  DOCS_REVIEW: ['FARM_VERIFICATION', 'REJECTED'],
  FARM_VERIFICATION: ['AUDIT', 'REJECTED'],
  AUDIT: ['APPROVED', 'REJECTED'],
  APPROVED: [],
  REJECTED: [],
};

export function isValidTransition(from: ApplicationStatus, to: ApplicationStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

function mapApplicationResponse(row: FarmerApplicationRow) {
  return {
    id: row.id,
    mobile: row.mobile,
    fullName: row.full_name,
    preferredLocale: row.preferred_locale,
    status: row.status,
    isDraft: row.is_draft,
    currentStep: row.current_step,
    completedSteps: row.completed_steps,
    step1Personal: row.step1_personal,
    step2FarmDetails: row.step2_farm_details,
    step3Location: row.step3_location,
    step4Documents: row.step4_documents,
    submittedAt: row.submitted_at?.toISOString() ?? null,
    createdAt: row.created_at.toISOString(),
  };
}

export interface FarmerApplicationsService {
  createDraft(input: CreateFarmerApplicationBody, actor?: Actor | undefined): Promise<unknown>;
  updateStep(actor: Actor | undefined, id: string, step: number, payload: unknown): Promise<unknown>;
  submitApplication(actor: Actor | undefined, id: string): Promise<unknown>;
  getStatusTimeline(actor: Actor | undefined, id: string): Promise<unknown>;
  transitionStatus(
    actor: Actor,
    id: string,
    toStatus: ApplicationStatus,
    note?: string | undefined,
  ): Promise<unknown>;
  getMyProfile(actor: Actor): Promise<unknown>;
  updateMyProfile(actor: Actor, body: UpdateFarmerProfileBody): Promise<unknown>;
  listAdminApplications(actor: Actor, query: ListAdminApplicationsQuery): Promise<unknown>;
  getAdminApplication(actor: Actor, id: string): Promise<unknown>;
  approveApplication(actor: Actor, id: string, body: ApproveApplicationBody): Promise<unknown>;
  rejectApplication(actor: Actor, id: string, body: RejectApplicationBody): Promise<unknown>;
  requestInfoApplication(actor: Actor, id: string, body: RequestInfoApplicationBody): Promise<unknown>;
}

export function createFarmerApplicationsService(
  repo: FarmerApplicationsRepo = farmerApplicationsRepo,
): FarmerApplicationsService {
  return {
    async createDraft(input, actor) {
      const existing = await repo.findLiveByMobile(pool, input.mobile);
      if (existing !== null) {
        throw new AppError('CONFLICT', {
          status: 409,
          detail: 'An active non-terminal application already exists for this mobile number.',
        });
      }

      const app = await repo.createApplication(pool, {
        mobile: input.mobile,
        fullName: input.fullName,
        preferredLocale: input.preferredLocale,
        userId: actor?.userId,
      });

      return mapApplicationResponse(app);
    },

    async updateStep(actor, id, step, payload) {
      const app = await repo.findById(pool, id);
      if (app === null) {
        throw new AppError('NOT_FOUND', { detail: 'Application not found.' });
      }

      // BR-36: Own-data scoping (other user gets NOT_FOUND to prevent enumeration)
      if (
        actor !== undefined &&
        app.user_id !== null &&
        app.user_id !== actor.userId &&
        !actor.roles.some((r) => r.code === 'SUPER_ADMIN' || r.code === 'TOHFA_ADMIN')
      ) {
        throw new AppError('NOT_FOUND', { detail: 'Application not found.' });
      }

      if (app.status === 'APPROVED' || app.status === 'REJECTED') {
        throw new AppError('CONFLICT', {
          status: 409,
          detail: `Cannot edit an application in ${app.status} status.`,
        });
      }

      let stepData: Record<string, unknown> = {};
      if (step === 1) {
        stepData = step1PersonalSchema.parse(payload);
      } else if (step === 2) {
        stepData = step2FarmDetailsSchema.parse(payload);
      } else if (step === 3) {
        stepData = step3LocationSchema.parse(payload);
      } else if (step === 4) {
        stepData = step4DocumentsSchema.parse(payload);
      } else if (step === 5) {
        stepData = step5ReviewSchema.parse(payload);
      }

      const completedSet = new Set(app.completed_steps);
      completedSet.add(step);
      const completedSteps = Array.from(completedSet).sort((a, b) => a - b);

      const updated = await repo.updateStepData(pool, id, step, stepData, completedSteps);
      if (updated === null) {
        throw new AppError('NOT_FOUND', { detail: 'Application not found.' });
      }

      return mapApplicationResponse(updated);
    },

    async submitApplication(actor, id) {
      const app = await repo.findById(pool, id);
      if (app === null) {
        throw new AppError('NOT_FOUND', { detail: 'Application not found.' });
      }

      // BR-36: Own-data scoping
      if (
        actor !== undefined &&
        app.user_id !== null &&
        app.user_id !== actor.userId &&
        !actor.roles.some((r) => r.code === 'SUPER_ADMIN' || r.code === 'TOHFA_ADMIN')
      ) {
        throw new AppError('NOT_FOUND', { detail: 'Application not found.' });
      }

      // Cross-step validation
      const docs = (app.step4_documents as { documents?: Array<{ docType: string }> })?.documents ?? [];
      const docTypes = docs.map((d) => d.docType);

      const hasIdProof = docTypes.includes('ID_PROOF');
      const hasFarmDoc = docTypes.includes('FARM_DOC');

      if (!hasIdProof || !hasFarmDoc) {
        throw new AppError('VALIDATION_FAILED', {
          status: 422,
          detail: 'Mandatory documents missing: ID_PROOF and FARM_DOC are required for submission.',
          meta: {
            missingDocuments: [
              ...(!hasIdProof ? ['ID_PROOF'] : []),
              ...(!hasFarmDoc ? ['FARM_DOC'] : []),
            ],
          },
        });
      }

      if (!isValidTransition(app.status, 'DOCS_REVIEW')) {
        throw new AppError('INVALID_STATE_TRANSITION', {
          status: 422,
          detail: `Cannot transition application from ${app.status} to DOCS_REVIEW.`,
        });
      }

      const updated = await repo.transitionStatus(
        pool,
        id,
        app.status,
        'DOCS_REVIEW',
        actor?.userId,
        'Submitted by applicant',
      );

      return mapApplicationResponse(updated);
    },

    async getStatusTimeline(actor, id) {
      const app = await repo.findById(pool, id);
      if (app === null) {
        throw new AppError('NOT_FOUND', { detail: 'Application not found.' });
      }

      // BR-36: Own-data scoping
      if (
        actor !== undefined &&
        app.user_id !== null &&
        app.user_id !== actor.userId &&
        !actor.roles.some((r) => r.code === 'SUPER_ADMIN' || r.code === 'TOHFA_ADMIN')
      ) {
        throw new AppError('NOT_FOUND', { detail: 'Application not found.' });
      }

      const history = await repo.getStatusHistory(pool, id);

      const submittedAt = app.submitted_at ?? app.created_at;
      const expectedDecisionBy = new Date(submittedAt.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString();

      return {
        applicationId: app.id,
        status: app.status,
        submittedAt: app.submitted_at?.toISOString() ?? null,
        expectedDecisionBy,
        steps: history.map((h) => ({
          status: h.to_status,
          reachedAt: h.created_at.toISOString(),
          note: h.note,
        })),
      };
    },

    async transitionStatus(actor, id, toStatus, note) {
      const app = await repo.findById(pool, id);
      if (app === null) {
        throw new AppError('NOT_FOUND', { detail: 'Application not found.' });
      }

      if (!isValidTransition(app.status, toStatus)) {
        throw new AppError('INVALID_STATE_TRANSITION', {
          status: 422,
          detail: `Illegal transition from ${app.status} to ${toStatus}.`,
        });
      }

      const updated = await repo.transitionStatus(pool, id, app.status, toStatus, actor.userId, note);
      return mapApplicationResponse(updated);
    },

    async getMyProfile(actor) {
      const profile = await repo.findFarmerByUserId(pool, actor.userId);
      if (profile === null) {
        throw new AppError('NOT_FOUND', { detail: 'Farmer profile not found for current actor.' });
      }

      // BR-33b: unmasked Aadhaar is never returned (only aadhaar_last4)
      return {
        id: profile.id,
        userId: profile.user_id,
        tohfaFarmerId: profile.tohfa_farmer_id,
        fullName: profile.full_name,
        mobile: profile.mobile,
        preferredLocale: profile.preferred_locale,
        zoneId: profile.zone_id,
        zoneName: profile.zone_name,
        farmingExperienceYears: profile.farming_experience_years,
        address: profile.address_line1,
        village: profile.village,
        taluk: profile.taluk,
        district: profile.district,
        aadhaarLast4: profile.aadhaar_last4,
        kycStatus: profile.kyc_status,
        applicationStatus: profile.application_status,
        overallRating: profile.overall_rating,
        isMarketBlocked: profile.is_market_blocked,
        marketBlockReason: profile.market_block_reason,
        createdAt: profile.created_at.toISOString(),
      };
    },

    async updateMyProfile(actor, body) {
      // BR-33a: Aadhaar and mobile are locked fields
      if (body.mobile !== undefined || body.aadhaar !== undefined || body.aadhaarNumber !== undefined) {
        throw new AppError('FIELD_LOCKED', {
          status: 403,
          detail: 'Mobile number and Aadhaar are locked fields and cannot be modified by the farmer (BR-33).',
        });
      }

      const profile = await repo.findFarmerByUserId(pool, actor.userId);
      if (profile === null) {
        throw new AppError('NOT_FOUND', { detail: 'Farmer profile not found.' });
      }

      const updated = await repo.updateFarmerProfile(pool, profile.id, {
        fullName: body.fullName,
        farmingExperienceYears: body.farmingExperienceYears,
        addressLine1: body.address,
        preferredLocale: body.preferredLocale,
      });

      if (updated === null) {
        throw new AppError('NOT_FOUND', { detail: 'Failed to update farmer profile.' });
      }

      return {
        id: updated.id,
        userId: updated.user_id,
        tohfaFarmerId: updated.tohfa_farmer_id,
        fullName: updated.full_name,
        mobile: updated.mobile,
        preferredLocale: updated.preferred_locale,
        zoneId: updated.zone_id,
        zoneName: updated.zone_name,
        farmingExperienceYears: updated.farming_experience_years,
        address: updated.address_line1,
        village: updated.village,
        taluk: updated.taluk,
        district: updated.district,
        aadhaarLast4: updated.aadhaar_last4,
        kycStatus: updated.kyc_status,
        applicationStatus: updated.application_status,
        overallRating: updated.overall_rating,
        isMarketBlocked: updated.is_market_blocked,
        marketBlockReason: updated.market_block_reason,
        createdAt: updated.created_at.toISOString(),
      };
    },

    async listAdminApplications(_actor, query) {
      const { items, nextCursor, hasMore } = await repo.listAdminApplications(pool, query);
      return {
        items: items.map(mapApplicationResponse),
        page: { nextCursor, hasMore },
      };
    },

    async getAdminApplication(_actor, id) {
      const app = await repo.findById(pool, id);
      if (app === null) {
        throw new AppError('NOT_FOUND', { detail: 'Application not found.' });
      }
      return mapApplicationResponse(app);
    },

    async approveApplication(actor, id, body) {
      const app = await repo.findById(pool, id);
      if (app === null) {
        throw new AppError('NOT_FOUND', { detail: 'Application not found.' });
      }

      if (app.status === 'APPROVED') {
        throw new AppError('CONFLICT', {
          status: 409,
          detail: 'Application is already approved.',
        });
      }

      const result = await withTransaction(async (tx) => {
        const year = new Date().getFullYear();
        const tohfaFarmerId = await repo.allocateNextTohfaFarmerId(tx, year);

        let userId = app.user_id;
        if (userId === null) {
          const userRes = await tx.query<{ id: string }>(
            `INSERT INTO users (mobile, full_name, preferred_locale)
             VALUES ($1, $2, $3)
             ON CONFLICT (mobile) DO UPDATE SET full_name = EXCLUDED.full_name
             RETURNING id`,
            [app.mobile, app.full_name, app.preferred_locale],
          );
          userId = userRes.rows[0]!.id;
        }

        await tx.query(
          `INSERT INTO user_roles (user_id, role_code)
           VALUES ($1, 'FARMER')
           ON CONFLICT DO NOTHING`,
          [userId],
        );

        const personal = (app.step1_personal as Record<string, unknown>) ?? {};
        const farmerRes = await tx.query<{ id: string }>(
          `INSERT INTO farmers (
             user_id, tohfa_farmer_id, zone_id, farming_experience_years,
             address_line1, village, taluk, district, aadhaar_last4,
             kyc_status, application_status, is_market_blocked, market_block_reason
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'VERIFIED', 'APPROVED', true, 'No organic certifications uploaded (BR-01, BR-02)')
           RETURNING id`,
          [
            userId,
            tohfaFarmerId,
            body.zoneId ?? null,
            personal['farmingExperienceYears'] ?? 0,
            personal['addressLine1'] ?? null,
            personal['village'] ?? null,
            personal['taluk'] ?? null,
            personal['district'] ?? null,
            personal['aadhaarLast4'] ?? null,
          ],
        );
        const farmerId = farmerRes.rows[0]!.id;

        const updated = await repo.transitionStatus(
          tx,
          id,
          app.status,
          'APPROVED',
          actor.userId,
          body.note ?? 'Approved by admin',
        );

        await tx.query(
          `UPDATE farmer_applications SET farmer_id = $1, user_id = $2 WHERE id = $3`,
          [farmerId, userId, id],
        );

        await writeAuditLog(tx, {
          actorId: actor.userId,
          ...(actor.roles[0]?.code ? { actorRole: actor.roles[0].code } : {}),
          actionCode: 'farmer.application.approve',
          entityType: 'farmer_application',
          entityId: id,
          before: { status: app.status },
          after: { status: 'APPROVED', tohfaFarmerId, farmerId },
          changedFields: ['status', 'farmer_id'],
        });

        return { updated, tohfaFarmerId, userId };
      });

      await eventBus.publish('farmer.application.approved', {
        userId: result.userId,
        applicationId: id,
        tohfaFarmerId: result.tohfaFarmerId,
      });

      return mapApplicationResponse(result.updated);
    },

    async rejectApplication(actor, id, body) {
      const app = await repo.findById(pool, id);
      if (app === null) {
        throw new AppError('NOT_FOUND', { detail: 'Application not found.' });
      }

      if (app.status === 'REJECTED') {
        throw new AppError('CONFLICT', {
          status: 409,
          detail: 'Application is already rejected.',
        });
      }

      const updated = await withTransaction(async (tx) => {
        const res = await repo.transitionStatus(
          tx,
          id,
          app.status,
          'REJECTED',
          actor.userId,
          `[${body.reasonCode}] ${body.reason}`,
        );

        await writeAuditLog(tx, {
          actorId: actor.userId,
          ...(actor.roles[0]?.code ? { actorRole: actor.roles[0].code } : {}),
          actionCode: 'farmer.application.reject',
          entityType: 'farmer_application',
          entityId: id,
          before: { status: app.status },
          after: { status: 'REJECTED', reasonCode: body.reasonCode, reason: body.reason },
          changedFields: ['status'],
        });

        return res;
      });

      if (app.user_id) {
        await eventBus.publish('farmer.application.rejected', {
          userId: app.user_id,
          applicationId: id,
          reason: body.reason,
        });
      }

      return mapApplicationResponse(updated);
    },

    async requestInfoApplication(actor, id, body) {
      const app = await repo.findById(pool, id);
      if (app === null) {
        throw new AppError('NOT_FOUND', { detail: 'Application not found.' });
      }

      const updated = await withTransaction(async (tx) => {
        const res = await repo.transitionStatus(
          tx,
          id,
          app.status,
          'DOCS_REVIEW',
          actor.userId,
          `More info requested: ${body.message}`,
        );

        if (body.requiredSteps && body.requiredSteps.length > 0) {
          const remainingSteps = app.completed_steps.filter(
            (s) => !body.requiredSteps!.includes(s),
          );
          await tx.query(
            `UPDATE farmer_applications SET completed_steps = $1 WHERE id = $2`,
            [remainingSteps, id],
          );
        }

        await writeAuditLog(tx, {
          actorId: actor.userId,
          ...(actor.roles[0]?.code ? { actorRole: actor.roles[0].code } : {}),
          actionCode: 'farmer.application.request_info',
          entityType: 'farmer_application',
          entityId: id,
          before: { status: app.status },
          after: { status: 'DOCS_REVIEW', message: body.message, requiredSteps: body.requiredSteps },
          changedFields: ['status'],
        });

        return res;
      });

      if (app.user_id) {
        await eventBus.publish('farmer.application.info_requested', {
          userId: app.user_id,
          applicationId: id,
          steps: body.requiredSteps ?? [4],
          message: body.message,
        });
      }

      return mapApplicationResponse(updated);
    },
  };
}

export const farmerApplicationsService = createFarmerApplicationsService();
