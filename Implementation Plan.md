# Gerak Car: University Ride-Hailing App Architecture Plan

This document outlines the architecture, database, cost analysis, and technical plan for building "Gerak Car," a ride-hailing application tailored for a university student population in Malaysia (approx. 4,000 potential users).

## Goal Description
To build a functional, scalable, and cost-effective ride-hailing platform (similar to Grab/Uber) specifically for university students. The system will handle three distinct user roles (Customer, Driver, Admin) and leverage modern web/mobile technologies to minimize or completely eliminate hosting and infrastructure costs.

---

## ⚠️ User Review Required & Open Questions

Before we begin coding, please review and answer the following questions to help narrow down the technology choices:

> [!IMPORTANT]
> 1. **App Format:** Do you want this to be a **Web App / PWA** (accessible via browser, installed to home screen, bypassing app stores) or a **Native Mobile App** (built with React Native/Expo for iOS/Android app stores)? *For a zero-cost start, a Web App (PWA) is highly recommended.*
> 2. **Authentication Restriction:** Should we restrict sign-ups ONLY to students with a specific university email address (e.g., `@siswa.um.edu.my`)?
> 3. **Payment System:** Will the app handle online payments (which requires a payment gateway like Stripe/ToyyibPay and has transaction fees), or will it be strictly **Cash/QR DuitNow** directly between driver and customer?

---

## 1. User Roles & Layouts

Yes, you are completely correct! The app will have three distinct interfaces, as each user has entirely different needs:

### 📱 Customer App
*   **Focus:** Booking a ride quickly.
*   **Layout:** A full-screen map showing current location, a search bar for the destination, a price estimator, and a "Book Now" button.
*   **Features:** Live tracking of the driver, ride history, and driver rating.

### 🚗 Driver App
*   **Focus:** Accepting jobs and navigation.
*   **Layout:** A map showing their current location, an "Online/Offline" toggle switch, and a pop-up alert for incoming ride requests.
*   **Features:** Accept/Reject ride, turn-by-turn navigation (linking to Google Maps/Waze), and daily earnings summary.

### 💻 Admin Dashboard
*   **Focus:** System management and oversight.
*   **Layout:** A desktop-optimized dashboard with charts and data tables.
*   **Features:** Verify driver applications (checking student ID/license), monitor active rides, ban problematic users, and view overall app usage.

---

## 2. Authentication Strategy

For 4,000 users, we need a secure but free authentication system.
*   **Technology:** We will use **Supabase Auth** (which is built on top of PostgreSQL).
*   **Method:** **Email & Password** + **Google OAuth**.
*   **Verification:** We can enforce email confirmation. If you want to ensure *only* students use it, we can block any email that doesn't end in the university's official domain.
*   **Role Management:** When a user signs up, they are a "Customer" by default. If they apply to be a driver, an Admin must manually change their role to "Driver" in the database.

---

## 3. Database & Real-Time Tracking

For a ride-hailing app, the database needs to handle relational data (users, rides) AND geospatial data (finding the nearest driver).

*   **Database:** **Supabase (PostgreSQL)**. 
    *   *Why?* It includes **PostGIS**, an extension specifically made for mapping and calculating distances between coordinates (e.g., finding all drivers within a 3km radius).
*   **Real-time:** We will use **Supabase Realtime (WebSockets)**. When a driver's GPS location changes, the database broadcasts that change instantly to the customer's app so the car moves on their map without refreshing the page.

### High-Level Database Schema:
1.  `users` (id, name, phone, role: admin/driver/customer)
2.  `driver_locations` (driver_id, current_location (Lat/Lng), is_active)
3.  `rides` (id, customer_id, driver_id, pickup_loc, dropoff_loc, status, price, created_at)

---

## 4. Cost Analysis: Can it be built for free?

**YES.** For a university of 4,000 students, you can run this entirely on **Free Tiers** while you validate the idea. 

| Service | Technology | Free Tier Limit | Cost for 4k Users |
| :--- | :--- | :--- | :--- |
| **Hosting (Frontend)** | Vercel or Netlify | 100GB bandwidth/mo | **$0** (Plenty for 4k users) |
| **Database & Auth** | Supabase | 500MB DB size, 50,000 active users/mo | **$0** (Text data is very small) |
| **Maps (Display)** | Mapbox | 50,000 map loads / month | **$0** (If managed well) |
| **Routing (Distance/Time)** | Mapbox Directions | 100,000 API requests / month | **$0** |

*Note: Once your app grows beyond 50,000 map loads a month, Mapbox charges a small fee. By that point, you should be monetizing the app (e.g., taking a small commission per ride) to cover costs.*

---

## 5. Map API Strategy (The "Not Free" Problem)

You are right to be concerned about Map APIs; Google Maps can get very expensive very fast. Here is how we avoid high costs:

1.  **Do NOT use Google Maps API directly inside the app.** Google gives a $200 monthly credit, but ride-hailing apps consume this quickly.
2.  **Use Mapbox:** Mapbox provides a beautiful, customizable map that is developer-friendly and offers a generous 50,000 free map loads per month.
3.  **For Driver Navigation:** Instead of building complex turn-by-turn navigation inside your app (which costs money for the API), we will add a button that says *"Navigate to User"*. When the driver clicks it, it passes the coordinates and **opens the native Google Maps or Waze app** on their phone. This is 100% free!

---

## Next Steps

1.  Please review the **Open Questions** at the top.
2.  Let me know if you approve of using **Supabase** (Database/Auth) and **Next.js/React** (Frontend/PWA).
3.  Once approved, I will set up the project workspace and begin scaffolding the application architecture!
