/* ══════════════════════════════════════════════════════════════════════════
   Timesheet — the list, and the add flow.

   Both read the same ledger the calendar and the diary read, so a timesheet
   here, a labour row on the diary and a cost entry on the calendar are one
   record shown three ways.
   ══════════════════════════════════════════════════════════════════════════ */

var TS = {
  week: null,           /* Monday of the week on screen */
  tab: 'timesheet',
  page: 1,
  collapsed: {},        /* day groups folded shut */
  /* add flow */
  step: 1,
  date: null,
  project: '',
  multi: null,
  workers: [],
  allocs: [],
  allow: [],
  equip: [],
  open: {}              /* which optional sections are unfolded */
};

function tsHM(dec) {
  var h = Math.floor(dec), m = Math.round((dec - h) * 60);
  return h + 'h ' + String(m).padStart(2, '0') + 'm';
}
function tsHM2(dec) {
  var h = Math.floor(dec), m = Math.round((dec - h) * 60);
  return h + 'H ' + m + 'M';
}
function tsMoney(v) { return '$' + Math.round(v || 0).toLocaleString('en-AU'); }
function tsInitials(n) {
  return String(n).replace(/[^A-Za-z. ]/g, '').split(/[ .]+/).filter(Boolean)
    .slice(0, 2).map(function (x) { return x[0].toUpperCase(); }).join('');
}
function tsAmPm(hhmm) {
  var p = String(hhmm).split(':'), h = +p[0], m = p[1];
  var ap = h >= 12 ? 'PM' : 'AM', h12 = h % 12 === 0 ? 12 : h % 12;
  return String(h12).padStart(2, '0') + ':' + m + ' ' + ap;
}
function tsDayLabel(iso) {
  var d = new Date(iso + 'T00:00:00');
  var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var mons = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return days[d.getDay()] + ', ' + d.getDate() + ' ' + mons[d.getMonth()];
}
function tsShort(iso) {
  var p = iso.split('-');
  return p[2] + '/' + p[1] + '/' + p[0];
}
function tsDow(iso) {
  var d = new Date(iso + 'T00:00:00');
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
}

/* ════════════════════════════════ LIST ════════════════════════════════ */

function tsSyncData() {
  if (TS.week === null) TS.week = VDATA.defaultWeek();
  var sel = document.getElementById('tsProjectLabel');
  if (sel) sel.textContent = VDATA.projectName();
  tsRender();
}

function tsStepWeek(delta) {
  var weeks = VDATA.weeksWithLabour();
  var i = weeks.indexOf(TS.week);
  if (i < 0) { TS.week = VDATA.defaultWeek(); i = weeks.indexOf(TS.week); }
  var next = i + delta;
  if (next < 0 || next >= weeks.length) return;   /* nothing there; stay put */
  TS.week = weeks[next];
  TS.page = 1;
  tsRender();
}

function tsSetTab(el, tab) {
  TS.tab = tab;
  document.querySelectorAll('#pageTimesheet .ts-tab').forEach(function (t) {
    t.classList.toggle('active', t === el);
  });
  tsRender();
}

function tsToggleGroup(iso) {
  TS.collapsed[iso] = !TS.collapsed[iso];
  tsRender();
}

