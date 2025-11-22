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

-- System Logs
create policy "Users can view own logs." on public.system_logs for select using (auth.uid() = user_id);
create policy "Admins can view all logs." on public.system_logs for select using (exists (select 1 from public.users where id = auth.uid() and role in ('admin', 'super_admin')));

-- ==========================================
-- 3. TRIGGERS & FUNCTIONS
-- ==========================================

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', 'New User'), 'user');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call the function on auth.users insert
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ==========================================
-- 4. MOCK DATA
-- ==========================================

-- Mock Parking Slots (Chittagong, Dhaka, Sylhet)
INSERT INTO public.parking_slots (name, latitude, longitude, address, status, type, price_per_hour, features, operating_hours, rating, reviews)
VALUES
  -- Chittagong
  ('GEC-01', 22.359, 91.821, 'Near GEC Convention Hall, Chittagong', 'Available', 'Car', 50, ARRAY['CCTV', 'Guarded'], '24/7', 4.8, 35),
  ('GEC-02', 22.357, 91.822, 'Central Plaza, GEC Circle, Chittagong', 'Occupied', 'SUV', 70, ARRAY['Multi-storey parking', 'Valet parking'], '9 AM - 11 PM', 4.5, 20),
  ('AGB-01', 22.333, 91.815, 'Agrabad Access Road, Chittagong', 'Reserved', 'Bike', 20, ARRAY['Guarded'], '24/7', 4.2, 15),
  ('AGB-02', 22.335, 91.817, 'Badamtali, Agrabad, Chittagong', 'Available', 'Truck', 100, ARRAY['Guarded', 'CCTV'], '24/7', 4.0, 10),
  ('NAS-01', 22.366, 91.832, 'CDA Avenue, Nasirabad, Chittagong', 'Available', 'Minivan', 80, ARRAY['CCTV', 'Multi-storey parking'], '8 AM - 12 AM', 4.6, 28),
  ('JAM-01', 22.370, 91.835, 'Jamalkhan, Chittagong', 'Available', 'Car', 60, ARRAY['Valet parking', 'Guarded'], '24/7', 4.9, 45),
  ('CBZ-01', 22.345, 91.838, 'Chawkbazar, Chittagong', 'Available', 'Bike', 25, ARRAY['CCTV'], '7 AM - 11 PM', 4.0, 0),
  ('KHL-01', 22.375, 91.840, 'Khulshi, Chittagong', 'Occupied', 'SUV', 75, ARRAY['Multi-storey parking', 'Guarded'], '24/7', 4.7, 33),
  ('KHL-02', 22.376, 91.842, 'Near Khulshi Mart, Chittagong', 'Available', 'Car', 65, ARRAY['CCTV', 'Guarded'], '9 AM - 10 PM', 0, 0),
  ('ZKB-01', 22.361, 91.825, 'Sanmar Ocean City, Chittagong', 'Reserved', 'Car', 80, ARRAY['CCTV', 'Guarded', 'Multi-storey parking'], '10 AM - 10 PM', 4.8, 180),

  -- Dhaka
  ('Gulshan DCC-01', 23.7925, 90.4078, 'Gulshan 1 DCC Market, Dhaka', 'Available', 'SUV', 120, ARRAY['CCTV', 'Guarded', 'Multi-storey parking'], '24/7', 4.9, 150),
  ('Bashundhara-01', 23.7522, 90.3905, 'Bashundhara City, Panthapath, Dhaka', 'Occupied', 'Car', 100, ARRAY['Multi-storey parking', 'Valet parking'], '10 AM - 10 PM', 4.7, 250),
  ('Dhanmondi-32', 23.7461, 90.3752, 'Rd No 32, Dhanmondi, Dhaka', 'Available', 'Bike', 30, ARRAY['CCTV'], '24/7', 4.3, 50),
  ('Motijheel-01', 23.7277, 90.4191, 'Shapla Chattar, Motijheel, Dhaka', 'Available', 'Car', 90, ARRAY['Guarded'], '9 AM - 9 PM', 4.1, 95),
  ('Uttara-Jashimuddin', 23.8698, 90.3938, 'Jashimuddin Avenue, Uttara, Dhaka', 'Reserved', 'Minivan', 85, ARRAY['CCTV', 'Guarded'], '24/7', 4.6, 120),
  ('Mirpur-Stadium', 23.8055, 90.3541, 'Sher-e-Bangla Stadium, Mirpur, Dhaka', 'Available', 'SUV', 110, ARRAY['Guarded', 'Valet parking'], 'Event-based', 4.8, 200),

  -- Sylhet
  ('Zindabazar-01', 24.8949, 91.8687, 'Zindabazar Point, Sylhet', 'Available', 'Car', 40, ARRAY['Guarded'], '8 AM - 10 PM', 4.3, 15),
  ('BlueWater-01', 24.8955, 91.8690, 'Blue Water Shopping City, Sylhet', 'Reserved', 'SUV', 50, ARRAY['Multi-storey parking'], '10 AM - 10 PM', 0, 0),
  ('Ambarkhana-01', 24.9021, 91.8679, 'Ambarkhana Point, Sylhet', 'Available', 'Bike', 15, ARRAY[], '24/7', 0, 0),
  ('Hotel Grand View', 24.8911, 91.8744, 'Taltola, Sylhet', 'Available', 'Car', 60, ARRAY['CCTV', 'Valet parking'], '24/7', 0, 0);

-- Note: We cannot insert mock Users or Reservations here because they depend on valid Auth UIDs which are generated by Supabase Auth.
-- The handle_new_user trigger will take care of creating user profiles when you sign up in the app.
