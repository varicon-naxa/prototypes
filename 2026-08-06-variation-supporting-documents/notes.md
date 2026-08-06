# Variation supporting documents

**Ticket:** [VDP-1709](https://varicon.atlassian.net/browse/VDP-1709) · Epic: [Varicon Quick Wins (VDP-1707)](https://varicon.atlassian.net/browse/VDP-1707)

**Live:** https://varicon-naxa.github.io/prototypes/2026-08-06-variation-supporting-documents/

## Problem

A variation can be created, submitted and approved with no way to attach the evidence behind it. There is no drop zone on the Add Variation screen, and no way to add files to a variation after it exists.

Variations are commercial claims. The justification — site photos, screenshots, PDFs of client emails approving the change, marked-up drawings, supplier quotes — ends up in File Manager, in someone's inbox, or on a shared drive. So the variation record on its own doesn't support the claim, and when one gets queried or disputed, whoever picks it up has to go hunting.

## What the prototype shows

Two screens, switched from the top right:

1. **Create** — a Supporting Documents tab on the Add Variation screen. Files dropped are held against the draft and committed on Save Variation.
2. **Existing** — the same section on an already-created variation (VAR011 v1, Partial Approved), reached from the Variation Register. Also shows a **Documents** column on the register itself, so it's visible at a glance which variations are backed by evidence and which are bare.

Both screens keep today's layout above the new section — the fields, amounts and COST/CONTRACT tabs are unchanged.

## Interactions that actually work

The drop zones are real, not mocked images:

- **Drop real files** — images get a genuine thumbnail and a click-to-zoom preview via `URL.createObjectURL`
- **Upload progress** — simulated per-file progress bar, so the in-flight state is visible
- **Reject state** — drop a file over 25 MB or an unsupported type (e.g. `.exe`) to see the rejection treatment
- **Use example files** button on the Create screen, for when there's nothing handy to drag in
- **Attach Varicon form** — searchable picker of form submissions; already-linked ones are greyed out
- **Remove** — with a note that the action is recorded

## Design decisions worth reviewing

**Forms are linked, not uploaded.** The picker selects an existing form submission and the link stays live (marked with a `LIVE LINK` pill), so opening it from the variation reaches the submission itself rather than a frozen PDF copy taken at attach time. This is the more useful behaviour but a bigger build than plain file upload — it may deserve splitting into its own ticket.

**A new tab rather than a new page.** Supporting Documents sits alongside COST and CONTRACT with a count badge, so it's discoverable without adding navigation. Alternative considered: a section stacked below the cost table. The tab keeps the screen short and matches where users already look.

**Documents column on the register.** Not in the original request, but it's what makes the feature visible before you open a variation — a bare variation is the risk, and the register is where you'd spot it.

**Attachments belong to the variation, not a revision.** The Revision field is free text today, not structured versioning, so files simply persist and editing Revision doesn't affect them. If structured revisions arrive later, revisit whether attachments should be pinned per revision.

## Still open (see ticket)

- Permissions — who can add, who can delete, and should attachments lock once the variation is Approved / Partial Approved? The prototype deliberately allows upload on a Partial Approved variation, since that's exactly when a claim gets queried.
- File size and type limits — the prototype uses 25 MB and a common type list; should match whatever File Manager already enforces.
- Client visibility — internal-only for now, or ever surfaced to the client?
- Whether Claims has the same gap and should get the same pattern.

## Engineering note

The project already has a File Manager tab and file-storage infrastructure. Preference is to reuse that upload/storage path rather than build a parallel one — worth confirming before estimating.
