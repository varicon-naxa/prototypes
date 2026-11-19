/* Dayworks lean release (2026-11-18): rates table, variations from dockets, claims from dockets. Engine.
   Spec: VAR-23036 (dockets to variation), VAR-23037 (dockets to claim), VAR-23062 (Not claimable),
   VAR-23063 (Send back), VAR-23035 (Dayworks Calculator, pricing source).
   Every action takes a state object so the UI and the Scenarios panel run the same code. */

/* ───────── Reference data (Project A from VAR-23035) ───────── */
const TIERS = ['std', 'x15', 'x2', 'ph'];
const TIER_LABEL = { std: 'Std', x15: '1.5x', x2: '2x', ph: 'PH' };
const PUBLIC_HOLIDAYS = { '2026-12-25': 'Christmas Day', '2026-12-28': 'Boxing Day (observed)', '2027-01-01': "New Year's Day" };
const PEOPLE = {
  tom:  { name: 'Tom Reilly',     role: 'Leading Hand' },
  mel:  { name: 'Mel Grant',      role: 'Leading Hand' },
  sam:  { name: 'Sam Patel',      role: 'Operator' },
  lee:  { name: 'Lee Tan',        role: 'Operator' },
  jo:   { name: 'Jo Walker',      role: 'Labourer' },
  cris: { name: 'Cris Dela Cruz', role: 'Labourer' },
  ben:  { name: 'Ben Okafor',     role: 'Plumber' },
};
const PLANT = {
  'EX-07': { name: 'Cat 320',       res: 'Excavator 20t', type: 'Excavator' },
  'EX-12': { name: 'Komatsu PC210', res: 'Excavator 20t', type: 'Excavator' },
  'EX-15': { name: 'Hitachi ZX200', res: 'Excavator 20t', type: 'Excavator' },
};
const ACTIVE_VAR = ['Pending', 'Approved', 'Partial Approved'];
const ACTIVE_CLAIM = ['Draft', 'Submitted', 'Approved'];

function rates(std, x15, x2, ph) { return { std, x15: x15 ?? std * 1.5, x2: x2 ?? std * 2, ph: ph ?? std * 2.5 }; }
function baseCalc() {
  return {
    n: 1, effectiveFrom: '2026-10-01', savedBy: 'Dana Whitfield (PM)', savedOn: '2026-09-28', note: 'Initial schedule of rates',
    triggers: { weekday: { std: 8, x15: 2, x2: 'rest' }, sat: { x15: 2, x2: 'rest' }, sun: { x2: 'rest' }, ph: { ph: 'rest' } },
    labour: [
      { name: 'Leading Hand', resources: ['Leading Hand'], named: [], r: rates(70), min: 4 },
      { name: 'Plant Operator', resources: ['Operator'], named: [], r: rates(80), min: 4 },
      { name: 'Labourer', resources: ['Labourer', 'Plumber'], named: [], r: rates(60), min: 4 },
      { name: 'Skilled Labourer & Trades Assistant', resources: [], named: ['cris'], r: rates(75), min: 4 },
    ],
    wet: [
      { name: 'Excavator 20t wet', resources: ['Excavator 20t'], named: [], r: rates(180), min: 4 },
      { name: 'EX-12 wet', resources: [], named: ['EX-12'], r: rates(200), min: 4 },
    ],
    dry: [{ name: 'Excavator 20t dry', resources: ['Excavator 20t'], named: [], r: { std: 120 }, unit: 'hour', min: 4 }],
    attach: [{ name: 'Breaker 1t', resources: ['Breaker 1t'], r: rates(40) }],
    float: [{ name: 'Excavator float', plantType: 'Excavator', mob: 450, demob: 400 }],
    allow: [
      { name: 'Meal', type: 'Meal', unit: 'occurrence', amount: 25, threshold: 10 },
      { name: 'Site allowance', type: 'Site allowance', unit: 'day', amount: 15 },
      { name: 'Dirty work', type: 'Dirty work', unit: 'hour', amount: 3 },
      { name: 'Travel', type: 'Travel', unit: 'km', amount: 1.2 },
    ],
    materials: [{ name: 'Road base', resources: ['Road base'], unit: 'tonne', rate: 45 }, { name: 'Concrete', resources: ['Concrete'], margin: 15 }],
    sub: [{ name: 'Traffic control', resources: ['Traffic control'], margin: 10 }],
  };
}

function baseState() {
  return {
    today: '2026-11-16', user: 'Dana Whitfield (PM)',
    project: {
      name: 'Riverside Rd Upgrade', code: 'RRU01', client: 'Northern Councils', state: 'NSW', contractSum: 1250000,
      margins: { Labour: 10, Plant: 8, Materials: 12, Subcontract: 10 },
      // Internal COST rates (what the work costs us, as in Daily Cost Tracking), not the client charge.
      cost: { labour: { 'Leading Hand': 55, 'Operator': 60, 'Labourer': 45, 'Plumber': 50 }, plant: { 'Excavator 20t': 95 }, attach: { 'Breaker 1t': 20 }, float: 300, material: { 'Road base': 30 }, sub: { 'Traffic control': 110 } },
      rates: baseRates(),
      retention: 5, gst: 10,
      boq: [
        { code: '1.1', desc: 'Bulk excavation', unit: 'm3', qty: 4200, rate: 18.5 },
        { code: '2.3', desc: 'Kerb and channel', unit: 'm', qty: 1600, rate: 62 },
        { code: '3.1', desc: 'Road base 150mm', unit: 'm2', qty: 9800, rate: 14.2 },
      ],
    },
    versions: [baseCalc()],
    dockets: [], variations: [], claims: [], log: [],
  };
}

/* ───────── Docket builders ───────── */
function lab(person, start, end, brk = 0, allow = []) { return { t: 'labour', person, start, end, brk, allow }; }
function wet(plant, person, start, end, brk = 0, att = [], allow = []) { return { t: 'wet', plant, person, start, end, brk, att, allow }; }
function dry(plant, start, end, brk = 0) { return { t: 'dry', plant, start, end, brk }; }
function flt(plant, dir = 'mob') { return { t: 'float', plant, dir }; }
function mat(item, o) { return Object.assign({ t: 'material', item }, o); }
function sub(item, cost, qty) { const o = { t: 'sub', item }; if (cost !== null && cost !== undefined) o.cost = cost; if (qty !== undefined) o.qty = qty; return o; }
function addDocket(st, id, date, status, lines, extra = {}) {
  const d = Object.assign({ id, date, status, prevStatus: null, sentBack: null, nc: null, createdBy: 'Sam Patel', desc: '', ref: '', approvedOn: null, history: [{ at: date, by: 'Sam Patel', what: 'Created' }], lines }, extra);
  if (status !== 'Draft') d.history.push({ at: date, by: 'Sam Patel', what: status === 'Ready for Review' ? 'Ready for review' : 'Sent to the client for signature' });
  if (['Approved', 'Costed', 'Invoiced'].includes(status)) { d.approvedOn = date; d.history.push({ at: date, by: 'Client (signed)', what: 'Approved' }); }
  if (status === 'Costed') d.history.push({ at: date, by: 'Dana Whitfield (PM)', what: 'Marked as costed' });
  if (status === 'Invoiced') d.history.push({ at: date, by: 'Dana Whitfield (PM)', what: 'Marked as invoiced (manually)' });
  if (status === 'Rejected') d.history.push({ at: date, by: 'Client (email)', what: 'Rejected by client' });
  st.dockets.push(d);
  return d;
}

/* ───────── Helpers ───────── */
function clone(o) { return JSON.parse(JSON.stringify(o)); }
function round2(n) { return Math.round((n + Number.EPSILON) * 100) / 100; }
function money(v) { if (v === null || v === undefined) return '-'; return (v < 0 ? '-$' : '$') + Math.abs(v).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtDate(d) { if (!d) return '-'; const [y, m, dd] = d.split('-'); return dd + '/' + m + '/' + y; }
function dayName(d) { return new Date(d + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'short' }); }
function toMin(t) { const [h, m] = t.split(':').map(Number); return h * 60 + m; }
function fromMin(m) { const z = x => String(x).padStart(2, '0'); return z(Math.floor(m / 60)) + ':' + z(Math.round(m % 60)); }
function fmtH(h) { return String(Math.round(h * 100) / 100); }
function dayType(date) { if (PUBLIC_HOLIDAYS[date]) return 'ph'; const g = new Date(date + 'T00:00:00').getDay(); return g === 0 ? 'sun' : g === 6 ? 'sat' : 'weekday'; }
function tierOrder(tr, dt) { const t = tr[dt]; const out = []; TIERS.forEach(k => { const v = t[k]; if (v === null || v === undefined) return; out.push([k, v === 'rest' ? Infinity : v]); }); return out.length ? out : [['std', Infinity]]; }
function lineHours(l) { return (toMin(l.end) - toMin(l.start)) / 60 - (l.brk || 0); }
function allowName(type) { return /allowance$/i.test(type) ? type : type + ' allowance'; }
function versionFor(st, date) {
  return st.versions.filter(v => v.effectiveFrom <= date).sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom) || b.n - a.n)[0] || null;
}
function getDocket(st, id) { const d = st.dockets.find(x => x.id === id); if (!d) throw new Error('No docket ' + id); return d; }
function getVar(st, id) { const v = st.variations.find(x => x.id === id); if (!v) throw new Error('No variation ' + id); return v; }
function getClaim(st, id) { const c = st.claims.find(x => x.id === id); if (!c) throw new Error('No claim ' + id); return c; }
function log(st, what, kind = 'action') { st.log.unshift({ at: st.today, what, kind }); }

