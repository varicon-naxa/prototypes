/* ═══════════════════════════════════════════════════════════════
   Varicon SiteDiary — Plant & Equipment (Improved)
   ═══════════════════════════════════════════════════════════════ */

/* ─── State ─── */
// plantData declared in core.js
let standDownData = [];
let standDownIdC = 0;
let plantActiveTab = 'operating';
let sdViewMode2 = 'list'; // list or grid for stand down tab

/* ─── Sample dropdown data ─── */
const plantOperators = ['—', 'John Smith', 'Mike Johnson', 'Tom Brown', 'Alex Chen', 'Sarah Williams'];
const plantSuppliers = ['—', '11', 'Acme Civil', 'BuildCo', 'Metro Hire', 'Site Diary'];

/* ─── Attachment catalogue ─── */
const attachmentCatalogue = [
  { id:'ATT-001', name:'Bucket' },
  { id:'ATT-002', name:'Ripper' },
  { id:'ATT-003', name:'ATT-003' },
  { id:'ATT-004', name:'Bobcat20t' },
  { id:'ATT-005', name:'Hydraulic Hammer' },
  { id:'ATT-006', name:'Compactor Plate' },
  { id:'ATT-007', name:'Auger' },
  { id:'ATT-008', name:'Tilt Bucket' },
];

/* ─── Attachment dropdown state ─── */
let plantAttDropIdx = -1;

/* ─── Sample project equipment catalogue ─── */
const equipmentCatalogue = [
  { id:'PWG-110', name:'107 Devion (649861)', type:'Excavator', hireOptions:['Dry Hire'] },
  { id:'E60',     name:'Bobcat E50',          type:'Bucket Attachment', hireOptions:['Wet Hire','Dry Hire'] },
  { id:'EQ-003',  name:'Bobcat S650',         type:'Motor Grader', hireOptions:['Wet Hire','Dry Hire'] },
  { id:'EQ-B08-002', name:'Bobcat E770',      type:'Skid Steer Loader', hireOptions:['Dry Hire'] },
  { id:'T590',    name:'Bobcat T590',         type:'Bobcat', hireOptions:['Dry Hire'] },
  { id:'EQ-006',  name:'55T Excavator',       type:'Excavator', hireOptions:['Wet Hire'] },
  { id:'EQ-007',  name:'Motor Grader',        type:'Grader', hireOptions:['Wet Hire'] },
  { id:'EQ-008',  name:'Backhoe Loader',      type:'Loader', hireOptions:['Dry Hire'] },
  { id:'EQ-009',  name:'Compactor',           type:'Compactor', hireOptions:['Dry Hire'] },
  { id:'EQ-010',  name:'Dump Truck',          type:'Truck', hireOptions:['Wet Hire','Dry Hire'] },
];

/* ─── Recent Equipment (prototype: last-used IDs) ─── */
const recentEquipIds = ['EQ-006', 'EQ-007', 'EQ-008', 'T590', 'EQ-010'];

function renderRecentEquip() {
  let strip = document.getElementById('recent-equip-strip');
  if (!strip) {
    const opTab = document.getElementById('pe-operating-tab');
    if (!opTab) return;
    strip = document.createElement('div');
    strip.id = 'recent-equip-strip';
    strip.style.cssText = 'display:flex;align-items:center;flex-wrap:wrap;gap:7px;margin-bottom:14px;';
    opTab.insertBefore(strip, opTab.firstChild);
  }
  const wrench = `<svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M13.5 2.5a3 3 0 0 0-4.1 4.1L2 14l.6.6 7.4-7.4a3 3 0 0 0 3.5-4.7z"/></svg>`;
  const chips = recentEquipIds.map(id => {
    const eq = equipmentCatalogue.find(e => e.id === id);
    if (!eq) return '';
    const added = plantData.some(p => p.eqId === id);
    return `<button
      onclick="quickAddEquip('${id}')"
      ${added ? 'disabled' : ''}
      style="display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:20px;
        border:1px solid ${added ? '#BBF7D0' : 'var(--border)'};
        background:${added ? '#F0FDF4' : '#fff'};
        color:${added ? '#059669' : 'var(--tb)'};
        font-size:12px;font-weight:500;cursor:${added ? 'default' : 'pointer'};
        transition:background .15s,border-color .15s;white-space:nowrap;"
      onmouseenter="if(!this.disabled){this.style.background='var(--hover)';this.style.borderColor='var(--border-d)'}"
      onmouseleave="if(!this.disabled){this.style.background='#fff';this.style.borderColor='var(--border)'}"
    >${added ? `<svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M2 6l3 3 5-5"/></svg>` : wrench}${eq.name}</button>`;
  }).join('');
  strip.innerHTML = `<span style="font-size:12px;color:var(--tm);font-weight:500;white-space:nowrap;flex-shrink:0;">Recent Equipment — click to add quickly:</span>${chips}`;
}

function quickAddEquip(eqId) {
  const eq = equipmentCatalogue.find(e => e.id === eqId);
  if (!eq) return;
  if (plantData.some(p => p.eqId === eqId)) { showToast(eq.name + ' already added', 'info'); return; }
  const taskHours = {};
  if (typeof appliedTasks !== 'undefined') appliedTasks.forEach(t => { taskHours[t.code] = 0; });
  plantData.push({
    id: plantIdC++, name: eq.name, hire: eq.hireOptions[0], op: '', task: '',
    start: '07:00', end: '15:00', brk: 0.5, sd: false,
    supplier: '', attachments: '', eqId: eq.id, taskHours: taskHours,
    unassignedMins: 0
  });
  renderPlant(); updStats();
  showToast(eq.name + ' added');
}

/* ═══════════════════════════════════════════════════════════════
   TAB SWITCHING
   ═══════════════════════════════════════════════════════════════ */
function switchPlantTab(tab) {
  plantActiveTab = tab;
  document.getElementById('pe-tab-op').className = 'pe-tab' + (tab === 'operating' ? ' pe-tab-active' : '');
  document.getElementById('pe-tab-sd').className = 'pe-tab' + (tab === 'standdown' ? ' pe-tab-active' : '');
  document.getElementById('pe-operating-tab').style.display = tab === 'operating' ? '' : 'none';
  document.getElementById('pe-standdown-tab').style.display = tab === 'standdown' ? '' : 'none';
}

