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

interface SecurityAlert {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  details: any;
  timestamp: string;
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

    const alerts: SecurityAlert[] = [];
    const now = new Date().toISOString();

    // 1. Verificar tentativas de acesso não autorizado a call_records
    const { data: callRecordsAttempts } = await supabaseAdmin
      .from('audit_logs')
      .select('*')
      .eq('action', 'access_denied_call_records')
      .gte('created_at', new Date(Date.now() - 3600000).toISOString()); // última hora

    if (callRecordsAttempts && callRecordsAttempts.length > 5) {
      alerts.push({
        type: 'unauthorized_access_attempt',
        severity: 'high',
        description: 'Múltiplas tentativas de acesso não autorizado a registros de chamadas',
        details: {
          attempts: callRecordsAttempts.length,
          users: [...new Set(callRecordsAttempts.map(a => a.user_id))]
        },
        timestamp: now
      });
    }

    // 2. Verificar tentativas de manipulação de audit_logs
    const { data: auditAttempts } = await supabaseAdmin
      .from('audit_logs')
      .select('*')
      .eq('action', 'audit_manipulation_attempt')
      .gte('created_at', new Date(Date.now() - 3600000).toISOString());

    if (auditAttempts && auditAttempts.length > 0) {
      alerts.push({
        type: 'audit_manipulation',
        severity: 'critical',
        description: 'Tentativa de manipulação dos logs de auditoria detectada',
        details: {
          attempts: auditAttempts.length,
          users: [...new Set(auditAttempts.map(a => a.user_id))]
        },
        timestamp: now
      });
    }

    // 3. Verificar múltiplas falhas de autenticação (logged server-side only)
    console.log('[SECURITY_MONITOR] Checking auth logs');
    
    // 4. Verificar acessos fora do horário comercial por usuários não-admin
    const currentHour = new Date().getHours();
    if (currentHour < 6 || currentHour > 22) {
      const { data: recentActivity } = await supabaseAdmin
        .from('audit_logs')
        .select('*, user_id')
        .gte('created_at', new Date(Date.now() - 300000).toISOString()) // últimos 5 minutos
        .limit(10);

      if (recentActivity && recentActivity.length > 0) {
        // Verificar se são usuários não-admin
        const nonAdminActivity = [];
        for (const activity of recentActivity) {
          if (activity.user_id) {
            const { data: roles } = await supabaseAdmin
              .from('user_roles')
              .select('role')
              .eq('user_id', activity.user_id)
              .single();
            
            if (roles && roles.role !== 'admin') {
              nonAdminActivity.push(activity);
            }
          }
        }

        if (nonAdminActivity.length > 0) {
          alerts.push({
            type: 'off_hours_access',
            severity: 'medium',
            description: 'Atividade detectada fora do horário comercial por usuários não-admin',
            details: {
              count: nonAdminActivity.length,
              hour: currentHour
            },
            timestamp: now
          });
        }
      }
    }

    // 5. Verificar tentativas de reutilização de senhas antigas
    const { data: passwordAttempts } = await supabaseAdmin
      .from('audit_logs')
      .select('*')
      .eq('action', 'password_reuse_attempt')
      .gte('created_at', new Date(Date.now() - 3600000).toISOString());

    if (passwordAttempts && passwordAttempts.length > 0) {
      alerts.push({
        type: 'password_reuse',
        severity: 'medium',
        description: 'Tentativas de reutilização de senhas antigas detectadas',
        details: {
          attempts: passwordAttempts.length
        },
        timestamp: now
      });
    }

    // Log dos alertas (server-side only, no details leaked)
    console.log(`[SECURITY_MONITOR] ${alerts.length} alerts detected`);
    
    if (alerts.length > 0) {
      // Registrar alertas críticos no audit_log
      for (const alert of alerts.filter(a => a.severity === 'critical' || a.severity === 'high')) {
        await supabaseAdmin
          .from('audit_logs')
          .insert({
            action: `security_alert_${alert.type}`,
            details: alert
          });
      }

      // Buscar emails dos admins para alertas críticos
      const criticalAlerts = alerts.filter(a => a.severity === 'critical');
      if (criticalAlerts.length > 0) {
        console.log('[SECURITY_MONITOR] Critical alerts found, notifying admins');
        
        const { data: adminRoles } = await supabaseAdmin
          .from('user_roles')
          .select('user_id')
          .eq('role', 'admin');

        if (adminRoles && adminRoles.length > 0) {
          const { data: adminProfiles } = await supabaseAdmin
            .from('profiles')
            .select('email, nome_completo')
            .in('id', adminRoles.map(r => r.user_id));

          console.log(`[SECURITY_MONITOR] ${adminProfiles?.length || 0} admins to notify`);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        alerts_count: alerts.length,
        alerts: alerts,
        timestamp: now
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('[SECURITY_MONITOR] Unexpected error:', error.message);
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
