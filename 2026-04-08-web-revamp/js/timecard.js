/* ═══════════════════════════════════════════════════════════════
   Varicon SiteDiary — Timecard
   ═══════════════════════════════════════════════════════════════ */

var tcRows = [];          // active employee timecard rows
var tcEmpModalSel = [];   // selected in modal
var tcColPanelOpen = false;
var tcSfPanelOpen  = false;
var tcAppliedTasks = [];  // task/CC columns added via task modal
var tcStatusFilter = [];  // selected status values for filter

/* Copy-from-previous panel state */
var tcCopyPanelOpen = false;
var tcCopyRows      = [];   // source data loaded for chosen date
var tcCopySel       = [];   // selected indices in copy panel

/* ─── Sample employee catalogue ─── */
var tcEmployeeCatalogue = [
  { id: 'ID:3333',       name: 'James Kula',     role: 'Admin',         group: 'project' },
  { id: 'ID:007',        name: 'Boni Khatiwada', role: 'Labour',        group: 'project' },
  { id: 'ID:Anu12',      name: 'Anu Praz',       role: 'employee',      group: 'project' },
  { id: 'RamLaxman',     name: 'Ram Laxman',     role: 'Skilled Labour',group: 'unassigned' },
  { id: 'AnnolKC',       name: 'Annot KC',       role: 'Labour',        group: 'unassigned' },
  { id: 'Ranjitasigdel', name: 'Ranjita Sigdel', role: 'Labour',        group: 'unassigned' },
];

var tcBreakOpts = ['—', '0', '15', '30', '45', '60'];
var tcStatusOpts = ['—', 'Unapproved', 'Waiting for Approval', 'Approved', 'Clocked In'];

/* ═══════════════════════════════════════════════════════════════
   SAVE
   ═══════════════════════════════════════════════════════════════ */
function tcSave() {
  tcUpdateStats();
  if (typeof showToast === 'function') showToast('Timecard saved');
}

function tcCancelEdit() {
  renderTimecard();
}

/* ═══════════════════════════════════════════════════════════════
   COLUMN PANEL
   ═══════════════════════════════════════════════════════════════ */
function tcToggleColPanel() {
  tcColPanelOpen = !tcColPanelOpen;
  var panel = document.getElementById('tc-col-panel');
  if (panel) panel.style.display = tcColPanelOpen ? 'block' : 'none';
}

document.addEventListener('click', function(e) {
  // Close columns panel
  if (tcColPanelOpen) {
    var colBtn   = document.getElementById('tc-col-btn');
    var colPanel = document.getElementById('tc-col-panel');
    if (colPanel && colBtn && !colPanel.contains(e.target) && !colBtn.contains(e.target)) {
      tcColPanelOpen = false;
      colPanel.style.display = 'none';
    }
  }
  // Close status filter panel
  if (tcSfPanelOpen) {
    var sfBtn   = document.getElementById('tc-sf-btn');
    var sfPanel = document.getElementById('tc-sf-panel');
    if (sfPanel && sfBtn && !sfPanel.contains(e.target) && !sfBtn.contains(e.target)) {
      tcSfPanelOpen = false;
      sfPanel.style.display = 'none';
    }
  }
});

/* ── Status filter helpers ── */
function tcToggleStatusFilter() {
  tcSfPanelOpen = !tcSfPanelOpen;
  var panel = document.getElementById('tc-sf-panel');
  if (panel) panel.style.display = tcSfPanelOpen ? 'block' : 'none';
}

function tcStatusFilterChange() {
  var checkboxes = document.querySelectorAll('#tc-sf-panel input[type=checkbox]');
  tcStatusFilter = [];
  checkboxes.forEach(function(cb) { if (cb.checked) tcStatusFilter.push(cb.value); });
  // Update button label
  var label = document.getElementById('tc-sf-label');
  if (label) label.textContent = tcStatusFilter.length ? 'Status: ' + tcStatusFilter.length + ' selected' : 'Status: All';
  var btn = document.getElementById('tc-sf-btn');
  if (btn) btn.style.borderColor = tcStatusFilter.length ? 'var(--amber)' : 'var(--border)';
  renderTimecard();
}

function tcClearStatusFilter() {
  tcStatusFilter = [];
  var checkboxes = document.querySelectorAll('#tc-sf-panel input[type=checkbox]');
  checkboxes.forEach(function(cb) { cb.checked = false; });
  var label = document.getElementById('tc-sf-label');
  if (label) label.textContent = 'Status: All';
  var btn = document.getElementById('tc-sf-btn');
  if (btn) btn.style.borderColor = 'var(--border)';
  renderTimecard();
}

function tcColVisible(id) {
  var el = document.getElementById('tc-col-' + id);
  return el ? el.querySelector('input').checked : true;
}

/* ═══════════════════════════════════════════════════════════════
   RENDER TABLE
   ═══════════════════════════════════════════════════════════════ */
