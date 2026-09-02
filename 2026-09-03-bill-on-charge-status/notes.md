# Bills — on-charge status

**Tickets:** VDP-2427 (under VDP-1580 Cost Flow Redesign) · CQ-2861 · Pylon #15145
**Built:** 2026-09-03
**Live:** https://varicon-naxa.github.io/prototypes/2026-09-03-bill-on-charge-status/

## The problem

Mango Earthmoving, via their bookkeeper Full Circle Bookkeeping, on-charge subcontractor
and supplier costs to their own customers. Varicon has no way to say which bills have been
on-charged, so they assign a **Xero Project** to each bill purely as a marker.

That workaround is the direct cause of the `lines associated to a Project` sync failures
they keep raising. Xero Tracking Categories do not meet the need — they have already tried.

Daywork Dockets have "mark as invoiced". Bills do not.

## What they asked for, and why the prototype pushes back

The customer asked for a flag: *"a simple 'Mark as invoiced' option would be great, similar
with how day dockets are marked as invoiced."*

A flag is buildable in days and it answers the literal question. It is also a second,
hand-maintained record of what was recovered, sitting next to the claims that actually
recovered it. The moment a claim is revised — routine — the flag and the revenue disagree,
and nobody can tell which is right.

That is the same failure as VDP-936 (export vs reporting hours, closed WontFix) and
VDP-2100 (dashboard totals contradicting their own records), relocated into the AP ledger.

## The three views

1. **Today** — the Bills list with no on-charge column, and the Xero Project workaround
   sitting in the last column in red. Establishes that the workaround is generating sync
   failures, so shipping this closes two things.

2. **Flag only** — the feature exactly as asked. Click any status to cycle it. Then press
   **Revise Claim #4**: the BGC Contracting bill drops from $45,600 recovered to $30,000,
   and the flag still says *Invoiced*. It is now wrong by $15,600 and nothing indicates it.

3. **Flag + link** — identical UI, status computed from the claim line that recovered the
   bill. Same revision, and the status moves on its own to *Partially on-charged* with the
   $15,600 in a shortfall column. Click any row for the evidence panel.

The drift button is the argument. It is the same event on both screens, so the difference
is visible rather than asserted.

## What the link buys, beyond not lying

- **"On-charged to whom"** — the claim already knows the customer and project. The flag
  never could, and the customer half-asked for this.
- **Shortfall** — cost passed on for less than it cost you. Invisible under a flag,
  filterable and totalable here. This is arguably the real feature.
- **Override survives** — recovered outside Varicon, or a commercial decision. Tick it, and
  the row shows *SET BY HAND* so a judgement never looks like a fact.

## Rules worth arguing about

- **"Not on-charged" and "never on-charging this" are different states.** A single blank
  means both *not yet* and *our own cost*, so the list can never be worked to zero.
  `Excluded — own cost` is explicit. Same principle as
  [[a-blank-field-should-not-carry-a-decision]].
- **On-charge status never alters cost.** Committed / tracked / actual stay disjoint;
  recovery is revenue on the claim. Netting them on the cost side is how VDP-2046 turned a
  $175,100 bill into $350,200.
- **Nothing touches Xero.** If any part of this writes to Xero the sync-failure class
  survives and the feature has not paid for itself.
- **Bulk from the list.** A bookkeeper works a month of bills in one sitting; twenty
  drawers means they keep using Xero.

## Open questions that need a call before build

The first one decides whether option 2 is worth doing at all:

- **Is the link bill→claim *line* or bill→claim?** Line-level gives real shortfall figures.
  Header-level is much cheaper and gives roughly nothing beyond the flag.
- Does a bill split across multiple claims need modelling on day one? (Real for long
  subcontracts; retrofitting many-to-many is expensive.)
- Who sets the link — the person coding the bill, or the person building the claim?
- Should an untouched "Ready for invoicing" chase someone? That turns this from a
  bookkeeping marker into a revenue control.

## Recommendation

**Build the option 2 shape, ship the option 1 experience.** Mango get the mark-as-invoiced
control they asked for and stop assigning Xero Projects. Underneath, the status is computed
with a manual override and the bill→claim link starts as a nullable column set by hand.
Nothing in the first cut needs clever matching — it just has to be possible later without a
rebuild, and without asking the customer to re-key a year of history.

## Caveat

Chrome is approximated from the 2026-03-24 bills-list prototype, **not** from a production
screenshot. Column set, statuses and the drawer pattern should be checked against the real
Bills screen before this is treated as a spec.
