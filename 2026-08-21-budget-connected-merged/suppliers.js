/* ══════════════════════════════════════════════════════════════════════════
   Suppliers — the org's supplier list, and the add/edit drawer.

   Derived like everything else: every supplier named on a purchase order, a
   site docket, a bill or a cost-plus invoice in the budget. So the list is
   exactly the firms this job buys from, and it grows when the budget does
   rather than being a table of invented names.
   ══════════════════════════════════════════════════════════════════════════ */

var SP = { page: 1, sort: 'name', dir: 1 };

function spRender() {
  var body = document.getElementById('spBody');
  if (!body) return;
  var all = VDATA.suppliers();

  var q = ((document.getElementById('spSearch') || {}).value || '').trim().toLowerCase();
  var rows = q
    ? all.filter(function (s) {
        return (s.name + ' ' + s.abn + ' ' + s.address + ' ' + s.email + ' ' + s.contact)
          .toLowerCase().indexOf(q) >= 0;
      })
    : all.slice();

  var key = SP.sort;
  rows.sort(function (a, b) {
    var x = String(a[key] || ''), y = String(b[key] || '');
    /* blanks last whichever way it is sorted — a dash is absence, not a value */
    if (!x && y) return 1;
    if (x && !y) return -1;
    return x.localeCompare(y) * SP.dir;
  });

  var per = parseInt((document.getElementById('spRows') || {}).value || '15', 10);
  var pages = Math.max(1, Math.ceil(rows.length / per));
  if (SP.page > pages) SP.page = pages;
  var from = (SP.page - 1) * per, to = Math.min(rows.length, from + per);

  var dash = '<span class="sp-dash">-</span>';
  body.innerHTML = rows.length
    ? rows.slice(from, to).map(function (s) {
        var unmapped = VDATA.unmappedCats(s).length;
        var warn = unmapped
          ? ' <i class="fas fa-triangle-exclamation sp-warn" title="' + unmapped +
            ' resource categor' + (unmapped === 1 ? 'y has' : 'ies have') +
            ' no accounting code — bills in ' + (unmapped === 1 ? 'it' : 'them') +
            ' cannot post"></i>'
          : '';
        var cats = (s.cats || []).map(function (c) {
          var m = VDATA.resourceCategories().filter(function (x) { return x.key === c; })[0];
          return m ? '<span class="sp-catchip" style="background:' + m.colour +
                     '1a;color:' + m.colour + '">' + m.name + '</span>' : '';
        }).join('');
        return '<tr>' +
          '<td class="sp-check"><input type="checkbox"></td>' +
          '<td><div class="sp-name">' + s.name + warn + '</div>' +
            (cats ? '<div class="sp-catrow">' + cats + '</div>' : '') + '</td>' +
          '<td>' + (s.abn || dash) + '</td>' +
          '<td class="sp-addr">' + (s.address || dash) + '</td>' +
          '<td class="sp-email">' + (s.email || dash) + '</td>' +
          '<td>' + (s.phone || dash) + '</td>' +
          '<td>' + (s.contact || dash) + '</td>' +
          '<td>' + s.updated + '</td>' +
          '<td>' + (s.source === 'xero'
            ? '<span class="sp-src xero" title="Synced from Xero">xero</span>'
            : '<span class="sp-src varicon" title="Created in Varicon">' +
              '<i class="fas fa-check"></i></span>') + '</td>' +
          '<td><span class="sp-acts">' +
            '<i class="fas fa-pen" title="Edit" onclick="spEdit(this)" ' +
              'data-name="' + s.name + '"></i>' +
            '<i class="fas fa-box-archive" title="Archive"></i></span></td>' +
          '</tr>';
      }).join('')
    : '<tr><td colspan="10"><div class="sp-empty"><i class="far fa-building"></i>' +
      (q ? 'No supplier matches “' + q + '”.' : 'No suppliers yet.') + '</div></td></tr>';

  var count = document.getElementById('spCount');
  if (count) count.textContent = rows.length ? (from + 1) + '-' + to + ' of ' + rows.length : '0 of 0';

  var pg = document.getElementById('spPages');
  if (pg) {
    var first = SP.page === 1, last = SP.page === pages;
    pg.innerHTML =
      '<span class="' + (first ? 'off' : '') + '" onclick="spGo(1)"><i class="fas fa-angles-left"></i></span>' +
      '<span class="' + (first ? 'off' : '') + '" onclick="spGo(' + (SP.page - 1) + ')"><i class="fas fa-angle-left"></i></span>' +
      '<span class="' + (last ? 'off' : '') + '" onclick="spGo(' + (SP.page + 1) + ')"><i class="fas fa-angle-right"></i></span>' +
      '<span class="' + (last ? 'off' : '') + '" onclick="spGo(' + pages + ')"><i class="fas fa-angles-right"></i></span>';
  }

  document.querySelectorAll('#pageSuppliers .sp-sortable').forEach(function (th) {
    th.classList.toggle('on', (th.getAttribute('onclick') || '').indexOf("'" + key + "'") >= 0);
  });
}

