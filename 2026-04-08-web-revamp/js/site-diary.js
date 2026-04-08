/* ═══════════════════════════════════════════════════════════════
   Varicon SiteDiary — Site Diary Sections
   (Photos, Notes, Weather, Plant, Labour, Timecard,
    Materials, Delivery, Misc, Stats, Quick Fill)
   ═══════════════════════════════════════════════════════════════ */

/* ─── Update All Stats ─── */
function updStats() {
  const pc = photos.length, nc = notes.length, lc = labourData.length, ec = plantData.length;

  // Tile values
  document.getElementById('tv-photos').textContent = pc;
  document.getElementById('tv-notes').textContent = nc;
  document.getElementById('tv-plant').textContent = ec;
  const tvPsd = document.getElementById('tv-plant-sd'); if (tvPsd) tvPsd.textContent = (typeof standDownData !== 'undefined' ? standDownData.length : plantData.filter(p => p.sd).length);
  document.getElementById('tv-labour').textContent = lc;
  document.getElementById('tv-labour-of').textContent = labourData.filter(l => l.status === 'On Field').length;
  document.getElementById('tv-mat').textContent = matData.length;
  document.getElementById('tv-del').textContent = delData.length;
  document.getElementById('tv-tc-lab').textContent = lc;

  const totalMin = labourData.reduce((s, l) => s + l.hours * 60, 0);
  document.getElementById('tv-tc-hrs').textContent = Math.floor(totalMin / 60) + 'h ' + Math.round(totalMin % 60) + 'm';
  document.getElementById('tv-tc-of').textContent = labourData.filter(l => l.status === 'On Field').length;

  // Section status badges
  document.getElementById('ss-photos').textContent = pc + ' photo' + (pc !== 1 ? 's' : '');
  document.getElementById('ss-photos').className = 'sstat ' + (pc ? 'done' : 'empty');
  document.getElementById('ss-notes').textContent = nc + ' note' + (nc !== 1 ? 's' : '');
  document.getElementById('ss-notes').className = 'sstat ' + (nc ? 'done' : 'empty');
  const ssPlant = document.getElementById('ss-plant');
  if (ssPlant) { ssPlant.textContent = ec + ' item' + (ec !== 1 ? 's' : ''); ssPlant.className = 'sstat ' + (ec ? 'done' : 'empty'); }
  document.getElementById('ss-labour').textContent = lc + ' worker' + (lc !== 1 ? 's' : '');
  document.getElementById('ss-labour').className = 'sstat ' + (lc ? 'done' : 'empty');
  if (typeof updateMatStats === 'function') updateMatStats();
  document.getElementById('ss-del').textContent = delData.length + ' docket' + (delData.length !== 1 ? 's' : '');
  document.getElementById('ss-del').className = 'sstat ' + (delData.length ? 'done' : 'empty');

  // Progress bar
  let filled = 0, total = 7;
  if (pc) filled++;
  if (nc) filled++;
  if (ec) filled++;
  if (lc) filled++;
  if (matData.length) filled++;
  if (delData.length) filled++;
  if (document.getElementById('ss-weather').textContent.includes('Confirmed')) filled++;
  const pct = Math.round(filled / total * 100);
  document.getElementById('prog-fill').style.width = pct + '%';
  document.getElementById('prog-pct').textContent = pct + '%';
  document.getElementById('submit-pct').textContent = pct + '%';

  // Report modal
  document.getElementById('rpt-date').textContent = fmtDate(sdDate);
  document.getElementById('rpt-plant').textContent = ec + ' items';
  document.getElementById('rpt-labour').textContent = lc + ' workers';
  document.getElementById('rpt-notes').textContent = nc ? notes.map(n => n.text).join('; ') : 'No notes recorded.';
}

/* ═══════ PHOTOS ═══════ */
function handlePhotoFiles(files) {
  uploadFileList = Array.from(files);
  const c = document.getElementById('upload-preview-list'); c.innerHTML = '';
  uploadFileList.forEach((f, i) => {
    c.innerHTML += `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border);font-size:12px;">
      <div style="width:40px;height:30px;background:#F3F4F6;border-radius:4px;display:flex;align-items:center;justify-content:center;">🖼</div>
      <div style="flex:1;"><div style="font-weight:500;">${f.name}</div><div style="color:var(--tm);font-size:10px;">${(f.size / 1024).toFixed(1)} KB</div></div>
      <button class="rm-btn" onclick="uploadFileList.splice(${i},1);handlePhotoFiles(uploadFileList);">✕</button>
    </div>`;
  });
}

