# Site Diary — Quick Entry: Design Specification

**Companion to:** `sitediary-quick-entry-ux.md`  
**Design System:** MUI v5 · Colors from `src/assets/colors/colors.ts` · Fonts: Barlow Semi Condensed (headers) + Roboto (body)

---

## Design Tokens (from codebase)

```
Primary Navy    #143666      Secondary Orange  #F19100
Dark Navy       #0C2043      Orange Hover      #E5A137
Light Navy      #596F96      Orange Accent     #FFF4E3   ← section bg
Border Navy     #899BB3      Orange Transparent #FDBC6033

Text Primary    rgba(0,5,10,0.87)
Text Secondary  #5F6D83
Text Titles     #233759

Grey Border     #EEEEEE / #E0E0E0
Grey Surface    #F3F6FB     ← card/input bg
Grey Hover Row  #EBF0F5

Status Green    #0F8A0F  bg #DBEFDC
Status Red      #d2281b  bg #FBE9E8
Status Orange   #FF9800  bg #FFF5E5
Status Blue     #0075E0  bg #E5F1FC

Approve Chip    #8DC641  bg #8DC64133
Review Chip     #FBAD33  bg #FDBC6033
```

---

## 1. Floating Trigger Button

The entry point to the Quick Entry panel. Always visible while viewing any site diary date.

```
┌──────────────────────────────────────────────────────────────────┐
│                                                           ↓ page  │
│                                                                   │
│                                              ┌─────────────────┐ │
│                                              │ ✏  Quick Entry  │ │
│                                              └─────────────────┘ │
│                                                  (bottom-right)  │
└──────────────────────────────────────────────────────────────────┘
```

**Spec:**

```typescript
// Floating Action Button — extended variant
position: 'fixed'
bottom: 24
right: 24
zIndex: 1200

backgroundColor: secondary.main          // #F19100
color: '#FFFFFF'
borderRadius: '8px'
padding: '10px 20px'
boxShadow: '0px 4px 12px rgba(241, 145, 0, 0.4)'
gap: '8px'                               // space between icon + label

// Icon: EditNoteOutlined (MUI)
// Label: "Quick Entry"
fontFamily: 'Roboto'
fontSize: '14px'
fontWeight: 500

// Hover
backgroundColor: secondary.dark          // #C17400
boxShadow: '0px 6px 16px rgba(241, 145, 0, 0.5)'

// Keyboard shortcut badge (top-right corner of button)
// "⌘K" or "Ctrl+K"
fontSize: '10px'
backgroundColor: 'rgba(0,0,0,0.2)'
borderRadius: '4px'
padding: '1px 4px'
```

---

## 2. Quick Entry Panel (Drawer)

Right-side drawer — not full-screen, not modal-blocking. User can still see the diary behind it.

```
┌──────────────────────── Diary View ─────────┬──── Quick Entry ────┐
│                                              │                     │
│  [existing diary content visible/dimmed]     │  ┌───────────────┐ │
│                                              │  │ Quick Entry   │ │
│                                              │  │ Mon 7 Apr 26  │ │
│                                              │  ├───────────────┤ │
│                                              │  │  WEATHER      │ │
│                                              │  │  LABOUR       │ │
│                                              │  │  EQUIPMENT    │ │
│                                              │  │  MATERIALS    │ │
│                                              │  │  NOTES        │ │
│                                              │  ├───────────────┤ │
│                                              │  │  [Save & Done]│ │
│                                              │  └───────────────┘ │
└──────────────────────────────────────────────┴─────────────────────┘
```

**Drawer Spec:**

```typescript
// MUI Drawer — anchor="right", variant="persistent"
width: '480px'                           // desktop
width: '100vw'                           // mobile (< 600px breakpoint)

// Panel background
backgroundColor: '#FFFFFF'
borderLeft: '1px solid #EEEEEE'
boxShadow: '-4px 0px 16px rgba(0, 0, 0, 0.08)'

// Overlay on diary view (not full black — user still sees content)
backdropColor: 'rgba(0, 0, 0, 0.15)'
```

