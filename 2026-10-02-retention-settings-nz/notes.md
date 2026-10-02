# Retention settings: NZ stepped retention + deduct from invoice

The project **Retention Settings** modal, extended for two stories. Use the switch at the top to
see what an Australian tenant and an NZ tenant each get.

**Deduct Retention from Invoice** (VAR-22037): every tenant, AU and NZ. On by default, which is
today's behaviour (VDP-2251). Off invoices the full claim value; retention is still withheld and
recorded on the claim. Builds on `2026-09-04-retention-on-invoice` (VDP-2282).

**Stepped by value** (VAR-20740): NZ tenants only, behind the NZ feature flag (Base Civil, Ryal
Bush Transport). New NZ projects default to it, prefilled with the NZS 3910 default (10% to $200k,
5% to $1m, 1.75% above, $200k cap — still to confirm against the standard). Editable per project,
with a source label and Reset. Choosing it turns Merge Retention on.

The preview runs the band arithmetic on value certified to date (ex GST) and shows the ex-GST
invoice amount the deduct toggle produces. GST is added by Xero from the account code; the rate
shown is only illustrative.

VAR-20740 · VAR-22037 · VAR-22036
