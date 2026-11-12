/* Dayworks billing prototype: UI. All state changes go through engine.js actions via act(). */
let S = seedState();
let TAB = 'dockets';
let SEL_VAR = 'V-016';
let SEL_CLAIM = null;
let DK_FILTER = 'all';
let MODAL = null;          // function that re-renders the open modal
let DK_FORM = null;        // 'sendback' | 'nc' | null inside the docket modal
let PK = null;             // picker state
let SCEN = null;
let SIM = { section: 'labour', line: 'Leading Hand', std: 75, eff: null };

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function pill(status) { return `<span class="pill s-${status === 'Not claimable' ? 'NC' : status}">${status}</span>`; }
function toast(m, isErr) { const t = document.getElementById('toast'); t.textContent = m; t.className = 'toast' + (isErr ? ' err' : ''); t.style.display = 'block'; clearTimeout(t._h); t._h = setTimeout(() => t.style.display = 'none', 4200); }
function openModal(fn, wide) { MODAL = fn; const m = document.getElementById('modal'); m.className = 'modal' + (wide ? ' wide' : ''); m.innerHTML = fn(); document.getElementById('modalBg').classList.add('open'); }
function closeModal() { MODAL = null; DK_FORM = null; PK = null; document.getElementById('modalBg').classList.remove('open'); }
function refreshModal() { if (MODAL) document.getElementById('modal').innerHTML = MODAL(); }

/* Value snapshot so every change to a live line or submitted amount is written to the change feed. */
function snap(st) {
  const m = {};
  st.variations.forEach(v => {
    if (!ACTIVE_VAR.includes(v.status)) return;
    v.lines.forEach(ln => m[v.id + ' line ' + ln.docket] = varLineValue(st, v, ln));
    if (v.status !== 'Draft') m[v.id + ' submitted amount'] = varSubmittedAmount(st, v);
  });
  st.claims.forEach(c => { if (ACTIVE_CLAIM.includes(c.status)) c.lines.forEach(ln => m[c.id + ' line ' + ln.docket] = claimLineValue(st, c, ln)); });
  return m;
}
function act(fn, okMsg) {
  const before = snap(S);
  let r;
  try { r = fn(); } catch (e) { toast(e.message, true); return null; }
  const after = snap(S);
  const moved = [], held = [];
  Object.keys(after).forEach(k => {
    if (!(k in before)) return;
    if (Math.abs((after[k] || 0) - (before[k] || 0)) > 0.004) { moved.push(k); log(S, k + ': ' + money(before[k]) + ' to ' + money(after[k]) + ' (flagged until ' + (k.startsWith('C-') ? 'issue' : 'approval') + ')', 'change'); }
  });
  if (okMsg) toast(okMsg + (moved.length ? ' · ' + plural(moved.length, 'live value') + ' moved' : ''));
  render();
  return r;
}

/* ───────── Layout ───────── */
function showTab(t) { TAB = t; render(); window.scrollTo(0, 0); }
function render() {
  document.querySelectorAll('.tab').forEach(x => x.classList.toggle('active', x.dataset.tab === TAB));
  document.querySelectorAll('[data-nav]').forEach(x => x.classList.toggle('active', x.dataset.nav === TAB));
  const last = lastIssuedClaimDate(S);
  document.getElementById('crumbInfo').textContent = 'NSW · contract sum ' + money(contractSum(S)) + (last ? ' · last issued claim ' + fmtDate(last) : '');
  renderSim();
  const v = document.getElementById('view');
  v.innerHTML = TAB === 'dockets' ? viewDockets() : TAB === 'variations' ? viewVariations() : TAB === 'claims' ? viewClaims() : TAB === 'calc' ? viewCalc() : viewScenarios();
  refreshModal();
  if (!SCEN) SCEN = runScenarios();
  const n = SCEN.filter(r => r.pass).length;
  document.getElementById('scenBadge').innerHTML = `<span class="pill ${n === SCEN.length ? 'ok' : 'bad'}">${n}/${SCEN.length}</span>`;
}

/* ───────── Simulation panel ───────── */
function rateLineOptions() {
  const v = S.versions.slice().sort((a, b) => b.n - a.n)[0];
  return Object.keys(RATE_SECTIONS).flatMap(sec => v[sec].map(l => ({ sec, name: l.name, std: l.r.std })));
}
function renderSim() {
  if (!SIM.eff) SIM.eff = S.today;
  const opts = rateLineOptions();
  const cur = opts.find(o => o.sec === SIM.section && o.name === SIM.line) || opts[0];
  const entries = S.log.slice(0, 40);
  document.getElementById('sim').innerHTML = `<div class="sim">
    <h2><i class="fas fa-flask"></i> Simulation controls <span class="muted" style="color:rgba(255,255,255,.5);font-weight:400">not part of the product; for seeing the rules move live</span></h2>
    <div class="form-row">
      <div class="field" style="max-width:150px"><label>Today</label><input type="date" value="${S.today}" onchange="S.today=this.value;SIM.eff=this.value;render()"></div>
      <div class="field" style="min-width:230px"><label>Publish calculator change: rate line</label><select onchange="const [s,n]=this.value.split('|');SIM.section=s;SIM.line=n;render()">${opts.map(o => `<option value="${o.sec}|${esc(o.name)}" ${o === cur ? 'selected' : ''}>${RATE_SECTIONS[o.sec]}: ${esc(o.name)} (${money(o.std)})</option>`).join('')}</select></div>
      <div class="field" style="max-width:110px"><label>New Standard $</label><input type="number" step="0.5" value="${SIM.std}" onchange="SIM.std=Number(this.value)"></div>
      <div class="field" style="max-width:150px"><label>Effective from</label><input type="date" value="${SIM.eff}" onchange="SIM.eff=this.value"></div>
      <button class="btn" onclick="doPublish()"><i class="fas fa-upload"></i> Publish version</button>
      <button class="btn alt" onclick="doLateDocket()"><i class="fas fa-truck"></i> Late docket arrives</button>
      <button class="btn alt" onclick="if(confirm('Reset the demo project?')){S=seedState();SEL_VAR='V-016';SEL_CLAIM=null;SIM.eff=null;closeModal();render();}"><i class="fas fa-rotate-left"></i> Reset demo</button>
    </div>
    <div class="vers">${S.versions.slice().sort((a, b) => a.n - b.n).map(v => `<span>Calculator v${v.n} from ${fmtDate(v.effectiveFrom)}${v.n > 1 ? ': ' + esc(v.note) : ''}</span>`).join('')}</div>
    <div class="muted" style="color:rgba(255,255,255,.55);margin-top:8px">Edit a docket's hours from the docket itself (Dockets tab, Open). Every live line or submitted amount that moves is listed below in amber.</div>
    <div class="log">${entries.map(e => `<div class="${e.kind}">${fmtDate(e.at)} · ${esc(e.what)}</div>`).join('')}</div>
  </div>`;
}
function doPublish() {
  const lockedBefore = lockedSnapshot();
  const v = act(() => publishVersion(S, SIM.section, SIM.line, SIM.std, SIM.eff), 'Calculator version published');
  if (!v) return;
  const lockedAfter = lockedSnapshot();
  const same = Object.keys(lockedBefore).every(k => lockedBefore[k] === lockedAfter[k]);
  log(S, Object.keys(lockedBefore).length + ' locked records (approved variations, issued claims) checked: ' + (same ? 'all unchanged' : 'SOMETHING MOVED'), 'lock');
  render();
}
function lockedSnapshot() {
  const m = {};
  S.variations.filter(v => v.status === 'Approved').forEach(v => m[v.id] = v.approvedAmount + '|' + v.lines.map(l => l.frozen).join(','));
  S.claims.filter(c => c.status === 'Issued').forEach(c => m[c.id] = JSON.stringify(claimTotals(S, c)));
  return m;
}
function doLateDocket() {
  const n = S.dockets.reduce((m, d) => Math.max(m, /^D1\d\d$/.test(d.id) ? parseInt(d.id.slice(1), 10) : 0), 107) + 1;
  const id = 'D' + n;
  act(() => { addDocket(S, id, '2026-11-14', 'Submitted', [lab('jo', '07:00', '15:00')], { note: 'Arrived late from the field' }); log(S, id + ' (dated 14/11) arrived late from the field'); }, id + ' arrived, dated 14/11/2026');
}

