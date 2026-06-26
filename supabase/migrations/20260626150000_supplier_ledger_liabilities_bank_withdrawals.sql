/*
  # Supplier ledger, liabilities, and bank withdrawals

  Additive-only migration for finance debt tracking and bank withdrawal fees.
  - suppliers.opening_balance / opening_balance_date (go-live carry-over, off P&L)
  - purchases.is_on_credit (on account vs paid now)
  - supplier_account_payments (lump-sum supplier payments; distinct from legacy supplier_payments)
  - liabilities + liability_payments (loans/other)
  - bank_withdrawals (withdrawal log with fee snapshots)
*/

-- suppliers: opening balance for go-live carry-over
ALTER TABLE suppliers
  ADD COLUMN IF NOT EXISTS opening_balance numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS opening_balance_date date;

-- purchases: on account vs paid now
ALTER TABLE purchases
  ADD COLUMN IF NOT EXISTS is_on_credit boolean NOT NULL DEFAULT true;

UPDATE purchases
SET is_on_credit = (payment_status IS DISTINCT FROM 'paid')
WHERE payment_status IS NOT NULL;

-- supplier account payments (new table; legacy supplier_payments left untouched)
CREATE TABLE IF NOT EXISTS supplier_account_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  paid_date date NOT NULL DEFAULT CURRENT_DATE,
  payment_method text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE supplier_account_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read supplier account payments"
  ON supplier_account_payments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can insert supplier account payments"
  ON supplier_account_payments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Staff can update supplier account payments"
  ON supplier_account_payments FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins can delete supplier account payments"
  ON supplier_account_payments FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- liabilities (loans / other non-supplier debt)
CREATE TABLE IF NOT EXISTS liabilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('loan', 'other')),
  counterparty text NOT NULL DEFAULT '',
  principal_amount numeric(12,2) NOT NULL CHECK (principal_amount >= 0),
  currency text NOT NULL DEFAULT 'AZN',
  incurred_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date,
  notes text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'partially_paid', 'settled')),
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE liabilities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read liabilities"
  ON liabilities FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff can insert liabilities"
  ON liabilities FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()));

CREATE POLICY "Staff can update liabilities"
  ON liabilities FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins can delete liabilities"
  ON liabilities FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

CREATE TABLE IF NOT EXISTS liability_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  liability_id uuid NOT NULL REFERENCES liabilities(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  paid_date date NOT NULL DEFAULT CURRENT_DATE,
  payment_method text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE liability_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read liability payments"
  ON liability_payments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff can insert liability payments"
  ON liability_payments FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()));

CREATE POLICY "Staff can update liability payments"
  ON liability_payments FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins can delete liability payments"
  ON liability_payments FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- bank withdrawals with fee snapshots
CREATE TABLE IF NOT EXISTS bank_withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  method text NOT NULL CHECK (method IN ('cashier', 'abb_atm')),
  fee_rate numeric(6,4) NOT NULL CHECK (fee_rate >= 0),
  fee_amount numeric(12,2) NOT NULL CHECK (fee_amount >= 0),
  withdrawal_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text NOT NULL DEFAULT '',
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE bank_withdrawals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read bank withdrawals"
  ON bank_withdrawals FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff can insert bank withdrawals"
  ON bank_withdrawals FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()));

CREATE POLICY "Staff can update bank withdrawals"
  ON bank_withdrawals FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins can delete bank withdrawals"
  ON bank_withdrawals FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

CREATE INDEX IF NOT EXISTS idx_supplier_account_payments_supplier ON supplier_account_payments(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_account_payments_date ON supplier_account_payments(paid_date);
CREATE INDEX IF NOT EXISTS idx_purchases_supplier_date ON purchases(supplier_id, purchase_date);
CREATE INDEX IF NOT EXISTS idx_liability_payments_liability ON liability_payments(liability_id);
CREATE INDEX IF NOT EXISTS idx_bank_withdrawals_date ON bank_withdrawals(withdrawal_date);
