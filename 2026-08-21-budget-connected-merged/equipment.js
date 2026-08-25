/* ══════════════════════════════════════════════════════════════════════════
   Plant & Equipment — the registry, and registering a machine.

   The register is the budget's own plant fleet, so a machine here is a machine
   the job charges itself for, and its meter reading is the hours the ledger has
   actually booked against it.
   ══════════════════════════════════════════════════════════════════════════ */

var EQ = { page: 1, sort: 'name', dir: 1, status: 'all', type: '' };

function eqAttr(v) {
  return String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}
function eqMoney(v) { return '$' + Math.round(v || 0).toLocaleString('en-AU'); }
function eqUnitWord(u) { return u === 'hr' ? 'hour' : u === 'day' ? 'day' : 'week'; }

function eqSyncData() {
  EQ.page = 1;
  var q = document.getElementById('eqSearch');
  if (q) q.value = '';
  eqRender();
}

function eqRender() {
  var body = document.getElementById('eqBody');
  if (!body) return;
  var all = VDATA.equipment();

  /* status tabs, counted off the real list */
  var counts = { all: all.length, Active: 0, Maintenance: 0, Inactive: 0 };
  all.forEach(function (e) { counts[e.status] = (counts[e.status] || 0) + 1; });
  var tabs = document.getElementById('eqTabs');
  if (tabs) {
    tabs.innerHTML = [['all', 'ALL'], ['Active', 'ACTIVE'],
                      ['Maintenance', 'MAINTENANCE'], ['Inactive', 'INACTIVE']]
      .map(function (t) {
        return '<span class="eq-tab' + (EQ.status === t[0] ? ' on' : '') +
          '" data-status="' + t[0] + '">' + t[1] +
          ' <b>' + (counts[t[0]] || 0) + '</b></span>';
      }).join('');
    tabs.querySelectorAll('.eq-tab').forEach(function (el) {
      el.onclick = function () {
        EQ.status = el.getAttribute('data-status');
        EQ.page = 1;
        eqRender();
      };
    });
  }

  var rows = all.filter(function (e) {
    return EQ.status === 'all' || e.status === EQ.status;
  });
  if (EQ.type) rows = rows.filter(function (e) { return e.type === EQ.type; });

  var q = ((document.getElementById('eqSearch') || {}).value || '').trim().toLowerCase();
  if (q) {
    rows = rows.filter(function (e) {
      return (e.name + ' ' + e.id + ' ' + e.type + ' ' + e.company)
        .toLowerCase().indexOf(q) >= 0;
    });
  }

  var key = EQ.sort;
  rows.sort(function (a, b) {
    return String(a[key] || '').localeCompare(String(b[key] || '')) * EQ.dir;
  });

  var per = parseInt((document.getElementById('eqRows') || {}).value || '50', 10);
  var pages = Math.max(1, Math.ceil(rows.length / per));
  if (EQ.page > pages) EQ.page = pages;
  var from = (EQ.page - 1) * per, to = Math.min(rows.length, from + per);

  var dash = '<span class="eq-dash">-</span>';
  body.innerHTML = rows.length
    ? rows.slice(from, to).map(function (e) {
        var meter = e.meterType === 'none'
          ? dash
          : (e.meter || 0) + ' ' + (e.meterType === 'km' ? 'km' : 'hr');
        return '<tr class="eq-row" data-id="' + eqAttr(e.id) + '">' +
          '<td class="eq-check"><input type="checkbox"></td>' +
          '<td>' + (e.image ? '<span class="eq-thumb">▣</span>' : dash) + '</td>' +
          '<td class="eq-name">' + e.name + '</td>' +
          '<td>' + e.id + '</td>' +
          '<td>' + e.type + '</td>' +
          '<td>' + e.company + '</td>' +
          '<td><span class="eq-pill ' + e.status.toLowerCase() + '">' + e.status + '</span></td>' +
          '<td>' + meter + '</td>' +
          '<td>' + (e.nextService || dash) + '</td>' +
          '<td>' + (e.plantManager || dash) + '</td>' +
          '<td><span class="eq-acts"><i class="fas fa-ellipsis-vertical"></i></span></td>' +
          '</tr>';
      }).join('')
    : '<tr><td colspan="11"><div class="eq-empty"><i class="fas fa-truck-monster"></i>' +
      (q ? 'No equipment matches “' + q + '”.' : 'Nothing on the register yet.') +
      '</div></td></tr>';

  /* the row opens the machine */
  body.onclick = function (ev) {
    if (ev.target.closest('input[type=checkbox]')) return;
    var tr = ev.target.closest('.eq-row');
    if (tr) eqEdit(tr.getAttribute('data-id'));
  };

  var count = document.getElementById('eqCount');
  if (count) count.textContent = rows.length ? (from + 1) + '-' + to + ' of ' + rows.length : '0 of 0';

  var pg = document.getElementById('eqPages');
  if (pg) {
    var first = EQ.page === 1, last = EQ.page === pages;
    pg.innerHTML =
      '<span class="' + (first ? 'off' : '') + '" onclick="eqGo(' + (EQ.page - 1) + ')"><i class="fas fa-angle-left"></i></span>' +
      '<span class="' + (last ? 'off' : '') + '" onclick="eqGo(' + (EQ.page + 1) + ')"><i class="fas fa-angle-right"></i></span>';
  }

  document.querySelectorAll('#pageEquipment .eq-sortable').forEach(function (th) {
    th.classList.toggle('on', (th.getAttribute('onclick') || '').indexOf("'" + key + "'") >= 0);
  });

  var tf = document.getElementById('eqFilterType');
  if (tf) {
    tf.classList.toggle('on', !!EQ.type);
    tf.querySelector('span').textContent = EQ.type || 'Type';
  }
  var sf = document.getElementById('eqFilterStatus');
  if (sf) {
    sf.classList.toggle('on', EQ.status !== 'all');
    sf.querySelector('span').textContent = EQ.status === 'all' ? 'Status' : EQ.status;
  }
}