function tsRender() {
  if (TS.week === null) TS.week = VDATA.defaultWeek();
  var sheets = VDATA.timesheetsForWeek(TS.week);
  var q = (document.getElementById('tsSearch') || {}).value || '';
  if (q.trim()) {
    var needle = q.trim().toLowerCase();
    sheets = sheets.filter(function (s) {
      return (s.worker.nm + ' ' + s.worker.role + ' ' + s.cc + ' ' +
              (s.alloc[0] ? s.alloc[0].l : '')).toLowerCase().indexOf(needle) >= 0;
    });
  }

  /* week label + arrow state */
  var mon = TS.week, sun = VDATA.addDays(mon, 6);
  var lbl = document.getElementById('tsWeekLabel');
  if (lbl) lbl.textContent = tsDow(mon) + ' ' + tsShort(mon) + ' - ' + tsDow(sun) + ' ' + tsShort(sun);
  var weeks = VDATA.weeksWithLabour(), wi = weeks.indexOf(mon);
  var arrows = document.querySelectorAll('#pageTimesheet .ts-week-arrow');
  if (arrows.length === 2) {
    arrows[0].classList.toggle('off', wi <= 0);
    arrows[1].classList.toggle('off', wi < 0 || wi >= weeks.length - 1);
  }

  /* ── tiles ──
     Approved is actual cost, unapproved is tracked. Payroll locked, rejected
     and resubmitted have no equivalent in the budget model, so they read zero
     rather than being invented. */
  var approved = sheets.filter(function (s) { return s.approved; });
  var unapproved = sheets.filter(function (s) { return !s.approved; });
  var workers = {};
  sheets.forEach(function (s) { workers[s.worker.id] = 1; });
  var appHrs = approved.reduce(function (a, s) { return a + s.hoursDec; }, 0);

  function put(id, v) { var e = document.getElementById(id); if (e) e.textContent = v; }
  put('tsTotal', sheets.length);
  put('tsApproved', approved.length);
  put('tsLocked', 0);
  put('tsUnapproved', unapproved.length);
  put('tsRejected', 0);
  put('tsResubmitted', 0);
  put('tsWorkers', Object.keys(workers).length);
  put('tsApprovedHrs', tsHM2(appHrs));
  put('tsRejectedTime', '0H 0M');
  put('tsResubTime', '0H 0M');
  put('tsTabCount', '(' + sheets.length + ')');
  put('tsWorkerCount', '(' + Object.keys(workers).length + ')');

  var body = document.getElementById('tsBody');
  if (!body) return;

  if (TS.tab === 'workers') { tsRenderWorkers(body, sheets); tsRenderPager(0, 0); return; }

  /* ── group by day ── */
  var byDay = {};
  sheets.forEach(function (s) { (byDay[s.iso] = byDay[s.iso] || []).push(s); });
  var days = Object.keys(byDay).sort();

  /* paginate the entries, not the groups */
  var per = parseInt((document.getElementById('tsRows') || {}).value || '15', 10);
  var flat = [];
  days.forEach(function (d) { byDay[d].forEach(function (s) { flat.push(s); }); });
  var pages = Math.max(1, Math.ceil(flat.length / per));
  if (TS.page > pages) TS.page = pages;
  var from = (TS.page - 1) * per, to = Math.min(flat.length, from + per);
  var shown = flat.slice(from, to);

  var html = '';
  /* Clock-in group: the base has no live clock-in feed, so this is genuinely
     empty rather than filled with invented rows. */
  html += '<tr class="ts-group clockin"><td class="ts-check"><input type="checkbox"></td>' +
          '<td colspan="8">CLOCK IN <span class="ts-group-count">0</span></td></tr>';

  var shownByDay = {};
  shown.forEach(function (s) { (shownByDay[s.iso] = shownByDay[s.iso] || []).push(s); });

  Object.keys(shownByDay).sort().forEach(function (d) {
    var group = shownByDay[d];
    var folded = !!TS.collapsed[d];
    html += '<tr class="ts-group" onclick="tsToggleGroup(\'' + d + '\')">' +
            '<td class="ts-check"><input type="checkbox" onclick="event.stopPropagation()"></td>' +
            '<td colspan="8">' + tsDayLabel(d) +
            ' <span class="ts-group-count">' + byDay[d].length + '</span>' +
            ' <i class="fas fa-chevron-' + (folded ? 'down' : 'up') +
            '" style="margin-left:8px;color:#94a3b8;font-size:11px"></i></td></tr>';
    if (folded) return;
    group.forEach(function (s) {
      var task = s.alloc[0] ? s.alloc[0].l : '—';
      var timeCell = '<b>' + tsAmPm(s.inAt) + ' - ' + tsAmPm(s.outAt) + '</b>' +
                     '<span>' + s.hours + ' &nbsp;<i class="fas fa-mug-hot"></i> ' + s.brk + 'm</span>';
      html += '<tr>' +
        '<td class="ts-check"><input type="checkbox"></td>' +
        '<td><div class="ts-worker"><div class="ts-avatar">' + tsInitials(s.worker.nm) + '</div>' +
          '<div><div class="ts-worker-name">' + s.worker.nm + '</div>' +
          '<div class="ts-worker-role">' + s.worker.role + '</div>' +
          '<div class="ts-badges">' +
            '<span class="ts-badge" style="background:#16a34a1a;color:#16a34a" title="Allocations">' +
              '<i class="fas fa-layer-group"></i>' + s.alloc.length + '</span>' +
            '<span class="ts-badge" style="background:#3b82f61a;color:#3b82f6" title="Cost">' +
              tsMoney(s.cost) + '</span>' +
          '</div></div></div></td>' +
        '<td>' + VDATA.projectName() + '</td>' +
        '<td>' + VDATA.approverFor(s.worker) + '</td>' +
        '<td class="ts-time">' + timeCell + '</td>' +
        '<td class="ts-time">' + (s.approved ? timeCell : '<span class="ts-dash">—</span>') + '</td>' +
        '<td>' + VDATA.ccLabel(s.cc) + '<div class="ts-worker-role">' + task + '</div></td>' +
        '<td><span class="ts-pill ' + (s.approved ? 'approved' : 'unapproved') + '">' +
          (s.approved ? 'Approved' : 'Unapproved') + '</span></td>' +
        '<td><span class="ts-row-act"><i class="fas fa-ellipsis-vertical"></i></span></td>' +
        '</tr>';
    });
  });

  if (!flat.length) {
    html += '<tr><td colspan="9"><div class="ts-empty"><i class="far fa-clock"></i>' +
            'No time booked in this week.</div></td></tr>';
  }
  body.innerHTML = html;
  tsRenderPager(flat.length, per, from, to, pages);
}

