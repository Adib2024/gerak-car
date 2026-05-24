'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useTheme } from 'next-themes'

// Fix for missing default marker icons in Leaflet with Webpack/Next.js
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

// Helper component to smoothly center map on user's location
function MapRecenter({ center }: { center: [number, number] | null }) {
  const map = useMap()
  useEffect(() => {
    if (center) {
      map.flyTo(center, 15, { animate: true, duration: 1.5 })
    }
  }, [center, map])
  return null
}

// Helper component to capture map clicks
function MapClickHandler({ onClick }: { onClick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      if (onClick) onClick(e.latlng.lat, e.latlng.lng)
    }
  })
  return null
}

interface MapProps {
  userLocation: [number, number] | null
  markers?: Array<{
    id: string
    position: [number, number]
    label: string
  }>
  onMapClick?: (lat: number, lng: number) => void
}

// Default center: UMPSA Gambang
const DEFAULT_CENTER: [number, number] = [3.7176, 103.1119]

export default function InteractiveMap({ userLocation, markers = [], onMapClick }: MapProps) {
  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER)
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (userLocation) {
      setCenter(userLocation)
    }
  }, [userLocation])

  const isDark = mounted ? resolvedTheme === 'dark' : true // Default to dark during SSR to avoid flash if mostly dark app

  return (
    <div className="w-full h-full rounded-3xl overflow-hidden shadow-2xl relative z-0">
      <MapContainer 
        center={center} 
        zoom={13} 
        style={{ width: '100%', height: '100%', zIndex: 0 }}
        zoomControl={false}
      >
        <TileLayer
          key={isDark ? 'dark' : 'light'}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url={isDark ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"}
        />
        
        <MapClickHandler onClick={onMapClick} />
        <MapRecenter center={userLocation} />

        {userLocation && (
          <Marker position={userLocation} icon={icon}>
            <Popup>
              <div className="font-bold text-zinc-900">Your Location</div>
            </Popup>
          </Marker>
        )}

        {markers.map((marker) => (
          <Marker key={marker.id} position={marker.position} icon={icon}>
            <Popup>
              <div className="font-bold text-zinc-900">{marker.label}</div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