function eqGo(n) { if (n >= 1) { EQ.page = n; eqRender(); } }
function eqSort(key) {
  EQ.dir = EQ.sort === key ? -EQ.dir : 1;
  EQ.sort = key;
  eqRender();
}
function eqToggleAll(el) {
  document.querySelectorAll('#eqBody input[type=checkbox]').forEach(function (c) {
    c.checked = el.checked;
  });
}
/* The filter chips step through the values actually present, so the demo never
   offers a filter that would empty the table. */
function eqCycle(which) {
  if (which === 'type') {
    var types = [''].concat(VDATA.equipment().map(function (e) { return e.type; })
      .filter(function (v, i, a) { return a.indexOf(v) === i; }));
    EQ.type = types[(types.indexOf(EQ.type) + 1) % types.length];
  } else {
    var st = ['all', 'Active', 'Maintenance', 'Inactive'];
    EQ.status = st[(st.indexOf(EQ.status) + 1) % st.length];
  }
  EQ.page = 1;
  eqRender();
}

/* ══════════════════════════════════════════════════════════════════════════
   Register / edit a machine
   ══════════════════════════════════════════════════════════════════════════ */

var EQD = { owned: true, meter: 'hr', editing: null, open: {} };

var EQ_FIELDS = ['Name', 'Id', 'Rate', 'Manufacturer', 'Year', 'Model', 'Vin', 'Serial',
                 'Plate', 'Weight', 'Power', 'Bucket', 'Reach', 'Dim', 'Notes'];

function eqSet(f, v) { var el = document.getElementById('eqf' + f); if (el) el.value = v || ''; }
function eqVal(f) { var el = document.getElementById('eqf' + f); return el ? String(el.value).trim() : ''; }

function eqFillSelects() {
  var type = document.getElementById('eqfType');
  if (type) {
    var seen = VDATA.equipment().map(function (e) { return e.type; })
      .filter(function (v, i, a) { return a.indexOf(v) === i; });
    ['Excavators', 'Trucks', 'Compaction', 'Skid Steers', 'Dozers', 'Water Trucks',
     'Miscellaneous'].forEach(function (t) { if (seen.indexOf(t) < 0) seen.push(t); });
    type.innerHTML = '<option value="">Select type…</option>' +
      seen.map(function (t) { return '<option>' + t + '</option>'; }).join('');
  }
  var co = document.getElementById('eqfCompany');
  if (co) {
    /* Owned plant belongs to the org; hired plant comes from a supplier, and
       the supplier list is the one the budget already knows about. */
    co.innerHTML = EQD.owned
      ? '<option>' + VDATA.orgName() + '</option>'
      : '<option value="">Select supplier…</option>' +
        VDATA.suppliers().map(function (s) {
          return '<option>' + s.name + '</option>';
        }).join('');
  }
  var mgr = document.getElementById('eqfManager');
  if (mgr) {
    mgr.innerHTML = '<option value="">Not assigned</option>' +
      VDATA.workers().map(function (w) { return '<option>' + w.nm + '</option>'; }).join('');
  }
}

