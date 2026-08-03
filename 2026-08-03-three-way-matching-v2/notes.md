# Three-Way Matching v2 — explainer, sandbox and Django feasibility

**3 Aug 2026** · Supersedes the matching screens inside `2026-05-07-site-dockets-flow`.
Audience: internal product + engineering. Jira: **VDP-134** and sub-tasks VDP-135–141.

Live: https://varicon-naxa.github.io/prototypes/2026-08-03-three-way-matching-v2/

## Why a v2

v1 showed the screens but never stated the rule. You landed on a dense Add Bill table with a
green banner reading "clean 3-way match" — which gives the verdict and hides the reasoning. An AP
officer who can't see *why* a line passed can't defend it; an engineer can't test it.

Two things also turned out to be true when checking the source material:

1. **No tolerance value is documented anywhere in the wiki** — no percentage, no dollar cap, no
   rounding allowance. VDP-139 says thresholds are "configurable per tenant" and instructs: *"get
   the variance threshold defaults reviewed by finance before implementing."* That review hasn't
   happened. So the numbers here are a proposal to argue with, and the sandbox is the surface for
   having that argument.
2. **VDP-139 already specifies the engine contract.** v2 is built to that shape rather than
   inventing a parallel model: `matched_po_line`, `matched_dockets`, `expected_qty`,
   `expected_price`, `variance_flags`, aggregate `matched | partial | unmatched`.

VDP-134 currently cites the v1 prototype as its spec, and is still **To Do, unassigned** (last
updated 28 May 2026). The web link on that ticket should be repointed here.

## It's a four-way check, not three

Corrected mid-build after seeing the live app's tab strip:

```
LINE ITEM | PURCHASE ORDER ($2,600.00/$5,000.00) | DOCKET ($2,600.00/$2,500.00) | PREVIOUS BILLS
```

POs and dockets aren't one-shot documents — they're **budgets that get consumed**, usually by
several bills over weeks. The question is never "does this bill match the PO and dockets?" but
"does it fit in *what's left* of them?" Without the prior-bills leg, three bills of 8 m³ each
against one 8 m³ docket all match perfectly and you pay three times.

Two independent ceilings, and **the tighter one governs**:

- **Ordered qty** — the authorisation ceiling. Breach = needs a PO variation.
- **Docketed qty − prior billed** — the evidence ceiling. Breach = `over_consumed`, the
  duplicate-payment case.

Those are different problems with different owners, so they get different colour treatment here.
Today the app renders both ratios red identically, which loses the distinction.

## Tolerance is a customer setting, not a product constant

Corrected after review: **tolerances are set at customer stage — some customers want flexibility,
others don't.** So the deliverable is not a number, it's a configuration surface plus a defensible
default plus onboarding guidance.

The prototype offers three **postures** rather than four raw numbers, because someone configuring
this on day one has no variance data and no intuition for whether 2% is generous or mean:

| Posture | Price % | Price $ | Qty | Missing docket |
|---|---|---|---|---|
| **Strict** — hard gate | 0% | $0 | 0 | Block |
| **Balanced** — default | 2% | $25 | 0 | Warn + attest |
| **Flexible** — flow-first | 5% | $100 | 0 | Warn + attest |
| Custom | any | any | 0 | any |

**Quantity tolerance stays zero in every posture, and over-consumption is never tolerable.**
Quantity is a matter of fact, not appetite — if 8 m³ arrived, 8 m³ is billable. A customer asking to
relax quantity is asking to pay for undocumented deliveries, which is the thing the feature exists to
prevent. Offer the missing-docket attestation instead.

Consequences for the build:

- **The Balanced defaults are the most consequential numbers in the feature**, because most tenants
  will never change them.
- **Existing tenants default to Balanced, not Strict.** Switching matching on and immediately
  blocking every un-docketed bill would read as an outage.
