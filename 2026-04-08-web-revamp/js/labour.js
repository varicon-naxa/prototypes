/* ═══════════════════════════════════════════════════════════════
   Varicon SiteDiary — Labour
   ═══════════════════════════════════════════════════════════════ */

var labourRows = [];
var labourTab = 'supplier';
var labourSerial = 0;
var labourResDropAnchor = null;
var labourResDropCallback = null;

var labourSuppliers = ['11', 'Acme Civil', 'BuildCo', 'Metro Hire'];
var labourResources = [
  { code: '1',             name: '1' },
  { code: '12nov labourer',name: '12nov labourer', sub: 'All Desk Uploaded' },
  { code: 'EX-0412',       name: '612T Excavator' },
  { code: 'Backend',       name: 'Backend' }
];
var labourTasks       = ['- Select Task -', '(1) Site Preliminaries', '(2) Earthworks', '(3) Drainage'];
var labourSubtasks    = ['- Select Subtask -', 'Unassigned Subtask - Demo...', 'Earthworks Sub 1'];
var labourSubSubtasks = ['- Select Sub-Subtask -', 'Sub-Sub Option 1'];
var labourCostCentres = ['- Select Cost Centre -', '(101) Demolition', '(102) Excavation', '(103) Concrete'];

/* ─── Tab switch ─── */
function labourSwitchTab(tab) {
  labourTab = tab;
  var btnS = document.getElementById('labour-tab-supplier');
  var btnR = document.getElementById('labour-tab-resource');
  var thS  = document.getElementById('labour-thead-supplier');
  var thR  = document.getElementById('labour-thead-resource');
  if (!btnS) return;
  btnS.className = 'pe-tab' + (tab === 'supplier' ? ' pe-tab-active' : '');
  btnR.className = 'pe-tab' + (tab === 'resource' ? ' pe-tab-active' : '');
  if (thS) thS.style.display = tab === 'supplier' ? '' : 'none';
  if (thR) thR.style.display = tab === 'resource' ? '' : 'none';
  renderLabourTable();
}