function eqOpenAdd() {
  EQD = { owned: true, meter: 'hr', editing: null, open: {} };
  EQ_FIELDS.forEach(function (f) { eqSet(f, ''); });
  var st = document.getElementById('eqfStatus'); if (st) st.value = 'Active';
  var un = document.getElementById('eqfUnit'); if (un) un.value = 'hr';
  var mu = document.getElementById('eqfMulti'); if (mu) mu.checked = false;
  ['Ident', 'Spec', 'Notes'].forEach(function (k) {
    var el = document.getElementById('eqFold' + k);
    if (el) el.classList.remove('open');
  });
  eqFillSelects();
  var t = document.getElementById('eqRegTitle');
  if (t) t.textContent = 'Register New Equipment';
  var after = document.getElementById('eqAfter');
  if (after) after.style.display = '';
  eqDrRender();
  showPage('pageAddEquipment');
}

function eqEdit(id) {
  var e = VDATA.equipmentById(id);
  if (!e) return;
  EQD = { owned: e.owned, meter: e.meterType || 'hr', editing: id, open: {} };
  eqFillSelects();
  eqSet('Name', e.name); eqSet('Id', e.id); eqSet('Rate', e.rate);
  eqSet('Manufacturer', e.manufacturer); eqSet('Year', e.year); eqSet('Model', e.model);
  eqSet('Vin', e.vin); eqSet('Serial', e.serial); eqSet('Plate', e.plate);
  eqSet('Weight', e.weight); eqSet('Power', e.power); eqSet('Bucket', e.bucket);
  eqSet('Reach', e.reach); eqSet('Dim', e.dimension); eqSet('Notes', e.notes);
  var ty = document.getElementById('eqfType'); if (ty) ty.value = e.type;
  var st = document.getElementById('eqfStatus'); if (st) st.value = e.status;
  var un = document.getElementById('eqfUnit'); if (un) un.value = e.unit || 'hr';
  var co = document.getElementById('eqfCompany'); if (co) co.value = e.company;
  var mg = document.getElementById('eqfManager'); if (mg) mg.value = e.plantManager || '';
  var mu = document.getElementById('eqfMulti'); if (mu) mu.checked = !!e.multiProject;
  var t = document.getElementById('eqRegTitle');
  if (t) t.textContent = e.name;
  /* the machine exists, so the things that hang off it are no longer "later" */
  var after = document.getElementById('eqAfter');
  if (after) after.style.display = 'none';
  eqDrRender();
  showPage('pageAddEquipment');
}

function eqBackToList() { eqSyncData(); showPage('pageEquipment'); }

function eqSetOwned(on) {
  EQD.owned = on;
  eqFillSelects();
  eqDrRender();
}
function eqSetMeter(m) { EQD.meter = m; eqDrRender(); }
function eqToggleFold(which) {
  var el = document.getElementById('eqFold' + which);
  if (el) el.classList.toggle('open');
}

function eqBlockerFor() {
  if (!eqVal('Name')) return 'The machine needs a name';
  if (!eqVal('Id')) return 'The machine needs an ID';
  var ty = document.getElementById('eqfType');
  if (ty && !ty.value) return 'Pick a type';
  var co = document.getElementById('eqfCompany');
  if (!EQD.owned && co && !co.value) return 'Pick the supplier it is hired from';
  var rate = parseFloat(eqVal('Rate'));
  if (!(rate > 0)) return 'A cost rate is what makes the machine cost anything';
  /* An ID has to be unique — two machines sharing one is two meters and two
     sets of hours landing on the same record. */
  if (!EQD.editing && VDATA.equipmentById(eqVal('Id'))) {
    return eqVal('Id') + ' is already on the register';
  }
  return null;
}

