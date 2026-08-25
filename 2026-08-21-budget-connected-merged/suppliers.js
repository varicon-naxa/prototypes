/* ══════════════════════════════════════════════════════════════════════════
   Suppliers — the org's supplier list.

   Derived like everything else: every supplier named on a purchase order, a
   site docket, a bill or a cost-plus invoice in the budget. So the list is
   exactly the firms this job actually buys from, and it grows when the budget
   does rather than being a table of invented names.
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
          '<td><span class="sp-acts"><i class="fas fa-pen" title="Edit"></i>' +
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
    th.classList.toggle('on', th.getAttribute('onclick').indexOf("'" + key + "'") >= 0);
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

/* Xero is the accounting substrate, so a sync pulls the supplier records in.
   Nothing to pull here — they are all already known to the budget — so this
   says so rather than pretending to fetch. */
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

function spAdd() {
  if (typeof showToast === 'function') {
    showToast('Suppliers created in Varicon start bare, then fill out as bills arrive');
  }
}

function spSyncData() {
  SP.page = 1;
  var q = document.getElementById('spSearch');
  if (q) q.value = '';
  spRender();
}