function uploadPhotos() {
  if (!uploadFileList.length) {
    uploadFileList = [{ name: 'site_photo_' + (photos.length + 1) + '.jpg', size: 2048000 }];
  }
  const desc = document.getElementById('photo-desc').value || 'Site photo';
  const tags = document.getElementById('photo-tags').value || 'Progress';
  uploadFileList.forEach(f => {
    photos.push({ id: photoIdC++, name: f.name, desc: desc, tags: tags, date: fmtDate(sdDate) });
  });
  renderPhotos(); closeMo(); updStats(); showToast('Photos uploaded successfully');
}

function renderPhotos() {
  const g = document.getElementById('photo-grid'), e = document.getElementById('photos-empty');
  if (!photos.length) { g.innerHTML = ''; e.style.display = ''; return; }
  e.style.display = 'none';
  g.innerHTML = photos.map((p, i) => `<div style="position:relative;cursor:pointer;" onclick="openLightbox(${i})">
    <img class="photo-thumb" src="https://placehold.co/160x120/374151/94A3B8?text=${encodeURIComponent(p.name.substring(0, 10))}" style="width:110px;height:80px;">
    <button class="rm-btn" style="position:absolute;top:2px;right:4px;background:rgba(0,0,0,.5);color:#fff;border-radius:50%;width:18px;height:18px;display:flex;align-items:center;justify-content:center;font-size:10px;" onclick="event.stopPropagation();photos.splice(${i},1);renderPhotos();updStats();">✕</button>
  </div>`).join('');
}

function openLightbox(idx) {
  document.getElementById('lb-img').src = 'https://placehold.co/600x400/374151/94A3B8?text=' + encodeURIComponent(photos[idx].name);
  document.getElementById('lb-counter').textContent = (idx + 1) + ' of ' + photos.length;
  document.getElementById('lb-desc').textContent = photos[idx].desc;
  document.getElementById('lb-tags').textContent = photos[idx].tags;
  document.getElementById('lb-date').textContent = photos[idx].date;
  openMo('lightbox');
  window._lbIdx = idx;
}

function navLightbox(dir) {
  if (!photos.length) return;
  window._lbIdx = (window._lbIdx + dir + photos.length) % photos.length;
  openLightbox(window._lbIdx);
}

/* ═══════ NOTES ═══════ */
let noteCategory = 'Equipment';

function setNC(el, cat) {
  noteCategory = cat;
  document.querySelectorAll('#note-cats .btn').forEach(b => { b.className = 'btn btn-o btn-sm'; });
  el.className = 'btn btn-a btn-sm';
}

function saveNote() {
  const ta = document.getElementById('note-ta'), txt = ta.value.trim();
  if (!txt) return;
  notes.push({
    id: noteIdC++, text: txt, cat: noteCategory,
    time: new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }),
    date: fmtDate(sdDate)
  });
  ta.value = ''; renderNotes(); updStats(); showToast('Note saved');
}

function renderNotes() {
  const c = document.getElementById('notes-list');
  if (!notes.length) { c.innerHTML = ''; return; }
  c.innerHTML = notes.map((n, i) => `<div class="note-item">
    <div class="av" style="background:#6B7280;margin-top:2px;">AP</div>
    <div style="flex:1;">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">
        <span style="font-size:13px;font-weight:600;color:var(--tp);">Anu Praz</span>
        <span class="bdg bdg-a" style="font-size:9px;">${n.cat}</span>
        <span style="font-size:11px;color:var(--td);margin-left:auto;">${n.date} ${n.time}</span>
      </div>
      <div style="font-size:13px;color:var(--tb);line-height:1.5;">${n.text}</div>
      <div style="display:flex;gap:8px;margin-top:5px;">
        <button class="ibtn" style="color:var(--amber);font-size:11px;">✏ EDIT</button>
        <span style="color:var(--td);">·</span>
        <button class="ibtn" style="color:var(--red);font-size:11px;" onclick="notes.splice(${i},1);renderNotes();updStats();">🗑 DELETE</button>
      </div>
    </div>
  </div>`).join('');
}