/* ─── Inline add row ─── */
function addLabourInlineRow() {
  labourHideEmpty();
  var tbody = document.getElementById('labour-tbody');
  if (!tbody) return;

  var ex = document.getElementById('labour-inline-row');
  if (ex) { ex.querySelector('select') && ex.querySelector('select').focus(); return; }

  var tr = document.createElement('tr');
  tr.id = 'labour-inline-row';
  tr.style.cssText = 'background:#FFFDF5;';

  // × cancel
  var tdX = _td('padding:6px 8px;text-align:center;border-bottom:1px solid var(--border);');
  var btnX = document.createElement('button');
  btnX.style.cssText = 'background:none;border:none;cursor:pointer;color:var(--tm);font-size:18px;line-height:1;padding:2px 5px;border-radius:3px;';
  btnX.innerHTML = '&times;';
  btnX.onmouseenter = function() { btnX.style.background = 'var(--hover)'; };
  btnX.onmouseleave = function() { btnX.style.background = 'none'; };
  btnX.onclick = function() { tr.remove(); if (!labourRows.length) labourShowEmpty(); };
  tdX.appendChild(btnX);

  // Supplier
  var tdSup = _td('padding:5px 6px;border-bottom:1px solid var(--border);');
  var selSup = _sel(labourSuppliers);
  tdSup.appendChild(selSup);

  // Resource (custom picker)
  var selectedResource = { value: '' };
  var tdRes = _td('padding:5px 6px;border-bottom:1px solid var(--border);');
  var resBtn = document.createElement('div');
  resBtn.style.cssText = 'height:34px;border:1px solid var(--border);border-radius:4px;font-size:12px;padding:0 8px;color:var(--tm);background:#fff;display:flex;align-items:center;cursor:pointer;justify-content:space-between;gap:6px;user-select:none;';
  var resLabel = document.createElement('span');
  resLabel.textContent = 'Select Resource...';
  resBtn.appendChild(resLabel);
  resBtn.insertAdjacentHTML('beforeend', '<svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 4l4 4 4-4"/></svg>');
  resBtn.onclick = function(e) {
    e.stopPropagation();
    labourShowResourceDropdown(resBtn, function(code, name) {
      selectedResource.value = '(' + code + ') ' + name;
      resLabel.textContent = selectedResource.value;
      resLabel.style.color = 'var(--tb)';
      resBtn.style.borderColor = 'var(--amber)';
      setTimeout(function() { resBtn.style.borderColor = 'var(--border)'; }, 1200);
    });
  };
  resBtn.onmouseenter = function() { resBtn.style.borderColor = 'var(--border-d)'; };
  resBtn.onmouseleave = function() { resBtn.style.borderColor = 'var(--border)'; };
  tdRes.appendChild(resBtn);

  // Task
  var tdTask = _td('padding:5px 6px;border-bottom:1px solid var(--border);');
  tdTask.appendChild(_sel(labourTasks));

  // Cost Centre
  var tdCC = _td('padding:5px 6px;border-bottom:1px solid var(--border);');
  tdCC.appendChild(_sel(labourCostCentres));

  // Quantity
  var tdQty = _td('padding:5px 6px;border-bottom:1px solid var(--border);');
  var qtyInput = document.createElement('input');
  qtyInput.type = 'number'; qtyInput.min = '0'; qtyInput.step = '0.5'; qtyInput.placeholder = 'Qty';
  qtyInput.style.cssText = 'width:100%;height:32px;border:1px solid var(--border);border-radius:4px;font-size:12px;padding:0 8px;outline:none;color:var(--tb);text-align:center;';
  qtyInput.onfocus = function() { qtyInput.style.borderColor = 'var(--amber)'; qtyInput.style.boxShadow = '0 0 0 3px rgba(245,166,35,0.12)'; };
  qtyInput.onblur  = function() { qtyInput.style.borderColor = 'var(--border)'; qtyInput.style.boxShadow = 'none'; };
  tdQty.appendChild(qtyInput);

  // Hours
  var tdHrs = _td('padding:5px 6px;border-bottom:1px solid var(--border);');
  var hrsInput = document.createElement('input');
  hrsInput.type = 'number'; hrsInput.min = '0'; hrsInput.step = '0.5'; hrsInput.placeholder = 'Hours';
  hrsInput.style.cssText = 'width:100%;height:32px;border:1px solid var(--border);border-radius:4px;font-size:12px;padding:0 8px;outline:none;color:var(--tb);text-align:center;font-family:\'JetBrains Mono\',monospace;';
  hrsInput.onfocus = function() { hrsInput.style.borderColor = 'var(--amber)'; hrsInput.style.boxShadow = '0 0 0 3px rgba(245,166,35,0.12)'; };
  hrsInput.onblur  = function() { hrsInput.style.borderColor = 'var(--border)'; hrsInput.style.boxShadow = 'none'; };
  tdHrs.appendChild(hrsInput);

  // Approver
  var tdAppr = _td('padding:5px 6px;border-bottom:1px solid var(--border);');
  var apprInput = document.createElement('input');
  apprInput.type = 'text'; apprInput.placeholder = 'Approver';
  apprInput.style.cssText = 'width:100%;height:32px;border:1px solid var(--border);border-radius:4px;font-size:12px;padding:0 8px;outline:none;color:var(--tb);';
  apprInput.onfocus = function() { apprInput.style.borderColor = 'var(--amber)'; apprInput.style.boxShadow = '0 0 0 3px rgba(245,166,35,0.12)'; };
  apprInput.onblur  = function() { apprInput.style.borderColor = 'var(--border)'; apprInput.style.boxShadow = 'none'; };
  tdAppr.appendChild(apprInput);

  // Attachments
  var tdAtt = _td('padding:5px 8px;border-bottom:1px solid var(--border);text-align:center;');
  var attBtn = document.createElement('button');
  attBtn.style.cssText = 'width:30px;height:30px;border:1px solid var(--border);border-radius:4px;background:#fff;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;color:var(--tm);transition:border-color .15s,color .15s;';
  attBtn.innerHTML = '<svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M7 1v8M4 6l3 3 3-3M2 10v1.5A1.5 1.5 0 003.5 13h7A1.5 1.5 0 0012 11.5V10"/></svg>';
  attBtn.onmouseenter = function() { attBtn.style.borderColor = 'var(--amber)'; attBtn.style.color = 'var(--amber)'; };
  attBtn.onmouseleave = function() { attBtn.style.borderColor = 'var(--border)'; attBtn.style.color = 'var(--tm)'; };
  tdAtt.appendChild(attBtn);

  // ✓ confirm
  var tdOk = _td('padding:6px 8px;text-align:center;border-bottom:1px solid var(--border);');
  var btnOk = document.createElement('button');
  btnOk.style.cssText = 'width:28px;height:28px;background:#F5A623;border:none;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;margin:auto;transition:background 0.15s,transform 0.1s;';
  btnOk.innerHTML = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="white" stroke-width="2.2"><path d="M2 6l3 3 5-5"/></svg>';
  btnOk.onmouseenter = function() { btnOk.style.background = '#D4891A'; };
  btnOk.onmouseleave = function() { btnOk.style.background = '#F5A623'; };
  btnOk.onmousedown  = function() { btnOk.style.transform = 'scale(0.93)'; };
  btnOk.onmouseup    = function() { btnOk.style.transform = 'scale(1)'; };
  btnOk.onclick = function() {
    labourSerial++;
    labourRows.push({
      sn:         labourSerial,
      supplier:   selSup.value,
      resource:   selectedResource.value || '—',
      task:       tdTask.querySelector('select').value,
      costcentre: tdCC.querySelector('select').value,
      quantity:   parseFloat(qtyInput.value) || 0,
      hours:      parseFloat(hrsInput.value) || 0,
      approver:   apprInput.value.trim() || '—',
      attachments: 0
    });
    tr.remove();
    renderLabourTable();
    labourUpdateStats();
    labourToast('Labour Added Successfully');
    addLabourInlineRow();
  };
  tdOk.appendChild(btnOk);

  if (labourTab === 'supplier') {
    tr.append(tdX, tdSup, tdRes, tdTask, tdCC, tdQty, tdHrs, tdAppr, tdAtt, tdOk);
  } else {
    tr.append(tdX, tdRes, tdSup, tdTask, tdCC, tdQty, tdHrs, tdAppr, tdAtt, tdOk);
  }
  tbody.appendChild(tr);
  selSup.focus();
}

