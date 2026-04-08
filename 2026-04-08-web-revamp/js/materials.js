/* ═══════════════════════════════════════════════════════════════
   Varicon SiteDiary — Materials
   ═══════════════════════════════════════════════════════════════ */

/* ─── Material catalogue ─── */
const materialCatalogue = [
  { id: 'CONC-25',   name: '23MPa Concrete',          type: 'Concrete',   units: ['m³', 'L'] },
  { id: 'CONC-32',   name: '32MPa Concrete',          type: 'Concrete',   units: ['m³', 'L'] },
  { id: 'CONC-40',   name: '40MPa Concrete',          type: 'Concrete',   units: ['m³', 'L'] },
  { id: 'STEEL-N16', name: 'Reinforcement Bar N16',   type: 'Steel',      units: ['kg', 'T', 'EA'] },
  { id: 'STEEL-N20', name: 'Reinforcement Bar N20',   type: 'Steel',      units: ['kg', 'T', 'EA'] },
  { id: 'STEEL-N32', name: 'Reinforcement Bar N32',   type: 'Steel',      units: ['kg', 'T', 'EA'] },
  { id: 'AGG-20',    name: 'Crushed Rock 20mm',       type: 'Aggregate',  units: ['T', 'm³'] },
  { id: 'AGG-RB',    name: 'Road Base',               type: 'Aggregate',  units: ['T', 'm³'] },
  { id: 'AGG-GF',    name: 'Gravel Fill',             type: 'Aggregate',  units: ['T', 'm³'] },
  { id: 'AGG-SF',    name: 'Sand Fill',               type: 'Aggregate',  units: ['T', 'm³'] },
  { id: 'PIPE-H100', name: 'HDPE Pipe 100mm',         type: 'Pipe',       units: ['m', 'EA'] },
  { id: 'PIPE-H150', name: 'HDPE Pipe 150mm',         type: 'Pipe',       units: ['m', 'EA'] },
  { id: 'PIPE-C300', name: 'Concrete Pipe 300mm',     type: 'Pipe',       units: ['m', 'EA'] },
  { id: 'FORM-PLY',  name: 'Form Ply 17mm',           type: 'Formwork',   units: ['m²', 'EA'] },
  { id: 'FORM-TIM',  name: 'Structural Timber 90x45', type: 'Formwork',   units: ['m', 'EA'] },
  { id: 'BITUM-AC10',name: 'Asphalt AC10',            type: 'Bituminous', units: ['T', 'm²'] },
  { id: 'BITUM-AC14',name: 'Asphalt AC14',            type: 'Bituminous', units: ['T', 'm²'] },
  { id: 'MISC-CEM',  name: 'Cement (Bag)',            type: 'Miscellaneous', units: ['EA', 'T'] },
  { id: 'MISC-GEO',  name: 'Geofabric',              type: 'Miscellaneous', units: ['m²', 'Lump Sum'] },
];

const matUnits    = ['m³', 'T', 'm', 'm²', 'EA', 'kg', 'L', 'Lump Sum', 'No.'];
const matSources  = ['Site Diary', 'Purchase Order', 'Delivery Docket'];

/* ─── Per-materials task matrix (separate from plant's appliedTasks) ─── */
let matAppliedTasks = [];

/* ─── Bulk-select modal state ─── */
let selectedMaterials = []; // { id, name, type, unit }

/* ─── Inline add-row state ─── */
let matAddRowOpen = false;
let matAddRowData = { name: '', matId: '', source: 'Site Diary', company: '', unassignedQty: 0, unit: 'm³', taskQty: {} };

/* ═══════════════════════════════════════════════════════════════
   TASK COLUMNS — MATERIALS CONTEXT
   ═══════════════════════════════════════════════════════════════ */
function openMatTaskModal() {
  taskModalContext = 'materials';
  selectedTasks = matAppliedTasks.map(t => ({ code: t.code, name: t.name, parent: t.parent }));
  renderTaskSel();
  openMo('task');
}

