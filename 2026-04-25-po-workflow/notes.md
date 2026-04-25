# PO Workflow prototype — 25 Apr 2026

Companion to `~/Desktop/bills-test-data/po-workflow-design.md`.

## What's prototyped

| Page | What it shows |
|---|---|
| `index.html` | Landing with links to each scenario |
| `permissions.html` | New **PO Workflow Setting** — replaces 3 tiers (Create/Approve/Close) with multi-tier sequential approval by value band only |
| `add-po.html` | New **Add Purchase Order** — shows live routing on the draft itself ("This PO will route to Alec for approval") |
| `po-detail.html` | **PO detail** — approved PO with multi-tier approval history, edit-to-increase value flow producing a **pending change** layered on (approved value preserved) |
| `po-close.html` | **Close paths** — soft prompt at fully-billed, manual short-close, and cancel for un-actioned POs |

## Model demonstrated

1. **Create:** anyone with PO module access can draft. No value-tier check at creation.
2. **Approve:** multi-tier sequential by value band — 1, 2 or 3 approvers configured by the customer (e.g. 0–$5k = 1; $5k–$50k = 2; $50k+ = 3).
3. **Value increase:** edit PO → pending change layered on, approved value stays at old value, bills can keep raising against approved-value headroom while pending. Approved at new value via same gate updates approved value. Reject clears pending.
4. **Close:** soft prompt at fully-billed (not hard auto-close). Manual short-close by anyone in the PO's approval chain. Cancel is a separate action for un-actioned POs.

## Decisions locked (reflected in the prototype)

- No separate Create-tier permission
- No separate Variation/CCO object — pending changes layered on PO
- Pending change preserves approved value
- UI shows both values when a change is pending: e.g. "$100k approved · $120k pending"
- No separate Close permission tier — close is an action available to anyone in the PO's approval chain

## Decisions still open (called out on the prototype as annotations)

1. Auto-close trigger semantics — soft prompt vs hard close
2. Manual close permissions — recommendation: anyone in approval chain
3. Sequential vs parallel multi-tier approval — recommendation: sequential
4. Cancel as a separate action — recommendation: yes, lighter approval
5. Re-approval scope on value increase — recommendation: only highest tier triggered by new total

## Cross-references to feedback items

- **Item 02** — Resource → Type + Unit on PO line items
- **Item 05** — Surfacing POs awaiting approval (must mean "my tier" of approval)
- **Item 11** — Quantity Received pre-fill bug — auto-close depends on this
- **Items 12 + 17** — Approver collision logic across tiers

## Out of scope

- Variation Register view (revisit if QSs request)
- Tolerance-based three-way match (separate v2 conversation)
- Soft-close vs hard-close distinction (Coupa pattern)
