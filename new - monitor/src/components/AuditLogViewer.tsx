import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Shield, Clock, User, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  target_user_id: string | null;
  details: any;
  created_at: string;
  user_profile?: {
    nome_completo: string;
    email: string;
  };
  target_profile?: {
    nome_completo: string;
    email: string;
  };
}

export function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      
      const { data: logsData, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Manually fetch user profiles for each log
      const logsWithProfiles = await Promise.all(
        (logsData || []).map(async (log) => {
          let user_profile = null;
          let target_profile = null;

          if (log.user_id) {
            const { data: userProfile } = await supabase
              .from('profiles')
              .select('nome_completo, email')
              .eq('id', log.user_id)
              .single();
            user_profile = userProfile;
          }

          if (log.target_user_id) {
            const { data: targetProfile } = await supabase
              .from('profiles')
              .select('nome_completo, email')
              .eq('id', log.target_user_id)
              .single();
            target_profile = targetProfile;
          }

          return {
            ...log,
            user_profile,
            target_profile,
          };
        })
      );

      setLogs(logsWithProfiles);
    } catch (error: any) {
      console.error('Erro ao buscar logs:', error);
      toast.error('Erro ao carregar logs de auditoria');
    } finally {
      setLoading(false);
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      'update_profile': 'Perfil Atualizado',
      'update_roles': 'Permissões Alteradas',
      'send_welcome_email': 'Email de Boas-Vindas',
      'reset_password_request': 'Redefinição de Senha',
    };
    return labels[action] || action;
  };

  const getActionVariant = (action: string): "default" | "secondary" | "outline" => {
    if (action.includes('update')) return 'secondary';
    if (action.includes('email')) return 'outline';
    return 'default';
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Histórico de Auditoria</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Registro completo de alterações e ações administrativas
      </p>

      <ScrollArea className="h-[600px]">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Data/Hora
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Usuário
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Ação
                  </div>
                </TableHead>
                <TableHead>Alvo</TableHead>
                <TableHead>Detalhes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhum registro de auditoria encontrado
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-xs">
                      {new Date(log.created_at).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {log.user_profile?.nome_completo || 'Sistema'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {log.user_profile?.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getActionVariant(log.action)}>
                        {getActionLabel(log.action)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {log.target_profile ? (
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {log.target_profile.nome_completo}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {log.target_profile.email}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {log.details && (
                        <pre className="text-xs bg-muted p-2 rounded max-w-xs overflow-x-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </ScrollArea>
    </Card>
  );
}
