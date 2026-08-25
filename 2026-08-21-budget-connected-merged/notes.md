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
