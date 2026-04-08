# UI Patterns — Varicon SiteDiary

Quick reference for building consistent UI. Brand colors and tokens are in CLAUDE.md.

---

## Buttons

```html
<!-- Primary CTA (amber) -->
<button class="btn btn-a">SAVE</button>
<button class="btn btn-a btn-sm">ADD</button>
<button class="btn btn-a btn-xl">SIGN AND SUBMIT</button>

<!-- Secondary (outline) -->
<button class="btn btn-o">Cancel</button>
<button class="btn btn-o btn-sm">Export</button>

<!-- Icon button (square, 36px) -->
<button class="ibtn">⋮</button>
<button class="ibtn"><svg ...></svg></button>

<!-- Ghost / text link style -->
<button class="btn btn-ghost btn-sm">+ Add custom worker</button>

<!-- Destructive (red text, transparent bg) -->
<button style="color:var(--red);">Delete</button>
```

---

## Inputs & Selects

```html
<input class="vi" placeholder="Search...">           <!-- standard input -->
<input class="vi vi-sm" placeholder="Search...">     <!-- compact input -->
<input class="vi vi-time" value="07:00">             <!-- time input -->
<select class="vs">...</select>                      <!-- standard select -->
<select class="vs-sm">...</select>                   <!-- compact select -->
<textarea class="vi" rows="3"></textarea>            <!-- textarea -->
```

Focus ring: `border-color: var(--amber); box-shadow: 0 0 0 3px rgba(245,166,35,0.15)`

---

## Status Badges

```html
<span class="bdg bdg-g">Active</span>        <!-- green: #D1FAE5 / #065F46 -->
<span class="bdg bdg-a">Pre-Start</span>     <!-- amber: #FEF3DC / #92400E -->
<span class="bdg bdg-b">Beta</span>          <!-- blue: #DBEAFE / #1D4ED8 -->
<span class="bdg bdg-r">Safety</span>        <!-- red: #FEE2E2 / #991B1B -->
<span class="bdg bdg-gray">General</span>    <!-- gray: #F3F4F6 / #6B7280 -->
```

Sstat (section header status):
```html
<span class="sstat empty">0 items</span>    <!-- gray pill -->
<span class="sstat partial">3 items</span>  <!-- amber pill -->
<span class="sstat full">Done</span>        <!-- green pill -->
```

---

## Data Tables

```html
<div style="overflow-x:auto;border:1px solid var(--border);border-radius:6px;">
  <table class="vt">
    <thead>
      <tr>
        <th style="width:28px;"><input type="checkbox"></th>
        <th>Column</th>
      </tr>
    </thead>
    <tbody id="my-tbody">
      <!-- rows rendered by JS -->
    </tbody>
  </table>
</div>
```

- Header bg: `var(--thead)` = `#EAECEF`
- Row height: min 48px
- Font-size: 13px (headers 600, body 400)
- No alternating rows — hover only (`var(--hover)` = `#F9FAFB`)

---

## Cards

```html
<div class="card">...</div>                 <!-- white bg, subtle shadow, radius 6px -->
<div class="card" style="padding:16px;">...</div>
```

---

## Modals

All modals: `<div id="mo-XXX" class="mo" style="display:none;" onclick="if(event.target===this)closeMo()"><div class="mb">...`

```html
<div id="mo-my-modal" class="mo" style="display:none;" onclick="if(event.target===this)closeMo()">
  <div class="mb" style="width:500px;">
    <!-- Header -->
    <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid var(--border);">
      <h3 style="font-size:15px;font-weight:700;color:var(--tp);">Modal Title</h3>
      <button onclick="closeMo()" class="ibtn" style="padding:4px;">✕</button>
    </div>
    <!-- Body -->
    <div style="padding:18px;">...</div>
    <!-- Footer -->
    <div style="display:flex;justify-content:flex-end;gap:8px;padding:12px 18px;border-top:1px solid var(--border);">
      <button class="btn btn-o" onclick="closeMo()">CANCEL</button>
      <button class="btn btn-a" onclick="confirmAction()">CONFIRM</button>
    </div>
  </div>
</div>
```

Open: `openMo('my-modal')` — adds suffix after `mo-`

**Split-panel modal** (Add Equipment / Task selector pattern):
- Left panel `flex:1` — catalogue/list with search
- Right panel `width:300-340px` — selected items
- Footer pinned: CANCEL + ADD (amber)

---

## Slide Panels

```html
<div id="my-overlay" class="ploy" onclick="closeMyPanel()"></div>
<div id="my-panel" class="slp">
  <!-- Header, scrollable body, pinned footer -->
</div>
```

Open by setting `display:flex` on overlay + `transform:translateX(0)` on panel (handled by CSS class toggles in JS).

---

## Section Header Icon

```html
<div style="width:34px;height:34px;border-radius:7px;background:var(--amber-l);
            display:flex;align-items:center;justify-content:center;flex-shrink:0;">
  <svg width="17" height="17" ... stroke="var(--amber)">...</svg>
</div>
```

Do NOT use `#F5F3FF` (blue/lavender) — always use `var(--amber-l)` = `#FEF3DC` for icon backgrounds.

---

## Section Title (h2 equivalent)

