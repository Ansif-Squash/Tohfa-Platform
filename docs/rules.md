# TOHFA Business Rules

> Ground truth. Every rule below is enforced SERVER-SIDE. A hidden button is not a permission.
> Each rule has an ID. Every test that covers a rule must name it, e.g. `it('BR-07: rejects listing priced above fair price ceiling')`.

Sources: Requirements v1.0 (Chapters 2, 5, 6, and the FR-* lists) and Role & Feature Matrix v1.0 (sections §1-§15 and the 11 numbered principles). Authorization values live in `./rbac.json`; this file states behaviour, not grants. Where the two documents disagree, the conflict is recorded at the bottom of this file and the default the codebase implements is named there — do not resolve it in code.

## Legend

| Field | Meaning |
|---|---|
| **Source** | The clause this rule comes from. `§2.x` = Requirements v1.0 Chapter 2 (client-locked). `FR-*` = functional requirement. `Matrix P*` = numbered principle in the Role & Feature Matrix. |
| **Status** | `LOCKED` — client-signed, implement exactly as written. `DERIVED` — follows from a matrix principle or an FR, not separately signed off. `CONTESTED` — the two documents disagree; the rule states the implemented default and appears in *Open contradictions*. |
| **Layer** | Where enforcement lives. Always server-side; the entry names the code path (endpoint, service, job, DB constraint). Client-side checks are UX only and are never the test target. |
| **Scope** | `Track 1` — enforced and tested in the first delivery (backend + admin console). `Deferred` — out of scope for Track 1; the reason is in *Rules NOT enforced in Track 1*. |
| **Test contract** | The minimum assertions. Each sub-test has its own ID (`BR-01a`). A rule is "covered" only when every sub-test exists and passes. |

---

### BR-01 — Expired certificate blocks market listings
| | |
|---|---|
| **Source** | Requirements v1.0 §2.1 |
| **Status** | LOCKED |
| **Layer** | Server-side, enforced in the listing-create path and a nightly job |
| **Scope** | Track 1 |

**Rule.** A farmer whose certifications are all expired MUST NOT be able to create a produce listing.

**Failure mode if unenforced.** Uncertified produce reaches customers under an organic badge — the single largest reputational and legal risk in the platform.

**Test contract.**
- `BR-01a` Farmer with a certificate expiring yesterday → `POST /listings` returns 422, `code: CERT_EXPIRED`.
- `BR-01b` Re-verifying the certificate clears `farmers.is_market_blocked` within one job cycle.

---

### BR-02 — Unverified certificate blocks market listings; verification is manual
| | |
|---|---|
| **Source** | Requirements v1.0 §2.1; Matrix §9, Matrix P7 |
| **Status** | LOCKED |
| **Layer** | Server-side, listing-create path; verification state changed only by an admin action (`certification.mark_verified`) |
| **Scope** | Track 1 |

**Rule.** A certification record is `unverified` until a SUPER_ADMIN or TOHFA_ADMIN marks it verified after checking the issuing body's portal by hand. While a farmer has no verified, unexpired PGS or NPOP certificate, listing creation MUST be refused. There is no automatic or API-based verification path.

**Failure mode if unenforced.** Self-declared organic status. A farmer uploads any PDF and sells under the TOHFA organic badge with no human check.

**Test contract.**
- `BR-02a` Farmer with an uploaded but `unverified` certificate → `POST /listings` returns 422, `code: CERT_UNVERIFIED`.
- `BR-02b` No endpoint or job can transition `certifications.verification_status` to `verified` without an acting admin user id recorded in `verified_by`.

---

### BR-03 — Four audits per year, one per quarter
| | |
|---|---|
| **Source** | Requirements v1.0 §2.1 |
| **Status** | LOCKED |
| **Layer** | Server-side, audit-scheduling service + `UNIQUE(farmer_id, fiscal_year, quarter)` |
| **Scope** | Deferred |

**Rule.** Each farmer has exactly four audits per fiscal year, one per quarter, mixing internal and external types. Scheduling a fifth audit in a quarter MUST be refused.

**Failure mode if unenforced.** Compliance cadence collapses; certification tier scores are computed from an inconsistent number of inspections and are not comparable between farmers.

**Test contract.**
- `BR-03a` Second audit scheduled for the same `(farmer, fiscal_year, quarter)` → 409, `code: AUDIT_QUARTER_TAKEN`.
- `BR-03b` A farmer with fewer than 4 completed audits at year end is reported as non-compliant, not silently passed.

---

### BR-04 — Audit rating scale and compliance tiers
| | |
|---|---|
| **Source** | Requirements v1.0 §2.1; Matrix §9 |
| **Status** | CONTESTED |
| **Layer** | Server-side, audit-scoring service; thresholds read from config, never hard-coded |
| **Scope** | Deferred |

**Rule.** Audit rating is stated as max 100 points, while the tier bands are stated as `<650 Poor`, `650-700 Moderate`, `700-749 Good`, `750+ Excellent`. These cannot both be true. Track 1 seeds the tier thresholds as configuration (editable by SUPER_ADMIN only) and implements no scoring logic. No code may assume either scale until the client confirms.

**Failure mode if unenforced.** Every farmer scores under 100 and therefore lands in `Poor` forever, or the scale is silently changed to 1000 and the client's signed thresholds no longer mean what they signed.

**Test contract.**
- `BR-04a` Tier thresholds are read from `config`, not literals — changing config changes the tier a given score maps to.
- `BR-04b` No test asserts a specific tier for a specific score until the contradiction is resolved; the scoring endpoint returns 501 in Track 1.

---

### BR-05 — Major violation count red-flag threshold
| | |
|---|---|
| **Source** | Requirements v1.0 §2.1 |
| **Status** | CONTESTED |
| **Layer** | Server-side, audit-completion path |
| **Scope** | Deferred |