function setSdViewMode(mode) {
  sdViewMode2 = mode;
  document.getElementById('sd-view-list').style.color = mode === 'list' ? 'var(--amber)' : 'var(--tm)';
  document.getElementById('sd-view-grid').style.color = mode === 'grid' ? 'var(--amber)' : 'var(--tm)';
  renderStandDown();
}

/* ═══════════════════════════════════════════════════════════════
   OPERATING TAB — RENDER (always inline-editable, no edit mode)
   ═══════════════════════════════════════════════════════════════ */
function renderPlant() {
  renderRecentEquip();
  const tb = document.getElementById('plant-tbody');
  const thead = document.getElementById('plant-thead');
  if (!tb) return;
  const q = (document.getElementById('plant-search')?.value || '').toLowerCase();
  const tasks = (typeof appliedTasks !== 'undefined') ? appliedTasks : [];
  const hasTasks = tasks.length > 0;
  const totalCols = 7 + tasks.length;

  const filtered = plantData.filter(p =>
    !q || p.name.toLowerCase().includes(q) || (p.hire||'').toLowerCase().includes(q) || (p.op||'').toLowerCase().includes(q)
  );

  // ── Dynamic table header ──
  if (thead) {
    const parents = {};
    tasks.forEach(t => {
      const key = t.parent || t.code;
      if (!parents[key]) parents[key] = { name: t.parent || t.name, children: [] };
      parents[key].children.push(t);
    });

    const TH1 = 'background:var(--thead);color:var(--tb);font-size:11px;font-weight:600;padding:10px 14px;white-space:nowrap;border-right:1px solid var(--border-d);';
    const TH2 = 'background:var(--thead);color:var(--tb);font-size:11px;font-weight:600;padding:9px 14px;white-space:nowrap;border-right:1px solid var(--border-d);';

    let headerRow1 = `<th rowspan="2" style="width:32px;${TH1}border-right:1px solid var(--border-d);"></th>
      <th colspan="4" style="${TH1}text-align:left;border-right:2px solid var(--border-d);">Equipment Description</th>
      <th rowspan="2" style="${TH1}text-align:center;width:96px;">Equip.<br><span style="font-size:10px;font-weight:400;color:var(--tm);">Duration</span></th>
      <th rowspan="2" style="${TH1}text-align:center;width:110px;">Unassigned<br><span style="font-size:10px;font-weight:400;color:var(--tm);">Duration</span></th>`;

    Object.values(parents).forEach(g => {
      headerRow1 += `<th colspan="${g.children.length}" style="${TH1}text-align:center;border-left:2px solid var(--border-d);padding:6px 8px;color:var(--tp);">${g.name}</th>`;
    });

    let headerRow2 = `
      <th style="${TH2}text-align:left;min-width:180px;">Equipment</th>
      <th style="${TH2}width:140px;">Source / Operator</th>
      <th style="${TH2}width:140px;">Company / Supplier</th>
      <th style="${TH2}width:200px;border-right:2px solid var(--border-d);">Attachments</th>`;

    tasks.forEach(t => {
      headerRow2 += `<th style="${TH2}text-align:center;border-left:1px solid var(--border);min-width:70px;padding:6px 4px;position:relative;color:var(--tm);" title="(${t.code}) ${t.name}">
        <span style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:80px;margin:auto;">(${t.code}) ${t.name.length > 12 ? t.name.substring(0,12)+'…' : t.name}</span>
        <button onclick="removeAppliedTask('${t.code}')" style="position:absolute;top:3px;right:3px;background:none;border:none;cursor:pointer;color:var(--td);font-size:9px;line-height:1;padding:0;" title="Remove" onmouseenter="this.style.color='var(--red)'" onmouseleave="this.style.color='var(--td)'">✕</button>
      </th>`;
    });

    thead.innerHTML = `<tr>${headerRow1}</tr><tr>${headerRow2}</tr>`;
  }

  // ── Empty state ──
  if (!plantData.length) {
    tb.innerHTML = `<tr><td colspan="${totalCols}" style="text-align:center;padding:36px 20px;">
      <svg width="36" height="36" viewBox="0 0 40 40" fill="none" stroke="var(--border-d)" stroke-width="1.2" style="margin-bottom:8px;"><circle cx="20" cy="20" r="16"/><circle cx="20" cy="20" r="5"/><path d="M20 4v5M20 31v5M4 20h5M31 20h5"/></svg>
      <div style="color:var(--tm);font-size:13px;margin-bottom:3px;">No entries for this date.</div>
      <div style="color:var(--td);font-size:11px;margin-bottom:14px;">Add equipment or tasks to get started.</div>
      <div style="display:flex;gap:6px;justify-content:center;">
        <button class="btn btn-a btn-sm" style="gap:3px;" onclick="openMo('add-equipment')">
          <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="white" stroke-width="2"><path d="M6 2v8M2 6h8"/></svg> ADD EQUIPMENT
        </button>
        <button class="btn btn-o btn-sm" style="gap:3px;" onclick="openMo('task')">
          <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2v8M2 6h8"/></svg> ADD TASKS
        </button>
      </div>
    </td></tr>`;
    updatePlantStats();
    return;
  }

  if (!filtered.length && q) {
    tb.innerHTML = `<tr><td colspan="${totalCols}" style="text-align:center;padding:20px;color:var(--tm);font-size:12px;">No equipment matches "${q}"</td></tr>`;
    updatePlantStats();
    return;
  }

  // ── Data rows (always editable inline) ──
  tb.innerHTML = filtered.map((p, fi) => {
    const idx = plantData.indexOf(p);
    if (!p.taskHours) p.taskHours = {};

    // Equipment Duration = sum of all task allocations + unassigned duration
    // If no tasks applied, user fills Equip Duration directly (stored as unassigned)
    const allocatedMins = tasks.reduce((sum, t) => sum + (p.taskHours[t.code] || 0), 0);
    const unassignedMins = p.unassignedMins || 0;
    const totalMins = hasTasks ? (allocatedMins + unassignedMins) : unassignedMins;

    // Equip Duration display (computed summary when tasks exist)
    const eqDurStr = Math.floor(totalMins / 60) + 'h ' + (totalMins % 60) + 'm';
    const unassignedStr = Math.floor(unassignedMins / 60) + 'h ' + (unassignedMins % 60) + 'm';

    const taskCells = tasks.map(t => {
      const val = p.taskHours[t.code] || 0;
      const hasVal = val > 0;
      return `<td style="text-align:center;border-left:1px solid var(--border);padding:4px 3px;background:${hasVal?'#FFFDF5':''};">
        <div style="display:flex;align-items:center;justify-content:center;gap:2px;">
          <input type="number" value="${val}" min="0" step="15" class="vi-sm"
            style="width:44px;text-align:center;font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:${hasVal?'600':'400'};color:${hasVal?'var(--tp)':'var(--td)'};padding:3px 4px;border:1px solid transparent;border-radius:4px;background:transparent;outline:none;"
            onfocus="this.style.borderColor='var(--amber)';this.style.background='#fff';this.style.color='var(--tp)'"
            onblur="this.style.borderColor='transparent';this.style.background='transparent'"
            onchange="setTaskHours(${idx},'${t.code}',parseInt(this.value)||0);renderPlant()">
          <button class="ibtn" onclick="openTimePopup(${idx},'${t.code}')" style="padding:2px;color:var(--td);opacity:.5;flex-shrink:0;" title="Quick set"
            onmouseenter="this.style.opacity='1';this.style.color='var(--amber)'" onmouseleave="this.style.opacity='.5';this.style.color='var(--td)'">
            <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="7" cy="7" r="5.5"/><path d="M7 4.5v2.5l2 1.5"/></svg>
          </button>
        </div>
      </td>`;
    }).join('');

    const hireOpts = equipmentCatalogue.find(e => e.name === p.name)?.hireOptions || ['Wet Hire','Dry Hire'];
    const opOpts   = plantOperators.map(o => `<option value="${o}"${p.op===o||(!p.op&&o==='—')?' selected':''}>${o}</option>`).join('');
    const supOpts  = plantSuppliers.map(o => `<option value="${o}"${p.supplier===o||(!p.supplier&&o==='—')?' selected':''}>${o}</option>`).join('');
    const attSel   = p.selectedAttachments || [];
    const attCount = attSel.length;
    const attLabel = attCount > 0 ? `${attCount} attachment${attCount>1?'s':''} selected` : 'Select attachments...';

    const selectStyle = `width:100%;height:32px;font-size:12px;border:1px solid var(--border);border-radius:4px;padding:0 7px;background:#fff;color:var(--tb);cursor:pointer;outline:none;`;

    return `<tr class="pe-row" style="border-bottom:1px solid var(--border);transition:background .1s;"
      onmouseenter="this.style.background='var(--hover)';this.querySelector('.pe-row-rm').style.opacity='1'"
      onmouseleave="this.style.background='';this.querySelector('.pe-row-rm').style.opacity='0'">
      <td style="width:32px;text-align:center;padding:0 4px;border-right:1px solid var(--border);">
        <button class="pe-row-rm" onclick="removePlantRow(${idx})" title="Remove row"
          style="opacity:0;transition:opacity .15s;background:none;border:none;cursor:pointer;color:var(--td);padding:4px;border-radius:3px;"
          onmouseenter="this.style.color='var(--red)'" onmouseleave="this.style.color='var(--td)'">
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 3l6 6M9 3l-6 6"/></svg>
        </button>
      </td>
      <td style="padding:10px 14px;min-width:180px;">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:5px;">
          <span style="font-size:10px;font-weight:600;color:#fff;background:#374151;border-radius:3px;padding:1px 5px;letter-spacing:.02em;flex-shrink:0;">${p.eqId || 'EQ'}</span>
          <span style="font-size:13px;font-weight:600;color:var(--tp);line-height:1.3;">${p.name}</span>
        </div>
        <div style="display:flex;align-items:center;gap:12px;">
          ${hireOpts.map(opt => `<label style="display:flex;align-items:center;gap:4px;font-size:11px;color:var(--tm);cursor:pointer;user-select:none;">
            <input type="radio" name="hire-${idx}" value="${opt}" ${p.hire===opt?'checked':''}
              onchange="plantData[${idx}].hire=this.value"
              style="accent-color:var(--amber);width:12px;height:12px;cursor:pointer;">
            <span style="font-weight:${p.hire===opt?'600':'400'};color:${p.hire===opt?'var(--tp)':'var(--tm)'};">${opt}</span>
          </label>`).join('')}
        </div>
      </td>
      <td style="padding:8px 12px;border-right:1px solid var(--border);">
        <select style="${selectStyle}" onfocus="this.style.borderColor='var(--amber)';this.style.boxShadow='0 0 0 3px rgba(245,166,35,.1)'" onblur="this.style.borderColor='var(--border)';this.style.boxShadow='none'" onchange="plantData[${idx}].op=this.value">
          ${opOpts}
        </select>
      </td>
      <td style="padding:8px 12px;border-right:2px solid var(--border-d);">
        <select style="${selectStyle}" onfocus="this.style.borderColor='var(--amber)';this.style.boxShadow='0 0 0 3px rgba(245,166,35,.1)'" onblur="this.style.borderColor='var(--border)';this.style.boxShadow='none'" onchange="plantData[${idx}].supplier=this.value">
          ${supOpts}
        </select>
      </td>
      <td style="padding:8px 12px;border-right:2px solid var(--border-d);min-width:210px;">
        <div id="att-trigger-${idx}" onclick="event.stopPropagation();plantOpenAttDrop(${idx},this)"
          style="height:32px;border:1px solid var(--border);border-radius:4px;padding:0 10px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;background:#fff;gap:6px;user-select:none;margin-bottom:${attCount>0?'8px':'0'};">
          <span style="font-size:12px;color:${attCount>0?'var(--tb)':'var(--tm)'};">${attLabel}</span>
          <div style="display:flex;align-items:center;gap:4px;flex-shrink:0;">
            ${attCount>0?`<button onclick="event.stopPropagation();plantClearAtt(${idx})" style="background:none;border:none;cursor:pointer;color:var(--td);font-size:15px;line-height:1;padding:0 1px;" onmouseenter="this.style.color='var(--red)'" onmouseleave="this.style.color='var(--td)'">&times;</button>`:''}
            <svg id="att-chev-${idx}" width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="var(--tm)" stroke-width="2"><path d="M2 4l4 4 4-4"/></svg>
          </div>
        </div>
        <div id="att-card-${idx}">${_plantRenderAttCard(idx, p)}</div>
      </td>
      <td style="text-align:center;padding:10px 8px;border-right:1px solid var(--border);">
        <span style="font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:700;color:${totalMins>0?'var(--tp)':'var(--td)'};"
          title="${hasTasks?'Sum of all task durations + unassigned':'Set via Unassigned Duration'}">${eqDurStr}</span>
      </td>
      <td style="text-align:center;padding:8px 8px;">
        <div style="display:flex;align-items:center;justify-content:center;gap:2px;">
          <input type="number" value="${unassignedMins}" min="0" step="15" class="vi-sm"
            style="width:48px;text-align:center;font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:${unassignedMins>0?'600':'400'};color:${unassignedMins>0?'var(--tp)':'var(--td)'};padding:3px 4px;border:1px solid transparent;border-radius:4px;background:transparent;outline:none;"
            onfocus="this.style.borderColor='var(--amber)';this.style.background='#fff';this.style.color='var(--tp)'"
            onblur="this.style.borderColor='transparent';this.style.background='transparent'"
            onchange="plantData[${idx}].unassignedMins=parseInt(this.value)||0;renderPlant()">
          <button class="ibtn" onclick="openTimePopup(${idx},'__unassigned')" style="padding:2px;color:var(--td);opacity:.5;flex-shrink:0;" title="Quick set"
            onmouseenter="this.style.opacity='1';this.style.color='var(--amber)'" onmouseleave="this.style.opacity='.5';this.style.color='var(--td)'">
            <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="7" cy="7" r="5.5"/><path d="M7 4.5v2.5l2 1.5"/></svg>
          </button>
        </div>
      </td>
      ${taskCells}
    </tr>`;
  }).join('');

  // ── Always show add-row at bottom ──
  const availEquip = equipmentCatalogue.filter(eq => !plantData.some(p => p.name === eq.name));
  if (availEquip.length) {
    tb.innerHTML += `<tr style="background:var(--hover);border-bottom:1px solid var(--border);">
      <td style="width:32px;border-right:1px solid var(--border);"></td>
      <td colspan="${5 + tasks.length}" style="padding:9px 14px;">
        <div style="display:flex;align-items:center;gap:8px;">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="var(--tm)" stroke-width="1.8" style="flex-shrink:0;"><path d="M6 2v8M2 6h8"/></svg>
          <select style="font-size:12px;width:300px;color:var(--tm);border:1px solid var(--border);border-radius:4px;padding:5px 8px;background:#fff;outline:none;cursor:pointer;"
            onfocus="this.style.borderColor='var(--amber)'" onblur="this.style.borderColor='var(--border)'"
            onchange="addEquipFromInline(this)">
            <option value="">Select equipment to add…</option>
            ${availEquip.map(eq => `<option value="${eq.name}">(${eq.id}) ${eq.name} — ${eq.type}</option>`).join('')}
          </select>
        </div>
      </td>
    </tr>`;
  }

  updatePlantStats();
  const footer = document.getElementById('pe-op-footer');
  if (footer) footer.style.display = plantData.length ? 'flex' : 'none';
}

