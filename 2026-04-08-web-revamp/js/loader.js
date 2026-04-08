/* ═══════════════════════════════════════════════════════════════
   Varicon SiteDiary — HTML Partial Loader
   Loads HTML partials referenced by data-include attributes.
   Replaces the wrapper div with the fetched content so that
   page elements (.vp) sit directly in the flex container.
   ═══════════════════════════════════════════════════════════════ */

async function includeHTML() {
  const els = document.querySelectorAll('[data-include]');
  const fetches = Array.from(els).map(async (el) => {
    const file = el.getAttribute('data-include');
    try {
      const id  = 'tpl-' + file.replace(/^(pages\/|partials\/)/, '').replace(/\.html$/, '');
      const tpl = document.getElementById(id);
      if (!tpl) throw new Error('template not found: ' + id);
      const html = tpl.innerHTML;
      // Create a temp container, parse HTML, then replace wrapper with children
      const temp = document.createElement('div');
      temp.innerHTML = html;
      while (temp.firstChild) {
        el.parentNode.insertBefore(temp.firstChild, el);
      }
      el.remove();
    } catch (e) {
      console.warn('Include failed:', file, e);
      el.innerHTML = '<!-- failed to load: ' + file + ' -->';
      el.removeAttribute('data-include');
    }
  });
  await Promise.all(fetches);
}

/* Boot sequence: load all partials, then initialize */
document.addEventListener('DOMContentLoaded', async () => {
  await includeHTML();
  // After first pass, check for nested includes (e.g. site-diary.html has section includes)
  if (document.querySelectorAll('[data-include]').length) {
    await includeHTML();
  }
  // Initialize app — go straight to Site Diary (skip project list)
  if (typeof goPage === 'function') goPage('site-diary');
  if (typeof renderProjects === 'function') renderProjects();
  if (typeof renderCal === 'function') renderCal();
  if (typeof updStats === 'function') updStats();
  if (typeof renderMat === 'function') renderMat();
  if (typeof renderMisc === 'function') renderMisc();
  if (typeof renderPlant === 'function') renderPlant();
  // Site Diary: Tab View — one section visible at a time (default Photos); sd-sections-stack + core.js sdShowTab
  if (typeof setSdView === 'function') setSdView('tab');

  // Morning Mode — prompt to use Quick Entry if diary is empty before noon
  // Small delay so DOM is fully settled after all includes
  setTimeout(() => {
    if (typeof checkMorningMode === 'function') checkMorningMode();
  }, 600);
});
