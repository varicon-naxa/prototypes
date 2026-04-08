/* ═══════════════════════════════════════════════════════════════
   Varicon SiteDiary — Task / Cost Centre Selector
   ═══════════════════════════════════════════════════════════════ */

/* Applied tasks become dynamic columns in the Plant & Equipment table */
let appliedTasks = []; // { code, name, parent } — persisted after modal closes

/* Which section opened the task modal — 'plant' | 'materials' | null */
let taskModalContext = 'plant';

function toggleTaskSel(chk, code, name, parent) {
  if (chk.checked) {
    selectedTasks.push({ code: code, name: name, parent: parent || '' });
  } else {
    selectedTasks = selectedTasks.filter(t => t.code !== code);
  }
  renderTaskSel();
}

function renderTaskSel() {
  document.getElementById('task-sel-count').textContent = '(' + selectedTasks.length + ')';
  const c = document.getElementById('task-sel-list');
  if (!selectedTasks.length) {
    c.innerHTML = '<div style="text-align:center;color:var(--tm);font-size:12px;padding:20px 0;">No items selected</div>';
    return;
  }
  c.innerHTML = selectedTasks.map((t, i) => `<div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--border);">
    <div style="flex:1;"><div style="font-size:13px;font-weight:600;">(${t.code}) ${t.name}</div></div>
    <button class="rm-btn" onclick="selectedTasks.splice(${i},1);renderTaskSel();">✕</button>
  </div>`).join('');
}

function clearTaskSel() {
  selectedTasks = [];
  renderTaskSel();
  document.querySelectorAll('#mo-task input[type=checkbox]').forEach(c => c.checked = false);
}

function applyTasks() {
  // Route to the correct section based on context
  if (taskModalContext === 'materials') {
    if (typeof applyMatTasks === 'function') applyMatTasks();
    return;
  }

  if (taskModalContext === 'timecard') {
    if (typeof applyTcTasks === 'function') applyTcTasks();
    return;
  }

  // Default: Plant & Equipment context
  selectedTasks.forEach(t => {
    if (!appliedTasks.some(a => a.code === t.code)) {
      appliedTasks.push({ code: t.code, name: t.name, parent: t.parent || '' });
    }
  });

  // Initialize taskHours for existing equipment rows
  plantData.forEach(p => {
    if (!p.taskHours) p.taskHours = {};
    appliedTasks.forEach(t => {
      if (!(t.code in p.taskHours)) p.taskHours[t.code] = 0;
    });
  });

  renderPlant();
  showToast(selectedTasks.length + ' task(s) applied as columns');
}

function removeAppliedTask(code) {
  appliedTasks = appliedTasks.filter(t => t.code !== code);
  // Clean taskHours from equipment
  plantData.forEach(p => { if (p.taskHours) delete p.taskHours[code]; });
  renderPlant();
  showToast('Task column removed');
}
