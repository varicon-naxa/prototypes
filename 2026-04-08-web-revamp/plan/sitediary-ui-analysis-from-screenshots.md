# Site Diary — UI Analysis from Production Screenshots

**Source:** `brand_assets/Web SiteDiary/` (36 screenshots across 10 sections)
**Date:** 7 April 2026
**Purpose:** Document the actual production UI patterns, colors, components, and interactions to inform the Quick Entry panel design and ensure design fidelity.

---

## 1. Global Shell & Layout

### Sidebar (Left)
- **Width:** ~220px expanded
- **Background:** Dark navy `#1A2332` (confirmed across all screenshots)
- **Logo:** Varicon stylized V/checkmark in orange, top-left
- **Nav items:** White text, ~13px, with icons left-aligned
- **Active item:** Orange left border accent + lighter navy background
- **Sections visible:** Product Civil (project label), Projects, Dashboard, Gallery, Timecard, Leave (with "New" green badge), Scheduler (with "New" green badge), Daywork Docket, Purchase Order, Delivery Docket, Bills, Forms (expandable), Asset Management (expandable), Resource Assigner, Suppliers, File Manager, User Management (expandable), Payroll Settings (expandable), Settings (expandable)
- **Badge pills:** Green "New" badges on Leave and Scheduler items

### Top Header Bar
- **Background:** White `#FFFFFF`
- **Border:** 1px solid bottom border (light gray)
- **Left:** Back arrow `<` + Project name in bold (e.g., "(20292) BIS Project") + dropdown chevron
- **Right:** "Initial Data Upload" button (outline style) + orange "Search" button with icon + "+" icon button + User avatar + name (e.g., "Anu Praz")

### Secondary Tab Navigation
- **Background:** White
- **Tabs:** Dashboard, Forecast, Daily Cost Tracking, Claim, Subcontract (with "Beta" blue badge), Variation Register, Report, File Manager, Site Diary, Daywork Docket, Production Tracking
- **Active tab:** Orange bottom border 2px, darker text weight
- **Inactive:** Muted gray text
- **Scroll arrows:** `<` `>` visible when tabs overflow (seen in several screenshots)

### Section Tile Row (Horizontal Cards)
- **Layout:** Horizontal scrollable row, ~128px tall cards
- **Default tile:** White background, icon in orange/amber, label uppercase, count value below
- **Active tile:** Dark navy/blue background (`#143666` to `#1C2D4A`), white text, orange count badge
- **Tiles observed:** PHOTOS, NOTES, TIMECARD, PLANT AND EQUIPMENT, LABOUR, MATERIALS, DELIVERY DOCKETS, MISCELLANEOUS, TASKS, WEATHER
- **Tile data displayed:** Section-specific counts (e.g., "NO. OF PHOTOS: 5", "LABOUR: 1", "ON FIELD: 2")
- **Scroll arrow:** `>` visible on right edge when tiles overflow

---

## 2. Section: Labour

### 2.1 Empty State
- Centered icon (clipboard/person outline, light gray)
- Text: "No Labours data has been added for this date. Please start by clicking on Add button below"
- CTA: "ADD" button (outlined, centered)

### 2.2 Section Header
- **Title:** "Labour" in orange `#F19100` (Barlow Semi Condensed, ~18px, weight 600)
- **Summary stats:** "Labour: 0" and "Worktime: 0H 0M" displayed as inline metrics
- **View toggle tabs:** "GROUP BY SUPPLIER" (orange/active) | "GROUP BY RESOURCE" (gray/inactive)

### 2.3 Table — Group By Supplier View
- **Header row background:** Navy `#143666` — NOT gray
- **Header text:** White, uppercase, ~11px, weight 600
- **Columns:** S.N | Supplier Name | Resources | Task | Subtask | Sub-Subtask | Cost Centre | Quantity
- **Edit icon:** Orange pencil icon in top-right of table header
- **Row pattern:** Expandable supplier group (e.g., "11") with child resource rows indented
- **Summary row per group:** "Labour: 1, Avg. hours per worker 1.00 hrs | Total work hours: 2.00 hrs"
- **Inline add row:** X (cancel) + dropdowns for Supplier, Resource, Task, Subtask, Sub-Subtask, Cost Centre + Quantity input + checkmark (confirm)

