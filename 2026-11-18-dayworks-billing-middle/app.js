/* Dayworks billing prototype, smaller-release cut (RELEASE in config.js): screens inside a Varicon project. All state changes go through engine.js via act(). */
let S = seedState();
let TAB = 'daywork';                         // project tab: daywork | variation | claim
let DW = { status: 'ALL', sel: new Set(), open: null, edit: false };
let VR = { open: null, sub: 'dockets', expand: new Set(['V010']), filter: '' };
let CL = { open: null, sub: 'dayworks', ticks: null };
let MENU = null;                             // id of the open dropdown menu
let MODAL = null, DK_FORM = null, PK = null, SCEN = null;
let DRAWER = { open: false, tab: 'sim' };
let SIM = { section: 'labour', line: 'Leading Hand', std: 75, eff: null };

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pill = s => `<span class="pill p-${String(s).replace(/ /g, '')}">${esc(s)}</span>`;
const claimPill = s => `<span class="pill p-claim p-${s}">${s.toUpperCase()}</span>`;
function toast(m, isErr) { const t = document.getElementById('toast'); t.textContent = m; t.className = 'toast' + (isErr ? ' err' : ''); t.style.display = 'block'; clearTimeout(t._h); t._h = setTimeout(() => t.style.display = 'none', 4200); }
function openModal(fn, wide) { MODAL = fn; const m = document.getElementById('modal'); m.className = 'modal' + (wide ? ' wide' : ''); m.innerHTML = fn(); document.getElementById('modalBg').classList.add('open'); }
function closeModal() { MODAL = null; PK = null; document.getElementById('modalBg').classList.remove('open'); }
function refreshModal() { if (MODAL) document.getElementById('modal').innerHTML = MODAL(); }
function inert(what) { toast(what + ' is outside this prototype'); }
function menuBtn(id, items) {
  return `<span class="menuwrap"><button class="btn icon" onclick="event.stopPropagation();MENU=MENU==='${id}'?null:'${id}';render()"><i class="fas fa-ellipsis-vertical"></i></button>${MENU === id ? `<div class="menu">${items.map(it => `<div class="${it.cls || ''}" onclick="event.stopPropagation();MENU=null;${it.on || `inert('${esc(it.label)}')`}"><i class="fas ${it.icon}"></i> ${esc(it.label)}</div>`).join('')}</div>` : ''}</span>`;
}
document.addEventListener('click', () => { if (MENU) { MENU = null; render(); } });

/* Snapshot of live values so every change is written to the change log. */
function snap(st) {
  const m = {};
  st.variations.forEach(v => { if (v.status !== 'Pending' || v.manual) return; v.lines.forEach(ln => m[v.id + ' line ' + ln.docket] = varLineValue(st, v, ln)); if (v.submittedOn) m[v.id + ' submitted amount'] = varSubmittedAmount(st, v); });
  st.claims.forEach(c => { if (CLAIM_LIVE.includes(c.status)) c.lines.forEach(ln => m['Claim ' + c.id + ' line ' + ln.docket] = claimLineValue(st, c, ln)); });
  return m;
}
function act(fn, okMsg) {
  const before = snap(S); let r;
  try { r = fn(); } catch (e) { toast(e.message, true); return null; }
  const after = snap(S); let moved = 0;
  Object.keys(after).forEach(k => { if (k in before && Math.abs((after[k] || 0) - (before[k] || 0)) > 0.004) { moved++; log(S, k + ': ' + money(before[k]) + ' to ' + money(after[k]) + ' (flagged until ' + (k.startsWith('Claim') ? 'the claim is approved' : 'approval') + ', kept in the record history)', 'change'); } });
  if (okMsg) toast(okMsg + (moved ? ' · ' + plural(moved, 'live value') + ' moved' : ''));
  render(); return r;
}

/* ───────── Release banner ───────── */
const REL = {
  lean: ['Lean release', 'Copy dockets into a normal variation at their value when added, with Refresh from dockets to reprice. Leaves out: live repricing and flags, a Dayworks tab on claims, auto-Invoiced, estimated cost from dockets, bulk actions on Daywork Record.'],
  middle: ['Middle release', 'Lean plus live repricing until approval, with changed-since flags and a revision prompt. Leaves out: a Dayworks tab on claims, auto-Invoiced, estimated cost from dockets, bulk actions on Daywork Record.'],
};
function relBanner() {
  const [name, what] = REL[RELEASE];
  const link = (k, label, href) => k === RELEASE ? `<b>${label}</b>` : `<a href="${href}">${label}</a>`;
  return `<div style="background:#0f172a;color:#e2e8f0;border-radius:6px;padding:7px 12px;margin-bottom:12px;font-size:12px;display:flex;gap:10px;flex-wrap:wrap;align-items:center"><span class="tag" style="background:#f39200;color:#fff">${name}</span><span style="flex:1;min-width:220px">${what}</span><span style="white-space:nowrap">Compare: <a style="color:#93c5fd" href="../2026-11-12-dayworks-billing/">Full</a> · ${link('lean', 'Lean', '../2026-11-18-dayworks-billing-lean/').replace('<a ', '<a style="color:#93c5fd" ')} · ${link('middle', 'Middle', '../2026-11-18-dayworks-billing-middle/').replace('<a ', '<a style="color:#93c5fd" ')}</span></div>`;
}

/* ───────── Layout ───────── */
const PTABS = ['Dashboard', 'Budget Overview', 'Daily Cost Tracking', 'Claim', 'Variation Register', 'Report', 'File Manager', 'Site Diary', 'Forms', 'Daywork Record'];
const PTAB_KEY = { 'Claim': 'claim', 'Variation Register': 'variation', 'Daywork Record': 'daywork' };
function go(tab) { TAB = tab; MENU = null; if (tab === 'daywork') DW.open = null; if (tab === 'variation') VR.open = null; if (tab === 'claim') CL.open = null; render(); window.scrollTo(0, 0); }
function render() {
  document.getElementById('ptabs').innerHTML = PTABS.map(t => { const k = PTAB_KEY[t]; return `<div class="ptab ${k ? 'live' : 'dead'} ${k === TAB ? 'active' : ''}" ${k ? `onclick="go('${k}')"` : `title="Not in this prototype"`}>${t}</div>`; }).join('');
  const v = document.getElementById('view');
  document.getElementById('cfoot').innerHTML = '';
  v.innerHTML = relBanner() + (TAB === 'daywork' ? (DW.open ? docketPage(DW.open) : dayworkList()) : TAB === 'variation' ? (VR.open ? varPage(getVar(S, VR.open)) : varRegister()) : (CL.open ? claimPage(getClaim(S, CL.open)) : claimList()));
  refreshModal();
  if (!SCEN) SCEN = runScenarios();
  const n = SCEN.filter(r => r.pass).length;
  document.getElementById('scenBadge').innerHTML = `<span class="tag ${n === SCEN.length ? 't-ok' : 't-bad'}">${n}/${SCEN.length}</span>`;
  renderDrawer();
}

/* ───────── Markers ───────── */
function onMarker(id) {
  const h = docketHome(S, id); if (!h) return '';
  const lock = isLocked(S, id) ? ' <i class="fas fa-lock"></i>' : '';
  return `<span class="tag t-on" onclick="event.stopPropagation();goRecord('${h.kind}','${h.rec.id}')">On ${h.kind === 'claim' ? 'Claim ' + h.rec.id : h.rec.id}${lock}</span>`;
}
function goRecord(kind, id) { closeModal(); if (kind === 'variation') { TAB = 'variation'; VR.open = id; VR.sub = 'dockets'; } else { TAB = 'claim'; CL.open = id; CL.sub = 'variation'; } render(); window.scrollTo(0, 0); }

/* ───────── Daywork Record tab ───────── */
const DW_TABS = ['ALL', 'Draft', 'Ready for Review', 'Submitted', 'Approved', 'Costed', 'Invoiced', 'Rejected', 'Not claimable'];
function dayworkList() {
  const all = S.dockets.slice().sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  const list = DW.status === 'ALL' ? all : all.filter(d => d.status === DW.status);
  let h = `<div class="spread"><h1>Daywork Record list <i class="fas fa-circle-info muted"></i></h1><div class="row"><span class="help"><i class="fas fa-circle-question"></i> Need Help?</span><button class="btn" onclick="inert('Export')"><i class="fas fa-download"></i> Export</button>
    ${menuBtn('dwmenu', [{ label: 'Charge Resource', icon: 'fa-file-lines' }, { label: 'Daywork Project Setting', icon: 'fa-gear' }, { label: 'Daywork Report Setting', icon: 'fa-file-pen' }, { label: 'Feedback Form', icon: 'fa-comment' }])}</div></div>
    <div class="row" style="margin-top:10px"><span class="filter"><i class="fas fa-calendar"></i> Select Date Range</span><span class="filter">Created By <i class="fas fa-chevron-down" style="float:right;margin-top:3px"></i></span><span class="filter">Filter by Client <i class="fas fa-chevron-down" style="float:right;margin-top:3px"></i></span>
    <b style="margin-left:6px">Dayworks Claim Summary Status</b> <i class="fas fa-circle-check" style="color:#16a34a"></i> <span class="help"><i class="fas fa-circle-question"></i> Know More</span>
    <span class="filter" style="margin-left:auto;min-width:200px">Search Daywork Record <i class="fas fa-magnifying-glass" style="float:right;margin-top:3px"></i></span></div>`;
  h += `<div class="stabs">${DW_TABS.map(t => `<div class="stab ${DW.status === t ? 'active' : ''}" onclick="DW.status='${t}';render()">${t}<span class="ct">${t === 'ALL' ? all.length : all.filter(d => d.status === t).length}</span></div>`).join('')}</div>`;
  const sel = [...DW.sel].filter(id => S.dockets.some(d => d.id === id));
  if (false) {
    const sum = round2(sel.reduce((a, id) => a + docketValue(S, id), 0));
    h += `<div class="bulk"><b>${plural(sel.length, 'docket')} selected</b> <span style="opacity:.75">${money(sum)} ex GST at calculator value</span><span style="flex:1"></span>
      <button class="btn or" onclick="bulkTo('variation')"><i class="fas fa-file-circle-plus"></i> Create variation</button><button class="btn" onclick="bulkTo('claim')"><i class="fas fa-file-invoice-dollar"></i> Add to claim</button><button class="btn" onclick="DW.sel.clear();render()">Clear</button></div>`;
  }
  h += `<div class="addbar"><i class="fas fa-plus"></i> Add Daywork Record</div><div class="tw"><table><thead><tr><th>Docket no.</th><th>Performed on</th><th>Client</th><th>Description of work</th><th>Created by</th><th>Status</th><th>Approved date</th><th>Reference #</th><th class="num">Calculator value</th><th>Billing</th><th>Action</th></tr></thead><tbody>`;
  list.forEach(d => {
    const p = priceDocket(S, d); const val = docketValue(S, d.id);
    h += `<tr class="click" onclick="openDocket('${d.id}')">
      <td><b>Dayworks ${d.id}</b></td><td class="small">${dayName(d.date)}, ${fmtDate(d.date)}</td><td>${esc(S.project.client)}</td><td class="small">${esc(d.desc || docketSummary(d))}</td><td>${esc(d.createdBy)}</td>
      <td>${pill(d.status)}${d.sentBack ? ` <span class="tag t-sent" title="${esc(d.sentBack.note)}">Sent back</span>` : ''}${p.problems.length ? ` <span class="tag t-bad" title="${esc(p.problems.join(' · '))}">${esc(p.problems[0])}</span>` : ''}</td>
      <td class="small">${d.approvedOn && ['Approved', 'Costed', 'Invoiced'].includes(d.status) ? dayName(d.approvedOn) + ', ' + fmtDate(d.approvedOn) : '-'}</td><td class="small">${esc(d.ref || '-')}</td>
      <td class="num">${money(val)} <span class="tag t-ver">v${p.version ? p.version.n : '-'}</span></td><td>${onMarker(d.id)}</td><td><i class="fas fa-message" style="color:#475569"></i></td></tr>`;
  });
  if (!list.length) h += `<tr><td colspan="11" class="muted">No daywork records.</td></tr>`;
  h += `</tbody></table></div><div class="muted" style="margin-top:8px">Calculator value: the docket's full Dayworks Calculator price ex GST, from the version in effect on the docket date. Dockets go on a variation from Variation Register > New Variation > From dockets (Approved and Costed only). A docket on a variation is locked until its line is removed.</div>`;
  return h;
}
function bulkTo(mode) {
  const ids = [...DW.sel];
  openPicker(mode, 'new', ids);
}