function tsRenderWorkers(body, sheets) {
  var by = {};
  sheets.forEach(function (s) {
    var k = s.worker.id;
    by[k] = by[k] || { w: s.worker, hrs: 0, cost: 0, days: {}, approved: 0, total: 0 };
    by[k].hrs += s.hoursDec; by[k].cost += s.cost; by[k].days[s.iso] = 1;
    by[k].total++; if (s.approved) by[k].approved++;
  });
  var keys = Object.keys(by);
  if (!keys.length) {
    body.innerHTML = '<tr><td colspan="9"><div class="ts-empty"><i class="fas fa-users"></i>' +
                     'No workers booked this week.</div></td></tr>';
    return;
  }
  body.innerHTML = keys.map(function (k) {
    var r = by[k];
    return '<tr><td class="ts-check"><input type="checkbox"></td>' +
      '<td><div class="ts-worker"><div class="ts-avatar">' + tsInitials(r.w.nm) + '</div>' +
        '<div><div class="ts-worker-name">' + r.w.nm + '</div>' +
        '<div class="ts-worker-role">' + r.w.role + '</div></div></div></td>' +
      '<td>' + VDATA.projectName() + '</td>' +
      '<td>' + VDATA.approverFor(r.w) + '</td>' +
      '<td class="ts-time"><b>' + tsHM(r.hrs) + '</b><span>' +
        Object.keys(r.days).length + ' day(s)</span></td>' +
      '<td class="ts-time"><b>' + tsMoney(r.cost) + '</b><span>$' + r.w.rate + '/hr</span></td>' +
      '<td>' + r.total + ' timesheet(s)</td>' +
      '<td><span class="ts-pill ' + (r.approved === r.total ? 'approved' : 'unapproved') + '">' +
        r.approved + ' of ' + r.total + ' approved</span></td>' +
      '<td><span class="ts-row-act"><i class="fas fa-ellipsis-vertical"></i></span></td></tr>';
  }).join('');
}

