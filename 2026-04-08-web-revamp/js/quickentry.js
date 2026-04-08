/* ═══════════════════════════════════════════════════════════════
   Varicon SiteDiary — Quick Entry Panel
   Phase 2: Compact guided entry — complete diary in ≤5 min
   ═══════════════════════════════════════════════════════════════ */

let qeOpen = false;
let qeTimerInterval = null;
let qeStartTime = null;
let qeElapsedSec = 0;

/* ── Open / Close ─────────────────────────────────────────────── */
function openQE() {
  qeOpen = true;
  document.getElementById('qe-panel').classList.add('open');
  document.getElementById('qe-overlay').classList.add('open');
  if (!qeTimerInterval) {
    qeStartTime = Date.now() - qeElapsedSec * 1000;
    qeTimerInterval = setInterval(tickQETimer, 1000);
  }
  renderQEAll();
}

function closeQE() {
  qeOpen = false;
  document.getElementById('qe-panel').classList.remove('open');
  document.getElementById('qe-overlay').classList.remove('open');
  if (qeTimerInterval) { clearInterval(qeTimerInterval); qeTimerInterval = null; }
  if (qeStartTime) qeElapsedSec = Math.floor((Date.now() - qeStartTime) / 1000);
}

/* ── Timer ───────────────────────────────────────────────────── */
function tickQETimer() {
  const elapsed = Math.floor((Date.now() - qeStartTime) / 1000);
  const m = Math.floor(elapsed / 60);
  const s = elapsed % 60;
  const el = document.getElementById('qe-timer');
  if (el) {
    el.textContent = m + ':' + String(s).padStart(2, '0');
    el.style.color = m >= 5 ? 'var(--red)' : m >= 3 ? 'var(--amber)' : 'var(--green)';
  }
  updateQERing();
}

/* ── Progress ring ───────────────────────────────────────────── */
function calcQEPct() {
  const wxEl = document.getElementById('ss-weather');
  const wxDone = wxEl && wxEl.textContent.includes('Confirmed');
  let filled = 0;
  if (wxDone)           filled++;
  if (labourData.length) filled++;
  if (plantData.length)  filled++;
  if (notes.length)      filled++;
  if (matData.length)    filled++;
  if (delData.length)    filled++;
  return Math.round(filled / 6 * 100);
}

function updateQERing() {
  const pct = calcQEPct();
  const ring = document.getElementById('qe-ring-fill');
  if (ring) {
    const r = 22, circ = 2 * Math.PI * r;
    ring.style.strokeDashoffset = circ - (pct / 100) * circ;
    ring.style.stroke = pct < 30 ? 'var(--red)' : pct < 70 ? 'var(--amber)' : 'var(--green)';
  }
  const pctEl = document.getElementById('qe-ring-pct');
  if (pctEl) {
    pctEl.textContent = pct + '%';
    pctEl.style.color = pct < 30 ? 'var(--red)' : pct < 70 ? 'var(--amber)' : 'var(--green)';
  }
  // Also update FAB badge
  const fabPct = document.getElementById('fab-pct');
  if (fabPct) fabPct.textContent = pct + '%';
}

/* ── Render all sections ─────────────────────────────────────── */
function renderQEAll() {
  renderQEWeather();
  renderQELabour();
  renderQEPlant();
  renderQEMaterials();
  updateQERing();
}

/* ── Weather ─────────────────────────────────────────────────── */
function renderQEWeather() {
  const c = document.getElementById('qe-wx-status');
  if (!c) return;
  const wxEl = document.getElementById('ss-weather');
  const confirmed = wxEl && wxEl.textContent.includes('Confirmed');
  if (confirmed) {
    c.innerHTML = `<div class="qe-done-row">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--green)" stroke-width="2.2"><path d="M2 7l3.5 3.5L12 3"/></svg>
      Confirmed — 22°C ⛅ Partly Cloudy
    </div>`;
  } else {
    c.innerHTML = `<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
      <div style="flex:1;min-width:160px;">
        <div style="font-size:13px;color:var(--tb);">Auto-fetched · Melbourne</div>
        <div style="font-size:15px;font-weight:700;color:var(--tp);margin:2px 0;">22°C ⛅ Partly Cloudy</div>
        <div style="font-size:11px;color:var(--tm);">Humidity 65% · Wind 12 km/h · Rain 5%</div>
      </div>
      <button class="btn btn-a" style="height:36px;gap:5px;" onclick="confirmWeather();renderQEWeather();updateQERing();">
        <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="white" stroke-width="2.2"><path d="M2 7l3.5 3.5L12 3"/></svg>
        Confirm
      </button>
    </div>`;
  }
}

