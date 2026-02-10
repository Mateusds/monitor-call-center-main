import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Phone, TrendingUp, Users, MapPin, Award, BarChart3, Download, Filter, Lightbulb } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useCallRecords } from "@/hooks/useCallRecords";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { parseCallData, analyzeByState, analyzeByOperator, analyzeByQueue, generateInsights } from "@/utils/callDataProcessor";
import { CallRecord, StateAnalysis, OperatorRanking, QueuePerformance } from "@/types/callData";
import FileUploader from "@/components/FileUploader";
import UploadHistory from "@/components/UploadHistory";
import { MultiSelectFilter } from "@/components/DashboardFilters";
import { useToast } from "@/hooks/use-toast";

const SAMPLE_DATA = `# Document parsed from: Call_Center_Assistencial_-_Outubro.xlsx

## Page 1

|Fila|Chamadas|Data e Hora da ligação|Data e Hora que foi atendida|Data e Hora que foi encerrada|Duração da chamada em Segundos|Ramal que recebeu a chamada|Nome do operador|Duração da chamada|Tempo de espera|ID da chamada|Motivo da chamada|Telefone que ligou|Estado|
|-|-|-|-|-|-|-|-|-|-|-|-|-|-|
|Call Center Assistencial|Atendidas|2025-10-01 06:05:27|2025-10-01 06:05:36.000000|2025-10-01 06:06:26.000000|50|PJSIP/1040|WINNY VIANA 1040/2003|00:00:50|00:00:09|1759309385|Não identificado|82991592545|Alagoas|
|Call Center Assistencial|Atendidas|2025-10-01 07:08:12|2025-10-01 07:09:47.000000|2025-10-01 07:10:22.000000|35|PJSIP/1017|KASSIA 1017/1041|00:00:35|00:01:35|1759313113|Não identificado|82991592545|Alagoas|
|Call Center Assistencial|Atendidas|2025-10-01 07:47:23|2025-10-01 07:47:32.000000|2025-10-01 07:47:56.000000|24|PJSIP/1010|JOCELAINE SANTOS 1010/1034|00:00:24|00:00:09|1759315532|Não identificado|82991173908|Alagoas|
|Call Center Assistencial|Atendidas|2025-10-01 08:02:08|2025-10-01 08:02:40.000000|2025-10-01 08:07:37.000000|297|PJSIP/1010|JOCELAINE SANTOS 1010/1034|00:04:57|00:00:32|1759316388|Não identificado|83988741997|Paraíba|
|Call Center Assistencial|Atendidas|2025-10-01 08:06:04|2025-10-01 08:16:41.000000|2025-10-01 08:37:05.000000|1224|PJSIP/1038|ALICIA RAMOS 1038/1014|00:20:24|00:10:37|1759316681|Não identificado|84987332255|Natal|
|Call Center Assistencial|Abandonadas|2025-10-01 08:08:18|2025-10-01 08:11:51.000000|2025-10-01 08:11:51.000000|0|||00:00:00|00:03:33|1759316783|Não identificado|82991799752|Alagoas|`;

interface UploadHistoryItem {
  fileName: string;
  uploadDate: Date;
  period: string;
  recordCount: number;
  states: string[];
  queue: string;
}

