-- Adicionar coluna para controlar troca de senha obrigatória
ALTER TABLE public.profiles 
ADD COLUMN requires_password_change BOOLEAN DEFAULT false;

-- Atualizar trigger para marcar usuários corretamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome_completo, email, requires_password_change)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome_completo', 'Usuário'),
    NEW.email,
    false  -- Usuários que se auto-registram não precisam trocar senha
  );
  
  -- Primeiro usuário é admin, demais são operadores
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    CASE 
      WHEN (SELECT COUNT(*) FROM auth.users) = 1 THEN 'admin'::app_role
      ELSE 'operador'::app_role
    END
  );
  
  RETURN NEW;
END;
$$;