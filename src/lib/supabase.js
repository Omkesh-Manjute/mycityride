import { createClient } from '@supabase/supabase-js'
const SB_URL = import.meta.env.VITE_SUPABASE_URL || 'https://fjneibnprukxiepuogrd.supabase.co'
const SB_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
export const supabase = createClient(SB_URL, SB_KEY)

// AUTH
export const getOrCreateUser = async (phone) => {
  let { data } = await supabase.from('users').select('*').eq('phone', phone).maybeSingle()
  if (!data) { const r = await supabase.from('users').insert({ phone }).select().single(); data = r.data }
  return data
}
export const getDriverByPhone = async (phone) => {
  const { data } = await supabase.from('drivers').select('*').eq('phone', phone).maybeSingle()
  return data
}
export const adminLogin = async (email, pwd) => {
  const { data } = await supabase.from('admins').select('*')
    .eq('email', email.trim().toLowerCase()).eq('password', pwd.trim()).maybeSingle()
  return data
}

// PRICING
export const getPricing = async () => { const { data } = await supabase.from('pricing').select('*'); return data || [] }
export const updatePricing = async (type, updates) => supabase.from('pricing').update({ ...updates, updated_at: new Date() }).eq('vehicle_type', type)

// RIDES
export const bookRide = async (payload) => {
  const { data, error } = await supabase.from('rides').insert(payload).select().single()
  if (error) throw error; return data
}
export const updateRideStatus = async (id, status, extra = {}) => {
  const ts = { accepted: 'accepted_at', riding: 'started_at', completed: 'completed_at' }
  if (ts[status]) extra[ts[status]] = new Date().toISOString()
  const { data } = await supabase.from('rides').update({ status, ...extra }).eq('id', id).select().single()
  return data
}
export const getUserRides = async (userId) => {
  const { data } = await supabase.from('rides')
    .select('*, drivers(name,vehicle_name,plate_number,rating)')
    .eq('user_id', userId).order('created_at', { ascending: false })
  return data || []
}
export const getDriverActiveRide = async (driverId) => {
  const { data } = await supabase.from('rides').select('*, users(name,phone)')
    .eq('driver_id', driverId).in('status', ['accepted','arriving','riding']).maybeSingle()
  return data
}
export const assignDriver = async (rideId, driverId) =>
  supabase.from('rides').update({ driver_id: driverId, status: 'accepted', accepted_at: new Date().toISOString() }).eq('id', rideId)
export const rateRide = async (rideId, rating, by = 'user') =>
  supabase.from('rides').update({ [by === 'user' ? 'user_rating' : 'driver_rating']: rating }).eq('id', rideId)

// DRIVER LOCATION
export const updateDriverLocation = async (driverId, lat, lng, heading = 0) =>
  supabase.from('driver_locations').upsert({ driver_id: driverId, lat, lng, heading, is_online: true, updated_at: new Date().toISOString() }, { onConflict: 'driver_id' })
export const setDriverOnline  = async (id) => supabase.from('drivers').update({ is_online: true  }).eq('id', id)
export const setDriverOffline = async (id) => { await supabase.from('drivers').update({ is_online: false }).eq('id', id); await supabase.from('driver_locations').update({ is_online: false }).eq('driver_id', id) }
export const getNearbyDrivers = async (lat, lng, r = 5) => { const { data } = await supabase.rpc('get_nearby_drivers', { p_lat: lat, p_lng: lng, p_radius: r }); return data || [] }

// CHAT
export const sendMessage = async (rideId, sender, message) => { const { data } = await supabase.from('chat_messages').insert({ ride_id: rideId, sender, message }).select().single(); return data }
export const getChatMessages = async (rideId) => { const { data } = await supabase.from('chat_messages').select('*').eq('ride_id', rideId).order('sent_at'); return data || [] }

// PROMO
export const validatePromo = async (code, fare = 0) => {
  const { data } = await supabase.from('promo_codes').select('*').eq('code', code.toUpperCase().trim()).eq('is_active', true).maybeSingle()
  if (!data) return { valid: false, message: 'Invalid promo code' }
  if (data.expires_at && new Date(data.expires_at) < new Date()) return { valid: false, message: 'Code expired' }
  if (fare < data.min_fare) return { valid: false, message: `Min fare ₹${data.min_fare}` }
  const discount = data.discount_type === 'percent' ? Math.min(Math.round(fare * data.discount_value / 100), data.max_discount) : data.discount_value
  return { valid: true, discount, promoData: data }
}

// SOS
export const triggerSOS = async (payload) => supabase.from('sos_alerts').insert({ ...payload, status: 'active' })

// SCHEDULE
export const scheduleRide = async (userId, payload) => { const { data } = await supabase.from('scheduled_rides').insert({ user_id: userId, ...payload }).select().single(); return data }

// DOCS
export const getDriverDocuments = async (driverId) => { const { data } = await supabase.from('driver_documents').select('*').eq('driver_id', driverId); return data || [] }
export const upsertDocument = async (driverId, docType, status = 'uploaded') =>
  supabase.from('driver_documents').upsert({ driver_id: driverId, doc_type: docType, status, uploaded_at: new Date().toISOString() }, { onConflict: 'driver_id,doc_type' })

// ADMIN
export const getAllRides    = async () => { const { data } = await supabase.from('rides').select('*, users(name,phone), drivers(name,vehicle_name)').order('created_at', { ascending: false }).limit(100); return data || [] }
export const getAllDrivers  = async () => { const { data } = await supabase.from('drivers').select('*, driver_documents(doc_type,status), driver_locations(lat,lng,is_online)').order('created_at', { ascending: false }); return data || [] }
export const getAllUsers    = async () => { const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false }); return data || [] }
export const updateDriverStatus = async (id, status) => supabase.from('drivers').update({ status }).eq('id', id)
export const getAdminStats = async () => {
  const today = new Date(); today.setHours(0,0,0,0)
  const [a, b, c, d] = await Promise.all([
    supabase.from('rides').select('id,status,fare').gte('created_at', today.toISOString()),
    supabase.from('drivers').select('id,status,is_online'),
    supabase.from('users').select('id').gte('created_at', today.toISOString()),
    supabase.from('payments').select('amount,platform_commission').eq('status','completed').gte('created_at', today.toISOString()),
  ])
  const rides = a.data||[], drivers = b.data||[], rev = d.data||[]
  return {
    totalRidesToday: rides.length, completedRides: rides.filter(r=>r.status==='completed').length,
    cancelledRides: rides.filter(r=>r.status==='cancelled').length, activeRides: rides.filter(r=>['riding','accepted','arriving'].includes(r.status)).length,
    onlineDrivers: drivers.filter(d=>d.is_online).length, approvedDrivers: drivers.filter(d=>d.status==='approved').length,
    pendingDrivers: drivers.filter(d=>d.status==='pending').length, newUsersToday: (c.data||[]).length,
    revenueToday: rev.reduce((s,p)=>s+Number(p.amount||0),0), platformEarnings: rev.reduce((s,p)=>s+Number(p.platform_commission||0),0),
  }
}