function tsRenderPager(total, per, from, to, pages) {
  var c = document.getElementById('tsCount');
  var p = document.getElementById('tsPages');
  if (!c || !p) return;
  if (!total) { c.textContent = '0 to 0 of 0'; p.innerHTML = ''; return; }
  c.textContent = (from + 1) + ' to ' + to + ' of ' + total;
  var h = '<span class="' + (TS.page === 1 ? 'off' : '') + '" onclick="tsGoPage(1)">First</span>';
  h += '<span class="' + (TS.page === 1 ? 'off' : '') + '" onclick="tsGoPage(' + (TS.page - 1) + ')">‹</span>';
  for (var i = 1; i <= pages; i++) {
    h += '<span class="' + (i === TS.page ? 'on' : '') + '" onclick="tsGoPage(' + i + ')">' + i + '</span>';
  }
  h += '<span class="' + (TS.page === pages ? 'off' : '') + '" onclick="tsGoPage(' + (TS.page + 1) + ')">›</span>';
  h += '<span class="' + (TS.page === pages ? 'off' : '') + '" onclick="tsGoPage(' + pages + ')">Last</span>';
  p.innerHTML = h;
}
function tsGoPage(n) { if (n >= 1) { TS.page = n; tsRender(); } }

/* ══════════════════════════════ ADD FLOW ══════════════════════════════ */

/* Sections unlock in order. Each entry says what the section is waiting for;
   null means it is open. This replaces the four-step wizard — same discipline,
   one page.

   Why not a wizard: the budget setup flow is paginated because each of its
   steps is heavy — upload a BOQ, map its columns, review hundreds of lines. A
   timesheet is one day, one crew, one set of times. What was worth borrowing
   from that flow is the order and the gating, not the pagination. */
function tsSectionGate(n) {
  var shift = tsShiftHours();
  if (n === 1) return null;                       /* always open */
  if (n === 2) return TS.project ? null : 'Choose a project first';
  if (n === 3) {
    if (!TS.project) return 'Choose a project first';
    if (!TS.workers.length) return 'Select who worked';
    if (shift <= 0) return 'Clock out has to be after clock in';
    return null;
  }
  if (n === 4) {
    if (!TS.project) return 'Choose a project first';
    if (!TS.workers.length) return 'Select who worked';
    return null;
  }
  return null;
}

/* What is stopping Save, in the order a person would hit it. */
function tsBlocker() {
  var shift = tsShiftHours();
  if (!TS.project) return 'Choose a project';
  if (!TS.workers.length) return 'Select at least one worker';
  if (shift <= 0) return 'Clock out has to be after clock in';
  if (shift > 14) return 'That is a ' + tsHM(shift) + ' shift — check the times';
  if (TS.allocs.some(function (r) { return r.hours > 0 && !r.target; }))
    return 'Every allocated row needs a task';
  if (TS.multi && TS.allocs.some(function (r) { return r.hours > 0 && !r.job; }))
    return 'Every allocated row needs a job';
  var alloc = TS.allocs.reduce(function (a, r) { return a + r.hours; }, 0);
  if (Math.abs(alloc - shift) > 0.01) {
    return alloc > shift
      ? tsHM(alloc - shift) + ' more allocated than worked'
      : tsHM(shift - alloc) + ' of the shift still unallocated';
  }
  return null;
}

function tsOpenAdd() {
  TS.date = TS.date || VDATA.diaryDate();
  TS.project = '';
  TS.multi = false;
  TS.workers = [];
  TS.allocs = [];
  TS.allow = [];
  TS.equip = [];
  TS.open = {};

  var d = document.getElementById('tsDate');
  if (d) d.value = TS.date;
  var sel = document.getElementById('tsProject');
  if (sel) {
    sel.innerHTML = '<option value="">Select project…</option>' +
      '<option value="' + VDATA.projectName() + '">' + VDATA.projectName() + '</option>';
  }
  var rm = document.getElementById('tsRemarks');
  if (rm) rm.value = '';
  ['Allow', 'Equip', 'Note'].forEach(function (k) {
    var el = document.getElementById('tsExtra' + k);
    if (el) el.classList.remove('open');
  });
  tsBuildWorkers();
  tsAddFlowRender();
  showPage('pageAddTimesheet');
}

function tsBackToList() {
  tsSyncData();
  showPage('pageTimesheet');
}

function tsOnDate() { TS.date = document.getElementById('tsDate').value; tsAddFlowRender(); }

function tsOnProject() {
  TS.project = document.getElementById('tsProject').value;
  tsAddFlowRender();
}

