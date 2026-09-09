# Historical White Desert HOME contracts

These tests assert the previously approved White Desert HOME: polar globe,
CPT–WFR bridge, old trip/camp counts, original quote geometry, and retired menu.
Those requirements were replaced by the ADELVA implementation in September 2026.
They are preserved here as historical evidence, not reported as current passes.

Current replacements are `tests/revision/site.spec.ts`, `tests/home-refresh`,
`tests/approach`, `tests/e2e/home-footer.spec.ts`,
`tests/e2e/global-shell-clone.spec.ts`, and `tests/e2e/who-we-support.spec.ts`.
Unchanged legacy routes remain in the active e2e suite. The external White Desert
reference corpus and comparators remain intact and separate from the new contact
reference comparator. This migration does not change any old screenshot to make
it pass against a different product.
