/* Dayworks billing prototype: engine (state, pricing, actions).
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
const ACTIVE_VAR = ['Draft', 'Submitted', 'Approved'];
const ACTIVE_CLAIM = ['Draft', 'Issued'];

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
      name: 'Riverside Rd Upgrade', state: 'NSW', contractSum: 1250000,
      margins: { Labour: 10, Plant: 8, Materials: 12, Subcontract: 10 },
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
function sub(item, cost) { return { t: 'sub', item, cost }; }
function addDocket(st, id, date, status, lines, extra = {}) {
  const d = Object.assign({ id, date, status, prevStatus: null, sentBack: null, nc: null, createdBy: 'Sam Patel', history: [{ at: date, by: 'Sam Patel', what: 'Created' }], lines }, extra);
  if (status !== 'Draft') d.history.push({ at: date, by: 'Sam Patel', what: 'Submitted' });
  if (status === 'Approved') d.history.push({ at: date, by: 'Dana Whitfield (PM)', what: 'Approved' });
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

/* ───────── Pricing (VAR-23035 business rules, the subset the dockets here use) ───────── */
function findRateLine(list, named, resource) { return list.find(x => (x.named || []).includes(named)) || list.find(x => (x.resources || []).includes(resource)) || null; }
function priceDocket(st, d) {
  const v = versionFor(st, d.date);
  const out = { version: v, lines: [], total: 0, problems: [] };
  if (!v) { out.problems.push('No calculator version in effect'); return out; }
  const dt = dayType(d.date);
  const timed = d.lines.map((l, i) => ({ l, i })).filter(x => ['labour', 'wet', 'dry'].includes(x.l.t));
  // Overlaps: a plant item on two lines, or a person on two lines (labour or wet), with overlapping hours.
  const overlapNames = new Set(); const overlapLines = new Set();
  for (let a = 0; a < timed.length; a++) for (let b = a + 1; b < timed.length; b++) {
    const A = timed[a].l, B = timed[b].l;
    const hit = toMin(A.start) < toMin(B.end) && toMin(B.start) < toMin(A.end);
    if (!hit) continue;
    if (A.plant && A.plant === B.plant) { overlapNames.add(A.plant); overlapLines.add(timed[a].i); overlapLines.add(timed[b].i); }
    if (A.person && A.person === B.person && A.t !== 'dry' && B.t !== 'dry') { overlapNames.add(PEOPLE[A.person].name); overlapLines.add(timed[a].i); overlapLines.add(timed[b].i); }
  }
  overlapNames.forEach(n => out.problems.push('Overlap: ' + n));
  // Tiering: hours per person per day across their labour and wet-hire lines, in start order.
  const tiers = {};
  const byPerson = {};
  timed.filter(x => x.l.person).forEach(x => (byPerson[x.l.person] ||= []).push(x));
  Object.values(byPerson).forEach(list => {
    list.sort((p, q) => toMin(p.l.start) - toMin(q.l.start));
    const buckets = tierOrder(v.triggers, dt).map(([t, h]) => ({ t, left: h }));
    let bi = 0;
    list.forEach(x => {
      const tally = {}; let rem = Math.max(0, lineHours(x.l));
      while (rem > 1e-9 && bi < buckets.length) { const bk = buckets[bi]; const take = Math.min(rem, bk.left); tally[bk.t] = (tally[bk.t] || 0) + take; rem -= take; bk.left -= take; if (bk.left <= 1e-9) bi++; }
      if (rem > 1e-9) { const last = buckets[buckets.length - 1].t; tally[last] = (tally[last] || 0) + rem; }
      tiers[x.i] = tally;
    });
  });
  const lowest = tierOrder(v.triggers, dt)[0][0];
  const perDaySeen = new Set();
  const unmapped = [];
  d.lines.forEach((l, i) => {
    const r = { i, l, label: '', rateLine: null, rows: [], extras: [], value: 0, unmapped: [], overlap: overlapLines.has(i), hours: null };
    const tierRows = (tally, rateTbl) => TIERS.filter(t => tally[t]).map(t => ({ tier: t, hours: tally[t], rate: rateTbl[t], value: round2(tally[t] * rateTbl[t]) }));
    const withMin = (tally, min) => { const t = Object.assign({}, tally); const h = Object.values(t).reduce((a, b) => a + b, 0); if (h < min) t[lowest] = (t[lowest] || 0) + (min - h); return t; };
    const allowances = (chargeH) => (l.allow || []).forEach(a => {
      const al = v.allow.find(x => x.type === a.type);
      if (!al) { r.unmapped.push(allowName(a.type)); r.extras.push({ label: allowName(a.type), value: 0, note: 'Unmapped, prices at $0' }); return; }
      let units = 1;
      if (al.unit === 'day') { const k = l.person + d.date; if (perDaySeen.has(k)) { r.extras.push({ label: al.name, value: 0, note: 'already charged today' }); return; } perDaySeen.add(k); }
      if (al.unit === 'occurrence') units = a.units || 1;
      if (al.unit === 'hour') units = chargeH;
      if (al.unit === 'km') units = a.units || 0;
      r.extras.push({ label: al.name, value: round2(units * al.amount), note: fmtH(units) + ' ' + al.unit + ' x ' + money(al.amount) });
    });
    if (l.t === 'labour') {
      const p = PEOPLE[l.person]; r.hours = lineHours(l);
      r.label = p.name + ' (' + p.role + ')';
      r.rateLine = findRateLine(v.labour, l.person, p.role);
      if (!r.rateLine) r.unmapped.push(p.name);
      else { const t = withMin(tiers[i] || {}, r.rateLine.min); r.rows = tierRows(t, r.rateLine.r); allowances(Object.values(t).reduce((a, b) => a + b, 0)); }
    } else if (l.t === 'wet') {
      const pl = PLANT[l.plant]; r.hours = lineHours(l);
      r.label = l.plant + ' ' + pl.name + ' wet, operator ' + PEOPLE[l.person].name;
      r.rateLine = findRateLine(v.wet, l.plant, pl.res);
      if (!r.rateLine) r.unmapped.push(l.plant + ' (wet hire)');
      else {
        const t = withMin(tiers[i] || {}, r.rateLine.min); r.rows = tierRows(t, r.rateLine.r);
        (l.att || []).forEach(an => {
          const al = v.attach.find(x => x.resources.includes(an));
          if (!al) { r.unmapped.push(an); r.extras.push({ label: an, value: 0, note: 'Unmapped, prices at $0' }); return; }
          const rows = tierRows(t, al.r);
          r.extras.push({ label: al.name, value: round2(rows.reduce((a, x) => a + x.value, 0)), note: rows.map(x => fmtH(x.hours) + 'h x ' + money(x.rate)).join(' + ') });
        });
        allowances(Object.values(t).reduce((a, b) => a + b, 0));
      }
    } else if (l.t === 'dry') {
      const pl = PLANT[l.plant]; r.hours = lineHours(l);
      r.label = l.plant + ' ' + pl.name + ' dry';
      r.rateLine = findRateLine(v.dry, l.plant, pl.res);
      if (!r.rateLine) r.unmapped.push(l.plant + ' (dry hire)');
      else if (r.rateLine.unit === 'day') r.rows = [{ tier: 'day', hours: 1, rate: r.rateLine.r.std, value: r.rateLine.r.std }];
      else { const h = Math.max(r.hours, r.rateLine.min); r.rows = [{ tier: 'flat', hours: h, rate: r.rateLine.r.std, value: round2(h * r.rateLine.r.std) }]; }
    } else if (l.t === 'float') {
      const pl = PLANT[l.plant]; const f = v.float.find(x => x.plantType === pl.type);
      r.label = (l.dir === 'mob' ? 'Mobilise ' : 'Demobilise ') + l.plant;
      r.rateLine = f;
      if (f) r.rows = [{ tier: 'flat', hours: 1, rate: l.dir === 'mob' ? f.mob : f.demob, value: l.dir === 'mob' ? f.mob : f.demob }];
    } else if (l.t === 'material' || l.t === 'sub') {
      const list = l.t === 'material' ? v.materials : v.sub;
      r.label = l.item + (l.qty !== undefined ? ' ' + l.qty + ' ' : ' cost ' + money(l.cost));
      r.rateLine = list.find(x => x.resources.includes(l.item)) || null;
      if (!r.rateLine) r.unmapped.push(l.item);
      else if (r.rateLine.rate !== undefined) r.rows = [{ tier: 'unit', hours: l.qty, rate: r.rateLine.rate, value: round2(l.qty * r.rateLine.rate) }];
      else r.rows = [{ tier: 'costplus', hours: 1, rate: round2(l.cost * (1 + r.rateLine.margin / 100)), value: round2(l.cost * (1 + r.rateLine.margin / 100)) }];
    }
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

/* ───────── Where a docket lives ───────── */
function docketHome(st, id) {
  for (const v of st.variations) if (ACTIVE_VAR.includes(v.status)) { const ln = v.lines.find(l => l.docket === id); if (ln) return { kind: 'variation', rec: v, line: ln, label: 'variation ' + v.id }; }
  for (const c of st.claims) if (ACTIVE_CLAIM.includes(c.status)) { const ln = c.lines.find(l => l.docket === id); if (ln) return { kind: 'claim', rec: c, line: ln, label: 'claim ' + c.id }; }
  return null;
}
function isLocked(st, id) { const h = docketHome(st, id); return !!h && ((h.kind === 'variation' && h.rec.status === 'Approved') || (h.kind === 'claim' && h.rec.status === 'Issued')); }
// The value a docket carries now: the frozen value if it is on an approved variation or issued claim, else the live calculator price.
function docketValue(st, id) { const h = docketHome(st, id); if (h && isLocked(st, id)) return h.line.frozen; return priceDocket(st, getDocket(st, id)).total; }
function refuseIfLocked(st, d) { if (isLocked(st, d.id)) { const h = docketHome(st, d.id); throw new Error(d.id + ' is read-only: it is on ' + (h.kind === 'variation' ? 'approved variation ' : 'issued claim ') + h.rec.id); } }

/* ───────── Pickers ───────── */
// mode: 'variation' | 'claim'. period only for claims. Not claimable and already-used dockets are not listed.
function pickerRows(st, mode, period) {
  return st.dockets
    .filter(d => d.status !== 'Not claimable' && !docketHome(st, d.id))
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))
    .map(d => {
      const p = priceDocket(st, d);
      let block = null;
      if (d.status === 'Rejected') block = 'Rejected';
      else if (p.problems.length) block = p.problems.join(' · ');
      const highlight = block ? 'block' : (d.status === 'Draft' || d.status === 'Submitted') ? 'warn' : null;
      const inPeriod = !!period && d.date >= period.from && d.date <= period.to;
      return { d, value: p.total, block, highlight, tickable: !block, inPeriod, preTick: mode === 'claim' && inPeriod && !block, older: !!period && d.date < period.from };
    });
}
// Save-time enforcement: the same rules as the picker, checked again when lines are saved.
function validateAdd(st, ids) {
  if (!ids.length) throw new Error('Tick at least one docket');
  ids.forEach(id => {
    const d = getDocket(st, id);
    if (d.status === 'Not claimable') throw new Error(id + ' is Not claimable');
    const h = docketHome(st, id); if (h) throw new Error(id + ' is already on ' + h.label);
    if (d.status === 'Rejected') throw new Error(id + ' is Rejected and cannot be added');
    const p = priceDocket(st, d); if (p.problems.length) throw new Error(id + ' cannot be added: ' + p.problems.join(', '));
  });
}

/* ───────── Variations (VAR-23036) ───────── */
function nextId(list, prefix) { const n = list.reduce((m, x) => Math.max(m, parseInt(x.id.slice(2), 10)), 0) + 1; return prefix + String(n).padStart(3, '0'); }
function createVariation(st, ids, opts = {}) {
  validateAdd(st, ids);
  const v = { id: opts.id || nextId(st.variations, 'V-'), title: opts.title || 'Dayworks ' + fmtDate(st.today), status: 'Draft', created: st.today, lines: [], submittedBase: null, submittedFinal: null, approvedAmount: null, decisions: [], history: [{ at: st.today, what: 'Created from dockets' }] };
  st.variations.push(v);
  ids.forEach(id => v.lines.push({ docket: id, added: priceDocket(st, getDocket(st, id)).total, frozen: null }));
  log(st, v.id + ' created from ' + ids.join(', '));
  return v;
}
function addToVariation(st, varId, ids) {
  const v = getVar(st, varId);
  if (v.status !== 'Draft') throw new Error(v.id + ' is ' + v.status.toLowerCase() + ' and cannot take more dockets');
  validateAdd(st, ids);
  ids.forEach(id => v.lines.push({ docket: id, added: priceDocket(st, getDocket(st, id)).total, frozen: null }));
  v.history.push({ at: st.today, what: 'Added ' + ids.join(', ') });
  log(st, ids.join(', ') + ' added to ' + v.id);
  return v;
}
function removeFromVariation(st, varId, id) {
  const v = getVar(st, varId);
  if (v.status !== 'Draft') throw new Error('Dockets can only be removed from an unsubmitted variation');
  v.lines = v.lines.filter(l => l.docket !== id);
  v.history.push({ at: st.today, what: 'Removed ' + id + ' (released)' });
  log(st, id + ' removed from ' + v.id + ' and released');
}
function varLineValue(st, v, ln) { return v.status === 'Approved' ? ln.frozen : (ACTIVE_VAR.includes(v.status) ? priceDocket(st, getDocket(st, ln.docket)).total : ln.releasedAt); }
function varLineChanged(st, v, ln) { return v.status !== 'Approved' && ACTIVE_VAR.includes(v.status) && Math.abs(varLineValue(st, v, ln) - ln.added) > 0.004; }
function varTotal(st, v) { return round2(v.lines.reduce((a, ln) => a + (varLineValue(st, v, ln) || 0), 0)); }
function varSubmittedAmount(st, v) { if (v.status === 'Draft') return null; if (v.status === 'Submitted') return varTotal(st, v); return v.submittedFinal; }
function varSubmittedChanged(st, v) { return v.status === 'Submitted' && Math.abs(varTotal(st, v) - v.submittedBase) > 0.004; }
function unapprovedCount(st, ids) { return ids.filter(id => getDocket(st, id).status !== 'Approved').length; }
function plural(n, w) { return n + ' ' + w + (n === 1 ? '' : 's'); }
function submitVariation(st, varId, opts = {}) {
  const v = getVar(st, varId);
  if (v.status !== 'Draft') throw new Error(v.id + ' is already ' + v.status.toLowerCase());
  if (!v.lines.length) throw new Error('Add at least one docket before submitting');
  const n = unapprovedCount(st, v.lines.map(l => l.docket));
  if (n && !opts.confirm) return { needsConfirm: true, count: n, message: plural(n, 'docket') + ' not yet approved' };
  v.status = 'Submitted'; v.submittedOn = st.today; v.submittedBase = varTotal(st, v);
  if (n) v.decisions.push({ at: st.today, by: st.user, what: 'Submitted with ' + plural(n, 'unapproved docket') });
  v.history.push({ at: st.today, what: 'Submitted at ' + money(v.submittedBase) });
  log(st, v.id + ' submitted at ' + money(v.submittedBase) + (n ? ' (' + plural(n, 'unapproved docket') + ', confirmed)' : ''));
  return { ok: true };
}
function approveVariation(st, varId, amount) {
  const v = getVar(st, varId);
  if (v.status !== 'Submitted') throw new Error('Only a submitted variation can be approved');
  v.lines.forEach(ln => ln.frozen = priceDocket(st, getDocket(st, ln.docket)).total);
  v.submittedFinal = varTotal(st, v);
  v.approvedAmount = amount === undefined || amount === null ? v.submittedFinal : round2(amount);
  v.status = 'Approved'; v.approvedOn = st.today;
  v.history.push({ at: st.today, what: 'Approved at ' + money(v.approvedAmount) + '; dockets locked' });
  log(st, v.id + ' approved at ' + money(v.approvedAmount) + '; ' + v.lines.map(l => l.docket).join(', ') + ' locked');
}
function releaseVariation(st, varId, status) {
  const v = getVar(st, varId);
  if (status === 'Rejected' && v.status !== 'Submitted') throw new Error('Only a submitted variation can be rejected');
  if (status === 'Withdrawn' && !['Draft', 'Submitted'].includes(v.status)) throw new Error('Only a draft or submitted variation can be withdrawn');
  v.lines.forEach(ln => ln.releasedAt = priceDocket(st, getDocket(st, ln.docket)).total);
  v.submittedFinal = v.status === 'Submitted' ? varTotal(st, v) : null;
  v.status = status;
  v.history.push({ at: st.today, what: status + '; ' + plural(v.lines.length, 'docket') + ' released' });
  log(st, v.id + ' ' + status.toLowerCase() + '; ' + v.lines.map(l => l.docket).join(', ') + ' released');
}
function contractSum(st) { return round2(st.project.contractSum + st.variations.filter(v => v.status === 'Approved').reduce((a, v) => a + v.approvedAmount, 0)); }

/* ───────── Claims (VAR-23037) ───────── */
function createClaim(st, period, ids, opts = {}) {
  validateAdd(st, ids);
  const c = { id: opts.id || nextId(st.claims, 'C-'), period, status: 'Draft', created: st.today, lines: [], boq: {}, varLines: null, decisions: [], history: [{ at: st.today, what: 'Created from dockets' }] };
  st.claims.push(c);
  ids.forEach(id => c.lines.push({ docket: id, added: priceDocket(st, getDocket(st, id)).total, frozen: null }));
  log(st, c.id + ' created for ' + fmtDate(period.from) + ' to ' + fmtDate(period.to) + ' with ' + (ids.join(', ') || 'no dockets'));
  return c;
}
function claimAddDockets(st, claimId, ids) {
  const c = getClaim(st, claimId);
  if (c.status !== 'Draft') throw new Error(c.id + ' is issued and locked');
  validateAdd(st, ids);
  ids.forEach(id => c.lines.push({ docket: id, added: priceDocket(st, getDocket(st, id)).total, frozen: null }));
  log(st, ids.join(', ') + ' added to ' + c.id);
}
function claimRemoveDocket(st, claimId, id) {
  const c = getClaim(st, claimId);
  if (c.status !== 'Draft') throw new Error(c.id + ' is issued and locked');
  c.lines = c.lines.filter(l => l.docket !== id);
  log(st, id + ' removed from ' + c.id + ' and released');
}
function deleteDraftClaim(st, claimId) {
  const c = getClaim(st, claimId);
  if (c.status !== 'Draft') throw new Error('Only a draft claim can be deleted');
  c.status = 'Deleted';
  log(st, c.id + ' deleted; ' + (c.lines.map(l => l.docket).join(', ') || 'no dockets') + ' released');
}
function claimLineValue(st, c, ln) { return c.status === 'Issued' ? ln.frozen : priceDocket(st, getDocket(st, ln.docket)).total; }
function claimLineChanged(st, c, ln) { return c.status === 'Draft' && Math.abs(claimLineValue(st, c, ln) - ln.added) > 0.004; }
// Approved variations reach the claim through the normal variation path: a draft claim shows every approved variation not already on an issued claim (the earliest draft claim takes it).
function claimVarLines(st, c) {
  if (c.status === 'Issued') return c.varLines || [];
  if (c.status !== 'Draft') return [];
  const issued = new Set(st.claims.filter(x => x.status === 'Issued').flatMap(x => (x.varLines || []).map(l => l.variation)));
  const firstDraft = st.claims.filter(x => x.status === 'Draft').sort((a, b) => a.id.localeCompare(b.id))[0];
  if (firstDraft !== c) return [];
  return st.variations.filter(v => v.status === 'Approved' && !issued.has(v.id)).map(v => ({ variation: v.id, title: v.title, amount: v.approvedAmount, dockets: v.lines.map(l => l.docket) }));
}
function claimTotals(st, c) {
  const dockets = round2(c.lines.reduce((a, ln) => a + (claimLineValue(st, c, ln) || 0), 0));
  const vars = round2(claimVarLines(st, c).reduce((a, l) => a + l.amount, 0));
  const boq = round2(st.project.boq.reduce((a, b) => a + (c.boq[b.code] || 0) * b.rate, 0));
  const gross = round2(dockets + vars + boq);
  const retention = round2(gross * st.project.retention / 100);
  const net = round2(gross - retention);
  const gst = round2(net * st.project.gst / 100);
  return { dockets, vars, boq, gross, retention, net, gst, total: round2(net + gst) };
}
function issueClaim(st, claimId, opts = {}) {
  const c = getClaim(st, claimId);
  if (c.status !== 'Draft') throw new Error(c.id + ' is already issued');
  const n = unapprovedCount(st, c.lines.map(l => l.docket));
  if (n && !opts.confirm) return { needsConfirm: true, count: n, message: plural(n, 'docket') + ' not yet approved' };
  c.varLines = claimVarLines(st, c);
  c.lines.forEach(ln => ln.frozen = priceDocket(st, getDocket(st, ln.docket)).total);
  c.status = 'Issued'; c.issued = st.today;
  if (n) c.decisions.push({ at: st.today, by: st.user, what: 'Issued with ' + plural(n, 'unapproved docket') });
  c.history.push({ at: st.today, what: 'Issued; dockets locked' });
  log(st, c.id + ' issued at ' + money(claimTotals(st, c).gross) + ' ex GST' + (n ? ' (' + plural(n, 'unapproved docket') + ', confirmed)' : '') + '; dockets locked');
  return { ok: true };
}
function lastIssuedClaimDate(st) { return st.claims.filter(c => c.status === 'Issued').map(c => c.issued).sort().pop() || null; }
function nextClaimPeriod(st) {
  const last = st.claims.filter(c => c.status === 'Issued').map(c => c.period.to).sort().pop();
  const from = last ? addDays(last, 1) : '2026-11-01';
  const [y, m, d] = from.split('-').map(Number);
  const to = d <= 15 ? `${y}-${String(m).padStart(2, '0')}-15` : new Date(y, m, 0).toISOString().slice(0, 10).replace(/-\d\d$/, '-' + new Date(y, m, 0).getDate());
  return { from, to };
}
function addDays(date, n) { const d = new Date(date + 'T00:00:00'); d.setDate(d.getDate() + n); const z = x => String(x).padStart(2, '0'); return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()); }