function renderTimecard() {
  var thead = document.getElementById('tc-thead');
  var tbody = document.getElementById('tc-tbody');
  if (!tbody) return;

  var q = ((document.getElementById('tc-search') || {}).value || '').toLowerCase();
  var showStart   = tcColVisible('start');
  var showEnd     = tcColVisible('end');
  var showBreak   = tcColVisible('break');
  var showTotal   = tcColVisible('total');
  var showStatus  = tcColVisible('status');
  var showApprover= tcColVisible('approver');
  var showRemarks = tcColVisible('remarks');

  // ── Header ──
  if (thead) {
    var TH = 'background:var(--thead);color:var(--tb);font-size:12px;font-weight:600;padding:10px 12px;white-space:nowrap;border-right:1px solid var(--border-d);text-align:left;font-family:inherit;';
    var THC = TH + 'text-align:center;';
    var THTASK = 'background:var(--thead);color:var(--tm);font-size:11px;font-weight:600;padding:8px 10px;border-right:1px solid var(--border-d);text-align:center;min-width:80px;position:relative;font-family:inherit;';
    var h = '<tr>'
      + '<th style="' + TH + 'width:32px;"></th>'
      + '<th style="' + TH + 'min-width:180px;">Employee</th>';
    if (showStart)    h += '<th style="' + THC + 'width:120px;">Start</th>';
    if (showEnd)      h += '<th style="' + THC + 'width:120px;">End</th>';
    if (showBreak)    h += '<th style="' + THC + 'width:70px;">Break</th>';
    if (showTotal)    h += '<th style="' + THC + 'width:80px;">Total</th>';
    if (showStatus)   h += '<th style="' + THC + 'width:130px;">Status</th>';
    if (showApprover) h += '<th style="' + TH  + 'width:130px;">Approver</th>';
    if (showRemarks)  h += '<th style="' + THC + 'width:60px;' + (tcAppliedTasks.length ? 'border-right:1px solid var(--border-d);' : 'border-right:none;') + '">Remarks</th>';
    // Task / CC columns
    tcAppliedTasks.forEach(function(t, ti) {
      var label = '(' + t.code + ') ' + t.name;
      var truncated = label.length > 16 ? label.substring(0, 16) + '…' : label;
      var isLast = ti === tcAppliedTasks.length - 1;
      h += '<th style="' + THTASK + (isLast ? 'border-right:none;' : '') + '" title="' + label + '">'
        + '<div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:90px;margin:auto;">' + truncated + '</div>'
        + '<div style="font-size:9px;font-weight:400;color:var(--td);margin-top:2px;">' + (t.parent || 'Task') + '</div>'
        + '<button onclick="removeTcTask(\'' + t.code + '\')" title="Remove column" style="position:absolute;top:3px;right:3px;background:none;border:none;cursor:pointer;color:var(--td);font-size:9px;line-height:1;padding:0;" onmouseenter="this.style.color=\'var(--red)\'" onmouseleave="this.style.color=\'var(--td)\'">✕</button>'
        + '</th>';
    });
    h += '</tr>';
    thead.innerHTML = h;
  }

  // ── Filter ──
  var filtered = tcRows.filter(function(r) {
    var matchQ = !q || r.name.toLowerCase().includes(q) || r.role.toLowerCase().includes(q) || r.id.toLowerCase().includes(q);
    var matchS = !tcStatusFilter.length || tcStatusFilter.includes(r.status);
    return matchQ && matchS;
  });

  // ── Empty state ──
  var emptyRow = document.getElementById('tc-empty-row');
  if (!tcRows.length) {
    if (emptyRow) emptyRow.style.display = '';
    Array.from(tbody.rows).forEach(function(r) { if (r.id !== 'tc-empty-row') r.remove(); });
    tcUpdateStats();
    return;
  }
  if (emptyRow) emptyRow.style.display = 'none';

  // ── Remove old data rows ──
  Array.from(tbody.rows).forEach(function(r) { if (r.id !== 'tc-empty-row') r.remove(); });

  filtered.forEach(function(r, fi) {
    var idx = tcRows.indexOf(r);
    var total = tcCalcTotal(r.start, r.end, parseInt(r.brk) || 0);
    var tr = document.createElement('tr');
    tr.style.cssText = 'border-bottom:1px solid var(--border);transition:background .1s;';
    tr.onmouseenter = function() { tr.style.background = 'var(--hover)'; };
    tr.onmouseleave = function() { tr.style.background = ''; };

    // Remove btn
    var tdX = document.createElement('td');
    tdX.style.cssText = 'padding:0 6px;text-align:center;border-right:1px solid var(--border);width:32px;';
    tdX.innerHTML = '<button onclick="tcRemoveRow(' + idx + ')" title="Remove" style="background:none;border:none;cursor:pointer;color:var(--td);padding:4px;border-radius:3px;" onmouseenter="this.style.color=\'var(--red)\'" onmouseleave="this.style.color=\'var(--td)\'">'
      + '<svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 3l6 6M9 3l-6 6"/></svg></button>';
    tr.appendChild(tdX);

    // Employee cell
    var tdEmp = document.createElement('td');
    tdEmp.style.cssText = 'padding:10px 12px;border-right:1px solid var(--border);';
    var initials = r.name.split(' ').map(function(w){ return w[0]; }).join('').substring(0,2).toUpperCase();
    var dotColor = r.status === 'Approved' ? '#10B981' : r.status === 'Clocked In' ? '#3B82F6' : r.status === 'Unapproved' ? '#F5A623' : 'transparent';
    tdEmp.innerHTML = '<div style="display:flex;align-items:center;gap:9px;">'
      + '<div style="position:relative;flex-shrink:0;">'
      + '<div style="width:32px;height:32px;border-radius:50%;background:#E5E7EB;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:var(--tb);">' + initials + '</div>'
      + (dotColor !== 'transparent' ? '<span style="position:absolute;bottom:0;right:0;width:8px;height:8px;border-radius:50%;background:' + dotColor + ';border:1.5px solid #fff;"></span>' : '')
      + '</div>'
      + '<div>'
      + '<div style="font-size:13px;font-weight:600;color:var(--tp);">' + r.name + '</div>'
      + '<div style="font-size:11px;color:var(--tm);margin-top:1px;">' + r.role + ' · <span style="font-family:\'JetBrains Mono\',monospace;">' + r.id + '</span></div>'
      + '</div></div>';
    tr.appendChild(tdEmp);

    // Start
    if (showStart) {
      var tdS = document.createElement('td');
      tdS.style.cssText = 'padding:8px 10px;text-align:center;border-right:1px solid var(--border);';
      tdS.innerHTML = '<input type="time" value="' + (r.start||'') + '" style="width:82px;height:30px;border:1px solid var(--border);border-radius:4px;font-size:11px;padding:0 6px;outline:none;font-family:\'JetBrains Mono\',monospace;color:var(--tb);" onfocus="this.style.borderColor=\'var(--amber)\'" onblur="this.style.borderColor=\'var(--border)\';tcRows[' + idx + '].start=this.value;tcRefreshTotal(' + idx + ')" onchange="tcRows[' + idx + '].start=this.value">';
      tr.appendChild(tdS);
    }

    // End
    if (showEnd) {
      var tdE = document.createElement('td');
      tdE.style.cssText = 'padding:8px 10px;text-align:center;border-right:1px solid var(--border);';
      if (r.status === 'Clocked In') {
        tdE.innerHTML = '<span style="font-size:11px;font-weight:600;color:#3B82F6;background:#EFF6FF;border:1px solid #BFDBFE;border-radius:4px;padding:2px 8px;">Ongoing</span>';
      } else {
        tdE.innerHTML = '<input type="time" value="' + (r.end||'') + '" style="width:82px;height:30px;border:1px solid var(--border);border-radius:4px;font-size:11px;padding:0 6px;outline:none;font-family:\'JetBrains Mono\',monospace;color:var(--tb);" onfocus="this.style.borderColor=\'var(--amber)\'" onblur="this.style.borderColor=\'var(--border)\';tcRows[' + idx + '].end=this.value;tcRefreshTotal(' + idx + ')" onchange="tcRows[' + idx + '].end=this.value">';
      }
      tr.appendChild(tdE);
    }

    // Break
    if (showBreak) {
      var tdB = document.createElement('td');
      tdB.style.cssText = 'padding:8px 8px;text-align:center;border-right:1px solid var(--border);';
      var bkSel = '<select style="width:60px;height:30px;border:1px solid var(--border);border-radius:4px;font-size:12px;padding:0 4px;outline:none;background:#fff;cursor:pointer;font-family:\'JetBrains Mono\',monospace;" onfocus="this.style.borderColor=\'var(--amber)\'" onblur="this.style.borderColor=\'var(--border)\'" onchange="tcRows[' + idx + '].brk=this.value;tcRefreshTotal(' + idx + ')">';
      tcBreakOpts.forEach(function(o) { bkSel += '<option value="' + o + '"' + (r.brk==o?' selected':'') + '>' + o + '</option>'; });
      bkSel += '</select>';
      tdB.innerHTML = bkSel;
      tr.appendChild(tdB);
    }

    // Total
    if (showTotal) {
      var tdT = document.createElement('td');
      tdT.style.cssText = 'padding:8px 10px;text-align:center;border-right:1px solid var(--border);';
      tdT.id = 'tc-total-' + idx;
      tdT.innerHTML = '<span style="font-size:12px;font-family:\'JetBrains Mono\',monospace;font-weight:' + (total ? '700' : '400') + ';color:' + (total ? 'var(--tp)' : 'var(--td)') + ';">' + (total || '—') + '</span>';
      tr.appendChild(tdT);
    }

    // Status
    if (showStatus) {
      var tdSt = document.createElement('td');
      tdSt.style.cssText = 'padding:8px 10px;text-align:center;border-right:1px solid var(--border);';
      var stSel = '<select style="width:100%;height:30px;border:1px solid var(--border);border-radius:4px;font-size:12px;font-family:inherit;padding:0 6px;outline:none;background:#fff;cursor:pointer;" onfocus="this.style.borderColor=\'var(--amber)\'" onblur="this.style.borderColor=\'var(--border)\'" onchange="tcRows[' + idx + '].status=this.value;renderTimecard()">';
      tcStatusOpts.forEach(function(o) { stSel += '<option value="' + o + '"' + (r.status===o?' selected':'') + '>' + o + '</option>'; });
      stSel += '</select>';
      tdSt.innerHTML = stSel;
      tr.appendChild(tdSt);
    }

    // Approver
    if (showApprover) {
      var tdAp = document.createElement('td');
      tdAp.style.cssText = 'padding:8px 12px;border-right:1px solid var(--border);';
      tdAp.innerHTML = '<input type="text" value="' + (r.approver||'') + '" placeholder="—" style="width:100%;height:30px;border:1px solid transparent;border-radius:4px;font-size:13px;font-family:inherit;padding:0 8px;outline:none;box-sizing:border-box;background:transparent;color:var(--tb);" onfocus="this.style.borderColor=\'var(--amber)\';this.style.background=\'#fff\'" onblur="this.style.borderColor=\'transparent\';this.style.background=\'transparent\';tcRows[' + idx + '].approver=this.value">';
      tr.appendChild(tdAp);
    }

    // Remarks
    if (showRemarks) {
      var tdR = document.createElement('td');
      tdR.style.cssText = 'padding:8px 10px;text-align:center;' + (tcAppliedTasks.length ? 'border-right:1px solid var(--border);' : '');
      var hasNote = r.remarks && r.remarks.trim();
      tdR.innerHTML = '<button title="' + (hasNote ? 'View note' : 'Add note') + '" onclick="tcEditRemark(' + idx + ')" style="width:28px;height:28px;border:1px solid ' + (hasNote ? 'var(--amber)' : 'var(--border)') + ';border-radius:4px;background:' + (hasNote ? '#FFFDF5' : '#fff') + ';cursor:pointer;display:inline-flex;align-items:center;justify-content:center;color:' + (hasNote ? 'var(--amber)' : 'var(--td)') + ';" onmouseenter="this.style.borderColor=\'var(--amber)\';this.style.color=\'var(--amber)\'" onmouseleave="this.style.borderColor=\'' + (hasNote ? 'var(--amber)' : 'var(--border)') + '\';this.style.color=\'' + (hasNote ? 'var(--amber)' : 'var(--td)') + '\'">'
        + '<svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="10" height="10" rx="1.5"/><path d="M4.5 5h5M4.5 7.5h5M4.5 10h3"/></svg>'
        + '</button>';
      tr.appendChild(tdR);
    }

    // Task / CC cells
    if (!r.taskMins) r.taskMins = {};
    tcAppliedTasks.forEach(function(t, ti) {
      var val = r.taskMins[t.code] || 0;
      var isLast = ti === tcAppliedTasks.length - 1;
      var tdTk = document.createElement('td');
      tdTk.style.cssText = 'padding:6px 8px;text-align:center;' + (isLast ? '' : 'border-right:1px solid var(--border);');
      tdTk.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;gap:2px;">'
        + '<input type="number" value="' + val + '" min="0" step="15" style="width:46px;height:28px;text-align:center;font-family:\'JetBrains Mono\',monospace;font-size:11px;font-weight:' + (val ? '600' : '400') + ';color:' + (val ? 'var(--tp)' : 'var(--td)') + ';border:1px solid transparent;border-radius:4px;background:transparent;outline:none;padding:0 4px;" onfocus="this.style.borderColor=\'var(--amber)\';this.style.background=\'#fff\';this.style.color=\'var(--tp)\'" onblur="this.style.borderColor=\'transparent\';this.style.background=\'transparent\'" onchange="tcRows[' + idx + '].taskMins[' + JSON.stringify(t.code) + ']=parseInt(this.value)||0">'
        + '<button onclick="tcQuickTimePopup(' + idx + ',' + JSON.stringify(t.code) + ')" style="background:none;border:none;cursor:pointer;color:var(--td);opacity:.5;padding:1px;" title="Quick set" onmouseenter="this.style.opacity=\'1\';this.style.color=\'var(--amber)\'" onmouseleave="this.style.opacity=\'.5\';this.style.color=\'var(--td)\'">'
        + '<svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="7" cy="7" r="5.5"/><path d="M7 4.5v2.5l2 1.5"/></svg>'
        + '</button></div>';
      tr.appendChild(tdTk);
    });

    tbody.appendChild(tr);
  });

  tcUpdateStats();
  var footer = document.getElementById('tc-footer');
  if (footer) footer.style.display = tcRows.length ? 'flex' : 'none';
}

