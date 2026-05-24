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
  role TEXT CHECK (role IN ('admin', 'driver', 'customer')) DEFAULT 'customer',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-insert into public.users when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'name',
    CASE 
      WHEN NEW.email = 'YOUR_ADMIN_EMAIL@gmail.com' THEN 'admin'
      ELSE 'customer' 
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

-- Driver Locations Table (For Realtime Map Tracking)
CREATE TABLE public.driver_locations (
  driver_id UUID REFERENCES public.users(id) ON DELETE CASCADE PRIMARY KEY,
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

-- ====================================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ====================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile, admins can read all
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.users FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Driver locations are readable by everyone (so customers can see cars)
CREATE POLICY "Anyone can view driver locations" ON public.driver_locations FOR SELECT USING (true);
-- Only the specific driver can update their own location
CREATE POLICY "Drivers can update own location" ON public.driver_locations FOR ALL USING (auth.uid() = driver_id);

-- Rides: Customers can see their rides, Drivers can see their rides, Admins see all
CREATE POLICY "Users can view relevant rides" ON public.rides FOR SELECT USING (
  auth.uid() = customer_id OR auth.uid() = driver_id OR 
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
-- Customers can create rides
CREATE POLICY "Customers can insert rides" ON public.rides FOR INSERT WITH CHECK (auth.uid() = customer_id);
-- Drivers and Customers can update rides (e.g. status changes)
CREATE POLICY "Users can update relevant rides" ON public.rides FOR UPDATE USING (
  auth.uid() = customer_id OR auth.uid() = driver_id
);

-- ====================================================================
-- 5. REALTIME SETUP
-- ====================================================================
-- Enable realtime for driver locations and rides
alter publication supabase_realtime add table public.driver_locations;
alter publication supabase_realtime add table public.rides;
