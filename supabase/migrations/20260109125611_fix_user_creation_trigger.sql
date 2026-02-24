/*
  # Fix User Creation with Automatic Trigger

  1. Changes
    - Add trigger to automatically create users table entry when auth user signs up
    - First user becomes admin, subsequent users are staff
    - Handle existing authenticated session by creating user entry

  2. Security
    - Maintains existing RLS policies
    - First user automatically gets admin role
*/

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_count INTEGER;
  new_role user_role;
BEGIN
  -- Count existing users
  SELECT COUNT(*) INTO user_count FROM public.users;
  
  -- First user is admin, rest are staff
  IF user_count = 0 THEN
    new_role := 'admin';
  ELSE
    new_role := 'staff';
  END IF;
  
  -- Insert into public.users table
  INSERT INTO public.users (id, username, role, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, NEW.id::text),
    new_role,
    NOW(),
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new auth users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Handle currently authenticated user if not in users table
DO $$
DECLARE
  current_user_id uuid;
  user_count INTEGER;
  new_role user_role;
BEGIN
  -- Get the current authenticated user from auth.users
  SELECT id INTO current_user_id 
  FROM auth.users 
  ORDER BY created_at ASC 
  LIMIT 1;
  
  IF current_user_id IS NOT NULL THEN
    -- Check if user already exists in public.users
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = current_user_id) THEN
      -- Count existing users to determine role
      SELECT COUNT(*) INTO user_count FROM public.users;
      
      IF user_count = 0 THEN
        new_role := 'admin';
      ELSE
        new_role := 'staff';
      END IF;
      
      -- Insert the user
      INSERT INTO public.users (id, username, role, created_at, updated_at)
      SELECT 
        id,
        COALESCE(email, id::text),
        new_role,
        created_at,
        NOW()
      FROM auth.users
      WHERE id = current_user_id;
    END IF;
  END IF;
END $$;
