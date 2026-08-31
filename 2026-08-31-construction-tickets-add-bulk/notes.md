# Construction Tickets — add from the list, and bulk upload

Built 31 Aug 2026 from two screenshots of production: the Construction Tickets list under
User Management, and the *Add ticket / certification* form on the worker drawer's TICKETS tab.
Follows on from `2026-05-21-worker-construction-tickets`, which built the register itself.

**Problem.** The page that owns the ticket data cannot create any.

- There is **no add control on the list page**. The only route in is Workers → open a worker →
  Tickets tab → Add ticket. A crew of forty is forty drawers.
- The tiles read **1 total, 0 expired, 0 expiring soon, 0 valid**. The one ticket on file has no
  expiry, so it belongs to none of the three status buckets. Every "No expiry" ticket is invisible
  in the compliance count, and the page reports nothing at risk when the truth is that nothing is
  being measured.
- One ticket across the entire workforce is an entry problem, not a data problem. Nobody keys a
  year of licences one at a time, so the register stays empty and the dashboard above it stays
  meaningless.
- **Initial Data Upload** already sits top right — a tenant-wide importer people meet once, at
  onboarding, and never find again. Tickets churn forever: every renewal, every new hire, every
  subbie crew.

**Fix.** Two buttons on the list page, one grammar.

