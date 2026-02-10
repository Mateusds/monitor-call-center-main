import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.79.0";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";
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

// Input validation schema with password complexity requirements
const ChangePasswordSchema = z.object({
  newPassword: z.string()
    .min(8, "A senha deve ter pelo menos 8 caracteres")
    .max(128, "A senha deve ter no máximo 128 caracteres")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
      "A senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número"
    ),
});

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log('[CHANGE_PASSWORD] Auth header missing');
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      console.error('[CHANGE_PASSWORD] Auth error');
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate input
    const rawInput = await req.json();
    const parseResult = ChangePasswordSchema.safeParse(rawInput);
    
    if (!parseResult.success) {
      console.log('[CHANGE_PASSWORD] Validation error');
      const errorMessage = parseResult.error.errors.map(e => e.message).join('. ');
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { newPassword } = parseResult.data;

    // Hash the new password
    const newPasswordHash = await bcrypt.hash(newPassword);

    // Check password history (last 5 passwords)
    const { data: passwordHistory, error: historyError } = await supabaseAdmin
      .from('password_history')
      .select('password_hash')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (historyError) {
      console.error('[CHANGE_PASSWORD] History fetch failed');
      return new Response(
        JSON.stringify({ error: 'Erro ao processar solicitação' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if new password matches any of the last 5 passwords
    if (passwordHistory && passwordHistory.length > 0) {
      for (const entry of passwordHistory) {
        const isMatch = await bcrypt.compare(newPassword, entry.password_hash);
        if (isMatch) {
          return new Response(
            JSON.stringify({ error: 'Você não pode reutilizar uma das últimas 5 senhas' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // Update password in Supabase Auth
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) {
      console.error('[CHANGE_PASSWORD] Password update failed');
      return new Response(
        JSON.stringify({ error: 'Erro ao atualizar senha' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Store new password hash in history
    const { error: insertError } = await supabaseAdmin
      .from('password_history')
      .insert({
        user_id: user.id,
        password_hash: newPasswordHash
      });

    if (insertError) {
      console.error('[CHANGE_PASSWORD] History insert failed');
      // Don't fail the password change if history storage fails
    }

    // Update requires_password_change flag if set
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ requires_password_change: false })
      .eq('id', user.id);

    if (profileError) {
      console.error('[CHANGE_PASSWORD] Profile update failed');
    }

    // Log the action
    await supabaseAdmin.from('audit_logs').insert({
      user_id: user.id,
      action: 'change_password',
      details: {
        timestamp: new Date().toISOString()
      }
    });

    console.log('[CHANGE_PASSWORD] Password changed successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Senha alterada com sucesso'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('[CHANGE_PASSWORD] Unexpected error:', error.message);
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
