# Budget connected + Daily Cost Tracking + Site Diary

Three prototypes on one screen, behind the project tabs they already belonged to:

| Tab | Source prototype |
| --- | --- |
| Budget Overview (and the whole setup wizard) | `2026-08-14-budget-connected` |
| Daily Cost Tracking | `2026-06-04-daily-cost-calendar` |
| Site Diary | `2026-06-02-site-diary-unified-workflow` |

## This file is generated

`index.html` is built by `build-merge.py` from the three source folders. Edit the
sources and re-run the script — do not hand-edit `index.html`, it will be
overwritten:

```bash
python build-merge.py
```

The script fails loudly if any anchor it cuts on has moved, so a source rewrite
that breaks the merge is a build error, not a silently broken page.

## What the merge does

- **Chrome stripped.** Each guest prototype shipped its own sidebar, project
  header and tab bar. Those are removed; the base's sidebar and tab bar frame
  everything.
- **CSS scoped.** Each guest stylesheet is rewritten so every selector sits under
  `#pageDailyCost` / `#pageSiteDiary` (`body` and `*` map onto the page root,
  keyframes get a prefix). The two guests share 29 and 13 class names with the
  base — scoping means the guest rule wins inside its own page and nothing leaks
  either way.
- **Globals renamed.** `money`, `toast`, `fmt`, `openDrawer`, `closeDrawer` and
  the `toast` / `stepper` / `drawer` element ids collided across the three
  documents. Guest copies are prefixed `sd*` / `dc*`. Renaming inside markup is
  restricted to `on*=` handler attributes, so `class="toast"` stays intact.
- **Wizard chrome stood down.** The base drives its stepper and wizard bar from
  `setWizChrome()`, which would otherwise reclaim the tab highlight on a guest
  page. `showPage` and `setWizChrome` are wrapped rather than edited, so the base
  flow is untouched.

## One dataset — 2026-08-21

The three tabs no longer carry three demo datasets. `shared-data.js` (inlined by the
build) derives everything the guest tabs show from the base's own budget lines.