function spGo(n) {
  if (n < 1) return;
  SP.page = n;
  spRender();
}

function spSort(key) {
  SP.dir = SP.sort === key ? -SP.dir : 1;
  SP.sort = key;
  SP.page = 1;
  spRender();
}

function spToggleAll(el) {
  document.querySelectorAll('#spBody input[type=checkbox]').forEach(function (c) {
    c.checked = el.checked;
  });
}

/* Xero is the accounting substrate, so a sync pulls supplier records in.
   There is nothing to pull here — every supplier is already known to the
   budget — so this says so rather than pretending to fetch. */
function spSync() {
  var btn = document.getElementById('spSync');
  if (btn) btn.classList.add('sp-busy');
  setTimeout(function () {
    if (btn) btn.classList.remove('sp-busy');
    if (typeof showToast === 'function') {
      showToast('Already in sync — every supplier on this job is in the list');
    }
  }, 900);
}

function spSyncData() {
  SP.page = 1;
  var q = document.getElementById('spSearch');
  if (q) q.value = '';
  spRender();
}

/* ══════════════════════════════════════════════════════════════════════════
   Add / edit supplier

   The original form had a "Resource Types" multi-select and stopped there,
   which leaves the question the AP flow actually needs answered: when a bill
   from this supplier arrives for plant, which account does it post to?

   A supplier sells more than one kind of thing — a hire firm invoices plant
   one month and fuel the next — so the accounting code belongs to the pair
   (supplier, resource category), not to the supplier. Picking a category here
   opens a row to code it.
   ══════════════════════════════════════════════════════════════════════════ */

var SPD = { cats: [], codes: {}, editing: null };

var SP_FIELDS = ['Name', 'Id', 'Abn', 'Phone', 'Email',
                 'Addr1', 'Addr2', 'City', 'State', 'Post', 'Contact'];

function spSet(f, v) {
  var el = document.getElementById('spf' + f);
  if (el) el.value = v || '';
}
function spVal(f) {
  var el = document.getElementById('spf' + f);
  return el ? String(el.value).trim() : '';
}

function spOpenDrawer(title) {
  var t = document.getElementById('spDrTitle');
  if (t) t.textContent = title;
  spDrRender();
  document.getElementById('spScrim').classList.add('open');
  document.getElementById('spDrawer').classList.add('open');
}

function spAdd() {
  SPD = { cats: [], codes: {}, editing: null };
  SP_FIELDS.forEach(function (f) { spSet(f, ''); });
  var sub = document.getElementById('spfSub');
  if (sub) sub.checked = false;
  spOpenDrawer('Add Supplier');
}

function spEdit(el) {
  var name = el && el.getAttribute ? el.getAttribute('data-name') : el;
  var s = VDATA.suppliers().filter(function (x) { return x.name === name; })[0];
  if (!s) return;
  SPD = { cats: (s.cats || []).slice(), codes: JSON.parse(JSON.stringify(s.codes || {})),
          editing: name };
  SP_FIELDS.forEach(function (f) { spSet(f, ''); });
  spSet('Name', s.name); spSet('Id', s.id); spSet('Abn', s.abn);
  spSet('Phone', s.phone); spSet('Email', s.email); spSet('Contact', s.contact);
  spSet('Addr1', s.address);
  var sub = document.getElementById('spfSub');
  if (sub) sub.checked = !!s.isSub;
  spOpenDrawer('Edit Supplier');
}

function spCloseDrawer() {
  document.getElementById('spScrim').classList.remove('open');
  document.getElementById('spDrawer').classList.remove('open');
}

function spToggleFold(which) {
  var el = document.getElementById('spFold' + which);
  if (el) el.classList.toggle('open');
}

function spToggleCat(key) {
  var i = SPD.cats.indexOf(key);
  if (i < 0) {
    SPD.cats.push(key);
    /* Offer the obvious account rather than making them hunt: most categories
       have one natural home, and it can be changed on the row. */
    var opts = VDATA.accountCodesFor(key);
    if (opts.length === 1) SPD.codes[key] = opts[0].code;
  } else {
    SPD.cats.splice(i, 1);
    delete SPD.codes[key];
  }
  spDrRender();
}
function spSetCode(key, code) { SPD.codes[key] = code; spDrRender(); }

