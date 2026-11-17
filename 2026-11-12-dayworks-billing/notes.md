# Dayworks billing: dockets to variations and progress claims, inside a project

Clickable static prototype for:

- **VAR-23036** Convert daywork dockets into a variation
- **VAR-23037** Convert daywork dockets into a progress claim
- **VAR-23062** Not claimable and **VAR-23063** Send back (how the pickers treat those dockets)
- **VAR-23035** Dayworks Calculator (where docket values come from)

Live: https://varicon-naxa.github.io/prototypes/2026-11-12-dayworks-billing/

Built 2026-11-12. **Rebuilt 2026-11-17** to sit inside a Varicon project and mirror the real pages (checked in app.varicon.com.au that day, project VAR004 Bourke Street Roadworks, Cookie's Civil), with Varicon's own statuses.

Files: `index.html` (shell and styles), `engine.js` (pricing, docket, variation and claim rules), `app.js` (screens), `scenarios.js` (worked examples, 43/43 passing). State is in memory and resets on reload.

## Layout

Varicon sidebar, project header "(RRU01) Riverside Rd Upgrade", and the project tab strip. Only three tabs work:

- **Daywork Record**: "Daywork Record list" with the filters row, Dayworks Claim Summary Status, status tabs with counts (ALL, Draft, Ready for Review, Submitted, Approved, Costed, Invoiced, Rejected, Not claimable), the orange Add Daywork Record bar (inert) and the ⋮ menu (Charge Resource, Daywork Project Setting, Daywork Report Setting, Feedback Form; inert). New: row checkboxes with **Create variation** and **Add to claim**, a Calculator value column and an "On V009 / On Claim 4" marker. A row opens the docket page: header, Labour, Plant and Equipment, Materials tables with calculator pricing per line, the "fields are locked since the signature is signed" notice with Reopen, and bottom actions (Mark as costed, Mark as invoiced, Send back, Not claimable, and simulated client sign or reject).
- **Variation Register**: Estimated Cost / Submitted Amount / Approved Amount tiles, Filter by Status, Export, Import, and **New Variation** with "Blank variation" (inert) and **"From dockets"** (opens the picker). Docket variations expand to one sub-line per docket (V009.1, V009.2). A docket variation opens as Edit Variation (task name, Revision, WBS ID, Claim Ref, Cost Centre, Submitted / Approved Amount, Margin, Budget Sum) with tabs **Dockets** (new: lines, flags, add, remove, submit, approve, history), Cost (inert) and Contract (each docket is one contract line, qty 1 at its value). Three hand-entered variations (V001 to V003) sit alongside for realism.
- **Claim**: Completion, Grand Total, Claim To Date, contract and variation tiles, the Contract Details table (with a new Dayworks row), **Make New Claim**, and the Claims list (Claim Number, Date Submitted, Date Approved, Invoice Ref, Claim Period, Status, Claim Amount). Claims 1 and 2 predate dockets; claim 3 is the October docket claim. A claim opens as Claim # n with Invoice Ref, Claim Period, the Previously Claimed / Current / To Date / Remaining bar, tabs **Contract / Variation / Dayworks (new) / Retention**, the sticky footer (Contract Works, Variations, Dayworks, Total Claim, Retention Held, GST, Revised Total) and the ⋮ menu (Download PDF, Download Excel file, View attachment inert; Reopen Claim; Delete claim).

The **Prototype** button (bottom left) opens a drawer with the simulation controls (today's date, publish a calculator rate change, late docket, reset), the change log, the scenarios with their pass count, and the current calculator rates. The calculator itself is a later build and is not in this prototype.

## Decided (Alec, 2026-11-17, on top of every earlier decision in VAR-23036 / VAR-23037)

Statuses are Varicon's own:

- Docket: Draft, Ready for Review, Submitted, Approved, Costed, Invoiced, Rejected, plus Not claimable (VAR-23062). An Approved docket has Mark as Costed, Mark as Invoiced and Reopen.
- Variation: Pending, Approved, Partial Approved, Non-Claimable, Rejected.
- Claim: Draft, Submitted, Approved. "Issued" in the tickets = Approved.

Rules:

- **Pickers** (variation and claim) offer any docket except Draft and Rejected: Ready for Review, Submitted, Approved, Costed and Invoiced. Ready for Review and Submitted are highlighted "not yet approved" and counted in the warning. Not claimable and already-used dockets are hidden; unmapped and overlapping dockets are listed and blocked.
- **Starting a variation**: Variation Register > New Variation > From dockets, or tick dockets on the Daywork Record tab > Create variation.
- **Variation statuses**: unsubmitted and submitted are both Pending. "Submit to client" fills Submitted Amount and starts revision 1. "Changed since submitted" is a flag, not a status.
- Approved for less than submitted = **Partial Approved** (the shortfall marker, absorbed / under dispute / to resubmit, still records why). The same or more = Approved. Both lock the dockets and are claimed by percent.
- Dropping a variation the PM won't pursue = **Non-Claimable** (replaces Withdrawn): it stays on the register and its dockets are freed. Client rejection = Rejected, dockets freed.
- **Claims**: docket lines sit on a new **Dayworks** tab beside Contract / Variation / Retention. Make New Claim works as today and its Dayworks tab offers the dockets (in-period pre-ticked). The Daywork Record tab also has "Add to claim".
- **Approving a claim** freezes its lines, locks its dockets and moves its docket lines' dockets to **Invoiced**.
- **Reopen Claim** on an approved claim: its dockets stay locked and Invoiced at their frozen values. New dockets can be added and freeze on the next approval.
- A docket on a variation moves to Invoiced only when the variation reaches **100% claimed** on approved claims.

Everything earlier still holds: one line per docket at full calculator value, no margin; lines follow their dockets until approval with "changed since added" flags and full history; a rejected, unmapped or overlapping docket on a record blocks submit and approval; any edit to a signed docket returns it to Submitted; the approved amount defaults to the current lines total; variations are claimed by percent to date with credit lines for a lower percent; a 100%-claimed variation is still offered unticked; a negative claim can be approved and goes to accounting as a credit note; retention and GST follow Varicon's existing rules; the calculator effective date cannot be before the last approved claim or variation.

## Decided (Alec, 2026-11-17, answers to the rebuild's open questions)

- **Credit back after 100%.** If a docket variation was 100% claimed (its dockets went Invoiced) and a later claim credits it back below 100%, its dockets stay Invoiced.
- **Not claimable** can be set from Draft, Ready for Review, Submitted, Approved or Costed (not Invoiced or Rejected). Reopening returns the docket to its previous status.
- **Reopen** on a signed Approved or Costed docket clears the signature and sends it to Submitted for re-approval. On a record its line is flagged and the change kept in the record's history. Invoiced dockets have no Reopen.
- **Estimated Cost** on a docket-built variation is the dockets' actual cost (timesheet and plant cost, as in Daily Cost Tracking): worked hours at internal cost rates, materials and subcontract at cost. It shows per docket sub-line and in total on the Variation Register, and on the variation page with the margin (charge minus cost, and as a % of the charge). The seed holds simple internal **cost** rates, labelled as cost and never charged: labour per hour by role (Leading Hand $55, Operator $60, Labourer $45, Plumber $50), Excavator 20t $95/h plus the operator, Breaker 1t $20/h, float $300 per move, road base $30/t, other materials and subcontract at cost. They are listed in the Prototype drawer under Calculator rates.
- **Submitted claims.** Dockets can be added to or removed from a Submitted claim until it is Approved. Each change flags the claim "changed since submitted" (list and claim page) and is kept in the claim's history; approval clears the flag.

- **Hand-invoiced dockets.** A docket marked Invoiced by hand is offered to variations and claims: Alec chose "anything but Draft and Rejected" for both pickers (2026-11-17), and VAR-23037 carries the example.

## Open questions for Alec

None.
