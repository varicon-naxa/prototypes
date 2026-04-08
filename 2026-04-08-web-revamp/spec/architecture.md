# Architecture — Varicon SiteDiary Prototype

## What this is
A **single-page HTML prototype** of the Varicon / SiteDiary construction management platform.
No framework, no build step. Pure HTML + vanilla JS + Tailwind CDN.

---

## Entry point
| File | Role |
|---|---|
| `index.html` | Shell: sidebar, top headers, page slots, all 22 inline templates, script tags |
| `css/styles.css` | All custom CSS (vars, layout, components) |
| `js/loader.js` | Loads HTML partials into the DOM (see below) |
| `serve.mjs` | Dev server (`node serve.mjs` → http://localhost:3000) |
| `screenshot.mjs` | Puppeteer screenshot helper |

---

## Folder map
```
index.html              ← shell + 22 inlined <script type="text/html"> templates
css/styles.css          ← all styles
js/
  loader.js             ← partial loader (Option C: template lookup, no fetch)
  core.js               ← goPage(), showToast(), toggleDd(), closeDd(), openMo(), closeMo()
  projects.js           ← projects list / pagination
  stats.js              ← updStats(), progress bar, tile counts
  plant.js              ← P&E section (renderPlant, addEquip, standdown)
  labour.js             ← Labour section (renderLabourTable, addLabourInlineRow)
  timecard.js           ← Timecard section (renderTimecard, copy-from-previous panel)
  materials.js          ← Materials section (renderMat)
  misc.js               ← Miscellaneous section (renderMisc)
  delivery.js           ← Delivery Dockets section (addDelRow)
  notes.js              ← Notes section (filterNotes, manage note sections)
  photos.js             ← Photos section (upload, lightbox)
  weather.js            ← Weather section (confirmWeather, saveWeather)
  forms.js              ← Forms pages (filterFormsTable, openFormResponseModal)
  tasks.js              ← Task/Cost Centre modal (toggleTaskSel, applyTasks)
  calendar.js           ← Calendar modal (calNav, calToday)
  quickentry.js         ← Quick Entry slide panel (openQE, closeQE, qeSaveAll)
  quickfill.js          ← Quick Fill page logic (qfToggleSec, qfRenderPlant, etc.)
  site-diary.js         ← setSdView(), sdTileClick(), changeDate(), checkAndSubmit()

pages/
  projects.html         ← Projects list page
  site-diary.html       ← Site Diary page (has data-include for 10 sections)
  file-manager.html     ← File Manager
  forms.html            ← Forms list
  assigned-forms.html   ← Forms > Assigned
  form-submissions.html ← Forms > Submissions
  form-templates.html   ← Forms > Templates
  form-detail.html      ← Form detail view
  form-response.html    ← Add response page
  manage-notes.html     ← Manage Note Sections page
  quick-fill.html       ← Standalone Quick Fill page (opens in new window)
  sec-weather.html      ← Weather section partial
  sec-plant.html        ← Plant & Equipment section partial
  sec-labour.html       ← Labour section partial
  sec-notes.html        ← Notes section partial
  sec-photos.html       ← Photos section partial
  sec-timecard.html     ← Timecard section partial
  sec-materials.html    ← Materials section partial
  sec-delivery.html     ← Delivery Dockets section partial
  sec-misc.html         ← Miscellaneous section partial
  sec-forms.html        ← Forms section partial (inside site diary)
  equipment-rollover-web.html  ← Legacy standalone rollover page
  timecard-copy.html    ← Legacy standalone timecard copy (replaced by inline panel)

partials/
  modals.html           ← All modal dialogs
  panels.html           ← Slide panels (Quick Entry, Equip Panel, Audit Log)

brand_assets/           ← Reference screenshots for UI matching
plan/                   ← Design docs / UX plans
spec/                   ← THIS FOLDER — project specs for AI context
```

---

## How the loader works (Option C — server-free)

`loader.js` uses a **two-pass template lookup** instead of `fetch()`.

All 22 HTML partials are inlined in `index.html` as:
```html
<script type="text/html" id="tpl-XXXX">
  ...file content...
</script>
```

**ID derivation rule:**
`pages/sec-weather.html` → strip `pages/` or `partials/` → strip `.html` → prefix `tpl-` → **`tpl-sec-weather`**

**Boot sequence:**
1. DOMContentLoaded fires
2. Pass 1: resolve all `data-include` in `index.html` (page-level, 12 partials)
3. Pass 2: resolve all `data-include` in injected content (section-level inside site-diary, 10 sections)
4. Init: goPage(), renderProjects(), renderMat(), renderMisc(), renderPlant(), setSdView('tab')

**Opening without a server:**
Double-click `index.html` — works because loader reads from DOM, not filesystem.

---

## Navigation

```js
goPage('site-diary')    // shows #pg-sd, hides all others
goPage('projects')      // shows #pg-proj
goPage('file-manager')  // shows #pg-fm
goPage('forms')         // shows #pg-forms
goPage('assigned-forms')
goPage('form-submissions')
goPage('form-templates')
goPage('form-detail')
goPage('form-response')
goPage('manage-notes')
```

All pages are `<div id="pg-XXX" class="vp">`. Active page gets class `on`.

---

## Key global state

| Variable | Location | Purpose |
|---|---|---|
| `plantData[]` | plant.js | Current day's equipment entries |
| `labourData[]` | labour.js | Current day's labour entries |
| `tcData[]` | timecard.js | Timecard rows |
| `matData[]` | materials.js | Materials entries |
| `miscData[]` | misc.js | Miscellaneous entries |
| `delRows[]` | delivery.js | Delivery docket rows |
| `noteSections[]` | notes.js | Note section definitions |
| `photoList[]` | photos.js | Uploaded photos |
| `appliedTasks[]` | tasks.js | Currently selected tasks/cost centres |
| `equipmentCatalogue[]` | plant.js | Master equipment list |
