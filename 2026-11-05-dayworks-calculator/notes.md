# Dayworks Calculator (built 2026-11-05, rebuilt 2026-11-12 and 2026-11-16, updated to Alec's answers and decisions 2026-11-16)

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
Leading Hand on a "Site Lead" line at $82 and Foreman on "Supervisor" at $98. Switch project and role in the top bar: admin and PM can edit, supervisor
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
   - **Attachments**: per hour (four tiers) or per day, with no minimum. "Hammer day" ($250) is day-rated.
   - **Float**: one line per plant type, with a mobilise and a demobilise amount.
   - **Allowances**: type, unit, amount and an optional threshold.
   - **Materials and Subcontract**: rate per unit, or cost plus margin.
   - **Tier triggers**, editable.
   - **Breaks: Deducted / Charged** (default Deducted), one setting per project calculator. Switching it reprices
     the project's dockets straight away (dockets on an issued claim or approved variation keep their value).
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
     dockets on this project in time order, and which hours of the day it holds. Hours on day-rated wet-hire lines
     and on Not claimable dockets count; hours on other projects do not. A break needs both duration and start
     time. With Breaks set to Deducted, the day's breaks come off the day's top tier, on the hourly line with the
     highest $ rate in that tier (day-rated lines skipped), and the table shows where each break came off. With
     Breaks set to Charged, the table shows each break as "charged". Lines can't cross midnight.
   - **Overlaps.** An overlap on one docket, across dockets, or across projects flags both lines with "<name> is
     already charged on another line for these hours", names the other docket, and blocks both dockets.
   - **Attachments** show which hours they charge and why. A day-rated attachment charges one day on any machine
     line.
   - **Float** has its own block. A machine on two dockets on its first day carries mobilise on the earliest docket
     and shows a "which docket carries the mobilise" banner on both, with a button per docket. Approval is not
     blocked while the choice is open. "Mark Not claimable" (VAR-23062) bills the docket at $0, float included, and
     the float does not move to another docket.
   - **Allowances** show their source: timesheet, added on the docket, added automatically (threshold), or per day
     on the first line of the day.
   - **Materials and subcontract** sit in their own table.
   - Anything unmapped prices $0 and blocks Approve. Dockets on an issued claim or approved variation are locked.
3. **Worked examples**: every Given/When/Then from all four tickets, grouped by ticket in each ticket's order, and
   recomputed live from the same engine, plus six examples for the 2026-11-16 decisions (listed under VAR-23035).
   On a fresh load: VAR-23035 34/34, VAR-23154 10/10, VAR-23155 7/7, VAR-23156 4/4 (55/55). The examples always
   price with Breaks set to Deducted, whatever the project's setting; the Charged example switches it itself.
   Editing rates or mappings can make them fail.

Seeding notes: hours combine across a person's dockets on a project each day, so each example sits on its own
person-day. Cris's version example is dated Friday 6 Nov and Thursday 12 Nov. Seed extras not in the tickets:

- "Supervisor" (Foreman) $95, "Excavator 25t wet" $230 for EX-11, and "Tipper 10t dry" $95/h.
- A second Leading Hand, Mia Brooks, for the break and Not claimable D1/D2 examples, because Lee's October Mondays
  are taken and the $70 rate only applies before 1 Nov.
- Project B "Supervisor" (Foreman) $98, so Priya prices on both projects in the cross-project overlap example.
- Ana's role is Labourer, as in the ticket's Ana example.
- Excavators EX-08 and EX-10, so EX-07's float story (3 Nov arrival, leaves 20 Nov, back 1 Dec) stays clean.
- For the 2026-11-16 break decisions: Mia D1/D2 on Monday 12 Oct (DW-1133/1134), Sam wet then labour on Saturday
  14 Nov (DW-1135), Ana labour then day-rated roller on Saturday 21 Nov (DW-1136) and Tuesday 24 Nov (DW-1137).
- The tickets' rate cards are combined into one calculator, so long core-ticket lines also pick up Meal at 9.5h:
  the $840 docket is $865 in total, and D2 is $515. The core examples check the labour or machine charge.

## Decided (2026-11-16)

1. **Minimum on a line after a break moves.** The minimum (4h per line), per-hour allowances and hourly attachment
   hours are tested on the hours a line holds after the day's breaks are placed, not the line's own worked hours.
   Example: D1 worked 5.5h holds 6h once the break comes off D2, so no top-up (DW-1126). A sharper example: D1
   worked 3.5h holds 4h, so no top-up, $280 (DW-1133).
2. **Which line loses a deducted break.** Among the day's top-tier hours, the line with the highest $ hourly rate in
   that tier. Day-rated lines are skipped. Only if every top-tier line is day-rated does the break reduce nothing.
   Examples: wet $360 vs labour $160 at 2x, break off the wet line (DW-1135); day-rated roller and hourly labour at
   2x, break off labour (DW-1136); only the day-rated roller in the top tier, break reduces nothing (DW-1137).
3. **Breaks: Deducted / Charged.** A per-calculator setting, default Deducted. When Charged, break hours are
   charged and tiered exactly like worked hours, counting towards tier thresholds and the minimum. Example: Tuesday
   6:00-17:00 with a 0.5h break, $70 / $105 / $140: Deducted $840, Charged 8x70 + 2x105 + 1x140 = $910 (DW-1101).
   The per-day hours table shows the break as "charged".

## Open questions

These came up while building the 2026-11-16 decisions. The prototype's current behaviour is noted so it can be
checked, but none of it is decided.

1. **Break bigger than the top tier's hourly hours.** When the hourly hours in the top tier are fewer than the
   break, the prototype carries the rest of the break down to the next tier (hourly lines only, highest $ first),
   and if no hourly hours are left the rest reduces nothing. Is that right?
2. **Top tier all day-rated, lower tiers hourly.** When only day-rated lines hold the top tier, the break reduces
   nothing even though an hourly line holds lower-tier hours (DW-1137: the worker is charged for the break on the
   labour line). Is that the intent, or should the break move to the highest tier that has an hourly line?
3. **Equal rates in the top tier.** When two hourly lines hold top-tier hours at the same $ rate, the prototype takes
   the break off the later line of the day. Is that the tie-break?
4. **Unmapped lines.** An unmapped line has no rate yet. The prototype ranks it below every mapped hourly line, so
   the break only comes off it when no mapped hourly line holds hours in that tier. Once it is mapped, the break
   may move. Is that acceptable?
5. **Hourly attachment on a day-rated wet line with a break.** Its hours are the hours the line holds. Because a
   deducted break never comes off a day-rated line, those hours now include the line's own break. Should the
   attachment's hours exclude the line's own break?
6. **Is the Breaks setting versioned?** The prototype keeps it as one live setting per project calculator, outside
   the dated versions, and switching it reprices every unbilled docket straight away. Should it instead be part of
   a calculator version (with an effective-from date), and should a change list the affected dockets for Reprice or
   Keep, like a named-assignment change?
7. **Dry hire under Charged.** A dry-hire line's own break is deducted from that line under Deducted. Under Charged
   the prototype charges the dry-hire line's break too. Is that right?

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