/* Docket detail page, styled like Varicon's Daywork Record detail */
function openDocket(id) { closeModal(); TAB = 'daywork'; DW.open = id; DW.edit = false; DK_FORM = null; render(); window.scrollTo(0, 0); }
function docketPage(id) {
  const d = getDocket(S, id); const p = priceDocket(S, d); const h0 = docketHome(S, id); const locked = isLocked(S, id);
  const signed = ['Approved', 'Costed', 'Invoiced'].includes(d.status);
  const editable = !locked && !signed && d.status !== 'Not claimable';
  let h = `<div class="spread"><div class="row"><a onclick="DW.open=null;render()"><i class="fas fa-arrow-left"></i></a> <a onclick="DW.open=null;render()" style="color:#d97706">Daywork Record</a> <span class="muted">›</span> <b># Dayworks ${d.id}</b></div>
    <div class="row"><button class="btn" onclick="inert('Preview')"><i class="fas fa-eye"></i> Preview</button><button class="btn or-out" onclick="inert('AI Summary')"><i class="fas fa-wand-magic-sparkles"></i> AI Summary</button>${menuBtn('dk', [{ label: 'Duplicate', icon: 'fa-copy' }, { label: 'Download PDF', icon: 'fa-file-pdf' }])}</div></div>
    <div class="row" style="margin-top:8px"><b>Daywork Record</b> ${pill(d.status)} ${onMarker(id)} ${d.sentBack ? `<span class="tag t-sent">Sent back: ${esc(d.sentBack.reason)}</span>` : ''}</div>
    <div class="kv"><div><b>Project</b>(${S.project.code}) ${esc(S.project.name)}</div><div><b>Client</b>${esc(S.project.client)}</div><div><b>Performed on</b>${dayName(d.date)}, ${fmtDate(d.date)}</div><div><b>Area / Work Zone</b>-</div><div><b>Reference #</b>${esc(d.ref || '-')}</div><div><b>Created by</b>${esc(d.createdBy)}</div></div>
    <div><b class="muted" style="font-weight:500">Description of work</b><div>${esc(d.desc || '-')}</div></div>`;
  if (locked && h0.rec.status === 'Pending') h += `<div class="ban dark"><i class="fas fa-lock"></i><div><b>Locked while on variation ${h0.rec.id}.</b> Read-only: no edits and no Reopen. To fix it, remove its line from ${h0.rec.id} (the docket is freed), reopen and edit it, then add it again.</div></div>`;
  else if (locked) h += `<div class="ban dark"><i class="fas fa-lock"></i><div><b>Read-only.</b> On ${h0.kind === 'variation' ? h0.rec.status.toLowerCase() + ' variation ' + h0.rec.id : 'approved Claim ' + h0.rec.id}. Its value is frozen at ${money(h0.line.frozen)} and is never repriced${Math.abs(p.total - h0.line.frozen) > 0.004 ? ` (the live calculator would now say ${money(p.total)})` : ''}. Its status is not changed by claims; mark it Invoiced by hand once billed.</div></div>`;
  else if (h0) h += `<div class="ban info"><i class="fas fa-link"></i><div>On ${h0.kind === 'claim' ? 'Claim ' + h0.rec.id : 'variation ' + h0.rec.id} (${h0.rec.status.toLowerCase()}${h0.kind === 'variation' && h0.rec.submittedOn ? ', submitted' : ''}). Changes flow to its line until the ${h0.kind === 'variation' ? 'variation is approved' : 'claim is approved'}, and are kept in its history. Send back and Not claimable are refused until it is removed.</div></div>`;
  if (h0 && !locked && docketIssue(S, d)) h += `<div class="ban err"><i class="fas fa-ban"></i><div><b>Blocking ${h0.kind === 'claim' ? 'Claim ' + h0.rec.id : h0.rec.id}:</b> ${esc(docketIssue(S, d))}. It stays on the ${h0.kind}, flagged, until it is fixed or removed.</div></div>`;
  if (d.reapprove && d.status === 'Submitted') h += `<div class="ban warn"><i class="fas fa-rotate-left"></i><div><b>Reopened after approval</b> on ${fmtDate(d.reapprove.at)}${d.reapprove.on ? ' while on ' + d.reapprove.on : ''}: back to Submitted for the client to sign again.</div></div>`;
  if (d.sentBack) h += `<div class="ban warn"><i class="fas fa-reply"></i><div><b>Sent back: ${esc(d.sentBack.reason)}</b>${d.sentBack.note ? ' · ' + esc(d.sentBack.note) : ''} <span class="muted">by ${esc(d.sentBack.by)} on ${fmtDate(d.sentBack.at)}</span></div></div>`;
  if (d.status === 'Not claimable') h += `<div class="ban dark"><i class="fas fa-ban"></i><div><b>Not claimable</b>${d.nc.note ? ' · ' + esc(d.nc.note) : ''} <span class="muted">set by ${esc(d.nc.by)} on ${fmtDate(d.nc.at)}, was ${d.prevStatus}; never offered to a variation or claim</span></div></div>`;
  if (p.problems.length) h += `<div class="ban err"><i class="fas fa-triangle-exclamation"></i><div><b>Cannot be approved or billed:</b> ${p.problems.map(esc).join(' · ')}.${editable ? ' Remove the line or allowance below, or move a start time, to fix it.' : ''}</div></div>`;
  // Labour, plant, other tables
  const rows = p.lines.map((r, i) => ({ r, i }));
  const timeIn = (r, i) => editable ? `<input class="cell" style="width:62px" value="${r.l.start}" onchange="act(()=>editStart(S,'${id}',${i},this.value),'${id} start time updated')">` : r.l.start;
  const hrsIn = (r, i) => editable ? `<input class="cell" type="number" step="0.25" value="${fmtH(r.hours)}" onchange="act(()=>editHours(S,'${id}',${i},Number(this.value)),'${id} hours updated')">` : fmtH(r.hours) + 'h';
  const delBtn = i => editable ? `<button class="btn icon" title="Remove line" onclick="act(()=>removeDocketLine(S,'${id}',${i}),'Line removed')"><i class="fas fa-trash"></i></button>` : '';
  const allowTypes = (versionFor(S, d.date) || { allow: [] }).allow.map(a => a.type).concat(['Tool']);
  const extras = (r, i) => r.extras.map(x => `<div class="small">${/Unmapped/.test(x.note) ? '<span class="tag t-bad">Unmapped</span> ' : '+ '}${esc(x.label)} ${money(x.value)} <span class="muted">${esc(x.note)}</span>${editable && /Unmapped/.test(x.note) && (r.l.allow || []).some(a => allowName(a.type) === x.label) ? ` <a onclick="act(()=>removeAllowance(S,'${id}',${i},'${esc((r.l.allow.find(a => allowName(a.type) === x.label) || {}).type)}'),'Allowance removed')">remove</a>` : ''}</div>`).join('')
    + (editable && ['labour', 'wet'].includes(r.l.t) ? `<select class="cell" style="font-size:11px;margin-top:3px;width:auto" onchange="if(this.value)act(()=>addAllowance(S,'${id}',${i},this.value),'Allowance added')"><option value="">+ allowance</option>${allowTypes.filter(t => !(r.l.allow || []).some(a => a.type === t)).map(t => `<option value="${t}">${esc(allowName(t))}${t === 'Tool' ? ' (no calculator line)' : ''}</option>`).join('')}</select>` : '');
  const split = r => r.rows.map(x => x.tier === 'unit' ? `${x.hours} x ${money(x.rate)}` : x.tier === 'costplus' ? `cost ${money(r.l.cost)} + ${r.rateLine.margin}%` : x.tier === 'flat' ? (r.l.t === 'float' ? 'flat' : `${fmtH(x.hours)}h x ${money(x.rate)}`) : x.tier === 'day' ? `1 day x ${money(x.rate)}` : `${fmtH(x.hours)}h ${TIER_LABEL[x.tier]} x ${money(x.rate)}`).join(' + ');
  const rateCell = r => r.rateLine ? `<span class="muted">${esc(r.rateLine.name)}</span>` : (r.l.t === 'float' ? '<span class="muted">no float line</span>' : '<span class="tag t-bad">Unmapped</span>');
  const lab = rows.filter(x => x.r.l.t === 'labour');
  h += `<h2>Labour</h2><div class="tw card"><table><thead><tr><th>#</th><th>Name</th><th>Resource</th><th>Role</th><th>Clock in</th><th>Clock out</th><th>Break</th><th class="num">Total Hour</th><th>Calculator</th><th class="num">Value</th><th></th></tr></thead><tbody>${lab.map(({ r, i }, k) => `<tr class="${r.overlap || r.unmapped.length ? 'block' : ''}"><td>${k + 1}</td><td>${esc(PEOPLE[r.l.person].name)}</td><td>(${esc(PEOPLE[r.l.person].role)}) ${esc(PEOPLE[r.l.person].role)}</td><td>${esc(PEOPLE[r.l.person].role)}</td><td>${timeIn(r, i)}</td><td>${r.l.end}</td><td>${r.l.brk ? fmtH(r.l.brk * 60) + 'm' : '0m'}</td><td class="num">${hrsIn(r, i)}</td><td class="small">${rateCell(r)}<div>${split(r)}</div>${extras(r, i)}</td><td class="num"><b>${money(r.value)}</b></td><td>${delBtn(i)}</td></tr>`).join('') || '<tr><td colspan="11" class="muted">No labour.</td></tr>'}</tbody></table></div>`;
  const pl = rows.filter(x => ['wet', 'dry', 'float'].includes(x.r.l.t));
  h += `<h2>Plant and Equipment</h2><div class="tw card"><table><thead><tr><th>#</th><th>Plant and Equipment</th><th>Name</th><th>Hire Type</th><th>Operated By</th><th>Start</th><th class="num">Total Duration</th><th>Attachment</th><th>Calculator</th><th class="num">Value</th><th></th></tr></thead><tbody>${pl.map(({ r, i }, k) => { const P = PLANT[r.l.plant]; const timed = r.l.t !== 'float'; return `<tr class="${r.overlap || r.unmapped.length ? 'block' : ''}"><td>${k + 1}</td><td>(${r.l.plant}) ${esc(P.res)}</td><td>${esc(P.name)}</td><td>${r.l.t === 'wet' ? 'Wet Hire' : r.l.t === 'dry' ? 'Dry Hire' : (r.l.dir === 'mob' ? 'Mobilise' : 'Demobilise') + ' (float)'}</td><td>${r.l.person ? esc(PEOPLE[r.l.person].name) : '-'}</td><td>${timed ? timeIn(r, i) : ''}</td><td class="num">${timed ? hrsIn(r, i) : ''}${r.overlap ? ' <span class="tag t-bad">overlap</span>' : ''}</td><td class="small">${(r.l.att || []).join(', ') || '-'}</td><td class="small">${rateCell(r)}<div>${split(r)}</div>${extras(r, i)}</td><td class="num"><b>${money(r.value)}</b></td><td>${delBtn(i)}</td></tr>`; }).join('') || '<tr><td colspan="11" class="muted">No plant.</td></tr>'}</tbody></table></div>`;
  const oth = rows.filter(x => ['material', 'sub'].includes(x.r.l.t));
  if (oth.length) h += `<h2>Materials and Miscellaneous</h2><div class="tw card"><table><thead><tr><th>#</th><th>Item</th><th>Type</th><th>Quantity / cost</th><th>Calculator</th><th class="num">Value</th><th></th></tr></thead><tbody>${oth.map(({ r, i }, k) => `<tr class="${r.unmapped.length ? 'block' : ''}"><td>${k + 1}</td><td>${esc(r.l.item)}</td><td>${r.l.t === 'material' ? 'Material' : 'Subcontract'}</td><td>${r.l.qty !== undefined ? r.l.qty : money(r.l.cost)}</td><td class="small">${rateCell(r)}<div>${split(r)}</div></td><td class="num"><b>${money(r.value)}</b></td><td>${delBtn(i)}</td></tr>`).join('')}</tbody></table></div>`;
  h += `<div class="spread" style="margin-top:10px"><span class="muted">Priced by Dayworks Calculator v${p.version ? p.version.n : '-'} (in effect ${fmtDate(d.date)}); ex GST, no cost-plus margin.</span><b style="font-size:14px">Docket total ${money(p.total)}</b>${h0 ? `<div class="muted">Line on ${h0.rec.id}: ${money(docketValue(S, id))}</div>` : ''}</div>`;
  if (signed && !locked) h += `<div class="ban lock"><i class="fas fa-lock"></i><div style="flex:1">The fields above are locked since the signature is signed. ${d.status === 'Invoiced' ? 'This docket is Invoiced.' : 'You can reopen this docket to clear the signature and unlock the fields; it goes back to Submitted for the client to sign again' + (h0 ? ' and its line on ' + (h0.kind === 'claim' ? 'Claim ' + h0.rec.id : h0.rec.id) + ' is flagged' : '') + '.'}</div>${d.status !== 'Invoiced' ? `<button class="btn" onclick="act(()=>reopenSigned(S,'${id}'),'${id} reopened, back to Submitted')">Reopen</button>` : ''}</div>`;
  // Forms
  if (DK_FORM === 'sendback') h += `<div class="card pad" style="margin-top:10px"><b>Send back to ${esc(d.createdBy)}</b><div class="frow" style="margin-top:6px"><div class="field"><label>Reason</label><select id="sbReason">${['More photos', 'Missing info', 'Wrong quantities', 'Wrong project', 'Other'].map(r => `<option>${r}</option>`).join('')}</select></div><div class="field" style="flex:2"><label>Note (optional)</label><input id="sbNote"></div><button class="btn or" onclick="if(act(()=>sendBack(S,'${id}',document.getElementById('sbReason').value,document.getElementById('sbNote').value),'${id} sent back')!==null){DK_FORM=null;render()}">Send back</button><button class="btn" onclick="DK_FORM=null;render()">Cancel</button></div></div>`;
  if (DK_FORM === 'nc') h += `<div class="card pad" style="margin-top:10px"><b>Mark ${id} as not claimable</b><div class="muted">Closes the docket out; never offered to a variation or claim. Reversible.</div><div class="frow" style="margin-top:6px"><div class="field" style="flex:2"><label>Reason (optional)</label><input id="ncNote"></div><button class="btn or" onclick="if(act(()=>markNotClaimable(S,'${id}',document.getElementById('ncNote').value),'${id} marked Not claimable')!==null){DK_FORM=null;render()}">Confirm</button><button class="btn" onclick="DK_FORM=null;render()">Cancel</button></div></div>`;
  h += `<h2>Approvals and history</h2><div class="card pad small">${d.history.slice().reverse().map(x => `<div>${fmtDate(x.at)} · ${esc(x.by)} · ${esc(x.what)}</div>`).join('')}</div>`;
  // bottom actions
  const b = [];
  if (!locked) {
    if (d.status === 'Draft') b.push(`<button class="btn" onclick="act(()=>readyForReview(S,'${id}'),'${id} ready for review')">Ready for review</button>`, `<button class="btn or" onclick="act(()=>submitDocket(S,'${id}'),'${id} sent to the client')">Send to client</button>`);
    if (d.status === 'Ready for Review') b.push(`<button class="btn" onclick="DK_FORM='sendback';render()"><i class="fas fa-reply"></i> Send back</button>`, `<button class="btn or" onclick="act(()=>submitDocket(S,'${id}'),'${id} sent to the client')">Send to client</button>`);
    if (d.status === 'Rejected') b.push(`<button class="btn or" onclick="act(()=>submitDocket(S,'${id}'),'${id} resubmitted')">Fix and resubmit</button>`);
    if (d.status === 'Submitted') b.push(`<button class="btn" onclick="DK_FORM='sendback';render()"><i class="fas fa-reply"></i> Send back</button>`, `<button class="btn danger" onclick="act(()=>rejectDocket(S,'${id}'),'${id} rejected by the client')" title="Simulates the client rejecting it">Client rejects</button>`, `<button class="btn or" onclick="act(()=>approveDocket(S,'${id}'),'${id} approved')" title="Simulates the client signing it">Client signs (approve)</button>`);
    if (['Draft', 'Ready for Review', 'Submitted', 'Approved', 'Costed'].includes(d.status)) b.unshift(`<button class="btn" onclick="DK_FORM='nc';render()"><i class="fas fa-ban"></i> Mark as not claimable</button>`);
    if (d.status === 'Not claimable') b.push(`<button class="btn" onclick="act(()=>reopenDocket(S,'${id}'),'${id} reopened')">Reopen</button>`);
    if (d.status === 'Approved') b.push(`<button class="btn or" onclick="act(()=>markCosted(S,'${id}'),'${id} marked as costed')">MARK AS COSTED</button>`);
    if (['Approved', 'Costed'].includes(d.status)) b.push(`<button class="btn or" onclick="act(()=>markInvoiced(S,'${id}'),'${id} marked as invoiced')">MARK AS INVOICED</button>`);
  } else {
    // Locked on a variation: status marks are still allowed (no edits, no Reopen).
    if (d.status === 'Approved') b.push(`<button class="btn or" onclick="act(()=>markCosted(S,'${id}'),'${id} marked as costed')">MARK AS COSTED</button>`);
    if (['Approved', 'Costed'].includes(d.status)) b.push(`<button class="btn or" onclick="act(()=>markInvoiced(S,'${id}'),'${id} marked as invoiced')">MARK AS INVOICED</button>`);
  }
  if (h0) b.unshift(`<button class="btn" onclick="goRecord('${h0.kind}','${h0.rec.id}')">Open ${h0.kind === 'claim' ? 'Claim ' + h0.rec.id : h0.rec.id}</button>`);
  if (b.length) h += `<div class="bottombar">${b.join('')}</div>`;
  return h;
}

