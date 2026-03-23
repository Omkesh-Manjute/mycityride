import { useState, useEffect, useRef } from "react"
import {
  supabase, getOrCreateUser, getDriverByPhone, adminLogin,
  getPricing, updatePricing, bookRide, updateRideStatus, getUserRides,
  getDriverActiveRide, assignDriver, rateRide, updateDriverLocation,
  setDriverOnline, setDriverOffline, getNearbyDrivers, sendMessage,
  getChatMessages, validatePromo, triggerSOS, scheduleRide,
  getDriverDocuments, upsertDocument, getAllRides, getAllDrivers,
  getAllUsers, updateDriverStatus, getAdminStats,
} from "./lib/supabase.js"
import { subDriverLocation, subRideStatus, subNewRides, subChat } from "./lib/realtime.js"
import { useGoogleMaps, initMap, getRoute, getPlaceSuggestions, geocode } from "./lib/maps.js"

/* ── Fonts ───────────────────────────────────────────── */
const GFONTS = `@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700;12..96,800&family=Instrument+Sans:wght@400;500;600;700&display=swap');`
const F  = "'Bricolage Grotesque',sans-serif"
const FB = "'Instrument Sans',sans-serif"

/* ── Themes ──────────────────────────────────────────── */
const DARK = {
  bg:"#0B0B0D", surface:"#141416", card:"#1A1A1E", border:"#252528",
  text:"#F2EEE8", textSub:"#8A8A96", textMuted:"#454550", input:"#111113",
  accent:"#FF4D00", accentSoft:"rgba(255,77,0,0.12)", accentGlow:"rgba(255,77,0,0.22)",
  green:"#00C566", greenSoft:"rgba(0,197,102,0.12)",
  blue:"#3D7BFF",  blueSoft:"rgba(61,123,255,0.12)",
  yellow:"#F5B301", red:"#FF3B3B", redSoft:"rgba(255,59,59,0.1)",
  overlay:"rgba(11,11,13,0.92)", phoneBorder:"#1C1C20", notchBg:"#0B0B0D",
}
const LIGHT = {
  bg:"#F4F2EE", surface:"#FFF", card:"#FFF", border:"#E6E2D8",
  text:"#111", textSub:"#666", textMuted:"#AAA", input:"#F0EDE6",
  accent:"#FF4D00", accentSoft:"rgba(255,77,0,0.08)", accentGlow:"rgba(255,77,0,0.18)",
  green:"#00A855", greenSoft:"rgba(0,168,85,0.1)",
  blue:"#2B6BE8",  blueSoft:"rgba(43,107,232,0.1)",
  yellow:"#D99400", red:"#E83030", redSoft:"rgba(232,48,48,0.08)",
  overlay:"rgba(244,242,238,0.94)", phoneBorder:"#D8D4CC", notchBg:"#F4F2EE",
}

/* ── Static data ─────────────────────────────────────── */
const VEHICLES = [
  { id:"car",  icon:"🚗", name:"Premier",  desc:"Comfortable · 4 seats", eta:"3", basePrice:245, tag:null },
  { id:"auto", icon:"🛺", name:"Auto",     desc:"Quick · 3 seats",       eta:"2", basePrice:78,  tag:"POPULAR" },
  { id:"erick",icon:"⚡", name:"E-Ride",   desc:"Eco-friendly · 3 seats",eta:"4", basePrice:52,  tag:"CHEAPEST" },
]
const NAGPUR_PLACES = [
  { icon:"✈️", name:"Nagpur Airport",      addr:"Dr. Babasaheb Ambedkar Intl." },
  { icon:"🏥", name:"AIIMS Nagpur",        addr:"Mihan, Nagpur" },
  { icon:"🛍️", name:"Empress Mall",        addr:"Empress City, Nagpur" },
  { icon:"📍", name:"Sitabuldi Square",    addr:"Sitabuldi, Nagpur" },
  { icon:"📍", name:"Sadar Bazaar",        addr:"Sadar, Nagpur" },
  { icon:"🚉", name:"Nagpur Railway Stn",  addr:"Kasturchand Park, Nagpur" },
  { icon:"📍", name:"Dharampeth",          addr:"Dharampeth, Nagpur" },
  { icon:"📍", name:"Civil Lines",         addr:"Civil Lines, Nagpur" },
  { icon:"📍", name:"Zero Mile",           addr:"Zero Mile, Nagpur" },
  { icon:"📍", name:"LIT Square",          addr:"Laxmi Nagar, Nagpur" },
]
const DEMO_RIDES = [
  { id:1, from:"Sitabuldi", to:"Airport",   fare:245, dist:"12.4 km", date:"Today, 9:30 AM",    status:"done",      driver:"Ramesh K.", rating:5, payment:"UPI" },
  { id:2, from:"Civil Lines", to:"Dharampeth", fare:78, dist:"4.1 km", date:"Yesterday",       status:"done",      driver:"Suresh M.", rating:4, payment:"Cash" },
  { id:3, from:"Ramdaspeth", to:"Wardha Rd",fare:52, dist:"3.8 km", date:"Mar 19",            status:"cancelled", driver:"—",          rating:0, payment:"—" },
]

