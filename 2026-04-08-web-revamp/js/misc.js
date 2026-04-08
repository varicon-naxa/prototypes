/* ═══════════════════════════════════════════════════════════════
   Varicon SiteDiary — Miscellaneous
   ═══════════════════════════════════════════════════════════════ */

/* ─── Sample task options (mirrors project task structure) ─── */
const miscTasks = [
  { code: '1',   name: 'Site Preliminaries', subtasks: [
    { code: '1.1', name: 'Site Establishment', subsubtasks: ['Mobilisation', 'Site Setup', 'Traffic Control'] },
    { code: '1.2', name: 'Temporary Works',    subsubtasks: ['Hoarding', 'Scaffold', 'Access'] },
  ]},
  { code: '2',   name: 'Demolition', subtasks: [
    { code: '2.1', name: 'Concrete Breaking',  subsubtasks: ['Slab Break', 'Footing Break'] },
    { code: '2.2', name: 'Asphalt Removal',    subsubtasks: ['Pavement Cutting', 'Milling'] },
  ]},
  { code: '3',   name: 'Earthworks', subtasks: [
    { code: '3.1', name: 'Cut & Fill',         subsubtasks: ['Cut', 'Fill', 'Compact'] },
    { code: '3.2', name: 'Subgrade Prep',      subsubtasks: ['Trim', 'Proof Roll'] },
  ]},
  { code: '4',   name: 'Pavement', subtasks: [
    { code: '4.1', name: 'Subgrade',           subsubtasks: ['Subgrade Layer', 'Subgrade Compact'] },
    { code: '4.2', name: 'Basecourse',         subsubtasks: ['Base Layer', 'Base Compact'] },
  ]},
];

const miscCostCentres = ['Demolition', 'Civil Works', 'Structure', 'Finishing', 'Services', 'Preliminaries'];

/* ─── Misc item catalogue ─── */
const miscCatalogue = [
  { id: 'TC-SIGNS',   name: 'Traffic Control Signs',      category: 'Traffic Management', units: ['EA', 'Day'] },
  { id: 'TC-CONES',   name: 'Traffic Cones / Delineators', category: 'Traffic Management', units: ['EA', 'Set'] },
  { id: 'TC-BARRIER', name: 'Concrete Safety Barriers',   category: 'Traffic Management', units: ['m', 'EA'] },
  { id: 'TC-TMP',     name: 'TMP Preparation',            category: 'Traffic Management', units: ['EA', 'Lump Sum'] },
  { id: 'SF-FENCE',   name: 'Safety Fencing / Hoarding',  category: 'Safety & Environment', units: ['m', 'EA'] },
  { id: 'SF-SILT',    name: 'Silt Fence',                 category: 'Safety & Environment', units: ['m', 'EA'] },
  { id: 'SF-SPILL',   name: 'Spill Kit',                  category: 'Safety & Environment', units: ['EA', 'Kit'] },
  { id: 'SF-ENVMON',  name: 'Environmental Monitoring',   category: 'Safety & Environment', units: ['Day', 'Lump Sum'] },
  { id: 'EQ-PUMP',    name: 'Dewatering Pump',            category: 'Equipment Hire', units: ['Day', 'Week'] },
  { id: 'EQ-GENSET',  name: 'Generator',                  category: 'Equipment Hire', units: ['Day', 'Week'] },
  { id: 'EQ-TOOLS',   name: 'Small Tools Hire',           category: 'Equipment Hire', units: ['Day', 'Lump Sum'] },
  { id: 'EQ-COMPTEST',name: 'Compaction Testing',         category: 'Testing & Survey', units: ['EA', 'No.'] },
  { id: 'EQ-CONCRETE',name: 'Concrete Testing (Cylinders)', category: 'Testing & Survey', units: ['EA', 'Set'] },
  { id: 'SV-PEGS',    name: 'Survey Pegs / Setting Out',  category: 'Testing & Survey', units: ['EA', 'No.'] },
  { id: 'WD-SKIP',    name: 'Skip Bin / Waste Disposal',  category: 'Waste & Logistics', units: ['EA', 'Load'] },
  { id: 'WD-CONCRETE',name: 'Concrete Washout',           category: 'Waste & Logistics', units: ['EA', 'Load'] },
  { id: 'LG-FUEL',    name: 'Fuel Costs',                 category: 'Waste & Logistics', units: ['L', 'Lump Sum'] },
  { id: 'AD-PHOTOS',  name: 'Progress Photography',       category: 'Administration', units: ['Day', 'Lump Sum'] },
  { id: 'AD-MEETING', name: 'Site Meeting',               category: 'Administration', units: ['EA', 'Day'] },
  { id: 'AD-REPORT',  name: 'Reporting',                  category: 'Administration', units: ['Day', 'Lump Sum'] },
];

