-- Security Fix #1: Make avatars bucket private
-- This prevents unauthorized public access to user avatars
UPDATE storage.buckets 
SET public = false 
WHERE id = 'avatars';

-- Security Fix #2: Add RLS policies for secure avatar access
-- Policy: Users can view any avatar (authenticated users only)
CREATE POLICY "Authenticated users can view avatars"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'avatars');

-- Policy: Users can upload their own avatars
CREATE POLICY "Users can upload own avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can update their own avatars
CREATE POLICY "Users can update own avatar"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own avatars
CREATE POLICY "Users can delete own avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Security Fix #3: Add password history retention policy
-- Create function to purge old password history entries (keep only last 5 per user)
CREATE OR REPLACE FUNCTION public.purge_old_password_history()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.password_history ph1
  WHERE id NOT IN (
    SELECT id FROM (
      SELECT id, user_id, created_at,
             ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
      FROM public.password_history
    ) ranked
    WHERE rn <= 5
  );
END;
$$;

-- Grant execute permission to service_role only
REVOKE ALL ON FUNCTION public.purge_old_password_history() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.purge_old_password_history() TO service_role;