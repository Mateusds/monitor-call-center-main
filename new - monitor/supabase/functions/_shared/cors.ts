// Shared CORS configuration for all edge functions
// Restricts CORS to known origins for better security

const ALLOWED_ORIGINS = [
  'https://axonnnnkmloyyklncsnw.lovableproject.com',
  'https://axonnnnkmloyyklncsnw.supabase.co',
  'http://localhost:8080',
  'http://localhost:5173',
  'http://localhost:3000',
];

export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
  };
}

// Safe error mapping to prevent information leakage
const SAFE_ERROR_MESSAGES: Record<string, string> = {
  'NOT_AUTHORIZED': 'Não autorizado',
  'FORBIDDEN': 'Acesso negado',
  'INVALID_INPUT': 'Dados inválidos fornecidos',
  'USER_CREATION_FAILED': 'Não foi possível criar o usuário',
  'USER_NOT_FOUND': 'Usuário não encontrado',
  'PASSWORD_HISTORY_ERROR': 'Erro ao processar solicitação',
  'PASSWORD_UPDATE_FAILED': 'Erro ao atualizar senha',
  'EMAIL_SEND_FAILED': 'Erro ao enviar email',
  'TOGGLE_STATUS_FAILED': 'Erro ao alterar status do usuário',
  'GET_STATUS_FAILED': 'Erro ao obter status do usuário',
  'LINK_GENERATION_FAILED': 'Erro ao gerar link de acesso',
};

export function getSafeErrorMessage(errorCode: string): string {
  return SAFE_ERROR_MESSAGES[errorCode] || 'Erro interno do servidor';
}

export function createErrorResponse(
  errorCode: string,
  statusCode: number,
  corsHeaders: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({ error: getSafeErrorMessage(errorCode) }),
    { 
      status: statusCode, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}
