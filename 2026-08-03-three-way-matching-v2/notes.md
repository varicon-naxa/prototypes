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

## Credit notes — quantity and value must part company

VDP-694 (credit notes read as invoices) is being fixed before release, which is load-bearing here:
a misclassified credit *adds* consumption instead of removing it, violates the ledger invariant, and
then blocks the correct re-bill as `over_consumed` — failing in the direction that looks like the
feature is broken. Worth a guard even after the fix: a document with a negative total should never
enter the bill path.

**The trap.** If every credit note releases consumed quantity, then a supplier who over-charged on
*rate* and issued a price-correction credit has just re-opened 8 m³ of billable headroom — for
concrete that was delivered, kept and already paid for. They can bill it again and it matches
cleanly. That's a duplicate-payment route through the feature designed to prevent duplicate payments.
Conversely, if no credit ever releases quantity, a cancel-and-rebill can never be re-billed.

| Credit type | Value | Releases qty? | Received qty | Re-bill expected? |
|---|---|---|---|---|
| **Cancel & rebill** (most common) | −full | **Yes, fully** | unchanged | Yes, immediately |
| **Price correction** (the trap) | −diff | **No, never** | unchanged | No |
| **Goods returned** | −value | Yes | Reduced | No |
| **Short delivery** | −short | Yes | Corrected down | No |
| **Rebate / goodwill** | −value | n/a — off-PO | unchanged | No |

Goods-returned and short-delivery drop *both* consumed and received quantity, so available headroom
nets to unchanged — correctly, since nothing new became billable. Only cancel-and-rebill genuinely
re-opens headroom, because the goods are still on site awaiting a correct invoice.

**Schema consequence:** quantity and value are separate concerns. A price-correction credit is a bill
line with a **negative amount and an allocation quantity of zero**. Signed quantities are necessary
but *not sufficient* — the credit **type** decides whether a quantity row is written at all, and
there is no safe default, so the type must be mandatory.

**A credit note matches the bill, not the PO.** Its counterparty is the original bill, so it runs a
credit-validation path (does it reference a real bill; does it credit no more than that bill charged),
not the three-way engine. Its *effect* on the ledger is what the engine later reads. Conflating them
is how you end up flagging a credit note for having no docket.

Validation rules: credits ≤ billed per line; `Σ allocations` per docket line stays in
`[0, received_qty]`; type mandatory; unlinked credits are value-only (never guess the bill);
synced originals need an accounting-side credit note with partial allocation (CQ-2696); releasing
quantity marks other drafts stale but never recomputes approved bills.

Sandbox presets **Cancel & rebill** and **Credit trap** demonstrate the difference: identical inputs,
one matches cleanly and one correctly blocks.

## Delivery evidence is a per-client setting, independent of tolerance

Whether a bill can be approved without a docket is each customer's business decision:

| Setting | Behaviour |
|---|---|
| **Docket required** | Bill line with no received qty cannot be approved; parks until a docket arrives |
| **Attestation required** *(default)* | Approver may proceed but must confirm receipt — name, timestamp, reason to audit log |
| **Warn only** | Flagged, not gated |

**Keep it independent of the tolerance posture.** "Flexible on cents, strict on evidence" is arguably
the smartest setting a builder can choose — absorb the $20 fuel levy without a thought, never pay for
concrete nobody saw arrive. Bundling it into Strict/Balanced/Flexible would forbid that combination.
Posture *pre-selects* it; it stays independently changeable.

Existing tenants default to **attestation**, not required — switching matching on and immediately
blocking every un-docketed bill would read as an outage. "Docket required" is only workable once
docket coverage is genuinely high; before that it stalls AP and pressures crews into back-filling
dockets from invoices, which destroys the independence the whole check relies on.

## Scope (gap #4) — the evidence leg is polymorphic

Plant hire and ABN labour aren't three separate workflows. They're proof that the evidence leg is
polymorphic and the engine shouldn't know which kind it's reading:

