-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ==========================================
-- 1. TABLE DEFINITIONS
-- ==========================================

-- Users Table (Public profile mirroring auth.users)
create table if not exists public.users (
  id uuid references auth.users on delete cascade not null primary key,
  email text not null,
  name text not null,
  role text check (role in ('user', 'admin', 'super_admin')) default 'user',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Parking Slots Table
create table if not exists public.parking_slots (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  latitude double precision not null,
  longitude double precision not null,
  address text,
  status text check (status in ('Available', 'Reserved', 'Occupied')) default 'Available',
  type text check (type in ('Car', 'Bike', 'SUV', 'Minivan', 'Truck')) not null,
  price_per_hour double precision not null,
  features text[],
  operating_hours text,
  rating double precision,
  reviews integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Reservations Table
create table if not exists public.reservations (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  slot_id uuid references public.parking_slots(id) on delete cascade not null,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  total_cost double precision not null,
  status text check (status in ('Active', 'Completed', 'Cancelled')) default 'Active',
  payment_method text check (payment_method in ('Card', 'bKash', 'Nagad', 'Rocket')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Saved Payment Methods Table
create table if not exists public.saved_payment_methods (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  type text check (type in ('Card', 'bKash', 'Nagad', 'Rocket')) not null,
  cardholder_name text,
  last4 text,
  expiry_date text,
  account_number text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- System Logs Table
create table if not exists public.system_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete set null,
  action text not null,
  details text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==========================================
-- 2. ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Enable RLS
alter table public.users enable row level security;
alter table public.parking_slots enable row level security;
alter table public.reservations enable row level security;
alter table public.saved_payment_methods enable row level security;
alter table public.system_logs enable row level security;

-- Policies
-- Users
create policy "Public profiles are viewable by everyone." on public.users for select using (true);
create policy "Users can insert their own profile." on public.users for insert with check (auth.uid() = id);
create policy "Users can update own profile." on public.users for update using (auth.uid() = id);

-- Parking Slots
create policy "Parking slots are viewable by everyone." on public.parking_slots for select using (true);
-- Only admins should be able to insert/update/delete parking slots (Add admin logic later if needed)

-- Reservations
create policy "Users can view own reservations." on public.reservations for select using (auth.uid() = user_id);
create policy "Users can create reservations." on public.reservations for insert with check (auth.uid() = user_id);
create policy "Users can update own reservations." on public.reservations for update using (auth.uid() = user_id);

-- Payment Methods
create policy "Users can view own payment methods." on public.saved_payment_methods for select using (auth.uid() = user_id);
create policy "Users can manage own payment methods." on public.saved_payment_methods for all using (auth.uid() = user_id);

-- ==========================================
-- 3. MOCK DATA
-- ==========================================

-- Mock Parking Slots (Dhaka Locations)
INSERT INTO public.parking_slots (name, latitude, longitude, address, status, type, price_per_hour, features, operating_hours, rating, reviews)
VALUES
('Gulshan Pink City Basement', 23.7925, 90.4078, 'Gulshan 2, Dhaka', 'Available', 'Car', 50.0, ARRAY['CCTV', 'Guard', 'Indoor', 'Lighting'], '8:00 AM - 10:00 PM', 4.5, 12),
('Dhanmondi Lake Side Parking', 23.7461, 90.3742, 'Road 8A, Dhanmondi, Dhaka', 'Occupied', 'Car', 30.0, ARRAY['Open Air', 'Guard'], '24/7', 4.2, 8),
('Bashundhara City Basement 2', 23.7509, 90.3935, 'Panthapath, Dhaka', 'Available', 'Car', 60.0, ARRAY['CCTV', 'Guard', 'Indoor', 'Elevator Access'], '9:00 AM - 9:00 PM', 4.7, 25),
('Uttara Sector 4 Park', 23.8630, 90.3978, 'Sector 4, Uttara, Dhaka', 'Available', 'Bike', 15.0, ARRAY['Open Air', 'Guard'], '6:00 AM - 11:00 PM', 4.0, 5),
('Banani Super Market', 23.7937, 90.4043, 'Banani, Dhaka', 'Reserved', 'SUV', 70.0, ARRAY['CCTV', 'Guard', 'Indoor'], '8:00 AM - 10:00 PM', 4.3, 10),
('Motijheel City Centre', 23.7315, 90.4165, 'Motijheel, Dhaka', 'Available', 'Car', 80.0, ARRAY['CCTV', 'Guard', 'Indoor', 'Valet'], '24/7', 4.8, 30),
('Mirpur 10 Circle Parking', 23.8070, 90.3685, 'Mirpur 10, Dhaka', 'Available', 'Bike', 10.0, ARRAY['Open Air'], '7:00 AM - 10:00 PM', 3.8, 15),
('Jamuna Future Park Level -2', 23.8136, 90.4243, 'Bashundhara R/A, Dhaka', 'Available', 'Car', 50.0, ARRAY['CCTV', 'Guard', 'Indoor', 'Spacious'], '9:00 AM - 10:00 PM', 4.6, 40),
('Lalmatia Aarong Parking', 23.7566, 90.3713, 'Lalmatia, Dhaka', 'Occupied', 'Car', 40.0, ARRAY['Guard', 'Indoor'], '10:00 AM - 8:00 PM', 4.4, 18),
('Bailey Road Officer''s Club', 23.7405, 90.4090, 'Bailey Road, Dhaka', 'Reserved', 'Car', 45.0, ARRAY['CCTV', 'Guard', 'Open Air'], '24/7', 4.5, 22),
('USTC University Parking', 22.3615, 91.7973, 'Foy''s Lake Rd, Chattogram', 'Available', 'Car', 20.0, ARRAY['Open Air', 'Guard'], '7:00 AM - 8:00 PM', 4.1, 15),
('Agrabad Commercial Area', 22.3237, 91.8091, 'Agrabad, Chattogram', 'Occupied', 'Car', 40.0, ARRAY['CCTV', 'Guard', 'Indoor'], '8:00 AM - 10:00 PM', 4.4, 35),
('Khulshi Residential Parking', 22.3609, 91.8111, 'Khulshi, Chattogram', 'Available', 'SUV', 35.0, ARRAY['CCTV', 'Guard', 'Lighting'], '24/7', 4.6, 12),
('Halishahar Block B', 22.3181, 91.7782, 'Halishahar, Chattogram', 'Available', 'Bike', 10.0, ARRAY['Open Air'], '6:00 AM - 11:00 PM', 3.9, 8),
('Panchlaish Residential Area', 22.3667, 91.8250, 'Panchlaish, Chattogram', 'Reserved', 'Car', 30.0, ARRAY['Guard', 'CCTV'], '24/7', 4.3, 20),
('Chandgoan Residential Area', 22.3785, 91.8476, 'Chandgoan, Chattogram', 'Available', 'Car', 25.0, ARRAY['Guard', 'Open Air'], '7:00 AM - 11:00 PM', 4.0, 10),
('Lalkhan Bazar Circle', 22.3519, 91.8208, 'Lalkhan Bazar, Chattogram', 'Occupied', 'Bike', 15.0, ARRAY['CCTV', 'Guard'], '8:00 AM - 10:00 PM', 4.2, 25),
('Jamal Khan Road', 22.3501, 91.8273, 'Jamal Khan, Chattogram', 'Available', 'Car', 35.0, ARRAY['CCTV', 'Guard', 'Indoor'], '9:00 AM - 9:00 PM', 4.5, 30),
('Sholoshahar Gate 2', 22.3668, 91.8258, 'Sholoshahar, Chattogram', 'Available', 'Car', 30.0, ARRAY['Open Air', 'Guard'], '24/7', 4.1, 18),
('Nasirabad Industrial Area', 22.3608, 91.8232, 'Nasirabad, Chattogram', 'Reserved', 'Truck', 60.0, ARRAY['CCTV', 'Guard', 'Large Spaces'], '24/7', 4.0, 5),
('Chawkbazar Intersection', 22.3526, 91.8329, 'Chawkbazar, Chattogram', 'Occupied', 'Bike', 12.0, ARRAY['Open Air'], '8:00 AM - 10:00 PM', 3.8, 22),
('Dampara Bus Stop', 22.3526, 91.8192, 'Dampara, Chattogram', 'Available', 'Car', 40.0, ARRAY['CCTV', 'Guard'], '24/7', 4.3, 28),
('Foy''s Lake Amusement Park', 22.3724, 91.7928, 'Foy''s Lake, Chattogram', 'Available', 'Car', 50.0, ARRAY['CCTV', 'Guard', 'Large Spaces'], '9:00 AM - 8:00 PM', 4.7, 45),
('Ethnological Museum Parking', 22.3280, 91.8150, 'Agrabad, Chattogram', 'Available', 'Car', 30.0, ARRAY['Guard', 'Indoor'], '10:00 AM - 6:00 PM', 4.4, 14),
('Chandanpura Mosque Area', 22.3501, 91.8362, 'Chandanpura, Chattogram', 'Available', 'Bike', 10.0, ARRAY['Open Air'], '5:00 AM - 10:00 PM', 4.2, 16),
('Zia Memorial Museum', 22.3482, 91.8239, 'Kazir Dewri, Chattogram', 'Reserved', 'Car', 35.0, ARRAY['CCTV', 'Guard'], '9:00 AM - 5:00 PM', 4.3, 11),
('Agrabad Mohila College', 22.3252, 91.7976, 'Agrabad, Chattogram', 'Available', 'Car', 25.0, ARRAY['Guard'], '8:00 AM - 4:00 PM', 4.0, 9),
('Bhatiary Lake View', 22.4343, 91.7638, 'Bhatiary, Chattogram', 'Available', 'SUV', 45.0, ARRAY['Open Air', 'Scenic View'], '6:00 AM - 7:00 PM', 4.8, 32),
('Khaiyachara Falls Parking', 22.7694, 91.6119, 'Mirsharai, Chattogram', 'Available', 'Car', 40.0, ARRAY['Open Air', 'Guard'], '7:00 AM - 6:00 PM', 4.5, 20);

-- Note: We cannot easily insert mock Users or Reservations because they depend on valid Auth UIDs which are generated by Supabase Auth.
-- You should sign up a user in your app first, then you can manually insert reservations for testing if needed.