/* ── Task hour helpers ── */
function setTaskHours(plantIdx, taskCode, mins) {
  if (!plantData[plantIdx].taskHours) plantData[plantIdx].taskHours = {};
  plantData[plantIdx].taskHours[taskCode] = mins;
}

function openTimePopup(plantIdx, taskCode) {
  const current = taskCode === '__unassigned'
    ? (plantData[plantIdx].unassignedMins || 0)
    : ((plantData[plantIdx].taskHours || {})[taskCode] || 0);
  const presets = [0, 15, 30, 60, 120, 240, 480];
  const labels = ['0', '15m', '30m', '1h', '2h', '4h', '8h'];
  const existing = document.getElementById('time-popup');
  if (existing) existing.remove();
  const popup = document.createElement('div');
  popup.id = 'time-popup';
  popup.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;border:1px solid var(--border);border-radius:6px;box-shadow:0 4px 16px rgba(0,0,0,.15);z-index:9999;min-width:220px;animation:ttFadeIn .1s ease;';
  popup.innerHTML = `<div style="padding:8px 10px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;">
    <span style="font-size:11px;font-weight:600;color:var(--tp);">Quick Duration</span>
    <button onclick="document.getElementById('time-popup').remove()" style="background:none;border:none;cursor:pointer;color:var(--tm);font-size:13px;">✕</button>
  </div>
  <div style="display:flex;flex-wrap:wrap;gap:4px;padding:10px;">
    ${presets.map((m, i) => `<button onclick="${taskCode === '__unassigned' ? `plantData[${plantIdx}].unassignedMins=${m}` : `setTaskHours(${plantIdx},'${taskCode}',${m})`};renderPlant();document.getElementById('time-popup').remove()" style="flex:1;min-width:40px;height:28px;border-radius:4px;border:1px solid ${m===current?'var(--amber)':'var(--border)'};background:${m===current?'var(--amber)':'#fff'};color:${m===current?'#fff':'var(--tb)'};font-size:11px;font-weight:500;font-family:'JetBrains Mono',monospace;cursor:pointer;transition:all .1s;">${labels[i]}</button>`).join('')}
  </div>`;
  document.body.appendChild(popup);
  setTimeout(() => document.addEventListener('click', function _cl(e) {
    if (!popup.contains(e.target)) { popup.remove(); document.removeEventListener('click', _cl); }
  }), 10);
}

