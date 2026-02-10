-- Habilitar Realtime para a tabela call_records
ALTER TABLE call_records REPLICA IDENTITY FULL;

-- Adicionar a tabela à publicação do realtime
ALTER PUBLICATION supabase_realtime ADD TABLE call_records;
