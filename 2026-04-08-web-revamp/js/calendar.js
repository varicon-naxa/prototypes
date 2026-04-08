/* ═══════════════════════════════════════════════════════════════
   Varicon SiteDiary — Calendar / Date Picker
   ═══════════════════════════════════════════════════════════════ */

let calMonth = 3, calYear = 2026;

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function renderCal() {
  const g = document.getElementById('cal-grid');
  g.innerHTML = '';
  document.getElementById('cal-title').textContent = MONTH_NAMES[calMonth] + ' ' + calYear;

  const fd = new Date(calYear, calMonth, 1).getDay();
  const dm = new Date(calYear, calMonth + 1, 0).getDate();

  // Empty cells before first day
  for (let i = 0; i < fd; i++) {
    const d = document.createElement('div');
    d.className = 'cal-d dim';
    g.appendChild(d);
  }

  // Day cells
  for (let i = 1; i <= dm; i++) {
    const d = document.createElement('div');
    d.className = 'cal-d';
    d.textContent = i;

    if (i === sdDate.getDate() && calMonth === sdDate.getMonth() && calYear === sdDate.getFullYear()) {
      d.classList.add('on');
    }
    if (i === 3 && calMonth === 3 && calYear === 2026) {
      d.classList.add('today');
    }

    d.onclick = () => {
      sdDate = new Date(calYear, calMonth, i);
      document.getElementById('sd-date').textContent = fmtDate(sdDate);
      closeMo();
      renderCal();
    };
    g.appendChild(d);
  }
}

function calNav(dir) {
  calMonth += dir;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  if (calMonth < 0) { calMonth = 11; calYear--; }
  renderCal();
}

function calToday() {
  calMonth = 3; calYear = 2026;
  sdDate = new Date(2026, 3, 3);
  document.getElementById('sd-date').textContent = fmtDate(sdDate);
  closeMo();
}
