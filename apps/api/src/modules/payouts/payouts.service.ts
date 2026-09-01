import { RoleCode } from '@tohfa/shared-types';
import type { Actor } from '../../auth/requireAuth.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { pool, withTransaction } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import { writeAuditLog } from '../../audit/auditLog.js';
import { payoutsRepo, type PayoutRepo } from './payouts.repo.js';
import type {
  PayoutDue,
  PayoutDuesTotals,
  PayoutDuesQuery,
  PayoutResponse,
  CreatePayoutInput,
  ApprovePayoutInput,
} from './payouts.schema.js';

// ---------------------------------------------------------------------------
// BR-31: dual-approval threshold
// ---------------------------------------------------------------------------
const DUAL_APPROVAL_THRESHOLD = 10_000.00;

// ---------------------------------------------------------------------------
// Service interface
// ---------------------------------------------------------------------------

export interface PayoutsService {
  listPayoutDues(
    actor: Actor,
    scope: ResolvedScope,
    query: PayoutDuesQuery,
  ): Promise<{ items: PayoutDue[]; page: { nextCursor: string | null; hasMore: boolean }; totals: PayoutDuesTotals }>;

  createPayout(
    actor: Actor,
    scope: ResolvedScope,
    input: CreatePayoutInput,
    idempotencyKey?: string,
  ): Promise<PayoutResponse>;

  approvePayout(
    actor: Actor,
    scope: ResolvedScope,
    payoutId: string,
    input: ApprovePayoutInput,
    idempotencyKey?: string,
  ): Promise<PayoutResponse>;
}

// ---------------------------------------------------------------------------
// Helper: map DB row → response
// ---------------------------------------------------------------------------

