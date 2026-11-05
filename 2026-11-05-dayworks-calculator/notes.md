# Dayworks Calculator — 2026-11-05

Prototype for Jira story VAR-23035 (epic VAR-23034). Single static `index.html`, no build.

Live: https://varicon-naxa.github.io/prototypes/2026-11-05-dayworks-calculator/

## What it shows

Three tabs on a project's Dayworks section (project "Riverside Rd Upgrade", NSW, last issued claim #3 on 25/10/2026).

1. **Dayworks Calculator.** Rate lines with hire type (Labour / Dry / Wet), four explicit tier rates prefilled at
   1x / 1.5x / 2x / 2.5x of Standard and editable (overridden cells go amber and survive a later Standard change),
   minimum hours (default 4), and the mapping level of each line (hire-type default, role or charge resource,
   specific plant item or person). An Unmapped banner at the top. The tier-trigger table with the ticket defaults,
   editable ("8", "rest" or blank per cell). Save asks for an effective-from date (default today) and rejects one
   before the last issued claim with the ticket's message. Version list; previous versions open read-only.
   The role switch in the top bar shows the read-only view for site supervisor / site engineer.
2. **Daywork dockets.** Seeded with one docket per worked example. Each line shows its tier split (hours x rate per
   tier), top-up to the minimum, the resolved rate line and its level, the midnight split where it applies, and the
   calculator version that priced the docket. Lines can be edited and added (labour = person, dry = plant item,
   wet = plant item + operator). A person or plant item on two lines with overlapping hours shows
   "<name> is already charged on the <hire type> line for these hours" and Approve is disabled.
3. **Worked examples.** Every example in VAR-23035 recomputed live from the same engine, with pass/fail against the
   stated number. All 15 pass (13 from the ticket plus a plant-overlap case and an unmapped case).

## Open decisions this surfaced

1. **One rate per person, or one per hire type?** The ticket prices Sam at $80 as a wet-hire operator and $85 on a
   labour-hire line. Those can't both hold if a person has one rate. The prototype gives a person an optional
   wet-hire "Operator" rate line that wins over their labour-hire person rate; without one, the operator prices
   through the labour-hire chain (person > role > labour default). Decide which model the story means.
2. **Minimum hours on a midnight-crossing docket.** The Friday 18:00 to Saturday 02:00 example totals $630, which
   only works if the 4h minimum is tested against the line's whole 8h, not the 2h Saturday part on its own.
   The prototype applies the minimum per docket line. The rule text says "per resource per day"; confirm which.
3. **Minimum across two lines for the same person.** Sam on wet hire 7:00 to 12:00 and labour hire 12:00 to 16:00:
   is the minimum tested once against his combined 9h, or once per line? Both lines clear 4h in the example so it
   doesn't show. The prototype tests per line.
4. **Where the break comes off.** Break hours are deducted before tiering. On a midnight-crossing line the
   prototype deducts the break from the first day's part. The ticket doesn't say.
5. **What counts as Unmapped.** The prototype lists a plant item as unmapped when it has no dry-hire rate even
   though the wet-hire default covers it (RL-03, WC-04 in the seed), because a dry-hire docket on it would price
   at $0. Decide whether Unmapped is per hire type or "no rate for anything".
6. **Dry hire per day.** The ticket allows "per hour or per day". The prototype has the unit switch and prices a
   per-day line as 1 day per calendar day worked. The minimum hours field is meaningless on a per-day line.
7. **Which line gets flagged.** On an overlap the prototype flags the later line in the docket and names the
   earlier line's hire type, so the message reads as in the ticket. If both lines are flagged in the real thing,
   the message needs rewording.
8. **Public holidays.** Taken from the project's state calendar (NSW here, so Labour Day 05/10/2026 is the PH
   example and Melbourne Cup day is not a holiday). Still one of the unconfirmed calls in the rules note.

## Not in the prototype

Upload of a schedule of rates (.xlsx/.csv) with column mapping; the Daywork Summary export; docket PDF; mobile view;
cost-plus margins; attachment and float charges; night-shift windows; conversion of dockets to variations and
claims (VAR-23036 / VAR-23037).
