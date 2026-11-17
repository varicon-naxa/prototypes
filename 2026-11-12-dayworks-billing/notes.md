# Dayworks billing: dockets to variations and progress claims

Clickable static prototype. Built 2026-11-12, updated 2026-11-16 to match the tickets as Alec rewrote them that day, then again with his answers to the eight open questions (also 2026-11-16, written into both tickets), then with two more product decisions of 2026-11-16 and five of 2026-11-17 (one superseding another) (see Decided below):

- **VAR-23036** Convert daywork dockets into a variation (main spec)
- **VAR-23037** Convert daywork dockets into a progress claim (main spec)
- **VAR-23062** Not claimable and **VAR-23063** Send back (how the pickers treat those dockets)
- **VAR-23035** Dayworks Calculator (where docket values come from, and the effective-from floor)

Live: https://varicon-naxa.github.io/prototypes/2026-11-12-dayworks-billing/

Files:
- `index.html`: shell and styles, same look as the 2026-11-05 calculator prototype.
- `engine.js`: calculator pricing, docket, variation and claim rules.
- `app.js`: screens.
- `scenarios.js`: the worked examples.

State is held in memory and resets on reload.

## What it shows

One project, Riverside Rd Upgrade (NSW), runs 20 Oct to 16 Nov 2026. It is priced with the VAR-23035 "Project A" calculator (Leading Hand $70, Excavator 20t wet $180, Breaker 1t $40, Excavator float $450 and so on). No seeded line crosses midnight; night shift is not in this release, and an edit that would cross midnight is refused.

- **Daywork dockets**: Draft, Submitted, Approved, Rejected and Not claimable dockets. D107 has a "Sent back" marker.
  - The "On variation V-nnn" and "On claim C-nnn" markers open the record.
  - Each row shows the calculator value and the calculator version that priced it.
  - Dockets on an approved variation or issued claim show a lock and their frozen value. If the calculator has moved since, the row also shows "live calc $x, not applied".
  - Open a docket to edit hours or a start time, add an allowance (Tool has no calculator line, so adding it makes the docket unmapped), or remove a line or allowance.
  - From the same screen you can approve, have the client reject, send back, mark Not claimable or reopen.
  - **Any edit to an Approved docket returns it to Submitted** for re-approval: on a draft claim, on an unsubmitted or submitted variation, or on no record. On a record its line is flagged "edited, back to Submitted".
  - **A docket the client rejects, or one edited into an unmapped item or an overlap, stays on its record.** The line is flagged in red with the reason. It blocks variation submit and approve, and claim issue, until it is fixed (resubmitted, or the line or allowance removed) or taken off the record.
- **Variations**: "Add dockets to variation" opens the picker:
  - dockets are listed oldest first
  - Not claimable and already-used dockets are hidden
  - Draft (including sent back) and Submitted dockets are amber and can be ticked
  - Rejected, unmapped and overlapping dockets are red, show the reason and cannot be ticked

  The rules on a variation:
  - **Lines.** Each docket becomes one line at its full calculator value, with no margin.
  - **Submitting** with unapproved dockets warns and records the decision.
  - **Until approval,** lines follow their dockets and show "changed since added".
  - **When a submitted variation's amount or dockets change,** it shows **"Changed since submitted"** and a **"Send new revision"** button. Sending a revision records it and clears the prompt.
  - **Approving while "Changed since submitted" shows is allowed.** The approval dialog warns that the client saw an earlier amount, and the warning is recorded on the variation and in its history. The approved amount defaults to the current lines total ($5,060), not the amount last submitted ($5,000).
  - **"Client approved" can take a different amount.** The docket lines keep their values and the difference is held as **one adjustment**. Less than submitted: it must be marked Absorbed, Under dispute or To resubmit before approval saves ("To resubmit" records the status only). More than submitted: no status needed. The contract sum moves by the approved amount.
  - **Approval** locks the dockets and clears the line flags.
  - **Withdraw,** from unsubmitted or submitted, keeps the variation on the register as **Withdrawn**, with its history, and releases its dockets. A client rejection releases its dockets the same way.
  - **Removing a docket.** Any docket can be removed from an unsubmitted or a submitted variation, and is released. Removal from a submitted one marks it "Changed since submitted" and prompts a new revision.
  - **History.** Every variation keeps a history table of every line change, with old and new values.
- **Progress claims**: "Create claim from dockets" defaults to the next claim period after C-003.
  - **Picker.** Dockets dated in the period are pre-ticked. Older unclaimed dockets (D095) and later ones (D217, 16 Nov) are listed unticked. The picker follows the same highlight rules. Dockets on a variation are never offered.
  - **Approved variations** are picked in the same dialog, ticked by default. They are claimed **by percent complete to date, 100% by default**, and the percent can be edited on the claim, from 0% to 100%. Each claim charges the change since the last issued claim (60% on one claim, then 100% on the next, charges the remaining 40%). A lower percent than the last issued claim is allowed and the drop is charged as a **credit** (negative) line (60%, then 40%, charges minus 20% of the approved amount). A variation claimed to 100% on an issued claim is still offered on later claims, **unticked** by default and marked "fully claimed", so it can be credited back. A variation on one draft claim is not offered on another. Create a second draft claim to see "On draft claim C-004; not offered here".
  - **BOQ quantities** can be entered alongside the docket lines.
  - **Retention 5% and GST 10%** are labelled "as existing claims". Retention comes off the gross ex GST and GST is charged on the net.
  - **Negative claim.** When credit lines take a claim below zero it can still be issued, as a negative claim. Retention and GST are calculated the same way and go negative; a banner on the claim says so. The totals show the retention row as "Retention returned" with a negative amount, noted "Retention follows Varicon's existing retention rules."
  - **Credit note.** An issued negative claim is labelled "Sent to accounting as a credit note" (banner on the claim and a "credit note" pill in the register). Invoicing itself is not in the prototype.
  - **Until issue,** docket lines follow their dockets and are flagged. Issuing warns with the unapproved count, then locks the claim and clears the flags. The history table keeps every change.
