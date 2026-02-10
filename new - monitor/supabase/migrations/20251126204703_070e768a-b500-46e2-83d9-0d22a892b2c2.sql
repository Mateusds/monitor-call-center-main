-- Create password history table to prevent password reuse

CREATE TABLE public.password_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient lookups
CREATE INDEX idx_password_history_user_id ON public.password_history(user_id);
CREATE INDEX idx_password_history_created_at ON public.password_history(created_at DESC);

-- Enable RLS
ALTER TABLE public.password_history ENABLE ROW LEVEL SECURITY;

-- Only admins can view password history (for auditing purposes)
CREATE POLICY "Only admins can view password history" ON public.password_history
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- System can insert password history (through edge functions)
CREATE POLICY "System can insert password history" ON public.password_history
FOR INSERT WITH CHECK (true);

-- Function to clean up old password history (keep only last 5)
CREATE OR REPLACE FUNCTION public.cleanup_password_history()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete all but the 5 most recent password hashes for this user
  DELETE FROM public.password_history
  WHERE user_id = NEW.user_id
  AND id NOT IN (
    SELECT id FROM public.password_history
    WHERE user_id = NEW.user_id
    ORDER BY created_at DESC
    LIMIT 5
  );
  RETURN NEW;
END;
$$;

-- Trigger to automatically clean up old password history
CREATE TRIGGER trigger_cleanup_password_history
AFTER INSERT ON public.password_history
FOR EACH ROW
EXECUTE FUNCTION public.cleanup_password_history();