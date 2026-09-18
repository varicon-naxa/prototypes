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
- **Guided add in three steps** — pick the crew, set the time once for all of them,
  allocate (with splits that must total 100%) — against production's grid of empty cells.

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
