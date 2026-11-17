/* Scenarios for the smaller-release cuts of the dayworks billing prototype. The same file runs in the lean and middle
   folders; a scenario with `only` runs in that release alone. Each runs on a fresh project through the same engine the
   screens use. Rules: coordinator brief of 2026-11-18 (Alec), on top of the full prototype's decided rules. */

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

const SCENARIOS = [
  /* ───── Shared ───── */
  { story: 'Picker', title: 'Picker offers Approved and Costed dockets only',
    text: 'The From dockets picker lists Approved and Costed dockets that are not on a variation and not Not claimable. Draft, Ready for Review, Submitted, Invoiced and Rejected are not offered. Unmapped and overlapping dockets are listed and blocked. There is no not-yet-approved warning.',
    run(c) {
      const st = baseState();
      [['D301', 'Draft'], ['D302', 'Ready for Review'], ['D303', 'Submitted'], ['D304', 'Approved'], ['D305', 'Costed'], ['D306', 'Invoiced'], ['D307', 'Rejected']].forEach(([id, s], i) => addDocket(st, id, '2026-11-0' + (i + 2), s, [lab('jo', '07:00', '15:00')]));
      addDocket(st, 'D308', '2026-11-09', 'Approved', [lab('tom', '07:00', '15:00', 0, [{ type: 'Tool' }])]);
      addDocket(st, 'D309', '2026-11-09', 'Approved', [lab('mel', '07:00', '15:00')]);
      markNotClaimable(st, 'D309', '');
      _chk(c, 'Listed', _ids(st), ['D304', 'D305', 'D308']);
      _chk(c, 'Unmapped D308 blocked', [_row(st, 'D308').tickable, _row(st, 'D308').block], [false, 'Unmapped: Tool allowance']);
      _chk(c, 'No not-yet-approved highlight', pickerRows(st, 'variation').filter(r => r.highlight === 'warn').length, 0);
      _refused(c, 'Submitted refused on save', () => createVariation(st, ['D303']), 'D303 is Submitted: only Approved or Costed dockets can be added');
      _refused(c, 'Invoiced refused on save', () => createVariation(st, ['D306']), 'D306 is Invoiced: only Approved or Costed dockets can be added');
      const v = createVariation(st, ['D304', 'D305']);
      _chk(c, 'Submit has no warning', submitVariation(st, v.id), { ok: true });
      return st;
    } },
  { story: 'Variation', title: 'One subtask line per docket at its calculator value; more while Pending and not submitted',
    text: 'From dockets creates a Pending variation with one line per docket at its calculator value, the docket attached and an "On V0xx" marker. More dockets can be added while it is Pending and not submitted; after submit they cannot.',
    run(c) {
      const st = baseState();
      addDocket(st, 'D201', '2026-11-02', 'Approved', [lab('tom', '07:00', '15:00')]);
      addDocket(st, 'D210', '2026-11-02', 'Approved', [wet('EX-07', 'sam', '07:00', '16:00')]);
      addDocket(st, 'D213', '2026-11-04', 'Costed', [sub('Traffic control', 1200)]);
      const v = createVariation(st, ['D201'], { id: 'V011' });
      _chk(c, 'Pending, one line at $560', [v.status, v.lines.map(l => varLineValue(st, v, l))], ['Pending', [560]]);
      _chk(c, 'Marker', 'On ' + docketHome(st, 'D201').rec.id, 'On V011');
      _allowed(c, 'Add D210 while Pending and not submitted', () => addToVariation(st, 'V011', ['D210']));
      _chk(c, 'Two lines', v.lines.map(l => varLineValue(st, v, l)), [560, 1710]);
      submitVariation(st, 'V011');
      _chk(c, 'Submitted Amount filled, status Pending', [varSubmittedAmount(st, v), v.status], [2270, 'Pending']);
      _refused(c, 'Adding after submit refused', () => addToVariation(st, 'V011', ['D213']), 'V011 has been submitted and cannot take more dockets');
      return st;
    } },
  { story: 'Locking', title: 'A docket on a variation is locked until its line is removed',
    text: 'D201 on Pending V011 is read-only: no edits, no Reopen, no Not claimable. Removing its line frees it; it can then be reopened, edited and re-added.',
    run(c) {
      const st = baseState();
      addDocket(st, 'D201', '2026-11-02', 'Approved', [lab('tom', '07:00', '15:00')]);
      createVariation(st, ['D201'], { id: 'V011' });
      _refused(c, 'Edit refused', () => editHours(st, 'D201', 0, 6), 'D201 is read-only: it is on pending variation V011; remove its line to free it');
      _refused(c, 'Reopen refused', () => reopenSigned(st, 'D201'), 'D201 is read-only: it is on pending variation V011; remove its line to free it');
      _refused(c, 'Not claimable refused', () => markNotClaimable(st, 'D201', ''), 'Remove this docket from variation V011 first');
      removeFromVariation(st, 'V011', 'D201');
      _chk(c, 'Freed', docketHome(st, 'D201'), null);
      reopenSigned(st, 'D201');
      editHours(st, 'D201', 0, 6);
      _chk(c, 'Reopened and edited: Submitted', getDocket(st, 'D201').status, 'Submitted');
      _refused(c, 'Not offered until signed again', () => addToVariation(st, 'V011', ['D201']), 'D201 is Submitted: only Approved or Costed dockets can be added');
      approveDocket(st, 'D201');
      _allowed(c, 'Signed again: re-added', () => addToVariation(st, 'V011', ['D201']));
      _chk(c, 'Re-added at the new value', varLineValue(st, getVar(st, 'V011'), getVar(st, 'V011').lines[0]), 420);
      return st;
    } },
  { story: 'Release', title: 'Deleting a line, Non-Claimable and Rejected free the dockets',
    text: 'Deleting a line frees that docket. Setting a Pending variation Non-Claimable, or the client rejecting a submitted one, keeps it on the register and frees all its dockets.',
    run(c) {
      const st = baseState();
      ['D501', 'D502', 'D503', 'D504'].forEach((id, i) => addDocket(st, id, '2026-11-0' + (i + 3), 'Approved', [lab('jo', '07:00', '15:00')]));
      createVariation(st, ['D501', 'D502'], { id: 'V019' });
      removeFromVariation(st, 'V019', 'D502');
      _chk(c, 'Deleted line: D502 offered again', _ids(st).includes('D502'), true);
      releaseVariation(st, 'V019', 'Non-Claimable');
      _chk(c, 'Non-Claimable on the register, D501 freed', [getVar(st, 'V019').status, _ids(st).includes('D501')], ['Non-Claimable', true]);
      createVariation(st, ['D503', 'D504'], { id: 'V020' }); submitVariation(st, 'V020');
      releaseVariation(st, 'V020', 'Rejected');
      _chk(c, 'Rejected on the register, both freed', [getVar(st, 'V020').status, _ids(st).includes('D503'), _ids(st).includes('D504')], ['Rejected', true, true]);
      return st;
    } },
  { story: 'Approval', title: 'Approved Amount editable: less is Partial Approved, no shortfall marker',
    text: 'Approving with an editable Approved Amount: less than submitted is Partial Approved with no shortfall marker or adjustment line; the same or more is Approved. The contract sum moves by the approved amount.',
    run(c) {
      const st = baseState();
      addDocket(st, 'D601', '2026-11-09', 'Approved', [mat('Road base', { qty: 40 })]);
      addDocket(st, 'D602', '2026-11-10', 'Approved', [sub('Traffic control', 2000)]);
      const v = createVariation(st, ['D601'], { id: 'V021' }); submitVariation(st, 'V021');
      const before = contractSum(st);
      _allowed(c, 'Approve $1,500 of $1,800 with no marker', () => approveVariation(st, 'V021', 1500));
      _chk(c, 'Partial Approved, no adjustment', [v.status, v.approvedAmount, v.adjustment], ['Partial Approved', 1500, null]);
      _chk(c, 'Contract sum moves by', round2(contractSum(st) - before), 1500);
      const w = createVariation(st, ['D602'], { id: 'V022' }); submitVariation(st, 'V022');
      approveVariation(st, 'V022', 2500);
      _chk(c, 'More than submitted: Approved', [w.status, w.approvedAmount, w.adjustment], ['Approved', 2500, null]);
      return st;
    } },
  { story: 'Claim', title: 'Dockets reach a claim only via their variation, by percent on the Variation tab',
    text: 'There is no Dayworks tab: a claim cannot take dockets directly. An approved docket variation is claimed by percent to date on the Variation tab; a lower percent on a later claim is a credit line, and a claim below zero can be approved as a credit note.',
    run(c) {
      const st = baseState(); st.today = '2026-11-16';
      addDocket(st, 'D201', '2026-11-02', 'Approved', [lab('tom', '07:00', '15:00')]);
      _refused(c, 'Claim with dockets refused', () => createClaim(st, NOV1, ['D201']), 'Dockets reach a claim only through their approved variation');
      createVariation(st, ['D201'], { id: 'V012' }); submitVariation(st, 'V012'); approveVariation(st, 'V012');
      const c4 = createClaim(st, NOV1, [], { id: 4 });
      _refused(c, 'Adding dockets to a claim refused', () => claimAddDockets(st, '4', ['D201']), 'Dockets reach a claim only through their approved variation');
      setVarPct(st, '4', 'V012', 60);
      _chk(c, 'Variation tab: 60% of $560', claimVarRows(st, c4)[0].value, 336);
      approveClaim(st, '4');
      createClaim(st, { from: '2026-11-16', to: '2026-11-30' }, [], { id: 5, vars: ['V012'] }); setVarPct(st, '5', 'V012', 20);
      const t = claimTotals(st, getClaim(st, '5'));
      _chk(c, 'Credit line 40% of $560', claimVarRows(st, getClaim(st, '5'))[0].value, -224);
      _chk(c, 'Negative claim', [t.gross, t.negative], [-224, true]);
      approveClaim(st, '5');
      _chk(c, 'Approved as a credit note', claimAccountingLabel(st, getClaim(st, '5')), 'Sent to accounting as a credit note');
      return st;
    } },
  { story: 'Claim', title: 'No auto-Invoiced: dockets keep their status; marked Invoiced by hand',
    text: 'V012 (D201 Approved, D218 Costed) claimed to 100% on an approved claim leaves both dockets as they were. A user marks D201 Invoiced by hand, which is allowed while it sits on the approved variation.',
    run(c) {
      const st = baseState(); st.today = '2026-11-16';
      addDocket(st, 'D201', '2026-11-02', 'Approved', [lab('tom', '07:00', '15:00')]);
      addDocket(st, 'D218', '2026-11-09', 'Costed', [lab('mel', '07:00', '15:00')]);
      createVariation(st, ['D201', 'D218'], { id: 'V012' }); submitVariation(st, 'V012'); approveVariation(st, 'V012');
      createClaim(st, NOV1, [], { id: 4 }); const r = approveClaim(st, '4');
      _chk(c, 'Claimed to 100%', varClaimedPct(st, 'V012'), 100);
      _chk(c, 'Nothing moved to Invoiced', [r.invoiced, getDocket(st, 'D201').status, getDocket(st, 'D218').status], [[], 'Approved', 'Costed']);
      _allowed(c, 'Mark D201 as invoiced by hand', () => markInvoiced(st, 'D201'));
      _chk(c, 'D201 Invoiced, still on V012 and locked', [getDocket(st, 'D201').status, docketHome(st, 'D201').rec.id, isLocked(st, 'D201')], ['Invoiced', 'V012', true]);
      return st;
    } },
  { story: 'Freeze', title: 'Approval freezes lines; a later rate change moves nothing',
    text: 'On approval every line is frozen. A Leading Hand rate change effective after the approval leaves the approved variation and its claim unchanged.',
    run(c) {
      const st = baseState(); st.today = '2026-11-16';
      addDocket(st, 'D201', '2026-11-02', 'Approved', [lab('tom', '07:00', '15:00')]);
      const v = createVariation(st, ['D201'], { id: 'V012' }); submitVariation(st, 'V012'); approveVariation(st, 'V012');
      _refused(c, 'Effective date before the approval refused', () => publishVersion(st, 'labour', 'Leading Hand', 75, '2026-11-01'), 'Effective date cannot be before the last approved claim or approved variation (16/11/2026)');
      publishVersion(st, 'labour', 'Leading Hand', 75, '2026-11-17');
      _chk(c, 'Line frozen', [varLineValue(st, v, v.lines[0]), v.approvedAmount], [560, 560]);
      return st;
    } },

  /* ───── Lean only: snapshot and Refresh ───── */
  { only: 'lean', story: 'Snapshot', title: 'Lines are a snapshot: a calculator change does not move them',
    text: 'V016 lines are taken at the calculator value when each docket is added. A Leading Hand rate change to $75 from 1 Nov raises D209 to $900 on the calculator, but the line stays $840, the Submitted Amount stays $5,000, and nothing is flagged.',
    run(c) {
      const st = baseState(); st.today = '2026-11-16';
      const v = _v016(st); submitVariation(st, 'V016');
      _chk(c, 'Submitted at', varSubmittedAmount(st, v), 5000);
      publishVersion(st, 'labour', 'Leading Hand', 75, '2026-11-01');
      _chk(c, 'Calculator now says $900 for D209', priceDocket(st, getDocket(st, 'D209')).total, 900);
      _chk(c, 'Line still $840', varLineValue(st, v, v.lines[0]), 840);
      _chk(c, 'Submitted Amount still $5,000', varSubmittedAmount(st, v), 5000);
      _chk(c, 'No flags, no revision prompt', [varLineChanged(st, v, v.lines[0]), varSubmittedChanged(st, v), varNeedsRevision(st, v)], [false, false, false]);
      return st;
    } },
  { only: 'lean', story: 'Snapshot', title: 'Refresh from dockets reprices every line and logs old to new',
    text: 'After the rate change, "Refresh from dockets" on Pending V016 moves D209 from $840 to $900 and writes it to the history. Approval then freezes $5,060.',
    run(c) {
      const st = baseState(); st.today = '2026-11-16';
      const v = _v016(st); submitVariation(st, 'V016');
      publishVersion(st, 'labour', 'Leading Hand', 75, '2026-11-01');
      _chk(c, 'Lines repriced', refreshFromDockets(st, 'V016'), 1);
      _chk(c, 'D209 line now', varLineValue(st, v, v.lines[0]), 900);
      _chk(c, 'History $840 to $900', _hasHist(v, 'D209', 840, 900), true);
      _chk(c, 'Submitted Amount follows the refreshed lines', varSubmittedAmount(st, v), 5060);
      approveVariation(st, 'V016');
      _chk(c, 'Approved and frozen at', [v.status, v.approvedAmount], ['Approved', 5060]);
      _refused(c, 'Refresh after approval refused', () => refreshFromDockets(st, 'V016'), 'Only a Pending variation can be refreshed');
      return st;
    } },

  /* ───── Middle only: live repricing ───── */
  { only: 'middle', story: 'Live', title: 'Lines follow the calculator until approval, flagged',
    text: 'On Pending V016 (not submitted), a Leading Hand rate change to $75 from 1 Nov moves D209 from $840 to $900; the line is flagged "changed since added" and the change is in the history.',
    run(c) {
      const st = baseState(); st.today = '2026-11-16';
      const v = _v016(st);
      publishVersion(st, 'labour', 'Leading Hand', 75, '2026-11-01');
      _chk(c, 'D209 line now', varLineValue(st, v, v.lines[0]), 900);
      _chk(c, 'Changed since added', varLineChanged(st, v, v.lines[0]), true);
      _chk(c, 'History $840 to $900', _hasHist(v, 'D209', 840, 900), true);
      _chk(c, 'No Refresh in this release', (() => { try { refreshFromDockets(st, 'V016'); return 'allowed'; } catch (e) { return e.message; } })(), 'Refresh is only in the lean release');
      return st;
    } },
  { only: 'middle', story: 'Live', title: 'Submitted variation: changed since submitted, revision prompt, approval freezes',
    text: 'V016 submitted at $5,000; the rate change moves it to $5,060 and it shows "changed since submitted" with a Send new revision prompt. Sending revision 2 clears the prompt. Approval freezes the lines and clears the flags; a later rate change moves nothing.',
    run(c) {
      const st = baseState(); st.today = '2026-11-16';
      const v = _v016(st); submitVariation(st, 'V016');
      publishVersion(st, 'labour', 'Leading Hand', 75, '2026-11-01');
      _chk(c, 'Submitted Amount follows', varSubmittedAmount(st, v), 5060);
      _chk(c, 'Changed since submitted, revision prompted', [varSubmittedChanged(st, v), varNeedsRevision(st, v)], [true, true]);
      sendRevision(st, 'V016');
      _chk(c, 'Revision 2 sent, prompt cleared', [v.revision, varNeedsRevision(st, v)], [2, false]);
      approveVariation(st, 'V016');
      _chk(c, 'Frozen, flags cleared', [v.status, v.approvedAmount, v.lines.map(l => varLineChanged(st, v, l))], ['Approved', 5060, [false, false, false]]);
      publishVersion(st, 'labour', 'Leading Hand', 80, '2026-11-17');
      _chk(c, 'Later rate change moves nothing', varLineValue(st, v, v.lines[0]), 900);
      return st;
    } },
  { only: 'middle', story: 'Live', title: 'Approving while changed since submitted is allowed and recorded',
    text: 'V016 still shows changed since submitted ($5,000 seen, $5,060 now). Approval goes through at the default $5,060 and the warning is recorded.',
    run(c) {
      const st = baseState(); st.today = '2026-11-16';
      const v = _v016(st); submitVariation(st, 'V016');
      publishVersion(st, 'labour', 'Leading Hand', 75, '2026-11-01');
      let r = null;
      _allowed(c, 'Approve', () => { r = approveVariation(st, 'V016'); });
      _chk(c, 'Warning says the client saw $5,000', !!r && /client saw \$5,000\.00/.test(r.warning), true);
      _chk(c, 'Recorded', v.decisions.length, 1);
      _chk(c, 'Approved at the current total', v.approvedAmount, 5060);
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
