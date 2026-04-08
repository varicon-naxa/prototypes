/* ═══════════════════════════════════════════════════════════════
   Varicon SiteDiary — Quick Fill & Rollover
   ═══════════════════════════════════════════════════════════════ */

// ── Previous-day data (in production, fetched from API) ──
const prevDayPlant = [
  { name: '55T Excavator',  hire: 'Wet Hire',  op: 'ACO Pty Ltd',      task: 'Earthworks' },
  { name: 'Motor Grader',   hire: 'Wet Hire',  op: 'Jones Equipment',   task: 'Earthworks' },
];
const prevDayLabour = [
  { name: 'John Smith',    role: 'Site Supervisor', init: 'JS', color: '#3B82F6' },
  { name: 'Mike Johnson',  role: 'Electrician',     init: 'MJ', color: '#10B981' },
  { name: 'Sarah Williams',role: 'Plumber',          init: 'SW', color: '#8B5CF6' },
];
const prevDayMaterials = [
  { name: 'Crushed Rock', qty: '12', unit: 'm³',  supplier: 'Site Supply' },
  { name: 'Concrete Mix', qty: '4',  unit: 'm³',  supplier: 'Boral' },
];
const prevDayNotes = [
  'Safety briefing completed. All crew inducted. PPE check done.',
];

// ── Apply selected categories from Yesterday dropdown ──
function applyYesterday() {
  closeDd();
  let applied = [];

  const doPlant    = document.getElementById('yd-plant')?.checked;
  const doLabour   = document.getElementById('yd-labour')?.checked;
  const doNotes    = document.getElementById('yd-notes')?.checked;
  const doMat      = document.getElementById('yd-materials')?.checked;

  if (doPlant)  { rolloverPlant(true);    applied.push('Plant'); }
  if (doLabour) { rolloverLabour(true);   applied.push('Labour'); }
  if (doNotes)  { rolloverNotes(true);    applied.push('Notes'); }
  if (doMat)    { rolloverMaterials(true);applied.push('Materials'); }

  if (applied.length) {
    showToast('✓ Applied from yesterday: ' + applied.join(', '));
  } else {
    showToast('Nothing selected — tick at least one category');
  }
}

// ── Per-section rollover helpers ──
function rolloverPlant(silent) {
  if (plantData.length && !silent) {
    showToast('Plant already added today — clear first to rollover');
    return;
  }
  if (!plantData.length) {
    prevDayPlant.forEach(p => addPlantRow(p.name, p.hire, p.op, p.task, false));
  }
  if (!silent) showToast('✓ Plant rolled over from yesterday');
}

function rolloverLabour(silent) {
  if (labourData.length && !silent) {
    showToast('Labour already added today — clear first to rollover');
    return;
  }
  if (!labourData.length) {
    prevDayLabour.forEach(l => qLabour(document.createElement('div'), l.name, l.role, l.init, l.color));
  }
  if (!silent) showToast('✓ Labour rolled over from yesterday');
}

function rolloverNotes(silent) {
  prevDayNotes.forEach(text => {
    saveNote(text + ' [rolled from yesterday]', 'General');
  });
  if (!silent) showToast('✓ Notes rolled over from yesterday');
}

function rolloverMaterials(silent) {
  if (!matData.length) {
    prevDayMaterials.forEach(m => addMatRow(m.name, m.qty, m.unit, m.supplier));
  }
  if (!silent) showToast('✓ Materials rolled over from yesterday');
}

// ── Legacy alias (keep for any old references) ──
function fillFromYesterday() {
  rolloverPlant(true);
  rolloverLabour(true);
  showToast('✓ Pre-filled from yesterday');
}
