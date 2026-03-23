# Purchase Order — Guided Creation Flow

## Problem
The current Add Purchase Order form shows everything at once — project, supplier, PO title, delivery items, attachments, approval workflow — which is overwhelming and leads to critical fields being missed.

## What changed

Replaced the flat form with a **guided 3-step flow** for the essential fields, then reveals the full form:

1. **Step 1 — Select Project:** Large dropdown with search. Must complete before Step 2 unlocks.
2. **Step 2 — Select Supplier:** Unlocks after project selected. Large dropdown with search.
3. **Step 3 — PO Title:** Unlocks after supplier selected. Free text with helpful placeholder examples.

After all 3 steps are completed:
- **Auto-filled fields** appear (Order Date, PO Number, GST)
- **Full form revealed:** Delivery items table, attachments, delivery details, and approval workflow
- **Submit button enables**

Other details:
- Progress bar shows completion status across the 3 steps
- Completed steps show a green summary value and an "Edit" button to go back and change
- Steps 1 and 2 are displayed side-by-side to save vertical space

## Why
Guiding users through the 3 most important decisions first reduces cognitive load and ensures critical fields aren't missed. The full form only appears once the user has committed to the key choices.
