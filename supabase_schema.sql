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
  IF NEW.email = 'gerakccar@gmail.com' THEN
    RETURN NEW;
  END IF;

  -- 2. ENFORCE STUDENT DOMAIN FOR EVERYONE ELSE (Change this to the university domain!)
  IF NEW.email NOT LIKE '%@umpsa.edu.my' THEN
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
-- 3. TABLES SETUP (USING EXISTING USERS TABLE)
-- ====================================================================

-- Create custom users table linked to auth.users (IF NOT EXISTS prevents the crash!)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  roles TEXT[] DEFAULT ARRAY['customer']::TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ADD NEW TRACKING COLUMNS FOR THE UNIFIED ARCHITECTURE
ALTER TABLE IF EXISTS public.users 
    ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS current_coordinate GEOGRAPHY(Point, 4326) NULL;

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
      WHEN NEW.email = 'gerakccar@gmail.com' THEN ARRAY['admin']::TEXT[]
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


-- ==========================================
-- 4. NEW UNIFIED SUPER-APP ARCHITECTURE
-- ==========================================

DO $$ BEGIN
    CREATE TYPE gerak_vertical AS ENUM ('RIDE', 'FOOD', 'JUBAH_RUNNER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE gerak_status AS ENUM ('DRAFT', 'SEARCHING', 'ASSIGNED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE gerak_payment_status AS ENUM ('UNPAID', 'PENDING_VERIFICATION', 'SETTLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE gerak_payment_type AS ENUM ('CASH', 'DUITNOW_QR');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Highly-Indexed Spatial Search Layout for Active Drivers
CREATE INDEX IF NOT EXISTS idx_users_spatial_loc ON public.users USING GIST (current_coordinate) WHERE is_online = true;

-- The Master Unified Super-App Order Document
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.users(id) NOT NULL,
    provider_id UUID REFERENCES public.users(id) NULL,
    vertical gerak_vertical NOT NULL,
    status gerak_status NOT NULL DEFAULT 'DRAFT',
    payment_method gerak_payment_type NOT NULL,
    payment_state gerak_payment_status NOT NULL DEFAULT 'UNPAID',
    price_quoted DECIMAL(10, 2) NOT NULL,
    pickup_coordinate GEOGRAPHY(Point, 4326) NOT NULL,
    dropoff_coordinate GEOGRAPHY(Point, 4326) NOT NULL,
    pickup_address TEXT NULL,
    dropoff_address TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Spatial Indexes for Fast Geographical Matching Updates
CREATE INDEX IF NOT EXISTS idx_orders_pickup_spatial ON orders USING GIST (pickup_coordinate);
CREATE INDEX IF NOT EXISTS idx_orders_status_filtering ON orders (status) WHERE status = 'SEARCHING';

-- ==========================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ==========================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Helper function to break infinite recursion in RLS policies
-- We use SET search_path = public to strictly isolate the execution context
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  SELECT 'admin' = ANY(roles) INTO v_is_admin FROM public.users WHERE id = auth.uid();
  RETURN COALESCE(v_is_admin, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- WIPE ALL EXISTING POLICIES ON USERS TO PREVENT LINGERING RECURSION BUGS
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'users' AND schemaname = 'public') 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.users', r.policyname);
    END LOOP;
END $$;

-- Users can read their own profile, admins can read all
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.users FOR SELECT USING (
  public.is_admin()
);

-- ORDERS RLS
-- Admins can see all orders
DROP POLICY IF EXISTS "Admins view all orders" ON orders;
CREATE POLICY "Admins view all orders" ON orders FOR SELECT USING (
    public.is_admin()
);

-- Customers can read their own orders
DROP POLICY IF EXISTS "Customers view own orders" ON orders;
CREATE POLICY "Customers view own orders" ON orders FOR SELECT USING (auth.uid() = customer_id);

-- Providers can read orders assigned to them, or searching orders
DROP POLICY IF EXISTS "Providers view assigned or searching orders" ON orders;
CREATE POLICY "Providers view assigned or searching orders" ON orders FOR SELECT USING (
    auth.uid() = provider_id OR status = 'SEARCHING'
);

-- Customers can insert orders for themselves
DROP POLICY IF EXISTS "Customers can create orders" ON orders;
CREATE POLICY "Customers can create orders" ON orders FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- Customers can update their own orders (e.g., cancel)
DROP POLICY IF EXISTS "Customers can update own orders" ON orders;
CREATE POLICY "Customers can update own orders" ON orders FOR UPDATE USING (auth.uid() = customer_id);

-- Providers can update orders they are assigned to (e.g., in_progress, completed) or if they are accepting a searching order
DROP POLICY IF EXISTS "Providers can update assigned orders" ON orders;
CREATE POLICY "Providers can update assigned orders" ON orders FOR UPDATE USING (
    auth.uid() = provider_id OR status = 'SEARCHING'
);


-- ==========================================
-- 6. REALTIME SETUP
-- ==========================================
-- Enable realtime for tracking and orders safely
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'users') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'orders') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;
END $$;

-- ==========================================
-- 7. FUNCTIONS & RPCs
-- ==========================================

-- PostGIS Bounded Matching Execution
DROP FUNCTION IF EXISTS locate_closest_providers;
CREATE OR REPLACE FUNCTION locate_closest_providers(
    pickup_point GEOGRAPHY, 
    required_role TEXT, 
    max_radius_meters INT DEFAULT 4000, 
    max_results_limit INT DEFAULT 10
)
RETURNS TABLE (provider_id UUID, distance_meters FLOAT) AS $$
BEGIN
    RETURN QUERY
    SELECT id, ST_Distance(current_coordinate, pickup_point) AS distance
    FROM public.users
    WHERE is_online = true
      AND required_role = ANY(roles)
      AND ST_DWithin(current_coordinate, pickup_point, max_radius_meters)
    ORDER BY distance ASC
    LIMIT max_results_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Safely update driver location
DROP FUNCTION IF EXISTS update_driver_location;
CREATE OR REPLACE FUNCTION update_driver_location(p_lat FLOAT, p_lng FLOAT, p_is_active BOOLEAN)
RETURNS VOID AS $$
BEGIN
  UPDATE public.users 
  SET 
    current_coordinate = ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
    is_online = p_is_active
  WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Securely accept an order using Row-Level Locking (Mutex)
DROP FUNCTION IF EXISTS accept_order;
CREATE OR REPLACE FUNCTION accept_order(p_order_id UUID)
RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
DECLARE
  v_status gerak_status;
BEGIN
  -- 1. Lock the row to prevent race conditions
  SELECT status INTO v_status
  FROM orders
  WHERE id = p_order_id
  FOR UPDATE NOWAIT;

  -- 2. Check if it's still available
  IF v_status != 'SEARCHING' THEN
    RETURN QUERY SELECT FALSE, 'Order is no longer available.';
    RETURN;
  END IF;

  -- 3. Assign to provider
  UPDATE orders
  SET 
    status = 'ASSIGNED',
    provider_id = auth.uid(),
    updated_at = NOW()
  WHERE id = p_order_id;

  RETURN QUERY SELECT TRUE, 'Order assigned successfully.';
EXCEPTION
  WHEN lock_not_available THEN
    RETURN QUERY SELECT FALSE, 'Another driver is currently accepting this order.';
  WHEN others THEN
    RETURN QUERY SELECT FALSE, SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
