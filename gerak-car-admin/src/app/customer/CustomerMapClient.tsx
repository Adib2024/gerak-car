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
          setPickup((prev) => prev || { lat: coords[0], lng: coords[1], label: "My GPS Location" })
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
        console.log("Ride updated:", payload.new.status)
        setRideStatus(payload.new.status as any)
        
        if (payload.new.status === 'completed') {
          setTimeout(() => {
            setRideStatus('idle')
            setActiveRideId(null)
          }, 5000) // Show completed for 5s then reset
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

  // Create markers for the map
  const markers = []
  if (pickup) markers.push({ id: 'pickup', position: [pickup.lat, pickup.lng] as [number, number], label: 'Pickup: ' + pickup.label })
  if (dropoff) markers.push({ id: 'dropoff', position: [dropoff.lat, dropoff.lng] as [number, number], label: 'Dropoff: ' + dropoff.label })

  const renderRideStatusUI = () => {
    switch (rideStatus) {
      case 'pending':
        return (
          <div className="text-center py-6">
             <div className="w-16 h-16 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-cyan-500/30 relative">
                <div className="absolute inset-0 rounded-full border-t-2 border-cyan-500 animate-spin"></div>
                <span className="text-2xl">🚗</span>
             </div>
             <p className="text-zinc-400 text-sm font-medium mb-6">Waiting for a driver to accept...</p>
             <button onClick={cancelRide} className="w-full bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 font-bold py-3 px-6 rounded-xl transition-all border border-red-500/20">
                Cancel Request
             </button>
          </div>
        )
      case 'accepted':
        return (
          <div className="text-center py-6">
             <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
                <span className="text-3xl">🚙</span>
             </div>
             <h3 className="text-white font-extrabold text-xl mb-1">Driver is on the way!</h3>
             <p className="text-zinc-400 text-sm font-medium mb-6">Your driver accepted the ride and is heading to you.</p>
          </div>
        )
      case 'arrived':
        return (
          <div className="text-center py-6">
             <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.3)] animate-pulse">
                <span className="text-3xl">📍</span>
             </div>
             <h3 className="text-emerald-400 font-extrabold text-xl mb-1">Driver has arrived!</h3>
             <p className="text-zinc-400 text-sm font-medium mb-6">Please meet your driver at the pickup location.</p>
          </div>
        )
      case 'in_progress':
        return (
          <div className="text-center py-6">
             <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-500/30">
                <span className="text-3xl">🛣️</span>
             </div>
             <h3 className="text-white font-extrabold text-xl mb-1">You are in transit</h3>
             <p className="text-zinc-400 text-sm font-medium mb-6">Heading to your destination.</p>
          </div>
        )
      case 'completed':
        return (
          <div className="text-center py-6">
             <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(16,185,129,0.5)]">
                <svg className="w-8 h-8 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
             </div>
             <h3 className="text-emerald-400 font-extrabold text-2xl mb-1">You have arrived!</h3>
             <p className="text-zinc-400 text-sm font-medium mb-6">Please pay RM 10.00 to your driver.</p>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="relative w-full h-full min-h-[500px] overflow-hidden z-0 flex flex-col items-center">
      
      {/* Floating UI overlay */}
      <div className="absolute top-6 left-0 right-0 z-20 px-6 max-w-lg mx-auto w-full pointer-events-none">
         <div className="bg-black/60 backdrop-blur-3xl border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden group pointer-events-auto">
            <div className="absolute top-0 left-0 w-32 h-32 bg-cyan-500/10 blur-[50px] rounded-full transition-all group-hover:bg-cyan-500/20 pointer-events-none" />
            
            {rideStatus !== 'idle' ? (
              renderRideStatusUI()
            ) : (
              <>
                <h2 className="text-white font-extrabold text-2xl mb-6 relative z-10">Where to?</h2>
                
                {/* Pickup Toggle */}
                <div className="relative mb-4 z-10">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-zinc-400 uppercase">Pickup Location</span>
                    {activePinMode === 'pickup' && <span className="text-xs text-emerald-400 font-bold animate-pulse">(Click map to drop pin)</span>}
                  </div>
                  <div className="flex gap-2">
                    <div className="w-full bg-black/50 border border-white/10 rounded-2xl pl-4 pr-4 py-4 text-emerald-400 text-sm font-bold shadow-inner truncate cursor-pointer hover:bg-white/5 transition-colors" onClick={() => setActivePinMode(activePinMode === 'pickup' ? null : 'pickup')}>
                        {pickup ? pickup.label : "Tap to drop pin on map"}
                    </div>
                  </div>
                </div>

                {/* Dropoff Toggle */}
                <div className="relative mb-6 z-10">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-zinc-400 uppercase">Dropoff Location</span>
                    {activePinMode === 'dropoff' && <span className="text-xs text-cyan-400 font-bold animate-pulse">(Click map to drop pin)</span>}
                  </div>
                  <form onSubmit={handleSearch} className="flex gap-2 mb-2">
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search or drop pin" 
                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-4 pr-4 py-4 text-white text-sm font-medium placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all shadow-inner relative z-10"
                    />
                    <button type="submit" disabled={isSearching} className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-2xl px-4 transition-all disabled:opacity-50 text-sm">
                      🔍
                    </button>
                    <button type="button" onClick={() => setActivePinMode(activePinMode === 'dropoff' ? null : 'dropoff')} className={`font-bold rounded-2xl px-4 transition-all text-sm border ${activePinMode === 'dropoff' ? 'bg-cyan-500 text-black border-cyan-500' : 'bg-transparent border-white/10 text-zinc-400 hover:bg-white/5'}`}>
                      📍
                    </button>
                  </form>
                  {dropoff && <p className="text-cyan-400 text-xs font-bold truncate pl-2">Selected: {dropoff.label}</p>}
                </div>
                
                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="bg-black/80 border border-white/10 rounded-2xl mb-4 max-h-40 overflow-y-auto z-10 relative">
                    {searchResults.map((res) => (
                      <button 
                        key={res.place_id}
                        onClick={() => {
                          setDropoff({ lat: parseFloat(res.lat), lng: parseFloat(res.lon), label: res.display_name.split(',')[0] })
                          setSearchResults([])
                          setSearchQuery('')
                        }}
                        className="w-full text-left px-4 py-3 border-b border-white/5 hover:bg-white/10 transition-colors"
                      >
                        <p className="text-white text-sm font-bold truncate">{res.display_name.split(',')[0]}</p>
                        <p className="text-zinc-400 text-xs truncate">{res.display_name}</p>
                      </button>
                    ))}
                  </div>
                )}

                {/* Find Ride Button */}
                <button 
                  onClick={requestRide}
                  disabled={!pickup || !dropoff || !userId}
                  className="w-full relative group/btn overflow-hidden bg-white hover:bg-zinc-200 text-black font-extrabold py-4 px-6 rounded-2xl transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] text-lg tracking-wide border border-white/20 z-10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/30 to-emerald-400/30 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                  <span className="relative z-10 flex items-center justify-center gap-3">
                      REQUEST RIDE NOW
                  </span>
                </button>
              </>
            )}
         </div>
      </div>

      <div className={`absolute inset-0 w-full h-full z-0 ${activePinMode ? 'cursor-crosshair' : ''}`}>
        <InteractiveMap 
          userLocation={myGpsLocation} 
          markers={markers} 
          onMapClick={handleMapClick}
        />
      </div>
    </div>
  )
}
