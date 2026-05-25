-- ====================================================================
-- GERAK CAR: POSTGIS GEOSPATIAL ENGINE & RIDE STATE MACHINE
-- ====================================================================

-- Ensure PostGIS is enabled
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. UPDATE DRIVER LOCATION RPC
-- Allows a driver to update their location using simple lat/lng floats
CREATE OR REPLACE FUNCTION update_driver_location(
  p_lat DOUBLE PRECISION, 
  p_lng DOUBLE PRECISION,
  p_is_active BOOLEAN DEFAULT true
) RETURNS void AS $$
BEGIN
  INSERT INTO public.driver_locations (driver_id, location, is_active, updated_at)
  VALUES (
    auth.uid(), 
    ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326), 
    p_is_active, 
    NOW()
  )
  ON CONFLICT (driver_id) DO UPDATE SET 
    location = EXCLUDED.location,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. GET NEARBY DRIVERS RPC
-- Finds active drivers within a certain radius (meters)
CREATE OR REPLACE FUNCTION get_nearby_drivers(
  p_lat DOUBLE PRECISION, 
  p_lng DOUBLE PRECISION, 
  p_radius_meters DOUBLE PRECISION DEFAULT 5000
) 
RETURNS TABLE (
  driver_id UUID, 
  dist_meters DOUBLE PRECISION,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.driver_id,
    ST_Distance(d.location, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)) AS dist_meters,
    ST_Y(d.location::geometry) AS lat,
    ST_X(d.location::geometry) AS lng
  FROM 
    public.driver_locations d
  WHERE 
    d.is_active = true 
    AND ST_DWithin(d.location, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326), p_radius_meters)
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
    ST_SetSRID(ST_MakePoint(p_pickup_lng, p_pickup_lat), 4326),
    ST_SetSRID(ST_MakePoint(p_dropoff_lng, p_dropoff_lat), 4326)
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


-- 4. CONCURRENCY-SAFE RIDE ACCEPTANCE
-- Ensures only ONE driver can accept a specific pending ride, avoiding race conditions.
CREATE OR REPLACE FUNCTION accept_ride(p_ride_id UUID)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_driver_has_active_ride BOOLEAN;
  v_ride_updated BOOLEAN := false;
BEGIN
  -- Check if the driver is already on an active ride
  SELECT EXISTS (
    SELECT 1 FROM public.rides 
    WHERE driver_id = auth.uid() 
    AND status IN ('accepted', 'in_progress')
  ) INTO v_driver_has_active_ride;

  IF v_driver_has_active_ride THEN
    RETURN QUERY SELECT false, 'You already have an active ride.'::TEXT;
    RETURN;
  END IF;

  -- Attempt to claim the ride ONLY IF it is still pending
  UPDATE public.rides 
  SET 
    driver_id = auth.uid(),
    status = 'accepted'
  WHERE 
    id = p_ride_id AND status = 'pending'
  RETURNING true INTO v_ride_updated;

  IF v_ride_updated THEN
    RETURN QUERY SELECT true, 'Ride accepted successfully.'::TEXT;
  ELSE
    RETURN QUERY SELECT false, 'This order has already been taken by another driver or was cancelled.'::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
