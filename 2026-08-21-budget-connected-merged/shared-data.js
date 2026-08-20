/* ══════════════════════════════════════════════════════════════════════════
   VDATA — one dataset behind all three tabs.

   The budget is the authority. Everything the Daily Cost and Site Diary tabs
   show is derived from the base prototype's own budget lines: its cost
   centres, its WBS levels, its crew, its plant fleet, its suppliers, its
   units and rates, and its claim periods.

   The consequence that matters: a project that was just set up carries no
   cost, so the calendar and the diary are empty too. Simulate activity and
   they fill in. Nothing here invents cost the budget does not have.

   How the numbers tie:

     budget line cost for a period          (base, per cost centre)
       └─ split by resource category        (base's resourceBreakdown)
           └─ spread over the period's working days      (here)
               └─ one detail row per worker / machine / delivery
                   ├─ Daily Cost tab renders these as calendar entries
                   └─ Site Diary renders one day of them as diary rows

   So a day cell on the calendar and the diary for that same day are the same
   rows, and the month total is the budget's cost for that claim period. The
   pool is authoritative: quantities are back-solved from the money, which is
   why hours read 8.4 rather than a tidy 8.
   ══════════════════════════════════════════════════════════════════════════ */
var VDATA = (function () {

  /* ── plumbing ───────────────────────────────────────────────────────── */

  var _version = 0;          /* bumped whenever the base's cost data changes */
  var _cache = {};

  function invalidate() { _version++; _cache = {}; }
  function version() { return _version; }

  /* The base's own seeded hash, so anything derived here stays put between
     renders instead of reshuffling under the user. */
  function seed(key) {
    var h = 2166136261;
    for (var i = 0; i < key.length; i++) { h ^= key.charCodeAt(i); h = Math.imul(h, 16777619); }
    return Math.abs(h);
  }
  function pick(list, key, i) {
    if (!list.length) return null;
    return list[(seed(key) + (i || 0) * 7) % list.length];
  }

  /* Largest-remainder split — the parts always add back to the whole, which is
     what keeps a day's rows summing to the day and the days to the month. */
  function split(total, weights) {
    var sum = weights.reduce(function (a, b) { return a + b; }, 0);
    if (!sum || !total) return weights.map(function () { return 0; });
    var raw = weights.map(function (w) { return total * w / sum; });
    var out = raw.map(Math.floor);
    var rem = Math.round(total - out.reduce(function (a, b) { return a + b; }, 0));
    var order = raw.map(function (v, i) { return [v - Math.floor(v), i]; })
                   .sort(function (a, b) { return b[0] - a[0]; });
    for (var k = 0; k < rem; k++) out[order[k % order.length][1]]++;
    return out;
  }

  /* ── the period the two tabs sit in ─────────────────────────────────── */

  /* The open claim period. The diary is a record of a day being worked, so it
     belongs in the period still being built up, not a certified one. */
  function period() {
    var open = PERIODS.filter(function (p) { return p.status === 'open'; });
    return open.length ? open[open.length - 1] : PERIODS[PERIODS.length - 1];
  }

  function workingDays(p) {
    var out = [], d = new Date(p.start + 'T00:00:00'), end = new Date(p.end + 'T00:00:00');
    while (d <= end) {
      var dow = d.getDay();
      if (dow !== 0 && dow !== 6) out.push(iso(d));
      d.setDate(d.getDate() + 1);
    }
    return out;
  }
  function iso(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') +
           '-' + String(d.getDate()).padStart(2, '0');
  }

  /* ── the shared registry, read off the base's budget lines ──────────── */

  function liveLines() {
    try { return activeLines().filter(function (l) { return l.kind !== 'unassigned'; }); }
    catch (e) { return []; }
  }

  /* Cost centres actually carrying lines, in the base's own order. */
  function costCentres() {
    var seen = {}, out = [];
    liveLines().forEach(function (l) {
      if (l.cc && !seen[l.cc]) { seen[l.cc] = 1; out.push(l.cc); }
    });
    return out.length ? out : COST_CENTRES.slice();
  }

  /* A stable CC-nnn code per cost centre — the diary shows codes, the budget
     does not, so they are minted here once and used by both tabs. */
  function ccCode(name) {
    var i = costCentres().indexOf(name);
    return 'CC-' + (i < 0 ? 900 : (i + 1) * 100);
  }
  function ccLabel(name) { return ccCode(name) + ' ' + name; }

  /* The base's l1 › l2 › line hierarchy is exactly the diary's
     task › subtask › sub-subtask. */
  function wbsTree() {
    var l1s = [];
    liveLines().forEach(function (l) {
      if (!l.l1) return;
      var t = l1s.filter(function (x) { return x.key === l.l1; })[0];
      if (!t) { t = { key: l.l1, t: strip(l.l1), subs: [] }; l1s.push(t); }
      var s = t.subs.filter(function (x) { return x.key === l.l2; })[0];
      if (!s) { s = { key: l.l2, s: strip(l.l2 || 'General'), ss: [] }; t.subs.push(s); }
      if (l.desc && s.ss.indexOf(l.desc) < 0) s.ss.push(l.desc);
    });
    return l1s;
  }
  /* "1.1 Site Preparation" -> "Site Preparation" */
  function strip(s) { return String(s).replace(/^[\dA-Z]+(\.[\dA-Z]+)*\s+/, ''); }

  /* Allocation targets: every WBS leaf, carrying the cost centre it belongs to. */
  function allocOptions() {
    var out = [];
    liveLines().forEach(function (l) {
      var label = strip(l.l2 || l.l1 || '') + ' › ' + l.desc;
      if (!out.some(function (o) { return o.l === label; })) {
        out.push({ l: label, c: ccLabel(l.cc), cc: l.cc, code: l.code });
      }
    });
    return out;
  }

  /* The crew, from the base's people. */
  function workers() {
    return DAYWORK_PEOPLE.map(function (p) {
      return { id: p.id, nm: p.name, role: p.role, rate: p.costRate, in: false };
    });
  }

  /* Plant, from the base's fleet. Fleet rates are daily/weekly as well as
     hourly; the diary charges by the hour, so they are normalised here and the
     basis is kept so the meta line can still say how it is really charged. */
  function plantHourly(m) {
    return m.basis === 'hr' ? m.rate : m.basis === 'day' ? m.rate / 8 : m.rate / 38;
  }
  function plant() {
    return PLANT_FLEET.map(function (m) {
      return {
        id: m.id, nm: m.name, no: m.id, sup: 'Owned',
        rate: Math.round(plantHourly(m)), basis: m.basis, listRate: m.rate
      };
    });
  }

  /* Supply lines behind a cost centre — the base's own unit, rate and
     supplier, so a delivery on the diary names a real contract line. */
  function supplyLines(cc) {
    return liveLines().filter(function (l) {
      return l.cc === cc && l.unit && l.unit !== 'item' && l.rate > 0;
    });
  }
  function supplierFor(cc, kind) {
    var l = liveLines().filter(function (x) { return x.cc === cc && x.suppliers && x.suppliers[kind]; })[0];
    return (l && l.suppliers[kind]) || 'Supplier';
  }

  /* ── the ledger ─────────────────────────────────────────────────────── */

  /* Cost for one cost centre in one period, split the way the budget splits
     it. This is the pool a day's rows are drawn from — nothing is added to it
     and nothing is lost from it. */
  function poolsFor(cc, p) {
    var lines = liveLines().filter(function (l) { return l.cc === cc; });
    if (!lines.length) return null;
    var node = {};
    SUM_KEYS.forEach(function (k) { node[k] = 0; });
    lines.forEach(function (l) {
      var inPeriod = applyPeriod(l, [p.key]);
      SUM_KEYS.forEach(function (k) { node[k] += (inPeriod[k] || 0); });
    });
    var out = {};
    resourceBreakdown(node, cc).forEach(function (r) {
      out[r.cat.key] = Math.round(r.costToDate || 0);
    });
    return out;
  }

  /* Which days a cost centre worked, and how hard. A cost centre does not run
     every day of a month; giving each one its own pattern is what stops every
     calendar cell looking identical. */
  function dayWeights(cc, cat, days) {
    var s = seed(cc + '|' + cat);
    return days.map(function (d, i) {
      var v = (s >> (i % 12)) % 5;                    /* 0..4 */
      var quiet = ((s + i * 3) % 7) === 0;            /* the odd day off */
      return quiet ? 0 : v + 1;
    });
  }

  /* One detail row: what was used, at what rate, for how much.
     The money comes first — quantity is back-solved from it, so the rows
     always add to the pool. */
  function detailRows(cc, cat, day, amount) {
    if (amount <= 0) return [];
    var key = cc + cat + day, rows = [];

    if (cat === 'labour') {
      var crew = workers();
      var n = amount > 2200 ? 3 : amount > 900 ? 2 : 1;
      split(amount, [3, 2, 1.4].slice(0, n)).forEach(function (amt, i) {
        if (amt <= 0) return;
        var w = pick(crew, key + 'w', i);
        var hrs = Math.round(amt / w.rate * 10) / 10;
        if (hrs <= 0) return;
        rows.push({
          cat: 'labour', cc: cc, cost: amt, resource: w.nm,
          meta: hrs + ' hrs @ $' + w.rate + '/hr',
          detail: { kind: 'labour', worker: w, hrs: hrs, rate: w.rate }
        });
      });
    } else if (cat === 'plant') {
      var fleet = plant();
      var np = amount > 1800 ? 2 : 1;
      split(amount, [3, 1.8].slice(0, np)).forEach(function (amt, i) {
        if (amt <= 0) return;
        var m = pick(fleet, key + 'p', i);
        var hrs = Math.round(amt / m.rate * 10) / 10;
        if (hrs <= 0) return;
        rows.push({
          cat: 'plant', cc: cc, cost: amt, resource: m.nm + ' (' + m.id + ')',
          meta: hrs + ' hrs @ $' + m.rate + '/hr' +
                (m.basis !== 'hr' ? ' · charged by the ' + m.basis : ''),
          detail: { kind: 'plant', plant: m, hrs: hrs, rate: m.rate, by: pick(workers(), key + 'op', i).nm }
        });
      });
    } else if (cat === 'material') {
      var supply = supplyLines(cc);
      var nm2 = amount > 6000 ? 2 : 1;
      split(amount, [3, 1.6].slice(0, nm2)).forEach(function (amt, i) {
        if (amt <= 0) return;
        var line = supply.length ? pick(supply, key + 'm', i) : null;
        var unit = line ? line.unit : 'ea';
        var rate = line ? line.rate : 100;
        var sup = line && line.suppliers ? (line.suppliers.bill || line.suppliers.po || 'Supplier')
                                         : supplierFor(cc, 'bill');
        var qty = Math.round(amt / rate * 10) / 10;
        if (qty <= 0) return;
        var name = line ? line.desc : cc + ' materials';
        rows.push({
          cat: 'material', cc: cc, cost: amt, resource: name,
          meta: qty + ' ' + unit + ' @ $' + fmtRate(rate) + '/' + unit + ' · ' + sup,
          detail: {
            kind: 'material', nm: name, sup: sup, unit: unit, rate: rate, qty: qty,
            src: 'PO-' + (1000 + (seed(key + 'src') % 900)), srcType: 'PO', code: line ? line.code : null
          }
        });
      });
    } else if (cat === 'sub') {
      var sub = supplierFor(cc, 'po');
      rows.push({
        cat: 'sub', cc: cc, cost: amount, resource: sub,
        meta: cc + ' — progress claim',
        detail: {
          kind: 'sub', nm: sub, unit: 'claim', rate: amount, qty: 1,
          src: 'BILL-' + (3000 + (seed(key + 'b') % 900)), srcType: 'Bill'
        }
      });
    } else {
      var MISC = [
        { nm: 'Fuel & consumables', unit: 'fill' },
        { nm: 'Spoil disposal', unit: 'loads' },
        { nm: 'Survey set-out', unit: 'visit' },
        { nm: 'Traffic control permit', unit: 'ea' }
      ];
      var m2 = pick(MISC, key + 'x', 0);
      var sup2 = supplierFor(cc, 'dkt');
      rows.push({
        cat: 'misc', cc: cc, cost: amount, resource: m2.nm,
        meta: m2.nm + ' · ' + sup2,
        detail: {
          kind: 'misc', nm: m2.nm, sup: sup2, unit: m2.unit, rate: amount, qty: 1,
          src: 'BILL-' + (3300 + (seed(key + 'm') % 90)), srcType: 'Bill'
        }
      });
    }
    return rows;
  }

  function fmtRate(r) {
    return r >= 100 ? String(Math.round(r)) : String(Math.round(r * 100) / 100);
  }

  /* The whole ledger for the open claim period, keyed by date. */
  function ledger() {
    if (_cache.ledger) return _cache.ledger;
    var p = period(), days = workingDays(p), byDate = {};
    days.forEach(function (d) { byDate[d] = []; });

    costCentres().forEach(function (cc) {
      var pools = poolsFor(cc, p);
      if (!pools) return;
      Object.keys(pools).forEach(function (cat) {
        var total = pools[cat];
        if (total <= 0) return;
        var w = dayWeights(cc, cat, days);
        split(total, w).forEach(function (amt, i) {
          if (amt <= 0) return;
          detailRows(cc, cat, days[i], amt).forEach(function (r) {
            byDate[days[i]].push(r);
          });
        });
      });
    });

    _cache.ledger = { period: p, days: days, byDate: byDate };
    return _cache.ledger;
  }

  function dayTotal(isoDate) {
    return (ledger().byDate[isoDate] || []).reduce(function (a, r) { return a + r.cost; }, 0);
  }
  function monthTotal() {
    return ledger().days.reduce(function (a, d) { return a + dayTotal(d); }, 0);
  }

  /* The diary's day: the last working day with cost in the open period, so the
     diary always opens on a day that has something on it. */
  function diaryDate() {
    var l = ledger();
    for (var i = l.days.length - 1; i >= 0; i--) {
      if (l.byDate[l.days[i]].length) return l.days[i];
    }
    return l.days[l.days.length - 1] || l.period.start;
  }

  return {
    invalidate: invalidate, version: version, period: period, ledger: ledger,
    costCentres: costCentres, ccCode: ccCode, ccLabel: ccLabel,
    wbsTree: wbsTree, allocOptions: allocOptions, workers: workers, plant: plant,
    supplyLines: supplyLines, supplierFor: supplierFor,
    dayTotal: dayTotal, monthTotal: monthTotal, diaryDate: diaryDate,
    rowsFor: function (d) { return ledger().byDate[d] || []; },
    split: split, seed: seed, strip: strip
  };
})();

