# Onboarding Wizard — PO Settings, revisited

Standalone update of step 3 (Purchase Order Settings) from the 2026-03-23 onboarding wizard. Keeps the same wizard chrome (orange/navy aesthetic, horizontal stepper, sticky footer) but rebuilds the step itself around progressive disclosure and a richer approval-flow model.

## What's different from 2026-03-23-onboarding-wizard step 3

### Progressive disclosure within the step
The original step put General Settings + Approval Workflow on screen at the same time, both fully open. That's two competing forms with their own commit moments and two "primary" actions visible.

This rebuild splits the step into two stacked sections with state:
- **Active** — open, editable, has its own primary advance button
- **Locked** — body hidden, lock icon + a one-line preview of *what will be prefilled* so the user knows what's coming
- **Complete** — collapsed to a 1–2 line summary with a pencil to re-open

Section 2 (workflow) starts locked. Saving section 1 unlocks it. This means:
- Only one card is "active" at a time → only one primary button visible
- The page-level Continue stays disabled until both sections are done
- User can re-open completed sections via the pencil

### Approval is now opt-in via toggle
Section 1 has a `Require approval before sending` toggle (default ON). When OFF:
- Section 2 disappears entirely
- The page-level Continue activates immediately on section 1 save

This matches the toggle from the original General Settings panel but actually wires it to the workflow card's visibility instead of leaving the workflow card always-open below.

### Approval workflow model
Per-stage data shape now:
```
Stage = { approvers: string[], threshold: { kind: 'any' | 'under' | 'over', amount? } }
```

- **Multiple approvers per stage** — chips with X to remove (can't empty a stage). `+ Add approver` cycles through plausible defaults for the prototype.
- **Per-stage amount threshold** — clickable pill that expands to an inline editor (operator select + dollar amount). Pill shows dashed border + grey when `Any amount`, solid orange when a real threshold is set.
- **Prefilled defaults** — Senior Manager — Executive across all 3 stages with `Any amount`. The user can hit "Looks good" to accept without touching anything.

### "How approvals work" readme
Inline teaching card above the stage tiles. Explains:
- The 3 stages (Submit / Approve / Close) with one-line "what it does"
- The current default setup ("Senior Manager — Executive handles all three stages, on POs of any amount. Simple and safe.") — calibrates the user to what they have, not hypotheticals
- A `When you outgrow this →` collapsed disclosure that reveals the multi-approver / amount-band depth available later

This trains users on the concept *while it matches what's actually prefilled*, then signals depth without pushing it.

### Collapsed summary is amount-first
When section 2 is complete, the summary leads with the threshold (the *meaningful* configuration), not the role names:
- **Simple case** (one role, all `Any amount`): one line — `Any amount → Senior Manager — Executive · all 3 stages`
- **Varied case**: 3-row grid with stage label / threshold pill (orange when set) / approver

The role-name-led summary from the original always showed three names in a row; with one-role-everywhere setups that was repetitive. Threshold-led adapts to whatever the user has.

### Section 1 fields
Same set as the original General Settings:
- Prefix (dropdown of templates with `[JobNumber]` / `[ProjectName]` tokens)
- Suffix (number padding)
- Live PO preview block (dashed orange card showing the resolved sample)
- Default GST treatment
- Invoice email (required, blocks advance until set)
- Toggle group: Require approval / Track delivery status

Token legend below Prefix explains what `[JobNumber]` / `[ProjectName]` resolve to.

## Sticky footer
- 2px progress bar at the very top showing step 3/8 (~37.5%)
- Back / Skip for now / Continue
- ⌘↵ keyboard shortcut hint when Continue is enabled
- Cmd/Ctrl+Enter advances the active card or hits Continue when both sections are done

## Aesthetic
Matches 2026-03-23-onboarding-wizard:
- Orange `#f7941d` for primary actions and active states
- Navy `#1a1a2e` for the topbar and headlines
- Green `#4caf50` for done/checked steps
- System sans, light borders, soft shadows
- No external dependencies, single HTML file
