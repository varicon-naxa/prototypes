# PO Settings — Simplified (single page)

## Problem
Current Purchase Order Settings is spread across 4 tabs (Purchase Order Settings, Workflow Settings, PDF Settings, Email Settings). Users have to click around to set up basics, and the Workflow editor exposed an Amount Increment/Decrement option that nobody needed.

## Solution
One scrollable page with five clearly numbered sections:

1. **PO Number Format** — Prefix + Starting Number, with a live preview of what the next PO number will look like.
2. **PO Form Fields** — The original checkbox list of optional PO fields (Delivery Date, Due Date, etc.), made into a 3-column grid for easier scanning. Selected items get a soft orange highlight.
3. **Approval Workflow** — Create → Approve → Close as three side-by-side cards with arrows between them. Each card shows its approvers and allocated amount inline. Editing opens a modal with **two** controls only: *Assigned Approver* and *Allocated Approval Amount*. The old *Amount Increment/Decrement* dropdown has been removed.
4. **PDF Branding** — Org name, ABN, logo upload and T&C upload merged from the old "PDF Settings" tab.
5. **Email Defaults** — Invoice Email (where suppliers send invoices) plus Default PO Recipients (the chip-list of CCs auto-filled when sending a PO). The duplicate "Invoice Email" checkbox in PO Fields has been removed; this is the one canonical place to set it.

## Layout notes
- Sticky save bar at the bottom — no need to scroll back up to submit.
- Field rows use a label+help column (left) and the control (right), so the page reads top to bottom without surprises.
- Each section has a numbered badge so users can refer to "section 3" verbally.

## What was removed
- The 4-tab layout
- Amount Increment/Decrement column in the approver modal
- Duplicate Invoice Email field (was in both PO Fields checkbox list and the main settings)
