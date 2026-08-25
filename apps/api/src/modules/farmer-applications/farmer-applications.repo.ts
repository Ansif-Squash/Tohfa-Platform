import type { Executor } from '../../db/pool.js';

export type ApplicationStatus =
  | 'SUBMITTED'
  | 'DOCS_REVIEW'
  | 'FARM_VERIFICATION'
  | 'AUDIT'
  | 'APPROVED'
  | 'REJECTED';

export interface FarmerApplicationRow {
  id: string;
  mobile: string;
  full_name: string;
  preferred_locale: 'en' | 'ta';
  status: ApplicationStatus;
  is_draft: boolean;
  current_step: number;
  completed_steps: number[];
  step1_personal: Record<string, unknown>;
  step2_farm_details: Record<string, unknown>;
  step3_location: Record<string, unknown>;
  step4_documents: Record<string, unknown>;
  user_id: string | null;
  farmer_id: string | null;
  submitted_at: Date | null;
  created_at: Date;
  updated_at: Date | null;
}

export interface StatusHistoryRow {
  id: string;
  application_id: string;
  from_status: ApplicationStatus | null;
  to_status: ApplicationStatus;
  actor_id: string | null;
  note: string | null;
  created_at: Date;
}

export interface FarmerProfileRow {
  id: string;
  user_id: string;
  tohfa_farmer_id: string;
  full_name: string;
  mobile: string;
  preferred_locale: 'en' | 'ta';
  zone_id: string | null;
  zone_name: string | null;
  farming_experience_years: number | null;
  address_line1: string | null;
  village: string | null;
  taluk: string | null;
  district: string;
  aadhaar_last4: string | null;
  kyc_status: string;
  application_status: ApplicationStatus;
  overall_rating: number | null;
  is_market_blocked: boolean;
  market_block_reason: string | null;
  created_at: Date;
}

export interface FarmerApplicationsRepo {
  createApplication(
    db: Executor,
    params: {
      mobile: string;
      fullName: string;
      preferredLocale: 'en' | 'ta';
      userId?: string | undefined;
    },
  ): Promise<FarmerApplicationRow>;
  findById(db: Executor, id: string): Promise<FarmerApplicationRow | null>;
  findLiveByMobile(db: Executor, mobile: string): Promise<FarmerApplicationRow | null>;
  updateStepData(
    db: Executor,
    id: string,
    step: number,
    stepData: Record<string, unknown>,
    completedSteps: number[],
  ): Promise<FarmerApplicationRow | null>;
  transitionStatus(
    db: Executor,
    id: string,
    fromStatus: ApplicationStatus | null,
    toStatus: ApplicationStatus,
    actorId?: string | undefined,
    note?: string | undefined,
  ): Promise<FarmerApplicationRow>;
  getStatusHistory(db: Executor, applicationId: string): Promise<StatusHistoryRow[]>;
  findFarmerByUserId(db: Executor, userId: string): Promise<FarmerProfileRow | null>;
  findFarmerById(db: Executor, farmerId: string): Promise<FarmerProfileRow | null>;
  updateFarmerProfile(
    db: Executor,
    farmerId: string,
    updates: {
      fullName?: string | undefined;
      farmingExperienceYears?: number | undefined;
      addressLine1?: string | undefined;
      preferredLocale?: 'en' | 'ta' | undefined;
    },
  ): Promise<FarmerProfileRow | null>;
  allocateNextTohfaFarmerId(db: Executor, year: number): Promise<string>;
}

