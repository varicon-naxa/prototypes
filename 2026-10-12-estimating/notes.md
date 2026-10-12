# Estimating — 2026-10-12

## The problem

Contractors price jobs in spreadsheets or a dedicated tool (Expert Estimator / Pronamics), then rebuild that
estimate inside Varicon as a budget. Rebuilding loses the resource split, the quantities and the productivity
assumptions, so the budget can't be measured against what the job was priced on. Yanta called our current
estimating template "a nightmare". Gulf Civil threatened to leave over the Expert Estimator import. SummaCon was
told estimating is coming.

## The idea

**The estimate is the budget's first version, not a separate tool.**

- **Schedule.** Sections → line items (ref, description, unit, qty, cost rate, sell rate). These refs become the
  claim refs.
- **Build-up per line.** Labour, plant, materials, subcontract and lump sums. Labour and plant hours come from
  **crew productivity**: qty ÷ rate × crew count. Materials are "per unit" (e.g. 0.44 t DGB20 per m²).
- **One rate library**, checked against **actuals from completed jobs** (timesheets, bills, hire dockets, quantity
  done). The estimate shows how much it's under-priced if actuals hold. No standalone estimating tool can do this,
  and it's why estimating belongs in Varicon.
- **Summary.** Overheads and margin markup, the cost → tender bridge, section margins, planned hours.
- **Dayworks rates** from the same library.
- **Revisions.** Draft → submitted (locked) → new revision. Won or lost feeds the win rate.
- **Mark as won.** Creates the contract schedule (sell), the budget (cost, one cost centre per section, with
  resource split and quantities) and the dayworks rate card in one step. Quantity done starts at 0, so earned
  budget works from day one.

## Out of scope (deliberately)

Takeoff from drawings, tender document management, subcontractor bid comparison, CAD. Import from Expert
Estimator / Excel is shown as an entry point only. It should land in the same data model.

## Decisions this forces

1. Build-up depth in v1: full resource build-up (as shown) or line rates only?
2. Estimate as its own object, or a project in an "estimating" state?
3. Does the rate library merge with worker roles / plant register / supplier pricing, or sit alongside them?
   It has to merge, or the actuals check breaks.
4. Line-level markup overrides (e.g. a lower margin on subcontract) — needed in v1?
5. Actual productivity depends on quantity done being captured on site. That's the same dependency as earned
   budget.

## Try it

Open EST-0142 → expand line 2.2 (bulk excavation), change productivity to the actual 38 m³/hr → check the
Rates tab → Summary → Mark as won → see the project budget.

Live: https://varicon-naxa.github.io/prototypes/2026-10-12-estimating/