/* ═══════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════ */
function tcRefreshTotal(idx) {
  var r = tcRows[idx];
  if (!r) return;
  var total = tcCalcTotal(r.start, r.end, parseInt(r.brk) || 0);
  var cell = document.getElementById('tc-total-' + idx);
  if (cell) cell.innerHTML = '<span style="font-size:12px;font-family:\'JetBrains Mono\',monospace;font-weight:' + (total ? '700' : '400') + ';color:' + (total ? 'var(--tp)' : 'var(--td)') + ';">' + (total || '—') + '</span>';
  tcUpdateStats();
}

function tcFmt12(t24) {
  if (!t24) return '—';
  var parts = t24.split(':');
  var h = parseInt(parts[0]), m = parseInt(parts[1]);
  var ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return h + ':' + (m < 10 ? '0' + m : m) + ' ' + ampm;
}

function tcCalcTotal(start, end, brkMins) {
  if (!start || !end) return '';
  var s = start.split(':'), e = end.split(':');
  var sm = parseInt(s[0]) * 60 + parseInt(s[1]);
  var em = parseInt(e[0]) * 60 + parseInt(e[1]);
  if (em <= sm) em += 1440;
  var total = em - sm - (brkMins || 0);
  if (total <= 0) return '—';
  return Math.floor(total / 60) + 'h ' + (total % 60) + 'm';
}

