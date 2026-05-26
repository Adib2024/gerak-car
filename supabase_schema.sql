-- ====================================================================
-- GERAK CAR: SUPABASE DATABASE SCHEMA & RLS POLICIES
-- ====================================================================

-- 1. Enable PostGIS Extension for Map/Location features
CREATE EXTENSION IF NOT EXISTS postgis;

-- ====================================================================
-- 2. CUSTOM DOMAIN ENFORCEMENT (TRIGGERS)
-- ====================================================================
-- Since Supabase removed the "Allowed Domains" UI, we use a database
-- trigger to block non-student emails, EXCEPT for your admin email.

CREATE OR REPLACE FUNCTION enforce_email_domain()
RETURNS trigger AS $$
BEGIN
  -- 1. ALLOW THE ADMIN EMAIL (Change this to your actual email!)
  IF NEW.email = 'YOUR_ADMIN_EMAIL@gmail.com' THEN
    RETURN NEW;
  END IF;

  -- 2. ENFORCE STUDENT DOMAIN FOR EVERYONE ELSE (Change this to the university domain!)
  IF NEW.email NOT LIKE '%@student.university.edu.my' THEN
    RAISE EXCEPTION 'Only university student emails are allowed to register.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach the trigger to the auth.users table
DROP TRIGGER IF EXISTS check_email_domain_trigger ON auth.users;
CREATE TRIGGER check_email_domain_trigger
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION enforce_email_domain();

-- ====================================================================
-- 3. TABLES SETUP
-- ====================================================================

-- Create custom users table linked to auth.users
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  roles TEXT[] DEFAULT ARRAY['customer']::TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-insert into public.users when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name, roles)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'name',
    CASE 
      WHEN NEW.email = 'YOUR_ADMIN_EMAIL@gmail.com' THEN ARRAY['admin']::TEXT[]
      ELSE ARRAY['customer']::TEXT[] 
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call handle_new_user on sign up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Runner Locations Table (For Realtime Map Tracking)
CREATE TABLE public.runner_locations (
  runner_id UUID REFERENCES public.users(id) ON DELETE CASCADE PRIMARY KEY,
  location geography(Point, 4326),
  is_active BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rides Table
CREATE TABLE public.rides (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.users(id),
  driver_id UUID REFERENCES public.users(id),
  pickup_location geography(Point, 4326) NOT NULL,
  dropoff_location geography(Point, 4326) NOT NULL,
  pickup_address TEXT,
  dropoff_address TEXT,
  status TEXT CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Food Delivery Tables
CREATE TABLE public.restaurants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location geography(Point, 4326),
  address TEXT,
  is_open BOOLEAN DEFAULT true,
  image_url TEXT
);

CREATE TABLE public.menu_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  is_available BOOLEAN DEFAULT true
);

CREATE TABLE public.food_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.users(id),
  runner_id UUID REFERENCES public.users(id),
  restaurant_id UUID REFERENCES public.restaurants(id),
  delivery_location geography(Point, 4326) NOT NULL,
  delivery_address TEXT,
  status TEXT CHECK (status IN ('pending', 'accepted', 'picked_up', 'delivered', 'cancelled')) DEFAULT 'pending',
  total_price DECIMAL(10,2) NOT NULL,
  delivery_fee DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE public.food_order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.food_orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES public.menu_items(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL
);

-- Jubah Delivery Tables
CREATE TABLE public.jubah_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.users(id),
  runner_id UUID REFERENCES public.users(id),
  pickup_location geography(Point, 4326) NOT NULL,
  dropoff_location geography(Point, 4326) NOT NULL,
  pickup_address TEXT,
  dropoff_address TEXT,
  jubah_size TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'accepted', 'picked_up', 'delivered', 'cancelled')) DEFAULT 'pending',
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ====================================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ====================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.runner_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jubah_orders ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile, admins can read all
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.users FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND 'admin' = ANY(roles))
);

-- Runner locations are readable by everyone (so customers can see cars/runners)
CREATE POLICY "Anyone can view runner locations" ON public.runner_locations FOR SELECT USING (true);
-- Only the specific runner can update their own location
CREATE POLICY "Runners can update own location" ON public.runner_locations FOR ALL USING (auth.uid() = runner_id);

-- Rides
CREATE POLICY "Users can view relevant rides" ON public.rides FOR SELECT USING (
  auth.uid() = customer_id OR auth.uid() = driver_id OR 
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND 'admin' = ANY(roles))
);
CREATE POLICY "Customers can insert rides" ON public.rides FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Users can update relevant rides" ON public.rides FOR UPDATE USING (
  auth.uid() = customer_id OR auth.uid() = driver_id
);

-- Restaurants and Menus (Public read)
CREATE POLICY "Anyone can view restaurants" ON public.restaurants FOR SELECT USING (true);
CREATE POLICY "Anyone can view menus" ON public.menu_items FOR SELECT USING (true);

-- Food Orders
CREATE POLICY "Users can view relevant food orders" ON public.food_orders FOR SELECT USING (
  auth.uid() = customer_id OR auth.uid() = runner_id OR 
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND 'admin' = ANY(roles))
);
CREATE POLICY "Customers can insert food orders" ON public.food_orders FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Users can update relevant food orders" ON public.food_orders FOR UPDATE USING (
  auth.uid() = customer_id OR auth.uid() = runner_id
);

-- Food Order Items
CREATE POLICY "Users can view relevant food order items" ON public.food_order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.food_orders WHERE id = order_id AND (customer_id = auth.uid() OR runner_id = auth.uid()))
);
CREATE POLICY "Customers can insert food order items" ON public.food_order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.food_orders WHERE id = order_id AND customer_id = auth.uid())
);

-- Jubah Orders
CREATE POLICY "Users can view relevant jubah orders" ON public.jubah_orders FOR SELECT USING (
  auth.uid() = customer_id OR auth.uid() = runner_id OR 
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND 'admin' = ANY(roles))
);
CREATE POLICY "Customers can insert jubah orders" ON public.jubah_orders FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Users can update relevant jubah orders" ON public.jubah_orders FOR UPDATE USING (
  auth.uid() = customer_id OR auth.uid() = runner_id
);

-- ====================================================================
-- 5. REALTIME SETUP
-- ====================================================================
-- Enable realtime for tracking and orders
alter publication supabase_realtime add table public.runner_locations;
alter publication supabase_realtime add table public.rides;
alter publication supabase_realtime add table public.food_orders;
alter publication supabase_realtime add table public.jubah_orders;