---

## 3. Panel Header

```
┌─────────────────────────────────────────────────────┐
│  ✏ Quick Entry          Mon, 7 Apr 2026      [×]   │
│  ──────────────────────────────────────────────────  │
│  [⟳ Roll over all from yesterday]                   │
└─────────────────────────────────────────────────────┘
```

**Spec:**

```typescript
// Header bar
height: '56px'
backgroundColor: '#143666'              // primary.main — Navy
padding: '0 16px'
display: 'flex', alignItems: 'center', justifyContent: 'space-between'
position: 'sticky', top: 0, zIndex: 10

// "Quick Entry" label
fontFamily: 'Barlow Semi Condensed'
fontSize: '18px'
fontWeight: 600
color: '#FFFFFF'

// Date sub-label (right of title or below)
fontSize: '12px'
color: 'rgba(255,255,255,0.7)'

// Close [×] button
color: '#FFFFFF'
// IconButton with CloseIcon

// ─── separator line ───
borderBottom: '1px solid #EEEEEE'

// Roll over all button (below header bar)
height: '40px'
backgroundColor: '#FFF4E3'             // orange accent bg
borderBottom: '1px solid #FDDCAA'
padding: '0 16px'
display: 'flex', alignItems: 'center', gap: '8px'

// Button text
color: '#F19100'                        // secondary orange
fontSize: '13px'
fontWeight: 500
// Icon: RestoreOutlined
```

---

## 4. Section — Collapsed State

Sections with no data today are collapsed. Shows a summary count when data exists.

```
┌─────────────────────────────────────────────────────┐
│  👷 LABOUR          [2 entries · 16.0 hrs]    [▼]  │
└─────────────────────────────────────────────────────┘
```

**Spec:**

```typescript
// Section header row (Accordion summary)
height: '44px'
backgroundColor: '#FFF4E3'             // orange accent — matches existing section headers
padding: '0 12px 0 16px'
borderBottom: '1px solid #FDDCAA'
cursor: 'pointer'

// Section title
fontFamily: 'Barlow Semi Condensed'
fontSize: '14px'
fontWeight: 600
letterSpacing: '0.5px'
textTransform: 'uppercase'
color: '#F0840F'                        // matches existing bannerText

// Summary chip (when has data)
backgroundColor: '#EAEDF1'
borderRadius: '2px'
fontSize: '11px'
color: '#5F6D83'
padding: '2px 6px'

// Expand chevron icon
color: '#F0840F'
transition: 'transform 200ms'          // rotates 180° when open

// Hover state
backgroundColor: '#FDDCAA33'
```

---

## 5. Section — Expanded State

```
┌─────────────────────────────────────────────────────┐
│  👷 LABOUR          [2 entries · 16.0 hrs]    [▲]  │
├─────────────────────────────────────────────────────┤
│  [⟳ from yesterday]                                 │
│                                                     │
│  ┌────────────────┬──────┬──────┬─────────────┬──┐ │
│  │ Resource       │  Qty │  Hrs │  Task       │  │ │
│  ├────────────────┼──────┼──────┼─────────────┼──┤ │
│  │ John Smith     │  1   │ 8.0  │ Footing Wk  │ × │ │
│  │ ABC Labour Co  │  3   │ 8.0  │ Slab Pour   │ × │ │
│  ├────────────────┴──────┴──────┴─────────────┴──┤ │
│  │ + Add row                                      │ │
│  └────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

**Section body spec:**

```typescript
// Expanded content area
backgroundColor: '#FFFFFF'
padding: '12px 16px'
borderBottom: '1px solid #EEEEEE'

