# JavaScript API Reference

## core.js — App shell & utilities

```js
goPage(name)              // navigate to page. name = 'site-diary'|'projects'|'file-manager'|
                          //   'forms'|'assigned-forms'|'form-submissions'|'form-templates'|
                          //   'form-detail'|'form-response'|'manage-notes'
showToast(msg, type?)     // type = 'success'|'info'|'error' (default success)
openMo(name)              // open modal by name. name = 'upload-photos'|'lightbox'|'calendar'|
                          //   'report'|'add-material'|'add-misc'|'task'|'add-equipment'|
                          //   'log-standdown'|'export'|'form-fill'|'help'
closeMo()                 // close current modal
toggleDd(id)              // toggle dropdown by element ID
closeDd()                 // close all dropdowns
togSec(headerEl)          // toggle section accordion
toggleSidebar()           // expand/collapse sidebar
swStab(el)                // switch sub-tabs (stab pattern)
```

---

## site-diary.js

```js
setSdView(mode)           // mode = 'tab' | 'single'
sdTileClick(el, secId)    // activate tile + scroll to section
changeDate(delta)         // delta = -1 (yesterday) or 1 (tomorrow)
checkAndSubmit()          // validates before sign & submit
applyYesterday()          // copies yesterday's selected sections
openManageNoteSections()  // navigates to manage-notes page
```

---

## stats.js

```js
updStats()                // recompute all tile counts + progress bar
```

Updates: `#tv-plant`, `#tv-labour`, `#tv-tc-hrs`, `#tv-mat`, `#tv-misc`, `#tv-del`, `#tv-notes`, `#tv-photos`, `#prog-fill`, `#prog-pct`, `#fab-pct`

---

## plant.js (Plant & Equipment)

```js
renderPlant()             // re-render both operating and standdown tables
switchPlantTab(tab)       // tab = 'operating' | 'standdown'
savePlantData()           // save inline edits
openMo('add-equipment')   // open Add Equipment modal
renderAddEquipModal()     // populate equipment list in modal
selectAllEquip()          // select all in Add Equipment modal
clearEquipSelect()        // clear selection in modal
confirmAddEquipment()     // confirm + add selected equipment to plantData
renderLogStandDownModal() // populate log standdown modal
confirmLogStandDown()     // confirm standdown
```

**Data structure: `plantData[]`**
```js
{ id, name, hireType, supplier, task, taskCode, start, end, brk, status, attachments:[] }
```

---

## labour.js

```js
renderLabourTable()       // render labour table (both header variants)
labourSwitchTab(tab)      // tab = 'supplier' | 'resource'
addLabourInlineRow()      // add blank inline row
rolloverLabour()          // copy yesterday's labour rows
```

**Data structure: `labourData[]`**
```js
{ id, supplier, resource, task, costCentre, qty, hours, approver, attachments }
```

---

## timecard.js

```js
renderTimecard()          // render timecard table
tcToggleCopyPanel()       // show/hide copy-from-previous panel
tcLoadCopyData()          // load timecard data for copy-from date
tcRenderCopyTable()       // render the copy panel rows
tcCopyToggleRow(ci)       // toggle row selection in copy panel
tcCopyToggleAll()         // select/deselect all in copy panel
tcExecuteCopy()           // apply copy to current date
tcOpenAddEmployees()      // open Add Employees modal
tcOpenTaskSelector()      // open task/cost centre selector
tcCancelEdit()            // discard inline edits
tcSave()                  // save timecard
```

**Data structure: `tcData[]`**
```js
{ id, name, dept, start, end, brk, total, status, approver, remarks }
```

**Copy state:** `tcCopyPanelOpen`, `tcCopyRows[]`, `tcCopySel[]` (indices of selected rows)

---

## materials.js

```js
renderMat()               // render materials table (respects search filter)
openAddMaterial()         // open Add Material modal
openMatTaskModal()        // open task selector for materials
renderAddMatModal()       // populate material catalogue in modal
selectAllMat()            // select all materials in modal
clearMatSelect()          // clear selection
confirmAddMaterials()     // add selected materials to matData
```

**Data structure: `matData[]`**
```js
{ id, name, source, supplier, totalQty, unassignedQty }
```

---

## misc.js

```js
renderMisc()              // render misc table (respects search filter)
openAddMisc()             // open Add Misc modal
renderAddMiscModal()      // populate misc catalogue in modal
selectAllMisc()           // select all
clearMiscSelect()         // clear selection
confirmAddMiscItems()     // add selected items to miscData
```