**Rule.** The document states "major violation count = 0 is a red-flag threshold", which reads backwards — zero major violations is the good state. The intended rule is almost certainly "any major violation (count > 0) red-flags the farm". Track 1 stores `major_violations_count` and `red_flagged` but sets neither automatically.

**Failure mode if unenforced.** Implemented literally, every compliant farm is red-flagged and every violating farm passes — an exactly inverted compliance signal.

**Test contract.**
- `BR-05a` `audits.major_violations_count` is persisted and non-nullable on completion.
- `BR-05b` `red_flagged` is only ever set by an explicit admin action in Track 1; no derivation rule is implemented.

---

### BR-06 — Farm rating is 10 categories x 10 points
| | |
|---|---|
| **Source** | Requirements v1.0 §2.1 |
| **Status** | LOCKED |
| **Layer** | Server-side, rating service + `CHECK (score BETWEEN 0 AND 10)` per category row |
| **Scope** | Deferred |

**Rule.** Farm rating totals 100 points across exactly 10 named categories (Certification, Soil & Land, Farming Practices, Environmental, Produce Quality, Traceability, Social & Labor, Financial, Market Relations, Innovation), each capped at 10. A rating with a missing category is incomplete, not zero.

**Failure mode if unenforced.** Ratings become incomparable between farms and the tier assignment derived from them is meaningless.

**Test contract.**
- `BR-06a` Submitting a category score of 11 → 422, `code: SCORE_OUT_OF_RANGE`.
- `BR-06b` The 10 categories are seeded reference data; a rating referencing an 11th category id is rejected.

---

### BR-07 — Listing price must not exceed the fair price ceiling
| | |
|---|---|
| **Source** | Requirements v1.0 §2.2; FR-F08 ("validated server-side") |
| **Status** | LOCKED |
| **Layer** | Server-side, listing-create and listing-update paths, validated against the ceiling effective on the submission date |
| **Scope** | Track 1 |

**Rule.** A produce listing's asking price per kg MUST be less than or equal to the fair price ceiling in effect for that crop and grade. The ceiling row used for validation is stored on the listing.

**Failure mode if unenforced.** The platform's core price-fairness promise is void; customers are charged above the association's own ceiling and the ceiling becomes advisory.

**Test contract.**
- `BR-07a` Ceiling Rs 100/kg, listing at Rs 100.01 → `POST /listings` returns 422, `code: PRICE_ABOVE_CEILING`.
- `BR-07b` Listing at exactly the ceiling is accepted; the accepted listing stores the `fair_price_id` it was validated against.
- `BR-07c` A ceiling lowered after acceptance does not retroactively invalidate an accepted listing.

---

### BR-08 — Fair price ceiling is set by Super Admin only
| | |
|---|---|
| **Source** | Requirements v1.0 §2.2, §6.1 |
| **Status** | LOCKED |
| **Layer** | Server-side, `pricing.fair_price.set` permission check on the write endpoint |
| **Scope** | Track 1 |

**Rule.** Only SUPER_ADMIN may create or change a fair price ceiling. TOHFA_ADMIN explicitly may not, despite being the operational head. Update frequency (daily or weekly) is an open client decision; the model stores an effective-date range either way.

**Failure mode if unenforced.** The one price control reserved to the association's top authority leaks to operations staff, and the price history — the audit trail of that control — becomes untrustworthy.

**Test contract.**
- `BR-08a` TOHFA_ADMIN calls the ceiling-write endpoint → 403, `code: FORBIDDEN`.
- `BR-08b` Ceiling rows are append-only with non-overlapping effective ranges per `(crop, grade)`; an overlapping insert is rejected by the DB constraint, not only by the service.

---

### BR-09 — Retail price must be at or below the ceiling
| | |
|---|---|
| **Source** | Requirements v1.0 §6.1, FR-A02 ("based on fair price ceiling set by SA") |
| **Status** | DERIVED |
| **Layer** | Server-side, retail-price write path |
| **Scope** | Track 1 |

**Rule.** SUPER_ADMIN and TOHFA_ADMIN set the customer-facing retail price. It MUST NOT exceed the fair price ceiling for that crop and grade in effect on the price's start date.

**Failure mode if unenforced.** TOHFA resells above the ceiling it imposes on farmers — an indefensible position for a farmers' association.

**Test contract.**
- `BR-09a` Ceiling Rs 100, retail price Rs 120 → 422, `code: RETAIL_ABOVE_CEILING`.
- `BR-09b` Lowering a ceiling below an active retail price surfaces the affected retail rows in the response; it does not silently leave them live.

---

### BR-10 — Counter-offer response window is 24 hours
| | |
|---|---|
| **Source** | Requirements v1.0 §2.2; FR-F08 |
| **Status** | LOCKED |
| **Layer** | Server-side, `counter_offers.expires_at = created_at + 24h` plus an expiry job |
| **Scope** | Track 1 |

**Rule.** A farmer has 24 hours from the admin's counter-offer to respond. After expiry the offer is `expired` and neither party may act on it; the listing returns to its prior state.

**Failure mode if unenforced.** Listings sit in limbo, warehouse allocation planning has no committed supply, and farmers can accept a stale price days later.

**Test contract.**
- `BR-10a` Responding at `expires_at + 1s` → 409, `code: COUNTER_OFFER_EXPIRED`.
- `BR-10b` The expiry job transitions untouched offers to `expired` and is idempotent when re-run.

---

### BR-11 — Counter-offers may be countered back at most 3 times
| | |
|---|---|
| **Source** | Requirements v1.0 FR-F08 |
| **Status** | LOCKED |
| **Layer** | Server-side, counter-offer service; `round` column with `UNIQUE(listing_id, round)` |
| **Scope** | Track 1 |

**Rule.** After the admin's counter, the farmer may counter back up to 3 times. On the 4th attempt the farmer must accept or reject.

