# Dayworks Calculator (built 2026-11-05, rebuilt 2026-11-12 and 2026-11-16)

Prototype for the Dayworks Calculator stories under epic VAR-23034, rebuilt to match all four as Alec rewrote them
on 2026-11-16:

- **VAR-23035** core: labour, wet and dry hire lines, tiers, day rates, breaks, minimums, overlaps, mapping, versions
- **VAR-23154** attachments and float
- **VAR-23155** allowances
- **VAR-23156** materials and subcontract

A single static `index.html`, with no build step. Every section, docket block and dialog carries a small ticket tag (for example
`VAR-23154`) so each screen can be mapped to its story.

Live: https://varicon-naxa.github.io/prototypes/2026-11-05-dayworks-calculator/

## What it shows

Two projects share one tenant. Project A "Riverside Rd Upgrade" has the tickets' rate cards. Its last issued claim is
#3 on 25/10/2026 and its last approved variation is V-04 on 05/11/2026. Project B "Hillview Estate Stage 2" puts
Leading Hand on a "Site Lead" line at $82. Switch project and role in the top bar: admin and PM can edit, supervisor
and engineer are read-only. "Today" is set to 18/12/2026 so every example docket is in the past.

1. **Dayworks set-up** (VAR-23108). A four-step checklist: Client approvers, Docket template, Dayworks Calculator,
   Claim and variation link. Only step 3, the calculator, works. The other three are labelled placeholders and their
   statuses are made up.
   - **Unmapped** at the top: anything used on the project's dockets that is on no line for what it is used as,
     with its section and dockets. From the list you can name a person or machine on a line, add an attachment,
     material or subcontract item to a line, or create an allowance line, all in the draft. Once the draft covers an
     item it shows "Covered in your unsaved draft".
   - **Labour rates**: name, roles, named workers, four tier rates (prefilled at 1x / 1.5x / 2x / 2.5x; amber means
     overwritten) and a minimum.
   - **Wet hire**: per hour (tiers and a minimum) or per day (one day rate, no minimum), never both.
   - **Dry hire**: per hour (with a minimum) or per day, never both. There is no line holding both rates for one
     resource. "Excavator 30t dry day" ($900) is its own resource.
   - Labour, Wet and Dry hire lines can hold resources, named people or plant, or both. A line with neither can't be
     saved. A resource or a name already on another line in the section is refused with "<name> is already on the
     <line> line".
   - **Attachments**: per hour (four tiers) or per day, with no minimum.
   - **Float**: one line per plant type, with a mobilise and a demobilise amount.
   - **Allowances**: type, unit, amount and an optional threshold.
   - **Materials and Subcontract**: rate per unit, or cost plus margin.
   - **Tier triggers**, editable.
   - **Versions** hold rates, lines, triggers *and named assignments* (v1 01/10, v2 01/11 Leading Hand $75, v3 10/11
     names Cris). Earlier versions open read-only. The save dialog shows the effective-from floor, which is the later
     of the last issued claim and the last approved variation. A date before it is refused with the ticket's message.
     If a save changes a named assignment, it lists every unbilled docket on or after the date whose value would
     change, and you pick Reprice or Keep for each before it saves.
   - **Who prices at what**: each worker's role and each plant item's charge resource can be edited here. A change
     warns "This changes <name> on every project", lists every docket not on an issued claim or approved variation
     whose value would change (current and new value), and needs Reprice or Keep on each one. Issued and locked
     dockets are named as never repriced. Keep pins the old mapping on that docket.
   - **Cost-plus margins** card: shows that the margins are never added on top.
