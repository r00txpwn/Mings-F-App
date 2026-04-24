## QA → Cursor result

**Status:** pass

**Summary**

Second-pass QA passed on a confirmed local preview (`build-meta.json` matched repo `HEAD`). Menu Editor tab hidden for `staff@mings.az`; bottom nav uses `grid-cols-2`; no Menu Editor control in DOM.

**Scenarios**

- [x] Scenario 1 — Staff bottom nav: two tabs only, no Menu Editor — pass
- [x] Scenario 2 — Admin/manager three-tab layout — pass (prior session / same bundle where applicable)
- [x] Scenario 3 — Staff Active ↔ Past switching — pass

**Evidence**

- Environment: `http://127.0.0.1:4175/order-manager` with verified build
- Console: Vercel analytics script error in local preview only (pre-existing)
- Network: none blocking MIN-9

**Next action for Cursor**

- None — ready to merge per team process.
