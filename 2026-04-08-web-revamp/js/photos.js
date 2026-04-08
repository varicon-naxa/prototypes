/* ═══════════════════════════════════════════════════════════════
   Varicon SiteDiary — Photos (Improved)
   ═══════════════════════════════════════════════════════════════ */

let uploadTags = [];
let lbTags = [];

/* ═══════════════════════════════════════════════════════════════
   UPLOAD MODAL
   ═══════════════════════════════════════════════════════════════ */
function handlePhotoFiles(files) {
  const newFiles = Array.from(files);
  uploadFileList = uploadFileList.concat(newFiles);
  renderUploadPreviews();
}

function renderUploadPreviews() {
  const grid = document.getElementById('upload-preview-grid');
  if (!grid) return;
  const dz = document.getElementById('photo-drop-zone');

  if (!uploadFileList.length) {
    grid.innerHTML = '';
    if (dz) dz.style.display = '';
    return;
  }
  // Shrink drop zone when files exist
  if (dz) { dz.style.padding = '12px'; }

  grid.innerHTML = uploadFileList.map((f, i) => {
    const isReal = f instanceof File;
    const thumb = isReal ? URL.createObjectURL(f) : 'https://placehold.co/90x70/F4F5F7/9CA3AF?text=IMG';
    return `
    <div style="position:relative;width:90px;height:78px;border-radius:6px;overflow:hidden;border:1px solid var(--border);background:#F4F5F7;flex-shrink:0;">
      <img src="${thumb}" style="width:100%;height:100%;object-fit:cover;" alt="${f.name}">
      <button onclick="removeUploadFile(${i})" style="position:absolute;top:3px;right:3px;width:18px;height:18px;border-radius:50%;background:rgba(0,0,0,.55);border:none;color:#fff;font-size:10px;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1;">✕</button>
    </div>`;
  }).join('') + `
  <div onclick="document.getElementById('photo-file-inp').click()" style="width:90px;height:78px;border:1px dashed var(--border-d);border-radius:6px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .12s;flex-shrink:0;"
       onmouseenter="this.style.borderColor='var(--amber)';this.style.background='var(--amber-l)'"
       onmouseleave="this.style.borderColor='var(--border-d)';this.style.background='transparent'">
    <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="var(--tm)" stroke-width="1.5"><path d="M8 4v8M4 8h8"/></svg>
  </div>`;
}

function removeUploadFile(idx) {
  uploadFileList.splice(idx, 1);
  renderUploadPreviews();
}

/* ─── Tag chips in upload modal ─── */
function handlePhotoTagKey(e) {
  if (e.key === 'Enter' && e.target.value.trim()) {
    e.preventDefault();
    const tag = e.target.value.trim();
    if (!uploadTags.includes(tag)) uploadTags.push(tag);
    e.target.value = '';
    renderUploadTags();
  }
}

function renderUploadTags() {
  const c = document.getElementById('photo-tags-container');
  const inp = document.getElementById('photo-tags-input');
  if (!c || !inp) return;
  // Remove existing chips
  c.querySelectorAll('.tag-chip').forEach(el => el.remove());
  // Insert before input
  uploadTags.forEach((t, i) => {
    const chip = document.createElement('span');
    chip.className = 'tag-chip';
    chip.style.cssText = 'display:inline-flex;align-items:center;gap:3px;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:500;background:var(--amber-l);color:#92400E;';
    chip.innerHTML = `${t}<button onclick="removeUploadTag(${i})" style="background:none;border:none;cursor:pointer;color:#92400E;font-size:10px;padding:0 0 0 2px;font-family:inherit;">✕</button>`;
    c.insertBefore(chip, inp);
  });
}

function removeUploadTag(idx) {
  uploadTags.splice(idx, 1);
  renderUploadTags();
}

/* ─── Upload action ─── */
function uploadPhotos() {
  if (!uploadFileList.length) {
    uploadFileList = [{ name: 'site_photo_' + (photos.length + 1) + '.jpg', size: 2048000 }];
  }
  const desc = document.getElementById('photo-desc').value || '';
  const tags = [...uploadTags];
  if (!tags.length) {
    const inp = document.getElementById('photo-tags-input');
    if (inp && inp.value.trim()) tags.push(inp.value.trim());
  }

  uploadFileList.forEach(f => {
    const isReal = f instanceof File;
    const thumb = isReal ? URL.createObjectURL(f) : null;
    photos.push({
      id: photoIdC++,
      name: f.name,
      desc: desc,
      tags: tags.length ? [...tags] : ['Untagged'],
      date: fmtDate(sdDate),
      time: new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase(),
      thumb: thumb
    });
  });

  uploadFileList = [];
  uploadTags = [];
  renderPhotos();
  closeMo();
  updStats();
  showToast(photos.length > 1 ? 'Photos uploaded successfully' : 'Photo uploaded successfully');
}

/* ═══════════════════════════════════════════════════════════════
   PHOTO GRID
   ═══════════════════════════════════════════════════════════════ */
const PHOTO_DESC_MAX = 60;