// "from yesterday" rollover link (top of section)
color: '#F19100'
fontSize: '12px'
fontWeight: 500
cursor: 'pointer'
display: 'flex', alignItems: 'center', gap: '4px'
marginBottom: '10px'
// Icon: RestorePage (small, 16px)
// Only shows if previous day has data in this section
```

---

## 6. Inline Row Tables

All sections (Labour, Equipment, Materials) use the same inline row pattern — no modals.

```
┌────────────────────┬───────┬───────┬───────────────────┬────┐
│ Resource           │  Qty  │  Hrs  │  Task             │    │
├────────────────────┼───────┼───────┼───────────────────┼────┤
│ [Search input    ] │ [ 1 ] │ [8.0] │ [Footing Work   ] │ ×  │
│ [Search input    ] │ [ 3 ] │ [8.0] │ [Slab Pour      ] │ ×  │
└────────────────────┴───────┴───────┴───────────────────┴────┘
```

**Table spec:**

```typescript
// Table container
border: '1px solid #EEEEEE'
borderRadius: '4px'
overflow: 'hidden'
width: '100%'

// Header row
backgroundColor: '#F3F6FB'             // grey-surface
height: '32px'

// Header cell
fontSize: '11px'
fontWeight: 600
color: '#5F6D83'
textTransform: 'uppercase'
letterSpacing: '0.5px'
padding: '0 8px'
borderBottom: '1px solid #EEEEEE'
borderRight: '1px solid #EEEEEE'

// Data row
height: '40px'
backgroundColor: '#FFFFFF'
borderBottom: '1px solid #EEEEEE'
'&:hover': {
  backgroundColor: '#EBF0F5',          // grey-hover-row
}

// Data cell
padding: '4px 8px'
borderRight: '1px solid #EEEEEE'
verticalAlign: 'middle'

// Input inside cell (no visible border until focused)
'& input': {
  border: 'none'
  backgroundColor: 'transparent'
  fontSize: '13px'
  color: 'rgba(0,5,10,0.87)'
  padding: '2px 4px'
  width: '100%'
  '&:focus': {
    outline: 'none'
    backgroundColor: '#FFFFF0'         // very subtle yellow focus
    borderRadius: '2px'
  }
}

// Delete icon (last column)
color: '#9e9e9e'                        // grey-500
'&:hover': { color: '#d2281b' }        // red on hover
padding: '4px'

// + Add row footer
height: '36px'
backgroundColor: '#FAFAFA'
borderTop: '1px solid #EEEEEE'
padding: '0 8px'
color: '#F19100'
fontSize: '13px'
fontWeight: 500
cursor: 'pointer'
display: 'flex', alignItems: 'center', gap: '4px'
'&:hover': { backgroundColor: '#FFF4E3' }
// Icon: AddIcon (16px)
```

---

## 7. Task Quick-Select Field

Replaces the tree modal with a flat searchable dropdown + recent-tasks chips.

```
┌───────────────────────────────────────────────────────┐
│ Task                                                  │
│ [ Footing Work ]  [ Slab Pour ]  [ Reo Bar ]  [+More] │
│                                                       │
│ ┌─────────────────────────────────────────────────┐  │
│ │ 🔍 Search tasks...                              │  │
│ ├─────────────────────────────────────────────────┤  │
│ │ ★ Footing Work                                  │  │
│ │ ★ Slab Pour — Concrete Work                     │  │
│ │   Earthworks > Excavation > Bulk Cut            │  │
│ │   Concrete Work > Columns > Pour                │  │
│ └─────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────┘
```

**Spec:**

```typescript
// Recent tasks chips row
display: 'flex'
gap: '4px'
flexWrap: 'wrap'
marginBottom: '4px'

// Individual chip
backgroundColor: '#EAEDF1'
borderRadius: '4px'
fontSize: '12px'
color: '#233759'
padding: '3px 8px'
cursor: 'pointer'
border: '1px solid transparent'
'&:hover': {
  backgroundColor: '#D3D7DD',
  border: '1px solid #899BB3',
}
'&.selected': {
  backgroundColor: '#143666',          // primary navy
  color: '#FFFFFF',
}

