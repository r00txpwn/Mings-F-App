-- PRODUCTION only — project dmrvycswdteuhfydchdr
-- Supabase Dashboard → SQL Editor → Run
-- Source: supabase/migrations/20260804120000_ops_tasks.sql
-- Safe to re-run (IF NOT EXISTS / policy guards)

/*
  # Task Master (ops_tasks)

  Internal manager ops board — not order/product backlog.
  Soft flags only (is_deleted, archived_at). No hard deletes from app.
*/

CREATE TABLE IF NOT EXISTS public.ops_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'backlog'
    CHECK (status IN ('backlog', 'todo', 'in_progress', 'done')),
  priority text NOT NULL DEFAULT 'none'
    CHECK (priority IN ('none', 'low', 'medium', 'high')),
  assignee_employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  due_date date,
  archived_at timestamptz,
  is_deleted boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ops_tasks_title_not_blank CHECK (length(trim(title)) > 0)
);

CREATE INDEX IF NOT EXISTS ops_tasks_board_idx
  ON public.ops_tasks (status, is_deleted, archived_at)
  WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS ops_tasks_assignee_idx
  ON public.ops_tasks (assignee_employee_id)
  WHERE is_deleted = false;

ALTER TABLE public.ops_tasks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'ops_tasks'
      AND policyname = 'Managers can read ops tasks'
  ) THEN
    CREATE POLICY "Managers can read ops tasks"
      ON public.ops_tasks FOR SELECT TO authenticated
      USING (public.is_admin_or_manager());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'ops_tasks'
      AND policyname = 'Managers can insert ops tasks'
  ) THEN
    CREATE POLICY "Managers can insert ops tasks"
      ON public.ops_tasks FOR INSERT TO authenticated
      WITH CHECK (public.is_admin_or_manager());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'ops_tasks'
      AND policyname = 'Managers can update ops tasks'
  ) THEN
    CREATE POLICY "Managers can update ops tasks"
      ON public.ops_tasks FOR UPDATE TO authenticated
      USING (public.is_admin_or_manager())
      WITH CHECK (public.is_admin_or_manager());
  END IF;

  -- Soft-delete only in app; hard DELETE restricted to admin (defense in depth).
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'ops_tasks'
      AND policyname = 'Admins can delete ops tasks'
  ) THEN
    CREATE POLICY "Admins can delete ops tasks"
      ON public.ops_tasks FOR DELETE TO authenticated
      USING (public.is_admin());
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ops_tasks TO authenticated;
GRANT ALL ON public.ops_tasks TO service_role;

-- Realtime for multi-manager board sync
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'ops_tasks'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.ops_tasks;
    END IF;
  END IF;
END $$;

-- Record migration history when present
INSERT INTO supabase_migrations.schema_migrations (version)
VALUES ('20260804120000')
ON CONFLICT DO NOTHING;
