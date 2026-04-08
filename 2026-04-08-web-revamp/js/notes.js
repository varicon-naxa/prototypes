/* ═══════════════════════════════════════════════════════════════
   Varicon SiteDiary — Notes (Section-based with Rich Text)
   ═══════════════════════════════════════════════════════════════ */

/* ─── Note Sections State ─── */
let noteSections = [
  { id: 1, name: 'Safety Measure', desc: 'All records related to safety measures added in notes', active: true },
  { id: 2, name: 'Instruction', desc: 'This is for instruction', active: true }
];
let noteSectionIdC = 3;
let editingSectionId = null;

// notes array + noteIdC declared in core.js
let editingNoteId = null;
let activeEditorSectionId = null;
let noteAttachments = {}; // temp attachments keyed by editor context e.g. "new-1" or "edit-3"

/* ─── Quick Phrases ─── */
const noteQuickPhrases = [
  'Work proceeding normally',
  'Safety briefing held at 7:30am',
  'Visitors on site today',
  'Material delivered on time',
  'Inspection completed',
  'No issues to report',
  'Weather delay encountered',
  'Awaiting RFI response',
  'Equipment breakdown reported',
  'Site induction completed'
];

/* ─── Max content height for collapsed notes ─── */
const NOTE_COLLAPSE_HEIGHT = 120; // px

/* ═══════════════════════════════════════════════════════════════
   RENDER — Note Sections in Site Diary
   ═══════════════════════════════════════════════════════════════ */
function renderNoteSections() {
  const container = document.getElementById('notes-sections-container');
  const emptyState = document.getElementById('notes-empty-state');
  if (!container) return;

  const activeSections = noteSections.filter(s => s.active);
  if (!activeSections.length) {
    container.innerHTML = '';
    if (emptyState) emptyState.style.display = '';
    return;
  }
  if (emptyState) emptyState.style.display = 'none';

  const q = (document.getElementById('notes-search')?.value || '').toLowerCase();

  // Sticky add-section bar at top
  let html = renderStickyAddBar();

  html += activeSections.map(sec => {
    const secNotes = notes.filter(n => n.sectionId === sec.id && (!q || n.text.toLowerCase().includes(q)));
    const isEditing = activeEditorSectionId === sec.id;
    const count = secNotes.length;

    return `
    <div data-section-id="${sec.id}" style="margin-bottom:24px;">
      <!-- Section title row -->
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid var(--border);">
        <div style="width:4px;height:18px;border-radius:2px;background:var(--amber);flex-shrink:0;"></div>
        <span style="font-size:14px;font-weight:600;color:var(--tp);">${sec.name}</span>
        ${sec.desc ? `<button class="ibtn" style="padding:1px 3px;" title="${sec.desc}">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="var(--td)" stroke-width="1.3"><circle cx="8" cy="8" r="6.5"/><path d="M8 7.2v3.5"/><circle cx="8" cy="5.3" r=".6" fill="var(--td)"/></svg>
        </button>` : ''}
        <span style="font-size:10px;color:var(--td);font-weight:500;margin-left:auto;">${count} record${count !== 1 ? 's' : ''}</span>
      </div>

      <!-- Add note input (ABOVE the list) -->
      ${isEditing ? renderRichEditor(sec.id) : `
      <div style="display:flex;gap:10px;align-items:center;margin-bottom:12px;" onclick="openNoteEditor(${sec.id})">
        <div class="av" style="background:var(--tm);">AP</div>
        <div style="flex:1;border:1px dashed var(--border-d);border-radius:6px;padding:10px 14px;color:var(--td);font-size:12px;cursor:text;transition:all .15s;"
             onmouseenter="this.style.borderColor='var(--amber)';this.style.background='#FFFDF7'"
             onmouseleave="this.style.borderColor='var(--border-d)';this.style.background='transparent'">
          Click Here To Add Note And Attachments
        </div>
      </div>`}

      <!-- Note items (below) -->
      ${secNotes.length ? `<div>${secNotes.map(n => renderNoteItem(n)).join('')}</div>` : ''}
    </div>`;
  }).join('');

  container.innerHTML = html;

  // After render, check for long content that needs collapsing
  requestAnimationFrame(initNoteCollapse);
}

/* ─── Sticky Add Section Bar (always visible at top of notes) ─── */
let inlineAddSectionOpen = false;