/* ══════════════════════════════════════════════════════════════════════════
   ADAPTERS — the two guest prototypes, fed from VDATA
   ══════════════════════════════════════════════════════════════════════════ */

/* ── Daily Cost Tracking ────────────────────────────────────────────────── */
function vdataCalendarData() {
  var l = VDATA.ledger(), out = {};
  Object.keys(l.byDate).forEach(function (d) {
    out[d] = l.byDate[d].map(function (r) {
      return {
        /* the calendar calls subcontract what the budget calls sub */
        cat: r.cat === 'sub' ? 'subcontract' : r.cat,
        resource: r.resource,
        cc: VDATA.ccLabel(r.cc),
        meta: r.meta,
        cost: r.cost
      };
    });
  });
  return out;
}

/* ── Site Diary ─────────────────────────────────────────────────────────── */
function vdataDiaryRows() {
  var d = VDATA.diaryDate(), rows = VDATA.rowsFor(d);
  var out = { labour: [], plant: [], materials: [], misc: [], miscEntries: [], deliveries: [], dockets: [] };
  var alloc = VDATA.allocOptions();

  function allocFor(cc, key, i) {
    var opts = alloc.filter(function (o) { return o.cc === cc; });
    var o = opts.length ? opts[(VDATA.seed(key) + i) % opts.length] : null;
    return [{ l: o ? o.l : cc, c: VDATA.ccLabel(cc), p: 100 }];
  }
  function clock(hrs, key) {
    var start = 7 + (VDATA.seed(key) % 2);                 /* 07:00 or 08:00 */
    var end = start + hrs + 0.5;                           /* + unpaid break */
    function hm(v) {
      var h = Math.floor(v), m = Math.round((v - h) * 60);
      return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
    }
    return { in: hm(start), out: hm(end), brk: '30',
             hrs: Math.floor(hrs) + 'h ' + String(Math.round((hrs % 1) * 60)).padStart(2, '0') + 'm' };
  }

  rows.forEach(function (r, i) {
    var dt = r.detail;
    if (dt.kind === 'labour') {
      var t = clock(dt.hrs, d + i);
      out.labour.push({
        who: dt.worker.nm, role: dt.worker.role, rate: dt.rate, allow: 0,
        in: t.in, out: t.out, brk: t.brk, hrs: t.hrs,
        alloc: allocFor(r.cc, d + 'l' + i, i),
        status: (VDATA.seed(d + dt.worker.id) % 3) === 0 ? 'pend' : 'app',
        cost: r.cost
      });
    } else if (dt.kind === 'plant') {
      out.plant.push({
        nm: dt.plant.nm, no: dt.plant.no, sup: dt.plant.sup, rate: dt.rate, by: dt.by,
        hrs: Math.floor(dt.hrs) + 'h ' + String(Math.round((dt.hrs % 1) * 60)).padStart(2, '0') + 'm',
        alloc: allocFor(r.cc, d + 'p' + i, i), cost: r.cost
      });
    } else if (dt.kind === 'material') {
      out.materials.push({
        id: dt.src, srcType: dt.srcType, src: dt.src, nm: dt.nm, sup: dt.sup,
        unit: dt.unit, rate: dt.rate, ordered: Math.round(dt.qty * 2.5), delivered: dt.qty,
        cc: r.cc
      });
      out.deliveries.push({
        time: ['08:10', '10:45', '13:20', '14:50'][i % 4], mat: dt.nm,
        src: dt.src, srcType: dt.srcType, sup: dt.sup, qty: dt.qty, unit: dt.unit
      });
    } else {
      out.misc.push({
        id: dt.src, srcType: dt.srcType, src: dt.src, nm: dt.nm,
        sup: dt.sup || dt.nm, unit: dt.unit, rate: dt.rate, ordered: 1, delivered: 1,
        cc: r.cc
      });
      out.miscEntries.push({
        time: ['09:30', '07:15', '15:05'][i % 3], mat: dt.nm, src: dt.src,
        srcType: dt.srcType, sup: dt.sup || dt.nm, qty: 1, unit: dt.unit
      });
    }
  });
  return out;
}

function vdataDiaryDateLabel() {
  var d = VDATA.diaryDate().split('-');
  return d[2] + '/' + d[1] + '/' + d[0];
}
