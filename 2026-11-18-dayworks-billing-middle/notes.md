# Dayworks billing, middle release: lean plus live repricing

Built 2026-11-18 as a smaller first release to compare against the full prototype. Cut down from `2026-11-12-dayworks-billing`, keeping the same Varicon project shell (sidebar, project tabs, Prototype drawer), the same seed project (Riverside Rd Upgrade) and the same Dayworks Calculator pricing engine.

Live: https://varicon-naxa.github.io/prototypes/2026-11-18-dayworks-billing-middle/
Compare: [full](https://varicon-naxa.github.io/prototypes/2026-11-12-dayworks-billing/) · [lean](https://varicon-naxa.github.io/prototypes/2026-11-18-dayworks-billing-lean/)

Files: `config.js` (`RELEASE = 'middle'`), `engine.js`, `app.js`, `scenarios.js` (11/11 passing), `index.html`. The engine, screens and scenarios are the same files as the lean release; `config.js` switches between them.

## What's in

Everything in the lean release, except that line values are **live until approval** instead of a snapshot:

- Each line follows its docket's current calculator value until the variation is Approved or Partial Approved. A line that moves is flagged "changed since added" and the change is kept in the history.
- A submitted variation whose amount moves shows "changed since submitted" and a **Send new revision** prompt. Approving while it shows is allowed, at the current total, and the warning is recorded.
- Approval freezes the lines; later rate changes move nothing.
- No Refresh button.
- Dockets on a Pending variation are still locked, so live changes come only from calculator rate changes, not docket edits.

Shared with lean:

- One entry point: Variation Register > New Variation > From dockets.
- Picker offers Approved and Costed only, with unmapped and overlapping dockets blocked and no not-yet-approved warning.
- One line per docket, with an "On V0xx" marker. More dockets can be added while Pending and not submitted.
- Locking until the line is removed.
- Today's variation flow. Partial Approved has no shortfall marker or adjustment line.
- Non-Claimable, Rejected or deleting a line frees the dockets.
- Claims through the Variation tab only, by percent to date, with credit lines and negative claims.
- No auto-Invoiced; dockets are marked Invoiced by hand.
- No estimated cost from dockets.

## What's out vs the full version

- Bulk Create variation / Add to claim on the Daywork Record tab.
- Ready for Review and Submitted dockets in the picker, and the not-yet-approved warning.
- Editing a docket while it is on a variation (here it must come off first).
- The shortfall marker and adjustment line on a lower approval.
- A Dayworks tab on claims (dockets as claim lines).
- Auto-Invoiced.
- Estimated Cost from dockets.

## Decisions source

The scope above is from Alec via the coordinator brief of 2026-11-18. Everything not listed there keeps the full prototype's decided rules (VAR-23036, VAR-23037 and Alec's answers of 2026-11-16 and 2026-11-17; see the full prototype's `notes.md`).

## Decided (Alec, 2026-11-18)

- Mark as Costed and Mark as Invoiced are allowed on a docket that is locked on a variation; they change its status only (no edits, no Reopen).

## Open questions for Alec

None.
