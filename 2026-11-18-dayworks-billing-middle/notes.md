# Dayworks billing, middle release: lean plus live values

Built 2026-11-18 as a smaller first release to compare against the full prototype, and reworked the same day to match Varicon's live Add Variation form (Alec checked the live app). Cut down from `2026-11-12-dayworks-billing`, keeping the same Varicon project shell (sidebar, project tabs, Prototype drawer), the same seed project (Riverside Rd Upgrade) and the same Dayworks Calculator pricing engine.

Live: https://varicon-naxa.github.io/prototypes/2026-11-18-dayworks-billing-middle/
Compare: [full](https://varicon-naxa.github.io/prototypes/2026-11-12-dayworks-billing/) · [lean](https://varicon-naxa.github.io/prototypes/2026-11-18-dayworks-billing-lean/)

Files: `config.js` (`RELEASE = 'middle'`), `engine.js`, `app.js`, `scenarios.js` (11/11 passing), `index.html`. The engine, screens and scenarios are the same files as the lean release; `config.js` switches between them.

## What's in

Everything in the lean release, except that line values are **live until the variation is Approved or Partial Approved**:

- The Submitted and Approved rates on the CONTRACT lines, and the COST lines, follow the dockets' current calculator value. An Approved Rate the user edited stays as edited.
- A line that moves is flagged "changed since added", and the change is kept in the history.
- There is no changed-since-submitted flag, revision prompt or approve-over-stale warning, and no Refresh button.
- Setting Approved or Partial Approved on the register dropdown freezes the lines; later rate changes move nothing.
- Dockets on a Pending variation are still locked, so live changes come only from calculator rate changes.

Shared with lean:

- From dockets (Approved and Costed only) opens Varicon's Add Variation form.
  - Header: task name and View task details, Revision as free text, Export, Cancel, Save Variation then Update Variation, and a kebab with only Delete Variation.
  - Fields: WBS ID, Type, Cost Centre, Summary/Comments, Submitted and Approved Amount, greyed Margin, and Budget Sum.
- Tabs: COST, CONTRACT, DOCKETS.
- The CONTRACT tab has one row per docket. Unit is "docket", and both Submitted and Approved are qty 1 at the calculator value, so Approved = Submitted from the start. Approved Qty and Rate are editable while Pending.
- The COST tab has one cost resource per labour, plant, material and subcontract line at internal cost rates, grouped under each docket's subtask.
- Budget Sum and Estimated Cost are the COST total, and Margin = (charge - cost) / charge.
- Status is the register dropdown: Pending, Approved, Partial Approved, Non-Claimable, Rejected.
- Dockets are locked until their line is deleted. Mark as Costed and Mark as Invoiced are still allowed, status only.
- Delete Variation works on Pending variations only.
- Claims are unchanged: dockets reach a claim through the Variation tab by percent to date, and there is no auto-Invoiced.

## What's out vs the full version

- Submit, revisions, the approve-amount dialog, the shortfall marker and the changed-since-submitted flag.
- Editing a docket while it is on a variation (here it must come off first).
- Bulk actions on the Daywork Record tab, and Ready for Review and Submitted dockets in the picker.
- A Dayworks tab on claims.
- Auto-Invoiced.

## Decided (Alec, 2026-11-18)

- The scope above, from the coordinator briefs of 2026-11-18 (live app checked).
- Mark as Costed and Mark as Invoiced are allowed on a docket that is locked on a variation; they change its status only.

Everything not listed keeps the full prototype's decided rules (VAR-23036, VAR-23037 and Alec's answers of 2026-11-16 and 2026-11-17).

## Open questions for Alec

These cover the status dropdown on a docket variation. The prototype takes the reading shown in brackets; none is decided. They are the same three questions as in the lean release.

1. Can an Approved or Partial Approved docket variation be set back to Pending from the dropdown? (Prototype: yes, its lines unfreeze and follow live again, unless it is on a claim, when it is refused.)
2. Can a Non-Claimable or Rejected docket variation be set back to another status? Its dockets were already freed. (Prototype: refused.)
3. Can Delete Variation be used on an Approved or Partial Approved docket variation? (Prototype: Pending only.)