const CallDetails = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, isAdmin, isSupervisor } = useAuth();
  const { toast } = useToast();
  const { records, loading, saveRecords } = useCallRecords();
  const [allRecords, setAllRecords] = useState<CallRecord[]>([]);
  const [stateData, setStateData] = useState<StateAnalysis[]>([]);
  const [operatorData, setOperatorData] = useState<OperatorRanking[]>([]);
  const [queueData, setQueueData] = useState<QueuePerformance[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [availableQueues, setAvailableQueues] = useState<string[]>([]);
  const [uploadHistory, setUploadHistory] = useState<UploadHistoryItem[]>([]);
  const [previousTotal, setPreviousTotal] = useState<number | undefined>();
  const [availablePeriods, setAvailablePeriods] = useState<string[]>([]);

  // Proteger rota
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);
  
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [selectedQueues, setSelectedQueues] = useState<string[]>([]);
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>([]);

  useEffect(() => {
    if (records.length > 0) {
      handleDataUpdate(records);
    }
  }, [records]);

  const handleDataUpdate = (records: CallRecord[]) => {
    setAllRecords(records);
    
    const uniqueQueues = Array.from(new Set(records.map(r => r.fila).filter(f => f)));
    setAvailableQueues(uniqueQueues);
    
    const states = analyzeByState(records);
    const operators = analyzeByOperator(records);
    const queueAnalysis = analyzeByQueue(records);
    
    setStateData(states);
    setOperatorData(operators);
    setQueueData(queueAnalysis);
    setInsights(generateInsights(states, operators, queueAnalysis));
  };

  const handleFileProcessed = (newRecords: CallRecord[], metadata: UploadHistoryItem) => {
    setPreviousTotal(allRecords.length > 0 ? allRecords.reduce((sum, r) => sum + 1, 0) : undefined);
    
    handleDataUpdate(newRecords);
    
    const updatedHistory = [...uploadHistory, metadata];
    setUploadHistory(updatedHistory);
    
    // Atualizar períodos disponíveis
    const uniquePeriods = Array.from(new Set(updatedHistory.map(h => h.period)));
    setAvailablePeriods(uniquePeriods);
    
    toast({
      title: "✅ Painel atualizado!",
      description: `Gráficos, tabelas e insights atualizados automaticamente com ${newRecords.length} novos registros.`,
    });
  };

  const filteredRecords = allRecords.filter(record => {
    // Filtro de Região
    if (selectedRegions.length > 0) {
      const regiao = record.estado === "Alagoas" || record.estado === "Paraíba" || record.estado === "Natal" 
        ? "Nordeste" 
        : "Centro-Oeste";
      if (!selectedRegions.includes(regiao)) return false;
    }
    
    // Filtro de Estado
    if (selectedStates.length > 0 && !selectedStates.includes(record.estado)) {
      return false;
    }
    
    // Filtro de Fila
    if (selectedQueues.length > 0 && !selectedQueues.includes(record.fila)) {
      return false;
    }
    
    // Filtro de Período
    if (selectedPeriods.length > 0) {
      const recordHistory = uploadHistory.find(h => h.queue === record.fila);
      if (!recordHistory || !selectedPeriods.includes(recordHistory.period)) {
        return false;
      }
    }
    
    return true;
  });

  const filteredStateData = analyzeByState(filteredRecords);
  const filteredOperatorData = analyzeByOperator(filteredRecords);
  const filteredQueueData = analyzeByQueue(filteredRecords);

  const stateChartData = filteredStateData.map(s => ({
    name: s.estado,
    "Total": s.totalChamadas,
    "Atendidas": s.atendidas,
    "Abandonadas": s.abandonadas
  }));

  const pieData = filteredStateData.map(s => ({
    name: s.estado,
    value: s.totalChamadas
  }));

  const COLORS = ['#4F43BE', '#69B8E5', '#8779E6', '#FB923C', '#7A6FE5'];

  const totalCalls = filteredStateData.reduce((sum, s) => sum + s.totalChamadas, 0);
  const totalAnswered = filteredStateData.reduce((sum, s) => sum + s.atendidas, 0);
  const totalAbandoned = filteredStateData.reduce((sum, s) => sum + s.abandonadas, 0);
  const avgAnswerRate = totalCalls > 0 ? (totalAnswered / totalCalls) * 100 : 0;

  const handleExport = () => {
    const csvContent = [
      ['Estado', 'Total Chamadas', 'Atendidas', 'Abandonadas', 'Taxa Atendimento (%)'],
      ...filteredStateData.map(s => [
        s.estado,
        s.totalChamadas,
        s.atendidas,
        s.abandonadas,
        s.taxaAtendimento.toFixed(2)
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_chamadas_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    toast({
      title: "Exportação concluída",
      description: "Relatório baixado com sucesso!",
    });
  };

  // Auth loading gate - prevent any content render before auth check completes
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If not authenticated, render nothing while redirect happens
  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl shadow-lg bg-gradient-to-br from-primary to-accent">
              <Phone className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
                Detalhamento de Chamadas
              </h1>
              <p className="text-muted-foreground">Painel analítico inteligente e dinâmico</p>
            </div>
          </div>
          <Button onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            Exportar Dados
          </Button>
        </div>

        {/* Filtros */}
        <Card className="p-6 animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-lg">Filtros Dinâmicos</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MultiSelectFilter
              label="Região"
              options={[
                { value: "Nordeste", label: "Nordeste" },
                { value: "Centro-Oeste", label: "Centro-Oeste" },
              ]}
              selectedValues={selectedRegions}
              onValuesChange={setSelectedRegions}
              placeholder="Todas as regiões"
            />
            
            <MultiSelectFilter
              label="Estado"
              options={[
                { value: "Alagoas", label: "Alagoas" },
                { value: "Paraíba", label: "Paraíba" },
                { value: "Natal", label: "Natal" },
                { value: "Distrito Federal", label: "Distrito Federal" },
                { value: "Desconhecido", label: "Desconhecido" },
              ]}
              selectedValues={selectedStates}
              onValuesChange={setSelectedStates}
              placeholder="Todos os estados"
            />
            
            <MultiSelectFilter
              label="Fila"
              options={availableQueues.map(queue => ({ value: queue, label: queue }))}
              selectedValues={selectedQueues}
              onValuesChange={setSelectedQueues}
              placeholder="Todas as filas"
            />
            
            <MultiSelectFilter
              label="Período"
              options={availablePeriods.map(period => ({ value: period, label: period }))}
              selectedValues={selectedPeriods}
              onValuesChange={setSelectedPeriods}
              placeholder="Todos os períodos"
            />
          </div>
        </Card>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <Phone className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-2xl font-bold">{totalCalls.toLocaleString()}</h3>
            <p className="text-sm text-muted-foreground">Total de Chamadas</p>
          </Card>
          <Card className="p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-8 w-8 text-success" />
            </div>
            <h3 className="text-2xl font-bold">{totalAnswered.toLocaleString()}</h3>
            <p className="text-sm text-muted-foreground">Chamadas Atendidas</p>
            <p className="text-xs text-success font-semibold">{avgAnswerRate.toFixed(1)}%</p>
          </Card>
          <Card className="p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <Phone className="h-8 w-8 text-destructive" />
            </div>
            <h3 className="text-2xl font-bold">{totalAbandoned.toLocaleString()}</h3>
            <p className="text-sm text-muted-foreground">Chamadas Abandonadas</p>
            <p className="text-xs text-destructive font-semibold">{((totalAbandoned / totalCalls) * 100).toFixed(1)}%</p>
          </Card>
          <Card className="p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-2xl font-bold">{filteredOperatorData.length}</h3>
            <p className="text-sm text-muted-foreground">Operadores Ativos</p>
          </Card>
        </div>

        {/* Análises e Insights */}
        <Card className="p-6 animate-fade-in border-l-4 border-l-primary">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">💡 Análises e Insights</h2>
          </div>
          <div className="space-y-3">
            {insights.map((insight, idx) => (
              <div key={idx} className="p-4 rounded-lg bg-muted/50 border-l-2 border-primary">
                <p className="text-sm leading-relaxed">{insight}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Tabs com Visualizações */}
        <Tabs defaultValue="estados" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="estados">Por Estado</TabsTrigger>
            <TabsTrigger value="filas">Por Fila</TabsTrigger>
            <TabsTrigger value="operadores">Operadores</TabsTrigger>
            <TabsTrigger value="rankings">Rankings</TabsTrigger>
          </TabsList>

          <TabsContent value="estados" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Volume de Chamadas por Estado
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stateChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Atendidas" fill="#4F43BE" />
                    <Bar dataKey="Abandonadas" fill="#FB923C" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              <Card className="p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Distribuição por Estado
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </div>

            <Card className="p-6">
              <h3 className="font-bold text-lg mb-4">Detalhamento por Estado</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-bold">Estado</th>
                      <th className="text-left p-3 font-bold">Região</th>
                      <th className="text-right p-3 font-bold">Total</th>
                      <th className="text-right p-3 font-bold">Atendidas</th>
                      <th className="text-right p-3 font-bold">Taxa</th>
                      <th className="text-right p-3 font-bold">Abandonadas</th>
                      <th className="text-right p-3 font-bold">Taxa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStateData.map((state, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? "bg-muted/20" : ""}>
                        <td className="p-3 font-medium">{state.estado}</td>
                        <td className="p-3 text-muted-foreground">{state.regiao}</td>
                        <td className="p-3 text-right font-semibold">{state.totalChamadas}</td>
                        <td className="p-3 text-right text-success">{state.atendidas}</td>
                        <td className="p-3 text-right">
                          <span className={`font-bold ${state.taxaAtendimento >= 80 ? 'text-success' : state.taxaAtendimento >= 60 ? 'text-warning' : 'text-destructive'}`}>
                            {state.taxaAtendimento.toFixed(1)}%
                          </span>
                        </td>
                        <td className="p-3 text-right text-destructive">{state.abandonadas}</td>
                        <td className="p-3 text-right">
                          <span className={`font-bold ${((state.abandonadas / state.totalChamadas) * 100) <= 10 ? 'text-success' : ((state.abandonadas / state.totalChamadas) * 100) <= 20 ? 'text-warning' : 'text-destructive'}`}>
                            {((state.abandonadas / state.totalChamadas) * 100).toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="filas" className="space-y-6">
            <Card className="p-6">
              <h3 className="font-bold text-lg mb-4">Performance por Fila</h3>
              <div className="space-y-4">
                {filteredQueueData.map((queue, idx) => (
                  <div key={idx} className="p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{queue.fila}</h4>
                      <span className="text-sm text-muted-foreground">{queue.totalChamadas} chamadas</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-destructive" 
                            style={{ width: `${queue.taxaAbandono}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-semibold">
                        Taxa de Abandono: {queue.taxaAbandono.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="operadores" className="space-y-6">
            <Card className="p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Performance por Operador
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-bold">Operador</th>
                      <th className="text-right p-3 font-bold">Total</th>
                      <th className="text-right p-3 font-bold">Atendidas</th>
                      <th className="text-right p-3 font-bold">Taxa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOperatorData.slice(0, 10).map((op, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? "bg-muted/20" : ""}>
                        <td className="p-3 font-medium">{op.operador}</td>
                        <td className="p-3 text-right">{op.totalChamadas}</td>
                        <td className="p-3 text-right text-success">{op.atendidas}</td>
                        <td className="p-3 text-right">
                          <span className={`font-bold ${op.taxaAtendimento >= 80 ? 'text-success' : 'text-warning'}`}>
                            {op.taxaAtendimento.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="rankings" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  🏆 Top 5 Operadores Mais Eficientes
                </h3>
                <div className="space-y-3">
                  {filteredOperatorData.slice(0, 5).map((op, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <span className="text-2xl">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}º`}</span>
                      <div className="flex-1">
                        <p className="font-medium">{op.operador}</p>
                        <p className="text-sm text-muted-foreground">{op.totalChamadas} chamadas</p>
                      </div>
                      <span className="font-bold text-success">{op.taxaAtendimento.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  🏆 Top 5 Filas com Maior Volume
                </h3>
                <div className="space-y-3">
                  {filteredQueueData.slice(0, 5).map((queue, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <span className="text-2xl">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}º`}</span>
                      <div className="flex-1">
                        <p className="font-medium">{queue.fila}</p>
                        <p className="text-sm text-muted-foreground">Taxa abandono: {queue.taxaAbandono.toFixed(1)}%</p>
                      </div>
                      <span className="font-bold text-primary">{queue.totalChamadas}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Upload e Histórico */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
          {(isAdmin() || isSupervisor()) && (
            <FileUploader 
              onDataProcessed={handleFileProcessed}
              onSaveRecords={saveRecords}
            />
          )}
          <UploadHistory 
            history={uploadHistory} 
            currentStats={{
              totalCalls: totalCalls,
              previousTotal
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default CallDetails;
