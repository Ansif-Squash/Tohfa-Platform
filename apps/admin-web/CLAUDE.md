# apps/admin-web — instructions

Angular 17, standalone components, no NgModules. Read the root `CLAUDE.md` first.

## The five roles see five different applications

Navigation is rendered from `docs/rbac.json` via `core/rbac.service.ts`. Never hard-code a menu.
Never write `*ngIf="role === 'SUPER_ADMIN'"` — write `*ngIf="can('fair_price.set')"`.

Guarding a route in the UI is a courtesy to the user, not a security control. The API refuses
the same request independently. Both must be present.

## Role colours — there is only one now

Roles used to be colour-coded (Super Admin maroon, TOHFA Admin orange, Farmer Admin teal, Main
Warehouse brown, Sub Warehouse orange). The approved TOHFA Design System replaced that with a
single universal primary, so **every role renders in the same brand colour** — `--tohfa-primary`.
`roleColor` in `tokens.json` and `colorHex` in `docs/rbac.json` are still per-role keys, but
every one of them now holds that same value. Do not reintroduce per-role hues without a new
design decision.

Read colours from `tokens.generated.css`, never as literals.

## Components

`shared/data-table/` is the reusable table — filtering, sorting, pagination, bulk actions. Use
it. If it is missing something your screen needs, extend the shared component rather than
building a second table.

Every edit screen has the sticky Cancel/Save footer specified in the design system. Button
minimum height 44px, radius 8px (`--tohfa-radius-button`), inputs radius 8px with the primary focus ring.

## Data tables and scope

A Sub Warehouse Admin's table must show only their warehouse — but that filtering happens
**server-side**. The client does not filter for security, only for user convenience. If a
screen appears to show another warehouse's rows, that is an API bug, not a UI bug.

## Web-specific affordances

Per the design system, web gets: side navigation with all modules visible, multi-column
dashboards, larger data tables with inline filters and bulk actions, keyboard shortcuts,
multi-tab support, and print-friendly layouts. Do not simply scale up the mobile layout.
