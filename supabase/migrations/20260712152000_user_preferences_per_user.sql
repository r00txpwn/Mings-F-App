-- Scope language preferences to individual auth users.
-- Legacy rows had no user_id and acted as a global default ('en') that overwrote localStorage.

ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

DELETE FROM user_preferences WHERE user_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS user_preferences_user_id_key ON user_preferences (user_id);

DROP POLICY IF EXISTS "Allow public read access to user_preferences" ON user_preferences;
DROP POLICY IF EXISTS "Allow public insert to user_preferences" ON user_preferences;
DROP POLICY IF EXISTS "Allow public update to user_preferences" ON user_preferences;

CREATE POLICY "Users read own preferences"
  ON user_preferences FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users insert own preferences"
  ON user_preferences FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own preferences"
  ON user_preferences FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
