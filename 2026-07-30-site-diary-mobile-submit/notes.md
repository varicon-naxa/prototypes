# Site Diary mobile — sections & submit — 30/07/2026

Source: iPhone screenshots of the mobile site diary (Diary, Timecard, Plant &amp; Equipment,
Materials, Site Dockets, Forms, and the diary hub screen).

## Problems
1. **Labour and Tasks clutter the diary.** Both appear in the hub section list and the left rail
   even though most crews don't record anything in them.
2. **You can't submit from where you are.** Submit only exists on the hub screen, so after working
   through the sections you have to navigate back to the previous screen to sign and submit.

## Proposed behaviour
1. **Labour and Tasks are off by default** — hidden from both the hub list and the side rail. A
   `⋯ → Manage sections` sheet turns them back on per project. A one-line note on the hub says what
   is hidden so it isn't a mystery.
2. **Every section screen carries the same sticky footer as the hub:**
   - a progress bar and "x of y sections visited" line,
   - a "Next: <section>" button pointing at the next unvisited section,
   - a **Sign and submit** button, always present.

   The submit button turns green once every visible section has been opened. Submitting from inside
   a section works exactly as it does from the hub — no back-navigation.
3. The submit sheet summarises the day (labour, plant, materials, dockets) and lists any sections
   that were never opened, so submitting early is a choice rather than an accident.

## Prototype
`index.html` — single self-contained file, phone frame.

Walkthrough: hub has no Labour/Tasks → open Diary → move through sections with the rail, watching
the footer count → Sign and submit from inside a section → sign → submit. Then `⋯ → Manage sections`
to switch Labour on and see it appear in both the list and the rail.

## Open questions
- Is hiding Labour and Tasks an org-level setting, per-project, or per-user?
- Should the submit button be blocked until every section is visited, or only styled differently
  (prototype allows early submit but names the skipped sections)?
- Does the Quick Add flow need the same footer treatment?
