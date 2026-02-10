-- Criar tabela de backup para call_records
CREATE TABLE IF NOT EXISTS public.call_records_backup (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  backup_date timestamp with time zone NOT NULL DEFAULT now(),
  backup_type text NOT NULL, -- 'before_delete', 'before_update', 'manual'
  user_id uuid,
  record_count integer NOT NULL DEFAULT 0,
  data jsonb NOT NULL,
  metadata jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.call_records_backup ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Admin e supervisor podem visualizar backups"
ON public.call_records_backup
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'supervisor'::app_role));

CREATE POLICY "Admin e supervisor podem criar backups"
ON public.call_records_backup
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'supervisor'::app_role));

CREATE POLICY "Admin pode deletar backups antigos"
ON public.call_records_backup
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Índice para melhor performance
CREATE INDEX idx_call_records_backup_date ON public.call_records_backup(backup_date DESC);
CREATE INDEX idx_call_records_backup_type ON public.call_records_backup(backup_type);

-- Função para criar backup automaticamente
CREATE OR REPLACE FUNCTION public.create_call_records_backup(
  backup_type_param text,
  metadata_param jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  backup_id uuid;
  record_data jsonb;
  record_cnt integer;
BEGIN
  -- Obter todos os registros atuais
  SELECT jsonb_agg(row_to_json(call_records.*)), COUNT(*)
  INTO record_data, record_cnt
  FROM call_records;
  
  -- Criar registro de backup
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
$$;

COMMENT ON TABLE public.call_records_backup IS 'Armazena backups automáticos dos registros de chamadas antes de operações destrutivas';
COMMENT ON FUNCTION public.create_call_records_backup IS 'Cria backup automático da tabela call_records';