/* ─── Bulk-select modal state ─── */
let selectedMiscItems = [];

/* ─── Add row state ─── */
let miscAddRowOpen = false;
let miscAddRowData = { name: '', miscId: '', task: '', costCentre: '', qty: 0, duration: '', totalHours: 0, attachments: [] };

/* ═══════════════════════════════════════════════════════════════
   RENDER
   ═══════════════════════════════════════════════════════════════ */
function renderMisc() {
  const tb = document.getElementById('misc-tbody');
  if (!tb) return;

  const q        = (document.getElementById('misc-search')?.value || '').toLowerCase();
  const totalCols = 8;

  // ── Empty state ──
  if (!miscData.length && !miscAddRowOpen) {
    tb.innerHTML = `<tr><td colspan="${totalCols}" style="text-align:center;padding:40px 20px;">
      <svg width="36" height="36" viewBox="0 0 40 40" fill="none" stroke="var(--border-d)" stroke-width="1.2" style="margin-bottom:10px;display:block;margin-left:auto;margin-right:auto;">
        <rect x="6" y="6" width="28" height="28" rx="3"/>
        <path d="M13 14h14M13 20h14M13 26h8"/>
      </svg>
      <div style="color:var(--tm);font-size:13px;font-weight:500;margin-bottom:4px;">No miscellaneous items for this date.</div>
      <div style="color:var(--td);font-size:11px;margin-bottom:16px;">Track additional work items, quantities and durations.</div>
      <button class="btn btn-a btn-sm" style="gap:3px;" onclick="openAddMisc()">
        <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="white" stroke-width="2"><path d="M6 2v8M2 6h8"/></svg>
        ADD ITEM
      </button>
    </td></tr>`;
    updateMiscStats();
    return;
  }

  const filtered = miscData.filter(m =>
    !q || m.name.toLowerCase().includes(q) || (m.task || '').toLowerCase().includes(q) || (m.costCentre || '').toLowerCase().includes(q)
  );

  if (!filtered.length && q) {
    tb.innerHTML = `<tr><td colspan="${totalCols}" style="text-align:center;padding:20px;color:var(--tm);font-size:12px;">No items match "${q}"</td></tr>`;
    updateMiscStats();
    return;
  }

  // ── Data rows ──
  let rows = filtered.map((m, fi) => {
    const idx = miscData.indexOf(m);
    const taskObj = miscTasks.find(t => t.code === m.task);

    // total hours = qty × duration (minutes) / 60 — or just duration if no qty
    const totalHrs = m.totalHours || 0;
    const totalStr = totalHrs > 0 ? totalHrs.toFixed(2) : '—';

    const hasTask = !!m.task;
    const unassigned = !hasTask;

    return `<tr class="misc-row" style="border-bottom:1px solid var(--border);">
      <td style="width:28px;text-align:center;">
        <button class="misc-row-rm" onclick="removeMiscRow(${idx})" title="Remove"
          style="opacity:0;transition:opacity .1s;background:none;border:none;cursor:pointer;color:var(--td);padding:2px;">
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 3l6 6M9 3l-6 6"/></svg>
        </button>
      </td>
      <td style="min-width:160px;">
        <select class="vs-sm" style="font-size:10px;border-color:transparent;background:transparent;padding:2px 4px;width:100%;max-width:180px;"
          onfocus="this.style.borderColor='var(--amber)'"
          onblur="this.style.borderColor='transparent'"
          onchange="miscData[${idx}].miscId=this.value;const mc=miscCatalogue.find(x=>x.id===this.value);if(mc)miscData[${idx}].name=mc.name;renderMisc()">
          ${miscCatalogue.map(c => `<option value="${c.id}"${m.miscId===c.id?' selected':''}>${c.name}</option>`).join('')}
          <option value="__custom"${!miscCatalogue.some(c=>c.id===m.miscId)?' selected':''}>— Custom —</option>
        </select>
      </td>
      <td style="width:140px;">
        <select class="vs-sm" style="font-size:10px;border-color:transparent;background:transparent;padding:2px 3px;width:100%;"
          onfocus="this.style.borderColor='var(--amber)'"
          onblur="this.style.borderColor='transparent'"
          onchange="miscData[${idx}].task=this.value;renderMisc()">
          <option value="">— Select Task —</option>
          ${miscTasks.map(t => `<option value="${t.code}"${m.task===t.code?' selected':''}>(${t.code}) ${t.name}</option>`).join('')}
        </select>
      </td>
      <td style="width:140px;">
        <select class="vs-sm" style="font-size:10px;border-color:transparent;background:transparent;padding:2px 3px;width:100%;"
          onfocus="this.style.borderColor='var(--amber)'"
          onblur="this.style.borderColor='transparent'"
          onchange="miscData[${idx}].costCentre=this.value">
          <option value="">— Cost Centre —</option>
          ${miscCostCentres.map(cc => `<option${m.costCentre===cc?' selected':''}>${cc}</option>`).join('')}
        </select>
      </td>
      <td style="text-align:center;width:80px;">
        <input type="number" value="${m.qty || 0}" min="0" step="1" class="vi-sm"
          style="width:52px;text-align:center;font-family:'JetBrains Mono',monospace;font-size:10px;padding:2px 3px;border-color:transparent;background:transparent;"
          onfocus="this.style.borderColor='var(--amber)';this.style.background='#fff'"
          onblur="this.style.borderColor='transparent';this.style.background='transparent'"
          onchange="miscData[${idx}].qty=parseInt(this.value)||0;calcMiscTotalHrs(${idx});renderMisc()">
      </td>
      <td style="text-align:center;width:90px;">
        <input type="text" value="${m.duration || ''}" placeholder="hh:mm" class="vi-sm"
          style="width:62px;text-align:center;font-family:'JetBrains Mono',monospace;font-size:10px;padding:2px 3px;border-color:transparent;background:transparent;"
          onfocus="this.style.borderColor='var(--amber)';this.style.background='#fff'"
          onblur="this.style.borderColor='transparent';this.style.background='transparent'"
          onchange="miscData[${idx}].duration=this.value;calcMiscTotalHrs(${idx});renderMisc()">
      </td>
      <td style="text-align:center;width:90px;font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:600;color:${totalHrs > 0 ? 'var(--tp)' : 'var(--td)'};">
        ${totalStr}
      </td>
      <td style="text-align:center;width:80px;">
        <button class="ibtn" onclick="triggerMiscAttach(${idx})" title="Add attachment" style="color:var(--tm);padding:3px;">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M14 8.5l-5.5 5.5a4 4 0 01-5.66-5.66l6.5-6.5a2.5 2.5 0 013.54 3.54l-6.5 6.5a1 1 0 01-1.42-1.42L11 4.5"/></svg>
          ${m.attachments?.length ? `<span style="font-size:9px;font-weight:700;color:var(--amber);margin-left:2px;">${m.attachments.length}</span>` : ''}
        </button>
      </td>
    </tr>`;
  }).join('');

  // ── Always-visible add-row ──
  if (!miscAddRowOpen) {
    rows += `<tr style="background:var(--hover);border-bottom:1px solid var(--border);">
      <td style="width:28px;"></td>
      <td colspan="7" style="padding:5px 8px;">
        <button onclick="openAddMisc()" style="display:inline-flex;align-items:center;gap:5px;font-size:11px;color:var(--tm);background:none;border:1px dashed var(--border);border-radius:5px;padding:4px 12px;cursor:pointer;font-family:inherit;transition:all .12s;"
                onmouseenter="this.style.borderColor='var(--amber)';this.style.color='var(--amber)'"
                onmouseleave="this.style.borderColor='var(--border)';this.style.color='var(--tm)'">
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2v8M2 6h8"/></svg>
          Add item…
        </button>
      </td>
    </tr>`;
  } else {
    rows += renderMiscAddRow();
  }

  tb.innerHTML = rows;
  updateMiscStats();
}

