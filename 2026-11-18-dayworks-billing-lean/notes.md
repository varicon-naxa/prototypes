# Dayworks billing, lean release: dockets into the existing Add Variation form

Built 2026-11-18 as a smaller first release to compare against the full prototype, and reworked the same day to match Varicon's live Add Variation form (Alec checked the live app). Cut down from `2026-11-12-dayworks-billing`, keeping the same Varicon project shell (sidebar, project tabs, Prototype drawer), the same seed project (Riverside Rd Upgrade) and the same Dayworks Calculator pricing engine.

Live: https://varicon-naxa.github.io/prototypes/2026-11-18-dayworks-billing-lean/
Compare: [full](https://varicon-naxa.github.io/prototypes/2026-11-12-dayworks-billing/) · [middle](https://varicon-naxa.github.io/prototypes/2026-11-18-dayworks-billing-middle/)

Files: `config.js` (`RELEASE = 'lean'`), `engine.js`, `app.js`, `scenarios.js` (11/11 passing), `index.html`. The engine, screens and scenarios are the same files as the middle release; `config.js` switches between them.

## What's in

- **One entry point**: Variation Register > New Variation > From dockets. The picker offers Approved and Costed dockets that are not on a variation and not Not claimable; unmapped and overlapping dockets are listed and blocked.
- **Add Variation form, as live Varicon**:
  - Header: task name and "View task details", Revision (free text), Export, Cancel, and an orange Save Variation (Update Variation once saved).
  - The kebab menu holds only Delete Variation.
  - Fields: WBS ID, Type (Contract or Variation, default Variation), Cost Centre, Summary/Comments, Submitted Amount, Approved Amount, Margin (greyed, computed) and Budget Sum.
  - Tabs: COST, CONTRACT, and DOCKETS (docket list, flags, history).
  - Save and Update just save. The form has no status and no submit or approve buttons.
- **Status** is the dropdown on the Variation Register row: Pending, Approved, Partial Approved, Non-Claimable, Rejected, as today.
  - A new docket variation is Pending.
  - Approved or Partial Approved freezes its lines and keeps its dockets locked.
  - Non-Claimable or Rejected keeps it on the register and frees its dockets.
- **CONTRACT tab**: one row per docket subtask.
  - Task: the docket number and description.
  - Claim Reference, and Unit "docket".
  - Submitted Qty 1 at the calculator value.
  - Approved Qty 1 at the same rate, so Approved Amount = Submitted Amount from the start.
  - Approved Qty and Rate are editable while Pending, for example before setting Partial Approved.
- **COST tab**: one cost resource per labour, plant, material and subcontract line on each docket, grouped under that docket's subtask.
  - Columns: Resource, Resource Type (Labour / Plant and Equipment / Material / Subcontractor), Accounting Code, Unit, Unit Cost, Quantity, Duration, Total.
  - Unit Cost is the internal cost rate from the seed. Plant is per Hour, and wet hire adds the operator as a Labour line.
  - Quantity and Duration come from the docket hours. Materials are cost rate x qty; concrete and subcontract are at the docket's cost amount.
  - Budget Sum and the register's Estimated Cost are the COST total.
  - Margin = (Approved, or Submitted, charge - cost) / charge.
- **Snapshot values**: lines take the calculator value when each docket is added and never move on their own. The page notes when the calculator now prices a docket differently.
- **Refresh from dockets** (any time while Pending) reprices the Submitted and Approved rates on every docket line, and the COST lines, and writes old to new in the history. Revision stays the user's own text; there are no automatic revisions.
- **Locking**: a docket on a variation is read-only (no edits, no Reopen, no Not claimable) until its line is deleted. Mark as Costed and Mark as Invoiced are still allowed (status only).
- **Releasing dockets**: deleting a line frees that docket. Delete Variation removes a Pending variation and frees its dockets.
- **Claims**: unchanged. Dockets reach a claim only through their approved variation, on the existing Variation tab, by percent to date, with credit lines and negative claims as already built. There is no auto-Invoiced; users mark dockets Invoiced by hand.

## What's out vs the full version

- Live repricing and "changed since added" flags.
- Submit, revisions, the approve-amount dialog and the shortfall marker. Status is the register dropdown instead.
- Bulk Create variation / Add to claim on the Daywork Record tab.
- Ready for Review and Submitted dockets in the picker.
- A Dayworks tab on claims.
- Auto-Invoiced.

## Decided (Alec, 2026-11-18)

- The scope above, from the coordinator briefs of 2026-11-18 (live app checked).
- Mark as Costed and Mark as Invoiced are allowed on a docket that is locked on a variation; they change its status only.
- Refresh from dockets is allowed any time while Pending, reprices Submitted and Approved rates and the COST lines, and logs old to new. Revision is free text with no automatic revisions.

Everything not listed keeps the full prototype's decided rules (VAR-23036, VAR-23037 and Alec's answers of 2026-11-16 and 2026-11-17).

## Open questions for Alec

These cover the status dropdown on a docket variation. The prototype takes the reading shown in brackets; none is decided.

1. Can an Approved or Partial Approved docket variation be set back to Pending from the dropdown? (Prototype: yes, its lines unfreeze, unless it is on a claim, when it is refused.)
2. Can a Non-Claimable or Rejected docket variation be set back to another status? Its dockets were already freed and may be on another variation. (Prototype: refused; start a new variation from dockets.)
3. Can Delete Variation be used on an Approved or Partial Approved docket variation? (Prototype: Pending only.)