/* ───────── Docket actions (VAR-23062, VAR-23063, edits) ───────── */
function refuseIfOnRecord(st, d) { const h = docketHome(st, d.id); if (h) throw new Error('Remove this docket from ' + h.label + ' first'); }
function markNotClaimable(st, id, note) {
  const d = getDocket(st, id);
  if (!['Draft', 'Submitted', 'Approved'].includes(d.status)) throw new Error('Only a Draft, Submitted or Approved docket can be marked Not claimable');
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
  if (d.status !== 'Submitted') throw new Error('Only a Submitted docket can be sent back');
  if (reason === 'Other' && !(note || '').trim()) throw new Error('Add a note for Other');
  refuseIfOnRecord(st, d);
  d.status = 'Draft'; d.sentBack = { reason, note: note || '', by: st.user, at: st.today };
  d.history.push({ at: st.today, by: st.user, what: 'Sent back: ' + reason + (note ? ' (' + note + ')' : '') });
  log(st, id + ' sent back to ' + d.createdBy + ': ' + reason);
}
function submitDocket(st, id) {
  const d = getDocket(st, id);
  if (!['Draft', 'Rejected'].includes(d.status)) throw new Error('Only a Draft or Rejected docket can be submitted');
  const was = d.status; d.status = 'Submitted';
  d.history.push({ at: st.today, by: d.createdBy, what: (d.sentBack ? 'Resubmitted after send-back' : was === 'Rejected' ? 'Fixed and resubmitted' : 'Submitted') });
  d.sentBack = null;
  log(st, id + ' submitted');
}
function approveDocket(st, id) {
  const d = getDocket(st, id);
  if (d.status !== 'Submitted') throw new Error('Only a Submitted docket can be approved');
  const p = priceDocket(st, d); if (p.problems.length) throw new Error(id + ' cannot be approved: ' + p.problems.join(', '));
  d.status = 'Approved'; d.history.push({ at: st.today, by: st.user, what: 'Approved' });
  log(st, id + ' approved');
}
function rejectDocket(st, id) {
  const d = getDocket(st, id);
  if (d.status !== 'Submitted') throw new Error('Only a Submitted docket can be rejected');
  d.status = 'Rejected'; d.history.push({ at: st.today, by: 'Client (email)', what: 'Rejected by client' });
  log(st, id + ' rejected by the client');
}
function editHours(st, id, idx, hours) {
  const d = getDocket(st, id); refuseIfLocked(st, d);
  const l = d.lines[idx]; if (!['labour', 'wet', 'dry'].includes(l.t)) throw new Error('Only timed lines have hours');
  if (!(hours > 0) || hours > 23) throw new Error('Enter hours between 0 and 23');
  const before = lineHours(l);
  l.end = fromMin(toMin(l.start) + Math.round((hours + (l.brk || 0)) * 60));
  if (toMin(l.end) <= toMin(l.start) || toMin(l.end) > 24 * 60) throw new Error('Line would cross midnight; not modelled here');
  d.history.push({ at: st.today, by: st.user, what: 'Line ' + (idx + 1) + ' hours ' + fmtH(before) + 'h to ' + fmtH(hours) + 'h' });
  log(st, id + ' line ' + (idx + 1) + ' edited to ' + fmtH(hours) + 'h');
}
function removeDocketLine(st, id, idx) {
  const d = getDocket(st, id); refuseIfLocked(st, d);
  const l = d.lines[idx];
  d.lines.splice(idx, 1);
  d.history.push({ at: st.today, by: st.user, what: 'Removed line ' + (idx + 1) + ' (' + l.t + ')' });
  log(st, id + ' line ' + (idx + 1) + ' removed');
}
function removeAllowance(st, id, idx, type) {
  const d = getDocket(st, id); refuseIfLocked(st, d);
  const l = d.lines[idx]; l.allow = (l.allow || []).filter(a => a.type !== type);
  d.history.push({ at: st.today, by: st.user, what: 'Removed ' + allowName(type) });
  log(st, id + ': ' + allowName(type) + ' removed');
}

