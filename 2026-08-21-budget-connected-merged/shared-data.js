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
    return n + ':' + Math.round(t) + ':' + costCentres().join(',') +
           ':' + structure();
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

  /* ── how this project tracks ────────────────────────────────────────────
     The base's own switch: a cost-centre project codes cost to the cost
     centre and never to a line item; a WBS project budgets every line
     individually, so time goes against a task. Both flows exist and the
     project decides which one you get. */
  function structure() {
    try {
      if (typeof projectType === 'undefined') return 'cc';
      return projectType === 'wbs' ? 'wbs' : 'cc';   /* dayworks codes to a cc */
    } catch (e) { return 'cc'; }
  }
  function structureLabel() {
    return structure() === 'wbs' ? 'Task' : 'Cost centre';
  }
  function structureNote() {
    try { return PROJECT_TYPES[projectType].note; } catch (e) { return ''; }
  }

  /* What time can be booked against, in this project's terms. */
  function allocTargets() {
    if (structure() === 'wbs') {
      return allocOptions().map(function (o) {
        return { value: o.l, label: o.l, sub: o.c, cc: o.cc, code: o.code };
      });
    }
    return costCentres().map(function (cc) {
      return { value: cc, label: ccLabel(cc), sub: '', cc: cc, code: null };
    });
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
    /* On a cost-centre project the allocation IS the cost centre; showing a
       WBS path there would name a level the project does not track. */
    if (structure() !== 'wbs') return [{ l: ccLabel(cc), c: ccLabel(cc), p: 100 }];
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

  /* ── suppliers ──────────────────────────────────────────────────────────
     Every firm the budget names on a purchase order, a site docket, a bill or
     a cost-plus invoice. The list is therefore exactly who this job buys from,
     and it grows when the budget does.

     What a supplier supplies is derived too: a supplier appearing against a
     cost centre supplies that cost centre's dominant category, so the plant
     hire firms come out as plant and the concrete suppliers as material,
     without a hand-written mapping.

     The one thing here that is NOT derived is the chart of accounts — the
     budget has no concept of one. ACCOUNT_CODES below is new data. */
  var ACCOUNT_CODES = [
    { code: '200', name: 'Sales' },
    { code: '260', name: 'Other revenue' },
    { code: '300', name: 'Materials purchased' },
    { code: '310', name: 'Aggregates and road base' },
    { code: '320', name: 'Concrete and masonry' },
    { code: '330', name: 'Steel and reinforcement' },
    { code: '340', name: 'Pipes and drainage products' },
    { code: '350', name: 'Timber and formwork' },
    { code: '400', name: 'Plant hire — external' },
    { code: '410', name: 'Plant running costs' },
    { code: '420', name: 'Fuel and oil' },
    { code: '430', name: 'Plant repairs and maintenance' },
    { code: '440', name: 'Small tools' },
    { code: '500', name: 'Subcontractor costs' },
    { code: '510', name: 'Traffic management' },
    { code: '520', name: 'Survey and set-out' },
    { code: '530', name: 'Testing and inspection' },
    { code: '600', name: 'Contract labour' },
    { code: '610', name: 'Wages and salaries' },
    { code: '620', name: 'Superannuation' },
    { code: '630', name: 'Site allowances' },
    { code: '700', name: 'Site consumables' },
    { code: '710', name: 'Permits and fees' },
    { code: '720', name: 'Professional fees' },
    { code: '730', name: 'Insurance' },
    { code: '740', name: 'Waste and spoil disposal' },
    { code: '800', name: 'Office and administration' },
    { code: '810', name: 'Motor vehicle expenses' }
  ];
  function accountCodes() { return ACCOUNT_CODES.slice(); }
  /* Every account, for every category. Which of a client's accounts suits
     which category is the client's call — we have no basis for filtering it,
     and guessing wrong hides the account they actually wanted. */
  function accountCodesFor(cat) { return ACCOUNT_CODES.slice(); }
  function accountName(code) {
    var a = ACCOUNT_CODES.filter(function (x) { return x.code === code; })[0];
    return a ? a.code + ' · ' + a.name : '';
  }

  function resourceCategories() {
    return RESOURCE_CATEGORIES.map(function (c) {
      return { key: c.key, name: c.name, colour: c.colour };
    });
  }

  /* The dominant category of a cost centre, from the budget's own build-up
     mix — what a supplier serving that cost centre is most likely selling. */
  function dominantCategory(cc) {
    var mix = (typeof RESOURCE_MIX !== 'undefined' && RESOURCE_MIX[cc]) || DEFAULT_MIX;
    var best = null, bestV = -1;
    RESOURCE_CATEGORIES.forEach(function (c) {
      var v = mix[c.key] || 0;
      /* Only the ABN share of labour is bought from a supplier; the rest is
         payroll, which no supplier invoices for. */
      if (c.key === 'labour') v = v * (mix.abn === undefined ? DEFAULT_MIX.abn : mix.abn);
      if (v > bestV) { bestV = v; best = c.key; }
    });
    return best || 'material';
  }

  var _supplierEdits = {};      /* what the user changed or added in-session */

  function suppliersRaw() {
    var byName = {};
    function note(name, cc) {
      if (!name || name === 'various' || name === 'Payroll journal') return;
      var e = byName[name] || (byName[name] = { name: name, ccs: {} });
      /* The cost centres a supplier appears against are recorded, but no
         category is inferred from them. What a supplier supplies is the
         client's to state, not ours to guess — and guessing it put a traffic
         management firm under plant and material. */
      if (cc) e.ccs[cc] = 1;
    }
    liveLines().forEach(function (l) {
      if (!l.suppliers) return;
      ['po', 'dkt', 'bill'].forEach(function (k) { note(l.suppliers[k], l.cc); });
    });
    try {
      costPlusInvoices.forEach(function (inv) { note(inv.supplier, null); });
    } catch (e) { /* dayworks not loaded */ }
    return Object.keys(byName).map(function (n) { return byName[n]; });
  }

  /* Contact detail. Xero is the accounting substrate, so a supplier synced
     from it arrives with the accounting record attached; one created in
     Varicon starts bare and fills out as bills arrive. That is why the
     Varicon-sourced rows carry so many dashes — it is the state, not a gap in
     the mock. */
  function supplierDetail(e) {
    var h = seed(e.name);
    var fromXero = (h % 10) > 1;              /* most arrive with the ledger */
    var slug = e.name.toLowerCase().replace(/[^a-z]+/g, '').slice(0, 12);
    var streets = ['Wilde Rd', 'Korsman Dr', 'Bell Street', 'Pring St', 'Kessels Rd'];
    var towns = ['HOLYOAKE', 'BRISBANE, QLD', 'TOOWOOMBA, QLD', 'SOUTHBANK, VIC', 'GATTON, QLD'];
    var firsts = ['J. Hendricks', 'M. Falzon', 'R. Ngata', 'A. Kaur', 'D. Moreau'];

    return {
      name: e.name,
      id: 'SUP-' + (1000 + (h % 8000)),
      abn: fromXero && (h % 3) ? String(40 + (h % 50)) + ' ' +
           String(100 + (h % 900)) + ' ' + String(100 + ((h >> 3) % 900)) + ' ' +
           String(100 + ((h >> 6) % 900)) : '',
      address: fromXero ? (1 + (h % 200)) + ' ' + streets[h % streets.length] + ', ' +
               towns[(h >> 2) % towns.length] + ', Australia' : '',
      email: fromXero ? 'accounts@' + slug + '.com.au' : '',
      phone: fromXero && (h % 4) === 0 ? '07 ' + (3000 + (h % 900)) + ' ' + (1000 + ((h >> 4) % 900)) : '',
      contact: (h % 5) === 0 ? firsts[h % firsts.length] : '',
      updated: (function () {
        var d = new Date('2026-03-23T00:00:00');
        d.setDate(d.getDate() + (h % 150));
        return String(d.getDate()).padStart(2, '0') + '/' +
               String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
      })(),
      source: fromXero ? 'xero' : 'varicon',
      /* Empty until the client fills them in. */
      cats: [],
      codes: {},
      ccs: Object.keys(e.ccs)
    };
  }

  function suppliers() {
    var out = suppliersRaw().map(supplierDetail);
    Object.keys(_supplierEdits).forEach(function (name) {
      var edit = _supplierEdits[name];
      var found = out.filter(function (s) { return s.name === name; })[0];
      if (found) {
        Object.keys(edit).forEach(function (k) { found[k] = edit[k]; });
      } else {
        out.push(edit);
      }
    });
    return out.sort(function (a, b) { return a.name.localeCompare(b.name); });
  }

  function saveSupplier(rec) {
    _supplierEdits[rec.name] = rec;
    invalidate();
  }

  /* What a bill needs to know before it can be coded: does this supplier have
     an account for the category being billed? Asked at the bill, not before —
     an incomplete supplier record is normal until someone buys something in a
     category they have not set up yet. */
  function supplierByName(name) {
    return suppliers().filter(function (s) { return s.name === name; })[0] || null;
  }
  function billCodingGap(name, cat) {
    var s = supplierByName(name);
    /* The accounts valid for this category come back whatever the gap, so the
       bill can offer the fix in place instead of sending the user off to the
       supplier record and losing the bill they were coding. */
    var options = accountCodesFor(cat);
    if (!s) return { missing: 'supplier', cat: cat, supplier: null, options: options };
    if ((s.cats || []).indexOf(cat) < 0) {
      return { missing: 'category', cat: cat, supplier: s, options: options };
    }
    if (!((s.codes || {})[cat] || []).length) {
      return { missing: 'code', cat: cat, supplier: s, options: options };
    }
    return { missing: null, cat: cat, supplier: s, options: options, codes: s.codes[cat] };
  }

  /* Apply the fix. Adds the category if it was never set up and merges the
     accounts in, so coding one bill teaches the supplier record for the next
     one. Flag and let them proceed — the same way the rest of the product
     handles an unmet condition. */
  function addSupplierMapping(name, cat, codes) {
    var s = supplierByName(name);
    if (!s) return null;
    var next = JSON.parse(JSON.stringify(s));
    next.cats = (next.cats || []).slice();
    if (next.cats.indexOf(cat) < 0) next.cats.push(cat);
    next.codes = next.codes || {};
    var have = (next.codes[cat] || []).slice();
    [].concat(codes || []).forEach(function (c) {
      if (c && have.indexOf(c) < 0) have.push(c);
    });
    next.codes[cat] = have;
    saveSupplier(next);
    return next;
  }

  /* A supplier with a resource type but no account code for it cannot have a
     bill in that category coded. */
  function unmappedCats(s) {
    return (s.cats || []).filter(function (c) {
      var v = (s.codes || {})[c];
      return !v || !v.length;
    });
  }
  /* Total accounts mapped across every category this supplier supplies. */
  function codeCount(s) {
    return Object.keys(s.codes || {}).reduce(function (a, k) {
      return a + ((s.codes[k] || []).length);
    }, 0);
  }

  /* ── purchase orders ────────────────────────────────────────────────────
     The base already raises POs against every budget line that carries
     committed cost. Those are the orders a hired machine can be linked to,
     so the list is real rather than a set of invented references. */
  function purchaseOrders() {
    var out = [];
    liveLines().forEach(function (l) {
      if (!isCoded(l)) return;
      var pos;
      try { pos = poRegister(l, l.code); } catch (e) { return; }
      (pos || []).forEach(function (p) {
        out.push({
          ref: p.ref, supplier: p.supplier, raised: p.raised, open: p.open,
          status: p.status, cc: l.cc, raisedOn: p.raisedOn
        });
      });
    });
    /* one row per reference — the same order can back several lines */
    var seen = {};
    return out.filter(function (p) {
      if (seen[p.ref]) return false;
      seen[p.ref] = 1;
      return true;
    });
  }

  /* Orders raised with a supplier that hires plant. A machine on hire is
     linked to one of these. */
  function plantPurchaseOrders() {
    return purchaseOrders().filter(function (p) {
      return /hire|plant|equipment|rents/i.test(p.supplier);
    });
  }

  /* ── what a hire period costs per day and per hour ──────────────────────
     Plant hire is written by the period — a month, a week — and the job wants
     it per day or per hour. Working time, not calendar time: a month of hire
     is four weeks of five days, and a day on site is eight hours. */
  var HIRE_DAYS = { month: 20, week: 5, day: 1 };
  var HOURS_PER_DAY = 8;

  function hireDayRate(rate, period) {
    if (period === 'hr') return (rate || 0) * HOURS_PER_DAY;
    return (rate || 0) / (HIRE_DAYS[period] || 1);
  }
  function hireHourRate(rate, period) {
    if (period === 'hr') return rate || 0;
    return hireDayRate(rate, period) / HOURS_PER_DAY;
  }

  /* The rate the job is actually charged, in the machine's own charge basis. */
  function chargeRate(e) {
    if (!e) return 0;
    if (!e.owned) {
      return e.chargeBasis === 'hr'
        ? hireHourRate(e.hireRate, e.hirePeriod)
        : hireDayRate(e.hireRate, e.hirePeriod);
    }
    /* owned plant already carries its own rate and unit */
    return e.unit === 'hr' && e.chargeBasis === 'day' ? (e.rate || 0) * HOURS_PER_DAY
         : e.unit === 'day' && e.chargeBasis === 'hr' ? (e.rate || 0) / HOURS_PER_DAY
         : (e.rate || 0);
  }

  /* What one day on site costs, given hours worked — the two rules applied in
     order. Returns the charge and which rule set it, so the page can say why. */
  function dayCharge(e, hoursWorked, stoodDown) {
    var basis = e.chargeBasis || (e.unit === 'hr' ? 'hr' : 'day');
    var rate = chargeRate(e);

    if (stoodDown && e.standDown) {
      /* Stand-down is a fact about a DAY — the machine sat on site and did not
         work — so it is a share of the day rate whatever basis the job is
         charged on. Taking a percentage of the hourly rate would price a
         rained-off day at half an hour. */
      var dayRate = e.owned
        ? (e.unit === 'hr' ? e.rate * 8 : e.unit === 'day' ? e.rate : e.rate / 5)
        : hireDayRate(e.hireRate, e.hirePeriod);
      var sd = dayRate * ((e.standDownPct || 0) / 100);
      return { amount: Math.round(sd), rule: 'stand-down',
               note: (e.standDownPct || 0) + '% of the ' + Math.round(dayRate) +
                     ' day rate — on site, not worked' };
    }
    if (basis === 'day') {
      /* a day is a day: any work at all takes the day rate */
      return { amount: Math.round(rate), rule: 'day',
               note: 'charged by the day' };
    }
    var min = e.minHire || 0;
    var billed = Math.max(hoursWorked || 0, min);
    return {
      amount: Math.round(rate * billed),
      rule: billed > (hoursWorked || 0) ? 'minimum' : 'actual',
      note: billed > (hoursWorked || 0)
        ? (hoursWorked || 0) + ' hrs worked, charged at the ' + min + ' hr minimum'
        : billed + ' hrs at $' + Math.round(rate) + '/hr'
    };
  }

  /* ── stand-down, recorded per machine per day ───────────────────────────
     A machine on site and not worked. The diary is where it is recorded; the
     equipment register holds what it costs. */
  var _stoodDown = {};
  function standDownKey(iso, id) { return iso + '|' + id; }
  function isStoodDown(iso, id) { return !!_stoodDown[standDownKey(iso, id)]; }
  function setStoodDown(iso, id, on) {
    if (on) _stoodDown[standDownKey(iso, id)] = 1;
    else delete _stoodDown[standDownKey(iso, id)];
  }

  /* Every machine on the project for a given day, with what it was doing.
     Machines with no hours are the point — an idle machine on hire still
     costs, and a diary that hides it cannot account for the day. */
  function plantRoster(iso) {
    var booked = {};
    (ledger().byDate[iso] || []).forEach(function (r) {
      if (r.uncoded || !r.detail || r.detail.kind !== 'plant') return;
      var id = r.detail.plant.id || r.detail.plant.no;
      var b = booked[id] || (booked[id] = { hrs: 0, cost: 0, by: [], cc: r.cc, row: r });
      b.hrs += r.detail.hrs || 0;
      b.cost += r.cost || 0;
      if (r.detail.by && b.by.indexOf(r.detail.by) < 0) b.by.push(r.detail.by);
    });

    return equipment().map(function (e) {
      var b = booked[e.id];
      var down = isStoodDown(iso, e.id);
      var charge = null;
      if (!b && down) {
        /* priced by the register's own rule, so the two cannot disagree */
        charge = dayCharge(e, 0, true);
      }
      return {
        eqId: e.id, nm: e.name, no: e.id, sup: e.owned ? e.company : e.company,
        owned: e.owned,
        /* The table shows hours, so the rate beside them has to be hourly.
           A machine priced by the day or the week was showing its period rate
           under an /hr heading — $1,160/hr for a $1,160/day excavator. */
        rate: Math.round(e.owned
          ? (e.unit === 'hr' ? e.rate : e.unit === 'day' ? e.rate / 8 : e.rate / 38)
          : hireHourRate(e.hireRate, e.hirePeriod)),
        by: b ? b.by.join(', ') : '',
        hrsDec: b ? Math.round(b.hrs * 10) / 10 : 0,
        cost: b ? b.cost : (charge ? charge.amount : 0),
        cc: b ? b.cc : '',
        status: b ? 'working' : (down ? 'standdown' : 'offsite'),
        standDownSet: !!e.standDown,
        standDownNote: charge ? charge.note : ''
      };
    });
  }

  /* ── equipment registry ─────────────────────────────────────────────────
     The base's PLANT_FLEET is the register: the machines this job charges to
     itself. Each carries its own cost rate and the basis it is charged on,
     which is exactly the cost rate and operating unit the register asks for.

     The meter reading is the hours the ledger has actually booked against the
     machine, so a machine that has not worked reads zero rather than carrying
     an invented odometer.

     Everything the base has no opinion on — plant manager, next service, make,
     model, serial — is left blank. It is the client's to fill in. */
  function orgName() {
    var el = document.querySelector('.sidebar-org span');
    return (el && el.textContent.trim()) || 'Company';
  }

  /* The machine's type, read off its name. The product keeps an Asset Type
     list; this is the nearest honest stand-in for one. */
  function plantType(name) {
    var n = String(name).toLowerCase();
    if (n.indexOf('excavator') >= 0) return 'Excavators';
    if (n.indexOf('tipper') >= 0 || n.indexOf('truck') >= 0) return 'Trucks';
    if (n.indexOf('roller') >= 0) return 'Compaction';
    if (n.indexOf('bobcat') >= 0 || n.indexOf('skid') >= 0) return 'Skid Steers';
    if (n.indexOf('dozer') >= 0) return 'Dozers';
    if (n.indexOf('cart') >= 0 || n.indexOf('water') >= 0) return 'Water Trucks';
    return 'Miscellaneous';
  }

  /* Hours booked against a machine across the ledger — the meter movement this
     job is responsible for. */
  function plantHours(id) {
    var l = ledger(), total = 0;
    l.days.forEach(function (d) {
      (l.byDate[d] || []).forEach(function (r) {
        if (r.detail && r.detail.kind === 'plant' && r.detail.plant &&
            r.detail.plant.id === id) {
          total += r.detail.hrs || 0;
        }
      });
    });
    return Math.round(total * 10) / 10;
  }

  var _equipEdits = {};

  function equipment() {
    var out = PLANT_FLEET.map(function (m) {
      return {
        id: m.id,
        name: m.name,
        type: plantType(m.name),
        owned: true,                    /* PLANT_FLEET is plant the job owns */
        company: orgName(),
        status: 'Active',
        /* One rate per machine — what it costs this job to run it. The base
           also keeps a wet hire rate (machine plus operator on one figure) but
           that is a dayworks charge-out, not the machine's cost, and an
           operator's time is a timesheet. It stays out of the register. */
        rate: m.rate,
        unit: m.basis,
        /* What the machine charges out at, on its own, per hour. A default:
           a project that maps its own dayworks rate to this machine wins. */
        chargeOut: (function () {
          try { var d = dryHireFor(m.id); return d ? d.rate : 0; } catch (e) { return 0; }
        })(),
        /* Owned plant charges at its own rate. The hire fields below only
           apply to a machine on hire, and are the client's to set. */
        poRef: '', hireRate: 0, hirePeriod: 'month',
        chargeBasis: m.basis === 'hr' ? 'hr' : 'day',
        minHire: 0,
        /* Stand-down applies to owned plant too: a machine the company owns
           still ties up capital and an operator when it sits in the rain, and
           the job wears a reduced charge rather than nothing. */
        standDown: true, standDownPct: 50,
        meterType: 'hr',
        meter: plantHours(m.id),
        /* the client's to fill in */
        nextService: '', plantManager: '', image: '',
        manufacturer: '', year: '', model: '', vin: '', serial: '', plate: '',
        weight: '', power: '', bucket: '', reach: '', dimension: '',
        multiProject: false, attachments: [], forms: [], notes: ''
      };
    });
    Object.keys(_equipEdits).forEach(function (id) {
      var e = _equipEdits[id];
      var found = out.filter(function (x) { return x.id === id; })[0];
      if (found) Object.keys(e).forEach(function (k) { found[k] = e[k]; });
      else out.push(e);
    });
    return out;
  }

  function saveEquipment(rec) {
    _equipEdits[rec.id] = rec;
    invalidate();
  }
  function equipmentById(id) {
    return equipment().filter(function (e) { return e.id === id; })[0] || null;
  }

  /* The resources a machine's operating cost can be mapped to. The base's
     plant fleet is the resource library, so it is the list. */
  function plantResources() {
    return PLANT_FLEET.map(function (m) {
      return { id: m.id, name: m.name, unit: m.basis, rate: m.rate };
    });
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
    structure: structure, structureLabel: structureLabel,
    structureNote: structureNote, allocTargets: allocTargets,
    mondayOf: mondayOf, addDays: addDays, weekDays: weekDays,
    weeksWithLabour: weeksWithLabour, defaultWeek: defaultWeek,
    timesheetsForWeek: timesheetsForWeek, iso: iso,
    addTimesheet: addTimesheet, enteredRows: enteredRows,
    clearEntered: clearEntered, projectName: projectName,
    suppliers: suppliers, saveSupplier: saveSupplier,
    equipment: equipment, saveEquipment: saveEquipment,
    equipmentById: equipmentById, plantResources: plantResources,
    plantHours: plantHours, plantType: plantType, orgName: orgName,
    plantRoster: plantRoster, isStoodDown: isStoodDown,
    setStoodDown: setStoodDown,
    purchaseOrders: purchaseOrders, plantPurchaseOrders: plantPurchaseOrders,
    chargeRate: chargeRate, dayCharge: dayCharge,
    hireDayRate: hireDayRate, hireHourRate: hireHourRate,
    accountCodes: accountCodes, accountCodesFor: accountCodesFor,
    accountName: accountName, resourceCategories: resourceCategories,
    unmappedCats: unmappedCats, codeCount: codeCount,
    supplierByName: supplierByName, billCodingGap: billCodingGap,
    addSupplierMapping: addSupplierMapping,
    dominantCategory: dominantCategory,
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
      /* plant comes from the roster below, so every machine appears */
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
  /* Every machine on the project, not only the ones that worked. */
  out.plant = VDATA.plantRoster(d).map(function (p, i) {
    var hrs = p.hrsDec
      ? Math.floor(p.hrsDec) + 'h ' + String(Math.round((p.hrsDec % 1) * 60)).padStart(2, '0') + 'm'
      : '';
    return {
      eqId: p.eqId, nm: p.nm, no: p.no, sup: p.sup, rate: p.rate,
      by: p.by, hrs: hrs, cost: p.cost, status: p.status,
      standDownSet: p.standDownSet, standDownNote: p.standDownNote,
      alloc: p.cc ? VDATA.allocFor(p.cc, d + 'p' + i, i) : []
    };
  });

  return out;
}

/* Marking a machine stood down for the day. Named sd* so it sits with the
   diary's own functions, which the merge prefixes that way. */
function sdToggleStandDown(eqId) {
  var d = VDATA.diaryDate();
  VDATA.setStoodDown(d, eqId, !VDATA.isStoodDown(d, eqId));
  rows.plant = vdataDiaryRows().plant;
  renderPlant();
}

function vdataDiaryDateLabel() {
  var d = VDATA.diaryDate().split('-');
  return d[2] + '/' + d[1] + '/' + d[0];
}
