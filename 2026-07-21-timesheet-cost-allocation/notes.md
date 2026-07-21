# Timesheet — require full cost-centre allocation before approval

**Problem:** Supervisors can approve timesheets where the worker's time isn't allocated to any
cost centre (see web approval screen: `ASSIGNED 0h 0m` / `UNASSIGNED 6h 45m`). Unallocated time
can't be costed correctly.

**Rule prototyped:** a supervisor cannot approve a timesheet until **Unassigned hours = 0** —
every minute of approved time is allocated across one or more cost centres.

**Two surfaces (switch via the top PROTOTYPE bar):**

1. **Mobile approval** (phone frame)
   - Approvals list flags the unapproved entry with "⚠ 6h 45m unallocated"; the already-approved
     one shows "✓ Fully allocated".
   - Timesheet detail has an **Assign cost centre** card with Assigned/Unassigned meter boxes and a
     progress bar. **Approve is disabled** with an amber hint until fully allocated.
   - "＋ Assign cost centre" opens a bottom sheet: pick cost centre + duration ("Use remaining"
     shortcut). Allocations can't exceed the 6h 45m total. Each adds a row and updates the meter.
   - When Unassigned hits 0, the meter/bar turn green, the hint flips to "ready to approve", and
     Approve enables → success modal.

2. **Web approval** — mirrors the same rule on the existing Worker Timesheet screen. ADD NEW adds a
   cost-centre row (dropdown + duration); ASSIGNED/UNASSIGNED hours update live; a banner + the
   **Approve** button stay gated until 6h 45m is fully allocated.

**Open questions for product:**
- Whole-timesheet gate vs. also blocking multi-day submissions per day.
- Should this be a per-org setting (like the project cost-centre rule) or always-on?
- Behaviour when time is already partly allocated by the worker at clock-out.

Built to share with the product team, 21/07/2026. Only 3 of 7 screenshots (web) came through —
mobile screens were reconstructed from existing Varicon mobile patterns; will match exactly if the
mobile captures are shared.