**The budget is the authority.** Cost centres, the WBS hierarchy (the base's l1 › l2 ›
line is exactly the diary's task › subtask › sub-subtask), the crew, the plant fleet,
suppliers, units and rates, and the claim periods all come from it.

**How the money ties.** For the open claim period, each cost centre's cost is split by
resource category using the base's own `resourceBreakdown`, kept apart by cost state,
then spread over the period's working days and expanded into one row per worker, machine
or delivery. The calendar renders those rows; the diary renders one day of them. So:

| Figure | Ties to |
| --- | --- |
| a diary row's cost | the same row in the calendar's day drawer |
| a calendar day cell | the ledger rows for that date |
| the calendar month total | the budget's cost for that claim period |

Verified at $0 gap on tracked ($87,561), actual ($193,002) and total ($280,563).

**It follows the budget, it does not shadow it.** Adding $120k of paid bills to a
Concrete line moved the calendar by $40,000 — that period's share — and reverting put it
back exactly. A project that was just set up carries no cost, so both tabs are empty
until there is some. Nothing here invents cost the budget does not have.

**Quantities are back-solved from the money**, which is why hours read 8.1 rather than a
tidy 8. The pool is authoritative: a group's rows are forced to add back to the amount
they were given, so row-level rounding can never drift the calendar off the budget.

**Uncoded cost is modelled, not hidden.** A variation raised without a cost centre, and
the base's own unassigned-cost line, are cost that has not been coded. It appears on the
calendar (that is what its Unassigned tab counts) and not in the diary, which is where
allocation happens.

## One palette — 2026-08-21

Both guests had their own hex values for the same five resource categories, and their own
idea of the three cost states. The budget's palette is now the only one:
committed `#b45309`, tracked `#0d9488`, actual `#16a34a`.

The guests did not just differ, they had it **crossed**: the diary painted a paid bill in
the committed colour and an unapproved timesheet in amber. Corrected to the base's model —
a purchase order is committed, a site docket matched to it is tracked, a paid bill is
actual; an unapproved timesheet is tracked, an approved one is actual. The state is now
what picks the document, so a row's colour and its source document cannot disagree.

Committed carries no daily-cost rows, which is correct: committed is not cost yet.

## Timesheet — 2026-08-24

Two pages off the **sidebar**, not the project tab bar: the landing page carries a
Project filter and no project name in its title, so it spans projects. Opening either
takes the project tab bar and budget wizard chrome down and retitles the topbar; leaving
puts them back.

### The list

A week at a time, Mon–Sun, grouped by day with a CLOCK IN group, paginated, searchable,
plus a WORKERS tab that rolls the week up per person. Every row is a labour row from the
shared ledger, so a timesheet here, a labour row on the Site Diary and a cost entry on
the Daily Cost calendar are one record shown three ways.

Tiles read from the ledger. Approved is actual cost, unapproved is tracked. **Payroll
locked, rejected and resubmitted read zero** because the budget model has no equivalent —
they are not invented. Status pills use the budget's own state palette.

The approver is the crew's foreman, except for the foreman's own time, which goes up to
whoever is logged in. Nobody approves their own timesheet.

### The add flow, rebuilt — one page

The original was one flat column — date, project, workers, times, remarks, attachments,
then four empty tables announcing "no data" — with Save live from the first paint, a
greyed-out Workers picker with nothing saying why, a 16h 0m default nobody chose, and the
one thing the page exists for (putting hours against a task so the cost lands on the
budget) at the bottom under an UNASSIGNED HOURS figure in red.

The first rebuild made it a four-step wizard copied from the budget setup flow. **That was
the wrong borrowing** and it got reverted: the budget flow is paginated because each of
its steps is heavy — upload a BOQ, map its columns, review hundreds of lines. A timesheet
is one day, one crew, one set of times. Four steps for a form that fits on one screen is
ceremony.

What was worth taking from the budget flow is the *discipline*, not the pagination. One
page, sections in order, each unlocking as it becomes answerable:

| Section | Waits for |
| --- | --- |
| Which day, and on which job? | — always open |
| Who worked, and for how long? | a project |
| Where should the cost land? | a project, a crew, a valid shift |
| Anything else? (optional, folded) | a project and a crew |

- **A locked section dims, refuses input, and says what it is waiting for** — "Choose a
  project first" — rather than greying out silently.
- **Multi-project is a toggle on the Project field**, not a decision of its own. The first
  cut gave it two large choice cards, which read as co-equal with "which job" when the
  card copy itself said most days are not split.
- **The default shift is 8h**, not the 16h the original's two default times implied.
- **Allocation reconciles to zero** with a progress bar, plus *Put the rest on one task*.
- **Save is held back** and the footer names the blocker — "4h 30m of the shift still
  unallocated" — next to a one-line summary of what is about to be created. No separate
  review step; it fits in the footer.

### Allocation follows the project's budget structure

The base already draws the distinction and states it plainly: *"In a cost centre project,
a PO, docket, timesheet or bill is coded to a cost centre, never to a line item."* Both
flows are live, and `projectType` on the overview decides which one the form gives you:

| Project tracks by | Time is booked against | Options |
| --- | --- | --- |
| Cost centre | a cost centre | the 7 cost centres |
| WBS | a task | the 20 WBS leaves, cost centre shown alongside |

The column header, the picker, the placeholder and the blocker text all follow, and a note
under the section says which structure this project uses and why the options look that way.
Switching the type on the overview changes the form — the fingerprint includes the
structure, so the ledger's allocation labels move with it too.

The first cut mashed both together — `CC-100 Overheads / Prelims · Establishment › Site
Supervision & Management` — which shows a WBS path on a cost-centre job and a level the
project does not track.

### Equipment and allowances allocate too

Both carry cost, so both need somewhere for it to land; the original product form has a
Task/Cost Centre column on each and the first rebuild dropped it, leaving equipment hours
as cost with nowhere to go. Each row now has its own allocation picker, and an unallocated
one blocks Save the same way unallocated hours do.

Where the cost lands differs by kind, following the base's model: equipment is owned plant
charged internally — no PO, no supplier bill — so it goes to `plantTracked` and onto the
ledger's plant category. An allowance is part of the worker's pay, so it rides with labour
on `tsUnapproved`. Verified: 8h labour + 2h plant + a $35 allowance moved the budget by
$563 labour and $190 plant, with the ledger still tied at a $0 gap.

### No pay rates on the timesheet screens

The crew picker showed `$78/hr` per person. Two problems: whoever enters a timesheet
often has no visibility of pay, and the figure was ambiguous — the base carries both a
`costRate` and a `labourSell` for each person and the row named neither.

Removed from the crew picker, from the Workers tab (which printed `$92/hr` outright), and
from the shift hint, which read "At $144/hr for the crew selected…" — an aggregate that is
one person's rate the moment only one is selected.

**Cost figures stay**, because cost landing on the budget is the point of the allocation
step. Note the consequence though: a single-worker timesheet still makes the rate
derivable, since cost ÷ hours is the rate. Hiding cost as well would need a permission
rule, which is a product decision rather than a prototype one.

Plant hire rates are still shown on the equipment picker. They are equipment charge rates,
not somebody's pay, and they are on the hire docket the site already handles.

### The crew picker holds its size

A card per worker reads well for a crew of five and becomes a wall at fifty. Search, a
list capped at 210px with its own scroll, and a chip per person picked: the section is
**562px tall for both 5 and 50 workers**, measured.

### Saving writes back

A timesheet is the source of labour cost, so saving one adds it to the budget line it was
allocated against as `tsUnapproved` — tracked, not actual, until approved. The row is held
explicitly so it lands on the day and worker entered, and carved back out of the derived
spread so the money is not counted twice. Verified: the ledger still ties to the budget at
a **$0 gap** after saving, and the new entry shows on the list, the calendar (labelled
"entered on a timesheet") and the diary.

One honest limit: the base apportions each line's cost across the four claim periods by a
fixed weight, so a saved timesheet raises the **job's** cost by its full amount while this
period picks up its share. The review quotes the job figure for that reason — quoting a
period figure would read as a discrepancy against the overview.

## Suppliers — 2026-08-25

A third top-level page off the sidebar. Every supplier is one the budget actually names —
on a purchase order, a site docket, a bill or a cost-plus invoice — so the list is exactly
who this job buys from and it grows when the budget does. Thirteen of them, not the 168 a
real org carries.

**Source means something.** Xero is the accounting substrate, so a supplier synced from it
arrives with the accounting record attached; one created in Varicon starts bare and fills
out as bills arrive. That is why the Varicon-sourced rows carry so many dashes — it is the
state, not a gap in the mock.

### Resource categories map to accounting codes

The original Add Supplier form had a "Resource Types" multi-select and stopped there, which
leaves unanswered the question the AP flow actually needs: when a bill from this supplier
arrives for plant, which account does it post to?

- A supplier can supply **several categories** — the base's own five, the same vocabulary
  the calendar legend, the diary and the timesheet use.
- Each category can carry **several accounting codes**. A supplier's materials might be
  aggregates on one bill and concrete on the next, so the mapping constrains which accounts
  a bill line may use rather than fixing one. `codes[category]` is a list.
- The picker is a **search over the whole chart of accounts**, unfiltered. An earlier cut
  tagged each account with the categories it suited and filtered by that — the same
  decision-on-their-behalf as the seeded mapping, since whether "420 Fuel and oil" is a
  plant account or an overhead is the client's call. Search is also the only control that
  works when a real chart runs to hundreds of codes rather than the 28 here. It expands
  **in flow** rather than floating: as an absolute popover it was clipped twice over, by
  `.sp-map`'s `overflow:hidden` and again by the drawer body's own scroll, so only the
  first row survived. Letting the row grow needs no z-index and no portal.
- **Nothing is filled in for the client.** Every supplier starts with no categories and no
  codes. An earlier cut inferred the categories from the dominant category of the cost
  centres a supplier appeared against and seeded one or two accounts each — both were us
  deciding on the client's behalf, and the inference was wrong often enough to notice
  (a traffic management firm came out as plant and material).
- Uncoded categories **flag rather than block** in the drawer footer: the record is valid,
  it is the bill that cannot post.

**Clicking the row opens the supplier**, not just the pencil. The pencil stays as the
affordance but carries no handler of its own — one delegated handler on the table body
covers both, so it survives a sort or a page change. The checkbox and Archive are the two
things excluded, since neither means "open this".

**The codes are set here and shown nowhere else.** They surface where they are used —
creating a purchase order, and coding a bill — so the supplier list stays a contact record.
An earlier cut put category chips and an uncoded-category warning on the rows; both came
off, which also returns the list to the columns the real screen has.

The chart of accounts is the one thing here that is **not** derived — the budget has no
concept of one, so `ACCOUNT_CODES` is new data.

### The bill is where a gap gets flagged

An incomplete supplier record is a normal state, not a fault — nobody sets up a category
before they have bought anything in it. So the drawer does not nag, and the check belongs
at the point of use.

`VDATA.billCodingGap(supplierName, category)` is that check, and it separates the three
things that can be missing:

| Returns | Meaning |
| --- | --- |
| `supplier` | the supplier is not on file at all |
| `category` | this supplier has no such category set up |
| `code` | the category exists but has no account behind it |
| `null` | ready, and the allowed accounts come back with it |

The accounts valid for the category come back **whatever the gap**, so the bill can offer
the fix in place. `VDATA.addSupplierMapping(supplier, category, codes)` applies it — adding
the category if it was never set up and merging the accounts in, so coding one bill teaches
the supplier record for the next one.

**Fix inline, then carry on** — Alec's call, 2026-08-25. The bill flags what is missing and
lets the user put it right without losing the bill, rather than blocking or sending them
off to the supplier record. Same shape as the rest of the product: surface the unmet
condition, let them proceed.

**Not yet surfaced.** The prototype has no bill entry screen, so the check and the fix
exist and nothing calls them. Deliberate — whoever builds Bills wires them up.

## Plant & Equipment — 2026-08-25

The sidebar's Equipment entry becomes the **Plant & Equipment** group, with Equipment
Registry as its first child. The other four children (Attachment Registry, Servicing and
Maintenance, Asset Type, Defect Register) sit inert like the rest of the unbuilt sidebar.

### The registry

Derived from the budget's own `PLANT_FLEET` — six machines, so a machine on the register
is a machine the job charges itself for. **The meter reading is the hours the ledger has
booked against it**, which ties the register to the calendar, the diary and the timesheet:
192.1 hr on the Bobcat is the same 192.1 hr those tabs show.

Status counts, type filter and the ALL/ACTIVE/MAINTENANCE/INACTIVE tabs all count the real
list. Next servicing and plant manager are blank — the client's to fill in.

### Registering a machine — one page, one rate

The product's form is six tabs. Four of them — Attachments, Inspection & Forms, Documents,
Maintenance — are empty lists of things you hang off a machine that *exists*: you cannot
attach a warranty to a machine you have not created. Asking for them during registration is
the same "four empty tables up front" the timesheet form had, so they come off the create
flow and a note says where they went.

What is left is one page: whose machine it is, what it is, what it costs, how its usage is
read, and an optional fold for make/model/specs/notes.

### Hired plant — 2026-08-25

A hired machine names the **purchase order** it came in on and takes the rate from there,
so the hire rate has one home and cannot drift from what was ordered. The order list is the
base's own PO register, filtered to hire suppliers.

A PO is written for a hire period; the job needs cost per day or per hour, so the machine
carries **both**: the period the order is priced in, and the basis the job is charged on.
The conversion is shown rather than hidden — *$3,200 per month (20 working days) works out
at $160 a day or $20 an hour* — because a divided-down monthly rate is the number somebody
will query. Working time, not calendar: a month is four weeks of five days, a day is eight
hours.

Alec's call: **charge basis is per machine**, so a monthly excavator can cost daily while a
monthly pump costs hourly.

Two rules, deliberately separate:

| Rule | What it does |
| --- | --- |
| **Minimum hire** | a short day charges *up* to the minimum, at the normal rate — 2 hrs against a 4 hr minimum costs 4 hrs |
| **Stand-down** | a day on site and not worked charges its own reduced rate |

A minimum in hours means nothing when the job is charged by the day, so that rule dims
itself. And **stand-down is a share of the day rate whatever the charge basis** — pricing
it off the hourly rate put a rained-off day at $10 instead of $80.

The form works all three through on a real day so the rules are not abstract.

**Wet hire is gone from the machine. Each machine has its own cost rate** — one figure, in whichever unit it
is charged by. The base still keeps a wet hire rate, but that is a dayworks charge-out
rather than the machine's cost, and an operator's time is a timesheet.

Save is held until the machine has a name, an ID, a type and a rate, with the footer naming
which. A duplicate ID is refused — two machines on one ID is two meters landing on one
record.

## Plant charge-out — 2026-08-28

A machine's charge-out is now **stored on the machine** as a dry rate (machine only, no
operator), and wet hire is what it actually is: that rate with an operator packaged in.