- **The settings page should simulate postures against the tenant's own history**: "this would have
  flagged 14 of 208 lines last quarter; Strict would flag 61". A percentage means nothing to a new
  customer; a weekly workload does. Cheap to build — the engine is a pure function, so replaying
  historical bills through three tolerance sets is a background job, not new logic.
- **Changing tolerance is a financial control change**, materially the same act as raising an
  approval limit (cf. VDP-687). Distinct permission, audit-logged with old/new values, and
  **forward-only** — the `tolerance_snapshot` + `effective_from` design means a widened tolerance
  never re-verdicts history. Bills mid-approval keep the tolerance they were matched under.
- **Scope**: VDP-139 says "per tenant" and stops. But customers wanting flexibility usually want it
  *selectively* — generous on a trusted concrete supplier, strict on a new subcontractor. Ship
  tenant-wide, but add a nullable `supplier_id` now and resolve most-specific-wins. Free while
  unused; a migration on live financial config if deferred.

## Quote-OCR POs cut both ways

VDP-118 now lets a PO be created by scanning a supplier quote (parser VDP-122, shared OCR service
VDP-121). Two consequences for matching, and the second is easy to miss:

**Good — it improves coverage.** The biggest cause of an unmatchable bill is that no PO was ever
raised, because raising one was friction. Removing that friction means more spend arrives with an
authority leg. It should also lift the clean-match rate directly: when PO rates were parsed from the
supplier's own quote, the supplier's later bill is far likelier to agree to the cent. Worth measuring
as **clean-match rate segmented by PO origin**.

**Bad — it puts OCR inside the authority leg.** The whole argument for the PO being the *rate
authority* is that it's human-approved and locked. If its rates were machine-read, that's weaker, and
the failure is silent: OCR reads $2,200 as $220, the supplier bills the correct figure, and matching
flags it as a price variance against the erroneous PO. The AP officer investigates the right bill
instead of the wrong PO. Worse, if docket quantities happen to line up, you get a clean match at the
wrong price.

**Three-way matching only checks internal consistency — it cannot detect a wrong PO.** Mitigations,
in order of value:

1. **PO approval is the control point.** It's the only human gate between OCR and a locked rate.
   Approvers should see OCR-derived rates marked as such, not indistinguishable from verified ones.
2. **Keep the quote attached and reachable from the match screen.** "Compare against the original
   quote" should be one click, so wrong-PO becomes the first cheap hypothesis, not the last.
3. **Store rate provenance on the PO line** (`manual | quote_ocr | quote_edited | resource`). Lets
   the engine say "billed rate differs from a PO rate that was OCR-derived and never manually edited"
   — which points at the culprit. One field, set at creation; do it while the PO OCR work is warm.

## Structure

| Section | Content |
|---|---|
| Overview | The three legs, their authority, and the rule stated once |
| 1 · PO raised | Rate authority. Approval chain, what the match takes |
| 2 · Docket captured | Qty authority. Mobile capture, cost-centre split, off-PO items |
| 3 · Bill arrives | OCR + PO inference priority order, and why it may return candidates |
| 4 · The match | Line-by-line derivation with the arithmetic visible |
| 5 · Previously billed | Consumption ledger, docket-line states, the tab strip |
| 6 · When it disagrees | Four flags × bounded resolutions, matching precedence |
| 7 · Approve & downstream | DCT, Xero/MYOB, PO rollup |
| **Sandbox** | Live engine — all inputs and all tolerances |
| **Engineering** | Django feasibility, models, concurrency, migration, tests |
| Scenario matrix | Seven cases mapped to flags and statuses |
| Spec & decisions | Proposed defaults, status vocabulary, ranked open questions, blocking bugs |

## Engineering summary

**The matching arithmetic is easy; the consumption ledger is the hard part.** No new
infrastructure — Django models, a pure-function service, a transactional write path.

Key positions argued in the prototype:

- **`matched_docket_ids[]` must become a through-model with a quantity.** VDP-141's flat list can't
  express "3 of 8 remaining", and partial consumption is the normal case.
