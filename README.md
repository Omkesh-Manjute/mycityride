# 🚕 MyCityRide

> Local rides, better prices — Nagpur's own ride booking app

**Founder:** Omkesh Thakur  
**Organization:** My City Ride  
**Stack:** React + Vite + Supabase + Socket.io

## Features
- 👤 User App — OTP login, book rides, GPS tracking, chat, SOS
- 🚗 Driver App — Accept rides, earnings, document upload  
- ⚙️ Admin Panel — Dashboard, driver approval, pricing control

## Demo Login
| Role | Credential |
|------|-----------|
| User | Any 10-digit phone + any 4-digit OTP |
| Driver | Phone: 9876500002 + any 4-digit OTP |
| Admin | admin@mycityride.com / Admin@123 |

## Setup
```bash
npm install
cp .env.example .env   # fill in your keys
npm run dev
```

## Environment Variables
```
VITE_SUPABASE_URL=https://fjneibnprukxiepuogrd.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_GOOGLE_MAPS_KEY=your_maps_key
VITE_RAZORPAY_KEY_ID=your_razorpay_key
```
