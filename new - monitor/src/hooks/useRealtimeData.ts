import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CallRecord {
  id: string;
  queue: string;
  period: string;
  atendidas: number;
  abandonadas: number;
  total_chamadas: number;
  taxa_atendimento: number;
  created_at: string;
}

export const useRealtimeData = () => {
  const [isListening, setIsListening] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [updateCount, setUpdateCount] = useState(0);

  useEffect(() => {
    console.log("Iniciando monitoramento Realtime...");
    
    const channel = supabase
      .channel('call-records-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'call_records'
        },
        (payload) => {
          console.log('Novo registro detectado:', payload);
          const newRecord = payload.new as CallRecord;
          
          setLastUpdate(new Date());
          setUpdateCount(prev => prev + 1);
          
          toast.success(
            `Novo registro de ${newRecord.queue}`,
            {
              description: `${newRecord.atendidas} atendidas, ${newRecord.abandonadas} abandonadas`,
              duration: 3000,
            }
          );

          // Força atualização da página
          window.dispatchEvent(new CustomEvent('realtimeUpdate', { 
            detail: newRecord 
          }));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'call_records'
        },
        (payload) => {
          console.log('Registro atualizado:', payload);
          const updatedRecord = payload.new as CallRecord;
          
          setLastUpdate(new Date());
          
          toast.info(
            `Registro atualizado: ${updatedRecord.queue}`,
            {
              duration: 2000,
            }
          );

          window.dispatchEvent(new CustomEvent('realtimeUpdate', { 
            detail: updatedRecord 
          }));
        }
      )
      .subscribe((status) => {
        console.log('Status da inscrição Realtime:', status);
        if (status === 'SUBSCRIBED') {
          setIsListening(true);
          toast.success('Dashboard em tempo real ativo!', {
            description: 'Métricas serão atualizadas automaticamente',
            duration: 2000,
          });
        }
      });

    return () => {
      console.log('Desconectando do Realtime...');
      supabase.removeChannel(channel);
      setIsListening(false);
    };
  }, []);

  return { 
    isListening, 
    lastUpdate, 
    updateCount 
  };
};