/* ─── Resource dropdown ─── */
function labourShowResourceDropdown(anchor, onSelect) {
  var dd = document.getElementById('labour-resource-dropdown');
  var list = document.getElementById('labour-resource-list');
  if (!dd || !list) return;

  list.innerHTML = '';
  labourResources.forEach(function(r) {
    var row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:8px 12px;cursor:pointer;font-size:13px;transition:background 0.1s;';
    row.onmouseenter = function() { row.style.background = 'var(--hover)'; };
    row.onmouseleave = function() { row.style.background = ''; };
    var left = document.createElement('div');
    left.innerHTML = '<div style="font-weight:500;color:var(--tb);">(' + r.code + ') ' + r.name + '</div>'
      + (r.sub ? '<div style="font-size:11px;color:var(--tm);">' + r.sub + '</div>' : '');
    var info = document.createElement('span');
    info.style.cssText = 'flex-shrink:0;margin-left:8px;';
    info.innerHTML = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="var(--td)" stroke-width="1.5"><circle cx="8" cy="8" r="6"/><path d="M8 7v4M8 5.5v.5"/></svg>';
    row.appendChild(left); row.appendChild(info);
    row.onclick = function(e) {
      e.stopPropagation();
      onSelect(r.code, r.name);
      dd.style.display = 'none';
    };
    list.appendChild(row);
  });

  // Position relative to anchor
  var rect = anchor.getBoundingClientRect();
  dd.style.position = 'fixed';
  dd.style.top  = (rect.bottom + 2) + 'px';
  dd.style.left = rect.left + 'px';
  dd.style.width = Math.max(anchor.offsetWidth, 260) + 'px';
  dd.style.display = 'block';
  labourResDropAnchor = anchor;
}

