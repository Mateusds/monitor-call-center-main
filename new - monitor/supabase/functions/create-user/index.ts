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
const CreateUserSchema = z.object({
  email: z.string().email("Email inválido").max(255, "Email muito longo"),
  nomeCompleto: z.string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(100, "Nome muito longo")
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, "Nome contém caracteres inválidos")
    .transform(val => val.trim().replace(/[<>]/g, '')),
  cargo: z.string().max(100, "Cargo muito longo").optional().transform(val => val?.trim().replace(/[<>]/g, '')),
  roles: z.array(z.enum(['admin', 'supervisor', 'operador'])).min(1, "Pelo menos uma permissão é obrigatória").max(3),
});

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY')!;

    // Criar cliente Supabase com service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verificar autenticação do usuário que está criando
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log('[CREATE_USER] Auth header missing');
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !requestingUser) {
      console.error('[CREATE_USER] Auth error:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se o usuário solicitante é admin
    const { data: userRoles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', requestingUser.id);

    if (rolesError || !userRoles?.some(r => r.role === 'admin')) {
      console.log('[CREATE_USER] User not admin:', requestingUser.id);
      return new Response(
        JSON.stringify({ error: 'Apenas administradores podem criar usuários' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate input
    const rawInput = await req.json();
    const parseResult = CreateUserSchema.safeParse(rawInput);
    
    if (!parseResult.success) {
      console.log('[CREATE_USER] Validation error');
      return new Response(
        JSON.stringify({ error: 'Dados inválidos', details: parseResult.error.errors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { email, nomeCompleto, cargo, roles } = parseResult.data;

    console.log(`[CREATE_USER] Creating user: ${email}`);

    // Gerar senha temporária forte (usada apenas internamente)
    const tempPassword = crypto.randomUUID() + crypto.randomUUID();

    // Criar usuário no Supabase Auth
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        nome_completo: nomeCompleto
      }
    });

    if (createError) {
      console.error('[CREATE_USER] User creation failed:', createError.code);
      return new Response(
        JSON.stringify({ error: 'Não foi possível criar o usuário' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[CREATE_USER] User created with ID: ${newUser.user.id}`);

    // Atualizar perfil e marcar para trocar senha
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        nome_completo: nomeCompleto,
        cargo: cargo || null,
        requires_password_change: true
      })
      .eq('id', newUser.user.id);

    if (profileError) {
      console.error('[CREATE_USER] Profile update failed');
    }

    // Inserir roles
    const roleInserts = roles.map(role => ({
      user_id: newUser.user.id,
      role
    }));

    const { error: rolesInsertError } = await supabaseAdmin
      .from('user_roles')
      .insert(roleInserts);

    if (rolesInsertError) {
      console.error('[CREATE_USER] Roles insert failed');
      return new Response(
        JSON.stringify({ error: 'Erro ao atribuir permissões' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate password reset link instead of sending temp password
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
    });

    if (linkError) {
      console.error('[CREATE_USER] Link generation failed');
      // Don't fail user creation, but log it
    }

    // Registrar no log de auditoria
    await supabaseAdmin.from('audit_logs').insert({
      user_id: requestingUser.id,
      action: 'create_user',
      target_user_id: newUser.user.id,
      details: {
        email,
        nome_completo: nomeCompleto,
        cargo,
        roles
      }
    });

    // Enviar email de boas-vindas com link para definir senha
    const resend = new Resend(resendApiKey);
    const appUrl = supabaseUrl.replace('.supabase.co', '.lovableproject.com');
    
    // Use the magic link from Supabase or create a custom reset flow
    const resetLink = linkData?.properties?.action_link || `${appUrl}/auth?mode=reset`;
    
    try {
      await resend.emails.send({
        from: 'Sistema <onboarding@resend.dev>',
        to: [email],
        subject: 'Bem-vindo ao Sistema!',
        html: `
          <h1>Bem-vindo, ${nomeCompleto}!</h1>
          <p>Sua conta foi criada com sucesso.</p>
          <p><strong>Email:</strong> ${email}</p>
          <p>Para acessar o sistema, clique no link abaixo para definir sua senha:</p>
          <p><a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #8B5CF6; color: white; text-decoration: none; border-radius: 6px;">Definir Minha Senha</a></p>
          <p style="color: #666; font-size: 14px;">Este link expira em 24 horas.</p>
          <p>Suas permissões: ${roles.join(', ')}</p>
        `
      });
      console.log('[CREATE_USER] Welcome email sent');
    } catch (emailError) {
      console.error('[CREATE_USER] Email send failed');
      // Don't fail user creation if email fails
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        userId: newUser.user.id
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('[CREATE_USER] Unexpected error:', error.message);
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
