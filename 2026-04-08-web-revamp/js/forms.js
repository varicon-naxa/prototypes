/* ═══════════════════════════════════════════════════════════════
   Varicon SiteDiary — Forms Module
   ═══════════════════════════════════════════════════════════════ */

/* ─── Form Data ─── */
const FORM_TEMPLATES = [
  { id: 'F1', name: 'Pre Start with Equip with Photo', category: 'Pre-Start', status: 'Active', createdBy: 'Admin', modified: '02/04/2026', responses: 24, fields: ['Equipment','Meter','Photo'] },
  { id: 'F2', name: 'Daily Plant Pre-start', category: 'Pre-Start', status: 'Active', createdBy: 'Admin', modified: '01/04/2026', responses: 56, fields: ['Equipment','Operator','Condition Check','Comments'] },
  { id: 'F3', name: 'Confidential Medical Questionnaire', category: 'Safety', status: 'Active', createdBy: 'Admin', modified: '28/03/2026', responses: 12, fields: ['Employee Name','Medical History','Declaration'] },
  { id: 'F4', name: 'Bumper Pre Start with Equip with P...', category: 'Pre-Start', status: 'Active', createdBy: 'Admin', modified: '25/03/2026', responses: 38, fields: ['Equipment','Photo','Checklist'] },
  { id: 'F5', name: 'Copy of Radio/Checkbox', category: 'General', status: 'Draft', createdBy: 'Anu Praz', modified: '20/03/2026', responses: 0, fields: ['Radio Options','Checkbox Options'] },
  { id: 'F6', name: 'Toolbox Talk Record', category: 'Safety', status: 'Active', createdBy: 'Admin', modified: '18/03/2026', responses: 31, fields: ['Topic','Attendees','Signature'] },
  { id: 'F7', name: 'Site Induction Form', category: 'Induction', status: 'Active', createdBy: 'Admin', modified: '15/03/2026', responses: 67, fields: ['Name','Company','PPE Check','Acknowledgement'] },
];

const FORM_SUBMISSIONS = [
  { id: 'FS1', formName: 'Pre Start with Equip with Photo', subId: 'SUB-001', submittedBy: 'John Smith', date: '04/04/2026', status: 'Submitted', assignedTo: 'Anu Praz' },
  { id: 'FS2', formName: 'Daily Plant Pre-start', subId: 'SUB-002', submittedBy: 'Mike Johnson', date: '04/04/2026', status: 'Submitted', assignedTo: 'Anu Praz' },
  { id: 'FS3', formName: 'Toolbox Talk Record', subId: 'SUB-003', submittedBy: 'Sarah Williams', date: '03/04/2026', status: 'Reviewed', assignedTo: 'Admin' },
  { id: 'FS4', formName: 'Pre Start with Equip with Photo', subId: 'SUB-004', submittedBy: 'Tom Brown', date: '03/04/2026', status: 'Submitted', assignedTo: 'Anu Praz' },
  { id: 'FS5', formName: 'Site Induction Form', subId: 'SUB-005', submittedBy: 'Alex Chen', date: '02/04/2026', status: 'Reviewed', assignedTo: 'Admin' },
];

const ASSIGNED_FORMS = [
  { id: 'AF1', formName: 'Pre Start with Equip with Photo', assignedBy: 'Admin', assignedDate: '04/04/2026', dueDate: '05/04/2026', status: 'Pending' },
  { id: 'AF2', formName: 'Daily Plant Pre-start', assignedBy: 'Admin', assignedDate: '04/04/2026', dueDate: '04/04/2026', status: 'Overdue' },
  { id: 'AF3', formName: 'Toolbox Talk Record', assignedBy: 'Admin', assignedDate: '03/04/2026', dueDate: '06/04/2026', status: 'Pending' },
];

/* ─── Category badge helper ─── */
function catBdg(cat) {
  if (cat === 'Pre-Start') return 'bdg-a';
  if (cat === 'Safety') return 'bdg-r';
  if (cat === 'Induction') return 'bdg-b';
  return 'bdg-gray';
}

/* ─── Status badge helper ─── */
function stsBdg(sts) {
  if (sts === 'Active' || sts === 'Reviewed' || sts === 'Completed') return 'bdg-g';
  if (sts === 'Draft') return 'bdg-b';
  if (sts === 'Pending' || sts === 'Submitted') return 'bdg-a';
  if (sts === 'Overdue') return 'bdg-r';
  return 'bdg-gray';
}

/* ─── Avatar initials ─── */
function avInit(name) {
  return name.split(' ').map(x => x[0]).join('').toUpperCase();
}