**Failure mode if unenforced.** Unbounded haggling loops hold produce off the market past its shelf life.

**Test contract.**
- `BR-11a` A 4th farmer counter on the same listing → 409, `code: COUNTER_LIMIT_REACHED`.
- `BR-11b` Round numbers are contiguous from 1; a concurrent double-submit cannot create two rows with the same round.

---

### BR-12 — Reserve allocation is 70 / 10 / 10 / 10
| | |
|---|---|
| **Source** | Requirements v1.0 §2.2 |
| **Status** | LOCKED |
| **Layer** | Server-side, allocation service on batch intake; percentages read from config |
| **Scope** | Track 1 |

**Rule.** Received stock is allocated Online 70%, Live B2C Market 10%, Reserve (marriages/functions) 10%, Buffer 10%. Percentages are configuration, settable by SUPER_ADMIN only, and MUST sum to 100.

**Failure mode if unenforced.** The online channel oversells stock physically committed to market day or reserve, producing cancellations at pickup.

**Test contract.**
- `BR-12a` A 1000 kg batch produces bucket quantities 700/100/100/100; rounding remainder lands in Buffer, never lost.
- `BR-12b` Saving percentages that sum to 99 or 101 → 422, `code: ALLOCATION_SUM_INVALID`.
- `BR-12c` An online order for more than the Online bucket's available quantity → 409, `code: INSUFFICIENT_ALLOCATION`; it does not draw from Reserve.

---

### BR-13 — B2B and Horeca draw from consolidated inventory
| | |
|---|---|
| **Source** | Requirements v1.0 §2.2; Matrix §7 (`Manage B2B/Horeca Manual allocation`) |
| **Status** | CONTESTED |
| **Layer** | Server-side, allocation service |
| **Scope** | Deferred |

**Rule.** Requirements say B2B/Horeca allocation is automatic from consolidated inventory; the matrix says it is a manual admin action. The 70/10/10/10 split has no B2B/Horeca bucket, so the source of those units is undefined. No B2B/Horeca allocation path is implemented until the client resolves this.

**Failure mode if unenforced.** B2B orders silently consume the Buffer or Reserve buckets, breaking BR-12 without any audit trail of the decision.

**Test contract.**
- `BR-13a` No code path decrements the Reserve or Buffer bucket for a B2B/Horeca order in Track 1.
- `BR-13b` B2B/Horeca order endpoints return 501 in Track 1.

---

### BR-14 — Farmer subscription is Rs 500/year with a free tier
| | |
|---|---|
| **Source** | Requirements v1.0 §2.2 |
| **Status** | LOCKED |
| **Layer** | Server-side, subscription service; free-tier limits checked in the listing-create path |
| **Scope** | Deferred |

**Rule.** A farmer subscription costs Rs 500 per year. A free tier exists with limits. The limits themselves are undefined in both source documents and MUST NOT be invented in code.

**Failure mode if unenforced.** Either every farmer is gated by a limit nobody agreed to, or the paid tier has no value and the revenue line is fictional.

**Test contract.**
- `BR-14a` Subscription amount and period come from config, not literals.
- `BR-14b` Free-tier gating is a single named check with no thresholds set; enabling it requires a config value that ships unset.

---

### BR-15 — Four sales channels
| | |
|---|---|
| **Source** | Requirements v1.0 §2.2 |
| **Status** | LOCKED |
| **Layer** | Server-side, order service; `orders.channel` enum |
| **Scope** | Deferred |

**Rule.** The platform sells through exactly four channels: Online, Market (live market day), Horeca, B2B. Every order carries its channel. Track 1 implements Online only; the other three are rejected rather than silently treated as Online.

**Failure mode if unenforced.** Channel revenue reporting and allocation both become unattributable, and GST treatment (inclusive for retail, exclusive for B2B) is applied to the wrong orders.

**Test contract.**
- `BR-15a` `orders.channel` is non-nullable and constrained to the four values.
- `BR-15b` An order created with channel `b2b` in Track 1 → 501, not an Online order.

---

### BR-16 — Customer view is farm-anonymous
| | |
|---|---|
| **Source** | Requirements v1.0 §2.3, FR-F08; Matrix P2 |
| **Status** | LOCKED |
| **Layer** | Server-side, catalog/order serializers for CUSTOMER-authenticated requests |
| **Scope** | Track 1 |

**Rule.** A customer sees only produce grade, certification badges and TOHFA branding. No farmer name, farmer id, farm name, village, GPS coordinate, FMB polygon or photo containing farm identity may appear in any customer-facing response, including order history, invoices and support threads.

**Failure mode if unenforced.** TOHFA's aggregator position collapses — customers transact with farmers directly — and farmer PII is published to the public app.

**Test contract.**
- `BR-16a` `GET /catalog/:id` as CUSTOMER returns a payload containing no key from the farmer-identity denylist (asserted field-by-field, not by eyeballing).
- `BR-16b` A customer invoice PDF contains TOHFA as the seller, never the farmer.
- `BR-16c` Guessing an internal listing id via a customer-scoped endpoint does not expose `farmer_id`.

---

### BR-17 — Wallet-first checkout
| | |
|---|---|
| **Source** | Requirements v1.0 §2.3, FR-C04 |
| **Status** | LOCKED |
| **Layer** | Server-side, checkout service |
| **Scope** | Track 1 |

**Rule.** The wallet is the primary payment method. Checkout debits the wallet first; if the balance is insufficient the response instructs a top-up for the shortfall. An order is never confirmed with an unpaid balance.

**Failure mode if unenforced.** Orders confirm against money that does not exist; the wallet ledger and order ledger diverge and reconciliation becomes manual forever.

**Test contract.**
- `BR-17a` Wallet Rs 200, cart Rs 500 → checkout returns 402, `code: WALLET_INSUFFICIENT`, `shortfall: 300`; no order row is created.
- `BR-17b` A successful checkout writes exactly one debit row to `wallet_transactions`; a retried request with the same idempotency key does not write a second.

