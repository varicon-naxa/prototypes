# Claim → Xero Invoice → Paid Sync

## Problem
Once a progress claim is approved in Varicon, invoicing the client happens manually outside the system.
There's no way to raise the invoice in Xero from the claim, and no visibility in Varicon of whether the
client has actually paid.

## Workflow prototyped (starting from the Claim screen)
1. **Submitted claim** — claim #2 on (VAR003) House Slab Construction, current claim $14,650.00.
   **Invoicing is locked** ("Available once the claim is approved") until the claim is approved.
2. **Approve Claim** → unlocks **Create Invoice in Xero** (bottom action bar) — modal pre-fills everything from the claim:
   - **Reference** = Claim number + Project: `Claim #2 — (VAR003) House Slab Construction`
   - **Claim Period** = 01 Jun – 30 Jun 2026 (carried onto the invoice)
   - Xero contact, invoice/due date, account code
   - **Invoice amount = claim total** ($14,650.00 + GST $1,465.00 = $16,115.00) as a single line
   - **Progress Claim PDF automatically attached** to the Xero invoice
3. **Invoice created** — Xero panel appears on the claim: INV-0187, AWAITING PAYMENT, attachment,
   View in Xero (mock Xero screen), activity timeline. Claim status → **Invoiced**.
4. **Client pays in Xero** (simulated with the demo button) — Xero webhook pushes the payment back
   to Varicon: claim status → **PAID**, payment date/amount/reference shown on the claim, stepper and
   timeline update.

## Notes / assumptions
- Invoicing is hard-gated on claim approval — the Xero button is disabled (with a lock hint) until Approve is clicked
- One invoice line per claim (summary line). Line-per-claim-item could be a toggle later.
- Payment sync via Xero webhooks (invoice.updated → status PAID), no polling
- Partial payments not covered in this prototype — would show as "Partially Paid" with amount remaining