function updatePlantDuration(idx, val) {
  // Equipment Duration is now computed — no direct editing needed
  // This function kept for backward compatibility
  renderPlant();
}

function removePlantRow(idx) {
  plantData.splice(idx, 1);
  renderPlant();
  updStats();
  showToast('Equipment removed');
}

function addEquipFromInline(sel) {
  if (!sel.value) return;
  const cat = equipmentCatalogue.find(eq => eq.name === sel.value);
  addPlantRow(sel.value, cat ? cat.hireOptions[0] : 'Dry Hire', '', '', false);
  if (cat) plantData[plantData.length - 1].eqId = cat.id;
  sel.value = '';
}

function togPlantEdit() { renderPlant(); }
function togglePlantColumns() { showToast('Column toggle coming soon', 'info'); }
function cancelPlantEdit() { renderPlant(); }
function savePlantData() { renderPlant(); showToast('Equipment data saved'); }

function updatePlantStats() {
  const opCount = plantData.filter(p => !p.sd).length;
  const sdCount = standDownData.length;
  const tasks = (typeof appliedTasks !== 'undefined') ? appliedTasks : [];

  // Total hours = sum of each equipment's total minutes (task allocations + unassigned)
  const totalMins = plantData.reduce((s, p) => {
    const allocatedMins = tasks.reduce((sum, t) => sum + ((p.taskHours || {})[t.code] || 0), 0);
    const unassigned = p.unassignedMins || 0;
    return s + allocatedMins + unassigned;
  }, 0);

  const el = id => document.getElementById(id);
  if (el('pe-stat-equip')) el('pe-stat-equip').textContent = plantData.length + standDownData.length;
  if (el('pe-stat-op')) el('pe-stat-op').textContent = opCount;
  if (el('pe-stat-sd')) el('pe-stat-sd').textContent = sdCount;
  if (el('pe-stat-hrs')) el('pe-stat-hrs').textContent = Math.floor(totalMins / 60) + 'h ' + String(totalMins % 60).padStart(2, '0') + 'm';
}

