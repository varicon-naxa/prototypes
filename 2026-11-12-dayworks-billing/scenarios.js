/* Scenarios: every worked example in VAR-23036 (15) and VAR-23037 (15), as updated with Alec's answers of 2026-11-16,
   each run on a fresh project through the same engine the UI uses. */

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
      _chk(c, 'Submitted after confirming, decision recorded', [v.status, v.decisions.length], ['Submitted', 1]);
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
  { story: 'VAR-23036', title: 'Approved D208 edited on unsubmitted V-015 returns to Submitted',
    text: 'Given D208 ($840) is on unsubmitted V-015 and was Approved, when its hours are edited down to 8h, then D208 returns to Submitted and the V-015 line reads $560, flagged.',
    run(c) {
      const st = baseState();
      addDocket(st, 'D208', '2026-11-12', 'Approved', [lab('tom', '06:00', '17:00', 0.5)]);
      const v = createVariation(st, ['D208'], { id: 'V-015' });
      _chk(c, 'Line when added', v.lines[0].added, 840);
      editHours(st, 'D208', 0, 8);
      _chk(c, 'D208 status', getDocket(st, 'D208').status, 'Submitted');
      _chk(c, 'Line now reads', varLineValue(st, v, v.lines[0]), 560);
      _chk(c, 'Line flagged as changed since added', varLineChanged(st, v, v.lines[0]), true);
      _chk(c, 'V-015 history: $840 to $560', _hasHist(v, 'D208', 840, 560), true);
      _chk(c, 'Submit now warns', submitVariation(st, 'V-015').message, '1 docket not yet approved');
      return st;
    } },
  { story: 'VAR-23036', title: 'New calculator version moves submitted V-016; revision prompted',
    text: 'Given V-016 was submitted at $5,000 including D209 at $840, when a new calculator version raises D209 to $900, then the line reads $900, the submitted amount $5,060, both flagged, and the user is prompted to send a new revision.',
    run(c) {
      const st = baseState(); st.today = '2026-11-16';
      addDocket(st, 'D209', '2026-11-10', 'Approved', [lab('tom', '06:00', '17:00', 0.5)]);
      addDocket(st, 'D210', '2026-11-02', 'Approved', [wet('EX-07', 'sam', '07:00', '16:00')]);
      addDocket(st, 'D211', '2026-11-16', 'Approved', [wet('EX-07', 'sam', '07:00', '15:00', 0, ['Breaker 1t']), mat('Concrete', { cost: 600 })]);
      const v = createVariation(st, ['D209', 'D210', 'D211'], { id: 'V-016' }); submitVariation(st, 'V-016');
      _chk(c, 'Submitted at', varSubmittedAmount(st, v), 5000);
      publishVersion(st, 'labour', 'Leading Hand', 75, '2026-11-01');
      _chk(c, 'D209 line reads', varLineValue(st, v, v.lines[0]), 900);
      _chk(c, 'D209 line flagged', varLineChanged(st, v, v.lines[0]), true);
      _chk(c, 'Submitted amount reads', varSubmittedAmount(st, v), 5060);
      _chk(c, 'Changed since submitted', varSubmittedChanged(st, v), true);
      _chk(c, 'Send new revision prompted', varNeedsRevision(st, v), true);
      _chk(c, 'History: D209 $840 to $900', _hasHist(v, 'D209', 840, 900), true);
      sendRevision(st, 'V-016');
      _chk(c, 'Revision 2 sent, prompt cleared', [v.revision, varNeedsRevision(st, v)], [2, false]);
      approveVariation(st, 'V-016');
      _chk(c, 'Approved: changed-since-added flags cleared', v.lines.map(l => varLineChanged(st, v, l)), [false, false, false]);
      _chk(c, 'Approved: history still holds $840 to $900', _hasHist(v, 'D209', 840, 900), true);
      _chk(c, 'Approved amount', v.approvedAmount, 5060);
      return st;
    } },
  { story: 'VAR-23036', title: 'V-016 approved while changed since submitted: warned, recorded',
    text: 'Given V-016 still shows changed since submission, when the user approves it, then a warning says the client saw $5,000, approval goes through, and the warning is recorded.',
    run(c) {
      const st = baseState(); st.today = '2026-11-16';
      addDocket(st, 'D209', '2026-11-10', 'Approved', [lab('tom', '06:00', '17:00', 0.5)]);
      addDocket(st, 'D210', '2026-11-02', 'Approved', [wet('EX-07', 'sam', '07:00', '16:00')]);
      addDocket(st, 'D211', '2026-11-16', 'Approved', [wet('EX-07', 'sam', '07:00', '15:00', 0, ['Breaker 1t']), mat('Concrete', { cost: 600 })]);
      const v = createVariation(st, ['D209', 'D210', 'D211'], { id: 'V-016' }); submitVariation(st, 'V-016');
      publishVersion(st, 'labour', 'Leading Hand', 75, '2026-11-01');
      _chk(c, 'Still changed since submitted', varSubmittedChanged(st, v), true);
      let r = null;
      _allowed(c, 'Approval goes through', () => { r = approveVariation(st, 'V-016'); });
      _chk(c, 'Warning says the client saw $5,000', !!r && /client saw \$5,000\.00/.test(r.warning), true);
      _chk(c, 'Approved', v.status, 'Approved');
      _chk(c, 'Warning recorded on the variation', v.decisions.some(x => /client saw \$5,000\.00/.test(x.what)), true);
      _chk(c, 'Warning in the history', v.history.some(x => /client saw \$5,000\.00/.test(x.what)), true);
      return st;
    } },
  { story: 'VAR-23036', title: 'D212 removed from submitted V-016: released, revision prompted',
    text: 'Given D212 is removed from submitted V-016, when the removal saves, then D212 is released, V-016 shows changed since submission, and a new revision is prompted.',
    run(c) {
      const st = baseState(); st.today = '2026-11-16';
      addDocket(st, 'D209', '2026-11-10', 'Approved', [lab('tom', '06:00', '17:00', 0.5)]);
      addDocket(st, 'D210', '2026-11-02', 'Approved', [wet('EX-07', 'sam', '07:00', '16:00')]);
      addDocket(st, 'D212', '2026-11-03', 'Approved', [mat('Road base', { qty: 12 }), lab('jo', '07:00', '15:00')]);
      const v = createVariation(st, ['D209', 'D210', 'D212'], { id: 'V-016' }); submitVariation(st, 'V-016');
      _chk(c, 'D212 has no flag (any docket can come off)', docketIssue(st, getDocket(st, 'D212')), null);
      _allowed(c, 'Removal saves', () => removeFromVariation(st, 'V-016', 'D212'));
      _chk(c, 'D212 released', [docketHome(st, 'D212'), _ids(st, 'variation').includes('D212')], [null, true]);
      _chk(c, 'V-016 still submitted', v.status, 'Submitted');
      _chk(c, 'Changed since submitted', varSubmittedChanged(st, v), true);
      _chk(c, 'New revision prompted', varNeedsRevision(st, v), true);
      _chk(c, 'History: D212 removed', _hasHist(v, 'D212', 1020, 0), true);
      sendRevision(st, 'V-016');
      _chk(c, 'Revision 2 sent, prompt cleared', [v.revision, varNeedsRevision(st, v)], [2, false]);
      return st;
    } },
  { story: 'VAR-23036', title: 'Client rejects D210 on submitted V-017: approval refused',
    text: 'Given the client rejects D210 while it is on submitted V-017, when the user tries to approve V-017, then it is refused until D210 is fixed or removed.',
    run(c) {
      const st = baseState();
      addDocket(st, 'D201', '2026-11-02', 'Approved', [lab('tom', '07:00', '15:00')]);
      addDocket(st, 'D210', '2026-11-02', 'Submitted', [wet('EX-07', 'sam', '07:00', '16:00')]);
      createVariation(st, ['D201', 'D210'], { id: 'V-017' }); submitVariation(st, 'V-017', { confirm: true });
      rejectDocket(st, 'D210');
      _chk(c, 'D210 stays on V-017', docketHome(st, 'D210').rec.id, 'V-017');
      _chk(c, 'D210 line flagged with the reason', docketIssue(st, getDocket(st, 'D210')), 'Rejected by client');
      _refused(c, 'Approve refused', () => approveVariation(st, 'V-017'), 'V-017 cannot be approved until D210 is fixed or removed (D210: Rejected by client)');
      submitDocket(st, 'D210');
      _allowed(c, 'Fixed and resubmitted: approve allowed', () => approveVariation(st, 'V-017'));
      return st;
    } },
  { story: 'VAR-23036', title: 'Client approves V-018 at $9,000 against $10,000 submitted',
    text: 'Given V-018 was submitted at $10,000 from four dockets, when the client approves $9,000, then the docket lines keep their values, a -$1,000 adjustment is recorded and must be marked absorbed, under dispute or to resubmit, and the contract sum moves by $9,000.',
    run(c) {
      const st = baseState(); st.today = '2026-11-16';
      addDocket(st, 'D209', '2026-11-10', 'Approved', [lab('tom', '06:00', '17:00', 0.5)]);
      addDocket(st, 'D210', '2026-11-02', 'Approved', [wet('EX-07', 'sam', '07:00', '16:00')]);
      addDocket(st, 'D211', '2026-11-16', 'Approved', [wet('EX-07', 'sam', '07:00', '15:00', 0, ['Breaker 1t']), mat('Concrete', { cost: 600 })]);
      addDocket(st, 'D212', '2026-11-04', 'Approved', [mat('Road base', { qty: 72 }), wet('EX-07', 'lee', '07:00', '15:00', 0, ['Breaker 1t'])]);
      const v = createVariation(st, ['D209', 'D210', 'D211', 'D212'], { id: 'V-018' }); submitVariation(st, 'V-018');
      _chk(c, 'Submitted at', varSubmittedAmount(st, v), 10000);
      const before = contractSum(st);
      _refused(c, 'Approve at $9,000 without a shortfall status refused', () => approveVariation(st, 'V-018', 9000), 'Mark the -$1,000.00 adjustment absorbed, under dispute or to resubmit');
      approveVariation(st, 'V-018', 9000, 'Absorbed');
      _chk(c, 'Docket lines keep their values', v.lines.map(l => varLineValue(st, v, l)), [840, 1710, 2450, 5000]);
      _chk(c, 'One adjustment', v.adjustment.amount, -1000);
      _chk(c, 'Adjustment marked', v.adjustment.status, 'Absorbed');
      _chk(c, 'Contract sum moves by', round2(contractSum(st) - before), 9000);
      return st;
    } },
  { story: 'VAR-23036', title: 'Client approves V-020 at $4,300 against $4,000: +$300, no status',
    text: 'Given V-020 was submitted at $4,000, when the client approves $4,300, then a +$300 adjustment is recorded with no status needed and the contract sum moves by $4,300.',
    run(c) {
      const st = baseState(); st.today = '2026-11-16';
      addDocket(st, 'D601', '2026-11-09', 'Approved', [mat('Road base', { qty: 40 })]);
      addDocket(st, 'D602', '2026-11-10', 'Approved', [sub('Traffic control', 2000)]);
      const v = createVariation(st, ['D601', 'D602'], { id: 'V-020' }); submitVariation(st, 'V-020');
      _chk(c, 'Submitted at', varSubmittedAmount(st, v), 4000);
      const before = contractSum(st);
      _allowed(c, 'Approve at $4,300 with no status', () => approveVariation(st, 'V-020', 4300));
      _chk(c, 'Docket lines keep their values', v.lines.map(l => varLineValue(st, v, l)), [1800, 2200]);
      _chk(c, 'One +$300 adjustment', v.adjustment.amount, 300);
      _chk(c, 'No status', v.adjustment.status, null);
      _refused(c, 'Status cannot be set on a higher approval', () => setAdjustmentStatus(st, 'V-020', 'Absorbed'), 'A higher approved amount needs no status');
      _chk(c, 'Contract sum moves by', round2(contractSum(st) - before), 4300);
      return st;
    } },
  { story: 'VAR-23036', title: 'Withdrawn V-019, submitted or not, stays on the register; dockets offered again',
    text: 'Given V-019 holds two dockets, submitted or not, when it is withdrawn, then it stays on the register as Withdrawn with its history and both dockets are offered again.',
    run(c) {
      let st;
      ['unsubmitted', 'submitted'].forEach(kind => {
        st = baseState();
        addDocket(st, 'D501', '2026-11-04', 'Approved', [lab('jo', '07:00', '15:00')]);
        addDocket(st, 'D502', '2026-11-05', 'Approved', [lab('tom', '07:00', '15:00')]);
        createVariation(st, ['D501', 'D502'], { id: 'V-019' });
        if (kind === 'submitted') submitVariation(st, 'V-019');
        _allowed(c, 'Withdraw ' + kind + ' V-019', () => releaseVariation(st, 'V-019', 'Withdrawn'));
        const v = st.variations.find(x => x.id === 'V-019');
        _chk(c, kind + ': on the register as Withdrawn', v && v.status, 'Withdrawn');
        _chk(c, kind + ': history kept', v.history.length >= 2 && /^Withdrawn/.test(v.history[v.history.length - 1].what), true);
        _chk(c, kind + ': both offered again', ['D501', 'D502'].map(id => _ids(st, 'variation').includes(id)), [true, true]);
      });
      return st;
    } },
  { story: 'VAR-23036', title: 'D201 on approved V-012: not offered; V-012 offered at 100%',
    text: 'Given D201 is on approved V-012, when the next claim is created, then D201 is not offered and V-012 is offered at 100%, editable to a lower percent.',
    run(c) {
      const st = baseState(); st.today = '2026-11-16';
      addDocket(st, 'D201', '2026-11-02', 'Approved', [lab('tom', '07:00', '15:00')]);
      createVariation(st, ['D201'], { id: 'V-012' }); submitVariation(st, 'V-012'); approveVariation(st, 'V-012');
      _chk(c, 'D201 not offered', _ids(st, 'claim', NOV1).includes('D201'), false);
      _chk(c, 'V-012 offered', offeredVariations(st).map(v => v.id), ['V-012']);
      const cl = createClaim(st, NOV1, []);
      _chk(c, 'V-012 at 100%', claimVarRows(st, cl).map(l => [l.variation, l.pct, l.value]), [['V-012', 100, 560]]);
      setVarPct(st, cl.id, 'V-012', 60);
      _chk(c, 'Edited to 60%', claimVarRows(st, cl)[0].value, 336);
      return st;
    } },

  /* ───── VAR-23037 Convert daywork dockets into a progress claim ───── */
  { story: 'VAR-23037', title: 'D101 and D102 in period pre-ticked; issue warns',
    text: 'Given D101 (approved, 3 Nov) and D102 (submitted, 9 Nov) on a claim for 1 to 15 Nov, when created, then both are pre-ticked, D102 highlighted, and issuing warns "1 docket not yet approved" and allows it.',
    run(c) {
      const st = baseState(); st.today = '2026-11-16';
      addDocket(st, 'D101', '2026-11-03', 'Approved', [lab('tom', '06:00', '17:00', 0.5)]);
      addDocket(st, 'D102', '2026-11-09', 'Submitted', [wet('EX-07', 'sam', '07:00', '16:00')]);
      const rows = pickerRows(st, 'claim', NOV1);
      _chk(c, 'Both pre-ticked', rows.map(r => [r.d.id, r.preTick]), [['D101', true], ['D102', true]]);
      _chk(c, 'D102 highlighted', _row(st, 'claim', 'D102', NOV1).highlight, 'warn');
      const cl = createClaim(st, NOV1, rows.filter(r => r.preTick).map(r => r.d.id));
      _chk(c, 'Issue warns', issueClaim(st, cl.id).message, '1 docket not yet approved');
      issueClaim(st, cl.id, { confirm: true });
      _chk(c, 'Issued after confirming, decision recorded', [cl.status, cl.decisions.length], ['Issued', 1]);
      return st;
    } },
  { story: 'VAR-23037', title: 'D095 missed October: offered unticked in November',
    text: 'Given D095 (approved, 25 Oct) missed the October claim, when the November claim is created, then D095 is offered unticked.',
    run(c) {
      const st = baseState(); st.today = '2026-10-31';
      addDocket(st, 'D091', '2026-10-20', 'Approved', [lab('tom', '07:00', '15:30', 0.5)]);
      createClaim(st, { from: '2026-10-16', to: '2026-10-31' }, ['D091'], { id: 'C-003' }); issueClaim(st, 'C-003');
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
      addDocket(st, 'D104', '2026-11-06', 'Draft', [dry('EX-07', '07:00', '12:00'), wet('EX-07', 'lee', '10:00', '15:00')]);
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
  { story: 'VAR-23037', title: 'Client rejects D107 on a draft claim: issue refused',
    text: 'Given the client rejects D107 while it is on a draft claim, when the user tries to issue, then issue is refused until D107 is fixed or removed.',
    run(c) {
      const st = baseState();
      addDocket(st, 'D101', '2026-11-03', 'Approved', [lab('tom', '06:00', '17:00', 0.5)]);
      addDocket(st, 'D107', '2026-11-12', 'Submitted', [lab('jo', '07:00', '15:00')]);
      const cl = createClaim(st, NOV1, ['D101', 'D107'], { id: 'C-004' });
      rejectDocket(st, 'D107');
      _chk(c, 'D107 stays on C-004, flagged', [docketHome(st, 'D107').rec.id, docketIssue(st, getDocket(st, 'D107'))], ['C-004', 'Rejected by client']);
      _refused(c, 'Issue refused', () => issueClaim(st, 'C-004', { confirm: true }), 'C-004 cannot be issued until D107 is fixed or removed (D107: Rejected by client)');
      claimRemoveDocket(st, 'C-004', 'D107');
      _allowed(c, 'D107 removed: issue allowed', () => issueClaim(st, 'C-004'));
      return st;
    } },
  { story: 'VAR-23037', title: 'Approved V-012 ($5,060) at 100%, reducible',
    text: 'Given approved variation V-012 ($5,060), when the claim is created, then V-012 appears at 100%, $5,060, and can be reduced to a lower percent.',
    run(c) {
      const st = baseState(); st.today = '2026-11-16';
      publishVersion(st, 'labour', 'Leading Hand', 75, '2026-11-01');
      addDocket(st, 'D209', '2026-11-10', 'Approved', [lab('tom', '06:00', '17:00', 0.5)]);
      addDocket(st, 'D210', '2026-11-02', 'Approved', [wet('EX-07', 'sam', '07:00', '16:00')]);
      addDocket(st, 'D211', '2026-11-16', 'Approved', [wet('EX-07', 'sam', '07:00', '15:00', 0, ['Breaker 1t']), mat('Concrete', { cost: 600 })]);
      createVariation(st, ['D209', 'D210', 'D211'], { id: 'V-012' }); submitVariation(st, 'V-012'); approveVariation(st, 'V-012');
      const cl = createClaim(st, NOV1, []);
      _chk(c, 'V-012 at 100%', claimVarRows(st, cl).map(l => [l.variation, l.pct, l.value]), [['V-012', 100, 5060]]);
      setVarPct(st, cl.id, 'V-012', 50);
      _chk(c, 'Reduced to 50%', claimTotals(st, cl).vars, 2530);
      _refused(c, 'Over 100% refused', () => setVarPct(st, cl.id, 'V-012', 120), 'Enter a percent complete between 0% (already claimed) and 100%');
      return st;
    } },
  { story: 'VAR-23037', title: 'Two draft claims: V-012 on one is not offered on the other',
    text: 'Given two draft claims are open, when V-012 is added to one, then it is not offered on the other.',
    run(c) {
      const st = baseState(); st.today = '2026-11-16';
      addDocket(st, 'D201', '2026-11-02', 'Approved', [lab('tom', '07:00', '15:00')]);
      createVariation(st, ['D201'], { id: 'V-012' }); submitVariation(st, 'V-012'); approveVariation(st, 'V-012');
      createClaim(st, NOV1, [], { id: 'C-004', vars: [] });
      createClaim(st, { from: '2026-11-16', to: '2026-11-30' }, [], { id: 'C-005', vars: [] });
      _chk(c, 'Before: offered to either draft', offeredVariations(st).map(v => v.id), ['V-012']);
      addVarToClaim(st, 'C-004', 'V-012');
      _chk(c, 'On C-004', claimVarRows(st, getClaim(st, 'C-004')).map(l => l.variation), ['V-012']);
      _chk(c, 'Not offered on C-005', offeredVariations(st).map(v => v.id), []);
      _refused(c, 'Adding to C-005 refused', () => addVarToClaim(st, 'C-005', 'V-012'), 'V-012 is already on draft claim C-004');
      return st;
    } },
  { story: 'VAR-23037', title: 'D101 on an issued claim is read-only',
    text: 'Given D101 is on an issued claim, when opened, then it is read-only and shows "On claim <number>".',
    run(c) {
      const st = baseState(); st.today = '2026-11-16';
      addDocket(st, 'D101', '2026-11-03', 'Approved', [lab('tom', '06:00', '17:00', 0.5)]);
      createClaim(st, NOV1, ['D101'], { id: 'C-004' }); issueClaim(st, 'C-004');
      _chk(c, 'Marker', 'On claim ' + docketHome(st, 'D101').rec.id, 'On claim C-004');
      _refused(c, 'Edit refused', () => editHours(st, 'D101', 0, 8), 'D101 is read-only: it is on issued claim C-004');
      _chk(c, 'Never offered again', _ids(st, 'claim', { from: '2026-11-16', to: '2026-11-30' }).includes('D101'), false);
      return st;
    } },
  { story: 'VAR-23037', title: 'Rate change from 1 Dec leaves the claim issued 20 Nov unchanged',
    text: 'Given a Leading Hand rate change effective 1 Dec, when the November claim issued 20 Nov is opened, then every line is unchanged.',
    run(c) {
      const st = baseState(); st.today = '2026-11-20';
      addDocket(st, 'D101', '2026-11-03', 'Approved', [lab('tom', '06:00', '17:00', 0.5)]);
      addDocket(st, 'D102', '2026-11-09', 'Approved', [wet('EX-07', 'sam', '07:00', '16:00')]);
      const cl = createClaim(st, NOV1, ['D101', 'D102']); issueClaim(st, cl.id);
      _refused(c, 'Effective date before the issue refused', () => publishVersion(st, 'labour', 'Leading Hand', 75, '2026-11-01'), 'Effective date cannot be before the last issued claim or approved variation (20/11/2026)');
      publishVersion(st, 'labour', 'Leading Hand', 75, '2026-12-01');
      _chk(c, 'Every line unchanged', cl.lines.map(l => claimLineValue(st, cl, l)), [840, 1710]);
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