/* ── Inline Add Row ── */
function renderMiscAddRow() {
  const d = miscAddRowData;

  return `<tr style="background:#FFFDF7;border-bottom:1px solid var(--amber);border-top:1px solid var(--amber);">
    <td style="width:28px;text-align:center;">
      <button onclick="closeAddMiscRow()" title="Cancel" style="background:none;border:none;cursor:pointer;color:var(--td);padding:2px;">
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 3l6 6M9 3l-6 6"/></svg>
      </button>
    </td>
    <td style="min-width:160px;">
      <select id="misc-add-name" class="vs-sm" style="font-size:10px;width:100%;border-color:var(--amber);"
        onchange="miscAddRowData.miscId=this.value;const mc=miscCatalogue.find(x=>x.id===this.value);if(mc)miscAddRowData.name=mc.name;">
        <option value="">— Select Item —</option>
        ${miscCatalogue.map(c => `<option value="${c.id}"${d.miscId===c.id?' selected':''}>${c.name}</option>`).join('')}
        <option value="__custom">— Custom —</option>
      </select>
    </td>
    <td style="width:140px;">
      <select class="vs-sm" style="font-size:10px;width:100%;"
        onchange="miscAddRowData.task=this.value;">
        <option value="">— Task —</option>
        ${miscTasks.map(t => `<option value="${t.code}"${d.task===t.code?' selected':''}>(${t.code}) ${t.name}</option>`).join('')}
      </select>
    </td>
    <td style="width:140px;">
      <select class="vs-sm" style="font-size:10px;width:100%;"
        onchange="miscAddRowData.costCentre=this.value">
        <option value="">— Cost Centre —</option>
        ${miscCostCentres.map(cc => `<option${d.costCentre===cc?' selected':''}>${cc}</option>`).join('')}
      </select>
    </td>
    <td style="text-align:center;width:80px;">
      <input type="number" value="${d.qty}" min="0" step="1" class="vi-sm"
        style="width:52px;text-align:center;font-family:'JetBrains Mono',monospace;font-size:10px;padding:2px 3px;"
        onchange="miscAddRowData.qty=parseInt(this.value)||0;updateMiscAddTotalHrs()">
    </td>
    <td style="text-align:center;width:90px;">
      <input type="text" value="${d.duration}" placeholder="hh:mm" class="vi-sm"
        style="width:62px;text-align:center;font-family:'JetBrains Mono',monospace;font-size:10px;padding:2px 3px;"
        onchange="miscAddRowData.duration=this.value;updateMiscAddTotalHrs()">
    </td>
    <td style="text-align:center;width:90px;font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:600;color:var(--td);" id="misc-add-total">
      ${d.totalHours > 0 ? d.totalHours.toFixed(2) : '—'}
    </td>
    <td style="text-align:center;width:80px;">
      <button class="ibtn" style="color:var(--td);padding:3px;" title="Attach">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M14 8.5l-5.5 5.5a4 4 0 01-5.66-5.66l6.5-6.5a2.5 2.5 0 013.54 3.54l-6.5 6.5a1 1 0 01-1.42-1.42L11 4.5"/></svg>
      </button>
    </td>
  </tr>
  <tr style="background:#FFFDF7;">
    <td colspan="8" style="padding:8px 10px;border-top:1px solid var(--border);">
      <div style="display:flex;justify-content:flex-end;gap:6px;">
        <button class="btn btn-o btn-sm" style="font-size:11px;" onclick="closeAddMiscRow()">CANCEL</button>
        <button class="btn btn-a btn-sm" style="font-size:11px;gap:4px;" onclick="confirmAddMiscRow()">
          <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="white" stroke-width="2"><path d="M2 6l3 3 5-5"/></svg>
          SAVE
        </button>
      </div>
    </td>
  </tr>`;
}