---

### BR-18 — Cash top-up credits the wallet server-side after the fiscal cash tag
| | |
|---|---|
| **Source** | Requirements v1.0 §2.3, §2.4, FR-A05 |
| **Status** | LOCKED |
| **Layer** | Server-side, cash-top-up endpoint; wallet ledger insert + SMS dispatch in one transaction boundary |
| **Scope** | Track 1 |

**Rule.** Customer hands cash to a warehouse admin, the admin marks the fiscal cash tag, and only then does the server credit the wallet and send the SMS confirmation. The client app never asserts the credit.

**Failure mode if unenforced.** Wallet balance can be created without cash having been received — a direct route to fraud with no paper trail.

**Test contract.**
- `BR-18a` A top-up request without a fiscal cash tag → 422, `code: FISCAL_TAG_REQUIRED`; no ledger row.
- `BR-18b` The credit row records the acting admin id and the warehouse id; both are non-nullable.
- `BR-18c` SMS dispatch failure does not roll back a completed credit, and the credit is not double-written on retry.

---

### BR-19 — Cash top-up is capped at Rs 10,000 per transaction
| | |
|---|---|
| **Source** | Requirements v1.0 §2.4; Matrix §8 |
| **Status** | LOCKED |
| **Layer** | Server-side, cash-top-up endpoint |
| **Scope** | Track 1 |

**Rule.** A single cash top-up MUST NOT exceed Rs 10,000. Per-day and per-customer caps are undefined in both documents and MUST NOT be invented.

**Failure mode if unenforced.** Large unbanked cash amounts enter the platform in one step at a warehouse counter, with obvious AML and cash-handling exposure.

**Test contract.**
- `BR-19a` Cash top-up of Rs 10,000.01 → 422, `code: CASH_LIMIT_EXCEEDED`.
- `BR-19b` Rs 10,000 exactly is accepted; two consecutive Rs 10,000 top-ups are both accepted (no undefined daily cap is enforced).

---

### BR-20 — Handover requires a 4-digit OTP
| | |
|---|---|
| **Source** | Requirements v1.0 §2.3, FR-C05 |
| **Status** | LOCKED |
| **Layer** | Server-side, fulfilment endpoint; OTP hashed at rest, verified server-side |
| **Scope** | Track 1 |

**Rule.** An order is marked delivered or picked up only after a warehouse admin submits the customer's 4-digit OTP and the server verifies it. The OTP is generated server-side per order and never returned to the verifying admin.

**Failure mode if unenforced.** Goods are marked delivered without the customer receiving them; refunds and RMA volume are driven by a status nobody verified.

**Test contract.**
- `BR-20a` Wrong OTP → 422, `code: OTP_INVALID`; order status unchanged.
- `BR-20b` The fulfilment response payload never contains the OTP value; only its verification outcome.
- `BR-20c` Note for review: FR-C05 says the OTP is "shared with warehouse staff", which defeats the check. Implemented as customer-held; flagged in *Open contradictions*.

---

### BR-21 — Every order supports warehouse pickup
| | |
|---|---|
| **Source** | Requirements v1.0 §2.3 ("dual fulfilment"); Matrix P9 (pickup only) |
| **Status** | CONTESTED |
| **Layer** | Server-side, order-create path |
| **Scope** | Track 1 (pickup path only) |

**Rule.** Every order MUST offer warehouse pickup as a fulfilment option. Requirements additionally describe home delivery with slots and out-for-delivery tracking; the matrix says all orders are pickup-only and contains no driver or fleet feature. Track 1 implements pickup only; delivery slots exist in the data model but no delivery routing is built.

**Failure mode if unenforced.** Either the whole delivery fleet capability is built against a client who wanted pickup only, or customers are promised a delivery slot no one can serve.

**Test contract.**
- `BR-21a` Every order created in Track 1 has `fulfilment_type = pickup` and a `warehouse_id`.
- `BR-21b` No endpoint assigns a driver or transitions an order to `out_for_delivery` in Track 1.

---

### BR-22 — Cart items are locked for 24 hours
| | |
|---|---|
| **Source** | Requirements v1.0 FR-C04 |
| **Status** | DERIVED |
| **Layer** | Server-side, cart service; reservation released by an expiry job |
| **Scope** | Track 1 |

**Rule.** Adding an item to a cart reserves that quantity against the Online allocation bucket for 24 hours. On expiry the reservation is released back to the bucket.

**Failure mode if unenforced.** Either stock is oversold to two customers at once, or abandoned carts permanently hold inventory hostage.

**Test contract.**
- `BR-22a` Adding 5 kg reduces the Online bucket's available quantity by 5 kg immediately.
- `BR-22b` After 24 hours with no checkout, the expiry job returns the 5 kg and the cart line is marked expired; the job is idempotent.

---

### BR-23 — Four fixed warehouses
| | |
|---|---|
| **Source** | Requirements v1.0 §2.4 |
| **Status** | LOCKED |
| **Layer** | Server-side, seeded reference data; warehouse creation is not an API in Track 1 |
| **Scope** | Track 1 (seeded), management UI deferred |

**Rule.** There are exactly four warehouses: Ooty, Coonoor, Kotagiri, Gudalur Market. Warehouse ids are stable and referenced by stock, orders, assignments and cash top-ups.

**Failure mode if unenforced.** Ad-hoc warehouse rows fragment the stock ledger and break Sub Warehouse Admin scoping, which keys on `warehouse_id`.

**Test contract.**
- `BR-23a` The seed produces exactly 4 warehouse rows with stable codes.
- `BR-23b` No public endpoint creates a warehouse in Track 1.

---

