# Credit note detection on bill scan

**Problem:** Suppliers send credit notes through the same channels as invoices, so they end up in "Scan bills" / email bill entry. Today the scanner creates a bill from the credit note — double-counting cost, confusing approvers, and breaking the Xero sync. Meanwhile the original bill sits in **Awaiting Credit** with no link to the credit note that just arrived.

**Idea:** When the scanner classifies an uploaded document as a credit note, it:

1. **Rejects it** — no bill is created.
2. **Explains why**, showing the detection signals: "CREDIT NOTE" document heading, negative total, and a reference to an existing invoice number.
3. **Prompts the user to apply the credit manually to a bill**, suggesting bills in **Awaiting Credit** first. Match strength is shown per bill: referenced on the credit note › same supplier › marked awaiting credit. Other open bills from the same supplier are listed below.

Applying the credit pre-fills reference / date / amount from the scan, shows the adjusted amount payable, and moves the bill out of Awaiting Credit → Awaiting Payment.

**Escape hatch:** "Not a credit note? Create as bill anyway" for OCR misclassification, plus Discard.

**Try it:** click **Scan bills** → click the dropzone (simulates uploading 3 documents — 2 invoices, 1 credit note) → follow the rejection card's "Apply credit to a bill".
