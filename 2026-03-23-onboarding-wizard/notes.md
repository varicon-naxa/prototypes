# First Login Onboarding Wizard

## Problem
New users currently land in the app with no guidance on how to set up their account. Critical configuration (accounting integration, PO settings, resource cost sheets) gets skipped or done incorrectly, causing issues downstream.

## What changed

A forced 6-step setup wizard on first login that blocks access to the app until completed:

1. **Accounting Integration** — Connect Xero, MYOB, or QuickBooks. Shows confirmation of Suppliers, Chart of Accounts, and Tax Codes synced directly in the selected provider card.
2. **PO Settings** — Configure purchase order settings with recommended defaults (red warning if changed from recommended). Invoice email is required. Approval workflow requires at least 1 Creator, 1 Approver, and 1 Closer before the user can proceed.
3. **Bills Setup** — Configure bill sync settings. Integration start date defaults to 30 days ago. "Sync Bills when" has 3 options.
4. **Accounting Codes** — Shows only Expense-type codes with an "Archive" checkbox column. Archived codes are excluded from dropdowns throughout the app.
5. **Resource Cost Sheet** — Dropdowns exclude archived accounting codes. "Not Applicable" option available. AI auto-fill for same resource type.
6. **Tracking Categories (Xero)** — Instructions and a direct link to Xero tracking categories settings.

Each step must be completed before the user can proceed to the next. Back navigation is available.

## Why
Getting the setup right from day one prevents a cascade of issues later (wrong accounting codes, missing approval workflows, unlinked Xero accounts). The wizard ensures nothing is skipped.
