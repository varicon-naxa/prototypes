/* ═══════════════════════════════════════════════════════════════
   Varicon SiteDiary — Stats & Progress
   ═══════════════════════════════════════════════════════════════ */

function updStats() {
  const pc = photos.length, nc = notes.length, lc = labourData.length, ec = plantData.length;

  // Tile values — null-safe, with units for clean tile display
  const setEl = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };

  setEl('tv-photos', pc + (pc !== 1 ? ' Photos' : ' Photo'));
  setEl('tv-notes',  nc + (nc !== 1 ? ' Notes'  : ' Note'));
  setEl('tv-plant',  ec + (ec !== 1 ? ' Items'  : ' Item'));
  setEl('tv-plant-sd', plantData.filter(p => p.sd).length);
  setEl('tv-labour', lc + (lc !== 1 ? ' Workers' : ' Worker'));
  setEl('tv-labour-of', labourData.filter(l => l.status === 'On Field').length);
  setEl('tv-mat', matData.length + (matData.length !== 1 ? ' Items' : ' Item'));
  setEl('tv-del', delData.length + (delData.length !== 1 ? ' Dockets' : ' Docket'));
  setEl('tv-tc-lab', lc);

  const totalMin = labourData.reduce((s, l) => s + l.hours * 60, 0);
  const tcHrsText = totalMin > 0 ? Math.floor(totalMin / 60) + 'h ' + Math.round(totalMin % 60) + 'm' : 'No Data';
  setEl('tv-tc-hrs', tcHrsText);
  setEl('tv-tc-of', labourData.filter(l => l.status === 'On Field').length);

  // Section status badges
  const setS = (id, txt, cls) => { const e = document.getElementById(id); if (e) { e.textContent = txt; e.className = cls; } };
  setS('ss-photos', pc + ' photo' + (pc !== 1 ? 's' : ''), 'sstat ' + (pc ? 'done' : 'empty'));
  setS('ss-notes',  nc + ' note'  + (nc !== 1 ? 's' : ''), 'sstat ' + (nc ? 'done' : 'empty'));
  setS('ss-plant',  ec + ' item'  + (ec !== 1 ? 's' : ''), 'sstat ' + (ec ? 'done' : 'empty'));
  setS('ss-labour', lc + ' worker'+ (lc !== 1 ? 's' : ''), 'sstat ' + (lc ? 'done' : 'empty'));
  if (typeof updateMatStats === 'function') updateMatStats();
  setS('ss-del', delData.length + ' docket' + (delData.length !== 1 ? 's' : ''), 'sstat ' + (delData.length ? 'done' : 'empty'));

  // Misc tile stat
  if (typeof updateMiscStats === 'function') updateMiscStats();

  // Progress bar — weighted: Labour + Weather are must-haves
  const wxConfirmed = document.getElementById('ss-weather') &&
    document.getElementById('ss-weather').textContent.includes('Confirmed');
  let filled = 0, total = 7;
  if (wxConfirmed) filled++;
  if (lc) filled++;
  if (ec) filled++;
  if (nc) filled++;
  if (pc) filled++;
  if (matData.length) filled++;
  if (delData.length) filled++;
  const pct = Math.round(filled / total * 100);

  // Colour-code bar: red → amber → green
  const bar = document.getElementById('prog-fill');
  bar.style.width = pct + '%';
  bar.style.background = pct < 30 ? 'var(--red)' : pct < 70 ? 'var(--amber)' : pct < 100 ? 'var(--green)' : 'var(--green)';

  // % labels
  const pctEl = document.getElementById('prog-pct');
  pctEl.textContent = pct + '%';
  pctEl.style.color = pct < 30 ? 'var(--red)' : pct < 70 ? 'var(--amber)' : 'var(--green)';

  // Submit area
  const submitPctEl = document.getElementById('submit-pct');
  if (submitPctEl) {
    submitPctEl.textContent = pct + '%';
    submitPctEl.style.color = pct < 30 ? 'var(--red)' : pct < 70 ? 'var(--amber)' : 'var(--green)';
  }

  // Missing hint
  const missing = [];
  if (!wxConfirmed) missing.push('Weather');
  if (!lc) missing.push('Labour');
  if (!ec) missing.push('Plant');
  const hintEl = document.getElementById('submit-missing');
  if (hintEl) {
    hintEl.textContent = missing.length ? ' · Missing: ' + missing.join(', ') : (pct === 100 ? ' · All sections complete ✓' : '');
    hintEl.style.color = missing.length ? 'var(--red)' : 'var(--green)';
  }

  // Submit button guard — require at least Labour or Weather
  const submitBtn = document.getElementById('btn-sign-submit');
  if (submitBtn) {
    const canSubmit = lc > 0 || wxConfirmed;
    submitBtn.style.opacity = canSubmit ? '1' : '0.5';
    submitBtn.style.cursor = canSubmit ? 'pointer' : 'not-allowed';
    submitBtn.title = canSubmit ? 'Submit diary' : 'Add at least Labour or confirm Weather first';
  }

  // Tile — mark act on active section
  // (handled by jumpTile, no change needed here)

  // FAB badge — Quick Entry completion %
  const fabPct = document.getElementById('fab-pct');
  if (fabPct) fabPct.textContent = pct + '%';

  // Report modal
  document.getElementById('rpt-date').textContent = fmtDate(sdDate);
  document.getElementById('rpt-plant').textContent = ec + ' items';
  document.getElementById('rpt-labour').textContent = lc + ' workers';
  document.getElementById('rpt-notes').textContent = nc ? notes.map(n => n.text).join('; ') : 'No notes recorded.';
}

function checkAndSubmit() {
  const lc = labourData.length;
  const wxConfirmed = document.getElementById('ss-weather') &&
    document.getElementById('ss-weather').textContent.includes('Confirmed');
  if (!lc && !wxConfirmed) {
    showToast('Add Labour or confirm Weather before submitting', 'warn');
    return;
  }
  openMo('report');
}
