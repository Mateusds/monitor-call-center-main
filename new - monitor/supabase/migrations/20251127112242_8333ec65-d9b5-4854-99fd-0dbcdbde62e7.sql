-- Corrigir problemas críticos de segurança

-- 1. Restringir acesso aos registros de chamadas apenas para admin e supervisor
DROP POLICY IF EXISTS "Usuários autenticados podem ler registros" ON public.call_records;

CREATE POLICY "Apenas admin e supervisor podem visualizar registros"
ON public.call_records
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'supervisor'::app_role)
);

-- 2. Remover política INSERT permissiva da password_history
-- Manter apenas a que permite inserção pelo sistema (com true)
-- A política "System can insert password history" já existe e usa WITH CHECK (true)
-- Não há outra política INSERT para remover neste caso

-- 3. Corrigir risco de manipulação do audit_logs
-- Remover política que permite admins inserirem logs diretamente
DROP POLICY IF EXISTS "Sistema pode inserir logs de auditoria" ON public.audit_logs;

-- Criar nova política que permite apenas inserções através de funções do sistema
-- (edge functions com service role key)
CREATE POLICY "Sistema pode inserir logs de auditoria"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (false); -- Bloqueia inserções diretas de usuários

-- Permitir inserções apenas via service role (usado pelas edge functions)
CREATE POLICY "Service role pode inserir logs"
ON public.audit_logs
FOR INSERT
TO service_role
WITH CHECK (true);