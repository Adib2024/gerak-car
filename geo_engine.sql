-- ====================================================================
-- GERAK SUPER APP: POSTGIS GEOSPATIAL ENGINE & STATE MACHINE
-- ====================================================================

-- Ensure PostGIS is enabled
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. UPDATE RUNNER LOCATION RPC
-- Allows a runner to update their location using simple lat/lng floats
CREATE OR REPLACE FUNCTION update_runner_location(
  p_lat DOUBLE PRECISION, 
  p_lng DOUBLE PRECISION,
  p_is_active BOOLEAN DEFAULT true
) RETURNS void AS $$
BEGIN
  INSERT INTO public.runner_locations (runner_id, location, is_active, updated_at)
  VALUES (
    auth.uid(), 
    ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography, 
    p_is_active, 
    NOW()
  )
  ON CONFLICT (runner_id) DO UPDATE SET 
    location = EXCLUDED.location,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. GET NEARBY RUNNERS RPC
-- Finds active runners within a radius who have the required service role
CREATE OR REPLACE FUNCTION get_nearby_runners(
  p_lat DOUBLE PRECISION, 
  p_lng DOUBLE PRECISION, 
  p_service_role TEXT, -- e.g., 'driver', 'food_runner', 'jubah_runner'
  p_radius_meters DOUBLE PRECISION DEFAULT 5000
) 
RETURNS TABLE (
  runner_id UUID, 
  dist_meters DOUBLE PRECISION,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.runner_id,
    ST_Distance(r.location, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography) AS dist_meters,
    ST_Y(r.location::geometry) AS lat,
    ST_X(r.location::geometry) AS lng
  FROM 
    public.runner_locations r
  JOIN 
    public.users u ON u.id = r.runner_id
  WHERE 
    r.is_active = true 
    AND p_service_role = ANY(u.roles)
    AND ST_DWithin(r.location, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography, p_radius_meters)
  ORDER BY 
    dist_meters ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. CALCULATE FARE RPC
-- Uses the formula: RM 4.00 Base Fare + RM 1.50 per KM
CREATE OR REPLACE FUNCTION calculate_fare(
  p_pickup_lat DOUBLE PRECISION, 
  p_pickup_lng DOUBLE PRECISION, 
  p_dropoff_lat DOUBLE PRECISION, 
  p_dropoff_lng DOUBLE PRECISION
) 
RETURNS DECIMAL(10,2) AS $$
DECLARE
  dist_meters DOUBLE PRECISION;
  dist_km DOUBLE PRECISION;
  base_fare DECIMAL(10,2) := 4.00;
  per_km_rate DECIMAL(10,2) := 1.50;
  total_fare DECIMAL(10,2);
BEGIN
  dist_meters := ST_Distance(
    ST_SetSRID(ST_MakePoint(p_pickup_lng, p_pickup_lat), 4326)::geography,
    ST_SetSRID(ST_MakePoint(p_dropoff_lng, p_dropoff_lat), 4326)::geography
  );
  dist_km := dist_meters / 1000.0;
  total_fare := base_fare + (dist_km * per_km_rate);
  
  -- Minimum fare is base fare
  IF total_fare < base_fare THEN
    total_fare := base_fare;
  END IF;

  RETURN ROUND(total_fare, 2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. CONCURRENCY-SAFE ACCEPTANCE RPCS
-- Ensures only ONE runner can accept a specific pending order, avoiding race conditions.

-- A. ACCEPT RIDE
CREATE OR REPLACE FUNCTION accept_ride(p_ride_id UUID)
RETURNS TABLE (success BOOLEAN, message TEXT) AS $$
DECLARE
  v_has_active BOOLEAN;
  v_updated BOOLEAN := false;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND 'driver' = ANY(roles)) THEN
    RETURN QUERY SELECT false, 'Only authorized drivers can accept rides.'::TEXT; RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.rides WHERE driver_id = auth.uid() AND status IN ('accepted', 'in_progress')
  ) INTO v_has_active;
  
  IF v_has_active THEN
    RETURN QUERY SELECT false, 'You already have an active ride.'::TEXT; RETURN;
  END IF;

  UPDATE public.rides SET driver_id = auth.uid(), status = 'accepted'
  WHERE id = p_ride_id AND status = 'pending' RETURNING true INTO v_updated;

  IF v_updated THEN
    RETURN QUERY SELECT true, 'Ride accepted successfully.'::TEXT;
  ELSE
    RETURN QUERY SELECT false, 'This order has already been taken or was cancelled.'::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- B. ACCEPT FOOD ORDER
CREATE OR REPLACE FUNCTION accept_food_order(p_order_id UUID)
RETURNS TABLE (success BOOLEAN, message TEXT) AS $$
DECLARE
  v_has_active BOOLEAN;
  v_updated BOOLEAN := false;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND 'food_runner' = ANY(roles)) THEN
    RETURN QUERY SELECT false, 'Only authorized food runners can accept food orders.'::TEXT; RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.food_orders WHERE runner_id = auth.uid() AND status IN ('accepted', 'picked_up')
  ) INTO v_has_active;
  
  IF v_has_active THEN
    RETURN QUERY SELECT false, 'You already have an active food order.'::TEXT; RETURN;
  END IF;

  UPDATE public.food_orders SET runner_id = auth.uid(), status = 'accepted'
  WHERE id = p_order_id AND status = 'pending' RETURNING true INTO v_updated;

  IF v_updated THEN
    RETURN QUERY SELECT true, 'Food order accepted successfully.'::TEXT;
  ELSE
    RETURN QUERY SELECT false, 'This order has already been taken or was cancelled.'::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- C. ACCEPT JUBAH ORDER
CREATE OR REPLACE FUNCTION accept_jubah_order(p_order_id UUID)
RETURNS TABLE (success BOOLEAN, message TEXT) AS $$
DECLARE
  v_has_active BOOLEAN;
  v_updated BOOLEAN := false;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND 'jubah_runner' = ANY(roles)) THEN
    RETURN QUERY SELECT false, 'Only authorized jubah runners can accept jubah orders.'::TEXT; RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.jubah_orders WHERE runner_id = auth.uid() AND status IN ('accepted', 'picked_up')
  ) INTO v_has_active;
  
  IF v_has_active THEN
    RETURN QUERY SELECT false, 'You already have an active jubah order.'::TEXT; RETURN;
  END IF;

  UPDATE public.jubah_orders SET runner_id = auth.uid(), status = 'accepted'
  WHERE id = p_order_id AND status = 'pending' RETURNING true INTO v_updated;

  IF v_updated THEN
    RETURN QUERY SELECT true, 'Jubah order accepted successfully.'::TEXT;
  ELSE
    RETURN QUERY SELECT false, 'This order has already been taken or was cancelled.'::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
