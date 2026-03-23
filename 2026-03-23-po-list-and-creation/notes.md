# Purchase Order — List View & Creation

## Problem
The current PO list view lacks at-a-glance financial summaries and doesn't clearly separate "my" POs from all POs. The create flow is also disconnected from the list.

## What changed

### List view
- **All/My POs toggle** — large toggle bar at the top lets users switch between all purchase orders (95) and their own (12)
- **Summary cards** — four financial KPIs at the top: Total Committed Cost, Total Tracked Cost, Total Tracked Cost (Committed), and Remaining Committed Cost (shown in red when negative)
- **Toolbar** — date range selector, project filter, supplier filter, and search
- **Status tabs** — All, Draft, Awaiting Approval (with badge count), Approved, Closed, Cancelled, Rejected
- **Prominent "Add Purchase Order" hero button** — orange gradient CTA with subtle pulse animation, positioned directly above the table

### Create flow (same page)
- Clicking "Add Purchase Order" switches to the guided creation view without a page navigation
- Back arrow returns to the list view
- Same 3-step guided flow as the standalone PO creation prototype (Project > Supplier > PO Title)

## Why
Combining the list and creation into a single-page experience keeps context. The financial summary cards give managers an instant view of PO spend without needing a separate report.
