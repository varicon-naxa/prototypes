# Budget connected + Daily Cost Tracking + Site Diary

Three prototypes on one screen, behind the project tabs they already belonged to:

| Tab | Source prototype |
| --- | --- |
| Budget Overview (and the whole setup wizard) | `2026-08-14-budget-connected` |
| Daily Cost Tracking | `2026-06-04-daily-cost-calendar` |
| Site Diary | `2026-06-02-site-diary-unified-workflow` |

## This file is generated

`index.html` is built by `build-merge.py` from the three source folders. Edit the
sources and re-run the script — do not hand-edit `index.html`, it will be
overwritten:

```bash
python build-merge.py
```

The script fails loudly if any anchor it cuts on has moved, so a source rewrite
that breaks the merge is a build error, not a silently broken page.

## What the merge does

- **Chrome stripped.** Each guest prototype shipped its own sidebar, project
  header and tab bar. Those are removed; the base's sidebar and tab bar frame
  everything.
- **CSS scoped.** Each guest stylesheet is rewritten so every selector sits under
  `#pageDailyCost` / `#pageSiteDiary` (`body` and `*` map onto the page root,
  keyframes get a prefix). The two guests share 29 and 13 class names with the
  base — scoping means the guest rule wins inside its own page and nothing leaks
  either way.
- **Globals renamed.** `money`, `toast`, `fmt`, `openDrawer`, `closeDrawer` and
  the `toast` / `stepper` / `drawer` element ids collided across the three
  documents. Guest copies are prefixed `sd*` / `dc*`. Renaming inside markup is
  restricted to `on*=` handler attributes, so `class="toast"` stays intact.
- **Wizard chrome stood down.** The base drives its stepper and wizard bar from
  `setWizChrome()`, which would otherwise reclaim the tab highlight on a guest
  page. `showPage` and `setWizChrome` are wrapped rather than edited, so the base
  flow is untouched.

## Verified

Computed styles, visible-text length and element counts on both guest tabs were
compared against the two originals served side by side: styles match property for
property, and content matches exactly (site diary 1833 chars, daily cost 1266).
Drawers, month navigation, toasts, the diary's mode switch and drawer step flow
all work, the base wizard still runs end to end, and the console is clean.

## Not carried over

The site diary's `mobile.html` has no tab of its own — it is a separate screen,
not a view of the desktop diary. It stays in its original folder.