function tcStatusBadge(status) {
  var map = {
    'Approved':             { bg:'#D1FAE5', color:'#065F46', border:'#A7F3D0' },
    'Unapproved':           { bg:'#FEF3DC', color:'#92400E', border:'#FDE68A' },
    'Waiting for Approval': { bg:'#FEF3DC', color:'#92400E', border:'#FDE68A' },
    'Clocked In':           { bg:'#DBEAFE', color:'#1D4ED8', border:'#BFDBFE' },
  };
  if (!status || status === '—') return '<span style="font-size:12px;color:var(--td);">—</span>';
  var s = map[status] || { bg:'var(--hover)', color:'var(--tm)', border:'var(--border)' };
  return '<span style="display:inline-block;font-size:11px;font-weight:600;padding:3px 10px;border-radius:4px;background:' + s.bg + ';color:' + s.color + ';border:1px solid ' + s.border + ';white-space:nowrap;">' + status + '</span>';
}

function tcRemoveRow(idx) {
  tcRows.splice(idx, 1);
  renderTimecard();
  tcUpdateStats();
}

function tcQuickTimePopup(rowIdx, taskCode) {
  var current = (tcRows[rowIdx].taskMins || {})[taskCode] || 0;
  var presets = [0, 30, 60, 120, 240, 480];
  var labels  = ['0', '30m', '1h', '2h', '4h', '8h'];
  var existing = document.getElementById('tc-time-popup');
  if (existing) existing.remove();
  var popup = document.createElement('div');
  popup.id = 'tc-time-popup';
  popup.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;border:1px solid var(--border);border-radius:6px;box-shadow:0 4px 16px rgba(0,0,0,.15);z-index:9999;min-width:220px;';
  popup.innerHTML = '<div style="padding:8px 10px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;">'
    + '<span style="font-size:11px;font-weight:600;color:var(--tp);">Quick Duration</span>'
    + '<button onclick="document.getElementById(\'tc-time-popup\').remove()" style="background:none;border:none;cursor:pointer;color:var(--tm);font-size:14px;">✕</button>'
    + '</div><div style="display:flex;flex-wrap:wrap;gap:4px;padding:10px;">'
    + presets.map(function(m, i) {
        return '<button onclick="if(tcRows[' + rowIdx + '].taskMins===undefined)tcRows[' + rowIdx + '].taskMins={};tcRows[' + rowIdx + '].taskMins[' + JSON.stringify(taskCode) + ']=' + m + ';renderTimecard();document.getElementById(\'tc-time-popup\').remove()" style="flex:1;min-width:40px;height:28px;border-radius:4px;border:1px solid ' + (m===current?'var(--amber)':'var(--border)') + ';background:' + (m===current?'var(--amber)':'#fff') + ';color:' + (m===current?'#fff':'var(--tb)') + ';font-size:11px;font-weight:500;font-family:\'JetBrains Mono\',monospace;cursor:pointer;">' + labels[i] + '</button>';
      }).join('')
    + '</div>';
  document.body.appendChild(popup);
  setTimeout(function() {
    document.addEventListener('click', function _cl(e) {
      if (!popup.contains(e.target)) { popup.remove(); document.removeEventListener('click', _cl); }
    });
  }, 10);
}

