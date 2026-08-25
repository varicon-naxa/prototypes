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
        /* No accounting state on this list. The codes are set on the supplier
           but they only surface where they are used — creating a PO, and
           coding a bill — so the row stays a contact record. */
        return '<tr>' +
          '<td class="sp-check"><input type="checkbox"></td>' +
          '<td class="sp-name">' + s.name + '</td>' +
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

var SPD = { cats: [], codes: {}, editing: null, openDrop: null, dropQ: '' };

/* Clicking away closes the account list, the way a select does. */
document.addEventListener('click', function (ev) {
  if (!SPD.openDrop) return;
  if (ev.target.closest && (ev.target.closest('.sp-pick') || ev.target.closest('.sp-cat'))) return;
  SPD.openDrop = null;
  SPD.dropQ = '';
  if (document.getElementById('spMap')) spDrRender();
});

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
  SPD.openDrop = null;
  SPD.dropQ = '';
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
    /* Nothing pre-picked. Which account a category posts to is the client's
       to say, and the whole chart is a candidate. */
    SPD.openDrop = key;
    SPD.dropQ = '';
    setTimeout(function () {
      var q = document.getElementById('spDropQ');
      if (!q) return;
      q.focus();
      var panel = q.closest('.sp-drop');
      if (panel && panel.scrollIntoView) panel.scrollIntoView({ block: 'nearest' });
    }, 0);
  } else {
    SPD.cats.splice(i, 1);
    delete SPD.codes[key];
  }
  spDrRender();
}

/* A category may post to several accounts, so this is a toggle into a list
   rather than a single choice. */
function spToggleCode(key, code) {
  var list = SPD.codes[key] || (SPD.codes[key] = []);
  var i = list.indexOf(code);
  if (i < 0) list.push(code); else list.splice(i, 1);
  /* The list stays open: a category usually wants more than one account, and
     reopening between each is the kind of thing that makes people give up. */
  spDrRender();
}

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
        '<div class="sp-map-head"><span>Category</span><span>Bills may post to</span></div>' +
        SPD.cats.map(function (key) {
          var cat = cats.filter(function (c) { return c.key === key; })[0] ||
                    { name: key, colour: '#94a3b8' };
          var cur = SPD.codes[key] || [];
          var open = SPD.openDrop === key;
          var q = (SPD.dropQ || '').trim().toLowerCase();
          var opts = VDATA.accountCodes().filter(function (a) {
            return !open || !q || (a.code + ' ' + a.name).toLowerCase().indexOf(q) >= 0;
          });
          return '<div class="sp-map-row' + (cur.length ? '' : ' unset') + '">' +
            '<div class="sp-map-cat"><i class="sp-dot" style="background:' +
              cat.colour + '"></i>' + cat.name +
              '<em>' + (cur.length ? cur.length + ' account' + (cur.length === 1 ? '' : 's')
                                   : 'not coded yet') + '</em></div>' +
            '<div class="sp-pick">' +
              '<div class="sp-pick-box" data-open="' + key + '">' +
                (cur.length
                  ? cur.map(function (c) {
                      return '<span class="sp-tag"><b>' + c + '</b> ' +
                        VDATA.accountName(c).split(' · ')[1] +
                        '<i class="fas fa-xmark" data-cat="' + key + '" data-code="' + c +
                        '"></i></span>';
                    }).join('')
                  : '<span class="sp-pick-ph">Search accounting codes…</span>') +
                '<i class="fas fa-chevron-down sp-pick-chev"></i>' +
              '</div>' +
              (open
                ? '<div class="sp-drop">' +
                    '<div class="sp-drop-search"><i class="fas fa-magnifying-glass"></i>' +
                    '<input id="spDropQ" placeholder="Search code or name" ' +
                    'value="' + (SPD.dropQ || '') + '" autocomplete="off"></div>' +
                    '<div class="sp-drop-list">' +
                      (opts.length
                        ? opts.map(function (a) {
                            var on = cur.indexOf(a.code) >= 0;
                            return '<div class="sp-drop-row' + (on ? ' on' : '') +
                              '" data-cat="' + key + '" data-code="' + a.code + '">' +
                              '<span class="sp-drop-box"><i class="fas fa-check"></i></span>' +
                              '<b>' + a.code + '</b><span>' + a.name + '</span></div>';
                          }).join('')
                        : '<div class="sp-drop-none">No account matches that.</div>') +
                    '</div></div>'
                : '') +
            '</div></div>';
        }).join('');

      map.querySelectorAll('.sp-pick-box').forEach(function (el) {
        el.onclick = function (ev) {
          if (ev.target.closest('.sp-tag i')) return;   /* removing a tag, not opening */
          var k = el.getAttribute('data-open');
          SPD.openDrop = SPD.openDrop === k ? null : k;
          SPD.dropQ = '';
          spDrRender();
          var q = document.getElementById('spDropQ');
          if (q) {
            q.focus();
            /* the drawer body scrolls, so a list opened near the bottom would
               otherwise expand out of sight */
            var panel = q.closest('.sp-drop');
            if (panel && panel.scrollIntoView) {
              panel.scrollIntoView({ block: 'nearest' });
            }
          }
        };
      });
      map.querySelectorAll('.sp-tag i').forEach(function (el) {
        el.onclick = function (ev) {
          ev.stopPropagation();
          spToggleCode(el.getAttribute('data-cat'), el.getAttribute('data-code'));
        };
      });
      map.querySelectorAll('.sp-drop-row').forEach(function (el) {
        el.onclick = function () {
          spToggleCode(el.getAttribute('data-cat'), el.getAttribute('data-code'));
        };
      });
      var dq = document.getElementById('spDropQ');
      if (dq) {
        dq.oninput = function () { SPD.dropQ = dq.value; spDrRender();
          var again = document.getElementById('spDropQ');
          if (again) { again.focus(); again.setSelectionRange(again.value.length, again.value.length); } };
        dq.onclick = function (ev) { ev.stopPropagation(); };
      }
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
          /* An empty mapping is a normal starting state, not a fault. It gets
             asked for at the bill, so there is nothing to warn about here. */
          : '<i class="fas fa-circle-check"></i> Ready — categories can be added later';
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
    var accounts = Object.keys(SPD.codes).reduce(function (a, k) {
      return a + (SPD.codes[k] || []).length;
    }, 0);
    showToast(name + ' saved — ' + n + ' categor' + (n === 1 ? 'y' : 'ies') +
              ' across ' + accounts + ' account' + (accounts === 1 ? '' : 's'));
  }
}
