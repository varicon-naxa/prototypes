/* Scenarios for the dayworks lean release (2026-11-18): rates table, variations from dockets, claims from dockets.
   Each runs on a fresh project through the same engine the screens use. Rules: Alec via the coordinator brief of
   2026-11-18, the lean variation rules already decided (VAR-23179), and the "as today" readings listed in notes.md. */

function _chk(out, label, actual, expected) {
  const pass = typeof expected === 'number' ? typeof actual === 'number' && Math.abs(actual - expected) < 0.005 : JSON.stringify(actual) === JSON.stringify(expected);
  out.push({ label, actual: typeof actual === 'number' ? money(actual) : JSON.stringify(actual), expected: typeof expected === 'number' ? money(expected) : JSON.stringify(expected), pass });
}
function _refused(out, label, fn, msg) {
  try { fn(); out.push({ label, actual: 'allowed', expected: 'refused: ' + msg, pass: false }); }
  catch (e) { out.push({ label, actual: 'refused: ' + e.message, expected: 'refused: ' + msg, pass: e.message === msg }); }
}
function _allowed(out, label, fn) {
  try { fn(); out.push({ label, actual: 'allowed', expected: 'allowed', pass: true }); }
  catch (e) { out.push({ label, actual: 'refused: ' + e.message, expected: 'allowed', pass: false }); }
}
function _ids(st, mode) { return pickerRows(st, mode || 'variation', null).map(r => r.d.id); }
function _row(st, id) { return pickerRows(st, 'variation', null).find(r => r.d.id === id) || null; }
function _hasHist(rec, docket, oldV, newV) { return rec.history.some(h => h.docket === docket && Math.abs(h.old - oldV) < 0.005 && Math.abs(h.new - newV) < 0.005); }
const NOV1 = { from: '2026-11-01', to: '2026-11-15' };
function _approved(st, ids, id) { const v = createVariation(st, ids, { id }); setVarStatus(st, id, 'Approved'); return v; }