/* ═══════ WEATHER ═══════ */
function selHour(el) {
  document.querySelectorAll('.wx-card').forEach(c => c.classList.remove('sel'));
  el.classList.add('sel');
}

function confirmWeather() {
  document.getElementById('wx-confirm-btn').textContent = '✓ Confirmed';
  document.getElementById('wx-confirm-btn').disabled = true;
  document.getElementById('wx-confirm-btn').style.background = 'var(--green)';
  document.getElementById('ss-weather').textContent = 'Confirmed';
  document.getElementById('ss-weather').className = 'sstat done';
  document.getElementById('tv-wx').textContent = '22°C ⛅';
  updStats(); showToast('Weather confirmed');
}

function saveWeather() { confirmWeather(); }

function togWxDelay() {
  document.getElementById('wx-delay-inp').style.display = document.getElementById('wx-delay-chk').checked ? '' : 'none';
}

/* ═══════ PLANT & EQUIPMENT ═══════ */
/* All plant functions moved to plant.js */

/* ═══════ LABOUR ═══════ */
function addLabourRow() {
  labourData.push({
    id: labourIdC++, name: 'New Worker', role: 'Labourer', init: 'NW', color: '#6B7280',
    start: '07:00', end: '15:00', brk: 30, status: 'On Field', task: '', hours: 7.5
  });
  renderLabour(); updStats(); showToast('Labour row added');
}

function qLabour(el, name, role, init, color) {
  el.classList.add('sel');
  labourData.push({
    id: labourIdC++, name: name, role: role, init: init, color: color,
    start: '07:00', end: '15:00', brk: 30, status: 'On Field', task: '', hours: 7.5
  });
  renderLabour(); updStats(); showToast(name + ' added');
}

function renderLabour() {
  const tb = document.getElementById('labour-tbody');
  if (!labourData.length) {
    tb.innerHTML = '<tr id="labour-empty"><td colspan="9" style="text-align:center;padding:24px;color:var(--tm);font-size:12px;">No labour added. Use chips above or ADD LABOUR.</td></tr>';
    return;
  }
  tb.innerHTML = labourData.map((l, i) => {
    l.hours = calcHrs(l.start, l.end, l.brk / 60);
    return `<tr>
      <td><div style="display:flex;align-items:center;gap:6px;"><div class="av" style="background:${l.color};width:24px;height:24px;font-size:9px;">${l.init}</div><span style="font-weight:500;">${l.name}</span></div></td>
      <td>${l.role}</td>
      <td><input class="vi-time" value="${l.start}" onchange="labourData[${i}].start=this.value;renderLabour();updStats();"></td>
      <td><input class="vi-time" value="${l.end}" onchange="labourData[${i}].end=this.value;renderLabour();updStats();"></td>
      <td><input class="vi-sm" style="width:50px;text-align:center;" value="${l.brk}" onchange="labourData[${i}].brk=parseInt(this.value)||0;renderLabour();updStats();"></td>
      <td style="font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:600;">${l.hours.toFixed(1)}h</td>
      <td>${l.task || '<span style="color:var(--td);">—</span>'}</td>
      <td><span class="bdg ${l.status === 'On Field' ? 'bdg-g' : 'bdg-a'}" style="font-size:10px;">${l.status}</span></td>
      <td><button class="rm-btn" onclick="labourData.splice(${i},1);renderLabour();renderTimecard();updStats();showToast('Worker removed');">✕</button></td>
    </tr>`;
  }).join('');
  renderTimecard();
}

