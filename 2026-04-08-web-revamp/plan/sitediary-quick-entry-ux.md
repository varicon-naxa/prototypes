# Site Diary — Quick Entry UX Improvement Plan

**Module:** `src/pages/ProjectBudget/SiteDiary/`  
**Problem:** Daily site diary entry is "tedious" and "a pain" — too many clicks, modal fatigue, inconsistent editing patterns  
**Goal:** Reduce the number of clicks/interactions to complete a daily diary entry by 60%+

---

## 1. Problem Analysis

### Current Click Counts (Measured from Code)

| Section | Current Clicks (min) | Primary Pain |
|---|---|---|
| Weather | 6 | 4 separate dropdowns, no smart defaults |
| Labour (ManPower) | 8 per resource | Expand row → inline fields → Task dropdown → Save |
| Materials | 8 per item | 2 modal layers (Material → Task/Cost Centre tree) |
| Tasks | 7 per task | Tree navigation through dialog |
| Equipment Operating | 4–5 | Reasonable — already inline |
| Notes | 3 | Acceptable |
| Approval flow | 6–8 | Warning modals before signature |
| **Total typical diary** | **~50–70 clicks** | Far too high for a daily task |

### Root Causes

1. **Modal fatigue** — Materials use 2 stacked modals (material → task → cost centre tree)
2. **No smart defaults** — Every day starts from scratch; no memory of yesterday's typical entries
3. **Fragmented layout** — Tab or scroll view forces context-switching between sections
4. **Inconsistent patterns** — Equipment uses inline editing; Material uses modals; Labour is hybrid
5. **No keyboard-first path** — No way to Tab through an entire entry using keyboard only
6. **Approval overhead** — Multiple warning confirmation modals even when data is complete

---

## 2. Proposed Solutions

### 2.1 Quick Entry Panel (Primary Feature)

A collapsible **"Quick Entry"** side panel (or bottom drawer) that aggregates the most common daily inputs into a single, linear, keyboard-navigable form — no modals.

**Trigger:** A persistent floating button `+ Quick Entry` in the bottom-right corner, or a keyboard shortcut `Cmd/Ctrl + K`.

**Panel Layout — Single Scrollable Column:**

```
┌─────────────────────────────────────────────────────────┐
│  Quick Entry  ─  [Mon, 7 Apr 2026]          [×] Close  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  WEATHER                                    [Auto-fill] │
│  Sky [Clear ▼]  Temp [Mild ▼]  Rain [None ▼]           │
│  ☐ Weather Delay                                        │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  LABOUR                              [+ Add Row] [⟳]   │
│  ┌─────────────────┬───────┬───────┬────────────────┐  │
│  │ Resource        │  Qty  │  Hrs  │  Task          │  │
│  ├─────────────────┼───────┼───────┼────────────────┤  │
│  │ [Rollover row]  │   2   │  8.0  │ [Task ▼]       │  │
│  │ [+ New row]     │       │       │                │  │
│  └─────────────────┴───────┴───────┴────────────────┘  │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  EQUIPMENT OPERATING                    [+ Add Row]     │
│  (same inline table pattern)                            │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  MATERIALS                              [+ Add Row]     │
│  (same inline table pattern — no modal)                 │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  NOTES (Primary Section)                               │
│  ┌─────────────────────────────────────────────────┐  │
│  │ [Textarea — auto-grow]                          │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                            [Save Draft]  [Save & Close] │
└─────────────────────────────────────────────────────────┘
```

**Key Behaviours:**
- Sections that have no data today are **collapsed by default** — expand on click
- Sections with data are **always pre-expanded**
- `Tab` key moves between fields linearly (no mouse needed after opening)
- `Enter` on a row adds a new row immediately
- All saves are **optimistic** — UI updates instantly, API call in background
- **No modals** — Task/Cost Centre is a flat searchable dropdown (not a tree modal)

**Click target: 8–12 clicks for a typical day (vs. current ~50–70)**

---

### 2.2 Yesterday's Rollover — Smart Pre-fill

**Current State:** Only Notes section has a rollover button.  
**Proposed:** Every section of Quick Entry shows a `[⟳ Copy from yesterday]` chip in the section header.

**Rollover Logic Per Section:**

