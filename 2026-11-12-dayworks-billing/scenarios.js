/* Scenarios: each worked example from VAR-23036 and VAR-23037, run on a fresh project through the same engine the UI uses.
   Extras check rules that are not worked examples (late dockets, Not claimable, Send back, releases). */

function _chk(out, label, actual, expected) {
  const pass = typeof expected === 'number' ? typeof actual === 'number' && Math.abs(actual - expected) < 0.005 : JSON.stringify(actual) === JSON.stringify(expected);
  out.push({ label, actual: typeof actual === 'number' ? money(actual) : JSON.stringify(actual), expected: typeof expected === 'number' ? money(expected) : JSON.stringify(expected), pass });
}
function _refused(out, label, fn, msg) {
  try { fn(); out.push({ label, actual: 'allowed', expected: 'refused: ' + msg, pass: false }); }
  catch (e) { out.push({ label, actual: 'refused: ' + e.message, expected: 'refused: ' + msg, pass: e.message === msg }); }
}
function _row(st, mode, id, period) { return pickerRows(st, mode, period).find(r => r.d.id === id) || null; }
function _ids(st, mode, period) { return pickerRows(st, mode, period).map(r => r.d.id); }
const NOV1 = { from: '2026-11-01', to: '2026-11-15' };

const SCENARIOS = [
  /* ───── VAR-23036 Convert daywork dockets into a variation ───── */
  { story: 'VAR-23036', title: 'Approved and unapproved dockets go on a new variation; submit warns',
    text: 'Given D201 (approved, 2 Nov) and D202 (submitted, 4 Nov), when a new variation is created from both, then two calculator-priced lines, both attached, D202 highlighted, and submit warns "1 docket not yet approved" and allows it.',
    run(c) {
      const st = baseState(); st.today = '2026-11-05';
      addDocket(st, 'D201', '2026-11-02', 'Approved', [lab('tom', '07:00', '15:00')]);
      addDocket(st, 'D202', '2026-11-04', 'Submitted', [lab('jo', '07:00', '15:00')]);
      _chk(c, 'Picker lists both, oldest first', _ids(st, 'variation'), ['D201', 'D202']);
      _chk(c, 'D202 highlighted as unapproved', _row(st, 'variation', 'D202').highlight, 'warn');
      _chk(c, 'D202 can be ticked', _row(st, 'variation', 'D202').tickable, true);
      const v = createVariation(st, ['D201', 'D202']);
      _chk(c, 'Variation has two lines', v.lines.length, 2);
      _chk(c, 'D201 line = calculator value', varLineValue(st, v, v.lines[0]), 560);
      _chk(c, 'D202 line = calculator value', varLineValue(st, v, v.lines[1]), 480);
      _chk(c, 'Both dockets attached (marker)', ['D201', 'D202'].map(id => docketHome(st, id).rec.id), [v.id, v.id]);
      const r = submitVariation(st, v.id);
      _chk(c, 'Submit warns', r.message, '1 docket not yet approved');
      submitVariation(st, v.id, { confirm: true });
      _chk(c, 'Submitted after confirming', v.status, 'Submitted');
      _chk(c, 'Decision recorded', v.decisions.length, 1);
      return st;
    } },
  { story: 'VAR-23036', title: 'Wet-hire excavator 9h Monday, no margin',
    text: 'Given a wet-hire excavator docket for 9h on a Monday priced at $1,710, when added to a variation, then the line reads $1,710 ex GST with no cost-plus margin.',
    run(c) {
      const st = baseState();
      addDocket(st, 'D210', '2026-11-02', 'Approved', [wet('EX-07', 'sam', '07:00', '16:00')]);
      const v = createVariation(st, ['D210']);
      _chk(c, 'Project Plant cost-plus margin is set', st.project.margins.Plant, 8);
      _chk(c, 'Line reads (ex GST)', varLineValue(st, v, v.lines[0]), 1710);
      _chk(c, 'Variation total = calculator value, margin applied $0', round2(varTotal(st, v) - 1710), 0);
      return st;
    } },
  { story: 'VAR-23036', title: 'Wet hire with breaker and mobilise',
    text: 'Given D205 has a wet-hire line with a breaker ($2,090) and a $450 mobilise charge, when added to a variation, then the line reads $2,540.',
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
  { story: 'VAR-23036', title: 'Docket on an approved variation is not in the claim picker',
    text: 'Given D201 is on V-012 which is approved, when the next claim is created, then D201 is not in the picker and V-012 is claimed as an approved variation.',
    run(c) {
      const st = baseState(); st.today = '2026-11-16';
      addDocket(st, 'D201', '2026-11-02', 'Approved', [lab('tom', '07:00', '15:00')]);
      createVariation(st, ['D201'], { id: 'V-012' }); submitVariation(st, 'V-012'); approveVariation(st, 'V-012');
      _chk(c, 'D201 not in claim picker', _ids(st, 'claim', NOV1).includes('D201'), false);
      _chk(c, 'D201 not in variation picker', _ids(st, 'variation').includes('D201'), false);
      const cl = createClaim(st, NOV1, []);
      _chk(c, 'V-012 on the claim as a variation line', claimVarLines(st, cl).map(l => l.variation), ['V-012']);
      _chk(c, 'Claimed at the approved amount', claimTotals(st, cl).vars, 560);
      _refused(c, 'Saving D201 onto the claim is refused', () => claimAddDockets(st, cl.id, ['D201']), 'D201 is already on variation V-012');
      return st;
    } },
  { story: 'VAR-23036', title: 'Removing a docket from an unsubmitted variation releases it',
    text: 'Given D203 is on unsubmitted V-013, when D203 is removed, then D203 is offered again to the next variation or claim.',
    run(c) {
      const st = baseState();
      addDocket(st, 'D203', '2026-11-05', 'Approved', [lab('cris', '07:00', '15:00')]);
      createVariation(st, ['D203'], { id: 'V-013' });
      _chk(c, 'Not offered while on V-013', _ids(st, 'variation').includes('D203'), false);
      removeFromVariation(st, 'V-013', 'D203');
      _chk(c, 'Offered to the next variation', _ids(st, 'variation').includes('D203'), true);
      _chk(c, 'Offered to the next claim', _ids(st, 'claim', NOV1).includes('D203'), true);
      return st;
    } },
  { story: 'VAR-23036', title: 'Rejected variation releases its three dockets',
    text: 'Given V-014 with three dockets is rejected by the client, when the rejection is recorded, then its three dockets are released and offered again.',
    run(c) {
      const st = baseState();
      addDocket(st, 'D212', '2026-11-03', 'Approved', [mat('Road base', { qty: 12 }), lab('jo', '07:00', '15:00')]);
      addDocket(st, 'D213', '2026-11-04', 'Approved', [sub('Traffic control', 1200)]);
      addDocket(st, 'D214', '2026-11-05', 'Approved', [dry('EX-12', '07:00', '16:00')]);
      createVariation(st, ['D212', 'D213', 'D214'], { id: 'V-014' }); submitVariation(st, 'V-014');
      releaseVariation(st, 'V-014', 'Rejected');
      _chk(c, 'V-014 status', getVar(st, 'V-014').status, 'Rejected');
      _chk(c, 'All three offered again', ['D212', 'D213', 'D214'].map(id => _ids(st, 'variation').includes(id)), [true, true, true]);
      _chk(c, 'No docket carries a marker', ['D212', 'D213', 'D214'].map(id => docketHome(st, id)), [null, null, null]);
      return st;
    } },
  { story: 'VAR-23036', title: 'Rejected docket cannot be ticked',
    text: 'Given D204 is rejected, when the picker opens, then D204 is shown highlighted and cannot be ticked.',
    run(c) {
      const st = baseState();
      addDocket(st, 'D204', '2026-11-10', 'Rejected', [lab('jo', '07:00', '13:00')]);
      const r = _row(st, 'variation', 'D204');
      _chk(c, 'Listed', !!r, true);
      _chk(c, 'Highlighted with reason', [r.highlight, r.block], ['block', 'Rejected']);
      _chk(c, 'Cannot be ticked', r.tickable, false);
      _refused(c, 'Enforced on save', () => createVariation(st, ['D204']), 'D204 is Rejected and cannot be added');
      return st;
    } },
  { story: 'VAR-23036', title: 'Unmapped Tool allowance blocks the docket',
    text: 'Given D206 carries a Tool allowance with no allowance line, when the picker opens, then D206 is highlighted with "Unmapped: Tool allowance" and cannot be ticked.',
    run(c) {
      const st = baseState();
      addDocket(st, 'D206', '2026-11-11', 'Submitted', [lab('tom', '07:00', '15:00', 0, [{ type: 'Tool' }])]);
      const r = _row(st, 'variation', 'D206');
      _chk(c, 'Reason shown', r.block, 'Unmapped: Tool allowance');
      _chk(c, 'Cannot be ticked', r.tickable, false);
      return st;
    } },
  { story: 'VAR-23036', title: 'Not claimable docket is not listed',
    text: 'Given D207 is Not claimable, when the picker opens, then D207 is not listed.',
    run(c) {
      const st = baseState();
      addDocket(st, 'D207', '2026-11-12', 'Draft', [lab('cris', '07:00', '11:00')]);
      markNotClaimable(st, 'D207', '');
      _chk(c, 'Not in the variation picker', _ids(st, 'variation').includes('D207'), false);
      _refused(c, 'Enforced on save', () => createVariation(st, ['D207']), 'D207 is Not claimable');
      return st;
    } },
  { story: 'VAR-23036', title: 'Docket edit on an unsubmitted variation updates and flags the line',
    text: 'Given D208 ($840) is on unsubmitted V-015, when its labour line is edited down to 8h, then the V-015 line reads $560 and is flagged as changed since added.',
    run(c) {
      const st = baseState();
      addDocket(st, 'D208', '2026-11-10', 'Approved', [lab('tom', '06:00', '17:00', 0.5)]);
      const v = createVariation(st, ['D208'], { id: 'V-015' });
      _chk(c, 'Line when added', v.lines[0].added, 840);
      editHours(st, 'D208', 0, 8);
      _chk(c, 'Line now reads', varLineValue(st, v, v.lines[0]), 560);
      _chk(c, 'Flagged as changed since added', varLineChanged(st, v, v.lines[0]), true);
      return st;
    } },
  { story: 'VAR-23036', title: 'New calculator version moves a submitted variation until approval',
    text: 'Given V-016 submitted at $5,000 incl. D209 at $840, when a new calculator version raises D209 to $900, then the line reads $900, submitted amount $5,060, both flagged; when V-016 is approved, neither changes again.',
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
      _chk(c, 'Submitted amount flagged', varSubmittedChanged(st, v), true);
      approveVariation(st, 'V-016');
      publishVersion(st, 'labour', 'Leading Hand', 80, '2026-11-01');
      _chk(c, 'D209 would now price at (live calculator)', priceDocket(st, getDocket(st, 'D209')).total, 960);
      _chk(c, 'After approval, D209 line still', varLineValue(st, v, v.lines[0]), 900);
      _chk(c, 'After approval, submitted amount still', varSubmittedAmount(st, v), 5060);
      _chk(c, 'Approved amount', v.approvedAmount, 5060);
      _refused(c, 'D209 is read-only', () => editHours(st, 'D209', 0, 8), 'D209 is read-only: it is on approved variation V-016');
      return st;
    } },

  /* ───── VAR-23037 Convert daywork dockets into a progress claim ───── */
  { story: 'VAR-23037', title: 'In-period dockets pre-ticked; issue warns',
    text: 'Given D101 (approved, 3 Nov) and D102 (submitted, 9 Nov) on a claim for 1 to 15 Nov, then both offered and pre-ticked, D102 highlighted, and issuing warns "1 docket not yet approved" and allows it.',
    run(c) {
      const st = baseState(); st.today = '2026-11-16';
      addDocket(st, 'D101', '2026-11-03', 'Approved', [lab('tom', '06:00', '17:00', 0.5)]);
      addDocket(st, 'D102', '2026-11-09', 'Submitted', [wet('EX-07', 'sam', '07:00', '16:00')]);
      const rows = pickerRows(st, 'claim', NOV1);
      _chk(c, 'Both pre-ticked', rows.map(r => [r.d.id, r.preTick]), [['D101', true], ['D102', true]]);
      _chk(c, 'D102 highlighted', _row(st, 'claim', 'D102', NOV1).highlight, 'warn');
      const cl = createClaim(st, NOV1, rows.filter(r => r.preTick).map(r => r.d.id));
      const r = issueClaim(st, cl.id);
      _chk(c, 'Issue warns', r.message, '1 docket not yet approved');
      issueClaim(st, cl.id, { confirm: true });
      _chk(c, 'Issued after confirming', cl.status, 'Issued');
      _chk(c, 'Decision recorded', cl.decisions.length, 1);
      return st;
    } },
  { story: 'VAR-23037', title: 'Older unclaimed docket offered unticked',
    text: 'Given D095 (approved, 25 Oct) was not on the October claim, when the November claim is created, then D095 is offered, unticked, and can be ticked in.',
    run(c) {
      const st = baseState(); st.today = '2026-10-31';
      addDocket(st, 'D091', '2026-10-20', 'Approved', [lab('tom', '07:00', '15:30', 0.5)]);
      createClaim(st, { from: '2026-10-16', to: '2026-10-31' }, ['D091'], { id: 'C-003' }); issueClaim(st, 'C-003');
      addDocket(st, 'D095', '2026-10-25', 'Approved', [lab('jo', '07:00', '15:00')]);
      st.today = '2026-11-16';
      const r = _row(st, 'claim', 'D095', NOV1);
      _chk(c, 'Offered', !!r, true);
      _chk(c, 'Unticked', r.preTick, false);
      _chk(c, 'Can be ticked', r.tickable, true);
      const cl = createClaim(st, NOV1, ['D095']);
      _chk(c, 'Ticked in at its value', claimLineValue(st, cl, cl.lines[0]), 960);
      return st;
    } },
  { story: 'VAR-23037', title: 'Rejected docket cannot be ticked',
    text: 'Given D103 is rejected, when the claim is created, then D103 is highlighted and cannot be ticked.',
    run(c) {
      const st = baseState();
      addDocket(st, 'D103', '2026-11-05', 'Rejected', [lab('ben', '07:00', '15:00')]);
      const r = _row(st, 'claim', 'D103', NOV1);
      _chk(c, 'Highlighted with reason', [r.highlight, r.block], ['block', 'Rejected']);
      _chk(c, 'Not pre-ticked, cannot be ticked', [r.preTick, r.tickable], [false, false]);
      return st;
    } },
  { story: 'VAR-23037', title: 'Overlapping plant blocks the docket',
    text: 'Given D104 has a plant item on two lines with overlapping hours, when the claim is created, then D104 is highlighted with "Overlap: EX-07" and cannot be ticked.',
    run(c) {
      const st = baseState();
      addDocket(st, 'D104', '2026-11-06', 'Draft', [dry('EX-07', '07:00', '12:00'), wet('EX-07', 'lee', '10:00', '15:00')]);
      const r = _row(st, 'claim', 'D104', NOV1);
      _chk(c, 'Reason shown', r.block, 'Overlap: EX-07');
      _chk(c, 'Cannot be ticked', r.tickable, false);
      return st;
    } },
  { story: 'VAR-23037', title: 'Not claimable docket is not listed',
    text: 'Given D105 is Not claimable, when the claim is created, then D105 is not listed.',
    run(c) {
      const st = baseState();
      addDocket(st, 'D105', '2026-11-06', 'Submitted', [lab('jo', '07:00', '11:00')]);
      markNotClaimable(st, 'D105', 'goodwill, no charge');
      _chk(c, 'Not in the claim picker', _ids(st, 'claim', NOV1).includes('D105'), false);
      return st;
    } },
  { story: 'VAR-23037', title: 'Leading Hand 10.5h Tuesday, no margin, GST and retention per project',
    text: 'Given a Leading Hand docket of 10.5h on a Tuesday priced at $840 and a project Labour margin of 10%, when added, then the line is $840 ex GST, no margin added, GST and retention per the project settings.',
    run(c) {
      const st = baseState();
      addDocket(st, 'D101', '2026-11-03', 'Approved', [lab('tom', '06:00', '17:00', 0.5)]);
      const cl = createClaim(st, NOV1, ['D101']);
      const t = claimTotals(st, cl);
      _chk(c, 'Project Labour margin is set', st.project.margins.Labour, 10);
      _chk(c, 'Line (ex GST)', claimLineValue(st, cl, cl.lines[0]), 840);
      _chk(c, 'Margin applied ($840 x 10% would be $84)', round2(t.dockets - 840), 0);
      _chk(c, 'Retention 5% (project setting)', t.retention, 42);
      _chk(c, 'GST 10% on net (project setting)', t.gst, 79.8);
      _chk(c, 'Total incl GST', t.total, 877.8);
      return st;
    } },
  { story: 'VAR-23037', title: 'Docket edit on a draft claim updates and flags the line',
    text: 'Given D106 is on a draft claim at $840, when D106 is edited down to 8h, then the claim line reads $560 and is flagged as changed since added.',
    run(c) {
      const st = baseState();
      addDocket(st, 'D106', '2026-11-10', 'Draft', [lab('mel', '06:00', '17:00', 0.5)]);
      const cl = createClaim(st, NOV1, ['D106']);
      _chk(c, 'Line when added', cl.lines[0].added, 840);
      editHours(st, 'D106', 0, 8);
      _chk(c, 'Line now reads', claimLineValue(st, cl, cl.lines[0]), 560);
      _chk(c, 'Flagged as changed since added', claimLineChanged(st, cl, cl.lines[0]), true);
      return st;
    } },
  { story: 'VAR-23037', title: 'Docket on an approved variation not offered; variation claimed',
    text: 'Given D201 is on approved V-012, when the claim is created, then D201 is not offered and V-012 appears as an approved variation on the claim.',
    run(c) {
      const st = baseState();
      addDocket(st, 'D201', '2026-11-02', 'Approved', [lab('tom', '07:00', '15:00')]);
      createVariation(st, ['D201'], { id: 'V-012' }); submitVariation(st, 'V-012'); approveVariation(st, 'V-012');
      _chk(c, 'D201 not offered', _ids(st, 'claim', NOV1).includes('D201'), false);
      const cl = createClaim(st, NOV1, []);
      _chk(c, 'V-012 is a variation line', claimVarLines(st, cl).map(l => [l.variation, l.amount]), [['V-012', 560]]);
      return st;
    } },
  { story: 'VAR-23037', title: 'Docket on an issued claim is read-only',
    text: 'Given D101 is on an issued claim, when someone opens D101, then it is read-only and shows "On claim <number>".',
    run(c) {
      const st = baseState(); st.today = '2026-11-16';
      addDocket(st, 'D101', '2026-11-03', 'Approved', [lab('tom', '06:00', '17:00', 0.5)]);
      const cl = createClaim(st, NOV1, ['D101'], { id: 'C-004' }); issueClaim(st, 'C-004');
      _chk(c, 'Marker', 'On claim ' + docketHome(st, 'D101').rec.id, 'On claim C-004');
      _chk(c, 'Locked', isLocked(st, 'D101'), true);
      _refused(c, 'Edit refused', () => editHours(st, 'D101', 0, 8), 'D101 is read-only: it is on issued claim C-004');
      _chk(c, 'Never offered again', _ids(st, 'claim', { from: '2026-11-16', to: '2026-11-30' }).includes('D101'), false);
      return st;
    } },
  { story: 'VAR-23037', title: 'Rate change after issue leaves the issued claim unchanged',
    text: 'Given the Leading Hand rate changes effective 1 Dec, when the November claim (issued 20 Nov) is opened, then every docket line is unchanged.',
    run(c) {
      const st = baseState(); st.today = '2026-11-20';
      addDocket(st, 'D101', '2026-11-03', 'Approved', [lab('tom', '06:00', '17:00', 0.5)]);
      addDocket(st, 'D102', '2026-11-09', 'Approved', [wet('EX-07', 'sam', '07:00', '16:00')]);
      const cl = createClaim(st, NOV1, ['D101', 'D102']); issueClaim(st, cl.id);
      _refused(c, 'Effective date before the issue is refused', () => publishVersion(st, 'labour', 'Leading Hand', 75, '2026-11-01'), 'Effective date cannot be before the last issued claim (20/11/2026)');
      publishVersion(st, 'labour', 'Leading Hand', 75, '2026-12-01');
      _chk(c, 'Every docket line unchanged', cl.lines.map(l => claimLineValue(st, cl, l)), [840, 1710]);
      addDocket(st, 'D150', '2026-12-01', 'Approved', [lab('tom', '06:00', '17:00', 0.5)]);
      _chk(c, 'Sanity: a 1 Dec docket prices at the new rate', priceDocket(st, getDocket(st, 'D150')).total, 900);
      return st;
    } },

  /* ───── Extras: rules that are not worked examples ───── */
  { story: 'Extra', title: 'A late docket rolls onto the next claim',
    text: 'An issued claim stays locked. A docket dated in its period that arrives after issue is unclaimed and is offered, unticked, on the next claim.',
    run(c) {
      const st = baseState(); st.today = '2026-11-16';
      addDocket(st, 'D101', '2026-11-03', 'Approved', [lab('tom', '06:00', '17:00', 0.5)]);
      const c4 = createClaim(st, NOV1, ['D101'], { id: 'C-004' }); issueClaim(st, 'C-004');
      addDocket(st, 'D108', '2026-11-14', 'Submitted', [lab('jo', '07:00', '15:00')]);
      _refused(c, 'Cannot add to the issued claim', () => claimAddDockets(st, 'C-004', ['D108']), 'C-004 is issued and locked');
      const next = { from: '2026-11-16', to: '2026-11-30' };
      const r = _row(st, 'claim', 'D108', next);
      _chk(c, 'Offered on the next claim, unticked', [!!r, r && r.preTick, r && r.tickable], [true, false, true]);
      _chk(c, 'Issued claim unchanged', claimTotals(st, c4).dockets, 840);
      return st;
    } },
  { story: 'VAR-23062', title: 'Not claimable: refused while on a variation; reopen returns it',
    text: 'D302 on V-020 is refused with "Remove this docket from variation V-020 first". D301 set Not claimable leaves the pickers and reopening returns it to Submitted.',
    run(c) {
      const st = baseState();
      addDocket(st, 'D301', '2026-11-04', 'Submitted', [lab('jo', '07:00', '15:00')]);
      addDocket(st, 'D302', '2026-11-04', 'Approved', [lab('tom', '07:00', '15:00')]);
      createVariation(st, ['D302'], { id: 'V-020' });
      _refused(c, 'D302 refused', () => markNotClaimable(st, 'D302'), 'Remove this docket from variation V-020 first');
      markNotClaimable(st, 'D301', 'goodwill, no charge');
      _chk(c, 'D301 absent from both pickers', [_ids(st, 'variation').includes('D301'), _ids(st, 'claim', NOV1).includes('D301')], [false, false]);
      reopenDocket(st, 'D301');
      _chk(c, 'Reopened to Submitted and offered again', [getDocket(st, 'D301').status, _ids(st, 'variation').includes('D301')], ['Submitted', true]);
      return st;
    } },
  { story: 'VAR-23063', title: 'Send back: refused while on a variation; sent-back draft stays tickable',
    text: 'D402 on V-021 is refused. D401 sent back becomes Draft with a Sent back marker and is still offered (highlighted, tickable). Other without a note is refused.',
    run(c) {
      const st = baseState();
      addDocket(st, 'D401', '2026-11-04', 'Submitted', [lab('jo', '07:00', '15:00')]);
      addDocket(st, 'D402', '2026-11-04', 'Submitted', [lab('tom', '07:00', '15:00')]);
      createVariation(st, ['D402'], { id: 'V-021' });
      _refused(c, 'D402 refused', () => sendBack(st, 'D402', 'Missing info', ''), 'Remove this docket from variation V-021 first');
      _refused(c, 'Other without a note refused', () => sendBack(st, 'D401', 'Other', ''), 'Add a note for Other');
      sendBack(st, 'D401', 'More photos', 'need the trench depth shot');
      const r = _row(st, 'variation', 'D401');
      _chk(c, 'D401 is Draft with marker', [getDocket(st, 'D401').status, getDocket(st, 'D401').sentBack.reason], ['Draft', 'More photos']);
      _chk(c, 'Still offered, highlighted, tickable', [r.highlight, r.tickable], ['warn', true]);
      return st;
    } },
  { story: 'Extra', title: 'Withdrawn variation and deleted draft claim release dockets; submitted variation takes no more',
    text: 'Withdrawing a variation or deleting a draft claim releases its dockets. A submitted variation cannot take more dockets.',
    run(c) {
      const st = baseState();
      addDocket(st, 'D501', '2026-11-04', 'Approved', [lab('jo', '07:00', '15:00')]);
      addDocket(st, 'D502', '2026-11-05', 'Approved', [lab('tom', '07:00', '15:00')]);
      addDocket(st, 'D503', '2026-11-06', 'Approved', [lab('tom', '07:00', '15:00')]);
      const v = createVariation(st, ['D501']); submitVariation(st, v.id);
      _refused(c, 'Adding to a submitted variation refused', () => addToVariation(st, v.id, ['D503']), v.id + ' is submitted and cannot take more dockets');
      releaseVariation(st, v.id, 'Withdrawn');
      const cl = createClaim(st, NOV1, ['D502']); deleteDraftClaim(st, cl.id);
      _chk(c, 'D501 and D502 offered again', [_ids(st, 'claim', NOV1).includes('D501'), _ids(st, 'claim', NOV1).includes('D502')], [true, true]);
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
