-- Fix: Add parameter validation to create_call_records_backup function
-- Prevents arbitrary backup_type values and excessive metadata sizes

CREATE OR REPLACE FUNCTION public.create_call_records_backup(backup_type_param text, metadata_param jsonb DEFAULT NULL::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  backup_id uuid;
  record_data jsonb;
  record_cnt integer;
BEGIN
  -- Validate backup_type parameter
  IF backup_type_param IS NULL OR backup_type_param NOT IN ('before_delete', 'before_update', 'manual', 'scheduled') THEN
    RAISE EXCEPTION 'Invalid backup_type: %. Must be one of: before_delete, before_update, manual, scheduled', COALESCE(backup_type_param, 'NULL');
  END IF;
  
  -- Validate metadata size (prevent storage abuse)
  IF metadata_param IS NOT NULL AND length(metadata_param::text) > 10000 THEN
    RAISE EXCEPTION 'Metadata too large. Maximum allowed size is 10000 characters.';
  END IF;

  -- Get all current records
  SELECT jsonb_agg(row_to_json(call_records.*)), COUNT(*)
  INTO record_data, record_cnt
  FROM call_records;
  
  -- Create backup record with validated parameters
  INSERT INTO call_records_backup (
    backup_type,
    user_id,
    record_count,
    data,
    metadata
  ) VALUES (
    backup_type_param,
    auth.uid(),
    record_cnt,
    record_data,
    metadata_param
  )
  RETURNING id INTO backup_id;
  
  RETURN backup_id;
END;
$function$;