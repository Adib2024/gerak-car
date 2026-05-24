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

  useEffect(() => {
    if (!isOnline) {
      setIncomingRide((prev: any) => (prev && prev.status !== 'pending' ? prev : null))
      return
    }

    const channel = supabase.channel('driver-rides')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'rides', filter: "status=eq.pending" }, (payload) => {
        setIncomingRide(payload.new)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [isOnline, supabase])

  const updateRideStatus = async (newStatus: string) => {
    if (!incomingRide || !userId) return
    
    const previousStatus = incomingRide.status
    setIncomingRide({ ...incomingRide, status: newStatus })

    if (newStatus === 'accepted') setIsOnline(false)

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
      setTimeout(() => {
        setIncomingRide(null)
        setIsOnline(true)
      }, 3000)
    }
  }

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

  return (
    <div className="relative w-full h-[calc(100vh-80px)] overflow-hidden flex flex-col bg-black">
      
      {/* 100% Full Screen Map */}
      <div className="absolute inset-0 w-full h-full z-0">
        <InteractiveMap userLocation={location} markers={markers} />
      </div>

      {/* Floating Status UI (When Offline/Online without Ride) */}
      {!incomingRide && (
        <div className="absolute bottom-10 left-0 right-0 z-20 px-6 flex justify-center pointer-events-none">
          <button 
            onClick={() => setIsOnline(!isOnline)}
            className={`pointer-events-auto px-10 py-5 rounded-full font-extrabold text-xl tracking-wider shadow-2xl transition-all border w-full max-w-sm ${
              isOnline 
                ? 'bg-emerald-500 text-black hover:bg-emerald-400 shadow-[0_0_40px_rgba(16,185,129,0.5)] border-emerald-400' 
                : 'bg-zinc-900 border-white/10 text-white hover:bg-zinc-800'
            }`}
          >
            {isOnline ? '🟢 YOU ARE ONLINE' : 'GO ONLINE'}
          </button>
        </div>
      )}

      {/* Incoming / Active Ride Bottom Sheet */}
      {incomingRide && (
        <div className="absolute bottom-0 left-0 right-0 z-30 w-full pointer-events-none flex flex-col items-center">
          <div className="w-full max-w-lg bg-zinc-950 shadow-[0_-20px_40px_rgba(0,0,0,0.6)] pointer-events-auto flex flex-col p-6 pb-8 transition-transform duration-300 rounded-t-[32px] border-t border-l border-r border-white/5">
            {/* Grab-style Handle bar */}
            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6"></div>

            {/* HEADER */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-white font-extrabold text-2xl flex items-center gap-3">
                {incomingRide.status === 'pending' && (
                  <>
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    New Request
                  </>
                )}
                {incomingRide.status === 'accepted' && 'En route to pickup'}
                {incomingRide.status === 'arrived' && 'Waiting for customer'}
                {incomingRide.status === 'in_progress' && 'Driving to dropoff'}
                {incomingRide.status === 'completed' && 'Trip Completed!'}
              </h3>
              <span className="bg-emerald-500/10 text-emerald-400 text-sm font-bold px-4 py-2 rounded-xl border border-emerald-500/20">
                RM {incomingRide.price}
              </span>
            </div>

            {/* ROUTE DISPLAY */}
            <div className="relative bg-zinc-900 border border-white/10 rounded-3xl p-4 mb-6 shadow-inner">
               <div className="absolute left-7 top-[34px] bottom-[34px] w-0.5 bg-white/10"></div>
               
               <div className="flex items-center gap-4 mb-4">
                  <div className="w-6 h-6 flex items-center justify-center relative z-10">
                     <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                  </div>
                  <div className="flex-1 text-sm font-medium text-white truncate">
                     {incomingRide.pickup_address}
                  </div>
               </div>

               <div className="h-px bg-white/5 ml-10 mb-4"></div>

               <div className="flex items-center gap-4">
                  <div className="w-6 h-6 flex items-center justify-center relative z-10 bg-zinc-900">
                     <div className="w-2 h-2 bg-blue-500 rounded-sm"></div>
                  </div>
                  <div className="flex-1 text-sm font-medium text-white truncate">
                     {incomingRide.dropoff_address}
                  </div>
               </div>
            </div>

            {/* ACTION BUTTONS */}
            {incomingRide.status === 'pending' && (
              <div className="flex gap-4">
                <button onClick={() => setIncomingRide(null)} className="flex-[0.5] bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-5 rounded-2xl transition-all">
                  DECLINE
                </button>
                <button onClick={() => updateRideStatus('accepted')} className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold py-5 rounded-2xl transition-all shadow-lg text-lg">
                  ACCEPT RIDE
                </button>
              </div>
            )}
            
            {incomingRide.status === 'accepted' && (
              <button onClick={() => updateRideStatus('arrived')} className="w-full bg-blue-500 hover:bg-blue-400 text-white font-extrabold py-5 rounded-2xl transition-all shadow-lg text-lg">
                I HAVE ARRIVED
              </button>
            )}

            {incomingRide.status === 'arrived' && (
              <button onClick={() => updateRideStatus('in_progress')} className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold py-5 rounded-2xl transition-all shadow-lg text-lg">
                START TRIP
              </button>
            )}

            {incomingRide.status === 'in_progress' && (
              <button onClick={() => updateRideStatus('completed')} className="w-full bg-red-500 hover:bg-red-400 text-white font-extrabold py-5 rounded-2xl transition-all shadow-lg text-lg">
                COMPLETE TRIP
              </button>
            )}
            
            {incomingRide.status === 'completed' && (
              <div className="text-center py-4">
                <p className="text-zinc-400 font-medium">Returning to map...</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
