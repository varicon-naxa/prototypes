# PO Revision & Approval Flow — 30/07/2026

## Problem (current behaviour)
- An approved PO can only be edited by a user with **approver** permissions.
- Hitting Submit on the edit screen writes the new values immediately — there is no
  "proposed" state, so the approved amount changes before anyone has decided on it.
- Creators (site engineers, admins) must chase an approver for every change.

## Proposed behaviour
1. **Anyone with creator access can propose an edit** to an approved PO ("Propose edit").
2. Submitting creates a **revision** (v2, v3…) routed to a nominated approver, with a
   mandatory reason for change.
3. **While pending, the PO keeps displaying the previously approved amounts.** Committed
   cost, budget, reporting and the supplier's issued PO are untouched. A "Proposed v2"
   toggle shows the side-by-side diff (old struck through, new highlighted, new/removed
   lines flagged).
4. **On approval** the proposed values become the approved values, the version increments,
   and a revised PO goes to the supplier.
5. **On rejection** nothing changes; the creator gets the reason and can amend and resubmit.
6. Creator can withdraw or edit their own pending revision; they cannot approve it.

## Prototype
`index.html` — single self-contained file.

- Persona switcher (top right): **Sarah Chen (creator)** / **Jim Smith (approver)**. The
  available actions change with the persona — this is the core of the change.
- Suggested walkthrough: as Sarah → Propose edit → change unit cost / order qty, add or
  remove a line → Submit revision (reason required) → note the PO still reads $175,100 →
  switch to Jim → Compare side by side → Approve (values change, v2) or Reject (values stay).
- Revision history timeline records submitted / approved / rejected with reasons.

## Open questions for the team
- Does a revision need an approval threshold (e.g. only re-approve if variance > x% or > $y)?
- Who can propose a revision once the PO is partially delivered or billed — and do
  quantities already delivered become a floor?
- Should the supplier be auto-emailed the revised PO on approval, or is that opt-in?
- Multi-approver chains: sequential or any-one-of?