It was derived — `wet − the operator's sell` — which made a machine's rate depend on who
was driving. The demo data showed it: the Bobcat charged **$60/hr** under one operator and
**$56/hr** under another, same week. Pushed further, the 20T Excavator would have gone from
$130 to $177/hr depending on whether a foreman or a labourer sat in it. A rate is a property
of the machine.

| | Before | After |
| --- | --- | --- |
| Rate per machine | varied by driver | one, stored |
| Water Cart (no wet rate) | never charged out | $115/hr |
| Dayworks revenue | $17,622 | $17,547 (−$75) |
| Margin | 21.2% | 20.8% |

The derivation stays as a **fallback** for a machine with no dry rate set, so nothing breaks
before one is entered — the form says so when the field is blank.

**The stored rate is a default, not the last word.** A project that maps its own dayworks
rate onto a machine overrides it, and the form says that in as many words. Alec's call.

The form shows the charge-out against the cost rate so the margin on the machine is visible
where both are set: *$153 per hour against $145 of cost — 5% margin on the machine.*

## Charge-out rates set, and wet derived — 2026-08-28

The six dry rates were the values that fell out of the old derivation, which left the 20T
Excavator charging $153 against $145 of cost — a 5% margin that reads as a data fault. Set
properly against cost:

| Machine | Cost/hr | Charge/hr | Margin |
| --- | --- | --- | --- |
| 20T Excavator | $145.00 | $195 | 25.6% |
| 5T Excavator | $95.00 | $130 | 26.9% |
| 10T Tipper | $110.00 | $150 | 26.7% |
| Bobcat / Skid Steer | $85.00 | $115 | 26.1% |
| Smooth Drum Roller | $98.00 | $135 | 27.4% |
| Water Cart | $86.84 | $120 | 27.6% |

