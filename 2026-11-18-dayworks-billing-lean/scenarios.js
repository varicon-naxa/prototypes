/* Scenarios for the smaller-release cuts of the dayworks billing prototype. The same file runs in the lean and middle
   folders; a scenario with `only` runs in that release alone. Each runs on a fresh project through the same engine the
   screens use. Rules: coordinator briefs of 2026-11-18 (Alec, live app checked), on top of the full prototype's rules. */

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
function _ids(st) { return pickerRows(st, 'variation', null).map(r => r.d.id); }
function _row(st, id) { return pickerRows(st, 'variation', null).find(r => r.d.id === id) || null; }
function _hasHist(rec, docket, oldV, newV) { return rec.history.some(h => h.docket === docket && Math.abs(h.old - oldV) < 0.005 && Math.abs(h.new - newV) < 0.005); }
const NOV1 = { from: '2026-11-01', to: '2026-11-15' };
function _v016(st) {
  addDocket(st, 'D209', '2026-11-10', 'Approved', [lab('tom', '06:00', '17:00', 0.5)]);
  addDocket(st, 'D210', '2026-11-02', 'Approved', [wet('EX-07', 'sam', '07:00', '16:00')]);
  addDocket(st, 'D211', '2026-11-16', 'Costed', [wet('EX-07', 'sam', '07:00', '15:00', 0, ['Breaker 1t']), mat('Concrete', { cost: 600 })]);
  return createVariation(st, ['D209', 'D210', 'D211'], { id: 'V016' });
}
function _approved(st, ids, id) { const v = createVariation(st, ids, { id }); setVarStatus(st, id, 'Approved'); return v; }