/* ───────── Picker (variation or claim) ───────── */
function openPicker(mode, target, preIds) {
  PK = { mode, target: target || 'new', title: '', ticked: new Set(), period: null, vars: new Set(defaultClaimVariations(S).map(v => v.id)), fromList: !!preIds };
  const openClaims = S.claims.filter(c => CLAIM_LIVE.includes(c.status));
  if (mode === 'claim' && PK.target === 'new' && preIds && openClaims.length) PK.target = openClaims[openClaims.length - 1].id;
  PK.period = mode === 'claim' ? (PK.target === 'new' ? nextClaimPeriod(S) : Object.assign({}, getClaim(S, PK.target).period)) : null;
  if (preIds) { const ok = new Set(pickerRows(S, mode, PK.period).filter(r => r.tickable).map(r => r.d.id)); preIds.forEach(id => ok.has(id) && PK.ticked.add(id)); PK.skipped = preIds.filter(id => !ok.has(id)); }
  else resetTicks();
  openModal(pickerModal, true);
}
function resetTicks() { PK.ticked = new Set(pickerRows(S, PK.mode, PK.period).filter(r => r.preTick).map(r => r.d.id)); }
function pickerModal() {
  const rows = pickerRows(S, PK.mode, PK.period); const isVar = PK.mode === 'variation';
  const pendingVars = S.variations.filter(v => v.status === 'Pending' && !v.submittedOn && !v.manual);
  const openClaims = S.claims.filter(c => CLAIM_LIVE.includes(c.status));
  let h = `<div class="spread"><h3>${isVar ? 'New Variation from dockets' : 'Add dockets to a claim'}</h3><button class="btn icon" onclick="closeModal()"><i class="fas fa-xmark"></i></button></div>`;
  if (PK.skipped && PK.skipped.length) h += `<div class="ban warn"><i class="fas fa-circle-info"></i><div>${PK.skipped.join(', ')} ${PK.skipped.length === 1 ? 'was' : 'were'} not ticked: Draft, Rejected, unmapped, overlapping, Not claimable and dockets already on a variation or claim cannot be added.</div></div>`;
  if (isVar) h += `<div class="frow"><div class="field"><label>Add to</label><select onchange="PK.target=this.value;refreshModal()"><option value="new">New variation</option>${pendingVars.map(v => `<option value="${v.id}" ${PK.target === v.id ? 'selected' : ''}>${v.id} ${esc(v.title)} (Pending, not submitted)</option>`).join('')}</select></div>${PK.target === 'new' ? `<div class="field" style="flex:2"><label>Task name</label><input value="${esc(PK.title)}" placeholder="Dayworks ${fmtDate(S.today)}" oninput="PK.title=this.value"></div>` : ''}</div>`;
  else h += `<div class="frow"><div class="field"><label>Claim</label><select onchange="PK.target=this.value;PK.period=this.value==='new'?nextClaimPeriod(S):Object.assign({},getClaim(S,this.value).period);${PK.fromList ? '' : 'resetTicks();'}refreshModal()"><option value="new">Make New Claim</option>${openClaims.map(c => `<option value="${c.id}" ${PK.target === c.id ? 'selected' : ''}>Claim # ${c.id} (${c.status}, ${fmtDate(c.period.from)} to ${fmtDate(c.period.to)})</option>`).join('')}</select></div>
    ${PK.target === 'new' ? `<div class="field"><label>Claim period from</label><input type="date" value="${PK.period.from}" onchange="PK.period.from=this.value;${PK.fromList ? '' : 'resetTicks();'}refreshModal()"></div><div class="field"><label>to</label><input type="date" value="${PK.period.to}" onchange="PK.period.to=this.value;${PK.fromList ? '' : 'resetTicks();'}refreshModal()"></div>` : ''}</div>
    <div class="muted">Dockets dated in the period are pre-ticked; older and later dockets are listed unticked. Dockets on a variation are claimed through the variation.</div>`;
  h += `<div class="lgd"><span><i class="sw" style="background:#fff"></i>Approved or Costed: can be added</span><span><i class="sw" style="background:#fef2f2"></i>Unmapped or overlap: cannot be added until fixed</span><span><i class="fas fa-eye-slash"></i> Other statuses, Not claimable and dockets already on a variation are not listed</span></div><div class="muted" style="margin-bottom:6px">${RELEASE === 'lean' ? 'Each line takes the docket\'s calculator value now. It does not move on its own; use Refresh from dockets on the variation to reprice.' : 'Each line follows its docket\'s calculator value until the variation is approved.'} Added dockets are locked until their line is removed.</div>`;
  h += `<div class="tw"><table><thead><tr><th></th><th>Performed on</th><th>Docket</th><th>Status</th><th>Description</th><th class="num">Calculator value</th><th>Note</th></tr></thead><tbody>`;
  if (!rows.length) h += `<tr><td colspan="7" class="muted">No dockets available.</td></tr>`;
  rows.forEach(r => {
    const per = PK.period ? (r.inPeriod ? '<span class="tag t-ver">in period</span>' : r.older ? '<span class="tag t-chg">before period</span>' : '<span class="tag t-lock">after period</span>') : '';
    h += `<tr class="${r.highlight || ''}"><td><input type="checkbox" ${r.tickable ? '' : 'disabled'} ${PK.ticked.has(r.d.id) ? 'checked' : ''} onchange="this.checked?PK.ticked.add('${r.d.id}'):PK.ticked.delete('${r.d.id}');refreshModal()"></td><td class="small">${dayName(r.d.date)} ${fmtDate(r.d.date)} ${per}</td><td><a onclick="openDocket('${r.d.id}')">${r.d.id}</a></td><td>${pill(r.d.status)}</td><td class="small">${esc(r.d.desc || docketSummary(r.d))}</td><td class="num">${money(r.value)}</td><td class="small">${r.block ? '<b>' + esc(r.block) + '</b>' : r.highlight === 'warn' ? 'Not yet approved' : ''}</td></tr>`;
  });
  h += `</tbody></table></div>`;
  const sel = rows.filter(r => PK.ticked.has(r.d.id)); const unap = sel.filter(r => !SIGNED.includes(r.d.status)).length;
  h += `<div class="actions"><span class="muted" style="margin-right:auto">${plural(sel.length, 'docket')} ticked · ${money(round2(sel.reduce((a, r) => a + r.value, 0)))} ex GST · one line per docket at full calculator value, no margin${unap ? ` · <b style="color:#92400e">${unap} not yet approved</b>` : ''}</span><button class="btn" onclick="closeModal()">Cancel</button><button class="btn or" onclick="confirmPicker()">${isVar ? (PK.target === 'new' ? 'Create variation' : 'Add to ' + PK.target) : (PK.target === 'new' ? 'Make New Claim' : 'Add to Claim # ' + PK.target)}</button></div>`;
  return h;
}
function confirmPicker() {
  const pk = PK; const ids = pickerRows(S, pk.mode, pk.period).filter(r => pk.ticked.has(r.d.id)).map(r => r.d.id);
  if (pk.mode === 'variation') {
    const r = act(() => pk.target === 'new' ? createVariation(S, ids, { title: pk.title || undefined }) : addToVariation(S, pk.target, ids), plural(ids.length, 'docket') + ' added');
    if (r) { DW.sel.clear(); closeModal(); TAB = 'variation'; VR.open = r.id; VR.sub = 'dockets'; render(); }
  } else {
    let id = pk.target;
    const r = act(() => { if (pk.target === 'new') id = createClaim(S, { from: pk.period.from, to: pk.period.to }, ids).id; else claimAddDockets(S, pk.target, ids); return true; }, pk.target === 'new' ? 'Claim created' : plural(ids.length, 'docket') + ' added to Claim # ' + pk.target);
    if (r) { DW.sel.clear(); closeModal(); TAB = 'claim'; CL.open = id; CL.sub = 'dayworks'; render(); }
  }
}
function confirmDialog(title, body, okLabel, onOk) {
  openModal(() => `<h3>${title}</h3><div class="ban warn"><i class="fas fa-triangle-exclamation"></i><div>${body}</div></div><div class="actions"><button class="btn" onclick="closeModal()">Cancel</button><button class="btn or" id="cfOk">${okLabel}</button></div>`);
  document.getElementById('cfOk').onclick = () => { closeModal(); onOk(); };
}

/* ───────── Variation Register tab ───────── */
const VAR_STATUSES = ['Pending', 'Approved', 'Partial Approved', 'Non-Claimable', 'Rejected'];
function varRegister() {
  const vs = S.variations.filter(v => !VR.filter || v.status === VR.filter);
  const est = round2(S.variations.filter(v => v.manual).reduce((a, v) => a + v.manual.estimated, 0));
  const subm = round2(S.variations.filter(v => !['Rejected', 'Non-Claimable'].includes(v.status)).reduce((a, v) => a + (varSubmittedAmount(S, v) || 0), 0));
  const appr = round2(approvedVars(S).reduce((a, v) => a + v.approvedAmount, 0));
  let h = `<div class="tiles"><div class="tilegrp"><div class="tile"><div class="l">Estimated Cost</div><div class="v">${money(est)}</div></div><div class="tile"><div class="l">Submitted Amount</div><div class="v">${money(subm)}</div></div><div class="tile"><div class="l">Approved Amount</div><div class="v">${money(appr)}</div></div></div></div>
    <div class="spread"><select class="filter" onchange="VR.filter=this.value;render()"><option value="">Filter by Status</option>${VAR_STATUSES.map(s => `<option ${VR.filter === s ? 'selected' : ''}>${s}</option>`).join('')}</select>
    <div class="row"><span class="help"><i class="fas fa-circle-question"></i> Need Help?</span><button class="btn" onclick="inert('Export')"><i class="fas fa-download"></i> Export <i class="fas fa-chevron-down" style="font-size:9px"></i></button><button class="btn" onclick="inert('Import')"><i class="fas fa-upload"></i> Import</button>
    <span class="menuwrap"><button class="btn or" onclick="event.stopPropagation();MENU=MENU==='newvar'?null:'newvar';render()"><i class="fas fa-circle-plus"></i> New Variation <i class="fas fa-chevron-down" style="font-size:9px"></i></button>${MENU === 'newvar' ? `<div class="menu"><div onclick="event.stopPropagation();MENU=null;inert('Blank variation')"><i class="fas fa-file"></i> Blank variation</div><div onclick="event.stopPropagation();MENU=null;render();openPicker('variation')"><i class="fas fa-file-lines"></i> From dockets</div></div>` : ''}</span></div></div>`;
  h += `<div class="tw card" style="margin-top:10px"><table class="navyhead"><thead><tr><th style="width:30px"></th><th>WBS ID</th><th style="width:30px"></th><th>Task</th><th class="num">Estimated Cost</th><th class="num">Submitted Amount</th><th class="num">Approved Amount</th><th>Status</th><th>Action</th></tr></thead><tbody>`;
  vs.forEach(v => {
    const sub = varSubmittedAmount(S, v); const exp = VR.expand.has(v.id);
    const kids = v.manual ? v.manual.subs : v.lines;
    const blocked = v.status === 'Pending' && !v.manual && recordIssues(S, v).length;
    h += `<tr class="click" onclick="${v.manual ? `inert('Editing a hand-entered variation')` : `VR.open='${v.id}';VR.sub='dockets';render();window.scrollTo(0,0)`}"><td><i class="fas fa-pen" style="color:#475569"></i></td><td><b>${v.id}</b></td>
      <td onclick="event.stopPropagation()">${kids.length ? `<a onclick="VR.expand.has('${v.id}')?VR.expand.delete('${v.id}'):VR.expand.add('${v.id}');render()"><i class="fas fa-chevron-${exp ? 'down' : 'right'}"></i></a>` : ''}</td>
      <td><b>${esc(v.title)}</b>${v.manual ? '' : ` <span class="tag t-ver">${plural(v.lines.length, 'docket')}</span>`}${varSubmittedChanged(S, v) ? ' <span class="tag t-chg">changed since submitted</span>' : ''}${blocked ? ' <span class="tag t-bad">blocked</span>' : ''}</td>
      <td class="num">${v.manual ? money(v.manual.estimated) : '-'}</td><td class="num">${sub === null ? money(0) : money(sub)}</td><td class="num">${v.approvedAmount === null || v.approvedAmount === undefined ? money(0) : money(v.approvedAmount)}</td>
      <td>${pill(v.status)}${!v.manual && v.status === 'Pending' ? `<div class="muted">${v.submittedOn ? 'submitted, rev ' + v.revision : 'not submitted'}</div>` : ''}</td><td><i class="fas fa-download" style="color:#475569"></i></td></tr>`;
    if (exp) {
      if (v.manual) v.manual.subs.forEach(s => h += `<tr class="sub"><td></td><td>${s.id}</td><td></td><td style="padding-left:24px">${esc(s.title)}</td><td class="num">${money(s.est)}</td><td class="num">${money(s.submitted)}</td><td class="num">${v.status === 'Approved' ? money(s.submitted) : '-'}</td><td></td><td></td></tr>`);
      else v.lines.forEach((ln, k) => { const d = getDocket(S, ln.docket); const val = varLineValue(S, v, ln); h += `<tr class="sub click" onclick="openDocket('${d.id}')"><td></td><td>${v.id}.${k + 1}</td><td></td><td style="padding-left:24px">Dayworks ${d.id} · ${fmtDate(d.date)} · ${esc(d.desc)} ${pill(d.status)}${varLineChanged(S, v, ln) ? ' <span class="tag t-chg">changed</span>' : ''}</td><td class="num">-</td><td class="num">${v.submittedOn ? money(val) : '-'}</td><td class="num">${VAR_LOCKED.includes(v.status) ? money(ln.frozen) : '-'}</td><td></td><td></td></tr>`; });
    }
  });
  if (!vs.length) h += `<tr><td colspan="9" class="muted">No variations.</td></tr>`;
  h += `</tbody></table></div><div class="muted" style="margin-top:8px">Approved contract sum ${money(contractSum(S))} (original ${money(S.project.contractSum)} + approved variations ${money(appr)}). Rejected and Non-Claimable variations stay on the register. Docket variations open on their Dockets tab; expand a row to see one sub-line per docket. Estimated Cost is not filled from dockets in this release.</div>`;
  return h;
}
function changedCell(changed, added, now, until) { return changed ? `<span class="tag t-chg"><i class="fas fa-arrows-rotate"></i> changed since added</span><div class="muted">was <s>${money(added)}</s> now ${money(now)} · flagged until ${until}</div>` : ''; }
function lineFlags(d, live) {
  if (!live) return ''; let f = ''; const iss = docketIssue(S, d);
  if (iss) f += `<div><span class="tag t-bad"><i class="fas fa-ban"></i> ${esc(iss)}</span><div class="muted">blocks until fixed or removed</div></div>`;
  if (d.reapprove && d.status === 'Submitted') f += `<div><span class="tag t-chg"><i class="fas fa-rotate-left"></i> reopened, back to Submitted</span></div>`;
  return f;
}
function historyTable(rec) {
  const rows = rec.history.slice().reverse();
  return `<h2>History <span class="muted" style="font-weight:400">every line change with old and new value; kept after approval</span></h2><div class="tw card"><table><thead><tr><th>Date</th><th>By</th><th>Change</th><th class="num">Old</th><th class="num">New</th></tr></thead><tbody>${rows.map(x => `<tr><td class="small">${fmtDate(x.at)}</td><td class="small">${esc(x.by || '')}</td><td class="small">${esc(x.what)}</td><td class="num small">${x.old === undefined ? '' : money(x.old)}</td><td class="num small">${x.new === undefined ? '' : money(x.new)}</td></tr>`).join('') || '<tr><td colspan="5" class="muted">No history.</td></tr>'}</tbody></table></div>`;
}
function varPage(v) {
  const live = v.status === 'Pending'; const iss = live ? recordIssues(S, v) : []; const total = varTotal(S, v); const sub = varSubmittedAmount(S, v);
  let h = `<div class="spread"><div class="row"><a onclick="VR.open=null;render()"><i class="fas fa-arrow-left"></i></a> <b style="font-size:15px">Edit Variation</b> ${pill(v.status)}${live ? `<span class="muted">${v.submittedOn ? 'submitted ' + fmtDate(v.submittedOn) : 'not yet submitted to the client'}</span>` : ''}</div><div class="row">`;
  if (live && RELEASE === 'lean') h += `<button class="btn" onclick="act(()=>refreshFromDockets(S,'${v.id}'),'${v.id} refreshed from dockets')"><i class="fas fa-arrows-rotate"></i> Refresh from dockets</button>`;
  if (live && !v.submittedOn) h += `<button class="btn" onclick="openPicker('variation','${v.id}')"><i class="fas fa-plus"></i> Add dockets</button><button class="btn" onclick="doNonClaimable('${v.id}')">Set Non-Claimable</button><button class="btn or" onclick="doSubmitVar('${v.id}')">Submit to client</button>`;
  if (live && v.submittedOn) h += `<button class="btn" onclick="doNonClaimable('${v.id}')">Set Non-Claimable</button><button class="btn danger" onclick="act(()=>releaseVariation(S,'${v.id}','Rejected'),'${v.id} rejected, dockets freed')">Client rejected</button><button class="btn or" onclick="doApproveVar('${v.id}')">Client approved</button>`;
  h += `</div></div>
    <div class="row" style="margin-top:10px"><div class="titlebox">${esc(v.title)}</div><div class="fld" style="min-width:90px"><label>Revision</label><div class="val">${v.revision || '-'}</div></div></div>
    <div class="fields"><div class="fld"><label>WBS ID</label><div class="val">${v.id}</div></div><div class="fld"><label>Claim Ref</label><div class="val">${esc(v.claimRef || v.id)}</div></div><div class="fld"><label>Cost Centre</label><div class="val">${esc(v.costCentre || 'Dayworks')}</div></div><div class="fld"><label>Summary/Comments</label><div class="val"><i class="fas fa-file"></i> <i class="fas fa-message"></i></div></div>
    <div class="fld"><label>Submitted Amount</label><div class="amt">${sub === null ? money(0) : money(sub)}</div></div><div class="fld"><label>Approved Amount</label><div class="amt">${v.approvedAmount === null ? money(0) : money(v.approvedAmount)}</div></div><div class="fld"><label>Estimated Cost</label><div class="amt">-</div></div><div class="fld"><label>Margin</label><div class="amt">-</div></div><div class="fld"><label>Budget Sum</label><div class="amt">-</div></div></div>`;
  if (iss.length) h += `<div class="ban err"><i class="fas fa-ban"></i><div><b>${v.submittedOn ? 'Cannot be approved' : 'Cannot be submitted'}</b> until ${iss.map(x => x.docket).join(', ')} ${iss.length === 1 ? 'is' : 'are'} fixed or removed: ${iss.map(x => esc(x.docket + ' ' + x.issue)).join('; ')}.</div></div>`;
  if (varNeedsRevision(S, v)) h += `<div class="ban warn"><i class="fas fa-paper-plane"></i><div style="flex:1"><b>Changed since submitted.</b> The client last saw ${money(v.submittedBase)} (revision ${v.revision}); the lines now total ${money(total)}${v.docketsChanged ? ', and dockets have been removed' : ''}. It can still be approved; approving now records a warning.</div><button class="btn or sm" onclick="act(()=>sendRevision(S,'${v.id}'),'Revision sent to the client')">Send new revision</button></div>`;
  else if (live && v.submittedOn) h += `<div class="ban warn"><i class="fas fa-arrows-rotate"></i><div>Pending, submitted to the client. ${RELEASE === 'lean' ? 'Line values are the snapshot taken when each docket was added (or last refreshed); they do not move on their own.' : 'Each line still follows its docket\'s current calculator value until the variation is approved; a move shows "Changed since submitted".'}</div></div>`;
  if (live && RELEASE === 'lean' && v.lines.some(ln => Math.abs(priceDocket(S, getDocket(S, ln.docket)).total - ln.snap) > 0.004)) h += `<div class="ban info"><i class="fas fa-circle-info"></i><div>The calculator now prices ${v.lines.filter(ln => Math.abs(priceDocket(S, getDocket(S, ln.docket)).total - ln.snap) > 0.004).map(ln => ln.docket).join(', ')} differently from the line value. Lines only change if you use Refresh from dockets${v.submittedOn ? '; after submit a refresh also updates the Submitted Amount and starts a new revision' : ''}.</div></div>`;
  if (VAR_LOCKED.includes(v.status)) h += `<div class="ban ok"><i class="fas fa-lock"></i><div>${v.status}. Every line is frozen and its dockets are read-only. It is claimed on the Claim tab's Variation tab by percent complete to date${v.status === 'Partial Approved' ? ' of the approved amount' : ''}. Its dockets keep their status; mark them Invoiced by hand once billed.</div></div>`;
  if (['Rejected', 'Non-Claimable'].includes(v.status)) h += `<div class="ban dark"><i class="fas fa-unlock"></i><div>${v.status}. It stays on the register with its history; its dockets were freed for another variation or a claim. Lines below are history only.</div></div>`;
  h += `<div class="itabs">${['dockets', 'cost', 'contract'].map(t => `<div class="itab ${VR.sub === t ? 'active' : ''}" onclick="VR.sub='${t}';render()">${t}</div>`).join('')}</div>`;
  if (VR.sub === 'dockets') {
    h += `<div class="ban info"><i class="fas fa-percent"></i><div>Each line is its docket's full Dayworks Calculator value. Project cost-plus margins (Labour ${S.project.margins.Labour}%, Plant ${S.project.margins.Plant}%) are <b>not</b> applied to docket lines.</div></div>`;
    h += `<div class="tw card"><table><thead><tr><th>Ref</th><th>Docket</th><th>Performed on</th><th>Docket status</th><th>Description</th><th class="num">Docket value now</th><th class="num">Line value</th><th>Flags</th><th></th></tr></thead><tbody>`;
    v.lines.forEach((ln, k) => {
      const d = getDocket(S, ln.docket); const val = varLineValue(S, v, ln); const dv = live ? priceDocket(S, d).total : val; const issue = live && docketIssue(S, d);
      h += `<tr class="${issue ? 'block' : !SIGNED.includes(d.status) && live ? 'warn' : ''}"><td>${v.id}.${k + 1}</td><td><a onclick="openDocket('${d.id}')"><b>${d.id}</b></a></td><td class="small">${fmtDate(d.date)}</td><td>${pill(d.status)}</td><td class="small">${esc(d.desc)}</td><td class="num">${money(dv)}</td><td class="num"><b>${money(val)}</b></td><td>${changedCell(varLineChanged(S, v, ln), ln.added, val, 'approval')}${lineFlags(d, live)}</td>
        <td>${live ? `<button class="btn icon" title="Remove and free" onclick="act(()=>removeFromVariation(S,'${v.id}','${d.id}'),'${d.id} removed and freed')"><i class="fas fa-xmark"></i></button>` : ''}</td></tr>`;
    });
    if (v.adjustment) h += `<tr class="warn"><td colspan="6"><b>Adjustment</b> <span class="muted">approved ${money(v.approvedAmount)} against lines of ${money(v.submittedFinal)}</span></td><td class="num"><b>${money(v.adjustment.amount)}</b></td><td colspan="2">${v.adjustment.amount < 0 ? `<select class="cell" onchange="act(()=>setAdjustmentStatus(S,'${v.id}',this.value),'Adjustment updated')">${SHORTFALL.map(x => `<option ${x === v.adjustment.status ? 'selected' : ''}>${x}</option>`).join('')}</select>` : '<span class="muted">higher approval, no status needed</span>'}</td></tr>`;
    if (!v.lines.length) h += `<tr><td colspan="9" class="muted">No dockets.</td></tr>`;
    h += `<tr class="tot"><td colspan="6">Lines total (ex GST, no cost-plus margin)</td><td class="num">${money(total)}</td><td colspan="2"></td></tr></tbody></table></div><div class="muted" style="margin-top:6px">Docket value now is what the calculator says today; line value is ${RELEASE === 'lean' ? 'the snapshot on this variation' : 'what this variation carries'}. Remove a line to free its docket.</div>`;
    if (v.decisions.length) h += `<div class="ban warn"><i class="fas fa-clipboard-check"></i><div>${v.decisions.map(x => `${fmtDate(x.at)} · ${esc(x.by)} · ${esc(x.what)}`).join('<br>')}</div></div>`;
    h += historyTable(v);
  } else if (VR.sub === 'cost') {
    h += `<div class="row"><button class="btn" onclick="inert('Add Subtask')"><i class="fas fa-plus"></i> Add Subtask</button><button class="btn" onclick="inert('Add Resource')"><i class="fas fa-plus"></i> Add Resource</button></div><div class="muted" style="margin-top:8px">The Cost tab works as today; it is not filled from dockets in this release.</div>`;
  } else {
    h += `<div class="tw card"><table><thead><tr><th>Task</th><th>Claim Reference</th><th>Unit</th><th class="num">Submitted Qty</th><th class="num">Submitted Rate</th><th class="num">Submitted Amount</th><th class="num">Approved Qty</th><th class="num">Approved Rate</th><th class="num">Approved Amount</th><th class="num">Margin</th></tr></thead><tbody>${v.lines.map((ln, k) => { const val = varLineValue(S, v, ln); const appr = VAR_LOCKED.includes(v.status); return `<tr><td>Dayworks ${ln.docket}</td><td>${v.id}.${k + 1}</td><td>item</td><td class="num">${v.submittedOn ? 1 : '-'}</td><td class="num">${v.submittedOn ? money(val) : '-'}</td><td class="num">${v.submittedOn ? money(val) : '-'}</td><td class="num">${appr ? 1 : '-'}</td><td class="num">${appr ? money(ln.frozen) : '-'}</td><td class="num">${appr ? money(ln.frozen) : '-'}</td><td class="num">0</td></tr>`; }).join('')}${v.adjustment ? `<tr class="warn"><td>Adjustment${v.adjustment.status ? ' (' + esc(v.adjustment.status) + ')' : ''}</td><td></td><td></td><td></td><td></td><td></td><td class="num">1</td><td class="num">${money(v.adjustment.amount)}</td><td class="num">${money(v.adjustment.amount)}</td><td></td></tr>` : ''}</tbody></table></div><div class="muted" style="margin-top:6px">Contract tab: each docket is one contract line, quantity 1 at its calculator value.</div>`;
  }
  return h;
}
function doNonClaimable(id) {
  const v = getVar(S, id);
  confirmDialog('Set ' + id + ' Non-Claimable?', `It stays on the Variation Register as Non-Claimable with its history, and ${v.lines.map(l => l.docket).join(', ') || 'its dockets'} ${v.lines.length === 1 ? 'is' : 'are'} freed for a claim or another variation.`, 'Set Non-Claimable', () => act(() => releaseVariation(S, id, 'Non-Claimable'), id + ' set Non-Claimable, dockets freed'));
}
function doSubmitVar(id) {
  const r = act(() => submitVariation(S, id), null);
  if (r && r.needsConfirm) confirmDialog('Submit ' + id + ' to the client?', `<b>${r.message}.</b> It can still be submitted; your decision is recorded. Lines keep following their dockets until the variation is approved.`, 'Submit anyway', () => act(() => submitVariation(S, id, { confirm: true }), id + ' submitted, status stays Pending'));
  else if (r) toast(id + ' submitted, status stays Pending');
}
function doApproveVar(id) {
  const v = getVar(S, id); const amt = defaultApprovedAmount(S, v); const stale = varSubmittedChanged(S, v);
  openModal(() => `<h3>Record client approval of ${id}</h3>${stale ? `<div class="ban warn"><i class="fas fa-triangle-exclamation"></i><div><b>Changed since submitted.</b> The client saw ${money(v.submittedBase)} (revision ${v.revision}); the lines now total ${money(amt)}. The approved amount defaults to the current total. Approval can go ahead; this warning is recorded.</div></div>` : ''}<p class="muted">Lines total ${money(amt)}. Less than that is Partial Approved; the same or more is Approved. Either way every line freezes and the dockets lock.</p>
    <div class="field"><label>Approved amount (ex GST)</label><input id="apAmt" type="number" step="0.01" value="${amt}" oninput="const d=Math.round((Number(this.value)-${amt})*100)/100;document.getElementById('apAdj').style.display=d<-0.004?'flex':'none';document.getElementById('apUp').style.display=d>0.004?'flex':'none';document.getElementById('apDiff').textContent=money(d);document.getElementById('apUpDiff').textContent=money(d)"></div>
    <div id="apAdj" style="display:none" class="ban warn"><i class="fas fa-scale-unbalanced"></i><div style="flex:1">Less than submitted (<b id="apDiff"></b>): the variation becomes <b>Partial Approved</b>.</div></div>
    <div id="apUp" style="display:none" class="ban info"><i class="fas fa-scale-unbalanced"></i><div>More than submitted (<b id="apUpDiff"></b>): Approved.</div></div>
    <div class="actions"><button class="btn" onclick="closeModal()">Cancel</button><button class="btn or" onclick="const a=Number(document.getElementById('apAmt').value),sf='';const r=act(()=>approveVariation(S,'${id}',a,sf||undefined),'${id} approved');if(r!==null){closeModal();render();if(r.warning)toast(r.warning+'. Warning recorded.');}">${stale ? 'Approve anyway' : 'Approve'}</button></div>`);
}

