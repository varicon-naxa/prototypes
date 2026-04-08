# Subcontractor Timesheet — Web

## Context
In Varicon's standard AP flow: PO → Delivery Docket → Bill.
For third-party labour (ABN subcontractors or labour hire companies), the timesheet replaces the delivery docket as proof of service delivery.

**Third-party labour AP flow:** PO → Timesheet → Payment Certificate → Bill

## Screens
1. **Timesheet List — Subcontractors Tab** — filtered view showing third-party labour timesheets grouped by company, with linked PO references
2. **Select Company** — choose subcontractor (ABN) or labour hire company to manage their timesheets
3. **Company Timesheet View** — see all timesheets for a specific company, link to PO, approve hours
4. **Create Payment Certificate** — generate a payment cert from approved timesheets for the period
5. **Link to Bill** — when a bill/invoice arrives, link it to the PO + payment certificate

## Key Differences from Employee Timesheets
- No clock in/out — hours are submitted or entered by PM
- Company/ABN selection instead of individual employee
- Linked to Purchase Order (not payroll)
- Generates Payment Certificate (not payroll export)
- Bill linking completes the AP triangle (PO + Cert + Bill)

## Purpose
Prototype the third-party labour timesheet workflow to validate the AP linkage model before development.
