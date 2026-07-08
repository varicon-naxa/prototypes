# Budget Upload Test Data — 20 BOQ & Budget workbooks

Test fixtures for the **budget upload prototype** ([2026-04-01-budget-upload](../2026-04-01-budget-upload/index.html)).
Generated 8 Jul 2026. All fictional Australian civil projects, values ex GST.

## File format

Every workbook has two sheets:

- **BOQ** — exactly matches the prototype's downloadable template:
  `Item Code | Description | Unit | Qty | Rate ($) | Amount ($)`, three-level dot
  hierarchy (`1` → `1.1` → `1.1.1`), `P`-prefixed provisional sections on some files,
  TOTAL row at the bottom. This is the client/sell side.
- **Budget** — the internal cost budget (title block, then table). Lump-sum files have one
  row per line item; resource files break each line item into resource categories
  (`Labour, Plant and Equipment, Material, Subcontract, Miscellaneous` — the prototype's
  five categories) with per-item subtotal rows. Cost Centre files add a `Cost Centre`
  column using the prototype's defaults plus two custom centres
  (`Pavements & Surfacing`, `Utilities & Services`).

Margin (%) = (BOQ − Budget) / BOQ. File-level margins sit between 10.5% and 20%;
individual lines jitter around that, as real estimates do.

Deliberate real-world mess throughout (all still parseable on the clean files):
inconsistent unit spellings (`m2`/`m²`/`sqm`, `lm`/`m`/`LM`, `each`/`No.`/`ea`),
estimator build-up rates to 4 decimals, quantities rounded three different ways,
trailing spaces and drawing references in descriptions, budgets rounded to $50,
estimator notes ("sub quote - CivilTech 14/6", "quote expires 30/7"), messy filenames.

## The 20 files

| # | Project | Method | Budget style | BOQ total | Margin | Errors |
|---|---------|--------|-------------|-----------|--------|--------|
| A1 | Bellbird Ridge Estate Stg 3 | WBS | Lump sum | $2.99M | 15.5% | — |
| A2 | Mercer Rd Pavement Rehab | WBS | Lump sum | $1.82M | 11.0% | — |
| A3 | Karrara Wetlands Carpark | WBS | Lump sum | $2.89M | 19.0% | — |
| A4 | Old Pacific Hwy Culverts | WBS | Lump sum | $2.10M | 13.5% | ⚠ 3 |
| A5 | Gundagai Saleyards Hardstand | WBS | Lump sum | $3.20M | 12.4% | ⚠ 3 |
| B1 | Stockton Foreshore Stg 1 | WBS | Resource | $2.07M | 18.0% | — |
| B2 | Aurora Business Park Pkg 1 | WBS | Resource | $3.10M | 13.5% | — |
| B3 | Wallan East Commuter Carpark | WBS | Resource | $3.12M | 20.0% | — |
| B4 | Hume Fwy Noise Walls Pkg 2 | WBS | Resource | $2.10M | 15.8% | ⚠ 3 |
| B5 | Riverbend Estate Stg 5A | WBS | Resource | $1.86M | 11.8% | ⚠ 3 |
| C1 | Tarneit Sports Precinct | Cost Centre | Lump sum | $1.05M | 17.0% | — |
| C2 | Kembla Grange Lot 12 | Cost Centre | Lump sum | $3.51M | 14.5% | — |
| C3 | Moss Vale Depot Upgrade | Cost Centre | Lump sum | $2.99M | 10.5% | — |
| C4 | Bakers Lane Bridge Approaches | Cost Centre | Lump sum | $2.72M | 15.0% | ⚠ 3 |
| C5 | Windellama Rd Safety Upgrades | Cost Centre | Lump sum | $2.18M | 18.8% | ⚠ 3 |
| D1 | Port Kembla Container Yard | Cost Centre | Resource | $2.71M | 13.0% | — |
| D2 | Clyde North Trunk Drainage | Cost Centre | Resource | $1.52M | 16.5% | — |
| D3 | Nowra CBD Streetscape Stg 2 | Cost Centre | Resource | $2.36M | 20.0% | — |
| D4 | Pacific Palms Watermain | Cost Centre | Resource | $1.95M | 11.1% | ⚠ 3 |
| D5 | Berrima Quarry Access Rd | Cost Centre | Resource | $2.00M | 9.2%* | ⚠ 3 |

\* D5's overall margin falls below 10% *because of* its deliberate error (a whole
section budgeted above BOQ) — the underlying clean margin is ~14%.

## Deliberate errors (8 files, 3 each)

**A4 — Old Pacific Hwy Culverts** (WBS / lump sum)
1. BOQ: duplicate Item Code `P.1.3` — same code on two rows.
2. BOQ: item `1.1.4` has non-numeric Qty (`TBC`) and a blank Amount.
3. Budget: has a line for Item Code `3.2.9` which doesn't exist in the BOQ.

**A5 — Gundagai Saleyards** (WBS / lump sum)
1. BOQ: orphan line item `9.1.1` — no parent section `9` or sub-section `9.1`.
2. BOQ: item `1.1.3` Amount ($74,340.82) ≠ Qty × Rate (stale pasted value, ~31% high).
3. Budget: item `2.1.3` budget ($82,600) exceeds its BOQ amount → ~−6% margin.

**B4 — Hume Fwy Noise Walls** (WBS / resource)
1. Budget: item `2.1.1` resource split sums to $4,300 **more** than the line budget.
2. Budget: item `3.1.2` uses invalid resource category **"Equipment Hire"**.
3. Budget: item `3.1.5` BOQ-side resource split is $2,750 short of the BOQ line amount.

**B5 — Riverbend Estate 5A** (WBS / resource)
1. Budget: item `1.2.3` has text `incl. above` in a Budget ($) cell.
2. Budget: item `2.2.2` has two duplicate "Plant and Equipment" resource rows.
3. Budget: item `3.2.2` total budget exceeds its BOQ amount (~−8% margin).

**C4 — Bakers Lane Bridge** (Cost Centre / lump sum)
1. Budget: items `1.1.4` and `2.2.3` have a blank Cost Centre.
2. Budget: item `2.1.2` mapped to **"Plant & Equip"** — near-duplicate misspelling of
   the "Plant & Equipment" cost centre.
3. BOQ: item `3.1.2` has a blank Rate while Qty and Amount are still populated.

**C5 — Windellama Rd Safety** (Cost Centre / lump sum)
1. BOQ: sub-section `3.1` (a level-2 header) has Unit/Qty/Rate populated — headers must be blank.
2. BOQ: duplicate Item Code `1.1.5` — two *different* line items share it.
3. Budget: has a line for Item Code `4.2.5` which doesn't exist in the BOQ.

**D4 — Pacific Palms Watermain** (Cost Centre / resource)
1. Budget: item `2.1.2` resource split sums to $2,150 **less** than the line budget.
2. Budget: item `3.1.1` uses invalid resource category **"Consumables"**.
3. Budget: item `3.2.1` resource rows have a blank Cost Centre.

**D5 — Berrima Quarry Access Rd** (Cost Centre / resource)
1. Budget: item `2.1.2` has text `incl. in 1.2.1` in the Budget ($) column.
2. BOQ: item `2.1.4` is a "Rate Only" item — text Rate, blank Qty/Amount.
3. Budget: the entire Stormwater Drainage section is budgeted ~8% **above** BOQ
   (negative margin across 7 items) — drags the whole-file margin to 9.2%.

`_summary.json` holds the same data machine-readable (totals, margins, error list per file).
