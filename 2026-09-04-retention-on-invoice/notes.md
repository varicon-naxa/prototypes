# Retention on the invoice

**Built** 4 Sep 2026. Scoped deliberately to **one fix** — whether retention is deducted from
the invoice Varicon sends. The wider Retention Settings rebuild (units, dollar resolution,
release terms, stepped bands, security in lieu) is a separate piece of work.

## The defect — VDP-2251

A claim that withholds retention produces two documents that disagree about how much money is
owed. The claim deducts the retention; the invoice does not.

| | Claim #4 | INV-1184 |
|---|---|---|
| Work completed | $340,000 | $340,000 |
| Less retention withheld | −$28,000 | *line not written* |
| GST at 10% | +$34,000 | +$34,000 |
| **Total** | **$346,000** | **$374,000** |

The invoice asks for **exactly the retention** more than the claim certifies. Not a rounding
error or a rate mismatch — the deduction line is never written, so retention accrues on the
claim *and* stays in the amount billed.

It fails in the direction noticed by the person paying rather than the person sending, so every
occurrence is a client of our client querying an invoice.

Three things mask it: the claim screen is correct, so nobody opens the invoice; the invoice is
arithmetically consistent with itself, so Xero flags nothing; and it only bites on
retention-bearing contracts.

## The fix — VDP-2282

Write the deduction line. Then make it a setting, because a minority of contracts genuinely bill
gross (the client withholds retention at their end). **Default on.**

**The position is stamped on the claim, not read from settings.** This is the part that is easy
to get wrong: if the invoice renders by reading the current setting, flipping the toggle next
month silently rewrites what INV-1184 says and it stops matching the PDF the client is holding.
The claim carries its own `retention_deducted_from_invoice` and `gst_basis`.

## Already sent

A fix that only changes future behaviour leaves the wrong invoices where they are, and some are
paid. **We do not need clients to tell us which** — `retention_withheld > 0` and
`invoice_total = claim_gross + GST` is a query we can run today. The prototype shows the shape of
that result with placeholder project references; the real list comes from production.

Two states, two conversations: unpaid invoices get reissued at the corrected amount; paid ones
mean the contractor has been overpaid and the retention was never withheld in cash, so it is a
credit note or an adjustment on the next claim — **and which of the two is the contractor's call,
not ours.**

## Two things this does not decide

- **GST.** The prototype puts GST on the full claim: the supply is the whole $340,000 and
  retention is money withheld from payment, not a reduction in what was supplied. That keeps the
  invoice at $346,000, matching the claim. **A read, not advice** — needs an accountant and a
  check of what Xero does on the ACCREC. If GST sits on the net instead, the invoice is $343,200
  and every corrected figure moves.
- **Sequencing.** The toggle must not ship ahead of the deduction line. Until invoices deduct by
  default there is no correct default to build a setting against, and gross invoicing stops being
  a bug and becomes a setting nobody chose.

Also unscoped: whether a correction flows through to **Xero** automatically. These invoices are
synced, and a credit note that does not propagate leaves the two systems disagreeing — the same
class of defect one layer along.
