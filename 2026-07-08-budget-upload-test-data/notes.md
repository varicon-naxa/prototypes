# Budget Upload Test Data — 20 BOQ & Budget workbooks

Test fixtures for the **budget upload prototype** ([2026-04-01-budget-upload](../2026-04-01-budget-upload/index.html)).
Generated 8 Jul 2026. All fictional Australian civil projects, values ex GST.

## File format

Every workbook has two sheets:

- **BOQ** — exactly matches the prototype's downloadable template:
  `Item Code | Description | Unit | Qty | Rate ($) | Amount ($)`, three-level dot
  hierarchy (`1` → `1.1` → `1.1.1`), TOTAL row at the bottom. This is the client/sell side.
- **Budget** — the internal cost budget (title block, then table). Lump-sum files have one
  row per line item; resource files break each line item into resource categories
  (`Labour, Plant and Equipment, Material, Subcontract, Miscellaneous` — the prototype's
  five categories) with per-item subtotal rows. Cost Centre files add a `Cost Centre`
  column using the prototype's defaults plus two custom centres
  (`Pavements & Surfacing`, `Utilities & Services`).

**Provisional sums:** every BOQ ends with a `P` section (`P`, `P.1`, `P.1.x` — amber in the
prototype) of 3–5 provisional sums / dayworks items. **Provisional items carry no budget** —
they appear on the BOQ sheet only, never on the Budget sheet.

Margin (%) = (fixed-works BOQ − Budget) / fixed-works BOQ, i.e. provisional sums are
excluded from the margin calc since they're unbudgeted. File-level margins sit between
10.5% and 20%; individual lines jitter around that, as real estimates do.

Deliberate real-world mess throughout (all still parseable on the clean files):
inconsistent unit spellings (`m2`/`m²`/`sqm`, `lm`/`m`/`LM`, `each`/`No.`/`ea`),
estimator build-up rates to 4 decimals, quantities rounded three different ways,
trailing spaces and drawing references in descriptions, budgets rounded to $50,
estimator notes ("sub quote - CivilTech 14/6", "quote expires 30/7"), messy filenames.

## The 20 files

| # | Project | Method | Budget style | BOQ total | incl. prov. | Margin | Errors |
|---|---------|--------|-------------|-----------|-------------|--------|--------|
| A1 | Bellbird Ridge Estate Stg 3 | WBS | Lump sum | $2.58M | $99k | 15.5% | — |
| A2 | Mercer Rd Pavement Rehab | WBS | Lump sum | $1.74M | $166k | 11.0% | — |
| A3 | Karrara Wetlands Carpark | WBS | Lump sum | $2.40M | $35k | 19.0% | — |
| A4 | Old Pacific Hwy Culverts | WBS | Lump sum | $2.18M | $110k | 14.5% | ⚠ 3 |
| A5 | Gundagai Saleyards Hardstand | WBS | Lump sum | $2.56M | $268k | 12.7% | ⚠ 3 |
| B1 | Stockton Foreshore Stg 1 | WBS | Resource | $1.77M | $101k | 18.0% | — |
| B2 | Aurora Business Park Pkg 1 | WBS | Resource | $2.94M | $130k | 13.5% | — |
| B3 | Wallan East Commuter Carpark | WBS | Resource | $2.81M | $127k | 20.0% | — |
| B4 | Hume Fwy Noise Walls Pkg 2 | WBS | Resource | $2.14M | $125k | 15.8% | ⚠ 3 |
| B5 | Riverbend Estate Stg 5A | WBS | Resource | $2.94M | $147k | 12.4% | ⚠ 3 |
| C1 | Tarneit Sports Precinct | Cost Centre | Lump sum | $1.33M | $69k | 17.0% | — |
| C2 | Kembla Grange Lot 12 | Cost Centre | Lump sum | $3.42M | $124k | 14.5% | — |
| C3 | Moss Vale Depot Upgrade | Cost Centre | Lump sum | $3.34M | $81k | 10.5% | — |
| C4 | Bakers Lane Bridge Approaches | Cost Centre | Lump sum | $2.22M | $89k | 15.0% | ⚠ 3 |
| C5 | Windellama Rd Safety Upgrades | Cost Centre | Lump sum | $3.21M | $62k | 18.9% | ⚠ 3 |
| D1 | Port Kembla Container Yard | Cost Centre | Resource | $2.65M | $133k | 13.0% | — |
| D2 | Clyde North Trunk Drainage | Cost Centre | Resource | $1.87M | $163k | 16.5% | — |
| D3 | Nowra CBD Streetscape Stg 2 | Cost Centre | Resource | $3.89M | $87k | 20.0% | — |
| D4 | Pacific Palms Watermain | Cost Centre | Resource | $2.04M | $133k | 11.1% | ⚠ 3 |
| D5 | Berrima Quarry Access Rd | Cost Centre | Resource | $1.95M | $117k | 14.6%* | ⚠ 3 |

