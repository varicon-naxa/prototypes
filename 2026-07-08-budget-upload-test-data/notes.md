# Budget Upload Test Data — 38 BOQ & Budget workbooks

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

**Multi-cost-centre splits (E files, 3 lump sum + 3 resource):** in E1/E2/E4 (lump-sum layout) a split line item
appears as two budget rows with the same Item Code — different cost centres, portioned
BOQ/Budget amounts, and a "60/40 split w/ …" note. In E3/E5 (resource layout) the split
falls out of the resource categories: an item's Labour rows map to the **Labour** cost
centre, Plant rows to **Plant & Equipment**, and the remaining rows stay on the trade's
primary centre. Same for E3/E5/E6. 6–9 items per E file are split; the rest stay single-CC.

**Off-BOQ indirect costs (F files, 3 lump sum + 3 resource):** each F Budget sheet ends
with an "INDIRECT / OFF-BOQ COSTS" block — 5–7 budget lines (contract works insurance,
bank guarantee fees, PM salary share, site utes, head-office allocation, etc.) that tie
to a cost centre only, with **no Item Code and no BOQ amount**. They total ~4–6% of the
fixed-works BOQ, and the cost centres include a custom "Insurances & Bonds" centre.
File margins are net of these indirects.

**Zones (G files, 3 lump sum + 3 resource):** the Budget sheet gains a **Zone** column
next to Cost Centre, using the prototype's zone list (`Project Wide`, `Zone A`–`Zone D`).
The mapping is many-to-many both ways: a cost centre's items spread across several zones
(e.g. Earthworks across Zones A/B/C) and each zone collects multiple cost centres
(e.g. Zone B holding Earthworks, Drainage and Pavements). Prelims and provisional-adjacent
lines sit in Project Wide. 5–8 items per file are split across 2–3 zones — in lump-sum
files as repeated rows with portioned amounts and a "50% Zone A" note; in resource files
each category row is duplicated per zone with portioned BOQ/Budget.

## The 38 files

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
| E1 | Ballina Coastal Shared Path Stg 2 | Cost Centre | Lump sum, split CCs | $1.88M | $194k | 12.5% | — |
| E2 | Orange Airport Apron Extension | Cost Centre | Lump sum, split CCs | $2.23M | $60k | 17.0% | — |
| E3 | Wodonga Logistics Hub Intersection | Cost Centre | Resource, split CCs | $2.26M | $140k | 19.5% | — |
| E4 | Shellharbour Marina Foreshore | Cost Centre | Lump sum, split CCs | $1.67M | $119k | 14.0% | ⚠ 3 |
| E5 | Cooma Saleyards Truck Wash | Cost Centre | Resource, split CCs | $3.38M | $133k | 10.8% | ⚠ 3 |
| E6 | Maitland Showground Carpark | Cost Centre | Resource, split CCs | $2.61M | $74k | 15.5% | — |
| F1 | Googong Reservoir Access Rd | Cost Centre | Lump sum, off-BOQ | $1.62M | $90k | 16.0% | — |
| F2 | Toowoomba Enterprise Hub Roads | Cost Centre | Lump sum, off-BOQ | $3.05M | $92k | 12.0% | — |
| F3 | Latrobe Valley Depot Consolidation | Cost Centre | Lump sum, off-BOQ | $2.36M | $161k | 13.6% | ⚠ 3 |
| F4 | Bunbury ORR Service Road Pkg | Cost Centre | Resource, off-BOQ | $2.69M | $144k | 18.5% | — |
| F5 | Mount Barker Sports Hub Stg 1 | Cost Centre | Resource, off-BOQ | $2.27M | $157k | 11.0% | — |
| F6 | Penrith Lakes Access Improvements | Cost Centre | Resource, off-BOQ | $2.09M | $152k | 16.4% | ⚠ 3 |
| G1 | Armidale Airport Precinct Roads | Cost Centre | Lump sum, zones | $2.38M | $165k | 13.0% | — |
| G2 | Geelong Nth Growth Area Trunk | Cost Centre | Lump sum, zones | $2.87M | $84k | 17.5% | — |
| G3 | Dubbo Bridge St Reconstruction | Cost Centre | Lump sum, zones | $3.97M | $149k | 15.0% | ⚠ 3 |
| G4 | Sunshine Coast Foreshore Stg 2 | Cost Centre | Resource, zones | $1.60M | $132k | 12.0% | — |
| G5 | Albury Logistics Terminal | Cost Centre | Resource, zones | $2.51M | $121k | 19.0% | — |
| G6 | Bendigo GovHub External Works | Cost Centre | Resource, zones | $1.69M | $80k | 12.6% | ⚠ 3 |

\* D5's margin on paper — its deliberate error budgets the whole drainage section
~8% above BOQ, so the true clean margin on the remaining sections is higher.

## Deliberate errors (12 files, 3 each)

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

**E4 — Shellharbour Marina Foreshore** (Cost Centre / lump sum, split CCs)
1. Budget: split rows for item `3.2.3` sum to $3,200 **less** than its BOQ line amount.
2. Budget: second split row of item `4.1.1` has a blank Cost Centre (note says "CC TBC - ask DK").
3. Budget: item `4.1.2` is "split" across two rows that **both** map to the same cost centre (Concrete).

**E5 — Cooma Saleyards Truck Wash** (Cost Centre / resource, split CCs)
1. Budget: item `2.1.3` rows use **"Overheads/Prelims"** (no spaces) — near-duplicate of
   the "Overheads / Prelims" cost centre.
2. Budget: split item `2.2.3` total budget exceeds its BOQ amount (~−7% margin).
3. Budget: item `3.1.2` has text `see 2.1.1` in a Budget ($) cell.

**F3 — Latrobe Valley Depot Consolidation** (Cost Centre / lump sum, off-BOQ indirects)
1. Budget: indirect "Contract works & public liability insurance" carries Item Code `8.1.1`,
   which doesn't exist in the BOQ — looks like a mis-keyed mapping rather than a true indirect.
2. Budget: indirect "Head office overhead allocation (2.5%)" has **no Item Code and a blank
   Cost Centre** — completely unmappable (note reads "which CC does this go to??").
3. Budget: "Bank guarantee / performance bond fees" appears **twice** with different amounts
   ($16,989 vs $20,047) — double counted.

**F6 — Penrith Lakes Access Improvements** (Cost Centre / resource, off-BOQ indirects)
1. Budget: indirect "Site utes, fuel & tolls" uses invalid resource category **"Overheads"**.
2. Budget: indirect "Staff accommodation & living away allowance" has its amounts keyed into
   the **BOQ ($) column** instead of Budget ($) — column shift on a line with no BOQ item.
3. Budget: indirect "HSEQ advisor site visits & audits" includes a **negative** Budget row
   (−$4,500 insurance rebate credit).

`summary.json` holds the same data machine-readable (totals incl. provisional split,
margins on fixed works, split-item codes for E files, indirect totals for F files,
error list per file).