```html
<!-- Use div, NOT h2 — avoids browser default h2 styling -->
<div style="font-size:18px;font-weight:600;color:var(--amber);white-space:nowrap;
            letter-spacing:-.01em;">Section Name</div>
```

---

## Amber Checkbox (copy panel / quick fill)

```html
<!-- Unchecked -->
<div onclick="toggle()" style="width:18px;height:18px;border-radius:3px;
  border:2px solid #CBD5E1;background:#fff;display:inline-flex;
  align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;"></div>

<!-- Checked -->
<div onclick="toggle()" style="width:18px;height:18px;border-radius:3px;
  border:2px solid var(--amber);background:var(--amber);display:inline-flex;
  align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;">
  <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="white" stroke-width="2.2">
    <path d="M2 6l3 3 5-5"/>
  </svg>
</div>
```

---

## Toggle Switch (amber)

```html
<label class="tgl"><input type="checkbox" [checked]><span class="tgl-s"></span></label>
```

---

## Dropdown (`.vdd`)

```html
<div style="position:relative;">
  <button onclick="toggleDd('dd-my')">Label ▾</button>
  <div id="dd-my" class="vdd" style="display:none;right:0;top:36px;">
    <div class="vdd-lbl">Section header</div>
    <div class="vdd-i" onclick="...">Item</div>
    <div class="vdd-sep"></div>
    <div class="vdd-i" style="color:var(--red);">Danger item</div>
  </div>
</div>
```

---

## Progress Bar

```html
<div class="prog-track" style="flex:1;">
  <div id="prog-fill" class="prog-fill" style="width:65%;"></div>
</div>
<span id="prog-pct" style="font-size:11px;font-weight:600;color:var(--amber);">65%</span>
```

---

## Stat Pills (section header)

```html
<div style="display:inline-flex;align-items:center;gap:4px;background:var(--hover);
            border:1px solid var(--border);border-radius:5px;padding:4px 10px;">
  <span style="font-size:11px;color:var(--tm);font-weight:500;">Label</span>
  <strong id="stat-id" style="font-size:13px;font-weight:700;color:var(--tp);">0</strong>
</div>
```

Use `font-family:'JetBrains Mono',monospace` for time/duration values.

---

## Tile Strip (Site Diary)

```html
<div class="sd-tile [act]" onclick="sdTileClick(this,'sec-XXX')" id="tile-XXX">
  <div class="sd-tile-top">
    <span class="sd-tile-icon">🚜</span>
    <span class="sd-tile-lbl">PLANT &amp; EQUIPMENT</span>
  </div>
  <div class="sd-tile-val" id="tv-XXX">0 Items</div>
</div>
```

Active (`.act`): dark navy bg `#1C2D4A`, white text, amber underline.

---

## Quick Fill / Copy Panel row pattern

```html
<tr>
  <td style="text-align:center;padding:10px;">
    <!-- amber checkbox here -->
  </td>
  <td style="font-weight:500;">Name</td>
  <td style="font-size:12px;color:var(--tm);">Read-only value</td>
  <!-- more read-only cells -->
</tr>
```

All cells in copy panels are **read-only** (no inputs, no edits).

---

## Empty State (table)

```html
<tr>
  <td colspan="N" style="text-align:center;padding:36px 20px;">
    <svg ...opacity:0.15...><!-- icon --></svg>
    <div style="color:var(--tm);font-size:13px;margin-bottom:3px;">No entries for this date.</div>
    <div style="color:var(--td);font-size:11px;margin-bottom:14px;">Subtitle text.</div>
    <button class="btn btn-a btn-sm" onclick="...">ADD ITEM</button>
  </td>
</tr>
```

---

## Warning Banner

```html
<div style="display:flex;align-items:flex-start;gap:10px;background:#FFFBEB;
            border:1px solid #FDE68A;border-radius:6px;padding:10px 14px;margin-bottom:12px;">
  <svg ... stroke="#D97706"><!-- warning triangle --></svg>
  <span style="font-size:12px;color:#92400E;line-height:1.5;">Warning message here.</span>
</div>
```

---

## FAB (Floating Action Button)

```html
<button id="fab-qe" onclick="openQE()" title="Quick Entry">
  <svg ...><!-- lightning bolt --></svg>
  <span id="fab-pct">0%</span>
</button>
```

Styled in `css/styles.css`. Position: fixed bottom-right of `#sd-scroll`.

---

## CSS Variable Quick Reference

```css
var(--amber)      #F5A623   /* primary accent */
var(--amber-l)    #FEF3DC   /* amber light bg */
var(--amber-dark) #D4891A   /* amber hover */
var(--tp)         #1A2332   /* text primary */
var(--tb)         #374151   /* text body */
var(--tm)         #6B7280   /* text muted */
var(--td)         #9CA3AF   /* text disabled */
var(--border)     #E5E7EB   /* default border */
var(--border-d)   #D1D5DB   /* stronger border */
var(--thead)      #EAECEF   /* table header bg */
var(--hover)      #F9FAFB   /* row hover bg */
var(--bg)         #F4F5F7   /* page background */
var(--green)      #10B981   /* success */
var(--red)        #EF4444   /* danger */
var(--blue)       #3B82F6   /* info */
```