function renderStickyAddBar() {
  const MAX_VISIBLE_CHIPS = 4;
  const visibleSections = noteSections.slice(0, MAX_VISIBLE_CHIPS);
  const overflowSections = noteSections.slice(MAX_VISIBLE_CHIPS);
  const hasOverflow = overflowSections.length > 0;

  return `
  <div style="display:flex;align-items:center;gap:8px;padding:8px 0;margin-bottom:14px;border-bottom:1px solid var(--border);position:sticky;top:0;background:#fff;z-index:5;">
    <div style="display:flex;align-items:center;gap:5px;flex:1;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch;" class="tab-sc">
      ${visibleSections.map(sec => renderSectionChip(sec)).join('')}
      ${hasOverflow ? `
      <button onclick="openManageNoteSections()" style="display:inline-flex;align-items:center;gap:3px;padding:4px 10px;border-radius:14px;font-size:11px;font-weight:600;cursor:pointer;white-space:nowrap;border:1px solid var(--border);background:#F4F5F7;color:var(--tm);font-family:inherit;transition:all .12s;"
              onmouseenter="this.style.borderColor='var(--amber)';this.style.color='var(--amber)'"
              onmouseleave="this.style.borderColor='var(--border)';this.style.color='var(--tm)'">
        +${overflowSections.length} more
        <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 4l3 3 3-3"/></svg>
      </button>` : ''}
    </div>
    <button onclick="openAddNoteSectionDialog()" style="display:inline-flex;align-items:center;gap:4px;padding:5px 12px;border-radius:14px;font-size:11px;font-weight:600;cursor:pointer;white-space:nowrap;border:1px dashed var(--amber);background:transparent;color:var(--amber);font-family:inherit;transition:all .12s;flex-shrink:0;"
            onmouseenter="this.style.background='var(--amber-l)'"
            onmouseleave="this.style.background='transparent'">
      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2v8M2 6h8"/></svg>
      Add Section
    </button>
  </div>`;
}

function renderSectionChip(sec) {
  const count = notes.filter(n => n.sectionId === sec.id).length;
  return `<button onclick="scrollToSection(${sec.id})" title="${sec.name}" style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:14px;font-size:11px;font-weight:500;cursor:pointer;white-space:nowrap;max-width:160px;border:1px solid ${sec.active ? 'var(--amber)' : 'var(--border)'};background:${sec.active ? 'var(--amber-l)' : '#F4F5F7'};color:${sec.active ? 'var(--amber-d)' : 'var(--td)'};font-family:inherit;transition:all .12s;"
          onmouseenter="this.style.borderColor='var(--amber)'"
          onmouseleave="this.style.borderColor='${sec.active ? 'var(--amber)' : 'var(--border)'}'"
    ><span style="width:6px;height:6px;border-radius:50%;background:${sec.active ? 'var(--amber)' : 'var(--td)'};flex-shrink:0;"></span><span style="overflow:hidden;text-overflow:ellipsis;">${sec.name}</span><span style="font-size:9px;color:${sec.active ? 'var(--amber-d)' : 'var(--td)'};flex-shrink:0;">(${count})</span></button>`;
}