/* ───────── Dockets ───────── */
function onMarker(id) {
  const h = docketHome(S, id); if (!h) return '';
  const lock = isLocked(S, id) ? ' <i class="fas fa-lock"></i>' : '';
  return `<span class="pill on" onclick="event.stopPropagation();goRecord('${h.kind}','${h.rec.id}')">On ${h.kind} ${h.rec.id}${lock}</span>`;
}
function goRecord(kind, id) { closeModal(); if (kind === 'variation') { SEL_VAR = id; showTab('variations'); } else { SEL_CLAIM = id; showTab('claims'); } }
function viewDockets() {
  const all = S.dockets.slice().sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  const list = all.filter(d => DK_FILTER === 'all' ? true : DK_FILTER === 'open' ? d.status !== 'Not claimable' : d.status === 'Not claimable');
  const closed = all.filter(d => d.status === 'Not claimable').length;
  const free = all.filter(d => d.status !== 'Not claimable' && !docketHome(S, d.id)).length;
  let h = `<div class="hdr"><div><h1>Daywork dockets</h1><div class="sub">${all.length} dockets · ${free} not yet on a variation or claim · closed (Not claimable) ${closed}</div></div>
    <div class="btns"><select class="cell" onchange="DK_FILTER=this.value;render()"><option value="all" ${DK_FILTER === 'all' ? 'selected' : ''}>All statuses</option><option value="open" ${DK_FILTER === 'open' ? 'selected' : ''}>Open (excludes Not claimable)</option><option value="nc" ${DK_FILTER === 'nc' ? 'selected' : ''}>Not claimable</option></select>
    <button class="btn" onclick="openPicker('variation')"><i class="fas fa-file-circle-plus"></i> Add dockets to variation</button>
    <button class="btn primary" onclick="openPicker('claim')"><i class="fas fa-file-invoice-dollar"></i> Create claim from dockets</button></div></div>`;
  h += `<div class="card tbl-wrap" style="padding:6px 6px"><table><thead><tr><th>Date</th><th>Docket</th><th>Status</th><th>Resources</th><th class="num">Calculator value</th><th>Approval check</th><th>Billing</th><th></th></tr></thead><tbody>`;
  list.forEach(d => {
    const p = priceDocket(S, d);
    const locked = isLocked(S, d.id);
    const val = docketValue(S, d.id);
    const live = p.total;
    h += `<tr class="clickable" onclick="openDocket('${d.id}')"><td class="small">${dayName(d.date)} ${fmtDate(d.date)}</td><td><b>${d.id}</b></td>
      <td>${pill(d.status)} ${d.sentBack ? `<span class="pill sent" title="${esc(d.sentBack.note)}">Sent back: ${esc(d.sentBack.reason)}</span>` : ''}</td>
      <td class="small">${esc(docketSummary(d))}</td>
      <td class="num">${money(val)} <span class="pill ver">v${locked ? lockedVersion(d) : p.version.n}</span>${locked && Math.abs(live - val) > 0.004 ? `<div class="muted">live calc ${money(live)}, not applied</div>` : ''}</td>
      <td>${p.problems.length ? p.problems.map(x => `<span class="pill bad">${esc(x)}</span>`).join(' ') : '<span class="pill ok">OK</span>'}</td>
      <td>${onMarker(d.id)}</td><td><button class="btn sm">Open</button></td></tr>`;
  });
  h += `</tbody></table></div>`;
  h += `<div class="muted">Calculator value is the docket's full Dayworks Calculator price (ex GST), from the version in effect on the docket date. A docket on an approved variation or issued claim shows its frozen value and a lock.</div>`;
  return h;
}
function lockedVersion(d) { const h = docketHome(S, d.id); return h && h.line.frozenVersion ? h.line.frozenVersion : versionAt(d); }
function versionAt(d) { const v = versionFor(S, d.date); return v ? v.n : '-'; }