/* The multi-project modifier. It sits on the Project field rather than being a
   decision of its own: it is a rare case, and the first cut gave it two large
   choice cards that read as a co-equal question to "which job". */
function tsToggleMulti(ev) {
  if (ev) ev.preventDefault();
  if (!TS.project) return;                 /* gated, and the chip says so */
  TS.multi = !TS.multi;
  if (!TS.multi) TS.allocs.forEach(function (r) { delete r.job; });
  tsAddFlowRender();
}

function tsBuildWorkers() {
  var box = document.getElementById('tsCrewPicker');
  if (!box) return;
  box.innerHTML = VDATA.workers().map(function (w) {
    return '<div class="ts-wcard" id="tsW-' + w.id + '" onclick="tsToggleWorker(&#39;' +
      w.id + '&#39;)">' +
      '<div class="ts-avatar">' + tsInitials(w.nm) + '</div>' +
      '<div><div class="ts-worker-name">' + w.nm + '</div>' +
      '<div class="ts-worker-role">' + w.role + '</div></div>' +
      '<span class="ts-wrate">$' + w.rate + '/hr</span></div>';
  }).join('');
}

function tsToggleWorker(id) {
  /* pointer-events:none stops a mouse but not a synthetic or keyboard click */
  if (tsSectionGate(2)) return;
  var i = TS.workers.indexOf(id);
  if (i < 0) TS.workers.push(id); else TS.workers.splice(i, 1);
  tsAddFlowRender();
}

function tsShiftHours() {
  var a = (document.getElementById('tsIn') || {}).value || '07:00';
  var b = (document.getElementById('tsOut') || {}).value || '15:30';
  var brk = parseFloat((document.getElementById('tsBreak') || {}).value || 0) || 0;
  function mins(t) { var p = t.split(':'); return (+p[0]) * 60 + (+p[1]); }
  var d = mins(b) - mins(a);
  if (d < 0) d += 24 * 60;                       /* a shift over midnight */
  return Math.max(0, (d - brk) / 60);
}
function tsOnTime() { tsAddFlowRender(); }

/* ── allocation ── */
function tsAddAlloc() { TS.allocs.push({ target: '', hours: 0 }); tsAddFlowRender(); }
function tsRmAlloc(i) { TS.allocs.splice(i, 1); tsAddFlowRender(); }
function tsSetAllocTarget(i, v) { TS.allocs[i].target = v; tsAddFlowRender(); }
function tsSetAllocJob(i, v) { TS.allocs[i].job = v; tsAddFlowRender(); }
function tsSetAllocHours(i, v) { TS.allocs[i].hours = parseFloat(v) || 0; tsAddFlowRender(); }

/* The shortcut the original form needed and did not have: one press to clear
   the remainder rather than arithmetic in your head. */
function tsFillRemainder() {
  if (tsSectionGate(3)) return;
  var left = tsShiftHours() - TS.allocs.reduce(function (a, r) { return a + r.hours; }, 0);
  if (left <= 0) return;
  var open = TS.allocs.filter(function (r) { return !r.hours; })[0];
  if (open) { open.hours = Math.round(left * 100) / 100; }
  else {
    var opts = VDATA.allocOptions();
    TS.allocs.push({ target: opts.length ? opts[0].l : '', hours: Math.round(left * 100) / 100 });
  }
  tsAddFlowRender();
}

