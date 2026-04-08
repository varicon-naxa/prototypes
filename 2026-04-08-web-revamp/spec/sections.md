# Site Diary Sections — Reference

Each section lives in `pages/sec-XXX.html` and is controlled by `js/XXX.js`.
All sections share the same accordion pattern (`.sec > .sec-head + .sec-body`).

---

## Section order in site-diary.html
1. Weather
2. Labour
3. Plant & Equipment
4. Notes
5. Photos
6. Timecard
7. Materials
8. Delivery Dockets
9. Miscellaneous
10. Forms

---

## 1. Weather (`sec-weather.html` / `weather.js`)
| Item | Value |
|---|---|
| Section div ID | `#sec-weather` |
| Body div | `#body-weather` |
| Status span | `#ss-weather` |
| Key functions | `confirmWeather()`, `saveWeather()`, `togWxDelay()` |
| Tile value | `#tv-wx` |

Features: Hourly snapshot cards (horizontal scroll), Observed Weather form (sky/rain/temp/wind), Weather Delay checkbox expands duration fields.

---

## 2. Labour (`sec-labour.html` / `labour.js`)
| Item | Value |
|---|---|
| Section div ID | `#sec-labour` |
| Table | `#labour-table` / `#labour-tbody` |
| Status span | `#ss-labour` (via stats.js) |
| Stats | `#labour-stat-count`, `#labour-stat-time` |
| Key functions | `renderLabourTable()`, `addLabourInlineRow()`, `rolloverLabour()`, `labourSwitchTab()` |
| Tile value | `#tv-labour` |

Features: Group by Supplier / Group by Resource tabs, inline row add, Rollover button, Resource dropdown (`#labour-resource-dropdown`).

---

## 3. Plant & Equipment (`sec-plant.html` / `plant.js`)
| Item | Value |
|---|---|
| Section div ID | `#sec-plant` |
| Operating table | `#plant-table` / `#plant-tbody` |
| Stand down table | `#sd-table` / `#sd-tbody` |
| Stats | `#pe-stat-equip`, `#pe-stat-op`, `#pe-stat-sd`, `#pe-stat-hrs` |
| Key functions | `renderPlant()`, `switchPlantTab()`, `savePlantData()` |
| Modals used | `mo-add-equipment`, `mo-task`, `mo-log-standdown` |
| Tile value | `#tv-plant` |

Features: Operating / Stand Down tab toggle, Add Equipment modal (split panel), Tasks/Cost Centres modal, Copy from previous button (opens `equipment-rollover-web.html`), attachment dropdown (`#plant-att-dropdown`).

---

## 4. Notes (`sec-notes.html` / `notes.js`)
| Item | Value |
|---|---|
| Section div ID | `#sec-notes` |
| Container | `#notes-sections-container` |
| Empty state | `#notes-empty-state` |
| Status span | `#ss-notes` |
| Key functions | `filterNotes()`, `copyFromPrevious()`, `openAuditPanel()`, `openManageNoteSections()` |
| Tile value | `#tv-notes` |

Features: Multiple note sections (topics), search, Copy from Previous button, Manage Note Sections page (`manage-notes.html`), Add/Edit note section dialog.

---

## 5. Photos (`sec-photos.html` / `photos.js`)
| Item | Value |
|---|---|
| Section div ID | `#sec-photos` |
| Grid | `#photo-grid` |
| Empty state | `#photos-empty` |
| Status span | `#ss-photos` |
| Key functions | `filterPhotos()`, `handlePhotoFiles()`, `uploadPhotos()`, `navLightbox()` |
| Modals used | `mo-upload-photos`, `mo-lightbox` |
| Tile value | `#tv-photos` |

Features: Drag-and-drop upload, bulk tags/description, photo lightbox with prev/next navigation, replace/delete photo.

---

## 6. Timecard (`sec-timecard.html` / `timecard.js`)
| Item | Value |
|---|---|
| Section div ID | `#sec-timecard` |
| Table | `#tc-table` / `#tc-thead` / `#tc-tbody` |
| Stats | `#tc-stat-emp`, `#tc-stat-appr`, `#tc-stat-approved`, `#tc-stat-unappr`, `#tc-stat-clocked`, `#tc-stat-total` |
| Copy panel | `#tc-copy-panel` (toggle with `#tc-copy-btn`) |
| Key functions | `renderTimecard()`, `tcToggleCopyPanel()`, `tcLoadCopyData()`, `tcExecuteCopy()`, `tcOpenAddEmployees()` |
| Tile value | `#tv-tc-hrs` |

