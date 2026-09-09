# TOHFA Launch Readiness Review: Deferrals Register

**Story Reference:** S-53  
**Audience:** Product Management, Engineering Leads, Client Steering Committee  
**Purpose:** Explicit accounting of all capabilities consciously deferred out of Track 1 scope, including estimation in engineering days and exact unblocking prerequisites.

---

## 1. Summary of Consciously Deferred Capabilities

Track 1 prioritised the **Golden Thread** (Farmer onboarding -> Produce listing under price ceiling -> Counter-offer negotiation -> Purchase order & goods receipt -> Allocation -> Anonymous customer catalog -> Cart lock -> Wallet checkout -> Handover OTP -> Payout settlement).

The following features were consciously excluded from Track 1 to ensure delivery of a hardened, secure core:

| # | Deferred Capability | Source Rule | Estimated Effort | Unblocking Prerequisites | Impact of Deferral |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **DEF-01** | **FMB Polygon Land Parcel Drawing & 26-Zone Map Editor** | §2.1 / FR-F03 | **12 days** | Integration with TN e-Services Land Records API / Mapbox GL Native SDK | Farmers input GPS point coordinates and survey numbers instead of interactive vector boundary tracing. |
| **DEF-02** | **Offline Resilient Sync Engine** | §2.1 / FR-F01 | **10 days** | WatermelonDB / SQLite local store architecture with conflict resolution protocol | Mobile apps require intermittent network connectivity for mutation requests; offline reads cached via React Query. |
| **DEF-03** | **Doorstep Home Delivery Routing & Driver Fleet Management** | BR-21 / Contradiction 3 | **18 days** | Resolution of Contradiction 3; 3PL courier API integration (e.g. Shadowfax / Porter) | Fulfilment operates strictly on **Warehouse Pickup** with 4-digit handover OTP. |
| **DEF-04** | **B2B & Horeca Wholesale Order & Allocation Channels** | BR-13, BR-15 | **14 days** | Resolution of Contradiction 10; Multi-tiered invoicing & tax GST exemption engine | Only the **Online** retail customer channel is active; B2B/Horeca allocation endpoints return `501`. |
| **DEF-05** | **RMA, Return Tickets & Bank Refund Workflow** | §6.3 / FR-C05 | **8 days** | Resolution of Contradictions 6 & 7; Return logistics courier integration | Customer disputes handled via manual wallet credits; no automated return transit workflow. |
| **DEF-06** | **Farm Audits, 10-Category Scoring & Tiering** | BR-04, BR-05, BR-06 | **15 days** | Resolution of Contradiction 1 (Auditing scale 100 pts vs 750 tier thresholds) | Audit tables and config seeded; scoring engine endpoint returns `501`; certifications verified manually by admin. |
| **DEF-07** | **Agronomic Advisory Automation & Weather Risk Indicators** | BR-38 / Contradiction 2 | **12 days** | Resolution of Contradiction 2 (Manual data entry vs automated advisory policy); IMD weather API | No automated crop advisory push; background jobs limited strictly to rule enforcement. |
| **DEF-08** | **Farmer Annual Subscription Billing (Rs 500/year)** | BR-14 | **6 days** | Client definition of free-tier listing limits & subscription grace periods | Farmers list produce without subscription gate in initial launch. |
| **DEF-09** | **Physical Market Day Scheduling per Warehouse** | Matrix §5 | **5 days** | Warehouse physical capacity schedule definition | Market channel ordering deferred. |
| **DEF-10** | **DPDP Act / GDPR Self-Service Data Erasure Portal** | Matrix §15 | **7 days** | Legal retention policy signoff for financial audit trails | Deletion requests processed via support desk (`privacy@tohfa.in`) rather than self-service button. |

---

## 2. Total Deferral Budget

- **Total Sizing across 10 Deferrals:** **107 Developer Days** (~5.3 developer months across a 2-person squad).
- **Core Track 1 Stability Impact:** Zero. All deferred items are cleanly isolated behind `501 NOT_IMPLEMENTED` gates or dedicated feature flags without polluting core transactional flows.