### BR-24 — Warehouses hold consolidated inventory across all farmers
| | |
|---|---|
| **Source** | Requirements v1.0 §2.4 |
| **Status** | LOCKED |
| **Layer** | Server-side, stock ledger — batch rows keep farmer provenance, stock availability is computed per warehouse/crop/grade |
| **Scope** | Track 1 |

**Rule.** Once received, produce is pooled by warehouse, crop and grade for selling purposes. Farmer provenance stays on the batch for payout and traceability but never scopes availability.

**Failure mode if unenforced.** Either availability is fragmented per farmer (customers see 40 tiny lots), or provenance is dropped and farmer payout cannot be computed from what was sold.

**Test contract.**
- `BR-24a` Two batches of the same crop/grade from different farmers in one warehouse present as a single availability figure.
- `BR-24b` Every stock ledger row still resolves to its originating `batch_id` and `farmer_id`.

---

### BR-25 — Each warehouse has its own Sub Warehouse Admin
| | |
|---|---|
| **Source** | Requirements v1.0 §2.4; Assumption 1 (5 admins including standby) |
| **Status** | DERIVED |
| **Layer** | Server-side, `user_roles.warehouse_id` NOT NULL when role = SUB_WH_ADMIN |
| **Scope** | Deferred (modelled, no staffing UI) |

**Rule.** A SUB_WH_ADMIN assignment MUST name exactly one warehouse. An assignment without a warehouse is invalid.

**Failure mode if unenforced.** A Sub Warehouse Admin with a null warehouse either sees nothing or, worse, everything — BR-30 depends entirely on this field being present.

**Test contract.**
- `BR-25a` Creating a SUB_WH_ADMIN without `warehouse_id` → 422, `code: WAREHOUSE_REQUIRED`.
- `BR-25b` The DB constraint rejects the same row inserted directly.

---

### BR-26 — Inter-warehouse transfers only by Main Warehouse Admin and Super Admin
| | |
|---|---|
| **Source** | Requirements v1.0 §2.4, §6.2, FR-A04 |
| **Status** | LOCKED |
| **Layer** | Server-side, `transfer.inter_warehouse.initiate` permission check |
| **Scope** | Deferred (ledger type exists; no endpoint in Track 1) |

**Rule.** Only SUPER_ADMIN and MAIN_WH_ADMIN may initiate an inter-warehouse transfer. TOHFA_ADMIN may not, despite outranking MAIN_WH_ADMIN, and SUB_WH_ADMIN may not move stock out of its own warehouse. Receiving a transfer is a separate, wider permission.

**Failure mode if unenforced.** Stock moves between warehouses with no accountable initiator; a Sub Warehouse Admin can empty their own site to hide a shortfall.

**Test contract.**
- `BR-26a` TOHFA_ADMIN calls transfer-initiate → 403.
- `BR-26b` SUB_WH_ADMIN calls transfer-initiate for its own warehouse → 403.

---

### BR-27 — Customers may pick up from any warehouse
| | |
|---|---|
| **Source** | Requirements v1.0 §2.4, FR-C04 |
| **Status** | LOCKED |
| **Layer** | Server-side, order-create path validates the chosen warehouse against the 4 seeded rows |
| **Scope** | Track 1 |

**Rule.** A customer selects any one of the four warehouses for pickup; there is no geographic restriction on which warehouse a customer may choose. Stock availability is then evaluated against that warehouse.

**Failure mode if unenforced.** Customers are silently bound to a "home" warehouse the requirements never specified, or orders are placed against a warehouse that does not hold the stock.

**Test contract.**
- `BR-27a` A customer whose profile prefers Ooty can place a pickup order at Gudalur.
- `BR-27b` Ordering against a warehouse with insufficient allocated stock → 409, `code: INSUFFICIENT_ALLOCATION`, evaluated per warehouse.

---

### BR-28 — Admin creation is strictly hierarchical
| | |
|---|---|
| **Source** | Requirements v1.0 §2.5, §6.4 |
| **Status** | LOCKED |
| **Layer** | Server-side check on the admin-create endpoint (`creationRules` in `rbac.json`) |
| **Scope** | Track 1 |

**Rule.** SUPER_ADMIN is created only by SUPER_ADMIN. TOHFA_ADMIN only by SUPER_ADMIN. FARMER_ADMIN by SUPER_ADMIN or TOHFA_ADMIN. MAIN_WH_ADMIN only by SUPER_ADMIN. SUB_WH_ADMIN by SUPER_ADMIN, TOHFA_ADMIN or MAIN_WH_ADMIN. Every other combination is denied.

**Failure mode if unenforced.** Privilege escalation in one request — a Main Warehouse Admin mints a Super Admin and owns the platform, including the fair price ceiling and payout approval.

**Test contract.**
- `BR-28a` Table-driven test over all 5 target roles x all 5 actor roles (25 cases) asserting exactly the 8 allowed pairs and 17 denials with 403.
- `BR-28b` MAIN_WH_ADMIN creating a SUPER_ADMIN → 403 and an audit log row recording the attempt.

---

### BR-29 — Farmer Admin cannot act on their own listings
| | |
|---|---|
| **Source** | Requirements v1.0 §2.5, FR-A03; Matrix §5, Matrix P3 |
| **Status** | LOCKED |
| **Layer** | Server-side `NOT_OWN_LISTING` predicate on approve, reject and counter-offer; violation auto-routes to another admin |
| **Scope** | Track 1 |

**Rule.** A FARMER_ADMIN is an elected farmer. They MUST NOT approve, reject or counter-offer a listing belonging to themselves or to their own linked farmer account. Such a listing is auto-routed to another eligible admin rather than merely hidden.

**Failure mode if unenforced.** An elected farmer self-approves their own produce at their own price — the exact conflict of interest the elected role was designed to avoid.