/* ═══════════════════════════════════════════════════════════════
   DURATION / TOTAL HOURS HELPERS
   ═══════════════════════════════════════════════════════════════ */
function parseDuration(str) {
  if (!str) return 0;
  const match = str.match(/(\d+):(\d+)/);
  if (match) return parseInt(match[1]) + parseInt(match[2]) / 60;
  const hMatch = str.match(/(\d+\.?\d*)/);
  return hMatch ? parseFloat(hMatch[1]) : 0;
}

function calcMiscTotalHrs(idx) {
  const m = miscData[idx];
  const durationHrs = parseDuration(m.duration);
  m.totalHours = (m.qty || 1) * durationHrs;
}

function updateMiscAddTotalHrs() {
  const d = miscAddRowData;
  const durationHrs = parseDuration(d.duration);
  d.totalHours = (d.qty || 1) * durationHrs;
  const el = document.getElementById('misc-add-total');
  if (el) el.textContent = d.totalHours > 0 ? d.totalHours.toFixed(2) : '—';
}

/* ═══════════════════════════════════════════════════════════════
   ADD / REMOVE ROWS
   ═══════════════════════════════════════════════════════════════ */
function openAddMiscRow() {
  miscAddRowOpen = true;
  miscAddRowData = { name: '', miscId: '', task: '', costCentre: '', qty: 0, duration: '', totalHours: 0, attachments: [] };
  renderMisc();
  setTimeout(() => { const n = document.getElementById('misc-add-name'); if (n) n.focus(); }, 50);
}

