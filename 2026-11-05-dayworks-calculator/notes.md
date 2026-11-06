# Dayworks Calculator — 2026-11-05 (simplified 2026-11-06)

Prototype for Jira story VAR-23035 (epic VAR-23034). Single static `index.html`, no build.

Live: https://varicon-naxa.github.io/prototypes/2026-11-05-dayworks-calculator/

## What it shows

Three tabs on a project's Dayworks section (project "Riverside Rd Upgrade", NSW, last issued claim #3 on 25/10/2026).

1. **Dayworks Calculator.** Three rate sections: Labour rates, Wet hire, Dry hire. Rates belong to resources
   only. A Labour rates line is added by typing its name (the label on the client's schedule, e.g. "Supervisor")
   and selecting one labour resource from the catalogue (e.g. Foreman); a resource already on another line is
   refused with "<resource> is already on the <line name> line". Wet and dry lines are one per charge resource
   ("Excavator 20t wet", "Excavator 20t dry"). Four explicit tier rates prefilled at 1x / 1.5x / 2x / 2.5x of
   Standard and editable (overridden cells go amber and survive a later Standard change), minimum hours
   (default 4). An Unmapped banner at the top lists people with no labour resource or whose resource is on no
   line, and plant items with no wet or dry charge resource or whose resource has no line; each can be mapped
   from the banner. A "Who prices at what" panel shows every person's and plant item's rate line. The
   tier-trigger table with the ticket defaults, editable ("8", "rest" or blank per cell). Save asks for an
   effective-from date (default today) and rejects one before the last issued claim with the ticket's message.
   Version list; previous versions open read-only. The role switch in the top bar shows the read-only view.
   (History: the 05/11 first cut had a flat list with one "Applies to" dropdown over three mapping levels, then
   a per-hire-type tree with per-person and per-plant-item overrides. Alec simplified the ticket on 06/11 to
   resource-only mapping with named Labour rates lines, and the prototype follows.)
2. **Daywork dockets.** Line types Labour, Dry hire, Wet hire. Seeded with one docket per worked example. Each
   line shows the rate line name it priced at (e.g. "Supervisor"), its tier split (hours x rate per tier), top-up
   to the minimum, the midnight split where it applies, and the calculator version that priced the docket.
   Lines can be edited and added (labour = person, dry = plant item, wet = plant item + operator). A person or
   plant item on two lines with overlapping hours shows "<name> is already charged on the <line type> line for
   these hours" and Approve is disabled. An unmapped person or plant item prices at $0 and also blocks Approve.
3. **Worked examples.** Every example in VAR-23035 recomputed live from the same engine, with pass/fail against
   the stated number. All 15 pass (14 from the ticket plus a plant-overlap case).

## Open decisions this surfaced

1. **Minimum hours on a midnight-crossing docket.** The Friday 18:00 to Saturday 02:00 example totals $630, which
   only works if the 4h minimum is tested against the line's whole 8h, not the 2h Saturday part on its own.
   The prototype applies the minimum per docket line. The rule text says "per rate line per day"; confirm which.
2. **Minimum across two lines for the same person.** Sam on wet hire 7:00 to 12:00 and labour 12:00 to 16:00:
   is the minimum tested once against his combined 9h, or once per line? Both lines clear 4h in the example so it
   doesn't show. The prototype tests per line.
3. **Where the break comes off.** Break hours are deducted before tiering. On a midnight-crossing line the
   prototype deducts the break from the first day's part. The ticket doesn't say.
4. **Unmapped is per line type.** A plant item with a wet charge resource but no dry one is unmapped for dry hire
   (RL-03 in the seed is the reverse: dry only). The banner says which type. Confirm that is the intended reading
   of "not mapped to a resource with a rate".
5. **Dry hire per day.** The ticket allows "per hour or per day". The prototype has the unit switch and prices a
   per-day line as 1 day per calendar day worked. The minimum hours field is meaningless on a per-day line.
6. **Which line gets flagged.** On an overlap the prototype flags the later line in the docket and names the
   earlier line's type, so the message reads as in the ticket. If both lines are flagged in the real thing,
   the message needs rewording.
7. **Public holidays.** Taken from the project's state calendar (NSW here, so Labour Day 05/10/2026 is the PH
   example and Melbourne Cup day is not a holiday). Still one of the unconfirmed calls in the rules note.
8. **Mapping lives outside the version.** Mapping a person to a labour resource or a plant item to a charge
   resource from the Unmapped banner changes the worker or plant record, not the calculator version, so it is not
   dated. A docket on an old date will reprice if its person is mapped today. Confirm that is acceptable, or
   whether mapping should be versioned with the calculator.

## Not in the prototype

Upload of a schedule of rates (.xlsx/.csv) with column mapping; the Daywork Summary export; docket PDF; mobile view;
cost-plus margins; attachment and float charges; night-shift windows; conversion of dockets to variations and
claims (VAR-23036 / VAR-23037).
