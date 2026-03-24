# Delivery Dockets — Web Interface Redesign

## Problem
The current delivery docket list treats incomplete and complete dockets the same visually. Photo-captured dockets from mobile arrive with only a project assigned — no supplier, PO, or cost centre. These need to be processed by an admin but are hard to spot in the current view.

## What changed

- **Red "Needs Processing" banner** at top — shows count of unprocessed dockets with a "Process Now" button
- **Simplified tabs** — All, Complete, Needs Processing (with red badge) instead of confusing "Complete/Incomplete"
- **Visual differentiation** — incomplete rows have pink background, missing fields shown as red "✕ Unassigned" tags, assigned fields as green "✓" tags
- **"Process →" action link** on each incomplete row — direct click to open and process
- **Unknown supplier warning** — orange badge on image thumbnail when OCR couldn't identify the supplier
- **Simplified columns** — removed Task/Cost Centre split (just Cost Centre), removed separate status and bills columns

## Why
Mobile users capture dockets as photos with minimal data. These pile up and need admin processing. The redesign makes unprocessed dockets impossible to miss and provides a clear path to work through them.
