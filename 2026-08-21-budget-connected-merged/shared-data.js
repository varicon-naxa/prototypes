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

  var UNCODED = 'Unassigned';
  var _version = 0;          /* bumped whenever the base's cost data changes */
  var _cache = {};

  function invalidate() { _version++; _cache = {}; }
  function version() { return _version; }

  /* The base re-renders constantly; the budget itself changes rarely. Bumping
     the version on every render would throw away the diary's in-session edits
     for nothing, so the trigger is a fingerprint of the money, not the render. */
  var _print = null;
  function fingerprint() {
    var lines = liveLines(), n = lines.length, t = 0;
    lines.forEach(function (l) {
      COST_STREAMS.forEach(function (k) { t += (l[k] || 0); });
      t += (l.contract || 0) + (l.budget || 0);
    });
    return n + ':' + Math.round(t) + ':' + costCentres().join(',');
  }
  function refreshIfChanged() {
    var f;
    try { f = fingerprint(); } catch (e) { return; }
    if (f !== _print) { _print = f; invalidate(); }
  }

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
    try { return activeLines(); } catch (e) { return []; }
  }

  /* Cost centres actually carrying lines, in the base's own order.

     Only real cost centres count. A variation raised without one, and the
     base's own unassigned-cost line, are cost that has not been coded yet —
     the budget models that as uncoded and so does this. Inventing a cost
     centre called "VO-003" to hold it would put a number on the diary's
     allocation picker that no one could ever allocate to. */
  function isCoded(l) { return !!l.cc && COST_CENTRES.indexOf(l.cc) >= 0; }
  function costCentres() {
    var seen = {}, out = [];
    liveLines().forEach(function (l) {
      if (isCoded(l) && !seen[l.cc]) { seen[l.cc] = 1; out.push(l.cc); }
    });
    return out.length ? out : COST_CENTRES.slice();
  }
  function uncodedLines() { return liveLines().filter(function (l) { return !isCoded(l); }); }

  /* A stable CC-nnn code per cost centre — the diary shows codes, the budget
     does not, so they are minted here once and used by both tabs. */
  function ccCode(name) {
    var i = costCentres().indexOf(name);
    return 'CC-' + (i < 0 ? 900 : (i + 1) * 100);
  }
  function ccLabel(name) {
    return name === UNCODED ? UNCODED : ccCode(name) + ' ' + name;
  }

  /* The base's l1 › l2 › line hierarchy is exactly the diary's
     task › subtask › sub-subtask. */
  function wbsTree() {
    var l1s = [];
    liveLines().forEach(function (l) {
      if (!l.l1 || !isCoded(l)) return;
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
      if (!isCoded(l)) return;
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
  /* Units you can take delivery of. A budget line priced by the day or the
     week is a time charge, not a supply — reading its unit onto a delivery
     produced entries like "delivered 0.056 day", which is nonsense. */
  var DELIVERABLE = ['m³', 'm3', 'm²', 'm2', 'm', 't', 'kg', 'L', 'ea', 'no', 'lm', 'sheets', 'each'];
  function supplyLines(cc) {
    return liveLines().filter(function (l) {
      return l.cc === cc && l.rate > 0 && l.unit && DELIVERABLE.indexOf(l.unit) >= 0;
    });
  }
  function supplierFor(cc, kind) {
    var l = liveLines().filter(function (x) { return x.cc === cc && x.suppliers && x.suppliers[kind]; })[0];
    return (l && l.suppliers[kind]) || 'Supplier';
  }


  /* ── one labour row, as a shift ──────────────────────────────────────────
     A worker's day is a timesheet. The diary shows it as a labour row, the
     calendar shows it as a cost entry, and the Timesheet page shows it as a
     submitted timesheet — all three are this same row, so the clock times and
     the allocation are derived here once rather than per surface. */
  function labourShift(row, i) {
    var dt = row.detail, hrs = dt.hrs;
    var start = 7 + (seed(row.iso + dt.worker.id + i) % 2);   /* 07:00 or 08:00 */
    function hm(v) {
      var h = Math.floor(v), m = Math.round((v - h) * 60);
      return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
    }
    return {
      worker: dt.worker, rate: dt.rate, cost: row.cost, cc: row.cc,
      iso: row.iso, state: row.state,
      /* approved timesheet = actual cost, unapproved = tracked */
      approved: row.state === 'actual',
      inAt: hm(start), outAt: hm(start + hrs + 0.5), brk: 30,
      hoursDec: hrs,
      hours: Math.floor(hrs) + 'h ' + String(Math.round((hrs % 1) * 60)).padStart(2, '0') + 'm',
      alloc: allocFor(row.cc, row.iso + 'l' + i, i)
    };
  }

  function allocFor(cc, key, i) {
    var opts = allocOptions().filter(function (o) { return o.cc === cc; });
    var o = opts.length ? opts[(seed(key) + i) % opts.length] : null;
    return [{ l: o ? o.l : cc, c: ccLabel(cc), p: 100 }];
  }

  /* Whoever signs the crew's time off. The base has a site foreman; that is
     the approver rather than a name invented for this page. */
  function approver() {
    var crew = workers();
    var foreman = crew.filter(function (w) { return /foreman|supervisor/i.test(w.role); })[0];
    return foreman || crew[crew.length - 1];
  }

  /* ── weeks ──────────────────────────────────────────────────────────────
     The Timesheet page is a week at a time, Monday to Sunday. */
  function mondayOf(isoDate) {
    var d = new Date(isoDate + 'T00:00:00');
    var dow = d.getDay();                       /* 0 Sun .. 6 Sat */
    d.setDate(d.getDate() - ((dow + 6) % 7));
    return iso(d);
  }
  function addDays(isoDate, n) {
    var d = new Date(isoDate + 'T00:00:00');
    d.setDate(d.getDate() + n);
    return iso(d);
  }
  function weekDays(mon) {
    var out = [];
    for (var i = 0; i < 7; i++) out.push(addDays(mon, i));
    return out;
  }
  /* Every Monday that has labour in the open period, so the page can only ever
     land on a week with timesheets on it. */
  function weeksWithLabour() {
    var l = ledger(), seen = {}, out = [];
    l.days.forEach(function (d) {
      var hasLabour = l.byDate[d].some(function (r) {
        return !r.uncoded && r.detail.kind === 'labour';
      });
      if (!hasLabour) return;
      var m = mondayOf(d);
      if (!seen[m]) { seen[m] = 1; out.push(m); }
    });
    return out.sort();
  }
  /* The landing week: the last full week of the claim period that has time on
     it, so the page opens on something rather than on an empty grid. */
  function defaultWeek() {
    var w = weeksWithLabour();
    if (!w.length) return mondayOf(period().start);
    var p = period();
    var full = w.filter(function (m) { return addDays(m, 6) <= p.end; });
    return (full.length ? full : w)[(full.length ? full : w).length - 1];
  }

  /* Every timesheet in a week, one per worker-day. */
  function timesheetsForWeek(mon) {
    var days = weekDays(mon), out = [];
    days.forEach(function (d) {
      var rows = (ledger().byDate[d] || []).filter(function (r) {
        return !r.uncoded && r.detail.kind === 'labour';
      });
      rows.forEach(function (r, i) {
        r.iso = d;
        out.push(labourShift(r, i));
      });
    });
    return out;
  }


  /* ── timesheets entered on the Add Timesheet page ───────────────────────
     A timesheet the user enters is the source of labour cost, so saving one
     adds its cost to the budget line it was allocated against — that is the
     whole point of the merged prototype. But the ledger also spreads the
     budget's cost deterministically over the month, which would then count
     that money twice: once in the spread, once as the row the user entered.

     So an entered row is held explicitly and carved back out of the pool the
     spread draws from. Total cost still equals the budget's cost for the
     period, and the row lands on the day and worker it was entered against
     rather than wherever the spread would have put it. */
  var _entered = [];

  function enteredFor(cc, cat, state) {
    return _entered.reduce(function (a, e) {
      return a + ((e.cc === cc && e.cat === cat && e.state === state) ? e.cost : 0);
    }, 0);
  }

  function addTimesheet(entry) {
    _entered.push(entry);
    invalidate();
  }
  function enteredRows() { return _entered.slice(); }
  function clearEntered() { _entered = []; invalidate(); }

  /* The project. The base names it in the topbar rather than in a constant, so
     it is read once at load — the Timesheet page retitles that same heading,
     and reading it later would report the project as "Timesheet". */
  var _projectName = (function () {
    var h = document.querySelector('.topbar-left h1');
    var t = h ? h.textContent : '';
    var m = t.split('—');
    return (m.length > 1 ? m[m.length - 1] : t).trim() || 'Project';
  })();
  function projectName() { return _projectName; }

  /* Who signs a timesheet off. The crew's foreman, except for the foreman's
     own time — nobody approves their own timesheet — which goes up to whoever
     is logged in. */
  function approverFor(worker) {
    var crew = workers();
    var foreman = crew.filter(function (w) { return /foreman|supervisor/i.test(w.role); })[0];
    if (foreman && (!worker || worker.id !== foreman.id)) return foreman.nm;
    var me = document.querySelector('.user-name');
    return (me && me.textContent.trim()) || 'Project manager';
  }

  /* ── the ledger ─────────────────────────────────────────────────────── */

  /* Cost for one cost centre in one period, split the way the budget splits
     it. This is the pool a day's rows are drawn from — nothing is added to it
     and nothing is lost from it. */
  function poolsFor(cc, p, lineSet) {
    var lines = lineSet || liveLines().filter(function (l) { return l.cc === cc; });
    if (!lines.length) return null;
    var node = {};
    SUM_KEYS.forEach(function (k) { node[k] = 0; });
    lines.forEach(function (l) {
      var inPeriod = applyPeriod(l, [p.key]);
      SUM_KEYS.forEach(function (k) { node[k] += (inPeriod[k] || 0); });
    });
    /* Tracked and actual are kept apart all the way down to the row. The
       budget never adds them into one figure, so neither does the ledger —
       that is what lets a calendar entry and a diary row say which state they
       are in, in the same colours the overview uses. */
    var out = {};
    resourceBreakdown(node, cc).forEach(function (r) {
      var tr = Math.round(r.tracked || 0), ac = Math.round(r.actual || 0);
      /* what the user entered by hand is not also spread */
      tr = Math.max(0, tr - enteredFor(cc, r.cat.key, 'tracked'));
      ac = Math.max(0, ac - enteredFor(cc, r.cat.key, 'actual'));
      out[r.cat.key] = { tracked: tr, actual: ac };
    });
    return out;
  }

  /* ── the shared palette ─────────────────────────────────────────────────
     Both guests had their own hex values for the same five categories and
     their own idea of what a pending timesheet or a paid bill looks like.
     There is one source for both now: the budget's. */
  function stateColour(state) {
    var m = STATE_META[state];
    return m ? m.colour : '#94a3b8';
  }
  function stateTitle(state) {
    var m = STATE_META[state];
    return m ? m.title : state;
  }
  function catColour(key) {
    var k = key === 'subcontract' ? 'sub' : key;
    var c = RESOURCE_CATEGORIES.filter(function (x) { return x.key === k; })[0];
    return c ? c.colour : '#94a3b8';
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
  function detailRows(cc, cat, day, amount, state) {
    if (amount <= 0) return [];
    var key = cc + cat + day + state, rows = [];
    /* Tracked supply is a site docket against a PO; actual supply is a paid
       bill. Tracked labour is an unapproved timesheet; actual labour is an
       approved one. The state decides the document, not a coin toss. */
    /* The budget is explicit about which document carries which state:
       committed is a purchase order, tracked is a site docket matched to that
       order, actual is the paid bill. Tracked supply is therefore a docket —
       calling it a PO would put committed's colour on tracked cost. */
    var srcType = state === 'actual' ? 'Bill' : 'Docket';
    var srcPrefix = state === 'actual' ? 'BILL-' : 'DKT-';

    if (cat === 'labour') {
      var crew = workers();
      /* A day's labour on a cost centre is spread over as many of the crew as
         the money needs. Sizing the crew by a fixed threshold instead put one
         worker on a 12-hour shift whenever a cost centre had a big day. */
      var DAY_HOURS = 9, midRate = 70;
      var n = Math.max(1, Math.min(crew.length, Math.ceil(amount / (midRate * DAY_HOURS))));
      var weights = [];
      for (var wi = 0; wi < n; wi++) weights.push(3 - wi * (1.4 / Math.max(1, n)));
      split(amount, weights).forEach(function (amt, i) {
        if (amt <= 0) return;
        var w = pick(crew, key + 'w', i);
        var hrs = qtyOf(amt, w.rate);
        rows.push({
          cat: 'labour', cc: cc, cost: amt, resource: w.nm,
          meta: hrs + ' hrs @ $' + w.rate + '/hr',
          detail: { kind: 'labour', worker: w, hrs: hrs, rate: w.rate }
        });
      });
    } else if (cat === 'plant') {
      var fleet = plant();
      /* Machines are hired by the day; splitting keeps any one of them from
         reading as 20 hours on site. */
      var np = Math.max(1, Math.min(3, Math.ceil(amount / (120 * 9))));
      var pw = [];
      for (var pi = 0; pi < np; pi++) pw.push(3 - pi * 0.6);
      split(amount, pw).forEach(function (amt, i) {
        if (amt <= 0) return;
        var m = pick(fleet, key + 'p', i);
        var hrs = qtyOf(amt, m.rate);
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
        if (!line) { unit = 'ea'; rate = Math.max(25, Math.round(amt / 4)); }
        var sup = line && line.suppliers ? (line.suppliers.bill || line.suppliers.po || 'Supplier')
                                         : supplierFor(cc, 'bill');
        var qty = qtyOf(amt, rate);
        var name = line ? line.desc : cc + ' materials';
        rows.push({
          cat: 'material', cc: cc, cost: amt, resource: name,
          meta: qty + ' ' + unit + ' @ $' + fmtRate(rate) + '/' + unit + ' · ' + sup,
          detail: {
            kind: 'material', nm: name, sup: sup, unit: unit, rate: rate, qty: qty,
            src: srcPrefix + (1000 + (seed(key + 'src') % 900)), srcType: srcType,
            code: line ? line.code : null
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
          src: srcPrefix + (3000 + (seed(key + 'b') % 900)), srcType: srcType
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
          src: srcPrefix + (3300 + (seed(key + 'm') % 90)), srcType: srcType
        }
      });
    }
    return rows;
  }

  /* Quantity is back-solved from the money. One decimal reads naturally for
     hours and tonnes, but a small amount against a big rate rounds to zero at
     that precision — and a dropped row is dropped money, which would put the
     calendar out against the budget. So the precision follows the number. */
  function qtyOf(amount, rate) {
    if (!rate) return 0;
    var q = amount / rate;
    if (q >= 1) return Math.round(q * 10) / 10;
    if (q >= 0.1) return Math.round(q * 100) / 100;
    return Math.max(0.01, Math.round(q * 1000) / 1000);
  }

  function fmtRate(r) {
    return r >= 100 ? String(Math.round(r)) : String(Math.round(r * 100) / 100);
  }

  /* The whole ledger for the open claim period, keyed by date. */
  function ledger() {
    if (_cache.ledger) return _cache.ledger;
    var p = period(), days = workingDays(p), byDate = {};
    days.forEach(function (d) { byDate[d] = []; });

    function spread(cc, pools, uncoded) {
      if (!pools) return;
      Object.keys(pools).forEach(function (cat) {
        ['tracked', 'actual'].forEach(function (state) {
          var total = pools[cat][state];
          if (total <= 0) return;
          var w = dayWeights(cc, cat + state, days);
          split(total, w).forEach(function (amt, i) {
            if (amt <= 0) return;
            var group = detailRows(cc, cat, days[i], amt, state);
            /* Whatever the row-level rounding did, the group still has to add
               back to the money it was given. Without this the calendar drifts
               a few hundred dollars off the budget and there is no way to see
               from the page which side is wrong. */
            var got = group.reduce(function (a, r) { return a + r.cost; }, 0);
            if (group.length && got !== amt) group[group.length - 1].cost += amt - got;
            group.forEach(function (r) {
              r.state = state;
              if (uncoded) { r.uncoded = true; r.cc = UNCODED; }
              byDate[days[i]].push(r);
            });
          });
        });
      });
    }

    costCentres().forEach(function (cc) { spread(cc, poolsFor(cc, p), false); });

    /* Cost the budget has not coded to a cost centre yet. It is real money and
       it belongs on the calendar — that is what its Unassigned tab is for — but
       it has no allocation, so the diary does not show it. */
    var un = uncodedLines();
    if (un.length) spread(UNCODED, poolsFor(UNCODED, p, un), true);

    _entered.forEach(function (e) {
      if (!byDate[e.iso]) byDate[e.iso] = [];
      byDate[e.iso].push(e.row);
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
      var coded = l.byDate[l.days[i]].filter(function (r) { return !r.uncoded; });
      if (coded.length) return l.days[i];
    }
    return l.days[l.days.length - 1] || l.period.start;
  }

  return {
    invalidate: invalidate, version: version, period: period, ledger: ledger,
    refreshIfChanged: refreshIfChanged, fingerprint: fingerprint,
    costCentres: costCentres, ccCode: ccCode, ccLabel: ccLabel,
    wbsTree: wbsTree, allocOptions: allocOptions, workers: workers, plant: plant,
    supplyLines: supplyLines, supplierFor: supplierFor,
    stateColour: stateColour, stateTitle: stateTitle, catColour: catColour,
    labourShift: labourShift, allocFor: allocFor, approver: approver,
    mondayOf: mondayOf, addDays: addDays, weekDays: weekDays,
    weeksWithLabour: weeksWithLabour, defaultWeek: defaultWeek,
    timesheetsForWeek: timesheetsForWeek, iso: iso,
    addTimesheet: addTimesheet, enteredRows: enteredRows,
    clearEntered: clearEntered, projectName: projectName,
    approverFor: approverFor,
    uncodedLines: uncodedLines, isCoded: isCoded, UNCODED: UNCODED,
    uncodedCount: function () {
      var l = ledger(), n = 0;
      l.days.forEach(function (d) {
        l.byDate[d].forEach(function (r) { if (r.uncoded) n++; });
      });
      return n;
    },
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
        cost: r.cost,
        state: r.state
      };
    });
  });
  return out;
}

/* ── Site Diary ─────────────────────────────────────────────────────────── */
function vdataDiaryRows() {
  var d = VDATA.diaryDate();
  var rows = VDATA.rowsFor(d).filter(function (r) { return !r.uncoded; });
  var out = { labour: [], plant: [], materials: [], misc: [], miscEntries: [], deliveries: [], dockets: [] };
  var alloc = VDATA.allocOptions();

  var allocFor = VDATA.allocFor;

  rows.forEach(function (r, i) {
    var dt = r.detail;
    if (dt.kind === 'labour') {
      /* the same shift the Timesheet page shows for this worker-day */
      r.iso = d;
      var t = VDATA.labourShift(r, i);
      out.labour.push({
        who: dt.worker.nm, role: dt.worker.role, rate: dt.rate, allow: 0,
        in: t.inAt, out: t.outAt, brk: String(t.brk), hrs: t.hours,
        alloc: t.alloc,
        status: t.approved ? 'app' : 'pend',
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