1. **Add ticket** — the worker-drawer form with a **Worker** field on the front, opened as a
   **right-hand side panel**, the pattern the rest of the product already uses (Alec's call,
   31 Aug 2026 — not an inline panel on the page). Scrim behind it, Esc and click-away close it,
   the list stays visible so you can add several without losing your place. Same fields, same
   Save as draft / Publish. **One worker per ticket** (Alec's call, 31 Aug 2026) — a ticket's
   number, document and expiry all belong to one person. A crew of six who sat the same course is
   six rows, and keying those one at a time is the wrong tool: it is the case bulk upload exists
   for, which is why the two buttons sit side by side.
2. **Bulk upload** — a four-step wizard: what you're uploading → download the template → upload and
   match columns → review before importing.

**The export option, which is the whole design.** The template can come down three ways, and the
difference between them is a locked `Record ID` column:

| Template | Contains | What a returned row does |
|---|---|---|
| Pre-filled with workers | A row per active worker, details locked; ticket columns blank | Creates, attached to the right person by ID — nobody has to spell a name our way |
| Pre-filled with workers **and** their tickets | Everything on file today | **Updates** the exact ticket it came from. The renewal-run and clean-up path |
| Blank | Headers only | Creates. Worker matched on employee ID, then email, then exact name within company |

A row with a Record ID updates. A row without one creates. Nothing is ever matched on a person's
name alone to decide between the two, and an ambiguous match is an error row rather than a guess —
a licence on the wrong person is worse than a licence not imported.

**Ten rules the prototype commits to** (full text on the *Rules & open questions* tab): one form
behind both entry points · one worker per ticket · ID decides create-vs-update · strict worker matching ·
unknown ticket types never appear silently (one checkbox adds them to the catalogue, otherwise those
rows error) · blank expiry derives from the type's rule and a **past expiry imports as Expired**,
because that is the risk you're loading the data to see · documents can't come through a spreadsheet,
so rows needing one land as **Draft — document missing** in the Draft tab that already exists,
flagging rather than blocking · the review step is a dry run and the only path that writes · every
import is one reversible batch recorded in Activity.

**Ticket types are a second mode of the same wizard** — code, name, category, expiry rule, document
required, states — matched on Code, feeding Manage Ticket Types. Do that first if the catalogue
isn't set up, because worker tickets are validated against it.

**Views.** *Screen today* (recreation with the four defects annotated) · *Add ticket* (live — pick a
worker, publish, watch the register and the tiles move) · *Template today* (the real
`Employee_Upload_Template.xlsx` pulled apart, with the revised workbook to download) · *Bulk upload*
(live wizard over both sheets, twelve-row sample file that exercises new, update, missing document,
past expiry, unknown ticket type, ambiguous name, unknown employee ID and a blank required field) ·
*Rules & open questions*.

**Three open questions, shown rather than answered.**

1. ~~**One importer or two doors?**~~ **Answered by the file** (see the revision below): there is
   one importer — the Employee Upload Template behind Initial Data Upload — and it already has a
   Tickets column, so this is an edit to that workbook, not a new importer. What remains open is
   whether the Tickets page's door and the Initial Data Upload door share one wizard, or the
   tickets door is a thin scoped version of it.
2. **Who loads a subcontractor's tickets?** The export/re-upload pair is exactly the shape you'd
   hand a subbie to fill in themselves — a different permission model, probably a different release.
3. **Does an expired ticket stop anything?** The register only pays for itself when an expired
   high-risk licence is visible where work is assigned — scheduler, SWMS, site sign-in. Flag, don't
   block, per the standing decision. Out of scope here, and the reason the page matters.

Worker names and companies are invented. The single real row (B K · Plant Equipment Operator
RIIWHS201D · #532534 · 24 Aug 2023) is carried through so the recreation matches the screenshot.

---

## Revised 31 Aug 2026 against the real template

Alec supplied `Employee_Upload_Template.xlsx`. It changes the design, because **ticket import
already exists** — and stops one field short of being useful.

The workbook has 12 sheets: EMPLOYEES (13 columns), six hidden lookup sheets feeding dropdowns,
and five visible sheets reprinting the same lists, one of which (Pay Category) is a header and
nothing else. Column **M, Tickets**, is a single-select dropdown from a hidden `_Tickets` sheet
of 8 types. Its cell comment: *"Pick a ticket type from the dropdown. On import it is added to
the employee as a DRAFT ticket to complete later."*

**Four things wrong with column M**

1. One dropdown cell is **one ticket per employee**. Most workers hold three or four.
2. It carries the **type and nothing else** — no number, issued, expiry, issuing body, state. So
   every import is a draft shell someone opens and completes by hand: the drawer-by-drawer work
   is moved, not removed. With no expiry, the register still can't say what lapses next month.
3. The workbook **already has the multi-value idiom** — Allowances and Form Numbers both say
   "separated by a comma". Tickets, the column with the dropdown, takes one. (Comma-separation
   wouldn't be enough for a ticket anyway; the inconsistency just shows it was an afterthought.)
4. **Nothing round-trips.** The file ships three dummy rows with blank Company and Role. It is a
   create-only form, so there is no correct-at-scale path and no protection against a second
   upload duplicating everyone — which is exactly Alec's ask.

**So this is not a new importer.** Three edits to the workbook they already have:

- A locked **Record ID** column in front of EMPLOYEES, present only on an export of real
  employees. It is what makes a re-upload update instead of duplicate.
- A second sheet, **TICKETS** — one row per ticket, keyed on Employee ID, carrying Ticket Type,
  Number, Issued, Expiry, Issuing Body, State, Notes and a read-only Document column, with its
  own locked **Ticket Record ID**.
- **Column M stays and keeps working** so no saved workbook breaks. Its comment now says what it
  does and points at the TICKETS sheet; where an employee appears there, column M is ignored for
  that employee.

`Employee_Upload_Template_round_trip.xlsx` in this folder is the real thing, not a mockup: the
production file with those edits applied, dropdowns repointed after the column insert,
validations widened to 500 rows, a hidden `_State` lookup added, the empty Pay Category sheet
dropped, and Varicon-voiced cell comments on every new column.

**Two things in the supplied file worth a separate look.** `_Role` carries `milan`,
`SagarTestResource` and `Supervisor 1` — test data in a customer-facing dropdown *(possibly just
the tenant this copy came from — unverified)*. And `_Tickets` names its eight types
inconsistently: five carry a code, "Working at Heights" and "Driving Licence" don't. Types are
about to be matched on name, so that list wants a tidy first.

---

## Multi-ticket lives in the workbook, and everything imports as Draft (31 Aug 2026)

Alec's clarification: **multiple tickets belong on the Excel, not on the add panel.** The side
panel stays one worker, one ticket. Two changes to the workbook instead:

- **Column M takes several ticket types separated by a comma** — the idiom the file already uses
  for Employee Payroll Allowance and Form Numbers. No mechanical change was needed: the column's
  data validation has `showErrorMessage=False`, so the dropdown was only ever a spelling aid and
  a typed multi-value has always been accepted. Each type listed creates a draft shell.
- **The TICKETS sheet carries the detail** — one row per ticket, so a worker holds as many as
  they hold, each with number, issued, expiry, issuing body, state and notes. Where an employee
  appears on both, the TICKETS sheet wins.

**Everything an import creates lands in Draft.** Not only the incomplete rows. An import is
someone else's spreadsheet arriving in a compliance register, so it is checked before it counts:
imported tickets sit in the Draft tab that already exists and are published from there, each
carrying its reason — document missing, no number, expired on arrival, or simply not yet
reviewed. This is what the production template already does with column M; the rule is now stated
rather than buried in a cell comment. The wizard's review step and the import summary both say so.

**The export carries the prototype's own people.** Alec's instruction, so the sheet and the screen
can be read against each other: the workbook ships the same eight workers the Tickets page shows,
their real employee IDs, phone numbers and current tickets — no invented sample rows sitting
beside them. Worker record IDs are `WKR-000n` and ticket record IDs `TKT-000n`, deliberately
unlike the `EMP-` employee IDs so the two are never confused.
