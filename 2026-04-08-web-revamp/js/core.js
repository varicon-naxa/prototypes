/* ═══════════════════════════════════════════════════════════════
   Varicon SiteDiary — Core (State, Navigation, UI Utilities)
   ═══════════════════════════════════════════════════════════════ */

/* ─── Global State ─── */
let currentPage = 'site-diary';
let sdDate = new Date(2026, 3, 2);
let plantData = [], labourData = [], notes = [], photos = [];
let matData = [], delData = [], miscData = [];
let selectedTasks = [];
let plantIdC = 0, labourIdC = 0, noteIdC = 0, photoIdC = 0;
let matIdC = 0, delIdC = 0, miscIdC = 0;
let uploadFileList = [];

/* ─── Page Navigation ─── */
function goPage(p) {
  document.querySelectorAll('.vp').forEach(el => el.classList.remove('on'));
  document.querySelectorAll('.snv').forEach(el => el.classList.remove('on'));

  const isProject = ['site-diary', 'file-manager'].includes(p);
  const isFormsPage = ['forms', 'form-response', 'assigned-forms', 'form-submissions', 'form-templates', 'form-detail'].includes(p);
  document.getElementById('hdr-proj').style.display = (p === 'projects') ? 'flex' : 'none';
  document.getElementById('hdr-job').style.display = isProject ? '' : 'none';

  if (isFormsPage || p === 'manage-notes') {
    document.getElementById('hdr-proj').style.display = 'none';
    document.getElementById('hdr-job').style.display = 'none';
  }

  const map = {
    'projects': 'pg-proj', 'site-diary': 'pg-sd', 'file-manager': 'pg-fm',
    'forms': 'pg-forms', 'form-response': 'pg-form-response',
    'assigned-forms': 'pg-assigned-forms', 'form-submissions': 'pg-form-submissions',
    'form-templates': 'pg-form-templates', 'form-detail': 'pg-form-detail',
    'manage-notes': 'pg-manage-notes'
  };
  const pgId = map[p];
  if (pgId) document.getElementById(pgId).classList.add('on');

  // Sidebar active states
  if (p === 'projects') document.getElementById('nav-projects').classList.add('on');
  if (p === 'file-manager') document.getElementById('nav-fm').classList.add('on');
  if (['forms', 'form-response', 'assigned-forms', 'form-submissions', 'form-templates', 'form-detail'].includes(p)) {
    const nf = document.getElementById('nav-forms');
    const fs = document.getElementById('fsub');
    const fc = document.getElementById('fchev');
    if (nf) nf.classList.add('on');
    if (fs) fs.classList.add('open');
    if (fc) fc.style.transform = 'rotate(180deg)';
    // Highlight correct sub-nav item
    document.querySelectorAll('#fsub .snv').forEach(el => el.classList.remove('on'));
    const subMap = {
      'forms': 'nav-forms-assigned', 'form-response': 'nav-forms-assigned', 'form-detail': 'nav-forms-assigned',
      'assigned-forms': 'nav-forms-assigned',
      'form-submissions': 'nav-forms-submissions',
      'form-templates': 'nav-forms-templates'
    };
    const subEl = document.getElementById(subMap[p]);
    if (subEl) subEl.classList.add('on');
  }

  // Tab active states
  document.querySelectorAll('.tnv').forEach(t => t.classList.remove('on'));
  if (p === 'site-diary') document.getElementById('tab-sd').classList.add('on');
  if (p === 'file-manager') document.getElementById('tab-fm').classList.add('on');

  currentPage = p;
  closeDd();
}

/* ─── Sidebar Toggle ─── */
function toggleSidebar() {
  document.body.classList.toggle('sbc');
  const ic = document.getElementById('sb-cicon');
  ic.style.transform = document.body.classList.contains('sbc') ? 'rotate(180deg)' : '';
}

function toggleFormsMenu() {
  const s = document.getElementById('fsub'), c = document.getElementById('fchev');
  s.classList.toggle('open');
  c.style.transform = s.classList.contains('open') ? 'rotate(180deg)' : '';
}

/* ─── Sub-tabs ─── */
function swStab(el) {
  el.parentElement.querySelectorAll('.stab').forEach(t => t.classList.remove('on'));
  el.classList.add('on');
}

