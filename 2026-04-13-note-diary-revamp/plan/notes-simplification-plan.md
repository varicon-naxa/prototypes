# Notes → Diary Simplification Plan
**Date:** 2026-04-16  
**File:** `notes.html`  
**Goal:** Simplify the Notes section into a clean, easy-to-use Site Diary — remove complexity, widen the table, rename terminology where appropriate.

---

## Terminology Rename

| Current | Proposed | Rationale |
|---|---|---|
| "Notes" (tab label) | "Diary" | This IS the site diary — more fitting term |
| "Add Note" (button) | "Add Entry" | Entries belong to a diary |
| "Note" (singular reference) | "Entry" | Consistency with Diary naming |
| "Notes" count badge in tab | "X Entries" | Consistent renaming |
| "Manage Notes" | "Manage Sections" | Sections is clearer than notes here |
| Note text field placeholder | "Write your diary entry…" | More natural |

> Page title already says "Site Diary — Notes" so the rename to "Diary" is a natural fit.

---

## Section 1 — Manage Sections (Modal: `gt` function)

### Current State
- Add / edit / delete diary sections
- Custom field builder (add fields like "Completion %", dropdowns, etc.)
- Likely note type configuration tied to sections

### Planned Changes
**Remove:**
- Entire custom field builder — no more adding custom fields to notes
- Note type assignment per section (no more Action Required / Notification types)

**Keep:**
- Add new section (name + optional icon/colour)
- Edit section name
- Delete section
- Reorder sections (if present)

**Result:** Manage Sections modal becomes a simple, clean list editor — nothing more.

---

## Section 2 — Add Entry Modal (Modal: `dt` function)

### Current State
- Note type selector: Standard / Action Required / Send Notification
- Text area for note content
- Action Required fields: Assignee, Priority, Due Date
- Notification fields: Recipient list
- Custom field values (e.g. Completion %)

### Planned Changes
**Remove:**
- Note type selector (Standard / Action Required / Notification)
- Assignee, Priority, Due Date fields
- Notification recipient list
- Custom field values section

**Add:**
- Category dropdown (single select, optional):
  - General
  - Safety
  - Instruction
  - Issue / Defect
  - Delivery / Materials
  - Weather
- Location / Area field (short text input, optional)
- Trade / Subcontractor field (dropdown, optional):
  - e.g. Electrical, Plumbing, Concrete, Steel, Carpentry, Civil, Other
- Photo upload (optional, multiple photos allowed)

**Keep:**
- Textarea — primary field, required, large and prominent
- Author — auto-populated from session (not editable)
- Date & Time — auto-populated (not shown in form, only in detail view)
- Section selector — which section this entry belongs to
- Save / Cancel actions

**Modal Layout (top → bottom):**
```
[ Textarea — "Write your diary entry…" ]      ← full width, tall, required

[ Category ▾ ]  [ Location / Area ]  [ Trade ▾ ]   ← optional row, compact

[ + Attach Photos ]                            ← subtle upload button

[ Author: auto ] [ Date: auto ]                ← read-only, small, bottom

                            [ Cancel ]  [ Add Entry ]
```

---

## Section 3 — Entry List / Table View (Component: `ct` function)

### Current State
- Table columns: `#` · `Note` · `Author` · `Date`
- Note column is not significantly wider than others
- Date column shows full date

### Planned Changes

**Table Columns (revised):**

| Column | Width | Notes |
|---|---|---|
| `#` | 36px fixed | Row number |
| `Entry` | flex / ~50% min | The note text — **widened significantly**, truncate with expand |
| `Category` | 100px | Pill/tag style, hidden if empty |
| `Location` | 110px | Plain text, hidden if empty |
| `Trade` | 110px | Plain text, hidden if empty |
| `Photos` | 56px | Thumbnail count icon if photos attached |
| `Author` | 120px | Name only |

**Remove:**
- `Date` column from table — context is already today's diary
- `Time` column — same reason, not needed in list view

**Date/Time — Where it lives:**
- Shown only in the **expanded detail view** of an entry (click to open)
- Shown as a small subtitle in the entry modal when editing

**Note text in table:**
- Show first 2–3 lines, then fade/truncate
- Click row to expand the full entry inline or in a side panel

**Empty state (no entries in section):**
- Clean illustration + "No entries yet. Add the first diary entry."

---

## Section 4 — Note Type System (`ot` array)

### Current State
```js
var ot = [
  { id: "standard",        label: "Standard",          desc: "Record written notes and observations." },
  { id: "action-required", label: "Action Required",   desc: "Attach a follow-up action — assignee, priority & due date." },
  { id: "notification",    label: "Send Notification", desc: "Alert nominated recipients automatically when a note is saved." }
];
```

### Planned Changes
- **Remove `ot` array entirely** — no more note types
- Remove all `behaviors.includes("action-required")` and `behaviors.includes("notification")` logic
- Remove all conditional rendering blocks for action/notification fields

---

## Section 5 — Custom Fields Engine

### Current State
- Custom fields defined per-section (e.g. "Completion %", "Zone")
- Fields rendered in Add Note modal
- Field values stored per note

### Planned Changes
- **Remove entirely** — custom field definitions, renderer, and stored values
- The `cf-pct` (Completion %) field is the exact thing feedback flagged

---

## Summary of All Removals

| What | Where | Why |
|---|---|---|
| Note type selector UI | Add Entry modal | Replaced by simple category dropdown |
| Action Required fields (assignee, priority, due date) | Add Entry modal | Task management, not diary |
| Notification recipient fields | Add Entry modal | Comms function, not diary |
| Custom field builder | Manage Sections modal | Overkill for diary notes |
| Custom field value inputs | Add Entry modal | Overkill for diary notes |
| `ot` note types array + behavior logic | JS code | No longer needed |
| `Date` column | Table view | Context already implied |
| `Time` column | Table view | Not needed in list |

---

## Summary of All Additions

| What | Where |
|---|---|
| Category dropdown (General, Safety, Instruction, Issue, Delivery, Weather) | Add Entry modal |
| Location / Area text input | Add Entry modal |
| Trade / Subcontractor dropdown | Add Entry modal |
| Photo upload (multi) | Add Entry modal |
| Category pill display | Table row |
| Location + Trade display | Table row |
| Photo thumbnail count | Table row |
| "Diary" tab label | Tab header |
| "Add Entry" button label | Section header + empty state |
| Date/Time in detail/expand view only | Entry detail view |

---

## Implementation Order

1. **Rename terminology** — "Notes" → "Diary", "Add Note" → "Add Entry" across all labels
2. **Strip note types** — remove `ot` array, behavior checks, and related UI blocks
3. **Strip custom fields** — remove field builder from Manage, remove field values from Add modal
4. **Rebuild Add Entry modal** — new layout with Category, Location, Trade, Photo
5. **Rebuild table columns** — widen Entry column, remove Date/Time, add Category/Location/Trade pills
6. **Update Manage Sections** — simplified to section name/icon editor only
7. **Polish** — empty states, responsive behaviour, pill styles
