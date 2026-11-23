# Dayworks lean release: rates table, variations from dockets, claims from dockets

Built 2026-11-18. Based on `2026-11-18-dayworks-billing-lean` (copied, not changed), with the Dayworks Calculator replaced by one project rates table and a Dayworks tab added to claims. Same Varicon project shell (sidebar, project tabs, Prototype drawer) and the same seed project (Riverside Rd Upgrade).

Live: https://varicon-naxa.github.io/prototypes/2026-11-18-dayworks-lean/
Compare: [full billing](https://varicon-naxa.github.io/prototypes/2026-11-12-dayworks-billing/) · [billing lean](https://varicon-naxa.github.io/prototypes/2026-11-18-dayworks-billing-lean/) · [billing middle](https://varicon-naxa.github.io/prototypes/2026-11-18-dayworks-billing-middle/) · [full calculator](https://varicon-naxa.github.io/prototypes/2026-11-05-dayworks-calculator/)

Files: `config.js`, `engine.js`, `app.js`, `scenarios.js` (16/16 passing), `index.html`.

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

### 4. Answers of 2026-11-20

- **$-only materials and subcontract.** A material or subcontract line recorded only as a $ amount (no quantity, e.g. D211 concrete $600) is charged at cost: charge = the recorded amount. It is no longer Unmapped.
- **Submitted claims.** The Dayworks tab stays editable (Add dockets, remove, Refresh from dockets) until the claim is Approved.
- **Reopen Claim.** Dayworks lines stay frozen at their approved values. They cannot be refreshed or removed, and the dockets stay locked. New dockets can still be added to the reopened claim.
- **Delete claim.** Deleting a claim frees its dockets; docket statuses are unchanged.
- **Overlaps.** Overlapping dockets (the same plant or person twice at the same time) stay blocked from the pickers.

### 5. Rates download (VAR-23168, lean)

- A **Download rates** button on the Charge Resource page (project Daywork Record tab > kebab > Charge Resource) downloads a real .xlsx, built with SheetJS 0.18.5 from cdnjs.
- **File contents:**
  - Title rows: project name and code, then "Rates as at dd/mm/yyyy".
  - A header row.
  - One row per rate line: Resource Type, Resource, Unit, Charge Rate, Applies to.
- **Applies to** names who or what a rate covers:
  - the role's people, excluding anyone with their own named rate;
  - the named person;
  - the plant items of that type;
  - "-" for materials and subcontract.
- **Rates in effect today.** The table has no versions, so today's rates are the only rates.
- **Who sees it.** Anyone who can see the project's dockets; there is no permission UI in the prototype.
- **No rates.** If the project has no rates, there is no button.
- **File name:** "RRU01 dayworks rates dd-mm-yyyy.xlsx".

### 6. Dayworks set-up page (VAR-23108, lean)

- **Where it is.** A new **Dayworks set-up** page, opened from the project's Daywork Record tab: a "Dayworks set-up n/4" button, and also a kebab item. The existing settings pages are unchanged.
- **Progress** reads "n of 4 complete". The seed has no default client representative, so it opens at 3 of 4 with step 1 Missing.
- **Steps.** Each has a Complete or Missing state and is done inline without leaving the page:
  1. **Client approvers.** Mirrors the existing Approval Settings fields: Default Approver, Client Representative (email), Client Name, CC Recipients, Notify to.
     - Saved here; invalid emails are refused.
     - Complete when Default Approver is on with a valid client representative email and name.
  2. **Docket template.** Mirrors the existing Daywork Template fields: sections on or off, include travel hour, attachment duration, daywork allowances.
     - Saved here.
     - Missing only if every section is off.
  3. **Rates.** A read-only summary: has rates, rate count, and the unmapped resources found on the project's dockets (Ben Okafor, Plumber, in the seed).
     - Links to the Charge Resource page and the Download rates button.
     - Says edits go through Varicon support.
     - Complete when the project has rates.
  4. **Claim and variation link.** A read-only check that the project has a contract, so dockets can reach variations and claims.

## Seed choices

- The seeded traffic control docket records 8 crew hours so it fits quantity x rate.
- Plumber has no rate, so it shows Unmapped.

## Open questions for Alec

1. **Delete Variation when the variation is already on a claim.** "Do as the live app does": pending a check of the live app. The prototype keeps its guard and refuses.
2. **Delete claim on a claim that is not Draft.** The live claim menu shows Delete claim on approved claims too. The prototype allows Draft only and frees the dockets. Which claim statuses can be deleted?
3. **Set-up step 1 with Default Approver off.** With Default Approver off, users pick the approver at signing. Should step 1 then count as complete? The prototype counts it as Missing.
4. **Set-up step 3 and unmapped resources.** Should unmapped resources on the project's dockets make the Rates step Missing? The prototype marks it Complete whenever the project has rates and lists the unmapped resources as a warning.
5. **Set-up step 2: when is the template Missing?** The prototype marks it Missing only when every section is off.
6. **Set-up step 4: anything beyond "project has a contract"?** For example, whether the claim set-up (retention, claim period) is in place. The prototype checks the contract only.
