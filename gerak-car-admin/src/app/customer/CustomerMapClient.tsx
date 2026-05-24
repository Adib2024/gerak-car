'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { createClient } from '@/utils/supabase/client'

// Dynamically import the map so it ONLY renders on the client side
const InteractiveMap = dynamic(() => import('@/components/Map'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl relative z-10 shadow-2xl">
      <svg className="animate-spin h-8 w-8 text-cyan-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <p className="text-zinc-400 font-bold tracking-wide">Initializing Map...</p>
    </div>
  )
})

interface NominatimResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
}

export default function CustomerMapClient() {
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  
  // Locations
  const [myGpsLocation, setMyGpsLocation] = useState<[number, number] | null>(null)
  const [pickup, setPickup] = useState<{lat: number, lng: number, label: string} | null>(null)
  const [dropoff, setDropoff] = useState<{lat: number, lng: number, label: string} | null>(null)
  
  // UI State
  const [activePinMode, setActivePinMode] = useState<'pickup' | 'dropoff' | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  
  // Ride State
  const [activeRideId, setActiveRideId] = useState<string | null>(null)
  const [rideStatus, setRideStatus] = useState<'idle' | 'pending' | 'accepted' | 'arrived' | 'in_progress' | 'completed'>('idle')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user?.id || null))

    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const coords: [number, number] = [position.coords.latitude, position.coords.longitude]
          setMyGpsLocation(coords)
          setPickup((prev) => prev || { lat: coords[0], lng: coords[1], label: "Current Location" })
        },
        (err) => console.error("Location error:", err),
        { enableHighAccuracy: true }
      )
      return () => navigator.geolocation.clearWatch(watchId)
    }
  }, [supabase.auth])

  // Listen to ride updates
  useEffect(() => {
    if (!activeRideId) return

    const channel = supabase.channel(`ride-${activeRideId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rides', filter: `id=eq.${activeRideId}` }, (payload) => {
        setRideStatus(payload.new.status as any)
        
        if (payload.new.status === 'completed') {
          setTimeout(() => {
            setRideStatus('idle')
            setActiveRideId(null)
          }, 5000)
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeRideId, supabase])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=5&countrycodes=my`)
      const data = await res.json()
      setSearchResults(data)
    } catch (err) {
      console.error("Geocoding failed", err)
    } finally {
      setIsSearching(false)
    }
  }

  const handleMapClick = async (lat: number, lng: number) => {
    if (!activePinMode) return

    let label = `Pinned Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
      const data = await res.json()
      if (data && data.display_name) {
        label = data.display_name.split(',')[0]
      }
    } catch (e) {}

    if (activePinMode === 'pickup') {
      setPickup({ lat, lng, label })
    } else {
      setDropoff({ lat, lng, label })
    }
    setActivePinMode(null)
  }

  const requestRide = async () => {
    if (!pickup || !dropoff || !userId) return
    setRideStatus('pending')

    const { data, error } = await supabase.from('rides').insert({
      customer_id: userId,
      pickup_location: `POINT(${pickup.lng} ${pickup.lat})`,
      dropoff_location: `POINT(${dropoff.lng} ${dropoff.lat})`,
      pickup_address: pickup.label,
      dropoff_address: dropoff.label,
      price: 10.00,
      status: 'pending'
    }).select().single()

    if (error) {
      console.error("Failed to request ride", error)
      setRideStatus('idle')
      alert("Failed to request ride.")
    } else if (data) {
      setActiveRideId(data.id)
    }
  }
  
  const cancelRide = async () => {
    if (!activeRideId) return
    await supabase.from('rides').update({ status: 'cancelled' }).eq('id', activeRideId)
    setRideStatus('idle')
    setActiveRideId(null)
  }

  const markers = []
  if (pickup) markers.push({ id: 'pickup', position: [pickup.lat, pickup.lng] as [number, number], label: 'Pickup: ' + pickup.label })
  if (dropoff) markers.push({ id: 'dropoff', position: [dropoff.lat, dropoff.lng] as [number, number], label: 'Dropoff: ' + dropoff.label })

  return (
    <div className="relative w-full h-full overflow-hidden flex flex-col bg-black">
      
      {/* 100% Full Screen Map */}
      <div className={`absolute inset-0 w-full h-full z-0 ${activePinMode ? 'cursor-crosshair' : ''}`}>
        <InteractiveMap userLocation={myGpsLocation} markers={markers} onMapClick={handleMapClick} />
      </div>

      {/* Top Banner for Pin Mode */}
      {activePinMode && (
        <div className="absolute top-6 left-0 right-0 z-20 px-6 flex justify-center pointer-events-none">
          <div className="bg-black/90 backdrop-blur-md border border-white/20 text-white font-bold py-3 px-6 rounded-full shadow-2xl pointer-events-auto flex items-center gap-3">
             <span className="relative flex h-3 w-3">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${activePinMode === 'pickup' ? 'bg-emerald-400' : 'bg-blue-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 ${activePinMode === 'pickup' ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
             </span>
             Click anywhere on the map to set {activePinMode}
             <button onClick={() => setActivePinMode(null)} className="ml-2 text-zinc-400 hover:text-white">✕</button>
          </div>
        </div>
      )}

      {/* Bottom Sheet UI (Uber/Grab Style) */}
      <div className="absolute bottom-0 left-0 right-0 z-20 w-full pointer-events-none flex flex-col items-center">
         <div className="w-full max-w-lg bg-zinc-950 shadow-[0_-20px_40px_rgba(0,0,0,0.6)] pointer-events-auto flex flex-col p-6 pb-8 transition-transform duration-300 rounded-t-[32px] border-t border-l border-r border-white/5">
            {/* Grab-style Handle bar */}
            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6"></div>

            {rideStatus !== 'idle' ? (
              /* ACTIVE RIDE STATUS SHEET */
              <div className="flex flex-col items-center">
                 {rideStatus === 'pending' && (
                    <>
                       <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4 relative">
                          <div className="absolute inset-0 rounded-full border-t-2 border-blue-500 animate-spin"></div>
                          <span className="text-2xl">🚗</span>
                       </div>
                       <h3 className="text-white font-extrabold text-xl mb-1">Looking for drivers...</h3>
                       <p className="text-zinc-400 text-sm mb-6">Contacting nearby drivers</p>
                       <button onClick={cancelRide} className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-4 px-6 rounded-2xl transition-all border border-white/10">
                          Cancel Request
                       </button>
                    </>
                 )}
                 {rideStatus === 'accepted' && (
                    <>
                       <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4">
                          <span className="text-3xl">🚙</span>
                       </div>
                       <h3 className="text-white font-extrabold text-xl mb-1">Driver is on the way</h3>
                       <p className="text-zinc-400 text-sm mb-6">Your driver accepted and is heading to you.</p>
                       <div className="w-full bg-white/5 rounded-2xl p-4 mb-4 flex items-center gap-4 border border-white/10">
                          <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center text-xl">👨‍✈️</div>
                          <div>
                            <p className="text-white font-bold text-sm">Gerak Car Driver</p>
                            <p className="text-zinc-400 text-xs">Arriving shortly</p>
                          </div>
                       </div>
                    </>
                 )}
                 {rideStatus === 'arrived' && (
                    <>
                       <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4 animate-pulse border border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                          <span className="text-3xl">📍</span>
                       </div>
                       <h3 className="text-emerald-400 font-extrabold text-xl mb-1">Driver has arrived</h3>
                       <p className="text-zinc-400 text-sm mb-6">Please meet your driver at the pickup point.</p>
                    </>
                 )}
                 {rideStatus === 'in_progress' && (
                    <>
                       <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mb-4">
                          <span className="text-3xl">🛣️</span>
                       </div>
                       <h3 className="text-white font-extrabold text-xl mb-1">You are in transit</h3>
                       <p className="text-zinc-400 text-sm mb-6">Heading to your destination.</p>
                    </>
                 )}
                 {rideStatus === 'completed' && (
                    <>
                       <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(16,185,129,0.5)]">
                          <svg className="w-8 h-8 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                       </div>
                       <h3 className="text-white font-extrabold text-2xl mb-1">You have arrived</h3>
                       <p className="text-emerald-400 font-bold text-lg mb-6">RM 10.00</p>
                    </>
                 )}
              </div>
            ) : (
              /* REQUEST RIDE SHEET */
              <>
                <h2 className="text-white font-extrabold text-2xl mb-6">Where to?</h2>
                
                <div className="relative bg-zinc-900 border border-white/10 rounded-3xl p-4 mb-6 shadow-inner">
                  {/* Uber-style connecting line */}
                  <div className="absolute left-7 top-[34px] bottom-[34px] w-0.5 bg-white/10"></div>
                  
                  {/* Pickup Line */}
                  <div className="flex items-center gap-4 mb-4">
                     <div className="w-6 h-6 flex items-center justify-center relative z-10">
                        <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                     </div>
                     <div 
                        onClick={() => setActivePinMode('pickup')}
                        className={`flex-1 bg-transparent text-sm font-medium cursor-pointer truncate ${activePinMode === 'pickup' ? 'text-emerald-400' : 'text-white'}`}
                     >
                        {pickup ? pickup.label : "Current Location"}
                     </div>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-white/5 ml-10 mb-4"></div>

                  {/* Dropoff Line */}
                  <div className="flex items-center gap-4">
                     <div className="w-6 h-6 flex items-center justify-center relative z-10 bg-zinc-900">
                        <div className="w-2 h-2 bg-blue-500 rounded-sm"></div>
                     </div>
                     <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                       <input 
                          type="text" 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search destination" 
                          className="w-full bg-transparent text-sm font-medium text-white placeholder-zinc-500 focus:outline-none"
                       />
                       <button type="submit" disabled={isSearching} className="text-blue-400 font-bold text-xs px-2 disabled:opacity-50">
                         {isSearching ? '...' : 'SEARCH'}
                       </button>
                     </form>
                  </div>
                </div>
                
                {/* Search Results Dropdown */}
                {searchResults.length > 0 && (
                  <div className="bg-zinc-900 border border-white/10 rounded-2xl mb-6 max-h-40 overflow-y-auto z-10">
                    {searchResults.map((res) => (
                      <button 
                        key={res.place_id}
                        onClick={() => {
                          setDropoff({ lat: parseFloat(res.lat), lng: parseFloat(res.lon), label: res.display_name.split(',')[0] })
                          setSearchResults([])
                          setSearchQuery('')
                        }}
                        className="w-full text-left px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors flex items-center gap-3"
                      >
                        <span className="text-zinc-500">📍</span>
                        <div className="truncate">
                          <p className="text-white text-sm font-bold truncate">{res.display_name.split(',')[0]}</p>
                          <p className="text-zinc-500 text-xs truncate">{res.display_name}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Confirm Button */}
                <button 
                  onClick={requestRide}
                  disabled={!pickup || !dropoff || !userId}
                  className="w-full bg-white hover:bg-zinc-200 text-black font-extrabold py-4 px-6 rounded-2xl transition-all shadow-lg text-lg tracking-wide disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {dropoff ? 'CONFIRM RIDE' : 'SELECT DESTINATION'}
                </button>
              </>
            )}
         </div>
      </div>
    </div>
  )
}
