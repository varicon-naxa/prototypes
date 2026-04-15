# Plant & Equipment — Fleet Status Visibility Plan

## Problem
The current Plant & Equipment section is **entries-first**, not **fleet-first**.

Only equipment that has been manually added to today's diary appears in the Operating or Stand Down tabs. Equipment assigned to the project but not yet logged is completely invisible — the manager has no way to know what's unaccounted for.

```
Project Fleet (equipmentCatalogue): 10 pieces
─────────────────────────────────────────────
Today's Operating tab:    X pieces  ← visible
Today's Stand Down tab:   Y pieces  ← visible
Not logged at all:        Z pieces  ← INVISIBLE (the problem)
```

---

## Data Model

All required data already exists — no new backend fields needed.

| Source | What it holds |
|---|---|
| `equipmentCatalogue[]` | ALL equipment assigned to this project (source of truth) |
| `plantData[]` | Today's operating entries only |
| `standDownData[]` | Today's stand down entries only |

**Status derivation (computed, not stored):**

| Status | Logic |
|---|---|
| `Active` | `eqId` in `plantData` AND has task hours > 0 |
| `Idle` | `eqId` in `plantData` AND all task hours = 0 (only unassigned) |
| `Stand Down` | `eqId` in `standDownData` |
| `Not Logged` | `eqId` NOT in `plantData` and NOT in `standDownData` |

Helper to add to `plant.js`:
```js
function getEquipStatus(eqId) {
  const sd = standDownData.find(s => s.eqId === eqId);
  if (sd) return 'standdown';
  const op = plantData.find(p => p.eqId === eqId);
  if (!op) return 'notlogged';
  const hasTaskHours = Object.values(op.taskHours || {}).some(v => v > 0);
  return hasTaskHours ? 'active' : 'idle';
}
```

---

## UI Changes

### 1. Stats Strip — 2 new pills

Current: `Equipment (total) | Operating | Stand Down | Hours`

New: `Equipment (10) | Active (2) | Idle (1) | Stand Down (2) | Not Logged (5) | Hours`

- `Not Logged` pill background turns **amber** (`#FEF3DC`, border `#F5A623`) when count > 0
- `Active` pill: green (`#F0FDF4`, text `#059669`)
- `Idle` pill: amber-light (`#FFFBEB`, text `#92400E`)

IDs to add: `#pe-stat-active`, `#pe-stat-idle`, `#pe-stat-notlogged`

---

### 2. "Not Logged Today" Section — below Operating table

A collapsible section rendered inside `#pe-operating-tab`, below the main plant table.
Only renders when `notLoggedEquip.length > 0`.

**Visual design:**
- Amber header bar: `NOT LOGGED TODAY (5)` with collapse chevron
- Dashed border container, slightly muted background (`#FAFAFA`)
- Compact rows (~40px height) — no task columns, just identification + actions

**Columns:**
```
Equipment Name + ID badge | Type | Hire Type | [+ Log Operating] [Log Stand Down]
```

**Row actions:**
- `+ Log Operating` — calls `quickAddEquip(eqId)`, scrolls to new row, highlights it briefly
- `Log Stand Down` — opens `mo-log-standdown` modal pre-filled with that equipment's name

**HTML container ID:** `#pe-notlogged-section`
**Render function:** `renderNotLogged()` — called at end of `renderPlant()`

---

### 3. Status Badge Column — in Operating table

Add a `Status` column as the 2nd column in `#plant-thead` / `#plant-tbody`.

| Badge | Style |
|---|---|
| Active | `bg #D1FAE5, text #065F46` |
| Idle | `bg #FEF3DC, text #92400E` |

Width: ~80px fixed. Badge: `border-radius: 4px`, `padding: 2px 8px`, `font-size: 11px`, `font-weight: 600`.

---

### 4. Tab Labels with Live Counts

```
OPERATING (3)    STAND DOWN (2)
```

Update `switchPlantTab()` and `renderPlant()` / `renderStandDown()` to inject counts into tab button labels.

Tab button IDs: `#pe-tab-op`, `#pe-tab-sd`

---

## Files to Modify

| File | Changes |
|---|---|
| `pages/sec-plant.html` | Add `#pe-stat-active`, `#pe-stat-idle`, `#pe-stat-notlogged` pills; add `#pe-notlogged-section` div |
| `js/plant.js` | Add `getEquipStatus()`, `renderNotLogged()`, update `renderPlant()` and stats calculation |

---

## Build Phases

| Phase | Scope | Value |
|---|---|---|
| **1** | Stats strip (new pills) + Not Logged section | Core — makes invisible equipment visible |
| **2** | Status badge column in Operating table | Contextual — shows Active vs Idle at a glance |
| **3** | Tab labels with live counts | Polish |

---

## Why This Matters

| Before | After |
|---|---|
| Only logged equipment visible | Entire fleet visible every day |
| Manager must remember what's on site | "Not Logged (5)" is the daily red flag |
| End-of-day scramble to account for everything | Checklist — drive the count to 0 |
| Stand-down logging is separate, manual | One-click from the unlogged row |

---

*Created: 2026-04-15*