function applyMatTasks() {
  selectedTasks.forEach(t => {
    if (!matAppliedTasks.some(a => a.code === t.code)) {
      matAppliedTasks.push({ code: t.code, name: t.name, parent: t.parent || '' });
    }
  });
  matAppliedTasks = matAppliedTasks.filter(a => selectedTasks.some(s => s.code === a.code));
  matData.forEach(m => {
    if (!m.taskQty) m.taskQty = {};
    matAppliedTasks.forEach(t => { if (!(t.code in m.taskQty)) m.taskQty[t.code] = 0; });
  });
  renderMat();
  showToast(selectedTasks.length + ' task(s) applied as columns');
}

function removeMatAppliedTask(code) {
  matAppliedTasks = matAppliedTasks.filter(t => t.code !== code);
  matData.forEach(m => { if (m.taskQty) delete m.taskQty[code]; });
  renderMat();
  showToast('Task column removed');
}

/* ═══════════════════════════════════════════════════════════════
   BULK-SELECT MODAL
   ═══════════════════════════════════════════════════════════════ */
function renderAddMatModal() {
  const listEl  = document.getElementById('aeqmat-list');
  const selEl   = document.getElementById('aeqmat-selected-list');
  const countEl = document.getElementById('aeqmat-sel-count');
  if (!listEl) return;

  const q = (document.getElementById('aeqmat-search')?.value || '').toLowerCase();

  // Group by type
  const filtered = materialCatalogue.filter(c =>
    !q || c.name.toLowerCase().includes(q) || c.type.toLowerCase().includes(q) || c.id.toLowerCase().includes(q)
  );
  const groups = {};
  filtered.forEach(c => {
    if (!groups[c.type]) groups[c.type] = [];
    groups[c.type].push(c);
  });

  listEl.innerHTML = Object.entries(groups).map(([type, items]) => `
    <div style="padding:4px 0;">
      <div style="padding:6px 14px 3px;font-size:10px;font-weight:700;color:var(--tm);text-transform:uppercase;letter-spacing:.06em;background:var(--bg);">${type}</div>
      ${items.map(c => {
        const isSel = selectedMaterials.some(s => s.id === c.id);
        return `<label style="display:flex;align-items:center;gap:10px;padding:9px 14px;border-bottom:1px solid var(--border);cursor:pointer;transition:background .1s;"
                       onmouseenter="this.style.background='var(--hover)'" onmouseleave="this.style.background=''">
          <input type="checkbox" ${isSel ? 'checked' : ''} onchange="toggleMatSelect('${c.id}')"
            style="accent-color:var(--amber);width:15px;height:15px;flex-shrink:0;">
          <div style="flex:1;min-width:0;">
            <div style="font-size:13px;font-weight:600;color:var(--tp);">${c.name}</div>
            <div style="font-size:11px;color:var(--tm);">ID: ${c.id} · ${c.units.join(' / ')}</div>
          </div>
        </label>`;
      }).join('')}
    </div>`).join('');

  if (countEl) countEl.textContent = selectedMaterials.length;

  if (!selEl) return;
  if (!selectedMaterials.length) {
    selEl.innerHTML = '<div style="text-align:center;color:var(--tm);font-size:12px;padding:30px 16px;">No items selected.<br><span style="font-size:11px;color:var(--td);">Check items on the left to add.</span></div>';
    return;
  }
  selEl.innerHTML = selectedMaterials.map(s => {
    const cat = materialCatalogue.find(c => c.id === s.id);
    return `<div style="padding:10px 14px;border-bottom:1px solid var(--border);">
      <div style="display:flex;align-items:flex-start;gap:8px;">
        <div style="flex:1;min-width:0;">
          <div style="font-size:13px;font-weight:600;color:var(--tp);">${s.name}</div>
          <div style="font-size:11px;color:var(--tm);">${cat?.type || ''} · ${s.id}</div>
        </div>
        <button class="ibtn" onclick="removeMatSelect('${s.id}')" style="color:var(--tm);padding:2px;" title="Remove">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 3l6 6M9 3l-6 6"/></svg>
        </button>
      </div>
      <div style="display:flex;align-items:center;gap:6px;margin-top:6px;">
        <label style="font-size:10px;color:var(--tm);white-space:nowrap;">Unit:</label>
        <select onchange="updateMatSelectUnit('${s.id}',this.value)"
          style="font-size:11px;border:1px solid var(--border);border-radius:4px;padding:2px 4px;background:#fff;color:var(--tb);font-family:inherit;accent-color:var(--amber);">
          ${(cat?.units || matUnits).map(u => `<option${s.unit===u?' selected':''}>${u}</option>`).join('')}
        </select>
      </div>
    </div>`;
  }).join('');
}

