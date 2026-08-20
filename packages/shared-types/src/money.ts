/**
 * Money.
 *
 * ---------------------------------------------------------------------------
 * WHY FLOATS ARE FORBIDDEN
 * ---------------------------------------------------------------------------
 * IEEE-754 doubles cannot represent most decimal fractions exactly:
 *
 *     0.1 + 0.2            === 0.30000000000000004
 *     (19.99 * 100)        === 1998.9999999999998
 *     4.35 * 100           === 434.99999999999994   // Math.round -> 435, ok
 *     1.005 * 100          === 100.49999999999999   // Math.round -> 100, WRONG
 *
 * On this platform a rounding error is not cosmetic. Farmer payouts, the fair
 * price ceiling comparison, wallet balances, GST on invoices and warehouse
 * settlement all reconcile against each other; a half-paise drift per line item
 * becomes a ledger that does not balance and a payout that cannot be approved.
 *
 * Therefore:
 *   1. All arithmetic happens on INTEGER PAISE (1 rupee = 100 paise) held in a
 *      JS `number`. Paise are safely integral up to 2^53-1 ≈ Rs 90,071,992,547
 *      which is far beyond any single TOHFA transaction.
 *   2. The transport/storage representation is a BRANDED STRING like
 *      `"1234.50"` — strings survive JSON round-trips and Postgres NUMERIC(14,2)
 *      without precision loss. Postgres NUMERIC is returned by `pg` as a string
 *      for exactly this reason; do NOT `parseFloat` it.
 *   3. `Money` is a branded type, so a raw `string` cannot be passed where a
 *      `Money` is expected without going through `parseMoney`/`fromPaise`.
 *
 * Division and percentage splits (GST, commission, allocation) must use
 * `allocate()` so the remainder is distributed and the parts always sum back to
 * the original — never `multiply(m, 0.18)` followed by independent rounding.
 */

declare const moneyBrand: unique symbol;

/** A decimal money amount in INR with exactly 2 decimal places, e.g. "1234.50". */
export type Money = string & { readonly [moneyBrand]: 'Money' };

/** Signed integer paise. The only representation arithmetic ever touches. */
export type Paise = number;

export class MoneyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MoneyError';
  }
}

const MONEY_RE = /^-?\d+(\.\d{1,2})?$/;

export const ZERO: Money = '0.00' as Money;

/** Build a Money from integer paise. Throws on non-integer input. */
export function fromPaise(paise: Paise): Money {
  if (!Number.isSafeInteger(paise)) {
    throw new MoneyError(`paise must be a safe integer, received ${String(paise)}`);
  }
  const negative = paise < 0;
  const abs = Math.abs(paise);
  const rupees = Math.trunc(abs / 100);
  const remainder = abs % 100;
  return `${negative ? '-' : ''}${rupees}.${String(remainder).padStart(2, '0')}` as Money;
}

/** Integer paise for a Money value. This is what you do maths with. */
export function toPaise(money: Money): Paise {
  const negative = money.startsWith('-');
  const body = negative ? money.slice(1) : money;
  const dot = body.indexOf('.');
  const rupeePart = dot === -1 ? body : body.slice(0, dot);
  const fracPart = dot === -1 ? '' : body.slice(dot + 1);
  const paise = Number(rupeePart) * 100 + Number(fracPart.padEnd(2, '0'));
  return negative ? -paise : paise;
}

/**
 * Parse an untrusted value (JSON body, pg NUMERIC string) into Money.
 * Accepts `"12"`, `"12.5"`, `"12.50"`, `-12.50`, and integer/float numbers only
 * when they are exactly representable; anything else throws.
 */
export function parseMoney(input: unknown): Money {
  if (typeof input === 'number') {
    if (!Number.isFinite(input)) throw new MoneyError(`not a finite number: ${String(input)}`);
    // Route through paise immediately so we never keep a float around.
    const paise = Math.round(input * 100);
    if (Math.abs(paise - input * 100) > 1e-6) {
      throw new MoneyError(`number ${input} is not representable to 2 decimal places`);
    }
    return fromPaise(paise);
  }
  if (typeof input !== 'string') {
    throw new MoneyError(`money must be a string or number, received ${typeof input}`);
  }
  const trimmed = input.trim();
  if (!MONEY_RE.test(trimmed)) {
    throw new MoneyError(`malformed money value: "${input}"`);
  }
  return fromPaise(toPaise(trimmed as Money));
}

/** True when `input` is a well-formed money string. Narrows the type. */
export function isMoney(input: unknown): input is Money {
  return typeof input === 'string' && MONEY_RE.test(input.trim());
}