/* ═══════════════════════════════════════════════════════════════
   OPERATING — ADD EQUIPMENT (from old panel & quick chips)
   ═══════════════════════════════════════════════════════════════ */
function addPlantRow(name, hire, op, task, sd) {
  const cat = equipmentCatalogue.find(eq => eq.name === name);
  const taskHours = {};
  if (typeof appliedTasks !== 'undefined') appliedTasks.forEach(t => { taskHours[t.code] = 0; });
  plantData.push({
    id: plantIdC++, name: name, hire: hire || 'Dry Hire', op: op || '',
    task: task || '', start: '07:00', end: '15:00', brk: 0.5, sd: sd || false,
    supplier: '', eqId: cat ? cat.id : 'EQ-' + plantIdC,
    selectedAttachments: [], attachmentMode: 'simple',
    taskHours: taskHours, unassignedMins: 0
  });
  renderPlant(); updStats();
}

function qEquip(el, name, hire) {
  el.classList.add('sel');
  addPlantRow(name, hire);
  showToast(name + ' added');
}

/* ═══════════════════════════════════════════════════════════════
   EQUIPMENT ATTACHMENTS — Multi-select floating dropdown
   ═══════════════════════════════════════════════════════════════ */

function plantOpenAttDrop(idx, trigger) {
  // Toggle closed if same row clicked again
  if (plantAttDropIdx === idx) {
    _plantSetTriggerState(idx, false);
    plantAttDropIdx = -1;
    const dd = document.getElementById('plant-att-dropdown');
    if (dd) dd.style.display = 'none';
    return;
  }
  // Close any previously open dropdown
  if (plantAttDropIdx !== -1) _plantSetTriggerState(plantAttDropIdx, false);
  plantAttDropIdx = idx;

  const dd = document.getElementById('plant-att-dropdown');
  if (!dd || !trigger) return;

  _plantRenderAttDrop(idx);
  _plantSetTriggerState(idx, true, trigger);

  const rect = trigger.getBoundingClientRect();
  dd.style.top    = (rect.bottom + 3) + 'px';
  dd.style.left   = rect.left + 'px';
  dd.style.width  = Math.max(rect.width, 300) + 'px';
  dd.style.display = 'block';
}

function plantCloseAttDrop() {
  if (plantAttDropIdx !== -1) _plantSetTriggerState(plantAttDropIdx, false);
  plantAttDropIdx = -1;
  const dd = document.getElementById('plant-att-dropdown');
  if (dd) dd.style.display = 'none';
}

function _plantSetTriggerState(idx, open, triggerEl) {
  const t = triggerEl || document.getElementById('att-trigger-' + idx);
  if (!t) return;
  t.style.borderColor = open ? 'var(--amber)' : 'var(--border)';
  t.style.boxShadow   = open ? '0 0 0 3px rgba(245,166,35,0.12)' : 'none';
  const chev = t.querySelector('svg:last-child');
  if (chev) chev.style.transform = open ? 'rotate(180deg)' : 'rotate(0deg)';
}

/* Inline card — selected items shown below trigger always */
function _plantRenderAttCard(idx, p) {
  const data   = p || plantData[idx];
  if (!data) return '';
  const sel    = data.selectedAttachments || [];
  const hasDur = (data.attachmentMode || 'simple') === 'duration';
  if (!sel.length) return '';

  let rows = sel.map((s, si) => `
    <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-bottom:1px solid var(--border);background:#fff;">
      <button onclick="event.stopPropagation();plantRemoveAtt(${idx},${si})"
        style="background:none;border:none;cursor:pointer;color:var(--td);padding:0;line-height:0;flex-shrink:0;"
        onmouseenter="this.style.color='var(--tp)'" onmouseleave="this.style.color='var(--td)'">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 3l8 8M11 3l-8 8"/></svg>
      </button>
      <span style="font-size:13px;color:var(--tb);flex:1;font-weight:500;">${s.name}</span>
      ${hasDur ? `
        <input type="number" value="${s.duration||0}" min="0" placeholder="Duration"
          onclick="event.stopPropagation()"
          onchange="plantData[${idx}].selectedAttachments[${si}].duration=parseInt(this.value)||0"
          style="width:80px;height:32px;border:1px solid var(--border);border-radius:6px;font-size:13px;padding:0 10px;outline:none;color:var(--tb);background:#fff;"
          onfocus="this.style.borderColor='var(--amber)'" onblur="this.style.borderColor='var(--border)'">
        <select onclick="event.stopPropagation()"
          onchange="plantData[${idx}].selectedAttachments[${si}].unit=this.value"
          style="height:32px;border:1px solid var(--border);border-radius:6px;font-size:13px;padding:0 8px;background:#fff;cursor:pointer;outline:none;color:var(--tb);"
          onfocus="this.style.borderColor='var(--amber)'" onblur="this.style.borderColor='var(--border)'">
          <option value="Hour"  ${!s.unit||s.unit==='Hour'?'selected':''}>Hour</option>
          <option value="Day"   ${s.unit==='Day'?'selected':''}>Day</option>
          <option value="Week"  ${s.unit==='Week'?'selected':''}>Week</option>
          <option value="Month" ${s.unit==='Month'?'selected':''}>Month</option>
        </select>` : ''}
    </div>`).join('');

  // Duration mode toggle at bottom
  rows += `<div style="padding:7px 12px;display:flex;align-items:center;gap:6px;background:var(--hover);">
    <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:11px;color:var(--tm);user-select:none;">
      <input type="checkbox" ${hasDur?'checked':''} onclick="event.stopPropagation()" onchange="plantToggleAttMode(${idx})"
        style="accent-color:var(--amber);width:13px;height:13px;cursor:pointer;">
      Duration per attachment
    </label>
  </div>`;

  return `<div style="border:1px solid var(--border);border-radius:6px;overflow:hidden;">${rows}</div>`;
}

