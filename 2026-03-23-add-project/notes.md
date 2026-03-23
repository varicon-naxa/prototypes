# Add Project — Improved Form

## Problem
The current Add Project form shows all fields at once with no defaults, making it slower to use and easier to miss critical fields.

## What changed

- **Job Number** auto-fills with the next in sequence (e.g. VAR-012), removing a manual step
- **Removed fields** that aren't needed at creation time: Contract Number, Purchase Order Number, Segment, Status (always Active for new projects)
- **Xero Tracking Category** is now mandatory and blocks other fields until selected — ensures accounting is set up correctly from the start
- **Start Date** defaults to today; End Date shows a calculated project duration underneath
- **Client Details** now includes a Client Contact dropdown (appears after selecting a client) with a "+ Add New Contact" option
- **Payment Act** auto-sets based on the State selected in the Job Address (green confirmation shown)
- **Resource Cost Sheet** removed from this form — handled during onboarding setup instead
- **Assign Cost Centre** moved below Estimation Sheet with an explanation that it's only needed if not uploading an estimation sheet
- **Job Address** uses an autocomplete that auto-fills Suburb, State, and Postcode
- **AI BOQ upload** banner promotes the estimation sheet upload with a clear call-to-action

## Why
Fewer fields + smarter defaults = faster project creation with fewer errors. Critical fields (Tracking Category, Payment Act) are enforced rather than optional.