/* ── Shared atoms ────────────────────────────────────── */
const Pill = ({ T, color, children, sm }) => {
  const c = color || T.accent
  return <span style={{ padding: sm ? "2px 8px" : "3px 11px", borderRadius:100, fontSize: sm ? 9.5 : 10.5, fontWeight:700, background:`${c}18`, color:c, fontFamily:FB, display:"inline-block" }}>{children}</span>
}
const Btn = ({ T, full, primary, green: isGreen, danger, disabled, onClick, children, sm }) => {
  const bg = disabled ? "#2A2A2E" : primary ? T.accent : isGreen ? T.green : danger ? T.red : T.card
  const sh = primary ? `0 10px 28px ${T.accentGlow}` : isGreen ? `0 10px 28px ${T.greenSoft}` : "none"
  return (
    <button onClick={disabled ? undefined : onClick} style={{
      width: full ? "100%" : "auto", padding: sm ? "9px 16px" : "15px 20px",
      borderRadius:14, border:`1.5px solid ${disabled?"#2A2A2E":primary||isGreen||danger?"transparent":T.border}`,
      cursor: disabled ? "not-allowed" : "pointer", background:bg,
      color: primary||isGreen||danger ? "#fff" : T.textSub,
      fontFamily:F, fontWeight:700, fontSize: sm ? 13 : 15,
      boxShadow:sh, opacity: disabled ? 0.5 : 1, transition:"all 0.18s"
    }}>{children}</button>
  )
}
const SBar = ({ T }) => (
  <div style={{ padding:"13px 22px 0", display:"flex", justifyContent:"space-between", alignItems:"center", fontSize:11, color:T.textMuted, fontWeight:600 }}>
    <span style={{ fontFamily:F, fontWeight:700, fontSize:12 }}>9:41</span>
    <div style={{ display:"flex", gap:4, alignItems:"center", fontSize:10 }}>▲▲▲ WiFi 🔋</div>
  </div>
)
const Phone = ({ T, children }) => (
  <div style={{ width:375, minHeight:780, background:T.bg, borderRadius:48, border:`2px solid ${T.phoneBorder}`, overflow:"hidden", position:"relative", boxShadow:`0 60px 120px rgba(0,0,0,0.5)`, margin:"0 auto" }}>
    <div style={{ position:"absolute", top:0, left:"50%", transform:"translateX(-50%)", width:110, height:28, background:T.notchBg, borderRadius:"0 0 18px 18px", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
      <div style={{ width:9, height:9, borderRadius:"50%", background:T.textMuted, opacity:0.4 }}/>
      <div style={{ width:38, height:4, borderRadius:3, background:T.textMuted, opacity:0.25 }}/>
    </div>
    {children}
  </div>
)
const BNav = ({ T, tabs, active, onChange }) => (
  <div style={{ position:"absolute", bottom:0, left:0, right:0, background:T.overlay, backdropFilter:"blur(20px)", borderTop:`1px solid ${T.border}`, display:"flex", padding:"10px 0 26px", zIndex:50 }}>
    {tabs.map(t => (
      <button key={t.id} onClick={() => onChange(t.id)} style={{ flex:1, background:"transparent", border:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
        <div style={{ width:34, height:34, borderRadius:11, background: active===t.id ? T.accentSoft : "transparent", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.2s" }}>
          <span style={{ fontSize:17, filter: active===t.id ? "none" : "grayscale(1)", opacity: active===t.id ? 1 : 0.45 }}>{t.icon}</span>
        </div>
        <span style={{ fontSize:9, fontWeight:700, color: active===t.id ? T.accent : T.textMuted, fontFamily:FB, letterSpacing:0.3, textTransform:"uppercase" }}>{t.label}</span>
      </button>
    ))}
  </div>
)
const BackBtn = ({ T, onBack, title }) => (
  <div style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px 10px" }}>
    <button onClick={onBack} style={{ width:36, height:36, borderRadius:12, background:T.card, border:`1px solid ${T.border}`, cursor:"pointer", fontSize:16, color:T.text, display:"flex", alignItems:"center", justifyContent:"center" }}>←</button>
    <span style={{ fontFamily:F, fontWeight:800, fontSize:19, letterSpacing:-0.4 }}>{title}</span>
  </div>
)

/* ── Google Map component ────────────────────────────── */
function RideMap({ T, isDark, pickup, drop, driverLat, driverLng, showDriver, height = 238 }) {
  const mapRef  = useRef()
  const mapObj  = useRef(null)
  const markers = useRef({})
  const dirRenderer = useRef(null)
  const { ready, error } = useGoogleMaps()

  useEffect(() => {
    if (!ready || !mapRef.current) return
    if (!mapObj.current) mapObj.current = initMap(mapRef.current, { lat:21.1458, lng:79.0882 }, isDark)
    const map = mapObj.current
    // Pickup marker
    if (pickup?.lat) {
      if (markers.current.pickup) markers.current.pickup.setPosition({ lat: pickup.lat, lng: pickup.lng })
      else markers.current.pickup = new window.google.maps.Marker({
        position: { lat: pickup.lat, lng: pickup.lng }, map,
        icon: { path: window.google.maps.SymbolPath.CIRCLE, scale:8, fillColor:"#00C566", fillOpacity:1, strokeColor:"#fff", strokeWeight:2 }
      })
    }
    // Drop marker
    if (drop?.lat) {
      if (markers.current.drop) markers.current.drop.setPosition({ lat: drop.lat, lng: drop.lng })
      else markers.current.drop = new window.google.maps.Marker({
        position: { lat: drop.lat, lng: drop.lng }, map,
        icon: { path: window.google.maps.SymbolPath.CIRCLE, scale:8, fillColor:"#FF4D00", fillOpacity:1, strokeColor:"#fff", strokeWeight:2 }
      })
      // Draw route
      if (pickup?.lat) {
        if (!dirRenderer.current) dirRenderer.current = new window.google.maps.DirectionsRenderer({ map, suppressMarkers:true, polylineOptions:{ strokeColor:"#FF4D00", strokeWeight:4, strokeOpacity:0.8 } })
        getRoute({ lat:pickup.lat, lng:pickup.lng }, { lat:drop.lat, lng:drop.lng })
          .then(r => dirRenderer.current.setDirections(r)).catch(() => {})
      }
    }
    // Driver marker
    if (showDriver && driverLat) {
      const pos = { lat: driverLat, lng: driverLng }
      if (markers.current.driver) markers.current.driver.setPosition(pos)
      else markers.current.driver = new window.google.maps.Marker({
        position: pos, map,
        icon: { url: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32'><circle cx='16' cy='16' r='14' fill='%23FF4D00' stroke='white' stroke-width='2'/><text x='16' y='21' text-anchor='middle' font-size='14'>🚗</text></svg>`, scaledSize: new window.google.maps.Size(32,32) }
      })
      map.panTo(pos)
    }
  }, [ready, pickup, drop, driverLat, driverLng, showDriver])

  // Fallback SVG map when no API key
  if (error === 'no_key' || error === 'failed') return <FallbackMap T={T} height={height} showDriver={showDriver}/>

  return (
    <div style={{ height, position:"relative", overflow:"hidden" }}>
      <div ref={mapRef} style={{ width:"100%", height:"100%" }}/>
      {!ready && (
        <div style={{ position:"absolute", inset:0, background:T.card, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:8 }}>
          <div style={{ fontSize:28 }}>🗺️</div>
          <div style={{ fontSize:12, color:T.textSub, fontFamily:FB }}>Loading map...</div>
        </div>
      )}
    </div>
  )
}

function FallbackMap({ T, height = 238, showDriver = false, surge = 1 }) {
  const [pulse, setPulse] = useState(0)
  const [carX, setCarX] = useState(80)
  useEffect(() => { const i = setInterval(() => setPulse(p => (p+1)%100), 60); return () => clearInterval(i) }, [])
  useEffect(() => { if (showDriver) { const i = setInterval(() => setCarX(x => x < 285 ? x+1.2 : 80), 100); return () => clearInterval(i) } }, [showDriver])
  const carY = 165 - ((carX-80)/205)*115
  return (
    <div style={{ height, position:"relative", overflow:"hidden" }}>
      <svg viewBox={`0 0 375 ${height}`} style={{ width:"100%", height:"100%", display:"block" }}>
        <defs>
          <linearGradient id="mg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={T.bg}/><stop offset="100%" stopColor={T.card}/></linearGradient>
        </defs>
        <rect width="375" height={height} fill="url(#mg)"/>
        {[30,60,90,120,150,180].filter(y=>y<height).map(y=><line key={y} x1="0" y1={y} x2="375" y2={y} stroke={T.border} strokeWidth="0.5" opacity="0.35"/>)}
        {[40,80,120,160,200,240,280,320,360].map(x=><line key={x} x1={x} y1="0" x2={x} y2={height} stroke={T.border} strokeWidth="0.5" opacity="0.35"/>)}
        <rect x="0" y="96" width="375" height="20" fill={T.card} opacity="0.8"/>
        <rect x="176" y="0" width="20" height={height} fill={T.card} opacity="0.8"/>
        <rect x="0" y="49" width="375" height="11" fill={T.surface} opacity="0.6"/>
        <rect x="281" y="0" width="11" height={height} fill={T.surface} opacity="0.6"/>
        {surge>1 && <rect width="375" height={height} fill={T.yellow} opacity="0.06"/>}
        <path d="M 80 165 C 115 145 155 125 185 106 C 220 86 255 66 290 50" stroke={T.accent} strokeWidth="2.8" fill="none" strokeDasharray="7,4" opacity="0.9"/>
        <circle cx="80" cy="165" r={9+(pulse%40)*0.3} fill={T.green} opacity="0.08"/>
        <circle cx="80" cy="165" r="7" fill={T.green}/><circle cx="80" cy="165" r="3" fill="#fff"/>
        <circle cx="290" cy="50" r="10" fill={T.accent}/><polygon points="290,62 284,52 296,52" fill={T.accent}/><circle cx="290" cy="50" r="4" fill="#fff"/>
        {!showDriver && [[140,142],[212,86],[157,58],[264,136]].map(([x,y],i)=>(
          <g key={i}><circle cx={x} cy={y} r="11" fill={T.accent} opacity="0.07"/><circle cx={x} cy={y} r="6" fill={T.card} stroke={T.accent} strokeWidth="1.5"/><text x={x} y={y+4} textAnchor="middle" fontSize="7" fill={T.accent}>▲</text></g>
        ))}
        {showDriver && <g><circle cx={carX} cy={carY} r="20" fill={T.accent} opacity="0.1"/><circle cx={carX} cy={carY} r="13" fill={T.card} stroke={T.accent} strokeWidth="2.5"/><text x={carX} y={carY+5} textAnchor="middle" fontSize="12">🚗</text></g>}
        {surge>1 && <text x="12" y={height-10} fontSize="11" fontWeight="700" fill={T.yellow} fontFamily={FB}>⚡ {surge.toFixed(1)}x Surge</text>}
      </svg>
    </div>
  )
}

/* ── SOS Modal ───────────────────────────────────────── */
function SOSModal({ T, onClose, rideId, userId }) {
  const [phase, setPhase] = useState("confirm")
  const [count, setCount] = useState(5)
  useEffect(() => {
    if (phase !== "counting") return
    if (count <= 0) { setPhase("sent"); triggerSOS({ rideId, userId, triggeredBy:"user", lat:21.1458, lng:79.0882 }); return }
    const t = setTimeout(() => setCount(c => c-1), 1000)
    return () => clearTimeout(t)
  }, [phase, count])
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div style={{ background:T.card, borderRadius:24, padding:"28px 24px", width:"100%", maxWidth:340, border:`2px solid ${T.red}`, textAlign:"center", boxShadow:`0 0 60px rgba(255,59,59,0.3)` }}>
        {phase === "confirm" && <>
          <div style={{ width:72, height:72, borderRadius:"50%", background:T.redSoft, border:`3px solid ${T.red}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:32, margin:"0 auto 18px" }}>🆘</div>
          <div style={{ fontFamily:F, fontWeight:800, fontSize:22, color:T.red, marginBottom:8 }}>Emergency SOS</div>
          <div style={{ color:T.textSub, fontSize:13, fontFamily:FB, lineHeight:1.6, marginBottom:24 }}>
            This will alert:<br/><b style={{ color:T.text }}>Police · Ambulance · Emergency Contact</b><br/>
            <span style={{ color:T.textMuted, fontSize:12 }}>Your location will be shared</span>
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={onClose} style={{ flex:1, padding:"13px", borderRadius:13, background:T.surface, border:`1px solid ${T.border}`, color:T.textSub, cursor:"pointer", fontFamily:F, fontWeight:700 }}>Cancel</button>
            <button onClick={() => { setPhase("counting"); setCount(5) }} style={{ flex:2, padding:"13px", borderRadius:13, background:T.red, border:"none", color:"#fff", cursor:"pointer", fontFamily:F, fontWeight:800, boxShadow:`0 8px 24px rgba(255,59,59,0.35)` }}>🆘 Send SOS</button>
          </div>
        </>}
        {phase === "counting" && <>
          <div style={{ width:100, height:100, borderRadius:"50%", background:T.redSoft, border:`3px solid ${T.red}`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 18px", flexDirection:"column" }}>
            <div style={{ fontFamily:F, fontWeight:800, fontSize:42, color:T.red, lineHeight:1 }}>{count}</div>
          </div>
          <div style={{ fontFamily:F, fontWeight:700, fontSize:18, marginBottom:20 }}>Sending SOS...</div>
          <button onClick={onClose} style={{ width:"100%", padding:"13px", borderRadius:13, background:T.surface, border:`1px solid ${T.border}`, color:T.red, cursor:"pointer", fontFamily:F, fontWeight:700 }}>Cancel SOS</button>
        </>}
        {phase === "sent" && <>
          <div style={{ fontSize:52, marginBottom:14 }}>✅</div>
          <div style={{ fontFamily:F, fontWeight:800, fontSize:20, color:T.green, marginBottom:8 }}>SOS Sent!</div>
          <div style={{ color:T.textSub, fontSize:13, fontFamily:FB, lineHeight:1.7, marginBottom:22 }}>
            Emergency services alerted<br/><b style={{ color:T.text }}>Location shared</b><br/>
            <div style={{ marginTop:10, background:T.greenSoft, borderRadius:10, padding:"10px 14px", fontSize:12, color:T.green }}>📞 Police: 100 · Ambulance: 108</div>
          </div>
          <button onClick={onClose} style={{ width:"100%", padding:"13px", borderRadius:13, background:T.green, border:"none", color:"#fff", cursor:"pointer", fontFamily:F, fontWeight:700 }}>Close</button>
        </>}
      </div>
    </div>
  )
}

/* ── Search Screen ───────────────────────────────────── */
function SearchScreen({ T, value, onSelect, onBack }) {
  const [q, setQ] = useState(value || "")
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const inRef = useRef()
  const { ready } = useGoogleMaps()
  useEffect(() => { setTimeout(() => inRef.current?.focus(), 100) }, [])
  useEffect(() => {
    if (!q) { setSuggestions([]); return }
    if (ready && window.google) {
      setLoading(true)
      getPlaceSuggestions(q, (preds) => { setSuggestions(preds); setLoading(false) })
    }
  }, [q, ready])
  const handleSelect = async (name, placeId) => {
    if (placeId && ready && window.google) {
      try {
        const geocoder = new window.google.maps.Geocoder()
        geocoder.geocode({ placeId }, (res, status) => {
          if (status === "OK") {
            const loc = res[0].geometry.location
            onSelect({ name, lat: loc.lat(), lng: loc.lng() })
          } else onSelect({ name, lat: null, lng: null })
        })
      } catch { onSelect({ name, lat: null, lng: null }) }
    } else onSelect({ name, lat: null, lng: null })
  }
  return (
    <div style={{ display:"flex", flexDirection:"column", height:748 }}>
      <div style={{ padding:"14px 16px", display:"flex", alignItems:"center", gap:10, borderBottom:`1px solid ${T.border}`, background:T.surface }}>
        <button onClick={onBack} style={{ width:36, height:36, borderRadius:12, background:T.card, border:`1px solid ${T.border}`, cursor:"pointer", fontSize:16, color:T.text, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>←</button>
        <div style={{ flex:1, background:T.input, border:`1.5px solid ${T.accent}`, borderRadius:14, display:"flex", alignItems:"center", gap:10, padding:"0 14px", boxShadow:`0 0 0 3px ${T.accentSoft}` }}>
          <span style={{ color:T.accent, fontSize:14 }}>🔍</span>
          <input ref={inRef} value={q} onChange={e => setQ(e.target.value)}
            placeholder="Search destination in Nagpur..."
            style={{ flex:1, background:"transparent", border:"none", outline:"none", padding:"13px 0", color:T.text, fontSize:14, fontFamily:FB }}/>
          {q && <button onClick={() => setQ("")} style={{ background:"none", border:"none", color:T.textMuted, cursor:"pointer", fontSize:16 }}>✕</button>}
        </div>
      </div>
      <div style={{ flex:1, overflowY:"auto", scrollbarWidth:"none" }}>
        <div onClick={() => onSelect({ name:"Current Location", lat:21.1458, lng:79.0882 })}
          style={{ padding:"14px 18px", display:"flex", alignItems:"center", gap:14, borderBottom:`1px solid ${T.border}`, cursor:"pointer" }}>
          <div style={{ width:40, height:40, borderRadius:13, background:T.accentSoft, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>📍</div>
          <div><div style={{ fontWeight:700, fontSize:14, color:T.accent, fontFamily:F }}>Use current location</div><div style={{ fontSize:12, color:T.textSub, fontFamily:FB, marginTop:2 }}>Sitabuldi, Nagpur</div></div>
        </div>
        {!q && <>
          <div style={{ padding:"12px 18px 6px", fontSize:10, fontWeight:700, color:T.textMuted, fontFamily:FB, textTransform:"uppercase", letterSpacing:0.6 }}>Popular in Nagpur</div>
          {NAGPUR_PLACES.map((p,i) => (
            <div key={i} onClick={() => handleSelect(p.name, null)}
              style={{ padding:"12px 18px", display:"flex", alignItems:"center", gap:14, borderBottom:`1px solid ${T.border}20`, cursor:"pointer" }}>
              <div style={{ width:40, height:40, borderRadius:13, background:T.surface, border:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>{p.icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600, fontSize:14, fontFamily:F }}>{p.name}</div>
                <div style={{ fontSize:11, color:T.textSub, fontFamily:FB, marginTop:2 }}>{p.addr}</div>
              </div>
              <span style={{ color:T.textMuted, fontSize:16 }}>›</span>
            </div>
          ))}
        </>}
        {loading && <div style={{ padding:"20px", textAlign:"center", color:T.textMuted, fontFamily:FB, fontSize:13 }}>Searching...</div>}
        {q && !loading && suggestions.length === 0 && (
          <div style={{ padding:"40px 18px", textAlign:"center", color:T.textMuted, fontFamily:FB, fontSize:13 }}>No results for "{q}"</div>
        )}
        {q && suggestions.map((s, i) => (
          <div key={i} onClick={() => handleSelect(s.structured_formatting?.main_text || s.description, s.place_id)}
            style={{ padding:"12px 18px", display:"flex", alignItems:"center", gap:14, borderBottom:`1px solid ${T.border}20`, cursor:"pointer" }}>
            <div style={{ width:40, height:40, borderRadius:13, background:T.surface, border:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>📍</div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:600, fontSize:14, fontFamily:F }}>{s.structured_formatting?.main_text || s.description}</div>
              <div style={{ fontSize:11, color:T.textSub, fontFamily:FB, marginTop:2 }}>{s.structured_formatting?.secondary_text || ""}</div>
            </div>
            <span style={{ color:T.textMuted, fontSize:16 }}>›</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Chat Screen ─────────────────────────────────────── */
function ChatScreen({ T, onBack, rideId, sender = "user" }) {
  const [msgs, setMsgs] = useState([
    { from:"driver", text:"Namaste! Main aa raha hoon 🚗", sent_at: new Date() },
    { from:"user",   text:"Ok bhai, main gate pe hun",    sent_at: new Date() },
  ])
  const [input, setInput] = useState("")
  const [typing, setTyping] = useState(false)
  const endRef = useRef()
  const QUICK = sender === "user"
    ? ["Ok coming", "Wait 1 min", "Where are you?", "Please call"]
    : ["On my way!", "2 min away", "Arrived!", "Cash only"]
  useEffect(() => { endRef.current?.scrollIntoView({ behavior:"smooth" }) }, [msgs])
  useEffect(() => {
    if (!rideId) return
    getChatMessages(rideId).then(data => { if (data.length) setMsgs(data) })
    const unsub = subChat(rideId, msg => setMsgs(m => [...m, msg]))
    return unsub
  }, [rideId])
  const send = async (text) => {
    if (!text.trim()) return
    const msg = { from: sender, text: text.trim(), sent_at: new Date() }
    setMsgs(m => [...m, msg])
    setInput("")
    if (rideId) await sendMessage(rideId, sender, text.trim())
    setTyping(true)
    setTimeout(() => {
      setTyping(false)
      const replies = sender === "user"
        ? ["Haan bhai, 2 min mein", "Ok aa raha hoon", "Pahunch gaya", "Wait karo"]
        : ["Ok bhai!", "Theek hai", "Samajh gaya", "Aa raha hoon"]
      setMsgs(m => [...m, { from: sender === "user" ? "driver" : "user", text: replies[Math.floor(Math.random()*replies.length)], sent_at: new Date() }])
    }, 1400)
  }
  return (
    <div style={{ display:"flex", flexDirection:"column", height:748 }}>
      <div style={{ padding:"14px 16px", display:"flex", alignItems:"center", gap:12, borderBottom:`1px solid ${T.border}`, background:T.surface }}>
        <button onClick={onBack} style={{ width:34, height:34, borderRadius:11, background:T.card, border:`1px solid ${T.border}`, cursor:"pointer", fontSize:16, color:T.text, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>←</button>
        <div style={{ width:40, height:40, borderRadius:14, background:T.accentSoft, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>{sender === "driver" ? "👩" : "👨"}</div>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:F, fontWeight:700, fontSize:15 }}>{sender === "driver" ? "Priya Sharma" : "Ramesh Kumar"}</div>
          <div style={{ display:"flex", alignItems:"center", gap:5, marginTop:2 }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:T.green }}/>
            <span style={{ fontSize:11, color:T.green, fontFamily:FB, fontWeight:600 }}>Online</span>
          </div>
        </div>
        <button style={{ width:36, height:36, borderRadius:12, background:T.greenSoft, border:`1px solid ${T.green}30`, cursor:"pointer", fontSize:17, display:"flex", alignItems:"center", justifyContent:"center" }}>📞</button>
      </div>
      <div style={{ flex:1, overflowY:"auto", scrollbarWidth:"none", padding:"14px 14px 0" }}>
        <div style={{ textAlign:"center", marginBottom:14 }}>
          <span style={{ background:T.surface, borderRadius:100, padding:"4px 14px", fontSize:11, color:T.textMuted, fontFamily:FB, border:`1px solid ${T.border}` }}>Today</span>
        </div>
        {msgs.map((m, i) => {
          const isMe = m.from === sender
          return (
            <div key={i} style={{ display:"flex", justifyContent: isMe ? "flex-end" : "flex-start", marginBottom:10 }}>
              {!isMe && <div style={{ width:28, height:28, borderRadius:10, background:T.accentSoft, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, marginRight:8, flexShrink:0, alignSelf:"flex-end" }}>{sender === "driver" ? "👩" : "👨"}</div>}
              <div style={{ maxWidth:"72%" }}>
                <div style={{ background: isMe ? T.accent : T.card, borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px", padding:"10px 14px", border: isMe ? "none" : `1px solid ${T.border}` }}>
                  <div style={{ fontSize:14, color: isMe ? "#fff" : T.text, fontFamily:FB, lineHeight:1.4 }}>{m.text || m.message}</div>
                </div>
                <div style={{ fontSize:10, color:T.textMuted, fontFamily:FB, marginTop:3, textAlign: isMe ? "right" : "left" }}>
                  {new Date(m.sent_at).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" })}
                </div>
              </div>
            </div>
          )
        })}
        {typing && (
          <div style={{ display:"flex", gap:8, marginBottom:10 }}>
            <div style={{ width:28, height:28, borderRadius:10, background:T.accentSoft, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>{sender === "driver" ? "👩" : "👨"}</div>
            <div style={{ background:T.card, borderRadius:"18px 18px 18px 4px", padding:"12px 16px", border:`1px solid ${T.border}` }}>
              <div style={{ display:"flex", gap:4 }}>
                {[0,1,2].map(i => <div key={i} style={{ width:6, height:6, borderRadius:"50%", background:T.textMuted, animation:`bounce 1s ${i*0.2}s infinite` }}/>)}
              </div>
            </div>
          </div>
        )}
        <div ref={endRef}/>
      </div>
      <div style={{ padding:"8px 12px 4px", display:"flex", gap:6, overflowX:"auto", scrollbarWidth:"none" }}>
        {QUICK.map(q => <button key={q} onClick={() => send(q)} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:100, padding:"6px 13px", fontSize:11, color:T.textSub, cursor:"pointer", whiteSpace:"nowrap", fontFamily:FB, fontWeight:600, flexShrink:0 }}>{q}</button>)}
      </div>
      <div style={{ padding:"8px 12px 28px", display:"flex", gap:8, borderTop:`1px solid ${T.border}` }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send(input)}
          placeholder="Type a message..."
          style={{ flex:1, background:T.input, border:`1.5px solid ${T.border}`, borderRadius:14, padding:"12px 14px", color:T.text, fontSize:14, outline:"none", fontFamily:FB }}/>
        <button onClick={() => send(input)} style={{ width:44, height:44, borderRadius:13, background: input.trim() ? T.accent : T.card, border:`1px solid ${input.trim() ? T.accent : T.border}`, cursor: input.trim() ? "pointer" : "default", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, transition:"all 0.15s" }}>➤</button>
      </div>
    </div>
  )
}

/* ── Promo Screen ────────────────────────────────────── */
function PromoScreen({ T, onBack, onApply, appliedCode }) {
  const [input, setInput] = useState("")
  const [msg, setMsg] = useState(null)
  const PROMOS = [
    { code:"FIRST50",   desc:"50% off on first ride", tag:"50% OFF",  expiry:"Apr 30" },
    { code:"NAGPUR20",  desc:"₹20 off in Nagpur",     tag:"₹20 OFF",  expiry:"Mar 31" },
    { code:"OMKESH10",  desc:"Founder special 10% off",tag:"10% OFF",  expiry:"Jun 30" },
    { code:"WELCOME",   desc:"Welcome bonus ₹30",      tag:"EXPIRED",  expiry:"Expired" },
  ]
  const tryCode = async () => {
    const res = await validatePromo(input, 200)
    if (res.valid) { setMsg({ ok:true, text:`✅ "${input}" applied! Save ₹${res.discount}` }); onApply({ code:input, discount:res.discount, ...res }) }
    else setMsg({ ok:false, text:`❌ ${res.message}` })
  }
  return (
    <div style={{ padding:"0 0 32px" }}>
      <BackBtn T={T} onBack={onBack} title="Promo Codes"/>
      <div style={{ padding:"0 16px" }}>
        <div style={{ display:"flex", gap:8, marginBottom:14 }}>
          <input value={input} onChange={e => setInput(e.target.value.toUpperCase())}
            placeholder="Enter promo code"
            style={{ flex:1, background:T.input, border:`1.5px solid ${T.border}`, borderRadius:14, padding:"13px 15px", color:T.text, fontSize:15, outline:"none", fontFamily:FB, textTransform:"uppercase", letterSpacing:1, fontWeight:700 }}/>
          <Btn T={T} primary onClick={tryCode}>Apply</Btn>
        </div>
        {msg && <div style={{ background: msg.ok ? T.greenSoft : T.redSoft, border:`1px solid ${msg.ok ? T.green+"30" : T.red+"30"}`, borderRadius:12, padding:"11px 14px", marginBottom:14, fontSize:13, color: msg.ok ? T.green : T.red, fontFamily:FB, fontWeight:600 }}>{msg.text}</div>}
        <div style={{ fontFamily:F, fontWeight:700, fontSize:15, marginBottom:12 }}>Available Offers</div>
        {PROMOS.map(p => (
          <div key={p.code} style={{ background:T.card, borderRadius:16, border:`1.5px dashed ${p.expiry==="Expired"?T.border:T.accent}`, padding:"16px", marginBottom:10, opacity: p.expiry==="Expired" ? 0.5 : 1, display:"flex", gap:14, alignItems:"flex-start" }}>
            <div style={{ width:44, height:44, borderRadius:14, background: p.expiry==="Expired" ? T.surface : T.accentSoft, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>{p.expiry==="Expired" ? "❌" : "🎫"}</div>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                <span style={{ fontFamily:F, fontWeight:800, fontSize:15, letterSpacing:0.5, color:T.accent }}>{p.code}</span>
                <Pill T={T} color={p.expiry==="Expired"?T.textMuted:T.green} sm>{p.tag}</Pill>
              </div>
              <div style={{ fontSize:13, color:T.text, fontFamily:FB, marginBottom:3 }}>{p.desc}</div>
              <div style={{ fontSize:11, color:T.textMuted, fontFamily:FB }}>Expires: {p.expiry}</div>
            </div>
            {p.expiry !== "Expired" && (
              <button onClick={() => setInput(p.code)} style={{ padding:"7px 14px", background:T.accentSoft, border:`1px solid ${T.accent}30`, borderRadius:10, color:T.accent, cursor:"pointer", fontSize:12, fontWeight:700, fontFamily:FB, flexShrink:0 }}>Use</button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Schedule Screen ─────────────────────────────────── */
function ScheduleScreen({ T, onBack, userId }) {
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [from, setFrom] = useState("Sitabuldi, Nagpur")
  const [to, setTo] = useState("")
  const [selV, setSelV] = useState("auto")
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const today = new Date().toISOString().split("T")[0]
  const handleSchedule = async () => {
    setLoading(true)
    try {
      await scheduleRide(userId, {
        pickup_address: from, drop_address: to,
        vehicle_type: selV, fare: VEHICLES.find(v=>v.id===selV)?.basePrice,
        scheduled_at: new Date(`${date}T${time}`).toISOString(), status:"upcoming"
      })
      setDone(true)
    } catch { setDone(true) } finally { setLoading(false) }
  }
  if (done) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:680, padding:40, textAlign:"center" }}>
      <div style={{ fontSize:56, marginBottom:20 }}>📅</div>
      <div style={{ fontFamily:F, fontWeight:800, fontSize:24, marginBottom:10 }}>Ride Scheduled!</div>
      <div style={{ color:T.textSub, fontSize:14, fontFamily:FB, lineHeight:1.7, marginBottom:28 }}>
        {date} at {time}<br/>{from} → {to}<br/>
        <span style={{ color:T.accent, fontWeight:700 }}>{VEHICLES.find(v=>v.id===selV)?.name} · ₹{VEHICLES.find(v=>v.id===selV)?.basePrice}</span>
      </div>
      <Btn T={T} primary full onClick={onBack}>Back to Home</Btn>
    </div>
  )
  return (
    <div style={{ padding:"0 0 32px", height:748, overflowY:"auto", scrollbarWidth:"none" }}>
      <BackBtn T={T} onBack={onBack} title="Schedule a Ride"/>
      <div style={{ padding:"0 16px" }}>
        <div style={{ background:T.card, border:`1.5px solid ${T.border}`, borderRadius:16, overflow:"hidden", marginBottom:14 }}>
          {[["🟢","Pickup",from,setFrom],["🟧","Drop to","Where are you going?",setTo]].map(([ic,lbl,ph,setter],i) => (
            <div key={i} style={{ padding:"13px 16px", borderBottom: i===0 ? `1px solid ${T.border}` : "none", display:"flex", alignItems:"center", gap:12 }}>
              <span>{ic}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:10, color:T.textMuted, fontFamily:FB, fontWeight:700, textTransform:"uppercase", letterSpacing:0.4, marginBottom:2 }}>{lbl}</div>
                <input value={i===0?from:to} onChange={e=>setter(e.target.value)} placeholder={ph}
                  style={{ background:"transparent", border:"none", outline:"none", color:T.text, fontSize:14, width:"100%", fontFamily:FB }}/>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
          {[["📅","Date","date",date,setDate,today],["⏰","Time","time",time,setTime,""]].map(([ic,lbl,type,val,setter,min]) => (
            <div key={lbl} style={{ background:T.card, border:`1.5px solid ${T.border}`, borderRadius:14, padding:"14px" }}>
              <div style={{ fontSize:10, color:T.textMuted, fontFamily:FB, fontWeight:700, textTransform:"uppercase", letterSpacing:0.4, marginBottom:8 }}>{ic} {lbl}</div>
              <input type={type} value={val} min={min} onChange={e=>setter(e.target.value)}
                style={{ background:"transparent", border:"none", outline:"none", color:T.text, fontSize:13, width:"100%", fontFamily:FB, fontWeight:600 }}/>
            </div>
          ))}
        </div>
        <div style={{ fontSize:10, color:T.textMuted, fontWeight:700, textTransform:"uppercase", letterSpacing:0.8, marginBottom:9, fontFamily:FB }}>Choose Vehicle</div>
        <div style={{ display:"flex", flexDirection:"column", gap:7, marginBottom:18 }}>
          {VEHICLES.map(v => (
            <div key={v.id} onClick={() => setSelV(v.id)} style={{ background: selV===v.id ? T.card : T.input, border:`1.5px solid ${selV===v.id ? T.accent : T.border}`, borderRadius:14, padding:"12px 14px", display:"flex", alignItems:"center", gap:11, cursor:"pointer", boxShadow: selV===v.id ? `0 0 0 3px ${T.accentSoft}` : "none" }}>
              <span style={{ fontSize:26, width:32, textAlign:"center" }}>{v.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:F, fontWeight:700, fontSize:14 }}>{v.name}</div>
                <div style={{ fontSize:11, color:T.textSub, fontFamily:FB }}>{v.desc} · {v.eta} min</div>
              </div>
              <span style={{ fontFamily:F, fontWeight:800, fontSize:16, color: selV===v.id ? T.accent : T.text }}>₹{v.basePrice}</span>
            </div>
          ))}
        </div>
        <Btn T={T} primary full disabled={!date||!time||!to||loading} onClick={handleSchedule}>
          {loading ? "Scheduling..." : `Schedule · ₹${VEHICLES.find(v=>v.id===selV)?.basePrice}`}
        </Btn>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════
   USER APP
══════════════════════════════════════════════════════ */
function UserApp({ T, isDark }) {
  const [screen, setScreen] = useState("login")
  const [tab, setTab] = useState("home")
  const [phone, setPhone] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState(["","","",""])
  const [user, setUser] = useState(null)
  const [selV, setSelV] = useState("auto")
  const [dest, setDest] = useState(null)
  const [appliedPromo, setAppliedPromo] = useState(null)
  const [finding, setFinding] = useState(false)
  const [currentRide, setCurrentRide] = useState(null)
  const [rideProgress, setRideProgress] = useState(0)
  const [ridePhase, setRidePhase] = useState("arriving")
  const [driverPos, setDriverPos] = useState(null)
  const [showSOS, setShowSOS] = useState(false)
  const [myRides, setMyRides] = useState(DEMO_RIDES)
  const [pricing, setPricing] = useState([])
  const refs = [useRef(),useRef(),useRef(),useRef()]

  useEffect(() => { getPricing().then(setPricing) }, [])

  const handleOtp = (i, v) => {
    if (!/^\d*$/.test(v)) return
    const n = [...otp]; n[i] = v.slice(-1); setOtp(n)
    if (v && i < 3) refs[i+1].current?.focus()
  }
  const handleLogin = async () => {
    const u = await getOrCreateUser(phone)
    setUser(u)
    setScreen("home")
    if (u) getUserRides(u.id).then(r => { if (r.length) setMyRides(r) })
  }

  // Start ride booking
  const handleBook = async () => {
    setFinding(true)
    try {
      const v = VEHICLES.find(v=>v.id===selV)
      const pData = pricing.find(p=>p.vehicle_type===selV)
      const fare = pData ? Number(pData.base_fare) + 12 * Number(pData.per_km_rate) : v.basePrice
      const finalFare = Math.round(fare * (pData?.surge_multiplier||1)) - (appliedPromo?.discount||0)
      const ride = await bookRide({
        userId: user?.id, fare: finalFare,
        pickup: { lat:21.1458, lng:79.0882, address:"Sitabuldi, Nagpur" },
        drop:   { lat: dest?.lat||21.09, lng: dest?.lng||79.05, address: dest?.name||"Destination" },
        vehicleType: selV, promoCode: appliedPromo?.code, discount: appliedPromo?.discount||0
      })
      setCurrentRide(ride)
      setTimeout(() => {
        setFinding(false)
        setScreen("tracking")
        setRideProgress(0)
        setRidePhase("arriving")
        // Simulate driver accepting
        if (ride?.id) updateRideStatus(ride.id, "accepted", { driver_id: null })
      }, 3000)
    } catch { setFinding(false) }
  }

  // Track ride progress
  useEffect(() => {
    if (screen !== "tracking") return
    const i = setInterval(() => setRideProgress(p => {
      if (p >= 100) { clearInterval(i); setRidePhase("done"); return 100 }
      if (p >= 40) setRidePhase("riding")
      return p + 0.7
    }), 110)
    return () => clearInterval(i)
  }, [screen])

  // Subscribe to driver location
  useEffect(() => {
    if (screen !== "tracking" || !currentRide?.driver_id) return
    const unsub = subDriverLocation(currentRide.driver_id, loc => setDriverPos({ lat:loc.lat, lng:loc.lng }))
    return unsub
  }, [screen, currentRide])

  const selVehicle = VEHICLES.find(v => v.id === selV)
  const pData = pricing.find(p => p.vehicle_type === selV)
  const surge = pData?.surge_multiplier || 1
  const baseF = pData ? Number(pData.base_fare) + 12 * Number(pData.per_km_rate) : selVehicle?.basePrice || 78
  const surgedF = Math.round(baseF * surge)
  const finalF = surgedF - (appliedPromo?.discount || 0)

  // Sub-screens
  if (screen === "search")   return <Phone T={T}><SBar T={T}/><div style={{ height:748, overflowY:"auto", scrollbarWidth:"none" }}><SearchScreen T={T} value={dest?.name} onSelect={d => { setDest(d); setScreen("home") }} onBack={() => setScreen("home")}/></div></Phone>
  if (screen === "promo")    return <Phone T={T}><SBar T={T}/><div style={{ height:748, overflowY:"auto", scrollbarWidth:"none" }}><PromoScreen T={T} onBack={() => setScreen("home")} onApply={p => { setAppliedPromo(p); setScreen("home") }} appliedCode={appliedPromo?.code}/></div></Phone>
  if (screen === "schedule") return <Phone T={T}><SBar T={T}/><div style={{ height:748, overflowY:"auto", scrollbarWidth:"none" }}><ScheduleScreen T={T} onBack={() => setScreen("home")} userId={user?.id}/></div></Phone>
  if (screen === "chat")     return <Phone T={T}><SBar T={T}/><div style={{ height:748, overflowY:"auto", scrollbarWidth:"none" }}><ChatScreen T={T} onBack={() => setScreen("tracking")} rideId={currentRide?.id} sender="user"/></div></Phone>

  return (
    <Phone T={T}>
      <SBar T={T}/>
      {showSOS && <SOSModal T={T} onClose={() => setShowSOS(false)} rideId={currentRide?.id} userId={user?.id}/>}
      <div style={{ height:748, overflowY:"auto", overflowX:"hidden", scrollbarWidth:"none", paddingBottom:["home","history","profile"].includes(screen)&&!finding ? 80 : 0 }}>

        {/* LOGIN */}
        {screen === "login" && (
          <div style={{ padding:"28px 22px 32px" }}>
            <div style={{ marginBottom:36 }}>
              <div style={{ width:56, height:56, borderRadius:18, background:T.accent, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, marginBottom:18, boxShadow:`0 12px 28px ${T.accentGlow}` }}>🚕</div>
              <div style={{ fontFamily:F, fontSize:30, fontWeight:800, letterSpacing:-0.7, lineHeight:1.15 }}>
                {!otpSent ? "What's your number?" : "Enter the code"}
              </div>
              <div style={{ color:T.textSub, fontSize:13, marginTop:8, fontFamily:FB, lineHeight:1.5 }}>
                {!otpSent ? "We'll send a verification code" : `Sent to +91 ${phone} · `}
                {otpSent && <span style={{ color:T.accent, cursor:"pointer", fontWeight:600 }} onClick={() => { setOtpSent(false); setOtp(["","","",""]); setPhone("") }}>Change</span>}
              </div>
            </div>
            {!otpSent ? <>
              <div style={{ background:T.input, border:`1.5px solid ${T.border}`, borderRadius:16, display:"flex", overflow:"hidden", marginBottom:14 }}>
                <div style={{ padding:"17px 14px", borderRight:`1px solid ${T.border}`, color:T.textSub, fontSize:14, fontWeight:600, whiteSpace:"nowrap" }}>🇮🇳 +91</div>
                <input value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g,"").slice(0,10))} placeholder="10-digit mobile number"
                  style={{ background:"transparent", border:"none", outline:"none", padding:"17px 14px", color:T.text, fontSize:16, flex:1, fontFamily:FB }}/>
              </div>
              <Btn T={T} primary full disabled={phone.length!==10} onClick={() => setOtpSent(true)}>Continue →</Btn>
            </> : <>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:10, marginBottom:18 }}>
                {otp.map((d,i) => <input key={i} ref={refs[i]} value={d} onChange={e => handleOtp(i,e.target.value)} maxLength={1}
                  style={{ width:"100%", height:64, background: d?T.accentSoft:T.input, border:`2px solid ${d?T.accent:T.border}`, borderRadius:15, textAlign:"center", fontSize:26, fontWeight:800, color:T.text, outline:"none", fontFamily:F, boxSizing:"border-box" }}/>)}
              </div>
              <Btn T={T} primary full disabled={otp.join("").length!==4} onClick={handleLogin}>Verify & Continue →</Btn>
              <div style={{ textAlign:"center", marginTop:14, color:T.textSub, fontSize:13, fontFamily:FB }}>
                Didn't get it? <span style={{ color:T.accent, fontWeight:600, cursor:"pointer" }}>Resend</span>
              </div>
            </>}
            <div style={{ marginTop:26, background:T.input, borderRadius:12, border:`1px solid ${T.border}`, padding:"13px 15px" }}>
              <div style={{ fontSize:10, color:T.textMuted, fontWeight:700, letterSpacing:0.5, textTransform:"uppercase", marginBottom:7, fontFamily:FB }}>Demo Login</div>
              <div style={{ fontSize:13, color:T.textSub, fontFamily:FB, lineHeight:1.8 }}>
                Phone: <b style={{ color:T.text }}>9876500001</b>&nbsp;&nbsp;OTP: <b style={{ color:T.accent }}>Any 4 digits</b>
              </div>
            </div>
          </div>
        )}

        {/* HOME */}
        {screen === "home" && !finding && (
          <div>
            <div style={{ position:"relative", overflow:"hidden" }}>
              <RideMap T={T} isDark={isDark} pickup={{ lat:21.1458, lng:79.0882 }} drop={dest?.lat ? dest : null} height={238}/>
              {/* Header overlay */}
              <div style={{ position:"absolute", top:10, left:14, right:14, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ background:T.overlay, backdropFilter:"blur(12px)", borderRadius:11, padding:"7px 13px", border:`1px solid ${T.border}` }}>
                  <div style={{ fontFamily:F, fontWeight:800, fontSize:14 }}>MyCity<span style={{ color:T.accent }}>Ride</span></div>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  {surge > 1 && <div style={{ background:"rgba(245,179,1,0.9)", borderRadius:11, padding:"6px 12px", fontSize:11, fontWeight:700, color:"#000" }}>⚡ {surge}x Surge</div>}
                  <div style={{ background:T.overlay, backdropFilter:"blur(12px)", borderRadius:11, padding:"7px 12px", border:`1px solid ${T.border}`, fontSize:11, color:T.textSub, fontWeight:600, display:"flex", alignItems:"center", gap:4 }}>
                    <span style={{ color:T.green, fontSize:9 }}>⬤</span> Nagpur
                  </div>
                </div>
              </div>
              <div style={{ position:"absolute", bottom:10, left:14, background:T.overlay, backdropFilter:"blur(12px)", borderRadius:9, padding:"5px 11px", border:`1px solid ${T.border}`, fontSize:11, color:T.textSub, fontWeight:600, display:"flex", alignItems:"center", gap:5 }}>
                <span style={{ color:T.green, fontSize:9 }}>⬤</span> Sitabuldi, Nagpur
              </div>
            </div>

            <div style={{ padding:"14px 16px 0" }}>
              {/* Quick actions */}
              <div style={{ display:"flex", gap:8, marginBottom:14 }}>
                {[["📅","Schedule",()=>setScreen("schedule"),false],["🎫","Promo",()=>setScreen("promo"),!!appliedPromo],["🆘","SOS",()=>setShowSOS(true),false,true]].map(([ic,lb,fn,active,red]) => (
                  <div key={lb} onClick={fn} style={{ flex:1, background: active?T.greenSoft:red?T.redSoft:T.card, border:`1.5px solid ${active?T.green:red?T.red+"30":T.border}`, borderRadius:14, padding:"12px 10px", textAlign:"center", cursor:"pointer", position:"relative" }}>
                    <div style={{ fontSize:20, marginBottom:4 }}>{ic}</div>
                    <div style={{ fontSize:10, fontWeight:700, color: active?T.green:red?T.red:T.textSub, fontFamily:FB }}>{lb}</div>
                    {active && <div style={{ position:"absolute", top:-5, right:-5, width:16, height:16, borderRadius:"50%", background:T.green, fontSize:9, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:800 }}>✓</div>}
                  </div>
                ))}
              </div>

              {/* Where to */}
              <div onClick={() => setScreen("search")} style={{ background:T.input, border:`1.5px solid ${dest?T.accent:T.border}`, borderRadius:14, padding:"14px 16px", marginBottom:12, display:"flex", alignItems:"center", gap:10, cursor:"pointer", transition:"all 0.15s" }}>
                <div style={{ width:9, height:9, borderRadius:3, background:T.accent, flexShrink:0 }}/>
                <span style={{ color: dest?T.text:T.textMuted, fontSize:14, fontFamily:FB, flex:1 }}>{dest?.name || "Where are you going?"}</span>
                <span style={{ fontSize:17, opacity:0.4 }}>🔍</span>
              </div>

              {/* Quick destinations */}
              <div style={{ display:"flex", gap:7, marginBottom:14, overflowX:"auto", scrollbarWidth:"none", paddingBottom:2 }}>
                {[["🏢","Office"],["🏠","Home"],["✈️","Airport"],["🏥","AIIMS"],["🛍️","Mall"]].map(([ic,lb]) => (
                  <div key={lb} onClick={() => setDest({ name:lb, lat:null, lng:null })} style={{ background: dest?.name===lb?T.accentSoft:T.card, border:`1px solid ${dest?.name===lb?T.accent:T.border}`, borderRadius:100, padding:"7px 14px", display:"flex", alignItems:"center", gap:5, cursor:"pointer", whiteSpace:"nowrap", flexShrink:0 }}>
                    <span style={{ fontSize:13 }}>{ic}</span>
                    <span style={{ fontSize:11, fontWeight:600, color: dest?.name===lb?T.accent:T.textSub, fontFamily:FB }}>{lb}</span>
                  </div>
                ))}
              </div>

              {/* Vehicle picker */}
              <div style={{ fontSize:10, color:T.textMuted, fontWeight:700, letterSpacing:0.8, textTransform:"uppercase", marginBottom:9, fontFamily:FB }}>Choose a ride</div>
              <div style={{ display:"flex", flexDirection:"column", gap:7, marginBottom:13 }}>
                {VEHICLES.map(v => {
                  const vp = pricing.find(p=>p.vehicle_type===v.id)
                  const sg = vp?.surge_multiplier||1
                  const vFare = vp ? Math.round((Number(vp.base_fare)+12*Number(vp.per_km_rate))*sg) : v.basePrice
                  return (
                    <div key={v.id} onClick={() => setSelV(v.id)} style={{ background: selV===v.id?T.card:T.input, border:`1.5px solid ${selV===v.id?T.accent:T.border}`, borderRadius:14, padding:"12px 14px", display:"flex", alignItems:"center", gap:11, cursor:"pointer", boxShadow: selV===v.id?`0 0 0 3px ${T.accentSoft}`:"none", transition:"all 0.15s" }}>
                      <span style={{ fontSize:28, width:34, textAlign:"center" }}>{v.icon}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                          <span style={{ fontFamily:F, fontWeight:700, fontSize:14 }}>{v.name}</span>
                          {v.tag && <span style={{ fontSize:8, fontWeight:800, background:T.accent, color:"#fff", padding:"2px 6px", borderRadius:4 }}>{v.tag}</span>}
                        </div>
                        <div style={{ fontSize:11, color:T.textSub, marginTop:2, fontFamily:FB }}>{v.desc} · {v.eta} min</div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        {sg>1 && <div style={{ fontSize:10, color:T.textMuted, textDecoration:"line-through", fontFamily:FB }}>₹{v.basePrice}</div>}
                        <div style={{ fontFamily:F, fontWeight:800, fontSize:16, color: selV===v.id?T.accent:T.text }}>₹{vFare}</div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Fare breakdown */}
              <div style={{ background:T.card, borderRadius:14, border:`1px solid ${T.border}`, padding:"13px 14px", marginBottom:12 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                  <span style={{ fontSize:10, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.5, fontFamily:FB }}>Fare Details</span>
                  {surge > 1 && <span style={{ fontSize:10, fontWeight:700, color:T.yellow, background:`${T.yellow}18`, padding:"2px 9px", borderRadius:100, fontFamily:FB }}>⚡ {surge}x Surge</span>}
                </div>
                {[["Base fare",`₹${baseF}`],[`Surge (${surge}x)`, surge>1?`+₹${surgedF-baseF}`:"—"],[`Promo${appliedPromo?` (${appliedPromo.code})`:""}`, appliedPromo?`-₹${appliedPromo.discount}`:"—"]].map(([l,v]) => (
                  <div key={l} style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:T.textSub, marginBottom:6, fontFamily:FB }}>
                    <span>{l}</span><span style={{ color: v.startsWith("-")?T.green:T.text, fontWeight:500 }}>{v}</span>
                  </div>
                ))}
                <div style={{ borderTop:`1px solid ${T.border}`, paddingTop:9, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ fontFamily:F, fontWeight:700, fontSize:14 }}>Total</span>
                  <span style={{ fontFamily:F, fontWeight:800, fontSize:20, color:T.accent }}>₹{finalF}</span>
                </div>
              </div>

              {/* Pay method */}
              <div style={{ display:"flex", gap:8, marginBottom:13 }}>
                {["💵 Cash","📱 UPI","👛 Wallet"].map(p => (
                  <div key={p} style={{ flex:1, background:T.input, border:`1px solid ${T.border}`, borderRadius:11, padding:"9px 6px", textAlign:"center", cursor:"pointer" }}>
                    <div style={{ fontSize:16, marginBottom:2 }}>{p.split(" ")[0]}</div>
                    <div style={{ fontSize:9, fontWeight:700, color:T.textSub, fontFamily:FB }}>{p.split(" ")[1]}</div>
                  </div>
                ))}
              </div>
              <Btn T={T} primary full disabled={!dest} onClick={handleBook}>
                {dest ? `Book ${selVehicle?.name} · ₹${finalF}` : "Select destination to book"}
              </Btn>
            </div>
          </div>
        )}

        {/* FINDING */}
        {finding && <FindingDriver T={T}/>}

        {/* TRACKING */}
        {screen === "tracking" && (
          <UserTracking T={T} isDark={isDark} progress={rideProgress} phase={ridePhase}
            driverPos={driverPos} rideId={currentRide?.id}
            onHome={() => { setScreen("home"); setTab("home"); setCurrentRide(null); setDest(null) }}
            onChat={() => setScreen("chat")} onSOS={() => setShowSOS(true)}/>
        )}

        {/* HISTORY */}
        {screen === "history" && (
          <div style={{ padding:"16px 16px" }}>
            <div style={{ fontFamily:F, fontWeight:800, fontSize:22, marginBottom:18, letterSpacing:-0.4 }}>Your Rides</div>
            {myRides.map((r,i) => (
              <div key={i} style={{ background:T.card, borderRadius:14, border:`1px solid ${T.border}`, padding:"14px", marginBottom:9 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:9 }}>
                  <div>
                    <div style={{ fontWeight:700, fontSize:14, fontFamily:F }}>{r.from||r.pickup_address} → {r.to||r.drop_address}</div>
                    <div style={{ color:T.textMuted, fontSize:11, marginTop:3, fontFamily:FB }}>{r.date||r.created_at?.slice(0,10)} · {r.dist||""}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontFamily:F, fontWeight:800, fontSize:15 }}>₹{r.fare}</div>
                    <Pill T={T} color={r.status==="done"||r.status==="completed"?T.green:T.red} sm>{r.status==="done"||r.status==="completed"?"Done":"Cancelled"}</Pill>
                  </div>
                </div>
                {(r.status==="done"||r.status==="completed") && (
                  <div style={{ borderTop:`1px solid ${T.border}`, paddingTop:9, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ fontSize:12, color:T.textSub, fontFamily:FB }}>👤 {r.driver||r.drivers?.name||"—"}</span>
                    <span style={{ fontSize:12 }}>{"⭐".repeat(r.rating||0)}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* PROFILE */}
        {screen === "profile" && (
          <div style={{ padding:"16px 16px" }}>
            <div style={{ background:T.card, borderRadius:18, border:`1px solid ${T.border}`, padding:"18px", marginBottom:14, display:"flex", gap:14, alignItems:"center" }}>
              <div style={{ width:60, height:60, borderRadius:20, background:`linear-gradient(135deg,${T.accent},#FF8040)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:28 }}>👩</div>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:F, fontWeight:800, fontSize:18 }}>{user?.name || "User"}</div>
                <div style={{ color:T.textSub, fontSize:12, marginTop:2, fontFamily:FB }}>+91 {user?.phone || phone}</div>
              </div>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontFamily:F, fontWeight:800, fontSize:18, color:T.accent }}>{user?.rating||"4.9"}</div>
                <div style={{ fontSize:10, color:T.textMuted, fontFamily:FB }}>⭐ Rating</div>
              </div>
            </div>
            <div style={{ display:"flex", gap:9, marginBottom:16 }}>
              {[["12","Rides"],["₹940","Spent"],["3","Promos"]].map(([v,l]) => (
                <div key={l} style={{ flex:1, background:T.card, border:`1px solid ${T.border}`, borderRadius:13, padding:"13px 0", textAlign:"center" }}>
                  <div style={{ fontFamily:F, fontWeight:800, fontSize:20, color:T.accent }}>{v}</div>
                  <div style={{ fontSize:10, color:T.textMuted, marginTop:3, fontFamily:FB }}>{l}</div>
                </div>
              ))}
            </div>
            {[["🎫","Promo Codes","2 active",()=>setScreen("promo")],["📅","Scheduled Rides","",()=>setScreen("schedule")],["💳","Payments","UPI, Cash",null],["🔔","Notifications","On",null],["❓","Help","",null],["🚪","Sign Out","",()=>{setScreen("login");setUser(null);setPhone("");setOtpSent(false);setOtp(["","","",""])},true]].map(([ic,lb,val,fn,red]) => (
              <div key={lb} onClick={fn} style={{ background:T.card, borderRadius:13, border:`1px solid ${T.border}`, padding:"14px 14px", marginBottom:7, display:"flex", alignItems:"center", gap:11, cursor:"pointer" }}>
                <span style={{ fontSize:18 }}>{ic}</span>
                <span style={{ flex:1, fontWeight:600, fontSize:13, color: red?T.red:T.text, fontFamily:FB }}>{lb}</span>
                {val && <span style={{ color:T.textMuted, fontSize:11, fontFamily:FB }}>{val}</span>}
                <span style={{ color:T.textMuted, fontSize:17, opacity:0.4 }}>›</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {["home","history","profile"].includes(screen) && !finding && (
        <BNav T={T} active={tab}
          tabs={[{id:"home",icon:"🏠",label:"Home"},{id:"history",icon:"🗂",label:"Rides"},{id:"profile",icon:"👤",label:"Profile"}]}
          onChange={t => { setTab(t); setScreen(t==="history"?"history":t==="profile"?"profile":"home") }}/>
      )}
    </Phone>
  )
}

function FindingDriver({ T }) {
  const [d, setD] = useState(0), [r, setR] = useState(0)
  useEffect(() => { const a=setInterval(()=>setD(p=>(p+1)%4),500); const b=setInterval(()=>setR(p=>(p+2)%100),40); return()=>{clearInterval(a);clearInterval(b)} }, [])
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:700, padding:40, textAlign:"center" }}>
      <div style={{ position:"relative", width:160, height:160, marginBottom:32 }}>
        <svg viewBox="0 0 160 160" style={{ position:"absolute", inset:0, width:"100%", height:"100%" }}>
          <circle cx="80" cy="80" r="70" stroke={T.border} strokeWidth="2" fill="none"/>
          <circle cx="80" cy="80" r="70" stroke={T.accent} strokeWidth="2.5" fill="none" strokeDasharray="440" strokeDashoffset={440-(r/100)*440} strokeLinecap="round" transform="rotate(-90 80 80)"/>
          <circle cx="80" cy="80" r="52" stroke={T.accentSoft} strokeWidth="38" fill="none" opacity="0.3"/>
        </svg>
        <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:44 }}>🚕</div>
      </div>
      <div style={{ fontFamily:F, fontSize:24, fontWeight:800, letterSpacing:-0.5, marginBottom:10 }}>Finding driver{".".repeat(d)}</div>
      <div style={{ color:T.textSub, fontSize:14, fontFamily:FB, lineHeight:1.7 }}>Connecting with nearby drivers<br/>in Sitabuldi, Nagpur</div>
    </div>
  )
}

function UserTracking({ T, isDark, progress, phase, driverPos, rideId, onHome, onChat, onSOS }) {
  const info = {
    arriving: { label:"Driver arriving", color:T.blue,  sub:"Ramesh is 2 min away" },
    riding:   { label:"Ride in progress", color:T.green, sub:"On the way to destination" },
    done:     { label:"Arrived! ✓",       color:T.green, sub:"You've reached your destination" },
  }[phase]
  return (
    <div>
      <div style={{ position:"relative", overflow:"hidden" }}>
        <RideMap T={T} isDark={isDark} pickup={{ lat:21.1458, lng:79.0882 }} drop={{ lat:21.09, lng:79.05 }} driverLat={driverPos?.lat||21.1481} driverLng={driverPos?.lng||79.0901} showDriver height={238}/>
        <div style={{ position:"absolute", bottom:0, left:0, right:0, height:3, background:T.border }}>
          <div style={{ width:`${progress}%`, height:"100%", background:`linear-gradient(90deg,${T.accent},#FF8040)`, transition:"width 0.2s" }}/>
        </div>
        <button onClick={onSOS} style={{ position:"absolute", top:10, right:12, background:"rgba(255,59,59,0.9)", backdropFilter:"blur(8px)", border:"none", borderRadius:12, padding:"7px 13px", color:"#fff", cursor:"pointer", fontFamily:F, fontWeight:700, fontSize:12 }}>🆘 SOS</button>
      </div>
      <div style={{ padding:"14px 16px" }}>
        <div style={{ background:T.card, borderRadius:14, border:`1px solid ${T.border}`, padding:"12px 14px", marginBottom:12, display:"flex", alignItems:"center", gap:11 }}>
          <div style={{ width:9, height:9, borderRadius:"50%", background:info.color, flexShrink:0, boxShadow:`0 0 8px ${info.color}` }}/>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, color:info.color, fontSize:13, fontFamily:F }}>{info.label}</div>
            <div style={{ fontSize:11, color:T.textSub, marginTop:2, fontFamily:FB }}>{info.sub}</div>
          </div>
          <div style={{ fontFamily:F, fontWeight:800, color:T.textMuted, fontSize:12 }}>{Math.max(0,Math.ceil((100-progress)*0.05))} min</div>
        </div>
        <div style={{ background:T.card, borderRadius:14, border:`1px solid ${T.border}`, padding:"13px 14px", marginBottom:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:11 }}>
            <div style={{ width:48, height:48, borderRadius:16, background:T.accentSoft, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24 }}>👨</div>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:F, fontWeight:800, fontSize:15 }}>Ramesh Kumar</div>
              <div style={{ color:T.textSub, fontSize:11, marginTop:2, fontFamily:FB }}>⭐ 4.8 · MH31-AB-1234</div>
            </div>
            <div style={{ display:"flex", gap:7 }}>
              <button onClick={onChat} style={{ width:37, height:37, borderRadius:12, background:T.blueSoft, border:`1px solid ${T.blue}30`, cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>💬</button>
              <button style={{ width:37, height:37, borderRadius:12, background:T.greenSoft, border:`1px solid ${T.green}30`, cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>📞</button>
            </div>
          </div>
        </div>
        <div style={{ background:T.card, borderRadius:14, border:`1px solid ${T.border}`, padding:"12px 14px", marginBottom:12 }}>
          <div style={{ height:5, background:T.border, borderRadius:3, overflow:"hidden" }}>
            <div style={{ width:`${progress}%`, height:"100%", background:`linear-gradient(90deg,${T.accent},#FF8040)`, borderRadius:3, transition:"width 0.3s" }}/>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:6, fontSize:11, color:T.textMuted, fontFamily:FB }}>
            <span>12.4 km</span><span style={{ color:T.accent, fontWeight:700 }}>₹245</span>
          </div>
        </div>
        {phase === "done" && (
          <div>
            <div style={{ background:T.card, borderRadius:14, border:`1.5px solid ${T.green}40`, padding:"18px", textAlign:"center", marginBottom:12 }}>
              <div style={{ fontSize:38, marginBottom:8 }}>🎉</div>
              <div style={{ fontFamily:F, fontWeight:800, fontSize:19, color:T.green, marginBottom:5 }}>Ride Complete!</div>
              <div style={{ color:T.textSub, fontSize:13, marginBottom:14, fontFamily:FB }}>Paid ₹245 · Thank you!</div>
              <div style={{ fontFamily:FB, fontSize:13, color:T.textSub, marginBottom:8 }}>Rate your experience</div>
              <div style={{ display:"flex", justifyContent:"center", gap:6 }}>
                {[1,2,3,4,5].map(i => <span key={i} style={{ fontSize:28, cursor:"pointer" }} onClick={() => rateRide && rateRide(rideId, i)}>⭐</span>)}
              </div>
            </div>
            <Btn T={T} primary full onClick={onHome}>Back to Home</Btn>
          </div>
        )}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════
   DRIVER APP
══════════════════════════════════════════════════════ */
function DriverApp({ T, isDark }) {
  const [screen, setScreen] = useState("login")
  const [tab, setTab] = useState("home")
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState(["","","",""])
  const [otpSent, setOtpSent] = useState(false)
  const [driver, setDriver] = useState(null)
  const [online, setOnline] = useState(false)
  const [rideReq, setRideReq] = useState(null)
  const [timer, setTimer] = useState(20)
  const [activeRide, setActiveRide] = useState(null)
  const [rideProgress, setRideProgress] = useState(0)
  const [showChat, setShowChat] = useState(false)
  const [showSOS, setShowSOS] = useState(false)
  const [docs, setDocs] = useState([])
  const refs = [useRef(),useRef(),useRef(),useRef()]

  const handleOtp = (i, v) => { if (!/^\d*$/.test(v)) return; const n=[...otp]; n[i]=v.slice(-1); setOtp(n); if(v&&i<3) refs[i+1].current?.focus() }
  const handleLogin = async () => {
    const d = await getDriverByPhone(phone)
    setDriver(d || { id:null, name:"Ramesh Kumar", status:"approved", vehicle_type:"car", vehicle_name:"Maruti Swift", plate_number:"MH31-AB-1234", rating:4.8 })
    getDriverDocuments(d?.id).then(setDocs)
    setScreen("home")
  }

  // Go online/offline
  const toggleOnline = async () => {
    const newState = !online
    setOnline(newState)
    if (driver?.id) { newState ? setDriverOnline(driver.id) : setDriverOffline(driver.id) }
    if (!newState) setRideReq(null)
  }

  // Simulate ride request when online
  useEffect(() => {
    if (!online || rideReq || activeRide || screen !== "home") return
    const t = setTimeout(() => {
      setRideReq({ id:"demo-ride-1", pickup_address:"Sitabuldi, Nagpur", drop_address:"Nagpur Airport", fare:245, distance_km:12.4, users:{ name:"Priya Sharma" } })
      setTimer(20)
    }, 3500)
    return () => clearTimeout(t)
  }, [online, rideReq, activeRide, screen])

  // Subscribe to real ride requests
  useEffect(() => {
    if (!driver?.id || !online) return
    const unsub = subNewRides(driver.vehicle_type||"car", (ride) => { setRideReq(ride); setTimer(20) })
    return unsub
  }, [driver, online])

  useEffect(() => {
    if (!rideReq) return
    if (timer <= 0) { setRideReq(null); return }
    const t = setInterval(() => setTimer(v => v-1), 1000)
    return () => clearInterval(t)
  }, [rideReq, timer])

  useEffect(() => {
    if (!activeRide) return
    setRideProgress(0)
    const i = setInterval(() => setRideProgress(p => { if(p>=100){clearInterval(i);return 100} return p+0.7 }), 110)
    return () => clearInterval(i)
  }, [activeRide])

  // GPS broadcast
  useEffect(() => {
    if (!online || !driver?.id) return
    const i = setInterval(() => {
      const lat = 21.1458 + (Math.random()-0.5)*0.01
      const lng = 79.0882 + (Math.random()-0.5)*0.01
      updateDriverLocation(driver.id, lat, lng)
    }, 5000)
    return () => clearInterval(i)
  }, [online, driver])

  const accept = async () => {
    if (rideReq?.id && driver?.id) await assignDriver(rideReq.id, driver.id)
    setActiveRide(rideReq)
    setRideReq(null)
  }
  const reject = () => { setRideReq(null); setTimeout(() => { if(online) { setRideReq({...rideReq||{id:"r2",pickup_address:"Civil Lines",drop_address:"Dharampeth",fare:78,users:{name:"Amit T."}}); setTimer(20) } }, 7000) }
  const complete = async () => {
    if (activeRide?.id) await updateRideStatus(activeRide.id, "completed")
    setActiveRide(null)
    setRideProgress(0)
    setTimeout(() => { if(online) { setRideReq({ id:"demo-2", pickup_address:"Civil Lines", drop_address:"Dharampeth", fare:78, users:{name:"Amit T."} }); setTimer(20) } }, 5000)
  }

  if (showChat) return <Phone T={T}><SBar T={T}/><div style={{ height:748, overflowY:"auto", scrollbarWidth:"none" }}><ChatScreen T={T} onBack={() => setShowChat(false)} rideId={activeRide?.id} sender="driver"/></div></Phone>

  return (
    <Phone T={T}>
      <SBar T={T}/>
      {showSOS && <SOSModal T={T} onClose={() => setShowSOS(false)} rideId={activeRide?.id}/>}
      {screen === "login" ? (
        <div style={{ padding:"28px 22px 32px" }}>
          <div style={{ marginBottom:34 }}>
            <div style={{ width:54, height:54, borderRadius:18, background:T.green, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, marginBottom:18, boxShadow:`0 12px 28px ${T.greenSoft}` }}>🚗</div>
            <div style={{ fontFamily:F, fontSize:28, fontWeight:800, letterSpacing:-0.6, lineHeight:1.15 }}>{!otpSent?"Driver Login":"Verify OTP"}</div>
            <div style={{ color:T.textSub, fontSize:13, marginTop:8, fontFamily:FB }}>{!otpSent?"Start earning with MyCityRide":"Enter the 4-digit code"}</div>
          </div>
          {!otpSent ? <>
            <div style={{ background:T.input, border:`1.5px solid ${T.border}`, borderRadius:15, display:"flex", overflow:"hidden", marginBottom:13 }}>
              <div style={{ padding:"17px 14px", borderRight:`1px solid ${T.border}`, color:T.textSub, fontSize:14, fontWeight:600 }}>🇮🇳 +91</div>
              <input value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g,"").slice(0,10))} placeholder="Registered mobile"
                style={{ background:"transparent", border:"none", outline:"none", padding:"17px 14px", color:T.text, fontSize:16, flex:1, fontFamily:FB }}/>
            </div>
            <Btn T={T} full green disabled={phone.length!==10} onClick={() => setOtpSent(true)}>Send OTP</Btn>
          </> : <>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:10, marginBottom:16 }}>
              {otp.map((d,i) => <input key={i} ref={refs[i]} value={d} onChange={e => handleOtp(i,e.target.value)} maxLength={1}
                style={{ width:"100%", height:62, background: d?T.greenSoft:T.input, border:`2px solid ${d?T.green:T.border}`, borderRadius:14, textAlign:"center", fontSize:26, fontWeight:800, color:T.text, outline:"none", fontFamily:F, boxSizing:"border-box" }}/>)}
            </div>
            <Btn T={T} full green disabled={otp.join("").length!==4} onClick={handleLogin}>Verify & Login →</Btn>
          </>}
          <div style={{ marginTop:26, background:T.input, borderRadius:12, border:`1px solid ${T.border}`, padding:"13px 15px" }}>
            <div style={{ fontSize:10, color:T.textMuted, fontWeight:700, letterSpacing:0.5, textTransform:"uppercase", marginBottom:7, fontFamily:FB }}>Demo Credentials</div>
            <div style={{ fontSize:13, color:T.textSub, fontFamily:FB, lineHeight:1.8 }}>Phone: <b style={{ color:T.text }}>9876500002</b>&nbsp;&nbsp;OTP: <b style={{ color:T.green }}>Any 4 digits</b></div>
          </div>
        </div>
      ) : (
        <>
          <div style={{ padding:"10px 16px 0", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div>
              <div style={{ fontFamily:F, fontWeight:800, fontSize:17 }}>MyCity<span style={{ color:T.accent }}>Driver</span></div>
              <div style={{ fontSize:11, color:T.textSub, fontFamily:FB, marginTop:1 }}>Hey {driver?.name?.split(" ")[0] || "Ramesh"} 👋</div>
            </div>
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              <button onClick={() => setShowSOS(true)} style={{ width:34, height:34, borderRadius:11, background:T.redSoft, border:`1px solid ${T.red}30`, cursor:"pointer", fontSize:15, display:"flex", alignItems:"center", justifyContent:"center" }}>🆘</button>
              <button onClick={toggleOnline} style={{ display:"flex", alignItems:"center", gap:7, background: online?T.greenSoft:T.card, border:`1.5px solid ${online?T.green:T.border}`, borderRadius:100, padding:"8px 16px", cursor:"pointer", transition:"all 0.2s" }}>
                <div style={{ width:7, height:7, borderRadius:"50%", background: online?T.green:T.textMuted }}/>
                <span style={{ fontSize:12, fontWeight:700, color: online?T.green:T.textSub, fontFamily:FB }}>{online?"Online":"Offline"}</span>
              </button>
            </div>
          </div>
          <div style={{ height:678, overflowY:"auto", overflowX:"hidden", scrollbarWidth:"none", paddingBottom:80 }}>
            {rideReq && !activeRide && tab==="home" && <div style={{ margin:"10px 12px 0" }}><RideReqCard T={T} ride={rideReq} timer={timer} onAccept={accept} onReject={reject}/></div>}
            {tab==="home" && !rideReq && !activeRide && <DriverHome T={T} online={online} driver={driver}/>}
            {tab==="home" && activeRide && <DriverActiveRide T={T} isDark={isDark} progress={rideProgress} ride={activeRide} onComplete={complete} onChat={() => setShowChat(true)} onSOS={() => setShowSOS(true)}/>}
            {tab==="earn" && <DriverEarnings T={T}/>}
            {tab==="docs" && <DriverDocs T={T} driver={driver} docs={docs} onDocsUpdate={setDocs}/>}
          </div>
          <BNav T={T} active={tab}
            tabs={[{id:"home",icon:"🏠",label:"Home"},{id:"earn",icon:"💰",label:"Earnings"},{id:"docs",icon:"📋",label:"Docs"}]}
            onChange={setTab}/>
        </>
      )}
    </Phone>
  )
}

function RideReqCard({ T, ride, timer, onAccept, onReject }) {
  const circ = 2*Math.PI*52, pct = timer/20
  return (
    <div style={{ background:T.card, borderRadius:20, border:`2px solid ${T.accent}`, overflow:"hidden", boxShadow:`0 0 48px ${T.accentGlow}` }}>
      <div style={{ background:T.accentSoft, padding:"13px 16px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ fontFamily:F, fontWeight:800, fontSize:17, color:T.accent }}>New Ride Request!</div>
        <div style={{ position:"relative", width:50, height:50 }}>
          <svg viewBox="0 0 120 120" style={{ position:"absolute", inset:0, width:"100%", height:"100%" }}>
            <circle cx="60" cy="60" r="52" fill="none" stroke={T.border} strokeWidth="8"/>
            <circle cx="60" cy="60" r="52" fill="none" stroke={timer<=8?T.red:T.green} strokeWidth="8" strokeDasharray={circ} strokeDashoffset={circ*(1-pct)} strokeLinecap="round" transform="rotate(-90 60 60)"/>
          </svg>
          <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:F, fontWeight:800, fontSize:17, color: timer<=8?T.red:T.text }}>{timer}</div>
        </div>
      </div>
      <div style={{ padding:"13px 16px" }}>
        {[["👤","Passenger", ride?.users?.name||"Passenger"],["📍","Pickup", ride?.pickup_address||"Pickup"],["🎯","Drop", ride?.drop_address||"Drop"],["📏","Distance", `${ride?.distance_km||"12.4"} km`],["💰","Fare", `₹${ride?.fare||245}`]].map(([icon,label,val]) => (
          <div key={label} style={{ display:"flex", alignItems:"center", gap:11, marginBottom:9 }}>
            <span style={{ width:19, textAlign:"center", fontSize:14 }}>{icon}</span>
            <span style={{ color:T.textMuted, fontSize:12, width:65, fontFamily:FB, fontWeight:600 }}>{label}</span>
            <span style={{ fontWeight:600, fontSize:13, fontFamily:FB, color:T.text }}>{val}</span>
          </div>
        ))}
      </div>
      <div style={{ display:"flex", gap:9, padding:"0 14px 14px" }}>
        <button onClick={onReject} style={{ flex:1, padding:"13px", background:T.redSoft, border:`1px solid ${T.red}40`, borderRadius:13, color:T.red, cursor:"pointer", fontFamily:F, fontWeight:700, fontSize:14 }}>✕ Decline</button>
        <button onClick={onAccept} style={{ flex:2, padding:"13px", background:T.green, border:"none", borderRadius:13, color:"#fff", cursor:"pointer", fontFamily:F, fontWeight:800, fontSize:14, boxShadow:`0 10px 24px ${T.greenSoft}` }}>✓ Accept</button>
      </div>
    </div>
  )
}

function DriverHome({ T, online, driver }) {
  return (
    <div style={{ padding:"12px 14px" }}>
      <div style={{ background: online?T.greenSoft:T.redSoft, border:`1.5px solid ${online?T.green+"40":T.red+"30"}`, borderRadius:14, padding:"13px 14px", marginBottom:14, display:"flex", alignItems:"center", gap:11 }}>
        <span style={{ fontSize:26 }}>{online?"🟢":"⛔"}</span>
        <div>
          <div style={{ fontWeight:700, color: online?T.green:T.red, fontSize:13, fontFamily:F }}>{online?"You're Live — Accepting Rides":"You're Offline"}</div>
          <div style={{ fontSize:11, color:T.textSub, marginTop:2, fontFamily:FB }}>{online?"Ride requests will pop up here":"Toggle the switch to go online"}</div>
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:9, marginBottom:14 }}>
        {[{l:"Today's Rides",v:"8",ic:"🚗",c:T.accent},{l:"Earnings",v:"₹640",ic:"💰",c:T.green},{l:"Hours Online",v:"6.5h",ic:"⏱️",c:T.blue},{l:"Rating",v:`${driver?.rating||4.8}★`,ic:"⭐",c:T.yellow}].map(s => (
          <div key={s.l} style={{ background:T.card, borderRadius:14, border:`1px solid ${T.border}`, padding:"14px" }}>
            <div style={{ fontSize:20, marginBottom:8 }}>{s.ic}</div>
            <div style={{ fontFamily:F, fontWeight:800, fontSize:22, color:s.c }}>{s.v}</div>
            <div style={{ fontSize:10, color:T.textMuted, marginTop:3, fontFamily:FB }}>{s.l}</div>
          </div>
        ))}
      </div>
      <div style={{ fontFamily:F, fontWeight:700, fontSize:14, marginBottom:10 }}>Recent Trips</div>
      {DEMO_RIDES.slice(0,3).map((r,i) => (
        <div key={i} style={{ background:T.card, borderRadius:12, border:`1px solid ${T.border}`, padding:"12px 13px", marginBottom:7, display:"flex", alignItems:"center", gap:11 }}>
          <span style={{ fontSize:18, opacity:0.7 }}>🗺️</span>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:600, fontSize:12, fontFamily:FB }}>{r.from} → {r.to}</div>
            <div style={{ color:T.textMuted, fontSize:10, marginTop:2, fontFamily:FB }}>{r.date}</div>
          </div>
          <div style={{ fontFamily:F, fontWeight:800, color:T.green, fontSize:14 }}>₹{r.fare}</div>
        </div>
      ))}
    </div>
  )
}