/* ─── Dropdown ─── */
function toggleDd(id) {
  closeDd();
  const d = document.getElementById(id);
  d.style.display = d.style.display === 'none' ? 'block' : 'none';
}
function closeDd() {
  document.querySelectorAll('.vdd').forEach(d => d.style.display = 'none');
}
document.addEventListener('click', e => {
  if (!e.target.closest('.vdd') && !e.target.closest('[onclick*="toggleDd"]')) closeDd();
});

/* ─── Modal ─── */
function openMo(id) {
  document.getElementById('mo-' + id).style.display = 'flex';
  if (id === 'export') {
    var d = new Date(), pad = n => String(n).padStart(2,'0');
    var el = document.getElementById('mo-export-date');
    if (el) el.value = d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate());
  }
  if (id === 'add-equipment' && typeof renderAddEquipModal === 'function') {
    selectedEquipment = [];
    renderAddEquipModal();
  }
  if (id === 'log-standdown' && typeof renderLogStandDownModal === 'function') {
    sdSelectedEquip = [];
    renderLogStandDownModal();
  }
  if (id === 'add-material' && typeof renderAddMatModal === 'function') {
    selectedMaterials = [];
    renderAddMatModal();
  }
  if (id === 'add-misc' && typeof renderAddMiscModal === 'function') {
    selectedMiscItems = [];
    renderAddMiscModal();
  }
}
function closeMo() {
  document.querySelectorAll('.mo').forEach(m => m.style.display = 'none');
  uploadFileList = [];
  const pl = document.getElementById('upload-preview-list');
  if (pl) pl.innerHTML = '';
}
function showHelp() { openMo('help'); }

/* ─── Slide Panels ─── */
function openEquipPanel() {
  document.getElementById('equip-panel').classList.add('open');
  document.getElementById('equip-overlay').classList.add('open');
}
function closeEquipPanel() {
  document.getElementById('equip-panel').classList.remove('open');
  document.getElementById('equip-overlay').classList.remove('open');
}
function openAuditPanel() {
  document.getElementById('audit-panel').classList.add('open');
  document.getElementById('audit-overlay').classList.add('open');
}
function closeAuditPanel() {
  document.getElementById('audit-panel').classList.remove('open');
  document.getElementById('audit-overlay').classList.remove('open');
}

/* ─── Toast Notifications ─── */
function showToast(msg, type = 'success') {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  const bg = type === 'success' ? '#065F46' : type === 'error' ? '#991B1B' : '#1A2332';
  const bgLight = type === 'success' ? '#D1FAE5' : type === 'error' ? '#FEE2E2' : '#F4F5F7';
  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
  const label = type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Info';
  const borderColor = type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#E5E7EB';
  t.innerHTML = `<div style="background:${bgLight};border:1px solid ${borderColor};border-radius:8px;padding:10px 14px;display:flex;align-items:center;gap:8px;box-shadow:0 4px 12px rgba(0,0,0,.12);pointer-events:auto;min-width:240px;">
    <span style="font-size:14px;">${icon}</span>
    <div style="flex:1;"><div style="font-size:12px;font-weight:600;color:${bg};">${label}</div><div style="font-size:11px;color:${bg};opacity:.8;margin-top:1px;">${msg}</div></div>
    <button onclick="this.closest('div').parentElement.remove()" style="background:none;border:none;cursor:pointer;color:${bg};font-size:14px;opacity:.5;">✕</button>
  </div>`;
  c.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; setTimeout(() => t.remove(), 300); }, 3500);
}

/* ─── Date Helpers ─── */
function fmtDate(d) {
  return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
}
function changeDate(d) {
  sdDate.setDate(sdDate.getDate() + d);
  document.getElementById('sd-date').textContent = fmtDate(sdDate);
}
function calcHrs(s, e, brk) {
  const [sh, sm] = s.split(':').map(Number), [eh, em] = e.split(':').map(Number);
  return Math.max(0, (eh + em / 60) - (sh + sm / 60) - (brk || 0));
}

/* ─── Section Toggle ─── */
function togSec(el) {
  el.classList.toggle('open');
  const b = el.nextElementSibling;
  b.classList.toggle('dn');
  const c = el.querySelector('.chev');
  if (c) c.classList.toggle('open');

  // Trigger section render when opening
  if (el.classList.contains('open')) {
    const sec = el.parentElement;
    if (!sec) return;
    if (sec.id === 'sec-materials' && typeof renderMat === 'function')   renderMat();
    if (sec.id === 'sec-misc'      && typeof renderMisc === 'function')  renderMisc();
    if (sec.id === 'sec-plant'     && typeof renderPlant === 'function') renderPlant();
  }
}

