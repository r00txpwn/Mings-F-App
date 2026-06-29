/*
  # Combo tables: GRANT + staff RLS (fixes cockpit 403 on combo_deals)

  CombosScreen reads combo_deals via PostgREST as authenticated staff.
  Without table GRANTs Postgres returns 403 before RLS runs.
  Staff policies now use is_staff_user() (admin, manager, staff).
*/

GRANT SELECT ON TABLE public.combo_deals, public.combo_groups, public.combo_group_items TO anon, authenticated;

GRANT INSERT, UPDATE, DELETE ON TABLE public.combo_deals, public.combo_groups, public.combo_group_items TO authenticated;

DROP POLICY IF EXISTS "Staff can manage combo deals" ON public.combo_deals;
CREATE POLICY "Staff can manage combo deals"
  ON public.combo_deals FOR ALL TO authenticated
  USING (public.is_staff_user())
  WITH CHECK (public.is_staff_user());

DROP POLICY IF EXISTS "Staff can manage combo groups" ON public.combo_groups;
CREATE POLICY "Staff can manage combo groups"
  ON public.combo_groups FOR ALL TO authenticated
  USING (public.is_staff_user())
  WITH CHECK (public.is_staff_user());

DROP POLICY IF EXISTS "Staff can manage combo group items" ON public.combo_group_items;
CREATE POLICY "Staff can manage combo group items"
  ON public.combo_group_items FOR ALL TO authenticated
  USING (public.is_staff_user())
  WITH CHECK (public.is_staff_user());
