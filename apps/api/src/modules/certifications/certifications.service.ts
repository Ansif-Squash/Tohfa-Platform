import type { Actor } from '../../auth/requireAuth.js';
import { pool, withTransaction, type Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import {
  certificationsRepo,
  type CertificationRow,
  type CertificationsRepo,
} from './certifications.repo.js';
import type {
  CertificationCreate,
  ListCertificationsQuery,
  UnverifyCertificationBody,
  VerifyCertificationBody,
} from './certifications.schema.js';

/**
 * Calculates days to expiry relative to the current date in Asia/Kolkata timezone.
 * Returns negative if expired.
 */
export function getDaysToExpiry(expiresOnStr: string): number {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const todayIst = formatter.format(new Date()); // YYYY-MM-DD

  const today = new Date(`${todayIst}T00:00:00Z`);
  const expiry = new Date(`${expiresOnStr}T00:00:00Z`);

  const diffMs = expiry.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

function mapCertificationResponse(row: CertificationRow) {
  const daysToExpiry = getDaysToExpiry(row.expires_on);
  const blocksListings = row.verification_status !== 'VERIFIED' || daysToExpiry < 0;

  return {
    id: row.id,
    farmerId: row.farmer_id,
    certType: row.cert_type,
    certNumber: row.cert_number,
    issuingBody: row.issuing_body,
    issuedOn: row.issued_on,
    expiresOn: row.expires_on,
    documentUrl: row.document_url,
    verificationStatus: row.verification_status,
    verifiedAt: row.verified_at?.toISOString() ?? null,
    verifiedBy: row.verified_by,
    verificationNotes: row.verification_notes,
    portalCheckedUrl: row.portal_checked_url,
    daysToExpiry,
    blocksListings,
    createdAt: row.created_at.toISOString(),
  };
}

export interface CertificationsService {
  listMyCertifications(actor: Actor, query: ListCertificationsQuery): Promise<unknown>;
  createCertification(actor: Actor, data: CertificationCreate): Promise<unknown>;
  verifyCertification(
    actor: Actor,
    id: string,
    body: VerifyCertificationBody,
  ): Promise<unknown>;
  unverifyCertification(
    actor: Actor,
    id: string,
    body: UnverifyCertificationBody,
  ): Promise<unknown>;
}

export type TransactionRunner = <T>(fn: (tx: Executor) => Promise<T>) => Promise<T>;

export function createCertificationsService(
  repo: CertificationsRepo = certificationsRepo,
  runTx: TransactionRunner = withTransaction,
): CertificationsService {
  async function resolveFarmerId(actor: Actor): Promise<string> {
    if (actor.farmerId !== null) return actor.farmerId;

    const result = await pool.query<{ id: string }>(
      `SELECT id FROM farmers WHERE user_id = $1 AND deleted_at IS NULL LIMIT 1`,
      [actor.userId],
    );
    const farmerId = result.rows[0]?.id;
    if (farmerId === undefined) {
      throw new AppError('NOT_FOUND', { detail: 'Farmer profile not found for actor.' });
    }
    return farmerId;
  }

  return {
    async listMyCertifications(actor, query) {
      const farmerId = await resolveFarmerId(actor);
      const { items, nextCursor, hasMore } = await repo.listByFarmerId(
        pool,
        farmerId,
        query.limit,
        query.cursor,
      );

      return {
        items: items.map(mapCertificationResponse),
        page: { nextCursor, hasMore },
      };
    },

    async createCertification(actor, data) {
      const farmerId = await resolveFarmerId(actor);

      const cert = await runTx(async (tx) => {
        const created = await repo.createCertification(tx, {
          farmerId,
          certType: data.certType,
          certNumber: data.certNumber,
          issuingBody: data.issuingBody,
          issuedOn: data.issuedOn,
          expiresOn: data.expiresOn,
          documentUrl: data.documentUrl,
        });

        // Recompute market block on write (inside same transaction)
        await repo.recomputeFarmerMarketBlock(
          tx,
          farmerId,
          actor.userId,
          actor.roles[0]?.code,
        );

        return created;
      });

      return mapCertificationResponse(cert);
    },

    async verifyCertification(actor, id, body) {
      const cert = await runTx(async (tx) => {
        const existing = await repo.findById(tx, id);
        if (existing === null) {
          throw new AppError('NOT_FOUND', { detail: 'Certification not found.' });
        }

        const verified = await repo.verifyCertification(
          tx,
          id,
          actor.userId,
          body.note,
          body.portalReference,
        );

        if (verified === null) {
          throw new AppError('NOT_FOUND', { detail: 'Certification not found.' });
        }

        // Recompute market block on write (inside same transaction)
        await repo.recomputeFarmerMarketBlock(
          tx,
          existing.farmer_id,
          actor.userId,
          actor.roles[0]?.code,
        );

        return verified;
      });

      return mapCertificationResponse(cert);
    },

    async unverifyCertification(actor, id, body) {
      const cert = await runTx(async (tx) => {
        const existing = await repo.findById(tx, id);
        if (existing === null) {
          throw new AppError('NOT_FOUND', { detail: 'Certification not found.' });
        }

        const unverified = await repo.unverifyCertification(
          tx,
          id,
          actor.userId,
          body.reason,
        );

        if (unverified === null) {
          throw new AppError('NOT_FOUND', { detail: 'Certification not found.' });
        }

        // Recompute market block on write (inside same transaction)
        await repo.recomputeFarmerMarketBlock(
          tx,
          existing.farmer_id,
          actor.userId,
          actor.roles[0]?.code,
        );

        return unverified;
      });

      return mapCertificationResponse(cert);
    },
  };
}

export const certificationsService = createCertificationsService();