const SCENARIOS = [
  /* ───── Shared ───── */
  { story: 'Picker', title: 'Picker offers Approved and Costed dockets only',
    text: 'From dockets lists Approved and Costed dockets that are not on a variation and not Not claimable. Draft, Ready for Review, Submitted, Invoiced and Rejected are not offered. Unmapped and overlapping dockets are listed and blocked.',
    run(c) {
      const st = baseState();
      [['D301', 'Draft'], ['D302', 'Ready for Review'], ['D303', 'Submitted'], ['D304', 'Approved'], ['D305', 'Costed'], ['D306', 'Invoiced'], ['D307', 'Rejected']].forEach(([id, s], i) => addDocket(st, id, '2026-11-0' + (i + 2), s, [lab('jo', '07:00', '15:00')]));
      addDocket(st, 'D308', '2026-11-09', 'Approved', [lab('tom', '07:00', '15:00', 0, [{ type: 'Tool' }])]);
      addDocket(st, 'D309', '2026-11-09', 'Approved', [lab('mel', '07:00', '15:00')]);
      markNotClaimable(st, 'D309', '');
      _chk(c, 'Listed', _ids(st), ['D304', 'D305', 'D308']);
      _chk(c, 'Unmapped D308 blocked', [_row(st, 'D308').tickable, _row(st, 'D308').block], [false, 'Unmapped: Tool allowance']);
      _refused(c, 'Submitted refused on save', () => createVariation(st, ['D303']), 'D303 is Submitted: only Approved or Costed dockets can be added');
      _refused(c, 'Invoiced refused on save', () => createVariation(st, ['D306']), 'D306 is Invoiced: only Approved or Costed dockets can be added');
      return st;
    } },
  { story: 'Form', title: 'Save Variation creates a Pending variation with Submitted and Approved filled',
    text: 'From dockets opens the Add Variation form with D201 and D210. Save Variation creates it as Pending: one CONTRACT line per docket, Unit "docket", Submitted Qty 1 and Approved Qty 1 at the calculator value, so Approved Amount equals Submitted Amount from the start. Revision is the user\'s text. More dockets can be added while Pending; Update Variation just saves.',
    run(c) {
      const st = baseState();
      addDocket(st, 'D201', '2026-11-02', 'Approved', [lab('tom', '07:00', '15:00')]);
      addDocket(st, 'D210', '2026-11-02', 'Approved', [wet('EX-07', 'sam', '07:00', '16:00')]);
      addDocket(st, 'D213', '2026-11-04', 'Costed', [sub('Traffic control', 1200)]);
      const v = createVariation(st, ['D201', 'D210'], { id: 'V011', unsaved: true });
      _chk(c, 'Unsaved until Save', v.unsaved, true);
      saveVariation(st, 'V011', { title: 'Rock breaking', revisionText: 'Rev A', type: 'Variation' });
      _chk(c, 'Saved as Pending', [v.unsaved, v.status, v.title, v.revisionText], [false, 'Pending', 'Rock breaking', 'Rev A']);
      _chk(c, 'Contract lines qty 1 at calculator value', v.lines.map(l => [l.docket, 1, varLineValue(st, v, l), lineApQty(l), lineApRate(st, v, l)]), [['D201', 1, 560, 1, 560], ['D210', 1, 1710, 1, 1710]]);
      _chk(c, 'Submitted = Approved', [varSubmittedAmount(st, v), varApprovedAmount(st, v)], [2270, 2270]);
      _chk(c, 'Markers', ['D201', 'D210'].map(id => docketHome(st, id).rec.id), ['V011', 'V011']);
      _allowed(c, 'Add D213 while Pending', () => addToVariation(st, 'V011', ['D213']));
      _chk(c, 'Amounts follow (traffic control charged at cost + 10%)', [varSubmittedAmount(st, v), varApprovedAmount(st, v)], [3590, 3590]);
      saveVariation(st, 'V011', { revisionText: 'Rev B' });
      _chk(c, 'Update keeps it Pending, revision is free text', [v.status, v.revisionText], ['Pending', 'Rev B']);
      return st;
    } },
  { story: 'Form', title: 'COST tab: one cost resource per labour, plant, material and subcontract line',
    text: 'D401 holds Tom 8h labour, EX-07 wet hire 9h with operator Sam and a Breaker, a mobilise, 12 t road base, concrete at cost $600 and traffic control at $1,200. Its COST lines use the internal cost rates (never the charge). Budget Sum and Estimated Cost are the COST total; Margin = (charge - cost) / charge.',
    run(c) {
      const st = baseState();
      addDocket(st, 'D401', '2026-11-03', 'Approved', [lab('tom', '07:00', '15:00'), wet('EX-07', 'sam', '07:00', '16:00', 0, ['Breaker 1t']), flt('EX-07', 'mob'), mat('Road base', { qty: 12 }), mat('Concrete', { cost: 600 }), sub('Traffic control', 1200)]);
      const v = createVariation(st, ['D401'], { id: 'V012' });
      const rows = costLines(st, getDocket(st, 'D401'));
      _chk(c, 'Resources and types', rows.map(r => [r.resource, r.type]), [['Tom Reilly (Leading Hand)', 'Labour'], ['(EX-07) Excavator 20t', 'Plant and Equipment'], ['Sam Patel (Operator, operator)', 'Labour'], ['Breaker 1t (attachment)', 'Plant and Equipment'], ['Float, mobilise EX-07', 'Plant and Equipment'], ['Road base', 'Material'], ['Concrete (at cost)', 'Material'], ['Traffic control', 'Subcontractor']]);
      _chk(c, 'Totals', rows.map(r => r.total), [440, 855, 540, 180, 300, 360, 600, 1200]);
      _chk(c, 'Plant: unit Hour, duration from the docket', [rows[1].unit, rows[1].unitCost, rows[1].duration], ['Hour', 95, 9]);
      _chk(c, 'Accounting codes', [...new Set(rows.map(r => r.code))], ['5100 Labour', '5200 Plant hire', '5300 Materials', '5400 Subcontract']);
      _chk(c, 'Budget Sum = Estimated Cost = COST total', varEstimatedCost(st, v), 4475);
      const charge = varApprovedAmount(st, v);
      _chk(c, 'Margin', varMargin(st, v).pct, round2((charge - 4475) / charge * 100));
      return st;
    } },
  { story: 'Status', title: 'Status is the register dropdown: Approved freezes and keeps dockets locked',
    text: 'V016 is Pending. Setting Approved from the Variation Register dropdown freezes its lines at $5,000 (Approved Amount), keeps its dockets locked and moves the contract sum. A later rate change moves nothing.',
    run(c) {
      const st = baseState(); st.today = '2026-11-16';
      const v = _v016(st);
      const before = contractSum(st);
      _allowed(c, 'Pending to Approved', () => setVarStatus(st, 'V016', 'Approved'));
      _chk(c, 'Approved, frozen', [v.status, v.approvedAmount, varLineValue(st, v, v.lines[0])], ['Approved', 5000, 840]);
      _chk(c, 'Dockets locked', ['D209', 'D210', 'D211'].map(id => isLocked(st, id)), [true, true, true]);
      _chk(c, 'Contract sum moves by', round2(contractSum(st) - before), 5000);
      _refused(c, 'Contract lines locked', () => setApproved(st, 'V016', 'D209', 1, 700), 'V016 is Approved: its contract lines are locked');
      publishVersion(st, 'labour', 'Leading Hand', 75, '2026-11-17');
      _chk(c, 'Later rate change moves nothing', [varLineValue(st, v, v.lines[0]), v.approvedAmount], [840, 5000]);
      return st;
    } },
  { story: 'Status', title: 'Editable Approved Qty and Rate, then Partial Approved',
    text: 'On Pending V021 (D601, $1,800) the user edits the Approved Rate to $1,500 on the CONTRACT tab, then sets Partial Approved from the dropdown. Submitted stays $1,800; Approved Amount freezes at $1,500. No shortfall marker or adjustment.',
    run(c) {
      const st = baseState();
      addDocket(st, 'D601', '2026-11-09', 'Approved', [mat('Road base', { qty: 40 })]);
      const v = createVariation(st, ['D601'], { id: 'V021' });
      setApproved(st, 'V021', 'D601', 1, 1500);
      _chk(c, 'Submitted and Approved', [varSubmittedAmount(st, v), varApprovedAmount(st, v)], [1800, 1500]);
      _chk(c, 'Change in history', _hasHist(v, 'D601', 1800, 1500), true);
      setVarStatus(st, 'V021', 'Partial Approved');
      _chk(c, 'Partial Approved at $1,500, no adjustment', [v.status, v.approvedAmount, v.adjustment], ['Partial Approved', 1500, null]);
      return st;
    } },
  { story: 'Locking', title: 'A docket on a variation is locked until its line is removed',
    text: 'D201 on Pending V011 is read-only: no edits, no Reopen, no Not claimable. Removing its line frees it; it can then be reopened, edited, signed again and re-added.',
    run(c) {
      const st = baseState();
      addDocket(st, 'D201', '2026-11-02', 'Approved', [lab('tom', '07:00', '15:00')]);
      createVariation(st, ['D201'], { id: 'V011' });
      _refused(c, 'Edit refused', () => editHours(st, 'D201', 0, 6), 'D201 is read-only: it is on pending variation V011; remove its line to free it');
      _refused(c, 'Reopen refused', () => reopenSigned(st, 'D201'), 'D201 is read-only: it is on pending variation V011; remove its line to free it');
      _refused(c, 'Not claimable refused', () => markNotClaimable(st, 'D201', ''), 'Remove this docket from variation V011 first');
      _allowed(c, 'Mark as Costed allowed (status only)', () => markCosted(st, 'D201'));
      removeFromVariation(st, 'V011', 'D201');
      _chk(c, 'Freed', docketHome(st, 'D201'), null);
      reopenSigned(st, 'D201'); editHours(st, 'D201', 0, 6); approveDocket(st, 'D201');
      _allowed(c, 'Re-added after signing again', () => addToVariation(st, 'V011', ['D201']));
      _chk(c, 'Re-added at the new value', varLineValue(st, getVar(st, 'V011'), getVar(st, 'V011').lines[0]), 420);
      return st;
    } },
  { story: 'Release', title: 'Deleting a line, Delete Variation, Non-Claimable and Rejected free the dockets',
    text: 'Deleting a line frees that docket. Delete Variation (kebab, Pending only) removes it and frees its dockets. Non-Claimable or Rejected from the dropdown keeps it on the register and frees its dockets; it cannot then be moved back.',
    run(c) {
      const st = baseState();
      ['D501', 'D502', 'D503', 'D504', 'D505'].forEach((id, i) => addDocket(st, id, '2026-11-0' + (i + 3), 'Approved', [lab('jo', '07:00', '15:00')]));
      createVariation(st, ['D501', 'D502'], { id: 'V019' });
      removeFromVariation(st, 'V019', 'D502');
      _chk(c, 'Deleted line: D502 offered again', _ids(st).includes('D502'), true);
      setVarStatus(st, 'V019', 'Non-Claimable');
      _chk(c, 'Non-Claimable on the register, D501 freed', [getVar(st, 'V019').status, _ids(st).includes('D501')], ['Non-Claimable', true]);
      _refused(c, 'Cannot move back', () => setVarStatus(st, 'V019', 'Pending'), 'V019 is Non-Claimable and its dockets were freed; start a new variation from dockets');
      createVariation(st, ['D503'], { id: 'V020' }); setVarStatus(st, 'V020', 'Rejected');
      _chk(c, 'Rejected, D503 freed', [getVar(st, 'V020').status, _ids(st).includes('D503')], ['Rejected', true]);
      createVariation(st, ['D504', 'D505'], { id: 'V023' });
      _allowed(c, 'Delete Variation', () => deleteVariation(st, 'V023'));
      _chk(c, 'Gone from the register, both freed', [st.variations.some(v => v.id === 'V023'), _ids(st).includes('D504'), _ids(st).includes('D505')], [false, true, true]);
      return st;
    } },
  { story: 'Claim', title: 'Dockets reach a claim only via their variation, by percent on the Variation tab',
    text: 'There is no Dayworks tab: a claim cannot take dockets directly. An approved docket variation is claimed by percent to date; a lower percent later is a credit line, and a claim below zero is approved as a credit note. A variation on a claim cannot be moved back to Pending.',
    run(c) {
      const st = baseState(); st.today = '2026-11-16';
      addDocket(st, 'D201', '2026-11-02', 'Approved', [lab('tom', '07:00', '15:00')]);
      _refused(c, 'Claim with dockets refused', () => createClaim(st, NOV1, ['D201']), 'Dockets reach a claim only through their approved variation');
      _approved(st, ['D201'], 'V012');
      const c4 = createClaim(st, NOV1, [], { id: 4 });
      setVarPct(st, '4', 'V012', 60);
      _chk(c, 'Variation tab: 60% of $560', claimVarRows(st, c4)[0].value, 336);
      approveClaim(st, '4');
      _refused(c, 'Back to Pending refused while on a claim', () => setVarStatus(st, 'V012', 'Pending'), 'V012 is on claim 4 and stays Approved');
      createClaim(st, { from: '2026-11-16', to: '2026-11-30' }, [], { id: 5, vars: ['V012'] }); setVarPct(st, '5', 'V012', 20);
      _chk(c, 'Credit line 40% of $560', claimVarRows(st, getClaim(st, '5'))[0].value, -224);
      approveClaim(st, '5');
      _chk(c, 'Approved as a credit note', claimAccountingLabel(st, getClaim(st, '5')), 'Sent to accounting as a credit note');
      return st;
    } },
  { story: 'Claim', title: 'No auto-Invoiced: dockets keep their status; marked Invoiced by hand',
    text: 'V012 (D201 Approved, D218 Costed) claimed to 100% on an approved claim leaves both dockets as they were. Marking D201 Invoiced by hand is allowed while it is locked on the variation (status only).',
    run(c) {
      const st = baseState(); st.today = '2026-11-16';
      addDocket(st, 'D201', '2026-11-02', 'Approved', [lab('tom', '07:00', '15:00')]);
      addDocket(st, 'D218', '2026-11-09', 'Costed', [lab('mel', '07:00', '15:00')]);
      _approved(st, ['D201', 'D218'], 'V012');
      createClaim(st, NOV1, [], { id: 4 }); const r = approveClaim(st, '4');
      _chk(c, 'Nothing moved to Invoiced', [r.invoiced, getDocket(st, 'D201').status, getDocket(st, 'D218').status], [[], 'Approved', 'Costed']);
      _allowed(c, 'Mark D201 as invoiced by hand', () => markInvoiced(st, 'D201'));
      _chk(c, 'Invoiced, still locked on V012', [getDocket(st, 'D201').status, isLocked(st, 'D201')], ['Invoiced', true]);
      return st;
    } },

  /* ───── Lean only ───── */
  { only: 'lean', story: 'Snapshot', title: 'Lines are a snapshot: a calculator change does not move them',
    text: 'V016 lines take the calculator value when each docket is added. A Leading Hand rate change to $75 raises D209 to $900 on the calculator, but its Submitted and Approved rates stay $840 and nothing is flagged.',
    run(c) {
      const st = baseState(); st.today = '2026-11-16';
      const v = _v016(st);
      publishVersion(st, 'labour', 'Leading Hand', 75, '2026-11-01');
      _chk(c, 'Calculator now $900', priceDocket(st, getDocket(st, 'D209')).total, 900);
      _chk(c, 'Submitted and Approved rates still $840', [varLineValue(st, v, v.lines[0]), lineApRate(st, v, v.lines[0])], [840, 840]);
      _chk(c, 'Amounts unchanged, no flag', [varSubmittedAmount(st, v), varApprovedAmount(st, v), varLineChanged(st, v, v.lines[0])], [5000, 5000, false]);
      return st;
    } },
  { only: 'lean', story: 'Snapshot', title: 'Refresh from dockets reprices Submitted and Approved rates, logs old to new',
    text: 'After the rate change, Refresh from dockets on Pending V016 reprices D209\'s Submitted and Approved rates from $840 to $900 (an earlier Approved Rate edit is replaced) and writes it to the history. The Revision text is not touched. Allowed any time while Pending; not after Approved.',
    run(c) {
      const st = baseState(); st.today = '2026-11-16';
      const v = _v016(st); saveVariation(st, 'V016', { revisionText: 'Rev A' });
      setApproved(st, 'V016', 'D209', 1, 800);
      publishVersion(st, 'labour', 'Leading Hand', 75, '2026-11-01');
      _chk(c, 'Lines repriced', refreshFromDockets(st, 'V016'), 1);
      _chk(c, 'D209 submitted and approved rates', [varLineValue(st, v, v.lines[0]), lineApRate(st, v, v.lines[0])], [900, 900]);
      _chk(c, 'History $840 to $900', _hasHist(v, 'D209', 840, 900), true);
      _chk(c, 'Amounts', [varSubmittedAmount(st, v), varApprovedAmount(st, v)], [5060, 5060]);
      _chk(c, 'No automatic revision', v.revisionText, 'Rev A');
      setVarStatus(st, 'V016', 'Approved');
      _refused(c, 'Refresh after Approved refused', () => refreshFromDockets(st, 'V016'), 'Only a Pending variation can be refreshed');
      return st;
    } },

  /* ───── Middle only ───── */
  { only: 'middle', story: 'Live', title: 'Contract and cost lines follow live until Approved; only "changed since added" flags',
    text: 'On Pending V016 a Leading Hand rate change to $75 moves D209\'s Submitted and Approved rates from $840 to $900; the line is flagged "changed since added" and the change is in the history. There is no changed-since-submitted flag or revision prompt and no Refresh. Setting Approved freezes the lines; a later change moves nothing.',
    run(c) {
      const st = baseState(); st.today = '2026-11-16';
      const v = _v016(st);
      publishVersion(st, 'labour', 'Leading Hand', 75, '2026-11-01');
      _chk(c, 'Submitted and Approved rates follow', [varLineValue(st, v, v.lines[0]), lineApRate(st, v, v.lines[0])], [900, 900]);
      _chk(c, 'Changed since added', varLineChanged(st, v, v.lines[0]), true);
      _chk(c, 'History $840 to $900', _hasHist(v, 'D209', 840, 900), true);
      _chk(c, 'No submitted flag or revision prompt', [varSubmittedChanged(st, v), varNeedsRevision(st, v)], [false, false]);
      _chk(c, 'No Refresh', (() => { try { refreshFromDockets(st, 'V016'); return 'allowed'; } catch (e) { return e.message; } })(), 'Refresh is only in the lean release');
      setVarStatus(st, 'V016', 'Approved');
      _chk(c, 'Frozen at $5,060, flags cleared', [v.approvedAmount, v.lines.map(l => varLineChanged(st, v, l))], [5060, [false, false, false]]);
      publishVersion(st, 'labour', 'Leading Hand', 80, '2026-11-17');
      _chk(c, 'Later rate change moves nothing', varLineValue(st, v, v.lines[0]), 900);
      return st;
    } },
  { only: 'middle', story: 'Live', title: 'An edited Approved Rate stays put while the Submitted Rate follows live',
    text: 'On Pending V016 the user sets D209\'s Approved Rate to $800. A rate change then moves the Submitted Rate to $900; the edited Approved Rate stays $800.',
    run(c) {
      const st = baseState(); st.today = '2026-11-16';
      const v = _v016(st);
      setApproved(st, 'V016', 'D209', 1, 800);
      publishVersion(st, 'labour', 'Leading Hand', 75, '2026-11-01');
      _chk(c, 'Submitted follows, Approved kept', [varLineValue(st, v, v.lines[0]), lineApRate(st, v, v.lines[0])], [900, 800]);
      return st;
    } },
].filter(s => !s.only || s.only === RELEASE);

function runScenarios() {
  return SCENARIOS.map((s, i) => {
    const checks = []; let state = null; let error = null;
    try { state = s.run(checks); } catch (e) { error = e.message; }
    const pass = !error && checks.length > 0 && checks.every(x => x.pass);
    return { i, s, checks, state, error, pass };
  });
}