| Section | What Gets Rolled Over | What Does Not |
|---|---|---|
| Weather | Nothing (auto-fetches fresh data) | — |
| Labour | Resource + Qty + Hours + Task assignment | Notes fields |
| Equipment Operating | Equipment + Task assignment | Hours (reset to 0) |
| Materials | Material + Qty + Source + Task | — |
| Tasks | Task list only | Notes, attachments |
| Notes | Full text (existing feature) | — |

**UX:** A single **"Roll over all sections"** button at the top of Quick Entry panel applies rollover to all sections in one click, pre-populated for editing.

---

### 2.3 Inline Material Entry (No Modal)

**Current Pain:** Adding a material requires:
1. Click Add button
2. Modal opens — search/select material
3. Enter quantity
4. Click Task dropdown → tree modal opens
5. Navigate tree
6. Confirm
7. Confirm material modal
8. Save

**Proposed:** Replace modal with an inline expandable row (same pattern as Equipment Operating tab):

```
┌──────────────────────┬────────┬──────────┬─────────────────┬──────┐
│ Material (search)    │  Qty   │  Source  │  Task           │  ×   │
├──────────────────────┼────────┼──────────┼─────────────────┼──────┤
│ [Concrete 25 MPa   ] │ [10  ] │ [Stock▼] │ [Footing Work▼] │  ×   │
│ [+ Add material    ] │        │          │                 │      │
└──────────────────────┴────────┴──────────┴─────────────────┴──────┘
```

- Material field: Type-ahead search (like an autocomplete `Select`)
- Task field: Searchable flat dropdown (most-used tasks first, not a tree)
- Confirmation modal: **Eliminated**

**Click target for adding one material: 3 clicks (click row + search + save)**

---

### 2.4 Flatten Task/Cost Centre Selection

**Current Pain:** Task and Cost Centre selection opens a nested tree dialog. For common tasks used every day this is the #1 repeated pain.

**Proposed:** Two-tier improvement:

**Tier 1 — Favourites/Recents:**  
Track the last 5 tasks used per project per user. Show these as quick-select chips above the dropdown:

```
[ Footing Work ] [ Slab Pour ] [ Reo Bar ] [ + More... ]
```

**Tier 2 — Flat Searchable Dropdown:**  
When "More" is clicked, open a flat searchable dropdown (not a modal tree). Type to filter the tree path.

```
Search tasks...
> Concrete Work > Footing > Pour
> Concrete Work > Slab > Reinforcement  
> Earthworks > Excavation > Bulk Cut
```

This eliminates the modal tree entirely for 80% of entries (users reuse the same tasks daily).

---

### 2.5 Streamlined Approval Flow

**Current Pain:**  
Sign & Submit → Warning modal (unassigned tasks) → Warning modal (unverified equipment) → Report preview → Submit → Signature modal = **6–8 modals**

**Proposed:**

**Step 1 — Inline Warnings (not blocking modals):**  
Show inline warning banners at the top of the relevant sections (not modal interruptions):
```
⚠  2 labour entries have no task assigned  [Review]
```
These appear during the entry phase, not at submission time.

**Step 2 — Single Confirmation Dialog:**  
Replace the 3-step modal chain with one dialog:
```
┌──────────────────────────────────────────────────────┐
│  Submit Site Diary — 7 Apr 2026                      │
├──────────────────────────────────────────────────────┤
│  ✅ Weather logged                                    │
│  ✅ Labour: 12 entries                                │
│  ⚠  2 labour entries have no task (will be excluded  │
│     from cost tracking)                               │
│  ✅ Equipment: 4 items                                │
│  ✅ Notes added                                       │
├──────────────────────────────────────────────────────┤
│  [Draw Signature]                                     │
│  ┌───────────────────────────────────────────────┐   │
│  │  [Signature canvas]                           │   │
│  └───────────────────────────────────────────────┘   │
├──────────────────────────────────────────────────────┤
│                          [Cancel]  [Submit Diary]     │
└──────────────────────────────────────────────────────┘
```

**One dialog replaces 4 modals. Click target: 3 clicks (Submit → Sign → Confirm)**

---

### 2.6 Persistent "Daily Template"

For sites where the same crew/equipment runs every day:

