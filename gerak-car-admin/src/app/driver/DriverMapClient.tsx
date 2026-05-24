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
    <div className="relative w-full h-[calc(100vh-80px)] md:h-screen overflow-hidden flex flex-col bg-[#1c1c1c] font-sans">
      
      {/* 100% Full Screen Map */}
      <div className="absolute inset-0 w-full h-full z-0">
        <InteractiveMap userLocation={location} markers={markers} />
      </div>

      {/* Floating Action Buttons (Right Side) */}
      <div className="absolute right-4 bottom-[280px] z-10 flex flex-col gap-3 pointer-events-none">
         <button className="w-12 h-12 bg-[#2a2a2a] rounded-full flex items-center justify-center shadow-lg border border-white/10 pointer-events-auto text-white hover:bg-[#333] transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
         </button>
         <button className="w-12 h-12 bg-[#2a2a2a] rounded-full flex items-center justify-center shadow-lg border border-white/10 pointer-events-auto text-white hover:bg-[#333] transition-colors">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L21 21l-9-4-9 4 9-19z"/></svg>
         </button>
         <button className="w-12 h-12 bg-[#2a2a2a] rounded-full flex items-center justify-center shadow-lg border border-white/10 pointer-events-auto text-white hover:bg-[#333] transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
         </button>
      </div>

      {/* BOTTOM SECTION */}
      <div className="absolute bottom-0 left-0 right-0 z-20 flex flex-col pointer-events-none">
        
        {/* Active Ride Popup (Overlays everything if there is a ride) */}
        {incomingRide && (
          <div className="w-full bg-[#242424] pointer-events-auto flex flex-col p-6 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-white/10 mb-4 mx-2">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-white font-bold text-xl flex items-center gap-3">
                {incomingRide.status === 'pending' && <><span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span> New Request</>}
                {incomingRide.status === 'accepted' && 'En route to pickup'}
                {incomingRide.status === 'arrived' && 'Waiting for customer'}
                {incomingRide.status === 'in_progress' && 'Driving to dropoff'}
                {incomingRide.status === 'completed' && 'Trip Completed!'}
              </h3>
              <span className="text-emerald-400 font-bold text-lg">RM {incomingRide.price}</span>
            </div>

            <div className="bg-[#1c1c1c] rounded-2xl p-4 mb-6">
               <div className="flex items-center gap-4 mb-3">
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>
                  <div className="flex-1 text-sm text-white truncate">{incomingRide.pickup_address}</div>
               </div>
               <div className="flex items-center gap-4">
                  <div className="w-2.5 h-2.5 bg-blue-500 rounded-sm"></div>
                  <div className="flex-1 text-sm text-white truncate">{incomingRide.dropoff_address}</div>
               </div>
            </div>

            {incomingRide.status === 'pending' && (
              <div className="flex gap-4">
                <button onClick={() => setIncomingRide(null)} className="flex-1 bg-[#333] text-white font-bold py-4 rounded-xl">Decline</button>
                <button onClick={() => updateRideStatus('accepted')} className="flex-1 bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-lg">Accept</button>
              </div>
            )}
            {incomingRide.status === 'accepted' && <button onClick={() => updateRideStatus('arrived')} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl">I Have Arrived</button>}
            {incomingRide.status === 'arrived' && <button onClick={() => updateRideStatus('in_progress')} className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl">Start Trip</button>}
            {incomingRide.status === 'in_progress' && <button onClick={() => updateRideStatus('completed')} className="w-full bg-red-600 text-white font-bold py-4 rounded-xl">Complete Trip</button>}
          </div>
        )}

        {/* Offline/Online Default View */}
        {!incomingRide && (
          <>
            {/* Go Online Pill */}
            <div className="flex justify-center -mb-6 relative z-30">
               <button 
                  onClick={() => setIsOnline(!isOnline)}
                  className={`pointer-events-auto px-8 py-3.5 rounded-full font-bold text-lg flex items-center gap-3 shadow-2xl transition-colors border-2 ${
                    isOnline ? 'bg-[#00B14F] text-white border-[#00B14F] hover:bg-[#009b44]' : 'bg-[#1c1c1c] text-white border-transparent hover:bg-[#2a2a2a]'
                  }`}
               >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  {isOnline ? 'Go Offline' : 'Go Online'}
               </button>
            </div>

            {/* Status Sheet */}
            <div className="bg-[#242424] pt-10 pb-6 px-4 rounded-t-3xl pointer-events-auto flex flex-col border-t border-white/5">
               {/* Status Bar */}
               <div className="bg-[#1c1c1c] rounded-xl p-4 flex items-center gap-3 mb-6">
                  <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-[#00B14F]' : 'bg-[#FF5A5F]'}`}></div>
                  <span className="text-white font-medium text-[15px]">{isOnline ? "You're online. Finding rides..." : "You're offline."}</span>
               </div>

               {/* Quick Actions */}
               <div className="flex justify-center gap-12 mb-4">
                  <div className="flex flex-col items-center gap-2 cursor-pointer group">
                     <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center group-hover:bg-zinc-200 transition-colors shadow-sm">
                        <svg className="w-8 h-8 text-[#006633]" fill="currentColor" viewBox="0 0 24 24"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>
                     </div>
                     <span className="text-zinc-300 text-xs font-medium text-center leading-tight">Service<br/>Types</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 cursor-pointer group">
                     <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center group-hover:bg-zinc-200 transition-colors shadow-sm">
                        <svg className="w-7 h-7 text-[#006633]" fill="currentColor" viewBox="0 0 24 24"><path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.5 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/></svg>
                     </div>
                     <span className="text-zinc-300 text-xs font-medium text-center leading-tight">Diagnostic</span>
                  </div>
               </div>
            </div>
          </>
        )}

        {/* Bottom Navigation Bar */}
        <div className="bg-[#151515] h-16 flex items-center justify-around pointer-events-auto border-t border-white/5 pb-safe">
           <button className="flex flex-col items-center gap-1 text-[#00B14F]">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
              <span className="text-[10px] font-medium">Home</span>
           </button>
           <button className="flex flex-col items-center gap-1 text-zinc-500 hover:text-zinc-300 transition-colors">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              <span className="text-[10px] font-medium">Earnings</span>
           </button>
           <button className="flex flex-col items-center gap-1 text-zinc-500 hover:text-zinc-300 transition-colors relative">
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#FF5A5F] rounded-full border-2 border-[#151515]"></div>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
              <span className="text-[10px] font-medium">Inbox</span>
           </button>
           <button className="flex flex-col items-center gap-1 text-zinc-500 hover:text-zinc-300 transition-colors">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <span className="text-[10px] font-medium">Planner</span>
           </button>
           <button className="flex flex-col items-center gap-1 text-zinc-500 hover:text-zinc-300 transition-colors">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              <span className="text-[10px] font-medium">Profile</span>
           </button>
        </div>
      </div>
    </div>
  )
}