function openDocket(id) { DK_FORM = null; openModal(() => docketModal(id), true); }
function docketModal(id) {
  const d = getDocket(S, id);
  const p = priceDocket(S, d);
  const h0 = docketHome(S, id);
  const locked = isLocked(S, id);
  const editable = !locked;
  let h = `<div class="hdr" style="margin-bottom:8px"><div><h3 style="margin:0">Docket ${d.id} · ${dayName(d.date)} ${fmtDate(d.date)}</h3><div class="sub">Raised by ${esc(d.createdBy)} · priced by calculator v${p.version ? p.version.n : '-'}</div></div><div class="btns">${pill(d.status)} ${onMarker(id)} <button class="btn ghost" onclick="closeModal()"><i class="fas fa-xmark"></i></button></div></div>`;
  if (locked) h += `<div class="banner dark"><i class="fas fa-lock"></i><div><b>Read-only.</b> This docket is on ${h0.kind === 'variation' ? 'approved variation' : 'issued claim'} ${h0.rec.id}. Its value is frozen at ${money(h0.line.frozen)} and is never repriced${Math.abs(p.total - h0.line.frozen) > 0.004 ? ` (the live calculator would now say ${money(p.total)})` : ''}.</div></div>`;
  else if (h0) h += `<div class="banner info"><i class="fas fa-link"></i><div>On ${h0.label} (${h0.rec.status.toLowerCase()}). Edits flow through to its line until the ${h0.kind === 'variation' ? 'variation is approved' : 'claim is issued'}. Send back and Not claimable are refused until it is removed.</div></div>`;
  if (d.sentBack) h += `<div class="banner warn"><i class="fas fa-reply"></i><div><b>Sent back: ${esc(d.sentBack.reason)}</b>${d.sentBack.note ? ' · ' + esc(d.sentBack.note) : ''}<div class="muted">by ${esc(d.sentBack.by)} on ${fmtDate(d.sentBack.at)} · stays until ${esc(d.createdBy)} resubmits</div></div></div>`;
  if (d.status === 'Not claimable') h += `<div class="banner dark"><i class="fas fa-ban"></i><div><b>Not claimable</b>${d.nc.note ? ' · ' + esc(d.nc.note) : ''}<div class="muted">set by ${esc(d.nc.by)} on ${fmtDate(d.nc.at)} · was ${d.prevStatus} · never offered to a variation or claim</div></div></div>`;
  if (p.problems.length) h += `<div class="banner err"><i class="fas fa-triangle-exclamation"></i><div><b>Cannot be approved:</b> ${p.problems.map(esc).join(' · ')}. It cannot go on a variation or claim until fixed.${editable ? ' Remove the line or allowance below to fix it.' : ''}</div></div>`;
  h += `<div class="tbl-wrap"><table><thead><tr><th>#</th><th>Line</th><th>Rate line</th><th class="num">Hours</th><th>Split</th><th class="num">Value</th><th></th></tr></thead><tbody>`;
  p.lines.forEach((r, i) => {
    const l = r.l; const timed = ['labour', 'wet', 'dry'].includes(l.t);
    const hrs = timed ? (editable ? `<input class="cell" type="number" step="0.25" value="${fmtH(r.hours)}" onchange="act(()=>editHours(S,'${id}',${i},Number(this.value)),'${id} hours updated')">` : fmtH(r.hours) + 'h') : '';
    const split = r.rows.map(x => x.tier === 'unit' ? `${x.hours} x ${money(x.rate)}` : x.tier === 'costplus' ? `cost ${money(l.cost)} + ${r.rateLine.margin}% (calculator line)` : x.tier === 'flat' ? (l.t === 'float' ? 'flat' : `${fmtH(x.hours)}h x ${money(x.rate)} flat`) : x.tier === 'day' ? `1 day x ${money(x.rate)}` : `${fmtH(x.hours)}h ${TIER_LABEL[x.tier]} x ${money(x.rate)}`).join(' + ');
    const extras = r.extras.map(x => `<div class="small">${x.value === 0 && /Unmapped/.test(x.note) ? '<span class="pill bad">Unmapped</span> ' : '+ '}${esc(x.label)} ${money(x.value)} <span class="muted">${esc(x.note)}</span>${editable && /Unmapped/.test(x.note) && (l.allow || []).some(a => allowName(a.type) === x.label) ? ` <a onclick="act(()=>removeAllowance(S,'${id}',${i},'${esc((l.allow.find(a => allowName(a.type) === x.label) || {}).type)}'),'Allowance removed')">remove</a>` : ''}</div>`).join('');
    h += `<tr${r.overlap || r.unmapped.length ? ' class="hl-block"' : ''}><td>${i + 1}</td><td>${esc(r.label)}${r.overlap ? ' <span class="pill bad">overlap</span>' : ''}${l.t === 'wet' ? '<div class="muted">operator included in the wet rate</div>' : ''}</td>
      <td class="small">${r.rateLine ? esc(r.rateLine.name) : (l.t === 'float' ? '<span class="muted">no float line</span>' : '<span class="pill bad">Unmapped</span>')}</td>
      <td class="num">${hrs}</td><td class="small">${split}${extras}</td><td class="num"><b>${money(r.value)}</b></td>
      <td>${editable ? `<button class="btn ghost" title="Remove line" onclick="act(()=>removeDocketLine(S,'${id}',${i}),'Line removed')"><i class="fas fa-trash"></i></button>` : ''}</td></tr>`;
  });
  h += `<tr class="total"><td></td><td colspan="4">Docket total (ex GST, calculator value, no margin)</td><td class="num">${money(locked ? h0.line.frozen : p.total)}</td><td></td></tr></tbody></table></div>`;
  // actions
  const b = [];
  if (!locked) {
    if (d.status === 'Draft') b.push(`<button class="btn" onclick="act(()=>submitDocket(S,'${id}'),'${id} ${d.sentBack ? 're' : ''}submitted')">${d.sentBack ? 'Resubmit' : 'Submit'}</button>`);
    if (d.status === 'Rejected') b.push(`<button class="btn" onclick="act(()=>submitDocket(S,'${id}'),'${id} resubmitted')">Fix and resubmit</button>`);
    if (d.status === 'Submitted') {
      b.push(`<button class="btn primary" onclick="act(()=>approveDocket(S,'${id}'),'${id} approved')">Approve</button>`);
      b.push(`<button class="btn" onclick="DK_FORM='sendback';refreshModal()"><i class="fas fa-reply"></i> Send back</button>`);
      b.push(`<button class="btn danger" onclick="act(()=>rejectDocket(S,'${id}'),'${id} rejected')" title="Simulates the client rejecting it by email">Client rejects</button>`);
    }
    if (['Draft', 'Submitted', 'Approved'].includes(d.status)) b.push(`<button class="btn" onclick="DK_FORM='nc';refreshModal()"><i class="fas fa-ban"></i> Mark as not claimable</button>`);
    if (d.status === 'Not claimable') b.push(`<button class="btn" onclick="act(()=>reopenDocket(S,'${id}'),'${id} reopened')">Reopen</button>`);
  }
  if (h0 && !locked) b.push(`<button class="btn" onclick="goRecord('${h0.kind}','${h0.rec.id}')">Open ${h0.rec.id}</button>`);
  h += `<div class="actions" style="justify-content:flex-start">${b.join('')}</div>`;
  if (DK_FORM === 'sendback') h += `<div class="card" style="margin-top:12px;background:#f8fafc"><h2>Send back to ${esc(d.createdBy)}</h2>
    <div class="form-row"><div class="field"><label>Reason</label><select id="sbReason">${['More photos', 'Missing info', 'Wrong quantities', 'Wrong project', 'Other'].map(r => `<option>${r}</option>`).join('')}</select></div>
    <div class="field" style="flex:2"><label>Note (optional)</label><input id="sbNote"></div>
    <button class="btn primary" onclick="if(act(()=>sendBack(S,'${id}',document.getElementById('sbReason').value,document.getElementById('sbNote').value),'${id} sent back')!==null)DK_FORM=null;refreshModal()">Send back</button><button class="btn" onclick="DK_FORM=null;refreshModal()">Cancel</button></div></div>`;
  if (DK_FORM === 'nc') h += `<div class="card" style="margin-top:12px;background:#f8fafc"><h2>Mark ${id} as not claimable</h2><div class="muted">Closes the docket out. It is never offered to a variation or claim. Reversible with Reopen.</div>
    <div class="form-row"><div class="field" style="flex:2"><label>Reason (optional)</label><input id="ncNote"></div>
    <button class="btn primary" onclick="if(act(()=>markNotClaimable(S,'${id}',document.getElementById('ncNote').value),'${id} marked Not claimable')!==null)DK_FORM=null;refreshModal()">Confirm</button><button class="btn" onclick="DK_FORM=null;refreshModal()">Cancel</button></div></div>`;
  h += `<h2 style="margin-top:16px">History</h2><div class="small">${d.history.slice().reverse().map(x => `<div>${fmtDate(x.at)} · ${esc(x.by)} · ${esc(x.what)}</div>`).join('')}</div>`;
  return h;
}