2. **Daywork dockets**: one or two dockets per worked example. Labour, Wet hire and Dry hire lines. Whether a machine
   line is hourly or daily comes from its calculator line.
   - **Hours and breaks.** Each labour or wet-hire line shows the person's whole day across all their lines and
     dockets in time order, and which hours of the day it holds. A break needs both duration and start time, and
     comes off the day's highest-rated hours. Lines can't cross midnight.
   - **Overlaps.** An overlap on one docket, or across dockets (on any project), flags both lines with "<name> is
     already charged on another line for these hours", names the other docket, and blocks both dockets.
   - **Attachments** show which hours they charge and why.
   - **Float** has its own block. A machine on two dockets on its first day shows a "which docket carries the
     mobilise" banner with a button per docket. "Mark Not claimable" (VAR-23062) bills the docket at $0, float
     included, and the float does not move to another docket.
   - **Allowances** show their source: timesheet, added on the docket, added automatically (threshold), or per day
     on the first line of the day.
   - **Materials and subcontract** sit in their own table.
   - Anything unmapped prices $0 and blocks Approve. Dockets on an issued claim or approved variation are locked.
3. **Worked examples**: every Given/When/Then from all four tickets, grouped by ticket in each ticket's order, and
   recomputed live from the same engine. On a fresh load: VAR-23035 24/24, VAR-23154 9/9, VAR-23155 7/7,
   VAR-23156 4/4 (44/44). Editing rates or mappings can make them fail.

Seeding notes: hours now combine across a person's dockets each day, so each example sits on its own person-day.
Seed extras not in the tickets:

- "Supervisor" (Foreman) $95, "Excavator 25t wet" $230 for EX-11, and "Tipper 10t dry" $95/h.
- Excavators EX-08 and EX-10, so EX-07's float story (3 Nov arrival, leaves 20 Nov, back 1 Dec) stays clean.
- The tickets' rate cards are combined into one calculator, so long core-ticket lines also pick up Meal at 9.5h:
  the $840 docket is $865 in total, and D2 is $515. The core examples check the labour or machine charge.

## Questions hit while building

1. **Cris version example date.** VAR-23035 says Cris's 8h docket on 8 Nov is $480. 8 Nov 2026 is a Sunday, so 8h
   tiers to 2x ($960 at "Labourer"). Should the example use a weekday date? The prototype dates it Friday 6 Nov.
2. **Which line loses the break hours?** If the break is on one line but the day's highest-rated hours sit on a later
   line or docket, whose hours come down? The prototype keeps each line's own worked hours (net of its own break) and
   fills tiers in time order. The day's total then comes off the highest-rated hours, and the reduction shows on the
   line that holds them. Is that the intended split, given that minimums and per-hour allowances use each line's own
   hours?
3. **Does a person's day cross projects?** If someone works on two projects on the same day, do their hours combine
   for tiers, thresholds and per-day allowances? Each project has its own triggers. The prototype counts within a
   project only, but checks overlaps across projects.
4. **Wet day-rated line and the operator's day.** Do an operator's hours on a day-rated wet line count towards their
   day for tiers on their other lines and for allowance thresholds? The prototype counts them.
5. **Day-rated attachment on an hourly machine line.** VAR-23154 covers an hourly attachment on a day-rated line, but
   not this case. Does it charge one day? The prototype charges one day.
6. **Per-day allowance recorded on a later line.** If the per-day allowance comes through on the person's second
   line or docket of the day but not the first, does the charge move to the first line, even on another docket? The
   prototype moves it.
7. **Unchosen mobilise docket.** While the user has not yet picked which of two same-day dockets carries the
   mobilise, does that block approval of either docket? The prototype does not block. It shows the charge on the
   earliest docket with a banner asking for the choice.
8. **Hours on a Not claimable docket.** Do hours on a Not claimable docket still count towards the person's tiers and
   thresholds that day? The prototype counts them.

## Not in the prototype

- Upload of a schedule of rates (.xlsx/.csv) with column mapping.
- The Daywork Summary export and the docket PDF.
- Mobile docket entry.
- Timesheet import: timesheet allowances are seeded as "from timesheet".
- The public holiday calendar beyond a few NSW dates.
- The real VAR-23108 steps 1, 2 and 4.
- Named assignment of specific attachments.
- External labour-hire workers.
- Night shift and lines crossing midnight.
- The docket rejection flow (float staying on a rejected docket is not modelled) and editing an approved docket
  back to Submitted.
- Converting dockets to variations and claims (VAR-23036 / VAR-23037).
- PostHog events and the feature flag.
