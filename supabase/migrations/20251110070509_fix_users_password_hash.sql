/*
  # Fix users table password_hash column

  Make password_hash nullable since we use Supabase Auth, not local password storage
*/

ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
ALTER TABLE users ALTER COLUMN password_hash SET DEFAULT '';
