# Dayworks Calculator (built 2026-11-05, rebuilt 2026-11-12)

Prototype for Jira story VAR-23035 (epic VAR-23034), rebuilt to match the story as Alec rewrote it on 2026-11-12.
Single static `index.html`, no build.

Live: https://varicon-naxa.github.io/prototypes/2026-11-05-dayworks-calculator/

## What it shows

Two projects share one tenant: Project A "Riverside Rd Upgrade" (the ticket's worked-example rate card, last issued
claim #3 on 25/10/2026) and Project B "Hillview Estate Stage 2" (Leading Hand on a "Site Lead" line at $82). Switch
project and role (admin / PM edit, supervisor / engineer read-only) in the top bar. "Today" is set to 04/12/2026 so
the ticket's 20 Nov and 1 Dec dockets are in the past.

1. **Dayworks set-up** (VAR-23108). A four-step checklist with completion state. Step 2 is the Dayworks Calculator
   ("Complete", or "Needs attention: N unmapped"). Steps 1, 3 and 4 are placeholders: VAR-23108 does not define its
   steps yet.
   - **Unmapped** at the top: everything used on the project's dockets that is on no line for what it is used as,
     naming the section and the dockets. People and plant can be assigned by name to a line from there; attachments,
     materials and subcontract items can be added to a line in the draft; an allowance type gets a new line. Shows
     "Covered in your unsaved draft" once the draft would fix it.
   - **Eight sections**: Labour rates, Wet hire, Dry hire, Attachments, Float, Allowances, Materials, Subcontract.
     Labour / Wet / Dry lines: typed name, one or more resources (chips), optional people or plant assigned by name
     (amber chips), like the charge resource screen. Named beats resource. A resource, or a named person or machine,
     already on another line in the section is refused with "<name> is already on the <line> line".
     Four tier rates prefilled at 1x / 1.5x / 2x / 2.5x and editable (overwritten cells go amber), minimum hours.
     Dry hire per hour or per day. Attachments with four tiers and a minimum. Float lines per plant type with
     mobilise / demobilise. Allowances with type, unit (per day / occurrence / hour / km), amount and optional hours
     threshold. Materials and Subcontract lines by rate per unit or cost plus margin %.
   - Tier-trigger table (editable), versions with effective-from (rejected before the last issued claim with the
     ticket's message), previous versions read-only.
   - **Project cost-plus margins** card: shows the project's margins and proves they are not applied (DW-1041
     charges $840, not $924).
   - **Who prices at what**: every worker's role and every plant item's charge resource, and the line each prices at
     per section. Roles and charge resources are editable here.
   - **Mapping-change dialog (open decision).** Changing a worker's role, a plant item's charge resource, or a named
     assignment opens "Open decision: which of these should reprice?". It lists every docket not on an issued claim or
     approved variation whose value would change, with current and new value and status (draft / approved), and lists
     locked dockets that would have moved. Nothing applies until every row has a choice ("Reprice" or "Keep current
     value"; bulk buttons for all / none / dated on or after a date). "Keep" pins the old mapping on that docket and
     the docket shows "kept mapping". Cancel changes nothing.
2. **Daywork dockets.** One docket per worked example. Labour, Wet hire (wet rate only, operator not charged, the
   operator's hours set the tier) and Dry hire (flat; an operator goes on their own labour line, not an overlap).
   Each line shows the calculator line it priced at ("by name" when named), the tier split, top-up, midnight split
   with where the break came off, attachments, allowances and the calculator version. Lines record a break start
   time, required when the line crosses midnight (the legacy docket DW-1082 shows the old rule: break off day one).
   Wet / dry lines have attachments and a "Leaving site" control. Float charges show as their own lines. Materials
   and subcontract items have their own table. Threshold prompts appear as a banner with an "Add" button; nothing is
   added on its own. Overlaps (person on any two lines, plant on any two lines, overlapping hours, same day) flag both
   lines with "<name> is already charged on another line for these hours". Anything unmapped prices $0 and blocks
   Approve. Approved dockets are read-only but can still reprice; claim / variation dockets are locked.
3. **Worked examples.** The ticket's current list of 43, in order, recomputed live from the same engine.
   43 / 43 pass on a fresh load. (Changing calculator rates or mappings can make them fail; that is the point.)

## Open decisions hit while building

1. **Which dockets reprice when a mapping changes?** (Alec's open decision.) When a worker's role, a plant item's
   charge resource, or a named assignment changes, which existing dockets not on an issued claim or approved
   variation should reprice: all of them, none, only those dated on or after the change, only unapproved ones, or a
   per-docket choice? The prototype offers every option in the dialog and picks none.
2. **Are named assignments part of the calculator version?** Lines and rates are versioned by effective-from; the
   prototype keeps named assignments, roles and charge resources outside the version so the reprice dialog applies to
   all three. Should a named assignment instead take effect from the version's effective-from date like a rate?
3. **Can a line cover no resources?** "Skilled Labourer & Trades Assistant" (Cris only) and "EX-12 wet" (EX-12 only)
   have no resource. The functional requirement says "selecting one or more resources". Are named-only lines allowed?
4. **Per-hour and per-day dry hire for the same resource.** The examples need Excavator 20t on "Excavator 20t dry"
   ($120/h) and "Excavator 20t dry day" ($900/day), but a resource can be on only one line per section. The prototype
   allows one per-hour and one per-day line per resource, and the docket's dry-hire line picks per hour or per day.
   Is that the rule, or should one Dry hire line carry both rates?
5. **Tiering across dockets.** Hours are tiered per person per calendar day. The prototype tiers within one docket.
   If a person is on two dockets on the same day, do the hours combine for tiering (and for allowance thresholds and
   per-day allowances)?
6. **Overlaps across dockets.** Same question for double charging: is a person or machine on two different dockets
   at overlapping hours flagged? The prototype only checks within a docket.
7. **Attachment minimum.** The attachment charges the machine line's chargeable hours. When does the Attachments
   line's own minimum apply: only if it is higher than the machine's, and on a per-day dry-hire line (which has no
   minimum) at all? The prototype tops up to the attachment's minimum in both cases.
8. **Attachment hours on a per-day dry-hire line.** The machine charges one day; the attachment charges its Standard
   rate for which hours? The prototype uses the line's worked hours.
9. **A break that spans midnight.** If a break starts at 23:45 for 30 minutes, does it all come off the day it
   started? The prototype splits it at midnight.
10. **Threshold "pass".** Is the Meal prompt at more than 10h, or at 10h or more? The prototype prompts above 10h,
    using worked hours net of breaks (not chargeable hours with top-up).
11. **Which line gets the prompted allowance?** The prototype offers the person's last line that day.
12. **Mobilise on an unmapped or blocked docket.** EX-09 (on no line) still mobilises $450 on its first docket, so
    the docket is $450 while its machine line is $0. Should float wait until the machine is mapped or the docket is
    approved?
13. **Float order on the same day.** Mobilise goes on the earliest docket by date, then docket number. Is that the
    rule when a machine is on two dockets on its first day?
14. **Who can change a role or charge resource from the calculator?** The prototype lets admins and PMs change a
    worker's role and a plant item's charge resource from "Who prices at what". These are tenant-wide records; should
    they be editable from a project's calculator at all?
15. **VAR-23108 steps.** Which set-up steps sit beside the calculator, and what makes the calculator step
    "complete": a saved version, or a version with nothing unmapped? The prototype uses nothing unmapped.

## Not in the prototype

Upload of a schedule of rates (.xlsx/.csv) with column mapping; the Daywork Summary export; docket PDF; mobile
docket entry; timesheet import (allowances are seeded as "from timesheet"); the public holiday calendar beyond a few
NSW dates; the real VAR-23108 steps; named assignment of specific attachments (out of scope in the ticket);
external labour-hire workers; night-shift windows; converting dockets to variations and claims (VAR-23036 /
VAR-23037); PostHog events; the feature flag.
