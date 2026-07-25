# Project setup gaps — Projects list

## Problem

A project can be created (or imported) without cost centres and without Xero tracking
categories assigned. Nothing on the Projects list says so. It only surfaces later when
costs land in the wrong place or the Xero sync posts untracked, and by then it's a
clean-up job. Fixing it today means leaving the list, opening the project, going into
settings, saving, and coming back.

## What this prototype shows

1. **A "Setup" column on the Projects list.** Complete projects show a quiet grey
   `✓ Complete`. Incomplete ones show an amber `⚠ Setup incomplete` chip, and the row
   gets a faint amber tint so it reads at a glance.
2. **A summary banner** — "3 projects are missing setup" with a *Fix now* button that
   jumps straight into the first one. Turns green once everything is clean.
3. **A "Setup incomplete" filter chip** in the toolbar with a live count, to work
   through only the affected projects.
4. **A quick-assign popup** opened from the chip — cost centres (searchable multi-select,
   with *Select all* and *Use org default set* shortcuts) and tracking categories (one
   dropdown per Xero category). Validates on save, then the row flips to Complete with a
   confirmation toast. No page navigation.
5. **"Apply the same setup to the other N projects"** checkbox — for the common case
   where a batch of imported projects all need the same allocation.

## Open questions for review

- Should the flag be a dedicated **Setup** column, or an inline icon next to the project
  name (saves horizontal space, less obvious)?
- Should the two gaps be distinguishable on the list (e.g. "No cost centres" vs
  "No tracking") rather than one combined "Setup incomplete"?
- Should tracking categories be flagged at all for orgs with no Xero connection? Suggest
  the check only applies when an accounting integration is connected.
- Is "apply to all others" safe enough, or should bulk assignment live behind a
  multi-select on the list instead?
- Should this also block anything (e.g. raising a PO against an unallocated project), or
  stay purely a nudge?