function tcEditRemark(idx) {
  var current = tcRows[idx].remarks || '';
  var val = prompt('Note for ' + tcRows[idx].name + ':', current);
  if (val !== null) {
    tcRows[idx].remarks = val;
    renderTimecard();
  }
}

/* ═══════════════════════════════════════════════════════════════
   STATS
   ═══════════════════════════════════════════════════════════════ */
function tcUpdateStats() {
  var approved   = tcRows.filter(function(r){ return r.status === 'Approved'; });
  var unapproved = tcRows.filter(function(r){ return r.status === 'Unapproved' || r.status === 'Waiting for Approval'; });
  var clocked    = tcRows.filter(function(r){ return r.status === 'Clocked In'; });

  var totalApprMins = approved.reduce(function(s, r) {
    var t = tcCalcTotal(r.start, r.end, parseInt(r.brk) || 0);
    if (!t || t === '—') return s;
    var m = t.match(/(\d+)h\s*(\d+)m/);
    return s + (m ? parseInt(m[1]) * 60 + parseInt(m[2]) : 0);
  }, 0);

  function _set(id, val) { var el = document.getElementById(id); if (el) el.textContent = val; }
  _set('tc-stat-emp',      tcRows.length);
  _set('tc-stat-appr',     Math.floor(totalApprMins/60) + 'h ' + (totalApprMins%60) + 'm');
  _set('tc-stat-approved', approved.length);
  _set('tc-stat-unappr',   unapproved.length);
  _set('tc-stat-clocked',  clocked.length);
  _set('tc-stat-total',    tcRows.length);
}

/* ═══════════════════════════════════════════════════════════════
   ADD EMPLOYEES MODAL
   ═══════════════════════════════════════════════════════════════ */
function tcOpenAddEmployees() {
  tcEmpModalSel = [];
  var modal = document.getElementById('tc-emp-modal');
  if (modal) { modal.style.display = 'flex'; modal.style.alignItems = 'center'; modal.style.justifyContent = 'center'; }
  tcRenderEmpList();
  tcRenderEmpSelList();
}

function tcCloseEmpModal() {
  var modal = document.getElementById('tc-emp-modal');
  if (modal) modal.style.display = 'none';
}

function tcRenderEmpList() {
  var list = document.getElementById('tc-emp-list');
  if (!list) return;
  var q = ((document.getElementById('tc-emp-search') || {}).value || '').toLowerCase();
  var already = tcRows.map(function(r){ return r.id; });

  var project    = tcEmployeeCatalogue.filter(function(e){ return e.group === 'project' && (!q || e.name.toLowerCase().includes(q) || e.id.toLowerCase().includes(q)); });
  var unassigned = tcEmployeeCatalogue.filter(function(e){ return e.group === 'unassigned' && (!q || e.name.toLowerCase().includes(q) || e.id.toLowerCase().includes(q)); });

  function _section(label, emps) {
    if (!emps.length) return '';
    var html = '<div style="padding:8px 14px 4px;font-size:10px;font-weight:700;color:var(--tm);text-transform:uppercase;letter-spacing:.06em;display:flex;align-items:center;justify-content:space-between;">'
      + label + '<span style="font-size:11px;font-weight:600;color:var(--amber);cursor:pointer;text-transform:none;letter-spacing:0;" onclick="tcSelectAllGroup(\'' + label + '\',' + JSON.stringify(emps.map(function(e){return e.id;})) + ')">Select All</span></div>';
    emps.forEach(function(emp) {
      var isSel = tcEmpModalSel.includes(emp.id);
      var isAdded = already.includes(emp.id);
      var initials = emp.name.split(' ').map(function(w){return w[0];}).join('').substring(0,2).toUpperCase();
      html += '<div style="display:flex;align-items:center;gap:10px;padding:9px 14px;cursor:' + (isAdded ? 'default' : 'pointer') + ';opacity:' + (isAdded ? '.45' : '1') + ';" '
        + (isAdded ? '' : 'onmouseenter="this.style.background=\'var(--hover)\'" onmouseleave="this.style.background=\'\'" onclick="tcToggleEmpSel(\'' + emp.id + '\')"')
        + '>'
        + '<div style="width:18px;height:18px;border-radius:3px;border:2px solid ' + (isSel ? 'var(--amber)' : '#CBD5E1') + ';background:' + (isSel ? 'var(--amber)' : '#fff') + ';display:flex;align-items:center;justify-content:center;flex-shrink:0;">'
        + (isSel ? '<svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="white" stroke-width="2.2"><path d="M2 6l3 3 5-5"/></svg>' : '')
        + '</div>'
        + '<div style="width:32px;height:32px;border-radius:50%;background:#E5E7EB;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:var(--tb);flex-shrink:0;">' + initials + '</div>'
        + '<div>'
        + '<div style="font-size:13px;font-weight:600;color:var(--tp);">' + emp.name + (isAdded ? ' <span style="font-size:10px;font-weight:400;color:var(--tm);">(already added)</span>' : '') + '</div>'
        + '<div style="font-size:11px;color:var(--tm);">' + emp.role + ' · <span style="font-family:\'JetBrains Mono\',monospace;">' + emp.id + '</span></div>'
        + '</div></div>';
    });
    return html;
  }

  list.innerHTML = _section('Project Employees', project) + _section('Unassigned Employees', unassigned);
}