/* ───────── Claim tab ───────── */
function claimRollup() {
  const ap = approvedClaims(S);
  const t = ap.map(c => claimTotals(S, c));
  const contractClaimed = round2(t.reduce((a, x) => a + x.boq, 0)), varClaimed = round2(t.reduce((a, x) => a + x.vars, 0)), dwClaimed = round2(t.reduce((a, x) => a + x.dockets, 0));
  const ret = round2(t.reduce((a, x) => a + x.retention, 0));
  const varTotalAmt = round2(approvedVars(S).reduce((a, v) => a + v.approvedAmount, 0));
  return { contractClaimed, varClaimed, dwClaimed, ret, varTotalAmt, toDate: round2(contractClaimed + varClaimed + dwClaimed), grand: round2(S.project.contractSum + varTotalAmt) };
}
function claimList() {
  const r = claimRollup(); const pct = r.grand ? Math.round((r.toDate / r.grand) * 10000) / 100 : 0;
  let h = `<div class="spread"><div class="row"><div class="tilegrp"><div class="tile" style="display:flex;align-items:center"><span class="ring" style="background:conic-gradient(#16a34a ${pct * 3.6}deg,#e5e7eb 0)"></span><div><div class="l">Completion</div><div class="v">${pct.toFixed(2)} %</div></div></div><div class="tile"><div class="l">Grand Total</div><div class="v">${money(r.grand)}</div></div><div class="tile"><div class="l">Claim To Date</div><div class="v">${money(r.toDate)}</div></div></div>
    <div class="tilegrp"><div class="tile"><div class="l">Total Original Contract Value</div><div class="v">${money(S.project.contractSum)}</div></div><div class="tile"><div class="l">Claimed</div><div class="v">${money(r.contractClaimed)}</div></div><div class="tile"><div class="l">Remaining</div><div class="v">${money(round2(S.project.contractSum - r.contractClaimed))}</div></div></div>
    <div class="tilegrp"><div class="tile"><div class="l">Variation Total</div><div class="v">${money(r.varTotalAmt)}</div></div><div class="tile"><div class="l">Claimed</div><div class="v">${money(r.varClaimed)}</div></div><div class="tile"><div class="l">Remaining</div><div class="v">${money(round2(r.varTotalAmt - r.varClaimed))}</div></div></div></div>
    <div class="row"><span class="help"><i class="fas fa-circle-question"></i> Need Help?</span><button class="btn or" onclick="makeNewClaim()"><i class="fas fa-plus"></i> Make New Claim</button>${menuBtn('clmenu', [{ label: 'Claim settings', icon: 'fa-gear' }])}</div></div>`;
  h += `<div class="tw card" style="margin-top:12px"><table><thead><tr><th>Contract Details</th><th class="num">Contract Sum</th><th class="num">Claim To Date</th><th class="num">Remaining Claim</th><th class="num">Retention Withheld</th></tr></thead><tbody>
    <tr><td>Contract Works</td><td class="num">${money(S.project.contractSum)}</td><td class="num">${money(r.contractClaimed)}</td><td class="num">${money(round2(S.project.contractSum - r.contractClaimed))}</td><td class="num" rowspan="3" style="vertical-align:middle">${money(r.ret)}</td></tr>
    <tr><td>Variations</td><td class="num">${money(r.varTotalAmt)}</td><td class="num">${money(r.varClaimed)}</td><td class="num">${money(round2(r.varTotalAmt - r.varClaimed))}</td></tr>
    <tr class="tot"><td>Total</td><td class="num">${money(r.grand)}</td><td class="num">${money(r.toDate)}</td><td class="num">${money(round2(r.grand - r.contractClaimed - r.varClaimed))}</td><td class="num">${money(r.ret)}</td></tr></tbody></table></div>`;
  const cs = S.claims.filter(c => c.status !== 'Deleted').sort((a, b) => Number(b.id) - Number(a.id));
  h += `<h2>Claims</h2><div class="tw card"><table><thead><tr><th>Claim Number</th><th>Date Submitted</th><th>Date Approved</th><th>Invoice Ref</th><th>Claim Period</th><th>Status</th><th class="num">Claim Amount</th><th></th></tr></thead><tbody>`;
  cs.forEach(c => { const t = claimTotals(S, c); h += `<tr class="click" onclick="CL.open='${c.id}';CL.sub='variation';render();window.scrollTo(0,0)"><td>${c.id}</td><td>${c.submittedOn ? dayName(c.submittedOn) + ', ' + fmtDate(c.submittedOn) : '-'}</td><td>${c.status === 'Approved' ? dayName(c.issued) + ', ' + fmtDate(c.issued) : '-'}</td><td>${esc(c.invoiceRef || '-')}</td><td>${dayName(c.period.from)}, ${fmtDate(c.period.from)} - ${dayName(c.period.to)}, ${fmtDate(c.period.to)}</td><td>${claimPill(c.status)}${c.reopenedOn ? ' <span class="tag t-chg">reopened</span>' : ''}${c.changedSinceSubmitted ? ' <span class="tag t-chg">changed since submitted</span>' : ''}${claimAccountingLabel(S, c) ? ' <span class="tag t-chg">credit note</span>' : ''}</td><td class="num">${money(t.gross)}</td><td><i class="fas fa-ellipsis-vertical"></i></td></tr>`; });
  h += `</tbody></table></div>`;
  return h;
}
function makeNewClaim() {
  const p = nextClaimPeriod(S);
  openModal(() => `<h3>Make New Claim</h3><div class="frow"><div class="field"><label>Claim period from</label><input id="ncFrom" type="date" value="${p.from}"></div><div class="field"><label>to</label><input id="ncTo" type="date" value="${p.to}"></div></div>
    <p class="muted" style="margin-top:8px">Works as today. Approved variations not yet fully claimed, docket variations included, are added at 100% to date on the Variation tab.</p>
    <div class="actions"><button class="btn" onclick="closeModal()">Cancel</button><button class="btn or" onclick="const r=act(()=>createClaim(S,{from:document.getElementById('ncFrom').value,to:document.getElementById('ncTo').value},[]),'Claim created');if(r){closeModal();CL.open=r.id;CL.sub='variation';CL.ticks=null;render();}">Make New Claim</button></div>`);
}
function claimPage(c) {
  const open = CLAIM_LIVE.includes(c.status); const t = claimTotals(S, c);
  const prevGross = round2(approvedClaims(S).filter(x => x !== c && (x.issueSeq || 0) < (c.issueSeq || Infinity)).reduce((a, x) => a + claimTotals(S, x).gross, 0));
  const r = claimRollup(); const grand = r.grand; const toDate = round2(prevGross + t.gross); const remaining = round2(grand - toDate);
  const iss = open ? recordIssues(S, c) : [];
  const items = [{ label: 'Download PDF', icon: 'fa-file-pdf' }, { label: 'Download Excel file', icon: 'fa-file-excel' }, { label: 'View attachment', icon: 'fa-paperclip' }];
  if (c.status === 'Approved') items.push({ label: 'Reopen Claim', icon: 'fa-rotate-left', on: `act(()=>reopenClaim(S,'${c.id}'),'Claim ${c.id} reopened; its dockets stay locked and Invoiced')` });
  items.push(c.status === 'Draft' ? { label: 'Delete claim', icon: 'fa-trash', cls: 'red', on: `if(confirm('Delete claim ${c.id}? Its dockets and variations are released.')){if(act(()=>deleteDraftClaim(S,'${c.id}'),'Claim ${c.id} deleted')!==null){CL.open=null;render();}}` } : { label: 'Delete claim', icon: 'fa-trash', cls: 'off', on: `toast('Only a draft claim can be deleted',true)` });
  let h = `<div class="spread"><div class="row"><a onclick="CL.open=null;render()"><i class="fas fa-arrow-left"></i></a> <b style="font-size:14px">Claim # ${c.id}</b> ${claimPill(c.status)}${c.reopenedOn ? ' <span class="tag t-chg">reopened ' + fmtDate(c.reopenedOn) + '</span>' : ''}${c.changedSinceSubmitted ? ' <span class="tag t-chg">changed since submitted</span>' : ''}</div>
    <div class="row">${c.status === 'Draft' ? `<button class="btn" onclick="act(()=>submitClaim(S,'${c.id}'),'Claim ${c.id} submitted')">Submit</button>` : ''}${open ? `<button class="btn or" onclick="doApproveClaim('${c.id}')">Approve claim</button>` : ''}${menuBtn('claim' + c.id, items)}</div></div>
    <div class="fields"><div class="fld" style="min-width:160px"><label>Invoice Ref</label><div class="val">${esc(c.invoiceRef || 'Invoice Ref')}</div></div><div class="fld" style="min-width:240px"><label>Claim Period</label><div class="val"><i class="fas fa-calendar"></i> ${dayName(c.period.from)} ${fmtDate(c.period.from)} - ${dayName(c.period.to)} ${fmtDate(c.period.to)}</div></div></div>
    <div class="progress"><div style="background:#22c55e;width:${Math.max(0, Math.min(100, prevGross / grand * 100))}%"></div><div style="background:#f59e0b;width:${Math.max(0, Math.min(100, t.gross / grand * 100))}%"></div></div>
    <div class="legend"><div class="it"><div class="l"><span class="dot" style="background:#22c55e"></span>Previously Claimed</div><div class="v">${money(prevGross)}</div></div><div class="it"><div class="l"><span class="dot" style="background:#f59e0b"></span>Current Claim</div><div class="v">${money(t.gross)}</div></div><div class="it"><div class="l"><span class="dot" style="background:#1e3a8a"></span>Claim to Date</div><div class="v">${money(toDate)}</div></div><div class="it"><div class="l"><span class="dot" style="background:#cbd5e1"></span>Remaining</div><div class="v">${money(remaining)}</div></div></div>`;
  if (iss.length) h += `<div class="ban err"><i class="fas fa-ban"></i><div><b>Cannot be approved</b> until ${iss.map(x => x.docket).join(', ')} ${iss.length === 1 ? 'is' : 'are'} fixed or removed: ${iss.map(x => esc(x.docket + ' ' + x.issue)).join('; ')}.</div></div>`;
  if (c.changedSinceSubmitted) h += `<div class="ban warn"><i class="fas fa-arrows-rotate"></i><div><b>Changed since submitted.</b> Dockets were added or removed after the claim was submitted; every change is in the history below. The flag clears when the claim is approved.</div></div>`;
  if (c.status === 'Approved') h += `<div class="ban ok"><i class="fas fa-lock"></i><div>Approved and locked. Dockets on its variations keep their status; mark them Invoiced by hand once billed.</div></div>`;
  else if (c.reopenedOn) h += `<div class="ban warn"><i class="fas fa-rotate-left"></i><div>Reopened, as today.</div></div>`;
  if (t.negative) h += `<div class="ban warn"><i class="fas fa-circle-minus"></i><div><b>Negative claim.</b> Credit lines take this claim below zero (${money(t.gross)} ex GST). It ${open ? 'can be approved' : 'was approved'}; retention and GST follow Varicon's existing rules and go negative.</div></div>`;
  if (claimAccountingLabel(S, c)) h += `<div class="ban ok"><i class="fas fa-file-invoice"></i><div><b>${claimAccountingLabel(S, c)}.</b> A negative claim goes to Xero or MYOB as a credit note, not an invoice.</div></div>`;
  h += `<div class="itabs">${['contract', 'variation', 'retention'].map(x => `<div class="itab ${CL.sub === x ? 'active' : ''}" onclick="CL.sub='${x}';CL.ticks=null;render()">${x}</div>`).join('')}</div>`;
  if (CL.sub === 'contract') h += claimContract(c, open);
  if (CL.sub === 'variation') h += claimVariations(c, open);
  if (CL.sub === 'dayworks') h += claimDayworks(c, open);
  if (CL.sub === 'retention') h += claimRetention(c, t);
  if (c.decisions.length) h += `<div class="ban warn"><i class="fas fa-clipboard-check"></i><div>${c.decisions.map(x => `${fmtDate(x.at)} · ${esc(x.by)} · ${esc(x.what)}`).join('<br>')}</div></div>`;
  h += historyTable(c);
  document.getElementById('cfoot').innerHTML = `<div class="cfoot"><div class="g"><div><span class="lab">Contract Works</span><b>${money(t.boq)}</b></div><div><span class="lab">Variations</span><b>${money(t.vars)}</b></div><div><span class="lab">Total Claim</span><b>${money(t.gross)}</b></div></div>
    <div class="g"><div><span class="lab or">Retention Held</span><b>${money(t.retention)}</b></div></div><div class="g"><div><span class="lab">GST</span><b>${money(t.gst)}</b></div></div><div class="g" style="margin-left:auto"><div style="text-align:right"><span class="lab" style="color:#16a34a">Revised Total (ex GST)</span><b>${money(t.net)}</b></div><div style="text-align:right"><span class="lab">Incl GST</span><b>${money(t.total)}</b></div></div></div>`;
  return h;
}
function claimContract(c, open) {
  let h = `<div class="tw card"><table><thead><tr><th>Ref</th><th>Description</th><th>Unit</th><th class="num">Qty</th><th class="num">Total Sum</th><th class="num">Previous Qty</th><th class="num">Previous Amt</th><th class="num">Current Qty</th><th class="num">Claim Amount</th><th>Note for PDF</th></tr></thead><tbody>`;
  S.project.boq.forEach(b => { const prev = boqPrevQty(S, c, b.code); const q = c.boq[b.code] || 0; h += `<tr><td>${b.code}</td><td>${esc(b.desc)}</td><td>${b.unit}</td><td class="num">${b.qty}</td><td class="num">${money(round2(b.qty * b.rate))}</td><td class="num">${prev}</td><td class="num">${money(round2(prev * b.rate))}</td><td class="num">${open ? `<input class="cell" type="number" min="0" value="${q}" onchange="getClaim(S,'${c.id}').boq['${b.code}']=Math.max(0,Number(this.value)||0);render()">` : q}</td><td class="num"><b>${money(round2(q * b.rate))}</b></td><td class="muted">No Notes Added.</td></tr>`; });
  return h + `</tbody></table></div>`;
}
function claimVariations(c, open) {
  const vl = claimVarRows(S, c); const offered = open ? offeredVariations(S) : [];
  let h = `<div class="muted" style="margin-bottom:6px">Variations are claimed by percent complete to date. Each claim charges the change since the last approved claim; a lower percent is charged as a credit. Daywork dockets reach a claim only through their approved variation, here. Their status does not change; mark them Invoiced by hand.</div>`;
  h += `<div class="tw card"><table><thead><tr><th>Ref</th><th>Description</th><th>Dockets</th><th class="num">Total Sum</th><th class="num">Previous %</th><th class="num">Previous Amt</th><th class="num">Current % to date</th><th class="num">Claim Amount</th><th>Action</th></tr></thead><tbody>`;
  vl.forEach(l => h += `<tr><td><a onclick="goRecord('variation','${l.variation}')"><b>${l.variation}</b></a></td><td>${esc(l.title)}</td><td class="small">${l.dockets.join(', ') || '-'}</td><td class="num">${money(l.approved)}</td><td class="num">${l.prev}%</td><td class="num">${money(round2(l.approved * l.prev / 100))}</td>
    <td class="num">${open ? `<input class="cell" type="number" min="0" max="100" value="${l.pct}" onchange="act(()=>setVarPct(S,'${c.id}','${l.variation}',Number(this.value)),'${l.variation} percent updated')">%` : l.pct + '%'}</td><td class="num"><b>${money(l.value)}</b>${l.credit ? ' <span class="tag t-chg">credit</span>' : ''}</td>
    <td>${open ? `<button class="btn icon" title="Remove from this claim" onclick="act(()=>removeVarFromClaim(S,'${c.id}','${l.variation}'),'${l.variation} removed')"><i class="fas fa-xmark"></i></button>` : ''}</td></tr>`);
  if (!vl.length) h += `<tr><td colspan="9" class="muted">No variations on this claim.</td></tr>`;
  h += `</tbody></table></div>`;
  if (open && offered.length) h += `<div class="field" style="max-width:420px;margin-top:8px"><label>Add an approved variation</label><select onchange="if(this.value)act(()=>addVarToClaim(S,'${c.id}',this.value),this.value+' added at 100%')"><option value="">Choose...</option>${offered.map(v => `<option value="${v.id}">${v.id} ${esc(v.title)} (${money(v.approvedAmount)}, ${varClaimedPct(S, v.id)}% claimed)${varFullyClaimed(S, v.id) ? ': fully claimed, lower the percent to credit it back' : ''}</option>`).join('')}</select></div>`;
  return h;
}
function claimDayworks(c, open) {
  let h = `<div class="ban info"><i class="fas fa-file-lines"></i><div>One line per daywork docket at its full Dayworks Calculator value, ex GST, no cost-plus margin. Lines follow their dockets until the claim is approved; on approval they freeze and the dockets move to Invoiced.</div></div>`;
  h += `<div class="tw card"><table><thead><tr><th>Ref</th><th>Docket</th><th>Performed on</th><th>Docket status</th><th>Description</th><th class="num">Docket value now</th><th class="num">Claim Amount</th><th>Flags</th><th>Action</th></tr></thead><tbody>`;
  c.lines.forEach((ln, k) => {
    const d = getDocket(S, ln.docket); const frozen = ln.frozen !== null; const val = claimLineValue(S, c, ln); const dv = frozen ? val : priceDocket(S, d).total; const issue = !frozen && open && docketIssue(S, d);
    const per = d.date < c.period.from ? ' <span class="tag t-chg">before period</span>' : d.date > c.period.to ? ' <span class="tag t-lock">after period</span>' : '';
    h += `<tr class="${issue ? 'block' : !frozen && open && !SIGNED.includes(d.status) ? 'warn' : ''}"><td>DW.${k + 1}</td><td><a onclick="openDocket('${d.id}')"><b>${d.id}</b></a></td><td class="small">${fmtDate(d.date)}${per}</td><td>${pill(d.status)}</td><td class="small">${esc(d.desc)}</td><td class="num">${money(dv)}</td><td class="num"><b>${money(val)}</b>${frozen ? ' <i class="fas fa-lock muted"></i>' : ''}</td><td>${changedCell(claimLineChanged(S, c, ln), ln.added, val, 'approval')}${frozen ? '' : lineFlags(d, open)}</td>
      <td>${open && !frozen ? `<button class="btn icon" title="Remove and release" onclick="act(()=>claimRemoveDocket(S,'${c.id}','${d.id}'),'${d.id} removed and released')"><i class="fas fa-xmark"></i></button>` : ''}</td></tr>`;
  });
  if (!c.lines.length) h += `<tr><td colspan="9" class="muted">No dockets on this claim yet.</td></tr>`;
  h += `<tr class="tot"><td colspan="6">Dayworks total (ex GST)</td><td class="num">${money(claimTotals(S, c).dockets)}</td><td colspan="2"></td></tr></tbody></table></div>`;
  if (!open) return h;
  // Inline picker
  const rows = pickerRows(S, 'claim', c.period);
  if (!CL.ticks) CL.ticks = new Set(rows.filter(r => r.preTick).map(r => r.d.id));
  const sel = rows.filter(r => CL.ticks.has(r.d.id)); const unap = sel.filter(r => !SIGNED.includes(r.d.status)).length;
  h += `<h2>Add dockets <span class="muted" style="font-weight:400">dockets dated in the claim period are pre-ticked; older and later ones are listed unticked; Draft, Rejected, unmapped and overlapping dockets cannot be added; dockets on a variation are claimed on the Variation tab</span></h2>`;
  h += `<div class="tw card"><table><thead><tr><th></th><th>Performed on</th><th>Docket</th><th>Status</th><th>Description</th><th class="num">Calculator value</th><th>Note</th></tr></thead><tbody>`;
  rows.forEach(r => { const per = r.inPeriod ? '<span class="tag t-ver">in period</span>' : r.older ? '<span class="tag t-chg">before period</span>' : '<span class="tag t-lock">after period</span>'; h += `<tr class="${r.highlight || ''}"><td><input type="checkbox" ${r.tickable ? '' : 'disabled'} ${CL.ticks.has(r.d.id) ? 'checked' : ''} onchange="this.checked?CL.ticks.add('${r.d.id}'):CL.ticks.delete('${r.d.id}');render()"></td><td class="small">${fmtDate(r.d.date)} ${per}</td><td><a onclick="openDocket('${r.d.id}')">${r.d.id}</a></td><td>${pill(r.d.status)}</td><td class="small">${esc(r.d.desc)}</td><td class="num">${money(r.value)}</td><td class="small">${r.block ? '<b>' + esc(r.block) + '</b>' : r.highlight === 'warn' ? 'Not yet approved' : ''}</td></tr>`; });
  if (!rows.length) h += `<tr><td colspan="7" class="muted">No dockets available.</td></tr>`;
  h += `</tbody></table></div><div class="actions"><span class="muted" style="margin-right:auto">${plural(sel.length, 'docket')} ticked · ${money(round2(sel.reduce((a, r) => a + r.value, 0)))}${unap ? ` · <b style="color:#92400e">${unap} not yet approved</b>` : ''}</span><button class="btn or" ${sel.length ? '' : 'disabled'} onclick="const ids=[...CL.ticks];if(act(()=>claimAddDockets(S,'${c.id}',ids),plural(ids.length,'docket')+' added')!==null){CL.ticks=null;render();}">Add ticked dockets</button></div>`;
  return h;
}
function claimRetention(c, t) {
  return `<div class="tw card"><table><thead><tr><th>This Claim</th><th class="num">Claim Amount</th><th class="num">Retention Rate</th><th class="num">Retention Held</th></tr></thead><tbody>
    <tr><td>Contract Works</td><td class="num">${money(t.boq)}</td><td class="num">${S.project.retention}%</td><td class="num">${money(round2(t.boq * S.project.retention / 100))}</td></tr>
    <tr><td>Variations</td><td class="num">${money(t.vars)}</td><td class="num">${S.project.retention}%</td><td class="num">${money(round2(t.vars * S.project.retention / 100))}</td></tr>
    <tr class="tot"><td>Total</td><td class="num">${money(t.gross)}</td><td></td><td class="num">${money(t.retention)}</td></tr></tbody></table></div>
    <div class="muted" style="margin-top:6px">Retention follows Varicon's existing retention rules (project rate ${S.project.retention}%); ${t.retention < 0 ? 'Negative retention on a negative claim shows as retention returned.' : ''} GST ${S.project.gst}% on the net: ${money(t.gst)}.</div>`;
}
function doApproveClaim(id) {
  const r = act(() => approveClaim(S, id), null);
  if (r && r.needsConfirm) confirmDialog('Approve Claim # ' + id + '?', `<b>${r.message}.</b> The claim can still be approved; your decision is recorded.`, 'Approve anyway', () => { const x = act(() => approveClaim(S, id, { confirm: true }), 'Claim ' + id + ' approved'); if (x && x.invoiced && x.invoiced.length) toast('Claim ' + id + ' approved; ' + x.invoiced.join(', ') + ' moved to Invoiced'); });
  else if (r) toast('Claim ' + id + ' approved' + (r.invoiced.length ? '; ' + r.invoiced.join(', ') + ' moved to Invoiced' : ''));
}

