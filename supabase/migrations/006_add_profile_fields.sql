-- Add first_name, last_name, and phone to profiles table
ALTER TABLE public.profiles
ADD COLUMN first_name text null,
ADD COLUMN last_name text null,
ADD COLUMN phone text null;

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.first_name IS 'User first name';
COMMENT ON COLUMN public.profiles.last_name IS 'User last name';
COMMENT ON COLUMN public.profiles.phone IS 'User phone number';
