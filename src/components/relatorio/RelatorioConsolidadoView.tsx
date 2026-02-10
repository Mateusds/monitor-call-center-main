import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, MessageCircle, Users, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { readExcelFile, processExcelData } from '@/lib/excelReader';
import { readChatCsvFile, processChatData } from '@/lib/chatCsvReader';
import { readBlipQueuesExcelFile, processBlipQueuesData } from '@/lib/blipQueuesReader';
import { Counter } from '@/components/ui/counter';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ConsolidatedMonthFilter } from './ConsolidatedMonthFilter';
import { Badge } from '@/components/ui/badge';

interface ConsolidatedKPI {
  totalLigacoes: number;
  ligacoesAtendidas: number;
  totalChats: number;
  chatsAtendidos: number;
  totalGeral: number;
  atendimentosGeral: number;
  taxaConversaoGeral: number;
}

export function RelatorioConsolidadoView() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'todos' | 'ligacoes' | 'chats'>('todos');
  const [periodo, setPeriodo] = useState<string>('Período Completo');
  const [cachedData, setCachedData] = useState<any>(null);
  const [blipQueueData, setBlipQueueData] = useState<any[]>([]);
  const [currentFilters, setCurrentFilters] = useState<{ startDate?: string; endDate?: string }>({});
  const [kpis, setKpis] = useState<ConsolidatedKPI>({
    totalLigacoes: 0,
    ligacoesAtendidas: 0,
    totalChats: 0,
    chatsAtendidos: 0,
    totalGeral: 0,
    atendimentosGeral: 0,
    taxaConversaoGeral: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (startDate?: string, endDate?: string) => {
    // Verificar se já temos dados em cache para os mesmos filtros
    const filterKey = `${startDate || 'all'}-${endDate || 'all'}`;
    if (cachedData && currentFilters.startDate === startDate && currentFilters.endDate === endDate) {
      // Usar dados do cache
      const consolidatedKPI = cachedData;
      setKpis(consolidatedKPI);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Carregar dados das ligações
      const callData = await readExcelFile('/planilhas/Relatório 01_10_25 a 10_01_26.xlsx');
      const processedCalls = processExcelData(callData, startDate, endDate);
      
      // Carregar dados dos chats
      const chatData = await readChatCsvFile('/planilhas/novobotdralis.csv');
      const processedChats = processChatData(chatData, startDate, endDate);

      // Carregar filas Blip (sem filtro de período)
      const blipRows = await readBlipQueuesExcelFile('/planilhas/blip-filas.xlsx');
      const blipProcessed = processBlipQueuesData(blipRows);
      setBlipQueueData(blipProcessed.queueData || []);

      // Atualizar período
      setPeriodo(processedChats.kpis.periodo);

      // Calcular KPIs consolidados
      const consolidatedKPI: ConsolidatedKPI = {
        totalLigacoes: processedCalls.kpis.totalChamadas,
        ligacoesAtendidas: processedCalls.kpis.atendidas,
        totalChats: processedChats.kpis.totalChamadas,
        chatsAtendidos: processedChats.kpis.atendidas,
        totalGeral: processedCalls.kpis.totalChamadas + processedChats.kpis.totalChamadas,
        atendimentosGeral: processedCalls.kpis.atendidas + processedChats.kpis.atendidas,
        taxaConversaoGeral: ((processedCalls.kpis.atendidas + processedChats.kpis.atendidas) / 
          (processedCalls.kpis.totalChamadas + processedChats.kpis.totalChamadas)) * 100
      };

      // Salvar em cache
      setCachedData(consolidatedKPI);
      setCurrentFilters({ startDate, endDate });
      setKpis(consolidatedKPI);
    } catch (error: any) {
      console.error("Failed to load consolidated data", error);
      setError(error.message || "Falha ao carregar dados consolidados");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (startDate: string, endDate: string) => {
    console.log('🔍 Filtros aplicados no Relatório Consolidado:', { startDate, endDate });
    
    if (startDate && endDate) {
      loadData(startDate, endDate);
    } else {
      // Sem filtros, carregar tudo
      loadData();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-destructive gap-4">
        <AlertCircle className="w-12 h-12" />
        <div className="text-lg font-bold">Erro ao carregar dados</div>
        <div className="text-sm font-mono bg-muted p-2 rounded max-w-lg text-center break-words">{error}</div>
        <Button onClick={() => loadData()} variant="outline">Tentar Novamente</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Relatório Consolidado</h1>
          <p className="text-sm text-muted-foreground">Visão geral de todos os canais de atendimento</p>
          <p className="text-xs text-muted-foreground mt-1">Período: {periodo}</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50">
          <Button onClick={() => loadData()} variant="ghost" size="sm" className="h-8 w-8 p-0">
            <RefreshCw className="w-4 h-4 text-muted-foreground" />
          </Button>
          <div className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-500' : 'bg-green-500'} animate-pulse`} />
          <span className="text-sm">{loading ? 'Atualizando...' : 'Online'}</span>
        </div>
      </div>

      {/* Filtro de Período */}
      <ConsolidatedMonthFilter
        onFilterChange={handleFilterChange}
        currentPeriod={periodo}
      />

      {/* Filtro de Canal */}
      <div className="flex items-center justify-center">
        <ToggleGroup
          type="single"
          value={filter}
          onValueChange={(value: 'todos' | 'ligacoes' | 'chats') => setFilter(value || 'todos')}
          className="gap-1"
        >
          <ToggleGroupItem value="todos" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            Todos
          </ToggleGroupItem>
          <ToggleGroupItem value="ligacoes" className="gap-2">
            <Phone className="w-4 h-4" />
            Ligações
          </ToggleGroupItem>
          <ToggleGroupItem value="chats" className="gap-2">
            <MessageCircle className="w-4 h-4" />
            Chats
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Cards Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Ligações */}
        {(filter === 'todos' || filter === 'ligacoes') && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Ligações</p>
                  <p className="text-2xl font-bold text-blue-600"><Counter key={`ligacoes-${filter}`} value={kpis.totalLigacoes} /></p>
                </div>
                <Phone className="w-8 h-8 text-blue-600 opacity-80" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ligações Atendidas */}
        {(filter === 'todos' || filter === 'ligacoes') && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ligações Atendidas</p>
                  <p className="text-2xl font-bold text-green-600"><Counter key={`ligacoes-atendidas-${filter}`} value={kpis.ligacoesAtendidas} /></p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600 opacity-80" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Total Chats */}
        {(filter === 'todos' || filter === 'chats') && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Chats</p>
                  <p className="text-2xl font-bold text-purple-600"><Counter key={`chats-${filter}`} value={kpis.totalChats} /></p>
                </div>
                <MessageCircle className="w-8 h-8 text-purple-600 opacity-80" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Chats Atendidos */}
        {(filter === 'todos' || filter === 'chats') && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Chats Atendidos</p>
                  <p className="text-2xl font-bold text-green-600"><Counter key={`chats-atendidos-${filter}`} value={kpis.chatsAtendidos} /></p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600 opacity-80" />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Cards Consolidados */}
      {filter === 'todos' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Geral */}
          <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Total Geral de Contatos</p>
                  <p className="text-3xl font-bold"><Counter key={`total-geral-${filter}`} value={kpis.totalGeral} /></p>
                </div>
                <TrendingUp className="w-10 h-10 opacity-80" />
              </div>
            </CardContent>
          </Card>

          {/* Atendimentos Geral */}
          <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Total Atendido</p>
                  <p className="text-3xl font-bold"><Counter key={`atendimentos-geral-${filter}`} value={kpis.atendimentosGeral} /></p>
                </div>
                <Users className="w-10 h-10 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Cards Específicos por Canal */}
      {filter === 'ligacoes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Taxa de Atendimento Ligações</p>
                  <p className="text-3xl font-bold">
                    <Counter 
                      key={`taxa-ligacoes-${filter}`} 
                      value={kpis.totalLigacoes > 0 ? ((kpis.ligacoesAtendidas / kpis.totalLigacoes) * 100) : 0}
                      formatter={(value) => `${value.toFixed(1)}%`}
                    />
                  </p>
                  <p className="text-xs opacity-75 mt-1">
                    {kpis.ligacoesAtendidas} de {kpis.totalLigacoes} ligações atendidas
                  </p>
                </div>
                <Phone className="w-10 h-10 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Ligações Não Atendidas</p>
                  <p className="text-3xl font-bold">
                    <Counter 
                      key={`ligacoes-nao-atendidas-${filter}`} 
                      value={kpis.totalLigacoes - kpis.ligacoesAtendidas}
                    />
                  </p>
                  <p className="text-xs opacity-75 mt-1">
                    {kpis.totalLigacoes > 0 ? (((kpis.totalLigacoes - kpis.ligacoesAtendidas) / kpis.totalLigacoes) * 100).toFixed(1) : 0}% do total
                  </p>
                </div>
                <AlertCircle className="w-10 h-10 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {filter === 'chats' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Taxa de Atendimento Chats</p>
                  <p className="text-3xl font-bold">
                    <Counter 
                      key={`taxa-chats-${filter}`} 
                      value={kpis.totalChats > 0 ? ((kpis.chatsAtendidos / kpis.totalChats) * 100) : 0}
                      formatter={(value) => `${value.toFixed(1)}%`}
                    />
                  </p>
                  <p className="text-xs opacity-75 mt-1">
                    {kpis.chatsAtendidos} de {kpis.totalChats} chats atendidos
                  </p>
                </div>
                <MessageCircle className="w-10 h-10 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Chats Não Atendidos</p>
                  <p className="text-3xl font-bold">
                    <Counter 
                      key={`chats-nao-atendidos-${filter}`} 
                      value={kpis.totalChats - kpis.chatsAtendidos}
                    />
                  </p>
                  <p className="text-xs opacity-75 mt-1">
                    {kpis.totalChats > 0 ? (((kpis.totalChats - kpis.chatsAtendidos) / kpis.totalChats) * 100).toFixed(1) : 0}% do total
                  </p>
                </div>
                <AlertCircle className="w-10 h-10 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {filter === 'chats' && blipQueueData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Filas (Blip)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {blipQueueData.map((fila: any, index: number) => (
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
  );
}