function eqDrRender() {
  var owned = document.getElementById('eqOwnOwned');
  var hired = document.getElementById('eqOwnHired');
  if (owned && hired) {
    owned.classList.toggle('on', EQD.owned);
    hired.classList.toggle('on', !EQD.owned);
  }
  var lbl = document.getElementById('eqfCompanyLabel');
  if (lbl) {
    lbl.innerHTML = (EQD.owned ? 'Company' : 'Supplier') +
      ' <span class="eq-req">*</span>';
  }

  ['hr', 'km', 'none'].forEach(function (m) {
    var el = document.getElementById('eqMeter' +
      (m === 'hr' ? 'Hr' : m === 'km' ? 'Km' : 'None'));
    if (el) el.classList.toggle('on', EQD.meter === m);
  });
  var mh = document.getElementById('eqMeterHint');
  if (mh) {
    mh.textContent = EQD.meter === 'none'
      ? 'No meter, so servicing cannot be scheduled against usage.'
      : 'The register shows the ' +
        (EQD.meter === 'km' ? 'distance' : 'hours') +
        ' booked against this machine on site.';
  }

  /* what the rate means in the ledger's terms */
  var rate = parseFloat(eqVal('Rate')) || 0;
  var unitEl = document.getElementById('eqfUnit');
  var unit = unitEl ? unitEl.value : 'hr';
  var note = document.getElementById('eqRateNote');
  if (note) {
    if (!rate) {
      note.innerHTML = 'Set a rate and this will show what a day on site costs.';
    } else {
      var perDay = unit === 'hr' ? rate * 8 : unit === 'day' ? rate : rate / 5;
      note.innerHTML = eqMoney(rate) + ' per ' + eqUnitWord(unit) +
        ' — about <b>' + eqMoney(perDay) + '</b> for an eight hour day on site.';
    }
  }

  function sum(id, fields) {
    var el = document.getElementById(id);
    if (!el) return;
    var n = fields.filter(function (f) { return eqVal(f); }).length;
    el.textContent = n ? n + ' of ' + fields.length + ' filled' : 'none';
  }
  sum('eqIdentSum', ['Manufacturer', 'Year', 'Model', 'Vin', 'Serial', 'Plate']);
  sum('eqSpecSum', ['Weight', 'Power', 'Bucket', 'Reach', 'Dim']);
  var ns = document.getElementById('eqNotesSum');
  if (ns) ns.textContent = eqVal('Notes') ? 'note added' : 'none';

  var blocker = eqBlockerFor();
  ['eqSaveBtn', 'eqSaveBtn2', 'eqSaveAnother'].forEach(function (id) {
    var b = document.getElementById(id);
    if (b) b.classList.toggle('eq-off', !!blocker);
  });
  var bl = document.getElementById('eqBlocker');
  if (bl) {
    bl.className = 'eq-blocker' + (blocker ? ' bad' : ' ok');
    bl.innerHTML = blocker
      ? '<i class="fas fa-circle-exclamation"></i> ' + blocker
      : '<i class="fas fa-circle-check"></i> Ready to save';
  }
}

function eqSave(another) {
  if (eqBlockerFor()) return;
  var ty = document.getElementById('eqfType');
  var st = document.getElementById('eqfStatus');
  var co = document.getElementById('eqfCompany');
  var mg = document.getElementById('eqfManager');
  var un = document.getElementById('eqfUnit');
  var existing = EQD.editing ? VDATA.equipmentById(EQD.editing) : null;

  VDATA.saveEquipment({
    id: eqVal('Id'),
    name: eqVal('Name'),
    type: ty ? ty.value : 'Miscellaneous',
    owned: EQD.owned,
    company: co ? co.value : VDATA.orgName(),
    status: st ? st.value : 'Active',
    rate: parseFloat(eqVal('Rate')) || 0,
    unit: un ? un.value : 'hr',
    meterType: EQD.meter,
    /* hours already booked follow the machine; a new one starts at zero */
    meter: existing ? existing.meter : 0,
    nextService: existing ? existing.nextService : '',
    plantManager: mg ? mg.value : '',
    image: existing ? existing.image : '',
    manufacturer: eqVal('Manufacturer'), year: eqVal('Year'), model: eqVal('Model'),
    vin: eqVal('Vin'), serial: eqVal('Serial'), plate: eqVal('Plate'),
    weight: eqVal('Weight'), power: eqVal('Power'), bucket: eqVal('Bucket'),
    reach: eqVal('Reach'), dimension: eqVal('Dim'), notes: eqVal('Notes'),
    multiProject: !!(document.getElementById('eqfMulti') || {}).checked,
    attachments: existing ? existing.attachments : [],
    forms: existing ? existing.forms : []
  });

  var name = eqVal('Name');
  if (another) {
    eqOpenAdd();
    if (typeof showToast === 'function') showToast(name + ' saved — add another');
    return;
  }
  eqBackToList();
  if (typeof showToast === 'function') {
    showToast(name + ' saved to the equipment register');
  }
}