/* ───────── Pricing: the project rates table (lean release, decided 2026-11-18) ─────────
   One table of charge resources: resource, type, unit, charge rate. A docket's value is the sum over its lines of
   quantity x charge rate (hours worked as recorded for labour and plant, quantity for materials and subcontract).
   No tiers, day types, minimum hours, allowances, versions or effective dates. A line with no rate is Unmapped. */
function baseRates() {
  return [
    { key: 'person:cris', resource: 'Cris Dela Cruz (Skilled Labourer)', type: 'Labour', unit: 'Hour', rate: 88 },
    { key: 'role:Leading Hand', resource: 'Leading Hand', type: 'Labour', unit: 'Hour', rate: 95 },
    { key: 'role:Operator', resource: 'Plant Operator', type: 'Labour', unit: 'Hour', rate: 98 },
    { key: 'role:Labourer', resource: 'Labourer', type: 'Labour', unit: 'Hour', rate: 78 },
    { key: 'wet:Excavator 20t', resource: 'Excavator 20t, wet hire (operator included)', type: 'Plant and Equipment', unit: 'Hour', rate: 215 },
    { key: 'dry:Excavator 20t', resource: 'Excavator 20t, dry hire', type: 'Plant and Equipment', unit: 'Hour', rate: 135 },
    { key: 'attach:Breaker 1t', resource: 'Breaker 1t (attachment)', type: 'Plant and Equipment', unit: 'Hour', rate: 45 },
    { key: 'float:mob:Excavator', resource: 'Excavator float, mobilise', type: 'Plant and Equipment', unit: 'Each', rate: 480 },
    { key: 'float:demob:Excavator', resource: 'Excavator float, demobilise', type: 'Plant and Equipment', unit: 'Each', rate: 420 },
    { key: 'material:Road base', resource: 'Road base (DGB20)', type: 'Material', unit: 'Tonne', rate: 52 },
    { key: 'sub:Traffic control', resource: 'Traffic control (2-person crew)', type: 'Subcontractor', unit: 'Hour', rate: 145 },
  ];
}
function rateRow(st, key) { return st.project.rates.find(r => r.key === key) || null; }
function setRate(st, key, rate) {
  const r = rateRow(st, key); if (!r) throw new Error('No charge resource ' + key);
  if (!(rate >= 0)) throw new Error('Enter a rate of 0 or more');
  const was = r.rate; r.rate = round2(rate);
  log(st, 'Charge Resource ' + r.resource + ' ' + money(was) + ' to ' + money(r.rate) + ' per ' + r.unit.toLowerCase() + ' (changed by support)');
  sync(st, r.resource + ' rate changed');
}
// Rates download (VAR-23168, lean): one row per rate line, rates in effect today.
function ratesAppliesTo(st, r) {
  const [kind, x, y] = r.key.split(':');
  const named = st.project.rates.filter(q => q.key.startsWith('person:')).map(q => q.key.split(':')[1]);
  if (kind === 'person') return PEOPLE[x].name;
  if (kind === 'role') return Object.entries(PEOPLE).filter(([id, p]) => p.role === x && !named.includes(id)).map(([, p]) => p.name).join(', ') || '-';
  if (kind === 'wet' || kind === 'dry') return Object.entries(PLANT).filter(([, p]) => p.res === x).map(([id, p]) => id + ' ' + p.name).join(', ') || '-';
  if (kind === 'attach') return x + ' on any wet-hire plant';
  if (kind === 'float') return Object.entries(PLANT).filter(([, p]) => p.type === y).map(([id]) => id).join(', ') || '-';
  return '-';
}
function ratesExportRows(st) { return st.project.rates.map(r => ({ key: r.key, type: r.type, resource: r.resource, unit: r.unit, rate: r.rate, appliesTo: ratesAppliesTo(st, r) })); }
function ratesExportAoa(st) {
  return [[st.project.name + ' (' + st.project.code + ')'], ['Rates as at ' + fmtDate(st.today)], [], ['Resource Type', 'Resource', 'Unit', 'Charge Rate', 'Applies to']]
    .concat(ratesExportRows(st).map(r => [r.type, r.resource, r.unit, r.rate, r.appliesTo]));
}
function ratesFileName(st) { return st.project.code + ' dayworks rates ' + fmtDate(st.today).replace(/\//g, '-') + '.xlsx'; }
function priceDocket(st, d) {
  const out = { version: { n: 1 }, lines: [], total: 0, problems: [] };
  const timed = d.lines.map((l, i) => ({ l, i })).filter(x => ['labour', 'wet', 'dry'].includes(x.l.t));
  const overlapNames = new Set(); const overlapLines = new Set();
  for (let a = 0; a < timed.length; a++) for (let b = a + 1; b < timed.length; b++) {
    const A = timed[a].l, B = timed[b].l;
    if (!(toMin(A.start) < toMin(B.end) && toMin(B.start) < toMin(A.end))) continue;
    if (A.plant && A.plant === B.plant) { overlapNames.add(A.plant); overlapLines.add(timed[a].i); overlapLines.add(timed[b].i); }
    if (A.person && A.person === B.person && A.t !== 'dry' && B.t !== 'dry') { overlapNames.add(PEOPLE[A.person].name); overlapLines.add(timed[a].i); overlapLines.add(timed[b].i); }
  }
  overlapNames.forEach(n => out.problems.push('Overlap: ' + n));
  const unmapped = [];
  d.lines.forEach((l, i) => {
    const r = { i, l, label: '', rateLine: null, rows: [], extras: [], value: 0, unmapped: [], overlap: overlapLines.has(i), hours: null };
    const charge = (row, qty, label) => { r.rateLine = { name: row.resource, key: row.key }; r.rows.push({ tier: 'unit', hours: qty, rate: row.rate, unit: row.unit, value: round2(qty * row.rate) }); };
    const miss = (what) => r.unmapped.push(what);
    if (l.t === 'labour') {
      const p = PEOPLE[l.person]; r.hours = lineHours(l); r.label = p.name + ' (' + p.role + ')';
      const row = rateRow(st, 'person:' + l.person) || rateRow(st, 'role:' + p.role);
      if (row) charge(row, r.hours); else miss(p.name + ' (' + p.role + ')');
    } else if (l.t === 'wet') {
      const P = PLANT[l.plant]; r.hours = lineHours(l); r.label = l.plant + ' ' + P.name + ' wet, operator ' + PEOPLE[l.person].name;
      const row = rateRow(st, 'wet:' + P.res);
      if (row) charge(row, r.hours); else miss(l.plant + ' (wet hire)');
      (l.att || []).forEach(an => { const ar = rateRow(st, 'attach:' + an); if (!ar) { miss(an); r.extras.push({ label: an, value: 0, note: 'Unmapped, no charge rate' }); return; } r.extras.push({ label: ar.resource, value: round2(r.hours * ar.rate), note: fmtH(r.hours) + 'h x ' + money(ar.rate) }); });
    } else if (l.t === 'dry') {
      const P = PLANT[l.plant]; r.hours = lineHours(l); r.label = l.plant + ' ' + P.name + ' dry';
      const row = rateRow(st, 'dry:' + P.res);
      if (row) charge(row, r.hours); else miss(l.plant + ' (dry hire)');
    } else if (l.t === 'float') {
      const P = PLANT[l.plant]; r.label = (l.dir === 'mob' ? 'Mobilise ' : 'Demobilise ') + l.plant;
      const row = rateRow(st, 'float:' + l.dir + ':' + P.type);
      if (row) charge(row, 1); else miss(r.label + ' (float)');
    } else if (l.t === 'material' || l.t === 'sub') {
      r.label = l.item + (l.qty !== undefined ? ' ' + l.qty : ' cost ' + money(l.cost));
      const row = rateRow(st, (l.t === 'material' ? 'material:' : 'sub:') + l.item);
      // Decided 2026-11-20: a material or subcontract line recorded only as a $ amount is charged at cost.
      if (l.qty === undefined) { r.rateLine = { name: l.item + ' (charged at cost)', key: null }; r.rows.push({ tier: 'atcost', hours: 1, rate: round2(l.cost || 0), value: round2(l.cost || 0) }); }
      else if (row) charge(row, l.qty); else miss(l.item);
    }
    (l.allow || []).forEach(a => r.extras.push({ label: allowName(a.type), value: 0, note: 'allowances are not charged in this release' }));
    r.value = round2(r.rows.reduce((a, x) => a + x.value, 0) + r.extras.reduce((a, x) => a + x.value, 0));
    r.unmapped.forEach(u => unmapped.push(u));
    out.lines.push(r);
  });
  unmapped.forEach(u => out.problems.unshift('Unmapped: ' + u));
  out.total = round2(out.lines.reduce((a, x) => a + x.value, 0));
  return out;
}
function docketSummary(d) {
  return d.lines.map(l => {
    if (l.t === 'labour') return PEOPLE[l.person].name + ' ' + fmtH(lineHours(l)) + 'h';
    if (l.t === 'wet') return l.plant + ' wet + ' + PEOPLE[l.person].name.split(' ')[0] + ' ' + fmtH(lineHours(l)) + 'h' + (l.att && l.att.length ? ' + ' + l.att.join(', ') : '');
    if (l.t === 'dry') return l.plant + ' dry ' + fmtH(lineHours(l)) + 'h';
    if (l.t === 'float') return (l.dir === 'mob' ? 'mobilise ' : 'demobilise ') + l.plant;
    if (l.t === 'material') return l.item + (l.qty !== undefined ? ' ' + l.qty + 't' : '');
    return l.item;
  }).join(' · ') + (d.lines.some(l => (l.allow || []).length) ? ' · ' + d.lines.flatMap(l => (l.allow || []).map(a => allowName(a.type))).join(', ') : '');
}


/* ───────── Statuses (Varicon's own, checked in the app 2026-11-17) ─────────
   Docket: Draft, Ready for Review, Submitted, Approved, Costed, Invoiced, Rejected, plus Not claimable (VAR-23062).
   Variation: Pending, Approved, Partial Approved, Non-Claimable, Rejected. Unsubmitted and submitted are both Pending.
   Claim: Draft, Submitted, Approved. "Issued" in the tickets means Approved. */
const SIGNED = ['Approved', 'Costed', 'Invoiced'];               // signed by the client
const NOT_YET = ['Ready for Review', 'Submitted'];                // offered, highlighted "not yet approved"
const VAR_LOCKED = ['Approved', 'Partial Approved'];
const CLAIM_LIVE = ['Draft', 'Submitted'];
// Smaller releases: the picker offers Approved and Costed dockets only.
const PICKABLE = ['Approved', 'Costed'];

/* ───────── Where a docket lives ───────── */
function docketHome(st, id) {
  for (const v of st.variations) if (ACTIVE_VAR.includes(v.status)) { const ln = v.lines.find(l => l.docket === id); if (ln) return { kind: 'variation', rec: v, line: ln, label: 'variation ' + v.id }; }
  for (const c of st.claims) if (ACTIVE_CLAIM.includes(c.status)) { const ln = c.lines.find(l => l.docket === id); if (ln) return { kind: 'claim', rec: c, line: ln, label: 'claim ' + c.id }; }
  return null;
}
function claimLineLocked(c, ln) { return c.status === 'Approved' || ln.frozen !== null; }
function isLocked(st, id) { const h = docketHome(st, id); return !!h && (true || (h.kind === 'variation' && VAR_LOCKED.includes(h.rec.status)) || (h.kind === 'claim' && claimLineLocked(h.rec, h.line))); }
function docketValue(st, id) { const h = docketHome(st, id); if (h && h.line.frozen !== null && h.line.frozen !== undefined) return h.line.frozen; if (h && h.kind === 'variation') return varLineValue(st, h.rec, h.line); if (h) return h.line.snap; return priceDocket(st, getDocket(st, id)).total; }
function refuseIfLocked(st, d) { if (isLocked(st, d.id)) { const h = docketHome(st, d.id); if (h.kind === 'claim') throw new Error(d.id + ' is read-only: it is on ' + h.rec.status.toLowerCase() + ' claim ' + h.rec.id + (h.line.frozen === null ? '; remove its line to free it' : '')); throw new Error(d.id + ' is read-only: it is on ' + h.rec.status.toLowerCase() + ' variation ' + h.rec.id + (h.rec.status === 'Pending' ? '; remove its line to free it' : '')); } }
function docketIssue(st, d) { if (d.status === 'Rejected') return 'Rejected by client'; const p = priceDocket(st, d); return p.problems.length ? p.problems.join(' · ') : null; }
function recordIssues(st, rec) { return rec.lines.filter(ln => !(rec.kind === 'claim' && ln.frozen !== null)).map(ln => ({ docket: ln.docket, issue: docketIssue(st, getDocket(st, ln.docket)) })).filter(x => x.issue); }
function refuseIfIssues(st, rec, verb) {
  const iss = recordIssues(st, rec); if (!iss.length) return;
  throw new Error(recLabel(rec) + ' cannot be ' + verb + ' until ' + iss.map(x => x.docket).join(', ') + (iss.length === 1 ? ' is' : ' are') + ' fixed or removed (' + iss.map(x => x.docket + ': ' + x.issue).join('; ') + ')');
}
function recLabel(rec) { return rec.kind === 'claim' ? 'Claim ' + rec.id : rec.id; }

/* ───────── Record history ───────── */
function newLine(st, id) { const d = getDocket(st, id); const val = priceDocket(st, d).total; return { docket: id, added: val, last: val, snap: val, costSnap: docketCost(st, d), apQty: null, apRate: null, apFrozen: null, costFrozen: null, lastStatus: d.status, lastIssue: docketIssue(st, d), frozen: null }; }
function hist(rec, st, what, extra) { rec.history.push(Object.assign({ at: st.today, by: st.user, what }, extra || {})); }
function sync(st, cause) {
  const recs = [...st.variations.filter(v => v.status === 'Pending'), ...st.claims.filter(c => CLAIM_LIVE.includes(c.status))];
  recs.forEach(r => {
    r.lines.forEach(ln => {
      if (ln.frozen !== null) return;
      const d = getDocket(st, ln.docket);
      const val = priceDocket(st, d).total;
      if (RELEASE !== 'lean' && Math.abs(val - ln.last) > 0.004) { hist(r, st, ln.docket + ' line ' + money(ln.last) + ' to ' + money(val) + (cause ? ' (' + cause + ')' : ''), { docket: ln.docket, old: ln.last, new: val }); ln.last = val; }
      if (d.status !== ln.lastStatus) { hist(r, st, ln.docket + ' status ' + ln.lastStatus + ' to ' + d.status, { docket: ln.docket }); ln.lastStatus = d.status; }
      const iss = docketIssue(st, d);
      if (iss !== ln.lastIssue) { hist(r, st, iss ? ln.docket + ' flagged: ' + iss : ln.docket + ' fixed, flag cleared', { docket: ln.docket }); ln.lastIssue = iss; }
    });
  });
}

/* ───────── Pickers (decided 2026-11-17: any docket except Draft and Rejected) ───────── */
function pickerRows(st, mode, period) {
  return st.dockets
    .filter(d => d.status !== 'Not claimable' && !docketHome(st, d.id) && PICKABLE.includes(d.status))
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))
    .map(d => {
      const p = priceDocket(st, d);
      let block = null;
      if (d.status === 'Rejected') block = 'Rejected';
      else if (d.status === 'Draft') block = d.sentBack ? 'Draft (sent back)' : 'Draft';
      else if (p.problems.length) block = p.problems.join(' · ');
      const highlight = block ? 'block' : NOT_YET.includes(d.status) ? 'warn' : null;
      const inPeriod = !!period && d.date >= period.from && d.date <= period.to;
      return { d, value: p.total, block, highlight, tickable: !block, inPeriod, preTick: mode === 'claim' && inPeriod && !block, older: !!period && d.date < period.from, later: !!period && d.date > period.to };
    });
}
function validateAdd(st, ids) {
  if (!ids.length) throw new Error('Tick at least one docket');
  ids.forEach(id => {
    const d = getDocket(st, id);
    if (d.status === 'Not claimable') throw new Error(id + ' is Not claimable');
    const h = docketHome(st, id); if (h) throw new Error(id + ' is already on ' + h.label);
    if (!PICKABLE.includes(d.status)) throw new Error(id + ' is ' + d.status + ': only Approved or Costed dockets can be added');
    if (d.status === 'Rejected') throw new Error(id + ' is Rejected and cannot be added');
    if (d.status === 'Draft') throw new Error(id + ' is Draft and cannot be added');
    const p = priceDocket(st, d); if (p.problems.length) throw new Error(id + ' cannot be added: ' + p.problems.join(', '));
  });
}

