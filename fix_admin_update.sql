-- Allow admins to update user profiles (e.g., assigning roles)
CREATE POLICY "Admins can update profiles" ON public.users 
  FOR UPDATE USING (public.is_admin());
