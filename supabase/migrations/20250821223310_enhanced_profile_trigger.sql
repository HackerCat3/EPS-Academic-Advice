-- Enhanced trigger to handle existing users
  CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
  AS $$
  BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data ->> 'full_name',
  NEW.email),
      CASE
        WHEN NEW.email LIKE '%@eastsideprep.org' THEN
  'student'
        ELSE 'student'
      END
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name,
  profiles.full_name);

    RETURN NEW;
  END;
  $$
