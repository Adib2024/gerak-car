'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { createClient } from '@/utils/supabase/client'
import { ThemeToggle } from '@/components/ThemeToggle'

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
  const [activeTab, setActiveTab] = useState<'home'|'earnings'|'inbox'|'planner'|'profile'>('home')
  const [activeModal, setActiveModal] = useState<string | null>(null)
  
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
      setIncomingRide((prev: any) => (prev && prev.status !== 'SEARCHING' ? prev : null))
      
      // If they go offline, mark them inactive in the DB
      if (location) {
        supabase.rpc('update_driver_location', { p_lat: location[0], p_lng: location[1], p_is_active: false })
      }
      return
    }

    // When online, ping the DB every 10 seconds with the current location
    if (location) {
       supabase.rpc('update_driver_location', { p_lat: location[0], p_lng: location[1], p_is_active: true })
    }
    const locationPing = setInterval(() => {
       if (location) {
         supabase.rpc('update_driver_location', { p_lat: location[0], p_lng: location[1], p_is_active: true })
       }
    }, 10000)

    const channel = supabase.channel('driver-rides')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders', filter: "status=eq.SEARCHING" }, (payload) => {
        setIncomingRide(payload.new)
      })
      .subscribe()

    return () => {
      clearInterval(locationPing)
      supabase.removeChannel(channel)
    }
  }, [isOnline, location, supabase])

  const updateRideStatus = async (newStatus: string) => {
    if (!incomingRide || !userId) return
    
    const previousStatus = incomingRide.status

    if (newStatus === 'ASSIGNED') {
      // Use the RPC to safely handle race conditions
      const { data, error } = await supabase.rpc('accept_order', { p_order_id: incomingRide.id })
      
      if (error || !data || !data[0].success) {
        console.error("Failed to accept ride:", error || data)
        alert(data?.[0]?.message || "This order has already been taken by another driver.")
        setIncomingRide(null)
        return
      }
      
      setIncomingRide({ ...incomingRide, status: newStatus })
      setIsOnline(false)
      return
    }

    // For other status updates (arrived, in_progress, completed)
    setIncomingRide({ ...incomingRide, status: newStatus })

    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', incomingRide.id)
      
    if (error) {
      console.error(`Failed to update ride to ${newStatus}`, error)
      alert("Failed to update ride status.")
      setIncomingRide({ ...incomingRide, status: previousStatus })
    }
    
    if (newStatus === 'COMPLETED') {
      setTimeout(() => {
        setIncomingRide(null)
        setIsOnline(true)
      }, 3000)
    }
  }

  const markers = []
  if (incomingRide) {
    try {
      const pickupMatch = incomingRide.pickup_coordinate.match(/POINT\(([^ ]+) ([^)]+)\)/)
      const dropoffMatch = incomingRide.dropoff_coordinate.match(/POINT\(([^ ]+) ([^)]+)\)/)
      
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
    <div className="relative w-full h-full overflow-hidden flex flex-col bg-[#1c1c1c] font-sans">
      
      {/* MAP LAYER */}
      {activeTab === 'home' && (
        <div className="absolute inset-0 w-full h-full z-0">
          <InteractiveMap userLocation={location} markers={markers} />
        </div>
      )}

      {/*// Floating Action Buttons (Right Side) - ONLY ON HOME
      {activeTab === 'home' && (
        <div className="absolute right-4 bottom-[280px] z-10 flex flex-col gap-3 pointer-events-none">
           <button onClick={() => setActiveModal('weather')} className="w-12 h-12 bg-white dark:bg-[#2a2a2a] rounded-full flex items-center justify-center shadow-lg border border-zinc-200 dark:border-white/10 pointer-events-auto text-black dark:text-white hover:bg-zinc-100 dark:hover:bg-[#333] transition-colors">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
           </button>
           <button onClick={() => setActiveModal('navigation')} className="w-12 h-12 bg-white dark:bg-[#2a2a2a] rounded-full flex items-center justify-center shadow-lg border border-zinc-200 dark:border-white/10 pointer-events-auto text-black dark:text-white hover:bg-zinc-100 dark:hover:bg-[#333] transition-colors">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L21 21l-9-4-9 4 9-19z"/></svg>
           </button>
           <button onClick={() => setActiveModal('layers')} className="w-12 h-12 bg-white dark:bg-[#2a2a2a] rounded-full flex items-center justify-center shadow-lg border border-zinc-200 dark:border-white/10 pointer-events-auto text-black dark:text-white hover:bg-zinc-100 dark:hover:bg-[#333] transition-colors">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
           </button>
        </div>
      )}

      {/* FULL SCREEN MODALS FOR OTHER TABS */}
      {activeTab !== 'home' && (
         <div className="absolute inset-0 bg-zinc-50 dark:bg-[#1c1c1c] z-10 pt-16 px-6 overflow-y-auto pb-32">
            <h2 className="text-3xl font-extrabold text-black dark:text-white capitalize mb-6">{activeTab}</h2>
            
            {activeTab === 'earnings' && (
               <div className="bg-white dark:bg-[#242424] p-6 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-lg text-center">
                  <p className="text-zinc-500 dark:text-zinc-400 font-medium mb-2">Today's Earnings</p>
                  <h1 className="text-5xl font-extrabold text-black dark:text-white">RM 0.00</h1>
               </div>
            )}
            
            {activeTab === 'inbox' && (
               <div className="flex flex-col items-center justify-center py-20 text-center">
                  <svg className="w-16 h-16 text-zinc-400 dark:text-zinc-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                  <p className="text-zinc-500 dark:text-zinc-400 font-medium text-lg">No new messages</p>
               </div>
            )}
            
            {activeTab === 'planner' && (
               <div className="flex flex-col items-center justify-center py-20 text-center">
                  <svg className="w-16 h-16 text-zinc-400 dark:text-zinc-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  <p className="text-zinc-500 dark:text-zinc-400 font-medium text-lg">No scheduled rides</p>
               </div>
            )}
            
            {activeTab === 'profile' && (
               <div className="flex flex-col gap-6">
                  <div className="bg-white dark:bg-[#242424] p-6 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-lg flex items-center gap-4">
                     <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center text-black dark:text-white">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                     </div>
                     <div>
                        <h3 className="text-black dark:text-white font-bold text-xl">Driver Account</h3>
                        <p className="text-zinc-500 dark:text-zinc-400 text-sm">Active</p>
                     </div>
                  </div>

                  <div>
                    <h3 className="text-zinc-500 dark:text-zinc-400 font-bold text-xs uppercase tracking-wider mb-3 pl-2">Appearance</h3>
                    <ThemeToggle />
                  </div>

                  <form action="/auth/signout" method="post" className="mt-4">
                     <button type="submit" className="w-full bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 hover:bg-red-500 hover:text-white text-red-500 font-bold py-4 rounded-xl transition-all shadow-sm dark:shadow-inner flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        Sign Out Completely
                     </button>
                  </form>
               </div>
            )}
         </div>
      )}

      {/* QUICK ACTION MODALS */}
      {activeModal && (
         <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <div className="bg-white dark:bg-[#242424] border border-zinc-200 dark:border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl">
               <h3 className="text-black dark:text-white font-bold text-xl mb-4 capitalize">{activeModal.replace('_', ' ')}</h3>
               <p className="text-zinc-500 dark:text-zinc-400 mb-8">This feature is not available in the current beta version.</p>
               <button onClick={() => setActiveModal(null)} className="w-full bg-black dark:bg-white text-white dark:text-black font-bold py-3 rounded-xl transition-colors shadow-sm">
                  Close
               </button>
            </div>
         </div>
      )}

      {/* BOTTOM SECTION */}
      <div className="absolute bottom-0 left-0 right-0 z-20 flex flex-col pointer-events-none">
        
        {/* Active Ride Popup (Overlays everything if there is a ride) */}
        {activeTab === 'home' && incomingRide && (
          <div className="w-full bg-white dark:bg-[#242424] pointer-events-auto flex flex-col p-6 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-zinc-200 dark:border-white/10 mb-4 mx-2">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-black dark:text-white font-bold text-xl flex items-center gap-3">
                {incomingRide.status === 'SEARCHING' && <><span className="w-3 h-3 rounded-full bg-black dark:bg-white animate-pulse"></span> New Request</>}
                {incomingRide.status === 'ASSIGNED' && 'En route to pickup'}
                {incomingRide.status === 'ARRIVED' && 'Waiting for customer'}
                {incomingRide.status === 'IN_PROGRESS' && 'Driving to dropoff'}
                {incomingRide.status === 'COMPLETED' && 'Trip Completed!'}
              </h3>
              <span className="text-black dark:text-white font-bold text-lg">RM {incomingRide.price_quoted}</span>
            </div>

            <div className="bg-zinc-100 dark:bg-[#1c1c1c] rounded-2xl p-4 mb-6">
               <div className="flex items-center gap-4 mb-3">
                  <div className="w-2.5 h-2.5 bg-black dark:bg-white rounded-full"></div>
                  <div className="flex-1 text-sm text-black dark:text-white truncate">{incomingRide.pickup_address}</div>
               </div>
               <div className="flex items-center gap-4">
                  <div className="w-2.5 h-2.5 bg-zinc-400 rounded-sm"></div>
                  <div className="flex-1 text-sm text-black dark:text-white truncate">{incomingRide.dropoff_address}</div>
               </div>
            </div>

            {incomingRide.status === 'SEARCHING' && (
              <div className="flex gap-4">
                <button onClick={() => setIncomingRide(null)} className="flex-1 bg-zinc-200 dark:bg-[#333] text-black dark:text-white font-bold py-4 rounded-xl shadow-sm">Decline</button>
                <button onClick={() => updateRideStatus('ASSIGNED')} className="flex-1 bg-black dark:bg-white text-white dark:text-black font-bold py-4 rounded-xl shadow-sm">Accept</button>
              </div>
            )}
            {incomingRide.status === 'ASSIGNED' && <button onClick={() => updateRideStatus('ARRIVED')} className="w-full bg-black dark:bg-white text-white dark:text-black font-bold py-4 rounded-xl shadow-sm">I Have Arrived</button>}
            {incomingRide.status === 'ARRIVED' && <button onClick={() => updateRideStatus('IN_PROGRESS')} className="w-full bg-black dark:bg-white text-white dark:text-black font-bold py-4 rounded-xl shadow-sm">Start Trip</button>}
            {incomingRide.status === 'IN_PROGRESS' && <button onClick={() => updateRideStatus('COMPLETED')} className="w-full bg-black dark:bg-white text-white dark:text-black font-bold py-4 rounded-xl shadow-sm">Complete Trip</button>}
          </div>
        )}

        {/* Offline/Online Default View */}
        {activeTab === 'home' && !incomingRide && (
          <>
            {/* Go Online Pill */}
            <div className="flex justify-center -mb-5 relative z-30">
               <button 
                  onClick={() => setIsOnline(!isOnline)}
                  className={`pointer-events-auto px-6 py-2.5 rounded-full font-bold text-base flex items-center gap-2 shadow-[0_10px_20px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_20px_rgba(0,0,0,0.5)] transition-colors border-2 ${
                    isOnline ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white' : 'bg-white dark:bg-[#1c1c1c] text-black dark:text-white border-transparent hover:bg-zinc-100 dark:hover:bg-[#2a2a2a]'
                  }`}
               >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  {isOnline ? 'Go Offline' : 'Go Online'}
               </button>
            </div>

            {/* Status Sheet */}
            <div className="bg-white dark:bg-[#242424] pt-8 pb-4 px-4 rounded-t-3xl pointer-events-auto flex flex-col border-t border-zinc-200 dark:border-white/5">
               {/* Status Bar */}
               <div className="bg-zinc-100 dark:bg-[#1c1c1c] rounded-xl p-3 flex items-center gap-3 mb-4 shadow-inner">
                  <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-black dark:bg-white' : 'bg-zinc-400'}`}></div>
                  <span className="text-black dark:text-white font-medium text-sm">{isOnline ? "You're online. Finding rides..." : "You're offline."}</span>
               </div>

               {/* Quick Actions */}
               <div className="flex justify-center gap-10 mb-2">
                  <div onClick={() => setActiveModal('service_types')} className="flex flex-col items-center gap-1.5 cursor-pointer group">
                     <div className="w-12 h-12 bg-zinc-100 dark:bg-white rounded-full flex items-center justify-center group-hover:bg-zinc-200 transition-colors shadow-sm dark:shadow-md">
                        <svg className="w-6 h-6 text-[#006633]" fill="currentColor" viewBox="0 0 24 24"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>
                     </div>
                     <span className="text-zinc-600 dark:text-zinc-300 text-[10px] font-medium text-center leading-tight">Service<br/>Types</span>
                  </div>
                  <div onClick={() => setActiveModal('diagnostic')} className="flex flex-col items-center gap-1.5 cursor-pointer group">
                     <div className="w-12 h-12 bg-zinc-100 dark:bg-white rounded-full flex items-center justify-center group-hover:bg-zinc-200 transition-colors shadow-sm dark:shadow-md">
                        <svg className="w-5 h-5 text-[#006633]" fill="currentColor" viewBox="0 0 24 24"><path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.5 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/></svg>
                     </div>
                     <span className="text-zinc-600 dark:text-zinc-300 text-[10px] font-medium text-center leading-tight">Diagnostic</span>
                  </div>
               </div>
            </div>
          </>
        )}

        {/* Bottom Navigation Bar */}
        <div className="bg-white dark:bg-[#151515] h-[60px] flex items-center justify-around pointer-events-auto border-t border-zinc-200 dark:border-white/5 pb-safe">
           <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'home' ? 'text-[#00B14F]' : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300'}`}>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
              <span className="text-[9px] font-bold">Home</span>
           </button>
           <button onClick={() => setActiveTab('earnings')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'earnings' ? 'text-[#00B14F]' : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300'}`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              <span className="text-[9px] font-medium">Earnings</span>
           </button>
           <button onClick={() => setActiveTab('inbox')} className={`flex flex-col items-center gap-1 transition-colors relative ${activeTab === 'inbox' ? 'text-[#00B14F]' : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300'}`}>
              {activeTab !== 'inbox' && <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#FF5A5F] rounded-full border border-white dark:border-[#151515]"></div>}
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
              <span className="text-[9px] font-medium">Inbox</span>
           </button>
           <button onClick={() => setActiveTab('planner')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'planner' ? 'text-[#00B14F]' : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300'}`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <span className="text-[9px] font-medium">Planner</span>
           </button>
           <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'profile' ? 'text-[#00B14F]' : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300'}`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              <span className="text-[9px] font-medium">Profile</span>
           </button>
        </div>
      </div>
    </div>
  )
}