/* Checkbox dropdown — shown floating when trigger clicked */
function _plantRenderAttDrop(idx) {
  const dd = document.getElementById('plant-att-dropdown');
  const p  = plantData[idx];
  if (!p || !dd) return;
  const sel = p.selectedAttachments || [];
  const allChecked = sel.length === attachmentCatalogue.length;
  const anyChecked = sel.length > 0;

  // Custom checkbox SVG
  const chk = (checked) => checked
    ? `<span style="width:20px;height:20px;border-radius:4px;background:var(--amber);border:2px solid var(--amber);display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;">
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="white" stroke-width="2.2"><path d="M2 6l3 3 5-5"/></svg>
       </span>`
    : `<span style="width:20px;height:20px;border-radius:4px;background:#fff;border:2px solid #CBD5E1;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;"></span>`;

  let html = `
    <div onclick="event.stopPropagation();plantToggleSelectAll(${idx})"
      style="display:flex;align-items:center;gap:12px;padding:12px 14px;border-bottom:1px solid var(--border);cursor:pointer;"
      onmouseenter="this.style.background='var(--hover)'" onmouseleave="this.style.background=''">
      ${chk(allChecked)}
      <span style="font-size:13px;font-weight:500;color:var(--tb);">Select All</span>
    </div>`;

  attachmentCatalogue.forEach(a => {
    const checked = sel.some(s => s.id === a.id);
    html += `
    <div onclick="event.stopPropagation();plantToggleAtt(${idx},'${a.id}','${a.name.replace(/'/g,"\\'")}')"
      style="display:flex;align-items:center;gap:12px;padding:12px 14px;border-bottom:1px solid var(--border);cursor:pointer;"
      onmouseenter="this.style.background='var(--hover)'" onmouseleave="this.style.background=''">
      ${chk(checked)}
      <span style="font-size:13px;color:var(--tb);">${a.name}</span>
    </div>`;
  });

  dd.innerHTML = html;
}

function plantToggleAtt(idx, id, name) {
  if (!plantData[idx]) return;
  if (!plantData[idx].selectedAttachments) plantData[idx].selectedAttachments = [];
  const existing = plantData[idx].selectedAttachments.findIndex(s => s.id === id);
  if (existing !== -1) {
    plantData[idx].selectedAttachments.splice(existing, 1);
  } else {
    plantData[idx].selectedAttachments.push({ id, name, duration: 0, unit: 'Hour' });
  }
  _plantRenderAttDrop(idx);
  _plantUpdateAttTrigger(idx);
}

function plantToggleSelectAll(idx) {
  if (!plantData[idx]) return;
  const sel = plantData[idx].selectedAttachments || [];
  if (sel.length === attachmentCatalogue.length) {
    // All selected — deselect all
    plantData[idx].selectedAttachments = [];
  } else {
    // Not all selected — select all
    plantData[idx].selectedAttachments = attachmentCatalogue.map(a => ({
      id: a.id, name: a.name, duration: 0, unit: 'Hour'
    }));
  }
  _plantRenderAttDrop(idx);
  _plantUpdateAttTrigger(idx);
}

function plantAddAtt(idx, id, name) {
  if (!plantData[idx]) return;
  if (!plantData[idx].selectedAttachments) plantData[idx].selectedAttachments = [];
  if (plantData[idx].selectedAttachments.some(s => s.id === id)) return;
  plantData[idx].selectedAttachments.push({ id, name, duration: 0, unit: 'Hour' });
  _plantRenderAttDrop(idx);
  _plantUpdateAttTrigger(idx);
}

function plantRemoveAtt(idx, si) {
  if (!plantData[idx]?.selectedAttachments) return;
  plantData[idx].selectedAttachments.splice(si, 1);
  if (plantAttDropIdx === idx) _plantRenderAttDrop(idx);
  _plantUpdateAttTrigger(idx);
}

function plantClearAtt(idx) {
  if (!plantData[idx]) return;
  plantData[idx].selectedAttachments = [];
  if (plantAttDropIdx === idx) _plantRenderAttDrop(idx);
  _plantUpdateAttTrigger(idx);
}

function plantToggleAttMode(idx) {
  if (!plantData[idx]) return;
  plantData[idx].attachmentMode = (plantData[idx].attachmentMode === 'duration') ? 'simple' : 'duration';
  _plantUpdateAttTrigger(idx);
  if (plantAttDropIdx === idx) _plantRenderAttDrop(idx);
}

function _plantUpdateAttTrigger(idx) {
  const trigger = document.getElementById('att-trigger-' + idx);
  const card    = document.getElementById('att-card-' + idx);
  if (!trigger) return;
  const p      = plantData[idx];
  if (!p) return;
  const sel    = p.selectedAttachments || [];
  const count  = sel.length;
  const label  = count > 0 ? `${count} selected` : 'Select attachments...';
  const isOpen = plantAttDropIdx === idx;
  trigger.innerHTML = `
    <span style="font-size:12px;color:${count>0?'var(--tb)':'var(--tm)'};">${label}</span>
    <div style="display:flex;align-items:center;gap:5px;flex-shrink:0;">
      ${count>0?`<button onclick="event.stopPropagation();plantClearAtt(${idx})" style="background:none;border:none;cursor:pointer;color:var(--tm);font-size:15px;line-height:1;padding:0;" title="Clear all" onmouseenter="this.style.color='var(--red)'" onmouseleave="this.style.color='var(--tm)'">&times;</button>`:''}
      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="var(--tm)" stroke-width="1.5" style="transition:transform .15s;transform:${isOpen?'rotate(180deg)':'rotate(0deg)'}"><path d="M2 4l4 4 4-4"/></svg>
    </div>`;
  trigger.style.borderColor = isOpen ? 'var(--amber)' : 'var(--border)';
  trigger.style.boxShadow   = isOpen ? '0 0 0 3px rgba(245,166,35,0.12)' : 'none';
  // Update the trigger cell's margin to account for card presence
  trigger.style.marginBottom = count > 0 ? '8px' : '0';
  // Re-render the inline card
  if (card) card.innerHTML = _plantRenderAttCard(idx, p);
}

/* close on outside click — use capture phase so we see it before any re-render */
document.addEventListener('click', function(e) {
  const dd = document.getElementById('plant-att-dropdown');
  if (!dd || dd.style.display === 'none') return;
  if (dd.contains(e.target)) return; // click inside dropdown — keep open
  const trigger = document.getElementById('att-trigger-' + plantAttDropIdx);
  if (trigger && trigger.contains(e.target)) return; // click on trigger — handled by onclick
  plantCloseAttDrop();
}, true);