**Wet hire is now derived, not stored** — `dry + the packaged operator's sell` — so the two
cannot drift apart. Holding both was two rates for one machine. Verified `wet = dry +
operator` for all six. Dayworks margin moves 20.8% → 30%.

One trap worth remembering: computing the wet list at definition time threw a
`ReferenceError`, because `PLANT_FLEET` is declared further down the file than
`WET_HIRE_RATES` — a `const` in its temporal dead zone. It is computed on first use instead.

## The diary's plant page is the day's roster — 2026-08-28

It listed only machines with cost booked that day, so a machine sitting on site doing
nothing was simply absent — which is the machine a diary most needs to account for, since
an idle machine still costs. Now every machine on the project appears with:

- **who is on it** (all operators, where more than one worked it)
- **its state** — Working / Stood down / Not on site
- **hours, hourly rate, cost and allocation**

Stand-down is *recorded* here and *priced* by the equipment register, so the register sets
the rule and the diary records the day. Clicking the status chip on an idle machine stands
it down and the cost appears — the Roller at $392, half its $784 day.

Two bugs this surfaced:

- The rate column showed the machine's **period** rate under an `/hr` heading: $1,160/hr
  for a $1,160-per-*day* excavator, $3,300/hr for a per-*week* water cart. The table shows
  hours, so the rate beside them is now hourly and reconciles against the cost.