function renderTimecard() {
  const tb = document.getElementById('tc-tbody');
  if (!labourData.length) {
    tb.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:18px;color:var(--tm);font-size:12px;">No labour entries yet</td></tr>';
    return;
  }
  tb.innerHTML = labourData.map(l => `<tr>
    <td><div style="display:flex;align-items:center;gap:6px;"><div class="av" style="background:${l.color};width:22px;height:22px;font-size:8px;">${l.init}</div>${l.name}</div></td>
    <td>${l.role}</td><td>${l.start}</td><td>${l.end}</td><td>${l.brk}m</td>
    <td style="font-family:'JetBrains Mono',monospace;font-weight:600;">${l.hours.toFixed(1)}h</td>
    <td><span class="bdg ${l.status === 'On Field' ? 'bdg-g' : 'bdg-a'}" style="font-size:10px;">${l.status}</span></td>
  </tr>`).join('');
}

/* ═══════ MATERIALS — functions moved to materials.js ═══════ */

/* ═══════ DELIVERY DOCKETS ═══════ */
function addDelRow() {
  delData.push({ id: delIdC++, supplier: '', docket: '', material: '', qty: 0, notes: '' });
  renderDel(); updStats(); showToast('Delivery row added');
}

function renderDel() {
  const c = document.getElementById('del-rows');
  if (!delData.length) { c.innerHTML = ''; return; }
  c.innerHTML = delData.map((d, i) => `<div style="display:flex;gap:8px;align-items:flex-start;padding:10px 0;border-bottom:1px solid var(--border);">
    <div style="flex:1;display:grid;grid-template-columns:1fr 1fr 1fr 80px;gap:8px;">
      <div><label style="font-size:10px;color:var(--tm);display:block;margin-bottom:2px;">Supplier</label><input class="vi-sm" style="width:100%;" placeholder="Supplier" value="${d.supplier}" onchange="delData[${i}].supplier=this.value"></div>
      <div><label style="font-size:10px;color:var(--tm);display:block;margin-bottom:2px;">Docket #</label><input class="vi-sm" style="width:100%;" placeholder="Docket number" value="${d.docket}" onchange="delData[${i}].docket=this.value"></div>
      <div><label style="font-size:10px;color:var(--tm);display:block;margin-bottom:2px;">Material</label><input class="vi-sm" style="width:100%;" placeholder="Material" value="${d.material}" onchange="delData[${i}].material=this.value"></div>
      <div><label style="font-size:10px;color:var(--tm);display:block;margin-bottom:2px;">Qty</label><input class="vi-sm" type="number" style="width:100%;" value="${d.qty}" onchange="delData[${i}].qty=this.value"></div>
    </div>
    <button class="rm-btn" style="margin-top:16px;" onclick="delData.splice(${i},1);renderDel();updStats();">✕</button>
  </div>`).join('');
}

/* ═══════ MISCELLANEOUS ═══════ */
/* ═══════ MISCELLANEOUS — functions moved to misc.js ═══════ */

/* ═══════ QUICK FILL FROM YESTERDAY ═══════ */
function fillFromYesterday() {
  if (!plantData.length) {
    addPlantRow('55T Excavator', 'Wet Hire', 'ACO Pty Ltd', 'A1 Task', false);
    addPlantRow('Motor Grader', 'Wet Hire', 'Jones Equipment', 'Earthworks', false);
  }
  if (!labourData.length) {
    qLabour(document.createElement('div'), 'John Smith', 'Site Supervisor', 'JS', '#3B82F6');
    qLabour(document.createElement('div'), 'Mike Johnson', 'Electrician', 'MJ', '#10B981');
    qLabour(document.createElement('div'), 'Sarah Williams', 'Plumber', 'SW', '#8B5CF6');
  }
  document.getElementById('cy-banner').style.display = 'none';
  showToast('Pre-filled from yesterday');
}

/* ─── Note Sections Management ─── */
function addNoteSection() {
  const name = prompt('Enter section name:');
  if (!name) return;
  const list = document.getElementById('note-sections-list');
  list.innerHTML += `<div style="display:flex;align-items:center;gap:8px;padding:10px 14px;border:1px solid var(--border);border-radius:6px;margin-bottom:8px;background:#fff;">
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="var(--tm)" stroke-width="1.5"><path d="M2 4h8M2 6h8M2 8h8"/></svg>
    <span style="flex:1;font-size:13px;font-weight:500;">${name}</span>
    <span class="bdg bdg-g" style="font-size:9px;">Active</span>
    <button class="ibtn">⋮</button>
  </div>`;
  showToast('Note Section Added Successfully');
}
