# Mandatory Cost Centres — prototype

**Problem:** Projects can be created (especially via bulk import) with no cost centre. Workers
and timesheet approvers then can't allocate costs correctly.

**Concept (3 linked screens, switch via the top PROTOTYPE bar):**

1. **Projects list** — bulk-imported projects with no cost centre show as **Locked** (lock icon,
   red "Locked" badge, greyed row). Each has an **Assign Cost Centres** button that opens a popup;
   selecting cost centres + Save unlocks the project in place (badge → Active). A banner counts how
   many projects still need attention.
2. **Settings** — Cost Centre Settings gains **"Require cost centres to create a new project"**,
   a checkbox **ON by default**. Optional second toggle to apply the rule retroactively to existing
   projects (off by default).
3. **Create Project** — Cost Centre is required; **Add Project stays disabled** and submission is
   blocked with an inline error until at least one cost centre is selected.

**Key behaviour to confirm with product:**
- Projects created via claim schedule + budget, or a one-off with a cost centre on the setup
  screen, are created already unlocked — only bulk imports without a cost centre arrive locked.
- Whether the retroactive "lock existing projects" option is in scope for v1.

Built to share with the product team, 21/07/2026.