**Setup (one time):**  
In the settings menu (⋮ → "Manage Daily Template"), the user defines a template:
- Default labour rows (resource, typical hours)
- Default equipment list
- Default task assignments

**Each New Day:**  
The Quick Entry panel opens pre-filled with template data. User adjusts quantities and hits Save.

**Implementation:** Store template in user preferences via a new endpoint (or localStorage as interim).

---

## 3. Implementation Roadmap

### Phase 1 — Quick Wins (1–2 sprints, no new architecture)

| Task | File(s) | Effort |
|---|---|---|
| **1.1** Add `[⟳ Copy from yesterday]` to Labour, Equipment, Materials sections | `ManPower/`, `Equipment/`, `Material/` | S |
| **1.2** Add recent/favourite tasks chips above task dropdowns | shared `TaskSelectField` component | M |
| **1.3** Remove redundant confirmation modal in Material entry (combine steps 6+7) | `Material/components/Modals/` | S |
| **1.4** Combine unassigned-task + unverified-equipment into single pre-check banner | `Header/SignAndApprove/` | S |
| **1.5** Weather: persist last manual entry as default for next day | `WeatherLog/` | S |

### Phase 2 — Quick Entry Panel (2–3 sprints, new component)

| Task | File(s) | Effort |
|---|---|---|
| **2.1** Create `QuickEntryPanel` component | `SiteDiary/components/QuickEntryPanel/` | L |
| **2.2** Inline Labour rows in panel (no expand/collapse) | `QuickEntryPanel/LabourSection/` | M |
| **2.3** Inline Material rows in panel (no modal) | `QuickEntryPanel/MaterialSection/` | M |
| **2.4** Inline Equipment rows in panel (no modal) | `QuickEntryPanel/EquipmentSection/` | M |
| **2.5** "Roll over all" one-click button | `QuickEntryPanel/` | S |
| **2.6** Keyboard navigation (Tab through all fields) | All inline row components | M |
| **2.7** Floating trigger button + `Cmd+K` shortcut | `CombineSiteDiary.tsx` | S |

### Phase 3 — Streamlined Approval & Templates (2 sprints)

| Task | File(s) | Effort |
|---|---|---|
| **3.1** Unified submit dialog with inline signature | `Header/SignAndApprove/` | M |
| **3.2** Inline warning banners per section | `SiteDiaryComponentsWrapper/` | S |
| **3.3** Daily template setup in settings drawer | `Header/ReportDrawer/` or new drawer | L |
| **3.4** Auto-populate from template on date change | `context/useApiServices.ts` | M |

---

## 4. Component Architecture

### New Component: `QuickEntryPanel`

```
src/pages/ProjectBudget/SiteDiary/
└── components/
    └── QuickEntryPanel/
        ├── index.tsx                  ← Panel shell, open/close, keyboard shortcut
        ├── QuickEntryHeader/
        │   └── index.tsx              ← Date display, Roll Over All button
        ├── sections/
        │   ├── WeatherSection/
        │   │   └── index.tsx          ← 3 dropdowns inline, no modal
        │   ├── LabourSection/
        │   │   ├── index.tsx          ← Table with inline rows
        │   │   └── LabourRow/
        │   │       └── index.tsx      ← Resource | Qty | Hrs | Task | Delete
        │   ├── EquipmentSection/
        │   │   └── index.tsx
        │   ├── MaterialSection/
        │   │   ├── index.tsx
        │   │   └── MaterialRow/
        │   │       └── index.tsx      ← Material(search) | Qty | Source | Task | Delete
        │   └── NotesSection/
        │       └── index.tsx          ← Textarea (primary section only)
        ├── hooks/
        │   ├── useQuickEntryState.ts  ← Aggregated dirty state for all sections
        │   └── useQuickEntrySave.ts   ← Parallel save mutations
        └── style.ts
```

### New Shared Component: `TaskQuickSelect`

```
src/components/molecules/
└── TaskQuickSelect/
    ├── index.tsx      ← Chips (recents) + searchable flat dropdown
    └── style.ts
```

This replaces the tree modal throughout the entire SiteDiary module.

---

## 5. Data & API Strategy

