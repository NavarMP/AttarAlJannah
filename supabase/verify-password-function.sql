-- Create password verification function for student login
CREATE OR REPLACE FUNCTION verify_password(user_id UUID, password_input TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  stored_hash TEXT;
BEGIN
  -- Get the stored password hash
  SELECT password_hash INTO stored_hash
  FROM users
  WHERE id = user_id;
  
  -- Check if password matches
  IF stored_hash IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Use crypt to verify
  RETURN stored_hash = crypt(password_input, stored_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION verify_password(UUID, TEXT) TO authenticated, anon;