/* ───────── Picker ───────── */
function openPicker(mode, target) {
  const drafts = S.variations.filter(v => v.status === 'Draft');
  PK = { mode, target: target || (mode === 'variation' ? 'new' : 'new'), title: '', ticked: new Set(), period: null };
  if (mode === 'claim' && PK.target === 'new') PK.period = nextClaimPeriod(S);
  if (mode === 'claim' && PK.target !== 'new') PK.period = getClaim(S, PK.target).period;
  resetTicks();
  openModal(pickerModal, true);
}
function resetTicks() { PK.ticked = new Set(pickerRows(S, PK.mode, PK.period).filter(r => r.preTick).map(r => r.d.id)); }
function pickerModal() {
  const rows = pickerRows(S, PK.mode, PK.period);
  const isVar = PK.mode === 'variation';
  const drafts = S.variations.filter(v => v.status === 'Draft');
  let h = `<div class="hdr" style="margin-bottom:6px"><h3 style="margin:0">${isVar ? 'Add dockets to variation' : PK.target === 'new' ? 'Create claim from dockets' : 'Add dockets to ' + PK.target}</h3><button class="btn ghost" onclick="closeModal()"><i class="fas fa-xmark"></i></button></div>`;
  if (isVar) h += `<div class="form-row"><div class="field"><label>Add to</label><select onchange="PK.target=this.value;refreshModal()"><option value="new">New variation</option>${drafts.map(v => `<option value="${v.id}" ${PK.target === v.id ? 'selected' : ''}>${v.id} ${esc(v.title)} (unsubmitted)</option>`).join('')}</select></div>
    ${PK.target === 'new' ? `<div class="field" style="flex:2"><label>Variation title</label><input value="${esc(PK.title)}" placeholder="Dayworks ${fmtDate(S.today)}" oninput="PK.title=this.value"></div>` : ''}</div>
    <div class="muted">Submitted and approved variations cannot take more dockets, so they are not in this list.</div>`;
  else if (PK.target === 'new') h += `<div class="form-row"><div class="field"><label>Claim period from</label><input type="date" value="${PK.period.from}" onchange="PK.period.from=this.value;resetTicks();refreshModal()"></div><div class="field"><label>to</label><input type="date" value="${PK.period.to}" onchange="PK.period.to=this.value;resetTicks();refreshModal()"></div></div>
    <div class="muted">Dockets dated in the period are pre-ticked. Older unclaimed dockets are listed unticked. Dockets on a variation are never offered; approved variations come onto the claim as variation lines.</div>`;
  h += `<div class="legend"><span><i class="sw" style="background:#fff"></i>Approved</span><span><i class="sw" style="background:#fffbeb"></i>Draft or submitted: can be added, warned on ${isVar ? 'submit' : 'issue'}</span><span><i class="sw" style="background:#fef2f2"></i>Rejected, unmapped or overlap: cannot be added until fixed</span><span><i class="fas fa-eye-slash"></i> Not claimable and already-used dockets are hidden</span></div>`;
  h += `<div class="tbl-wrap"><table><thead><tr><th></th><th>Date</th><th>Docket</th><th>Status</th><th>Resources</th><th class="num">Calculator value</th><th>Note</th></tr></thead><tbody>`;
  if (!rows.length) h += `<tr><td colspan="7" class="muted">No dockets available.</td></tr>`;
  rows.forEach(r => {
    const note = r.block ? `<b>${esc(r.block)}</b>` : r.highlight === 'warn' ? 'Not yet approved' : '';
    const per = PK.period ? (r.inPeriod ? '<span class="pill ver">in period</span>' : r.older ? '<span class="pill chg">before period</span>' : '<span class="pill lock">after period</span>') : '';
    h += `<tr class="${r.highlight ? 'hl-' + r.highlight : ''}"><td><input type="checkbox" ${r.tickable ? '' : 'disabled'} ${PK.ticked.has(r.d.id) ? 'checked' : ''} onchange="this.checked?PK.ticked.add('${r.d.id}'):PK.ticked.delete('${r.d.id}');refreshModal()"></td>
      <td class="small">${dayName(r.d.date)} ${fmtDate(r.d.date)} ${per}</td><td><a onclick="openDocket('${r.d.id}')">${r.d.id}</a></td><td>${pill(r.d.status)}${r.d.sentBack ? ' <span class="pill sent">Sent back</span>' : ''}</td><td class="small">${esc(docketSummary(r.d))}</td><td class="num">${money(r.value)}</td><td class="small">${note}</td></tr>`;
  });
  const sel = rows.filter(r => PK.ticked.has(r.d.id));
  const unap = sel.filter(r => r.d.status !== 'Approved').length;
  h += `</tbody></table></div>
    <div class="actions" style="align-items:center"><span class="muted" style="margin-right:auto">${plural(sel.length, 'docket')} ticked · ${money(round2(sel.reduce((a, r) => a + r.value, 0)))} ex GST · one line per docket at its full calculator value, no margin${unap ? ` · <b style="color:#92400e">${unap} not yet approved</b>` : ''}</span>
    <button class="btn" onclick="closeModal()">Cancel</button><button class="btn primary" onclick="confirmPicker()">${isVar ? (PK.target === 'new' ? 'Create variation' : 'Add to ' + PK.target) : (PK.target === 'new' ? 'Create claim' : 'Add to ' + PK.target)}</button></div>`;
  return h;
}
function confirmPicker() {
  const ids = pickerRows(S, PK.mode, PK.period).filter(r => PK.ticked.has(r.d.id)).map(r => r.d.id);
  const pk = PK;
  if (pk.mode === 'variation') {
    const r = act(() => pk.target === 'new' ? createVariation(S, ids, { title: pk.title || undefined }) : addToVariation(S, pk.target, ids), plural(ids.length, 'docket') + ' added');
    if (r) { closeModal(); SEL_VAR = r.id; showTab('variations'); }
  } else {
    let id = pk.target;
    const r = act(() => { if (pk.target === 'new') id = createClaim(S, { from: pk.period.from, to: pk.period.to }, ids).id; else claimAddDockets(S, pk.target, ids); return true; }, pk.target === 'new' ? 'Claim created' : plural(ids.length, 'docket') + ' added');
    if (r) { closeModal(); SEL_CLAIM = id; showTab('claims'); }
  }
}

