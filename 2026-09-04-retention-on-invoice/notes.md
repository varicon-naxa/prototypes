# Retention on the invoice

**Built** 4 Sep 2026. One toggle, at the moment the claim is submitted: is retention deducted
from the invoice, or is the client invoiced the gross?

Not a settings screen. The choice is made per claim, at submit, and both resulting amounts are
shown next to the toggle so it redraws the invoice live.

## The toggle

**Deduct retention from the invoice** — default on.

- **On** — the client is invoiced $346,000: the $340,000 claim less the $28,000 held this
  period, plus GST. Matches what the claim says is owed.
- **Off** — the client is invoiced the full $374,000. Retention still accrues on the claim and
  still releases on its milestones; it is just not taken off what you ask for. Warned inline,
  because this is only correct where the contract says the client withholds retention at their
  end (otherwise it is VDP-2251 on purpose).

## Two things worth keeping when this is specced

- **The label says "deduct", not "include".** *Include retention* reads both ways — include the
  deduction, or include the money in what we bill. Both amounts sit next to the toggle so the
  choice cannot be misread either way.
- **The answer is stored on the claim, not read back from a setting.** Because the choice is made
  at submit, the claim carries it, so nothing later can change what an invoice already sent says.
  A settings-level default could sit behind this and pre-set the toggle, but the claim still has
  to record the answer it was submitted under.

## One dependency

GST is calculated on the full claim of $340,000 in both states — the supply is the whole claim
and retention is money withheld from payment. **A read, not advice**; wants confirming with an
accountant before build. If GST goes on the net instead, the deducted invoice is $343,200 rather
than $346,000.

Related: **VDP-2251** (production over-invoices retention-bearing claims) and **VDP-2282** (the
setting, blocked by 2251).
