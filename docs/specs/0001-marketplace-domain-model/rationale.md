# 0001. Marketplace domain model

**Date**: 2026-11-12

## Context

CareU.bd is a Bangladesh first multi vendor marketplace where third party sellers and CareU's own first party shop sell through one shared buying experience. The platform must support seller onboarding, shared and unique catalog listings, inventory and stock control, multi seller checkout, per shop fulfillment, payments including cash on delivery, commissions and settlements, returns, refunds, disputes, support, reviews, notifications, and a complete audit trail. These areas are tightly connected: a single customer checkout can involve CareU and several sellers, create several fulfillment records, and produce money effects that must be correct, explainable, and auditable long after the purchase.

The current codebase has authentication models only. There is no marketplace schema yet. If each later slice invents its own tables and relationships, the project will accumulate incompatible assumptions about who owns data, how orders split across shops, how money is snapshotted, how first party sales differ from third party sales, and how status and history are recorded. Fixing those mismatches later would require risky rewrites in areas where correctness matters most: inventory, payments, orders, refunds, commissions, and settlements.

The model must respect confirmed product rules: CareU and third party sellers share commerce workflows but never share commission, seller balance, or payout accounting. Money is stored as integer BDT (poisha). Orders, order lines, refunds, and settlements keep immutable financial snapshots and are never rewritten to correct history. Payment state and fulfillment state are separate. Stock changes must be atomic and auditable. Payment callbacks must be verifiable and idempotent. Cart storage is browser only for now, while addresses and wishlist are persisted. Some policies (commission rates, return windows, payout cadence, delivery pricing details, retention periods) are still pending, so the model must record configurable settings and snapshotted outcomes without hard coding those policy values.

This spec defines the foundational records, relationships, and constraints that every later slice will build on. The consequence of not deciding now is a fragmented schema that cannot safely support the core marketplace loop, financial correctness, or future slices without breaking changes.

## Options considered

### Option 1: One foundational domain model with shared entities and explicit boundaries (chosen)

Define one coherent target model covering identity and shop anchors, catalog and listings, inventory, orders and per shop shipments, payments and append only financial records, and trust and operations. Use shared entities where workflows are shared (for example one Shop concept with a first party flag, one parent Order with per shop Shipments), but enforce separation where required (first party excluded from seller commission and payout liability, append only ledger entries, immutable snapshots, separate payment and fulfillment status).

**Pros**:
- Gives every slice one consistent source of truth for ownership, relationships, and money handling.
- Makes cross cutting rules enforceable in the schema and transaction design (snapshots, idempotency, auditability, scope anchors).
- Fits the tracer bullet approach because later features can add behavior on stable core records instead of reshaping them.

**Cons**:
- The model is larger up front and requires careful review before implementation.
- Some entities will be introduced before every feature uses them fully, which adds initial schema and migration work.

### Option 2: Design only the Slice 1 tracer bullet tables now and defer other domains

Model only the minimum needed for CareU selling, basic browse, cart checkout, order placement, payment, and shipment tracking, leaving commissions, settlements, disputes, support, reviews, notifications, and richer inventory or catalog records for later specs.

**Pros**:
- Smaller initial spec and fewer tables in the first migration.
- Faster to start coding the first visible flow.

**Cons**:
- High risk of breaking rewrites because money, fulfillment, and audit requirements already constrain the first order and payment flows.
- Later slices would likely force changes to core order, shipment, payment, and ownership structures, which is expensive and risky once data exists.

### Option 3: Separate domain models per area with loose integration later

Let catalog, orders, payments, inventory, and operations evolve as mostly independent schemas connected later by application code.

**Pros**:
- Teams could explore each area with local freedom.
- Individual slices might look simpler in isolation.

**Cons**:
- Does not fit a marketplace where one checkout spans shops and creates coupled inventory, order, payment, and money effects.
- Makes immutable snapshots, idempotency, reconciliation, and first party financial separation hard to guarantee consistently.
- Increases the chance of duplicated or conflicting sources of truth.

## Rationale

Option 1 is the right choice because the hardest problems in this product are cross domain correctness problems, not isolated screen or table problems. Multi seller checkout, per shop fulfillment, verified payment callbacks, COD reconciliation, append only money records, and the separation between CareU first party sales and third party seller accounting all impose constraints on the same core records. Defining them together now prevents later slices from encoding incompatible assumptions.

The model keeps workflows shared where the product requires one pipeline: a single Shop entity represents both CareU and third party sellers with a first party flag; a parent Order contains per shop Shipments and OrderItems; seller owned listing variants carry independent price, SKU, and stock; and payments, inventory, and financial effects are recorded as explicit, auditable records. At the same time it preserves the required boundaries: customer, shop, and platform scope anchors exist on protected records; payment status is separate from fulfillment status; history and financial effects are append only; and first party shops never receive seller commission, balance, or payout liability entries.

This is a larger foundation than Option 2, but the extra scope is justified by confirmed requirements that already affect Slice 1 (order snapshots, stock reservations, idempotent payment events, per shop shipments, and first party separation). Option 3 was rejected because loose integration would push correctness into ad hoc application logic and make audits, reconciliation, and safe evolution much harder. Pending policy values remain configurable or deferred to later specs, while the structures needed to snapshot and apply them are included now.

## References

No references section was requested for this spec. The reasoning above is based on the confirmed project rules in `AGENTS.md`, the roadmap in `docs/scope/scope.md`, and the design decisions recorded during this architecture session.