/* ───────── Confirm dialogs (submit / issue warnings) ───────── */
function confirmDialog(title, body, okLabel, onOk) {
  openModal(() => `<h3>${title}</h3><div class="banner warn"><i class="fas fa-triangle-exclamation"></i><div>${body}</div></div><div class="actions"><button class="btn" onclick="closeModal()">Cancel</button><button class="btn primary" id="cfOk">${okLabel}</button></div>`);
  document.getElementById('cfOk').onclick = () => { closeModal(); onOk(); };
}
function doSubmitVar(id) {
  const r = act(() => submitVariation(S, id), null);
  if (r && r.needsConfirm) confirmDialog('Submit ' + id + '?', `<b>${r.message}.</b> The variation can still be submitted. Your decision is recorded on the variation. Lines keep following their dockets until the variation is approved.`, 'Submit anyway', () => act(() => submitVariation(S, id, { confirm: true }), id + ' submitted'));
  else if (r) toast(id + ' submitted');
}
function doIssueClaim(id) {
  const r = act(() => issueClaim(S, id), null);
  if (r && r.needsConfirm) confirmDialog('Issue ' + id + '?', `<b>${r.message}.</b> The claim can still be issued. Your decision is recorded on the claim. Once issued the claim and its dockets are locked.`, 'Issue anyway', () => act(() => issueClaim(S, id, { confirm: true }), id + ' issued'));
  else if (r) toast(id + ' issued');
}
function doApproveVar(id) {
  const v = getVar(S, id); const amt = varSubmittedAmount(S, v);
  openModal(() => `<h3>Record client approval of ${id}</h3><p class="muted">Submitted amount ${money(amt)}. The approved amount moves the contract sum. On approval every docket line is frozen and the dockets become read-only.</p>
    <div class="field"><label>Approved amount (ex GST)</label><input id="apAmt" type="number" step="0.01" value="${amt}"></div>
    <div class="actions"><button class="btn" onclick="closeModal()">Cancel</button><button class="btn primary" onclick="const a=Number(document.getElementById('apAmt').value);closeModal();act(()=>approveVariation(S,'${id}',a),'${id} approved')">Approve</button></div>`);
}

