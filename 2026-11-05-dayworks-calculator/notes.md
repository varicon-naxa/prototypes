# Dayworks Calculator (built 2026-11-05, rebuilt 2026-11-12 and 2026-11-16, updated to Alec's answers and decisions 2026-11-16 and 2026-11-17)

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
   - **Breaks: Deducted / Charged** (default Deducted). The setting is part of the calculator version: switching it
     changes the draft, and saving creates a new version with an effective-from date, like a rate change (same
     earliest effective-from rule). Dockets dated before it keep their break treatment, and dockets on an issued
     claim or approved variation keep their value. The version list shows each version's Breaks setting.
   - **Versions** hold rates, lines, triggers, *named assignments* and the Breaks setting (v1 01/10, v2 01/11 Leading Hand $75, v3 10/11
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
     highest $ rate in that tier (day-rated lines skipped; at the same rate, the line running at the break's start
     time, else the later line; a break longer than the top tier's hourly hours carries down a tier), and the table
     shows where each break came off. With
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
   recomputed live from the same engine, plus seven examples for the 2026-11-16 decisions and nine for the
   2026-11-17 decisions (five under VAR-23035, four under VAR-23154).
   On a fresh load: VAR-23035 40/40, VAR-23154 14/14, VAR-23155 7/7, VAR-23156 4/4 (65/65). The examples always
   price with Breaks set to Deducted, whatever the calculator versions say; the Charged, dry-hire Charged and
   versioned-Breaks examples set it themselves.
   Editing rates or mappings can make them fail.

Seeding notes: hours combine across a person's dockets on a project each day, so each example sits on its own
person-day. Cris's version example is dated Friday 6 Nov and Thursday 12 Nov. Seed extras not in the tickets:

- "Supervisor" (Foreman) $95, "Excavator 25t wet" $230 for EX-11, and "Tipper 10t dry" $95/h.
- A second Leading Hand, Mia Brooks, for the break and Not claimable D1/D2 examples, because Lee's October Mondays
  are taken and the $70 rate only applies before 1 Nov.
- Project B "Supervisor" (Foreman) $98, so Priya prices on both projects in the cross-project overlap example.
- Ana's role is Labourer, as in the ticket's Ana example.
- Excavators EX-08 and EX-10, so EX-07's float story (3 Nov arrival, leaves 20 Nov, back 1 Dec) stays clean.
- For the 2026-11-16 break decisions: a third Leading Hand, Kai Turner, for the single-line 3.5h example on Monday
  12 Oct (DW-1138); Mia D1/D2 on Monday 12 Oct (DW-1133/1134), Sam wet then labour on Saturday
  14 Nov (DW-1135), Ana labour then day-rated roller on Saturday 21 Nov (DW-1136) and Tuesday 24 Nov (DW-1137).
- For the 2026-11-17 decisions: Sam wet then labour with a 1h break on Wednesday 18 Nov (DW-1139, carry-down);
  Kai D1/D2 on Saturday 17 Oct (DW-1140/1141, equal rates, D1 covers the break time); Sam labour then two wet
  lines on Saturday 28 Nov (DW-1142, equal rates, neither covers); Tipper TP-03 hourly dry with a break on
  Thursday 19 Nov (DW-1145); RL-02 day-rated wet with a breaker on Wednesday 25 Nov (DW-1211) and EX-14 day-rated
  dry with a breaker on Thursday 26 Nov (DW-1212).
- The tickets' rate cards are combined into one calculator, so long core-ticket lines also pick up Meal at 9.5h:
  the $840 docket is $865 in total, and D2 is $515. The core examples check the labour or machine charge.

## Decided (2026-11-16)

1. **Minimum on a line after a break moves.** The minimum (4h per line), per-hour allowances and hourly attachment
   hours are tested on the hours a line holds after the day's breaks are placed, not the line's own worked hours.
   Example: D1 worked 5.5h holds 6h once the break comes off D2, so no top-up (DW-1126). A sharper example: D1
   7:00-11:00 with a 0.5h break worked 3.5h, D2 11:00-18:30; the break comes off D2's 2x hours, so D1 holds 4h with
   no top-up, $280, and D2 is 4h x $70 + 2h x $105 + 1h x $140 = $630 (DW-1133/1134). With no other line that day
   the break stays on the line: "If 3.5 hours worked and a 30 minute break, 4 hours must be charged", so 3.5h plus
   a 0.5h minimum top-up = 4h x $70 = $280 (DW-1138).
2. **Which line loses a deducted break.** Among the day's top-tier hours, the line with the highest $ hourly rate in
   that tier. Day-rated lines are skipped. Only if every top-tier line is day-rated does the break reduce nothing.
   Examples: wet $360 vs labour $160 at 2x, break off the wet line (DW-1135); day-rated roller and hourly labour at
   2x, break off labour (DW-1136); only the day-rated roller in the top tier, break reduces nothing (DW-1137).
3. **Breaks: Deducted / Charged.** A per-calculator setting, default Deducted. When Charged, break hours are
   charged and tiered exactly like worked hours, counting towards tier thresholds and the minimum. Example: Tuesday
   6:00-17:00 with a 0.5h break, $70 / $105 / $140: Deducted $840, Charged 8x70 + 2x105 + 1x140 = $910 (DW-1101).
   The per-day hours table shows the break as "charged".

## Decided (2026-11-17)

1. **Break bigger than the top tier's hourly hours.** The rest carries down to the next tier, on hourly lines only,
   highest $ first, until all of it is placed. Example: Sam wet 7:00-13:00 ($180), labour 13:00-15:30 ($80) with a
   1h break; the 1.5x tier holds 0.5h (labour), so 0.5h comes off there and 0.5h off the wet line's Standard:
   wet 5.5h x $180 = $990, labour 2h + 2h top-up = $320 (DW-1139).
2. **Top tier all day-rated.** The break reduces nothing: "For day rate, breaks do not matter, day rate charged".
   Unchanged: DW-1137, labour $300.
3. **Equal $ rates in the top tier.** The line running at the break's recorded start time loses it; if neither
   covers that time, the later line. Examples: Saturday D1 6:00-11:00 with a break at 8:00 and D2 11:00-15:00, both
   $140 at 2x: the break comes off D1, $560 / $560 (DW-1140/1141). Labour with a break at 7:00, then two $360 wet
   lines: neither covers 7:00, so the later one (EX-10) loses it, $1,620 (DW-1142).
4. **Unmapped lines** rank last for the break. Unchanged.
5. **Hourly attachment on a day-rated wet or dry line** charges the line's worked hours net of the line's own break
   (9h with a 0.5h break = 8.5h). Examples: RL-02 day-rated wet 7:00-16:00 with a 0.5h break, breaker 8h x $40 +
   0.5h x $60 = $350 (DW-1211); EX-14 day-rated dry, breaker 8.5h x $40 = $340 (DW-1212). This is under Breaks
   Deducted; see 8 for Charged and 9 for the tier.
6. **The Breaks setting is versioned.** Switching it creates a calculator version with an effective-from date, like
   a rate change, with the same earliest effective-from rule; dockets dated before keep their break treatment.
   Example: Charged saved as a version effective 12/11/2026; DW-1101 (20 Oct) stays Deducted at $840, DW-1135
   (14 Nov) is Charged, wet $1,620, and DW-1145 (19 Nov) dry $570.
7. **Dry hire under Charged.** A dry-hire line's own break is charged too. Example: TP-03 7:00-13:00 with a
   0.5h break: Deducted 5.5h x $95 = $522.50, Charged 6h x $95 = $570 (DW-1145).

8. **Hourly attachment on a day-rated line under Breaks Charged** includes the line's own break; under Deducted it
   is net of the break (5). Example: RL-02 day-rated wet, weekday 7:00-16:00 (9h) with a 0.5h break, Breaker
   $40 / $60 / $80: Deducted 8h Standard + 0.5h 1.5x = $350, Charged 8h Standard + 1h 1.5x = $380 (DW-1211). The
   prototype applies the same rule to a day-rated dry line: EX-14 Deducted 8.5h x $40 = $340, Charged 9h x $40 = $360
   (DW-1212).
9. **Which tier the attachment's break comes off (day-rated wet line).** The highest tier first: 9h weekday with a
   0.5h break = 8h Standard + 0.5h 1.5x. Asserted on the tier split in DW-1211.

## Open questions

None open. Questions 1 and 2 from 2026-11-17 are answered by decisions 8 and 9 above.

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