export const farmerApplicationsRepo: FarmerApplicationsRepo = {
  async createApplication(db, params) {
    const result = await db.query<FarmerApplicationRow>(
      `INSERT INTO farmer_applications (mobile, full_name, preferred_locale, user_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, mobile, full_name, preferred_locale, status, is_draft,
                 current_step, completed_steps, step1_personal, step2_farm_details,
                 step3_location, step4_documents, user_id, farmer_id, submitted_at,
                 created_at, updated_at`,
      [params.mobile, params.fullName, params.preferredLocale, params.userId ?? null],
    );
    return result.rows[0]!;
  },

  async findById(db, id) {
    const result = await db.query<FarmerApplicationRow>(
      `SELECT id, mobile, full_name, preferred_locale, status, is_draft,
              current_step, completed_steps, step1_personal, step2_farm_details,
              step3_location, step4_documents, user_id, farmer_id, submitted_at,
              created_at, updated_at
         FROM farmer_applications
        WHERE id = $1 AND deleted_at IS NULL
        LIMIT 1`,
      [id],
    );
    return result.rows[0] ?? null;
  },

  async findLiveByMobile(db, mobile) {
    const result = await db.query<FarmerApplicationRow>(
      `SELECT id, mobile, full_name, preferred_locale, status, is_draft,
              current_step, completed_steps, step1_personal, step2_farm_details,
              step3_location, step4_documents, user_id, farmer_id, submitted_at,
              created_at, updated_at
         FROM farmer_applications
        WHERE mobile = $1 AND status NOT IN ('APPROVED', 'REJECTED') AND deleted_at IS NULL
        LIMIT 1`,
      [mobile],
    );
    return result.rows[0] ?? null;
  },

  async updateStepData(db, id, step, stepData, completedSteps) {
    const columnMap: Record<number, string> = {
      1: 'step1_personal',
      2: 'step2_farm_details',
      3: 'step3_location',
      4: 'step4_documents',
    };

    const targetColumn = columnMap[step];
    if (targetColumn !== undefined) {
      const result = await db.query<FarmerApplicationRow>(
        `UPDATE farmer_applications
            SET ${targetColumn} = $2::jsonb,
                completed_steps = $3::smallint[],
                current_step = CASE WHEN current_step < $4 THEN $4 ELSE current_step END,
                updated_at = now()
          WHERE id = $1 AND deleted_at IS NULL
          RETURNING id, mobile, full_name, preferred_locale, status, is_draft,
                    current_step, completed_steps, step1_personal, step2_farm_details,
                    step3_location, step4_documents, user_id, farmer_id, submitted_at,
                    created_at, updated_at`,
        [id, JSON.stringify(stepData), completedSteps, Math.min(step + 1, 5)],
      );
      return result.rows[0] ?? null;
    }

    const result = await db.query<FarmerApplicationRow>(
      `UPDATE farmer_applications
          SET completed_steps = $2::smallint[],
              updated_at = now()
        WHERE id = $1 AND deleted_at IS NULL
        RETURNING id, mobile, full_name, preferred_locale, status, is_draft,
                  current_step, completed_steps, step1_personal, step2_farm_details,
                  step3_location, step4_documents, user_id, farmer_id, submitted_at,
                  created_at, updated_at`,
      [id, completedSteps],
    );
    return result.rows[0] ?? null;
  },

  async transitionStatus(db, id, fromStatus, toStatus, actorId, note) {
    const isSubmitted = toStatus === 'SUBMITTED' || toStatus === 'DOCS_REVIEW';
    const result = await db.query<FarmerApplicationRow>(
      `UPDATE farmer_applications
          SET status = $2,
              is_draft = CASE WHEN $3 = true THEN false ELSE is_draft END,
              submitted_at = CASE WHEN $3 = true AND submitted_at IS NULL THEN now() ELSE submitted_at END,
              updated_at = now()
        WHERE id = $1
        RETURNING id, mobile, full_name, preferred_locale, status, is_draft,
                  current_step, completed_steps, step1_personal, step2_farm_details,
                  step3_location, step4_documents, user_id, farmer_id, submitted_at,
                  created_at, updated_at`,
      [id, toStatus, isSubmitted],
    );

    // Record in history log
    await db.query(
      `INSERT INTO farmer_application_status_history (application_id, from_status, to_status, actor_id, note)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, fromStatus ?? null, toStatus, actorId ?? null, note ?? null],
    );

    return result.rows[0]!;
  },

  async getStatusHistory(db, applicationId) {
    const result = await db.query<StatusHistoryRow>(
      `SELECT id, application_id, from_status, to_status, actor_id, note, created_at
         FROM farmer_application_status_history
        WHERE application_id = $1
        ORDER BY created_at ASC`,
      [applicationId],
    );
    return result.rows;
  },

  async findFarmerByUserId(db, userId) {
    const result = await db.query<FarmerProfileRow>(
      `SELECT f.id, f.user_id, f.tohfa_farmer_id, u.full_name, u.mobile,
              u.preferred_locale, f.zone_id, z.name AS zone_name,
              f.farming_experience_years, f.address_line1, f.village,
              f.taluk, f.district, f.aadhaar_last4, f.kyc_status,
              f.application_status, f.overall_rating, f.is_market_blocked,
              f.market_block_reason, f.created_at
         FROM farmers f
         JOIN users u ON u.id = f.user_id
    LEFT JOIN zones z ON z.id = f.zone_id
        WHERE f.user_id = $1 AND f.deleted_at IS NULL
        LIMIT 1`,
      [userId],
    );
    return result.rows[0] ?? null;
  },

  async findFarmerById(db, farmerId) {
    const result = await db.query<FarmerProfileRow>(
      `SELECT f.id, f.user_id, f.tohfa_farmer_id, u.full_name, u.mobile,
              u.preferred_locale, f.zone_id, z.name AS zone_name,
              f.farming_experience_years, f.address_line1, f.village,
              f.taluk, f.district, f.aadhaar_last4, f.kyc_status,
              f.application_status, f.overall_rating, f.is_market_blocked,
              f.market_block_reason, f.created_at
         FROM farmers f
         JOIN users u ON u.id = f.user_id
    LEFT JOIN zones z ON z.id = f.zone_id
        WHERE f.id = $1 AND f.deleted_at IS NULL
        LIMIT 1`,
      [farmerId],
    );
    return result.rows[0] ?? null;
  },

  async updateFarmerProfile(db, farmerId, updates) {
    if (updates.fullName !== undefined || updates.preferredLocale !== undefined) {
      await db.query(
        `UPDATE users
            SET full_name = COALESCE($2, full_name),
                preferred_locale = COALESCE($3, preferred_locale),
                updated_at = now()
          WHERE id = (SELECT user_id FROM farmers WHERE id = $1)`,
        [farmerId, updates.fullName ?? null, updates.preferredLocale ?? null],
      );
    }

    const result = await db.query<FarmerProfileRow>(
      `UPDATE farmers
          SET farming_experience_years = COALESCE($2, farming_experience_years),
              address_line1 = COALESCE($3, address_line1),
              updated_at = now()
        WHERE id = $1
        RETURNING id`,
      [farmerId, updates.farmingExperienceYears ?? null, updates.addressLine1 ?? null],
    );

    if (result.rows[0] === undefined) return null;
    return this.findFarmerById(db, farmerId);
  },

  async allocateNextTohfaFarmerId(db, year) {
    // Transactional allocation using lock to guarantee no collisions
    const prefix = `TOHFA-F-${year}-%`;
    const result = await db.query<{ next_val: string }>(
      `SELECT COALESCE(MAX(NULLIF(regexp_replace(tohfa_farmer_id, '^TOHFA-F-\\d{4}-', ''), '')::integer), 0) + 1 AS next_val
         FROM farmers
        WHERE tohfa_farmer_id LIKE $1`,
      [prefix],
    );

    const nextNumber = Number(result.rows[0]?.next_val ?? '1');
    const padded = String(nextNumber).padStart(4, '0');
    return `TOHFA-F-${year}-${padded}`;
  },
};
