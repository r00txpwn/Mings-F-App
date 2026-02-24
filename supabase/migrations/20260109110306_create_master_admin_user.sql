/*
  # Create Master Admin User

  1. Purpose
    - Creates a single master admin user for system access
    - Removes the need for public signup
    - Only this admin can create other users from within the system

  2. Master Admin Credentials
    - Email: admin@system.local
    - Password: admin123
    - Note: Change password after first login for security

  3. Security
    - User is automatically confirmed (no email verification needed)
    - Password is securely hashed by Supabase
*/

-- Create the master admin user if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'admin@system.local'
  ) THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      role,
      aud
    )
    VALUES (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'admin@system.local',
      crypt('admin123', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"role":"admin"}',
      false,
      'authenticated',
      'authenticated'
    );
  END IF;
END $$;