function renderPhotos() {
  const g = document.getElementById('photo-grid');
  const e = document.getElementById('photos-empty');
  if (!g) return;

  const q = (document.getElementById('photo-search')?.value || '').toLowerCase();
  const filtered = photos.filter(p =>
    !q || p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q) || (p.tags || []).some(t => t.toLowerCase().includes(q))
  );

  if (!photos.length) { g.innerHTML = ''; if (e) e.style.display = ''; return; }
  if (e) e.style.display = 'none';

  if (!filtered.length && q) {
    g.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:30px;color:var(--tm);font-size:13px;">No photos match "${q}"</div>`;
    return;
  }

  g.innerHTML = filtered.map((p, i) => {
    const idx = photos.indexOf(p);
    const src = p.thumb || 'https://placehold.co/200x140/374151/94A3B8?text=' + encodeURIComponent(p.name.substring(0, 12));

    return `
    <div style="border:1px solid var(--border);border-radius:6px;overflow:hidden;background:#fff;cursor:pointer;transition:all .15s;position:relative;"
         onmouseenter="this.style.borderColor='var(--amber)';this.style.boxShadow='0 2px 10px rgba(0,0,0,.08)'"
         onmouseleave="this.style.borderColor='var(--border)';this.style.boxShadow='none'">
      <!-- Image -->
      <div style="height:120px;overflow:hidden;background:#F4F5F7;position:relative;" onclick="openLightbox(${idx})">
        <img src="${src}" style="width:100%;height:100%;object-fit:cover;" alt="${p.name}">
        <!-- Hover overlay -->
        <div style="position:absolute;inset:0;background:rgba(0,0,0,0);transition:background .15s;display:flex;align-items:center;justify-content:center;"
             onmouseenter="this.style.background='rgba(0,0,0,.3)';this.querySelector('span').style.opacity='1'"
             onmouseleave="this.style.background='rgba(0,0,0,0)';this.querySelector('span').style.opacity='0'">
          <span style="color:#fff;font-size:11px;font-weight:600;opacity:0;transition:opacity .15s;">View</span>
        </div>
      </div>
      <!-- Info bar -->
      <div style="padding:6px 8px;">
        <div style="display:flex;align-items:center;gap:4px;margin-bottom:3px;">
          <div style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;font-weight:500;color:var(--tp);">${p.name.replace(/\.[^.]+$/,'').substring(0,20)}</div>
          <div style="display:flex;gap:2px;flex-shrink:0;">
            <button class="ibtn photo-info-btn" style="padding:2px;color:var(--tm);" onmouseenter="showPhotoTooltip(this,${idx})" onmouseleave="hidePhotoTooltip(this)">
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.3"><circle cx="7" cy="7" r="6"/><path d="M7 6.5v3.5"/><circle cx="7" cy="4.5" r=".5" fill="currentColor"/></svg>
            </button>
            <button class="ibtn" style="padding:2px;color:var(--tm);" onclick="event.stopPropagation();downloadPhoto(${idx})" title="Download"
                    onmouseenter="this.style.color='var(--amber)'" onmouseleave="this.style.color='var(--tm)'">
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M7 2v7.5M4 7l3 3 3-3M2.5 11.5h9"/></svg>
            </button>
            <button class="ibtn" style="padding:2px;color:var(--td);" onclick="event.stopPropagation();deletePhotoFromGrid(${idx})" title="Delete"
                    onmouseenter="this.style.color='var(--red)'" onmouseleave="this.style.color='var(--td)'">
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M2.5 3.5h9M5.5 3.5V2.5h3v1M3.5 3.5v8a1 1 0 001 1h5a1 1 0 001-1v-8"/></svg>
            </button>
          </div>
        </div>
        <div style="font-size:10px;color:var(--td);">${p.date}${p.time ? ' · ' + p.time : ''}</div>
      </div>
    </div>`;
  }).join('');
}

function deletePhotoFromGrid(idx) {
  photos.splice(idx, 1);
  renderPhotos();
  updStats();
  showToast('Photo deleted');
}

function filterPhotos(val) {
  renderPhotos();
}

/* ═══════════════════════════════════════════════════════════════
   LIGHTBOX / PHOTO DETAIL
   ═══════════════════════════════════════════════════════════════ */
function openLightbox(idx) {
  const p = photos[idx];
  if (!p) return;
  const src = p.thumb || 'https://placehold.co/600x400/374151/94A3B8?text=' + encodeURIComponent(p.name);
  document.getElementById('lb-img').src = src;
  document.getElementById('lb-counter').textContent = (idx + 1) + ' of ' + photos.length;
  document.getElementById('lb-desc').value = p.desc || '';
  document.getElementById('lb-date').textContent = p.date + (p.time ? ', ' + p.time : '') + ' (AEST)';

  // Tags
  lbTags = [...(p.tags || [])];
  renderLbTags();

  openMo('lightbox');
  window._lbIdx = idx;
}

function navLightbox(dir) {
  if (!photos.length) return;
  window._lbIdx = (window._lbIdx + dir + photos.length) % photos.length;
  openLightbox(window._lbIdx);
}

