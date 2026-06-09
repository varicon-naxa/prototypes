# Scan a Quote → Purchase Order

Adds a **Scan a Quote** entry point to the Purchase Order page. Instead of keying a PO by hand, the user uploads (or photographs / forwards by email) a supplier quote. Varicon OCRs it, identifies the supplier, project and line items, and drops the user into a **pre-filled PO ready for review**.

## The flow

1. **PO list** — two entry cards sit above the table: the existing orange *Add Purchase Order* (manual) and a new dark *Scan a Quote* card marked ✨ AI.
2. **Scan modal** — drop a file, take a photo, pull from email, or try a sample. A scanning animation walks through the extraction steps (detect → supplier/project → line items → accounting codes).
3. **Review screen** — a normal PO form, pre-filled. High-confidence fields are **green**; anything uncertain (e.g. the project guess, or a line item with no accounting code) is **amber** so the user only reviews what matters. The original quote stays attached as the source document.

## Why

Creating POs is the most repetitive, error-prone part of the procurement flow, and a supplier quote already contains almost everything a PO needs. Scanning it turns minutes of manual data-entry into a quick confidence-led review, and keeps the source quote attached so approvers can verify against the original.

## Open questions / iterations

- **Confidence model** — what threshold flips a field from green to amber? Should low-confidence fields block submit, or just warn?
- **Project inference** — can we reliably guess the project from the quote, or should the user always pick it? (Shown as amber "Confirm" here.)
- **Accounting code matching** — auto-map line descriptions to codes vs. always ask. Row 3 demonstrates the "couldn't match, please pick" case.
- **Duplicate detection** — warn if a quote with the same reference number has already been turned into a PO.
- **Multi-page / multi-quote** — handling quotes that span pages or bundling several quotes into one PO.