function closeAddMiscRow() {
  miscAddRowOpen = false;
  renderMisc();
}

function confirmAddMiscRow() {
  const selEl = document.getElementById('misc-add-name');
  const miscId = miscAddRowData.miscId || selEl?.value;
  const cat = miscCatalogue.find(c => c.id === miscId);
  const name = cat ? cat.name : (miscAddRowData.name.trim() || '');
  if (!name && miscId !== '__custom') { showToast('Please select an item', 'error'); return; }
  const durationHrs = parseDuration(miscAddRowData.duration);
  const totalHours = (miscAddRowData.qty || 1) * durationHrs;
  miscData.push({
    id: miscIdC++,
    name: name || 'Custom Item',
    miscId: miscId || '',
    task: miscAddRowData.task,
    costCentre: miscAddRowData.costCentre,
    qty: miscAddRowData.qty,
    duration: miscAddRowData.duration,
    totalHours,
    attachments: []
  });
  miscAddRowOpen = false;
  renderMisc();
  updStats();
  showToast('Item added');
}

function addMiscRow(desc, qty, notes) {
  // Legacy compat
  const cat = miscCatalogue.find(c => c.name === desc);
  miscData.push({
    id: miscIdC++, name: desc || '', miscId: cat ? cat.id : '', task: '', subtask: '', subsubtask: '',
    costCentre: '', qty: qty || 0, duration: '', totalHours: 0, attachments: []
  });
  renderMisc();
}

function removeMiscRow(idx) {
  miscData.splice(idx, 1);
  renderMisc();
  updStats();
  showToast('Item removed');
}

function triggerMiscAttach(idx) {
  showToast('Attachment feature coming soon', 'info');
}

/* ═══════════════════════════════════════════════════════════════
   STATS + WARNING BANNER
   ═══════════════════════════════════════════════════════════════ */
function updateMiscStats() {
  const el = id => document.getElementById(id);

  const count = miscData.length;
  const unassignedCount = miscData.filter(m => !m.task).length;

  if (el('misc-stat-count')) el('misc-stat-count').textContent = count;
  if (el('misc-stat-unassigned')) {
    el('misc-stat-unassigned').textContent = unassignedCount;
    el('misc-stat-unassigned').style.color = unassignedCount > 0 ? 'var(--amber)' : 'var(--tp)';
  }

  const banner = el('misc-warning-banner');
  if (banner) banner.style.display = unassignedCount > 0 && count > 0 ? 'flex' : 'none';

  if (el('ss-misc')) {
    el('ss-misc').textContent = count + ' item' + (count !== 1 ? 's' : '');
    el('ss-misc').className = 'sstat ' + (count ? 'done' : 'empty');
  }
  if (el('tv-misc')) el('tv-misc').textContent = count;
}

function saveMiscData() { renderMisc(); showToast('Miscellaneous saved'); }

/* ═══════════════════════════════════════════════════════════════
   BULK-SELECT MODAL
   ═══════════════════════════════════════════════════════════════ */
function openAddMisc() {
  selectedMiscItems = [];
  openMo('add-misc');
}

