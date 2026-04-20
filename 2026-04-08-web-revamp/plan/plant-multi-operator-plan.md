# Plant & Equipment — Multi-Operator / Multi-Source Plan

## The Problem

The current model assumes **one equipment = one operator**. But on a real construction site:

```
55T Excavator (EQ-006)
├── John Smith       07:00 – 12:00   Road Base task       5h
└── Mike Johnson     12:00 – 17:00   Earthworks task      5h

Dump Truck (EQ-010)
├── Tom Brown        07:00 – 11:00   Spoil Removal        4h
├── Alex Chen        11:00 – 15:00   Spoil Removal        4h
└── Sarah Williams   15:00 – 17:00   Backfill             2h
```

Also, equipment sources can differ per usage:
- Machine is from **Metro Hire** (Wet Hire, includes operator)
- But company's own operator also logs time against it (cost tracking)

---

## Why This Matters on Site

| Scenario | Current pain | With multi-operator |
|---|---|---|
| Shift handover (AM/PM operators) | Only one name recorded | Each shift logged separately with hours |
| Sub-contractor + own operator | Can't split billing | Different company per operator row |
| Task allocation per person | All hours go to one task | Each operator allocates to their own tasks |
| End-of-day audit | Manager can't see who used machine when | Full timeline per equipment |
| Billing reconciliation | One lump total | Breakdown by operator and company |

---

## Data Model Change

### Current (single operator)
```js
{
  id, name, hire, eqId,
  op: 'John Smith',          // single string
  supplier: 'Metro Hire',    // single string
  taskHours: { 'T01': 300 }, // flat task map for whole equipment
  unassignedMins: 0
}
```

### Proposed (multi-operator)
```js
{
  id, name, hire, eqId,
  supplier: 'Metro Hire',    // where the machine comes from (unchanged)
  operators: [               // NEW — array of usage records
    {
      opId: 1,
      name: 'John Smith',
      company: 'Metro Hire', // which company the operator is from
      startTime: '07:00',
      endTime:   '12:00',
      taskHours: { 'T01': 300, 'T02': 0 },
      unassignedMins: 0
    },
    {
      opId: 2,
      name: 'Mike Johnson',
      company: 'BuildCo',
      startTime: '12:00',
      endTime:   '17:00',
      taskHours: { 'T01': 0, 'T02': 300 },
      unassignedMins: 0
    }
  ]
  // Computed from operators[]:
  // totalMins     = sum of all operator durations
  // taskHours     = sum across all operators per task code
  // status badge  = Active if any operator has hours, Idle if none
}
```

**Backward compatibility:** `op` and `taskHours` at the top level become computed aggregates used only for display/stats. Source of truth moves to `operators[]`.

---

## UI Design — Expandable Operator Sub-Rows

### Collapsed state (default)
```
[▶] EQ-006  55T Excavator   Wet Hire  │ Active │  10h 00m  │  0h 0m  │ T01: 5h  T02: 5h
            2 operators                │        │ (total)   │         │
```

### Expanded state (click ▶ to expand)
```
[▼] EQ-006  55T Excavator   Wet Hire  │ Active │  10h 00m  │ ...
    ├── John Smith    Metro Hire   07:00–12:00   T01: 5h  T02: 0h   unassigned: 0h
    ├── Mike Johnson  BuildCo      12:00–17:00   T01: 0h  T02: 5h   unassigned: 0h
    └── [+ Add Operator / Shift]
```

### Parent row design
- Shows equipment name, ID badge, hire type, status badge, **total** hours (aggregated)
- Operator count chip: `2 operators` in muted text
- Expand/collapse chevron (▶/▼) on left
- All existing columns preserved — totals computed from operators[]

### Child row design
- Indented, slightly lighter background (`#FAFAFA`)
- Left amber accent line (3px) to show hierarchy
- Columns: Operator name | Company | Start–End time | Task hours per column | Unassigned | Remove (×)
- Compact height (~40px)
- Inline editable (same style as parent — dropdowns, time pickers)

### Add Operator row
- Dashed border row at bottom of expanded section
- `+ Add Operator / Shift` — adds a new blank child row
- Pre-fills start time = previous operator's end time (smart default)

---

## Source / Supplier Grouping (Group by Source view)

A toggle in the section header: `Group by: [ None ▼ ]` → options: `None | Supplier | Hire Type`

When **Group by Supplier** is active:
```
▼ METRO HIRE  (3 pieces · 22h)
  [55T Excavator row]
  [Dump Truck row]
  [Motor Grader row]

▼ BUILDCO  (2 pieces · 14h)
  [Backhoe Loader row]
  [Compactor row]

▼ COMPANY OWNED  (1 piece · 8h)
  [Bobcat T590 row]
```

Group header shows: supplier name | equipment count | total hours for that supplier

---

## Stats Strip Updates

Add two new pills (or update existing):

```
Equipment (6) | Active (4) | Idle (2) | Stand Down (1) | Not Logged (3) | Hours 44h | Operators (8)
```

`Operators (8)` = total unique operator-usage records across all equipment today

---

## Key Interactions

| Action | Behaviour |
|---|---|
| Click ▶ chevron | Expand to show operator sub-rows |
| Click `+ Add Operator` | Adds blank sub-row, focus on operator name |
| Edit start/end time | Auto-calculates duration, updates task hour totals |
| Remove operator (×) | Removes that usage row, re-aggregates parent totals |
| Last operator removed | Equipment row stays, resets to Idle |
| `Group by Supplier` toggle | Re-renders table with group headers, keeps expand state |

---

## Files to Modify

| File | Changes |
|---|---|
| `js/plant.js` | Update data model (`operators[]`), new `renderOperatorRows()`, `addOperatorRow()`, `removeOperatorRow()`, update `updatePlantStats()`, update `calcNotLoggedItems()` |
| `pages/sec-plant.html` + `index.html` | Group-by toggle in header, Operators pill |
| `js/core.js` | No changes needed |
| `css/styles.css` or inline | `.pe-child-row` styles, left accent line |

---

## Build Phases

| Phase | Scope |
|---|---|
| **1** | Data model: replace single `op` with `operators[]`. Expand/collapse parent row. Add/remove operator sub-rows. Aggregated totals on parent. |
| **2** | Per-operator task hour allocation. Each child row has its own task columns. Parent shows summed totals. |
| **3** | Group by Supplier / Hire Type toggle. Group headers with subtotals. |
| **4** | Operators pill in stats strip. Smart start-time pre-fill on Add Operator. |

---

## What This Looks Like End-to-End

```
Plant & Equipment
Equipment 6 | Active 4 | Idle 2 | Stand Down 1 | Not Logged 3 | Operators 8 | Hours 44h 00m

OPERATING (6)          STAND DOWN (1)          Group by: Supplier ▼

Status  │ Equipment Description        │ Operators  │ Equip. Duration │ T01  │ T02
────────┼─────────────────────────────┼────────────┼─────────────────┼──────┼─────
Active  │ [▼] EQ-006  55T Excavator   │ 2 operators│    10h 00m      │  5h  │  5h
        │     John Smith  07:00-12:00 │            │                 │  5h  │  0h
        │     Mike Johnson 12:00-17:00│            │                 │  0h  │  5h
        │     [+ Add Operator]        │            │                 │      │
────────┼─────────────────────────────┼────────────┼─────────────────┼──────┼─────
Idle    │ [▶] EQ-010  Dump Truck      │ 1 operator │     0h 00m      │  0h  │  0h
```

---

*Created: 2026-04-15*
