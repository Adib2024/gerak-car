-- Fix for the Infinite Recursion error in RLS policies

-- 1. Drop the old policy that caused the infinite loop
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.users;

-- 2. Create a secure function that bypasses RLS to check the role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Recreate the policy using the secure function
CREATE POLICY "Admins can view all profiles" ON public.users FOR SELECT USING (
  public.is_admin()
);