// "+More" chip
backgroundColor: 'transparent'
color: '#F19100'
border: '1px solid #F19100'
fontSize: '12px'

// Search dropdown (Popper/Menu)
backgroundColor: '#FFFFFF'
border: '1px solid #E0E0E0'
borderRadius: '4px'
boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.12)'
maxHeight: '240px'
overflow: 'auto'
zIndex: 1300

// Search input inside dropdown
backgroundColor: '#F3F6FB'
border: 'none'
borderBottom: '1px solid #EEEEEE'
padding: '8px 12px'
fontSize: '13px'

// List item — recent (starred)
color: '#143666'
fontSize: '13px'
padding: '8px 12px'
display: 'flex', gap: '8px'
// Star icon: GradeOutlined, color #F19100

// List item — path items
color: 'rgba(0,5,10,0.87)'
fontSize: '13px'

// Path breadcrumb text (dimmed)
color: '#5F6D83'
fontSize: '11px'
```

---

## 8. Weather Section (Quick Entry)

```
┌─────────────────────────────────────────────────────┐
│  🌤 WEATHER                                   [▲]  │
├─────────────────────────────────────────────────────┤
│  ┌──────────────┐ ┌──────────────┐ ┌────────────┐  │
│  │ Sky          │ │ Temperature  │ │ Rainfall   │  │
│  │ [Clear     ▼]│ │ [Mild      ▼]│ │ [None    ▼]│  │
│  └──────────────┘ └──────────────┘ └────────────┘  │
│                                                     │
│  ☐ Weather Delay                                    │
│                                                     │
│  [🌍 Auto-filled from visualcrossing · 14°C, Clear] │
└─────────────────────────────────────────────────────┘
```

**Spec:**

```typescript
// 3-column grid for dropdowns
display: 'grid'
gridTemplateColumns: 'repeat(3, 1fr)'
gap: '8px'
marginBottom: '12px'

// MUI Select — outlined, size="small"
'& .MuiOutlinedInput-root': {
  fontSize: '13px',
  borderRadius: '4px',
}
'& .MuiInputLabel-root': {
  fontSize: '12px',
}

// Auto-fetch info banner
backgroundColor: '#E5F1FC'             // status info bg
borderRadius: '4px'
padding: '6px 10px'
fontSize: '11px'
color: '#0075E0'
display: 'flex', alignItems: 'center', gap: '6px'
marginTop: '8px'
// Icon: CloudOutlined (14px)

// Weather Delay checkbox row
marginTop: '8px'
fontSize: '13px'
color: 'rgba(0,5,10,0.87)'
```

---

## 9. Notes Section (Quick Entry)

```
┌─────────────────────────────────────────────────────┐
│  📝 NOTES — [General Notes ▼]               [▲]   │
├─────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────┐   │
│  │                                             │   │
│  │  Type your notes here...                   │   │
│  │                                             │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

**Spec:**

```typescript
// Textarea
minHeight: '100px'
maxHeight: '200px'
width: '100%'
resize: 'vertical'
border: '1px solid #E0E0E0'
borderRadius: '4px'
padding: '10px 12px'
fontFamily: '"Roboto", sans-serif'
fontSize: '13px'
backgroundColor: '#F3F6FB'
'&:focus': {
  outline: 'none'
  border: '1px solid #F19100'          // orange focus ring
  backgroundColor: '#FFFFFF'
}

// Section selector (small dropdown for selecting which notes section)
marginBottom: '10px'
fontSize: '12px'
```

---

## 10. Panel Footer (Save Actions)

```
┌─────────────────────────────────────────────────────┐
│                           [Save Draft]  [Save & Done]│
└─────────────────────────────────────────────────────┘
```

**Spec:**