/* ── Labour ──────────────────────────────────────────────────── */
function renderQELabour() {
  const c = document.getElementById('qe-labour-chips');
  if (!c) return;
  c.innerHTML = prevDayLabour.map((l, i) => {
    const added = labourData.some(ld => ld.name === l.name);
    return `<div class="qe-chip${added ? ' qe-chip-done' : ''}" onclick="qeAddLabour(${i})">
      <div class="av" style="background:${l.color};width:24px;height:24px;font-size:9px;flex-shrink:0;">${l.init}</div>
      <div style="flex:1;min-width:0;">
        <div style="font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${l.name}</div>
        <div style="font-size:10px;color:var(--tm);">${l.role}</div>
      </div>
      ${added ? '<svg style="flex-shrink:0;" width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="var(--green)" stroke-width="2.2"><path d="M2 7l3.5 3.5L12 3"/></svg>' : '<svg style="flex-shrink:0;opacity:.3;" width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 2v10M2 7h10"/></svg>'}
    </div>`;
  }).join('');
  const cnt = document.getElementById('qe-labour-count');
  if (cnt) cnt.textContent = labourData.length ? labourData.length + ' worker' + (labourData.length !== 1 ? 's' : '') + ' added' : 'None added yet';
}

function qeAddLabour(idx) {
  const l = prevDayLabour[idx];
  if (!labourData.some(ld => ld.name === l.name)) {
    qLabour(document.createElement('div'), l.name, l.role, l.init, l.color);
  }
  renderQELabour();
  updateQERing();
}

/* ── Plant ───────────────────────────────────────────────────── */
function renderQEPlant() {
  const c = document.getElementById('qe-plant-chips');
  if (!c) return;
  c.innerHTML = prevDayPlant.map((p, i) => {
    const added = plantData.some(pd => pd.name === p.name);
    return `<div class="qe-chip${added ? ' qe-chip-done' : ''}" onclick="qeAddPlant(${i})">
      <span style="font-size:18px;flex-shrink:0;">🚜</span>
      <div style="flex:1;min-width:0;">
        <div style="font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${p.name}</div>
        <div style="font-size:10px;color:var(--tm);">${p.hire} · ${p.op}</div>
      </div>
      ${added ? '<svg style="flex-shrink:0;" width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="var(--green)" stroke-width="2.2"><path d="M2 7l3.5 3.5L12 3"/></svg>' : '<svg style="flex-shrink:0;opacity:.3;" width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 2v10M2 7h10"/></svg>'}
    </div>`;
  }).join('');
  const cnt = document.getElementById('qe-plant-count');
  if (cnt) cnt.textContent = plantData.length ? plantData.length + ' item' + (plantData.length !== 1 ? 's' : '') + ' added' : 'None added yet';
}

function qeAddPlant(idx) {
  const p = prevDayPlant[idx];
  if (!plantData.some(pd => pd.name === p.name)) {
    addPlantRow(p.name, p.hire, p.op, p.task, false);
  }
  renderQEPlant();
  updateQERing();
}

/* ── Materials ───────────────────────────────────────────────── */
function renderQEMaterials() {
  const c = document.getElementById('qe-mat-chips');
  if (!c) return;
  c.innerHTML = prevDayMaterials.map((m, i) => {
    const added = matData.some(md => md.name === m.name);
    return `<div class="qe-chip${added ? ' qe-chip-done' : ''}" onclick="qeAddMat(${i})">
      <span style="font-size:18px;flex-shrink:0;">📦</span>
      <div style="flex:1;min-width:0;">
        <div style="font-size:12px;font-weight:600;">${m.name}</div>
        <div style="font-size:10px;color:var(--tm);">${m.qty} ${m.unit}</div>
      </div>
      ${added ? '<svg style="flex-shrink:0;" width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="var(--green)" stroke-width="2.2"><path d="M2 7l3.5 3.5L12 3"/></svg>' : '<svg style="flex-shrink:0;opacity:.3;" width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 2v10M2 7h10"/></svg>'}
    </div>`;
  }).join('');
  const cnt = document.getElementById('qe-mat-count');
  if (cnt) cnt.textContent = matData.length ? matData.length + ' item' + (matData.length !== 1 ? 's' : '') + ' added' : 'None added yet';
}

function qeAddMat(idx) {
  const m = prevDayMaterials[idx];
  if (!matData.some(md => md.name === m.name)) {
    addMatRow(m.name, m.qty, m.unit, m.supplier);
  }
  renderQEMaterials();
  updateQERing();
}

/* ── Notes — Ctrl+Enter ──────────────────────────────────────── */
function qeNoteKeydown(e) {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
    const ta = document.getElementById('qe-note-ta');
    const cat = document.getElementById('qe-note-cat');
    if (ta && ta.value.trim()) {
      saveNote(ta.value.trim(), cat ? cat.value : 'General');
      ta.value = '';
      updateQERing();
      showToast('Note saved ✓');
    }
  }
}

