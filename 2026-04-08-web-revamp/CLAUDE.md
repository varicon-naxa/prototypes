CLAUDE.md — SiteDiary / Varicon Revamp

## Spec files — READ THESE FIRST every session
Before touching any code, read the relevant spec file(s):
| File | When to read |
|---|---|
| `spec/architecture.md` | Any session — project structure, loader, file map, navigation |
| `spec/sections.md` | Working on any Site Diary section — IDs, JS functions, data structures |
| `spec/js-api.md` | Adding/modifying JS — all public functions per module |
| `spec/ui-patterns.md` | Building any UI — buttons, tables, modals, badges, checkboxes |

Always Do First

Invoke the frontend-design skill before writing any frontend code, every session, no exceptions.
Read brand_assets/ and design_tokens.json (if present) before touching a single color or font.


Project Context
Varicon / SiteDiary is a construction project management platform — site diaries, plant & equipment tracking, labour timecards, weather logs, delivery dockets, file manager, and cost tracking for civil contractors.
Tone: Clean, professional, data-dense. Utility-first. Not flashy — site managers need fast, scannable information.
Users: Site managers on tablets/phones in the field + project managers and admins on desktop.
Key screens: Projects list, Site Diary (Notes / Plant & Equipment / Photos / Timecard / Labour / Materials / Delivery Dockets / Miscellaneous / Tasks / Weather), File Manager, Daywork Docket, modals (Add Equipment, Select Task).

Actual Brand (Extracted from App Screenshots)
Color Palette
/* Backgrounds */
--v-bg-page:       #F4F5F7   /* page background, very light gray */
--v-bg-surface:    #FFFFFF   /* cards, panels, modal backgrounds */
--v-bg-table-head: #EAECEF   /* table header rows */
--v-bg-sidebar:    #1A2332   /* left sidebar dark navy */
--v-bg-card-dark:  #1C2D4A   /* active section card (e.g. selected Plant & Equipment tile) */
--v-bg-row-hover:  #F9FAFB   /* table row hover */

/* Brand Accent */
--v-amber:         #F5A623   /* primary CTA buttons, active tab underline, checkboxes, icons */
--v-amber-dark:    #D4891A   /* button hover, pressed state */
--v-amber-light:   #FEF3DC   /* amber bg chips, badge backgrounds */

/* Text */
--v-text-primary:  #1A2332   /* headings, bold labels — same as sidebar bg */
--v-text-body:     #374151   /* body text */
--v-text-muted:    #6B7280   /* secondary labels, subtext */
--v-text-disabled: #9CA3AF   /* placeholder text */
--v-text-inverse:  #FFFFFF   /* text on dark surfaces */

/* Status Colors */
--v-green:         #10B981   /* Active status badge */
--v-green-bg:      #D1FAE5   /* Active badge background */
--v-blue-badge:    #3B82F6   /* Beta tag text */
--v-blue-badge-bg: #DBEAFE   /* Beta tag background */
--v-red:           #EF4444   /* delete/error actions */

/* Borders */
--v-border:        #E5E7EB   /* default dividers, input borders */
--v-border-dark:   #D1D5DB   /* stronger borders on table cells */
Never use default Tailwind indigo/blue as a primary. The brand primary is amber #F5A623.
Typography

All text: 'Inter', 'DM Sans', or system-ui — clean sans-serif only. No serif/display fonts.
Section headings (e.g. "Plant and Equipment", "Notes"): font-size: 18px, font-weight: 600, color --v-amber
Page title ("Site Diary", "Projects"): font-size: 22px, font-weight: 700, color --v-text-primary
Card tile labels (NOTES, PHOTOS, TIMECARD): font-size: 11px, font-weight: 700, letter-spacing: 0.08em, UPPERCASE
Table headers: font-size: 13px, font-weight: 600, color --v-text-body
Table body: font-size: 13px, font-weight: 400, color --v-text-body
Nav items: font-size: 13-14px, font-weight: 500
Monospace ('JetBrains Mono' or 'Fira Code'): use only for duration values like 0h 0m, timestamps

Shadows
Subtle and professional — this is a data app, not a marketing site:
css/* Card / panel */
box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04);

