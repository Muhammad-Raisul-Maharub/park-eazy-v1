# Park-Eazy 🚗

A modern, full-stack parking reservation application built with React, TypeScript, and Supabase.

## ✨ Features

### For Users
- 🗺️ **Interactive Map** - Browse available parking spots with real-time markers
- 📍 **Smart Search** - Find parking by location with autocomplete
- 🎯 **Instant Booking** - Reserve parking slots in seconds
- 💳 **Payment Management** - Save and manage payment methods securely
- ⏱️ **Active Reservations** - Track and extend your current bookings
- 📱 **Responsive Design** - Works on mobile, tablet, and desktop

### For Admins
- 🏢 **Parking Management** - Add, edit, and delete parking lots
- 📊 **Analytics Dashboard** - View booking statistics and revenue
- 👥 **Reservation Management** - Monitor all active reservations
- 🗺️ **Map Integration** - Place parking slots visually on the map

### For Super Admins
- 👤 **User Management** - Manage user accounts and roles
- 🔐 **Admin Control** - Assign admin privileges
- 📜 **System Logs** - Audit trail of all actions
- 💰 **Currency Manager** - Configure pricing and fees

## 🛠️ Tech Stack

- **Frontend**: React 18.3, TypeScript 5.4, Tailwind CSS 3.4
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **Maps**: Leaflet 1.9 with React-Leaflet 4.2
- **Icons**: Lucide React
- **Build**: Vite 5.2
- **Routing**: React Router DOM 6.23

## 📋 Prerequisites

- Node.js 18+ (recommended: v20)
- npm or yarn
- Supabase account (free tier works)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd park-eazy-v1
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env.local` file in the project root:
```bash
cp .env.example .env.local
```

Then edit `.env.local` and add your Supabase credentials:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Get your credentials from:** [Supabase Dashboard](https://app.supabase.com/project/_/settings/api)

### 4. Set Up Database

Run the following SQL scripts in your Supabase SQL Editor (in order):

1. **Create Tables** - Copy and run the schema creation script
2. **Set Up RLS Policies** - Run `optimize_rls_performance.sql`  
3. **Secure Functions** - Run `fix_function_security.sql`
4. **(Optional) Seed Data** - Run `seed_parking_lots.sql` for test data

**SQL Scripts Location:** Check the `artifacts` folder for all SQL scripts.

### 5. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:5173`

### 6. Login with Default Accounts

**Test Accounts:**
- **User**: `user@parkeazy.com` (role: user)
- **Admin**: `admin@parkeazy.com` (role: admin)
- **SuperAdmin**: `superadmin@parkeazy.com` (role: super_admin)

*Note: Set up these accounts in your Supabase dashboard or use the signup page.*

## 🏗️ Build for Production

```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## 🌐 Deploy to Vercel

1. Push your code to GitHub
2. Import project in [Vercel Dashboard](https://vercel.com)
3. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy!

## 📁 Project Structure

```
park-eazy-v1/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── common/       # Buttons, cards, etc.
│   │   ├── layout/       # Layouts for each role
│   │   ├── modals/       # Modal dialogs
│   │   └── profile/      # Profile components
│   ├── contexts/         # React Context (Auth, Payment, etc.)
│   ├── pages/            # Page components
│   │   ├── user/         # User dashboard pages
│   │   ├── admin/        # Admin dashboard pages
│   │   ├── superadmin/   # SuperAdmin pages
│   │   └── auth/         # Login/Signup pages
│   ├── utils/            # Helper functions
│   ├── lib/              # Supabase client
│   ├── assets/           # Images, icons
│   ├── types.ts          # TypeScript types
│   └── App.tsx           # Main app component
├── public/               # Static assets
└── package.json          # Dependencies

```

## 🔐 Security Features

- ✅ **Row Level Security (RLS)** - Database-level access control
- ✅ **Optimized Queries** - Cached `auth.uid()` for performance
- ✅ **Function Security** - Protected `search_path` to prevent injection
- ✅ **Payment Isolation** - User-scoped payment methods
- ✅ **Role-Based Access** - Separate dashboards for each role
- ✅ **Google OAuth** - Secure authentication via Google

## 🗺️ Map Features

- **Dynamic Markers**: Colored by status (green/orange/red) with vehicle icons
- **Clustering**: Automatic grouping of nearby markers
- **User Location**: Blue pulse showing your position
- **Search**: Geocoded search with autocomplete
- **Drag & Drop**: Admins can place slots visually

## 🐛 Troubleshooting

### Build Errors
```bash
rm -rf node_modules package-lock.json
npm install
```

### Maps Not Showing
- Check Supabase connection
- Verify RLS policies are set
- Check browser console for errors

### Login Issues
- Verify `.env.local` contains correct Supabase credentials
- Check Supabase auth is enabled
- Verify user exists in `user_profiles` table

## 📝 License

Private Project

## 🙏 Acknowledgments

- OpenStreetMap for map tiles
- Supabase for backend infrastructure
- Leaflet for mapping library
