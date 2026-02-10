import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CallRecord } from '@/types/callData';
import { useToast } from '@/hooks/use-toast';

export const useCallRecords = () => {
  const { toast } = useToast();
  const [records, setRecords] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('call_records')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('Dados brutos do banco:', data?.slice(0, 5));

      if (error) throw error;

      // Para dados agregados, criamos registros representativos
      const allRecords = (data || []).flatMap(record => {
        const records: CallRecord[] = [];
        
        // Criar registros para chamadas atendidas
        if (record.atendidas > 0) {
          records.push({
            fila: record.queue,
            chamadas: 'Atendidas',
            dataHoraLigacao: '',
            dataHoraAtendida: '',
            dataHoraEncerrada: '',
            duracaoSegundos: record.duracao_media,
            ramal: '',
            nomeOperador: '',
            duracaoChamada: '',
            tempoEspera: '',
            idChamada: `${record.id}-atendidas`,
            motivo: '',
            telefone: record.phone,
            estado: record.state,
            setor: record.queue,
            periodo: record.period,
            quantidade: record.atendidas
          });
        }

        // Criar registros para chamadas abandonadas
        if (record.abandonadas > 0) {
          records.push({
            fila: record.queue,
            chamadas: 'Abandonadas',
            dataHoraLigacao: '',
            dataHoraAtendida: '',
            dataHoraEncerrada: '',
            duracaoSegundos: 0,
            ramal: '',
            nomeOperador: '',
            duracaoChamada: '',
            tempoEspera: '',
            idChamada: `${record.id}-abandonadas`,
            motivo: '',
            telefone: record.phone,
            estado: record.state,
            setor: record.queue,
            periodo: record.period,
            quantidade: record.abandonadas
          });
        }

        return records;
      });

      const formattedRecords: CallRecord[] = allRecords;

      console.log('Registros formatados:', {
        total: formattedRecords.length,
        atendidas: formattedRecords.filter(r => r.chamadas === 'Atendidas').length,
        abandonadas: formattedRecords.filter(r => r.chamadas === 'Abandonadas').length
      });

      setRecords(formattedRecords);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar registros');
    } finally {
      setLoading(false);
    }
  };

  const saveRecords = async (newRecords: CallRecord[], fileName: string) => {
    try {
      const recordsToInsert = newRecords.map(record => ({
        queue: record.fila,
        period: fileName.match(/(Janeiro|Fevereiro|Março|Abril|Maio|Junho|Julho|Agosto|Setembro|Outubro|Novembro|Dezembro)/i)?.[1] || 'Desconhecido',
        state: record.estado,
        phone: record.telefone,
        atendidas: record.chamadas === 'Atendidas' ? 1 : 0,
        abandonadas: record.chamadas === 'Abandonadas' ? 1 : 0,
        total_chamadas: 1,
        duracao_media: record.duracaoSegundos,
        taxa_atendimento: record.chamadas === 'Atendidas' ? 100 : 0,
        file_name: fileName
      }));

      const { error } = await supabase
        .from('call_records')
        .insert(recordsToInsert);

      if (error) throw error;

      await fetchRecords();
      return { success: true };
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Erro ao salvar registros' 
      };
    }
  };

  const deleteAllRecords = async () => {
    try {
      // Criar backup antes de deletar
      const { data: backupData, error: backupError } = await supabase
        .rpc('create_call_records_backup', {
          backup_type_param: 'before_delete',
          metadata_param: {
            action: 'delete_all_records',
            timestamp: new Date().toISOString()
          }
        });

      if (backupError) {
        console.error('Erro ao criar backup:', backupError);
        toast({
          variant: "destructive",
          title: "Erro ao criar backup",
          description: "Não foi possível criar o backup antes da exclusão",
        });
        return { success: false, error: 'Falha ao criar backup' };
      }

      // Deletar todos os registros
      const { error: deleteError } = await supabase
        .from('call_records')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Deletar todos

      if (deleteError) throw deleteError;

      toast({
        title: "✅ Dados excluídos com sucesso",
        description: `Backup criado automaticamente. ID: ${backupData}`,
      });

      await fetchRecords();
      return { success: true, backupId: backupData };
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Erro ao deletar registros' 
      };
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  return { 
    records, 
    loading, 
    error, 
    saveRecords, 
    refreshRecords: fetchRecords,
    deleteAllRecords
  };
};