function tsRenderAllocs() {
  var tb = document.getElementById('tsAllocRows');
  if (!tb) return;
  var opts = VDATA.allocOptions();
  var rate = tsCrewRate();
  document.querySelectorAll('#pageAddTimesheet .ts-job-col').forEach(function (th) {
    th.style.display = TS.multi ? '' : 'none';
  });
  if (!TS.allocs.length) {
    tb.innerHTML = '<tr><td colspan="' + (TS.multi ? 5 : 4) + '" class="ts-alloc-none">' +
      'Nothing allocated yet — add a row, or use the shortcut below.</td></tr>';
    return;
  }
  tb.innerHTML = TS.allocs.map(function (r, i) {
    var sel = '<select onchange="tsSetAllocTarget(' + i + ',this.value)">' +
      '<option value="">Select task or cost centre…</option>' +
      opts.map(function (o) {
        return '<option value="' + o.l + '"' + (o.l === r.target ? ' selected' : '') + '>' +
               o.c + ' · ' + o.l + '</option>';
      }).join('') + '</select>';
    var jobCell = TS.multi
      ? '<td><select onchange="tsSetAllocJob(' + i + ',this.value)">' +
        '<option value="">Select job…</option><option value="' + VDATA.projectName() + '"' +
        (r.job === VDATA.projectName() ? ' selected' : '') + '>' + VDATA.projectName() +
        '</option></select></td>'
      : '';
    return '<tr><td>' + sel + '</td>' + jobCell +
      '<td><input type="number" step="0.25" min="0" value="' + (r.hours || '') +
        '" onchange="tsSetAllocHours(' + i + ',this.value)"></td>' +
      '<td class="ts-alloc-cost">' + tsMoney(r.hours * rate) + '</td>' +
      '<td class="ts-rm" onclick="tsRmAlloc(' + i + ')"><i class="fas fa-xmark"></i></td></tr>';
  }).join('');
}

/* Cost per hour for the crew selected — the sum of their rates, since each
   selected worker books the same shift. */
function tsCrewRate() {
  var all = VDATA.workers();
  return TS.workers.reduce(function (a, id) {
    var w = all.filter(function (x) { return x.id === id; })[0];
    return a + (w ? w.rate : 0);
  }, 0);
}

/* ── optional extras ── */
function tsToggleExtra(which) {
  if (tsSectionGate(4)) return;
  TS.open[which] = !TS.open[which];
  var el = document.getElementById('tsExtra' + which);
  if (el) el.classList.toggle('open', TS.open[which]);
}
function tsAddAllow() {
  TS.allow.push({ type: 'Site allowance', amount: 35 });
  TS.open.Allow = true;
  var el = document.getElementById('tsExtraAllow');
  if (el) el.classList.add('open');
  tsAddFlowRender();
}
function tsRmAllow(i) { TS.allow.splice(i, 1); tsAddFlowRender(); }
function tsSetAllow(i, k, v) {
  TS.allow[i][k] = k === 'amount' ? (parseFloat(v) || 0) : v;
  tsAddFlowRender();
}
function tsAddEquip() {
  var p = VDATA.plant();
  TS.equip.push({ id: p.length ? p[0].id : '', hours: 0 });
  TS.open.Equip = true;
  var el = document.getElementById('tsExtraEquip');
  if (el) el.classList.add('open');
  tsAddFlowRender();
}
function tsRmEquip(i) { TS.equip.splice(i, 1); tsAddFlowRender(); }
function tsSetEquip(i, k, v) {
  TS.equip[i][k] = k === 'hours' ? (parseFloat(v) || 0) : v;
  tsAddFlowRender();
}

function tsRenderExtras() {
  var a = document.getElementById('tsAllowRows');
  if (a) {
    a.innerHTML = TS.allow.map(function (r, i) {
      return '<div class="ts-xrow"><input class="ts-xgrow" value="' + r.type +
        '" onchange="tsSetAllow(' + i + ',&#39;type&#39;,this.value)">' +
        '<input type="number" style="width:110px" value="' + r.amount +
        '" onchange="tsSetAllow(' + i + ',&#39;amount&#39;,this.value)">' +
        '<span class="ts-rm" onclick="tsRmAllow(' + i + ')"><i class="fas fa-xmark"></i></span></div>';
    }).join('');
    var tot = TS.allow.reduce(function (s, r) { return s + r.amount; }, 0);
    var sum = document.getElementById('tsAllowSum');
    if (sum) sum.textContent = TS.allow.length ? tsMoney(tot) : 'none';
  }
  var e = document.getElementById('tsEquipRows');
  if (e) {
    var plant = VDATA.plant();
    e.innerHTML = TS.equip.map(function (r, i) {
      return '<div class="ts-xrow">' +
        '<select class="ts-xgrow" onchange="tsSetEquip(' + i + ',&#39;id&#39;,this.value)">' +
        plant.map(function (p) {
          return '<option value="' + p.id + '"' + (p.id === r.id ? ' selected' : '') + '>' +
                 p.nm + ' (' + p.id + ') · $' + p.rate + '/hr</option>';
        }).join('') + '</select>' +
        '<input type="number" step="0.25" style="width:110px" placeholder="hours" value="' +
        (r.hours || '') + '" onchange="tsSetEquip(' + i + ',&#39;hours&#39;,this.value)">' +
        '<span class="ts-rm" onclick="tsRmEquip(' + i + ')"><i class="fas fa-xmark"></i></span></div>';
    }).join('');
    var hrs = TS.equip.reduce(function (s, r) { return s + r.hours; }, 0);
    var es = document.getElementById('tsEquipSum');
    if (es) es.textContent = TS.equip.length ? tsHM(hrs) : 'none';
  }
  var ns = document.getElementById('tsNoteSum');
  var rm = document.getElementById('tsRemarks');
  if (ns) ns.textContent = (rm && rm.value.trim()) ? 'note added' : 'none';
}

