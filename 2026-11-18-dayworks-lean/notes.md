# Dayworks lean release: rates table, variations from dockets, claims from dockets

Built 2026-11-18. Based on `2026-11-18-dayworks-billing-lean` (copied, not changed), with the Dayworks Calculator replaced by one project rates table and a Dayworks tab added to claims. Same Varicon project shell (sidebar, project tabs, Prototype drawer) and the same seed project (Riverside Rd Upgrade).

Live: https://varicon-naxa.github.io/prototypes/2026-11-18-dayworks-lean/
Compare: [full billing](https://varicon-naxa.github.io/prototypes/2026-11-12-dayworks-billing/) · [billing lean](https://varicon-naxa.github.io/prototypes/2026-11-18-dayworks-billing-lean/) · [billing middle](https://varicon-naxa.github.io/prototypes/2026-11-18-dayworks-billing-middle/) · [full calculator](https://varicon-naxa.github.io/prototypes/2026-11-05-dayworks-calculator/)

Files: `config.js`, `engine.js`, `app.js`, `scenarios.js` (13/13 passing), `index.html`.

## Decided (Alec, 2026-11-18)

### 1. Lean calculator = rates table only

- **One project rates table.** Each row is a charge resource: a resource (labour role or named person, plant type wet or dry, attachment, float, material, subcontract item), its type, a unit (Hour, Each, Tonne) and a charge rate.
- **Docket value** = sum over its lines of quantity x charge rate. Quantity is hours worked as recorded (start to finish less break) for labour and plant, and quantity for materials and subcontract.
- **Nothing else is priced.** No tiers, day types, minimum hours, allowances, versions or effective dates. Allowances on a docket are shown at $0, "not charged in this release".
- **Unmapped.** A line with no rate in the table is Unmapped and blocks the docket from the pickers.
- **Where the table lives.** It is shown where live Varicon has it: project Daywork Record tab > kebab > **Charge Resource**, a read-only list of Resource, Resource Type, Unit and Charge Rate.
- **No edit screen.** Rates are not editable (changes go through support). The Prototype drawer has a "Change rate" simulation so Refresh can be shown.
- **Rate lookup.** A named person's rate wins over their role's rate (Cris Dela Cruz at $88/h, not Labourer $78/h). A wet-hire line is charged at the wet rate (operator included), plus any attachment for the same hours.
- **Seeded AU civil rates:**
  - Leading Hand $95/h, Plant Operator $98/h, Labourer $78/h
  - Excavator 20t wet $215/h, dry $135/h; Breaker 1t $45/h
  - Excavator float $480 to mobilise, $420 to demobilise
  - Road base $52/t
  - Traffic control $145/h
- **Deliberately unmapped.** Plumber has no rate, so it shows Unmapped.

### 2. Lean variations: as the billing lean release (VAR-23179), priced from the rates table

- From dockets (Approved and Costed only) opens the live Add Variation form.
- **CONTRACT tab:** one line per docket in Submitted and Approved. Approved Qty and Rate are editable.
- **COST tab:** one resource per labour, plant, material and subcontract line at internal cost rates. Budget Sum and Estimated Cost are the COST total. Margin = (charge - cost) / charge.
- Save as today creates a Pending variation; status is set with the register dropdown.
- Refresh from dockets is available while Pending; values never move on their own.
- Docket locking applies, with Mark as Costed and Mark as Invoiced still allowed (status only).
- **Status changes:**
  - An Approved variation can go back to Pending unless it is on a claim.
  - Non-Claimable and Rejected are final.
  - Delete Variation works on any status.

### 3. Lean claims: Dayworks tab

- **The tab and totals.** Claims have a fourth tab, **DAYWORKS**, next to Contract, Variation and Retention. A Dayworks total shows in the footer and is counted in Total Claim and retention as existing.
- **Add dockets** on the Dayworks tab opens a picker offering Approved and Costed dockets that are not on a variation or claim and not Not claimable. Unmapped dockets are blocked. Each docket becomes one line at its rates-table value, copied in once.
- **Refresh from dockets**, available while the claim is Draft, reprices the lines and logs old to new.
- **Locking.** Dockets on a claim are locked, with the same rules as on variations: Mark as Costed and Mark as Invoiced are still allowed (status only), and removing the line frees the docket.
- **No auto-Invoiced.** Docket statuses don't change when the claim is approved.
- **Nothing extra for dockets:** no credit lines and no submitted-claim flags.
- **Claim statuses** and Make New Claim / Reopen Claim / Delete claim work as today. An approved claim freezes its docket lines.
- **Variations on claims.** Approved variations are still claimed by percent on the Variation tab.

## Read "as today" (literal reading, not decided - see open questions)

- A **Submitted** claim can still take and remove dockets (as Draft can). Refresh is Draft only, as decided.
- **Reopen Claim** returns the claim to Draft. Its docket lines unfreeze and become editable (refresh, remove), and the dockets stay locked on the claim.
- **Delete claim** works on a Draft claim (as today) and frees its dockets.
- **Overlaps.** An overlapping docket (the same plant or person twice at the same time) is still blocked from the pickers, as in the billing lean release.
- **Seed data.** The seeded traffic control docket records 8 crew hours so it fits quantity x rate.

## Open questions for Alec

1. **Delete Variation when the variation is already on a claim.** "Do as the live app does": pending a check of the live app. The prototype keeps its guard and refuses.
2. **Materials or subcontract recorded as a $ cost, not a quantity.** For example, D211's concrete is recorded as $600 with no quantity, so there is nothing to multiply by a rate. The prototype shows it Unmapped. How should a cost-only line be priced in the lean release?
3. **Can a Submitted claim take or lose dockets?** The prototype allows it.
4. **Does Reopen Claim unlock its docket lines?** The prototype unfreezes them for editing and keeps the dockets locked on the claim.
5. **Does Delete claim free its dockets, and is it Draft only as today?** The prototype frees them and allows Draft only.
6. **Should overlapping dockets still be blocked**, now that the rates table has no time logic? The prototype keeps the block.
