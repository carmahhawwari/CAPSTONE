-- Add email column to profiles table
ALTER TABLE public.profiles
ADD COLUMN email text null;

COMMENT ON COLUMN public.profiles.email IS 'User email address (denormalized from auth table)';

-- Backfill email for existing users from the auth table
UPDATE public.profiles p
SET email = (
  SELECT email FROM auth.users WHERE auth.users.id = p.id
);
