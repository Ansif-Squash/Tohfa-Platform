import { writeAuditLog, type AuditActorType } from '../../audit/auditLog.js';
import type { Executor } from '../../db/pool.js';
import type { CertificationType, VerificationStatus } from './certifications.schema.js';

export interface CertificationRow {
  id: string;
  farmer_id: string;
  farm_id: string | null;
  cert_type: CertificationType;
  cert_number: string;
  issuing_body: string;
  issued_on: string;
  expires_on: string;
  document_id: string | null;
  document_url: string | null;
  verification_status: VerificationStatus;
  verified_by: string | null;
  verified_at: Date | null;
  verification_notes: string | null;
  portal_checked_url: string | null;
  created_at: Date;
  updated_at: Date | null;
}

export interface CreateCertificationParams {
  farmerId: string;
  certType: CertificationType;
  certNumber: string;
  issuingBody: string;
  issuedOn: string;
  expiresOn: string;
  documentUrl?: string | undefined;
  documentId?: string | undefined;
}

export interface RecomputeResult {
  farmerId: string;
  isMarketBlocked: boolean;
  marketBlockReason: string | null;
  changed: boolean;
}

export interface CertificationsRepo {
  createCertification(db: Executor, params: CreateCertificationParams): Promise<CertificationRow>;
  findById(db: Executor, id: string): Promise<CertificationRow | null>;
  listByFarmerId(
    db: Executor,
    farmerId: string,
    limit: number,
    cursor?: string | undefined,
  ): Promise<{ items: CertificationRow[]; nextCursor: string | null; hasMore: boolean }>;
  verifyCertification(
    db: Executor,
    id: string,
    adminUserId: string,
    notes?: string | undefined,
    portalUrl?: string | undefined,
  ): Promise<CertificationRow | null>;
  unverifyCertification(
    db: Executor,
    id: string,
    adminUserId: string,
    reason: string,
  ): Promise<CertificationRow | null>;
  recomputeFarmerMarketBlock(
    db: Executor,
    farmerId: string,
    actorId?: string | null | undefined,
    actorRole?: string | undefined,
    actorType?: AuditActorType | undefined,
  ): Promise<RecomputeResult>;
  getAllActiveFarmerIds(db: Executor): Promise<string[]>;
}

