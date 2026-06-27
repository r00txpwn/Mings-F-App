/*
  # Taxes and payroll modules

  - employees: staff roster with total vs official declared salary
  - salary_payments: dated payment ledger (salary, advance, partial, bonus)
  - tax_settings: singleton configurable AZ tax rates
  - tax_payments: log of taxes paid to the state
*/

-- employees
CREATE TABLE IF NOT EXISTS public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  designation text NOT NULL DEFAULT '',
  total_salary numeric(12,2) NOT NULL DEFAULT 0 CHECK (total_salary >= 0),
  official_salary numeric(12,2) NOT NULL DEFAULT 0 CHECK (official_salary >= 0),
  is_active boolean NOT NULL DEFAULT true,
  hired_at date,
  notes text NOT NULL DEFAULT '',
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT employees_official_lte_total CHECK (official_salary <= total_salary)
);

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read employees"
  ON public.employees FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff can insert employees"
  ON public.employees FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Staff can update employees"
  ON public.employees FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Admins can delete employees"
  ON public.employees FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- salary payments ledger
CREATE TABLE IF NOT EXISTS public.salary_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  payment_type text NOT NULL DEFAULT 'salary'
    CHECK (payment_type IN ('salary', 'advance', 'bonus', 'partial')),
  note text NOT NULL DEFAULT '',
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.salary_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read salary payments"
  ON public.salary_payments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff can insert salary payments"
  ON public.salary_payments FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Staff can update salary payments"
  ON public.salary_payments FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Admins can delete salary payments"
  ON public.salary_payments FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- tax settings (singleton row)
CREATE TABLE IF NOT EXISTS public.tax_settings (
  id uuid PRIMARY KEY DEFAULT '00000000-0000-4000-8000-000000000001'::uuid,
  sales_tax_cash_pct numeric(6,3) NOT NULL DEFAULT 2 CHECK (sales_tax_cash_pct >= 0),
  sales_tax_noncash_pct numeric(6,3) NOT NULL DEFAULT 2 CHECK (sales_tax_noncash_pct >= 0),
  pit_exempt_amount numeric(12,2) NOT NULL DEFAULT 200,
  pit_bracket1_max numeric(12,2) NOT NULL DEFAULT 2500,
  pit_bracket2_max numeric(12,2) NOT NULL DEFAULT 8000,
  pit_bracket1_pct numeric(6,3) NOT NULL DEFAULT 3,
  pit_bracket2_pct numeric(6,3) NOT NULL DEFAULT 10,
  pit_bracket3_pct numeric(6,3) NOT NULL DEFAULT 14,
  pit_bracket2_fixed numeric(12,2) NOT NULL DEFAULT 75,
  pit_bracket3_fixed numeric(12,2) NOT NULL DEFAULT 625,
  dsmf_employee_low_pct numeric(6,3) NOT NULL DEFAULT 3,
  dsmf_employee_high_pct numeric(6,3) NOT NULL DEFAULT 10,
  dsmf_employee_low_cap numeric(12,2) NOT NULL DEFAULT 200,
  dsmf_employer_low_pct numeric(6,3) NOT NULL DEFAULT 22,
  dsmf_employer_high_pct numeric(6,3) NOT NULL DEFAULT 15,
  dsmf_employer_low_cap numeric(12,2) NOT NULL DEFAULT 200,
  dsmf_high_income_cap numeric(12,2) NOT NULL DEFAULT 8000,
  dsmf_employee_high_income_pct numeric(6,3) NOT NULL DEFAULT 10,
  dsmf_employer_high_income_pct numeric(6,3) NOT NULL DEFAULT 11,
  medical_low_cap numeric(12,2) NOT NULL DEFAULT 2500,
  medical_employee_low_pct numeric(6,3) NOT NULL DEFAULT 1,
  medical_employer_low_pct numeric(6,3) NOT NULL DEFAULT 1,
  medical_employee_high_pct numeric(6,3) NOT NULL DEFAULT 0.5,
  medical_employer_high_pct numeric(6,3) NOT NULL DEFAULT 0.5,
  unemployment_employee_pct numeric(6,3) NOT NULL DEFAULT 0.5,
  unemployment_employer_pct numeric(6,3) NOT NULL DEFAULT 0.5,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tax_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read tax settings"
  ON public.tax_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff can update tax settings"
  ON public.tax_settings FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()));

INSERT INTO public.tax_settings (id)
VALUES ('00000000-0000-4000-8000-000000000001'::uuid)
ON CONFLICT (id) DO NOTHING;

-- tax payments log
CREATE TABLE IF NOT EXISTS public.tax_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_type text NOT NULL CHECK (tax_type IN ('sales', 'payroll')),
  period_start date NOT NULL,
  period_end date NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  paid_date date NOT NULL DEFAULT CURRENT_DATE,
  note text NOT NULL DEFAULT '',
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tax_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read tax payments"
  ON public.tax_payments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff can insert tax payments"
  ON public.tax_payments FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Staff can update tax payments"
  ON public.tax_payments FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Admins can delete tax payments"
  ON public.tax_payments FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- grants
GRANT SELECT ON TABLE public.employees TO authenticated;
GRANT SELECT ON TABLE public.salary_payments TO authenticated;
GRANT SELECT ON TABLE public.tax_settings TO authenticated;
GRANT SELECT ON TABLE public.tax_payments TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.employees TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.salary_payments TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.tax_settings TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.tax_payments TO service_role;

CREATE INDEX IF NOT EXISTS idx_employees_active ON public.employees(is_active);
CREATE INDEX IF NOT EXISTS idx_salary_payments_employee ON public.salary_payments(employee_id);
CREATE INDEX IF NOT EXISTS idx_salary_payments_date ON public.salary_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_tax_payments_type_date ON public.tax_payments(tax_type, paid_date);