function renderAddMiscModal() {
  const listEl  = document.getElementById('amisc-list');
  const selEl   = document.getElementById('amisc-selected-list');
  const countEl = document.getElementById('amisc-sel-count');
  if (!listEl) return;

  const q = (document.getElementById('amisc-search')?.value || '').toLowerCase();

  const filtered = miscCatalogue.filter(c =>
    !q || c.name.toLowerCase().includes(q) || c.category.toLowerCase().includes(q) || c.id.toLowerCase().includes(q)
  );
  const groups = {};
  filtered.forEach(c => {
    if (!groups[c.category]) groups[c.category] = [];
    groups[c.category].push(c);
  });

  listEl.innerHTML = Object.entries(groups).map(([cat, items]) => `
    <div style="padding:4px 0;">
      <div style="padding:6px 14px 3px;font-size:10px;font-weight:700;color:var(--tm);text-transform:uppercase;letter-spacing:.06em;background:var(--bg);">${cat}</div>
      ${items.map(c => {
        const isSel = selectedMiscItems.some(s => s.id === c.id);
        return `<label style="display:flex;align-items:center;gap:10px;padding:9px 14px;border-bottom:1px solid var(--border);cursor:pointer;transition:background .1s;"
                       onmouseenter="this.style.background='var(--hover)'" onmouseleave="this.style.background=''">
          <input type="checkbox" ${isSel ? 'checked' : ''} onchange="toggleMiscSelect('${c.id}')"
            style="accent-color:var(--amber);width:15px;height:15px;flex-shrink:0;">
          <div style="flex:1;min-width:0;">
            <div style="font-size:13px;font-weight:600;color:var(--tp);">${c.name}</div>
            <div style="font-size:11px;color:var(--tm);">${c.id} · ${c.units.join(' / ')}</div>
          </div>
        </label>`;
      }).join('')}
    </div>`).join('');

  if (countEl) countEl.textContent = selectedMiscItems.length;

  if (!selEl) return;
  if (!selectedMiscItems.length) {
    selEl.innerHTML = '<div style="text-align:center;color:var(--tm);font-size:12px;padding:30px 16px;">No items selected.<br><span style="font-size:11px;color:var(--td);">Check items on the left to add.</span></div>';
    return;
  }
  selEl.innerHTML = selectedMiscItems.map(s => {
    const cat = miscCatalogue.find(c => c.id === s.id);
    return `<div style="padding:10px 14px;border-bottom:1px solid var(--border);">
      <div style="display:flex;align-items:flex-start;gap:8px;">
        <div style="flex:1;min-width:0;">
          <div style="font-size:13px;font-weight:600;color:var(--tp);">${s.name}</div>
          <div style="font-size:11px;color:var(--tm);">${cat?.category || ''}</div>
        </div>
        <button class="ibtn" onclick="removeMiscSelect('${s.id}')" style="color:var(--tm);padding:2px;" title="Remove">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 3l6 6M9 3l-6 6"/></svg>
        </button>
      </div>
      <div style="display:flex;align-items:center;gap:6px;margin-top:6px;">
        <label style="font-size:10px;color:var(--tm);white-space:nowrap;">Unit:</label>
        <select onchange="updateMiscSelectUnit('${s.id}',this.value)"
          style="font-size:11px;border:1px solid var(--border);border-radius:4px;padding:2px 4px;background:#fff;color:var(--tb);font-family:inherit;accent-color:var(--amber);">
          ${(cat?.units || ['EA','Day','Lump Sum']).map(u => `<option${s.unit===u?' selected':''}>${u}</option>`).join('')}
        </select>
      </div>
    </div>`;
  }).join('');
}

function toggleMiscSelect(id) {
  const idx = selectedMiscItems.findIndex(s => s.id === id);
  if (idx >= 0) {
    selectedMiscItems.splice(idx, 1);
  } else {
    const cat = miscCatalogue.find(c => c.id === id);
    if (cat) selectedMiscItems.push({ id: cat.id, name: cat.name, unit: cat.units[0] });
  }
  renderAddMiscModal();
}

function removeMiscSelect(id) {
  selectedMiscItems = selectedMiscItems.filter(s => s.id !== id);
  renderAddMiscModal();
}

function updateMiscSelectUnit(id, unit) {
  const s = selectedMiscItems.find(s => s.id === id);
  if (s) s.unit = unit;
}

function clearMiscSelect() {
  selectedMiscItems = [];
  renderAddMiscModal();
}

function selectAllMisc() {
  const q = (document.getElementById('amisc-search')?.value || '').toLowerCase();
  miscCatalogue.filter(c => !q || c.name.toLowerCase().includes(q) || c.category.toLowerCase().includes(q))
    .forEach(c => { if (!selectedMiscItems.some(s => s.id === c.id)) selectedMiscItems.push({ id: c.id, name: c.name, unit: c.units[0] }); });
  renderAddMiscModal();
}

function confirmAddMiscItems() {
  if (!selectedMiscItems.length) { showToast('Please select at least one item', 'error'); return; }
  selectedMiscItems.forEach(s => {
    if (!miscData.some(m => m.miscId === s.id)) {
      miscData.push({
        id: miscIdC++, name: s.name, miscId: s.id,
        task: '', subtask: '', subsubtask: '', costCentre: '',
        qty: 0, duration: '', totalHours: 0, attachments: []
      });
    }
  });
  selectedMiscItems = [];
  renderMisc(); updStats(); closeMo();
  showToast('Items added');
}
