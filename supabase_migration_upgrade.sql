-- ==========================================
-- PARK-EAZY DATABASE UPGRADE MIGRATION
-- Upgrades existing schema to role-based system
-- SAFE TO RUN: Preserves all existing data
-- ==========================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- STEP 1: UPGRADE user_profiles TABLE
-- ==========================================

-- Add role column (keeps existing is_admin for now)
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS role text 
CHECK (role IN ('user', 'admin', 'super_admin')) 
DEFAULT 'user';

-- Migrate existing is_admin values to role
-- Admin users get 'admin' role, others get 'user' role
UPDATE public.user_profiles
SET role = CASE 
  WHEN is_admin = true THEN 'admin'
  ELSE 'user'
END
WHERE role IS NULL OR role = 'user';

-- Make role NOT NULL after migration
ALTER TABLE public.user_profiles 
ALTER COLUMN role SET NOT NULL;

-- Optional: Keep is_admin for backward compatibility, or drop it
-- For now, we'll keep both and sync them
-- Uncomment the line below if you want to remove is_admin completely:
-- ALTER TABLE public.user_profiles DROP COLUMN IF EXISTS is_admin;

-- ==========================================
-- STEP 2: CREATE MISSING TABLES
-- ==========================================

-- Reservations Table
CREATE TABLE IF NOT EXISTS public.reservations (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.user_profiles(user_id) ON DELETE CASCADE NOT NULL,
  parking_lot_id uuid REFERENCES public.parking_lots(id) ON DELETE CASCADE NOT NULL,
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone NOT NULL,
  total_cost numeric(10,2) NOT NULL,
  status text CHECK (status IN ('Active', 'Completed', 'Cancelled')) DEFAULT 'Active',
  payment_method text CHECK (payment_method IN ('Card', 'bKash', 'Nagad', 'Rocket')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Saved Payment Methods Table
CREATE TABLE IF NOT EXISTS public.saved_payment_methods (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.user_profiles(user_id) ON DELETE CASCADE NOT NULL,
  type text CHECK (type IN ('Card', 'bKash', 'Nagad', 'Rocket')) NOT NULL,
  cardholder_name text,
  last4 text,
  expiry_date text,
  account_number text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- System Logs Table
CREATE TABLE IF NOT EXISTS public.system_logs (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.user_profiles(user_id) ON DELETE SET NULL,
  action text NOT NULL,
  details text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- STEP 3: CREATE INDEXES
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON public.reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_parking_lot_id ON public.reservations(parking_lot_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON public.reservations(status);
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON public.saved_payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON public.system_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);

-- ==========================================
-- STEP 4: ENABLE ROW LEVEL SECURITY
-- ==========================================

ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- STEP 5: UPDATE EXISTING RLS POLICIES
-- ==========================================

-- Drop old admin policies and recreate with role-based checks
DROP POLICY IF EXISTS "Admins can insert parking lots" ON public.parking_lots;
DROP POLICY IF EXISTS "Admins can update parking lots" ON public.parking_lots;
DROP POLICY IF EXISTS "Admins can delete parking lots" ON public.parking_lots;

-- Recreate with role-based system (admin OR super_admin)
CREATE POLICY "Admins can insert parking lots" ON public.parking_lots
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update parking lots" ON public.parking_lots
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can delete parking lots" ON public.parking_lots
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- ==========================================
-- STEP 6: ADD NEW RLS POLICIES
-- ==========================================

-- User Profiles
-- Allow users to insert their own profile (for signup)
CREATE POLICY "Users can insert their own profile" ON public.user_profiles 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Only allow users to update their own data (NOT role)
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;

CREATE POLICY "Users can update own profile (except role)" ON public.user_profiles 
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id AND (
      -- Role cannot be changed unless you're a super_admin
      role = (SELECT role FROM public.user_profiles WHERE user_id = auth.uid()) OR
      EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_id = auth.uid() 
        AND role = 'super_admin'
      )
    )
  );

-- Super admins can update ANY user's profile (including role)
CREATE POLICY "Super admins can update any user" ON public.user_profiles 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() 
      AND role = 'super_admin'
    )
  );

-- Reservations
CREATE POLICY "Users can view own reservations" ON public.reservations 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create reservations" ON public.reservations 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reservations" ON public.reservations 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all reservations" ON public.reservations 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update any reservation" ON public.reservations 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Payment Methods
CREATE POLICY "Users can view own payment methods" ON public.saved_payment_methods 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own payment methods" ON public.saved_payment_methods 
  FOR ALL USING (auth.uid() = user_id);

-- System Logs
CREATE POLICY "Users can view own logs" ON public.system_logs 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all logs" ON public.system_logs 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can create logs" ON public.system_logs 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- ==========================================
-- STEP 7: AUTOMATIC USER SIGNUP TRIGGER
-- ==========================================

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, email, name, role)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'name', 'New User'), 
    'user'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==========================================
-- STEP 8: HELPER FUNCTIONS
-- ==========================================

-- Function to check if current user has a specific role
CREATE OR REPLACE FUNCTION public.current_user_has_role(required_role text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = auth.uid() 
    AND role = required_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user is admin or super_admin
CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- STEP 9: SYNC FUNCTION (OPTIONAL)
-- ==========================================

-- Function to keep is_admin in sync with role
-- (Only needed if you keep both columns)
CREATE OR REPLACE FUNCTION public.sync_admin_role()
RETURNS trigger AS $$
BEGIN
  -- When role changes, update is_admin
  IF NEW.role IN ('admin', 'super_admin') THEN
    NEW.is_admin = true;
  ELSE
    NEW.is_admin = false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to sync is_admin with role
DROP TRIGGER IF EXISTS sync_admin_role_trigger ON public.user_profiles;
CREATE TRIGGER sync_admin_role_trigger
  BEFORE UPDATE OF role ON public.user_profiles
  FOR EACH ROW EXECUTE PROCEDURE public.sync_admin_role();

-- ==========================================
-- MIGRATION COMPLETE!
-- ==========================================

-- Verify migration
SELECT 
  'Migration Complete!' AS status,
  COUNT(*) AS total_users,
  COUNT(CASE WHEN role = 'user' THEN 1 END) AS regular_users,
  COUNT(CASE WHEN role = 'admin' THEN 1 END) AS admins,
  COUNT(CASE WHEN role = 'super_admin' THEN 1 END) AS super_admins
FROM public.user_profiles;