### Optimistic Updates
All Quick Entry saves should use **optimistic updates**:
```typescript
// Pattern for each section
onMutate: async (variables) => {
  // Cancel in-flight queries
  await queryClient.cancelQueries(['siteDiary', date, 'labour']);
  // Snapshot previous value
  const snapshot = queryClient.getQueryData(['siteDiary', date, 'labour']);
  // Optimistically update
  queryClient.setQueryData(['siteDiary', date, 'labour'], old => [...old, variables]);
  return { snapshot };
},
onError: (err, vars, ctx) => {
  // Roll back
  queryClient.setQueryData(['siteDiary', date, 'labour'], ctx.snapshot);
}
```

### Migrate to React Query
The current pattern uses manual `fetch*()` functions with no caching. Migrating key sections to React Query enables:
- Automatic background refetch
- Stale-while-revalidate (no empty states on tab switch)
- Shared cache between Quick Entry panel and main view

### Recent Tasks API (New or Client-Side)
Track last 10 task selections per project in localStorage:
```typescript
const RECENT_TASKS_KEY = `sitediary_recent_tasks_${projectId}`;
```
No new API endpoint needed for Phase 1.

---

## 6. Success Metrics

| Metric | Current | Target |
|---|---|---|
| Clicks to complete a typical daily entry | ~50–70 | ≤ 15 |
| Time to complete daily entry | ~15–25 min | ≤ 5 min |
| Modals per session | 8–12 | ≤ 2 |
| Approval flow clicks | 6–8 | 3 |
| % entries using rollover (after feature launch) | 0% | >60% |

---

## 7. UX Principles for This Module

1. **The fastest entry wins** — Every interaction should have a keyboard-native alternative
2. **Memory over repetition** — The system should remember what you did yesterday
3. **Warn early, not at submission** — Validation banners during entry, not blocking modals at save
4. **One save action** — Bulk autosave or a single "Save All" — never save per-row except for complex items
5. **Inline > Modal** — If data fits in a table row, it stays in a table row. Modals are for attachments and signatures only

---

## 8. Files to Change (Phase 1 Quick Wins)

| File | Change |
|---|---|
| [ManPower/TaskBody/GroupByCompany/index.tsx](../src/pages/ProjectBudget/SiteDiary/ManPower) | Add `RolloverButton` in section header |
| [Equipment/EquipmentBody/OperatingTab/index.tsx](../src/pages/ProjectBudget/SiteDiary/Equipment) | Add `RolloverButton` in section header |
| [Material/MaterialTable/index.tsx](../src/pages/ProjectBudget/SiteDiary/Material) | Add `RolloverButton`; remove duplicate confirm step |
| [Header/SignAndApprove/index.tsx](../src/pages/ProjectBudget/SiteDiary/Header) | Merge warning modals into single unified dialog |
| [WeatherLog/index.tsx](../src/pages/ProjectBudget/SiteDiary/WeatherLog) | Persist last manual entry as tomorrow's default |
| [context/useApiServices.ts](../src/pages/ProjectBudget/SiteDiary/context/useApiServices.ts) | Add `fetchPreviousDayData()` for rollover per section |

---

## 9. Open Questions for Product/Design Review

1. **Quick Entry panel vs. redesigned full-page view?**  
   A panel (drawer) is lower risk — existing views unchanged. A redesigned page is more cohesive but higher effort. Recommend panel for Phase 2, evaluate full page redesign for a future phase.

2. **Should rollover be opt-in per day or opt-out?**  
   Opt-in (user clicks "Roll over") is safer. Opt-out (auto-fills and user clears) is faster but may cause entries to go un-reviewed. Recommend opt-in with a prominent "Roll over all" button.

3. **Flat task dropdown vs. tree?**  
   Construction tasks are often deeply hierarchical (3–4 levels). A flat searchable list with full path shown is workable for search but discovery of unknown tasks requires the tree. Recommend: recents chips first, flat search second, "Browse tree" as last resort.

4. **Signature on mobile?**  
   The streamlined approval dialog should be tested on tablet (most site supervisors are on tablet in the field).

5. **Offline / poor connectivity?**  
   Site locations often have poor connectivity. The Quick Entry panel should queue saves and retry — this is a future enhancement but worth noting in architecture.