document.addEventListener('click', function(e) {
  var dd = document.getElementById('labour-resource-dropdown');
  if (dd && dd.style.display !== 'none' && !dd.contains(e.target) && e.target !== labourResDropAnchor) {
    dd.style.display = 'none';
  }
});

/* ─── Render table ─── */
function renderLabourTable() {
  var tbody = document.getElementById('labour-tbody');
  if (!tbody) return;

  // Remove all rows except inline and empty-state
  Array.from(tbody.rows).forEach(function(r) {
    if (r.id !== 'labour-inline-row' && r.id !== 'labour-empty-row') r.remove();
  });

  // Search filter
  var q = ((document.getElementById('labour-search') || {}).value || '').toLowerCase();
  var filtered = labourRows.filter(function(r) {
    return !q
      || (r.supplier || '').toLowerCase().includes(q)
      || (r.resource || '').toLowerCase().includes(q)
      || (r.task     || '').toLowerCase().includes(q)
      || (r.costcentre || '').toLowerCase().includes(q);
  });

  if (!filtered.length) { labourShowEmpty(); return; }
  labourHideEmpty();

  var groupKey = labourTab === 'supplier' ? 'supplier' : 'resource';
  var groups = {};
  filtered.forEach(function(r) {
    var k = r[groupKey] || '—';
    if (!groups[k]) groups[k] = [];
    groups[k].push(r);
  });

  var inline = document.getElementById('labour-inline-row');

  Object.keys(groups).forEach(function(gName) {
    var rows = groups[gName];
    var totalQty = rows.reduce(function(s, r) { return s + r.quantity; }, 0);
    var avgHrs   = totalQty / rows.length;
    var expanded = true;
    var dataRows = [];

    // Group header
    var gtr = document.createElement('tr');
    gtr.style.cssText = 'background:var(--thead);cursor:pointer;border-bottom:1px solid var(--border);';
    gtr.onmouseenter = function() { gtr.style.background = 'var(--border-d)'; };
    gtr.onmouseleave = function() { gtr.style.background = 'var(--thead)'; };
    var gtd = document.createElement('td');
    gtd.colSpan = 10;
    gtd.style.cssText = 'padding:9px 12px;font-size:13px;font-weight:600;color:var(--tp);';
    var chevId = 'lbr-chev-' + gName.replace(/[^a-z0-9]/gi, '_');
    gtd.innerHTML = '<span style="display:inline-flex;align-items:center;gap:8px;">'
      + '<svg id="' + chevId + '" width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="var(--tm)" stroke-width="2" style="transition:transform 0.15s ease;flex-shrink:0;"><path d="M4 6l4 4 4-4"/></svg>'
      + '<span style="font-weight:700;color:var(--tp);">' + gName + '</span>'
      + '<span style="font-weight:400;font-size:12px;color:var(--tm);">Labour: ' + rows.length
      + ', Avg. hours per worker ' + avgHrs.toFixed(2) + ' hrs&nbsp;|&nbsp;Total work hours: ' + totalQty.toFixed(2) + ' hrs</span>'
      + '</span>'
      + '<span style="float:right;font-size:13px;font-weight:600;color:var(--tb);">' + totalQty.toFixed(2) + '</span>';
    gtr.appendChild(gtd);
    gtr.onclick = function() {
      expanded = !expanded;
      var chev = document.getElementById(chevId);
      if (chev) chev.style.transform = expanded ? 'rotate(0deg)' : 'rotate(-90deg)';
      dataRows.forEach(function(dr) { dr.style.display = expanded ? '' : 'none'; });
    };
    inline ? tbody.insertBefore(gtr, inline) : tbody.appendChild(gtr);

    rows.forEach(function(r) {
      var tr2 = document.createElement('tr');
      tr2.style.cssText = 'border-bottom:1px solid var(--border);transition:background 0.1s;';
      tr2.onmouseenter = function() { tr2.style.background = 'var(--hover)'; };
      tr2.onmouseleave = function() { tr2.style.background = ''; };

      var cols = [r.sn];
      if (labourTab === 'supplier') cols.push(r.supplier, r.resource);
      else cols.push(r.resource, r.supplier);
      cols.push(r.task, r.costcentre, r.quantity ? r.quantity.toFixed(2) : '—', r.hours ? r.hours.toFixed(1) + 'h' : '—', r.approver || '—');

      // col styles: 0=S.N, 1=supplier/resource, 2=resource/supplier, 3=task, 4=costcentre, 5=qty, 6=hours, 7=approver
      cols.forEach(function(val, i) {
        var td = document.createElement('td');
        var base = 'padding:10px 12px;font-size:13px;border-right:1px solid var(--border);';
        if (i === 0) {
          td.style.cssText = base + 'color:var(--tm);font-weight:500;text-align:center;width:44px;';
        } else if (i === 5) {
          td.style.cssText = base + 'color:var(--tb);text-align:center;font-family:\'JetBrains Mono\',monospace;font-size:12px;';
        } else if (i === 6) {
          td.style.cssText = base + 'color:var(--tp);text-align:center;font-family:\'JetBrains Mono\',monospace;font-size:12px;font-weight:600;';
        } else if (i === 7) {
          td.style.cssText = base + 'color:var(--tm);font-size:12px;';
        } else {
          td.style.cssText = base + 'color:var(--tb);';
        }
        td.textContent = val || '—';
        tr2.appendChild(td);
      });

      // Attachments cell
      var tdAttView = document.createElement('td');
      tdAttView.style.cssText = 'padding:8px 10px;text-align:center;border-right:1px solid var(--border);';
      var attCount = r.attachments || 0;
      tdAttView.innerHTML = attCount > 0
        ? '<span style="display:inline-flex;align-items:center;gap:3px;font-size:12px;color:var(--amber);font-weight:600;">'
          + '<svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 7.5l-5.5 5.5a4 4 0 01-5.66-5.66l6-6a2.5 2.5 0 013.54 3.54l-6 6a1 1 0 01-1.42-1.42l5.5-5.5"/></svg>'
          + attCount + '</span>'
        : '<button style="width:26px;height:26px;border:1px dashed var(--border);border-radius:4px;background:none;cursor:pointer;color:var(--td);display:inline-flex;align-items:center;justify-content:center;" title="Add attachment" onmouseenter="this.style.borderColor=\'var(--amber)\';this.style.color=\'var(--amber)\'" onmouseleave="this.style.borderColor=\'var(--border)\';this.style.color=\'var(--td)\'">'
          + '<svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M7 2v10M2 7h10"/></svg>'
          + '</button>';
      tr2.appendChild(tdAttView);

      // Actions
      var tdAct = document.createElement('td');
      tdAct.style.cssText = 'padding:6px 8px;text-align:center;white-space:nowrap;';
      tdAct.innerHTML = '<button style="background:none;border:none;cursor:pointer;color:var(--tm);padding:3px;border-radius:3px;" title="Edit" onmouseenter="this.style.color=\'var(--amber)\'" onmouseleave="this.style.color=\'var(--tm)\'">'
        + '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M11 2l3 3-9 9H2v-3L11 2z"/></svg>'
        + '</button>'
        + '<button style="width:22px;height:22px;background:var(--amber);border:none;border-radius:50%;cursor:pointer;margin-left:5px;vertical-align:middle;transition:background 0.15s;" title="Options" onmouseenter="this.style.background=\'#D4891A\'" onmouseleave="this.style.background=\'var(--amber)\'">'
        + '<svg width="3" height="11" viewBox="0 0 3 11" fill="white"><circle cx="1.5" cy="1.5" r="1.5"/><circle cx="1.5" cy="5.5" r="1.5"/><circle cx="1.5" cy="9.5" r="1.5"/></svg>'
        + '</button>';
      tr2.appendChild(tdAct);

      dataRows.push(tr2);
      inline ? tbody.insertBefore(tr2, inline) : tbody.appendChild(tr2);
    });
  });
}