**Test contract.**
- `BR-29a` FARMER_ADMIN approves own listing → 403, `code: SELF_APPROVAL_FORBIDDEN`; listing state unchanged.
- `BR-29b` The same listing appears in another eligible admin's queue with `routed_reason: self_approval` set.
- `BR-29c` Counter-offer and reject paths return the same denial, not just approve.

---

### BR-30 — Sub Warehouse Admin is scoped to one warehouse
| | |
|---|---|
| **Source** | Requirements v1.0 §2.5 ("server-side query filter"); Matrix P4 |
| **Status** | LOCKED |
| **Layer** | Server-side, warehouse predicate injected into every query in the data layer — not a controller check |
| **Scope** | Track 1 |

**Rule.** Every read and write performed by a SUB_WH_ADMIN MUST be filtered by their assigned `warehouse_id`. Cross-warehouse rows return empty results, not 403 — the existence of other warehouses' data is not disclosed.

**Failure mode if unenforced.** One warehouse's staff read and adjust another warehouse's stock, orders and cash logs; a 403 instead of an empty result also leaks which record ids exist.

**Test contract.**
- `BR-30a` SUB_WH_ADMIN of Ooty lists stock → only Ooty rows; count matches a direct query filtered by Ooty.
- `BR-30b` SUB_WH_ADMIN of Ooty fetches a Coonoor batch by id → 404 with an empty body, never 403.
- `BR-30c` A write against a Coonoor row is rejected even when the id is valid and guessed correctly.

---

### BR-31 — Payouts over Rs 10,000 require dual approval
| | |
|---|---|
| **Source** | Requirements v1.0 §2.5, §6.3, FR-A02; Matrix P6 |
| **Status** | LOCKED |
| **Layer** | Server-side approval workflow; `payout.approve_above_10k` is SUPER_ADMIN only |
| **Scope** | Track 1 |

**Rule.** A farmer payout of Rs 10,000 or less may be initiated and released by SUPER_ADMIN or TOHFA_ADMIN. Above Rs 10,000 the payout requires a second, distinct approval by a SUPER_ADMIN; the initiator and the approver MUST be different user ids. TOHFA_ADMIN's path above the threshold is escalation, not release.

**Failure mode if unenforced.** A single operational account moves unlimited money out of the association's bank; the dual control the client signed off exists only in the UI.

**Test contract.**
- `BR-31a` TOHFA_ADMIN releases a Rs 10,001 payout → 403, `code: DUAL_APPROVAL_REQUIRED`; payout stays `pending_approval`.
- `BR-31b` The same SUPER_ADMIN who initiated a Rs 10,001 payout cannot approve it → 403, `code: SAME_ACTOR_APPROVAL`.
- `BR-31c` Rs 10,000 exactly follows the single-approval path; the boundary is `> 10000`.

---

### BR-32 — OTP hardening: 6-digit, 60s resend, 3-attempt lockout
| | |
|---|---|
| **Source** | Requirements v1.0 FR-F01 |
| **Status** | LOCKED |
| **Layer** | Server-side, OTP service; attempt counter and resend timestamp stored server-side |
| **Scope** | Track 1 |

**Rule.** Authentication OTPs are 6 digits. A resend may not be requested within 60 seconds of the previous send. After 3 failed verification attempts the challenge is locked and a new challenge is required.

**Failure mode if unenforced.** A 6-digit code with unlimited attempts is brute-forceable in minutes; unlimited resends are an SMS-cost denial-of-wallet vector.

**Test contract.**
- `BR-32a` 4th wrong attempt → 429, `code: OTP_LOCKED`; the challenge cannot be verified afterwards even with the correct code.
- `BR-32b` Resend at 59s → 429, `code: OTP_RESEND_TOO_SOON`; at 61s → accepted.

---

### BR-33 — Aadhaar and mobile are locked fields
| | |
|---|---|
| **Source** | Requirements v1.0 FR-F02; Matrix §2 |
| **Status** | LOCKED |
| **Layer** | Server-side, farmer-profile update path; `farmer.profile.edit_locked_field` is SUPER_ADMIN only |
| **Scope** | Track 1 |

**Rule.** A farmer's Aadhaar number and registered mobile number cannot be changed by the farmer, by TOHFA_ADMIN, or by any warehouse role. Only SUPER_ADMIN may change them, and the change is audit-logged. Aadhaar masking (last 4 vs hidden entirely) is an unresolved client decision; the full number is never returned in any API response.

**Failure mode if unenforced.** Account takeover by mobile-number swap, and uncontrolled mutation of the identity field the whole KYC record hangs on.

**Test contract.**
- `BR-33a` TOHFA_ADMIN patches `aadhaar` or `mobile` on a farmer → 403, `code: FIELD_LOCKED`; other fields in the same request are not applied either.
- `BR-33b` No API response body contains an unmasked Aadhaar number for any role.

---

### BR-34 — Reactivating a disabled farmer is Super Admin only
| | |
|---|---|
| **Source** | Matrix §2 |
| **Status** | DERIVED |
| **Layer** | Server-side, `farmer.account.reactivate` permission check |
| **Scope** | Track 1 |

**Rule.** SUPER_ADMIN and TOHFA_ADMIN may disable a farmer account; only SUPER_ADMIN may reactivate one. The asymmetry is deliberate.

**Failure mode if unenforced.** A farmer disabled for a compliance failure is quietly restored by the same operational role that disabled them, with no senior review.

**Test contract.**
- `BR-34a` TOHFA_ADMIN reactivates a disabled farmer → 403.
- `BR-34b` TOHFA_ADMIN disabling the same farmer succeeds — the asymmetry is asserted, not assumed.

---

### BR-35 — The audit trail is append-only
| | |
|---|---|
| **Source** | Matrix P10; Requirements v1.0 §6.4, FR-A01 |
| **Status** | DERIVED |
| **Layer** | Server-side audit middleware on every mutating route; DB revokes UPDATE and DELETE on the audit table |
| **Scope** | Track 1 |