- **Simulation controls** (dark bar on every tab):
  - set today's date
  - inject a late docket
  - reset the demo
  - publish a new calculator version. Pick a rate line, a new Standard rate and an effective date. A date before the later of the last issued claim and the last approved variation is refused; in the demo that date is 04/11/2026, from V-012.

  Every live line or submitted amount that moves is written to the feed in amber. Each publish also checks every approved variation and issued claim and reports "all unchanged".
- **Scenarios**: every worked example in VAR-23036 (15) and VAR-23037 (15), plus one for the 2026-11-16 credit decision and two for the 2026-11-17 decisions, runs on a fresh project through the same engine. **33/33 pass.** Each scenario can load its end state into the screens.

Demo starting state:
- **V-012** approved (D201).
- **V-013** unsubmitted.
- **V-015** unsubmitted, holding Approved D208. Edit D208's hours to see it return to Submitted.
- **V-014** submitted with three dockets. Reject it to see the release.
- **V-016** submitted at $5,000 with D209, D210 and D211. Publish Leading Hand $75 from 05/11/2026: D209 goes to $900 and the amount to $5,060, with "Changed since submitted" and "Send new revision". Approve it without sending the revision to see the recorded warning, or remove any docket to see the revision prompt.
- **V-017** submitted with D215 (Submitted) and D216. Open D215 and use "Client rejects" to see V-017 blocked.
- **C-003** issued 31/10/2026.

## Decided (2026-11-16)

1. **Approving while "Changed since submitted" shows.** The approved amount defaults to the current total ($5,060
   for V-016), not the $5,000 the client last saw. The approval dialog prefills it and the "V-016 approved while
   changed since submitted" scenario asserts it.
2. **Lower percent to date on a later claim.** Allowed. The drop below the percent on the last issued claim is
   charged as a credit (negative) line. Scenario: V-012 ($5,060) at 60% on an issued claim, then 40% on the next
   claim, charges minus 20%, -$1,012. "Already claimed" is now the percent on the latest issued claim that carries
   the variation (it was the highest percent on any issued claim).

## Decided (2026-11-17)

1. **Credit on a fully claimed variation.** A variation claimed to 100% on an issued claim is still offered on later
   claims, unticked by default, so it can be credited back. Added at 100% it charges $0; lowering the percent charges
   the credit. Scenario: V-012 ($5,060) at 100% on issued C-003, offered unticked on C-004, then 80% charges -$1,012.
2. **Negative claim.** A claim with a negative total can be issued as a negative claim. Retention and GST are
   calculated the same way and go negative. Scenario: V-012 credited from 100% to 40% with no other lines: gross
   -$3,036, retention 5% -$151.80, net -$2,884.20, GST 10% -$288.42, total -$3,172.62, and the claim issues.

3. ~~**Negative retention is capped at the retention held to date.**~~ **Superseded 2026-11-17** by decision 5. The
   cap, the retention-held tracking, the "retention released" figure and the $30-held cap scenario were removed.
4. **Negative claim to the accounting system.** A negative claim goes to Xero or MYOB as a credit note. Invoicing is
   not in the prototype; an issued negative claim shows "Sent to accounting as a credit note", asserted in the
   negative-claim scenario.
5. **Retention rules (2026-11-17, supersedes 3).** "For all retention rules we will be using what already exists in
   Varicon". Retention on every claim, a negative claim included, is the project's retention % of the gross, as on
   any claim, with no cap. Scenario: the negative-claim scenario above (retention -$151.80) asserts no cap logic. On a
   negative claim the totals row reads "Retention returned 5%", shown negative, noted "Retention follows Varicon's
   existing retention rules."

## Not covered

- Pricing detail from VAR-23035:
  - hours tiered across a person's dockets on the same day, and overlaps across dockets (both are per docket here)
  - day-rated wet and dry hire
  - threshold allowances added automatically
  - Reprice or Keep on a mapping change
- Calculator editing: that is the 2026-11-05 calculator prototype. Named-assignment editing.
- Variation and claim PDFs, the Daywork Summary export, invoicing from claims, the Budget Overview, and PostHog events.
- Roles and permissions: everything runs as a project manager. Mobile and Timesheet app views. The push notification on send-back.
- The existing unapprove path for approved dockets. Variations not built from dockets. Claiming BOQ to date (only "qty this claim" is shown). C-001 and C-002.
- Persistence and multiple projects. The tenant feature flag.