/* ───────── Variations (VAR-23036) on the Variation Register ─────────
   Decided 2026-11-18 (live app checked): From dockets opens Varicon's Add Variation form. Save creates a Pending
   variation; there is no submit or approve of ours. Status is the Variation Register dropdown, as today. Each docket is
   one subtask: one CONTRACT line (Unit "docket", Submitted Qty 1 at the calculator value, Approved Qty 1 at the same
   rate, editable) and one COST resource per labour, plant, material and subcontract line. */
const VAR_STATUSES = ['Pending', 'Approved', 'Partial Approved', 'Non-Claimable', 'Rejected'];
const SHORTFALL = [];
const ACCOUNT_CODES = { 'Labour': '5100 Labour', 'Plant and Equipment': '5200 Plant hire', 'Material': '5300 Materials', 'Subcontractor': '5400 Subcontract' };
function nextVarId(st) { const n = st.variations.reduce((m, x) => Math.max(m, parseInt(x.id.replace(/\D/g, ''), 10) || 0), 0) + 1; return 'V' + String(n).padStart(3, '0'); }
function getVarOrNull(st, id) { return st.variations.find(x => x.id === id) || null; }
function createVariation(st, ids, opts = {}) {
  validateAdd(st, ids);
  const v = { kind: 'variation', id: opts.id || nextVarId(st), title: opts.title || 'Dayworks ' + fmtDate(st.today), status: 'Pending', created: st.today, lines: [], approvedAmount: null, adjustment: null, revisionText: opts.revision || '', type: opts.type || 'Variation', wbs: opts.wbs || null, decisions: [], history: [], costCentre: opts.costCentre || 'Dayworks', unsaved: !!opts.unsaved };
  if (!v.wbs) v.wbs = v.id;
  st.variations.push(v);
  ids.forEach(id => v.lines.push(newLine(st, id)));
  hist(v, st, 'Created from ' + ids.map(id => id + ' at ' + money(v.lines.find(l => l.docket === id).added)).join(', '));
  log(st, v.id + ' ' + (v.unsaved ? 'started' : 'saved') + ' from ' + ids.join(', '));
  return v;
}
// Save Variation / Update Variation: just saves, as today.
function saveVariation(st, varId, fields = {}) {
  const v = getVar(st, varId);
  ['title', 'revisionText', 'type', 'wbs', 'costCentre'].forEach(k => { if (fields[k] !== undefined) v[k] = fields[k]; });
  if (!v.title.trim()) throw new Error('Enter a task name');
  const first = v.unsaved; v.unsaved = false;
  hist(v, st, first ? 'Saved as Pending' : 'Updated');
  log(st, v.id + (first ? ' saved as Pending' : ' updated'));
}
function deleteVariation(st, varId) {
  const v = getVar(st, varId);
  // Decided 2026-11-18: Delete Variation works as today on any status and frees its dockets. A variation already
  // carried on a claim cannot be deleted without breaking that claim, so that one case is refused.
  const cl = varOnClaim(st, varId); if (cl) throw new Error(v.id + ' is on claim ' + cl.id + ' and cannot be deleted');
  st.variations = st.variations.filter(x => x !== v);
  log(st, v.id + ' deleted; ' + (v.lines.map(l => l.docket).join(', ') || 'no dockets') + ' freed');
}
function addToVariation(st, varId, ids) {
  const v = getVar(st, varId);
  if (v.status !== 'Pending') throw new Error(v.id + ' is ' + v.status + ' and cannot take more dockets');
  validateAdd(st, ids);
  ids.forEach(id => v.lines.push(newLine(st, id)));
  hist(v, st, 'Added ' + ids.map(id => id + ' at ' + money(v.lines.find(l => l.docket === id).added)).join(', '));
  log(st, ids.join(', ') + ' added to ' + v.id);
  return v;
}
function removeFromVariation(st, varId, id) {
  const v = getVar(st, varId);
  const ln = v.lines.find(l => l.docket === id); if (!ln) throw new Error(id + ' is not on ' + v.id);
  if (v.status !== 'Pending') throw new Error('Dockets cannot be removed from a ' + v.status.toLowerCase() + ' variation');
  const was = varLineValue(st, v, ln);
  v.lines = v.lines.filter(l => l.docket !== id);
  hist(v, st, 'Removed ' + id + ' (' + money(was) + '), docket freed', { docket: id, old: was, new: 0 });
  log(st, id + ' removed from ' + v.id + ' and freed');
  sync(st, id + ' removed');
}
// COST resources for one docket: what the work cost us (as in Daily Cost Tracking), never the charge.
function costLines(st, d) {
  const C = st.project.cost; const out = [];
  const add = (resource, type, unit, unitCost, qty, duration) => out.push({ resource, type, code: ACCOUNT_CODES[type], unit, unitCost, qty, duration, total: round2(unitCost * qty * (duration || 1)) });
  d.lines.forEach(l => {
    if (l.t === 'labour') { const p = PEOPLE[l.person]; add(p.name + ' (' + p.role + ')', 'Labour', 'Hour', C.labour[p.role] || 0, 1, lineHours(l)); }
    else if (l.t === 'wet') { const P = PLANT[l.plant], h = lineHours(l), p = PEOPLE[l.person]; add('(' + l.plant + ') ' + P.res, 'Plant and Equipment', 'Hour', C.plant[P.res] || 0, 1, h); add(p.name + ' (' + p.role + ', operator)', 'Labour', 'Hour', C.labour[p.role] || 0, 1, h); (l.att || []).forEach(a => add(a + ' (attachment)', 'Plant and Equipment', 'Hour', C.attach[a] || 0, 1, h)); }
    else if (l.t === 'dry') { const P = PLANT[l.plant]; add('(' + l.plant + ') ' + P.res + ', dry hire', 'Plant and Equipment', 'Hour', C.plant[P.res] || 0, 1, lineHours(l)); }
    else if (l.t === 'float') add('Float, ' + (l.dir === 'mob' ? 'mobilise ' : 'demobilise ') + l.plant, 'Plant and Equipment', 'Each', C.float, 1, null);
    else if (l.t === 'material') { if (l.qty !== undefined) add(l.item, 'Material', 'Tonne', C.material[l.item] || 0, l.qty, null); else add(l.item + ' (at cost)', 'Material', 'Each', l.cost || 0, 1, null); }
    else if (l.t === 'sub') { if (l.qty !== undefined) add(l.item, 'Subcontractor', 'Hour', C.sub[l.item] || 0, 1, l.qty); else add(l.item, 'Subcontractor', 'Each', l.cost || 0, 1, null); }
  });
  return out;
}
function docketCost(st, d) { return round2(costLines(st, d).reduce((a, x) => a + x.total, 0)); }
// Line values. Lean: snapshot when added (Refresh reprices). Middle: live until Approved or Partial Approved. Locked: frozen.
function varLineValue(st, v, ln) { if (ln.frozen !== null && ln.frozen !== undefined) return ln.frozen; if (v.status === 'Pending') return RELEASE === 'lean' ? ln.snap : priceDocket(st, getDocket(st, ln.docket)).total; return ln.releasedAt ?? ln.snap; }
function varLineCost(st, v, ln) { if (ln.costFrozen !== null && ln.costFrozen !== undefined) return ln.costFrozen; if (v.status === 'Pending' && RELEASE !== 'lean') return docketCost(st, getDocket(st, ln.docket)); return ln.costSnap; }
function lineApQty(ln) { return ln.apQty ?? 1; }
function lineApRate(st, v, ln) { if (ln.apFrozen !== null && ln.apFrozen !== undefined) return ln.apFrozen; return ln.apRate ?? varLineValue(st, v, ln); }
function lineApAmount(st, v, ln) { return round2(lineApQty(ln) * lineApRate(st, v, ln)); }
function varLineChanged(st, v, ln) { return RELEASE !== 'lean' && v.status === 'Pending' && Math.abs(varLineValue(st, v, ln) - ln.added) > 0.004; }
function varTotal(st, v) { if (v.manual) return v.manual.submitted; return round2(v.lines.reduce((a, ln) => a + (varLineValue(st, v, ln) || 0), 0)); }
function varSubmittedAmount(st, v) { return varTotal(st, v); }
function varApprovedAmount(st, v) { if (v.manual) return v.approvedAmount || 0; if (VAR_LOCKED.includes(v.status)) return v.approvedAmount; if (v.status !== 'Pending') return 0; return round2(v.lines.reduce((a, ln) => a + lineApAmount(st, v, ln), 0)); }
function varEstimatedCost(st, v) { if (v.manual) return v.manual.estimated; return round2(v.lines.reduce((a, ln) => a + (varLineCost(st, v, ln) || 0), 0)); }
// Margin = (charge - cost) / charge, charge = Approved Amount, or Submitted Amount while nothing is approved.
function varMargin(st, v) { const ap = varApprovedAmount(st, v); const charge = ap || varSubmittedAmount(st, v); const cost = varEstimatedCost(st, v); return { amount: round2(charge - cost), pct: charge ? round2((charge - cost) / charge * 100) : 0 }; }
function varSubmittedChanged() { return false; }
function varNeedsRevision() { return false; }
function unapprovedCount(st, ids) { return ids.filter(id => !SIGNED.includes(getDocket(st, id).status)).length; }
function plural(n, w) { return n + ' ' + w + (n === 1 ? '' : 's'); }
// CONTRACT tab: Approved Qty and Rate are editable while Pending, as today.
function setApproved(st, varId, docketId, qty, rate) {
  const v = getVar(st, varId); if (v.status !== 'Pending') throw new Error(v.id + ' is ' + v.status + ': its contract lines are locked');
  const ln = v.lines.find(l => l.docket === docketId); if (!ln) throw new Error(docketId + ' is not on ' + v.id);
  if (!(qty >= 0) || !(rate >= 0)) throw new Error('Enter a quantity and rate of 0 or more');
  const was = lineApAmount(st, v, ln);
  ln.apQty = qty; ln.apRate = Math.abs(rate - varLineValue(st, v, ln)) < 0.004 ? null : round2(rate);
  hist(v, st, docketId + ' approved line ' + money(was) + ' to ' + money(lineApAmount(st, v, ln)) + ' (qty ' + qty + ' x ' + money(rate) + ')', { docket: docketId, old: was, new: lineApAmount(st, v, ln) });
}
// Lean: Refresh from dockets, any time while Pending. Reprices the Submitted and Approved rates on every docket line and
// the COST lines, and writes old -> new to the history. No automatic revisions: Revision is the user's own text.
function refreshFromDockets(st, varId) {
  if (RELEASE !== 'lean') throw new Error('Refresh is only in the lean release');
  const v = getVar(st, varId);
  if (v.status !== 'Pending') throw new Error('Only a Pending variation can be refreshed');
  let n = 0;
  v.lines.forEach(ln => {
    const d = getDocket(st, ln.docket); const now = priceDocket(st, d).total; const cost = docketCost(st, d);
    if (Math.abs(now - ln.snap) > 0.004 || (ln.apRate !== null && ln.apRate !== undefined && Math.abs(ln.apRate - now) > 0.004)) {
      hist(v, st, ln.docket + ' refreshed: submitted rate ' + money(ln.snap) + ' to ' + money(now) + ', approved rate ' + money(lineApRate(st, v, ln)) + ' to ' + money(now), { docket: ln.docket, old: ln.snap, new: now });
      ln.snap = now; ln.apRate = null; n++;
    }
    if (Math.abs(cost - ln.costSnap) > 0.004) { hist(v, st, ln.docket + ' cost refreshed ' + money(ln.costSnap) + ' to ' + money(cost), { docket: ln.docket, old: ln.costSnap, new: cost }); ln.costSnap = cost; }
  });
  if (!n) hist(v, st, 'Refreshed from dockets: no line changed');
  log(st, v.id + ' refreshed from dockets: ' + plural(n, 'line') + ' repriced');
  return n;
}
function varOnClaim(st, varId) { return st.claims.find(c => c.status !== 'Deleted' && ((c.vars || []).some(x => x.variation === varId) || (c.status === 'Approved' && (c.varLines || []).some(x => x.variation === varId)))) || null; }
// Status dropdown on the Variation Register row, as today.
function setVarStatus(st, varId, status) {
  const v = getVar(st, varId);
  if (!VAR_STATUSES.includes(status)) throw new Error('Unknown status ' + status);
  if (v.status === status) return;
  const from = v.status;
  if (v.manual) { v.status = status; hist(v, st, 'Status ' + from + ' to ' + status); log(st, v.id + ' status ' + from + ' to ' + status); return; }
  if (['Non-Claimable', 'Rejected'].includes(from)) throw new Error(v.id + ' is ' + from + ' and its dockets were freed; start a new variation from dockets');
  const cl = varOnClaim(st, varId);
  if (VAR_LOCKED.includes(from) && !VAR_LOCKED.includes(status) && cl) throw new Error(v.id + ' is on claim ' + cl.id + ' and stays ' + from);
  if (VAR_LOCKED.includes(status) && from === 'Pending') {
    refuseIfIssues(st, v, 'approved');
    v.lines.forEach(ln => { ln.frozen = varLineValue(st, v, ln); ln.apFrozen = ln.apRate ?? ln.frozen; ln.costFrozen = varLineCost(st, v, ln); ln.frozenVersion = versionFor(st, getDocket(st, ln.docket).date).n; });
    v.approvedAmount = round2(v.lines.reduce((a, ln) => a + lineApQty(ln) * ln.apFrozen, 0));
    v.status = status; v.approvedOn = st.today;
    hist(v, st, 'Status Pending to ' + status + ' at ' + money(v.approvedAmount) + '; lines frozen, dockets stay locked');
  } else if (VAR_LOCKED.includes(status)) {
    v.status = status; hist(v, st, 'Status ' + from + ' to ' + status);
  } else if (status === 'Pending') {
    v.lines.forEach(ln => { ln.snap = ln.frozen; ln.costSnap = ln.costFrozen; ln.frozen = null; ln.apFrozen = null; ln.costFrozen = null; });
    v.status = 'Pending'; v.approvedAmount = null;
    hist(v, st, 'Status ' + from + ' to Pending; lines unfrozen');
  } else {
    v.lines.forEach(ln => ln.releasedAt = varLineValue(st, v, ln));
    v.status = status;
    hist(v, st, 'Status ' + from + ' to ' + status + '; kept on the register; ' + plural(v.lines.length, 'docket') + ' freed (' + (v.lines.map(l => l.docket).join(', ') || 'none') + ')');
  }
  log(st, v.id + ' status ' + from + ' to ' + status);
}
function releaseVariation(st, varId, status) { setVarStatus(st, varId, status); }
function approvedVars(st) { return st.variations.filter(v => VAR_LOCKED.includes(v.status)); }
function contractSum(st) { return round2(st.project.contractSum + approvedVars(st).reduce((a, v) => a + v.approvedAmount, 0)); }

