# Dayworks billing: dockets to variations and progress claims

Clickable static prototype, built 2026-11-12, for:

- **VAR-23036** Convert daywork dockets into a variation (main spec)
- **VAR-23037** Convert daywork dockets into a progress claim (main spec)
- **VAR-23062** Not claimable and **VAR-23063** Send back (how the pickers treat those dockets)
- **VAR-23035** Dayworks Calculator (where docket values come from)

Live: https://varicon-naxa.github.io/prototypes/2026-11-12-dayworks-billing/

Files: `index.html` (shell and styles, same look as the 2026-11-05 calculator prototype), `engine.js` (calculator pricing, docket, variation and claim rules), `app.js` (screens), `scenarios.js` (worked examples). State is held in memory and resets on reload.

## What it shows

One project, Riverside Rd Upgrade (NSW), runs 20 Oct to 16 Nov 2026. It is priced with the VAR-23035 "Project A" calculator (Leading Hand $70, Excavator 20t wet $180, Breaker 1t $40, Excavator float $450 and so on).

- **Daywork dockets**: Draft, Submitted, Approved, Rejected and Not claimable dockets. A "Sent back" marker shows on D107. The "On variation V-nnn" and "On claim C-nnn" markers open the record. Each row shows the calculator value with the version that priced it. Dockets on an approved variation or issued claim show a lock and their frozen value; if the calculator has since moved, the row also shows "live calc $x, not applied". D104 (Overlap: EX-07) and D206 (Unmapped: Tool allowance) cannot be approved. Open a docket to:
  - edit its hours
  - remove a line or an unmapped allowance, which fixes it
  - approve it, have the client reject it, or send it back (reason and note, Other needs a note)
  - mark it Not claimable or reopen it
  
  A docket on a variation or claim refuses Send back and Not claimable with "Remove this docket from ... first".
- **Variations**: "Add dockets to variation" opens the picker:
  - dockets are listed oldest first
  - Not claimable and already-used dockets are hidden
  - Draft and Submitted dockets are amber and can be ticked
  - Rejected, unmapped and overlapping dockets are red, show the reason and cannot be ticked

  You can create a new variation or add to an unsubmitted one (V-013, V-015). Each docket becomes one line at its full calculator value. The project's cost-plus margins are shown, and a "docket calculator value" column next to "line value" shows that no margin is added. Submitting warns "n dockets not yet approved" and records the decision. The variation shows its submitted and approved amounts, and approval moves the contract sum. Until approval, lines and the submitted amount follow their dockets and are flagged "changed since added" with the old and current values. Approving locks the dockets. Reject, withdraw and remove all release dockets.
- **Progress claims**: "Create claim from dockets" defaults to the next claim period after C-003. Dockets dated in the period are pre-ticked. Older unclaimed ones (D095, 25 Oct) are listed unticked. The picker follows the same highlight rules, and dockets on a variation are never offered. Approved variations (V-012) come onto the claim as variation lines. BOQ quantities can be entered alongside the docket lines. Retention is 5% and GST 10%. Docket lines follow their dockets and are flagged until the claim is issued. Issuing warns with the unapproved count, then locks the claim. Use "Late docket arrives" to see a docket dated in an issued period roll onto the next claim.
- **Simulation controls** (dark bar on every tab):
  - set today's date
  - publish a new calculator version: pick a rate line, a new Standard rate and an effective date (refused if the date is before the last issued claim)
  - inject a late docket
  - reset the demo

  Every live line or submitted amount that moves is written to the feed in amber. Each publish also checks every approved variation and issued claim and reports "all unchanged".
- **Scenarios**: every worked example from VAR-23036 (11) and VAR-23037 (10) runs on a fresh project through the same engine, plus 4 extra rule checks (late docket, Not claimable, Send back, releases). **25/25 pass (worked examples 21/21).** Each scenario can load its end state into the screens.

Demo starting state: V-012 approved (D201); V-013 and V-015 unsubmitted; V-014 submitted with three dockets (reject it to see the release); V-016 submitted at $5,000 with D209, D210 and D211 (publish Leading Hand $75 from 01/11/2026 to see D209 go to $900 and the submitted amount to $5,060, both flagged); C-003 issued 31/10/2026.

## Open decisions

1. While an **Approved** docket sits on an unsubmitted variation or a draft claim, can its hours still be edited? If so, does the edit send it back to Submitted, or does it stay Approved? The prototype allows the edit and keeps it Approved.
2. If a docket that is already on a variation or draft claim is **rejected by the client** through the docket email, what happens? Does it stay on the record (counted as unapproved in the warning), get removed automatically, or block submit and issue? The prototype keeps it on and counts it as unapproved.
3. If a docket on a variation or draft claim is **edited into an unapprovable state** (a new unmapped item or an overlap), does it stay on the record? Does it block submit and issue? The save-time rule in the spec only covers adding a docket.
4. The calculator's effective-from floor only looks at the **last issued claim**. Approved variations are protected only because their values are frozen. Should the floor also respect the latest approved variation, or is the freeze enough?
5. Is an approved variation **claimed in full on the next claim**, or by percent complete the way variations are claimed today? The prototype claims 100% of the approved amount on the earliest draft claim.
6. If there are **two draft claims** at once, which one gets the approved variation lines?
7. Can the client **approve a different amount** from the submitted amount? If so, how do the docket lines reconcile to it? The prototype allows a different approved amount and leaves the lines at their values.
8. When the submitted amount of a submitted variation **changes**, is the client told (a new revision or PDF)? Does anything clear the "changed" flag before approval?
9. Is **Withdraw** on an unsubmitted variation the same as deleting it? The prototype allows Withdraw from both Draft and Submitted.
10. Should dockets dated **after the claim period** be listed in the claim picker? The spec covers in-period (pre-ticked) and older (unticked) dockets only. The prototype lists later ones unticked and tags them "after period".
11. Should **Draft dockets the field never submitted** (including sent-back ones) be tickable onto a variation or claim? The spec says "draft and submitted-but-unapproved". The prototype allows them and counts them in the "not yet approved" warning.
12. After approval or issue, should the "changed since added" history **stay visible** on the record? The prototype drops the flag and shows a muted "added at $x, frozen at approval".
13. **Mobilise charges** are worked out from a machine's first appearance on the project (VAR-23035). If the docket that carries a mobilise charge is marked Not claimable or rejected, does the charge move to the machine's next docket? The prototype stores float charges as explicit docket lines, so this is not modelled.
14. **Retention and GST order**: the prototype takes retention off the gross ex GST and charges GST on the net. Does that match the existing claim maths, which this is meant to reuse unchanged?

## Not covered

- Lines that cross midnight and break start times. Calculator editing (that is the 2026-11-05 calculator prototype). Named-assignment editing. Allowance threshold prompts. Per-day dry hire.
- Variation and claim PDFs, the Daywork Summary export, invoicing from claims, the Budget Overview, and PostHog events.
- Roles and permissions: everything runs as a project manager. Mobile and Timesheet app views, and the push notification on send-back.
- The existing unapprove path for approved dockets. Variations not built from dockets. Claiming BOQ to date (only "qty this claim" is shown). C-001 and C-002.
- Persistence and multiple projects. The tenant feature flag.
