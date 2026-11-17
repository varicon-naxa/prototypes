/* Scenarios: every worked example in VAR-23036 and VAR-23037 with Alec's answers of 2026-11-16 and 2026-11-17, translated
   to Varicon's own statuses (checked in the app 2026-11-17): variations Pending / Approved / Partial Approved /
   Non-Claimable / Rejected, claims Draft / Submitted / Approved ("issued" in the tickets = Approved), dockets Draft /
   Ready for Review / Submitted / Approved / Costed / Invoiced / Rejected. Plus ten scenarios for the 2026-11-17 status
   decisions. Each runs on a fresh project through the same engine the UI uses. */

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
function _row(st, mode, id, period) { return pickerRows(st, mode, period).find(r => r.d.id === id) || null; }
function _ids(st, mode, period) { return pickerRows(st, mode, period).map(r => r.d.id); }
function _hasHist(rec, docket, oldV, newV) { return rec.history.some(h => h.docket === docket && Math.abs(h.old - oldV) < 0.005 && Math.abs(h.new - newV) < 0.005); }
const NOV1 = { from: '2026-11-01', to: '2026-11-15' };

const SCENARIOS = [
  /* ───── VAR-23036 Convert daywork dockets into a variation ───── */
  { story: 'VAR-23036', title: 'D201 approved and D202 submitted on a new variation; submit warns',
    text: 'Given D201 (approved) and D202 (submitted), when a variation is created from both, then two lines priced from the calculator, both dockets attached, D202 highlighted, and submitting warns "1 docket not yet approved" and allows it.',
    run(c) {
      const st = baseState(); st.today = '2026-11-05';
      addDocket(st, 'D201', '2026-11-02', 'Approved', [lab('tom', '07:00', '15:00')]);
      addDocket(st, 'D202', '2026-11-04', 'Submitted', [lab('jo', '07:00', '15:00')]);
      _chk(c, 'D202 highlighted as unapproved', _row(st, 'variation', 'D202').highlight, 'warn');
      _chk(c, 'D202 can be ticked', _row(st, 'variation', 'D202').tickable, true);
      const v = createVariation(st, ['D201', 'D202']);
      _chk(c, 'Two lines', v.lines.length, 2);
      _chk(c, 'Lines = calculator values', v.lines.map(l => varLineValue(st, v, l)), [560, 480]);
      _chk(c, 'Both dockets attached', ['D201', 'D202'].map(id => docketHome(st, id).rec.id), [v.id, v.id]);
      _chk(c, 'Submit warns', submitVariation(st, v.id).message, '1 docket not yet approved');
      submitVariation(st, v.id, { confirm: true });
      _chk(c, 'Submitted after confirming (status stays Pending), decision recorded', [v.status, !!v.submittedOn, v.decisions.length], ['Pending', true, 1]);
      return st;
    } },
  { story: 'VAR-23036', title: '9h Monday wet hire reads $1,710, no margin',
    text: 'Given a 9h Monday wet-hire docket priced at $1,710, when added, then the line reads $1,710 ex GST, no margin.',
    run(c) {
      const st = baseState();
      addDocket(st, 'D210', '2026-11-02', 'Approved', [wet('EX-07', 'sam', '07:00', '16:00')]);
      const v = createVariation(st, ['D210']);
      _chk(c, 'Project Plant cost-plus margin is set', st.project.margins.Plant, 8);
      _chk(c, 'Line reads (ex GST)', varLineValue(st, v, v.lines[0]), 1710);
      _chk(c, 'Margin applied', round2(varTotal(st, v) - 1710), 0);
      return st;
    } },
  { story: 'VAR-23036', title: 'D205 wet hire with breaker plus mobilise reads $2,540',
    text: 'Given D205 has a wet-hire line with a breaker ($2,090) and a $450 mobilise charge, when added, then the line reads $2,540.',
    run(c) {
      const st = baseState();
      addDocket(st, 'D205', '2026-11-09', 'Approved', [wet('EX-15', 'lee', '07:00', '16:00', 0, ['Breaker 1t']), flt('EX-15', 'mob')]);
      const p = priceDocket(st, getDocket(st, 'D205'));
      _chk(c, 'Wet-hire line incl. breaker', p.lines[0].value, 2090);
      _chk(c, 'Mobilise charge', p.lines[1].value, 450);
      const v = createVariation(st, ['D205']);
      _chk(c, 'Variation line reads', varLineValue(st, v, v.lines[0]), 2540);
      return st;
    } },
  { story: 'VAR-23036', title: 'D204 rejected: highlighted, cannot be ticked',
    text: 'Given D204 is rejected, when the picker opens, then D204 is highlighted and cannot be ticked.',
    run(c) {
      const st = baseState();
      addDocket(st, 'D204', '2026-11-10', 'Rejected', [lab('jo', '07:00', '13:00')]);
      const r = _row(st, 'variation', 'D204');
      _chk(c, 'Highlighted with reason', [r.highlight, r.block], ['block', 'Rejected']);
      _chk(c, 'Cannot be ticked', r.tickable, false);
      _refused(c, 'Enforced on save', () => createVariation(st, ['D204']), 'D204 is Rejected and cannot be added');
      return st;
    } },
  { story: 'VAR-23036', title: 'D206 unmapped Tool allowance: cannot be ticked',
    text: 'Given D206 carries an unmapped Tool allowance, when the picker opens, then D206 shows "Unmapped: Tool allowance" and cannot be ticked.',
    run(c) {
      const st = baseState();
      addDocket(st, 'D206', '2026-11-11', 'Submitted', [lab('tom', '07:00', '15:00', 0, [{ type: 'Tool' }])]);
      const r = _row(st, 'variation', 'D206');
      _chk(c, 'Reason shown', r.block, 'Unmapped: Tool allowance');
      _chk(c, 'Cannot be ticked', r.tickable, false);
      return st;
    } },
  { story: 'VAR-23036', title: 'D207 Not claimable: not listed',
    text: 'Given D207 is Not claimable, when the picker opens, then D207 is not listed.',
    run(c) {
      const st = baseState();
      addDocket(st, 'D207', '2026-11-12', 'Draft', [lab('cris', '07:00', '11:00')]);
      markNotClaimable(st, 'D207', '');
      _chk(c, 'Not in the picker', _ids(st, 'variation').includes('D207'), false);
      _refused(c, 'Enforced on save', () => createVariation(st, ['D207']), 'D207 is Not claimable');
      return st;
    } },
  { story: 'VAR-23036', title: 'Approved D208 edited on unsubmitted V015 returns to Submitted',
    text: 'Given D208 ($840) is on unsubmitted V015 and was Approved, when its hours are edited down to 8h, then D208 returns to Submitted and the V015 line reads $560, flagged.',
    run(c) {
      const st = baseState();
      addDocket(st, 'D208', '2026-11-12', 'Approved', [lab('tom', '06:00', '17:00', 0.5)]);
      const v = createVariation(st, ['D208'], { id: 'V015' });
      _chk(c, 'Line when added', v.lines[0].added, 840);
      editHours(st, 'D208', 0, 8);
      _chk(c, 'D208 status', getDocket(st, 'D208').status, 'Submitted');
      _chk(c, 'Line now reads', varLineValue(st, v, v.lines[0]), 560);
      _chk(c, 'Line flagged as changed since added', varLineChanged(st, v, v.lines[0]), true);
      _chk(c, 'V015 history: $840 to $560', _hasHist(v, 'D208', 840, 560), true);
      _chk(c, 'Submit now warns', submitVariation(st, 'V015').message, '1 docket not yet approved');
      return st;
    } },
  { story: 'VAR-23036', title: 'New calculator version moves submitted V016; revision prompted',
    text: 'Given V016 was submitted at $5,000 including D209 at $840, when a new calculator version raises D209 to $900, then the line reads $900, the submitted amount $5,060, both flagged, and the user is prompted to send a new revision.',
    run(c) {
      const st = baseState(); st.today = '2026-11-16';
      addDocket(st, 'D209', '2026-11-10', 'Approved', [lab('tom', '06:00', '17:00', 0.5)]);
      addDocket(st, 'D210', '2026-11-02', 'Approved', [wet('EX-07', 'sam', '07:00', '16:00')]);
      addDocket(st, 'D211', '2026-11-16', 'Approved', [wet('EX-07', 'sam', '07:00', '15:00', 0, ['Breaker 1t']), mat('Concrete', { cost: 600 })]);
      const v = createVariation(st, ['D209', 'D210', 'D211'], { id: 'V016' }); submitVariation(st, 'V016');
      _chk(c, 'Submitted at', varSubmittedAmount(st, v), 5000);
      publishVersion(st, 'labour', 'Leading Hand', 75, '2026-11-01');
      _chk(c, 'D209 line reads', varLineValue(st, v, v.lines[0]), 900);
      _chk(c, 'D209 line flagged', varLineChanged(st, v, v.lines[0]), true);
      _chk(c, 'Submitted amount reads', varSubmittedAmount(st, v), 5060);
      _chk(c, 'Changed since submitted', varSubmittedChanged(st, v), true);
      _chk(c, 'Send new revision prompted', varNeedsRevision(st, v), true);
      _chk(c, 'History: D209 $840 to $900', _hasHist(v, 'D209', 840, 900), true);
      sendRevision(st, 'V016');
      _chk(c, 'Revision 2 sent, prompt cleared', [v.revision, varNeedsRevision(st, v)], [2, false]);
      approveVariation(st, 'V016');
      _chk(c, 'Approved: changed-since-added flags cleared', v.lines.map(l => varLineChanged(st, v, l)), [false, false, false]);
      _chk(c, 'Approved: history still holds $840 to $900', _hasHist(v, 'D209', 840, 900), true);
      _chk(c, 'Approved amount', v.approvedAmount, 5060);
      return st;
    } },
  { story: 'VAR-23036', title: 'V016 approved while changed since submitted: warned, recorded, defaults to $5,060',
    text: 'Given V016 still shows changed since submission, when the user approves it, then a warning says the client saw $5,000, approval goes through, and the warning is recorded. Decided 2026-11-16: the approved amount defaults to the current total, $5,060, not the $5,000 submitted.',
    run(c) {
      const st = baseState(); st.today = '2026-11-16';
      addDocket(st, 'D209', '2026-11-10', 'Approved', [lab('tom', '06:00', '17:00', 0.5)]);
      addDocket(st, 'D210', '2026-11-02', 'Approved', [wet('EX-07', 'sam', '07:00', '16:00')]);
      addDocket(st, 'D211', '2026-11-16', 'Approved', [wet('EX-07', 'sam', '07:00', '15:00', 0, ['Breaker 1t']), mat('Concrete', { cost: 600 })]);
      const v = createVariation(st, ['D209', 'D210', 'D211'], { id: 'V016' }); submitVariation(st, 'V016');
      publishVersion(st, 'labour', 'Leading Hand', 75, '2026-11-01');
      _chk(c, 'Still changed since submitted', varSubmittedChanged(st, v), true);
      _chk(c, 'Client last saw (submitted)', v.submittedBase, 5000);
      _chk(c, 'Decided 2026-11-16: approved amount defaults to the current total', defaultApprovedAmount(st, v), 5060);
      let r = null;
      _allowed(c, 'Approval goes through', () => { r = approveVariation(st, 'V016'); });
      _chk(c, 'Warning says the client saw $5,000', !!r && /client saw \$5,000\.00/.test(r.warning), true);
      _chk(c, 'Approved', v.status, 'Approved');
      _chk(c, 'Warning recorded on the variation', v.decisions.some(x => /client saw \$5,000\.00/.test(x.what)), true);
      _chk(c, 'Warning in the history', v.history.some(x => /client saw \$5,000\.00/.test(x.what)), true);
      _chk(c, 'Approved at the default: current total, not the $5,000 submitted', v.approvedAmount, 5060);
      _chk(c, 'No adjustment at the default', v.adjustment, null);
      return st;
    } },
  { story: 'VAR-23036', title: 'D212 removed from submitted V016: released, revision prompted',
    text: 'Given D212 is removed from submitted V016, when the removal saves, then D212 is released, V016 shows changed since submission, and a new revision is prompted.',
    run(c) {
      const st = baseState(); st.today = '2026-11-16';
      addDocket(st, 'D209', '2026-11-10', 'Approved', [lab('tom', '06:00', '17:00', 0.5)]);
      addDocket(st, 'D210', '2026-11-02', 'Approved', [wet('EX-07', 'sam', '07:00', '16:00')]);
      addDocket(st, 'D212', '2026-11-03', 'Approved', [mat('Road base', { qty: 12 }), lab('jo', '07:00', '15:00')]);
      const v = createVariation(st, ['D209', 'D210', 'D212'], { id: 'V016' }); submitVariation(st, 'V016');
      _chk(c, 'D212 has no flag (any docket can come off)', docketIssue(st, getDocket(st, 'D212')), null);
      _allowed(c, 'Removal saves', () => removeFromVariation(st, 'V016', 'D212'));
      _chk(c, 'D212 released', [docketHome(st, 'D212'), _ids(st, 'variation').includes('D212')], [null, true]);
      _chk(c, 'V016 still Pending and submitted', [v.status, !!v.submittedOn], ['Pending', true]);
      _chk(c, 'Changed since submitted', varSubmittedChanged(st, v), true);
      _chk(c, 'New revision prompted', varNeedsRevision(st, v), true);
      _chk(c, 'History: D212 removed', _hasHist(v, 'D212', 1020, 0), true);
      sendRevision(st, 'V016');
      _chk(c, 'Revision 2 sent, prompt cleared', [v.revision, varNeedsRevision(st, v)], [2, false]);
      return st;
    } },
  { story: 'VAR-23036', title: 'Client rejects D210 on submitted V017: approval refused',
    text: 'Given the client rejects D210 while it is on submitted V017, when the user tries to approve V017, then it is refused until D210 is fixed or removed.',
    run(c) {
      const st = baseState();
      addDocket(st, 'D201', '2026-11-02', 'Approved', [lab('tom', '07:00', '15:00')]);
      addDocket(st, 'D210', '2026-11-02', 'Submitted', [wet('EX-07', 'sam', '07:00', '16:00')]);
      createVariation(st, ['D201', 'D210'], { id: 'V017' }); submitVariation(st, 'V017', { confirm: true });
      rejectDocket(st, 'D210');
      _chk(c, 'D210 stays on V017', docketHome(st, 'D210').rec.id, 'V017');
      _chk(c, 'D210 line flagged with the reason', docketIssue(st, getDocket(st, 'D210')), 'Rejected by client');
      _refused(c, 'Approve refused', () => approveVariation(st, 'V017'), 'V017 cannot be approved until D210 is fixed or removed (D210: Rejected by client)');
      submitDocket(st, 'D210');
      _allowed(c, 'Fixed and resubmitted: approve allowed', () => approveVariation(st, 'V017'));
      return st;
    } },
  { story: 'VAR-23036', title: 'Client approves V018 at $9,000 against $10,000 submitted',
    text: 'Given V018 was submitted at $10,000 from four dockets, when the client approves $9,000, then the docket lines keep their values, a -$1,000 adjustment is recorded and must be marked absorbed, under dispute or to resubmit, and the contract sum moves by $9,000.',
    run(c) {
      const st = baseState(); st.today = '2026-11-16';
      addDocket(st, 'D209', '2026-11-10', 'Approved', [lab('tom', '06:00', '17:00', 0.5)]);
      addDocket(st, 'D210', '2026-11-02', 'Approved', [wet('EX-07', 'sam', '07:00', '16:00')]);
      addDocket(st, 'D211', '2026-11-16', 'Approved', [wet('EX-07', 'sam', '07:00', '15:00', 0, ['Breaker 1t']), mat('Concrete', { cost: 600 })]);
      addDocket(st, 'D212', '2026-11-04', 'Approved', [mat('Road base', { qty: 72 }), wet('EX-07', 'lee', '07:00', '15:00', 0, ['Breaker 1t'])]);
      const v = createVariation(st, ['D209', 'D210', 'D211', 'D212'], { id: 'V018' }); submitVariation(st, 'V018');
      _chk(c, 'Submitted at', varSubmittedAmount(st, v), 10000);
      const before = contractSum(st);
      _refused(c, 'Approve at $9,000 without a shortfall status refused', () => approveVariation(st, 'V018', 9000), 'Mark the -$1,000.00 adjustment absorbed, under dispute or to resubmit');
      approveVariation(st, 'V018', 9000, 'Absorbed');
      _chk(c, 'Docket lines keep their values', v.lines.map(l => varLineValue(st, v, l)), [840, 1710, 2450, 5000]);
      _chk(c, 'Decided 2026-11-17: less than submitted is Partial Approved', v.status, 'Partial Approved');
      _chk(c, 'One adjustment', v.adjustment.amount, -1000);
      _chk(c, 'Adjustment marked', v.adjustment.status, 'Absorbed');
      _chk(c, 'Contract sum moves by', round2(contractSum(st) - before), 9000);
      return st;
    } },
  { story: 'VAR-23036', title: 'Client approves V020 at $4,300 against $4,000: +$300, no status',
    text: 'Given V020 was submitted at $4,000, when the client approves $4,300, then a +$300 adjustment is recorded with no status needed and the contract sum moves by $4,300.',
    run(c) {
      const st = baseState(); st.today = '2026-11-16';
      addDocket(st, 'D601', '2026-11-09', 'Approved', [mat('Road base', { qty: 40 })]);
      addDocket(st, 'D602', '2026-11-10', 'Approved', [sub('Traffic control', 2000)]);
      const v = createVariation(st, ['D601', 'D602'], { id: 'V020' }); submitVariation(st, 'V020');
      _chk(c, 'Submitted at', varSubmittedAmount(st, v), 4000);
      const before = contractSum(st);
      _allowed(c, 'Approve at $4,300 with no status', () => approveVariation(st, 'V020', 4300));
      _chk(c, 'More than submitted is Approved', v.status, 'Approved');
      _chk(c, 'Docket lines keep their values', v.lines.map(l => varLineValue(st, v, l)), [1800, 2200]);
      _chk(c, 'One +$300 adjustment', v.adjustment.amount, 300);
      _chk(c, 'No status', v.adjustment.status, null);
      _refused(c, 'Status cannot be set on a higher approval', () => setAdjustmentStatus(st, 'V020', 'Absorbed'), 'A higher approved amount needs no status');
      _chk(c, 'Contract sum moves by', round2(contractSum(st) - before), 4300);
      return st;
    } },
  { story: 'VAR-23036', title: 'Decided 2026-11-17: V019 set Non-Claimable, submitted or not, stays on the register; dockets freed',
    text: 'Given V019 holds two dockets, submitted or not, when the PM sets it Non-Claimable (replaces Withdrawn), then it stays on the register as Non-Claimable with its history and both dockets are offered again.',
    run(c) {
      let st;
      ['unsubmitted', 'submitted'].forEach(kind => {
        st = baseState();
        addDocket(st, 'D501', '2026-11-04', 'Approved', [lab('jo', '07:00', '15:00')]);
        addDocket(st, 'D502', '2026-11-05', 'Approved', [lab('tom', '07:00', '15:00')]);
        createVariation(st, ['D501', 'D502'], { id: 'V019' });
        if (kind === 'submitted') submitVariation(st, 'V019');
        _allowed(c, 'Set ' + kind + ' V019 Non-Claimable', () => releaseVariation(st, 'V019', 'Non-Claimable'));
        const v = st.variations.find(x => x.id === 'V019');
        _chk(c, kind + ': on the register as Non-Claimable', v && v.status, 'Non-Claimable');
        _chk(c, kind + ': history kept', v.history.length >= 2 && /^Non-Claimable/.test(v.history[v.history.length - 1].what), true);
        _chk(c, kind + ': both offered again', ['D501', 'D502'].map(id => _ids(st, 'variation').includes(id)), [true, true]);
      });
      return st;
    } },
  { story: 'VAR-23036', title: 'D201 on approved V012: not offered; V012 offered at 100% to date',
    text: 'Given D201 is on approved V012, when the next claim is created, then D201 is not offered and V012 is offered at 100% to date, editable to a lower percent.',
    run(c) {
      const st = baseState(); st.today = '2026-11-16';
      addDocket(st, 'D201', '2026-11-02', 'Approved', [lab('tom', '07:00', '15:00')]);
      createVariation(st, ['D201'], { id: 'V012' }); submitVariation(st, 'V012'); approveVariation(st, 'V012');
      _chk(c, 'D201 not offered', _ids(st, 'claim', NOV1).includes('D201'), false);
      _chk(c, 'V012 offered', offeredVariations(st).map(v => v.id), ['V012']);
      const cl = createClaim(st, NOV1, []);
      _chk(c, 'V012 at 100%', claimVarRows(st, cl).map(l => [l.variation, l.pct, l.value]), [['V012', 100, 560]]);
      setVarPct(st, cl.id, 'V012', 60);
      _chk(c, 'Edited to 60%', claimVarRows(st, cl)[0].value, 336);
      return st;
    } },

  /* ───── VAR-23037 Convert daywork dockets into a progress claim ───── */
  { story: 'VAR-23037', title: 'D101 and D102 in period pre-ticked; approve warns',
    text: 'Given D101 (approved, 3 Nov) and D102 (submitted, 9 Nov) on a claim for 1 to 15 Nov, when created, then both are pre-ticked, D102 highlighted, and issuing warns "1 docket not yet approved" and allows it.',
    run(c) {
      const st = baseState(); st.today = '2026-11-16';
      addDocket(st, 'D101', '2026-11-03', 'Approved', [lab('tom', '06:00', '17:00', 0.5)]);
      addDocket(st, 'D102', '2026-11-09', 'Submitted', [wet('EX-07', 'sam', '07:00', '16:00')]);
      const rows = pickerRows(st, 'claim', NOV1);
      _chk(c, 'Both pre-ticked', rows.map(r => [r.d.id, r.preTick]), [['D101', true], ['D102', true]]);
      _chk(c, 'D102 highlighted', _row(st, 'claim', 'D102', NOV1).highlight, 'warn');
      const cl = createClaim(st, NOV1, rows.filter(r => r.preTick).map(r => r.d.id));
      _chk(c, 'Approve warns', approveClaim(st, cl.id).message, '1 docket not yet approved');
      approveClaim(st, cl.id, { confirm: true });
      _chk(c, 'Approved after confirming, decision recorded', [cl.status, cl.decisions.length], ['Approved', 1]);
      return st;
    } },
  { story: 'VAR-23037', title: 'D095 missed October: offered unticked in November',
    text: 'Given D095 (approved, 25 Oct) missed the October claim, when the November claim is created, then D095 is offered unticked.',
    run(c) {
      const st = baseState(); st.today = '2026-10-31';
      addDocket(st, 'D091', '2026-10-20', 'Approved', [lab('tom', '07:00', '15:30', 0.5)]);
      createClaim(st, { from: '2026-10-16', to: '2026-10-31' }, ['D091'], { id: '3' }); approveClaim(st, '3');
      addDocket(st, 'D095', '2026-10-25', 'Approved', [lab('jo', '07:00', '15:00')]);
      st.today = '2026-11-16';
      const r = _row(st, 'claim', 'D095', NOV1);
      _chk(c, 'Offered, unticked, can be ticked', [!!r, r && r.preTick, r && r.tickable], [true, false, true]);
      return st;
    } },
  { story: 'VAR-23037', title: 'D111 dated 18 Nov listed unticked on a 1 to 15 Nov claim',
    text: 'Given D111 is dated 18 Nov, when a claim for 1 to 15 Nov is created, then D111 is listed unticked.',
    run(c) {
      const st = baseState(); st.today = '2026-11-18';
      addDocket(st, 'D111', '2026-11-18', 'Approved', [lab('jo', '07:00', '15:00')]);
      const r = _row(st, 'claim', 'D111', NOV1);
      _chk(c, 'Listed', !!r, true);
      _chk(c, 'After the period, unticked, can be ticked', [r.later, r.preTick, r.tickable], [true, false, true]);
      return st;
    } },
  { story: 'VAR-23037', title: 'D103 rejected: highlighted, cannot be ticked',
    text: 'Given D103 is rejected, when the claim is created, then D103 is highlighted and cannot be ticked.',
    run(c) {
      const st = baseState();
      addDocket(st, 'D103', '2026-11-05', 'Rejected', [lab('ben', '07:00', '15:00')]);
      const r = _row(st, 'claim', 'D103', NOV1);
      _chk(c, 'Highlighted with reason', [r.highlight, r.block], ['block', 'Rejected']);
      _chk(c, 'Not pre-ticked, cannot be ticked', [r.preTick, r.tickable], [false, false]);
      return st;
    } },
  { story: 'VAR-23037', title: 'D104 overlap on EX-07: cannot be ticked',
    text: 'Given D104 has an overlap on EX-07, when the claim is created, then D104 shows "Overlap: EX-07" and cannot be ticked.',
    run(c) {
      const st = baseState();
      addDocket(st, 'D104', '2026-11-06', 'Submitted', [dry('EX-07', '07:00', '12:00'), wet('EX-07', 'lee', '10:00', '15:00')]);
      const r = _row(st, 'claim', 'D104', NOV1);
      _chk(c, 'Reason shown', r.block, 'Overlap: EX-07');
      _chk(c, 'Cannot be ticked', r.tickable, false);
      return st;
    } },
  { story: 'VAR-23037', title: 'D105 Not claimable: not listed',
    text: 'Given D105 is Not claimable, when the claim is created, then D105 is not listed.',
    run(c) {
      const st = baseState();
      addDocket(st, 'D105', '2026-11-06', 'Submitted', [lab('jo', '07:00', '11:00')]);
      markNotClaimable(st, 'D105', 'goodwill, no charge');
      _chk(c, 'Not in the claim picker', _ids(st, 'claim', NOV1).includes('D105'), false);
      return st;
    } },
  { story: 'VAR-23037', title: '$840 Leading Hand docket with a 10% Labour margin reads $840',
    text: 'Given an $840 Leading Hand docket and a 10% Labour cost-plus margin, when added, then the line is $840 ex GST with no margin. (Retention and GST as existing claims.)',
    run(c) {
      const st = baseState();
      addDocket(st, 'D101', '2026-11-03', 'Approved', [lab('tom', '06:00', '17:00', 0.5)]);
      const cl = createClaim(st, NOV1, ['D101']);
      const t = claimTotals(st, cl);
      _chk(c, 'Project Labour margin is set', st.project.margins.Labour, 10);
      _chk(c, 'Line (ex GST)', claimLineValue(st, cl, cl.lines[0]), 840);
      _chk(c, 'Margin applied', round2(t.dockets - 840), 0);
      _chk(c, 'Retention 5%, GST 10% on net, as existing claims', [t.retention, t.gst, t.total], [42, 79.8, 877.8]);
      return st;
    } },
  { story: 'VAR-23037', title: 'Approved D106 edited on a draft claim returns to Submitted',
    text: 'Given D106 (Approved, $840) is on a draft claim, when edited down to 8h, then D106 returns to Submitted and the line reads $560, flagged.',
    run(c) {
      const st = baseState();
      addDocket(st, 'D106', '2026-11-10', 'Approved', [lab('mel', '06:00', '17:00', 0.5)]);
      const cl = createClaim(st, NOV1, ['D106']);
      editHours(st, 'D106', 0, 8);
      _chk(c, 'D106 status', getDocket(st, 'D106').status, 'Submitted');
      _chk(c, 'Line now reads', claimLineValue(st, cl, cl.lines[0]), 560);
      _chk(c, 'Flagged as changed since added', claimLineChanged(st, cl, cl.lines[0]), true);
      _chk(c, 'Claim history: $840 to $560', _hasHist(cl, 'D106', 840, 560), true);
      return st;
    } },
  { story: 'VAR-23037', title: 'Approved D113 on no record: edit returns it to Submitted',
    text: 'Given D113 is Approved and on no claim or variation, when its hours are edited, then it returns to Submitted.',
    run(c) {
      const st = baseState();
      addDocket(st, 'D113', '2026-11-11', 'Approved', [lab('jo', '07:00', '15:00')]);
      _chk(c, 'On no claim or variation', docketHome(st, 'D113'), null);
      editHours(st, 'D113', 0, 6);
      _chk(c, 'D113 status', getDocket(st, 'D113').status, 'Submitted');
      _chk(c, 'Docket history records the return', getDocket(st, 'D113').history.some(h => /returned to Submitted/.test(h.what)), true);
      _chk(c, 'Highlighted as not yet approved in the picker', _row(st, 'claim', 'D113', NOV1).highlight, 'warn');
      return st;
    } },
  { story: 'VAR-23037', title: 'Client rejects D107 on a draft claim: approval refused',
    text: 'Given the client rejects D107 while it is on a draft claim, when the user tries to approve it, then approval is refused until D107 is fixed or removed.',
    run(c) {
      const st = baseState();
      addDocket(st, 'D101', '2026-11-03', 'Approved', [lab('tom', '06:00', '17:00', 0.5)]);
      addDocket(st, 'D107', '2026-11-12', 'Submitted', [lab('jo', '07:00', '15:00')]);
      const cl = createClaim(st, NOV1, ['D101', 'D107'], { id: '4' });
      rejectDocket(st, 'D107');
      _chk(c, 'D107 stays on claim 4, flagged', [docketHome(st, 'D107').rec.id, docketIssue(st, getDocket(st, 'D107'))], ['4', 'Rejected by client']);
      _refused(c, 'Approval refused', () => approveClaim(st, '4', { confirm: true }), 'Claim 4 cannot be approved until D107 is fixed or removed (D107: Rejected by client)');
      claimRemoveDocket(st, '4', 'D107');
      _allowed(c, 'D107 removed: approval allowed', () => approveClaim(st, '4'));
      return st;
    } },
  { story: 'VAR-23037', title: 'Approved V012 ($5,060) at 100%, reducible',
    text: 'Given approved variation V012 ($5,060), when the claim is created, then V012 appears at 100% to date, $5,060, and can be reduced to a lower percent.',
    run(c) {
      const st = baseState(); st.today = '2026-11-16';
      publishVersion(st, 'labour', 'Leading Hand', 75, '2026-11-01');
      addDocket(st, 'D209', '2026-11-10', 'Approved', [lab('tom', '06:00', '17:00', 0.5)]);
      addDocket(st, 'D210', '2026-11-02', 'Approved', [wet('EX-07', 'sam', '07:00', '16:00')]);
      addDocket(st, 'D211', '2026-11-16', 'Approved', [wet('EX-07', 'sam', '07:00', '15:00', 0, ['Breaker 1t']), mat('Concrete', { cost: 600 })]);
      createVariation(st, ['D209', 'D210', 'D211'], { id: 'V012' }); submitVariation(st, 'V012'); approveVariation(st, 'V012');
      const cl = createClaim(st, NOV1, []);
      _chk(c, 'V012 at 100%', claimVarRows(st, cl).map(l => [l.variation, l.pct, l.value]), [['V012', 100, 5060]]);
      setVarPct(st, cl.id, 'V012', 50);
      _chk(c, 'Reduced to 50%', claimTotals(st, cl).vars, 2530);
      _refused(c, 'Over 100% refused', () => setVarPct(st, cl.id, 'V012', 120), 'Enter a percent complete between 0% and 100% (0% already claimed; a lower percent is charged as a credit)');
      return st;
    } },
  { story: 'VAR-23037', title: 'V012 at 60% on October, 100% on November charges $2,024',
    text: 'Given V012 was claimed at 60% ($3,036) on the October claim, when the November claim enters 100%, then it charges the remaining 40%, $2,024.',
    run(c) {
      const st = baseState(); st.today = '2026-11-16';
      publishVersion(st, 'labour', 'Leading Hand', 75, '2026-11-01');
      addDocket(st, 'D209', '2026-11-10', 'Approved', [lab('tom', '06:00', '17:00', 0.5)]);
      addDocket(st, 'D210', '2026-11-02', 'Approved', [wet('EX-07', 'sam', '07:00', '16:00')]);
      addDocket(st, 'D211', '2026-11-16', 'Approved', [wet('EX-07', 'sam', '07:00', '15:00', 0, ['Breaker 1t']), mat('Concrete', { cost: 600 })]);
      createVariation(st, ['D209', 'D210', 'D211'], { id: 'V012' }); submitVariation(st, 'V012'); approveVariation(st, 'V012');
      const oct = createClaim(st, { from: '2026-10-16', to: '2026-10-31' }, [], { id: '3' });
      setVarPct(st, '3', 'V012', 60);
      _chk(c, 'October claim charges 60%', claimVarRows(st, oct)[0].value, 3036);
      approveClaim(st, '3');
      const nov = createClaim(st, NOV1, [], { id: '4' });
      const row = claimVarRows(st, nov)[0];
      _chk(c, 'November defaults to 100% to date, 60% already claimed', [row.variation, row.pct, row.prev], ['V012', 100, 60]);
      _chk(c, 'November charges the remaining 40%', row.value, 2024);
      _chk(c, 'Claimed to date across both claims', round2(3036 + row.value), 5060);
      _allowed(c, 'Decided 2026-11-16: below the 60% already claimed is allowed', () => setVarPct(st, '4', 'V012', 50));
      _chk(c, '50% to date charges a credit of 10%', claimVarRows(st, nov)[0].value, -506);
      return st;
    } },
  { story: 'VAR-23037', title: 'Decided 2026-11-16: V012 at 60% on an approved claim, then 40% charges a credit of 20%',
    text: 'Given V012 ($5,060) was claimed at 60% ($3,036) on an approved claim, when the next claim enters 40% to date, then it is allowed and the drop is charged as a credit line of minus 20% of the approved amount, -$1,012.',
    run(c) {
      const st = baseState(); st.today = '2026-11-16';
      publishVersion(st, 'labour', 'Leading Hand', 75, '2026-11-01');
      addDocket(st, 'D209', '2026-11-10', 'Approved', [lab('tom', '06:00', '17:00', 0.5)]);
      addDocket(st, 'D210', '2026-11-02', 'Approved', [wet('EX-07', 'sam', '07:00', '16:00')]);
      addDocket(st, 'D211', '2026-11-16', 'Approved', [wet('EX-07', 'sam', '07:00', '15:00', 0, ['Breaker 1t']), mat('Concrete', { cost: 600 })]);
      createVariation(st, ['D209', 'D210', 'D211'], { id: 'V012' }); submitVariation(st, 'V012'); approveVariation(st, 'V012');
      createClaim(st, { from: '2026-10-16', to: '2026-10-31' }, [], { id: '3' });
      setVarPct(st, '3', 'V012', 60); approveClaim(st, '3');
      const nov = createClaim(st, NOV1, [], { id: '4' });
      _allowed(c, '40% to date entered on the next claim', () => setVarPct(st, '4', 'V012', 40));
      const row = claimVarRows(st, nov)[0];
      _chk(c, 'Row: 40% to date, 60% already claimed', [row.variation, row.pct, row.prev], ['V012', 40, 60]);
      _chk(c, 'Credit line: minus 20% of $5,060', row.value, -1012);
      _chk(c, 'Shown as a credit', row.credit, true);
      _chk(c, 'Claim variation total', claimTotals(st, nov).vars, -1012);
      approveClaim(st, '4');
      _chk(c, 'After approval, already claimed is 40%', varClaimedPct(st, 'V012'), 40);
      _chk(c, 'Claimed to date across both claims: 40% of $5,060', round2(3036 - 1012), 2024);
      return st;
    } },
  { story: 'VAR-23037', title: 'Decided 2026-11-17: V012 claimed to 100% is still offered, unticked, and can be credited back',
    text: 'Given V012 ($5,060) was claimed to 100% on an approved claim, when the next claim is created, then V012 is still offered but unticked by default, and once added at 80% to date it charges a credit of minus 20%, -$1,012.',
    run(c) {
      const st = baseState(); st.today = '2026-11-16';
      publishVersion(st, 'labour', 'Leading Hand', 75, '2026-11-01');
      addDocket(st, 'D209', '2026-11-10', 'Approved', [lab('tom', '06:00', '17:00', 0.5)]);
      addDocket(st, 'D210', '2026-11-02', 'Approved', [wet('EX-07', 'sam', '07:00', '16:00')]);
      addDocket(st, 'D211', '2026-11-16', 'Approved', [wet('EX-07', 'sam', '07:00', '15:00', 0, ['Breaker 1t']), mat('Concrete', { cost: 600 })]);
      createVariation(st, ['D209', 'D210', 'D211'], { id: 'V012' }); submitVariation(st, 'V012'); approveVariation(st, 'V012');
      createClaim(st, { from: '2026-10-16', to: '2026-10-31' }, [], { id: '3' }); approveClaim(st, '3');
      _chk(c, 'Claimed to 100% on approved claim 3', varClaimedPct(st, 'V012'), 100);
      _chk(c, 'Still offered on the next claim', offeredVariations(st).map(v => v.id), ['V012']);
      _chk(c, 'Unticked by default', defaultClaimVariations(st).map(v => v.id), []);
      const nov = createClaim(st, NOV1, [], { id: '4' });
      _chk(c, 'Not on the new claim unless ticked', claimVarRows(st, nov).length, 0);
      _allowed(c, 'Ticked: added to claim 4', () => addVarToClaim(st, '4', 'V012'));
      _chk(c, 'Added at 100% to date charges nothing', claimVarRows(st, nov).map(l => [l.variation, l.pct, l.prev, l.value]), [['V012', 100, 100, 0]]);
      setVarPct(st, '4', 'V012', 80);
      const row = claimVarRows(st, nov)[0];
      _chk(c, '80% to date: credit of minus 20% of $5,060', row.value, -1012);
      _chk(c, 'Shown as a credit', row.credit, true);
      return st;
    } },
  { story: 'VAR-23037', title: 'Decided 2026-11-17: a claim below zero is approved as a negative claim',
    text: 'Given V012 ($5,060) was claimed to 100% on an approved claim, when the next claim credits it back to 40% with no other lines, then the gross is -$3,036, retention 5% is -$151.80, net -$2,884.20, GST 10% -$288.42 and total -$3,172.62, and the claim can be approved.',
    run(c) {
      const st = baseState(); st.today = '2026-11-16';
      publishVersion(st, 'labour', 'Leading Hand', 75, '2026-11-01');
      addDocket(st, 'D209', '2026-11-10', 'Approved', [lab('tom', '06:00', '17:00', 0.5)]);
      addDocket(st, 'D210', '2026-11-02', 'Approved', [wet('EX-07', 'sam', '07:00', '16:00')]);
      addDocket(st, 'D211', '2026-11-16', 'Approved', [wet('EX-07', 'sam', '07:00', '15:00', 0, ['Breaker 1t']), mat('Concrete', { cost: 600 })]);
      createVariation(st, ['D209', 'D210', 'D211'], { id: 'V012' }); submitVariation(st, 'V012'); approveVariation(st, 'V012');
      createClaim(st, { from: '2026-10-16', to: '2026-10-31' }, [], { id: '3' }); approveClaim(st, '3');
      const nov = createClaim(st, NOV1, [], { id: '4', vars: ['V012'] });
      setVarPct(st, '4', 'V012', 40);
      const t = claimTotals(st, nov);
      _chk(c, 'Gross ex GST', t.gross, -3036);
      _chk(c, 'Retention 5%', t.retention, -151.8);
      _chk(c, 'Net ex GST', t.net, -2884.2);
      _chk(c, 'GST 10%', t.gst, -288.42);
      _chk(c, 'Total incl GST', t.total, -3172.62);
      _chk(c, 'Flagged as a negative claim', t.negative, true);
      _chk(c, 'Retention is the project 5% of the gross, as on any claim (no cap)', t.retention, round2(t.gross * st.project.retention / 100));
      _chk(c, 'No cap or retention-held figures on the totals', ['retentionCalc', 'capped', 'excess', 'heldBefore', 'heldAfter'].filter(k => k in t), []);
      _allowed(c, 'Approved as a negative claim', () => approveClaim(st, '4'));
      _chk(c, 'Approved, totals unchanged', [nov.status, claimTotals(st, nov).gross, claimTotals(st, nov).total], ['Approved', -3036, -3172.62]);
      _chk(c, 'Labelled as sent to accounting as a credit note', claimAccountingLabel(st, nov), 'Sent to accounting as a credit note');
      _chk(c, 'The positive claim claim 3 carries no credit note label', claimAccountingLabel(st, getClaim(st, '3')), null);
      _chk(c, 'Approved retention is still 5% of the gross', claimTotals(st, nov).retention, -151.8);
      return st;
    } },
  { story: 'VAR-23037', title: 'Two draft claims: V012 on one is not offered on the other',
    text: 'Given two draft claims are open, when V012 is added to one, then it is not offered on the other.',
    run(c) {
      const st = baseState(); st.today = '2026-11-16';
      addDocket(st, 'D201', '2026-11-02', 'Approved', [lab('tom', '07:00', '15:00')]);
      createVariation(st, ['D201'], { id: 'V012' }); submitVariation(st, 'V012'); approveVariation(st, 'V012');
      createClaim(st, NOV1, [], { id: '4', vars: [] });
      createClaim(st, { from: '2026-11-16', to: '2026-11-30' }, [], { id: '5', vars: [] });
      _chk(c, 'Before: offered to either draft', offeredVariations(st).map(v => v.id), ['V012']);
      addVarToClaim(st, '4', 'V012');
      _chk(c, 'On claim 4', claimVarRows(st, getClaim(st, '4')).map(l => l.variation), ['V012']);
      _chk(c, 'Not offered on claim 5', offeredVariations(st).map(v => v.id), []);
      _refused(c, 'Adding to claim 5 refused', () => addVarToClaim(st, '5', 'V012'), 'V012 is already on open claim 4');
      return st;
    } },
  { story: 'VAR-23037', title: 'D101 on an approved claim is read-only',
    text: 'Given D101 is on an approved claim, when opened, then it is read-only and shows "On claim <number>".',
    run(c) {
      const st = baseState(); st.today = '2026-11-16';
      addDocket(st, 'D101', '2026-11-03', 'Approved', [lab('tom', '06:00', '17:00', 0.5)]);
      createClaim(st, NOV1, ['D101'], { id: '4' }); approveClaim(st, '4');
      _chk(c, 'Marker', 'On claim ' + docketHome(st, 'D101').rec.id, 'On claim 4');
      _refused(c, 'Edit refused', () => editHours(st, 'D101', 0, 8), 'D101 is read-only: it is on approved claim 4');
      _chk(c, 'Never offered again', _ids(st, 'claim', { from: '2026-11-16', to: '2026-11-30' }).includes('D101'), false);
      return st;
    } },
  { story: 'VAR-23037', title: 'Rate change from 1 Dec leaves the claim approved 20 Nov unchanged',
    text: 'Given a Leading Hand rate change effective 1 Dec, when the November claim approved 20 Nov is opened, then every line is unchanged.',
    run(c) {
      const st = baseState(); st.today = '2026-11-20';
      addDocket(st, 'D101', '2026-11-03', 'Approved', [lab('tom', '06:00', '17:00', 0.5)]);
      addDocket(st, 'D102', '2026-11-09', 'Approved', [wet('EX-07', 'sam', '07:00', '16:00')]);
      const cl = createClaim(st, NOV1, ['D101', 'D102']); approveClaim(st, cl.id);
      _refused(c, 'Effective date before the approval refused', () => publishVersion(st, 'labour', 'Leading Hand', 75, '2026-11-01'), 'Effective date cannot be before the last approved claim or approved variation (20/11/2026)');
      publishVersion(st, 'labour', 'Leading Hand', 75, '2026-12-01');
      _chk(c, 'Every line unchanged', cl.lines.map(l => claimLineValue(st, cl, l)), [840, 1710]);
      return st;
    } },


  /* ───── 2026-11-17: Varicon's own statuses, dockets inside the project ───── */
  { story: 'Statuses', title: 'Picker offers anything but Draft and Rejected',
    text: 'Decided 2026-11-17: the variation and claim pickers offer Ready for Review, Submitted, Approved, Costed and Invoiced dockets; Draft and Rejected are listed but cannot be ticked. Ready for Review and Submitted are highlighted as not yet approved.',
    run(c) {
      const st = baseState(); st.today = '2026-11-16';
      [['D301', 'Draft'], ['D302', 'Ready for Review'], ['D303', 'Submitted'], ['D304', 'Approved'], ['D305', 'Costed'], ['D306', 'Invoiced'], ['D307', 'Rejected']].forEach(([id, s], i) => addDocket(st, id, '2026-11-0' + (i + 2), s, [lab('jo', '07:00', '15:00')]));
      ['variation', 'claim'].forEach(m => {
        const rows = pickerRows(st, m, NOV1);
        _chk(c, m + ': tickable', rows.filter(r => r.tickable).map(r => r.d.id), ['D302', 'D303', 'D304', 'D305', 'D306']);
        _chk(c, m + ': blocked with reason', rows.filter(r => !r.tickable).map(r => [r.d.id, r.block]), [['D301', 'Draft'], ['D307', 'Rejected']]);
        _chk(c, m + ': highlighted not yet approved', rows.filter(r => r.highlight === 'warn').map(r => r.d.id), ['D302', 'D303']);
      });
      _refused(c, 'Draft refused on save', () => createVariation(st, ['D301']), 'D301 is Draft and cannot be added');
      const v = createVariation(st, ['D302', 'D305', 'D306']);
      _chk(c, 'Submit warns for Ready for Review only', submitVariation(st, v.id).message, '1 docket not yet approved');
      return st;
    } },
  { story: 'Statuses', title: 'Approving a claim moves its docket lines to Invoiced',
    text: 'Decided 2026-11-17: issued means Approved. When claim 4 is approved, D101 (Approved) and D218 (Costed) on its Dayworks tab freeze and move to Invoiced.',
    run(c) {
      const st = baseState(); st.today = '2026-11-16';
      addDocket(st, 'D101', '2026-11-03', 'Approved', [lab('tom', '06:00', '17:00', 0.5)]);
      addDocket(st, 'D218', '2026-11-09', 'Costed', [lab('mel', '07:00', '15:00')]);
      const cl = createClaim(st, NOV1, ['D101', 'D218'], { id: 4 });
      submitClaim(st, '4');
      _chk(c, 'Submitted claim: dockets unchanged', ['D101', 'D218'].map(id => getDocket(st, id).status), ['Approved', 'Costed']);
      approveClaim(st, '4');
      _chk(c, 'Claim approved', cl.status, 'Approved');
      _chk(c, 'Both moved to Invoiced', ['D101', 'D218'].map(id => getDocket(st, id).status), ['Invoiced', 'Invoiced']);
      _chk(c, 'Locked at frozen values', [isLocked(st, 'D101'), claimLineValue(st, cl, cl.lines[0])], [true, 840]);
      return st;
    } },
  { story: 'Statuses', title: 'Reopen Claim keeps its dockets Invoiced and locked',
    text: 'Decided 2026-11-17: reopening approved claim 4 leaves D101 Invoiced, locked and at its frozen value, even after a rate change.',
    run(c) {
      const st = baseState(); st.today = '2026-11-16';
      addDocket(st, 'D101', '2026-11-03', 'Approved', [lab('tom', '06:00', '17:00', 0.5)]);
      addDocket(st, 'D202', '2026-11-04', 'Approved', [lab('jo', '07:00', '15:00')]);
      const cl = createClaim(st, NOV1, ['D101'], { id: 4 }); approveClaim(st, '4');
      _allowed(c, 'Reopen Claim', () => reopenClaim(st, '4'));
      _chk(c, 'Claim back to Draft', cl.status, 'Draft');
      _chk(c, 'D101 still Invoiced and locked', [getDocket(st, 'D101').status, isLocked(st, 'D101')], ['Invoiced', true]);
      _refused(c, 'D101 cannot be edited', () => editHours(st, 'D101', 0, 8), 'D101 is read-only: it is on approved claim 4');
      _refused(c, 'D101 cannot be removed', () => claimRemoveDocket(st, '4', 'D101'), 'D101 was approved on this claim and stays locked');
      publishVersion(st, 'labour', 'Leading Hand', 75, '2026-11-16');
      _chk(c, 'Frozen value kept after a rate change', claimLineValue(st, cl, cl.lines[0]), 840);
      _allowed(c, 'A new docket can be added while reopened', () => claimAddDockets(st, '4', ['D202']));
      approveClaim(st, '4');
      _chk(c, 'Re-approved: D202 Invoiced too', getDocket(st, 'D202').status, 'Invoiced');
      return st;
    } },
  { story: 'Statuses', title: 'Variation dockets go Invoiced only at 100% claimed',
    text: 'Decided 2026-11-17: V012 (D201) claimed at 60% on approved claim 4 leaves D201 Approved; claimed to 100% on approved claim 5 moves it to Invoiced.',
    run(c) {
      const st = baseState(); st.today = '2026-11-16';
      addDocket(st, 'D201', '2026-11-02', 'Approved', [lab('tom', '07:00', '15:00')]);
      createVariation(st, ['D201'], { id: 'V012' }); submitVariation(st, 'V012'); approveVariation(st, 'V012');
      createClaim(st, NOV1, [], { id: 4 }); setVarPct(st, '4', 'V012', 60); approveClaim(st, '4');
      _chk(c, 'At 60%: D201 still Approved', getDocket(st, 'D201').status, 'Approved');
      createClaim(st, { from: '2026-11-16', to: '2026-11-30' }, [], { id: 5 }); approveClaim(st, '5');
      _chk(c, 'At 100%: D201 Invoiced', getDocket(st, 'D201').status, 'Invoiced');
      return st;
    } },
  { story: 'Statuses', title: 'Approved docket actions: Mark as Costed, Mark as Invoiced, Reopen',
    text: 'As in Varicon today: an Approved docket can be marked Costed, then Invoiced by hand. Reopen clears the signature and returns it to Submitted for re-approval.',
    run(c) {
      const st = baseState();
      addDocket(st, 'D401', '2026-11-03', 'Approved', [lab('tom', '07:00', '15:00')]);
      addDocket(st, 'D402', '2026-11-03', 'Approved', [lab('jo', '07:00', '15:00')]);
      markCosted(st, 'D401');
      _chk(c, 'Costed', getDocket(st, 'D401').status, 'Costed');
      markInvoiced(st, 'D401');
      _chk(c, 'Invoiced', getDocket(st, 'D401').status, 'Invoiced');
      _chk(c, 'Hand-invoiced docket is still offered to a claim', _ids(st, 'claim', NOV1).includes('D401'), true);
      reopenSigned(st, 'D402');
      _chk(c, 'Reopened: back to Submitted', getDocket(st, 'D402').status, 'Submitted');
      return st;
    } },
  { story: 'Statuses', title: 'Credited back below 100%: the variation dockets stay Invoiced',
    text: 'Decided 2026-11-17: V012 (D201) claimed to 100% on approved claim 4 moves D201 to Invoiced. Claim 5 credits it back to 60% and is approved; D201 stays Invoiced.',
    run(c) {
      const st = baseState(); st.today = '2026-11-16';
      addDocket(st, 'D201', '2026-11-02', 'Approved', [lab('tom', '07:00', '15:00')]);
      createVariation(st, ['D201'], { id: 'V012' }); submitVariation(st, 'V012'); approveVariation(st, 'V012');
      createClaim(st, NOV1, [], { id: 4 }); approveClaim(st, '4');
      _chk(c, 'At 100%: D201 Invoiced', getDocket(st, 'D201').status, 'Invoiced');
      createClaim(st, { from: '2026-11-16', to: '2026-11-30' }, [], { id: 5, vars: ['V012'] }); setVarPct(st, '5', 'V012', 60);
      _chk(c, 'Claim 5 carries a credit of 40%', claimVarRows(st, getClaim(st, '5'))[0].value, -224);
      approveClaim(st, '5');
      _chk(c, 'After the credit is approved: D201 still Invoiced', getDocket(st, 'D201').status, 'Invoiced');
      return st;
    } },
  { story: 'Statuses', title: 'Not claimable from Draft, Ready for Review, Submitted, Approved or Costed',
    text: 'Decided 2026-11-17: Not claimable can be set from Draft, Ready for Review, Submitted, Approved or Costed, and not from Invoiced or Rejected.',
    run(c) {
      const st = baseState();
      [['D701', 'Draft'], ['D702', 'Ready for Review'], ['D703', 'Submitted'], ['D704', 'Approved'], ['D705', 'Costed'], ['D706', 'Invoiced'], ['D707', 'Rejected']].forEach(([id, s]) => addDocket(st, id, '2026-11-04', s, [lab('jo', '07:00', '15:00')]));
      ['D701', 'D702', 'D703', 'D704', 'D705'].forEach(id => _allowed(c, id + ' ' + getDocket(st, id).status, () => markNotClaimable(st, id, '')));
      _chk(c, 'All five Not claimable', ['D701', 'D702', 'D703', 'D704', 'D705'].map(id => getDocket(st, id).status), Array(5).fill('Not claimable'));
      reopenDocket(st, 'D705');
      _chk(c, 'Reopen returns Costed', getDocket(st, 'D705').status, 'Costed');
      _refused(c, 'Invoiced refused', () => markNotClaimable(st, 'D706', ''), 'Only a Draft, Ready for Review, Submitted, Approved or Costed docket can be marked Not claimable');
      _refused(c, 'Rejected refused', () => markNotClaimable(st, 'D707', ''), 'Only a Draft, Ready for Review, Submitted, Approved or Costed docket can be marked Not claimable');
      return st;
    } },
  { story: 'Statuses', title: 'Reopen on a Costed docket clears the signature and returns it to Submitted',
    text: 'Decided 2026-11-17: Reopen on a signed Approved or Costed docket clears the signature and sends it to Submitted for re-approval. On a Pending variation its line is flagged in the history.',
    run(c) {
      const st = baseState();
      addDocket(st, 'D801', '2026-11-04', 'Costed', [lab('tom', '07:00', '15:00')]);
      const v = createVariation(st, ['D801'], { id: 'V030' });
      reopenSigned(st, 'D801');
      _chk(c, 'Costed docket back to Submitted', getDocket(st, 'D801').status, 'Submitted');
      _chk(c, 'Variation history records the status change', v.history.some(h => /D801 status Costed to Submitted/.test(h.what)), true);
      _refused(c, 'Invoiced cannot be reopened', () => { addDocket(st, 'D802', '2026-11-04', 'Invoiced', [lab('jo', '07:00', '15:00')]); reopenSigned(st, 'D802'); }, 'Only an Approved or Costed docket can be reopened here');
      return st;
    } },
  { story: 'Statuses', title: 'Estimated Cost on a docket variation is the dockets\' actual cost',
    text: 'Decided 2026-11-17: a docket variation\'s Estimated Cost is the dockets\' actual cost (timesheet and plant cost, as in Daily Cost Tracking), shown per docket and in total with the margin against the charge. D201: Leading Hand 8h at $55 cost = $440 against a $560 charge; D210: Excavator 20t wet 9h at $95 plant + $60 operator = $1,395 against $1,710.',
    run(c) {
      const st = baseState();
      addDocket(st, 'D201', '2026-11-02', 'Approved', [lab('tom', '07:00', '15:00')]);
      addDocket(st, 'D210', '2026-11-02', 'Approved', [wet('EX-07', 'sam', '07:00', '16:00')]);
      const v = createVariation(st, ['D201', 'D210']);
      _chk(c, 'D201 cost', docketCost(st, getDocket(st, 'D201')), 440);
      _chk(c, 'D210 cost', docketCost(st, getDocket(st, 'D210')), 1395);
      _chk(c, 'Estimated Cost (variation)', varEstimatedCost(st, v), 1835);
      _chk(c, 'Charge (lines total)', varTotal(st, v), 2270);
      _chk(c, 'Margin $ and % of charge', [varMargin(st, v).amount, varMargin(st, v).pct], [435, 19.16]);
      return st;
    } },
  { story: 'Statuses', title: 'Dockets added to or removed from a Submitted claim are flagged and kept in history',
    text: 'Decided 2026-11-17: until a Submitted claim is Approved, dockets can be added or removed; each change flags the claim "changed since submitted" and is kept in its history. Approval clears the flag.',
    run(c) {
      const st = baseState(); st.today = '2026-11-16';
      addDocket(st, 'D101', '2026-11-03', 'Approved', [lab('tom', '06:00', '17:00', 0.5)]);
      addDocket(st, 'D202', '2026-11-04', 'Approved', [lab('jo', '07:00', '15:00')]);
      const cl = createClaim(st, NOV1, ['D101'], { id: 4 }); submitClaim(st, '4');
      _chk(c, 'Submitted, no flag', [cl.status, !!cl.changedSinceSubmitted], ['Submitted', false]);
      _allowed(c, 'Add D202 to the Submitted claim', () => claimAddDockets(st, '4', ['D202']));
      _chk(c, 'Flagged, history kept', [!!cl.changedSinceSubmitted, cl.history.some(h => /Added D202.*changed since submitted/.test(h.what))], [true, true]);
      _allowed(c, 'Remove D101 from the Submitted claim', () => claimRemoveDocket(st, '4', 'D101'));
      _chk(c, 'Removal in history with old value', _hasHist(cl, 'D101', 840, 0), true);
      approveClaim(st, '4');
      _chk(c, 'Approved: flag cleared, D202 Invoiced, D101 released', [!!cl.changedSinceSubmitted, getDocket(st, 'D202').status, docketHome(st, 'D101')], [false, 'Invoiced', null]);
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
