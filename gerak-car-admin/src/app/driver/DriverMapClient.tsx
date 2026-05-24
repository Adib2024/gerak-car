'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { createClient } from '@/utils/supabase/client'

// Dynamically import the map so it ONLY renders on the client side
const InteractiveMap = dynamic(() => import('@/components/Map'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl relative z-10 shadow-2xl">
      <svg className="animate-spin h-8 w-8 text-emerald-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <p className="text-zinc-400 font-bold tracking-wide">Initializing Map...</p>
    </div>
  )
})

export default function DriverMapClient() {
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [location, setLocation] = useState<[number, number] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isOnline, setIsOnline] = useState(false)
  
  // Incoming ride requests
  const [incomingRide, setIncomingRide] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user?.id || null))

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.')
      return
    }

    // Use watchPosition so the driver map updates automatically as they drive
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setLocation([position.coords.latitude, position.coords.longitude])
        setError(null) // clear error if we successfully get location
      },
      (err) => {
        console.error("Location error:", err)
        setError('Please allow location access to use the driver map.')
      },
      { enableHighAccuracy: true }
    )
    
    return () => navigator.geolocation.clearWatch(watchId)
  }, [supabase.auth])

  // Setup Realtime subscription for incoming rides when online
  useEffect(() => {
    if (!isOnline) {
      setIncomingRide(null)
      return
    }

    // Subscribe to new pending rides
    const channel = supabase.channel('driver-rides')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'rides', filter: "status=eq.pending" }, (payload) => {
        console.log("New incoming ride!", payload)
        setIncomingRide(payload.new)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [isOnline, supabase])

  const acceptRide = async () => {
    if (!incomingRide || !userId) return
    
    const { error } = await supabase
      .from('rides')
      .update({ status: 'accepted', driver_id: userId })
      .eq('id', incomingRide.id)
      
    if (error) {
      console.error("Failed to accept ride", error)
      alert("Someone else accepted this ride or an error occurred.")
    } else {
      setIncomingRide({ ...incomingRide, status: 'accepted' })
      setIsOnline(false) // Temporarily go offline while in a ride
    }
  }

  // Draw incoming ride markers
  const markers = []
  if (incomingRide) {
    // Extract lat/lng from PostGIS POINT(lon lat) string
    // Format: POINT(103.1119 3.7176)
    try {
      const pickupMatch = incomingRide.pickup_location.match(/POINT\(([^ ]+) ([^)]+)\)/)
      const dropoffMatch = incomingRide.dropoff_location.match(/POINT\(([^ ]+) ([^)]+)\)/)
      
      if (pickupMatch) {
        markers.push({
          id: 'req_pickup',
          position: [parseFloat(pickupMatch[2]), parseFloat(pickupMatch[1])] as [number, number],
          label: 'Customer Pickup: ' + incomingRide.pickup_address
        })
      }
      if (dropoffMatch) {
        markers.push({
          id: 'req_dropoff',
          position: [parseFloat(dropoffMatch[2]), parseFloat(dropoffMatch[1])] as [number, number],
          label: 'Customer Dropoff: ' + incomingRide.dropoff_address
        })
      }
    } catch(e) {}
  }

  return (
    <div className="relative w-full h-full min-h-[500px] rounded-3xl overflow-hidden z-0">
      
      {/* Floating Status UI */}
      <div className="absolute top-6 left-0 right-0 z-20 px-6 max-w-sm mx-auto flex justify-center pointer-events-none">
        <button 
          onClick={() => setIsOnline(!isOnline)}
          className={`pointer-events-auto px-8 py-4 rounded-full font-extrabold text-lg tracking-wider shadow-2xl transition-all border ${
            isOnline 
              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.3)]' 
              : 'bg-black/60 border-white/20 text-white hover:bg-black/80 backdrop-blur-md'
          }`}
        >
          {isOnline ? '🟢 YOU ARE ONLINE' : '🔴 GO ONLINE'}
        </button>
      </div>

      {/* Incoming Ride Popup */}
      {incomingRide && incomingRide.status === 'pending' && (
        <div className="absolute bottom-6 left-0 right-0 z-30 px-6 max-w-md mx-auto pointer-events-none">
          <div className="bg-black/80 backdrop-blur-3xl border border-emerald-500/30 rounded-3xl p-6 shadow-[0_0_50px_rgba(16,185,129,0.2)] pointer-events-auto">
            <h3 className="text-white font-extrabold text-xl mb-4 flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              New Ride Request
            </h3>
            
            <div className="space-y-3 mb-6">
              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <p className="text-zinc-500 text-xs font-bold uppercase mb-1">Pickup</p>
                <p className="text-emerald-400 font-medium text-sm truncate">{incomingRide.pickup_address}</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <p className="text-zinc-500 text-xs font-bold uppercase mb-1">Dropoff</p>
                <p className="text-cyan-400 font-medium text-sm truncate">{incomingRide.dropoff_address}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setIncomingRide(null)} className="flex-1 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 font-bold py-3 px-4 rounded-xl transition-all border border-red-500/20">
                Decline
              </button>
              <button onClick={acceptRide} className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold py-3 px-4 rounded-xl transition-all shadow-lg">
                Accept Ride
              </button>
            </div>
          </div>
        </div>
      )}

      {incomingRide && incomingRide.status === 'accepted' && (
        <div className="absolute bottom-6 left-0 right-0 z-30 px-6 max-w-md mx-auto pointer-events-none">
          <div className="bg-emerald-500/20 backdrop-blur-3xl border border-emerald-500/50 rounded-3xl p-6 shadow-[0_0_50px_rgba(16,185,129,0.3)] pointer-events-auto text-center">
             <h3 className="text-emerald-400 font-extrabold text-2xl mb-2">Ride Accepted!</h3>
             <p className="text-emerald-100/70 text-sm mb-6">Proceed to the pickup location.</p>
             <button onClick={() => setIncomingRide(null)} className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold py-3 px-4 rounded-xl transition-all shadow-lg">
                Finish Ride
             </button>
          </div>
        </div>
      )}

      {/* Map renders immediately. userLocation is null until GPS locks on */}
      <InteractiveMap userLocation={location} markers={markers} />
    </div>
  )
}
