import type { Actor } from '../../auth/requireAuth.js';
import { pool, withTransaction, type Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { listingsRepo, type ListingRollup, type ListingRow } from './listings.repo.js';
import type { CreateListingBody, ListListingsQuery, UpdateListingBody } from './listings.schema.js';

export function parseMoneyToPaise(money: string): number {
  return Math.round(Number(money) * 100);
}

export function compareMoney(a: string, b: string): number {
  return parseMoneyToPaise(a) - parseMoneyToPaise(b);
}

export function getTodayKolkata(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export type TransactionRunner = <T>(fn: (tx: Executor) => Promise<T>) => Promise<T>;

export class ListingsService {
  constructor(
    private readonly repo = listingsRepo,
    private readonly runTx: TransactionRunner = withTransaction,
    private readonly dbPool: Executor = pool,
  ) {}

  private async resolveFarmer(db: Executor, actor: Actor): Promise<{ id: string; userId: string; isMarketBlocked: boolean }> {
    let farmer = actor.farmerId ? await this.repo.findFarmerById(db, actor.farmerId) : null;
    if (!farmer) {
      farmer = await this.repo.findFarmerByUserId(db, actor.userId);
    }

    if (!farmer) {
      throw new AppError('FORBIDDEN', {
        detail: 'Authenticated user is not registered as an approved farmer.',
      });
    }

    return farmer;
  }

  async createListing(
    actor: Actor,
    _scope: ResolvedScope,
    body: CreateListingBody,
    _idempotencyKey?: string,
  ): Promise<ListingRow> {
    return this.runTx(async (client) => {
      const farmer = await this.resolveFarmer(client, actor);

      // Gate 1: Certificate Verification and Expiry Check (BR-01, BR-02)
      const certs = await this.repo.getFarmerCertificates(client, farmer.id);

      if (certs.hasExpired && certs.expiredCert) {
        throw new AppError('CERT_EXPIRED', {
          status: 422,
          detail: `NPOP certificate ${certs.expiredCert.certNumber} expired on ${certs.expiredCert.expiresOn}.`,
        });
      }

      if (certs.hasUnverified && certs.unverifiedCert) {
        throw new AppError('CERT_UNVERIFIED', {
          status: 422,
          detail: `Certificate ${certs.unverifiedCert.certNumber} is pending verification.`,
        });
      }

      if (farmer.isMarketBlocked) {
        throw new AppError('CERT_EXPIRED', {
          status: 422,
          detail: 'Farmer market access is currently blocked.',
        });
      }

      // Gate 2: Free-tier Listing Limit Gate (BR-14a, BR-14b)
      const limitsEnabled = await this.repo.getSystemConfig(client, 'free_tier_limits_enabled');
      if (limitsEnabled === true || limitsEnabled === 'true') {
        const limitVal = await this.repo.getSystemConfig(client, 'free_tier_listing_limit');
        const limit = typeof limitVal === 'number' ? limitVal : parseInt(String(limitVal ?? '5'), 10);
        const activeCount = await this.repo.countActiveListings(client, farmer.id);

        if (activeCount >= limit) {
          throw new AppError('FREE_TIER_LIMIT', {
            status: 422,
            detail: `You have reached your active listing limit of ${limit}.`,
          });
        }
      }

      // Gate 3: Reject Grade is Not Sellable
      if (body.grade === 'REJECT') {
        throw new AppError('VALIDATION_FAILED', {
          status: 422,
          detail: 'Produce of grade REJECT may not be listed for sale.',
        });
      }

      // Gate 4: Fair Price Ceiling Check (BR-07a, BR-07b, BR-07c)
      const effectiveDate = body.availableFrom || getTodayKolkata();
      const ceiling = await this.repo.findEffectiveFairPrice(
        client,
        body.cropId,
        body.grade,
        effectiveDate,
      );

      if (!ceiling) {
        throw new AppError('VALIDATION_FAILED', {
          status: 422,
          detail: `No fair price ceiling in effect for this crop and grade on ${effectiveDate}.`,
        });
      }

      const askingPaise = parseMoneyToPaise(body.askingPricePerKg);
      const ceilingPaise = parseMoneyToPaise(ceiling.ceilingPrice);

      if (askingPaise > ceilingPaise) {
        throw new AppError('PRICE_ABOVE_CEILING', {
          status: 422,
          detail: `Asking price ₹${body.askingPricePerKg} exceeds fair price ceiling of ₹${ceiling.ceilingPrice}.`,
          meta: {
            ceilingPrice: ceiling.ceilingPrice,
            attemptedPrice: body.askingPricePerKg,
          },
        });
      }

      // Generate Listing Number and Insert Row with Frozen Certification Badges
      const listingNumber = await this.repo.generateListingNumber(client);

      const listing = await this.repo.insertListing(client, {
        listingNumber,
        farmerId: farmer.id,
        farmId: body.farmId,
        cropId: body.cropId,
        grade: body.grade,
        quantityKg: body.quantityKg,
        askingPricePerKg: body.askingPricePerKg,
        fairPriceId: ceiling.id,
        availableFrom: body.availableFrom,
        photos: body.photos,
        certificationBadges: certs.verifiedBadges,
      });

      return listing;
    });
  }

  async listMyListings(
    actor: Actor,
    _scope: ResolvedScope,
    query: ListListingsQuery,
  ): Promise<{
    items: ListingRow[];
    rollup: ListingRollup;
    page: { nextCursor: string | null; hasMore: boolean };
  }> {
    const farmer = await this.resolveFarmer(this.dbPool, actor);

    const [listingsResult, rollup] = await Promise.all([
      this.repo.listFarmerListings(this.dbPool, farmer.id, {
        status: query.status,
        cursor: query.cursor,
        limit: query.limit,
      }),
      this.repo.getRollupSummary(this.dbPool, farmer.id),
    ]);

    return {
      items: listingsResult.items,
      rollup,
      page: {
        nextCursor: listingsResult.nextCursor,
        hasMore: listingsResult.hasMore,
      },
    };
  }

  async updateListing(
    actor: Actor,
    _scope: ResolvedScope,
    id: string,
    body: UpdateListingBody,
  ): Promise<ListingRow> {
    return this.runTx(async (client) => {
      const farmer = await this.resolveFarmer(client, actor);
      const existing = await this.repo.findListingById(client, id);

      if (!existing || existing.farmerId !== farmer.id) {
        throw new AppError('NOT_FOUND', {
          detail: 'Listing not found.',
        });
      }

      if (existing.status !== 'PENDING_APPROVAL') {
        throw new AppError('LISTING_NOT_PENDING', {
          detail: `Only listings in PENDING_APPROVAL status may be edited (current status: ${existing.status}).`,
        });
      }

      // If asking price is being modified, re-validate against ceiling
      if (body.askingPricePerKg !== undefined) {
        const effectiveDate = body.availableFrom || existing.availableFrom || getTodayKolkata();
        const ceiling = await this.repo.findEffectiveFairPrice(
          client,
          existing.cropId,
          existing.grade,
          effectiveDate,
        );

        if (ceiling) {
          const askingPaise = parseMoneyToPaise(body.askingPricePerKg);
          const ceilingPaise = parseMoneyToPaise(ceiling.ceilingPrice);

          if (askingPaise > ceilingPaise) {
            throw new AppError('PRICE_ABOVE_CEILING', {
              status: 422,
              detail: `Asking price ₹${body.askingPricePerKg} exceeds fair price ceiling of ₹${ceiling.ceilingPrice}.`,
              meta: {
                ceilingPrice: ceiling.ceilingPrice,
                attemptedPrice: body.askingPricePerKg,
              },
            });
          }
        }
      }

      const version = body.version ?? existing.version;
      const updated = await this.repo.updateListing(client, id, version, body);

      if (!updated) {
        throw new AppError('CONFLICT', {
          detail: 'The listing was modified by another request. Please refresh and try again.',
        });
      }

      return updated;
    });
  }

  async withdrawListing(
    actor: Actor,
    _scope: ResolvedScope,
    id: string,
    version?: number,
  ): Promise<ListingRow> {
    return this.runTx(async (client) => {
      const farmer = await this.resolveFarmer(client, actor);
      const existing = await this.repo.findListingById(client, id);

      if (!existing || existing.farmerId !== farmer.id) {
        throw new AppError('NOT_FOUND', {
          detail: 'Listing not found.',
        });
      }

      if (existing.status !== 'PENDING_APPROVAL') {
        throw new AppError('LISTING_NOT_PENDING', {
          detail: `Only listings in PENDING_APPROVAL status may be withdrawn (current status: ${existing.status}).`,
        });
      }

      const ver = version ?? existing.version;
      const withdrawn = await this.repo.withdrawListing(client, id, ver);

      if (!withdrawn) {
        throw new AppError('CONFLICT', {
          detail: 'The listing was modified by another request. Please refresh and try again.',
        });
      }

      return withdrawn;
    });
  }
}

export const listingsService = new ListingsService();
