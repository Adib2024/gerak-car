'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { createClient } from '@/utils/supabase/client'

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
  
  const [incomingRide, setIncomingRide] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user?.id || null))

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.')
      return
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setLocation([position.coords.latitude, position.coords.longitude])
        setError(null)
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
      // CRITICAL FIX: Only clear the ride if it was just pending. 
      // If we accepted it, we want to keep it on screen!
      setIncomingRide((prev: any) => (prev && prev.status !== 'pending' ? prev : null))
      return
    }

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

  const updateRideStatus = async (newStatus: string) => {
    if (!incomingRide || !userId) return
    
    // Optimistic UI update
    const previousStatus = incomingRide.status
    setIncomingRide({ ...incomingRide, status: newStatus })

    // If accepting, we go offline automatically so we don't get new rides
    if (newStatus === 'accepted') {
      setIsOnline(false)
    }

    const { error } = await supabase
      .from('rides')
      .update(newStatus === 'accepted' ? { status: newStatus, driver_id: userId } : { status: newStatus })
      .eq('id', incomingRide.id)
      
    if (error) {
      console.error(`Failed to update ride to ${newStatus}`, error)
      alert("Failed to update ride status. Someone else may have taken it.")
      setIncomingRide(previousStatus === 'pending' ? null : { ...incomingRide, status: previousStatus })
      if (newStatus === 'accepted') setIsOnline(true)
    }
    
    if (newStatus === 'completed') {
      setIncomingRide(null)
      setIsOnline(true) // Go back online after completing a ride
    }
  }

  // Draw incoming ride markers
  const markers = []
  if (incomingRide) {
    try {
      const pickupMatch = incomingRide.pickup_location.match(/POINT\(([^ ]+) ([^)]+)\)/)
      const dropoffMatch = incomingRide.dropoff_location.match(/POINT\(([^ ]+) ([^)]+)\)/)
      
      if (pickupMatch) {
        markers.push({
          id: 'req_pickup',
          position: [parseFloat(pickupMatch[2]), parseFloat(pickupMatch[1])] as [number, number],
          label: 'PICKUP: ' + incomingRide.pickup_address
        })
      }
      if (dropoffMatch) {
        markers.push({
          id: 'req_dropoff',
          position: [parseFloat(dropoffMatch[2]), parseFloat(dropoffMatch[1])] as [number, number],
          label: 'DROPOFF: ' + incomingRide.dropoff_address
        })
      }
    } catch(e) {}
  }

  // Determine what button to show based on ride status
  const getLifecycleButton = () => {
    if (!incomingRide) return null

    switch (incomingRide.status) {
      case 'accepted':
        return (
          <button onClick={() => updateRideStatus('arrived')} className="w-full bg-blue-500 hover:bg-blue-400 text-white font-extrabold py-4 px-6 rounded-2xl transition-all shadow-lg text-lg">
             I HAVE ARRIVED
          </button>
        )
      case 'arrived':
        return (
          <button onClick={() => updateRideStatus('in_progress')} className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold py-4 px-6 rounded-2xl transition-all shadow-lg text-lg">
             START TRIP
          </button>
        )
      case 'in_progress':
        return (
          <button onClick={() => updateRideStatus('completed')} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-4 px-6 rounded-2xl transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)] text-lg border border-emerald-400">
             COMPLETE TRIP
          </button>
        )
      default:
        return null
    }
  }

  return (
    <div className="relative w-full h-full min-h-[500px] rounded-3xl overflow-hidden z-0">
      
      {/* Floating Status UI */}
      {!incomingRide && (
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
      )}

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
              <div className="bg-white/5 border border-emerald-500/30 rounded-xl p-3">
                <p className="text-zinc-500 text-xs font-bold uppercase mb-1">Pickup</p>
                <p className="text-emerald-400 font-medium text-sm truncate">{incomingRide.pickup_address}</p>
              </div>
              <div className="bg-white/5 border border-cyan-500/30 rounded-xl p-3">
                <p className="text-zinc-500 text-xs font-bold uppercase mb-1">Dropoff</p>
                <p className="text-cyan-400 font-medium text-sm truncate">{incomingRide.dropoff_address}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setIncomingRide(null)} className="flex-1 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 font-bold py-3 px-4 rounded-xl transition-all border border-red-500/20">
                Decline
              </button>
              <button onClick={() => updateRideStatus('accepted')} className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold py-3 px-4 rounded-xl transition-all shadow-lg">
                Accept Ride
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Ride Lifecycle UI */}
      {incomingRide && incomingRide.status !== 'pending' && (
        <div className="absolute bottom-6 left-0 right-0 z-30 px-6 max-w-md mx-auto pointer-events-none">
          <div className="bg-black/90 backdrop-blur-3xl border border-white/20 rounded-3xl p-6 shadow-[0_0_50px_rgba(0,0,0,0.5)] pointer-events-auto">
             <div className="flex justify-between items-center mb-6">
               <h3 className="text-white font-extrabold text-xl">
                 {incomingRide.status === 'accepted' && 'En route to pickup'}
                 {incomingRide.status === 'arrived' && 'Waiting for customer'}
                 {incomingRide.status === 'in_progress' && 'Driving to destination'}
               </h3>
               <span className="bg-white/10 text-white text-xs font-bold px-3 py-1 rounded-full border border-white/20">
                 RM {incomingRide.price}
               </span>
             </div>

             <div className="mb-6">
               {incomingRide.status === 'accepted' || incomingRide.status === 'arrived' ? (
                 <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                   <p className="text-emerald-500 text-xs font-bold uppercase mb-1">Navigate To Pickup</p>
                   <p className="text-white font-medium text-sm">{incomingRide.pickup_address}</p>
                 </div>
               ) : (
                 <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4">
                   <p className="text-cyan-500 text-xs font-bold uppercase mb-1">Navigate To Dropoff</p>
                   <p className="text-white font-medium text-sm">{incomingRide.dropoff_address}</p>
                 </div>
               )}
             </div>

             {getLifecycleButton()}
          </div>
        </div>
      )}

      <InteractiveMap userLocation={location} markers={markers} />
    </div>
  )
}