function tsAddFlowRender() {
  var shift = tsShiftHours();
  var rate = tsCrewRate();
  var allocated = TS.allocs.reduce(function (a, r) { return a + r.hours; }, 0);

  /* Sections dim and stop taking input until they can be answered, and each
     says what it is waiting for. The original form greyed its Workers picker
     with nothing to explain it. */
  for (var n = 1; n <= 4; n++) {
    var sec = document.getElementById('tsSec' + n);
    if (!sec) continue;
    var gate = tsSectionGate(n);
    sec.classList.toggle('ts-locked', !!gate);
    var note = sec.querySelector('.ts-lock-note span');
    if (note) note.textContent = gate || '';
  }

  /* the multi-project modifier */
  var tog = document.getElementById('tsMultiToggle');
  if (tog) {
    tog.classList.toggle('on', !!TS.multi);
    tog.classList.toggle('off', !TS.project);
    tog.title = TS.project ? '' : 'Choose a project first';
  }
  var mnote = document.getElementById('tsMultiNote');
  if (mnote) mnote.style.display = TS.multi ? '' : 'none';

  VDATA.workers().forEach(function (w) {
    var el = document.getElementById('tsW-' + w.id);
    if (el) el.classList.toggle('on', TS.workers.indexOf(w.id) >= 0);
  });

  var tt = document.getElementById('tsTotalTime');
  if (tt) {
    tt.textContent = tsHM(shift);
    tt.parentNode.classList.toggle('over', shift > 14 || shift <= 0);
  }
  var tn = document.getElementById('tsTotalNote');
  if (tn) {
    tn.textContent = TS.workers.length > 1
      ? 'each × ' + TS.workers.length + ' workers = ' + tsHM(shift * TS.workers.length)
      : 'per worker';
  }
  var hint = document.getElementById('tsShiftHint');
  if (hint) {
    hint.innerHTML = TS.workers.length
      ? 'At ' + tsMoney(rate) + '/hr for the crew selected, this shift is <b>' +
        tsMoney(shift * rate) + '</b> of labour cost.'
      : 'Select the crew and this will show what the shift costs.';
  }

  /* allocation reconciles to zero */
  tsRenderAllocs();
  tsRenderExtras();
  var pct = shift > 0 ? Math.min(100, allocated / shift * 100) : 0;
  var fill = document.getElementById('tsAllocFill');
  if (fill) {
    fill.style.width = pct + '%';
    fill.classList.toggle('done', Math.abs(allocated - shift) <= 0.01 && shift > 0);
  }
  var asg = document.getElementById('tsAssigned');
  if (asg) asg.textContent = tsHM(allocated);
  var un = document.getElementById('tsUnassigned');
  var unw = document.getElementById('tsUnassignedWrap');
  if (un && unw) {
    var left = shift - allocated;
    un.textContent = tsHM(Math.abs(left));
    unw.classList.toggle('clear', Math.abs(left) <= 0.01);
    unw.classList.toggle('over', left < -0.01);
    unw.firstChild.textContent = left < -0.01 ? 'Over-allocated ' : 'Unassigned ';
  }

  /* the footer stands in for the old review step */
  tsRenderSummary(shift, rate);

  var blocker = tsBlocker();
  var bl = document.getElementById('tsBlocker');
  var save = document.getElementById('tsSave');
  if (save) save.classList.toggle('ts-off', !!blocker);
  if (bl) {
    bl.className = 'ts-blocker' + (blocker ? '' : ' ok');
    bl.innerHTML = blocker
      ? '<i class="fas fa-circle-exclamation"></i> ' + blocker
      : '<i class="fas fa-circle-check"></i> Ready to save';
  }
}