function tcToggleEmpSel(id) {
  var i = tcEmpModalSel.indexOf(id);
  if (i === -1) tcEmpModalSel.push(id);
  else tcEmpModalSel.splice(i, 1);
  tcRenderEmpList();
  tcRenderEmpSelList();
}

function tcSelectAllGroup(label, ids) {
  ids.forEach(function(id) {
    if (!tcEmpModalSel.includes(id) && !tcRows.find(function(r){ return r.id === id; })) {
      tcEmpModalSel.push(id);
    }
  });
  tcRenderEmpList();
  tcRenderEmpSelList();
}

function tcRenderEmpSelList() {
  var list  = document.getElementById('tc-emp-sel-list');
  var count = document.getElementById('tc-emp-sel-count');
  if (!list) return;
  if (count) count.textContent = tcEmpModalSel.length + ' selected';
  if (!tcEmpModalSel.length) {
    list.innerHTML = '<div style="padding:20px 14px;text-align:center;font-size:12px;color:var(--td);">No employees selected</div>';
    return;
  }
  list.innerHTML = tcEmpModalSel.map(function(id) {
    var emp = tcEmployeeCatalogue.find(function(e){ return e.id === id; }) || { name: id, role: '' };
    var initials = emp.name.split(' ').map(function(w){return w[0];}).join('').substring(0,2).toUpperCase();
    return '<div style="display:flex;align-items:center;gap:8px;padding:7px 14px;">'
      + '<div style="width:26px;height:26px;border-radius:50%;background:#E5E7EB;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:var(--tb);flex-shrink:0;">' + initials + '</div>'
      + '<div style="flex:1;min-width:0;">'
      + '<div style="font-size:12px;font-weight:600;color:var(--tp);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + emp.name + '</div>'
      + '<div style="font-size:10px;color:var(--tm);">' + emp.role + '</div>'
      + '</div>'
      + '<button onclick="tcToggleEmpSel(\'' + id + '\')" style="background:none;border:none;cursor:pointer;color:var(--td);font-size:15px;line-height:1;padding:0;flex-shrink:0;" onmouseenter="this.style.color=\'var(--red)\'" onmouseleave="this.style.color=\'var(--td)\'">&times;</button>'
      + '</div>';
  }).join('');
}

function tcConfirmAddEmployees() {
  tcEmpModalSel.forEach(function(id) {
    if (tcRows.find(function(r){ return r.id === id; })) return;
    var emp = tcEmployeeCatalogue.find(function(e){ return e.id === id; }) || { name: id, role: '', id: id };
    tcRows.push({ id: emp.id, name: emp.name, role: emp.role, start: '', end: '', brk: '—', status: '—', approver: '', remarks: '' });
  });
  tcCloseEmpModal();
  tcEmpModalSel = [];
  renderTimecard();
  tcUpdateStats();
}

/* ═══════════════════════════════════════════════════════════════
   TASK / COST CENTRE COLUMNS
   ═══════════════════════════════════════════════════════════════ */
function tcOpenTaskSelector() {
  if (typeof openMo === 'function') {
    taskModalContext = 'timecard';
    selectedTasks = tcAppliedTasks.map(function(t){ return { code: t.code, name: t.name, parent: t.parent }; });
    if (typeof renderTaskSel === 'function') renderTaskSel();
    openMo('task');
  } else {
    if (typeof showToast === 'function') showToast('Task selector coming soon', 'info');
  }
}

function applyTcTasks() {
  if (typeof selectedTasks === 'undefined') return;
  selectedTasks.forEach(function(t) {
    if (!tcAppliedTasks.some(function(a){ return a.code === t.code; })) {
      tcAppliedTasks.push({ code: t.code, name: t.name, parent: t.parent || '' });
    }
  });
  // Initialise taskMins for all existing rows
  tcRows.forEach(function(r) {
    if (!r.taskMins) r.taskMins = {};
    tcAppliedTasks.forEach(function(t) {
      if (!(t.code in r.taskMins)) r.taskMins[t.code] = 0;
    });
  });
  renderTimecard();
  if (typeof showToast === 'function') showToast(selectedTasks.length + ' task(s) added as columns');
}

function removeTcTask(code) {
  tcAppliedTasks = tcAppliedTasks.filter(function(t){ return t.code !== code; });
  tcRows.forEach(function(r){ if (r.taskMins) delete r.taskMins[code]; });
  renderTimecard();
  if (typeof showToast === 'function') showToast('Task column removed');
}

/* ─── CSS for column panel items (injected once) ─── */
(function() {
  if (document.getElementById('tc-col-style')) return;
  var s = document.createElement('style');
  s.id = 'tc-col-style';
  s.textContent = '.tc-col-item{display:flex;align-items:center;gap:8px;padding:7px 14px;font-size:13px;color:var(--tb);cursor:pointer;user-select:none;}'
    + '.tc-col-item:hover{background:var(--hover);}'
    + '.tc-col-item input[type=checkbox]{accent-color:var(--amber);width:14px;height:14px;cursor:pointer;flex-shrink:0;}';
  document.head.appendChild(s);
})();

/* ═══════════════════════════════════════════════════════════════
   COPY FROM PREVIOUS PANEL
   ═══════════════════════════════════════════════════════════════ */