/* ── Delivery ────────────────────────────────────────────────── */
function qeAddDel() {
  const sup = document.getElementById('qe-del-sup');
  const doc = document.getElementById('qe-del-doc');
  const mat = document.getElementById('qe-del-mat');
  const qty = document.getElementById('qe-del-qty');
  if (!sup || !sup.value.trim()) { showToast('Enter a supplier name first', 'warn'); return; }
  delData.push({ id: delIdC++, supplier: sup.value.trim(), docket: doc ? doc.value : '', material: mat ? mat.value : '', qty: qty ? qty.value : 0, notes: '' });
  if (typeof renderDel === 'function') renderDel();
  if (typeof updStats === 'function') updStats();
  sup.value = ''; if (doc) doc.value = ''; if (mat) mat.value = ''; if (qty) qty.value = '';
  showToast('Delivery docket added ✓');
  updateQERing();
}

function qeSkipDel() {
  const body = document.getElementById('qe-del-body');
  if (body) {
    body.innerHTML = `<div class="qe-done-row">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--green)" stroke-width="2.2"><path d="M2 7l3.5 3.5L12 3"/></svg>
      No deliveries today — section skipped
    </div>`;
  }
}

/* ── Misc ────────────────────────────────────────────────────── */
function qeAddMiscPreset(text) {
  miscData.push({ id: miscIdC++, desc: text, qty: '1', notes: '' });
  if (typeof renderMisc === 'function') renderMisc();
  showToast('Added: ' + text);
}

function qeSkipMisc() {
  const body = document.getElementById('qe-misc-body');
  if (body) {
    body.innerHTML = `<div class="qe-done-row">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--green)" stroke-width="2.2"><path d="M2 7l3.5 3.5L12 3"/></svg>
      Nothing to add today
    </div>`;
  }
}

/* ── Save All ────────────────────────────────────────────────── */
function qeSaveAll() {
  // Confirm weather if not done
  const wxEl = document.getElementById('ss-weather');
  if (wxEl && !wxEl.textContent.includes('Confirmed')) confirmWeather();

  // Save note textarea if filled
  const ta = document.getElementById('qe-note-ta');
  const cat = document.getElementById('qe-note-cat');
  if (ta && ta.value.trim()) {
    saveNote(ta.value.trim(), cat ? cat.value : 'General');
    ta.value = '';
  }

  if (typeof updStats === 'function') updStats();
  renderQEAll();

  const pct = calcQEPct();
  showToast('✓ Diary ' + pct + '% complete — all changes saved');
  if (pct >= 100) {
    setTimeout(() => showToast('🎉 Diary complete! Ready to submit.'), 800);
  }
}

/* ── Custom material from QE form ───────────────────────────── */
function qeAddMatCustom() {
  const name = document.getElementById('qe-mat-name');
  const qty  = document.getElementById('qe-mat-qty');
  const unit = document.getElementById('qe-mat-unit');
  if (!name || !name.value.trim()) { showToast('Enter a material name first', 'warn'); return; }
  addMatRow(name.value.trim(), qty ? parseFloat(qty.value) || 0 : 0, unit ? unit.value : 'm³', '');
  name.value = ''; if (qty) qty.value = '';
  renderQEMaterials();
  updateQERing();
  showToast('Material added ✓');
}

/* ── Morning Mode ────────────────────────────────────────────── */
function checkMorningMode() {
  const h = new Date().getHours();
  if (h >= 12) return; // afternoon — skip prompt
  const isEmpty = !labourData.length && !plantData.length;
  const wxEl = document.getElementById('ss-weather');
  const wxConfirmed = wxEl && wxEl.textContent.includes('Confirmed');
  if (isEmpty && !wxConfirmed) showMorningPrompt();
}

function showMorningPrompt() {
  if (document.getElementById('morning-prompt')) return;
  const p = document.createElement('div');
  p.id = 'morning-prompt';
  p.className = 'morning-prompt';
  p.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0;">
      <span style="font-size:20px;flex-shrink:0;">☀️</span>
      <div style="min-width:0;">
        <div style="font-size:13px;font-weight:600;color:var(--tp);">Good morning! Diary is empty</div>
        <div style="font-size:11px;color:var(--tm);">Fill it in 5 minutes with Quick Entry</div>
      </div>
    </div>
    <button class="btn btn-a" style="height:32px;gap:5px;flex-shrink:0;"
      onclick="document.getElementById('morning-prompt').remove();openQE();">
      <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="white" stroke-width="2"><path d="M7 2l-3 4h5l-3 4"/></svg>
      Quick Entry
    </button>
    <button class="ibtn" style="flex-shrink:0;font-size:16px;padding:2px 6px;"
      onclick="this.closest('#morning-prompt').remove();">✕</button>
  `;
  const scroll = document.getElementById('sd-scroll');
  if (scroll) scroll.insertBefore(p, scroll.firstChild);
}