**Rule.** Every mutating action writes an audit row containing actor id, actor role, action code, target, before/after summary and timestamp. Audit rows are immutable: no role, including SUPER_ADMIN, may edit or delete them. SUPER_ADMIN may read and export.

**Failure mode if unenforced.** Every other rule in this document becomes unprovable after the fact — dual approval, self-approval blocking and warehouse scoping all rely on a trustworthy log.

**Test contract.**
- `BR-35a` A direct `UPDATE`/`DELETE` against the audit table as the application DB role fails on permissions.
- `BR-35b` A denied request (403) still produces an audit row recording the attempt.

---

### BR-36 — Own-data ownership for farmers and customers
| | |
|---|---|
| **Source** | Matrix P8 |
| **Status** | DERIVED |
| **Layer** | Server-side, owner predicate injected in the data layer for FARMER and CUSTOMER principals |
| **Scope** | Track 1 |

**Rule.** A farmer sees only their own farms, listings, wallet, payouts, invoices and audit history. A customer sees only their own orders, wallet, invoices and tickets. There is no cross-user visibility in either app, in any direction.

**Failure mode if unenforced.** Trivial horizontal privilege escalation — incrementing an id in a mobile app exposes another farmer's finances.

**Test contract.**
- `BR-36a` Farmer A requests Farmer B's listing by id → 404 with empty body.
- `BR-36b` Customer A requests Customer B's order/invoice by id → 404; the invoice PDF endpoint is covered too, not just the JSON one.

---

### BR-37 — Stock movements are ledger-first; adjustments need separate approval
| | |
|---|---|
| **Source** | Requirements v1.0 §6.2; Matrix §7 (`Approve stock adjustment`) |
| **Status** | DERIVED |
| **Layer** | Server-side, append-only `stock_ledger`; adjustment approval permission excludes SUB_WH_ADMIN |
| **Scope** | Track 1 |

**Rule.** Stock quantity is derived from an append-only ledger; no code updates a quantity in place. A SUB_WH_ADMIN may create a manual adjustment for its own warehouse but MUST NOT approve one — approval requires SUPER_ADMIN, TOHFA_ADMIN or MAIN_WH_ADMIN.

**Failure mode if unenforced.** Warehouse shrinkage is self-certified: the same person who loses stock writes it off, and the ledger stops being evidence.

**Test contract.**
- `BR-37a` SUB_WH_ADMIN approves its own adjustment → 403, `code: SELF_APPROVAL_FORBIDDEN`; the adjustment stays `pending`.
- `BR-37b` The adjustment changes available quantity only after approval, and does so by inserting a ledger row, not by mutating one.

---

### BR-38 — No automated processes (manual data entry)
| | |
|---|---|
| **Source** | Matrix P5 |
| **Status** | CONTESTED |
| **Layer** | Product-level constraint; affects reminder jobs, treatment suggestions, weather risk indicators and B2B allocation |
| **Scope** | Deferred / blocked |

**Rule.** The matrix states all data is entered manually by admins, farmers and customers, with no automated processes and dashboards built from database entries. Requirements FR-F06/FR-F07 and §2.2 specify the opposite in four places (auto-reminders, system-suggested treatments, weather-based risk indicators, automatic B2B/Horeca allocation). Nothing in that overlap is built until the client resolves it. Rule-enforcement jobs mandated elsewhere in this document (BR-01 expiry sweep, BR-10 counter-offer expiry, BR-22 cart release) are enforcement, not automation, and remain in scope.

**Failure mode if unenforced.** Weeks are spent building an advisory engine the client believes they did not ask for — or the reminders they expect never exist.

**Test contract.**
- `BR-38a` No scheduled job in Track 1 writes farmer-facing advisory content.
- `BR-38b` The three enforcement jobs above are the only scheduled jobs, asserted against the job registry.

---

## Open contradictions — DO NOT GUESS

| # | Topic | Requirements v1.0 says | Role & Feature Matrix v1.0 says | Codebase default | Status |
|---|---|---|---|---|---|
| 1 | Audit scoring scale (BR-04) | §2.1: "max 100 points" and tiers `<650 / 650-700 / 700-749 / 750+` in the same bullet | §9 repeats both verbatim | Thresholds seeded as config; no scoring logic; scoring endpoint returns 501 | requires client confirmation |
| 2 | Automation (BR-38) | FR-F06/FR-F07: auto-reminders, system-suggested treatments, weather risk indicators; §2.2 automatic B2B/Horeca allocation | Principle 5: "All data is entered manually... No automated processes" | No advisory automation; only the three rule-enforcement jobs | requires client confirmation |
| 3 | Fulfilment model (BR-21) | §2.3 doorstep OTP at delivery hub, FR-C04 delivery slots + out-for-delivery, FR-A04 driver performance, module 14 drivers | Principle 9: "All orders fulfilled via warehouse pickup"; no driver or fleet feature anywhere | Pickup + 4-digit OTP only; delivery slot fields modelled but unused; no driver entity | requires client confirmation |
| 4 | Audit log scope for Main Warehouse Admin | §6.4: `View audit logs` MW = `Own` | §15: `View system audit logs` MW = `View` (all) | MAIN_WH_ADMIN = `own` (Ch.6 precedence) | requires client confirmation |
| 5 | Set warehouse capacity | §6.2: SA = Y, TA = Y, MW = Y | §7: SUPER_ADMIN only; TA = N, MW = N | SA/TA/MW may set (Ch.6 precedence); matrix is stricter | requires client confirmation |
| 6 | Wallet write authority for MW/SW | §6.3 `Wallet management (customers)`: MW = Y, SW = Own | §8: manual credit/debit is SA/TA only; MW/SW get view | MW = all, SW = own (Ch.6 precedence) — the loosest reading of a money-moving grant | requires client confirmation, priority |
| 7 | Bank refunds for MW/SW | §6.3 `Process returns (RMA)`: MW = Y, SW = Y (blanket) | §6: bank refund SA/TA only; MW/SW limited to wallet refunds | Bank refund restricted to SA/TA (matrix adds detail Ch.6 omits) | requires client confirmation |
| 8 | Integration keys and raw DB export | §6.4 + FR-A01: SUPER_ADMIN manages integration keys and has emergency raw DB export, audit-logged | §15 + Principle 11: both are infra-level (EXT); no role manages them in-app | Permissions retained SA-only; no admin UI built | requires client confirmation |
| 9 | COD vs wallet-first (BR-17) | §2.3 wallet-first; FR-C04 payment methods include COD; Ch.11 open decision 17 asks whether COD is supported at all | Principle: wallet-first checkout enforcement; no COD row | Wallet-first only; COD not implemented | requires client confirmation |
| 10 | B2B/Horeca allocation source (BR-13) | §2.2: automatic from consolidated inventory | §7: `Manage B2B/Horeca Manual allocation`, SA/TA full | Neither; B2B/Horeca order paths return 501 | requires client confirmation |
| 11 | Pickup OTP disclosure (BR-20) | FR-C05: "4-digit OTP shared with warehouse staff" | §6: `OTP shared with warehouse staff` = F for MW/SW and CU | OTP is customer-held; the verifying admin never receives it | requires client confirmation |
| 12 | Farmer application approval by Farmer Admin | §6.1 `Approve farmer applications`: FA = View | §2: `Approve farmer application` FA = N, with a separate view-only queue row | FA has read-only access, no approval path (behaviourally identical) | resolved, recorded for completeness |
| 13 | Object storage vendor | Ch.7/Ch.9: Azure Blob or Cloudinary | §15: AWS S3 or Cloudinary | Storage access is behind one adapter interface; no vendor SDK in domain code | requires client confirmation |

