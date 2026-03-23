// Google Maps dynamic loader — no npm package needed
let _loaded = false, _loading = false
const _cbs = []

export const loadMaps = (key) => new Promise((res, rej) => {
  if (_loaded && window.google?.maps) { res(window.google.maps); return }
  _cbs.push({ res, rej })
  if (_loading) return
  _loading = true
  window.__mapsReady = () => { _loaded = true; _loading = false; _cbs.forEach(c => c.res(window.google.maps)); _cbs.length = 0 }
  const s = document.createElement('script')
  s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places,geometry&callback=__mapsReady&language=en&region=IN`
  s.async = true; s.defer = true
  s.onerror = e => { _loading = false; _cbs.forEach(c => c.rej(e)); _cbs.length = 0 }
  document.head.appendChild(s)
})

import { useState, useEffect, useRef } from 'react'
export function useGoogleMaps() {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(null)
  const key = import.meta.env.VITE_GOOGLE_MAPS_KEY
  useEffect(() => {
    if (!key) { setError('no_key'); return }
    if (window.google?.maps) { setReady(true); return }
    loadMaps(key).then(() => setReady(true)).catch(() => setError('failed'))
  }, [])
  return { ready, error }
}

// Initialize map in a div ref
export function initMap(divRef, center = { lat: 21.1458, lng: 79.0882 }, isDark = true) {
  if (!window.google || !divRef.current) return null
  return new window.google.maps.Map(divRef.current, {
    center, zoom: 14,
    disableDefaultUI: true,
    zoomControl: false,
    styles: isDark ? DARK_STYLE : LIGHT_STYLE,
  })
}

// Get lat/lng from address using Geocoding
export const geocode = (address) => new Promise((res, rej) => {
  if (!window.google) return rej('Maps not loaded')
  new window.google.maps.Geocoder().geocode({ address: address + ', Nagpur, India' }, (results, status) => {
    if (status === 'OK') res(results[0].geometry.location)
    else rej(status)
  })
})

// Get route between two points
export const getRoute = (origin, destination) => new Promise((res, rej) => {
  if (!window.google) return rej('Maps not loaded')
  new window.google.maps.DirectionsService().route({
    origin, destination, travelMode: window.google.maps.TravelMode.DRIVING
  }, (result, status) => { if (status === 'OK') res(result); else rej(status) })
})

// Get place suggestions (autocomplete)
export const getPlaceSuggestions = (input, cb) => {
  if (!window.google || !input) return
  new window.google.maps.places.AutocompleteService().getPlacePredictions(
    { input, componentRestrictions: { country: 'in' }, location: new window.google.maps.LatLng(21.1458, 79.0882), radius: 30000 },
    (predictions, status) => { if (status === 'OK') cb(predictions); else cb([]) }
  )
}

const DARK_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#141416' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#454550' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0B0B0D' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1A1A1E' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#252528' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2A2A30' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#8A8A96' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0B0B0D' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
]
const LIGHT_STYLE = [
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
]