export interface FormatOptions {
  /** Prefix with the rupee sign. Default true. */
  symbol?: boolean;
  /** Insert Indian digit grouping (1,23,456.78). Default true. */
  grouped?: boolean;
}

/** Human-facing rendering. NEVER feed the result back into arithmetic. */
export function format(money: Money, options: FormatOptions = {}): string {
  const symbol = options.symbol ?? true;
  const grouped = options.grouped ?? true;

  const negative = money.startsWith('-');
  const body = negative ? money.slice(1) : money;
  const dot = body.indexOf('.');
  const rupees = dot === -1 ? body : body.slice(0, dot);
  const paise = dot === -1 ? '00' : body.slice(dot + 1).padEnd(2, '0');

  // Indian grouping: last 3 digits, then groups of 2.
  let grouping = rupees;
  if (grouped && rupees.length > 3) {
    const last3 = rupees.slice(-3);
    const rest = rupees.slice(0, -3);
    grouping = `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${last3}`;
  }

  return `${negative ? '-' : ''}${symbol ? '₹' : ''}${grouping}.${paise}`;
}

export function add(a: Money, b: Money): Money {
  return fromPaise(toPaise(a) + toPaise(b));
}

export function subtract(a: Money, b: Money): Money {
  return fromPaise(toPaise(a) - toPaise(b));
}

/**
 * Multiply by an exact quantity (kg, units) or a rate.
 * `factor` may be fractional (e.g. 2.5 kg); the product is rounded half-up on
 * the paise, which is the convention used by the invoicing rules in docs/rules.md.
 */
export function multiply(money: Money, factor: number): Money {
  if (!Number.isFinite(factor)) {
    throw new MoneyError(`factor must be finite, received ${String(factor)}`);
  }
  const product = toPaise(money) * factor;
  return fromPaise(roundHalfUp(product));
}

export function negate(money: Money): Money {
  return fromPaise(-toPaise(money));
}

export function compare(a: Money, b: Money): -1 | 0 | 1 {
  const pa = toPaise(a);
  const pb = toPaise(b);
  return pa < pb ? -1 : pa > pb ? 1 : 0;
}

export const equals = (a: Money, b: Money): boolean => compare(a, b) === 0;
export const greaterThan = (a: Money, b: Money): boolean => compare(a, b) === 1;
export const lessThan = (a: Money, b: Money): boolean => compare(a, b) === -1;
export const isZero = (m: Money): boolean => toPaise(m) === 0;
export const isNegative = (m: Money): boolean => toPaise(m) < 0;

export function sum(values: readonly Money[]): Money {
  let total = 0;
  for (const v of values) total += toPaise(v);
  return fromPaise(total);
}

/**
 * Split `money` across `ratios` losing nothing.
 *
 * Used for GST components, commission splits and channel allocation. The
 * remainder paise are handed out one at a time to the largest fractional parts,
 * so `sum(allocate(x, r)) === x` always holds.
 */
export function allocate(money: Money, ratios: readonly number[]): Money[] {
  if (ratios.length === 0) throw new MoneyError('allocate requires at least one ratio');
  if (ratios.some((r) => r < 0)) throw new MoneyError('allocate ratios must be non-negative');

  const total = ratios.reduce((acc, r) => acc + r, 0);
  if (total <= 0) throw new MoneyError('allocate ratios must sum to a positive number');

  const totalPaise = toPaise(money);
  const shares: number[] = [];
  let assigned = 0;

  for (const ratio of ratios) {
    const share = Math.trunc((totalPaise * ratio) / total);
    shares.push(share);
    assigned += share;
  }

  // Distribute the leftover paise deterministically, largest remainder first.
  let leftover = totalPaise - assigned;
  const order = ratios
    .map((ratio, index) => ({ index, frac: (totalPaise * ratio) / total - Math.trunc((totalPaise * ratio) / total) }))
    .sort((x, y) => y.frac - x.frac || x.index - y.index);

  let cursor = 0;
  const step = leftover >= 0 ? 1 : -1;
  while (leftover !== 0 && order.length > 0) {
    const entry = order[cursor % order.length];
    if (entry !== undefined) {
      const current = shares[entry.index];
      if (current !== undefined) shares[entry.index] = current + step;
      leftover -= step;
    }
    cursor += 1;
  }

  return shares.map(fromPaise);
}

/** Rupee-string for storage in NUMERIC(14,2). Identity, but self-documenting. */
export function toDbNumeric(money: Money): string {
  return money;
}

/** Read a NUMERIC(14,2) column (pg gives a string) back into Money. */
export function fromDbNumeric(value: string | null): Money | null {
  return value === null ? null : parseMoney(value);
}

function roundHalfUp(value: number): number {
  return value < 0 ? -Math.round(-value) : Math.round(value);
}
