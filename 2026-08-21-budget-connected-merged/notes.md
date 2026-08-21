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

## Verified

Computed styles, visible-text length and element counts on both guest tabs were
compared against the two originals served side by side: styles match property for
property, and content matches exactly (site diary 1833 chars, daily cost 1266).
Drawers, month navigation, toasts, the diary's mode switch and drawer step flow
all work, the base wizard still runs end to end, and the console is clean.

## Known rough edges

- A cost centre with no deliverable budget line falls back to a generic material row
  named "<cost centre> materials".
- Weekend cells render a `$0` day total rather than staying blank. The guest's own
  rendering; left alone.

## Not carried over

The site diary's `mobile.html` has no tab of its own — it is a separate screen,
not a view of the desktop diary. It stays in its original folder.