/* ───────── Variations ───────── */
function marginNote() {
  const m = S.project.margins;
  return `<div class="banner info"><i class="fas fa-percent"></i><div>Project cost-plus margins: Labour ${m.Labour}% · Plant ${m.Plant}% · Materials ${m.Materials}% · Subcontract ${m.Subcontract}%. <b>Not applied to docket lines</b>: calculator values are final. Each line equals its docket's calculator value (compare the two columns), so the margin applied is $0.00.</div></div>`;
}
function changedCell(changed, added, now, until) {
  return changed ? `<span class="pill chg"><i class="fas fa-arrows-rotate"></i> changed since added</span><div class="muted">was <span class="strike">${money(added)}</span> now ${money(now)} · flagged until ${until}</div>` : '';
}
function viewVariations() {
  const vs = S.variations.slice().sort((a, b) => b.id.localeCompare(a.id));
  const approved = S.variations.filter(v => v.status === 'Approved').reduce((a, v) => a + v.approvedAmount, 0);
  let h = `<div class="hdr"><div><h1>Variations</h1><div class="sub">Original contract ${money(S.project.contractSum)} + approved variations ${money(approved)} = <b>${money(contractSum(S))}</b></div></div>
    <button class="btn primary" onclick="openPicker('variation')"><i class="fas fa-file-circle-plus"></i> Add dockets to variation</button></div>`;
  h += `<div class="card tbl-wrap" style="padding:6px"><table><thead><tr><th>Variation</th><th>Title</th><th>Status</th><th class="num">Dockets</th><th class="num">Lines now</th><th class="num">Submitted amount</th><th class="num">Approved amount</th></tr></thead><tbody>`;
  vs.forEach(v => {
    const sub = varSubmittedAmount(S, v);
    h += `<tr class="clickable ${v.id === SEL_VAR ? 'sel' : ''}" onclick="SEL_VAR='${v.id}';render()"><td><b>${v.id}</b></td><td>${esc(v.title)}</td><td>${pill(v.status)}</td><td class="num">${v.lines.length}</td><td class="num">${money(varTotal(S, v))}</td>
      <td class="num">${sub === null ? '<span class="muted">not submitted</span>' : money(sub)}${varSubmittedChanged(S, v) ? ' <span class="pill chg">changed</span>' : ''}</td><td class="num">${v.approvedAmount === null ? '-' : money(v.approvedAmount)}</td></tr>`;
  });
  h += `</tbody></table></div>`;
  const v = S.variations.find(x => x.id === SEL_VAR);
  if (v) h += varDetail(v);
  return h;
}
function varDetail(v) {
  const live = ACTIVE_VAR.includes(v.status) && v.status !== 'Approved';
  let h = `<div class="card"><div class="hdr"><div><h1>${v.id} · ${esc(v.title)} ${pill(v.status)}</h1><div class="sub">Created ${fmtDate(v.created)}${v.submittedOn ? ' · submitted ' + fmtDate(v.submittedOn) : ''}${v.approvedOn ? ' · approved ' + fmtDate(v.approvedOn) : ''}</div></div><div class="btns">`;
  if (v.status === 'Draft') h += `<button class="btn" onclick="openPicker('variation','${v.id}')"><i class="fas fa-plus"></i> Add dockets</button><button class="btn primary" onclick="doSubmitVar('${v.id}')">Submit to client</button><button class="btn danger" onclick="act(()=>releaseVariation(S,'${v.id}','Withdrawn'),'${v.id} withdrawn')">Withdraw</button>`;
  if (v.status === 'Submitted') h += `<button class="btn primary" onclick="doApproveVar('${v.id}')">Client approved</button><button class="btn danger" onclick="act(()=>releaseVariation(S,'${v.id}','Rejected'),'${v.id} rejected, dockets released')">Client rejected</button><button class="btn danger" onclick="act(()=>releaseVariation(S,'${v.id}','Withdrawn'),'${v.id} withdrawn')">Withdraw</button>`;
  h += `</div></div>`;
  if (v.status === 'Approved') h += `<div class="banner ok"><i class="fas fa-lock"></i><div>Approved. Every line is frozen and its dockets are read-only, never repriced, and never offered to a claim or another variation. This variation reaches the progress claim as an approved variation.</div></div>`;
  if (['Rejected', 'Withdrawn'].includes(v.status)) h += `<div class="banner dark"><i class="fas fa-unlock"></i><div>${v.status}. Its dockets were released and are offered again to the next variation or claim. Lines below are history only.</div></div>`;
  if (v.status === 'Submitted') h += `<div class="banner warn"><i class="fas fa-arrows-rotate"></i><div>Submitted, not yet approved: each line still follows its docket's current calculator value, and so does the submitted amount.</div></div>`;
  h += marginNote();
  h += `<div class="tbl-wrap"><table><thead><tr><th>Docket</th><th>Date</th><th>Docket status</th><th>Resources</th><th class="num">Docket calculator value</th><th class="num">Line value</th><th></th><th></th></tr></thead><tbody>`;
  v.lines.forEach(ln => {
    const d = getDocket(S, ln.docket); const val = varLineValue(S, v, ln);
    const dv = live ? priceDocket(S, d).total : val;
    h += `<tr class="${d.status !== 'Approved' && live ? 'hl-warn' : ''}"><td><a onclick="openDocket('${d.id}')"><b>${d.id}</b></a></td><td class="small">${fmtDate(d.date)}</td><td>${pill(d.status)}</td><td class="small">${esc(docketSummary(d))}</td>
      <td class="num">${money(dv)}</td><td class="num"><b>${money(val)}</b></td><td>${changedCell(varLineChanged(S, v, ln), ln.added, val, 'approval')}${v.status === 'Approved' && Math.abs(ln.frozen - ln.added) > 0.004 ? `<span class="muted">added at ${money(ln.added)}, frozen at approval</span>` : ''}</td>
      <td>${v.status === 'Draft' ? `<button class="btn ghost" title="Remove and release" onclick="act(()=>removeFromVariation(S,'${v.id}','${d.id}'),'${d.id} released')"><i class="fas fa-xmark"></i></button>` : ''}</td></tr>`;
  });
  if (!v.lines.length) h += `<tr><td colspan="8" class="muted">No lines.</td></tr>`;
  h += `</tbody></table></div>`;
  const sub = varSubmittedAmount(S, v);
  h += `<table class="tot"><tbody><tr><td>Lines total (ex GST)</td><td class="num">${money(varTotal(S, v))}</td></tr><tr><td>Cost-plus margin applied</td><td class="num">${money(0)}</td></tr>
    <tr><td>Submitted amount</td><td class="num">${sub === null ? '<span class="muted">not submitted</span>' : '<b>' + money(sub) + '</b>'}${varSubmittedChanged(S, v) ? `<div><span class="pill chg">changed since submitted</span></div><div class="muted">was <span class="strike">${money(v.submittedBase)}</span> at submission</div>` : ''}</td></tr>
    <tr><td>Approved amount</td><td class="num">${v.approvedAmount === null ? '-' : '<b>' + money(v.approvedAmount) + '</b>'}</td></tr></tbody></table>`;
  if (v.decisions.length) h += `<div class="banner warn" style="margin-top:12px"><i class="fas fa-clipboard-check"></i><div>${v.decisions.map(x => `${fmtDate(x.at)} · ${esc(x.by)} · ${esc(x.what)}`).join('<br>')}</div></div>`;
  h += `<div class="muted" style="margin-top:8px">${v.history.map(x => fmtDate(x.at) + ' ' + esc(x.what)).join(' · ')}</div></div>`;
  return h;
}

