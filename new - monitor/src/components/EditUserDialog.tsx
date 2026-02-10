import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { AvatarUpload } from '@/components/AvatarUpload';
import { toast } from 'sonner';
import { Loader2, Key, UserX, UserCheck } from 'lucide-react';

type AppRole = Database['public']['Enums']['app_role'];

interface UserWithRoles {
  id: string;
  nome_completo: string;
  email: string;
  cargo: string | null;
  avatar_url: string | null;
  roles: string[];
  isActive?: boolean;
}

interface EditUserDialogProps {
  user: UserWithRoles;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserUpdated: () => void;
}

const AVAILABLE_ROLES: { value: AppRole; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'operador', label: 'Operador' },
];

export function EditUserDialog({ user, open, onOpenChange, onUserUpdated }: EditUserDialogProps) {
  const [loading, setLoading] = useState(false);
  const [nomeCompleto, setNomeCompleto] = useState(user.nome_completo);
  const [cargo, setCargo] = useState(user.cargo || '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url || '');
  const [selectedRoles, setSelectedRoles] = useState<AppRole[]>(user.roles as AppRole[]);
  const [isActive, setIsActive] = useState(user.isActive ?? true);
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
  const [showToggleStatusDialog, setShowToggleStatusDialog] = useState(false);

  useEffect(() => {
    setNomeCompleto(user.nome_completo);
    setCargo(user.cargo || '');
    setAvatarUrl(user.avatar_url || '');
    setSelectedRoles(user.roles as AppRole[]);
    setIsActive(user.isActive ?? true);
  }, [user]);

  const handleRoleToggle = (role: AppRole) => {
    setSelectedRoles(prev =>
      prev.includes(role)
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const handleAvatarChange = (url: string) => {
    setAvatarUrl(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nomeCompleto.trim()) {
      toast.error('Nome completo é obrigatório');
      return;
    }

    if (selectedRoles.length === 0) {
      toast.error('Selecione pelo menos uma permissão');
      return;
    }

    try {
      setLoading(true);

      // Atualizar perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          nome_completo: nomeCompleto.trim(),
          cargo: cargo.trim() || null,
          avatar_url: avatarUrl || null,
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Buscar roles atuais
      const { data: currentRoles, error: fetchError } = await supabase
        .from('user_roles')
        .select('id, role')
        .eq('user_id', user.id);

      if (fetchError) throw fetchError;

      const currentRoleValues = currentRoles.map(r => r.role as AppRole);

      // Determinar roles para adicionar e remover
      const rolesToAdd = selectedRoles.filter(r => !currentRoleValues.includes(r));
      const rolesToRemove = currentRoles.filter(r => !selectedRoles.includes(r.role as AppRole));

      // Adicionar novas roles
      if (rolesToAdd.length > 0) {
        const { error: insertError } = await supabase
          .from('user_roles')
          .insert(rolesToAdd.map(role => ({ user_id: user.id, role })));

        if (insertError) throw insertError;
      }

      // Remover roles antigas
      if (rolesToRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from('user_roles')
          .delete()
          .in('id', rolesToRemove.map(r => r.id));

        if (deleteError) throw deleteError;
      }

      toast.success('Usuário atualizado com sucesso');
      onUserUpdated();
    } catch (error: any) {
      console.error('Erro ao atualizar usuário:', error);
      toast.error(error.message || 'Erro ao atualizar usuário');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('reset-password', {
        body: { userId: user.id, email: user.email }
      });

      if (error) throw error;

      toast.success('Senha resetada! Email enviado ao usuário.');
      setShowResetPasswordDialog(false);
    } catch (error: any) {
      console.error('Erro ao resetar senha:', error);
      toast.error(error.message || 'Erro ao resetar senha');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserStatus = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('toggle-user-status', {
        body: { 
          userId: user.id,
          activate: !isActive
        }
      });

      if (error) throw error;

      setIsActive(!isActive);
      toast.success(isActive ? 'Usuário desativado' : 'Usuário ativado');
      setShowToggleStatusDialog(false);
      onUserUpdated();
    } catch (error: any) {
      console.error('Erro ao alterar status:', error);
      toast.error(error.message || 'Erro ao alterar status do usuário');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Editar Usuário</DialogTitle>
                <DialogDescription>
                  Atualize as informações e permissões do usuário
                </DialogDescription>
              </div>
              <Badge variant={isActive ? "default" : "destructive"}>
                {isActive ? "Ativo" : "Desativado"}
              </Badge>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <AvatarUpload
              currentAvatarUrl={avatarUrl}
              userId={user.id}
              userName={nomeCompleto}
              onAvatarChange={handleAvatarChange}
            />

            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo *</Label>
              <Input
                id="nome"
                value={nomeCompleto}
                onChange={(e) => setNomeCompleto(e.target.value)}
                placeholder="Digite o nome completo"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={user.email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                O email não pode ser alterado
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cargo">Cargo</Label>
              <Input
                id="cargo"
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                placeholder="Ex: Gerente, Analista, etc."
              />
            </div>

            <div className="space-y-3">
              <Label>Permissões *</Label>
              <div className="space-y-2">
                {AVAILABLE_ROLES.map((role) => (
                  <div key={role.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={role.value}
                      checked={selectedRoles.includes(role.value)}
                      onCheckedChange={() => handleRoleToggle(role.value)}
                    />
                    <Label
                      htmlFor={role.value}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {role.label}
                    </Label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Selecione as permissões que o usuário terá no sistema
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowResetPasswordDialog(true)}
                  disabled={loading}
                  className="flex-1 gap-2"
                  size="sm"
                >
                  <Key className="h-4 w-4" />
                  Resetar Senha
                </Button>
                <Button
                  type="button"
                  variant={isActive ? "destructive" : "default"}
                  onClick={() => setShowToggleStatusDialog(true)}
                  disabled={loading}
                  className="flex-1 gap-2"
                  size="sm"
                >
                  {isActive ? (
                    <>
                      <UserX className="h-4 w-4" />
                      Desativar
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-4 w-4" />
                      Ativar
                    </>
                  )}
                </Button>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="flex-1"
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showResetPasswordDialog} onOpenChange={setShowResetPasswordDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resetar Senha</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja resetar a senha de <strong>{user.nome_completo}</strong>? 
              Um email será enviado para <strong>{user.email}</strong> com uma nova senha temporária.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetPassword} disabled={loading}>
              {loading ? "Resetando..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showToggleStatusDialog} onOpenChange={setShowToggleStatusDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isActive ? "Desativar Usuário" : "Ativar Usuário"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isActive ? (
                <>
                  Tem certeza que deseja desativar <strong>{user.nome_completo}</strong>? 
                  O usuário não poderá mais fazer login no sistema até ser reativado.
                </>
              ) : (
                <>
                  Tem certeza que deseja ativar <strong>{user.nome_completo}</strong>? 
                  O usuário poderá fazer login normalmente no sistema.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleUserStatus} disabled={loading}>
              {loading ? "Processando..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