/* ───────── Claims (VAR-23037) on the Claim tab ───────── */
function nextClaimId(st) { return String(st.claims.reduce((m, c) => Math.max(m, parseInt(c.id, 10) || 0), 0) + 1); }
function approvedClaims(st) { return st.claims.filter(c => c.status === 'Approved').sort((a, b) => (a.issueSeq || 0) - (b.issueSeq || 0)); }
function varClaimedPct(st, varId) {
  const done = approvedClaims(st).filter(c => (c.varLines || []).some(l => l.variation === varId));
  if (!done.length) return 0;
  return done[done.length - 1].varLines.find(l => l.variation === varId).pct;
}
function varDraftClaim(st, varId) { return st.claims.find(c => CLAIM_LIVE.includes(c.status) && c.vars.some(x => x.variation === varId)) || null; }
function offeredVariations(st) { return approvedVars(st).filter(v => !varDraftClaim(st, v.id)); }
function varFullyClaimed(st, varId) { return varClaimedPct(st, varId) >= 100 - 1e-9; }
function defaultClaimVariations(st) { return offeredVariations(st).filter(v => !varFullyClaimed(st, v.id)); }
function refuseIfClaimClosed(c) { if (!CLAIM_LIVE.includes(c.status)) throw new Error('Claim ' + c.id + ' is approved and locked'); }
function addVarToClaim(st, claimId, varId, pct = 100) {
  const c = getClaim(st, claimId); const v = getVar(st, varId);
  refuseIfClaimClosed(c);
  if (!VAR_LOCKED.includes(v.status)) throw new Error(v.id + ' is not approved');
  const other = varDraftClaim(st, varId); if (other) throw new Error(v.id + ' is already on open claim ' + other.id);
  const prev = varClaimedPct(st, varId);
  c.vars.push({ variation: varId, pct: 100 });
  hist(c, st, v.id + ' added at 100% (' + money(round2(v.approvedAmount * (100 - prev) / 100)) + ')' + (prev >= 100 - 1e-9 ? '; fully claimed, lower the percent to credit it back' : ''));
  if (pct !== 100) setVarPct(st, claimId, varId, pct);
  log(st, v.id + ' added to claim ' + c.id);
}
function setVarPct(st, claimId, varId, pct) {
  const c = getClaim(st, claimId); refuseIfClaimClosed(c);
  const x = c.vars.find(l => l.variation === varId); if (!x) throw new Error(varId + ' is not on claim ' + c.id);
  const prev = varClaimedPct(st, varId);
  if (!(pct >= 0 && pct <= 100)) throw new Error('Enter a percent complete between 0% and 100% (' + prev + '% already claimed; a lower percent is charged as a credit)');
  if (pct === x.pct) return;
  const v = getVar(st, varId); const val = p => round2(v.approvedAmount * (p - prev) / 100);
  hist(c, st, varId + ' ' + x.pct + '% to ' + pct + '% (' + money(val(x.pct)) + ' to ' + money(val(pct)) + ')', { old: val(x.pct), new: val(pct) });
  x.pct = pct;
}
function removeVarFromClaim(st, claimId, varId) {
  const c = getClaim(st, claimId); refuseIfClaimClosed(c);
  c.vars = c.vars.filter(x => x.variation !== varId);
  hist(c, st, varId + ' removed; offered to other open claims');
}
function claimVarRows(st, c) {
  if (c.status === 'Approved') return c.varLines || [];
  if (!CLAIM_LIVE.includes(c.status)) return [];
  return c.vars.map(x => {
    const v = getVar(st, x.variation); const prev = varClaimedPct(st, v.id);
    const value = round2(v.approvedAmount * (x.pct - prev) / 100);
    return { variation: v.id, title: v.title, approved: v.approvedAmount, pct: x.pct, prev, value, credit: value < -0.004, dockets: v.lines.map(l => l.docket) };
  });
}
function createClaim(st, period, ids, opts = {}) {
  if (ids.length) validateAdd(st, ids);
  const vars = opts.vars === undefined ? defaultClaimVariations(st).map(v => v.id) : opts.vars;
  const c = { kind: 'claim', id: opts.id ? String(opts.id) : nextClaimId(st), period, status: 'Draft', created: st.today, submittedOn: null, lines: [], boq: {}, vars: [], varLines: null, decisions: [], history: [], invoiceRef: '' };
  st.claims.push(c);
  ids.forEach(id => c.lines.push(newLine(st, id)));
  hist(c, st, 'Created for ' + fmtDate(period.from) + ' to ' + fmtDate(period.to) + (ids.length ? ' with ' + ids.map(id => id + ' at ' + money(c.lines.find(l => l.docket === id).added)).join(', ') : ''));
  vars.forEach(id => addVarToClaim(st, c.id, id, 100));
  log(st, 'Claim ' + c.id + ' created for ' + fmtDate(period.from) + ' to ' + fmtDate(period.to) + ' with ' + (ids.join(', ') || 'no dockets') + (vars.length ? ' and ' + vars.join(', ') + ' at 100%' : ''));
  return c;
}
function claimAddDockets(st, claimId, ids) {
  const c = getClaim(st, claimId); refuseIfClaimClosed(c);
  validateAdd(st, ids);
  ids.forEach(id => c.lines.push(newLine(st, id)));
  const sub = false;
  hist(c, st, 'Added ' + ids.map(id => id + ' at ' + money(c.lines.find(l => l.docket === id).added)).join(', ') + (sub ? '; changed since submitted' : ''));
  log(st, ids.join(', ') + ' added to claim ' + c.id + (sub ? ' (submitted, flagged)' : ''));
}
function claimRemoveDocket(st, claimId, id) {
  const c = getClaim(st, claimId); refuseIfClaimClosed(c);
  const ln = c.lines.find(l => l.docket === id); if (!ln) throw new Error(id + ' is not on claim ' + c.id);
  if (ln.frozen !== null) throw new Error(id + ' was approved on this claim and stays locked');
  c.lines = c.lines.filter(l => l.docket !== id);
  const sub = false;
  hist(c, st, 'Removed ' + id + ' (' + money(ln.last) + '), released' + (sub ? '; changed since submitted' : ''), { docket: id, old: ln.last, new: 0 });
  log(st, id + ' removed from claim ' + c.id + ' and released');
}
// Decided 2026-11-20: deleting a claim frees its dockets; docket statuses are unchanged.
function deleteDraftClaim(st, claimId) {
  const c = getClaim(st, claimId);
  if (c.status !== 'Draft') throw new Error('Only a draft claim can be deleted');
  c.status = 'Deleted';
  log(st, 'Claim ' + c.id + ' deleted; ' + (c.lines.map(l => l.docket).join(', ') || 'no dockets') + ' released' + (c.vars.length ? '; ' + c.vars.map(x => x.variation).join(', ') + ' offered again' : ''));
}
function claimLineValue(st, c, ln) { return ln.frozen !== null ? ln.frozen : ln.snap; }
// Refresh from dockets on a Draft claim: reprices every docket line from the rates table and logs old -> new.
function claimRefreshFromDockets(st, claimId) {
  const c = getClaim(st, claimId);
  // Decided 2026-11-20: the Dayworks tab stays editable (add, remove, refresh) until the claim is Approved.
  if (!CLAIM_LIVE.includes(c.status)) throw new Error('Only a Draft or Submitted claim can be refreshed');
  let n = 0;
  c.lines.forEach(ln => { if (ln.frozen !== null) return; const now = priceDocket(st, getDocket(st, ln.docket)).total; if (Math.abs(now - ln.snap) > 0.004) { hist(c, st, ln.docket + ' refreshed ' + money(ln.snap) + ' to ' + money(now), { docket: ln.docket, old: ln.snap, new: now }); ln.snap = now; n++; } });
  if (!n) hist(c, st, 'Refreshed from dockets: no line changed');
  log(st, 'Claim ' + c.id + ' refreshed from dockets: ' + plural(n, 'line') + ' repriced');
  return n;
}
function claimLineChanged(st, c, ln) { return false && ln.frozen === null && Math.abs(claimLineValue(st, c, ln) - ln.added) > 0.004; }
function boqPrevQty(st, c, code) { return round2(approvedClaims(st).filter(x => x !== c && (x.issueSeq || 0) < (c.issueSeq || Infinity)).reduce((a, x) => a + (x.boq[code] || 0), 0)); }
// Retention and GST: same order and rules as existing claims, per project settings (decided 2026-11-17: use what
// already exists in Varicon). A negative claim can be approved; its retention and GST go negative.
function claimTotals(st, c) {
  const dockets = round2(c.lines.reduce((a, ln) => a + (claimLineValue(st, c, ln) || 0), 0));
  const vars = round2(claimVarRows(st, c).reduce((a, l) => a + l.value, 0));
  const boq = round2(st.project.boq.reduce((a, b) => a + (c.boq[b.code] || 0) * b.rate, 0));
  const gross = round2(dockets + vars + boq);
  const retention = round2(gross * st.project.retention / 100);
  const net = round2(gross - retention);
  const gst = round2(net * st.project.gst / 100);
  return { dockets, vars, boq, gross, retention, net, gst, total: round2(net + gst), negative: gross < -0.004 };
}
function claimAccountingLabel(st, c) { return c.status === 'Approved' && c.sentAs === 'credit note' ? 'Sent to accounting as a credit note' : null; }
function submitClaim(st, claimId) {
  const c = getClaim(st, claimId);
  if (c.status !== 'Draft') throw new Error('Only a draft claim can be submitted');
  c.status = 'Submitted'; c.submittedOn = st.today;
  hist(c, st, 'Submitted to the client');
  log(st, 'Claim ' + c.id + ' submitted');
}
// Approve = "issue" in the tickets. Lines freeze, dockets lock and the claim's docket lines move to Invoiced
// (decided 2026-11-17). A variation's dockets move to Invoiced once the variation reaches 100% claimed on approved claims.
function approveClaim(st, claimId, opts = {}) {
  const c = getClaim(st, claimId);
  if (!CLAIM_LIVE.includes(c.status)) throw new Error('Claim ' + c.id + ' is already approved');
  refuseIfIssues(st, c, 'approved');
  const n = unapprovedCount(st, c.lines.filter(l => l.frozen === null).map(l => l.docket));
  if (n && !opts.confirm) return { needsConfirm: true, count: n, message: plural(n, 'docket') + ' not yet approved' };
  c.varLines = claimVarRows(st, c);
  const newly = c.lines.filter(ln => ln.frozen === null);
  newly.forEach(ln => { ln.frozen = ln.snap; ln.frozenVersion = versionFor(st, getDocket(st, ln.docket).date).n; });
  if (claimTotals(st, c).negative) c.sentAs = 'credit note';
  if (!c.submittedOn) c.submittedOn = st.today;
  c.status = 'Approved'; c.issued = st.today; c.changedSinceSubmitted = false; st.issueSeq = (st.issueSeq || 0) + 1; c.issueSeq = st.issueSeq;
  if (n) c.decisions.push({ at: st.today, by: st.user, what: 'Approved with ' + plural(n, 'unapproved docket') });
  const inv = [];
  // Smaller releases: no auto-Invoiced. Dockets keep their status; users mark them Invoiced by hand.
  hist(c, st, 'Approved at ' + money(claimTotals(st, c).gross) + ' ex GST' + (claimTotals(st, c).negative ? ' (negative claim, sent to accounting as a credit note)' : '') + '; lines frozen, dockets locked' + (inv.length ? ', ' + inv.join(', ') + ' moved to Invoiced' : ''));
  log(st, 'Claim ' + c.id + ' approved at ' + money(claimTotals(st, c).gross) + ' ex GST' + (n ? ' (' + plural(n, 'unapproved docket') + ', confirmed)' : '') + (inv.length ? '; ' + inv.join(', ') + ' Invoiced' : ''));
  return { ok: true, invoiced: inv };
}
const issueClaim = approveClaim;
function toInvoiced(st, id, why, out) {
  const d = getDocket(st, id); if (d.status === 'Invoiced') return;
  d.prevBilled = d.status; d.status = 'Invoiced';
  d.history.push({ at: st.today, by: 'Varicon', what: 'Moved to Invoiced (' + why + ')' });
  out.push(id);
}
// Reopen Claim (existing): decided 2026-11-17 that its dockets stay locked and Invoiced at their frozen values.
// Decided 2026-11-20: Reopen Claim leaves its Dayworks lines frozen at their approved values (dockets stay locked).
function reopenClaim(st, claimId) {
  const c = getClaim(st, claimId);
  if (c.status !== 'Approved') throw new Error('Only an approved claim can be reopened');
  c.status = 'Draft'; c.reopenedOn = st.today;
  hist(c, st, 'Reopened; Dayworks lines stay frozen at their approved values');
  log(st, 'Claim ' + c.id + ' reopened; Dayworks lines stay frozen');
}
function lastIssuedClaimDate(st) { return approvedClaims(st).map(c => c.issued).filter(Boolean).sort().pop() || null; }
function lastApprovedVarDate(st) { return approvedVars(st).map(v => v.approvedOn).filter(Boolean).sort().pop() || null; }
function calcFloor(st) { return [lastIssuedClaimDate(st), lastApprovedVarDate(st)].filter(Boolean).sort().pop() || null; }
function nextClaimPeriod(st) {
  const last = st.claims.filter(c => c.status !== 'Deleted').map(c => c.period.to).sort().pop();
  const from = last ? addDays(last, 1) : '2026-11-01';
  const [y, m, d] = from.split('-').map(Number);
  const mm = String(m).padStart(2, '0');
  const to = d <= 15 ? `${y}-${mm}-15` : `${y}-${mm}-${new Date(y, m, 0).getDate()}`;
  return { from, to };
}
function addDays(date, n) { const d = new Date(date + 'T00:00:00'); d.setDate(d.getDate() + n); const z = x => String(x).padStart(2, '0'); return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()); }

