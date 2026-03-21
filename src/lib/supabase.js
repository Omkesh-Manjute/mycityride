import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  || 'https://fjneibnprukxiepuogrd.supabase.co'
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseKey)

/* ── Auth helpers ─────────────────────────────── */
export async function getUserByPhone(phone) {
  const { data } = await supabase.from('users').select('*').eq('phone', phone).single()
  return data
}
export async function createUser(phone, name) {
  const { data } = await supabase.from('users').insert({ phone, name }).select().single()
  return data
}
export async function getDriverByPhone(phone) {
  const { data } = await supabase.from('drivers').select('*').eq('phone', phone).single()
  return data
}

/* ── Rides ────────────────────────────────────── */
export async function bookRide(payload) {
  const { data, error } = await supabase.from('rides').insert(payload).select().single()
  if (error) throw error
  return data
}
export async function updateRideStatus(rideId, status, extra = {}) {
  const { data } = await supabase.from('rides').update({ status, ...extra }).eq('id', rideId).select().single()
  return data
}
export async function getUserRides(userId) {
  const { data } = await supabase.from('rides').select('*').eq('user_id', userId).order('created_at', { ascending: false })
  return data || []
}

/* ── Driver location ──────────────────────────── */
export async function updateDriverLocation(driverId, lat, lng, heading = 0) {
  await supabase.from('driver_locations').upsert({ driver_id: driverId, lat, lng, heading, updated_at: new Date() })
}
export async function getNearbyDrivers(lat, lng, radius = 5) {
  const { data } = await supabase.rpc('get_nearby_drivers', { p_lat: lat, p_lng: lng, p_radius: radius })
  return data || []
}

/* ── Realtime subscriptions ───────────────────── */
export function subscribeToRide(rideId, callback) {
  return supabase.channel(`ride:${rideId}`)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rides', filter: `id=eq.${rideId}` }, callback)
    .subscribe()
}
export function subscribeToDriverLocation(driverId, callback) {
  return supabase.channel(`driver:${driverId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'driver_locations', filter: `driver_id=eq.${driverId}` }, callback)
    .subscribe()
}
export function subscribeToChat(rideId, callback) {
  return supabase.channel(`chat:${rideId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `ride_id=eq.${rideId}` }, callback)
    .subscribe()
}

/* ── Chat ─────────────────────────────────────── */
export async function sendMessage(rideId, sender, message) {
  await supabase.from('chat_messages').insert({ ride_id: rideId, sender, message })
}
export async function getChatMessages(rideId) {
  const { data } = await supabase.from('chat_messages').select('*').eq('ride_id', rideId).order('sent_at')
  return data || []
}

/* ── Pricing ──────────────────────────────────── */
export async function getPricing() {
  const { data } = await supabase.from('pricing').select('*')
  return data || []
}
export async function validatePromo(code) {
  const { data } = await supabase.from('promo_codes').select('*').eq('code', code.toUpperCase()).eq('is_active', true).single()
  return data
}

/* ── Admin ────────────────────────────────────── */
export async function adminLogin(email, password) {
  const { data } = await supabase.from('admins').select('*').eq('email', email.trim().toLowerCase()).eq('password', password.trim()).single()
  return data
}
export async function getAllRides() {
  const { data } = await supabase.from('rides').select('*, users(name,phone), drivers(name,phone,vehicle_name)').order('created_at', { ascending: false }).limit(50)
  return data || []
}
export async function getAllDrivers() {
  const { data } = await supabase.from('drivers').select('*, driver_documents(doc_type,status)').order('created_at', { ascending: false })
  return data || []
}
export async function updateDriverStatus(driverId, status) {
  await supabase.from('drivers').update({ status }).eq('id', driverId)
}
export async function getRevenueStats() {
  const { data } = await supabase.from('payments').select('amount, platform_commission, driver_payout, status, created_at').order('created_at', { ascending: false })
  return data || []
}

/* ── SOS ──────────────────────────────────────── */
export async function triggerSOS(payload) {
  await supabase.from('sos_alerts').insert(payload)
}
