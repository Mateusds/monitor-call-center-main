import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { LogOut, User, Shield, Eye } from 'lucide-react';

export function UserProfile() {
  const { profile, signOut, isAdmin, isSupervisor, isOperador } = useAuth();

  if (!profile) return null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleIcon = () => {
    if (isAdmin()) return <Shield className="w-3 h-3" />;
    if (isSupervisor()) return <Eye className="w-3 h-3" />;
    return <User className="w-3 h-3" />;
  };

  const getRoleLabel = () => {
    if (isAdmin()) return 'Admin';
    if (isSupervisor()) return 'Supervisor';
    return 'Operador';
  };

  const getRoleVariant = () => {
    if (isAdmin()) return 'default';
    if (isSupervisor()) return 'secondary';
    return 'outline';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage src={profile.avatar_url || undefined} alt={profile.nome_completo} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {getInitials(profile.nome_completo)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2">
            <p className="text-sm font-medium leading-none">{profile.nome_completo}</p>
            <p className="text-xs leading-none text-muted-foreground">{profile.email}</p>
            {profile.cargo && (
              <p className="text-xs leading-none text-muted-foreground">{profile.cargo}</p>
            )}
            <Badge variant={getRoleVariant()} className="w-fit text-xs">
              <span className="mr-1">{getRoleIcon()}</span>
              {getRoleLabel()}
            </Badge>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}