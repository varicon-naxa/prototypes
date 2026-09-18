# Site Diary mobile — matched to the desktop diary — 18/09/2026

The mobile site diary rebuilt against the Site Diary tab of
[`2026-08-21-budget-connected-merged`](../2026-08-21-budget-connected-merged/), so the
field app and the office screen describe the same day the same way.

- **Prototype:** `index.html` — single self-contained file, phone frame, no build step.
- **Supersedes** `2026-06-02-site-diary-unified-workflow/mobile.html`, which was built in
  June and never picked up the August–September work on the desktop diary. That file
  stays where it is; this is a new folder per the repo convention.

## Why

Two things had drifted apart.

**Production** (the screenshots this was built from) still has Labour and Timecard as
separate tabs — Labour split again into SUPPLIERS and RESOURCES, Timecard into TIMESHEET
and EMPLOYEES — each landing on *No data list found* with an Add button and no indication
of what to add or why. A day's work needs the same person entered twice, once for payroll
and once for cost.

**The old mobile prototype** fixed the double entry but predates everything the desktop
diary learned since: the plant roster, stand-down, the order build-up, supervisor view,
and the rule that the project decides the allocation method.

## What it carries over from the desktop

| From the desktop | How it lands on mobile |
| --- | --- |
| Timecard merged into Labour & Time | One card per worker: start, end, break, hours, rate, cost, allocation, status. The hours feed payroll **and** cost from one entry. |
| ABN contractors are labour | They stay in the crew list with an **ABN chip carrying their PO** — J. Whitton on PO-2859, T. Bui on PO-2249. An employee has no order, so none is invented. |
| The plant page is the day's roster | All six machines, not just the ones with cost: **Working / Stood down / Not on site**, with operators, hours, hourly rate and cost. An idle machine is the one a diary most needs to account for. |
| Standing a machine down is a cost, so it lands somewhere | Tap the status chip → why (fixed list), how much of the day (full $784 / half $392 / minimum $196, charge updates live), and what it is charged to — **pre-filled with where the machine last worked**. Clear it and the stand-down is still recorded, flagged *Unallocated* with an *Allocate* control. Nothing blocks. |
| A bill is not an order | Each material and misc line is one **order** — a PO, or a bill where nothing was ordered first. A direct bill says so and carries no "still to deliver". |
| The row is a dated snapshot | Delivered is the sum of the dockets that have landed **as at the day shown**. Step the date back and watch it move: PO-1425 reads 22.4 m³ on 7 Aug, 75.6 m³ on 17 Aug, 133 m³ on 31 Aug, against an order that never changes. |
| Clicking the order opens the build-up | The order, every docket landed to date, what is scheduled after, and what has been billed. |
| Two views: with rates and without | **Full view / Supervisor** switches the whole diary. |
| One allocation method, decided by the project | The WBS / Cost Centre control sets the *project's* structure; chips, column labels, the add flow and the stand-down allocation all follow it. There is no second setting shadowing it. |

## What is mobile's own

- **A section strip instead of a left rail.** Seven tiles carrying live counts — Diary,
  Photos, Labour & Time, Plant & Equip, Materials, Misc, Dockets — each ticked once
  opened. Production's rail is ten items deep and says nothing about what is in them.
- **Sign and submit lives in the footer**, on every section, with a visited-progress bar
  and a *Next: <section>* shortcut — carried from
  [`2026-07-30-site-diary-mobile-submit`](../2026-07-30-site-diary-mobile-submit/). The
  submit sheet summarises the day and **names the sections that were never opened**, so
  submitting early is a choice rather than an accident. Signing is required; visiting
  every section is not.
- **Empty states that say what to do.** Photos and Dockets explain what belongs there
  instead of *No data list found*.
- **The labour docket is a guided four-step sheet** — the docket and its order, who it
  covers, the time (set once for everyone on it), then allocate — against production's
  grid of empty cells.

## Everything is added on a docket, and every docket lands on an order — 2026-09-18

Two rules, from Alec on 2026-09-18, applied to **both** this prototype and the desktop
diary (`2026-06-02-site-diary-unified-workflow/index.html`, which is what the merged
prototype is built from — re-run `build-merge.py` after changing it).

**Labour is added on a docket, like everything else.** The standalone *Add workers*
button is gone. The docket is the source document; the diary is not where a worker
appears out of nowhere. (On the desktop the direct add was already unreachable — the
drawer's `openDrawer()` had no caller — so this only had to be made true on mobile.)

**A docket has no rate field.** Type a rate on the docket and one thing has two prices,
which will disagree. The docket asks *what arrived*; the **order it lands against carries
the rate**, the supplier, the unit and the code. So the flow now opens with *Against which
order?* — the open orders for that kind of docket, each showing what is left on it and at
what rate — and the rate is then shown, never typed:

| Docket feeds | Orders offered |
| --- | --- |
| Material | the material POs and direct bills |
| Misc | subcontracts, disposal, permits, sundries |
| Plant | wet-hire orders |
| Labour | the ABN contractors' own POs and the agency labour-hire order |

A labour docket against `PO-2311` prices the crew on it at the agency's $62/hr, not at
their payroll rate — which is the point of having the order decide.

**A docket with no order is still captured.** Quantity only, flagged **unmatched**, with a
*Match to order* control on the row; matching it later fills in the rate, the supplier and
the code, and the cost appears. Same shape as an uncoded bill and an unallocated
stand-down: the delivery happened whether or not the paperwork is in yet, and losing the
fact because a field was empty is worse than holding it with a flag on it.

**A material or misc docket lands on its order**, so saving one moves that order's
delivered figure — the same dated-snapshot rule the tracker already runs on. Verified:
12 m³ against PO-1425 moved delivered from 132.9 m³ to 144.9 m³ and appeared under
*Landed today*.

Verified on both prototypes, and in supervisor view: zero money figures visible anywhere
in the docket flow, including the order list, which reads `—/m³` instead of a rate.

*One pre-existing data oddity, not introduced here: in the merged prototype the order
`PO-1737` lists its supplier as "Fuel & consumables", which is a cost centre. It comes
from the shared data, not the docket flow.*

## Masking is all-or-nothing, by construction

Hide the rate but leave cost and quantity and the rate is cost ÷ quantity. So every money
figure goes through **one** formatter and that formatter masks — which covers figures
nobody thought about.

Verified by walking every visible text node inside the phone: **zero** money figures in
supervisor view across all six panels, and with the order build-up open. The sheet is
emptied when it closes, so a closed panel holds nothing.

## Demo data

Matched to the desktop's own: Northline Industrial Estate, Cookie's Civil, cost centres
CC-100 to CC-600, the six-machine fleet at its hourly rates, the nine material orders and
the misc/subcontract lines with their suppliers and references.

Two deliberate simplifications, stated rather than hidden:

- **Labour and plant are one seeded day.** Stepping the date re-derives the material and
  misc snapshot (which is the point of the date control) but leaves the crew and the
  machines as they are.
- **Dockets are generated from a fixed seed** so the demo does not reshuffle between
  renders. Delivered-to-31-Aug matches the desktop's figures; the individual docket dates
  and references are this prototype's own. Date navigation is capped at 31 Aug — the end
  of the claim period — so a scheduled delivery can never appear in the past.

## Open questions

- Does the section strip need a *Manage sections* sheet, the way the July prototype hid
  Labour and Tasks? The desktop has no such control, so this build shows all seven.
- Should a supervisor be able to *record* a stand-down they cannot see the price of? It is
  allowed here — the charge masks but the flow works.
- Weather sits on the Diary panel as four read-only tiles. Production has it as its own
  rail item. Worth deciding which.