/* ───────── Docket actions ───────── */
function refuseIfOnRecord(st, d) { const h = docketHome(st, d.id); if (h) throw new Error('Remove this docket from ' + h.label + ' first'); }
// Any edit to a signed (Approved, Costed) docket returns it to Submitted for re-approval. In Varicon a signed docket is
// locked until Reopen; Reopen here is the same step.
function afterEdit(st, d, what) {
  d.history.push({ at: st.today, by: st.user, what });
  const h = docketHome(st, d.id);
  if (['Approved', 'Costed'].includes(d.status)) {
    const was = d.status;
    d.status = 'Submitted'; d.reapprove = { at: st.today, on: h ? h.rec.id : null, was };
    d.history.push({ at: st.today, by: st.user, what: 'Edited while ' + was + (h ? ' on ' + h.label : '') + ': returned to Submitted for re-approval' });
    log(st, d.id + ' edited while ' + was + (h ? ' on ' + h.label : '') + ': returned to Submitted');
  }
  sync(st, d.id + ' edited');
}
function reopenSigned(st, id) {
  const d = getDocket(st, id); refuseIfLocked(st, d);
  if (!['Approved', 'Costed'].includes(d.status)) throw new Error('Only an Approved or Costed docket can be reopened here');
  afterEdit(st, d, 'Reopened: signature cleared, fields unlocked');
}
function markCosted(st, id) {
  const d = getDocket(st, id);
  if (d.status !== 'Approved') throw new Error('Only an Approved docket can be marked as costed');
  d.status = 'Costed'; d.history.push({ at: st.today, by: st.user, what: 'Marked as costed' });
  log(st, id + ' marked as costed'); sync(st, id + ' costed');
}
function markInvoiced(st, id) {
  const d = getDocket(st, id);
  if (!['Approved', 'Costed'].includes(d.status)) throw new Error('Only an Approved or Costed docket can be marked as invoiced');
  d.prevBilled = d.status; d.status = 'Invoiced'; d.history.push({ at: st.today, by: st.user, what: 'Marked as invoiced (manually)' });
  log(st, id + ' marked as invoiced'); sync(st, id + ' invoiced');
}
function markNotClaimable(st, id, note) {
  const d = getDocket(st, id);
  if (!['Draft', 'Ready for Review', 'Submitted', 'Approved', 'Costed'].includes(d.status)) throw new Error('Only a Draft, Ready for Review, Submitted, Approved or Costed docket can be marked Not claimable');
  refuseIfOnRecord(st, d);
  d.prevStatus = d.status; d.status = 'Not claimable'; d.nc = { note: note || '', by: st.user, at: st.today };
  d.history.push({ at: st.today, by: st.user, what: 'Marked Not claimable' + (note ? ': ' + note : '') });
  log(st, id + ' marked Not claimable');
}
function reopenDocket(st, id) {
  const d = getDocket(st, id);
  if (d.status !== 'Not claimable') throw new Error(id + ' is not Not claimable');
  d.status = d.prevStatus; d.prevStatus = null; d.nc = null;
  d.history.push({ at: st.today, by: st.user, what: 'Reopened, back to ' + d.status });
  log(st, id + ' reopened to ' + d.status);
}
function sendBack(st, id, reason, note) {
  const d = getDocket(st, id);
  if (!['Submitted', 'Ready for Review'].includes(d.status)) throw new Error('Only a Ready for Review or Submitted docket can be sent back');
  if (reason === 'Other' && !(note || '').trim()) throw new Error('Add a note for Other');
  refuseIfOnRecord(st, d);
  d.status = 'Draft'; d.sentBack = { reason, note: note || '', by: st.user, at: st.today };
  d.history.push({ at: st.today, by: st.user, what: 'Sent back: ' + reason + (note ? ' (' + note + ')' : '') });
  log(st, id + ' sent back to ' + d.createdBy + ': ' + reason);
}
function readyForReview(st, id) {
  const d = getDocket(st, id); refuseIfLocked(st, d);
  if (!['Draft', 'Rejected'].includes(d.status)) throw new Error('Only a Draft or Rejected docket can be sent for review');
  d.status = 'Ready for Review'; d.history.push({ at: st.today, by: d.createdBy, what: 'Ready for review' + (d.sentBack ? ' after send-back' : '') });
  d.sentBack = null;
  log(st, id + ' ready for review'); sync(st, id + ' ready for review');
}
function submitDocket(st, id) {
  const d = getDocket(st, id); refuseIfLocked(st, d);
  if (!['Draft', 'Rejected', 'Ready for Review'].includes(d.status)) throw new Error('Only a Draft, Ready for Review or Rejected docket can be sent to the client');
  const was = d.status; d.status = 'Submitted';
  d.history.push({ at: st.today, by: d.createdBy, what: (d.sentBack ? 'Resubmitted after send-back' : was === 'Rejected' ? 'Fixed and resubmitted' : 'Sent to the client for signature') });
  d.sentBack = null;
  log(st, id + ' submitted');
  sync(st, id + ' ' + (was === 'Rejected' ? 'resubmitted' : 'submitted'));
}
function approveDocket(st, id) {
  const d = getDocket(st, id);
  if (d.status !== 'Submitted') throw new Error('Only a Submitted docket can be approved');
  const p = priceDocket(st, d); if (p.problems.length) throw new Error(id + ' cannot be approved: ' + p.problems.join(', '));
  d.status = 'Approved'; d.approvedOn = st.today; d.reapprove = null; d.history.push({ at: st.today, by: 'Client (signed)', what: 'Approved' });
  log(st, id + ' approved');
  sync(st, id + ' approved');
}
function rejectDocket(st, id) {
  const d = getDocket(st, id); refuseIfLocked(st, d);
  if (d.status !== 'Submitted') throw new Error('Only a Submitted docket can be rejected');
  d.status = 'Rejected'; d.history.push({ at: st.today, by: 'Client (email)', what: 'Rejected by client' });
  const h = docketHome(st, id);
  log(st, id + ' rejected by the client' + (h ? '; stays on ' + h.label + ', flagged, blocking it' : ''));
  sync(st, id + ' rejected by client');
}
function editHours(st, id, idx, hours) {
  const d = getDocket(st, id); refuseIfLocked(st, d);
  const l = d.lines[idx]; if (!['labour', 'wet', 'dry'].includes(l.t)) throw new Error('Only timed lines have hours');
  if (!(hours > 0) || hours > 23) throw new Error('Enter hours between 0 and 23');
  const end = toMin(l.start) + Math.round((hours + (l.brk || 0)) * 60);
  if (end > 24 * 60) throw new Error('Lines cannot cross midnight: night shift is not in this release');
  const before = lineHours(l);
  l.end = fromMin(end);
  log(st, id + ' line ' + (idx + 1) + ' edited to ' + fmtH(hours) + 'h');
  afterEdit(st, d, 'Line ' + (idx + 1) + ' hours ' + fmtH(before) + 'h to ' + fmtH(hours) + 'h');
}
function editStart(st, id, idx, start) {
  const d = getDocket(st, id); refuseIfLocked(st, d);
  const l = d.lines[idx]; if (!['labour', 'wet', 'dry'].includes(l.t)) throw new Error('Only timed lines have a start time');
  if (!/^\d\d:\d\d$/.test(start)) throw new Error('Enter a start time as hh:mm');
  const len = toMin(l.end) - toMin(l.start);
  if (toMin(start) + len > 24 * 60) throw new Error('Lines cannot cross midnight: night shift is not in this release');
  const was = l.start; l.start = start; l.end = fromMin(toMin(start) + len);
  log(st, id + ' line ' + (idx + 1) + ' moved to start ' + start);
  afterEdit(st, d, 'Line ' + (idx + 1) + ' start ' + was + ' to ' + start);
}
function removeDocketLine(st, id, idx) {
  const d = getDocket(st, id); refuseIfLocked(st, d);
  const l = d.lines[idx];
  d.lines.splice(idx, 1);
  log(st, id + ' line ' + (idx + 1) + ' removed');
  afterEdit(st, d, 'Removed line ' + (idx + 1) + ' (' + l.t + ')');
}
function removeAllowance(st, id, idx, type) {
  const d = getDocket(st, id); refuseIfLocked(st, d);
  const l = d.lines[idx]; l.allow = (l.allow || []).filter(a => a.type !== type);
  log(st, id + ': ' + allowName(type) + ' removed');
  afterEdit(st, d, 'Removed ' + allowName(type));
}
function addAllowance(st, id, idx, type) {
  const d = getDocket(st, id); refuseIfLocked(st, d);
  const l = d.lines[idx]; if (!['labour', 'wet'].includes(l.t)) throw new Error('Allowances go on a labour or wet-hire line');
  if ((l.allow || []).some(a => a.type === type)) throw new Error(allowName(type) + ' is already on this line');
  (l.allow ||= []).push({ type });
  log(st, id + ': ' + allowName(type) + ' added');
  afterEdit(st, d, 'Added ' + allowName(type) + ' to line ' + (idx + 1));
}