/* ───────── Prototype drawer: simulation, change log, scenarios, rates ───────── */
function toggleDrawer() { DRAWER.open = !DRAWER.open; renderDrawer(); }
function renderDrawer() {
  const el = document.getElementById('drawer'); el.className = 'drawer' + (DRAWER.open ? ' open' : '');
  if (!DRAWER.open) { el.innerHTML = ''; return; }
  const n = SCEN.filter(r => r.pass).length;
  let h = `<div class="dh"><b><i class="fas fa-flask"></i> Prototype controls</b><button class="btn alt sm" onclick="toggleDrawer()"><i class="fas fa-xmark"></i></button></div>
    <div style="padding:8px 16px;font-size:11.5px;color:#94a3b8">Not part of the product. For moving time and rates to watch the rules work.</div>
    <div class="dtabs">${[['sim', 'Simulation'], ['log', 'Change log'], ['scen', 'Scenarios ' + n + '/' + SCEN.length], ['rates', 'Calculator rates']].map(([k, l]) => `<div class="dtab ${DRAWER.tab === k ? 'active' : ''}" onclick="DRAWER.tab='${k}';renderDrawer()">${l}</div>`).join('')}</div><div class="db">`;
  if (DRAWER.tab === 'sim') {
    if (!SIM.eff) SIM.eff = S.today;
    const cur = S.versions.slice().sort((a, b) => b.n - a.n)[0];
    const opts = Object.keys(RATE_SECTIONS).flatMap(sec => cur[sec].map(l => ({ sec, name: l.name, std: l.r.std })));
    h += `<div class="field"><label>Today</label><input type="date" value="${S.today}" onchange="S.today=this.value;SIM.eff=this.value;render()"></div>
      <div class="field"><label>Publish calculator change: rate line</label><select onchange="const [s,n]=this.value.split('|');SIM.section=s;SIM.line=n">${opts.map(o => `<option value="${o.sec}|${esc(o.name)}" ${o.sec === SIM.section && o.name === SIM.line ? 'selected' : ''}>${RATE_SECTIONS[o.sec]}: ${esc(o.name)} (${money(o.std)})</option>`).join('')}</select></div>
      <div class="frow"><div class="field"><label>New Standard $</label><input type="number" step="0.5" value="${SIM.std}" onchange="SIM.std=Number(this.value)"></div><div class="field"><label>Effective from</label><input type="date" value="${SIM.eff}" onchange="SIM.eff=this.value"></div></div>
      <div class="row" style="margin-top:10px"><button class="btn" onclick="doPublish()"><i class="fas fa-upload"></i> Publish version</button><button class="btn alt" onclick="doLateDocket()"><i class="fas fa-truck"></i> Late docket arrives</button><button class="btn alt" onclick="if(confirm('Reset the demo project?')){S=seedState();DW={status:'ALL',sel:new Set(),open:null};VR.open=null;CL.open=null;SIM.eff=null;closeModal();render();}"><i class="fas fa-rotate-left"></i> Reset demo</button></div>
      <p style="margin-top:10px;font-size:12px;color:#94a3b8">Effective date must be on or after ${fmtDate(calcFloor(S))} (the later of the last approved claim and last approved variation). ${RELEASE === 'lean' ? 'Try Leading Hand $75 from 05/11/2026: the calculator moves D209 and D208, but lines on V010 and V008 stay put until you press Refresh from dockets.' : 'Try Leading Hand $75 from 05/11/2026 to move D209 on V010 (submitted: revision prompted) and D208 on V008.'}</p>
      <div style="margin-top:10px;font-size:12px">${S.versions.slice().sort((a, b) => a.n - b.n).map(v => `<div>Calculator v${v.n} from ${fmtDate(v.effectiveFrom)}${v.n > 1 ? ': ' + esc(v.note) : ''}</div>`).join('')}</div>`;
  } else if (DRAWER.tab === 'log') {
    h += `<div class="log">${S.log.slice(0, 80).map(e => `<div class="${e.kind}">${fmtDate(e.at)} · ${esc(e.what)}</div>`).join('')}</div>`;
  } else if (DRAWER.tab === 'scen') {
    h += `<div class="row" style="margin-bottom:8px"><span style="flex:1;font-size:12px">The rules of this release, each on a fresh project through the same engine as the screens.</span><button class="btn sm" onclick="SCEN=runScenarios();render();toast('Scenarios re-run')">Re-run</button></div>`;
    SCEN.forEach(r => { h += `<div class="scen ${r.pass ? '' : 'open'}" id="sc${r.i}"><div class="h" onclick="document.getElementById('sc${r.i}').classList.toggle('open')"><span class="${r.pass ? 'pass' : 'fail'}">${r.pass ? 'PASS' : 'FAIL'}</span><span class="tag t-ver">${r.s.story}</span><span style="flex:1">${esc(r.s.title)}</span></div><div class="b"><p style="margin-bottom:6px">${esc(r.s.text)}</p>${r.error ? `<div class="fail">Error: ${esc(r.error)}</div>` : ''}<table><tbody>${r.checks.map(c => `<tr><td class="${c.pass ? 'pass' : 'fail'}">${c.pass ? '✓' : '✗'}</td><td>${esc(c.label)}</td><td>${esc(c.actual)}</td></tr>`).join('')}</tbody></table>${r.state ? `<button class="btn sm" style="margin-top:6px" onclick="loadScenario(${r.i})">Load this end state into the screens</button>` : ''}</div></div>`; });
  } else {
    const v = S.versions.slice().sort((a, b) => b.n - a.n)[0];
    h += `<p style="font-size:12px;margin-bottom:8px">Latest version v${v.n}, effective ${fmtDate(v.effectiveFrom)}. Editing is the calculator prototype (a later build).</p><table><tbody>${['labour', 'wet', 'attach'].flatMap(sec => v[sec].map(l => `<tr><td>${RATE_SECTIONS[sec]}</td><td>${esc(l.name)}</td><td>${money(l.r.std)} std</td></tr>`)).join('')}${v.dry.map(l => `<tr><td>Dry hire</td><td>${esc(l.name)}</td><td>${money(l.r.std)}/${l.unit}</td></tr>`).join('')}${v.float.map(f => `<tr><td>Float</td><td>${esc(f.name)}</td><td>mob ${money(f.mob)} · demob ${money(f.demob)}</td></tr>`).join('')}${v.allow.map(a => `<tr><td>Allowance</td><td>${esc(a.name)}</td><td>${money(a.amount)}/${a.unit}</td></tr>`).join('')}</tbody></table><p style="display:none"><b>Internal COST rates</b> (what the work costs us, as in Daily Cost Tracking; used for Estimated Cost, never charged)</p><table style="display:none"><tbody>${Object.entries(S.project.cost.labour).map(([k, x]) => `<tr><td>Labour cost</td><td>${k}</td><td>${money(x)}/h</td></tr>`).join('')}${Object.entries(S.project.cost.plant).map(([k, x]) => `<tr><td>Plant cost</td><td>${k}</td><td>${money(x)}/h plus operator</td></tr>`).join('')}${Object.entries(S.project.cost.attach).map(([k, x]) => `<tr><td>Attachment cost</td><td>${k}</td><td>${money(x)}/h</td></tr>`).join('')}<tr><td>Float cost</td><td>per move</td><td>${money(S.project.cost.float)}</td></tr>${Object.entries(S.project.cost.material).map(([k, x]) => `<tr><td>Material cost</td><td>${k}</td><td>${money(x)}/unit</td></tr>`).join('')}<tr><td>Other materials, subcontract</td><td></td><td>at cost</td></tr></tbody></table>`;
  }
  el.innerHTML = h + `</div>`;
}
function doPublish() {
  const lockedBefore = lockedSnapshot();
  const v = act(() => publishVersion(S, SIM.section, SIM.line, SIM.std, SIM.eff), 'Calculator version published'); if (!v) return;
  const lockedAfter = lockedSnapshot(); const same = Object.keys(lockedBefore).every(k => lockedBefore[k] === lockedAfter[k]);
  log(S, Object.keys(lockedBefore).length + ' locked records (approved variations, approved claims) checked: ' + (same ? 'all unchanged' : 'SOMETHING MOVED'), 'lock'); render();
}
function lockedSnapshot() { const m = {}; approvedVars(S).forEach(v => m[v.id] = v.approvedAmount + '|' + v.lines.map(l => l.frozen).join(',')); approvedClaims(S).forEach(c => m['C' + c.id] = JSON.stringify(claimTotals(S, c))); return m; }
function doLateDocket() {
  const n = S.dockets.reduce((m, d) => Math.max(m, /^D1\d\d$/.test(d.id) ? parseInt(d.id.slice(1), 10) : 0), 107) + 1; const id = 'D' + n;
  act(() => { addDocket(S, id, '2026-11-14', 'Submitted', [lab('jo', '07:00', '15:00')], { desc: 'Late docket from the field' }); log(S, id + ' (dated 14/11) arrived late from the field'); }, id + ' arrived, dated 14/11/2026');
}
function loadScenario(i) {
  S = SCEN[i].state; DW = { status: 'ALL', sel: new Set(), open: null }; VR.open = null; CL.open = null; SIM.eff = null;
  log(S, 'Loaded scenario end state: ' + SCEN[i].s.title); SCEN = null; DRAWER.open = false; go('daywork'); toast('Scenario loaded. Reset demo (Prototype drawer) to return to the full project.');
}

render();