function scrollToSection(secId) {
  const container = document.getElementById('notes-sections-container');
  if (!container) return;
  const blocks = container.querySelectorAll('[data-section-id]');
  blocks.forEach(b => { if (b.dataset.sectionId == secId) b.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
}

function openInlineAddSection() {
  // Open the Add Note Section modal instead of inline form
  openAddNoteSectionDialog();
}

function closeInlineAddSection() {
  closeNoteSectionDialog();
}

function quickAddSection(name) {
  // Check if already exists
  if (noteSections.find(s => s.name.toLowerCase() === name.toLowerCase())) {
    showToast(name + ' already exists');
    return;
  }
  noteSections.push({ id: noteSectionIdC++, name, desc: '', active: true });
  renderNoteSections();
  renderManageSectionsList();
  showToast(name + ' section added');
}

function quickAddFromModal(name, btn) {
  if (noteSections.find(s => s.name.toLowerCase() === name.toLowerCase())) {
    showToast(name + ' already exists', 'error');
    if (btn) { btn.style.borderColor = 'var(--red)'; btn.style.color = 'var(--red)'; setTimeout(() => { btn.style.borderColor = 'var(--border)'; btn.style.color = 'var(--tm)'; }, 800); }
    return;
  }
  noteSections.push({ id: noteSectionIdC++, name, desc: '', active: true });
  renderNoteSections();
  renderManageSectionsList();
  // Animate chip feedback
  if (btn) {
    btn.style.borderColor = 'var(--green)'; btn.style.background = 'var(--gbg)'; btn.style.color = 'var(--gtx)';
    btn.innerHTML = '<svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:3px;"><path d="M2 6l3 3 5-5"/></svg>' + name;
    setTimeout(() => {
      btn.style.borderColor = 'var(--border)'; btn.style.background = '#fff'; btn.style.color = 'var(--tm)';
      btn.innerHTML = name;
    }, 1200);
  }
  showToast(name + ' section added');
}

/* ─── Collapse long notes ─── */
function initNoteCollapse() {
  document.querySelectorAll('.note-content-wrap[data-collapsible="true"]').forEach(wrap => {
    const inner = wrap.querySelector('.note-content-inner');
    if (!inner) return;
    const h = inner.scrollHeight;
    if (h > NOTE_COLLAPSE_HEIGHT) {
      wrap.style.maxHeight = NOTE_COLLAPSE_HEIGHT + 'px';
      wrap.style.overflow = 'hidden';
      wrap.style.position = 'relative';
      // Show "Show more" if not already there
      let toggle = wrap.nextElementSibling;
      if (!toggle || !toggle.classList.contains('note-expand-btn')) {
        const btn = document.createElement('button');
        btn.className = 'note-expand-btn ibtn';
        btn.style.cssText = 'color:var(--amber);font-size:11px;font-weight:600;padding:3px 0;margin-top:2px;';
        btn.innerHTML = 'Show more ▾';
        btn.onclick = function() { toggleNoteExpand(wrap, btn); };
        wrap.insertAdjacentElement('afterend', btn);
      }
    }
  });
}

function toggleNoteExpand(wrap, btn) {
  const isCollapsed = wrap.style.maxHeight !== 'none';
  if (isCollapsed) {
    wrap.style.maxHeight = 'none';
    wrap.style.overflow = 'visible';
    btn.innerHTML = 'Show less ▴';
  } else {
    wrap.style.maxHeight = NOTE_COLLAPSE_HEIGHT + 'px';
    wrap.style.overflow = 'hidden';
    btn.innerHTML = 'Show more ▾';
  }
}

/* ─── Single Note Item ─── */
function renderNoteItem(n) {
  if (editingNoteId === n.id) {
    const key = 'edit-' + n.id;
    const att = noteAttachments[key] || n.attachments || [];
    return `
    <div style="margin-bottom:10px;border:1px solid var(--amber);border-radius:6px;background:#FFFDF7;overflow:hidden;">
      <div style="display:flex;gap:6px;padding:6px 10px;border-bottom:1px solid var(--border);background:#FEF8EC;">
        ${editorToolbar('edit-' + n.id)}
      </div>
      <div id="edit-${n.id}" contenteditable="true" style="min-height:80px;padding:10px 14px;font-size:13px;color:var(--tb);line-height:1.6;outline:none;">${n.text}</div>
      ${renderAttachmentArea(att, key)}
      <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;border-top:1px solid var(--border);background:#FEF8EC;">
        <button class="ibtn" onclick="triggerNoteAttach('${key}')" style="color:var(--tm);gap:4px;font-size:11px;">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M14 8.5l-5.5 5.5a4 4 0 01-5.66-5.66l6.5-6.5a2.5 2.5 0 013.54 3.54l-6.5 6.5a1 1 0 01-1.42-1.42L11 4.5"/></svg>
          Attach
        </button>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-o btn-sm" style="font-size:11px;" onclick="cancelEditNote()">CANCEL</button>
          <button class="btn btn-a btn-sm" style="font-size:11px;" onclick="saveEditNote(${n.id})">SAVE</button>
        </div>
      </div>
    </div>`;
  }

  const hasAttach = n.attachments && n.attachments.length;
  return `
  <div style="display:flex;gap:10px;padding:12px 0;border-bottom:1px solid #F3F4F6;">
    <div class="av" style="background:var(--tm);margin-top:1px;">AP</div>
    <div style="flex:1;min-width:0;">
      <!-- Meta row -->
      <div style="display:flex;align-items:center;gap:4px;margin-bottom:4px;flex-wrap:wrap;">
        <span style="font-size:12px;font-weight:600;color:var(--tp);">AP</span>
        <span style="color:var(--border-d);font-size:10px;">|</span>
        <span style="font-size:11px;color:var(--td);font-family:'JetBrains Mono',monospace;">${n.date}, ${n.time}</span>
        <span style="font-size:10px;color:var(--td);">(Australia/West)</span>
      </div>
      <!-- Content with collapse -->
      <div class="note-content-wrap" data-collapsible="true" style="transition:max-height .25s ease;">
        <div class="note-content-inner" style="font-size:13px;color:var(--tb);line-height:1.55;">${n.text}</div>
      </div>
      <!-- Attachments -->
      ${hasAttach ? renderNoteAttachmentDisplay(n.attachments) : ''}
      <!-- Actions -->
      <div style="display:flex;gap:4px;margin-top:6px;">
        <button class="ibtn" style="color:var(--amber);font-size:10px;font-weight:700;letter-spacing:.03em;padding:2px 6px;" onclick="startEditNote(${n.id})">EDIT</button>
        <button class="ibtn" style="color:var(--amber);font-size:10px;font-weight:700;letter-spacing:.03em;padding:2px 6px;" onclick="deleteNote(${n.id})">DELETE</button>
      </div>
    </div>
  </div>`;
}

/* ═══════════════════════════════════════════════════════════════
   ATTACHMENTS — Display & Upload UI
   ═══════════════════════════════════════════════════════════════ */

function renderNoteAttachmentDisplay(attachments) {
  if (!attachments || !attachments.length) return '';
  return `
  <div style="margin-top:10px;">
    <div style="font-size:9px;font-weight:700;color:var(--tm);text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px;">Attachments</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      ${attachments.map(a => {
        const isImg = a.type === 'image';
        const isPdf = a.type === 'pdf';
        return `
        <div style="width:${isImg ? '80px' : '140px'};border:1px solid var(--border);border-radius:6px;overflow:hidden;background:#fff;cursor:pointer;transition:all .12s;"
             onmouseenter="this.style.borderColor='var(--amber)';this.style.boxShadow='0 2px 8px rgba(0,0,0,.08)'"
             onmouseleave="this.style.borderColor='var(--border)';this.style.boxShadow='none'">
          ${isImg ? `
          <div style="height:56px;background:#F4F5F7;display:flex;align-items:center;justify-content:center;overflow:hidden;">
            <img src="${a.thumb || 'https://placehold.co/80x56/F4F5F7/9CA3AF?text=IMG'}" style="width:100%;height:100%;object-fit:cover;" alt="${a.name}">
          </div>
          <div style="padding:4px 6px;">
            <div style="font-size:10px;color:var(--tb);font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${a.name}</div>
            <div style="font-size:9px;color:var(--td);">${a.size || ''}</div>
          </div>` : isPdf ? `
          <div style="display:flex;align-items:center;gap:8px;padding:8px 10px;">
            <div style="width:32px;height:36px;background:#FEE2E2;border-radius:4px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="3" y="1" width="10" height="14" rx="1.5" stroke="#EF4444" stroke-width="1.2"/><path d="M5.5 6h5M5.5 8.5h5M5.5 11h3" stroke="#EF4444" stroke-width=".8" opacity=".6"/></svg>
            </div>
            <div style="min-width:0;">
              <div style="font-size:10px;color:var(--tb);font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${a.name}</div>
              <div style="font-size:9px;color:var(--td);">${a.size || 'PDF'}</div>
            </div>
          </div>` : `
          <div style="display:flex;align-items:center;gap:8px;padding:8px 10px;">
            <div style="width:32px;height:36px;background:#F4F5F7;border-radius:4px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--tm)" stroke-width="1.2"><path d="M9 1H4a1.5 1.5 0 00-1.5 1.5v11A1.5 1.5 0 004 15h8a1.5 1.5 0 001.5-1.5V5.5L9 1z"/><path d="M9 1v4.5h4.5"/></svg>
            </div>
            <div style="min-width:0;">
              <div style="font-size:10px;color:var(--tb);font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${a.name}</div>
              <div style="font-size:9px;color:var(--td);">${a.size || 'File'}</div>
            </div>
          </div>`}
        </div>`;
      }).join('')}
    </div>
  </div>`;
}

function renderAttachmentArea(attachments, key) {
  if (!attachments || !attachments.length) return '';
  return `
  <div style="padding:6px 10px;border-top:1px solid var(--border);">
    <div style="font-size:9px;font-weight:700;color:var(--tm);text-transform:uppercase;letter-spacing:.06em;margin-bottom:5px;">Attachments</div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;">
      ${attachments.map((a, i) => `
      <div style="display:flex;align-items:center;gap:6px;padding:5px 8px;border:1px solid var(--border);border-radius:5px;background:#FAFAFA;font-size:11px;">
        ${a.type === 'image' ? `<svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="var(--tm)" stroke-width="1.2"><rect x="1" y="1" width="12" height="12" rx="2"/><circle cx="4.5" cy="4.5" r="1.5"/><path d="M1 10l3-3 2 2 3-3 4 4"/></svg>`
          : a.type === 'pdf' ? `<svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="#EF4444" stroke-width="1.2"><rect x="2" y="1" width="10" height="12" rx="1.5"/><path d="M4.5 5h5M4.5 7.5h5" stroke-width=".8" opacity=".6"/></svg>`
          : `<svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="var(--tm)" stroke-width="1.2"><path d="M8 1H3.5A1.5 1.5 0 002 2.5v9A1.5 1.5 0 003.5 13h7a1.5 1.5 0 001.5-1.5V5L8 1z"/><path d="M8 1v4h4"/></svg>`}
        <span style="color:var(--tb);max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${a.name}</span>
        <button class="ibtn" style="padding:1px;color:var(--td);font-size:10px;" onclick="removeNoteAttachment('${key}',${i})">✕</button>
      </div>`).join('')}
    </div>
  </div>`;
}

/* ─── Rich Text Editor ─── */
function editorToolbar(targetId) {
  return `
    <button class="ibtn" onclick="execNoteCmd('bold','${targetId}')" style="font-weight:700;font-size:12px;width:26px;height:24px;justify-content:center;">B</button>
    <button class="ibtn" onclick="execNoteCmd('italic','${targetId}')" style="font-style:italic;font-size:12px;width:26px;height:24px;justify-content:center;">I</button>
    <button class="ibtn" onclick="execNoteCmd('underline','${targetId}')" style="text-decoration:underline;font-size:12px;width:26px;height:24px;justify-content:center;">U</button>
    <div style="width:1px;height:16px;background:var(--border);margin:0 2px;"></div>
    <button class="ibtn" onclick="execNoteCmd('justifyLeft','${targetId}')" style="width:26px;height:24px;justify-content:center;">
      <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M1 2h10M1 5h6M1 8h10M1 11h4"/></svg>
    </button>
    <button class="ibtn" onclick="execNoteCmd('justifyCenter','${targetId}')" style="width:26px;height:24px;justify-content:center;">
      <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M1 2h10M3 5h6M1 8h10M3.5 11h5"/></svg>
    </button>
    <button class="ibtn" onclick="execNoteCmd('justifyRight','${targetId}')" style="width:26px;height:24px;justify-content:center;">
      <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M1 2h10M5 5h6M1 8h10M7 11h4"/></svg>
    </button>`;
}

function renderQuickPhrases(editorId) {
  return `
  <div style="padding:6px 10px;border-top:1px solid var(--border);background:#FAFCFE;">
    <div style="display:flex;align-items:center;gap:5px;margin-bottom:5px;">
      <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="var(--tm)" stroke-width="1.3"><path d="M1 6a5 5 0 019.33-2.5M11 6a5 5 0 01-9.33 2.5"/><path d="M10.33 1v2.5H7.83M1.67 11V8.5H4.17"/></svg>
      <span style="font-size:10px;font-weight:600;color:var(--tm);text-transform:uppercase;letter-spacing:.05em;">Quick Phrases</span>
    </div>
    <div style="display:flex;gap:5px;flex-wrap:wrap;">
      ${noteQuickPhrases.map(p => `<button onclick="insertQuickPhrase('${editorId}',this)" class="qp-chip" style="display:inline-flex;align-items:center;padding:4px 10px;border:1px solid var(--border);border-radius:14px;font-size:11px;font-weight:500;color:var(--tb);background:#fff;cursor:pointer;font-family:inherit;transition:all .12s;white-space:nowrap;"
        onmouseenter="this.style.borderColor='var(--amber)';this.style.color='var(--amber)';this.style.background='var(--amber-l)'"
        onmouseleave="this.style.borderColor='var(--border)';this.style.color='var(--tb)';this.style.background='#fff'">${p}</button>`).join('')}
    </div>
  </div>`;
}

function renderRichEditor(sectionId) {
  const id = 'note-editor-' + sectionId;
  const key = 'new-' + sectionId;
  const att = noteAttachments[key] || [];
  return `
  <div style="border:1px solid var(--amber);border-radius:6px;overflow:hidden;background:#fff;box-shadow:0 0 0 3px rgba(245,166,35,.1);margin-bottom:12px;">
    <div style="display:flex;align-items:center;gap:2px;padding:5px 8px;border-bottom:1px solid var(--border);background:#FAFAFA;">
      ${editorToolbar(id)}
    </div>
    <div id="${id}" contenteditable="true"
         style="min-height:100px;padding:12px 14px;font-size:13px;color:var(--tb);line-height:1.6;outline:none;"></div>
    ${renderQuickPhrases(id)}
    ${renderAttachmentArea(att, key)}
    <div style="display:flex;align-items:center;justify-content:space-between;padding:7px 10px;border-top:1px solid var(--border);background:#FAFAFA;">
      <button class="ibtn" onclick="triggerNoteAttach('${key}')" style="color:var(--tm);gap:4px;font-size:11px;">
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M14 8.5l-5.5 5.5a4 4 0 01-5.66-5.66l6.5-6.5a2.5 2.5 0 013.54 3.54l-6.5 6.5a1 1 0 01-1.42-1.42L11 4.5"/></svg>
        Attach
      </button>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-o btn-sm" style="font-size:11px;height:28px;" onclick="closeNoteEditor()">CANCEL</button>
        <button class="btn btn-a btn-sm" style="font-size:11px;height:28px;" onclick="saveNewNote(${sectionId})">SAVE</button>
      </div>
    </div>
  </div>`;
}

/* ═══════════════════════════════════════════════════════════════
   ATTACHMENT LOGIC
   ═══════════════════════════════════════════════════════════════ */
function triggerNoteAttach(key) {
  // Create a hidden file input and trigger it
  let inp = document.getElementById('note-file-input');
  if (!inp) {
    inp = document.createElement('input');
    inp.type = 'file';
    inp.id = 'note-file-input';
    inp.multiple = true;
    inp.accept = 'image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv';
    inp.style.display = 'none';
    document.body.appendChild(inp);
  }
  inp.onchange = function() {
    if (!this.files.length) return;
    if (!noteAttachments[key]) noteAttachments[key] = [];
    Array.from(this.files).forEach(f => {
      const isImg = f.type.startsWith('image/');
      const isPdf = f.type === 'application/pdf';
      const sizeStr = f.size < 1024 ? f.size + ' B'
        : f.size < 1048576 ? (f.size / 1024).toFixed(1) + ' KB'
        : (f.size / 1048576).toFixed(1) + ' MB';
      const att = { name: f.name, size: sizeStr, type: isImg ? 'image' : isPdf ? 'pdf' : 'file' };
      // Generate thumbnail for images
      if (isImg) {
        const reader = new FileReader();
        reader.onload = function(e) { att.thumb = e.target.result; renderNoteSections(); };
        reader.readAsDataURL(f);
      }
      noteAttachments[key].push(att);
    });
    this.value = '';
    renderNoteSections();
  };
  inp.click();
}

function removeNoteAttachment(key, idx) {
  if (noteAttachments[key]) {
    noteAttachments[key].splice(idx, 1);
    renderNoteSections();
  }
}

/* ═══════════════════════════════════════════════════════════════
   ACTIONS
   ═══════════════════════════════════════════════════════════════ */
function insertQuickPhrase(editorId, btn) {
  const ed = document.getElementById(editorId);
  if (!ed) return;
  const phrase = btn.textContent.trim();
  // Append phrase (with separator if content exists)
  const existing = ed.innerText.trim();
  if (existing) {
    ed.innerHTML += '<br>' + phrase;
  } else {
    ed.innerHTML = phrase;
  }
  ed.focus();
  // Brief visual feedback on the chip
  btn.style.borderColor = 'var(--green)';
  btn.style.background = 'var(--gbg)';
  btn.style.color = 'var(--gtx)';
  setTimeout(() => {
    btn.style.borderColor = 'var(--border)';
    btn.style.background = '#fff';
    btn.style.color = 'var(--tb)';
  }, 600);
}

function execNoteCmd(cmd, editorId) {
  const el = document.getElementById(editorId);
  if (el) el.focus();
  document.execCommand(cmd, false, null);
}

function openNoteEditor(sectionId) {
  activeEditorSectionId = sectionId;
  const key = 'new-' + sectionId;
  if (!noteAttachments[key]) noteAttachments[key] = [];
  renderNoteSections();
  setTimeout(() => { const ed = document.getElementById('note-editor-' + sectionId); if (ed) ed.focus(); }, 60);
}

function closeNoteEditor() {
  if (activeEditorSectionId !== null) {
    delete noteAttachments['new-' + activeEditorSectionId];
  }
  activeEditorSectionId = null;
  renderNoteSections();
}

function saveNewNote(sectionId) {
  const ed = document.getElementById('note-editor-' + sectionId);
  if (!ed) return;
  const text = ed.innerHTML.trim();
  if (!text || text === '<br>') { showToast('Please enter a note'); return; }

  const key = 'new-' + sectionId;
  const att = noteAttachments[key] || [];

  notes.push({
    id: noteIdC++,
    sectionId: sectionId,
    text: text,
    time: new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase(),
    date: fmtDate(sdDate),
    attachments: [...att],
    user: 'AP'
  });

  delete noteAttachments[key];
  activeEditorSectionId = null;
  renderNoteSections();
  updStats();
  showToast('Successfully Created');
}

function startEditNote(id) {
  const n = notes.find(x => x.id === id);
  if (n) noteAttachments['edit-' + id] = [...(n.attachments || [])];
  editingNoteId = id;
  renderNoteSections();
}

function saveEditNote(id) {
  const ed = document.getElementById('edit-' + id);
  if (!ed) return;
  const n = notes.find(x => x.id === id);
  if (n) {
    n.text = ed.innerHTML.trim();
    n.attachments = noteAttachments['edit-' + id] || n.attachments;
  }
  delete noteAttachments['edit-' + id];
  editingNoteId = null;
  renderNoteSections();
  showToast('Note updated');
}

function cancelEditNote() {
  if (editingNoteId !== null) delete noteAttachments['edit-' + editingNoteId];
  editingNoteId = null;
  renderNoteSections();
}

function deleteNote(id) {
  const idx = notes.findIndex(n => n.id === id);
  if (idx > -1) { notes.splice(idx, 1); renderNoteSections(); updStats(); showToast('Note deleted'); }
}

function filterNotes() { renderNoteSections(); }

function copyFromPrevious() {
  const prevNotes = [
    { sectionId: 1, text: 'Safety briefing completed at 6:30 AM. All PPE checked.', attachments: [{ name: 'safety-checklist.pdf', size: '245 KB', type: 'pdf' }] },
    { sectionId: 2, text: 'Continue excavation on Zone B as per drawing Rev C.', attachments: [{ name: 'zone-b-photo.jpg', size: '1.2 MB', type: 'image', thumb: 'https://placehold.co/80x56/E8D5B7/6B7280?text=Zone+B' }] }
  ];
  prevNotes.forEach(pn => {
    const sec = noteSections.find(s => s.id === pn.sectionId && s.active);
    if (sec) {
      notes.push({
        id: noteIdC++, sectionId: pn.sectionId, text: pn.text,
        time: new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase(),
        date: fmtDate(sdDate), attachments: pn.attachments || [], user: 'AP'
      });
    }
  });
  renderNoteSections(); updStats();
  showToast('Copied ' + prevNotes.length + ' notes from previous day');
}

/* Legacy compat */
function saveNote(text, cat) {
  const ta = document.getElementById('note-ta');
  const txt = text || (ta && ta.value.trim());
  if (!txt) return;
  const sec = noteSections.find(s => s.active) || { id: 0 };
  notes.push({
    id: noteIdC++, sectionId: sec.id, text: txt,
    time: new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase(),
    date: fmtDate(sdDate), attachments: [], user: 'AP'
  });
  if (!text && ta) ta.value = '';
  renderNoteSections(); updStats();
  if (!text) showToast('Note saved');
}

function renderNotes() { renderNoteSections(); }

/* ═══════════════════════════════════════════════════════════════
   MANAGE NOTE SECTIONS — Page Logic
   ═══════════════════════════════════════════════════════════════ */
function openManageNoteSections() {
  goPage('manage-notes');
  renderManageSectionsList();
}

function renderManageSectionsList() {
  const list = document.getElementById('manage-note-sections-list');
  if (!list) return;

  if (!noteSections.length) {
    list.innerHTML = `
    <div style="text-align:center;padding:36px 20px;">
      <div style="width:56px;height:56px;border-radius:50%;background:#F4F5F7;margin:0 auto 12px;display:flex;align-items:center;justify-content:center;">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--td)" stroke-width="1.5"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h4"/></svg>
      </div>
      <div style="font-size:13px;color:var(--tm);">No sections created yet</div>
    </div>`;
    return;
  }

  list.innerHTML = noteSections.map(sec => `
  <div class="manage-ns-row" draggable="true" data-sid="${sec.id}"
       ondragstart="nsDragStart(event,${sec.id})" ondragover="nsDragOver(event)" ondrop="nsDrop(event,${sec.id})" ondragend="nsDragEnd()"
       style="display:flex;align-items:center;gap:10px;padding:12px 14px;border:1px solid var(--border);border-radius:6px;margin-bottom:6px;background:#fff;cursor:grab;transition:all .15s;"
       onmouseenter="this.style.borderColor='var(--border-d)';this.style.boxShadow='0 1px 4px rgba(0,0,0,.06)'"
       onmouseleave="this.style.borderColor='var(--border)';this.style.boxShadow='none'">
    <div style="display:flex;flex-direction:column;gap:2px;padding:2px;cursor:grab;opacity:.4;">
      <div style="display:flex;gap:3px;"><div style="width:3px;height:3px;border-radius:50%;background:var(--tm);"></div><div style="width:3px;height:3px;border-radius:50%;background:var(--tm);"></div></div>
      <div style="display:flex;gap:3px;"><div style="width:3px;height:3px;border-radius:50%;background:var(--tm);"></div><div style="width:3px;height:3px;border-radius:50%;background:var(--tm);"></div></div>
      <div style="display:flex;gap:3px;"><div style="width:3px;height:3px;border-radius:50%;background:var(--tm);"></div><div style="width:3px;height:3px;border-radius:50%;background:var(--tm);"></div></div>
    </div>
    <div style="flex:1;min-width:0;">
      <div style="font-size:13px;font-weight:600;color:var(--tp);line-height:1.3;">${sec.name}</div>
      ${sec.desc ? `<div style="font-size:11px;color:var(--tm);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${sec.desc}</div>` : ''}
    </div>
    <!-- Visibility -->
    <button class="ibtn" onclick="toggleSectionVisibility(${sec.id})" title="${sec.active ? 'Visible' : 'Hidden'}"
            style="color:${sec.active ? '#10B981' : 'var(--td)'};padding:4px;">
      ${sec.active
        ? '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z"/><circle cx="8" cy="8" r="2"/></svg>'
        : '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z"/><path d="M2 14L14 2"/></svg>'}
    </button>
    <!-- Edit -->
    <button class="ibtn" onclick="editNoteSection(${sec.id})" title="Edit" style="padding:4px;color:var(--tm);"
            onmouseenter="this.style.color='var(--amber)'" onmouseleave="this.style.color='var(--tm)'">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M10 1.5l2.5 2.5L4.5 12H2v-2.5z"/></svg>
    </button>
    <!-- Delete -->
    <button class="ibtn" onclick="deleteNoteSection(${sec.id})" title="Delete" style="padding:4px;color:var(--td);"
            onmouseenter="this.style.color='var(--red)'" onmouseleave="this.style.color='var(--td)'">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M2.5 3.5h9M5.5 3.5V2.5h3v1M3.5 3.5v8a1 1 0 001 1h5a1 1 0 001-1v-8"/><path d="M5.5 6v4M8.5 6v4"/></svg>
    </button>
  </div>`).join('');
}

function toggleSectionVisibility(id) {
  const sec = noteSections.find(s => s.id === id);
  if (sec) sec.active = !sec.active;
  renderManageSectionsList();
  renderNoteSections();
}

/* Drag reorder */
let nsDragId = null;
function nsDragStart(e, id) {
  nsDragId = id;
  e.dataTransfer.effectAllowed = 'move';
  e.target.style.opacity = '.5';
}
function nsDragOver(e) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }
function nsDrop(e, targetId) {
  e.preventDefault();
  if (nsDragId === null || nsDragId === targetId) return;
  const fi = noteSections.findIndex(s => s.id === nsDragId);
  const ti = noteSections.findIndex(s => s.id === targetId);
  const [item] = noteSections.splice(fi, 1);
  noteSections.splice(ti, 0, item);
  nsDragId = null;
  renderManageSectionsList();
  renderNoteSections();
}
function nsDragEnd() {
  nsDragId = null;
  document.querySelectorAll('.manage-ns-row').forEach(r => r.style.opacity = '1');
}

/* Dialog */
function openAddNoteSectionDialog() {
  editingSectionId = null;
  document.getElementById('note-section-dialog-title').textContent = 'Add Note Section';
  document.getElementById('ns-name-input').value = '';
  document.getElementById('ns-desc-input').value = '';
  document.getElementById('ns-save-btn').textContent = 'Add Note';
  document.getElementById('note-section-dialog').style.display = '';
  setTimeout(() => document.getElementById('ns-name-input').focus(), 50);
}

function editNoteSection(id) {
  const sec = noteSections.find(s => s.id === id);
  if (!sec) return;
  editingSectionId = id;
  document.getElementById('note-section-dialog-title').textContent = 'Edit Note Section';
  document.getElementById('ns-name-input').value = sec.name;
  document.getElementById('ns-desc-input').value = sec.desc || '';
  document.getElementById('ns-save-btn').textContent = 'Save Changes';
  document.getElementById('note-section-dialog').style.display = '';
}

function closeNoteSectionDialog() {
  document.getElementById('note-section-dialog').style.display = 'none';
  editingSectionId = null;
}

function saveNoteSection() {
  const name = document.getElementById('ns-name-input').value.trim();
  const desc = document.getElementById('ns-desc-input').value.trim();
  if (!name) { showToast('Please enter a section name'); return; }

  if (editingSectionId) {
    const sec = noteSections.find(s => s.id === editingSectionId);
    if (sec) { sec.name = name; sec.desc = desc; }
    showToast('Section updated');
  } else {
    noteSections.push({ id: noteSectionIdC++, name, desc, active: true });
    showToast('Note Section Added Successfully');
  }
  closeNoteSectionDialog();
  renderManageSectionsList();
  renderNoteSections();
}

function deleteNoteSection(id) {
  const idx = noteSections.findIndex(s => s.id === id);
  if (idx > -1) {
    noteSections.splice(idx, 1);
    notes = notes.filter(n => n.sectionId !== id);
    renderManageSectionsList();
    renderNoteSections();
    updStats();
    showToast('Section deleted');
  }
}

/* Init */
document.addEventListener('DOMContentLoaded', () => { setTimeout(renderNoteSections, 200); });
