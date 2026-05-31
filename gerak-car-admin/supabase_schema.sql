-- ==========================================
-- GERAK CAR: MASTER SUPABASE SCHEMA
-- ==========================================

-- 1. Enable PostGIS for high-performance spatial tracking
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Enums for Architectural Integrity
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

DO $$ BEGIN
    CREATE TYPE gerak_role AS ENUM ('admin', 'driver', 'customer', 'food_runner', 'jubah_runner');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Extended Application Profile Layer
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(100) NOT NULL,
    roles gerak_role[] NOT NULL DEFAULT '{customer}',
    is_online BOOLEAN DEFAULT FALSE,
    current_coordinate GEOGRAPHY(Point, 4326) NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Highly-Indexed Spatial Search Layout
CREATE INDEX IF NOT EXISTS idx_profiles_spatial_loc ON profiles USING GIST (current_coordinate) WHERE is_online = true;

-- 4. The Master Unified Super-App Order Document
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES profiles(id) NOT NULL,
    provider_id UUID REFERENCES profiles(id) NULL,
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

-- 5. Sub-Table Extension: Food Specifics
CREATE TABLE IF NOT EXISTS order_food_details (
    order_id UUID PRIMARY KEY REFERENCES orders(id) ON DELETE CASCADE,
    restaurant_name VARCHAR(150) NOT NULL,
    restaurant_coordinate GEOGRAPHY(Point, 4326) NOT NULL,
    basket_items JSONB NOT NULL,
    preparation_notes TEXT
);

-- 6. Sub-Table Extension: Jubah Runner Specifics
CREATE TABLE IF NOT EXISTS order_jubah_details (
    order_id UUID PRIMARY KEY REFERENCES orders(id) ON DELETE CASCADE,
    form_version INT DEFAULT 1,
    task_instructions_list JSONB NOT NULL, 
    additional_notes TEXT
);

-- 7. Long-Term Complete Analytics Trip Logs
CREATE TABLE IF NOT EXISTS trip_history_archives (
    id UUID PRIMARY KEY, 
    customer_id UUID NOT NULL,
    provider_id UUID NOT NULL,
    vertical gerak_vertical NOT NULL,
    final_price DECIMAL(10,2) NOT NULL,
    historical_path_jsonb JSONB NOT NULL, 
    route_path GEOGRAPHY(LineString, 4326) NULL, 
    archived_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_food_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_jubah_details ENABLE ROW LEVEL SECURITY;

-- PROFILES RLS
-- Anyone can read profiles (needed for driver/customer details)
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
-- Users can update their own profile (e.g. going online, updating location)
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- ORDERS RLS
-- Admins can see all orders
CREATE POLICY "Admins view all orders" ON orders FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND 'admin' = ANY(roles))
);
-- Customers can read their own orders
CREATE POLICY "Customers view own orders" ON orders FOR SELECT USING (auth.uid() = customer_id);
-- Providers can read orders assigned to them, or searching orders
CREATE POLICY "Providers view assigned or searching orders" ON orders FOR SELECT USING (
    auth.uid() = provider_id OR status = 'SEARCHING'
);
-- Customers can insert orders for themselves
CREATE POLICY "Customers can create orders" ON orders FOR INSERT WITH CHECK (auth.uid() = customer_id);
-- Customers can update their own orders (e.g., cancel)
CREATE POLICY "Customers can update own orders" ON orders FOR UPDATE USING (auth.uid() = customer_id);
-- Providers can update orders they are assigned to (e.g., in_progress, completed) or if they are accepting a searching order
CREATE POLICY "Providers can update assigned orders" ON orders FOR UPDATE USING (
    auth.uid() = provider_id OR status = 'SEARCHING'
);


-- ==========================================
-- FUNCTIONS & RPCs
-- ==========================================

-- PostGIS Bounded Matching Execution
CREATE OR REPLACE FUNCTION locate_closest_providers(
    pickup_point GEOGRAPHY, 
    required_role gerak_role, 
    max_radius_meters INT DEFAULT 4000, 
    max_results_limit INT DEFAULT 10
)
RETURNS TABLE (provider_id UUID, distance_meters FLOAT) AS $$
BEGIN
    RETURN QUERY
    SELECT id, ST_Distance(current_coordinate, pickup_point) AS distance
    FROM profiles
    WHERE is_online = true
      AND required_role = ANY(roles)
      AND ST_DWithin(current_coordinate, pickup_point, max_radius_meters)
    ORDER BY distance ASC
    LIMIT max_results_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Safely update driver location
CREATE OR REPLACE FUNCTION update_driver_location(p_lat FLOAT, p_lng FLOAT, p_is_active BOOLEAN)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles 
  SET 
    current_coordinate = ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
    is_online = p_is_active,
    updated_at = NOW()
  WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Securely accept an order using Row-Level Locking (Mutex)
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