function toggleMatSelect(id) {
  const idx = selectedMaterials.findIndex(s => s.id === id);
  if (idx >= 0) {
    selectedMaterials.splice(idx, 1);
  } else {
    const cat = materialCatalogue.find(c => c.id === id);
    if (cat) selectedMaterials.push({ id: cat.id, name: cat.name, unit: cat.units[0] });
  }
  renderAddMatModal();
}

function removeMatSelect(id) {
  selectedMaterials = selectedMaterials.filter(s => s.id !== id);
  renderAddMatModal();
}

function updateMatSelectUnit(id, unit) {
  const s = selectedMaterials.find(s => s.id === id);
  if (s) s.unit = unit;
}

function clearMatSelect() {
  selectedMaterials = [];
  renderAddMatModal();
}

function selectAllMat() {
  const q = (document.getElementById('aeqmat-search')?.value || '').toLowerCase();
  materialCatalogue.filter(c => !q || c.name.toLowerCase().includes(q) || c.type.toLowerCase().includes(q))
    .forEach(c => { if (!selectedMaterials.some(s => s.id === c.id)) selectedMaterials.push({ id: c.id, name: c.name, unit: c.units[0] }); });
  renderAddMatModal();
}

function confirmAddMaterials() {
  if (!selectedMaterials.length) { showToast('Please select at least one material', 'error'); return; }
  selectedMaterials.forEach(s => {
    if (!matData.some(m => m.matId === s.id)) {
      const tq = {};
      matAppliedTasks.forEach(t => { tq[t.code] = 0; });
      matData.push({ id: matIdC++, name: s.name, matId: s.id, source: 'Site Diary', company: '', unassignedQty: 0, unit: s.unit, taskQty: tq });
    }
  });
  selectedMaterials = [];
  renderMat(); updStats(); closeMo();
  showToast('Materials added');
}

/* ═══════════════════════════════════════════════════════════════
   RENDER
   ═══════════════════════════════════════════════════════════════ */
