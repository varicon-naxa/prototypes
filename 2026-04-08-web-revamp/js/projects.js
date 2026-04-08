/* ═══════════════════════════════════════════════════════════════
   Varicon SiteDiary — Projects List
   ═══════════════════════════════════════════════════════════════ */

const projectData = [
  {
    id: 1, starred: true,
    jobNumber: '022024/06/24',
    name: 'Varicon Q2 2024 Job Name',
    type: ['Civil'],
    status: 'Active',
    startDate: 'Monday 01/04/2024',
    endDate: 'Wednesday 01/05/2024'
  },
  {
    id: 2, starred: false,
    jobNumber: 'MDB-Canal Prabin',
    name: 'MDB Canal Prabin',
    type: ['Civil', 'Local', 'Segment FOUR'],
    extraTypes: 3,
    status: 'Active',
    startDate: 'Tuesday 30/04/2024',
    endDate: 'Tuesday 29/04/2024'
  },
  {
    id: 3, starred: false,
    jobNumber: 'GWD',
    name: 'Dayworks',
    type: ['Dayworks'],
    status: 'Active',
    startDate: 'Tuesday 11/06/2024',
    endDate: 'Thursday 11/07/2024'
  },
  {
    id: 4, starred: false,
    jobNumber: '021Children-Hospital',
    name: "Tasmania Children's Hospital",
    type: ['Dayworks', 'Civil'],
    status: 'Active',
    startDate: 'Saturday 01/06/2024',
    endDate: 'Thursday 11/07/2024'
  },
  {
    id: 5, starred: false,
    jobNumber: '2009',
    name: 'Bhairohawa Airport',
    type: ['Civil'],
    status: 'Active',
    startDate: 'Thursday 12/04/2024',
    endDate: 'Sunday 07/07/2024'
  },
  {
    id: 6, starred: false,
    jobNumber: 'z-002',
    name: 'Koshi Kamala Project',
    type: ['Civil'],
    status: 'Active',
    startDate: 'Monday 18/03/2024',
    endDate: 'Thursday 18/04/2024'
  },
  {
    id: 7, starred: false,
    jobNumber: 'VAR099',
    name: 'James Test',
    type: ['Civil'],
    status: 'Active',
    startDate: 'Sunday 02/06/2024',
    endDate: 'Thursday 31/07/2025'
  }
];

/* ─── Search & Filter State ─── */
let projSearch = '';
let projRowsPerPage = 15;
let projCurrentPage = 1;

/* ─── Render Projects Table ─── */
function renderProjects() {
  const tbody = document.getElementById('proj-tbody');
  if (!tbody) return;

  // Filter by search
  let filtered = projectData;
  if (projSearch) {
    const q = projSearch.toLowerCase();
    filtered = projectData.filter(p =>
      p.jobNumber.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      p.type.join(' ').toLowerCase().includes(q)
    );
  }

  // Pagination
  const total = filtered.length;
  const start = (projCurrentPage - 1) * projRowsPerPage;
  const paged = filtered.slice(start, start + projRowsPerPage);

  // Render rows
  tbody.innerHTML = paged.map(p => {
    const star = p.starred
      ? '<span style="color:#FBBF24;">★</span>'
      : '<span style="color:#D1D5DB;">☆</span>';

    const typeStr = p.type.join(', ');
    const extra = p.extraTypes
      ? ` <span class="bdg bdg-b" style="font-size:10px;">+${p.extraTypes}</span>`
      : '';

    const statusClass = p.status === 'Active' ? 'bdg-g' : p.status === 'Draft' ? 'bdg-a' : 'bdg-r';

    return `<tr onclick="goPage('site-diary')" style="cursor:pointer;">
      <td><input type="checkbox" onclick="event.stopPropagation()"></td>
      <td>${star}</td>
      <td style="font-weight:600;color:var(--amber);">${p.jobNumber}</td>
      <td style="font-weight:500;">${p.name}</td>
      <td style="font-size:12px;color:var(--tm);">${typeStr}${extra}</td>
      <td><span class="bdg ${statusClass}">${p.status}</span></td>
      <td style="font-size:12px;">${p.startDate}</td>
      <td style="font-size:12px;">${p.endDate}</td>
      <td><button class="ibtn" onclick="event.stopPropagation();showToast('Project options')">⋮</button></td>
    </tr>`;
  }).join('');

  // Update pagination info
  const info = document.getElementById('proj-page-info');
  if (info) {
    const end = Math.min(start + projRowsPerPage, total);
    info.textContent = (total ? start + 1 : 0) + '–' + end + ' of ' + total;
  }
}

/* ─── Search Handler ─── */
function searchProjects(val) {
  projSearch = val;
  projCurrentPage = 1;
  renderProjects();
}

/* ─── Pagination ─── */
function projPageNav(dir) {
  const total = projectData.length;
  const maxPage = Math.ceil(total / projRowsPerPage);
  projCurrentPage = Math.max(1, Math.min(maxPage, projCurrentPage + dir));
  renderProjects();
}

/* ─── Toggle Star ─── */
function toggleStar(id) {
  const p = projectData.find(p => p.id === id);
  if (p) { p.starred = !p.starred; renderProjects(); }
}