```typescript
// Footer container
position: 'sticky'
bottom: 0
height: '60px'
backgroundColor: '#FFFFFF'
borderTop: '1px solid #EEEEEE'
padding: '0 16px'
display: 'flex'
justifyContent: 'flex-end'
alignItems: 'center'
gap: '8px'
zIndex: 10
boxShadow: '0px -2px 8px rgba(0, 0, 0, 0.06)'

// "Save Draft" button — outlined
variant: 'outlined'
color: 'secondary'                     // orange outline
fontSize: '13px'
padding: '6px 16px'
textTransform: 'none'
borderRadius: '4px'

// "Save & Done" button — contained
variant: 'contained'
backgroundColor: '#F19100'
color: '#FFFFFF'
fontSize: '13px'
padding: '6px 20px'
textTransform: 'none'
borderRadius: '4px'
fontWeight: 500
'&:hover': { backgroundColor: '#C17400' }

// Saving state — spinner replaces icon inside "Save & Done"
// Show "Saving…" text while API call in flight (optimistic)
```

---

## 11. Unified Submit Dialog

Replaces 4 existing modals. Single dialog that shows completeness summary + signature.

```
┌──────────────────────────────────────────────────────────┐
│  Submit Site Diary · Mon 7 Apr 2026                 [×]  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Summary                                                 │
│  ✅  Weather logged                                      │
│  ✅  Labour: 12 entries · 96.0 hrs                       │
│  ⚠   2 labour entries have no task assigned             │
│      These will be excluded from cost tracking           │
│  ✅  Equipment: 4 operating, 1 stand down                │
│  ✅  Materials: 3 items                                  │
│  ✅  Notes added                                         │
│  ─  Photos: none                                         │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Signature                                               │
│  ┌────────────────────────────────────────────────────┐ │
│  │                                                    │ │
│  │   [Draw your signature here]                       │ │
│  │                                                    │ │
│  └────────────────────────────────────────────────────┘ │
│  [Clear signature]                                       │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                             [Cancel]  [Submit Diary →]   │
└──────────────────────────────────────────────────────────┘
```

**Spec:**

```typescript
// Dialog
maxWidth: '520px'
width: '100%'
borderRadius: '8px'

// Summary list item — success
color: '#0F8A0F'
// Icon: CheckCircleOutline (16px)
fontSize: '13px'
padding: '6px 0'
borderBottom: '1px solid #EEEEEE'

// Summary list item — warning (inline, not blocking)
color: '#FF9800'
// Icon: WarningAmberOutlined (16px)
// Sub-text (grey, 12px, indented)
color: '#5F6D83'
marginTop: '2px'
marginLeft: '24px'

// Summary list item — neutral/empty
color: '#5F6D83'
// Dash "─" instead of icon

// Signature canvas
border: '1px dashed #C4C4C4'
borderRadius: '4px'
backgroundColor: '#FAFAFA'
height: '120px'
cursor: 'crosshair'

// "Clear signature" link
color: '#F19100'
fontSize: '12px'
textDecoration: 'underline'
marginTop: '4px'

// Submit button (disabled until signature drawn)
backgroundColor: '#143666'            // navy — final action = primary color
color: '#FFFFFF'
'&:disabled': {
  backgroundColor: '#EEEEEE'
  color: '#9e9e9e'
}
```

---

## 12. Inline Warning Banner (per section, replaces modal warnings)

Shown during entry phase if something needs attention — not at submission time.

```
┌────────────────────────────────────────────────────────────┐
│ ⚠  2 entries have no task assigned   [Assign Tasks]       │
└────────────────────────────────────────────────────────────┘
```

**Spec:**

```typescript
// Banner container
backgroundColor: '#FFF5E5'             // warning bg
border: '1px solid #FFD180'
borderRadius: '4px'
padding: '8px 12px'
display: 'flex'
alignItems: 'center'
justifyContent: 'space-between'
marginBottom: '8px'

// Warning text
color: '#FF9800'
fontSize: '12px'
fontWeight: 500
display: 'flex', gap: '6px', alignItems: 'center'
// Icon: WarningAmberOutlined (16px)

// Action button (link-style)
color: '#F19100'
fontSize: '12px'
textDecoration: 'underline'
cursor: 'pointer'
```