/* ───────── Calculator versions (VAR-23035) ───────── */
const RATE_SECTIONS = { labour: 'Labour rates', wet: 'Wet hire', dry: 'Dry hire', attach: 'Attachments' };
function publishVersion(st, section, lineName, std, effectiveFrom) {
  const floor = calcFloor(st);
  if (floor && effectiveFrom < floor) throw new Error('Effective date cannot be before the last approved claim or approved variation (' + fmtDate(floor) + ')');
  const cur = st.versions.slice().sort((a, b) => b.n - a.n)[0];
  const v = clone(cur); v.n = cur.n + 1; v.effectiveFrom = effectiveFrom; v.savedOn = st.today; v.savedBy = st.user;
  const ln = v[section].find(x => x.name === lineName); if (!ln) throw new Error('No line ' + lineName);
  const was = ln.r.std;
  ln.r = section === 'dry' ? { std } : rates(std);
  v.note = lineName + ' Standard ' + money(was) + ' to ' + money(std) + (section === 'dry' ? '' : ' (tiers prefilled 1.5x, 2x, 2.5x)');
  st.versions.push(v);
  log(st, 'Calculator v' + v.n + ' published, effective ' + fmtDate(effectiveFrom) + ': ' + v.note);
  sync(st, 'calculator v' + v.n);
  return v;
}

