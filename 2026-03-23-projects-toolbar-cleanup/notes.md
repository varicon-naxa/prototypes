# Projects — Toolbar Cleanup

## Problem
The current Projects toolbar is cluttered with too many buttons (date range, filters, search, help, add project, import, download template) all visible at once. Most users only need a few of these day-to-day.

## What changed

- **Default view (collapsed):** Shows only the most-used actions — Date Range, Filters (with active count badge), Search, and Need Help?
- **"More" button:** Expands a second row containing less-frequent actions — Add Project, Import Projects, Download Template
- **Import modal:** Clicking "Import Projects" opens a 4-step modal wizard (Upload Estimation Sheet > Preview > Parsing > Download) with drag-and-drop file upload and AI BOQ Formatter integration

The "More" toggle state resets on page load (always starts collapsed).

## Why
The toolbar was crowded for everyday use. Most users only need date range, filters, and search on a daily basis. Project creation and import are one click away but no longer clutter the default view.
