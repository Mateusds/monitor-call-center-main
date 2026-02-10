-- Fix 1: Remove the conflicting INSERT policies on audit_logs
-- The 'Service role pode inserir logs' with 'true' allows any insert
-- The 'Sistema pode inserir logs de auditoria' with 'false' blocks all inserts
-- We need to remove both and ensure only service role can insert (handled at application level)

DROP POLICY IF EXISTS "Service role pode inserir logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Sistema pode inserir logs de auditoria" ON public.audit_logs;

-- Fix 2: Update profiles SELECT policy to restrict email visibility
-- Only allow users to see their own full profile (including email)
-- Admins can see all profiles for user management
-- Supervisors should NOT see other users' emails - they don't need it for their role

DROP POLICY IF EXISTS "Restricted profile visibility" ON public.profiles;

-- Users can only see their own profile details
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- Admins can view all profiles for user management
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));