/* ───────── Calculator versions (VAR-23035) ───────── */
const RATE_SECTIONS = { labour: 'Labour rates', wet: 'Wet hire', dry: 'Dry hire', attach: 'Attachments' };
function publishVersion(st, section, lineName, std, effectiveFrom) {
  const last = lastIssuedClaimDate(st);
  if (last && effectiveFrom < last) throw new Error('Effective date cannot be before the last issued claim (' + fmtDate(last) + ')');
  const cur = st.versions.slice().sort((a, b) => b.n - a.n)[0];
  const v = clone(cur); v.n = cur.n + 1; v.effectiveFrom = effectiveFrom; v.savedOn = st.today; v.savedBy = st.user;
  const ln = v[section].find(x => x.name === lineName); if (!ln) throw new Error('No line ' + lineName);
  const was = ln.r.std;
  ln.r = section === 'dry' ? { std } : rates(std);
  v.note = lineName + ' Standard ' + money(was) + ' to ' + money(std) + (section === 'dry' ? '' : ' (tiers prefilled 1.5x, 2x, 2.5x)');
  st.versions.push(v);
  log(st, 'Calculator v' + v.n + ' published, effective ' + fmtDate(effectiveFrom) + ': ' + v.note);
  return v;
}

/* ───────── Demo seed: one project end to end ───────── */
function seedState() {
  const st = baseState();
  const at = (date, fn) => { const t = st.today; st.today = date; fn(); st.today = t; };
  // October: claimed on C-003, plus one that arrived after it was issued.
  addDocket(st, 'D091', '2026-10-20', 'Approved', [lab('tom', '07:00', '15:30', 0.5)]);
  addDocket(st, 'D092', '2026-10-22', 'Approved', [wet('EX-07', 'sam', '07:00', '15:00'), flt('EX-07', 'mob')]);
  addDocket(st, 'D095', '2026-10-25', 'Approved', [lab('jo', '07:00', '15:00')], { note: 'Sunday work, submitted after C-003 was issued' });
  // November
  addDocket(st, 'D201', '2026-11-02', 'Approved', [lab('tom', '07:00', '15:00')]);
  addDocket(st, 'D210', '2026-11-02', 'Approved', [wet('EX-07', 'sam', '07:00', '16:00')]);
  addDocket(st, 'D101', '2026-11-03', 'Approved', [lab('tom', '06:00', '17:00', 0.5)]);
  addDocket(st, 'D212', '2026-11-03', 'Approved', [mat('Road base', { qty: 12 }), lab('jo', '07:00', '15:00')]);
  addDocket(st, 'D202', '2026-11-04', 'Submitted', [lab('jo', '07:00', '15:00')]);
  addDocket(st, 'D213', '2026-11-04', 'Approved', [sub('Traffic control', 1200)]);
  addDocket(st, 'D103', '2026-11-05', 'Rejected', [lab('ben', '07:00', '15:00')]);
  addDocket(st, 'D203', '2026-11-05', 'Approved', [lab('cris', '07:00', '15:00')]);
  addDocket(st, 'D214', '2026-11-05', 'Approved', [dry('EX-12', '07:00', '16:00')]);
  addDocket(st, 'D104', '2026-11-06', 'Draft', [dry('EX-07', '07:00', '12:00'), wet('EX-07', 'lee', '10:00', '15:00')]);
  addDocket(st, 'D105', '2026-11-06', 'Submitted', [lab('jo', '07:00', '11:00')]);
  addDocket(st, 'D102', '2026-11-09', 'Submitted', [wet('EX-07', 'sam', '07:00', '16:00')]);
  addDocket(st, 'D209', '2026-11-10', 'Approved', [lab('tom', '06:00', '17:00', 0.5)]);
  addDocket(st, 'D204', '2026-11-10', 'Rejected', [lab('jo', '07:00', '13:00')]);
  addDocket(st, 'D106', '2026-11-10', 'Draft', [lab('mel', '06:00', '17:00', 0.5)]);
  addDocket(st, 'D205', '2026-11-11', 'Submitted', [wet('EX-15', 'lee', '07:00', '16:00', 0, ['Breaker 1t']), flt('EX-15', 'mob')]);
  addDocket(st, 'D206', '2026-11-11', 'Submitted', [lab('tom', '07:00', '15:00', 0, [{ type: 'Tool' }])]);
  addDocket(st, 'D107', '2026-11-12', 'Submitted', [lab('jo', '07:00', '15:00')]);
  addDocket(st, 'D207', '2026-11-12', 'Draft', [lab('cris', '07:00', '11:00')]);
  addDocket(st, 'D208', '2026-11-12', 'Approved', [lab('tom', '06:00', '17:00', 0.5)]);
  addDocket(st, 'D211', '2026-11-16', 'Submitted', [wet('EX-07', 'sam', '07:00', '15:00', 0, ['Breaker 1t']), mat('Concrete', { cost: 600 })]);

  at('2026-10-31', () => {
    const c = createClaim(st, { from: '2026-10-16', to: '2026-10-31' }, ['D091', 'D092'], { id: 'C-003' });
    c.boq = { '1.1': 600, '2.3': 120 };
    issueClaim(st, 'C-003');
  });
  at('2026-11-03', () => { createVariation(st, ['D201'], { id: 'V-012', title: 'Extra kerb removal, Ch 120' }); submitVariation(st, 'V-012'); });
  at('2026-11-04', () => approveVariation(st, 'V-012'));
  at('2026-11-06', () => { createVariation(st, ['D212', 'D213', 'D214'], { id: 'V-014', title: 'Detour road base and traffic control' }); submitVariation(st, 'V-014'); });
  at('2026-11-06', () => markNotClaimable(st, 'D105', 'goodwill, no charge'));
  at('2026-11-12', () => markNotClaimable(st, 'D207', 'crew waiting on client access'));
  at('2026-11-12', () => { sendBack(st, 'D107', 'More photos', 'need the trench depth shot'); });
  at('2026-11-12', () => createVariation(st, ['D203'], { id: 'V-013', title: 'Hand dig around Telstra pit' }));
  at('2026-11-13', () => createVariation(st, ['D208'], { id: 'V-015', title: 'Night traffic switch' }));
  at('2026-11-16', () => { createVariation(st, ['D209', 'D210', 'D211'], { id: 'V-016', title: 'Rock breaking, Ch 340 to 380' }); submitVariation(st, 'V-016', { confirm: true }); });
  st.log = [{ at: st.today, what: 'Demo loaded: Riverside Rd Upgrade, 1 to 16 Nov 2026', kind: 'action' }];
  return st;
}