---

## 13. States & Interactions

### Empty Section
```
┌─────────────────────────────────────────────────────┐
│  👷 LABOUR                                    [▼]  │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  No labour entries yet.  + Add first row    │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

```typescript
// Empty state inside section
height: '60px'
display: 'flex', alignItems: 'center', justifyContent: 'center'
backgroundColor: '#FAFAFA'
border: '1px dashed #D3D7DD'
borderRadius: '4px'
color: '#5F6D83'
fontSize: '13px'
// "+" link color: #F19100
```

### Saving State
- Optimistic: row appears immediately on `+ Add row`
- Subtle spinner in row's rightmost cell while saving
- On error: row background turns `#FBE9E8` (red surface), shows retry icon

### Keyboard Navigation Order
```
Panel open → [Tab] Weather Sky → [Tab] Temp → [Tab] Rainfall → [Tab] Weather Delay
→ [Tab] Labour: Resource[0] → [Tab] Qty[0] → [Tab] Hrs[0] → [Tab] Task[0]
→ [Tab] Labour: Resource[1] (or Enter on last field adds new row)
→ [Tab] Materials → [Tab] Notes → [Tab] Save Draft → [Tab] Save & Done
```

---

## 14. Responsive Behaviour

| Breakpoint | Panel Width | Trigger | Behaviour |
|---|---|---|---|
| Desktop `≥ 1200px` | `480px` | FAB bottom-right | Pushes diary content left (persistent drawer) |
| Tablet `960–1199px` | `420px` | FAB bottom-right | Overlays diary (temporary drawer) |
| Mobile `< 600px` | `100vw` | FAB bottom-right | Full-screen bottom sheet |

---

## 15. Animation & Motion

```typescript
// Panel open/close
transition: theme.transitions.create('width', {
  easing: theme.transitions.easing.sharp,
  duration: theme.transitions.duration.enteringScreen,  // 225ms
})

// Section expand/collapse
transition: 'all 200ms ease-in-out'

// Row add (new row slides in from top of table body)
animation: 'fadeSlideIn 150ms ease-out'
// @keyframes fadeSlideIn: opacity 0→1, translateY -8px→0

// Saving state (row pulse)
// opacity 1 → 0.6 → 1 while request in-flight
```

---

## 16. Style File to Create

```
src/pages/ProjectBudget/SiteDiary/components/QuickEntryPanel/
├── style.ts           ← panel shell, header, footer
├── sections/
│   ├── WeatherSection/style.ts
│   ├── LabourSection/style.ts      ← shared row table styles
│   ├── MaterialSection/style.ts
│   └── NotesSection/style.ts
```

All `SxProps<Theme>` objects — import colors via:
```typescript
import { primary, secondary, grey, normalText } from 'assets/colors'
```

Never hardcode hex values — reference the tokens above using the `assets/colors` names.

---

## Summary Checklist for Design Review

- [ ] FAB matches existing secondary (orange) button style
- [ ] Panel header uses primary navy — consistent with tab selected state (`#233759`)
- [ ] Section headers use `#FFF4E3` + `#F0840F` — identical to existing Labour/Task/Material banners
- [ ] Inline table headers use `#F3F6FB` — matches existing card/input surface
- [ ] Focus ring on inputs: orange (`#F19100`) — matches existing Quill editor active color
- [ ] Submit dialog signature canvas: dashed border — matches existing attachment input pattern
- [ ] Warning banners: `#FFF5E5` + `#FF9800` — matches existing `warnBox` style
- [ ] All spacing in multiples of 4px
- [ ] Font sizes: 20px section titles (Barlow), 14px body, 12px labels, 11px chips (Roboto)
