-- ==========================================
-- SUPABASE SETUP VERIFICATION SCRIPT
-- Run this to verify everything is set up correctly
-- ==========================================

-- 1. Check all tables exist
SELECT 
  'Tables Check' AS verification_step,
  CASE 
    WHEN COUNT(*) = 5 THEN '✅ All tables exist'
    ELSE '❌ Missing tables'
  END AS status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('user_profiles', 'parking_lots', 'reservations', 'saved_payment_methods', 'system_logs');

-- 2. Check user accounts setup
SELECT 
  '--- User Accounts Verification ---' AS section;

SELECT 
  email,
  role,
  is_admin,
  CASE 
    WHEN email = 'user@parkeazy.com' AND role = 'user' AND is_admin = false THEN '✅ Correct'
    WHEN email = 'admin@parkeazy.com' AND role = 'admin' AND is_admin = true THEN '✅ Correct'
    WHEN email = 'superadmin@parkeazy.com' AND role = 'super_admin' AND is_admin = true THEN '✅ Correct'
    ELSE '❌ Wrong configuration'
  END AS status
FROM public.user_profiles
WHERE email IN ('user@parkeazy.com', 'admin@parkeazy.com', 'superadmin@parkeazy.com')
ORDER BY 
  CASE role 
    WHEN 'super_admin' THEN 1
    WHEN 'admin' THEN 2
    WHEN 'user' THEN 3
  END;

-- 3. Check RLS policies exist
SELECT 
  '--- RLS Policies Verification ---' AS section;

SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('user_profiles', 'parking_lots', 'reservations', 'saved_payment_methods', 'system_logs')
GROUP BY tablename
ORDER BY tablename;

-- 4. Check triggers exist
SELECT 
  '--- Triggers Verification ---' AS section;

SELECT 
  trigger_name,
  event_object_table,
  action_timing,
  CASE 
    WHEN trigger_name = 'on_auth_user_created' THEN '✅ Auto-signup trigger exists'
    WHEN trigger_name = 'sync_admin_role_trigger' THEN '✅ Role sync trigger exists'
    ELSE '✅ Trigger exists'
  END AS status
FROM information_schema.triggers
WHERE trigger_schema = 'public' OR event_object_schema = 'auth';

-- 5. Check helper functions exist
SELECT 
  '--- Helper Functions Verification ---' AS section;

SELECT 
  routine_name,
  CASE 
    WHEN routine_name = 'current_user_has_role' THEN '✅ Role check function exists'
    WHEN routine_name = 'current_user_is_admin' THEN '✅ Admin check function exists'
    WHEN routine_name = 'handle_new_user' THEN '✅ User signup handler exists'
    ELSE '✅ Function exists'
  END AS status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('current_user_has_role', 'current_user_is_admin', 'handle_new_user', 'sync_admin_role');

-- 6. Count existing data
SELECT 
  '--- Data Summary ---' AS section;

SELECT 
  'Users' AS table_name,
  COUNT(*) AS total_records,
  COUNT(CASE WHEN role = 'user' THEN 1 END) AS regular_users,
  COUNT(CASE WHEN role = 'admin' THEN 1 END) AS admins,
  COUNT(CASE WHEN role = 'super_admin' THEN 1 END) AS super_admins
FROM public.user_profiles

UNION ALL

SELECT 
  'Parking Lots',
  COUNT(*),
  COUNT(CASE WHEN status = 'AVAILABLE' THEN 1 END),
  COUNT(CASE WHEN status = 'OCCUPIED' THEN 1 END),
  COUNT(CASE WHEN status = 'RESERVED' THEN 1 END)
FROM public.parking_lots

UNION ALL

SELECT 
  'Reservations',
  COUNT(*),
  NULL,
  NULL,
  NULL
FROM public.reservations;

-- ==========================================
-- VERIFICATION COMPLETE
-- ==========================================
