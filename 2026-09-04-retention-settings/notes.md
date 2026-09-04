# Retention Settings — units, dollars, and the invoice toggle

**Built** 4 Sep 2026, from a production screenshot of the Retention Settings modal on
project **(24-006) Little Collins Roadworks** (included here as
`retention-settings-today.png`, unretouched).

## What prompted it

Alec asked whether retention settings could carry a toggle for **whether retention is
included in the invoice**. It turns out that ticket already exists — **VDP-2282**, filed
28 Aug 2026, blocked by **VDP-2251**. What was new in the question is *where the toggle
lives*: VDP-2282 persists the position against the claim, the ask is for a default in
project settings. Both are needed.

Looking at the screen it would go on, the toggle is not the only thing missing.

## The defects, in order of what they cost

1. **`Contract Max Retention 5` and `Contract Retention Rate 10` are percentages of two
   different things** — the contract sum and each claim — and neither field says so.
2. **No dollar figure appears anywhere.** On this project the 5% cap is $124,000. You are
   configuring six figures of cash flow against a field containing the character `5`.
3. **The rate is double the maximum and nothing explains that this is legitimate.** 10%
   comes off each claim until the 5% cap is reached. Read cold it looks like a data entry
   error, and nothing on screen reveals that the cap will bind on Claim #4.
4. **"Merge Retention"** describes the control, not the outcome (*variations are retained
   on the same terms as the contract*).
5. **"Enable Manual Contract Retention"** reads as switching the calculation off. Per
   VDP-1169 the intent is *we still calculate, but let it be edited*.
6. **A Basis dropdown whose labels cannot survive its other options** — with a `%` prefix
   hard-rendered inside the input.
7. **Half the form is below the fold with Save floating over the hidden half.** VDP-2250
   was the non-scrolling version of the same shape.
8. **Nothing mentions the invoice** (VDP-2282) — which is how VDP-2251 shipped.
9. **No release terms** (VDP-111), **no bands** (VDP-2034), **no security in lieu**.

## What the prototype does

Three views: **Proposed** (live — every field recalculates the claim beside it) /
**Screen today** (the real screenshot with the defects pinned to it) / **What changed**
(nine renames and six additions, each with its reason).

The proposal is ordered the way the money moves: *where the terms come from* → *what we
hold back* → *on the invoice* → *getting it back*. Every field states its denominator in
the label and resolves to dollars underneath. The preview renders the same four-line
ledger as the [claim retention prototype](../2026-08-24-claim-retention-wording/), so the
settings screen and the claim screen can never disagree.

Demo contract: $2,480,000 sum, $960,000 previously claimed, $340,000 this claim. Chosen so
the **cap actually binds** — 10% would take $34,000, the $124,000 maximum cuts it to
$28,000 — because that is the relationship the current screen never explains.

## Two things the prototype deliberately does not settle

- **GST.** Whether it is calculated on the full claim or on the amount after retention is
  worth **$2,800 on this single claim** and has never been answered. Both branches are
  shown, with the open question stated on screen rather than silently defaulted. My read
  is that the supply is the full claim and retention is a withholding — that is a read,
  not advice, and it needs an accountant and a check against what Xero does on the ACCREC.
- **Sequencing.** The toggle must not ship before VDP-2251. Until the net-of-retention fix
  lands there is no correct default to build against, and gross invoicing stops being a
  bug and becomes a setting nobody chose.
