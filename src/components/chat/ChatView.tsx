import { useState, useEffect } from 'react';
import { MessageCircle, Users, Send, Phone, Clock, CheckCircle, AlertCircle, TrendingUp, TrendingDown, Activity, Eye, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { readChatCsvFile, processChatData } from '@/lib/chatCsvReader';
import { readBlipQueuesExcelFile, processBlipQueuesData } from '@/lib/blipQueuesReader';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChatMonthFilter } from './ChatMonthFilter';
import { Counter } from '@/components/ui/counter';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

// Use same types/interfaces where applicable or extended
interface ChatSession {
  id: string;
  customerName: string; // From 'telefone' or similar since name might not be there
  customerPhone: string;
  status: 'active' | 'waiting' | 'closed'; // Mapping from CSV status
  operator?: string;
  lastMessage: string; // Placeholder
  timestamp: string;
  unreadCount: number;
  waitTime?: string;
  originalStatus: string;
}


export function ChatView() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorV, setErrorV] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [rawCsvData, setRawCsvData] = useState<any[]>([]);
  const [rawBlipData, setRawBlipData] = useState<any[]>([]);
  const [dataSource, setDataSource] = useState<'novobotdralis' | 'blip-filas'>('novobotdralis');
  const [currentFilters, setCurrentFilters] = useState<{ startDate?: string; endDate?: string }>({});

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadData(currentFilters.startDate, currentFilters.endDate, dataSource);
  }, [dataSource]);

  const loadData = async (startDate?: string, endDate?: string, source: 'novobotdralis' | 'blip-filas' = dataSource) => {
    setLoading(true);
    setErrorV(null);
    try {
      if (source === 'novobotdralis') {
        setCurrentFilters({ startDate, endDate });

        let csvData = rawCsvData;
        if (rawCsvData.length === 0) {
          csvData = await readChatCsvFile('/planilhas/novobotdralis.csv');
          setRawCsvData(csvData);
        }

        const processed = processChatData(csvData, startDate, endDate);
        setData(processed);
        return;
      }

      let blipData = rawBlipData;
      if (rawBlipData.length === 0) {
        blipData = await readBlipQueuesExcelFile('/planilhas/blip-filas.xlsx');
        setRawBlipData(blipData);
      }

      const processed = processBlipQueuesData(blipData);
      setData(processed);
    } catch (error: any) {
      console.error("Failed to load chat data", error);
      setErrorV(error.message || "Erro desconhecido ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (startDate: string, endDate: string) => {
    console.log('🔍 Filtros aplicados no ChatView:', { startDate, endDate });

    if (dataSource !== 'novobotdralis') {
      return;
    }

    if (startDate && endDate) {
      loadData(startDate, endDate, 'novobotdralis');
    } else {
      loadData(undefined, undefined, 'novobotdralis');
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (errorV) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-destructive gap-4">
        <AlertCircle className="w-12 h-12" />
        <div className="text-lg font-bold">Erro ao carregar dados</div>
        <div className="text-sm font-mono bg-muted p-2 rounded max-w-lg text-center break-words">{errorV}</div>
        <Button onClick={() => loadData()} variant="outline">Tentar Novamente</Button>
      </div>
    );
  }

  if (!data) return <div>Dados vazios ou inválidos.</div>;

  const { kpis, operators, queueData } = data;
  const allowedWhatsAppOperators = new Set([
    'raylaneferreira@smilesaude.com.br',
    'thaysesouza@smilesaude.com.br',
    'thayse souza',
    'ivana firmino'
  ]);
  const normalizeOperator = (value?: string) =>
    (value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9@.\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  const isMayaraOperator = (normalizedName: string) =>
    normalizedName.includes('mayara iasmin') &&
    normalizedName.includes('araujo') &&
    normalizedName.includes('carvalho');
  const filteredOperators = (operators || []).filter((operator: any) => {
    const normalizedName = normalizeOperator(operator?.nome);
    return allowedWhatsAppOperators.has(normalizedName) || isMayaraOperator(normalizedName);
  });
  const totalLabel = dataSource === 'blip-filas' ? 'Tickets Finalizados' : 'Total Conversas';
  const atendidasLabel = dataSource === 'blip-filas' ? 'Finalizados' : 'Atendidas';

  const satisfactionData = [
    { name: 'Excelente', value: 42, color: '#10b981' },
    { name: 'Bom', value: 33, color: '#3b82f6' },
    { name: 'Regular', value: 18, color: '#f59e0b' },
    { name: 'Ruim', value: 7, color: '#ef4444' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard WhatsApp</h1>
          <p className="text-sm text-muted-foreground">Análise do relatório: {kpis.periodo}</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50">
          <Button onClick={() => loadData()} variant="ghost" size="sm" className="h-8 w-8 p-0">
            <RefreshCw className="w-4 h-4 text-muted-foreground" />
          </Button>
          <div className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-500' : 'bg-green-500'} animate-pulse`} />
          <span className="text-sm">{loading ? 'Atualizando...' : 'Online'}</span>
        </div>
      </div>

      <div className="flex items-center justify-center">
        <ToggleGroup
          type="single"
          value={dataSource}
          onValueChange={(value: 'novobotdralis' | 'blip-filas') => setDataSource(value || 'novobotdralis')}
          className="gap-1"
        >
          <ToggleGroupItem value="novobotdralis" className="gap-2">
            <MessageCircle className="w-4 h-4" />
            Geral
          </ToggleGroupItem>
          <ToggleGroupItem value="blip-filas" className="gap-2">
            <Activity className="w-4 h-4" />
            Filas WhatsApp
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Filtro de Período */}
      {dataSource === 'novobotdralis' && (
        <ChatMonthFilter
          key={dataSource}
          onFilterChange={handleFilterChange}
          currentPeriod={kpis.periodo}
        />
      )}

      {/* Notificação sobre fonte dos dados */}
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm text-blue-700 dark:text-blue-300">
            📊 Dados obtidos dos relatórios exportados da plataforma <strong>Take Blip</strong>
          </span>
        </div>
      </div>


      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{totalLabel}</p>
                <p className="text-2xl font-bold text-primary"><Counter value={kpis.totalChamadas} /></p>
              </div>
              <MessageCircle className="w-8 h-8 text-primary opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{atendidasLabel}</p>
                <p className="text-2xl font-bold text-success"><Counter value={kpis.atendidas} /></p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-success">{kpis.taxaAtendimento.toFixed(1)}% Conv.</span>
                </div>
              </div>
              <CheckCircle className="w-8 h-8 text-success opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <div tabIndex={0} className="flex items-center justify-between cursor-help outline-none">
                  <div>
                    <p className="text-sm text-muted-foreground">T.M.E</p>
                    <p className="text-xl font-bold text-info">{kpis.tempoMedioEspera}</p>
                    <p className="text-xs text-muted-foreground mt-1">Tempo Médio Espera</p>
                  </div>
                  <Clock className="w-8 h-8 text-info opacity-80" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Tempo Médio de Espera na Fila</p>
              </TooltipContent>
            </Tooltip>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        </div>

      {/* Bottom Section - Operators */}
      <div className="grid grid-cols-1 gap-6">
        {/* Operadores (Top Performadores) */}
        {dataSource === 'novobotdralis' ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Top Operadores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredOperators.map((operator: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{operator.avatar}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm truncate max-w-[150px]">{operator.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          <Counter value={operator.chamadasAtendidas} /> atendimentos
                        </p>
                      </div>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge tabIndex={0} variant="outline" className="text-xs font-mono cursor-help outline-none">
                          {operator.tempoMedioAtendimento}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Tempo Médio de Atendimento (T.M.A)</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Filas (Blip)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {queueData.map((fila: any, index: number) => (
                  <div key={index} className="p-4 rounded-xl bg-muted/50 border border-muted-foreground/10">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{fila.fila}</p>
                        <div className="mt-1 text-xs text-muted-foreground">
                          <Counter value={fila.total} /> tickets
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        <Badge className="rounded-full bg-background/80 text-foreground text-[10px] font-mono px-3 py-1 border border-muted-foreground/20 shadow-sm">
                          T.M.E {fila.tempoMedioEspera || '00:00:00'}
                        </Badge>
                        <Badge className="rounded-full bg-background/80 text-foreground text-[10px] font-mono px-3 py-1 border border-muted-foreground/20 shadow-sm">
                          T.M.A {fila.tempoMedioAtendimento || '00:00:00'}
                        </Badge>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                      <div className="rounded-lg bg-background/60 border border-muted-foreground/10 px-3 py-2">
                        <div className="uppercase tracking-wide text-[10px] text-muted-foreground/70">T. 1ª resp.</div>
                        <div className="font-mono text-sm text-foreground">{fila.tempoMedioPrimeiraResposta || '00:00:00'}</div>
                      </div>
                      <div className="rounded-lg bg-background/60 border border-muted-foreground/10 px-3 py-2">
                        <div className="uppercase tracking-wide text-[10px] text-muted-foreground/70">T. resposta</div>
                        <div className="font-mono text-sm text-foreground">{fila.tempoMedioResposta || '00:00:00'}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

    </div>
  );
}