/* ───────── Demo seed: one project end to end ───────── */
function manualVar(st, id, title, est, submitted, approved, status, subs) {
  st.variations.push({ kind: 'variation', id, title, status, manual: { estimated: est, submitted, subs: subs || [] }, lines: [], approvedAmount: approved, approvedOn: '2026-09-15', submittedOn: '2026-09-10', history: [], decisions: [], revision: 1 });
}
function manualClaim(st, id, period, boq, date, invoiceRef, vars) {
  st.issueSeq = (st.issueSeq || 0) + 1;
  st.claims.push({ kind: 'claim', id: String(id), period, status: 'Approved', created: date, submittedOn: date, issued: date, issueSeq: st.issueSeq, lines: [], boq, vars: [], varLines: vars || [], decisions: [], history: [{ at: date, by: 'Dana Whitfield (PM)', what: 'Approved (before dockets could be claimed)' }], invoiceRef });
}
function seedState() {
  const st = baseState();
  const at = (date, fn) => { const t = st.today; st.today = date; fn(); st.today = t; };
  // Existing variations, entered by hand before dockets could be used.
  manualVar(st, 'V001', 'Additional excavation outside initial scope', 2460, 3000, 3000, 'Approved', [{ id: 'V001.1', title: 'Area 1', est: 980, submitted: 1200 }, { id: 'V001.2', title: 'Area 2', est: 1480, submitted: 1800 }]);
  manualVar(st, 'V002', 'Site establishment fencing', 1500, 10000, 10000, 'Approved');
  manualVar(st, 'V003', 'Additional work, pavement repair', 9800, 0, null, 'Pending');
  // Claims 1 and 2: contract works only.
  manualClaim(st, 1, { from: '2026-09-01', to: '2026-09-30' }, { '1.1': 1200, '2.3': 300 }, '2026-10-02', 'INV-1041', [{ variation: 'V001', title: 'Additional excavation outside initial scope', approved: 3000, pct: 100, prev: 0, value: 3000, credit: false, dockets: [] }]);
  manualClaim(st, 2, { from: '2026-10-01', to: '2026-10-15' }, { '1.1': 900, '2.3': 250, '3.1': 1500 }, '2026-10-17', 'INV-1052', [{ variation: 'V002', title: 'Site establishment fencing', approved: 10000, pct: 50, prev: 0, value: 5000, credit: false, dockets: [] }]);
  // October dockets: claimed on claim 3, plus one that arrived after it was approved.
  addDocket(st, 'D091', '2026-10-20', 'Approved', [lab('tom', '07:00', '15:30', 0.5)], { desc: 'Kerb removal, Ch 80', ref: 'RR-0091' });
  addDocket(st, 'D092', '2026-10-22', 'Approved', [wet('EX-07', 'sam', '07:00', '15:00'), flt('EX-07', 'mob')], { desc: 'Excavate unsuitable material, Ch 95', ref: 'RR-0092' });
  addDocket(st, 'D095', '2026-10-25', 'Approved', [lab('jo', '07:00', '15:00')], { desc: 'Sunday clean up after storm', note: 'Sunday work, signed after V004 was saved' });
  // November
  addDocket(st, 'D201', '2026-11-02', 'Approved', [lab('tom', '07:00', '15:00')], { desc: 'Extra kerb removal, Ch 120' });
  addDocket(st, 'D210', '2026-11-02', 'Approved', [wet('EX-07', 'sam', '07:00', '16:00')], { desc: 'Rock breaking, Ch 340' });
  addDocket(st, 'D101', '2026-11-03', 'Approved', [lab('tom', '06:00', '17:00', 0.5)], { desc: 'Service location, Ch 150' });
  addDocket(st, 'D212', '2026-11-03', 'Approved', [mat('Road base', { qty: 12 }), lab('jo', '07:00', '15:00')], { desc: 'Detour road base' });
  addDocket(st, 'D202', '2026-11-04', 'Submitted', [lab('jo', '07:00', '15:00')], { desc: 'Hand dig, Ch 160' });
  addDocket(st, 'D213', '2026-11-04', 'Approved', [sub('Traffic control', null, 8)], { desc: 'Traffic control for detour, 8 crew hours' });
  addDocket(st, 'D103', '2026-11-05', 'Rejected', [lab('ben', '07:00', '15:00')], { desc: 'Water service relocation' });
  addDocket(st, 'D203', '2026-11-05', 'Approved', [lab('cris', '07:00', '15:00')], { desc: 'Hand dig around Telstra pit' });
  addDocket(st, 'D214', '2026-11-05', 'Approved', [dry('EX-12', '07:00', '16:00')], { desc: 'Detour grading' });
  addDocket(st, 'D104', '2026-11-06', 'Draft', [dry('EX-07', '07:00', '12:00'), wet('EX-07', 'lee', '10:00', '15:00')], { desc: 'Trench backfill' });
  addDocket(st, 'D105', '2026-11-06', 'Submitted', [lab('jo', '07:00', '11:00')], { desc: 'Clean up after client crew' });
  addDocket(st, 'D102', '2026-11-09', 'Submitted', [wet('EX-07', 'sam', '07:00', '16:00')], { desc: 'Bulk excavation, Ch 300' });
  addDocket(st, 'D218', '2026-11-09', 'Costed', [lab('mel', '07:00', '15:00')], { desc: 'Pit adjustment, Ch 310' });
  addDocket(st, 'D209', '2026-11-10', 'Approved', [lab('tom', '06:00', '17:00', 0.5)], { desc: 'Rock breaking supervision' });
  addDocket(st, 'D204', '2026-11-10', 'Rejected', [lab('jo', '07:00', '13:00')], { desc: 'Remove spoil' });
  addDocket(st, 'D106', '2026-11-10', 'Approved', [lab('mel', '06:00', '17:00', 0.5)], { desc: 'Drainage pit, Ch 260' });
  addDocket(st, 'D219', '2026-11-10', 'Invoiced', [lab('cris', '07:00', '13:00')], { desc: 'Fence repair', note: 'Marked as invoiced by hand before claims could carry dockets' });
  addDocket(st, 'D205', '2026-11-11', 'Ready for Review', [wet('EX-15', 'lee', '07:00', '16:00', 0, ['Breaker 1t']), flt('EX-15', 'mob')], { desc: 'Rock breaking, Ch 360' });
  addDocket(st, 'D206', '2026-11-11', 'Submitted', [lab('tom', '07:00', '15:00', 0, [{ type: 'Tool' }])], { desc: 'Formwork for headwall' });
  addDocket(st, 'D107', '2026-11-12', 'Submitted', [lab('jo', '07:00', '15:00')], { desc: 'Trench shoring' });
  addDocket(st, 'D207', '2026-11-12', 'Draft', [lab('cris', '07:00', '11:00')], { desc: 'Standby for client access' });
  addDocket(st, 'D208', '2026-11-12', 'Approved', [lab('tom', '06:00', '17:00', 0.5)], { desc: 'Traffic switch, Ch 200' });
  addDocket(st, 'D215', '2026-11-13', 'Submitted', [lab('mel', '07:00', '15:00')], { desc: 'Water main lowering' });
  addDocket(st, 'D216', '2026-11-13', 'Approved', [wet('EX-12', 'lee', '07:00', '15:00')], { desc: 'Water main lowering, excavation' });
  addDocket(st, 'D211', '2026-11-16', 'Submitted', [wet('EX-07', 'sam', '07:00', '15:00', 0, ['Breaker 1t']), mat('Concrete', { cost: 600 })], { desc: 'Rock breaking and concrete, Ch 380' });
  addDocket(st, 'D220', '2026-11-12', 'Approved', [lab('jo', '07:00', '15:30', 0.5), mat('Road base', { qty: 6 })], { desc: 'Backfill service trench, Ch 165' });
  addDocket(st, 'D221', '2026-11-13', 'Costed', [dry('EX-12', '07:00', '12:00')], { desc: 'Stockpile tidy, dry hire' });
  addDocket(st, 'D217', '2026-11-16', 'Approved', [lab('jo', '07:00', '15:00')], { desc: 'Clean up, Ch 400', note: 'Dated after the 1 to 15 Nov claim period' });

  at('2026-10-24', () => { createVariation(st, ['D091', 'D092'], { id: 'V004', title: 'Kerb removal and unsuitable material, October', revision: 'Rev A' }); });
  at('2026-10-26', () => setVarStatus(st, 'V004', 'Approved'));
  at('2026-10-31', () => {
    const c = createClaim(st, { from: '2026-10-16', to: '2026-10-31' }, [], { id: 3, vars: ['V002', 'V004'] });
    setVarPct(st, '3', 'V002', 80);
    c.boq = { '1.1': 600, '2.3': 120 }; c.invoiceRef = 'INV-1067';
    approveClaim(st, '3');
  });
  at('2026-11-03', () => { createVariation(st, ['D201'], { id: 'V005', title: 'Extra kerb removal, Ch 120', revision: 'Rev A' }); });
  at('2026-11-04', () => setVarStatus(st, 'V005', 'Approved'));
  at('2026-11-06', () => { createVariation(st, ['D212', 'D213', 'D214'], { id: 'V006', title: 'Detour road base and traffic control', revision: 'Rev A' }); });
  at('2026-11-06', () => markNotClaimable(st, 'D105', 'goodwill, no charge'));
  at('2026-11-12', () => markNotClaimable(st, 'D207', 'crew waiting on client access'));
  at('2026-11-12', () => { sendBack(st, 'D107', 'More photos', 'need the trench depth shot'); });
  at('2026-11-12', () => createVariation(st, ['D203'], { id: 'V007', title: 'Hand dig around Telstra pit' }));
  at('2026-11-13', () => createVariation(st, ['D208'], { id: 'V008', title: 'Traffic switch, Ch 200' }));
  at('2026-11-14', () => { createVariation(st, ['D216'], { id: 'V009', title: 'Water main lowering, Ch 410', revision: 'Rev B' }); });
  at('2026-11-16', () => { createVariation(st, ['D209', 'D210'], { id: 'V010', title: 'Rock breaking, Ch 340 to 380', revision: 'Rev A' }); });
  at('2026-11-16', () => { createClaim(st, { from: '2026-11-01', to: '2026-11-15' }, ['D101', 'D106', 'D218'], { id: 4 }); getClaim(st, '4').boq = { '1.1': 450, '3.1': 800 }; });
  st.log = [{ at: st.today, what: 'Demo loaded: Riverside Rd Upgrade, 1 Sep to 16 Nov 2026', kind: 'action' }];
  return st;
}