/* ─── Tile Jump ─── */
function jumpTile(el, secId) {
  document.querySelectorAll('.sd-tile').forEach(t => t.classList.remove('act'));
  el.classList.add('act');
  const sec = document.getElementById(secId);
  const head = sec.querySelector('.sec-head');
  if (!head.classList.contains('open')) togSec(head);
  sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ─── SD View: Tab / Single Page ─── */
var sdViewMode = 'tab';
var sdActiveSection = 'sec-photos';
var sdAllSections = ['sec-photos','sec-notes','sec-weather','sec-plant','sec-labour','sec-timecard','sec-materials','sec-delivery','sec-misc','sec-forms'];
var sdTileMap = {
  'sec-weather':'tile-wx','sec-labour':'tile-labour','sec-plant':'tile-plant',
  'sec-notes':'tile-notes','sec-photos':'tile-photos','sec-timecard':'tile-tc',
  'sec-materials':'tile-mat','sec-delivery':'tile-del','sec-misc':'tile-misc','sec-forms':'tile-forms'
};

function setSdView(mode) {
  sdViewMode = mode;
  var btnTab = document.getElementById('btn-tab-view');
  var btnSingle = document.getElementById('btn-single-page');
  if (btnTab) {
    btnTab.className = 'btn ' + (mode === 'tab' ? 'btn-a' : 'btn-o');
    btnSingle.className = 'btn ' + (mode === 'single' ? 'btn-a' : 'btn-o');
    btnTab.style.cssText = 'height:28px;padding:0 11px;font-size:12px;border-radius:0;border:none;';
    btnSingle.style.cssText = 'height:28px;padding:0 11px;font-size:12px;border-radius:0;border:none;border-left:1px solid var(--border);';
  }
  var stack = document.getElementById('sd-sections-stack');
  if (stack) {
    stack.setAttribute('data-sd-view', mode === 'tab' ? 'tab' : 'single');
  }
  if (mode === 'tab') {
    sdShowTab(sdActiveSection);
  } else {
    sdAllSections.forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.classList.remove('sd-tab-active');
    });
    document.querySelectorAll('.sd-tile').forEach(function(t) { t.classList.remove('act'); });
  }
}

function sdTileClick(el, secId) {
  if (sdViewMode === 'single') {
    jumpTile(el, secId);
    return;
  }
  sdActiveSection = secId;
  sdShowTab(secId);
}

function sdShowTab(sectionId) {
  var stack = document.getElementById('sd-sections-stack');
  if (stack) {
    stack.setAttribute('data-sd-view', 'tab');
    stack.classList.remove('sd-sections-init-pending');
  }
  sdAllSections.forEach(function(id) {
    var el = document.getElementById(id);
    if (el) {
      el.classList.toggle('sd-tab-active', id === sectionId);
      el.style.display = '';
    }
  });
  document.querySelectorAll('.sd-tile').forEach(function(t) { t.classList.remove('act'); });
  var tileId = sdTileMap[sectionId];
  if (tileId) { var ti = document.getElementById(tileId); if (ti) ti.classList.add('act'); }
  sdActiveSection = sectionId;

  var autoExpand = ['sec-materials', 'sec-misc'];
  if (autoExpand.indexOf(sectionId) !== -1) {
    var sec = document.getElementById(sectionId);
    if (sec) {
      var head = sec.querySelector('.sec-head');
      if (head && !head.classList.contains('open')) togSec(head);
    }
  }
}

function openExportPreview() {
  var r = document.querySelector('input[name="export-preview-type"]:checked');
  var single = r && r.value === 'single';
  window.open(single ? 'pages/single_site_diary.html' : 'pages/site_diary_multiday_report.html');
}

function doExport() {
  var fmt = document.querySelector('input[name="export-fmt"]:checked');
  var fmtVal = fmt ? fmt.value : 'excel';
  closeMo();
  if (fmtVal === 'excel') {
    var a = document.createElement('a');
    a.href = 'Site_Diary_MultiDay_With_Data.xlsx';
    a.download = 'Site_Diary_MultiDay_With_Data.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('Downloading Excel file\u2026');
  } else if (fmtVal === 'both') {
   
    showToast('Downloading Zip\u2026');
  } else {
    showToast('Exporting as PDF\u2026');
  }
}

