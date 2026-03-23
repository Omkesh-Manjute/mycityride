// Supabase Realtime — replaces Socket.io + Railway (100% FREE)
import { supabase } from './supabase.js'

export const subDriverLocation = (driverId, cb) => {
  const ch = supabase.channel(`dl:${driverId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'driver_locations', filter: `driver_id=eq.${driverId}` }, p => cb(p.new))
    .subscribe()
  return () => supabase.removeChannel(ch)
}
export const subRideStatus = (rideId, cb) => {
  const ch = supabase.channel(`rs:${rideId}`)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rides', filter: `id=eq.${rideId}` }, p => cb(p.new))
    .subscribe()
  return () => supabase.removeChannel(ch)
}
export const subNewRides = (vehicleType, cb) => {
  const ch = supabase.channel(`nr:${vehicleType}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'rides', filter: `vehicle_type=eq.${vehicleType}` }, p => cb(p.new))
    .subscribe()
  return () => supabase.removeChannel(ch)
}
export const subChat = (rideId, cb) => {
  const ch = supabase.channel(`chat:${rideId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `ride_id=eq.${rideId}` }, p => cb(p.new))
    .subscribe()
  return () => supabase.removeChannel(ch)
}
export const subAdminRides = (cb) => {
  const ch = supabase.channel('admin-rides')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'rides' }, p => cb(p))
    .subscribe()
  return () => supabase.removeChannel(ch)
}
