import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.79.0";
import { Resend } from "https://esm.sh/resend@2.0.0";
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
const ResetPasswordSchema = z.object({
  email: z.string().email("Email inválido").max(255),
  userId: z.string().uuid("ID de usuário inválido"),
});

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verificar autenticação do solicitante
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log('[RESET_PASSWORD] Auth header missing');
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !requestingUser) {
      console.error('[RESET_PASSWORD] Auth error');
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
      console.log('[RESET_PASSWORD] User not admin');
      return new Response(
        JSON.stringify({ error: 'Apenas administradores podem resetar senhas' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate input
    const rawInput = await req.json();
    const parseResult = ResetPasswordSchema.safeParse(rawInput);
    
    if (!parseResult.success) {
      console.log('[RESET_PASSWORD] Validation error');
      return new Response(
        JSON.stringify({ error: 'Dados inválidos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { email, userId } = parseResult.data;

    console.log(`[RESET_PASSWORD] Resetting password for: ${email}`);

    // Generate password reset link instead of temp password
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
    });

    if (linkError) {
      console.error('[RESET_PASSWORD] Link generation failed');
      return new Response(
        JSON.stringify({ error: 'Erro ao gerar link de redefinição' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar nome do usuário
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('nome_completo')
      .eq('id', userId)
      .single();

    // Mark user to change password on next login
    await supabaseAdmin
      .from('profiles')
      .update({ requires_password_change: true })
      .eq('id', userId);

    // Enviar email com link para redefinir senha
    const resend = new Resend(resendApiKey);
    const resetLink = linkData?.properties?.action_link;
    
    await resend.emails.send({
      from: 'Sistema <onboarding@resend.dev>',
      to: [email],
      subject: 'Redefinição de Senha',
      html: `
        <h1>Redefinição de Senha</h1>
        <p>Olá ${profile?.nome_completo || 'Usuário'},</p>
        <p>Sua senha foi redefinida por um administrador.</p>
        <p>Clique no link abaixo para criar uma nova senha:</p>
        <p><a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #8B5CF6; color: white; text-decoration: none; border-radius: 6px;">Redefinir Minha Senha</a></p>
        <p style="color: #666; font-size: 14px;">Este link expira em 24 horas.</p>
        <p style="color: #999; font-size: 12px;">Se você não solicitou esta redefinição, entre em contato com o administrador.</p>
      `
    });

    // Registrar no log de auditoria
    await supabaseAdmin.from('audit_logs').insert({
      user_id: requestingUser.id,
      action: 'reset_password',
      target_user_id: userId,
      details: {
        email
      }
    });

    console.log(`[RESET_PASSWORD] Reset link sent to: ${email}`);

    return new Response(
      JSON.stringify({ message: 'Link de redefinição enviado por email' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('[RESET_PASSWORD] Unexpected error:', error.message);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      {
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