function DriverActiveRide({ T, isDark, progress, ride, onComplete, onChat, onSOS }) {
  return (
    <div style={{ padding:"12px 14px" }}>
      <div style={{ background:T.greenSoft, border:`1px solid ${T.green}40`, borderRadius:12, padding:"10px 14px", display:"flex", alignItems:"center", gap:9, marginBottom:12 }}>
        <div style={{ width:7, height:7, borderRadius:"50%", background:T.green }}/>
        <span style={{ color:T.green, fontWeight:700, fontSize:12, fontFamily:F, flex:1 }}>Ride in Progress</span>
        <span style={{ color:T.accent, fontWeight:700, fontSize:13, fontFamily:F }}>₹{ride?.fare||245}</span>
      </div>
      <div style={{ background:T.card, borderRadius:14, border:`1px solid ${T.border}`, overflow:"hidden", marginBottom:12 }}>
        <FallbackMap T={T} height={195} showDriver/>
        <div style={{ height:4, background:T.border }}><div style={{ width:`${progress}%`, height:"100%", background:`linear-gradient(90deg,${T.accent},#FF8040)`, transition:"width 0.2s" }}/></div>
      </div>
      <div style={{ background:T.card, borderRadius:14, border:`1px solid ${T.border}`, padding:"13px", marginBottom:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:11, marginBottom:11 }}>
          <div style={{ width:46, height:46, borderRadius:15, background:T.accentSoft, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>👩</div>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:F, fontWeight:700, fontSize:14 }}>{ride?.users?.name||"Passenger"}</div>
            <div style={{ color:T.textSub, fontSize:11, fontFamily:FB }}>Drop: {ride?.drop_address||"Destination"}</div>
          </div>
          <div style={{ display:"flex", gap:7 }}>
            <button onClick={onChat} style={{ width:36, height:36, borderRadius:11, background:T.blueSoft, border:`1px solid ${T.blue}30`, cursor:"pointer", fontSize:15, display:"flex", alignItems:"center", justifyContent:"center" }}>💬</button>
            <button style={{ width:36, height:36, borderRadius:11, background:T.greenSoft, border:`1px solid ${T.green}30`, cursor:"pointer", fontSize:15, display:"flex", alignItems:"center", justifyContent:"center" }}>📞</button>
            <button onClick={onSOS} style={{ width:36, height:36, borderRadius:11, background:T.redSoft, border:`1px solid ${T.red}30`, cursor:"pointer", fontSize:15, display:"flex", alignItems:"center", justifyContent:"center" }}>🆘</button>
          </div>
        </div>
        <div>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:T.textMuted, marginBottom:4, fontFamily:FB }}>
            <span>Trip progress</span><span style={{ fontWeight:700 }}>{Math.round(progress)}%</span>
          </div>
          <div style={{ height:5, background:T.border, borderRadius:3 }}><div style={{ width:`${progress}%`, height:"100%", background:`linear-gradient(90deg,${T.accent},#FF8040)`, borderRadius:3, transition:"width 0.2s" }}/></div>
        </div>
      </div>
      {progress >= 100 && <Btn T={T} full green onClick={onComplete}>✓ Complete — Collect ₹{ride?.fare||245}</Btn>}
    </div>
  )
}

