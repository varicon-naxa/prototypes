# PO creation after budget upload completion

Prototype of the Purchase Order creation page that a user lands on after they've completed budget upload onboarding.

## What's here

- Faithful reproduction of the current Varicon "Add Purchase Order" layout (header fields, PO Title, Delivery Items table, totals, attachments, address block).
- New **Track this PO by** chooser at the top: segmented toggle between **Cost Centre** and **WBS**. Selection swaps the corresponding column header and select placeholder in the delivery items table.

## Why

After a customer finishes budget upload, the way they continue to code spend (cost centre vs. WBS) needs to be locked in at PO creation. This prototype explores putting that choice as the first decision on the PO form so it's explicit and obvious.

## Iterations to consider

- Whether the choice should be a per-PO decision, a per-project default, or a one-time org setting.
- Lock-in warning copy ("can't change after submitted") — confirm whether that's actually the constraint.
- Should WBS mode swap other columns too (e.g., Accounting Code, Task)?
