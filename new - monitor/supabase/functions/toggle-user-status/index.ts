import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.79.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// CORS configuration - restrict to known origins
const ALLOWED_ORIGINS = [
  'https://axonnnnkmloyyklncsnw.lovableproject.com',
  'https://axonnnnkmloyyklncsnw.supabase.co',
  'http://localhost:8080',
  'http://localhost:5173',
  'http://localhost:3000',
];

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Credentials': 'true',
  };
}

// Input validation schema
const ToggleStatusSchema = z.object({
  userId: z.string().uuid("ID de usuário inválido"),
  activate: z.boolean(),
});

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log('[TOGGLE_STATUS] Auth header missing');
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !requestingUser) {
      console.error('[TOGGLE_STATUS] Auth error');
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se é admin
    const { data: userRoles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', requestingUser.id);

    if (rolesError || !userRoles?.some(r => r.role === 'admin')) {
      console.log('[TOGGLE_STATUS] User not admin');
      return new Response(
        JSON.stringify({ error: 'Apenas administradores podem alterar status de usuários' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate input
    const rawInput = await req.json();
    const parseResult = ToggleStatusSchema.safeParse(rawInput);
    
    if (!parseResult.success) {
      console.log('[TOGGLE_STATUS] Validation error');
      return new Response(
        JSON.stringify({ error: 'Dados inválidos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { userId, activate } = parseResult.data;

    console.log(`[TOGGLE_STATUS] ${activate ? 'Activating' : 'Deactivating'} user: ${userId}`);

    // Ativar ou desativar usuário usando Admin API
    if (activate) {
      // Remover ban (ativar usuário)
      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        ban_duration: 'none'
      });

      if (error) {
        console.error('[TOGGLE_STATUS] Activate failed');
        return new Response(
          JSON.stringify({ error: 'Erro ao alterar status do usuário' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      // Adicionar ban indefinido (desativar usuário)
      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        ban_duration: '876000h' // ~100 anos
      });

      if (error) {
        console.error('[TOGGLE_STATUS] Deactivate failed');
        return new Response(
          JSON.stringify({ error: 'Erro ao alterar status do usuário' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Registrar no log de auditoria
    await supabaseAdmin.from('audit_logs').insert({
      user_id: requestingUser.id,
      action: activate ? 'activate_user' : 'deactivate_user',
      target_user_id: userId,
      details: {
        activated: activate
      }
    });

    console.log(`[TOGGLE_STATUS] User ${activate ? 'activated' : 'deactivated'} successfully`);

    return new Response(
      JSON.stringify({ 
        success: true,
        active: activate
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('[TOGGLE_STATUS] Unexpected error:', error.message);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { 
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
};

serve(handler);