/* ═══════════════════════════════════════════════════════════════
   ADD EQUIPMENT MODAL (split-panel)
   ═══════════════════════════════════════════════════════════════ */
let selectedEquipment = []; // items selected in the add-equipment modal

function renderAddEquipModal() {
  const listEl = document.getElementById('aeq-list');
  const selEl = document.getElementById('aeq-selected-list');
  const countEl = document.getElementById('aeq-sel-count');
  const q = (document.getElementById('aeq-search')?.value || '').toLowerCase();
  if (!listEl) return;

  const filtered = equipmentCatalogue.filter(eq =>
    !q || eq.name.toLowerCase().includes(q) || eq.type.toLowerCase().includes(q) || eq.id.toLowerCase().includes(q)
  );

  listEl.innerHTML = filtered.map(eq => {
    const isSel = selectedEquipment.some(s => s.id === eq.id);
    const hireLabel = eq.hireOptions.length > 1
      ? `<span style="color:var(--green);font-size:11px;font-weight:500;">${eq.hireOptions.join('/')}</span>`
      : `<span style="font-size:11px;color:var(--tb);">${eq.hireOptions[0]}</span>`;
    return `<label style="display:flex;align-items:flex-start;gap:10px;padding:10px 14px;border-bottom:1px solid var(--border);cursor:pointer;transition:background .1s;"
                   onmouseenter="this.style.background='var(--hover)'" onmouseleave="this.style.background=''">
      <input type="checkbox" ${isSel ? 'checked' : ''} onchange="toggleEquipSelect('${eq.id}')" style="accent-color:var(--amber);margin-top:3px;width:16px;height:16px;flex-shrink:0;">
      <div style="flex:1;min-width:0;">
        <div style="font-size:13px;font-weight:600;color:var(--tp);">${eq.name}</div>
        <div style="font-size:11px;color:var(--tm);">${eq.type} · ID ${eq.id}</div>
      </div>
      <div style="flex-shrink:0;">${hireLabel}</div>
    </label>`;
  }).join('');

  // Selected panel
  if (countEl) countEl.textContent = selectedEquipment.length;

  if (!selEl) return;
  if (!selectedEquipment.length) {
    selEl.innerHTML = '<div style="text-align:center;color:var(--tm);font-size:12px;padding:30px 0;">No items selected</div>';
    return;
  }

  selEl.innerHTML = selectedEquipment.map(s => {
    const eq = equipmentCatalogue.find(e => e.id === s.id);
    const hasMulti = eq && eq.hireOptions.length > 1;
    return `<div style="padding:10px 14px;border-bottom:1px solid var(--border);">
      <div style="display:flex;align-items:flex-start;gap:8px;">
        <div style="flex:1;min-width:0;">
          <div style="font-size:13px;font-weight:600;color:var(--tp);">${s.name}</div>
          <div style="font-size:11px;color:var(--tm);">${eq ? eq.type : ''} · ID ${s.id}</div>
        </div>
        <button class="ibtn" onclick="removeEquipSelect('${s.id}')" style="color:var(--tm);padding:2px;" title="Remove">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 3l6 6M9 3l-6 6"/></svg>
        </button>
      </div>
      ${hasMulti ? `<div style="display:flex;gap:12px;margin-top:8px;">
        ${eq.hireOptions.map(opt => `<label style="display:flex;align-items:center;gap:4px;font-size:11px;color:var(--tb);cursor:pointer;">
          <input type="radio" name="hire-${s.id}" value="${opt}" ${s.hire === opt ? 'checked' : ''} onchange="updateEquipHire('${s.id}','${opt}')" style="accent-color:var(--amber);">
          ${opt}
        </label>`).join('')}
      </div>` : `<div style="font-size:11px;color:var(--tm);margin-top:4px;">${s.hire}</div>`}
    </div>`;
  }).join('');
}

function toggleEquipSelect(eqId) {
  const idx = selectedEquipment.findIndex(s => s.id === eqId);
  if (idx >= 0) {
    selectedEquipment.splice(idx, 1);
  } else {
    const eq = equipmentCatalogue.find(e => e.id === eqId);
    if (eq) selectedEquipment.push({ id: eq.id, name: eq.name, hire: eq.hireOptions[0] });
  }
  renderAddEquipModal();
}

function removeEquipSelect(eqId) {
  selectedEquipment = selectedEquipment.filter(s => s.id !== eqId);
  renderAddEquipModal();
}

function updateEquipHire(eqId, hire) {
  const s = selectedEquipment.find(s => s.id === eqId);
  if (s) s.hire = hire;
}

function clearEquipSelect() {
  selectedEquipment = [];
  renderAddEquipModal();
}

function selectAllEquip() {
  const q = (document.getElementById('aeq-search')?.value || '').toLowerCase();
  const filtered = equipmentCatalogue.filter(eq =>
    !q || eq.name.toLowerCase().includes(q) || eq.type.toLowerCase().includes(q)
  );
  filtered.forEach(eq => {
    if (!selectedEquipment.some(s => s.id === eq.id)) {
      selectedEquipment.push({ id: eq.id, name: eq.name, hire: eq.hireOptions[0] });
    }
  });
  renderAddEquipModal();
}

function confirmAddEquipment() {
  if (!selectedEquipment.length) { showToast('Please select equipment', 'error'); return; }
  selectedEquipment.forEach(s => {
    if (!plantData.some(p => p.eqId === s.id)) {
      const taskHours = {};
      if (typeof appliedTasks !== 'undefined') appliedTasks.forEach(t => { taskHours[t.code] = 0; });
      plantData.push({
        id: plantIdC++, name: s.name, hire: s.hire, op: '', task: '',
        start: '07:00', end: '15:00', brk: 0.5, sd: false,
        supplier: '', attachments: '', eqId: s.id, taskHours: taskHours,
        unassignedMins: 0
      });
    }
  });
  selectedEquipment = [];
  renderPlant(); updStats(); closeMo();
  showToast(selectedEquipment.length > 1 ? 'Equipment added' : 'Equipment added');
}

/* ═══════════════════════════════════════════════════════════════
   LOG STAND DOWN MODAL
   ═══════════════════════════════════════════════════════════════ */
let sdSelectedEquip = [];