/* Sample "previous day" source catalogue — in a real app this comes from the API */
var tcCopyCatalogue = [
  { id:'ID:3333',   name:'James Kula',     role:'Admin',          start:'07:00', end:'15:30', brk:'30', status:'Approved',   wbs:true,  equipment:false, allowance:true  },
  { id:'ID:007',    name:'Boni Khatiwada', role:'Labour',         start:'07:00', end:'16:00', brk:'30', status:'Approved',   wbs:true,  equipment:true,  allowance:false },
  { id:'ID:Anu12',  name:'Anu Praz',       role:'Employee',       start:'08:00', end:'17:00', brk:'60', status:'Unapproved', wbs:false, equipment:false, allowance:false },
  { id:'RamLaxman', name:'Ram Laxman',     role:'Skilled Labour', start:'06:30', end:'14:30', brk:'30', status:'Approved',   wbs:true,  equipment:true,  allowance:true  },
  { id:'AnnolKC',   name:'Annot KC',       role:'Labour',         start:'07:00', end:'15:00', brk:'0',  status:'Clocked In', wbs:false, equipment:false, allowance:false },
];

function tcToggleCopyPanel() {
  tcCopyPanelOpen = !tcCopyPanelOpen;
  var panel = document.getElementById('tc-copy-panel');
  var btn   = document.getElementById('tc-copy-btn');
  if (!panel) return;
  if (tcCopyPanelOpen) {
    panel.style.display = 'block';
    if (btn) { btn.style.background = 'var(--amber-l)'; btn.style.borderColor = 'var(--amber)'; btn.style.color = 'var(--amber)'; }
    // Pre-fill dates: yesterday → today
    var today = new Date();
    var yest  = new Date(today); yest.setDate(yest.getDate() - 1);
    var fmt   = function(d) { return d.toISOString().split('T')[0]; };
    var fromEl = document.getElementById('tc-copy-from');
    var toEl   = document.getElementById('tc-copy-to');
    if (fromEl && !fromEl.value) fromEl.value = fmt(yest);
    if (toEl   && !toEl.value)   toEl.value   = fmt(today);
    tcLoadCopyData();
  } else {
    panel.style.display = 'none';
    if (btn) { btn.style.background = ''; btn.style.borderColor = ''; btn.style.color = ''; }
    tcCopySel = [];
  }
}

function tcLoadCopyData() {
  tcCopyRows = tcCopyCatalogue.slice();  // in real app: filter by selected from-date & project
  tcCopySel  = [];
  tcRenderCopyTable();
  _tcCopyUpdateSummary();
}

function tcRenderCopyTable() {
  var tbody  = document.getElementById('tc-copy-tbody');
  var emptyR = document.getElementById('tc-copy-empty');
  if (!tbody) return;

  if (!tcCopyRows.length) {
    if (emptyR) emptyR.style.display = '';
    Array.from(tbody.rows).forEach(function(r) { if (r.id !== 'tc-copy-empty') r.remove(); });
    return;
  }
  if (emptyR) emptyR.style.display = 'none';
  Array.from(tbody.rows).forEach(function(r) { if (r.id !== 'tc-copy-empty') r.remove(); });

  var CELL = 'padding:10px 12px;border-right:1px solid var(--border);font-size:13px;color:var(--tb);font-family:inherit;';
  var CELLC = CELL + 'text-align:center;';
  var RO_TIME = 'display:inline-block;font-size:12px;font-family:\'JetBrains Mono\',monospace;font-weight:600;color:var(--tp);';

  function _amberChk(checked) {
    return '<div style="width:18px;height:18px;border-radius:3px;border:2px solid '
      + (checked ? 'var(--amber)' : '#CBD5E1')
      + ';background:' + (checked ? 'var(--amber)' : '#fff')
      + ';display:inline-flex;align-items:center;justify-content:center;pointer-events:none;">'
      + (checked ? '<svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="white" stroke-width="2.2"><path d="M2 6l3 3 5-5"/></svg>' : '')
      + '</div>';
  }

  tcCopyRows.forEach(function(row, ci) {
    var isSel = tcCopySel.includes(ci);
    var total = tcCalcTotal(row.start, row.end, parseInt(row.brk) || 0);
    var initials = row.name.split(' ').map(function(w){ return w[0]; }).join('').substring(0,2).toUpperCase();

    var tr = document.createElement('tr');
    tr.style.cssText = 'border-bottom:1px solid var(--border);cursor:pointer;transition:background .1s;' + (isSel ? 'background:#FFFDF5;' : '');
    tr.onclick = function() { tcCopyToggleRow(ci); };
    tr.onmouseenter = function() { if (!isSel) tr.style.background = 'var(--hover)'; };
    tr.onmouseleave = function() { if (!isSel) tr.style.background = ''; };

    // Checkbox
    var tdChk = document.createElement('td');
    tdChk.style.cssText = 'padding:10px;text-align:center;border-right:1px solid var(--border);width:40px;';
    tdChk.innerHTML = '<div style="width:18px;height:18px;border-radius:3px;border:2px solid '
      + (isSel ? 'var(--amber)' : '#CBD5E1')
      + ';background:' + (isSel ? 'var(--amber)' : '#fff')
      + ';display:inline-flex;align-items:center;justify-content:center;pointer-events:none;">'
      + (isSel ? '<svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="white" stroke-width="2.2"><path d="M2 6l3 3 5-5"/></svg>' : '')
      + '</div>';
    tr.appendChild(tdChk);

    // Employee
    var tdEmp = document.createElement('td');
    tdEmp.style.cssText = CELL + 'min-width:220px;';
    var badges = '';
    if (row.equipment) badges += '<span style="display:inline-flex;align-items:center;gap:3px;font-size:10px;font-weight:600;background:#DBEAFE;color:#1D4ED8;border-radius:4px;padding:1px 6px;white-space:nowrap;margin-left:4px;">'
      + '<svg width="9" height="9" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="5" width="12" height="7" rx="1"/><path d="M4 5V4a3 3 0 016 0v1"/></svg>Equipment</span>';
    if (row.allowance) badges += '<span style="display:inline-flex;align-items:center;gap:3px;font-size:10px;font-weight:600;background:#EDE9FE;color:#6D28D9;border-radius:4px;padding:1px 6px;white-space:nowrap;margin-left:4px;">'
      + '<svg width="9" height="9" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="7" cy="7" r="5.5"/><path d="M7 4v6M5 8h3a1 1 0 000-2H6a1 1 0 010-2h3"/></svg>Allowance</span>';
    tdEmp.innerHTML = '<div style="display:flex;align-items:center;gap:9px;">'
      + '<div style="width:30px;height:30px;border-radius:50%;background:#E5E7EB;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:var(--tb);flex-shrink:0;">' + initials + '</div>'
      + '<div><div style="font-size:13px;font-weight:600;color:var(--tp);display:flex;align-items:center;flex-wrap:wrap;gap:2px;">' + row.name + badges + '</div>'
      + '<div style="font-size:11px;color:var(--tm);margin-top:1px;">' + row.role + ' · <span style="font-family:\'JetBrains Mono\',monospace;">' + row.id + '</span></div></div></div>';
    tr.appendChild(tdEmp);

    // Start (read-only)
    var tdS = document.createElement('td');
    tdS.style.cssText = CELLC;
    tdS.innerHTML = '<span style="' + RO_TIME + '">' + tcFmt12(row.start) + '</span>';
    tr.appendChild(tdS);

    // End (read-only)
    var tdE = document.createElement('td');
    tdE.style.cssText = CELLC;
    tdE.innerHTML = '<span style="' + RO_TIME + '">' + tcFmt12(row.end) + '</span>';
    tr.appendChild(tdE);

    // Break (read-only)
    var tdBk = document.createElement('td');
    tdBk.style.cssText = CELLC;
    tdBk.innerHTML = '<span style="font-size:12px;font-family:\'JetBrains Mono\',monospace;color:var(--tm);">' + (row.brk && row.brk !== '0' ? row.brk + 'm' : '—') + '</span>';
    tr.appendChild(tdBk);

    // Total (read-only)
    var tdT = document.createElement('td');
    tdT.style.cssText = CELLC;
    tdT.innerHTML = '<span style="' + RO_TIME + '">' + (total || '—') + '</span>';
    tr.appendChild(tdT);

    // Assigned WBS
    var tdW = document.createElement('td');
    tdW.style.cssText = CELLC;
    tdW.innerHTML = _amberChk(row.wbs);
    tr.appendChild(tdW);

    // Equipment col
    var tdEq = document.createElement('td');
    tdEq.style.cssText = CELLC;
    tdEq.innerHTML = _amberChk(row.equipment);
    tr.appendChild(tdEq);

    // Allowance col
    var tdAl = document.createElement('td');
    tdAl.style.cssText = CELLC;
    tdAl.innerHTML = _amberChk(row.allowance);
    tr.appendChild(tdAl);

    // Expand chevron (non-functional for now — read-only preview)
    var tdCh = document.createElement('td');
    tdCh.style.cssText = 'padding:10px;text-align:center;border-right:none;';
    tdCh.innerHTML = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="var(--td)" stroke-width="1.8"><path d="M3 4.5l3 3 3-3"/></svg>';
    tr.appendChild(tdCh);

    tbody.appendChild(tr);
  });

  // Update select-all checkbox state
  _tcCopyUpdateAllChk();
}

