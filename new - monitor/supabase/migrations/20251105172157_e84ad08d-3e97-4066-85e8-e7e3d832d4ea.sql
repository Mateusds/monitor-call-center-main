-- Criar tabela para armazenar registros de chamadas
CREATE TABLE public.call_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  queue TEXT NOT NULL,
  period TEXT NOT NULL,
  state TEXT NOT NULL,
  phone TEXT NOT NULL,
  atendidas INTEGER NOT NULL DEFAULT 0,
  abandonadas INTEGER NOT NULL DEFAULT 0,
  total_chamadas INTEGER NOT NULL DEFAULT 0,
  duracao_media INTEGER NOT NULL DEFAULT 0,
  taxa_atendimento NUMERIC(5,2) NOT NULL DEFAULT 0,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  file_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhorar performance das consultas
CREATE INDEX idx_call_records_queue ON public.call_records(queue);
CREATE INDEX idx_call_records_period ON public.call_records(period);
CREATE INDEX idx_call_records_state ON public.call_records(state);
CREATE INDEX idx_call_records_queue_period ON public.call_records(queue, period);

-- Habilitar RLS (mas permitir acesso público para este caso de uso)
ALTER TABLE public.call_records ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura pública
CREATE POLICY "Permitir leitura de registros de chamadas"
  ON public.call_records
  FOR SELECT
  USING (true);

-- Política para permitir inserção pública
CREATE POLICY "Permitir inserção de registros de chamadas"
  ON public.call_records
  FOR INSERT
  WITH CHECK (true);