const SCENARIOS = [
  /* ───── Rates table ───── */
  { story: 'Rates', title: 'Docket value = quantity x charge rate, no tiers, no minimums, no allowances',
    text: 'D401: Tom (Leading Hand $95/h) 06:00-17:00 with a 0.5h break on a Saturday = 10.5h x $95 = $997.50 (no overtime tiers, no day type). EX-07 wet hire 9h x $215 plus Breaker 1t 9h x $45. A mobilise at $480 each. 12 t road base x $52. Traffic control 8 crew hours x $145. Jo 2h x $78 = $156 (no minimum hours). A meal allowance is shown but not charged.',
    run(c) {
      const st = baseState();
      addDocket(st, 'D401', '2026-11-07', 'Approved', [lab('tom', '06:00', '17:00', 0.5, [{ type: 'Meal' }]), wet('EX-07', 'sam', '07:00', '16:00', 0, ['Breaker 1t']), flt('EX-07', 'mob'), mat('Road base', { qty: 12 }), sub('Traffic control', null, 8), lab('jo', '07:00', '09:00')]);
      const p = priceDocket(st, getDocket(st, 'D401'));
      _chk(c, 'Line values', p.lines.map(l => l.value), [997.5, 2340, 480, 624, 1160, 156]);
      _chk(c, 'Docket total', p.total, 5757.5);
      _chk(c, 'No problems', p.problems, []);
      _chk(c, 'Allowance shown at $0', p.lines[0].extras.map(x => [x.label, x.value]), [['Meal allowance', 0]]);
      return st;
    } },
  { story: 'Rates', title: 'A line with no charge rate is Unmapped; a $-only material or subcontract is charged at cost',
    text: 'Ben (Plumber) has no charge rate: Unmapped, blocked from the pickers. Decided 2026-11-20: concrete recorded only as $600 (no quantity) is charged at cost, $600, and is not Unmapped; the same for a $-only subcontract.',
    run(c) {
      const st = baseState();
      addDocket(st, 'D402', '2026-11-04', 'Approved', [lab('ben', '07:00', '15:00')]);
      addDocket(st, 'D403', '2026-11-04', 'Approved', [mat('Concrete', { cost: 600 }), sub('Line marking', 850)]);
      _chk(c, 'Plumber unmapped', priceDocket(st, getDocket(st, 'D402')).problems, ['Unmapped: Ben Okafor (Plumber)']);
      const p = priceDocket(st, getDocket(st, 'D403'));
      _chk(c, 'Concrete and line marking charged at cost', [p.lines.map(l => l.value), p.total, p.problems], [[600, 850], 1450, []]);
      _chk(c, 'Picker: D402 blocked, D403 tickable', [_row(st, 'D402').tickable, _row(st, 'D403').tickable], [false, true]);
      _refused(c, 'Unmapped refused on save', () => createVariation(st, ['D402']), 'D402 cannot be added: Unmapped: Ben Okafor (Plumber)');
      return st;
    } },
  { story: 'Rates', title: 'A named person rate wins over the role rate',
    text: 'Cris Dela Cruz has a named Skilled Labourer rate of $88/h, which wins over the Labourer rate of $78/h.',
    run(c) {
      const st = baseState();
      addDocket(st, 'D404', '2026-11-05', 'Approved', [lab('cris', '07:00', '15:00')]);
      _chk(c, '8h x $88', priceDocket(st, getDocket(st, 'D404')).total, 704);
      return st;
    } },

  /* ───── Variations (as the lean billing release) ───── */
  { story: 'Variation', title: 'From dockets: Save creates Pending with Submitted = Approved; cost lines per resource',
    text: 'D201 (Tom 8h, $760) and D213 (traffic control 8h, $1,160) into the Add Variation form. Save creates it Pending: one CONTRACT line per docket at its rates-table value in Submitted and Approved. COST has one resource per line at internal cost rates; Budget Sum is the COST total.',
    run(c) {
      const st = baseState();
      addDocket(st, 'D201', '2026-11-02', 'Approved', [lab('tom', '07:00', '15:00')]);
      addDocket(st, 'D213', '2026-11-04', 'Costed', [sub('Traffic control', null, 8)]);
      const v = createVariation(st, ['D201', 'D213'], { id: 'V011', unsaved: true });
      saveVariation(st, 'V011', { title: 'Detour works', revisionText: 'Rev A' });
      _chk(c, 'Pending, saved', [v.status, v.unsaved], ['Pending', false]);
      _chk(c, 'Submitted = Approved', [varSubmittedAmount(st, v), varApprovedAmount(st, v)], [1920, 1920]);
      _chk(c, 'COST lines', v.lines.map(l => costLines(st, getDocket(st, l.docket)).map(r => [r.type, r.total])), [[['Labour', 440]], [['Subcontractor', 880]]]);
      _chk(c, 'Budget Sum', varEstimatedCost(st, v), 1320);
      return st;
    } },
  { story: 'Variation', title: 'Snapshot: a rate change does not move a variation until Refresh',
    text: 'Support raises Leading Hand to $100/h. D201 on Pending V011 stays $760 until Refresh from dockets, which reprices Submitted and Approved to $800 and logs it.',
    run(c) {
      const st = baseState();
      addDocket(st, 'D201', '2026-11-02', 'Approved', [lab('tom', '07:00', '15:00')]);
      const v = createVariation(st, ['D201'], { id: 'V011' });
      setRate(st, 'role:Leading Hand', 100);
      _chk(c, 'Docket now $800, line still $760', [priceDocket(st, getDocket(st, 'D201')).total, varLineValue(st, v, v.lines[0])], [800, 760]);
      refreshFromDockets(st, 'V011');
      _chk(c, 'Refreshed', [varSubmittedAmount(st, v), varApprovedAmount(st, v), _hasHist(v, 'D201', 760, 800)], [800, 800, true]);
      return st;
    } },
  { story: 'Variation', title: 'Status dropdown: Approved freezes, back to Pending unless claimed, Non-Claimable and Rejected final, Delete any status',
    text: 'As the lean billing release (VAR-23179), priced from the rates table.',
    run(c) {
      const st = baseState(); st.today = '2026-11-16';
      ['D501', 'D502', 'D503', 'D504'].forEach((id, i) => addDocket(st, id, '2026-11-0' + (i + 3), 'Approved', [lab('jo', '07:00', '15:00')]));
      const v = _approved(st, ['D501'], 'V021');
      _chk(c, 'Frozen at $624', [v.status, v.approvedAmount], ['Approved', 624]);
      setRate(st, 'role:Labourer', 90);
      _chk(c, 'Rate change moves nothing', varLineValue(st, v, v.lines[0]), 624);
      _allowed(c, 'Back to Pending', () => setVarStatus(st, 'V021', 'Pending'));
      setVarStatus(st, 'V021', 'Approved');
      createClaim(st, NOV1, [], { id: 4 });
      _refused(c, 'Back to Pending once on a claim', () => setVarStatus(st, 'V021', 'Pending'), 'V021 is on claim 4 and stays Approved');
      _refused(c, 'Delete once on a claim (guard, pending check of live app)', () => deleteVariation(st, 'V021'), 'V021 is on claim 4 and cannot be deleted');
      createVariation(st, ['D502'], { id: 'V022' }); setVarStatus(st, 'V022', 'Rejected');
      _refused(c, 'Rejected is final', () => setVarStatus(st, 'V022', 'Pending'), 'V022 is Rejected and its dockets were freed; start a new variation from dockets');
      _approved(st, ['D503'], 'V023');
      _allowed(c, 'Delete an Approved variation not on a claim', () => deleteVariation(st, 'V023'));
      _chk(c, 'D502 and D503 freed', [_ids(st).includes('D502'), _ids(st).includes('D503')], [true, true]);
      return st;
    } },
  { story: 'Variation', title: 'A docket on a variation is locked; status marks allowed; deleting the line frees it',
    text: 'D201 on Pending V011 cannot be edited, reopened or marked Not claimable, and is not offered to a claim. Mark as Costed is allowed. Deleting the line frees it.',
    run(c) {
      const st = baseState();
      addDocket(st, 'D201', '2026-11-02', 'Approved', [lab('tom', '07:00', '15:00')]);
      createVariation(st, ['D201'], { id: 'V011' });
      _refused(c, 'Edit refused', () => editHours(st, 'D201', 0, 6), 'D201 is read-only: it is on pending variation V011; remove its line to free it');
      _chk(c, 'Not offered to a claim', _ids(st, 'claim').includes('D201'), false);
      _allowed(c, 'Mark as Costed', () => markCosted(st, 'D201'));
      removeFromVariation(st, 'V011', 'D201');
      _chk(c, 'Freed', [docketHome(st, 'D201'), _ids(st, 'claim').includes('D201')], [null, true]);
      return st;
    } },

  /* ───── Claims: Dayworks tab ───── */
  { story: 'Claim', title: 'Dayworks tab: one line per docket at its rates-table value, counted in Total Claim and retention',
    text: 'Make New Claim, then Add dockets: D101 (Tom 10.5h, $997.50) and D218 (Costed, Mel 8h, $760). Lines are copied in once. Claim gross = BOQ + variations + dayworks; retention 5% on the gross as existing.',
    run(c) {
      const st = baseState(); st.today = '2026-11-16';
      addDocket(st, 'D101', '2026-11-03', 'Approved', [lab('tom', '06:00', '17:00', 0.5)]);
      addDocket(st, 'D218', '2026-11-09', 'Costed', [lab('mel', '07:00', '15:00')]);
      addDocket(st, 'D202', '2026-11-04', 'Submitted', [lab('jo', '07:00', '15:00')]);
      const cl = createClaim(st, NOV1, [], { id: 4 });
      _chk(c, 'Picker offers Approved and Costed only', _ids(st, 'claim'), ['D101', 'D218']);
      _refused(c, 'Submitted docket refused', () => claimAddDockets(st, '4', ['D202']), 'D202 is Submitted: only Approved or Costed dockets can be added');
      claimAddDockets(st, '4', ['D101', 'D218']);
      _chk(c, 'Lines', cl.lines.map(l => [l.docket, claimLineValue(st, cl, l)]), [['D101', 997.5], ['D218', 760]]);
      cl.boq = { '1.1': 100 };
      const t = claimTotals(st, cl);
      _chk(c, 'Totals: BOQ, dayworks, gross, retention', [t.boq, t.dockets, t.gross, t.retention], [1850, 1757.5, 3607.5, 180.38]);
      return st;
    } },
  { story: 'Claim', title: 'Refresh from dockets until the claim is Approved',
    text: 'Leading Hand goes to $100/h. D101 on Draft claim 4 stays $997.50 until Refresh from dockets, which reprices it to $1,050 and logs it. Decided 2026-11-20: a Submitted claim can still be refreshed (and take or lose dockets); an Approved one cannot.',
    run(c) {
      const st = baseState(); st.today = '2026-11-16';
      addDocket(st, 'D101', '2026-11-03', 'Approved', [lab('tom', '06:00', '17:00', 0.5)]);
      addDocket(st, 'D102', '2026-11-04', 'Approved', [lab('mel', '07:00', '15:00')]);
      const cl = createClaim(st, NOV1, ['D101'], { id: 4 });
      setRate(st, 'role:Leading Hand', 100);
      _chk(c, 'Still $997.50', claimLineValue(st, cl, cl.lines[0]), 997.5);
      _chk(c, 'Lines repriced', claimRefreshFromDockets(st, '4'), 1);
      _chk(c, 'Now $1,050, logged', [claimLineValue(st, cl, cl.lines[0]), _hasHist(cl, 'D101', 997.5, 1050)], [1050, true]);
      submitClaim(st, '4');
      _allowed(c, 'Submitted: add D102', () => claimAddDockets(st, '4', ['D102']));
      setRate(st, 'role:Leading Hand', 105);
      _chk(c, 'Submitted: refresh allowed', claimRefreshFromDockets(st, '4'), 2);
      _allowed(c, 'Submitted: remove D102', () => claimRemoveDocket(st, '4', 'D102'));
      approveClaim(st, '4');
      _refused(c, 'Approved: refresh refused', () => claimRefreshFromDockets(st, '4'), 'Only a Draft or Submitted claim can be refreshed');
      return st;
    } },
  { story: 'Claim', title: 'A docket on a claim is locked; removing the line frees it',
    text: 'D101 on claim 4 cannot be edited or reopened and is not offered to a variation. Mark as Costed and Mark as Invoiced are allowed (status only). Removing its line frees it.',
    run(c) {
      const st = baseState(); st.today = '2026-11-16';
      addDocket(st, 'D101', '2026-11-03', 'Approved', [lab('tom', '06:00', '17:00', 0.5)]);
      createClaim(st, NOV1, ['D101'], { id: 4 });
      _refused(c, 'Edit refused', () => editHours(st, 'D101', 0, 8), 'D101 is read-only: it is on draft claim 4; remove its line to free it');
      _refused(c, 'Reopen refused', () => reopenSigned(st, 'D101'), 'D101 is read-only: it is on draft claim 4; remove its line to free it');
      _chk(c, 'Not offered to a variation', _ids(st).includes('D101'), false);
      _allowed(c, 'Mark as Costed', () => markCosted(st, 'D101'));
      _allowed(c, 'Mark as Invoiced', () => markInvoiced(st, 'D101'));
      claimRemoveDocket(st, '4', 'D101');
      _chk(c, 'Freed', docketHome(st, 'D101'), null);
      return st;
    } },
  { story: 'Claim', title: 'Approving freezes docket lines; no auto-Invoiced, no credit lines',
    text: 'Claim 4 with D101 is approved: the line freezes at $997.50, D101 stays Approved (no auto-Invoiced) and stays locked. A later rate change moves nothing.',
    run(c) {
      const st = baseState(); st.today = '2026-11-16';
      addDocket(st, 'D101', '2026-11-03', 'Approved', [lab('tom', '06:00', '17:00', 0.5)]);
      const cl = createClaim(st, NOV1, ['D101'], { id: 4 });
      const r = approveClaim(st, '4');
      _chk(c, 'Approved, frozen, status unchanged', [cl.status, cl.lines[0].frozen, r.invoiced, getDocket(st, 'D101').status], ['Approved', 997.5, [], 'Approved']);
      setRate(st, 'role:Leading Hand', 100);
      _chk(c, 'Frozen after a rate change', claimTotals(st, cl).dockets, 997.5);
      _refused(c, 'Line cannot be removed', () => claimRemoveDocket(st, '4', 'D101'), 'Claim 4 is approved and locked');
      _chk(c, 'Still locked', isLocked(st, 'D101'), true);
      return st;
    } },
  { story: 'Claim', title: 'Reopen Claim keeps Dayworks lines frozen; Delete claim frees its dockets',
    text: 'Decided 2026-11-20: reopening approved claim 4 leaves its Dayworks lines frozen at their approved values; they cannot be refreshed or removed, and a rate change moves nothing. Deleting a claim frees its dockets; docket statuses are unchanged.',
    run(c) {
      const st = baseState(); st.today = '2026-11-16';
      ['D601', 'D602', 'D603'].forEach((id, i) => addDocket(st, id, '2026-11-0' + (i + 3), 'Approved', [lab('jo', '07:00', '15:00')]));
      const cl = createClaim(st, NOV1, ['D601'], { id: 4 }); approveClaim(st, '4'); reopenClaim(st, '4');
      setRate(st, 'role:Labourer', 90);
      _chk(c, 'Reopened: Draft, line frozen at $624', [cl.status, cl.lines[0].frozen, claimLineValue(st, cl, cl.lines[0])], ['Draft', 624, 624]);
      _chk(c, 'Refresh leaves it alone', [claimRefreshFromDockets(st, '4'), claimLineValue(st, cl, cl.lines[0])], [0, 624]);
      _refused(c, 'Frozen line cannot be removed', () => claimRemoveDocket(st, '4', 'D601'), 'D601 was approved on this claim and stays locked');
      _allowed(c, 'A new docket can be added while reopened', () => claimAddDockets(st, '4', ['D602']));
      createClaim(st, { from: '2026-11-16', to: '2026-11-30' }, ['D603'], { id: 5, vars: [] });
      _allowed(c, 'Delete Draft claim 5', () => deleteDraftClaim(st, '5'));
      _chk(c, 'D603 freed, status unchanged', [docketHome(st, 'D603'), getDocket(st, 'D603').status], [null, 'Approved']);
      return st;
    } },
  { story: 'Claim', title: 'Approved variations are still claimed by percent on the Variation tab',
    text: 'Approved docket variation V012 ($760) is claimed at 50% on claim 4 = $380, alongside the Dayworks tab.',
    run(c) {
      const st = baseState(); st.today = '2026-11-16';
      addDocket(st, 'D201', '2026-11-02', 'Approved', [lab('tom', '07:00', '15:00')]);
      addDocket(st, 'D101', '2026-11-03', 'Approved', [lab('tom', '06:00', '17:00', 0.5)]);
      _approved(st, ['D201'], 'V012');
      const cl = createClaim(st, NOV1, ['D101'], { id: 4 }); setVarPct(st, '4', 'V012', 50);
      _chk(c, 'Variation and dayworks', [claimTotals(st, cl).vars, claimTotals(st, cl).dockets], [380, 997.5]);
      return st;
    } },
  { story: 'Rates download', title: 'The rates download rows equal the rates pricing the dockets',
    text: 'VAR-23168 (lean): the download has the project name, "Rates as at <today>", a header and one row per rate line (Resource Type, Resource, Unit, Charge Rate, Applies to). Every priced docket line on the project uses a rate that appears in the download at the same charge rate.',
    run(c) {
      const st = seedState();
      const aoa = ratesExportAoa(st);
      _chk(c, 'Title rows', [aoa[0][0], aoa[1][0]], ['Riverside Rd Upgrade (RRU01)', 'Rates as at 16/11/2026']);
      _chk(c, 'Header', aoa[3], ['Resource Type', 'Resource', 'Unit', 'Charge Rate', 'Applies to']);
      _chk(c, 'One row per rate line', aoa.length - 4, st.project.rates.length);
      const byRes = Object.fromEntries(aoa.slice(4).map(r => [r[1], r[3]]));
      const used = []; let mismatch = 0;
      st.dockets.forEach(d => priceDocket(st, d).lines.forEach(l => { if (!l.rateLine || !l.rateLine.key) return; const row = rateRow(st, l.rateLine.key); used.push(row.resource); if (byRes[row.resource] !== row.rate || Math.abs(l.rows[0].rate - row.rate) > 0.004) mismatch++; }));
      _chk(c, 'Every rate used on a docket is in the download at the same rate', [used.length > 10, mismatch], [true, 0]);
      _chk(c, 'Applies to: Leading Hand', aoa.find(r => r[1] === 'Leading Hand')[4], 'Tom Reilly, Mel Grant');
      _chk(c, 'File name', ratesFileName(st), 'RRU01 dayworks rates 16-11-2026.xlsx');
      st.project.rates = [];
      _chk(c, 'No rates: nothing to download', ratesExportRows(st).length, 0);
      return st;
    } },
  { story: 'Set-up', title: 'Dayworks set-up: 4 steps with complete or missing; client approvers done inline',
    text: 'VAR-23108 (lean): the seeded project has no default client representative, so set-up reads 3 of 4 complete with Client approvers missing. Saving an invalid email is refused; saving Joe Bloggs (joe@northerncouncils.nsw.gov.au) with a CC completes the step: 4 of 4.',
    run(c) {
      const st = seedState();
      _chk(c, 'Seeded progress', setupProgress(st), { done: 3, total: 4 });
      _chk(c, 'Missing step', setupSteps(st).filter(x => !x.complete).map(x => x.title), ['Client approvers']);
      _refused(c, 'Invalid email refused', () => saveApprovers(st, { clientRep: 'joe at council', clientName: 'Joe Bloggs' }), 'Enter a valid email for the client representative');
      _refused(c, 'Invalid CC refused', () => saveApprovers(st, { clientRep: 'joe@northerncouncils.nsw.gov.au', clientName: 'Joe Bloggs', cc: 'ok@x.com.au; nope' }), 'Not a valid email: nope');
      saveApprovers(st, { clientRep: 'joe@northerncouncils.nsw.gov.au', clientName: 'Joe Bloggs', cc: 'sue@northerncouncils.nsw.gov.au', notify: ['Dana Whitfield (PM)', 'Kim Nguyen (Accounts)'] });
      _chk(c, 'Complete: 4 of 4', [setupSteps(st)[0].complete, setupProgress(st)], [true, { done: 4, total: 4 }]);
      _chk(c, 'Saved fields', [st.project.setup.approvers.clientName, st.project.setup.approvers.notify], ['Joe Bloggs', ['Dana Whitfield (PM)', 'Kim Nguyen (Accounts)']]);
      return st;
    } },
  { story: 'Set-up', title: 'Docket template, rates and contract checks',
    text: 'Turning every template section off makes the Docket template step missing. The Rates step lists the unmapped resources found on the project dockets (Ben Okafor, Plumber) and is missing when the project has no rates. The link step is missing when the project has no contract.',
    run(c) {
      const st = seedState();
      saveTemplate(st, { travelHour: true, allowances: ['Meal'] });
      _chk(c, 'Template saved', [st.project.setup.template.travelHour, st.project.setup.template.allowances], [true, ['Meal']]);
      saveTemplate(st, { sections: { 'Labour': false, 'Plant and Equipment': false, 'Materials': false, 'Miscellaneous': false } });
      _chk(c, 'All sections off: missing', setupSteps(st)[1].complete, false);
      _chk(c, 'Rates step: count and unmapped', [setupSteps(st)[2].complete, st.project.rates.length, setupUnmapped(st)], [true, 11, ['Ben Okafor (Plumber)']]);
      st.project.rates = [];
      _chk(c, 'No rates: missing', setupSteps(st)[2].complete, false);
      st.project.contractSum = 0;
      _chk(c, 'No contract: link missing', setupSteps(st)[3].complete, false);
      return st;
    } },
];

function runScenarios() {
  return SCENARIOS.map((s, i) => {
    const checks = []; let state = null; let error = null;
    try { state = s.run(checks); } catch (e) { error = e.message; }
    const pass = !error && checks.length > 0 && checks.every(x => x.pass);
    return { i, s, checks, state, error, pass };
  });
}