**Data structure: `miscData[]`**
```js
{ id, name, task, costCentre, qty, duration, totalHours, attachments }
```

---

## delivery.js

```js
addDelRow()               // add a new delivery docket row
```

---

## notes.js

```js
filterNotes(query)        // filter notes by text
openManageNoteSections()  // navigate to manage-notes page
openAddNoteSectionDialog()// open note section dialog
closeNoteSectionDialog()  // close dialog
saveNoteSection()         // save new/edited note section
quickAddFromModal(name)   // quick-add a preset note section
```

**Data structure: `noteSections[]`**
```js
{ id, name, desc, notes:[] }
```

---

## photos.js

```js
handlePhotoFiles(files)   // process File objects (from input or drop)
uploadPhotos()            // confirm upload to photoList
filterPhotos(query)       // filter by tag/description
navLightbox(delta)        // navigate lightbox -1/+1
deleteLbPhoto()           // delete current lightbox photo
saveLbDetails()           // save description/tags from lightbox
replaceLbPhoto()          // replace current photo
handlePhotoTagKey(evt)    // handle Enter key in tag input
handleLbTagKey(evt)       // handle Enter key in lightbox tag input
```

---

## weather.js

```js
confirmWeather()          // mark weather as confirmed
saveWeather()             // save observed weather form
togWxDelay()              // toggle weather delay fields
```

---

## tasks.js

```js
toggleTaskSel(chk, code, name, parent)  // toggle a task selection
applyTasks()                            // apply selections to context (plant/labour/etc)
clearTaskSel()                          // clear all selected tasks
```

**State:** `appliedTasks[]`, `selectedTasks[]`, `taskModalContext` ('plant'|'labour'|'mat'|'misc')

---

## calendar.js

```js
renderCal()               // render calendar grid for current month
calNav(delta)             // navigate months
calToday()                // jump to today
```

---

## quickentry.js

```js
openQE()                  // open Quick Entry panel
closeQE()                 // close Quick Entry panel
qeSaveAll()               // save all QE entries + close
qeNoteKeydown(evt)        // Ctrl+Enter saves note
qeAddMatCustom()          // add custom material from QE
qeAddDel()                // add delivery from QE
qeSkipDel()               // skip deliveries
qeAddMiscPreset(text)     // add preset misc item
qeSkipMisc()              // skip misc
checkMorningMode()        // auto-open QE if diary empty before noon
```

---

## quickfill.js (`pages/quick-fill.html`)

```js
qfToggleSec(i)            // toggle accordion section i (0-4)
qfToggleRow(sec, i)       // toggle row selection
qfSecToggleAll(sec)       // select/deselect all in section
qfUpdateGlobal()          // update total selected count
qfClearAll()              // clear all selections
qfRenderPlant()           // render P&E table
qfRenderLabour()          // render Labour table
qfRenderNotes()           // render Notes table
qfRenderMaterials()       // render Materials table
qfRenderMisc()            // render Miscellaneous table
```

Sections: 0=Plant&Equipment, 1=Labour, 2=Notes, 3=Materials, 4=Miscellaneous

---

## projects.js

```js
renderProjects()          // render projects table with pagination
searchProjects(query)     // filter project list
projPageNav(delta)        // paginate
```

---

## forms.js

```js
filterFormsTable(query)         // search forms table
filterFormsByCategory(cat)      // filter by category
openFormResponseModal(formId)   // open form fill modal for formId (F1–F7)
closeFormFill()                 // close form fill modal
submitFormFill()                // submit form response
switchAfTab(tab, el)            // switch assigned-forms inner tab
filterAfTable(query)            // search assigned forms
swSdFormTab(tab, el)            // switch form sub-tabs in site diary
filterSdForms(query)            // search forms in SD section
filterSdFormCategory(cat)       // filter category in SD section
swFdTab(tab, el)                // switch form-detail tabs
toggleStar(svg)                 // toggle star on form row
toggleFormsMenu()               // toggle forms submenu in sidebar
```

---

## loader.js

```js
includeHTML()             // resolve all [data-include] from DOM templates
// Boot: DOMContentLoaded → includeHTML() x2 → init all modules
```

Template ID rule: `pages/sec-weather.html` → `tpl-sec-weather`
