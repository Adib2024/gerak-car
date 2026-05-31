name: gerak-architecture
description: Enforces the core system architecture, database schema, and real-time network protocols for the Gerak super-app. Use this whenever generating code, debugging, designing features, or writing database migrations for the Gerak platform (Rides, Food Delivery, or Jubah Runner).

Gerak Core Architecture & Engineering Standards

This skill defines the absolute boundaries, stack constraints, and domain logic for the Gerak multi-vertical mobility platform. When applied, you must prioritize low write-amplification, memory-mapped geospatial indexing, and stateless network connections.

When to use this skill

Use this when generating Next.js frontend code or Supabase backend logic for the Gerak app.

Use this when writing database migrations or PostGIS spatial queries.

Use this when debugging real-time map tracking, driver dispatch algorithms, or WebSocket connection drops.

Use this when implementing payment states (Cash or DuitNow).

How to use it: Architectural Guardrails

When working on this project, strictly follow these infrastructure constraints. DO NOT deviate or suggest alternatives.

Core Framework: Next.js (App Router, Server Actions, React Server Components) and Tailwind CSS.

Backend & Relational Layer: Supabase SSR. Core tables, user states, Row Level Security (RLS), and relational logic must run natively inside Supabase PostgreSQL.

Geospatial Engine: PostGIS extension natively in PostgreSQL for geographical points, polygons, distance arrays, and indexing.

Real-time Synchronization: Supabase Realtime Engine. Use Broadcast channels for transient UI map updates. Use Database Replication triggers exclusively for transactional order mutations.

Telemetry Layer: Redis instance for memory-mapped lookup optimization, driver concurrency lockouts, and high-frequency coordinate state caching.

Historical Archive: NO NoSQL databases (No MongoDB). Trip logs, high-density GPS arrays, and audit trails must be stored natively within Supabase PostgreSQL using JSONB columns or PostGIS LineString.

Banned Infrastructure: AWS cloud services and Docker containerization are STRICTLY BANNED. Write native node/edge applications deployable to bare-metal/systemd.

Payment Processing Constraints: NO third-party gateways (Stripe, etc.) and NO digital wallets. Settle via:

CASH: Direct physical exchange.

DUITNOW QR: Manual peer-to-peer scanning. The app acts solely as a ledger (UNPAID, PENDING_VERIFICATION, SETTLED).

Multi-Vertical Domain Logic

The system interacts with a single unified orders transactional table utilizing polymorphic sub-tables. You must understand these three distinct operational models:

RIDE (Ride-Hailing): Point A to Point B direct passenger transit. Tracks one continuous trajectory stream.

FOOD (Food Delivery): Multi-point compound transit (Provider -> Restaurant -> Customer Drop-off). Requires double-stage waypoint execution in the UI.

JUBAH_RUNNER (Concierge Courier): Custom checklist workflows driven by user-defined forms (e.g., go to X, buy Y, deliver to Z).

Authentication & Security Protocol

All identity and session management must strictly utilize Supabase Auth via Email and Password. SMS OTP is strictly prohibited. Follow this detailed, production-ready implementation:

Registration (First-Time Use): * Users register using a valid Email and a strong Password.

You must enable "Confirm Email" in Supabase settings. Upon registration, Supabase sends a secure verification link (or 6-digit email OTP) to the user's inbox.

The user account remains in a restricted PENDING state until the email is verified, preventing unauthorized bookings.

Standard Login (Returning Users):

Users authenticate using their registered Email and Password.

Failed attempts must trigger exponential backoff rate-limiting at the edge layer to prevent brute-force credential stuffing.

Password Recovery ("Forgot Password"):

If a user forgets their password, invoke the supabase.auth.resetPasswordForEmail() method.

This generates a secure, time-limited recovery link sent to their email.

Your Next.js/React Native app must intercept this deep link, verify the session token, and render a "Create New Password" UI form. Upon submission, call supabase.auth.updateUser({ password: newPassword }).

Session Persistence & Security: * Mobile (React Native/Expo): Store Supabase session JWTs (both Access and Refresh tokens) locally using secure device enclaves (e.g., expo-secure-store, iOS Keychain, or Android EncryptedSharedPreferences). Never use plain AsyncStorage.

