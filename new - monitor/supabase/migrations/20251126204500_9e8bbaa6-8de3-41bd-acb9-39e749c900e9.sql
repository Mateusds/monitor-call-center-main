-- Fix security issues: Restrict RLS policies for profiles and user_roles tables

-- 1. Update profiles table RLS policy
-- Drop existing public policy
DROP POLICY IF EXISTS "Perfis são visíveis para todos autenticados" ON public.profiles;

-- Create restricted policy: users see own profile, admins/supervisors see all
CREATE POLICY "Restricted profile visibility" ON public.profiles
FOR SELECT USING (
  auth.uid() = id OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'supervisor'::app_role)
);

-- 2. Update user_roles table RLS policy
-- Drop existing public policy
DROP POLICY IF EXISTS "Roles são visíveis para todos autenticados" ON public.user_roles;

-- Create restricted policy: users see own roles, admins see all
CREATE POLICY "Users can see own roles, admins see all" ON public.user_roles
FOR SELECT USING (
  user_id = auth.uid() OR
  has_role(auth.uid(), 'admin'::app_role)
);