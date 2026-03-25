# Claims & Invoicing Workflow

## Problem
The current claim screen has Submit and Approve buttons buried in the top-right corner. After approving a claim, there's no integrated flow to generate an invoice and send it to the client. Invoicing is done manually outside of Varicon.

## What changed

- **Submit & Approve buttons at bottom** — fixed action bar, always visible, more prominent
- **After Approve → Create Invoice** — modal prompts to create a tax invoice with claim details, client info, bank details
- **Invoice preview** — full tax invoice with summary table matching the Progress Claim PDF format
- **Xero sync** — invoice syncs to Xero as Accounts Receivable. Shows sync status (created, sent, awaiting payment)
- **When paid in Xero** — payment reconciliation syncs back to Varicon, marking the claim as Paid

## Future
- Customer approval should be in-app (portal), not via the Approve button
- Automated payment reminders via Xero
