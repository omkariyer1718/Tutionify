-- =============================================================================
-- Auto Initialize Settings for New Tutors
-- =============================================================================

-- When a brand new user signs up (via Google or Email), 
-- they need a blank settings row so their dashboard doesn't crash on the Settings page.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.settings (user_id, fee_due_day, academic_year)
  VALUES (new.id, 5, extract(year from current_date));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- We use SECURITY DEFINER so this trigger runs with elevated permissions
-- and bypasses RLS, since it's executing on behalf of the auth system, not the user.

-- Trigger the function every time a user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
