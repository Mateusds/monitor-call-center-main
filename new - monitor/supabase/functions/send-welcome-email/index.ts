import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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
const WelcomeEmailSchema = z.object({
  userId: z.string().uuid("ID de usuário inválido"),
  email: z.string().email("Email inválido").max(255),
  name: z.string().min(1, "Nome é obrigatório").max(100).transform(val => {
    // Sanitize HTML to prevent XSS in email
    return val.replace(/[<>]/g, '');
  }),
});

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // REQUIRE authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.log('[SEND_WELCOME_EMAIL] Auth header missing');
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      console.error('[SEND_WELCOME_EMAIL] Auth error');
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify admin role
    const { data: userRoles, error: rolesError } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    if (rolesError || !userRoles?.some(r => r.role === "admin")) {
      console.log('[SEND_WELCOME_EMAIL] User not admin');
      return new Response(
        JSON.stringify({ error: "Apenas administradores podem enviar emails de boas-vindas" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate input
    const rawInput = await req.json();
    const parseResult = WelcomeEmailSchema.safeParse(rawInput);
    
    if (!parseResult.success) {
      console.log('[SEND_WELCOME_EMAIL] Validation error');
      return new Response(
        JSON.stringify({ error: "Dados inválidos" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { userId, email, name } = parseResult.data;

    console.log("[SEND_WELCOME_EMAIL] Sending to:", email);

    const emailResponse = await resend.emails.send({
      from: "Dial Monitor <onboarding@resend.dev>",
      to: [email],
      subject: "Bem-vindo ao Dial Monitor!",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .header h1 { color: white; margin: 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
              .button { display: inline-block; padding: 12px 30px; background: #8B5CF6; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Bem-vindo ao Dial Monitor!</h1>
              </div>
              <div class="content">
                <h2>Olá, ${name}!</h2>
                <p>É um prazer ter você conosco! Sua conta foi criada com sucesso.</p>
                <p>O Dial Monitor é sua plataforma completa para monitoramento e análise de call center em tempo real.</p>
                <p>Você já pode começar a:</p>
                <ul>
                  <li>📊 Visualizar dashboards em tempo real</li>
                  <li>📈 Analisar métricas de desempenho</li>
                  <li>🎯 Identificar oportunidades de melhoria</li>
                  <li>👥 Colaborar com sua equipe</li>
                </ul>
                <p>Se você tiver alguma dúvida ou precisar de ajuda, nossa equipe está pronta para auxiliá-lo.</p>
                <p style="margin-top: 30px;">
                  Atenciosamente,<br>
                  <strong>Equipe Dial Monitor</strong>
                </p>
              </div>
              <div class="footer">
                <p>Este é um email automático. Por favor, não responda.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    // Log audit entry
    await supabaseClient.from("audit_logs").insert({
      user_id: user.id,
      action: "send_welcome_email",
      target_user_id: userId,
      details: { email, name }
    });

    console.log("[SEND_WELCOME_EMAIL] Email sent successfully");

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("[SEND_WELCOME_EMAIL] Unexpected error:", error.message);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...getCorsHeaders(req) },
      }
    );
  }
};

serve(handler);
