# Rejected Bill Reapproval

**Problem:** A rejected bill is currently a dead end. The only way forward is to "approve" it from the rejected bill's detail page — which is unintuitive and bypasses the approval workflow entirely. There's no way to send a rejected bill back through approval.

**Prototype:** From the **Rejected** tab, every bill gets a **Resubmit** action that opens a guided two-step modal:

1. **Step 1 — context + path.** Shows who rejected the bill and why (pulled forward so the fixer doesn't have to hunt for it), then a choice:
   - **Resubmit for reapproval** — straight back through the approver chain (issue resolved outside the bill, or after editing it).
   - **Apply credit now & resubmit** — record the supplier credit note (ref, amount, reason) against the bill first. The credit is *flagged in the reapproval*: approvers see original total → credit → adjusted amount payable.
2. **Step 2 — details.** Credit fields (credit path only), a required note to approvers, an **editable approval workflow**, and a live preview of exactly what approvers will see.

**Editable workflow + rejection suggestions:** when a bill was rejected for going to the wrong person, the rejecting approver can suggest who it should go to. The suggestion follows the bill everywhere — a `💡 Suggested → Priya Nair` chip on the Rejected tab, in the rejection context in the modal, and in the rejected-bill banner. In step 2 the workflow is editable (remove any approver, add from a people picker) with a one-click **Apply suggestion** that swaps the wrong approver for the suggested one. Changed approvers carry a green **NEW** tag in the workflow — in the modal, in the approver preview (`⇄ Workflow updated` chip), on the list row, and in the approver's detail view, where the timeline also records "Approval workflow updated — Priya Nair added, Jess Barton removed (as suggested by Jess Barton at rejection)". The workflow can't be emptied — at least one approver is required. Try it on the **Acme INV-0003** bill.

**Workflow state is visible everywhere:** approver chips and avatars carry status badges — ✓ approved, ✕ rejected (red-tinted chip), orange dot = reviewing now, dimmed = not reached. The Rejected tab has an Approvers column of mini avatars showing exactly where each bill's approval stopped (hover for names/status). The rejected bill detail shows the same stopped chain (e.g. Trent ✓ → Jess ✓ → Mike ✕), and the reject dialog itself shows an "Impact on approval workflow" strip making clear the rejection stops the chain until resubmission.

**The loop is fully closed on the approver side too:** rejecting from the approver view opens a proper reject dialog — required reason plus an optional "wrong approver? suggest who should approve this instead" picker. The bill cycles back to the Rejected tab carrying that suggestion, ready for the next resubmission (attempt numbers increment each cycle and show everywhere: list chips, detail badge, approver preview, timeline).

**Also available from the bill detail page:** clicking any rejected row opens the bill detail in its rejected state — a red rejection banner with **Resubmit for approval** as the primary action (replacing today's unintuitive bare "Approve"), plus an Edit bill option. It opens the same modal, and you land back on the detail page in its resubmitted state.

After resubmitting, the bill moves to **Awaiting Approval** with a `↻ Resubmitted · attempt 2` badge (plus a `🏷 Credit` chip if applicable). Click the resubmitted row to see the **approver's view**: a resubmission banner with rejection reason, credit details, resubmission note, adjusted totals (original struck through), and a full history timeline (created → submitted → rejected → credit applied → resubmitted → awaiting approval).

**Try it:** the 10march / 28501742 Kennards hire bill is the hero scenario — rejected because the supplier charged through a stand-down period, so use "Apply credit & resubmit" (e.g. CN-28501742, $291.57, "Charged during stand-down period").
