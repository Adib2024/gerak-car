-- Run this in the Supabase SQL Editor to allow Admins to securely change user roles!
-- We use the `public.is_admin()` function we created earlier to safely check permissions.

CREATE POLICY "Admins can update all profiles" ON public.users FOR UPDATE USING (
  public.is_admin()
);