- **Keep the engine ORM-free.** Pure function over three inputs makes the six VDP-139 scenarios a
  parametrised table with no database — milliseconds, so people actually run it.
- **Two aggregate queries per bill, not per line.** The obvious implementation is an N+1 that bites
  on a 40-line quarry invoice.
- **Lock the PO, not docket lines.** Consistent lock order avoids deadlock between bills claiming
  overlapping docket sets. Re-run the consumption check *inside* the approval transaction; anything
  computed at render time is advisory.
- **Don't use `post_save` to recompute.** Fires during bulk imports, unpredictable cost, and
  silently rewrites verdicts on already-synced bills. Use a staleness marker instead — this is the
  gap in VDP-141's "recomputed on edit", since an edit to the *docket* isn't an edit to the bill.
- **Signed quantities from day one** so credit notes return consumption naturally.
- **Snapshot the tolerance onto each verdict.** Otherwise every historical "matched" becomes
  unexplainable the moment a tenant changes their threshold.
- **Sequencing: ledger → resolution → engine → tolerances.** Don't build tolerances first; it's the
  fun part and the least valuable. At zero tolerance, exact matching already closes the double-pay
  hole, and by the time you tune you'll have real variance data instead of a meeting.
- **Accept a permanent pre-cutover cohort.** Historical bills have no line-level docket links and
  can't be honestly reconstructed. Mark `legacy_unmatched` and exclude from consumption maths. Worth
  saying plainly: this prevents future duplicates, it is not a historical audit.

## Open decisions, ranked by what they block

1. **Cost centre from docket or PO?** — CQ-2680 / AKJ Pylon #13061. Blocks *schema*. Recommend
   docket-first with PO fallback. Arguably a prerequisite for VDP-134, not a follow-up.
2. **Partial docket consumption** — blocks *schema*. Must support it.
3. **Tolerance defaults** — blocks launch. Ship at zero, gather data, then set.
4. **Missing-docket policy** — recommend warn + attest. Hard-blocking stalls AP and pressures crews
   into fabricating dockets.
5. **Draft-bill reservation** — advisory in UI, authoritative in the approval transaction.
6. **Credit notes** — signed quantities now; painful later.
7. **Match status on the Bills list** — VDP-138 open UX call. Same list, separate column, and make
   it filterable, unlike sync status today.

## Bugs that must be fixed before the engine can be trusted

- **PICBR-912** — editing a docket's received qty *overwrites the PO order qty*. The evidence leg
  can rewrite the authority leg, so the comparison proves nothing. Highest priority.
- **PICBR-1565** — dockets on unapproved POs stay linkable; bills can match unauthorised spend.
- **PICBR-1321** — PO summary "Docket Delivered" doesn't update on docket creation.
- **PICBR-1495** — bill lines without a docket vanish from Daily Cost Tracking: paid and invisible.
- **VDP-1334** — bill OCR fabricates line items. Matching contains the damage; still fix the source.
- **PICBR-1750** — rejected bills have no route back to Awaiting Approval, so rejecting a flagged
  line strands the bill.
- **PICBR-1184** — rates truncate at 2dp, so exact equality is unachievable on large quantities.
  This is why the absolute tolerance floor has to exist.

## Notes on the build

- Styling uses the **corrected token set** (Roboto, `#143666`, `#F19100`, `rgba(0,5,10,.87)`,
  `#C4C4C4`, 4px radii, `#F2F7FD` table headers) per `2026-07-09-zone-budget`, not v1's older
  `#f7941d`/`#1a1a2e` generation.
- Data is **realistic synthetic** — BORAL Concrete on Troughton Rd Upgrade. No live tenant data.
- Sandbox verified against all seven scenarios plus over-PO-ceiling and the one-sided/symmetric
  tolerance asymmetry.
- One deliberate engine subtlety: `price_variance` is suppressed when `over_consumed` or
  `missing_docket` fires. With no available quantity the expected amount is zero, so any billed
  amount looks like a price breach — that's derivative noise, and reporting both sends the user
  chasing the wrong problem.