/* One line of what is about to be created, and where the cost goes. The old
   flow spent a whole step on this; it fits in the footer. */
function tsRenderSummary(shift, rate) {
  var el = document.getElementById('tsSummary');
  if (!el) return;
  if (!TS.workers.length || !TS.project) {
    el.innerHTML = '<span class="ts-sum-empty">Nothing to save yet</span>';
    return;
  }
  var all = VDATA.workers();
  var names = TS.workers.map(function (id) {
    return (all.filter(function (w) { return w.id === id; })[0] || {}).nm;
  });
  var tasks = TS.allocs.filter(function (r) { return r.hours > 0 && r.target; }).length;
  var total = shift * rate;
  var allow = TS.allow.reduce(function (a, r) { return a + r.amount; }, 0);
  el.innerHTML =
    '<b>' + (names.length > 2 ? names.length + ' workers' : names.join(', ')) + '</b>' +
    ' · ' + tsHM(shift) + ' each · ' + tsMoney(total + allow) + ' labour' +
    ' · ' + (tasks ? tasks + (tasks === 1 ? ' task' : ' tasks') : 'not allocated') +
    '<em>Tracked cost until ' + VDATA.approverFor(null) + ' approves it.' +
    ' Shows on the Daily Cost calendar and the Site Diary for ' + tsShort(TS.date) + '.</em>';
}

/* ── save: the timesheet is the source of the cost ── */
function tsSave() {
  if (tsBlocker()) return;
  var shift = tsShiftHours();
  var all = VDATA.workers();
  var opts = VDATA.allocOptions();
  var count = 0, added = 0;

  TS.workers.forEach(function (id, wi) {
    var w = all.filter(function (x) { return x.id === id; })[0];
    if (!w) return;
    TS.allocs.forEach(function (a, ai) {
      if (!(a.hours > 0) || !a.target) return;
      var opt = opts.filter(function (o) { return o.l === a.target; })[0];
      if (!opt) return;
      var cost = Math.round(a.hours * w.rate);

      /* A timesheet not yet approved is tracked cost, and for employee labour
         that is tsUnapproved on the budget line it was booked against.

         Note this raises the line's cost for the job, not for one claim
         period: the base spreads each line across the four periods by a fixed
         weight, so this period picks up its share rather than the lot. */
      var line = baseItems.filter(function (l) { return l.code === opt.code; })[0];
      if (line) line.tsUnapproved = (line.tsUnapproved || 0) + cost;

      /* Held explicitly so it lands on the day and worker entered, and carved
         out of the spread so the money is not counted twice. */
      VDATA.addTimesheet({
        iso: TS.date, cc: opt.cc, cat: 'labour', state: 'tracked', cost: cost,
        row: {
          cat: 'labour', cc: opt.cc, cost: cost, state: 'tracked', iso: TS.date,
          resource: w.nm,
          meta: (Math.round(a.hours * 10) / 10) + ' hrs @ $' + w.rate + '/hr · entered on a timesheet',
          detail: { kind: 'labour', worker: w, hrs: a.hours, rate: w.rate, entered: true }
        }
      });
      count++; added += cost;
    });
  });

  render();                       /* the budget moved, so redraw it */
  TS.week = VDATA.mondayOf(TS.date);
  TS.page = 1;
  tsBackToList();
  if (typeof showToast === 'function') {
    showToast(count + ' timesheet' + (count === 1 ? '' : 's') + ' saved — ' +
              tsMoney(added) + ' of tracked cost on the budget');
  }
}
