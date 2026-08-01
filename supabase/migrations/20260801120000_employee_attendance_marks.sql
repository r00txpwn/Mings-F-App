/*
  # Employee attendance marks for month payroll

  Additive only — safe for production:
  - Adds employees.weekly_off_weekday (default Sunday = 0)
  - Creates employee_day_marks for per-date off/absent/work overrides
  - No DROP, no column removal, no data deletes, no type narrowing
*/

-- Default weekly off: 0=Sunday … 6=Saturday (matches JS Date.getDay())
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS weekly_off_weekday smallint NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'employees_weekly_off_weekday_range'
      AND conrelid = 'public.employees'::regclass
  ) THEN
    ALTER TABLE public.employees
      ADD CONSTRAINT employees_weekly_off_weekday_range
      CHECK (weekly_off_weekday >= 0 AND weekly_off_weekday <= 6);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.employee_day_marks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  work_date date NOT NULL,
  mark_type text NOT NULL
    CHECK (mark_type IN ('weekly_off', 'absent', 'work')),
  note text NOT NULL DEFAULT '',
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT employee_day_marks_unique_day UNIQUE (employee_id, work_date)
);

CREATE INDEX IF NOT EXISTS employee_day_marks_employee_date_idx
  ON public.employee_day_marks (employee_id, work_date);

ALTER TABLE public.employee_day_marks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'employee_day_marks'
      AND policyname = 'Anyone can read employee day marks'
  ) THEN
    CREATE POLICY "Anyone can read employee day marks"
      ON public.employee_day_marks FOR SELECT TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'employee_day_marks'
      AND policyname = 'Staff can insert employee day marks'
  ) THEN
    CREATE POLICY "Staff can insert employee day marks"
      ON public.employee_day_marks FOR INSERT TO authenticated
      WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'employee_day_marks'
      AND policyname = 'Staff can update employee day marks'
  ) THEN
    CREATE POLICY "Staff can update employee day marks"
      ON public.employee_day_marks FOR UPDATE TO authenticated
      USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()))
      WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'employee_day_marks'
      AND policyname = 'Admins can delete employee day marks'
  ) THEN
    CREATE POLICY "Admins can delete employee day marks"
      ON public.employee_day_marks FOR DELETE TO authenticated
      USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_day_marks TO authenticated;
GRANT ALL ON public.employee_day_marks TO service_role;
