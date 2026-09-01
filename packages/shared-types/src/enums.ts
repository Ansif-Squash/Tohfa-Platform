/**
 * Domain enumerations.
 *
 * Pattern: a frozen `as const` object plus a derived union type. This gives us
 * (a) a runtime value list for Zod / validation / DB checks, and (b) a compile
 * time union — without TypeScript's `enum`, which does not survive
 * `isolatedModules` cleanly and produces surprising runtime objects.
 *
 * Every string value here MUST match the corresponding CHECK constraint or
 * enum type in db/migrations. `pnpm rbac:check` covers roles; the rest are
 * covered by migration review.
 */

/** Produce quality grade assigned at warehouse goods-receipt. */
export const Grade = {
  A: 'A',
  B: 'B',
  C: 'C',
  REJECT: 'REJECT',
} as const;
export type Grade = (typeof Grade)[keyof typeof Grade];

/** Farm certification schemes recognised by TOHFA. */
export const CertificationType = {
  ORGANIC: 'ORGANIC',
  NPOP: 'NPOP',
  PGS_INDIA: 'PGS_INDIA',
  GLOBAL_GAP: 'GLOBAL_GAP',
  NATURAL_FARMING: 'NATURAL_FARMING',
  NONE: 'NONE',
} as const;
export type CertificationType = (typeof CertificationType)[keyof typeof CertificationType];

/** Lifecycle of a farmer's produce listing. */
export const ListingStatus = {
  DRAFT: 'DRAFT',
  PENDING: 'PENDING',
  COUNTER_OFFERED: 'COUNTER_OFFERED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED',
  WITHDRAWN: 'WITHDRAWN',
} as const;
export type ListingStatus = (typeof ListingStatus)[keyof typeof ListingStatus];

/** State of a single counter-offer round between admin and farmer. */
export const CounterOfferStatus = {
  SENT: 'SENT',
  ACCEPTED: 'ACCEPTED',
  DECLINED: 'DECLINED',
  COUNTERED: 'COUNTERED',
  EXPIRED: 'EXPIRED',
} as const;
export type CounterOfferStatus = (typeof CounterOfferStatus)[keyof typeof CounterOfferStatus];

/** Customer order lifecycle. */
export const OrderStatus = {
  CART: 'CART',
  PLACED: 'PLACED',
  CONFIRMED: 'CONFIRMED',
  PACKED: 'PACKED',
  DISPATCHED: 'DISPATCHED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
  RETURNED: 'RETURNED',
  REFUNDED: 'REFUNDED',
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

/** Which sales channel a batch's stock was allocated to. */
export const AllocationChannel = {
  RETAIL: 'RETAIL',
  BULK: 'BULK',
  INSTITUTIONAL: 'INSTITUTIONAL',
  EXPORT: 'EXPORT',
  RESERVE: 'RESERVE',
} as const;
export type AllocationChannel = (typeof AllocationChannel)[keyof typeof AllocationChannel];

/** Wallet ledger entry kinds. Signed amount is stored separately. */
export const WalletTxnType = {
  TOPUP_ONLINE: 'TOPUP_ONLINE',
  TOPUP_CASH: 'TOPUP_CASH',
  ORDER_DEBIT: 'ORDER_DEBIT',
  ORDER_REFUND: 'ORDER_REFUND',
  PAYOUT_CREDIT: 'PAYOUT_CREDIT',
  PAYOUT_WITHDRAWAL: 'PAYOUT_WITHDRAWAL',
  ADJUSTMENT: 'ADJUSTMENT',
} as const;
export type WalletTxnType = (typeof WalletTxnType)[keyof typeof WalletTxnType];

/** Farmer onboarding application status. */
export const ApplicationStatus = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  FIELD_VERIFICATION: 'FIELD_VERIFICATION',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  WITHDRAWN: 'WITHDRAWN',
} as const;
export type ApplicationStatus = (typeof ApplicationStatus)[keyof typeof ApplicationStatus];

/**
 * Role codes. MUST stay identical to `roles[].code` in docs/rbac.json —
 * scripts/check-rbac-drift.ts fails the build if they diverge.
 */
export const RoleCode = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  TOHFA_ADMIN: 'TOHFA_ADMIN',
  FARMER_ADMIN: 'FARMER_ADMIN',
  MAIN_WH_ADMIN: 'MAIN_WH_ADMIN',
  SUB_WH_ADMIN: 'SUB_WH_ADMIN',
  FARMER: 'FARMER',
  CUSTOMER: 'CUSTOMER',
} as const;
export type RoleCode = (typeof RoleCode)[keyof typeof RoleCode];

/**
 * Scope levels, mirroring docs/rbac.json `scopeLevels`.
 *  all         - unrestricted
 *  own         - restricted to rows the actor owns / is assigned to
 *  view        - read-only, no mutation
 *  conditional - allowed except where the permission's `predicate` forbids it
 *  none        - denied
 */
export const ScopeLevel = {
  ALL: 'all',
  OWN: 'own',
  VIEW: 'view',
  CONDITIONAL: 'conditional',
  NONE: 'none',
} as const;
export type ScopeLevel = (typeof ScopeLevel)[keyof typeof ScopeLevel];

/** Invoice classification. */
export const InvoiceType = {
  SALE_RETAIL: 'SALE_RETAIL',
  SALE_B2B: 'SALE_B2B',
  PURCHASE_FARMER: 'PURCHASE_FARMER',
  PAYOUT: 'PAYOUT',
  SUBSCRIPTION: 'SUBSCRIPTION',
} as const;
export type InvoiceType = (typeof InvoiceType)[keyof typeof InvoiceType];

/** Invoice lifecycle state. */
export const InvoiceStatus = {
  DRAFT: 'DRAFT',
  ISSUED: 'ISSUED',
  CANCELLED: 'CANCELLED',
  CREDIT_NOTED: 'CREDIT_NOTED',
} as const;
export type InvoiceStatus = (typeof InvoiceStatus)[keyof typeof InvoiceStatus];

/** Every enum's runtime value list, handy for Zod `z.enum(...)`. */
export const enumValues = {
  Grade: Object.values(Grade),
  CertificationType: Object.values(CertificationType),
  ListingStatus: Object.values(ListingStatus),
  CounterOfferStatus: Object.values(CounterOfferStatus),
  OrderStatus: Object.values(OrderStatus),
  AllocationChannel: Object.values(AllocationChannel),
  WalletTxnType: Object.values(WalletTxnType),
  ApplicationStatus: Object.values(ApplicationStatus),
  InvoiceType: Object.values(InvoiceType),
  InvoiceStatus: Object.values(InvoiceStatus),
  RoleCode: Object.values(RoleCode),
  ScopeLevel: Object.values(ScopeLevel),
} as const;