/* ─── Lightbox tag chips ─── */
function handleLbTagKey(e) {
  if (e.key === 'Enter' && e.target.value.trim()) {
    e.preventDefault();
    const tag = e.target.value.trim();
    if (!lbTags.includes(tag)) lbTags.push(tag);
    e.target.value = '';
    renderLbTags();
  }
}

function renderLbTags() {
  const c = document.getElementById('lb-tags-container');
  const inp = document.getElementById('lb-tags-input');
  if (!c || !inp) return;
  c.querySelectorAll('.tag-chip').forEach(el => el.remove());
  lbTags.forEach((t, i) => {
    const chip = document.createElement('span');
    chip.className = 'tag-chip';
    chip.style.cssText = 'display:inline-flex;align-items:center;gap:3px;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:500;background:var(--amber-l);color:#92400E;';
    chip.innerHTML = `${t}<button onclick="removeLbTag(${i})" style="background:none;border:none;cursor:pointer;color:#92400E;font-size:10px;padding:0 0 0 2px;font-family:inherit;">✕</button>`;
    c.insertBefore(chip, inp);
  });
}

function removeLbTag(idx) {
  lbTags.splice(idx, 1);
  renderLbTags();
}

function saveLbDetails() {
  const p = photos[window._lbIdx];
  if (!p) return;
  p.desc = document.getElementById('lb-desc').value.trim();
  p.tags = [...lbTags];
  renderPhotos();
  closeMo();
  showToast('Photo details saved');
}

function deleteLbPhoto() {
  photos.splice(window._lbIdx, 1);
  renderPhotos();
  updStats();
  closeMo();
  showToast('Photo deleted');
}

function replaceLbPhoto() {
  showToast('Replace photo coming soon');
}

/* ═══════════════════════════════════════════════════════════════
   PHOTO TOOLTIP (ℹ️ icon hover)
   ═══════════════════════════════════════════════════════════════ */
let _photoTipTimer = null;

function showPhotoTooltip(btn, idx) {
  hidePhotoTooltip(); // clear any existing
  const p = photos[idx];
  if (!p) return;

  _photoTipTimer = setTimeout(() => {
    const tagChips = (p.tags || []).map(t =>
      `<span style="display:inline-block;padding:1px 6px;border-radius:3px;font-size:9px;font-weight:600;background:#FEF3DC;color:#92400E;max-width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${t}</span>`
    ).join('');

    const tip = document.createElement('div');
    tip.className = 'photo-tooltip';
    tip.style.cssText = 'position:fixed;width:210px;background:#fff;border:1px solid #E5E7EB;border-radius:6px;box-shadow:0 4px 16px rgba(0,0,0,.14);padding:10px 12px;z-index:9999;animation:ttFadeIn .12s ease;pointer-events:none;';

    let html = '';
    if (p.desc) {
      html += `<div style="font-size:10px;font-weight:600;color:#6B7280;text-transform:uppercase;letter-spacing:.04em;margin-bottom:3px;">Description</div>`;
      html += `<div style="font-size:11px;color:#374151;line-height:1.4;margin-bottom:8px;">${p.desc}</div>`;
    }
    html += `<div style="font-size:10px;font-weight:600;color:#6B7280;text-transform:uppercase;letter-spacing:.04em;margin-bottom:3px;">Tags</div>`;
    html += `<div style="display:flex;flex-wrap:wrap;gap:3px;margin-bottom:6px;">${tagChips || '<span style="font-size:11px;color:#9CA3AF;font-style:italic;">No tags</span>'}</div>`;
    html += `<div style="border-top:1px solid #E5E7EB;padding-top:6px;margin-top:2px;">`;
    html += `<div style="display:flex;justify-content:space-between;font-size:10px;color:#6B7280;"><span>Uploaded</span><span style="color:#374151;font-weight:500;">${p.date || '-'}</span></div>`;
    html += `</div>`;
    tip.innerHTML = html;

    document.body.appendChild(tip);

    // Position above the button
    const rect = btn.getBoundingClientRect();
    let top = rect.top - tip.offsetHeight - 6;
    let left = rect.right - tip.offsetWidth;
    // If goes above viewport, show below
    if (top < 4) top = rect.bottom + 6;
    // If goes off left edge
    if (left < 4) left = 4;
    tip.style.top = top + 'px';
    tip.style.left = left + 'px';
  }, 150);
}

function hidePhotoTooltip() {
  clearTimeout(_photoTipTimer);
  const existing = document.querySelector('.photo-tooltip');
  if (existing) existing.remove();
}

/* ═══════════════════════════════════════════════════════════════
   DOWNLOAD PHOTO
   ═══════════════════════════════════════════════════════════════ */
function downloadPhoto(idx) {
  const p = photos[idx];
  if (!p) return;
  if (p.thumb) {
    const a = document.createElement('a');
    a.href = p.thumb;
    a.download = p.name || 'photo.jpg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('Downloading ' + (p.name || 'photo'));
  } else {
    showToast('No file available to download');
  }
}
