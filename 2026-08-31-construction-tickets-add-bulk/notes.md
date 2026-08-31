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

1. **Add ticket** — the worker-drawer form with a **Worker** field on the front. Same fields, same
   Save as draft / Publish. Worker is multi-select, because the real event is a crew sitting the
   same course on the same day; selecting more than one turns the number field into one row per
   worker, since the certificate number is personal and the course is not. One submission, N records.
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

**Nine rules the prototype commits to** (full text on the *Rules & open questions* tab): one form
behind both entry points · multi-worker add · ID decides create-vs-update · strict worker matching ·
unknown ticket types never appear silently (one checkbox adds them to the catalogue, otherwise those
rows error) · blank expiry derives from the type's rule and a **past expiry imports as Expired**,
because that is the risk you're loading the data to see · documents can't come through a spreadsheet,
so rows needing one land as **Draft — document missing** in the Draft tab that already exists,
flagging rather than blocking · the review step is a dry run and the only path that writes · every
import is one reversible batch recorded in Activity.

**Ticket types are a second mode of the same wizard** — code, name, category, expiry rule, document
required, states — matched on Code, feeding Manage Ticket Types. Do that first if the catalogue
isn't set up, because worker tickets are validated against it.

**Views.** *Screen today* (recreation with the four defects annotated) · *Add ticket* (live — pick
workers, publish, watch the register and the tiles move) · *Bulk upload* (live wizard, real CSV
download, twelve-row sample file that exercises new, update, missing document, past expiry, unknown
ticket type, ambiguous name, unknown employee ID and a blank required field) · *Rules & open
questions*.

**Three open questions, shown rather than answered.**

1. **One importer or two doors?** Bulk upload needs an entry point on this page, but it should be
   Initial Data Upload scoped to tickets, not a second codebase. If it can't be, this replaces
   Initial Data Upload's tickets section rather than sitting beside it.
2. **Who loads a subcontractor's tickets?** The export/re-upload pair is exactly the shape you'd
   hand a subbie to fill in themselves — a different permission model, probably a different release.
3. **Does an expired ticket stop anything?** The register only pays for itself when an expired
   high-risk licence is visible where work is assigned — scheduler, SWMS, site sign-in. Flag, don't
   block, per the standing decision. Out of scope here, and the reason the page matters.

Worker names and companies are invented. The single real row (B K · Plant Equipment Operator
RIIWHS201D · #532534 · 24 Aug 2023) is carried through so the recreation matches the screenshot.