/* ─── Empty state ─── */
function labourHideEmpty() {
  var e = document.getElementById('labour-empty-row');
  if (e) e.style.display = 'none';
}
function labourShowEmpty() {
  var e = document.getElementById('labour-empty-row');
  if (e) e.style.display = '';
  var ir = document.getElementById('labour-inline-row');
  if (ir) ir.remove();
}

/* ─── Stats ─── */
function labourUpdateStats() {
  var countEl = document.getElementById('labour-stat-count');
  var timeEl  = document.getElementById('labour-stat-time');
  if (countEl) countEl.textContent = labourRows.length;
  var totalQty = labourRows.reduce(function(s, r) { return s + r.quantity; }, 0);
  var h = Math.floor(totalQty);
  var m = Math.round((totalQty - h) * 60);
  if (timeEl) timeEl.textContent = h + 'H ' + (m < 10 ? '0' + m : m) + 'M';
}

/* ─── Rollover ─── */
function rolloverLabour() {
  labourToast('No previous day data to roll over.');
}

/* ─── Toast ─── */
function labourToast(msg) {
  var ex = document.getElementById('labour-toast');
  if (ex) ex.remove();
  var t = document.createElement('div');
  t.id = 'labour-toast';
  t.style.cssText = 'position:fixed;top:18px;left:50%;transform:translateX(-50%);z-index:9999;background:#fff;border:1px solid var(--border);border-radius:6px;padding:12px 20px;display:flex;align-items:center;gap:10px;box-shadow:0 4px 6px rgba(0,0,0,0.07),0 10px 40px rgba(0,0,0,0.12);min-width:260px;animation:labourFadeIn 0.2s ease;';
  t.innerHTML = '<span style="width:22px;height:22px;background:var(--green);border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">'
    + '<svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="white" stroke-width="2.2"><path d="M2 6l3 3 5-5"/></svg></span>'
    + '<div><div style="font-size:13px;font-weight:600;color:var(--tp);">Success</div>'
    + '<div style="font-size:12px;color:var(--tm);">' + msg + '</div></div>'
    + '<button onclick="this.parentElement.remove()" style="background:none;border:none;cursor:pointer;color:var(--td);margin-left:auto;font-size:18px;line-height:1;padding:0 2px;" onmouseenter="this.style.color=\'var(--tb)\'" onmouseleave="this.style.color=\'var(--td)\'">&times;</button>';
  if (!document.getElementById('labour-toast-style')) {
    var s = document.createElement('style');
    s.id = 'labour-toast-style';
    s.textContent = '@keyframes labourFadeIn{from{opacity:0;transform:translateX(-50%) translateY(-6px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}';
    document.head.appendChild(s);
  }
  document.body.appendChild(t);
  setTimeout(function() { if (t.parentElement) { t.style.transition = 'opacity 0.3s'; t.style.opacity = '0'; setTimeout(function() { t.remove(); }, 300); } }, 3200);
}

/* ─── Helpers ─── */
function _td(css) {
  var t = document.createElement('td');
  t.style.cssText = css || '';
  return t;
}
function _sel(opts) {
  var s = document.createElement('select');
  s.style.cssText = 'width:100%;height:34px;border:1px solid var(--border);border-radius:4px;font-size:12px;padding:0 6px;color:var(--tb);background:#fff;outline:none;cursor:pointer;';
  s.onfocus = function() { s.style.borderColor = 'var(--amber)'; s.style.boxShadow = '0 0 0 3px rgba(245,166,35,0.12)'; };
  s.onblur  = function() { s.style.borderColor = 'var(--border)'; s.style.boxShadow = 'none'; };
  opts.forEach(function(o) {
    var opt = document.createElement('option');
    opt.value = o; opt.textContent = o;
    s.appendChild(opt);
  });
  return s;
}
