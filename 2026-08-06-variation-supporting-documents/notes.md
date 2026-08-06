# Variation supporting documents

**Ticket:** [VDP-1709](https://varicon.atlassian.net/browse/VDP-1709) · Epic: [Varicon Quick Wins (VDP-1707)](https://varicon.atlassian.net/browse/VDP-1707)

**Live:** https://varicon-naxa.github.io/prototypes/2026-08-06-variation-supporting-documents/

## Problem

A variation can be created, submitted and approved with no way to attach the evidence behind it. There is no drop zone on the Add Variation screen, and no way to add files to a variation after it exists.

Variations are commercial claims. The justification — site photos, screenshots, PDFs of client emails approving the change, marked-up drawings, supplier quotes — ends up in File Manager, in someone's inbox, or on a shared drive. So the variation record on its own doesn't support the claim, and when one gets queried or disputed, whoever picks it up has to go hunting.

## What the prototype shows

Two flows, switched from the top right:

**A · Create** — a Supporting Documents section on the Add Variation screen. Files dropped are held against the draft and committed on Save Variation.

**B · Existing** — the actual navigation path, walkable end to end:

**Fastest path — drop straight onto the register row, no navigation at all:**

```
Project  ›  Variation Register  ›  drag the file onto the row  ›  done
```

Dragging a file over the register arms every row (left edge marker + "Drop onto the variation you want to attach to" banner); the row under the cursor highlights and labels itself *⇪ drop to attach here*. Dropping attaches to that variation, shows an uploading state in its Documents cell, and confirms with a toast naming the variation — you never leave the register. The row's **⇪ add** link does the same via a file browser, for anyone not dragging.

This matters because filing evidence is usually a batch job: you come back from site or clear your inbox with several things to file across several variations. Opening each variation to attach one PDF is the slow path.

**Longer path, when you want to review what's there:**

```
Project  ›  Variation Register  ›  click 📎 on the row  ›  documents page opens in place
Project  ›  Variation Register  ›  click the row  ›  variation opens  ›  press Documents
```

No new navigation is introduced — the register row is already the way into a variation. Click either row in the register to walk it. The register also gains a **Documents** column, so it's visible at a glance which variations are backed by evidence and which are bare. `v1` starts with evidence, `v2` is bare, and attaching to one updates its count on the register.

Both flows keep today's layout above the new section — the fields, amounts and COST/CONTRACT tabs are unchanged.

## Engineering notes on the register drop

- Row drop targets only arm for **file** drags (`dataTransfer.types` contains `Files`), so dragging text or a UI element doesn't light up the table.
- Drops that miss a row are swallowed at the view level — otherwise the browser navigates away to the dropped file, which looks like a crash.
- The row drop handler stops propagation so a file can't be attached twice by the same drop.
- Rejected files (wrong type, over the size cap) are still reported on a register drop — the toast says how many were rejected rather than silently dropping them. A drop of only rejected files must not read as success.
- The Documents cell derives its own uploading state from whether any attachment is still in flight. Callers must not set that class themselves — the render function rewrites `className` and would wipe it. (This was a real bug in the first cut of this screen.)

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

**One button on the variation screen; everything else on its own page.** The only addition to the variation screen is a **Documents** button in the header strip, carrying a count. Pressing it opens a documents page for that variation holding the upload area and what's already attached. The variation screen stays as dense as it is today — no drop zone competing for space on it.

Two earlier passes were rejected on the way here:

- *A third tab beside COST/CONTRACT* — those tabs are the cost breakdown; evidence isn't part of it.
- *An always-visible drop zone section below the cost table* — took a lot of vertical room on a screen that's already dense, for something you only interact with occasionally.

The count on the button is what keeps evidence visible at a glance without putting the upload UI on the screen.

**Files and linked forms are separate lists.** On the documents page, uploaded files sit under **FILES** and linked form submissions under **LINKED VARICON FORMS**, each with its own count. Mixing them into one list makes it ambiguous what's a stored copy and what's a live link — and the actions differ (Remove vs Unlink).

**One save button.** The first pass had a duplicate Save Variation in a footer bar. Saving happens top-right only, as it does today.

**Documents column on the register.** Not in the original request, but it's what makes the feature visible before you open a variation — a bare variation is the risk, and the register is where you'd spot it.

**Attachments belong to the variation, not a revision.** The Revision field is free text today, not structured versioning, so files simply persist and editing Revision doesn't affect them. If structured revisions arrive later, revisit whether attachments should be pinned per revision.

## Still open (see ticket)

- Permissions — who can add, who can delete, and should attachments lock once the variation is Approved / Partial Approved? The prototype deliberately allows upload on a Partial Approved variation, since that's exactly when a claim gets queried.
- File size and type limits — the prototype uses 25 MB and a common type list; should match whatever File Manager already enforces.
- Client visibility — internal-only for now, or ever surfaced to the client?
- Whether Claims has the same gap and should get the same pattern.

## Engineering note

The project already has a File Manager tab and file-storage infrastructure. Preference is to reuse that upload/storage path rather than build a parallel one — worth confirming before estimating.