function spDrRender() {
  var cats = VDATA.resourceCategories();

  var box = document.getElementById('spCats');
  if (box) {
    box.innerHTML = cats.map(function (c) {
      var on = SPD.cats.indexOf(c.key) >= 0;
      return '<span class="sp-cat' + (on ? ' on' : '') + '" data-cat="' + c.key + '"' +
        (on ? ' style="border-color:' + c.colour + ';background:' + c.colour + '14;color:' + c.colour + '"' : '') +
        '><i class="fas fa-' + (on ? 'check' : 'plus') + '"></i>' + c.name + '</span>';
    }).join('');
    box.querySelectorAll('.sp-cat').forEach(function (el) {
      el.onclick = function () { spToggleCat(el.getAttribute('data-cat')); };
    });
  }

  /* one accounting code per category picked — the mapping is per pair */
  var map = document.getElementById('spMap');
  if (map) {
    if (!SPD.cats.length) {
      map.innerHTML = '<div class="sp-map-empty">Pick a category above and it appears ' +
        'here to be coded.</div>';
    } else {
      map.innerHTML =
        '<div class="sp-map-head"><span>Category</span><span>Bills post to</span></div>' +
        SPD.cats.map(function (key) {
          var cat = cats.filter(function (c) { return c.key === key; })[0] || { name: key, colour: '#94a3b8' };
          var opts = VDATA.accountCodesFor(key);
          var cur = SPD.codes[key] || '';
          return '<div class="sp-map-row' + (cur ? '' : ' unset') + '">' +
            '<span class="sp-map-cat"><i class="sp-dot" style="background:' +
              cat.colour + '"></i>' + cat.name + '</span>' +
            '<select data-cat="' + key + '">' +
            '<option value="">Not coded yet</option>' +
            opts.map(function (a) {
              return '<option value="' + a.code + '"' + (a.code === cur ? ' selected' : '') +
                     '>' + a.code + ' · ' + a.name + '</option>';
            }).join('') + '</select></div>';
        }).join('');
      map.querySelectorAll('select').forEach(function (sel) {
        sel.onchange = function () { spSetCode(sel.getAttribute('data-cat'), sel.value); };
      });
    }
  }

  /* Flag, do not block. A supplier can be saved before every category is
     coded — it is the bill that cannot post, not the record that is invalid. */
  var missing = SPD.cats.filter(function (c) { return !SPD.codes[c]; });
  var hard = !spVal('Name') ? 'A supplier needs a name' : null;
  var save = document.getElementById('spSave');
  if (save) save.classList.toggle('sp-off', !!hard);
  var bl = document.getElementById('spBlocker');
  if (bl) {
    bl.className = 'sp-blocker' + (hard ? ' bad' : missing.length ? ' warn' : ' ok');
    bl.innerHTML = hard
      ? '<i class="fas fa-circle-exclamation"></i> ' + hard
      : missing.length
        ? '<i class="fas fa-triangle-exclamation"></i> ' + missing.length + ' categor' +
          (missing.length === 1 ? 'y' : 'ies') + ' not coded — bills in ' +
          (missing.length === 1 ? 'it' : 'them') + ' cannot post'
        : SPD.cats.length
          ? '<i class="fas fa-circle-check"></i> All categories coded'
          : '<i class="fas fa-circle-check"></i> Ready';
  }
}

function spSaveSupplier() {
  var name = spVal('Name');
  if (!name) return;
  VDATA.saveSupplier({
    name: name,
    id: spVal('Id') || 'SUP-NEW',
    abn: spVal('Abn'),
    phone: spVal('Phone'),
    email: spVal('Email'),
    contact: spVal('Contact'),
    address: [spVal('Addr1'), spVal('Addr2'), spVal('City'), spVal('State'), spVal('Post')]
      .filter(Boolean).join(', '),
    updated: (function () {
      var d = VDATA.diaryDate().split('-');
      return d[2] + '/' + d[1] + '/' + d[0];
    })(),
    /* created here rather than synced in, so it carries the Varicon source */
    source: SPD.editing ? undefined : 'varicon',
    cats: SPD.cats.slice(),
    codes: JSON.parse(JSON.stringify(SPD.codes)),
    isSub: !!(document.getElementById('spfSub') || {}).checked,
    ccs: []
  });
  var n = SPD.cats.length;
  spCloseDrawer();
  spSyncData();
  if (typeof showToast === 'function') {
    showToast(name + ' saved — ' + n + ' resource categor' + (n === 1 ? 'y' : 'ies') +
              ' mapped to accounts');
  }
}
