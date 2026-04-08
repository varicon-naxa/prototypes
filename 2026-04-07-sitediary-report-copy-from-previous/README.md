# Prototype — Site Diary Report

UI prototype for Varicon SiteDiary report and data management features.

## Descriptions

### 1. Export
The **Export Site Diary** flow lets users generate and download site diary reports as PDF. Users select a date range, choose which sections to include (Notes, Plant & Equipment, Labour, Materials, Weather, Photos, etc.), pick a format, and export. The multi-day report (`site_diary_multiday_report.html`) renders a print-ready A4 layout with all diary data consolidated across selected dates — ready for client handover or compliance records.

### 2. Copy from Previous
The **Copy from Previous** flow (`equipment-rollover-web.html`) allows site managers to roll over Plant & Equipment entries from a previous diary day into the current one. Instead of re-entering the same machines and operators every morning, users select a source date, review the equipment list, tick the items they want to carry forward, and confirm. This saves significant time on sites where the same fleet operates day after day.

## Project Structure

```
Prototype(Site Diary Report)/
├── index.html                              # Main app shell (sidebar + navigation)
├── Site_Diary_MultiDay_With_Data.xlsx      # Sample data spreadsheet
├── README.md
└── pages/
    ├── export-page.html                    # Export Site Diary modal/page
    ├── site_diary_multiday_report.html     # Multi-day report (print-ready A4)
    ├── equipment-rollover-web.html         # Copy from Previous (equipment rollover)
    ├── assigned-forms.html                 # Assigned Forms listing
    └── form-detail.html                    # Form detail view
```

## How to Run

These are static HTML files. You can open them directly in your browser — no server required.

### Option A — Double-click
Open Finder, navigate to the project folder, and double-click `index.html`. It will open in your default browser.

### Option B — Terminal (macOS)
```bash
open "/Users/Prototype(Site Diary Report)/index.html"
```

### Option C — Individual Pages
Each file inside `pages/` is a standalone HTML page. You can open any of them directly:

```bash
open "pages/export-page.html"              # Export flow
open "pages/equipment-rollover-web.html"   # Copy from Previous flow
open "pages/site_diary_multiday_report.html"  # Multi-day report preview
```

### Option D — Local Server (optional)
If you prefer serving via localhost:

```bash
cd "/Users/Prototype(Site Diary Report)"
python3 -m http.server 8000
```

Then visit `http://localhost:8000` in your browser.

## Tech Stack

- HTML5, inline CSS, vanilla JavaScript
- Tailwind CSS (via CDN) — used in `index.html`
- Google Fonts: Inter, JetBrains Mono
- No build step, no dependencies, no Node required
