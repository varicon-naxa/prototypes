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

**Retention terms are a tenant-level profile, not product constants** (added 2026-08-25).
The terms panel renders a profile defined once in Settings → Retention profiles and applied
per contract — Code, Description, Type — matching the entity VDP-2034 scopes. Two types are
modelled: **Flat percentage** (the existing AU behaviour) and **Step by Value** (the NZS 3910
banded schedule from VDP-2034). Every rule that was previously hardcoded prose is now a
visible profile field: rate, maximum retention, % released at PC, rate after PC, DLP months.

The stepped profile computes **marginal banding** — each rate applies only to the slice of
value inside its band — and reproduces VDP-2034's worked example exactly: a $1,500,000
contract retains $68,750, an effective 4.583%, not the $26,250 a flat read of the final band
would give. It also satisfies VDP-2034's "show the working on the claim's Retention tab"
scope bullet: which bands applied, at what rate, for what amount, reconciling to the total.

**Demo states.** No profile applied (matches the screenshot) · Flat 5% holding · Flat 5% at
practical completion · NZS 3910 stepped. Retention only makes sense once the numbers move, so
the wording is tested against a claim that holds and a claim that releases.

**Three open questions the prototype surfaces rather than answers**, each shown inline:

1. **Max retention after PC** — VDP-111 halves the *rate* at PC but says nothing about the
   *cap*. On Mt Ousley that is later claims re-accreting toward $5,069.65 versus sitting flat
   at $2,534.83. It is a profile field, not a product decision.
2. **A separate cap on a stepped profile** — the schedule self-limits at $68,750, so a
   Maximum Retention on top is redundant or contradictory. VDP-2034 asks this; the prototype
   takes the schedule total as the ceiling.
3. **Accrual basis for a stepped schedule** — does retention accrue through the bands on
   claimed-to-date (early claims retain 10%), or as a flat effective rate applied evenly?
   Both reach $68,750 at completion; they differ by $11,041.67 on Claim #1. Same total,
   different cash flow. VDP-2034 does not say.

Figures used: contract sum $101,392.93 · previously claimed $71,872.22 · this claim
$28,994.21 · 5% retention capped at 5% of the contract sum ($5,069.65) · released half
at PC, half at the end of a 12-month defects period.