/* Modal */
box-shadow: 0 4px 6px rgba(0,0,0,0.07), 0 10px 40px rgba(0,0,0,0.12);

/* Dropdown / floating */
box-shadow: 0 2px 8px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.06);
No color-tinted shadows. No heavy layered effects. Keep it clean.
Borders & Radius
css--v-radius-sm:  4px   /* badges, tags, small chips */
--v-radius-md:  6px   /* inputs, buttons, cards */
--v-radius-lg:  8px   /* modals, panels */
Table cells: no border-radius. Use flat cell borders.

Layout System
Global Shell
┌─────────────────────────────────────────────────────────┐
│  TOP HEADER BAR  (job name breadcrumb + actions)         │  h-14
├──────┬──────────────────────────────────────────────────┤
│      │  SECONDARY TAB NAV  (Dashboard / Forecast / ...)  │  h-11
│ SIDE │────────────────────────────────────────────────── │
│ BAR  │  PAGE TITLE ROW  (Site Diary + status + date nav) │  h-12
│      │────────────────────────────────────────────────── │
│ 220px│  SECTION TILE ROW  (scrollable horizontal cards)  │  h-32
│ col. │────────────────────────────────────────────────── │
│      │  CONTENT AREA                                      │  flex-1
└──────┴──────────────────────────────────────────────────┘
Sidebar

