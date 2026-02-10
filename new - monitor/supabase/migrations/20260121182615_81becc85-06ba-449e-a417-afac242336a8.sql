-- Fix #1: Add service_role INSERT policy for audit_logs
-- The migration 20260121180917 removed INSERT policies without replacement
CREATE POLICY "Service role can insert audit logs"
ON public.audit_logs
FOR INSERT
TO service_role
WITH CHECK (true);

-- Fix #2: Replace overly permissive password_history INSERT policy
-- Drop the current policy that allows any authenticated user to INSERT
DROP POLICY IF EXISTS "System can insert password history" ON public.password_history;

-- Create new policy that only allows service_role to INSERT
-- Edge functions use service role key, so this won't break functionality
CREATE POLICY "Service role can insert password history"
ON public.password_history
FOR INSERT
TO service_role
WITH CHECK (true);