function renderLogStandDownModal() {
  const listEl = document.getElementById('lsd-equip-list');
  const countEl = document.getElementById('lsd-sel-count');
  const q = (document.getElementById('lsd-search')?.value || '').toLowerCase();
  if (!listEl) return;

  // Only show equipment that's currently in plantData (project equipment)
  const projEquip = plantData.length ? plantData : equipmentCatalogue.slice(0, 5).map(e => ({ name: e.name, eqId: e.id, hire: e.hireOptions[0] }));
  const filtered = projEquip.filter(p =>
    !q || p.name.toLowerCase().includes(q)
  );

  listEl.innerHTML = filtered.map(p => {
    const isSel = sdSelectedEquip.includes(p.eqId || p.name);
    return `<label style="display:flex;align-items:flex-start;gap:10px;padding:10px 14px;border-bottom:1px solid var(--border);cursor:pointer;transition:background .1s;"
                   onmouseenter="this.style.background='var(--hover)'" onmouseleave="this.style.background=''">
      <input type="checkbox" ${isSel ? 'checked' : ''} onchange="toggleSdEquip('${p.eqId || p.name}')" style="accent-color:var(--amber);margin-top:3px;width:16px;height:16px;flex-shrink:0;">
      <div style="flex:1;">
        <div style="font-size:13px;font-weight:600;color:var(--tp);">${p.name}</div>
        <div style="font-size:11px;color:var(--tm);">${p.supplier || 'Project Equipment'}</div>
      </div>
      <span style="font-size:11px;color:${p.hire === 'Wet Hire' ? 'var(--green)' : 'var(--tb)'};">${p.hire || 'Dry Hire'}</span>
    </label>`;
  }).join('');

  if (countEl) countEl.textContent = sdSelectedEquip.length;
}

function toggleSdEquip(id) {
  const idx = sdSelectedEquip.indexOf(id);
  if (idx >= 0) sdSelectedEquip.splice(idx, 1);
  else sdSelectedEquip.push(id);
  renderLogStandDownModal();
}

function confirmLogStandDown() {
  const reason = document.getElementById('lsd-reason')?.value;
  if (!sdSelectedEquip.length) { showToast('Please select equipment', 'error'); return; }
  if (!reason) { showToast('Please select a reason', 'error'); return; }

  sdSelectedEquip.forEach(eqId => {
    const p = plantData.find(x => (x.eqId || x.name) === eqId) || equipmentCatalogue.find(x => x.id === eqId);
    if (p) {
      standDownData.push({
        id: standDownIdC++,
        name: p.name,
        eqId: eqId,
        hire: p.hire || p.hireOptions?.[0] || 'Dry Hire',
        supplier: p.supplier || '',
        reason: reason,
        specificReason: document.getElementById('lsd-specific')?.value || '',
        createdBy: 'Anu Praz',
        email: 'anu.prazapti@varicon.com.au',
        date: fmtDate(sdDate)
      });
    }
  });

  sdSelectedEquip = [];
  renderStandDown();
  updatePlantStats();
  updStats();
  closeMo();
  showToast('Stand down logged');
}

/* ═══════════════════════════════════════════════════════════════
   STAND DOWN TAB — RENDER
   ═══════════════════════════════════════════════════════════════ */
function renderStandDown() {
  const tb = document.getElementById('sd-tbody');
  if (!tb) return;

  if (!standDownData.length) {
    tb.innerHTML = `<tr id="sd-empty">
      <td colspan="7" style="text-align:center;padding:40px 20px;">
        <div style="color:var(--tm);font-size:13px;margin-bottom:4px;">No stand down records.</div>
        <div style="color:var(--td);font-size:12px;margin-bottom:16px;">Log a stand down to record equipment not in use.</div>
        <button class="btn btn-o btn-sm" style="gap:4px;color:var(--amber);border-color:var(--amber);" onclick="openMo('log-standdown')">
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2v8M2 6h8"/></svg> LOG STAND DOWN
        </button>
      </td>
    </tr>`;
    return;
  }

  tb.innerHTML = standDownData.map((sd, i) => `<tr style="border-bottom:1px solid var(--border);">
    <td style="font-size:12px;font-weight:500;">${sd.name}<br><span style="font-size:10px;color:var(--tm);">${sd.eqId}</span></td>
    <td style="font-size:12px;"><span${sd.hire.includes('Wet') ? ' style="color:var(--green);font-weight:500;"' : ''}>${sd.hire}</span></td>
    <td style="font-size:12px;color:var(--tb);">${sd.supplier || '—'}</td>
    <td style="font-size:12px;color:var(--tb);">${sd.reason}</td>
    <td style="font-size:12px;color:var(--td);">${sd.specificReason || '—'}</td>
    <td style="font-size:12px;">
      <div style="font-weight:500;color:var(--tp);">${sd.createdBy}</div>
      <div style="font-size:10px;color:var(--tm);">${sd.email || ''}</div>
    </td>
    <td style="text-align:center;">
      <div style="display:flex;gap:4px;justify-content:center;">
        <button class="ibtn" onclick="editStandDown(${i})" title="Edit" style="color:var(--blue);padding:3px;">
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M10 2l2 2-7 7H3v-2l7-7z"/></svg>
        </button>
        <button class="ibtn" onclick="deleteStandDown(${i})" title="Delete" style="color:var(--red);padding:3px;">
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M2.5 3.5h9M5.5 3.5V2.5h3v1M3.5 3.5v8a1 1 0 001 1h5a1 1 0 001-1v-8"/></svg>
        </button>
      </div>
    </td>
  </tr>`).join('');

  const footer = document.getElementById('pe-sd-footer');
  if (footer) footer.style.display = standDownData.length ? 'flex' : 'none';
}

function editStandDown(i) {
  showToast('Edit stand down — open Log Stand Down modal', 'info');
}

function deleteStandDown(i) {
  standDownData.splice(i, 1);
  renderStandDown();
  updatePlantStats();
  updStats();
  showToast('Stand down record removed');
}

/* ═══════════════════════════════════════════════════════════════
   OLD PANEL COMPATIBILITY
   ═══════════════════════════════════════════════════════════════ */
function addEquipFromPanel() {
  const name = document.getElementById('eq-sel').value;
  if (!name) { showToast('Please select equipment', 'error'); return; }
  addPlantRow(
    name,
    document.getElementById('eq-hire').value,
    document.getElementById('eq-op').value,
    document.getElementById('eq-task').value,
    document.getElementById('eq-sd').value === 'Yes'
  );
  closeEquipPanel();
  showToast(name + ' added');
}