/* ───────── Claims ───────── */
function viewClaims() {
  const cs = S.claims.filter(c => c.status !== 'Deleted').sort((a, b) => b.id.localeCompare(a.id));
  if (!SEL_CLAIM && cs.length) SEL_CLAIM = cs[0].id;
  let h = `<div class="hdr"><div><h1>Progress claims</h1><div class="sub">Retention ${S.project.retention}% and GST ${S.project.gst}% per project settings · claims C-001 and C-002 predate this demo</div></div>
    <button class="btn primary" onclick="openPicker('claim')"><i class="fas fa-file-invoice-dollar"></i> Create claim from dockets</button></div>`;
  h += `<div class="card tbl-wrap" style="padding:6px"><table><thead><tr><th>Claim</th><th>Period</th><th>Status</th><th class="num">Docket lines</th><th class="num">Variation lines</th><th class="num">BOQ</th><th class="num">Gross ex GST</th><th>Issued</th></tr></thead><tbody>`;
  cs.forEach(c => {
    const t = claimTotals(S, c);
    h += `<tr class="clickable ${c.id === SEL_CLAIM ? 'sel' : ''}" onclick="SEL_CLAIM='${c.id}';render()"><td><b>${c.id}</b></td><td class="small">${fmtDate(c.period.from)} to ${fmtDate(c.period.to)}</td><td>${pill(c.status)}${c.status === 'Draft' && c.lines.some(l => claimLineChanged(S, c, l)) ? ' <span class="pill chg">changed</span>' : ''}</td>
      <td class="num">${money(t.dockets)}</td><td class="num">${money(t.vars)}</td><td class="num">${money(t.boq)}</td><td class="num"><b>${money(t.gross)}</b></td><td class="small">${c.issued ? fmtDate(c.issued) : '-'}</td></tr>`;
  });
  if (!cs.length) h += `<tr><td colspan="8" class="muted">No claims.</td></tr>`;
  h += `</tbody></table></div>`;
  const c = S.claims.find(x => x.id === SEL_CLAIM && x.status !== 'Deleted');
  if (c) h += claimDetail(c);
  return h;
}
function claimDetail(c) {
  const draft = c.status === 'Draft';
  const t = claimTotals(S, c);
  let h = `<div class="card"><div class="hdr"><div><h1>${c.id} · ${fmtDate(c.period.from)} to ${fmtDate(c.period.to)} ${pill(c.status)}</h1><div class="sub">Created ${fmtDate(c.created)}${c.issued ? ' · issued ' + fmtDate(c.issued) : ''}</div></div><div class="btns">`;
  if (draft) h += `<button class="btn" onclick="openPicker('claim','${c.id}')"><i class="fas fa-plus"></i> Add dockets</button><button class="btn primary" onclick="doIssueClaim('${c.id}')">Issue claim</button><button class="btn danger" onclick="if(confirm('Delete draft ${c.id}? Its dockets are released.')){act(()=>deleteDraftClaim(S,'${c.id}'),'${c.id} deleted');SEL_CLAIM=null;render();}">Delete draft</button>`;
  h += `</div></div>`;
  if (draft) h += `<div class="banner warn"><i class="fas fa-arrows-rotate"></i><div>Draft: each docket line follows its docket's current calculator value until the claim is issued.</div></div>`;
  else h += `<div class="banner ok"><i class="fas fa-lock"></i><div>Issued and locked. Docket lines are frozen and their dockets are read-only. Dockets that were not on this claim stay unclaimed and are offered on the next claim.</div></div>`;
  h += marginNote();
  h += `<h2>Docket lines</h2><div class="tbl-wrap"><table><thead><tr><th>Docket</th><th>Date</th><th>Docket status</th><th>Resources</th><th class="num">Docket calculator value</th><th class="num">Line value</th><th></th><th></th></tr></thead><tbody>`;
  c.lines.forEach(ln => {
    const d = getDocket(S, ln.docket); const val = claimLineValue(S, c, ln);
    const dv = draft ? priceDocket(S, d).total : val;
    h += `<tr class="${d.status !== 'Approved' && draft ? 'hl-warn' : ''}"><td><a onclick="openDocket('${d.id}')"><b>${d.id}</b></a></td><td class="small">${fmtDate(d.date)} ${d.date < c.period.from ? '<span class="pill chg">before period</span>' : ''}</td><td>${pill(d.status)}</td><td class="small">${esc(docketSummary(d))}</td>
      <td class="num">${money(dv)}</td><td class="num"><b>${money(val)}</b></td><td>${changedCell(claimLineChanged(S, c, ln), ln.added, val, 'issue')}</td>
      <td>${draft ? `<button class="btn ghost" title="Remove and release" onclick="act(()=>claimRemoveDocket(S,'${c.id}','${d.id}'),'${d.id} released')"><i class="fas fa-xmark"></i></button>` : ''}</td></tr>`;
  });
  if (!c.lines.length) h += `<tr><td colspan="8" class="muted">No docket lines.</td></tr>`;
  h += `</tbody></table></div>`;
  const vl = claimVarLines(S, c);
  h += `<h2 style="margin-top:14px">Approved variations</h2><div class="tbl-wrap"><table><thead><tr><th>Variation</th><th>Title</th><th>Dockets (claimed through the variation)</th><th class="num">Approved amount claimed</th></tr></thead><tbody>`;
  vl.forEach(l => h += `<tr><td><a onclick="goRecord('variation','${l.variation}')"><b>${l.variation}</b></a></td><td>${esc(l.title)}</td><td class="small">${l.dockets.join(', ')}</td><td class="num">${money(l.amount)}</td></tr>`);
  if (!vl.length) h += `<tr><td colspan="4" class="muted">None${draft ? ' (approve a variation and it appears here)' : ''}.</td></tr>`;
  h += `</tbody></table></div>`;
  h += `<h2 style="margin-top:14px">BOQ lines <span class="muted" style="font-weight:400">priced BOQ, alongside the docket lines</span></h2><div class="tbl-wrap"><table><thead><tr><th>Item</th><th>Description</th><th class="num">Contract qty</th><th class="num">Rate</th><th class="num">Qty this claim</th><th class="num">Value</th></tr></thead><tbody>`;
  S.project.boq.forEach(b => {
    const q = c.boq[b.code] || 0;
    h += `<tr><td>${b.code}</td><td>${esc(b.desc)}</td><td class="num">${b.qty} ${b.unit}</td><td class="num">${money(b.rate)}</td><td class="num">${draft ? `<input class="cell" type="number" min="0" value="${q}" onchange="getClaim(S,'${c.id}').boq['${b.code}']=Math.max(0,Number(this.value)||0);render()">` : q}</td><td class="num">${money(round2(q * b.rate))}</td></tr>`;
  });
  h += `</tbody></table></div>`;
  h += `<table class="tot" style="margin-top:10px"><tbody>
    <tr><td>Docket lines</td><td class="num">${money(t.dockets)}</td></tr><tr><td>Approved variations</td><td class="num">${money(t.vars)}</td></tr><tr><td>BOQ</td><td class="num">${money(t.boq)}</td></tr>
    <tr><td>Cost-plus margin applied to docket lines</td><td class="num">${money(0)}</td></tr>
    <tr class="total"><td>Gross this claim (ex GST)</td><td class="num">${money(t.gross)}</td></tr>
    <tr><td>Less retention ${S.project.retention}%</td><td class="num">-${money(t.retention)}</td></tr>
    <tr><td>Net (ex GST)</td><td class="num">${money(t.net)}</td></tr><tr><td>GST ${S.project.gst}%</td><td class="num">${money(t.gst)}</td></tr>
    <tr class="total"><td>Total incl GST</td><td class="num">${money(t.total)}</td></tr></tbody></table>`;
  if (c.decisions.length) h += `<div class="banner warn" style="margin-top:12px"><i class="fas fa-clipboard-check"></i><div>${c.decisions.map(x => `${fmtDate(x.at)} · ${esc(x.by)} · ${esc(x.what)}`).join('<br>')}</div></div>`;
  h += `</div>`;
  return h;
}