function renderMat() {
  const tb = document.getElementById('mat-tbody');
  const th = document.getElementById('mat-thead');
  if (!tb) return;

  const q        = (document.getElementById('mat-search')?.value || '').toLowerCase();
  const hasTasks = matAppliedTasks.length > 0;
  const totalCols = 6 + matAppliedTasks.length;

  // ── Dynamic header ──
  if (th) {
    const taskParents = {};
    matAppliedTasks.forEach(t => {
      const key = t.parent || t.code;
      if (!taskParents[key]) taskParents[key] = { name: t.parent || t.name, children: [] };
      taskParents[key].children.push(t);
    });

    if (hasTasks) {
      let row1 = `
        <th rowspan="2" style="width:28px;background:var(--thead);"></th>
        <th colspan="3" style="font-size:12px;font-weight:600;color:var(--tb);text-align:left;background:var(--thead);border-right:1px solid var(--border-d);">Material Details</th>
        <th rowspan="2" style="text-align:center;width:110px;background:var(--thead);font-size:12px;font-weight:600;color:var(--tb);">Total Qty</th>
        <th rowspan="2" style="text-align:center;width:115px;background:var(--thead);font-size:12px;font-weight:600;color:var(--tb);border-right:2px solid var(--border-d);">Unassigned Qty</th>`;
      Object.values(taskParents).forEach(g => {
        row1 += `<th colspan="${g.children.length}" style="font-size:10px;font-weight:600;color:var(--tp);text-align:center;background:var(--thead);border-left:1px solid var(--border-d);padding:5px 6px;">${g.name}</th>`;
      });
      let row2 = `
        <th style="font-size:10px;font-weight:500;color:var(--tm);text-align:left;background:var(--thead);min-width:140px;">Material</th>
        <th style="font-size:10px;font-weight:500;color:var(--tm);text-align:left;background:var(--thead);width:100px;">Resource</th>
        <th style="font-size:10px;font-weight:500;color:var(--tm);text-align:left;background:var(--thead);width:115px;border-right:1px solid var(--border-d);">Company / Supplier</th>`;
      matAppliedTasks.forEach(t => {
        row2 += `<th style="font-size:9px;font-weight:500;color:var(--tm);text-align:center;background:var(--thead);border-left:1px solid var(--border);min-width:80px;padding:3px 4px;position:relative;" title="(${t.code}) ${t.name}">
          (${t.code}) ${t.name.length > 14 ? t.name.substring(0,14)+'…' : t.name}
          <button onclick="removeMatAppliedTask('${t.code}')" style="position:absolute;top:1px;right:1px;background:none;border:none;cursor:pointer;color:var(--td);font-size:8px;" title="Remove">✕</button>
        </th>`;
      });
      th.innerHTML = `<tr>${row1}</tr><tr>${row2}</tr>`;
    } else {
      th.innerHTML = `<tr>
        <th style="width:28px;background:var(--thead);"></th>
        <th style="text-align:left;background:var(--thead);font-size:12px;font-weight:600;color:var(--tb);">Material</th>
        <th style="text-align:left;width:100px;background:var(--thead);font-size:12px;font-weight:600;color:var(--tb);">Resource</th>
        <th style="text-align:left;width:115px;background:var(--thead);font-size:12px;font-weight:600;color:var(--tb);border-right:1px solid var(--border-d);">Company / Supplier</th>
        <th style="text-align:center;width:110px;background:var(--thead);font-size:12px;font-weight:600;color:var(--tb);">Total Qty</th>
        <th style="text-align:center;width:115px;background:var(--thead);font-size:12px;font-weight:600;color:var(--tb);">Unassigned Qty</th>
      </tr>`;
    }
  }

  // ── Empty state ──
  if (!matData.length && !matAddRowOpen) {
    tb.innerHTML = `<tr><td colspan="${totalCols}" style="text-align:center;padding:40px 20px;">
      <svg width="36" height="36" viewBox="0 0 40 40" fill="none" stroke="var(--border-d)" stroke-width="1.2" style="margin-bottom:10px;display:block;margin-left:auto;margin-right:auto;">
        <rect x="6" y="12" width="28" height="22" rx="2.5"/><path d="M14 12V9a2 2 0 012-2h8a2 2 0 012 2v3"/><path d="M6 20h28"/>
      </svg>
      <div style="color:var(--tm);font-size:13px;font-weight:500;margin-bottom:4px;">No materials added for this date.</div>
      <div style="color:var(--td);font-size:11px;margin-bottom:16px;">Add materials to track quantities and assign to tasks.</div>
      <div style="display:flex;gap:6px;justify-content:center;">
        <button class="btn btn-a btn-sm" style="gap:3px;" onclick="openAddMaterial()">
          <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="white" stroke-width="2"><path d="M6 2v8M2 6h8"/></svg>
          ADD MATERIAL
        </button>
        <button class="btn btn-o btn-sm" style="gap:3px;" onclick="openMatTaskModal()">
          <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2v8M2 6h8"/></svg>
          ADD TASKS
        </button>
      </div>
    </td></tr>`;
    updateMatStats();
    return;
  }

  const filtered = matData.filter(m => !q || m.name.toLowerCase().includes(q) || (m.company || '').toLowerCase().includes(q));

  if (!filtered.length && q) {
    tb.innerHTML = `<tr><td colspan="${totalCols}" style="text-align:center;padding:20px;color:var(--tm);font-size:12px;">No materials match "${q}"</td></tr>`;
    updateMatStats();
    return;
  }

  // ── Data rows ──
  let rows = filtered.map(m => {
    const idx = matData.indexOf(m);
    if (!m.taskQty) m.taskQty = {};

    // Total Qty = sum(task allocations) + unassigned qty  (read-only)
    const allocatedQty  = matAppliedTasks.reduce((s, t) => s + (m.taskQty[t.code] || 0), 0);
    const unassignedQty = m.unassignedQty || 0;
    const totalQty      = allocatedQty + unassignedQty;

    const taskCells = matAppliedTasks.map(t => {
      const val = m.taskQty[t.code] || 0;
      return `<td style="text-align:center;border-left:1px solid var(--border);padding:3px 4px;">
        <input type="number" value="${val}" min="0" step="0.01" class="vi-sm"
          style="width:55px;text-align:center;font-family:'JetBrains Mono',monospace;font-size:10px;padding:2px 3px;border-color:transparent;background:transparent;"
          onfocus="this.style.borderColor='var(--amber)';this.style.background='#fff'"
          onblur="this.style.borderColor='transparent';this.style.background='transparent'"
          onchange="matData[${idx}].taskQty['${t.code}']=parseFloat(this.value)||0;renderMat()">
      </td>`;
    }).join('');

    const unassignedColor = hasTasks && unassignedQty > 0 ? 'color:var(--amber);font-weight:600;' : 'color:var(--tm);';

    // Material dropdown — catalogue options + current value if custom
    const catOptions = materialCatalogue.map(c =>
      `<option value="${c.id}"${m.matId===c.id?' selected':''}>(${c.id}) ${c.name}</option>`).join('');
    const customSelected = !materialCatalogue.some(c => c.id === m.matId);

    return `<tr class="mat-row" style="border-bottom:1px solid var(--border);">
      <td style="width:28px;text-align:center;">
        <button class="mat-row-rm" onclick="removeMatRow(${idx})" title="Remove"
          style="opacity:0;transition:opacity .1s;background:none;border:none;cursor:pointer;color:var(--td);padding:2px;">
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 3l6 6M9 3l-6 6"/></svg>
        </button>
      </td>
      <td style="font-size:11px;min-width:160px;">
        <select class="vs-sm" style="font-size:10px;border-color:transparent;background:transparent;padding:2px 4px;width:100%;max-width:170px;"
          onfocus="this.style.borderColor='var(--amber)'"
          onblur="this.style.borderColor='transparent'"
          onchange="matData[${idx}].matId=this.value;const c=materialCatalogue.find(x=>x.id===this.value);if(c){matData[${idx}].name=c.name;matData[${idx}].unit=c.units[0];}renderMat()">
          ${catOptions}
          <option value="__custom"${customSelected?' selected':''}>— Custom —</option>
        </select>
      </td>
      <td style="font-size:11px;width:100px;">
        <select class="vs-sm" style="font-size:10px;border-color:transparent;background:transparent;padding:2px 4px;width:100%;"
          onfocus="this.style.borderColor='var(--amber)'"
          onblur="this.style.borderColor='transparent'"
          onchange="matData[${idx}].source=this.value">
          ${matSources.map(s => `<option${m.source===s?' selected':''}>${s}</option>`).join('')}
        </select>
      </td>
      <td style="font-size:11px;width:115px;border-right:1px solid var(--border-d);">
        <input class="vi-sm" value="${m.company||''}" placeholder="—"
          style="font-size:10px;border-color:transparent;background:transparent;padding:2px 4px;width:100%;"
          onfocus="this.style.borderColor='var(--amber)';this.style.background='#fff'"
          onblur="this.style.borderColor='transparent';this.style.background='transparent';matData[${idx}].company=this.value">
      </td>
      <td style="text-align:center;width:110px;">
        <span style="font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:600;color:var(--tp);"
              title="Sum of task allocations + unassigned">${totalQty.toFixed(2)}</span>
        <span style="font-size:9px;color:var(--td);margin-left:2px;">${m.unit}</span>
      </td>
      <td style="text-align:center;width:115px;border-right:${hasTasks?'2px solid var(--border-d)':'none'};">
        <div style="display:flex;align-items:center;justify-content:center;gap:3px;">
          <input type="number" value="${unassignedQty}" min="0" step="0.01" class="vi-sm"
            style="width:46px;text-align:center;font-family:'JetBrains Mono',monospace;font-size:10px;padding:2px 3px;${unassignedColor}border-color:transparent;background:transparent;"
            onfocus="this.style.borderColor='var(--amber)';this.style.background='#fff'"
            onblur="this.style.borderColor='transparent';this.style.background='transparent'"
            onchange="matData[${idx}].unassignedQty=parseFloat(this.value)||0;renderMat()">
          <select class="vs-sm" style="font-size:9px;border-color:transparent;background:transparent;padding:1px 2px;max-width:55px;"
            onfocus="this.style.borderColor='var(--amber)'"
            onblur="this.style.borderColor='transparent'"
            onchange="matData[${idx}].unit=this.value;renderMat()">
            ${matUnits.map(u => `<option${m.unit===u?' selected':''}>${u}</option>`).join('')}
          </select>
        </div>
      </td>
      ${taskCells}
    </tr>`;
  }).join('');

  // ── Quick add-row at bottom ──
  rows += `<tr style="background:var(--hover);border-bottom:1px solid var(--border);">
    <td style="width:28px;"></td>
    <td colspan="${4 + matAppliedTasks.length}" style="padding:5px 8px;">
      <button onclick="openAddMaterial()" style="display:inline-flex;align-items:center;gap:5px;font-size:11px;color:var(--tm);background:none;border:1px dashed var(--border);border-radius:5px;padding:4px 12px;cursor:pointer;font-family:inherit;transition:all .12s;"
              onmouseenter="this.style.borderColor='var(--amber)';this.style.color='var(--amber)'"
              onmouseleave="this.style.borderColor='var(--border)';this.style.color='var(--tm)'">
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2v8M2 6h8"/></svg>
        Add material…
      </button>
    </td>
  </tr>`;

  tb.innerHTML = rows;
  updateMatStats();
}