- Stand-down only configured for **hired** plant, so all six owned machines read "no
  stand-down rate set" and the feature looked broken. An owned machine sitting in the rain
  still ties up capital, so the rule now applies whoever owns it.

## The delivery tracker is a dated snapshot — 2026-09-01

Columns now read **Description, Supplier, Source** — the description is what someone scans
the list for, so it leads.

**Source is only ever a PO or a Bill.** A docket was showing there, and a docket is not what
was ordered — it is one delivery against the thing that was ordered. Dockets moved into the
build-up where they belong.

**Clicking the order opens the build-up**: the order itself, then every docket that has
landed against it as at the day being viewed, and what lands after. That is where a
delivered figure comes from, and it was previously nowhere.

**The row is a snapshot of that day.** Delivered-to-date is cumulative, so the same order
reads differently depending on which day the diary is open on:

| As at | Ordered | Delivered | To deliver | Dockets |
| --- | --- | --- | --- | --- |
| 07 Aug | 25 m³ | 3 m³ | 22 m³ | 2 |
| 17 Aug | 25 m³ | 9 m³ | 16 m³ | 4 |
| 31 Aug | 25 m³ | 18 m³ | 7 m³ | 7 |

Ordered holds steady, delivered only ever grows, remaining only ever shrinks.

What made this possible: the source reference used to be generated **per day**, so one order
appeared as a new line every day it was delivered against. It is now stable per line,
supplier and cost state, with the day's docket hanging off it.

Ordered quantity is a demo assumption — total delivered across the period ÷ 0.72, so a job
is never shown as having taken every last unit of every order. Held in one place.

## The description is the material — 2026-09-01

The tracker described the **work** — "Bulk Earthworks — Cut to Fill" — where what turns up
on a truck is select fill or road base. A delivery tracker that names the work item cannot
say what was delivered, which is the one thing it exists for.

