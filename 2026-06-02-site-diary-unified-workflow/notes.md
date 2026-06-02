# Site Diary — Unified Resource Workflow

A faster, guided way to log **Labour, Plant & Equipment, Materials, and Miscellaneous**
into the Site Diary — replacing the clunky tab-by-tab grid editing in the current app.

- **Desktop:** `index.html`
- **Mobile (field):** `mobile.html`

## Problem

Today each resource type lives in its own tab with an inline editable grid:

- **Timecard and Labour are separate tabs that overlap.** A worker's hours are entered
  once for the timesheet (payroll) and *again* against labour for cost — double entry.
- **The grids are slow to fill in** — lots of empty cells, edit-mode toggles, and no
  guidance on what to do next.

## What this prototype changes

1. **Merged "Labour & Time" tab.** One step. Each worker gets Start / End / Break →
   hours auto-calculate. Those hours flow to **both** the timesheet (payroll) and the
   labour cost allocation. No re-entering the same person twice. (Timecard tab removed.)

2. **Guided "Add Entry" drawer/sheet** replaces inline grid editing. The same 4-step
   pattern works for every resource type:
   `Pick resource(s) → Set time/quantity → Allocate → Review → Add`.
   You can select multiple workers/items at once and apply the same time + allocation.

3. **Allocation is a project-level setting.** Each project is configured as either
   **WBS** (Task → Subtask) or **Cost Centre** (flat code). The add flow and the table
   chips adapt automatically. A toggle in the prototype lets you preview both modes —
   in production it is fixed per project.

4. **Split allocation.** A single entry's hours/quantity can be split across multiple
   tasks or cost centres with live percentage validation (must total 100%).

## Notes

- Static HTML/CSS/JS, no build step. Desktop matches the live web app's visual language;
  mobile matches the existing field prototypes (phone frame).
- Seeded with sample data for VAR006 Little Collins Roadworks so the tables aren't empty.
- Plant / Materials / Misc tabs reuse the same add engine with resource-specific fields
  (hire type, supplier, units).