function DriverEarnings({ T }) {
  const wk = ["M","T","W","T","F","S","S"], vals = [320,450,280,560,490,720,640], mx = Math.max(...vals)
  return (
    <div style={{ padding:"16px 14px" }}>
      <div style={{ fontFamily:F, fontWeight:800, fontSize:21, marginBottom:16, letterSpacing:-0.4 }}>Earnings</div>
      <div style={{ background:`linear-gradient(135deg,${T.accent},#FF8040)`, borderRadius:18, padding:"22px", marginBottom:16, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-18, right:-18, width:110, height:110, borderRadius:"50%", background:"rgba(255,255,255,0.08)" }}/>
        <div style={{ fontSize:11, color:"rgba(255,255,255,0.7)", fontWeight:600, marginBottom:5, textTransform:"uppercase", letterSpacing:0.7 }}>This Week</div>
        <div style={{ fontFamily:F, fontSize:42, fontWeight:800, color:"#fff", lineHeight:1 }}>₹3,460</div>
        <div style={{ color:"rgba(255,255,255,0.8)", fontSize:13, marginTop:7, fontWeight:600 }}>↑ +12% from last week</div>
      </div>
      <div style={{ background:T.card, borderRadius:14, border:`1px solid ${T.border}`, padding:"14px", marginBottom:14 }}>
        <div style={{ fontFamily:F, fontWeight:700, fontSize:13, marginBottom:13 }}>Daily Breakdown</div>
        <div style={{ display:"flex", alignItems:"flex-end", gap:5, height:80 }}>
          {vals.map((v,i) => (
            <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
              <div style={{ width:"100%", height:`${(v/mx)*66}px`, background: i===6?T.accent:`${T.accent}22`, borderRadius:"3px 3px 0 0" }}/>
              <span style={{ fontSize:8, color:T.textMuted, fontWeight:600, fontFamily:FB }}>{wk[i]}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:9 }}>
        {[["48","Total Rides"],["₹72","Per Ride"],["38h","Drive Time"],["94%","Completion"]].map(([v,l]) => (
          <div key={l} style={{ background:T.card, borderRadius:13, border:`1px solid ${T.border}`, padding:"14px" }}>
            <div style={{ fontFamily:F, fontWeight:800, fontSize:21, color:T.accent }}>{v}</div>
            <div style={{ fontSize:10, color:T.textMuted, marginTop:4, fontFamily:FB }}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function DriverDocs({ T, driver, docs, onDocsUpdate }) {
  const [uploading, setUploading] = useState(null)
  const DOC_TYPES = [
    { key:"license",   name:"Driving License", icon:"🪪" },
    { key:"rc",        name:"Vehicle RC",       icon:"📄" },
    { key:"insurance", name:"Insurance",        icon:"🛡️" },
    { key:"photo",     name:"Profile Photo",    icon:"📸" },
    { key:"aadhar",    name:"Aadhar Card",      icon:"🆔" },
  ]
  const getStatus = (key) => docs.find(d => d.doc_type===key)?.status || "pending"
  const simUpload = async (key) => {
    setUploading(key)
    await new Promise(r => setTimeout(r, 2000))
    if (driver?.id) await upsertDocument(driver.id, key, "uploaded")
    onDocsUpdate(prev => {
      const filtered = prev.filter(d => d.doc_type !== key)
      return [...filtered, { doc_type:key, status:"uploaded" }]
    })
    setUploading(null)
  }
  const STATUS_INFO = { verified:{ color:"#00C566", label:"Verified ✓" }, uploaded:{ color:"#3D7BFF", label:"Under Review" }, pending:{ color:"#F5B301", label:"Upload Required" } }
  const uploaded = docs.filter(d => d.status==="uploaded"||d.status==="verified").length
  return (
    <div style={{ padding:"14px 14px" }}>
      <div style={{ fontFamily:F, fontWeight:800, fontSize:21, marginBottom:6 }}>My Documents</div>
      <div style={{ color:T.textSub, fontSize:12, fontFamily:FB, marginBottom:14 }}>Keep documents updated for faster approvals</div>
      <div style={{ background:T.card, borderRadius:14, border:`1px solid ${T.border}`, padding:"14px", marginBottom:14 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
          <span style={{ fontFamily:F, fontWeight:700, fontSize:13 }}>Verification Progress</span>
          <span style={{ fontFamily:F, fontWeight:800, fontSize:14, color:T.green }}>{Math.round((uploaded/5)*100)}%</span>
        </div>
        <div style={{ height:6, background:T.border, borderRadius:3 }}>
          <div style={{ width:`${(uploaded/5)*100}%`, height:"100%", background:`linear-gradient(90deg,${T.green},#00F080)`, borderRadius:3, transition:"width 0.5s" }}/>
        </div>
        <div style={{ fontSize:11, color:T.textMuted, fontFamily:FB, marginTop:6 }}>{uploaded} of 5 documents submitted</div>
      </div>
      {DOC_TYPES.map(doc => {
        const status = getStatus(doc.key)
        const si = STATUS_INFO[status]
        const isUploading = uploading === doc.key
        return (
          <div key={doc.key} style={{ background:T.card, borderRadius:14, border:`1.5px solid ${status==="pending"?T.yellow+"50":T.border}`, padding:"14px", marginBottom:9 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:46, height:46, borderRadius:15, background:`${si.color}15`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>{doc.icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:F, fontWeight:700, fontSize:14 }}>{doc.name}</div>
              </div>
              <Pill T={T} color={si.color} sm>{si.label}</Pill>
            </div>
            {status === "pending" && (
              <div style={{ marginTop:12 }}>
                {isUploading ? (
                  <div style={{ background:T.surface, borderRadius:11, padding:"11px 14px", display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ flex:1, height:4, background:T.border, borderRadius:2, overflow:"hidden" }}>
                      <div style={{ width:"70%", height:"100%", background:T.accent, borderRadius:2 }}/>
                    </div>
                    <span style={{ fontSize:11, color:T.textSub, fontFamily:FB }}>Uploading...</span>
                  </div>
                ) : (
                  <button onClick={() => simUpload(doc.key)} style={{ width:"100%", padding:"11px", borderRadius:11, background:T.accentSoft, border:`1.5px dashed ${T.accent}`, color:T.accent, cursor:"pointer", fontFamily:F, fontWeight:700, fontSize:13, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                    <span>📤</span> Upload {doc.name}
                  </button>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ══════════════════════════════════════════════════════
   ADMIN PANEL
══════════════════════════════════════════════════════ */
function AdminPanel({ T }) {
  const [screen, setScreen] = useState("login")
  const [email, setEmail] = useState("")
  const [pwd, setPwd] = useState("")
  const [showPwd, setShowPwd] = useState(false)
  const [err, setErr] = useState("")
  const [tab, setTab] = useState("dash")
  const [stats, setStats] = useState({ totalRidesToday:142, onlineDrivers:28, revenueToday:11240, platformEarnings:1686, pendingDrivers:2, activeRides:5, completedRides:134, cancelledRides:7, newUsersToday:14, approvedDrivers:26 })
  const [driverSt, setDriverSt] = useState(Object.fromEntries(["Ramesh Kumar","Suresh Mandal","Vijay Patil","Dinesh Yadav","Pradeep Singh"].map((n,i)=>[[i+1],["approved","pending","approved","rejected","pending"][i]])))
  const [pricing, setPricing] = useState([{ vehicle_type:"car", base_fare:30, per_km_rate:10, per_min_wait:2, surge_multiplier:1, is_surge_active:false },{ vehicle_type:"auto", base_fare:20, per_km_rate:7, per_min_wait:1.5, surge_multiplier:1, is_surge_active:false },{ vehicle_type:"erick", base_fare:15, per_km_rate:4, per_min_wait:1, surge_multiplier:1, is_surge_active:false }])
  const [dbRides, setDbRides] = useState([])
  const [dbDrivers, setDbDrivers] = useState([])
  const [dbUsers, setDbUsers] = useState([])
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    const data = await adminLogin(email, pwd)
    if (data) { setScreen("panel"); setErr(""); loadData() }
    else setErr("Wrong credentials! Use demo credentials below.")
  }
  const loadData = async () => {
    setLoading(true)
    try {
      const [s, r, d, u, p] = await Promise.all([getAdminStats(), getAllRides(), getAllDrivers(), getAllUsers(), getPricing()])
      if (Object.keys(s).length) setStats(s)
      if (r.length) setDbRides(r)
      if (d.length) setDbDrivers(d)
      if (u.length) setDbUsers(u)
      if (p.length) setPricing(p)
    } catch {} finally { setLoading(false) }
  }
  const handleUpdatePricing = async (type, field, val) => {
    const updated = pricing.map(p => p.vehicle_type===type ? { ...p, [field]:val } : p)
    setPricing(updated)
    await updatePricing(type, { [field]:val })
  }

  const autoFill = () => { setEmail("admin@mycityride.com"); setPwd("Admin@123"); setErr("") }

  if (screen === "login") return (
    <div style={{ maxWidth:440, margin:"0 auto", padding:"40px 22px" }}>
      <div style={{ textAlign:"center", marginBottom:38 }}>
        <div style={{ width:62, height:62, borderRadius:20, background:T.accent, display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, margin:"0 auto 14px", boxShadow:`0 16px 36px ${T.accentGlow}` }}>⚙️</div>
        <div style={{ fontFamily:F, fontSize:26, fontWeight:800, letterSpacing:-0.5 }}>Admin Login</div>
        <div style={{ color:T.textSub, fontSize:13, marginTop:5, fontFamily:FB }}>MyCityRide Operations Center</div>
      </div>
      <div style={{ background:T.card, borderRadius:20, border:`1px solid ${T.border}`, padding:"26px 22px", marginBottom:16 }}>
        {[["Email","text",email,setEmail,"admin@mycityride.com"],["Password",showPwd?"text":"password",pwd,setPwd,"Enter password"]].map(([lbl,type,val,setter,ph],i) => (
          <div key={lbl} style={{ marginBottom:14 }}>
            <div style={{ fontSize:11, fontWeight:700, color:T.textSub, marginBottom:7, fontFamily:FB, letterSpacing:0.3, textTransform:"uppercase" }}>{lbl}</div>
            <div style={{ position:"relative" }}>
              <input type={type} value={val} onChange={e => setter(e.target.value)} onKeyDown={e => e.key==="Enter"&&handleLogin()} placeholder={ph}
                style={{ width:"100%", background:T.input, border:`1.5px solid ${T.border}`, borderRadius:13, padding:i===1?"14px 44px 14px 15px":"14px 15px", color:T.text, fontSize:15, outline:"none", fontFamily:FB, boxSizing:"border-box" }}/>
              {i===1 && <button onClick={() => setShowPwd(s=>!s)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", fontSize:17, color:T.textMuted }}>{showPwd?"🙈":"👁"}</button>}
            </div>
          </div>
        ))}
        {err && <div style={{ background:T.redSoft, border:`1px solid ${T.red}30`, borderRadius:10, padding:"10px 13px", fontSize:13, color:T.red, marginBottom:14, fontFamily:FB }}>{err}</div>}
        <button onClick={handleLogin} style={{ width:"100%", padding:"15px", borderRadius:13, border:"none", cursor:"pointer", background:T.accent, color:"#fff", fontFamily:F, fontWeight:700, fontSize:15, boxShadow:`0 12px 28px ${T.accentGlow}` }}>Sign In to Admin →</button>
      </div>
      <div style={{ background:T.card, borderRadius:16, border:`1.5px dashed ${T.border}`, padding:"16px 18px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:11 }}>
          <div style={{ fontSize:10, fontWeight:800, color:T.textMuted, letterSpacing:0.8, textTransform:"uppercase", fontFamily:FB }}>Demo Credentials</div>
          <button onClick={autoFill} style={{ padding:"5px 14px", borderRadius:8, background:T.accent, border:"none", color:"#fff", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:FB }}>⚡ Auto-fill</button>
        </div>
        {[["Email","admin@mycityride.com",T.accent],["Password","Admin@123",T.green]].map(([l,v,c]) => (
          <div key={l} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:7 }}>
            <span style={{ fontSize:13, color:T.textSub, fontFamily:FB }}>{l}</span>
            <span style={{ fontSize:12, fontWeight:700, color:c, fontFamily:F, background:`${c}15`, padding:"4px 11px", borderRadius:8 }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div style={{ maxWidth:1100, margin:"0 auto", padding:"24px 22px 48px" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24, paddingBottom:18, borderBottom:`1px solid ${T.border}` }}>
        <div>
          <div style={{ fontFamily:F, fontSize:22, fontWeight:800, letterSpacing:-0.4 }}>MyCity<span style={{ color:T.accent }}>Ride</span> <span style={{ color:T.textMuted, fontSize:13, fontWeight:500, fontFamily:FB }}>Admin</span></div>
          <div style={{ color:T.textSub, fontSize:12, marginTop:2, fontFamily:FB }}>Nagpur Ops · {new Date().toDateString()} {loading && "· Syncing..."}</div>
        </div>
        <div style={{ display:"flex", gap:9, alignItems:"center" }}>
          <button onClick={loadData} style={{ padding:"7px 14px", borderRadius:11, background:T.card, border:`1px solid ${T.border}`, color:T.textSub, cursor:"pointer", fontSize:12, fontFamily:FB }}>🔄 Refresh</button>
          <div style={{ background:T.greenSoft, border:`1px solid ${T.green}30`, borderRadius:100, padding:"5px 14px", fontSize:12, fontWeight:700, color:T.green, fontFamily:FB }}>⬤ Live</div>
          <div style={{ width:38, height:38, borderRadius:13, background:T.accentSoft, display:"flex", alignItems:"center", justifyContent:"center", fontSize:17, border:`1px solid ${T.border}` }}>👑</div>
          <button onClick={() => setScreen("login")} style={{ padding:"7px 14px", borderRadius:11, background:T.redSoft, border:`1px solid ${T.red}20`, color:T.red, cursor:"pointer", fontSize:12, fontWeight:600, fontFamily:FB }}>Sign Out</button>
        </div>
      </div>
      <div style={{ display:"flex", gap:3, background:T.surface, borderRadius:15, padding:5, border:`1px solid ${T.border}`, marginBottom:24, overflowX:"auto", scrollbarWidth:"none" }}>
        {[{id:"dash",ic:"📊",lb:"Dashboard"},{id:"drivers",ic:"🚗",lb:"Drivers"},{id:"rides",ic:"🗺️",lb:"Rides"},{id:"users",ic:"👥",lb:"Users"},{id:"pricing",ic:"💰",lb:"Pricing"}].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ display:"flex", alignItems:"center", gap:5, padding:"9px 16px", borderRadius:11, border:"none", cursor:"pointer", background: tab===t.id?T.accent:"transparent", color: tab===t.id?"#fff":T.textSub, fontFamily:FB, fontWeight:600, fontSize:13, transition:"all 0.18s", whiteSpace:"nowrap" }}>
            <span style={{ fontSize:14, filter: tab===t.id?"none":"grayscale(1)", opacity: tab===t.id?1:0.5 }}>{t.ic}</span> {t.lb}
          </button>
        ))}
      </div>
      {tab === "dash"    && <AdminDash T={T} stats={stats}/>}
      {tab === "drivers" && <AdminDriversMgmt T={T} dbDrivers={dbDrivers} driverSt={driverSt} onApprove={id=>{ setDriverSt(s=>({...s,[id]:"approved"})); updateDriverStatus(id,"approved") }} onReject={id=>{ setDriverSt(s=>({...s,[id]:"rejected"})); updateDriverStatus(id,"rejected") }}/>}
      {tab === "rides"   && <AdminRidesMgmt T={T} dbRides={dbRides}/>}
      {tab === "users"   && <AdminUsersMgmt T={T} dbUsers={dbUsers}/>}
      {tab === "pricing" && <AdminPricingMgmt T={T} pricing={pricing} onUpdate={handleUpdatePricing}/>}
    </div>
  )
}

function StatCard({ T, icon, label, value, change, positive, color }) {
  const c = color || T.accent
  return (
    <div style={{ background:T.card, borderRadius:17, border:`1px solid ${T.border}`, padding:"18px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:13 }}>
        <div style={{ width:42, height:42, borderRadius:13, background:`${c}14`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:19, border:`1px solid ${c}18` }}>{icon}</div>
        {change && <span style={{ fontSize:10.5, fontWeight:700, color: positive?T.green:T.red, background: positive?T.greenSoft:T.redSoft, padding:"3px 9px", borderRadius:100, fontFamily:FB }}>{change}</span>}
      </div>
      <div style={{ fontFamily:F, fontSize:27, fontWeight:800, color:c, letterSpacing:-0.5, lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:11, color:T.textMuted, marginTop:5, fontFamily:FB }}>{label}</div>
    </div>
  )
}

function AdminDash({ T, stats }) {
  const cards = [
    { icon:"🚗", label:"Total Rides Today",  value: stats.totalRidesToday||0, change:"+18%", positive:true,  color:T.accent },
    { icon:"🟢", label:"Online Drivers",     value: stats.onlineDrivers||0,   change:`+${stats.onlineDrivers||0}`, positive:true, color:T.green },
    { icon:"👥", label:"New Users Today",    value: stats.newUsersToday||0,   change:"+12",  positive:true,  color:T.blue },
    { icon:"💰", label:"Revenue Today",      value:`₹${stats.revenueToday||0}`, change:"+22%",positive:true, color:T.yellow },
    { icon:"❌", label:"Cancelled Rides",    value: stats.cancelledRides||0,  change:"-3",   positive:true,  color:T.red },
    { icon:"⏳", label:"Pending Drivers",    value: stats.pendingDrivers||0,  change:"",     positive:false, color:T.yellow },
  ]
  const hourly = [400,320,500,780,920,1100,980,860,640,720,880,1240], mx = Math.max(...hourly)
  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:11, marginBottom:22 }}>
        {cards.map(c => <StatCard key={c.label} T={T} {...c}/>)}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1.6fr 1fr", gap:14 }}>
        <div style={{ background:T.card, borderRadius:17, border:`1px solid ${T.border}`, padding:"18px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
            <div style={{ fontFamily:F, fontWeight:700, fontSize:15 }}>Hourly Revenue</div>
            <div style={{ background:T.accentSoft, borderRadius:9, padding:"4px 12px", fontSize:12, fontWeight:700, color:T.accent, fontFamily:FB }}>₹{stats.revenueToday||11240}</div>
          </div>
          <div style={{ display:"flex", alignItems:"flex-end", gap:5, height:90 }}>
            {hourly.map((v,i) => <div key={i} style={{ flex:1, height:`${(v/mx)*76}px`, background: i===11?T.accent:`${T.accent}18`, borderRadius:"3px 3px 0 0" }}/>)}
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:7, fontSize:10, color:T.textMuted, fontFamily:FB }}>
            <span>6AM</span><span>9AM</span><span>12PM</span><span>3PM</span><span>Now</span>
          </div>
        </div>
        <div style={{ background:T.card, borderRadius:17, border:`1px solid ${T.border}`, padding:"18px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <div style={{ fontFamily:F, fontWeight:700, fontSize:15 }}>Live Rides</div>
            <Pill T={T} color={T.green} sm>● {stats.activeRides||0} Active</Pill>
          </div>
          {[{id:"MC-001",user:"Priya S.",driver:"Ramesh K.",from:"Sitabuldi",to:"Airport",fare:245},{id:"MC-002",user:"Amit T.",driver:"Vijay P.",from:"Dharampeth",to:"Civil Lines",fare:78}].map(r => (
            <div key={r.id} style={{ background:T.surface, borderRadius:11, padding:"11px 12px", marginBottom:7, border:`1px solid ${T.border}` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div>
                  <div style={{ fontWeight:600, fontSize:12, fontFamily:FB }}>🚗 {r.from}→{r.to}</div>
                  <div style={{ color:T.textMuted, fontSize:10, marginTop:2, fontFamily:FB }}>{r.user} · {r.driver}</div>
                </div>
                <span style={{ fontFamily:F, fontWeight:800, color:T.accent, fontSize:13 }}>₹{r.fare}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const MOCK_DRIVERS = [
  { id:1, name:"Ramesh Kumar",  vehicle_name:"Maruti Swift",    plate_number:"MH31-AB-1234", vehicle_type:"car",   rating:4.8, total_rides:342, total_earnings:24600, phone:"98765-00001", created_at:"2024-01-15", avatar:"RK", docsOk:true },
  { id:2, name:"Suresh Mandal", vehicle_name:"Bajaj RE Auto",   plate_number:"MH31-CD-5678", vehicle_type:"auto",  rating:4.5, total_rides:210, total_earnings:15300, phone:"97654-00002", created_at:"2024-03-10", avatar:"SM", docsOk:false },
  { id:3, name:"Vijay Patil",   vehicle_name:"Hero E-Rickshaw", plate_number:"MH31-EF-9012", vehicle_type:"erick", rating:4.7, total_rides:156, total_earnings:11200, phone:"96543-00003", created_at:"2024-02-20", avatar:"VP", docsOk:true },
  { id:4, name:"Dinesh Yadav",  vehicle_name:"Maruti Dzire",    plate_number:"MH31-GH-3456", vehicle_type:"car",   rating:3.9, total_rides:89,  total_earnings:6800,  phone:"95432-00004", created_at:"2024-03-25", avatar:"DY", docsOk:false },
  { id:5, name:"Pradeep Singh", vehicle_name:"Bajaj RE Auto",   plate_number:"MH31-IJ-7890", vehicle_type:"auto",  rating:4.6, total_rides:198, total_earnings:14700, phone:"94321-00005", created_at:"2024-04-01", avatar:"PS", docsOk:false },
]

function AdminDriversMgmt({ T, dbDrivers, driverSt, onApprove, onReject }) {
  const [filter, setFilter] = useState("All")
  const drivers = dbDrivers.length ? dbDrivers : MOCK_DRIVERS
  const statuses = dbDrivers.length ? Object.fromEntries(drivers.map(d=>[d.id, d.status])) : driverSt
  const filtered = filter==="All" ? drivers : drivers.filter(d => (statuses[d.id]||d.status)===filter.toLowerCase())
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div style={{ fontFamily:F, fontWeight:700, fontSize:17 }}>Driver Management</div>
        <div style={{ display:"flex", gap:5 }}>
          {["All","Pending","Approved","Rejected"].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding:"6px 16px", borderRadius:100, background: filter===f?T.accent:T.card, border:`1px solid ${filter===f?T.accent:T.border}`, color: filter===f?"#fff":T.textSub, fontSize:12, cursor:"pointer", fontWeight:600, fontFamily:FB }}>
              {f}{f==="Pending"?` (${drivers.filter(d=>(statuses[d.id]||d.status)==="pending").length})` :""}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display:"grid", gap:9 }}>
        {filtered.map(d => {
          const st = driverSt[d.id] || d.status || "pending"
          return (
            <div key={d.id} style={{ background:T.card, borderRadius:15, border:`1px solid ${st==="pending"?T.yellow+"40":T.border}`, padding:"16px 18px", display:"flex", alignItems:"center", gap:15 }}>
              <div style={{ width:50, height:50, borderRadius:16, background:T.accentSoft, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:F, fontWeight:800, fontSize:16, color:T.accent, flexShrink:0 }}>{d.avatar||d.name?.slice(0,2)}</div>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:3 }}>
                  <span style={{ fontFamily:F, fontWeight:700, fontSize:15 }}>{d.name}</span>
                  <Pill T={T} color={st==="approved"?T.green:st==="rejected"?T.red:T.yellow} sm>{st}</Pill>
                  {d.docsOk && <Pill T={T} color={T.blue} sm>Docs ✓</Pill>}
                </div>
                <div style={{ color:T.textSub, fontSize:12, fontFamily:FB }}>{d.vehicle_name} · {d.plate_number} · ⭐{d.rating} · {d.total_rides} rides</div>
                <div style={{ color:T.textMuted, fontSize:11, fontFamily:FB, marginTop:2 }}>📞 +91 {d.phone} · ₹{d.total_earnings} earned</div>
              </div>
              <div style={{ display:"flex", gap:7, flexShrink:0 }}>
                {st==="pending" && <><button onClick={() => onApprove(d.id)} style={{ padding:"8px 16px", background:T.greenSoft, border:`1px solid ${T.green}40`, borderRadius:11, color:T.green, cursor:"pointer", fontWeight:700, fontSize:12, fontFamily:FB }}>✓ Approve</button><button onClick={() => onReject(d.id)} style={{ padding:"8px 12px", background:T.redSoft, border:`1px solid ${T.red}30`, borderRadius:11, color:T.red, cursor:"pointer", fontWeight:700, fontSize:13 }}>✕</button></>}
                {st==="approved" && <button onClick={() => onReject(d.id)} style={{ padding:"7px 14px", background:T.redSoft, border:`1px solid ${T.red}20`, borderRadius:11, color:T.red, cursor:"pointer", fontSize:12, fontFamily:FB, fontWeight:600 }}>Block</button>}
                {st==="rejected" && <button onClick={() => onApprove(d.id)} style={{ padding:"7px 14px", background:T.greenSoft, border:`1px solid ${T.green}30`, borderRadius:11, color:T.green, cursor:"pointer", fontSize:12, fontFamily:FB, fontWeight:600 }}>Restore</button>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const MOCK_RIDES = [
  { id:"MC-001", users:{name:"Priya S."},   drivers:{name:"Ramesh K."},  pickup_address:"Sitabuldi",  drop_address:"Airport",    fare:245, status:"completed", created_at:"2024-03-23T09:30:00", vehicle_type:"car" },
  { id:"MC-002", users:{name:"Amit T."},    drivers:{name:"Vijay P."},   pickup_address:"Dharampeth", drop_address:"Civil Lines",fare:78,  status:"riding",    created_at:"2024-03-23T10:15:00", vehicle_type:"erick" },
  { id:"MC-003", users:{name:"Neha M."},    drivers:{name:"Suresh M."},  pickup_address:"Wardha Rd",  drop_address:"Ramdaspeth", fare:61,  status:"completed", created_at:"2024-03-23T08:45:00", vehicle_type:"auto" },
  { id:"MC-004", users:{name:"Ravi K."},    drivers:null,                pickup_address:"Sadar",      drop_address:"Itwari",     fare:40,  status:"cancelled", created_at:"2024-03-23T07:30:00", vehicle_type:"auto" },
  { id:"MC-005", users:{name:"Sneha D."},   drivers:{name:"Ramesh K."},  pickup_address:"Airport",    drop_address:"Civil Lines",fare:310, status:"riding",    created_at:"2024-03-23T10:50:00", vehicle_type:"car" },
  { id:"MC-006", users:{name:"Kiran B."},   drivers:{name:"Vijay P."},   pickup_address:"AIIMS",      drop_address:"Sadar",      fare:95,  status:"completed", created_at:"2024-03-23T09:10:00", vehicle_type:"erick" },
]

function AdminRidesMgmt({ T, dbRides }) {
  const [filter, setFilter] = useState("All")
  const rides = dbRides.length ? dbRides : MOCK_RIDES
  const filtered = filter==="All" ? rides : rides.filter(r => r.status===filter.toLowerCase())
  const statusColor = { completed:T.blue, riding:T.green, searching:T.yellow, accepted:T.yellow, cancelled:T.red }
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div style={{ fontFamily:F, fontWeight:700, fontSize:17 }}>Ride Monitoring</div>
        <div style={{ display:"flex", gap:5 }}>
          {["All","Riding","Completed","Cancelled"].map(s => <button key={s} onClick={() => setFilter(s)} style={{ padding:"5px 14px", borderRadius:100, background: filter===s?T.accent:T.card, border:`1px solid ${filter===s?T.accent:T.border}`, color: filter===s?"#fff":T.textSub, fontSize:11, cursor:"pointer", fontWeight:600, fontFamily:FB }}>{s}</button>)}
        </div>
      </div>
      <div style={{ background:T.card, borderRadius:17, border:`1px solid ${T.border}`, overflow:"hidden" }}>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", minWidth:700 }}>
            <thead><tr style={{ background:T.surface }}>
              {["ID","User","Driver","Route","Fare","Time","Status",""].map(h => <th key={h} style={{ padding:"12px 15px", textAlign:"left", fontSize:10.5, color:T.textMuted, fontWeight:700, textTransform:"uppercase", letterSpacing:0.5, fontFamily:FB, whiteSpace:"nowrap" }}>{h}</th>)}
            </tr></thead>
            <tbody>{filtered.map((r,i) => (
              <tr key={r.id} style={{ borderTop:`1px solid ${T.border}20`, background: i%2===0?"transparent":T.surface+"50" }}>
                <td style={{ padding:"13px 15px", fontSize:11, color:T.accent, fontWeight:700, fontFamily:F }}>{String(r.id).slice(0,8)}</td>
                <td style={{ padding:"13px 15px", fontSize:13, fontWeight:600, fontFamily:FB }}>{r.users?.name||"—"}</td>
                <td style={{ padding:"13px 15px", fontSize:12, color:T.textSub, fontFamily:FB }}>{r.drivers?.name||"—"}</td>
                <td style={{ padding:"13px 15px", fontSize:12, color:T.textSub, fontFamily:FB }}>{r.pickup_address}→{r.drop_address}</td>
                <td style={{ padding:"13px 15px", fontSize:14, fontWeight:700, fontFamily:F }}>₹{r.fare}</td>
                <td style={{ padding:"13px 15px", fontSize:11, color:T.textMuted, fontFamily:FB }}>{new Date(r.created_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</td>
                <td style={{ padding:"13px 15px" }}><Pill T={T} color={statusColor[r.status]||T.textMuted} sm>{r.status}</Pill></td>
                <td style={{ padding:"13px 15px" }}><button style={{ padding:"5px 13px", background:T.surface, border:`1px solid ${T.border}`, borderRadius:9, color:T.textSub, cursor:"pointer", fontSize:11, fontFamily:FB }}>View</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

const MOCK_USERS = [
  { id:1, name:"Priya Sharma", phone:"98765-00001", total_rides:12, wallet_balance:200, created_at:"2024-01-15", is_blocked:false, rating:4.9 },
  { id:2, name:"Amit Tiwari",  phone:"97654-00002", total_rides:6,  wallet_balance:0,   created_at:"2024-02-10", is_blocked:false, rating:4.7 },
  { id:3, name:"Neha Mishra",  phone:"96543-00003", total_rides:3,  wallet_balance:50,  created_at:"2024-03-05", is_blocked:false, rating:4.8 },
  { id:4, name:"Ravi Kumar",   phone:"95432-00004", total_rides:1,  wallet_balance:0,   created_at:"2024-03-20", is_blocked:true,  rating:2.1 },
]

function AdminUsersMgmt({ T, dbUsers }) {
  const users = dbUsers.length ? dbUsers : MOCK_USERS
  const [blocked, setBlocked] = useState(Object.fromEntries(users.map(u => [u.id, u.is_blocked])))
  return (
    <div>
      <div style={{ fontFamily:F, fontWeight:700, fontSize:17, marginBottom:16 }}>User Management</div>
      <div style={{ display:"grid", gap:9 }}>
        {users.map((u,i) => (
          <div key={i} style={{ background:T.card, borderRadius:15, border:`1px solid ${T.border}`, padding:"16px 18px", display:"flex", alignItems:"center", gap:15 }}>
            <div style={{ width:48, height:48, borderRadius:16, background:T.blueSoft, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:F, fontWeight:800, fontSize:15, color:T.blue, flexShrink:0 }}>{u.name?.slice(0,2)}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:F, fontWeight:700, fontSize:14, marginBottom:3 }}>{u.name}</div>
              <div style={{ color:T.textSub, fontSize:12, fontFamily:FB }}>📞 +91 {u.phone} · {u.total_rides} rides · Wallet: ₹{u.wallet_balance||0}</div>
              <div style={{ color:T.textMuted, fontSize:11, fontFamily:FB, marginTop:2 }}>Joined {new Date(u.created_at).toLocaleDateString()} · ⭐ {u.rating||"—"}</div>
            </div>
            <div style={{ display:"flex", gap:9, alignItems:"center" }}>
              <Pill T={T} color={blocked[u.id]?T.red:T.green} sm>{blocked[u.id]?"blocked":"active"}</Pill>
              <button onClick={() => setBlocked(b => ({ ...b, [u.id]:!b[u.id] }))} style={{ padding:"7px 14px", background: blocked[u.id]?T.greenSoft:T.redSoft, border:`1px solid ${blocked[u.id]?T.green+"30":T.red+"20"}`, borderRadius:11, color: blocked[u.id]?T.green:T.red, cursor:"pointer", fontSize:12, fontWeight:600, fontFamily:FB }}>
                {blocked[u.id] ? "Unblock" : "Block"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function AdminPricingMgmt({ T, pricing, onUpdate }) {
  const [localSurge, setLocalSurge] = useState(Object.fromEntries(pricing.map(p => [p.vehicle_type, p.surge_multiplier])))
  const TYPES = { car:"🚗 Sedan", auto:"🛺 Auto", erick:"⚡ E-Ride" }
  const Slider = ({ label, value, min, max, step, onChange, color, unit }) => {
    const c = color || T.accent, pct = ((value-min)/(max-min))*100
    const fmt = v => unit==="₹" ? `₹${v}` : unit==="x" ? `${parseFloat(v).toFixed(1)}×` : `${v}${unit}`
    return (
      <div style={{ background:T.card, borderRadius:16, border:`1px solid ${T.border}`, padding:"18px" }}>
        <div style={{ fontSize:10, color:T.textMuted, fontWeight:700, letterSpacing:0.6, textTransform:"uppercase", marginBottom:8, fontFamily:FB }}>{label}</div>
        <div style={{ fontFamily:F, fontSize:34, fontWeight:800, color:c, lineHeight:1, marginBottom:12 }}>{fmt(value)}</div>
        <div style={{ position:"relative", height:5, background:T.border, borderRadius:3 }}>
          <div style={{ position:"absolute", left:0, top:0, height:"100%", width:`${pct}%`, background:c, borderRadius:3 }}/>
          <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))}
            style={{ position:"absolute", inset:0, opacity:0, cursor:"pointer", width:"100%", height:"100%" }}/>
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", marginTop:5, fontSize:10, color:T.textMuted, fontFamily:FB }}><span>{fmt(min)}</span><span>{fmt(max)}</span></div>
      </div>
    )
  }
  return (
    <div>
      <div style={{ fontFamily:F, fontWeight:700, fontSize:17, marginBottom:18 }}>Pricing Control</div>
      {pricing.map(p => (
        <div key={p.vehicle_type} style={{ marginBottom:24 }}>
          <div style={{ fontFamily:F, fontWeight:700, fontSize:15, marginBottom:12 }}>{TYPES[p.vehicle_type]}</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:12, marginBottom:12 }}>
            <Slider label="Base Fare" value={p.base_fare} min={10} max={100} step={5} color={T.accent} unit="₹" onChange={v => onUpdate(p.vehicle_type,"base_fare",v)}/>
            <Slider label="Per KM" value={p.per_km_rate} min={3} max={25} step={1} color={T.blue} unit="₹" onChange={v => onUpdate(p.vehicle_type,"per_km_rate",v)}/>
            <Slider label="Surge" value={localSurge[p.vehicle_type]||1} min={1} max={3} step={0.1} color={T.yellow} unit="x" onChange={v => { setLocalSurge(s=>({...s,[p.vehicle_type]:v})); onUpdate(p.vehicle_type,"surge_multiplier",v) }}/>
            <Slider label="Wait/min" value={p.per_min_wait} min={0.5} max={5} step={0.5} color={T.green} unit="₹" onChange={v => onUpdate(p.vehicle_type,"per_min_wait",v)}/>
          </div>
        </div>
      ))}
      <div style={{ background:T.card, borderRadius:17, border:`1px solid ${T.border}`, overflow:"hidden" }}>
        <div style={{ padding:"14px 18px", borderBottom:`1px solid ${T.border}`, fontFamily:F, fontWeight:700, fontSize:14 }}>Live Fare Preview (5km trip)</div>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr style={{ background:T.surface }}>
              {["Vehicle","Base","Per KM","Min Fare","5KM Fare","With Surge"].map(h => <th key={h} style={{ padding:"10px 15px", textAlign:"left", fontSize:10.5, color:T.textMuted, fontWeight:700, textTransform:"uppercase", letterSpacing:0.4, fontFamily:FB }}>{h}</th>)}
            </tr></thead>
            <tbody>{pricing.map(p => {
              const sg = localSurge[p.vehicle_type]||1
              const trip5 = Number(p.base_fare)+5*Number(p.per_km_rate)
              return <tr key={p.vehicle_type} style={{ borderTop:`1px solid ${T.border}20` }}>
                <td style={{ padding:"13px 15px", fontWeight:700, fontSize:13, fontFamily:FB }}>{TYPES[p.vehicle_type]}</td>
                <td style={{ padding:"13px 15px", color:T.accent, fontWeight:700, fontFamily:F }}>₹{p.base_fare}</td>
                <td style={{ padding:"13px 15px", fontFamily:FB, fontSize:12 }}>₹{p.per_km_rate}/km</td>
                <td style={{ padding:"13px 15px", color:T.green, fontWeight:600, fontFamily:F }}>₹{Number(p.base_fare)+Number(p.per_km_rate)}</td>
                <td style={{ padding:"13px 15px", fontFamily:F, fontWeight:700 }}>₹{trip5}</td>
                <td style={{ padding:"13px 15px", color: sg>1?T.yellow:T.textSub, fontWeight: sg>1?800:400, fontFamily:F, fontSize: sg>1?14:13 }}>₹{Math.round(trip5*sg)}</td>
              </tr>
            })}</tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════
   ROOT
══════════════════════════════════════════════════════ */
export default function App() {
  const [isDark, setIsDark] = useState(true)
  const [role, setRole] = useState("user")
  const T = isDark ? DARK : LIGHT
  return (
    <div style={{ background:T.bg, minHeight:"100vh", color:T.text, transition:"background 0.3s,color 0.3s" }}>
      <style>{`
        ${GFONTS}
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{display:none}
        *{-webkit-font-smoothing:antialiased}
        input{font-family:'Instrument Sans',sans-serif}
        @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
      `}</style>

      {/* Top bar */}
      <div style={{ padding:"14px 22px", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:`1px solid ${T.border}`, background:T.surface, position:"sticky", top:0, zIndex:200 }}>
        <div style={{ fontFamily:F, fontWeight:800, fontSize:19, letterSpacing:-0.4 }}>
          MyCity<span style={{ color:T.accent }}>Ride</span>
          <span style={{ fontSize:11, color:T.textMuted, marginLeft:7, fontWeight:400, fontFamily:FB }}>Full Demo</span>
        </div>
        <div style={{ display:"flex", background:T.bg, borderRadius:13, padding:4, border:`1px solid ${T.border}`, gap:2 }}>
          {[{id:"user",ic:"👤",lb:"User"},{id:"driver",ic:"🚗",lb:"Driver"},{id:"admin",ic:"⚙️",lb:"Admin"}].map(r => (
            <button key={r.id} onClick={() => setRole(r.id)} style={{ padding:"7px 16px", borderRadius:10, border:"none", cursor:"pointer", background: role===r.id?T.accent:"transparent", color: role===r.id?"#fff":T.textSub, fontFamily:FB, fontWeight:600, fontSize:13, transition:"all 0.18s", display:"flex", alignItems:"center", gap:5 }}>
              <span style={{ fontSize:13 }}>{r.ic}</span>{r.lb}
            </button>
          ))}
        </div>
        <button onClick={() => setIsDark(d => !d)} style={{ display:"flex", alignItems:"center", gap:7, background:T.card, border:`1px solid ${T.border}`, borderRadius:100, padding:"8px 16px", cursor:"pointer", fontFamily:FB, fontWeight:600, fontSize:13, color:T.textSub }}>
          <span style={{ fontSize:15 }}>{isDark ? "☀️" : "🌙"}</span>{isDark ? "Light" : "Dark"}
        </button>
      </div>

      <div style={{ padding:"28px 22px" }}>
        {role === "user"   && <div style={{ display:"flex", justifyContent:"center" }}><UserApp T={T} isDark={isDark}/></div>}
        {role === "driver" && <div style={{ display:"flex", justifyContent:"center" }}><DriverApp T={T} isDark={isDark}/></div>}
        {role === "admin"  && <AdminPanel T={T}/>}
      </div>
    </div>
  )
}
