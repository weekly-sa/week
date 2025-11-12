/*
  # Add INSERT policy for users table

  Allow service role to insert new users during signup
*/

CREATE POLICY "Service role can create users"
  ON users
  FOR INSERT
  TO service_role
  WITH CHECK (true);