export const certificationsRepo: CertificationsRepo = {
  async createCertification(db, params) {
    let documentId = params.documentId ?? null;

    // If documentUrl is given but no documentId, create farmer_documents row
    if (documentId === null && params.documentUrl !== undefined) {
      const docResult = await db.query<{ id: string }>(
        `INSERT INTO farmer_documents (farmer_id, doc_type, file_url, verification_status)
         VALUES ($1, 'CERTIFICATE', $2, 'UNVERIFIED')
         RETURNING id`,
        [params.farmerId, params.documentUrl],
      );
      documentId = docResult.rows[0]?.id ?? null;
    }

    const result = await db.query<CertificationRow>(
      `INSERT INTO certifications (
         farmer_id, cert_type, cert_number, issuing_body,
         issued_on, expires_on, document_id, verification_status
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'UNVERIFIED')
       RETURNING id, farmer_id, farm_id, cert_type, cert_number, issuing_body,
                 issued_on::text, expires_on::text, document_id,
                 $8::text AS document_url, verification_status, verified_by,
                 verified_at, verification_notes, portal_checked_url,
                 created_at, updated_at`,
      [
        params.farmerId,
        params.certType,
        params.certNumber,
        params.issuingBody,
        params.issuedOn,
        params.expiresOn,
        documentId,
        params.documentUrl ?? null,
      ],
    );

    return result.rows[0]!;
  },

  async findById(db, id) {
    const result = await db.query<CertificationRow>(
      `SELECT c.id, c.farmer_id, c.farm_id, c.cert_type, c.cert_number, c.issuing_body,
              c.issued_on::text, c.expires_on::text, c.document_id,
              fd.file_url AS document_url, c.verification_status, c.verified_by,
              c.verified_at, c.verification_notes, c.portal_checked_url,
              c.created_at, c.updated_at
         FROM certifications c
    LEFT JOIN farmer_documents fd ON fd.id = c.document_id
        WHERE c.id = $1 AND c.deleted_at IS NULL
        LIMIT 1`,
      [id],
    );
    return result.rows[0] ?? null;
  },

  async listByFarmerId(db, farmerId, limit, cursor) {
    const values: unknown[] = [farmerId, limit + 1];
    let whereCursor = '';

    if (cursor !== undefined && cursor.length > 0) {
      values.push(cursor);
      whereCursor = `AND c.id < $3`;
    }

    const result = await db.query<CertificationRow>(
      `SELECT c.id, c.farmer_id, c.farm_id, c.cert_type, c.cert_number, c.issuing_body,
              c.issued_on::text, c.expires_on::text, c.document_id,
              fd.file_url AS document_url, c.verification_status, c.verified_by,
              c.verified_at, c.verification_notes, c.portal_checked_url,
              c.created_at, c.updated_at
         FROM certifications c
    LEFT JOIN farmer_documents fd ON fd.id = c.document_id
        WHERE c.farmer_id = $1 AND c.deleted_at IS NULL
              ${whereCursor}
        ORDER BY c.created_at DESC, c.id DESC
        LIMIT $2`,
      values,
    );

    const hasMore = result.rows.length > limit;
    const items = hasMore ? result.rows.slice(0, limit) : result.rows;
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1]!.id : null;

    return { items, nextCursor, hasMore };
  },

  async verifyCertification(db, id, adminUserId, notes, portalUrl) {
    const result = await db.query<CertificationRow>(
      `UPDATE certifications
          SET verification_status = 'VERIFIED',
              verified_by = $2,
              verified_at = now(),
              verification_notes = $3,
              portal_checked_url = $4,
              updated_at = now()
        WHERE id = $1 AND deleted_at IS NULL
        RETURNING id, farmer_id, farm_id, cert_type, cert_number, issuing_body,
                  issued_on::text, expires_on::text, document_id,
                  verification_status, verified_by, verified_at,
                  verification_notes, portal_checked_url, created_at, updated_at`,
      [id, adminUserId, notes ?? null, portalUrl ?? null],
    );

    return result.rows[0] ?? null;
  },

  async unverifyCertification(db, id, adminUserId, reason) {
    const result = await db.query<CertificationRow>(
      `UPDATE certifications
          SET verification_status = 'REJECTED',
              verified_by = $2,
              verified_at = now(),
              verification_notes = $3,
              updated_at = now()
        WHERE id = $1 AND deleted_at IS NULL
        RETURNING id, farmer_id, farm_id, cert_type, cert_number, issuing_body,
                  issued_on::text, expires_on::text, document_id,
                  verification_status, verified_by, verified_at,
                  verification_notes, portal_checked_url, created_at, updated_at`,
      [id, adminUserId, reason],
    );

    return result.rows[0] ?? null;
  },

  /**
   * BR-01, BR-02: Single shared market block recomputation function.
   * Compares certificate expiry against today in Asia/Kolkata timezone.
   */
  async recomputeFarmerMarketBlock(db, farmerId, actorId, actorRole, actorType = 'USER') {
    // 1. Fetch farmer's current state
    const farmerRes = await db.query<{
      is_market_blocked: boolean;
      market_block_reason: string | null;
    }>(
      `SELECT is_market_blocked, market_block_reason
         FROM farmers
        WHERE id = $1
        LIMIT 1`,
      [farmerId],
    );

    const farmer = farmerRes.rows[0];
    if (farmer === undefined) {
      throw new Error(`Farmer ${farmerId} not found for market block recomputation.`);
    }

    // 2. Count valid unexpired verified certificates (using Asia/Kolkata date)
    const countRes = await db.query<{ valid_count: string; total_count: string; verified_count: string }>(
      `SELECT
         COUNT(*) FILTER (
           WHERE verification_status = 'VERIFIED'
             AND expires_on >= (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::date
         ) AS valid_count,
         COUNT(*) AS total_count,
         COUNT(*) FILTER (WHERE verification_status = 'VERIFIED') AS verified_count
       FROM certifications
      WHERE farmer_id = $1 AND deleted_at IS NULL`,
      [farmerId],
    );

    const validCount = Number(countRes.rows[0]?.valid_count ?? '0');
    const totalCount = Number(countRes.rows[0]?.total_count ?? '0');
    const verifiedCount = Number(countRes.rows[0]?.verified_count ?? '0');

    let newIsBlocked = true;
    let newReason: string | null = null;

    if (validCount > 0) {
      newIsBlocked = false;
      newReason = null;
    } else if (totalCount === 0) {
      newIsBlocked = true;
      newReason = 'No organic certifications uploaded (BR-01, BR-02)';
    } else if (verifiedCount > 0 && validCount === 0) {
      newIsBlocked = true;
      newReason = 'All organic certifications have expired (BR-01)';
    } else {
      newIsBlocked = true;
      newReason = 'Organic certifications are pending manual admin verification (BR-02)';
    }

    const stateChanged = farmer.is_market_blocked !== newIsBlocked;

    // 3. Update farmer if changed or update evaluation timestamp
    await db.query(
      `UPDATE farmers
          SET is_market_blocked = $2,
              market_block_reason = $3,
              market_block_evaluated_at = now(),
              updated_at = now()
        WHERE id = $1`,
      [farmerId, newIsBlocked, newReason],
    );

    // 4. Record in append-only audit trail if state changed
    if (stateChanged) {
      await writeAuditLog(db, {
        actorId: actorId ?? null,
        actorType,
        ...(actorRole !== undefined ? { actorRole } : {}),
        actionCode: newIsBlocked ? 'certification.block_listings' : 'certification.unblock_listings',
        entityType: 'farmer',
        entityId: farmerId,
        before: {
          isMarketBlocked: farmer.is_market_blocked,
          marketBlockReason: farmer.market_block_reason,
        },
        after: {
          isMarketBlocked: newIsBlocked,
          marketBlockReason: newReason,
        },
        changedFields: ['is_market_blocked', 'market_block_reason'],
      });
    }

    return {
      farmerId,
      isMarketBlocked: newIsBlocked,
      marketBlockReason: newReason,
      changed: stateChanged,
    };
  },

  async getAllActiveFarmerIds(db) {
    const result = await db.query<{ id: string }>(
      `SELECT id FROM farmers WHERE deleted_at IS NULL ORDER BY created_at ASC`,
    );
    return result.rows.map((r) => r.id);
  },
};