Material names are the ones the base already uses on its cost-plus invoices and budget
lines: road base 20mm, N16 bar & mesh, geofabric, RCP pipe, concrete kerb units, select
fill. The gaps are filled with the obvious equivalent per cost centre — that part is new
data, like the chart of accounts. Unit and rate still come from the budget line, so the
money ties: the material is what is delivered, in the line's unit, at the line's rate.

The work the delivery was for is kept and shown under the cost centre in the build-up, so
nothing is lost by leading with the material.

**Each docket names its cost centre**, beside the docket reference, with the work under it.

## Two views: with rates and without — 2026-09-01

A supervisor keeps the diary without necessarily being allowed to see pay rates or plant
costs. **Full view / Supervisor** switches the whole diary between them.

Masking is all-or-nothing by construction. Hide the rate but leave cost and quantity and
the rate is cost ÷ quantity; hide the cost but leave the rate and it is rate × hours. So
every money figure in the diary goes through **one** formatter, and that formatter masks —
which covers figures nobody thought about, rather than relying on having remembered each
call site. Verified by walking every visible text node on the page: **zero money figures
visible** in supervisor view, including inside the build-up panel.

One limit worth stating: values already rendered into a *closed* drawer stay in the DOM
until it re-renders. Nothing is on screen, but this is a view, not a security boundary —
a real implementation withholds the numbers server-side.

## Miscellaneous, on the same logic — 2026-09-01

Misc had the defect materials had, so it takes the same fix rather than a copy of it:
`materialTracker` became `orderTracker(kinds, iso)` and both tables run it. Same three
columns in the same order, the same rule that a source is only ever a **PO or a Bill**,
the same click into the build-up, the same dated snapshot.

Misc was one row per day at ordered 1, delivered 1 — nothing accumulated and there was
nothing behind a line, because the source reference was keyed on the day. It is now keyed
on item + supplier + state, so an arrangement is one line that grows. Misc items got real
unit rates (a fill, a load, a visit) so a quantity means something; the money still comes
from the ledger.

**A subcontract is claimed as a percentage of its value.** The first cut showed
"25 claims @ $113/claim" — a fabricated total, being the first claim's cost times a made-up
claim count. A lump-sum subcontract has no unit rate: it has a value, and a progress claim
draws a share of it. So the line reads 100% of contract, the share claimed to date, and a
rate that is simply the value ÷ 100 — and every column then states something true. Verified:
claimed cost ÷ contract value = the percentage shown, exactly.

Misc is *not* drawn down on the 0.72 assumption materials use. A permit or a disposal run is
bought and it is done; only things bought in bulk — materials, and a subcontract — have an
order bigger than what has been taken from it.

**Ties, as at 2026-09-01:** tracker lines against the ledger, $0 gap on both materials and
misc, once uncoded bills are excluded. The remaining difference is exactly the uncoded
amount ($4,002 material, $667 misc, $2,001 sub) — an uncoded bill has no cost centre yet,
so it cannot sit on a line. That is the bill-coding gap doing its job.

**Supervisor view** covers misc for free, because it masks at the one formatter rather than
per call site. Verified across all four panels and with the build-up open: zero money
figures visible.

## Verified

Computed styles, visible-text length and element counts on both guest tabs were
compared against the two originals served side by side: styles match property for
property, and content matches exactly (site diary 1833 chars, daily cost 1266).
Drawers, month navigation, toasts, the diary's mode switch and drawer step flow
all work, the base wizard still runs end to end, and the console is clean.

## Known rough edges

- Two bugs from the wizard-shaped first cut, both fixed, both worth remembering:
  `.disabled` was applied to `.choice-card` when the base only defines that state for
  `.schedule-card`, so the cards rendered at full opacity while the handler silently
  refused — they looked clickable and did nothing. And the form's crew container reused
  `id="tsWorkers"`, which the list page already uses for its Workers stat tile, so
  `getElementById` returned the tile and the crew cards were written into it.
  See [[a-duplicate-id-fails-where-you-are-not-looking]].

- A cost centre with no deliverable budget line falls back to a generic material row
  named "<cost centre> materials".
- Weekend cells render a `$0` day total rather than staying blank. The guest's own
  rendering; left alone.

## Not carried over

The site diary's `mobile.html` has no tab of its own — it is a separate screen,
not a view of the desktop diary. It stays in its original folder.
