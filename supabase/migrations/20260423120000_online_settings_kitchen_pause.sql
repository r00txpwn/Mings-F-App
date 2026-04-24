-- Kitchen pause + soft-close window + allow managers to edit online_settings (Order Manager).

ALTER TABLE public.online_settings
  ADD COLUMN IF NOT EXISTS offline_until timestamptz,
  ADD COLUMN IF NOT EXISTS closing_soon_minutes integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.online_settings.offline_until IS
  'When set and in the future with is_open=false, kitchen is in a timed pause; acceptance uses when >= offline_until to lift pause.';

COMMENT ON COLUMN public.online_settings.closing_soon_minutes IS
  'Minutes before daily close when immediate orders still submit but show last-call UI. 0 disables.';

DROP POLICY IF EXISTS "Staff can manage online settings" ON public.online_settings;

CREATE POLICY "Staff can manage online settings"
  ON public.online_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role IN ('admin', 'manager', 'staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role IN ('admin', 'manager', 'staff')
    )
  );
