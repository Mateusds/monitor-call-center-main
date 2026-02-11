import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Counter } from '@/components/ui/counter';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const DASHBOARD_URL = '/api/take-blip/dashboard';
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds
const AUTO_REFRESH_INTERVAL = 30000; // 30 seconds

interface BlipTicketSummary {
  waiting: number;
  open: number;
  closed: number;
  closedAttendant: number;
  closedClient: number;
  transferred: number;
  missed: number;
  inAttendance: number;
}

interface BlipMetrics {
  maxQueueTime: string;
  maxFirstResponseTime: string;
  maxWithoutFirstResponseTime: string;
  avgQueueTime: string;
  avgFirstResponseTime: string;
  avgWaitTime: string;
  avgResponseTime: string;
  avgAttendanceTime: string;
  ticketsPerAttendant: string;
}

interface BlipTeamItem {
  name: string;
  waitingTickets: number;
  openedTickets: number;
  closedTickets: number;
  averageWaitTime?: string;
  averageAttendanceTime?: string;
  averageResponseTime?: string;
  ticketsCount?: number;
}

interface BlipWaitingItem {
  id: string;
  sequentialId: number;
  agentName?: string;
  customerName?: string;
  team?: string;
  queueTime?: string;
  priority?: number;
}

interface BlipDashboardResponse {
  tickets: BlipTicketSummary;
  metrics: BlipMetrics;
  teams?: {
    total: number;
    items: BlipTeamItem[];
  };
  waiting?: {
    total: number;
    items: BlipWaitingItem[];
  };
}

// Fallback mock data for when API is unavailable
const getFallbackData = (): BlipDashboardResponse => ({
  tickets: {
    waiting: 12,
    open: 8,
    closed: 156,
    closedAttendant: 142,
    closedClient: 14,
    transferred: 3,
    missed: 2,
    inAttendance: 5
  },
  metrics: {
    maxQueueTime: '00:15:30',
    maxFirstResponseTime: '00:08:45',
    maxWithoutFirstResponseTime: '00:25:12',
    avgQueueTime: '00:02:15',
    avgFirstResponseTime: '00:01:30',
    avgWaitTime: '00:03:45',
    avgResponseTime: '00:02:20',
    avgAttendanceTime: '00:05:12',
    ticketsPerAttendant: '12.5'
  },
  teams: {
    total: 3,
    items: [
      {
        name: 'Suporte Técnico',
        waitingTickets: 5,
        openedTickets: 3,
        closedTickets: 89,
        averageWaitTime: '00:02:30',
        averageAttendanceTime: '00:06:15',
        averageResponseTime: '00:02:45'
      },
      {
        name: 'Vendas',
        waitingTickets: 4,
        openedTickets: 2,
        closedTickets: 45,
        averageWaitTime: '00:01:45',
        averageAttendanceTime: '00:04:30',
        averageResponseTime: '00:01:20'
      },
      {
        name: 'Financeiro',
        waitingTickets: 3,
        openedTickets: 3,
        closedTickets: 22,
        averageWaitTime: '00:02:00',
        averageAttendanceTime: '00:05:00',
        averageResponseTime: '00:02:10'
      }
    ]
  },
  waiting: {
    total: 12,
    items: [
      {
        id: '1',
        sequentialId: 1001,
        customerName: 'João Silva',
        team: 'Suporte Técnico',
        queueTime: '00:03:15',
        priority: 1
      },
      {
        id: '2',
        sequentialId: 1002,
        customerName: 'Maria Santos',
        team: 'Vendas',
        queueTime: '00:01:45',
        priority: 2
      }
    ]
  }
});

interface TicketPieCardProps {
  label: string;
  value: number;
  percent: number;
  color: string;
}

