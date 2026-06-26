## Cursor → QA handoff

**Status:** Supplier debt ledger rework + finance table grants fix applied on production. Frontend needs local preview / merge.

**Summary**

- **Suppliers screen:** dated manual debt entries (add/edit/delete), on-account purchases accrue automatically, lump-sum **Clear debt** payments reduce running balance, full history on expanded card.
- **Cash & Debt:** bank/friend loans (label: Lender / owed to) + bank withdrawals. Supplier debt stays on Suppliers.
- **Bug fix:** `permission denied for table liabilities` — finance tables now have correct `GRANT`s.

**Production backend (applied)**

- Project: `dmrvycswdteuhfydchdr`
- Migrations: `20260626150000` (DDL), `20260626163000` (grants + `supplier_debts`)
- `admin-api` deployed with `supplier_debts` allowlist

**URLs (local preview after `npm run deploy:local`)**

- Suppliers: `http://127.0.0.1:4175/spec-ops?screen=suppliers`
- Cash & Debt: `http://127.0.0.1:4175/spec-ops?screen=liabilities`
- Home KPIs: `http://127.0.0.1:4175/spec-ops?screen=home`

**Scenarios to verify**

1. **Add manual debt** — Supplier ABC → Add debt ₼100 → card shows Owed ₼100.
2. **On-account purchase** — Log purchase On account → outstanding increases; appears in debt history.
3. **Clear debt** — Lump payment ₼60 → outstanding drops; payment in history; cleared when zero.
4. **Edit/delete debt** — Edit amount or delete manual entry; balance recalculates.
5. **Liabilities screen** — Loads without permission error; add bank loan with Lender field.
6. **Bank withdrawal** — Fee hits Net Profit on Home.

**Credentials:** Staff cockpit login (admin or manager).

---

## Claude Extension — QA session

Test staff cockpit finance debt on `http://127.0.0.1:4175/spec-ops?screen=…` after `npm run deploy:local`. Confirm `build-meta.json` `gitSha` matches `git rev-parse HEAD`.

Pass/fail each scenario above. When done: `npm run qa:result -- --issue <ID> --pass`