### 2.4 Resource Dropdown
- **Style:** Standard dropdown with search
- **Header:** "PROJECT RESOURCES" label
- **List items:** Format "(ID) Name" with subtype text below (e.g., "Excavator", "Bucket Attachment")
- **Info icon:** Small (i) circle next to each item
- **Footer link:** "+ Add New Resource" in orange
- **Badge labels:** "Dry Hire", "Wet Hire/Dry Hire" shown as text labels per item

### 2.5 Table — Group By Resource View
- **Header row:** Navy background with white text (same as supplier view)
- **Columns:** S.N | Resources | Supplier Name | Task | SubTask | Sub-SubTask | Cost Centre | Quantity
- **Expandable rows:** Resource name as group header with summary stats

### 2.6 Success State
- **Toast notification:** Green banner at top — "Success: Labour Added Successfully" with X dismiss

---

## 3. Section: Materials

### 3.1 Layout
- **Title:** "Materials" in orange
- **Stats:** "No. of Material Used: 0" (or count)
- **Action buttons:** "+ ADD MATERIAL" | "+ ADD TASKS/COST CENTRES" (outlined buttons)
- **Edit Mode toggle:** Switch component with "Edit Mode" label (orange when active)

### 3.2 Task Matrix View (Right Panel)
- **Critical pattern:** Tasks appear as column headers across the top of the table
- **Format:** "(1) Site Preliminaries" | "Unassigned Subtask — Demo..." | "(101) Demolition"
- **This is a matrix/grid layout** — not a simple inline table
- **Each material row has quantity cells under each task column**