/* ─── Open form response modal ─── */
function openFormResponseModal(formId) {
  const f = FORM_TEMPLATES.find(x => x.id === formId) || FORM_TEMPLATES[0];
  const mo = document.getElementById('mo-form-fill');
  if (!mo) return;
  document.getElementById('form-fill-title').textContent = f.name;
  const container = document.getElementById('form-fill-fields');
  container.innerHTML = f.fields.map(field => `
    <div class="f-field">
      <label>${field} *</label>
      ${field === 'Photo' ? `<div class="photo-attach" onclick="showToast('Photo upload opened')">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="3" width="14" height="10" rx="1"/><circle cx="5.5" cy="6.5" r="1.5"/><path d="M1 10l3.5-3 3 2.5L10 7l5 5"/></svg>
          Add photo of ${f.fields[0] || 'item'}
        </div>`
        : field.includes('Check') || field.includes('Declaration') || field.includes('Acknowledgement')
          ? `<div style="display:flex;align-items:center;gap:8px;"><input type="checkbox"><span style="font-size:13px;color:var(--tb);">I confirm this ${field.toLowerCase()}</span></div>`
          : field.includes('Attendees') || field.includes('Signature')
            ? `<textarea class="vi" rows="3" placeholder="Enter ${field.toLowerCase()}..."></textarea>`
            : field === 'Equipment'
              ? `<select class="vs" style="width:100%;height:40px;font-size:13px;">
                  <option>Select equipment…</option>
                  <option>4440 Boston Dozer</option>
                  <option>55T Excavator</option>
                  <option>Motor Grader</option>
                  <option>Backhoe Loader</option>
                  <option>Dump Truck</option>
                </select>`
              : field === 'Operator'
                ? `<select class="vs" style="width:100%;height:40px;font-size:13px;">
                    <option>Select operator…</option>
                    <option>John Smith</option>
                    <option>Mike Johnson</option>
                    <option>Sarah Williams</option>
                  </select>`
                : field === 'Meter'
                  ? `<input class="vi" type="number" placeholder="Enter current meter reading" style="height:40px;">
                     <div class="f-hint">Enter current meter reading</div>`
                  : `<input class="vi" placeholder="Enter ${field.toLowerCase()}..." style="height:40px;">`
      }
    </div>
  `).join('');
  mo.style.display = 'flex';
}

function closeFormFill() {
  const mo = document.getElementById('mo-form-fill');
  if (mo) mo.style.display = 'none';
}

function submitFormFill() {
  showToast('Form submitted successfully!');
  closeFormFill();
  goPage('form-submissions');
}

/* ─── Filter forms search ─── */
function filterFormsTable(query) {
  const rows = document.querySelectorAll('#forms-table-body tr');
  const q = query.toLowerCase();
  rows.forEach(r => {
    r.style.display = r.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
}

function filterFormsByCategory(cat) {
  const rows = document.querySelectorAll('#forms-table-body tr');
  rows.forEach(r => {
    if (cat === 'all') { r.style.display = ''; return; }
    const badge = r.querySelector('.bdg');
    r.style.display = (badge && badge.textContent.trim() === cat) ? '' : 'none';
  });
}

/* ─── Star Toggle ─── */
function toggleStar(el) {
  const isFilled = el.getAttribute('fill') !== 'none';
  if (isFilled) {
    el.setAttribute('fill', 'none');
    el.setAttribute('stroke', '#D1D5DB');
  } else {
    el.setAttribute('fill', '#F5A623');
    el.setAttribute('stroke', '#F5A623');
  }
}

/* ─── Assigned Forms tab switching ─── */
function switchAfTab(tab, el) {
  // Switch tab styling
  document.getElementById('af-tab-assigned').style.borderBottomColor = 'transparent';
  document.getElementById('af-tab-assigned').style.color = 'var(--tm)';
  document.getElementById('af-tab-my').style.borderBottomColor = 'transparent';
  document.getElementById('af-tab-my').style.color = 'var(--tm)';
  el.style.borderBottomColor = 'var(--amber)';
  el.style.color = 'var(--tp)';

  // Switch panels
  document.getElementById('af-panel-assigned').style.display = tab === 'assigned' ? '' : 'none';
  document.getElementById('af-panel-my').style.display = tab === 'my' ? '' : 'none';

  // Update count
  const countEl = document.getElementById('af-count');
  if (tab === 'assigned') countEl.textContent = 'Showing 7 assigned forms';
  else countEl.textContent = 'Showing 2 submissions';
}

/* ─── Filter assigned forms table ─── */
function filterAfTable(query) {
  const rows = document.querySelectorAll('#af-table-body tr');
  const q = query.toLowerCase();
  rows.forEach(r => {
    r.style.display = r.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
}

/* ─── Form Detail page tab switching ─── */
function swFdTab(tab, el) {
  // Switch stabs
  ['overview','responses','fields','settings'].forEach(t => {
    const tabEl = document.getElementById('fd-tab-' + t);
    const panelEl = document.getElementById('fd-' + t);
    if (tabEl) tabEl.classList.remove('on');
    if (panelEl) panelEl.style.display = 'none';
  });
  el.classList.add('on');
  const panel = document.getElementById('fd-' + tab);
  if (panel) panel.style.display = '';
}
