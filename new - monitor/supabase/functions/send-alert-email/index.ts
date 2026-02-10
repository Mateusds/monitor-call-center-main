import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.79.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getCorsHeaders, createErrorResponse } from "../_shared/cors.ts";

// Input validation schema
const AlertSchema = z.object({
  type: z.string().max(50),
  title: z.string().max(200).transform(val => val.replace(/[<>]/g, '')),
  description: z.string().max(1000).transform(val => val.replace(/[<>]/g, '')),
  queue: z.string().max(100).optional().transform(val => val?.replace(/[<>]/g, '')),
  metric: z.string().max(100).optional().transform(val => val?.replace(/[<>]/g, '')),
  value: z.number().optional(),
});

const AlertEmailSchema = z.object({
  alerts: z.array(AlertSchema).min(1, "Nenhum alerta fornecido").max(50, "Muitos alertas"),
  recipientEmail: z.string().email("Email do destinatário inválido").max(255),
});

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return createErrorResponse('NOT_AUTHORIZED', 401, corsHeaders);
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !requestingUser) {
      return createErrorResponse('NOT_AUTHORIZED', 401, corsHeaders);
    }

    // Verify admin or supervisor role
    const { data: userRoles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', requestingUser.id);

    if (rolesError || !userRoles?.some(r => r.role === 'admin' || r.role === 'supervisor')) {
      return createErrorResponse('FORBIDDEN', 403, corsHeaders);
    }

    // Validate input
    const rawInput = await req.json();
    const parseResult = AlertEmailSchema.safeParse(rawInput);
    
    if (!parseResult.success) {
      console.error("Validation error:", parseResult.error.errors);
      return createErrorResponse('INVALID_INPUT', 400, corsHeaders);
    }

    const { alerts, recipientEmail } = parseResult.data;
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Erro interno do servidor" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Filtrar apenas alertas críticos
    const criticalAlerts = alerts.filter(alert => alert.type === "critical");

    if (criticalAlerts.length === 0) {
      return new Response(
        JSON.stringify({ message: "Nenhum alerta crítico para enviar" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Construir HTML do email (values are already sanitized by Zod)
    const alertsHtml = criticalAlerts.map(alert => `
      <div style="background: #fee; border-left: 4px solid #dc2626; padding: 16px; margin-bottom: 16px; border-radius: 4px;">
        <h3 style="color: #dc2626; margin: 0 0 8px 0; font-size: 16px;">${alert.title}</h3>
        <p style="margin: 0 0 8px 0; color: #333; font-size: 14px;">${alert.description}</p>
        ${alert.queue ? `<p style="margin: 4px 0; color: #666; font-size: 13px;"><strong>Fila:</strong> ${alert.queue}</p>` : ''}
        ${alert.metric ? `<p style="margin: 4px 0; color: #666; font-size: 13px;"><strong>Métrica:</strong> ${alert.metric}</p>` : ''}
        ${alert.value !== undefined ? `<p style="margin: 4px 0; color: #666; font-size: 13px;"><strong>Valor:</strong> ${alert.value}${alert.metric?.includes("Taxa") ? '%' : ''}</p>` : ''}
      </div>
    `).join('');

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Alertas Críticos - Dashboard de Atendimento</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background: white; padding: 32px; border-radius: 8px; margin-top: 32px; margin-bottom: 32px;">
            <div style="background: linear-gradient(135deg, #5145C0 0%, #7B6FE5 100%); padding: 24px; border-radius: 8px 8px 0 0; margin: -32px -32px 24px -32px;">
              <h1 style="color: white; margin: 0; font-size: 24px;">🚨 Alertas Críticos Detectados</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Dashboard de Atendimento</p>
            </div>

            <p style="color: #333; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
              Foram detectados <strong>${criticalAlerts.length} alerta(s) crítico(s)</strong> que requerem sua atenção imediata.
            </p>

            ${alertsHtml}

            <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin-top: 24px;">
              <p style="margin: 0; color: #666; font-size: 13px;">
                <strong>Ação Recomendada:</strong> Acesse o dashboard para visualizar os detalhes completos e implementar ações corretivas.
              </p>
            </div>

            <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                Este é um email automático do Sistema de Alertas.<br>
                Dashboard de Atendimento - ${new Date().toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Enviar email usando API do Resend
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Dial Monitor <onboarding@resend.dev>",
        to: [recipientEmail],
        subject: `🚨 ${criticalAlerts.length} Alerta(s) Crítico(s) - Ação Requerida`,
        html: emailHtml,
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error("Resend error:", errorText);
      return createErrorResponse('EMAIL_SEND_FAILED', 500, corsHeaders);
    }

    const emailData = await resendResponse.json();
    console.log("Email de alerta enviado com sucesso:", emailData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Email enviado para ${recipientEmail}`,
        alertCount: criticalAlerts.length,
        emailId: emailData.id
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Erro ao enviar email de alerta:", error);
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