function tcCopyToggleRow(ci) {
  var i = tcCopySel.indexOf(ci);
  if (i === -1) tcCopySel.push(ci);
  else tcCopySel.splice(i, 1);
  tcRenderCopyTable();
  _tcCopyUpdateSummary();
}

function tcCopyToggleAll() {
  if (tcCopySel.length === tcCopyRows.length) {
    tcCopySel = [];
  } else {
    tcCopySel = tcCopyRows.map(function(_, i) { return i; });
  }
  tcRenderCopyTable();
  _tcCopyUpdateSummary();
}

function _tcCopyUpdateAllChk() {
  var el = document.getElementById('tc-copy-all-chk');
  if (!el) return;
  var allSel = tcCopyRows.length > 0 && tcCopySel.length === tcCopyRows.length;
  var someSel = tcCopySel.length > 0 && !allSel;
  el.style.border = (allSel || someSel) ? '2px solid var(--amber)' : '2px solid #CBD5E1';
  el.style.background = allSel ? 'var(--amber)' : '#fff';
  el.innerHTML = allSel
    ? '<svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="white" stroke-width="2.2"><path d="M2 6l3 3 5-5"/></svg>'
    : (someSel ? '<div style="width:8px;height:2px;background:var(--amber);border-radius:1px;"></div>' : '');
}

function _tcCopyUpdateSummary() {
  var eEl = document.getElementById('tc-copy-emp-count');
  var sEl = document.getElementById('tc-copy-sel-count');
  var btn = document.getElementById('tc-copy-confirm-btn');
  if (eEl) eEl.textContent = tcCopyRows.length;
  if (sEl) sEl.textContent = tcCopySel.length;
  if (btn) {
    var hasSelection = tcCopySel.length > 0;
    btn.style.opacity      = hasSelection ? '1' : '.5';
    btn.style.pointerEvents = hasSelection ? 'auto' : 'none';
  }
}

function tcExecuteCopy() {
  var copied = 0;
  tcCopySel.forEach(function(ci) {
    var row = tcCopyRows[ci];
    if (!row) return;
    if (tcRows.find(function(r){ return r.id === row.id; })) return; // already present
    tcRows.push({
      id: row.id, name: row.name, role: row.role,
      start: row.start, end: row.end, brk: row.brk,
      status: '—', approver: '', remarks: '',
      taskMins: {}
    });
    copied++;
  });
  tcToggleCopyPanel();  // close panel
  renderTimecard();
  tcUpdateStats();
  if (typeof showToast === 'function') showToast(copied + ' employee(s) copied to timecard');
}