\* D5's margin on paper — its deliberate error budgets the whole drainage section
~8% above BOQ, so the true clean margin on the remaining sections is higher.

## Deliberate errors (8 files, 3 each)

**A4 — Old Pacific Hwy Culverts** (WBS / lump sum)
1. BOQ: duplicate Item Code `2.1.1` — same code on two rows.
2. BOQ: provisional item `P.1.5` has non-numeric Qty (`TBC`) and a blank Amount.
3. Budget: has a line for Item Code `3.2.9` which doesn't exist in the BOQ.

**A5 — Gundagai Saleyards** (WBS / lump sum)
1. BOQ: orphan line item `9.1.1` — no parent section `9` or sub-section `9.1`.
2. BOQ: item `1.1.2` Amount ($58,567.48) ≠ Qty × Rate (stale pasted value, ~31% high).
3. Budget: item `2.2.3` budget ($29,635) exceeds its BOQ amount → ~−6% margin.

**B4 — Hume Fwy Noise Walls** (WBS / resource)
1. Budget: item `2.1.2` resource split sums to $4,300 **more** than the line budget.
2. Budget: item `3.1.3` uses invalid resource category **"Equipment Hire"**.
3. Budget: item `3.1.6` BOQ-side resource split is $2,750 short of the BOQ line amount.

**B5 — Riverbend Estate 5A** (WBS / resource)
1. Budget: item `2.1.1` has text `incl. above` in a Budget ($) cell.
2. Budget: item `3.1.1` has two duplicate "Material" resource rows.
3. Budget: item `3.2.2` total budget exceeds its BOQ amount (~−8% margin).

**C4 — Bakers Lane Bridge** (Cost Centre / lump sum)
1. Budget: items `1.1.4` and `3.1.2` have a blank Cost Centre.
2. Budget: item `2.1.3` mapped to **"Plant & Equip"** — near-duplicate misspelling of
   the "Plant & Equipment" cost centre.
3. BOQ: item `3.1.4` has a blank Rate while Qty and Amount are still populated.

**C5 — Windellama Rd Safety** (Cost Centre / lump sum)
1. BOQ: sub-section `2.2` (a level-2 header) has Unit/Qty/Rate populated — headers must be blank.
2. BOQ: duplicate Item Code `2.1.1` — two *different* line items share it.
3. Budget: has a line for Item Code `4.2.5` which doesn't exist in the BOQ.

**D4 — Pacific Palms Watermain** (Cost Centre / resource)
1. Budget: item `1.1.6` resource split sums to $2,150 **less** than the line budget.
2. Budget: item `2.2.1` uses invalid resource category **"Consumables"**.
3. Budget: item `3.1.1` resource rows have a blank Cost Centre.

**D5 — Berrima Quarry Access Rd** (Cost Centre / resource)
1. Budget: item `2.1.1` has text `incl. in 1.2.1` in the Budget ($) column.
2. BOQ: item `2.1.3` is a "Rate Only" item — text Rate, blank Qty/Amount.
3. Budget: the entire Stormwater Drainage section is budgeted ~8% **above** BOQ
   (negative margin across 5 items).

`_summary.json` holds the same data machine-readable (totals incl. provisional split,
margins on fixed works, error list per file).
