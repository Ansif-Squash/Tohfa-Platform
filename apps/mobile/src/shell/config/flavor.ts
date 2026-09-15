/**
 * Build flavor identity.
 *
 * WHY PINNING MATTERS, and why it lives here rather than in each entry file:
 *
 * The API asks a user to choose a role only when
 * `roleAssignments.length > 1 && input.roleCode === undefined`
 * (apps/api/src/modules/auth/auth.service.ts). The second half of that
 * condition is the lever. A flavor that always sends a `roleCode` on
 * `POST /auth/login` can never satisfy it, so role selection becomes
 * structurally unreachable in that binary — not merely hidden.
 *
 * That is the property the farmer and customer apps need. A farmer whose
 * account also carries a CUSTOMER role must never be shown a role picker in
 * the farmer app; pinning `RoleCode.FARMER` here is what guarantees it, and
 * src/shell/auth/session.test.ts asserts it against the mirrored condition.
 *
 * The admin flavor pins nothing, because choosing between several admin roles
 * is exactly what its picker is for.
 *
 * Deliberately minimal: no build-time define mechanism (no react-native-config,
 * no Babel transform). Each index.<flavor>.js passes its own `Flavor` to
 * RootShell, so the flavor is a plain value flowing through the app, and this
 * table is the one testable place that maps it to a pinned role.
 */
import { RoleCode } from '@tohfa/shared-types';

/** The three shipped binaries. */
export const Flavor = {
  FARMER: 'farmer',
  CUSTOMER: 'customer',
  ADMIN: 'admin',
} as const;
export type Flavor = (typeof Flavor)[keyof typeof Flavor];

export interface FlavorConfig {
  readonly flavor: Flavor;
  /**
   * Sent as `roleCode` on every login from this flavor. `undefined` means "let
   * the server decide", which is the only way to reach role selection.
   *
   * A required key holding `| undefined` rather than an optional key: under
   * `exactOptionalPropertyTypes` that keeps "pins nothing" an explicit, readable
   * value instead of an absent property a reader has to infer.
   */
  readonly pinnedRoleCode: RoleCode | undefined;
}

export const FLAVOR_CONFIG: Record<Flavor, FlavorConfig> = {
  [Flavor.FARMER]: {
    flavor: Flavor.FARMER,
    pinnedRoleCode: RoleCode.FARMER,
  },
  [Flavor.CUSTOMER]: {
    flavor: Flavor.CUSTOMER,
    pinnedRoleCode: RoleCode.CUSTOMER,
  },
  [Flavor.ADMIN]: {
    flavor: Flavor.ADMIN,
    // The admin console is the one flavor where a role picker is correct.
    pinnedRoleCode: undefined,
  },
};