| Spend type | Rate authority | Evidence leg | Unit | Scope |
|---|---|---|---|---|
| Material supply | PO line rate | Delivery docket | m³, t, ea | Launch |
| External plant hire | PO / hire agreement | Plant docket, chargeable hours | hr, day, wk | Launch |
| ABN labour | PO per worker/engagement | **Approved timesheet** | hr, day | Launch |
| Subcontract works | Subcontract schedule | Progress claim assessment | % or qty | **Out of scope** |

`Authorised rate × evidenced quantity = expected amount` holds in all three. Units differ; arithmetic
doesn't. So VDP-139 stays as specified — only *where the quantity comes from* is abstracted.

**Subcontract claims must be explicitly excluded, not merely unhandled.** A progress claim has no
docket and never will. If matching runs indiscriminately, every claim flags `missing_docket` forever —
a permanent false-positive class big enough to discredit the feature. Scope must be a real
`matching_scope` field on the bill, resolved at creation, never inferred from PO absence (which is
indistinguishable from the no-PO cases).

**Schema: use an evidence projection, not a generic FK.** The hot query is `Sum()` of evidenced
quantity per PO line, and a GenericForeignKey can't be joined or aggregated across in one query —
it reintroduces the N+1 the design exists to avoid. Instead a concrete `EvidenceLine` table owned by
the matching app, with `source` + `source_id`, that each domain writes into on confirm (inside the
source's own transaction, plus a reconciliation check). `BillLineDocketAllocation` becomes
`BillLineEvidenceAllocation`. Nothing in the engine changes.

`unit` is carried for validation, not arithmetic — the engine must **refuse to match across mismatched
units** rather than coerce. A bill in days against evidence in hours is real on plant hire, and
silently multiplying by 8 is a bug nobody can find.

## Evidence without a PO (the case I'd dropped)

v1 had this and my first seven scenarios didn't. It's the inverse of "PO but no dockets" and **far more
common** — an unauthorised delivery still arrives and the crew still does their job.

Quantity is verified by the docket; only **rate authority** is missing, so `expected_price` is `null`.
Critically, **the consumption ledger still works without a PO** (allocations hang off an evidence line
with null `po_line`, keyed on supplier + project), so duplicate-payment protection survives entirely —
the least-disciplined customers still get the most valuable guarantee.

Resolutions: **retrospective PO conversion** (recommended — fixes this bill *and* every future one,
so it should be one pre-filled button, not a trip to another module), approve the billed rate on trust
with the acceptance recorded, or link to a PO raised late. A retrospective PO must be flagged
`rate_source = bill_derived`, because its rate came from the document it will later be used to check —
it's a baseline for future bills, **not** retroactive authorisation of this one.

Per-client setting, default **allowed**. Blocking produces backdated POs raised purely to clear bills:
same spend, fake authorisation, false audit trail.

## External plant hire — time on site ≠ billable time

**The core insight:** 21 days on site might be 15 working days, 2 at standby rate, 4 not charged. If
your only evidence is on-hire/off-hire dates, the supplier's invoice for 21 days is *unarguable*.
On-hire/off-hire is a **bracket, not evidence**. The daily record is the evidence.

- **Dry hire** — equipment only, per day/week. Supplier has nobody on site so they have no usage record
  either; they bill the term. Ceiling often genuinely firm.
- **Wet hire** — equipment + operator, hourly. The operator's docket signed by the supervisor is the
  **strongest evidence in the whole feature**: contemporaneous and bilaterally agreed. Ceiling usually
  an estimate.

**One asset, several rates** — this breaks description-based line matching. Working ($185/hr) vs
standby/idle ($95/hr) need **separate PO lines**, or standby hours get billed at the working rate.
Mobilisation/demob should be *on* the PO or it lands `off_po` every time.

**Minimum hire is the one case where billed > evidenced is correct.** 5 hours worked on an 8-hour
minimum is legitimately billed 8. Under material rules that's a `qty_variance` every week, and plant
bills recur — the fastest route to warning fatigue in the feature. PO lines need
`minimum_qty_per_period` so `expected_qty = max(evidenced, minimum)`.

Evidence sources mostly already exist: **site diary plant record** (best — no new crew behaviour, which
matters given the split incentive), signed plant docket, timesheet plant allocation. The one genuinely
new thing needed is a *chargeable-hours record per hired asset per day with a working/standby split*.
Build on `2026-06-09-equipment-cost-rate` and `2026-04-08-rollover-design-for-equip`.

Per-client ceiling setting (firm / estimate / value cap), defaulting **estimate** for plant and **firm**
for materials — overridable on the individual PO, since a customer set to "estimate" will still
occasionally want a hard-capped plant PO.

## ABN labour — the easiest match, and a better idea

PO per worker/engagement authorises hours × rate; the **approved timesheet** evidences hours. This
evidence leg is *stronger* than a delivery docket: a docket is captured by whoever took delivery and
nobody signs it off, whereas a timesheet has already been through supervisor approval. The property
matching tries to manufacture elsewhere comes free here. The CQ-2680 cost-centre argument also answers
itself — the timesheet already carries the allocation.

**The better idea: don't match, generate.** Under a **Recipient Created Tax Invoice** arrangement
(ATO-recognised, requires a written agreement, already common in AU construction), the head contractor
generates the invoice from approved timesheet × PO rate and the worker doesn't issue one. Nothing to
reconcile — the document is correct the moment it exists. Removes the whole class of wrong-rate,
wrong-hours, missing-ABN, inconsistent-GST sole-trader invoices, *and* removes the chase-the-subbie
delay that holds up payment runs. Control and convenience point the same way.

Requires: written RCTI agreement per worker (retained), validated ABN **and GST registration status**
(not all sole traders are registered), clear RCTI marking, and worker visibility to see/dispute what
was generated on their behalf — the last matters more than it looks.

**The real risk is self-approval, not overcharging.** On small crews the ABN worker is sometimes also
the supervisor approving their own hours. That produces a flawless three-way match every time and the
feature actively vouches for it. Explicit rule needed: **evidence approved by the payee cannot satisfy
the evidence leg.** Same principle as the existing approver-collision handling, with more force —
here it defeats a financial control rather than skipping a step.

Also needs PO lines per rate type for overtime/penalty rates (same pattern as plant working/standby).

Worker classification (contractor vs employee) is a legal question and **not Varicon's to answer** —
but the records created here are exactly what gets examined if it's ever asked, so they should be
accurate and attributable, and the product shouldn't quietly encourage treating ABN workers identically
to employees.

## Settings sprawl — five axes is close to too many

| Setting | Default | Ask at onboarding? |
|---|---|---|
| Tolerance posture | Balanced | **Yes** |
| Delivery evidence | Attestation | **Yes** |
| Bills without a PO | Allowed | No — derive |
| PO ceiling behaviour | Firm (materials) / Estimate (plant) | No — per spend type |
| Matching scope | All except subcontract | No — rarely varies |

Each is individually justified; collectively they're an interrogation CS will click through on
defaults, at which point the defaults *are* the product. Two questions at onboarding, three sensible
derivations, all five editable later by someone with the permission.

## Eventual matching (gap #1) — the biggest design gap

The walkthrough implies PO → docket → bill. Reality is unordered: suppliers invoice same-day while
crews process dockets at end of week, so **at bill arrival the evidence frequently doesn't exist yet.**

**The key realisation:** under-evidenced and over-billed produce *identical arithmetic and mean opposite
things*. Bill claims 8 m³, evidence shows 5 m³ = either "supplier over-billing by 3" or "third docket
not captured yet". Only time, and whether more evidence is expected, distinguishes them.

Fix: stop treating the match as a verdict computed once at arrival; treat it as a **state that improves
as evidence lands**. New `awaiting_evidence` state, entered automatically (never a user action, or the
default stays wrong).

- **Parked bills must leave the approval queue.** A bill an approver can't action shouldn't be in front
  of them — it ages as though the delay were theirs and the queue stops being a to-do list.
- **Never park past the due date.** Window = `min(window, due_date − buffer)`. Otherwise you trade a
  reconciliation problem for a late-payment one, invisibly to the supplier.
- Three terminators, in precedence: **PO line short-closed** (cleanest — no timer), **window expires**,
  **evidence arrives** (bill moves itself to the approval queue and notifies AP — most parked bills
  should resolve with nobody touching them).

Implementation is the same machinery as the VDP-141 recompute gap — build once. Mark stale inside the
evidence transaction (cheap, bounded), fan out via `transaction.on_commit` so a queue failure can't roll
back the docket, idempotent worker recomputing from current state. **Debounce per PO line** or a
month-end bulk docket import floods the queue with overlapping jobs.

## Chasing (gap #2)

"Request evidence from site" action on a parked bill, plus escalation: supervisor → PM at 3 days →
commercial manager once inside the due-date buffer. Full request history on the bill, so "we asked three
times" is evidence rather than recollection.

Four things the request must contain: a **deep link to the action** (mobile capture pre-filled — a
supervisor sent to a bills list won't find their way), **what's actually missing** in physical terms,
**why it matters now** (the due date — supervisors reasonably deprioritise admin without a deadline),
and an **"it never arrived" reply path**, because sometimes the right answer is that the delivery didn't
happen. That's a finding, not a non-response, and routes back to AP as a dispute.

**Send a daily digest per person, not a message per bill.** Twenty separate emails at month end is
indistinguishable from spam and gets filtered.

Metric worth exposing: **median time-to-evidence per project.** It tells you which sites are ready for a
stricter setting, and it's the number that predicts whether the feature will work for a given customer.

## Multi-PO dockets and partial deliveries (gap #4) — recommendation

**Multi-PO dockets: allow them.** The PO link belongs on the docket **line**, not the header. A docket is
one truck's paperwork and there's no reason its contents share a PO — a general supplier drops fencing for
one PO and formwork for another on the same run. Forcing one PO per docket makes the crew either split one
delivery into two fictional dockets or mis-allocate half the load.

This already works in the `EvidenceLine` model (each line carries its own `po_line`), so it costs nothing
now. **The header-level PO field is the thing that's wrong** — make it a convenience default that pre-fills
lines, not the authority. Left as-is it becomes load-bearing in queries and reports and needs unpicking later.

Guards: **warn** if a docket spans projects (usually mis-keyed, corrupts two jobs' cost tracking at once —
but shared-site deliveries do happen so don't block); **block** if it spans suppliers (impossible by
definition — either mis-entered or two dockets photographed as one).

**Partial deliveries already work** — `expected_qty` has been a sum from the start. What was missing is
knowing when the sum is **final**, which matters because that's what ends parking:

| Signal | Effect |
|---|---|
| Short-close (explicit) | Ends waiting immediately, no timer — **highest quality terminator** |
| PO closed / cancelled | Same, across all lines |
| Evidenced ≥ ordered | Ends waiting; prompt to close, don't auto-close (over-delivery is normal) |
| Nothing — timer only | Ends waiting weakly; guesses nothing more is coming |

So **PO close and matching want designing together.** A customer who short-closes diligently gets crisp
immediate variance detection; one who never does falls back to a 7-day guess on every bill. Worth building
the nudge: when a bill parks on a PO line that looks finished, prompt to short-close right there.

Blocker: **PICBR-1321** — "Docket Delivered" doesn't update on docket creation, and that's the figure the
implicit signal reads.

## Disputes and holds (gap #3)

Confirmed behaviour: stays in payables aging (flagged), due date keeps running, any approver in the chain
can dispute, and Varicon generates a dispute notice.

**Design conclusion that follows: a hold is an overlay, not a status.** Because a dispute is orthogonal to
lifecycle position (a bill can be Awaiting Approval + disputed, Partially Approved + disputed, even Overdue
+ disputed), adding `Disputed` to the status enum forces a combinatorial explosion across nine existing
statuses, breaks the status tabs, and loses where the bill actually was. Attach a `Dispute` record instead.

**Parked ≠ disputed** — both leave the approval queue, for the same reason (nobody can approve a bill that's
unproven or wrong), but to *different* queues:

| | Parked | Disputed |
|---|---|---|
| Waiting on | Our site team | The supplier |
| Owner | Supervisor / PM | AP officer |
| Resolved by | A docket being captured | Credit note or corrected invoice |
| Set by | Automatic | Any approver |
| Due date | Caps the parking window | Keeps running |

**Because the due date keeps running, the disputed flag must appear everywhere Overdue appears.** Otherwise
AP chases their own team about a bill already being argued with the supplier — the setting creates busywork.

**Dispute at line level, hold at bill level.** Disputes are usually one or two lines of ten, but payment is
bill-level in every accounting system and short-paying is messy in Xero and MYOB. Record per line so the
notice is specific; hold the whole bill. Real-world resolution is the supplier crediting the disputed line
and the full bill then being paid — cleaner than any partial-payment mechanism.

**The dispute notice is the single most useful artefact the feature produces.** Everything on it is already
known — agreed rate from the PO, docket absence from the evidence ledger, arithmetic from the engine. It
converts "this bill looks wrong" into a specific evidenced request a supplier can act on without a phone
call. Generating it costs nothing.

**Closing the loop:** an arriving credit note referencing the disputed invoice should link and prompt to
resolve — and **the dispute reason should pre-select the credit type.** A rate dispute resolves with a
*price correction* credit (must NOT release quantity); goods-never-delivered resolves with *short delivery*
(must). The two features answer each other.

Disputes need their own aging report (open disputes by age and supplier), since the bill's aging hides the
dispute's own age — and it guards against "disputed" becoming where inconvenient bills go to be forgotten.

Out of scope: supplier-facing portal. Needs external identity and a support surface for non-customers; the
generated notice gets most of the value and email is where these conversations already happen.

## GST variance on sync (gap #5)

Five distinct causes, and the two that *feel* like rounding produce cents while the ones producing real
money are precision and configuration faults. Chasing the cents first is the wrong order.

| Cause | Mechanism | Size | Frequency |
|---|---|---|---|
| **Line vs document tax base** | Varicon sums per-line GST; accounting system recomputes on document total. `Σ round(line × 0.1) ≠ round(Σ line × 0.1)` | Cents | **Every multi-line bill** |
| **Rate precision at 2dp** | Extended amount wrong before tax applied, then tax amplifies (PICBR-1184) | **Dollars** | High-qty lines |
| Inclusive → exclusive round-tripping | `/1.1` gives repeating decimals; compounds on edit | Cents | Inclusive-entry tenants |
| **Tax code mapping** | Varicon code → Xero `TaxType` / MYOB mismatch (PICBR-1387). Not rounding — whole GST wrong | **10% of line** | Config-dependent |
| Unregistered supplier | GST applied where none should be — ATO exposure, not reconciliation | **10% of bill** | ABN labour especially |

**Fix order:**

1. **Send explicit per-line tax amounts** — don't let the accounting system derive them. Both Xero and MYOB
   accept a line-level tax amount and use it rather than recomputing. Low effort, removes cause 1 entirely,
   and cause 1 is the only one firing on every multi-line bill. **Verify this hypothesis first**: take
   drifting bills and check whether the delta equals the line-sum-vs-document-total difference.
2. Widen rate precision to 4–6dp; round only the extended amount. Fixes PICBR-1184.
3. Validate the tax-code map at **connect** time, not sync time. Fail loudly on the specific unmapped code,
   never silently send blank (cf. VDP-1340).
4. Store GST-exclusive as canonical; convert inclusive once at entry, keep both, never re-derive.
5. GST-registration flag per supplier; warn when a bill charges GST anyway.
6. Pre-sync diff preview — compute what the accounting system will see, block on material difference.

**Two traps:**

- **Python's default is banker's rounding, not half-up.** ATO expects nearest cent, half up. This alone
  produces one-cent drift on any amount ending in half a cent.
- **Derive tax as `inc − ex`, not `ex × 0.10`,** when converting from inclusive. Guarantees subtotal + GST
  = total exactly. The other way can produce a bill whose own numbers don't reconcile — the version
  customers notice fastest.

**Rounding adjustments: don't add a negative line.** Xero rejects negative quantities (PICBR-702), which is
exactly the silent sync failure class to avoid. Absorb the difference into the largest line's tax amount
(exact, invisible, works because you're now sending explicit per-line tax), or post to a configured rounding
account.

**For matching: compare on GST-exclusive, always.** PO rates are ex-GST and dockets carry no tax, so it's
the only shared basis. Comparing an inclusive bill against an exclusive expected amount yields a clean,
plausible, entirely wrong 10% variance on every line — it would read as systematic supplier overcharging.

## Through AP's eyes — the disclosure question, answered per audience

"Total owed, of which disputed" is right for a CFO and **wrong for AP**. An AP officer isn't producing a
financial position — they're getting a payment run out without overpaying or being blamed for lateness.
Their question is never "what do we owe?" but **"what can I clear, and who do I chase for the rest?"**

Start from the honest premise: 148 bills, 130 overdue, 73 in Draft on a production tenant. AP is
drowning. New flags will be experienced as more work unless the feature visibly *removes* work first.
**The primary job of the matching UI is to clear the noise so the problems become visible.**

The cut AP needs — every row has a count, a value, a named owner, and one action:

| What | Bills | Value | Blocked on | Action |
|---|---|---|---|---|
| ✓ Ready to approve (clean match) | 38 | $96,420 | Nobody | **Approve all 38** |
| Needs my decision | 6 | $11,280 | Me | Review |
| Waiting on site | 14 | $18,240 | Marcus Webb +2 | Chase all |
| Waiting on supplier (disputed) | 3 | $4,175 | BORAL +1 | Follow up |
| Waiting on approvers | 9 | $22,600 | Alec N +3 | Nudge |

No row should exist that AP can neither clear nor hand to someone.

Five things that decide whether AP loves or resents this:

1. **Lead with batch approve.** 38 clean matches in one action *is* the 60%-faster target, and it's the
   moment AP decides the feature is on their side. It's also the safest batch action in the product —
   every bill in it has been verified against two documents, more scrutiny than one-by-one gives today.
2. **Protect them from blame.** AP gets blamed for overdue. Show days blocked and who it's blocked on —
   "waiting 6 days on site for a docket" is AP's defence, and the system already has it. Get this right
   and they'll adopt it for this reason alone.
3. **Tell them the action, not the fault.** Not `price_variance $175.00` but "Billed $15/m³ above the PO
   rate — accept, update the PO, or dispute." Flag names are for the engine and the API.
4. **Don't add a tenth tab.** Nine already exist. Add one "why is this stuck" column and one work view —
   match status is a filter over the existing list, the way Overdue already is.
5. **Batch every action, not just approval.** AP works in runs, not records. A per-bill action repeated
   forty times is how a good feature becomes the thing nobody has time for.

Per audience:

| Who | Headline number | Where disputed sits |
|---|---|---|
| CFO / commercial | Total bills owed, unreduced | "of which disputed" beneath it; plus total-in-dispute trending |
| **AP officer** | **Ready to pay now** + blocked buckets | Its own row with a follow-up action. Total owed isn't AP's working number |
| Project manager | Committed cost on my job | "Cost that may reduce" — still hits budget until credited |

**The one metric that predicts adoption: percentage of bills that clear with no human intervention.**
High = AP got time back. Low = it's a review queue with extra steps, and no amount of correct variance
detection saves it. Instrument from day one; it also tells you when a tenant can move off warn-only.

## Jira

Created 2026-08-03:

**Sub-tasks under VDP-134:**
- VDP-1631 — evidence projection + consumption ledger (supersedes flat `matched_docket_ids`)
- VDP-1632 — eventual matching: park awaiting evidence, re-match automatically
- VDP-1634 — disputes as an overlay + generated dispute notice (supersedes VDP-698's status approach)
- VDP-1635 — GST: explicit per-line tax amounts on sync

**Standalone Features:**
- VDP-1636 — external plant hire matching (chargeable hours as evidence)
- VDP-1637 — ABN labour matching (approved timesheet as evidence)
- VDP-1638 — RCTI: generate ABN invoices instead of matching them

Build order: **VDP-1631 first** (blocks everything, and the only piece expensive to change later because
money will have flowed through the rows). VDP-1635 is independent and fixes a live problem now.

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

---

# SESSION STATE — 4 Aug 2026, end of day

Read this first if picking up in a new conversation.

## The cost model (confirmed by Alec)

PO = **Committed**. Docket = **Tracked**. Bill = **Actual**.

They are stages of the same money, never additive. A bill converts Tracked into Actual
one-for-one: 50k tracked + 30k actual, bill for 10k → 40k tracked + 40k actual, still 80k
off budget. **Committed only responds to delivery and can only ever shrink.**

Live Budget Overview in the sandbox confirms it: Committed $10,880 / Tracked $8,080 /
Actual $1,760 after 3 dockets and 1 approved bill.

The "double count" is a *failure mode if supersession doesn't fire*, not a design risk —
there is a toggle in the sandbox to demonstrate broken vs working. The model is correct.

## Built and verified

Sandbox (first item in the rail) — five views sharing one state, real Varicon chrome
(sidebar, top bar, project tab strip, status tab strips with live counts):

- **Purchase Order** — PO Total / Docket Delivered / Remaining to be delivered / Billed /
  Remaining to be Billed. Order Qty + Delivered Qty per line. Approval chain.
  "Project tracked by" switch: Cost Centre + Zones **or** Task (WBS) — never both,
  project-level, re-codes everything on switch.
- **Site Dockets** — cost centre **prefills from the PO line**; override raises
  coding_variance. **Non-PO custom items** supported (wash-out fee case) — tracks cost with
  no rate authority, blocks the bill until coded.
- **Bills** — split view with mock invoice pane. **Link PO and Dockets** modal with a date
  filter; already-billed dockets shown greyed and named ("Billed on VR19507301"). Match tabs
  with live ratios. Per-line flags with hover detail. Approval chain.
- **Budget Overview** — Budget / Committed / Tracked / Actual / Remaining.
- **Daily Cost Tracking** — real columns incl. **Source** (Docket / Bills), superseded
  entries struck through and excluded from the total.

Flags: price_variance, qty_variance, off_po, missing_docket, over_consumed,
over_po_ceiling, coding_variance, needs_coding. Blocking = over_consumed + needs_coding.

## NOT built — the remaining asks

1. PO landing page (list screen)
2. Scanning a quote → PO creation (per 2026-05-14-po-creation-page)
3. Scanning a bill / email intake + Scan log
4. Mobile docket capture + Process Docket (per 2026-05-07-site-dockets-flow)
5. List screens for PO / Docket / Bills

## Open questions for Alec

- Should a bill with **no docket at all** be blocked, or warn only? Currently warns.
- Estimated/Construction Budget removal — assumed single "Budget" column.

## Known flaws to iterate on (plain English)

1. **If nobody closes a PO, Committed never clears** — order 200t, take 8t, $9,216 sits
   committed forever. Makes PO close a financial task, not admin.
2. **Non-PO docket items can be priced at anything** — no PO line to check the rate against.
3. **Editing a docket after the bill is paid silently breaks agreement** — nothing recalculates.
4. **Two people can start billing the same delivery** — only the second Approve is stopped.

## Jira

VDP-134 has 11 sub-tasks. New this session: **VDP-1631** (evidence projection + consumption
ledger — prerequisite for everything), **VDP-1632** (eventual matching / parking),
**VDP-1634** (disputes as overlay), **VDP-1635** (GST per-line tax on sync),
**VDP-1655** (field-level bill lock, adopts CQ-2714), **VDP-1657** (accounting code
auto-resolution). Standalone Features: **VDP-1636** plant hire, **VDP-1637** ABN labour,
**VDP-1638** RCTI. VDP-1086 and CQ-2714 commented and linked.

## Wiki

PR **#153** open on varicon-naxa/varicon-wiki — 2 decision pages, plant hire concept,
corrected three-way-matching concept, plus a **Windows bug fix in
scripts/regenerate-backlinks.py** (os.path.relpath emitted backslash paths, rewriting 810
links across 407 files). Not yet merged.