Features: Column visibility toggle, Status multi-select filter, inline copy-from-previous panel (read-only preview with amber checkboxes), Add Employees modal (split panel `#tc-emp-modal`).

**Copy panel controls:**
- `#tc-copy-from` / `#tc-copy-to` — date inputs
- `#tc-copy-proj-label` — read-only project label
- `#tc-copy-all-chk` — select all checkbox
- `#tc-copy-summary` — employee/selected counts
- `#tc-copy-confirm-btn` — COPY TIMESHEET button (enabled when selection > 0)

---

## 7. Materials (`sec-materials.html` / `materials.js`)
| Item | Value |
|---|---|
| Section div ID | `#sec-materials` |
| Table | `.vt` / `#mat-tbody` |
| Stats | `#mat-stat-count`, `#mat-stat-unassigned` |
| Warning | `#mat-warning-banner` |
| Key functions | `renderMat()`, `openAddMaterial()`, `openMatTaskModal()`, `confirmAddMaterials()` |
| Modals used | `mo-add-material` (bulk select split panel) |
| Tile value | `#tv-mat` |

Columns: Material | Source | Company/Supplier | Total Qty | Unassigned Qty

---

## 8. Delivery Dockets (`sec-delivery.html` / `delivery.js`)
| Item | Value |
|---|---|
| Section div ID | `#sec-delivery` |
| Rows container | `#del-rows` |
| Status span | `#ss-del` |
| Key functions | `addDelRow()` |
| Tile value | `#tv-del` |

Simple row-based entry. Each row: supplier, docket#, material, quantity.

---

## 9. Miscellaneous (`sec-misc.html` / `misc.js`)
| Item | Value |
|---|---|
| Section div ID | `#sec-misc` |
| Table | `.vt` / `#misc-tbody` |
| Stats | `#misc-stat-count`, `#misc-stat-unassigned` |
| Warning | `#misc-warning-banner` |
| Key functions | `renderMisc()`, `openAddMisc()`, `confirmAddMiscItems()` |
| Modals used | `mo-add-misc` (bulk select split panel) |
| Tile value | `#tv-misc` |

Columns: Name | Task | Cost Centre | Quantity | Duration | Total Hours | Attachments

---

## 10. Forms (`sec-forms.html` / `forms.js`)
| Item | Value |
|---|---|
| Section div ID | `#sec-forms` |
| Table | `#sd-forms-table` / `#sd-forms-tbody` |
| Status span | `#ss-forms` |
| Key functions | `swSdFormTab()`, `filterSdForms()`, `filterSdFormCategory()`, `openFormResponseModal()` |
| Tile value | `#tv-forms-t` |

Sub-tabs: Assigned Forms / Form Submissions / Form Templates.

---

## Tile Strip

All tiles are in `#sd-tile-strip` (horizontal scrollable).

```html
<div class="sd-tile [act]" onclick="sdTileClick(this,'sec-XXX')" id="tile-XXX">
  <div class="sd-tile-top"><span class="sd-tile-icon">EMOJI</span><span class="sd-tile-lbl">LABEL</span></div>
  <div class="sd-tile-val" id="tv-XXX">0 Items</div>
</div>
```

Active tile: add class `act` (dark navy bg). `sdTileClick()` in `site-diary.js` handles scroll + activation.

---

## Accordion pattern

```html
<div class="sec" id="sec-XXX">
  <div class="sec-head [open]" onclick="togSec(this)">
    <div class="sec-icon" style="background:var(--amber-l);">SVG</div>
    <div style="flex:1;"><div class="sec-ttl" style="color:var(--amber);">Title</div></div>
    <!-- action buttons -->
    <span class="sstat [empty|partial|full]">0 items</span>
    <svg class="chev [open]" ...>chevron</svg>
  </div>
  <div class="sec-body [dn]" id="body-XXX">
    <!-- content -->
  </div>
</div>
```

`togSec()` in `core.js` toggles `.open` on `.sec-head` and `.dn` on `.sec-body`.
