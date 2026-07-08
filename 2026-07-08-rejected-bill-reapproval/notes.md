# Rejected Bill Reapproval

**Problem:** A rejected bill is currently a dead end. The only way forward is to "approve" it from the rejected bill's detail page — which is unintuitive and bypasses the approval workflow entirely. There's no way to send a rejected bill back through approval.

**Prototype:** From the **Rejected** tab, every bill gets a **Resubmit** action that opens a guided two-step modal:

1. **Step 1 — context + path.** Shows who rejected the bill and why (pulled forward so the fixer doesn't have to hunt for it), then a choice:
   - **Resubmit for reapproval** — straight back through the approver chain (issue resolved outside the bill, or after editing it).
   - **Apply credit now & resubmit** — record the supplier credit note (ref, amount, reason) against the bill first. The credit is *flagged in the reapproval*: approvers see original total → credit → adjusted amount payable.
2. **Step 2 — details.** Credit fields (credit path only), a required note to approvers, the approval workflow (restarts from the first approver), and a live preview of exactly what approvers will see.

After resubmitting, the bill moves to **Awaiting Approval** with a `↻ Resubmitted · attempt 2` badge (plus a `🏷 Credit` chip if applicable). Click the resubmitted row to see the **approver's view**: a resubmission banner with rejection reason, credit details, resubmission note, adjusted totals (original struck through), and a full history timeline (created → submitted → rejected → credit applied → resubmitted → awaiting approval).

**Try it:** the 10march / 28501742 Kennards hire bill is the hero scenario — rejected because the supplier charged through a stand-down period, so use "Apply credit & resubmit" (e.g. CN-28501742, $291.57, "Charged during stand-down period").