Web/Next.js: Store tokens in httpOnly secure cookies via Supabase SSR packages to prevent Cross-Site Scripting (XSS) attacks.

Authorization (RLS): * Do not write application-level authorization logic if it can be handled by the database. You must write PostgreSQL Row Level Security (RLS) policies for all tables.

Example: A provider can only UPDATE their own current_coordinate in the profiles table if auth.uid() = id.

WebSocket Auth: * Supabase Realtime channels automatically respect RLS policies as long as the user's active JWT is passed during client initialization. The WebSocket connection must gracefully close and prompt re-authentication if the refresh token expires.

High-Concurrency Real-Time Protocol

To handle 5,000+ concurrent sessions, execute telemetry flows using this pattern to avoid Database I/O bottlenecks:

JWT Verification: Authenticate all WebSocket connections statelessly via Supabase JWTs in the headers.

Write-Amplification Mitigation: Route sub-5-second driver location pings to Redis (SET provider:loc:<id>). Sync to PostgreSQL profiles.current_coordinate only every 15-20 seconds.

Channel Allocation: * Unassigned providers broadcast to gerak:telemetry:active:zone_{geohash_prefix}.

Active trips isolate consumer and provider into gerak:job_stream:id_{order_id}.

Database Schema Blueprint

When generating migrations, use this exact PostgreSQL / PostGIS blueprint:

CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TYPE gerak_vertical AS ENUM ('RIDE', 'FOOD', 'JUBAH_RUNNER');
CREATE TYPE gerak_status AS ENUM ('DRAFT', 'SEARCHING', 'ASSIGNED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE gerak_payment_status AS ENUM ('UNPAID', 'PENDING_VERIFICATION', 'SETTLED');
CREATE TYPE gerak_payment_type AS ENUM ('CASH', 'DUITNOW_QR');
CREATE TYPE gerak_role AS ENUM ('admin', 'driver', 'customer', 'food_runner', 'jubah_runner');

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(100) NOT NULL,
    roles gerak_role[] NOT NULL DEFAULT '{customer}',
    is_online BOOLEAN DEFAULT FALSE,
    current_coordinate GEOGRAPHY(Point, 4326) NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_profiles_spatial_loc ON profiles USING GIST (current_coordinate) WHERE is_online = true;

CREATE TABLE orders (
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_orders_pickup_spatial ON orders USING GIST (pickup_coordinate);
CREATE INDEX idx_orders_status_filtering ON orders (status) WHERE status = 'SEARCHING';

CREATE TABLE order_food_details (
    order_id UUID PRIMARY KEY REFERENCES orders(id) ON DELETE CASCADE,
    restaurant_name VARCHAR(150) NOT NULL,
    restaurant_coordinate GEOGRAPHY(Point, 4326) NOT NULL,
    basket_items JSONB NOT NULL,
    preparation_notes TEXT
);

CREATE TABLE order_jubah_details (
    order_id UUID PRIMARY KEY REFERENCES orders(id) ON DELETE CASCADE,
    form_version INT DEFAULT 1,
    task_instructions_list JSONB NOT NULL, 
    additional_notes TEXT
);

CREATE TABLE trip_history_archives (
    id UUID PRIMARY KEY, 
    customer_id UUID NOT NULL,
    provider_id UUID NOT NULL,
    vertical gerak_vertical NOT NULL,
    final_price DECIMAL(10,2) NOT NULL,
    historical_path_jsonb JSONB NOT NULL, 
    route_path GEOGRAPHY(LineString, 4326) NULL, 
    archived_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


Dispatch and Matching Execution

PostGIS Bounding: Never loop through users in application code. Use ST_DWithin to find providers within a 4,000-meter threshold, filtered by the required gerak_role.

Race-Condition Locks: Use Redis SETNX or Postgres SELECT ... FOR UPDATE NOWAIT when assigning orders. Give providers a strict 15-second TTL to accept a job before cycling to the next provider.

Troubleshooting Checklist

When diagnosing bugs, run through this list:

Network vs DB: Did the WebSocket frame drop, or is Postgres locked up?

Bounds: Are incoming coordinates valid (-90 <= lat <= 90, -180 <= lng <= 180)?

Idempotency: Does the API parse X-Idempotency-Key headers to prevent duplicate order creation on network retries?