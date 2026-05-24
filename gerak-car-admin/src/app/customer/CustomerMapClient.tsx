'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import the map so it ONLY renders on the client side
const InteractiveMap = dynamic(() => import('@/components/Map'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl relative z-10 shadow-2xl">
      <svg className="animate-spin h-8 w-8 text-cyan-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <p className="text-zinc-400 font-bold tracking-wide">Acquiring GPS Signal...</p>
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
  const [location, setLocation] = useState<[number, number] | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedDestination, setSelectedDestination] = useState<NominatimResult | null>(null)

  useEffect(() => {
    if (navigator.geolocation) {
      // Use watchPosition for real-time tracking
      const watchId = navigator.geolocation.watchPosition(
        (position) => setLocation([position.coords.latitude, position.coords.longitude]),
        (err) => console.error("Location error:", err),
        { enableHighAccuracy: true }
      )
      return () => navigator.geolocation.clearWatch(watchId)
    }
  }, [])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      // Search Nominatim for places within Malaysia
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=5&countrycodes=my`)
      const data = await res.json()
      setSearchResults(data)
    } catch (err) {
      console.error("Geocoding failed", err)
    } finally {
      setIsSearching(false)
    }
  }

  // Create markers for the map
  const markers = []
  if (selectedDestination) {
    markers.push({
      id: 'dropoff',
      position: [parseFloat(selectedDestination.lat), parseFloat(selectedDestination.lon)] as [number, number],
      label: 'Destination: ' + selectedDestination.display_name.split(',')[0]
    })
  }

  return (
    <div className="relative w-full h-full min-h-[500px] overflow-hidden z-0 flex flex-col items-center">
      
      {/* Floating UI overlay */}
      <div className="absolute top-6 left-0 right-0 z-20 px-6 max-w-lg mx-auto w-full pointer-events-none">
         <div className="bg-black/60 backdrop-blur-3xl border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden group pointer-events-auto">
            <div className="absolute top-0 left-0 w-32 h-32 bg-cyan-500/10 blur-[50px] rounded-full transition-all group-hover:bg-cyan-500/20 pointer-events-none" />
            <h2 className="text-white font-extrabold text-2xl mb-6 relative z-10">Where to?</h2>
            
            {/* Pickup Input (Current Location) */}
            <div className="relative mb-4 z-10">
               <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse"></div>
               </div>
               <div className="w-full bg-black/50 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-emerald-400 text-sm font-bold shadow-inner">
                  {location ? "My Current GPS Location" : "Acquiring GPS..."}
               </div>
            </div>

            {/* Dropoff Input */}
            <form onSubmit={handleSearch} className="relative mb-4 z-10 flex gap-2">
               <div className="relative flex-1">
                 <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                    <div className="w-3 h-3 bg-cyan-500 rounded-sm shadow-[0_0_10px_rgba(6,182,212,0.5)]"></div>
                 </div>
                 <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search destination (e.g., Starbucks)" 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white text-sm font-medium placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all shadow-inner relative z-10"
                 />
                 {/* Decorative connecting line */}
                 <div className="absolute left-[21px] -top-[1.2rem] w-0.5 h-6 border-l-2 border-dashed border-white/20 z-0"></div>
               </div>
               <button type="submit" disabled={isSearching} className="bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold rounded-2xl px-4 transition-all disabled:opacity-50">
                 {isSearching ? '...' : 'Search'}
               </button>
            </form>

            {/* Search Results */}
            {searchResults.length > 0 && !selectedDestination && (
              <div className="bg-black/80 border border-white/10 rounded-2xl mb-4 max-h-40 overflow-y-auto z-10 relative">
                {searchResults.map((res) => (
                  <button 
                    key={res.place_id}
                    onClick={() => {
                      setSelectedDestination(res)
                      setSearchResults([])
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
              disabled={!location || !selectedDestination}
              className="w-full relative group/btn overflow-hidden bg-white hover:bg-zinc-200 text-black font-extrabold py-4 px-6 rounded-2xl transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] text-lg tracking-wide border border-white/20 z-10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
               <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/30 to-emerald-400/30 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
               <span className="relative z-10 flex items-center justify-center gap-3">
                  {selectedDestination ? 'REQUEST RIDE NOW' : 'SELECT DESTINATION'}
               </span>
            </button>
         </div>
      </div>

      <div className="absolute inset-0 w-full h-full z-0">
        <InteractiveMap userLocation={location} markers={markers} />
      </div>
    </div>
  )
}
