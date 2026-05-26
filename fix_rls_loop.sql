-- 1. Create a secure function that bypasses RLS to check for admin status
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND 'admin' = ANY(roles)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Drop the recursive policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Users can view relevant rides" ON public.rides;
DROP POLICY IF EXISTS "Users can view relevant food orders" ON public.food_orders;
DROP POLICY IF EXISTS "Users can view relevant jubah orders" ON public.jubah_orders;

-- 3. Recreate them using the safe is_admin() function to prevent infinite loops
CREATE POLICY "Admins can view all profiles" ON public.users 
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Users can view relevant rides" ON public.rides 
  FOR SELECT USING (auth.uid() = customer_id OR auth.uid() = driver_id OR public.is_admin());

CREATE POLICY "Users can view relevant food orders" ON public.food_orders 
  FOR SELECT USING (auth.uid() = customer_id OR auth.uid() = runner_id OR public.is_admin());

CREATE POLICY "Users can view relevant jubah orders" ON public.jubah_orders 
  FOR SELECT USING (auth.uid() = customer_id OR auth.uid() = runner_id OR public.is_admin());