### 3.3 Table
- **Header row:** Light gray `#F3F6FB` background (different from Labour's navy headers)
- **Columns (base):** Material | Source | Company/Supplier | Total Qty | Unassigned Qty
- **Columns (with tasks):** Additional task columns appended to the right
- **Checkbox column:** First column has checkboxes for row selection
- **Inline edit row:** X (cancel) + Material dropdown + Source + Supplier dropdown + Qty inputs per task column

### 3.4 Warning Banner
- **Position:** Top of page, full-width
- **Background:** Light blue info banner
- **Text:** "Some entries haven't been assigned to any task or cost centre in materials. Please review it under unassigned tab in daily cost tracking."
- **Style:** Info icon + text, subtle border

### 3.5 Save Actions
- **Position:** Bottom-right, floating
- **Buttons:** "CANCEL" (outlined) | "SAVE" (orange contained)

---

## 4. Section: Notes

### 4.1 Section Header
- **Title:** "Notes" in orange
- **Actions:** Search input | "Rollover" button | "AUDIT LOGS" link with checkmark icon | "MANAGE NOTE SECTIONS" button (orange contained)
- **File upload:** "No file chosen" file input visible

### 4.2 Multi-Section Architecture
- Notes are organized into **named sections** (e.g., "Safety Measure", "Instruction")
- Each section is a collapsible group with its own notes stream
- Sections are managed via "Manage Note Section" drawer/dialog

### 4.3 Manage Note Section Dialog
- **Full-screen overlay** (not a small modal)
- **Header:** "Manage Note Section" with X close
- **Description text:** "Notes can be managed under different topics (eg. Visitor's Log, Safety Updates, General Updates), here known as Note Section."
- **Section list:** Each section shows title + description + visibility toggle (eye icon) + kebab menu (...)
- **Drag handles:** Dotted grid icon for reordering sections
- **Footer:** "+ Add Note Section" button (outlined)

### 4.4 Add Note Section Dialog
- **Nested dialog** on top of Manage Note Section
- **Fields:** Section Name (text input) + Description (textarea with orange focus border)
- **Buttons:** "Cancel" (text) | "Add Note" (orange contained)

### 4.5 Notes Entry (Rich Text Editor)
- **Per-section input:** Each section has its own input area
- **Placeholder:** "Click Here To Add Note And Attachments"
- **Rich text toolbar:** B (bold) | I (italic) | U (underline) | alignment options (left, center, right, justify)
- **Text area:** Full-width, white background, standard font
- **Attachment:** Paperclip icon below editor
- **Actions:** "SAVE" (green contained) | "CANCEL" (outlined)

### 4.6 Note Record Display
- **Avatar:** Initials circle (gray background, e.g., "AP")
- **Metadata:** "AP | 07/04/26, 6:06 PM (Australia/West)"
- **Content:** Note text displayed below
- **Attachments section:** "ATTACHMENTS" label with thumbnail previews
- **Actions:** "EDIT" | "DELETE" links in orange

---

## 5. Section: Photos

### 5.1 Empty State
- Centered clipboard icon (light gray)
- Text: "There are no photos for this date. Please start by adding one."
- **Search bar:** "Search Photos By Tags Or Descriptio..." with magnifying glass
- **CTA:** "+ ADD PHOTO" button (orange contained)

### 5.2 Photo Grid
- **Layout:** Grid of photo thumbnails (~4 columns)
- **Thumbnail size:** ~200px wide, maintain aspect ratio
- **Border:** Subtle border around each thumbnail

### 5.3 Upload Photos Dialog
- **Title:** "Upload Photos" with X close
- **Upload area:** Grid of selected photo thumbnails + "+" add more button
- **Toggle:** "Apply Details to Individual Photos" switch
- **Fields:** "Bulk Description" textarea | "Bulk Tags" — "Add Tags Pressing Enter" input
- **Buttons:** "CANCEL" (outlined) | "UPLOAD" (orange contained)

### 5.4 Photo Detail Panel (Right Slide-In)
- **Title:** "Photo Details" with X close
- **Fields:** Description (textarea) | Tags (pill chips with X remove, orange border on input) | Uploaded By | Uploaded On | Location
- **Actions:** "Replace Photo" button | "DELETE" (red text) | "CANCEL" | "SAVE" (blue contained)
- **Also visible:** Mobile app preview showing Site Diary mobile interface

---

## 6. Section: Plant and Equipment

### 6.1 Section Header
- **Title:** "Plant and Equipment" in orange
- **Stats row:** Equipment: 0 | Operating: 0 | Stand Down: 0 | Total Work Hours: 0h 00m
- **Rollover button:** "Rollover" in top-right area
- **Search:** Search input with magnifying glass

### 6.2 Tab Navigation
- **Tabs:** "OPERATING" (orange/active with underline) | "STAND DOWN" (gray)

### 6.3 Action Buttons
- "+ Add Equipments" | "+ Add Tasks/Cost Centres" | "+ Log Stand Down" (all outlined)
- "COLUMNS" button with grid icon (for column visibility toggle)
- "Edit Mode" toggle switch

### 6.4 Operating Table
- **Header row:** Navy `#143666` background, white text (same pattern as Labour)
- **Column group header:** "Equipment Description" spanning multiple sub-columns
- **Sub-columns:** Equipment | Hire Type (i) | Source / Operated By | Company/Supplier | Equipment Attachments | Equipment Duration | Unassigned Duration
- **Task matrix columns:** When tasks added — e.g., "(1.1) Site establishment..." | "(1.2) Management Plans —..." | "(1.3) Underground Service..."
- **Row pattern:** X (delete) + Equipment dropdown + duration inputs + task duration inputs per column
- **Clock icons:** Time picker icons (circle with clock) in duration cells

### 6.5 Add Equipment Dialog (Split-Panel Modal)
- **Title:** "Add Equipment" with X close
- **Left panel (~50%):** "List of Equipment" with search input
  - **Groups:** "PROJECT EQUIPMENT" with "Select All" link
  - **Items:** Checkbox + orange icon + Equipment name (bold) + Type/ID below + "Dry Hire" / "Wet Hire/Dry Hire" label
- **Right panel (~50%):** "Selected Equipment" with count (e.g., "2 SELECTED") + "Clear all" link
  - **Selected items:** Equipment name + type + ID + radio buttons (Dry Hire / Wet Hire) + X remove
- **Footer:** "CANCEL" (outlined) | "ADD" (orange contained)

### 6.6 Log Stand Down Dialog (Right Slide-In Panel)
- **Title:** "Log Stand Down" with X close
- **Sections:**
  - **PROJECT EQUIPMENT:** "(X Selected)" with "Select All" + list of equipment with checkboxes + hire type labels
  - **OTHER EQUIPMENT:** "(0 Selected)" with "Select All"
  - **Reason for Stand down:** "Reason" dropdown (required asterisk)
  - **Notify Admins:** Checkbox + "Notes for" + user dropdown
- **Footer:** "Cancel" | "Save and email suppliers" | "Save" (orange contained)

### 6.7 Stand Down Tab/List
- **Table header:** Light gray background
- **Columns:** Equipment | Hire type | Company/Supplier | Stand down reason | Specific reason | Created By | Actions
- **Actions column:** Edit (pencil, blue) | Delete (trash, red) icons
- **Row data:** Shows equipment details, hire type badges, and stand down reasons (e.g., "Inclement Weather")

---

## 7. Section: Tasks

### 7.1 Section Header
- **Title:** "Task Performed Today" in orange
- **Info text:** "Unique task added here will automatically populated to Matrix View of other sections (e.g Material, Timecard, Plant and Equipment) and vice versa."
- **Dismissible:** X button on info banner
- **Stats:** "Total Task Performed: 2"

### 7.2 View Toggle
- **Tabs:** "GROUP BY TASKS" (orange/active) | "GROUP BY COST CENTRE" (gray)

### 7.3 Table
- **Header row:** Light gray background
- **Columns:** S.N. | Task | SubTask | Sub-SubTask | Cost Centre | Attachments
- **Edit icon:** Orange pencil in header
- **Expandable rows:**
  - Level 1: "(1) Site Preliminaries" — expandable with `>` chevron
  - Level 1.1: "(1) Site Preliminaries" (task detail) | "Unassigned Subtask - Demolitio..." | — | "(101) Demolition"
  - Level 2: "(2) Demolition" — expandable
  - Level 2.1: "(2) Demolition" | "Unassigned Subtask - Demolitio..." | — | "(101) Demolition"
- **Inline add row:** X + Task dropdown + Subtask + Sub-Subtask + Cost Centre dropdown + attachment icons + checkmark

---

## 8. Section: Timecard

### 8.1 Section Header
- **Title:** "Time Card" in orange
- **Stats row:** Icon metrics — Employees count | 0h 0m (Approved Time) | Total Timesheet | Clock in | Approved | Transit Locked | Unapproved

### 8.2 Action Buttons
- "+ EMPLOYEES" | "+ ADD TASK/COST CENTRE" (outlined)
- "COLUMNS" button with dropdown (column visibility: "Status", "Statu..." truncated)
- "Edit Mode" toggle switch

### 8.3 Table
- **Header row:** Orange/amber background `#F19100` (different from Labour/Equipment!)
- **Header text:** White, bold
- **Columns:** Employee | Start | End | Break | Total | Status | Approver | Remarks
- **Row data:**
  - Employee cell: X (delete) + avatar circle + Name (bold) + Role + ID (e.g., "James Kula, Admin, ID: 3333")
  - Time inputs: "hh:mm aa" format with clock picker icons
  - Break: Numeric input (e.g., "45")
  - Total: Calculated (e.g., "7h 55m")
  - Status: "Waiting for app..." (truncated)
  - Approver: Icon button
  - Remarks: Icon button
- **Footer:** "CANCEL" | "SAVE" (orange)
- **Note:** "There i..." text truncated on right edge

### 8.4 Add Employees Dialog (Split-Panel Modal)
- **Title:** "Add Employees" + subtitle "(20292) BIS Project"
- **Left panel:** "List of Employees" with search
  - **Groups:** "PROJECT EMPLOYEE" with "Select All" | "UNASSIGNED EMPLOYEES" with "Select All"
  - **Items:** Checkbox + avatar circle + Name (bold) + Role + ID
- **Right panel:** "Selected Employees" with count (e.g., "0 SELECTED")
- **Footer:** "CANCEL" | "ADD" (orange contained)

### 8.5 Select Task / Cost Centre Dialog (Tree Modal)
- **Title:** "Select Task" + date + project name
- **Description:** "Please select the task or cost centres."
- **Left panel:** "List of Tasks" with search
  - **Tab toggle:** "TASKS" (blue/active underline) | "COST CENTRE"
  - **Tree items:** Expandable with `>` chevron + checkbox
    - "(1) Site Preliminaries"
    - "(2) Demolition"
    - "(3) Earthworks"
    - "(4) Court Pavement"
    - "(5) Concrete Works"
    - "(6) Stormwater Drainage"
    - "(7) Miscellaneous Items"
    - "(8) Provisional"
    - "(V15) Additional Subgrade works as per council spec..."
  - **Deep nesting:** Items can be expanded to show sub-tasks
- **Right panel:** "Selected Tasks" with count + "CLEAR ALL" link
- **Footer:** "CANCEL" | "ADD" (orange contained)

### 8.6 Task/Cost Centre Matrix View
- **When tasks are added:** Additional columns appear to the right
- **Column headers:** Task names truncated (e.g., "environment, mobilization,..." | "(1.2) Manag..." | "(1) Site Prelimin...")
- **Sub-headers:** "supervision" | "Default Resource..."
- **Pattern:** Same matrix pattern as Materials and Equipment

---

## 9. Section: Weather

### 9.1 Section Header
- **Title:** "Weather Log" in orange

### 9.2 Daily Snapshot (Auto-Fetched)
- **Source label:** "Extracted from visualcrossing.com" (link in orange)
- **Location:** Pin icon + address (e.g., "32 Reservoir Street, Surry Hills...")
- **Card row:** Horizontal scrollable cards (4-6 visible)
- **Each card contains:**
  - Time label (e.g., "3:00 AM", "8:30 AM", "10:00 AM", "1:00 PM")
  - Temperature (e.g., "28°C", "14.8°C", "14°C")
  - Weather icon (colored circle — orange for warm/cloudy, red for hot, gray for cool)
  - Humidity: percentage with droplet icon
  - Wind: speed with direction icon
  - Rain: percentage with rain icon
  - Condition text (e.g., "Overcast", "Clear", "Partially cloudy")
- **Card size:** ~200px wide, light border, white background

### 9.3 Observed Weather Form
- **Label:** "OBSERVED WEATHER"
- **Layout:** 2-column grid of dropdowns
  - Row 1: Sky dropdown | Rainfall dropdown | Notes text input
  - Row 2: Temperature dropdown | Wind dropdown | ATTACHMENTS (paperclip icon)
- **Checkbox:** "Weather Delay" at bottom
- **Dropdown style:** Standard select with border, small size

### 9.4 Location Warning
- **Style:** Inline text warning (not banner)
- **Text:** "Location hasn't been setup for this project. Please setup the location from 'Edit Project' page to collect weather from internet."
- **Link:** "Edit Project" in orange

---

## 10. Section: Miscellaneous

### 10.1 Table
- **Header row:** Light gray background
- **Columns:** Company Name | Task | Subtask | Sub-Subtask | Cost Centre | Quantity | Duration | Total Hours | Attachments
- **Edit icon:** Orange pencil in header
- **Inline edit:** Active row with orange focus border on duration input
- **Pattern:** Same inline edit pattern as Labour

---

## 11. Design Token Audit — Screenshots vs Plan

| Token | Plan Spec (`quick-entry-plan.md`) | Actual (Screenshots) | Match? |
|---|---|---|---|
| Sidebar bg | `#1A2332` | `#1A2332` (confirmed) | Yes |
| Primary orange | `#F19100` | `#F19100` (buttons, links, active states) | Yes |
| Table header bg (Labour/Equipment) | `#F3F6FB` (gray surface) | `#143666` (navy) | **NO** |
| Table header bg (Materials/Tasks/Misc) | `#F3F6FB` (gray surface) | `#F3F6FB` or similar light gray | Yes |
| Table header bg (Timecard) | `#F3F6FB` (gray surface) | `#F19100` (orange!) | **NO** |
| Section title color | `#F0840F` (bannerText) | `#F19100` range (orange) | Close |
| Success toast | Green `#0F8A0F` bg | Green banner, top of page | Yes |
| Warning banner bg | `#FFF5E5` | Blue info style for Materials, not orange | **Partial** |
| Primary CTA (Save/Submit) | `#F19100` orange | `#F19100` orange confirmed | Yes |
| Text primary | `rgba(0,5,10,0.87)` | Dark navy/black (consistent) | Yes |
| Edit pencil icon | Orange | Orange confirmed | Yes |
| Dialog split-panel width | ~50/50 | ~50/50 confirmed (Add Equipment, Add Employees, Select Task) | Yes |
| Dialog button pattern | CANCEL (outline) + ADD (orange) | Confirmed across all dialogs | Yes |

### Key Discrepancies

1. **Table headers are NOT uniform.** Labour and Equipment use **navy headers** with white text. Materials, Tasks, and Miscellaneous use **light gray headers**. Timecard uses **orange headers**. The plan assumes a single `#F3F6FB` gray — this needs updating.

2. **Warning banners** in Materials use a **blue/info style**, not the orange/warning style assumed in the plan.

3. **The task matrix pattern** (tasks as column headers) is used in Materials, Equipment Operating, and Timecard. The plan's Quick Entry simplifies this to a single Task dropdown column — acceptable for quick entry but the matrix view in main sections must be preserved.

---

## 12. Interaction Patterns Observed

### Split-Panel Selection Modals
Used in: Add Equipment, Add Employees, Select Task/Cost Centre
- **Consistent pattern:** Left = searchable list with groups, Right = selected items with count
- **Always has:** Search input, Select All per group, count badge, Clear All, CANCEL + ADD footer

### Edit Mode Toggle
Used in: Materials, Equipment Operating, Timecard
- **Pattern:** Switch toggle + "Edit Mode" label
- **When on:** Rows become editable with dropdowns and X delete buttons
- **When off:** View-only table rows

### Inline Row Editing
Used in: Labour, Materials, Miscellaneous, Tasks
- **Pattern:** X (cancel) on left + editable fields + checkmark (confirm) on right
- **New row appears at bottom** of existing data

### Rollover Button
Currently only visible in: Plant and Equipment section header ("Rollover" button)
- Not yet available in Labour, Materials, or other sections (confirms plan's Phase 1 goal)

### Success Toast
- **Position:** Top of page, centered
- **Style:** Green background, white text, X dismiss
- **Pattern:** "Success: [Action] Successfully"

---

## 13. Mobile / Responsive Observations

From Photo Detail screenshot, a mobile app preview is visible showing:
- **Mobile Site Diary header:** "Site Diary" with navigation icons
- **Project info:** "Varicon Q2 2024 Job Name" with date
- **Calendar widget:** Inline week calendar with day selection
- **Section cards:** Notes, Plant and Equipment, Photos as expandable cards
- **CTA:** "Sign and submit" orange button (full-width)
- **This confirms tablet/mobile is a real usage context** for the Quick Entry panel

---

## 14. Recommendations for Quick Entry Panel Design Updates

Based on this analysis, the following adjustments should be made to the Quick Entry plan:

1. **Table header color should be navy `#143666`** for Labour and Equipment sections within Quick Entry (matching existing patterns), not gray.

2. **Notes section in Quick Entry** should support section selection (dropdown to pick which note section to write in), not just a flat textarea. The rich text toolbar (B/I/U/alignment) should be preserved even in simplified form.

3. **Task matrix awareness:** When a user adds a task in Quick Entry, the main diary view's matrix columns should auto-update. The Quick Entry panel itself uses a simplified single-task-per-row model, which is correct for speed.

4. **Weather section** should show the auto-fetched Daily Snapshot summary (temperature + condition from visualcrossing) as a read-only info banner, with the 3 dropdowns below for manual override.

5. **Rollover button placement** should follow the existing Equipment section pattern — positioned in the section header area, right-aligned.

6. **Split-panel selection modals** (for Equipment and Employees) should be preserved as-is and not simplified, since they handle complex selection with hire type and grouping. Only the Task selection modal should be flattened to a searchable dropdown.

7. **Edit Mode toggle** pattern should be respected — Quick Entry panel is inherently in edit mode, so no toggle needed, but this should be documented to avoid confusion.

---

## 15. File References

| Screenshot | Key Observations |
|---|---|
| `Labour/01` | Empty state, navy table headers, section tile row |
| `Labour/02` | Resource dropdown with search, project resources list |
| `Labour/03` | Success toast, group-by-supplier view, inline add row |
| `Labour/04` | Group-by-resource alternate view |
| `Materials/01` | Task matrix columns, edit mode toggle, empty state |
| `Materials/02` | Inline material entry with task matrix, CANCEL/SAVE |
| `Materials/03` | Warning banner (blue info), saved material row |
| `Notes/01-07` | Full notes lifecycle: empty → manage sections → add section → rich text editor → saved note with attachments |
| `Photos/01-05` | Grid view, upload dialog, photo detail panel, mobile preview |
| `Plant and Equipment/01-05` | Operating/Stand Down tabs, add equipment split-panel, task matrix, log stand down panel |
| `Tasks/01-02` | Hierarchical task tree, expandable rows, inline add |
| `Timecard/01-05` | Employee rows, time pickers, add employees dialog, select task tree modal, task matrix |
| `Weather/01-04` | Empty observed form, location warning, daily snapshot cards, full day view |
| `Miscellaneous/01` | Simple inline table, same pattern as Labour |