/* ═══════════════════════════════════════════════════════════════
   OPEN ADD MATERIAL
   ═══════════════════════════════════════════════════════════════ */
function openAddMaterial() {
  selectedMaterials = [];
  openMo('add-material');
  setTimeout(renderAddMatModal, 30);
}

/* ═══════════════════════════════════════════════════════════════
   LEGACY COMPAT (used by quickentry, quickfill)
   ═══════════════════════════════════════════════════════════════ */
function addMatRow(name, qty, unit, company) {
  const cat = materialCatalogue.find(c => c.name === name);
  const tq  = {};
  matAppliedTasks.forEach(t => { tq[t.code] = 0; });
  matData.push({ id: matIdC++, name: name||'', matId: cat?cat.id:'', source: 'Site Diary', company: company||'', unassignedQty: qty||0, unit: unit||'m³', taskQty: tq });
  renderMat();
  updStats();
}

function removeMatRow(idx) {
  matData.splice(idx, 1);
  renderMat();
  updStats();
  showToast('Material removed');
}

/* ═══════════════════════════════════════════════════════════════
   STATS + WARNING BANNER
   ═══════════════════════════════════════════════════════════════ */
function updateMatStats() {
  const el = id => document.getElementById(id);

  const unassignedCount = matData.filter(m => {
    const allocated = matAppliedTasks.reduce((s, t) => s + ((m.taskQty||{})[t.code]||0), 0);
    return matAppliedTasks.length > 0 && (m.unassignedQty||0) > 0 && allocated === 0;
  }).length;

  if (el('mat-stat-count'))      el('mat-stat-count').textContent = matData.length;
  if (el('mat-count'))           el('mat-count').textContent = matData.length;
  if (el('mat-stat-unassigned')) {
    el('mat-stat-unassigned').textContent = unassignedCount;
    el('mat-stat-unassigned').style.color = unassignedCount > 0 ? 'var(--amber)' : 'var(--tp)';
  }
  const banner = el('mat-warning-banner');
  if (banner) banner.style.display = unassignedCount > 0 ? 'flex' : 'none';
  if (el('ss-mat')) {
    el('ss-mat').textContent  = matData.length + ' item' + (matData.length !== 1 ? 's' : '');
    el('ss-mat').className    = 'sstat ' + (matData.length ? 'done' : 'empty');
  }
}

function cancelMatEdit() { renderMat(); }
function saveMatData()   { renderMat(); showToast('Materials saved'); }
