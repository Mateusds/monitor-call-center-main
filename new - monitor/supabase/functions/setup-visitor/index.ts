import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.79.0";

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

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[SETUP_VISITOR] Creating visitor user...');

    // Verificar se o usuário já existe
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = existingUser?.users.some(u => u.email === 'visitante@sistema.local');

    if (userExists) {
      const existingVisitor = existingUser?.users.find(u => u.email === 'visitante@sistema.local');
      if (existingVisitor) {
        await supabaseAdmin.auth.admin.updateUserById(existingVisitor.id, {
          password: 'visitante'
        });
      }
      return new Response(
        JSON.stringify({ message: 'Usuário Visitante atualizado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: 'visitante@sistema.local',
      password: 'visitante',
      email_confirm: true,
      user_metadata: { nome_completo: 'Visitante' }
    });

    if (createError) {
      console.error('[SETUP_VISITOR] User creation failed');
      return new Response(
        JSON.stringify({ error: 'Erro ao criar usuário' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    await supabaseAdmin.from('profiles').update({
      nome_completo: 'Visitante',
      cargo: 'Visitante',
      requires_password_change: false
    }).eq('id', newUser.user.id);

    await supabaseAdmin.from('user_roles').insert({
      user_id: newUser.user.id,
      role: 'supervisor'
    });

    console.log('[SETUP_VISITOR] Visitor user created successfully');

    return new Response(
      JSON.stringify({ success: true, message: 'Usuário Visitante criado com sucesso' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error('[SETUP_VISITOR] Unexpected error:', error.message);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }, status: 500 }
    );
  }
};

serve(handler);