/* ───────── Calculator (read-only view) ───────── */
function viewCalc() {
  const vs = S.versions.slice().sort((a, b) => b.n - a.n);
  let h = `<div class="hdr"><div><h1>Dayworks Calculator</h1><div class="sub">Read-only here; the editing screen is the calculator prototype. Each docket is priced by the version in effect on its date.</div></div>
    <a href="../2026-11-05-dayworks-calculator/" target="_blank" class="btn"><i class="fas fa-up-right-from-square"></i> Calculator prototype</a></div>`;
  h += marginNote();
  vs.forEach(v => {
    h += `<div class="card"><h2>Version ${v.n} · effective ${fmtDate(v.effectiveFrom)} <span class="muted" style="font-weight:400">saved ${fmtDate(v.savedOn)} by ${esc(v.savedBy)} · ${esc(v.note)}</span></h2><div class="grid2"><div class="tbl-wrap"><table><thead><tr><th>Section</th><th>Line</th><th class="num">Std</th><th class="num">1.5x</th><th class="num">2x</th><th class="num">PH</th><th class="num">Min</th></tr></thead><tbody>`;
    ['labour', 'wet', 'attach'].forEach(sec => v[sec].forEach(l => h += `<tr><td class="small">${RATE_SECTIONS[sec]}</td><td>${esc(l.name)}<div class="muted">${[...(l.resources || []), ...(l.named || []).map(n => (PEOPLE[n] ? PEOPLE[n].name : n) + ' (named)')].join(', ')}</div></td>${TIERS.map(t => `<td class="num">${money(l.r[t])}</td>`).join('')}<td class="num">${l.min ?? '-'}</td></tr>`));
    v.dry.forEach(l => h += `<tr><td class="small">Dry hire</td><td>${esc(l.name)}</td><td class="num">${money(l.r.std)}/${l.unit}</td><td colspan="3" class="muted">no tiers</td><td class="num">${l.min}</td></tr>`);
    h += `</tbody></table></div><div class="tbl-wrap"><table><thead><tr><th>Section</th><th>Line</th><th>Charge</th></tr></thead><tbody>`;
    v.float.forEach(f => h += `<tr><td class="small">Float</td><td>${esc(f.name)}</td><td>mobilise ${money(f.mob)} · demobilise ${money(f.demob)}</td></tr>`);
    v.allow.forEach(a => h += `<tr><td class="small">Allowances</td><td>${esc(a.name)}</td><td>${money(a.amount)} per ${a.unit}${a.threshold ? ' · prompt after ' + a.threshold + 'h' : ''}</td></tr>`);
    v.materials.forEach(m => h += `<tr><td class="small">Materials</td><td>${esc(m.name)}</td><td>${m.rate !== undefined ? money(m.rate) + ' per ' + m.unit : 'cost + ' + m.margin + '%'}</td></tr>`);
    v.sub.forEach(m => h += `<tr><td class="small">Subcontract</td><td>${esc(m.name)}</td><td>cost + ${m.margin}%</td></tr>`);
    h += `<tr><td class="small">Allowances</td><td class="muted">no line for Tool</td><td class="muted">a Tool allowance is Unmapped</td></tr></tbody></table></div></div></div>`;
  });
  return h;
}

/* ───────── Scenarios ───────── */
function viewScenarios() {
  if (!SCEN) SCEN = runScenarios();
  const n = SCEN.filter(r => r.pass).length;
  const we = SCEN.filter(r => ['VAR-23036', 'VAR-23037'].includes(r.s.story));
  const wn = we.filter(r => r.pass).length;
  let h = `<div class="hdr"><div><h1>Scenarios</h1><div class="sub">Each worked example runs on a fresh project through the same engine as the screens. Worked examples ${wn}/${we.length} pass · all scenarios ${n}/${SCEN.length} pass.</div></div>
    <button class="btn" onclick="SCEN=runScenarios();render();toast('Scenarios re-run')"><i class="fas fa-play"></i> Re-run all</button></div>`;
  SCEN.forEach(r => {
    h += `<div class="scen ${r.pass ? '' : 'fail open'}" id="sc${r.i}"><div class="h" onclick="document.getElementById('sc${r.i}').classList.toggle('open')"><span class="${r.pass ? 'ex-pass' : 'ex-fail'}"><i class="fas ${r.pass ? 'fa-circle-check' : 'fa-circle-xmark'}"></i> ${r.pass ? 'PASS' : 'FAIL'}</span><span class="pill ver">${r.s.story}</span><span class="t">${esc(r.s.title)}</span><span class="muted">${r.checks.filter(c => c.pass).length}/${r.checks.length} checks</span></div>
      <div class="b"><p class="small" style="margin-bottom:8px">${esc(r.s.text)}</p>${r.error ? `<div class="banner err">Error: ${esc(r.error)}</div>` : ''}
      <table><thead><tr><th></th><th>Check</th><th>Expected</th><th>Actual</th></tr></thead><tbody>${r.checks.map(c => `<tr><td class="${c.pass ? 'ex-pass' : 'ex-fail'}">${c.pass ? '<i class="fas fa-check"></i>' : '<i class="fas fa-xmark"></i>'}</td><td>${esc(c.label)}</td><td class="small">${esc(c.expected)}</td><td class="small">${esc(c.actual)}</td></tr>`).join('')}</tbody></table>
      ${r.state ? `<div class="actions" style="justify-content:flex-start"><button class="btn sm" onclick="loadScenario(${r.i})"><i class="fas fa-arrow-right-to-bracket"></i> Load this end state into the screens</button></div>` : ''}</div></div>`;
  });
  return h;
}
function loadScenario(i) {
  S = SCEN[i].state; SEL_VAR = (S.variations[S.variations.length - 1] || {}).id || null; SEL_CLAIM = (S.claims[S.claims.length - 1] || {}).id || null; SIM.eff = null;
  log(S, 'Loaded scenario end state: ' + SCEN[i].s.title);
  SCEN = null; // states are consumed; re-run fresh
  showTab('dockets'); toast('Scenario loaded. Reset demo to return to the full project.');
}

render();