function toResponse(
  payout: any,
  approvals: Array<{ approver_id: string; approved_at: Date }>,
): PayoutResponse {
  return {
    id: payout.id,
    payoutNumber: payout.payout_number,
    farmerId: payout.farmer_id,
    farmerName: payout.farmer_name ?? '',
    amount: payout.amount,
    mode: payout.mode,
    status: payout.status,
    requiresDualApproval: payout.requires_dual_approval,
    initiatedBy: payout.initiated_by,
    approvedBy: approvals.map((a) => a.approver_id),
    approvedAt: payout.released_at
      ? new Date(payout.released_at).toISOString()
      : approvals.length > 0
        ? approvals[approvals.length - 1]!.approved_at.toISOString()
        : null,
    gatewayPayoutId: payout.gateway_payout_id ?? null,
    failureReason: payout.failure_reason ?? null,
    paidAt: payout.paid_at ? new Date(payout.paid_at).toISOString() : null,
    remarks: payout.remarks ?? null,
    createdAt: new Date(payout.created_at).toISOString(),
    updatedAt: payout.updated_at ? new Date(payout.updated_at).toISOString() : null,
  };
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createPayoutsService(opts: { repo?: PayoutRepo } = {}): PayoutsService {
  const repo = opts.repo ?? payoutsRepo;
  const db = pool;

  return {
    // -------------------------------------------------------------------
    // GET /admin/payout-dues
    // -------------------------------------------------------------------
    async listPayoutDues(_actor, _scope, query) {
      const { items, totals, nextCursor } = await repo.listPayoutDues(db, query);
      return {
        items,
        page: { nextCursor, hasMore: nextCursor !== null },
        totals,
      };
    },

    // -------------------------------------------------------------------
    // POST /admin/payouts  (BR-31)
    // -------------------------------------------------------------------
    async createPayout(actor, _scope, input, idempotencyKey) {
      // Validate farmer exists
      const farmerName = await repo.getFarmerName(db, input.farmerId);
      if (!farmerName) {
        throw new AppError('NOT_FOUND', {
          status: 404,
          detail: `Farmer ${input.farmerId} not found.`,
        });
      }

      // Validate amount is positive
      const amountNum = parseFloat(input.amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        throw new AppError('BAD_REQUEST', {
          status: 422,
          detail: 'Payout amount must be a positive number.',
        });
      }

      const requiresDualApproval = amountNum > DUAL_APPROVAL_THRESHOLD;

      let result: { payout: any; approvals: any[] };

      await withTransaction(async (tx) => {
        result = await repo.createPayout(tx, {
          farmerId: input.farmerId,
          amount: input.amount,
          mode: input.mode,
          initiatedBy: actor.userId,
          ...(input.bankAccountId !== undefined ? { bankAccountId: input.bankAccountId } : {}),
          ...(input.dueIds !== undefined ? { dueIds: input.dueIds } : {}),
          ...(input.remarks !== undefined ? { remarks: input.remarks } : {}),
          ...(idempotencyKey !== undefined ? { idempotencyKey } : {}),
        });

        const payout = result!.payout;

        // For amounts ≤ 10,000: approve immediately (single-approval path)
        if (!requiresDualApproval) {
          await repo.updatePayoutStatus(tx, {
            payoutId: payout.id,
            status: 'APPROVED',
            releasedBy: actor.userId,
            releasedAt: new Date(),
          });
          payout.status = 'APPROVED';
          payout.released_by = actor.userId;
          payout.released_at = new Date();
        } else {
          // Amount > 10,000 → PENDING_APPROVAL, requires second Super Admin
          await repo.updatePayoutStatus(tx, {
            payoutId: payout.id,
            status: 'PENDING_APPROVAL',
          });
          payout.status = 'PENDING_APPROVAL';
        }

        await writeAuditLog(tx, {
          actorId: actor.userId,
          actionCode: 'payout.farmer.initiate',
          entityType: 'payouts',
          entityId: payout.id,
          after: {
            amount: input.amount,
            farmerId: input.farmerId,
            requiresDualApproval,
            status: payout.status,
          },
        });
      });

      // Fetch final state with farmer name
      const final = await repo.findPayoutById(db, result!.payout.id);
      return toResponse(final!.payout, final!.approvals);
    },

    // -------------------------------------------------------------------
    // POST /admin/payouts/{id}/approve  (BR-31)
    // -------------------------------------------------------------------
    async approvePayout(actor, _scope, payoutId, input, _idempotencyKey) {
      const existing = await repo.findPayoutById(db, payoutId);
      if (!existing) {
        throw new AppError('NOT_FOUND', {
          status: 404,
          detail: `Payout ${payoutId} not found.`,
        });
      }

      const { payout, approvals } = existing;

      // Only PENDING_APPROVAL payouts can be approved here
      if (payout.status !== 'PENDING_APPROVAL') {
        throw new AppError('INVALID_STATE_TRANSITION', {
          status: 409,
          detail: `Payout is in status ${payout.status}; only PENDING_APPROVAL payouts can be approved.`,
        });
      }

      // BR-31b: initiator cannot approve their own payout
      if (payout.initiated_by === actor.userId) {
        throw new AppError('SAME_ACTOR_APPROVAL', {
          status: 403,
          detail: `You initiated payout ${payout.payout_number}; a different approver is required (BR-31b).`,
        });
      }

      // BR-31d: already approved by this actor
      const alreadyApproved = approvals.some((a) => a.approver_id === actor.userId);
      if (alreadyApproved) {
        throw new AppError('SAME_ACTOR_APPROVAL', {
          status: 403,
          detail: `You have already provided an approval for payout ${payout.payout_number}.`,
        });
      }

      // For dual-approval payouts, second approver must be SUPER_ADMIN
      const isSuperAdmin = actor.roles.some((r) => r.code === RoleCode.SUPER_ADMIN);
      if (!isSuperAdmin) {
        throw new AppError('FORBIDDEN', {
          status: 403,
          detail: 'Approvals for payouts above ₹10,000 require Super Admin role (BR-31).',
        });
      }

      let updatedApprovals: any[];

      await withTransaction(async (tx) => {
        updatedApprovals = await repo.addApproval(tx, {
          payoutId,
          approverId: actor.userId,
          approverRoleCode: actor.roles[0]?.code ?? 'SUPER_ADMIN',
          ...(input.note !== undefined ? { note: input.note } : {}),
        });

        // Transition to APPROVED
        await repo.updatePayoutStatus(tx, {
          payoutId,
          status: 'APPROVED',
          releasedBy: actor.userId,
          releasedAt: new Date(),
        });

        await writeAuditLog(tx, {
          actorId: actor.userId,
          actionCode: 'payout.approve_above_10k',
          entityType: 'payouts',
          entityId: payoutId,
          after: { status: 'APPROVED', approverCount: updatedApprovals!.length },
        });
      });

      const final = await repo.findPayoutById(db, payoutId);
      return toResponse(final!.payout, final!.approvals);
    },
  };
}

// Singleton for production
export const payoutsService = createPayoutsService();
