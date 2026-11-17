# Dayworks billing, lean release: copy dockets in, then a normal variation

Built 2026-11-18 as a smaller first release to compare against the full prototype. Cut down from `2026-11-12-dayworks-billing`, keeping the same Varicon project shell (sidebar, project tabs, Prototype drawer), the same seed project (Riverside Rd Upgrade) and the same Dayworks Calculator pricing engine.

Live: https://varicon-naxa.github.io/prototypes/2026-11-18-dayworks-billing-lean/
Compare: [full](https://varicon-naxa.github.io/prototypes/2026-11-12-dayworks-billing/) · [middle](https://varicon-naxa.github.io/prototypes/2026-11-18-dayworks-billing-middle/)

Files: `config.js` (`RELEASE = 'lean'`), `engine.js`, `app.js`, `scenarios.js` (10/10 passing), `index.html`. The engine, screens and scenarios are the same files as the middle release; `config.js` switches between them.

## What's in

- **One entry point**: Variation Register > New Variation > From dockets.
- **Picker** offers Approved and Costed dockets only, not on a variation and not Not claimable. Unmapped and overlapping dockets are listed and blocked. No not-yet-approved warning.
- **Variation** is Pending with one subtask line per docket at its calculator value **at the moment it is added** (a snapshot), the docket attached and an "On V0xx" marker on the docket. More dockets can be added while it is Pending and not submitted.
- **Refresh from dockets** (Pending only) reprices every line to the current calculator value and writes old to new in the history. Otherwise values never move on their own; the page notes when the calculator prices a docket differently from its line.
- **Locking**: a docket on a variation is read-only (no edits, no Reopen, no Not claimable) until its line is removed. To fix one: remove the line, the docket is freed, reopen and edit it, then add it again.
- **Variation flow as today**: Pending, Submit (fills Submitted Amount), approve with an editable Approved Amount. Less than submitted = Partial Approved, otherwise Approved. Approval freezes the lines. Non-Claimable or Rejected keeps it on the register and frees its dockets; deleting a line frees that docket.
- **Claims**: dockets reach a claim only through their approved variation, on the existing Variation tab, by percent to date. Credit lines for a lower percent and a negative claim as a credit note work as already built.
- **Daywork Record tab** for viewing: dockets, status tabs, the docket page, Mark as Costed, Mark as Invoiced, Reopen, Not claimable.

## What's out vs the full version

- Live repricing, "changed since added" and "changed since submitted" flags, the revision prompt.
- The shortfall marker and adjustment line on a lower approval.
- Bulk Create variation / Add to claim on the Daywork Record tab.
- Ready for Review and Submitted dockets in the picker, and the not-yet-approved warning.
- A Dayworks tab on claims (dockets as claim lines).
- Auto-Invoiced: dockets keep their status through claims; users mark them Invoiced by hand.
- Estimated Cost from dockets (shows "-"; the Cost tab is as today).

## Decisions source

The scope above is from Alec via the coordinator brief of 2026-11-18. Everything not listed there keeps the full prototype's decided rules (VAR-23036, VAR-23037 and Alec's answers of 2026-11-16 and 2026-11-17; see the full prototype's `notes.md`).

## How the prototype reads one point (literal reading, not a new decision)

- Mark as Costed and Mark as Invoiced are status marks, not edits, so they stay available on a docket that is locked on a variation (the brief keeps both on the Daywork Record tab and has users mark Invoiced by hand after billing).

## Open questions for Alec

1. Refresh from dockets on a variation already submitted to the client changes its Submitted Amount with no flag or revision. Should Refresh be allowed only before submit, or should a refresh after submit prompt a new revision to the client?