function TicketPieCard({ label, value, percent, color }: TicketPieCardProps) {
  const safePercent = Math.max(0, Math.min(100, Number.isFinite(percent) ? percent : 0));

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div
            className="relative h-16 w-16 rounded-full"
            style={{
              background: `conic-gradient(${color} ${safePercent}%, rgba(148, 163, 184, 0.25) ${safePercent}% 100%)`,
            }}
          >
            <div className="absolute inset-[8px] rounded-full bg-card" />
            <div className="absolute inset-0 flex items-center justify-center text-lg font-bold" style={{ color }}>
              <Counter value={value} />
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-xs text-muted-foreground">{safePercent.toFixed(1)}%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function TakeBlipIntegrationView() {
  const [data, setData] = useState<BlipDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const isFetchingRef = useRef(false);

  const loadData = useCallback(async (retryCount = 0) => {
    if (isFetchingRef.current) return;

    isFetchingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      console.log(`🔄 Tentando carregar dados da API (tentativa ${retryCount + 1}/${MAX_RETRIES})...`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(DASHBOARD_URL, { 
        cache: 'no-store',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        }
      });

      clearTimeout(timeoutId);

      console.log('📡 Resposta da API:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        throw new Error(`Falha ao consultar API (${response.status} ${response.statusText})`);
      }

      const json = (await response.json()) as BlipDashboardResponse;
      setData(json);
      setLastUpdate(new Date());
      setIsUsingFallback(false);
      console.log('✅ Dados carregados com sucesso:', json);
    } catch (err: any) {
      console.error('❌ Erro ao buscar dashboard Take Blip:', err);
      
      // Retry logic
      if (retryCount < MAX_RETRIES - 1 && 
          (err.name === 'TypeError' || err.name === 'AbortError' || err.message.includes('fetch'))) {
        console.log(`🔄 Tentando novamente em ${RETRY_DELAY}ms...`);
        setTimeout(() => loadData(retryCount + 1), RETRY_DELAY);
        return;
      }
      
      const errorMessage = err.name === 'AbortError' 
        ? 'Timeout ao conectar com a API (10s)'
        : err?.message || 'Erro desconhecido ao consultar API';
      
      setError(errorMessage);
      
      // Use fallback data after all retries fail
      console.log('📊 Usando dados de fallback após falha da API...');
      const fallbackData = getFallbackData();
      setData(fallbackData);
      setLastUpdate(new Date());
      setIsUsingFallback(true);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  const handleRetry = () => loadData();
  
  const handleRefresh = () => loadData();

  useEffect(() => {
    loadData();

    const intervalId = setInterval(() => {
      loadData();
    }, AUTO_REFRESH_INTERVAL);

    return () => clearInterval(intervalId);
  }, [loadData]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-destructive gap-4">
        <AlertCircle className="w-12 h-12" />
        <div className="text-lg font-bold">Erro ao carregar Integracao Take Blip</div>
        <div className="text-sm font-mono bg-muted p-2 rounded max-w-lg text-center break-words">{error}</div>
        <Button onClick={handleRetry} variant="outline">Tentar Novamente</Button>
      </div>
    );
  }

  if (!data) return <div>Sem dados da API.</div>;

  const teamItems = data.teams?.items || [];
  const visibleTeams = teamItems.filter((team) => {
    const normalizedName = (team.name || '').trim().toLowerCase();
    return normalizedName === 'default' || normalizedName === 'financeiro';
  });
  const waitingItems = data.waiting?.items || [];
  const ticketsTotal = data.tickets.waiting + data.tickets.open + data.tickets.inAttendance + data.tickets.closed + data.tickets.transferred;
  const getTicketPercent = (value: number) => (ticketsTotal > 0 ? (value / ticketsTotal) * 100 : 0);

  const metricList = [
    { label: 'Tempo maximo de fila', value: data.metrics.maxQueueTime },
    { label: 'Tempo maximo da 1a resposta', value: data.metrics.maxFirstResponseTime },
    { label: 'Tempo maximo sem 1a resposta', value: data.metrics.maxWithoutFirstResponseTime },
    { label: 'Tempo medio de fila', value: data.metrics.avgQueueTime },
    { label: 'Tempo medio da 1a resposta', value: data.metrics.avgFirstResponseTime },
    { label: 'Tempo medio de espera', value: data.metrics.avgWaitTime },
    { label: 'Tempo medio de resposta', value: data.metrics.avgResponseTime },
    { label: 'Tempo medio de atendimento', value: data.metrics.avgAttendanceTime },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Integracao Take Blip</h1>
          <p className="text-sm text-muted-foreground">Dados em tempo real da API de dashboard</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50">
          <Button onClick={handleRefresh} variant="ghost" size="sm" className="h-8 w-8 p-0">
            <RefreshCw className={`w-4 h-4 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <div className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-500' : isUsingFallback ? 'bg-orange-500' : 'bg-green-500'} animate-pulse`} />
          <span className="text-sm">
            {loading ? 'Atualizando...' : isUsingFallback ? 'Modo Offline' : 'Online'}
            {lastUpdate ? ` - ${lastUpdate.toLocaleTimeString('pt-BR')}` : ''}
          </span>
        </div>
      </div>

      <div className={`p-4 rounded-lg border ${isUsingFallback ? 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800' : 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'}`}>
        <div className="flex items-center gap-2">
          <AlertCircle className={`w-4 h-4 ${isUsingFallback ? 'text-orange-600 dark:text-orange-400' : 'text-blue-600 dark:text-blue-400'}`} />
          <span className={`text-sm ${isUsingFallback ? 'text-orange-700 dark:text-orange-300' : 'text-blue-700 dark:text-blue-300'}`}>
            {isUsingFallback ? (
              <>
                <strong>Modo Offline:</strong> Usando dados de demonstração. API <strong>{DASHBOARD_URL}</strong> indisponível.
              </>
            ) : (
              <>
                Dados sendo atualizados em <strong>tempo real da Take Blip</strong>.
              </>
            )}
          </span>
        </div>
        {error && (
          <div className="mt-2 text-xs text-red-600 dark:text-red-400 font-mono bg-red-50 dark:bg-red-950/20 p-2 rounded">
            Erro: {error}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <TicketPieCard label="Aguardando" value={data.tickets.waiting} percent={getTicketPercent(data.tickets.waiting)} color="#f59e0b" />
        <TicketPieCard label="Em aberto" value={data.tickets.open} percent={getTicketPercent(data.tickets.open)} color="#3b82f6" />
        <TicketPieCard label="Em atendimento" value={data.tickets.inAttendance} percent={getTicketPercent(data.tickets.inAttendance)} color="#06b6d4" />
        <TicketPieCard label="Finalizados" value={data.tickets.closed} percent={getTicketPercent(data.tickets.closed)} color="#22c55e" />
        <TicketPieCard label="Transferidos" value={data.tickets.transferred} percent={getTicketPercent(data.tickets.transferred)} color="#f97316" />
      </div>

      <Card className="overflow-hidden border border-[#1d3a72]/60 bg-gradient-to-b from-[#06142e] to-[#071632] shadow-[0_0_0_1px_rgba(23,52,104,0.35),0_18px_40px_rgba(2,8,23,0.45)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-3xl font-semibold tracking-tight text-slate-100">Metricas de tempo</CardTitle>
            </CardHeader>
            <CardContent className="pt-1">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {metricList.map((item) => (
                  <div key={item.label} className="rounded-lg border border-[#1b3668] bg-[#0a2047]/65 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-300">{item.label}</p>
                    <p className="text-lg font-semibold font-mono mt-2 text-slate-100">{item.value || '-'}</p>
                  </div>
                ))}
                <div className="rounded-lg border border-[#1b3668] bg-[#0a2047]/65 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-300">Tickets por atendente</p>
                  <p className="text-lg font-semibold font-mono mt-2 text-slate-100">
                    {Number(data.metrics.ticketsPerAttendant).toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
      </Card>

      <Card className="overflow-hidden border border-[#1d3a72]/60 bg-gradient-to-b from-[#06142e] to-[#071632] shadow-[0_0_0_1px_rgba(23,52,104,0.35),0_18px_40px_rgba(2,8,23,0.45)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-3xl font-semibold tracking-tight text-slate-100">
                Resumo por fila ({visibleTeams.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-1">
              <div className="overflow-x-auto">
                <Table className="min-w-[980px]">
                <TableHeader>
                  <TableRow className="border-b border-[#1b3668] hover:bg-transparent">
                    <TableHead className="whitespace-nowrap px-5 py-4 text-center text-sm font-medium text-slate-300">Fila</TableHead>
                    <TableHead className="whitespace-nowrap px-5 py-4 text-center text-sm font-medium text-slate-300">Aguardando</TableHead>
                    <TableHead className="whitespace-nowrap px-5 py-4 text-center text-sm font-medium text-slate-300">Abertos</TableHead>
                    <TableHead className="whitespace-nowrap px-5 py-4 text-center text-sm font-medium text-slate-300">Fechados</TableHead>
                    <TableHead className="whitespace-nowrap px-5 py-4 text-center text-sm font-medium text-slate-300">Tempo medio espera</TableHead>
                    <TableHead className="whitespace-nowrap px-5 py-4 text-center text-sm font-medium text-slate-300">Tempo medio atendimento</TableHead>
                    <TableHead className="whitespace-nowrap px-5 py-4 text-center text-sm font-medium text-slate-300">Tempo medio resposta</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleTeams.map((team) => (
                    <TableRow key={team.name} className="border-b border-[#17305f] text-slate-100 transition-colors hover:bg-[#0d2149]/45 last:border-0">
                      <TableCell className="whitespace-nowrap px-5 py-5 text-center font-medium">{team.name}</TableCell>
                      <TableCell className="whitespace-nowrap px-5 py-5 text-center"><Counter value={team.waitingTickets || 0} /></TableCell>
                      <TableCell className="whitespace-nowrap px-5 py-5 text-center"><Counter value={team.openedTickets || 0} /></TableCell>
                      <TableCell className="whitespace-nowrap px-5 py-5 text-center"><Counter value={team.closedTickets || 0} /></TableCell>
                      <TableCell className="whitespace-nowrap px-5 py-5 text-center font-mono">{team.averageWaitTime || '-'}</TableCell>
                      <TableCell className="whitespace-nowrap px-5 py-5 text-center font-mono">{team.averageAttendanceTime || '-'}</TableCell>
                      <TableCell className="whitespace-nowrap px-5 py-5 text-center font-mono">{team.averageResponseTime || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                </Table>
              </div>
            </CardContent>
      </Card>

      <Card className="overflow-hidden border border-[#1d3a72]/60 bg-gradient-to-b from-[#06142e] to-[#071632] shadow-[0_0_0_1px_rgba(23,52,104,0.35),0_18px_40px_rgba(2,8,23,0.45)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-3xl font-semibold tracking-tight text-slate-100">
                Tickets aguardando ({data.waiting?.total || waitingItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-1">
              {waitingItems.length === 0 ? (
                <p className="text-sm text-slate-300">Nenhum ticket aguardando no momento.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table className="min-w-[920px]">
                    <TableHeader>
                      <TableRow className="border-b border-[#1b3668] hover:bg-transparent">
                        <TableHead className="whitespace-nowrap px-5 py-4 text-center text-sm font-medium text-slate-300">#</TableHead>
                        <TableHead className="whitespace-nowrap px-5 py-4 text-center text-sm font-medium text-slate-300">Cliente</TableHead>
                        <TableHead className="whitespace-nowrap px-5 py-4 text-center text-sm font-medium text-slate-300">Fila</TableHead>
                        <TableHead className="whitespace-nowrap px-5 py-4 text-center text-sm font-medium text-slate-300">Tempo fila</TableHead>
                        <TableHead className="whitespace-nowrap px-5 py-4 text-center text-sm font-medium text-slate-300">Prioridade</TableHead>
                        <TableHead className="whitespace-nowrap px-5 py-4 text-center text-sm font-medium text-slate-300">Agente</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {waitingItems.map((item) => (
                        <TableRow key={item.id} className="border-b border-[#17305f] text-slate-100 transition-colors hover:bg-[#0d2149]/45 last:border-0">
                          <TableCell className="whitespace-nowrap px-5 py-5 text-center font-medium">{item.sequentialId}</TableCell>
                          <TableCell className="whitespace-nowrap px-5 py-5 text-center">{item.customerName || '-'}</TableCell>
                          <TableCell className="whitespace-nowrap px-5 py-5 text-center">{item.team || '-'}</TableCell>
                          <TableCell className="whitespace-nowrap px-5 py-5 text-center font-mono">{item.queueTime || '-'}</TableCell>
                          <TableCell className="whitespace-nowrap px-5 py-5 text-center">{item.priority ?? '-'}</TableCell>
                          <TableCell className="whitespace-nowrap px-5 py-5 text-center">{item.agentName || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
      </Card>
    </div>
  );
}