---

## Rules NOT enforced in Track 1

Chapter 2 contains roughly 33 discrete client-locked rules. Track 1 enforces 12 of them server-side with tests (BR-01, BR-02, BR-07, BR-08, BR-10, BR-11, BR-12, BR-16, BR-17, BR-18/BR-19, BR-20, BR-28/BR-29/BR-30/BR-31). The rest are listed here so the gap is a decision, not a surprise.

| # | Rule | Source | Rule ID | Why not enforced in Track 1 |
|---|---|---|---|---|
| 1 | 4 audits per year, one per quarter | §2.1 | BR-03 | Audit Management (admin module 5) is Phase 3 |
| 2 | Audit rating scale and tier thresholds | §2.1 | BR-04 | Config seeded only; no scoring logic — and the source is self-contradictory (contradiction 1) |
| 3 | Major violation red-flag threshold | §2.1 | BR-05 | Audit module deferred; the rule as written is inverted |
| 4 | Farm rating, 10 categories x 10 points | §2.1 | BR-06 | Categories seeded; rating capture and scoring are Phase 3 |
| 5 | Farmer-side certification entry, renewal tracking, expiry countdown | §2.1 | BR-01/BR-02 | Enforcement is server-side in Track 1, but the farmer-facing entry screens ship with the Farmer app (Track 2) |
| 6 | B2B/Horeca allocation from consolidated inventory | §2.2 | BR-13 | Only the Online channel is in scope; source contradiction unresolved |
| 7 | Four sales channels | §2.2 | BR-15 | Online only; Market, Horeca and B2B each need their own order, pricing and invoicing path |
| 8 | Farmer subscription Rs 500/year and free-tier limits | §2.2 | BR-14 | Billing module is Phase 2; free-tier limits are undefined in both documents |
| 9 | Dual fulfilment / home delivery with slots | §2.3 | BR-21 | Pickup path only; delivery model is contested (contradiction 3) |
| 10 | Live order tracking beyond packed/picked-up | FR-C04 | — | Dispatch and out-for-delivery states belong to the delivery model that is not in scope |
| 11 | Rate & review, tags, one-tap reorder | FR-C05 | — | Customer app Phase 5 screens; no backend dependency in the golden thread |
| 12 | RMA issue categories, ticket lifecycle, bank refunds | FR-C05, matrix §6 | — | Returns module is Phase 2-3; wallet refund path exists in the ledger, no RMA workflow |
| 13 | Each warehouse has its own Sub Warehouse Admin (5 incl. standby) | §2.4 | BR-25 | Modelled in `user_roles`; no staffing management UI |
| 14 | Main Warehouse Admin oversees all 4 warehouses | §2.4 | — | RBAC grants exist; the consolidated MW dashboard is Phase 3 |
| 15 | Inter-warehouse transfers restricted to MW + SA | §2.4 | BR-26 | The ledger has a transfer type; there is no transfer endpoint or UI in this scope |
| 16 | Warehouse capacity limits and quotas/targets | §6.2, FR-A04 | — | Contested authority (contradiction 5); no capacity model until resolved |
| 17 | Stock verification (physical count vs system) | §6.2 | — | Ledger supports it; the counting workflow and variance report are Phase 2 |
| 18 | Farm rating edit scoped to Farmer Admin's own zone | §6.1 | — | Ratings module is Phase 3; the `OWN_ZONE_ONLY` predicate is defined in `rbac.json` but unused |
| 19 | Quality counter-offer at goods receipt | matrix §7 | — | Second counter-offer surface; the listing counter-offer (BR-10/BR-11) is the one in scope |
| 20 | Market day scheduling per warehouse | matrix §5 | — | Belongs to the Market sales channel, which is Phase 3 |
| 21 | GDPR data export and account deletion requests | matrix §15 | — | Absent from the Requirements document entirely; needs a retention policy first, which no document states |
| 22 | Advisory automation (reminders, treatments, weather risk) | FR-F06/F07 | BR-38 | Blocked on contradiction 2 — do not build either way until the client answers |