Width: 220px expanded, 64px icon-only collapsed (toggle with << chevron)
Background: --v-bg-sidebar (#1A2332)
Logo top-left: Varicon mark (check brand_assets/)
Active item: --v-amber left border 3px + slightly lighter navy bg
Badge counts (e.g. Leave 48, Equipment 52): amber pill on right
"Beta" items: small blue pill badge

Top Header Bar

White background, border-bottom: 1px solid --v-border
Left: ← back arrow + job name in bold + ▼ dropdown
Right: "Initial Data Upload" button (outline) + Search (outline with icon) + + icon + Avatar + name

Secondary Tab Navigation

White bg, border-bottom: 1px solid --v-border
Active tab: --v-amber bottom border 2px, font-weight: 600, --v-text-primary
Inactive: --v-text-muted, font-weight: 500
Scroll arrows (< >) when tabs overflow
"Beta" badge inline on tab label

Section Tile Row (Site Diary)

Horizontal scrollable row of cards, height: ~128px, gap: 2px or flush borders
Each tile: white bg, icon top-left in amber, label in uppercase amber, value in large bold dark text below
Active tile: --v-bg-card-dark (#1C2D4A) background, white text, amber underline accent
Scroll arrow > on right edge for overflow


Varicon UI Patterns
Buttons
Primary CTA:   bg #F5A623, text white, hover #D4891A, radius 6px, font-weight 600, px-4 py-2
Secondary:     bg white, border 1px #E5E7EB, text #374151, hover bg #F9FAFB
Destructive:   text #EF4444, bg transparent or light red bg on hover
Icon button:   square, 36px, border 1px, radius 6px
"SIGN AND SUBMIT" is always the primary amber CTA in Site Diary header.
Data Tables

Header row: bg #EAECEF, font-weight: 600, font-size: 13px
Merged header groups: e.g. "Equipment Description" spanning multiple columns — use border-bottom separator
Row height: 48px minimum (field touch targets)
Alternating rows: no — use hover state only (#F9FAFB)
Column resize handle: ⇔ icon in header
Empty state: centered gray text + CTA buttons ("ADD EQUIPMENT", "ADD TASKS/COST CENTRES")

Status Badges
Active:   bg #D1FAE5, text #065F46, font-weight 600, radius 4px, px-2 py-0.5
Beta:     bg #DBEAFE, text #1D4ED8, font-weight 600
In Review: bg #FEF3DC, text #92400E (amber-tinted)
Split-Panel Modals (Select Task / Add Equipment)

Max-width: 900px, full-height scroll on both panels
Left panel (~45%): list with search + tabs (TASKS / COST CENTRE) or grouped sections
Right panel (~55%): "Selected Items" with count + "CLEAR ALL" link
Each selected item row: bold name, subtext, × remove on right
Footer: CANCEL (outline) + ADD (amber primary) — always pinned bottom
Collapsible tree: parent checkbox with ▼ expand, indented children

Form Inputs

Height: 40px standard, 52px for main entry fields
Border: 1px solid #E5E7EB, radius 6px
Focus: border-color: #F5A623, box-shadow: 0 0 0 3px rgba(245,166,35,0.15)
Dropdowns: standard select with amber focus ring, ▼ chevron
Clearable inputs: × button inside input on right

Inline Edit Mode

Toggle switch (amber when on) labeled "Edit Mode" — toggles between view and inline edit
In edit mode: rows show inline dropdowns and × remove buttons
"Rollover" button: clock icon + text, positioned near edit mode toggle

Notes / Comments

Avatar circle (initials, gray bg) on left
Timestamp: font-size: 12px, monospace or regular, muted color
EDIT / DELETE actions: amber text links, • separator
Input: full-width, border: 1px dashed #E5E7EB, placeholder "Click Here To Add Note And Attachments"

Weather Log Cards

Horizontal scroll row of time-slot cards
Each: time label, temperature, humidity %, wind speed, rain %, weather condition text + icon
Compact: ~240px wide per card, light border

File Manager Table

Columns: checkbox | Name | Tags | Size | Uploaded By | Uploaded On | Actions (⋮)
Folder rows: amber folder icon
File rows: red/image thumbnail icon
Tags: inline pill chips (colored)
View toggle: list ≡ / grid ⊞ icons top-right


Screenshot Workflow

Always screenshot from localhost: node screenshot.mjs http://localhost:3000
Puppeteer path: use your local install path (update screenshot.mjs if needed)
Screenshots auto-save to ./temporary screenshots/screenshot-N.png
Optional label: node screenshot.mjs http://localhost:3000 site-diary-equipment
After screenshotting, read the PNG and analyze directly.
Be specific when comparing: "amber underline on active tab is missing", "table header bg should be #EAECEF not white", "modal left panel width should be ~45%, not 50%"

Check every pass: exact hex colors, tab active states, column widths, input heights, badge styles, sidebar active states, button variants, modal footer pinning.

Local Server

Always serve on localhost — never screenshot a file:/// URL.
Start dev server: node serve.mjs (serves project root at http://localhost:3000)
Do not start a second instance if already running.


Output Defaults

Single index.html, all styles inline, unless told otherwise.
Tailwind CSS via CDN: <script src="https://cdn.tailwindcss.com"></script>
Google Fonts: Inter (all weights 400–700)
Placeholder images: https://placehold.co/WIDTHxHEIGHT/EAECEF/6B7280
Desktop-first — this is a dense data app used primarily on desktop/tablet. Mobile is secondary.
Target breakpoints: md (768px tablet), lg (1280px desktop)


Brand Assets

Always check brand_assets/ before designing.
The Varicon logo is a stylized V / checkmark mark — use it, do not substitute.
If a color guide exists, it overrides the palette above.


Anti-Generic Guardrails (Adapted for Data App)

No marketing gradients — this is a productivity app. Flat surfaces only. Subtle shadows.
No grain textures — clean, clinical UI. Data clarity over visual flair.
Amber is accent only — it draws the eye to: active states, CTAs, section headings, icons. Never flood a surface with it.
Dense but breathable — table rows at 48px, 16px horizontal cell padding. Not cramped, not airy.
Animations: opacity and transform only. 200ms ease-out. No springs — this isn't a consumer app.
Every interactive element: hover bg shift (+4% lightness), focus ring (3px amber at 15% opacity), active scale (0.98).


Hard Rules

Do not add sections, features, or content not in the reference.
Do not "improve" a reference design — match it pixel-accurately.
Do not stop after one screenshot pass — minimum 2 rounds.
Do not use transition-all.
Do not use default Tailwind blue/indigo as primary color.
Do not use pure white (#ffffff) for page backgrounds — use #F4F5F7.
Do not use rounded-xl or heavy border-radius — this is a data app, keep it sharp (6px max on most elements).
Do not invent new navigation items, columns, or data fields not visible in the reference screenshots.
