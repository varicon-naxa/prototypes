# Claim retention — clearer wording

**Problem.** The RETENTION tab on a progress claim is unreadable. Taken from a live
screenshot of Claim #2 on (26-015) Mt Ousley Road:

- **"Released Retention"** is the heading over a row called **Withheld**. The section
  covers both directions but is named after one of them.
- **"Total Previous Held"** sits next to **"Retention Held"** inside a table titled
  *This Claim*. Nothing distinguishes history from the current period.
- **"When Complete"** is a column of amounts but reads as a status. It means *the
  amount that falls due at practical completion*.
- **"Previous Claim"** is singular — the last claim, or all of them?
- A release of **$4,782.52** is shown against **$0.00** withheld, with no link to the
  claim it came from. Unauditable.
- **Max Retention** and **Retention Rate** both show `-`. A dash reads as zero, as
  loading and as not-applicable. The real state is *never configured*, and there is no
  route to configure it.
- The four figures that decide what gets invoiced — Claim Total, Retention Withheld,
  Retention Released, **Revised Total** — are unlabelled, right-aligned in the bottom
  corner, and cut off the edge of the screen. Revised from what?

**Fix.** No calculation changes. The same figures, told in one direction:

1. **Retention terms** — the rule as a sentence, with its dollar cap. Unset says so and
   offers the setup.
2. **Retention on this claim** — a four-line ledger: held before this claim `+` held
   from this claim `−` released back on this claim `=` total held after this claim,
   against a cap bar. The opening balance expands into the claims that built it.
3. **Release schedule** — each stage, its trigger in words, its amount, its status.
4. **What this invoice comes to** — claim `−` held `+` released `=` **amount payable on
   this invoice**, plus a one-sentence plain-English reading.

The top strip now shows **This invoice** next to **Claimed to date**, because the
headline claim figure is gross of retention and never matches what the client receives.
That pairing is the whole fix in one line.

**Views.** Toggle at the top: *Proposed* / *Screen today* (faithful recreation with the
defects annotated) / *Wording changes* (every rename with its reason).

**Demo states.** No retention set up (matches the screenshot) · Holding retention ·
Practical completion reached. Retention only makes sense once the numbers move, so the
wording is tested against a claim that holds and a claim that releases.

Figures used: contract sum $101,392.93 · previously claimed $71,872.22 · this claim
$28,994.21 · 5% retention capped at 5% of the contract sum ($5,069.65) · released half
at PC, half at the end of a 12-month defects period.
