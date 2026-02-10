import { useState, useEffect } from "react";
import { Phone, TrendingUp, TrendingDown, Users, MapPin, Award, BarChart3, Download, Filter, Lightbulb, Trash2, CheckCircle, XCircle, ArrowUp, ArrowDown, Minus, Calendar, FileSpreadsheet, FileText, LineChart as LineChartIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useCallRecords } from "@/hooks/useCallRecords";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from "recharts";
import { parseCallData, analyzeByState, analyzeByOperator, analyzeByQueue, generateInsights } from "@/utils/callDataProcessor";
import { CallRecord, StateAnalysis, OperatorRanking, QueuePerformance } from "@/types/callData";
import FileUploader from "@/components/FileUploader";
import UploadHistory from "@/components/UploadHistory";
import AggregatedDataUploader from "@/components/AggregatedDataUploader";
import { MultiSelectFilter } from "@/components/DashboardFilters";
import { useToast } from "@/hooks/use-toast";
import { DeleteConfirmationModal } from "@/components/DeleteConfirmationModal";
import { createExcelFile } from "@/utils/excelUtils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
interface UploadHistoryItem {
  fileName: string;
  uploadDate: Date;
  period: string;
  recordCount: number;
  states: string[];
  queue: string;
}

export const CallDetailsTab = () => {
  const { toast } = useToast();
  const { records, loading, saveRecords, deleteAllRecords, refreshRecords } = useCallRecords();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [allRecords, setAllRecords] = useState<CallRecord[]>([]);
  const [stateData, setStateData] = useState<StateAnalysis[]>([]);
  const [operatorData, setOperatorData] = useState<OperatorRanking[]>([]);
  const [queueData, setQueueData] = useState<QueuePerformance[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [availableQueues, setAvailableQueues] = useState<string[]>([]);
  const [uploadHistory, setUploadHistory] = useState<UploadHistoryItem[]>([]);
  const [availablePeriods, setAvailablePeriods] = useState<string[]>([]);
  
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
    handleDataUpdate(newRecords);
    
    const updatedHistory = [...uploadHistory, metadata];
    setUploadHistory(updatedHistory);
    
    const uniquePeriods = Array.from(new Set(updatedHistory.map(h => h.period)));
    setAvailablePeriods(uniquePeriods);
    
    toast({
      title: "✅ Painel atualizado!",
      description: `Gráficos, tabelas e insights atualizados automaticamente com ${newRecords.length} novos registros.`,
    });
  };

  const filteredRecords = allRecords.filter(record => {
    if (selectedRegions.length > 0) {
      const regiao = record.estado === "Alagoas" || record.estado === "Paraíba" || record.estado === "Natal" 
        ? "Nordeste" 
        : "Centro-Oeste";
      if (!selectedRegions.includes(regiao)) return false;
    }
    
    if (selectedStates.length > 0 && !selectedStates.includes(record.estado)) {
      return false;
    }
    
    if (selectedQueues.length > 0 && !selectedQueues.includes(record.fila)) {
      return false;
    }
    
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

  const COLORS = ['#7B5CD6', '#69B8E5', '#9B8CE8', '#5BC9F4', '#A78BFA'];

  const totalCalls = filteredStateData.reduce((sum, s) => sum + s.totalChamadas, 0);
  const totalAnswered = filteredStateData.reduce((sum, s) => sum + s.atendidas, 0);
  const totalAbandoned = filteredStateData.reduce((sum, s) => sum + s.abandonadas, 0);
  const avgAnswerRate = totalCalls > 0 ? (totalAnswered / totalCalls) * 100 : 0;

  const handleDelete = async () => {
    const result = await deleteAllRecords();
    
    if (result.success) {
      setShowDeleteModal(false);
      setAllRecords([]);
      setStateData([]);
      setOperatorData([]);
      setQueueData([]);
      setInsights([]);
      setUploadHistory([]);
    } else {
      toast({
        variant: "destructive",
        title: "Erro ao excluir dados",
        description: result.error || "Não foi possível excluir os registros",
      });
    }
  };

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

  const exportToExcel = async () => {
    try {
      // Summary sheet
      const summaryData = [
        { Métrica: "Total de Chamadas", Valor: totalCalls },
        { Métrica: "Atendidas", Valor: totalAnswered },
        { Métrica: "Abandonadas", Valor: totalAbandoned },
        { Métrica: "Taxa de Atendimento", Valor: `${avgAnswerRate.toFixed(1)}%` },
        { Métrica: "Operadores Ativos", Valor: filteredOperatorData.length },
      ];
      
      // State data sheet
      const stateSheetData = filteredStateData.map(s => ({
        Estado: s.estado,
        Região: s.regiao,
        "Total Chamadas": s.totalChamadas,
        Atendidas: s.atendidas,
        Abandonadas: s.abandonadas,
        "Taxa Atendimento (%)": s.taxaAtendimento.toFixed(1),
      }));
      
      // Queue data sheet
      const queueSheetData = filteredQueueData.map(q => ({
        Fila: q.fila,
        "Total Chamadas": q.totalChamadas,
        "Taxa Abandono (%)": q.taxaAbandono.toFixed(1),
        "Tempo Médio (s)": q.tempoMedio.toFixed(0),
      }));
      
      await createExcelFile(
        [
          { name: "Resumo", data: summaryData },
          { name: "Por Estado", data: stateSheetData },
          { name: "Por Fila", data: queueSheetData }
        ],
        `detalhamento_${new Date().toISOString().split('T')[0]}.xlsx`
      );
      
      toast({ title: "Excel exportado com sucesso!" });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao exportar Excel" });
    }
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(18);
      doc.setTextColor(123, 92, 214);
      doc.text("Detalhamento de Chamadas", 14, 20);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")}`, 14, 28);
      
      // Summary
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text("Resumo Geral:", 14, 42);
      doc.setFontSize(10);
      doc.text(`Total de Chamadas: ${totalCalls.toLocaleString()}`, 14, 50);
      doc.text(`Atendidas: ${totalAnswered.toLocaleString()} (${avgAnswerRate.toFixed(1)}%)`, 14, 56);
      doc.text(`Abandonadas: ${totalAbandoned.toLocaleString()}`, 14, 62);
      doc.text(`Operadores Ativos: ${filteredOperatorData.length}`, 14, 68);
      
      // State table
      const tableData = filteredStateData.map(s => [
        s.estado,
        s.regiao,
        s.totalChamadas.toLocaleString(),
        s.atendidas.toLocaleString(),
        s.abandonadas.toLocaleString(),
        `${s.taxaAtendimento.toFixed(1)}%`
      ]);
      
      autoTable(doc, {
        head: [["Estado", "Região", "Total", "Atendidas", "Abandonadas", "Taxa"]],
        body: tableData,
        startY: 78,
        theme: "striped",
        headStyles: { fillColor: [123, 92, 214] },
        styles: { fontSize: 9 },
      });
      
      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: "center" });
      }
      
      doc.save(`detalhamento_${new Date().toISOString().split('T')[0]}.pdf`);
      toast({ title: "PDF exportado com sucesso!" });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao exportar PDF" });
    }
  };

  // Variation data between periods
  const getVariationData = () => {
    if (uploadHistory.length < 2) return [];
    
    const periods = [...new Set(uploadHistory.map(h => h.period))].sort();
    if (periods.length < 2) return [];
    
    const currentPeriod = periods[periods.length - 1];
    const previousPeriod = periods[periods.length - 2];
    
    const currentRecords = allRecords.filter(r => {
      const history = uploadHistory.find(h => h.queue === r.fila);
      return history?.period === currentPeriod;
    });
    
    const previousRecords = allRecords.filter(r => {
      const history = uploadHistory.find(h => h.queue === r.fila);
      return history?.period === previousPeriod;
    });
    
    const currentByState = analyzeByState(currentRecords);
    const previousByState = analyzeByState(previousRecords);
    
    return currentByState.map(current => {
      const previous = previousByState.find(p => p.estado === current.estado);
      const volumeChange = previous ? current.totalChamadas - previous.totalChamadas : current.totalChamadas;
      const rateChange = previous ? current.taxaAtendimento - previous.taxaAtendimento : 0;
      
      return {
        estado: current.estado,
        currentTotal: current.totalChamadas,
        previousTotal: previous?.totalChamadas || 0,
        volumeChange,
        volumeChangePercent: previous && previous.totalChamadas > 0 
          ? ((volumeChange / previous.totalChamadas) * 100) 
          : 0,
        currentRate: current.taxaAtendimento,
        previousRate: previous?.taxaAtendimento || 0,
        rateChange,
      };
    });
  };

  const variationData = getVariationData();

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Filtros */}
      <Card className="p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-lg">Filtros Dinâmicos</h3>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => setShowDeleteModal(true)} 
              variant="destructive" 
              className="gap-2"
              disabled={allRecords.length === 0}
            >
              <Trash2 className="h-4 w-4" />
              Excluir Todos
            </Button>
            <Button onClick={handleExport} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              CSV
            </Button>
            <Button onClick={exportToExcel} variant="outline" className="gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Excel
            </Button>
            <Button onClick={exportToPDF} variant="outline" className="gap-2">
              <FileText className="h-4 w-4" />
              PDF
            </Button>
          </div>
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
        <Card className="p-6 animate-fade-in hover-scale transition-all duration-300">
          <div className="flex items-center justify-between mb-2">
            <Phone className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-2xl font-bold">{totalCalls.toLocaleString()}</h3>
          <p className="text-sm text-muted-foreground">Total de Chamadas</p>
        </Card>
        <Card className="p-6 animate-fade-in hover-scale transition-all duration-300">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="h-8 w-8 text-success" />
          </div>
          <h3 className="text-2xl font-bold">{totalAnswered.toLocaleString()}</h3>
          <p className="text-sm text-muted-foreground">Chamadas Atendidas</p>
          <p className="text-xs text-success font-semibold">{avgAnswerRate.toFixed(1)}%</p>
        </Card>
        <Card className="p-6 animate-fade-in hover-scale transition-all duration-300">
          <div className="flex items-center justify-between mb-2">
            <Phone className="h-8 w-8 text-destructive" />
          </div>
          <h3 className="text-2xl font-bold">{totalAbandoned.toLocaleString()}</h3>
          <p className="text-sm text-muted-foreground">Chamadas Abandonadas</p>
          <p className="text-xs text-destructive font-semibold">{((totalAbandoned / totalCalls) * 100).toFixed(1)}%</p>
        </Card>
        <Card className="p-6 animate-fade-in hover-scale transition-all duration-300">
          <div className="flex items-center justify-between mb-2">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-2xl font-bold">{filteredOperatorData.length}</h3>
          <p className="text-sm text-muted-foreground">Operadores Ativos</p>
        </Card>
      </div>

      {/* Análises e Insights */}
      {insights.length > 0 && (
        <Card className="p-6 animate-fade-in border-l-4 border-l-primary transition-all duration-300 hover:shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="h-6 w-6 text-primary animate-pulse" />
            <h2 className="text-2xl font-bold">💡 Análises e Insights</h2>
          </div>
          <div className="space-y-3">
            {insights.map((insight, idx) => (
              <div 
                key={idx} 
                className="p-4 rounded-lg bg-muted/50 border-l-2 border-primary transition-all duration-300 hover:bg-muted/70 hover:translate-x-1"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <p className="text-sm leading-relaxed">{insight}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Tabs com Visualizações */}
      <Tabs defaultValue="estados" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="estados">Por Estado</TabsTrigger>
          <TabsTrigger value="filas">Por Fila</TabsTrigger>
          <TabsTrigger value="variacao" className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            Variação
          </TabsTrigger>
          <TabsTrigger value="evolucao" className="flex items-center gap-1">
            <LineChartIcon className="h-3 w-3" />
            Evolução
          </TabsTrigger>
          <TabsTrigger value="rankings">Rankings</TabsTrigger>
        </TabsList>

        <TabsContent value="estados" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6 animate-scale-in transition-all duration-300 hover:shadow-lg">
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
                  <Bar dataKey="Atendidas" fill="#7B5CD6" animationDuration={1000} />
                  <Bar dataKey="Abandonadas" fill="#69B8E5" animationDuration={1000} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6 animate-scale-in transition-all duration-300 hover:shadow-lg">
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
                    animationDuration={1000}
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

          <Card className="p-6 animate-fade-in transition-all duration-300 hover:shadow-lg">
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
                    <tr key={idx} className={`${idx % 2 === 0 ? "bg-muted/20" : ""} transition-all duration-200 hover:bg-muted/40`}>
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
                        <span className="text-muted-foreground">
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
          <Card className="p-6 animate-fade-in">
            <h3 className="font-bold text-lg mb-4">Performance por Fila</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-bold">Fila</th>
                    <th className="text-right p-3 font-bold">Total</th>
                    <th className="text-right p-3 font-bold">Taxa Abandono</th>
                    <th className="text-right p-3 font-bold">Tempo Médio</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQueueData.map((queue, idx) => (
                    <tr key={idx} className={`${idx % 2 === 0 ? "bg-muted/20" : ""} transition-all duration-200 hover:bg-muted/40`}>
                      <td className="p-3 font-medium">{queue.fila}</td>
                      <td className="p-3 text-right font-semibold">{queue.totalChamadas}</td>
                      <td className="p-3 text-right">
                        <span className={`font-bold ${queue.taxaAbandono <= 20 ? 'text-success' : queue.taxaAbandono <= 40 ? 'text-warning' : 'text-destructive'}`}>
                          {queue.taxaAbandono.toFixed(1)}%
                        </span>
                      </td>
                      <td className="p-3 text-right text-muted-foreground">{queue.tempoMedio.toFixed(0)}s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="variacao" className="space-y-6">
          <Card className="p-6 animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h3 className="font-bold text-lg">Tabela de Variação entre Períodos</h3>
            </div>
            {variationData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-bold">Estado</th>
                      <th className="text-right p-3 font-bold">Período Anterior</th>
                      <th className="text-right p-3 font-bold">Período Atual</th>
                      <th className="text-right p-3 font-bold">Var. Volume</th>
                      <th className="text-right p-3 font-bold">Var. %</th>
                      <th className="text-right p-3 font-bold">Taxa Ant.</th>
                      <th className="text-right p-3 font-bold">Taxa Atual</th>
                      <th className="text-right p-3 font-bold">Var. Taxa</th>
                      <th className="text-center p-3 font-bold">Tendência</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variationData.sort((a, b) => b.rateChange - a.rateChange).map((item, idx) => (
                      <tr key={idx} className={`${idx % 2 === 0 ? "bg-muted/20" : ""} transition-all duration-200 hover:bg-muted/40`}>
                        <td className="p-3 font-medium">{item.estado}</td>
                        <td className="p-3 text-right">{item.previousTotal.toLocaleString()}</td>
                        <td className="p-3 text-right font-semibold">{item.currentTotal.toLocaleString()}</td>
                        <td className={`p-3 text-right font-medium ${item.volumeChange >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {item.volumeChange >= 0 ? '+' : ''}{item.volumeChange.toLocaleString()}
                        </td>
                        <td className={`p-3 text-right ${item.volumeChangePercent >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {item.volumeChangePercent >= 0 ? '+' : ''}{item.volumeChangePercent.toFixed(1)}%
                        </td>
                        <td className="p-3 text-right text-muted-foreground">{item.previousRate.toFixed(1)}%</td>
                        <td className="p-3 text-right font-semibold">{item.currentRate.toFixed(1)}%</td>
                        <td className={`p-3 text-right font-medium ${item.rateChange >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {item.rateChange >= 0 ? '+' : ''}{item.rateChange.toFixed(1)}pp
                        </td>
                        <td className="p-3 text-center">
                          {item.rateChange > 1 ? (
                            <ArrowUp className="h-5 w-5 text-success inline" />
                          ) : item.rateChange < -1 ? (
                            <ArrowDown className="h-5 w-5 text-destructive inline" />
                          ) : (
                            <Minus className="h-5 w-5 text-muted-foreground inline" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>É necessário ter dados de pelo menos 2 períodos para ver a variação.</p>
                <p className="text-sm mt-2">Faça upload de dados de diferentes períodos para habilitar esta análise.</p>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="evolucao" className="space-y-6">
          <Card className="p-6 animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <LineChartIcon className="h-5 w-5 text-primary" />
              <h3 className="font-bold text-lg">Evolução Temporal</h3>
            </div>
            {filteredStateData.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-4">Volume por Estado</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={stateChartData}>
                      <defs>
                        <linearGradient id="colorAtendidas" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#7B5CD6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#7B5CD6" stopOpacity={0.1}/>
                        </linearGradient>
                        <linearGradient id="colorAbandonadas" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#69B8E5" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#69B8E5" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="Atendidas" stroke="#7B5CD6" fillOpacity={1} fill="url(#colorAtendidas)" />
                      <Area type="monotone" dataKey="Abandonadas" stroke="#69B8E5" fillOpacity={1} fill="url(#colorAbandonadas)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-4">Taxa de Atendimento por Estado</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={filteredStateData.map(s => ({ name: s.estado, Taxa: s.taxaAtendimento }))}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                      <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="Taxa" 
                        stroke="#7B5CD6" 
                        strokeWidth={3}
                        dot={{ fill: "#7B5CD6", strokeWidth: 2, r: 5 }}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <LineChartIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum dado disponível para visualização.</p>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="rankings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6 animate-fade-in">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Top Estados por Taxa
              </h3>
              <div className="space-y-3">
                {filteredStateData
                  .sort((a, b) => b.taxaAtendimento - a.taxaAtendimento)
                  .slice(0, 5)
                  .map((state, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${idx === 0 ? 'bg-yellow-500 text-white' : idx === 1 ? 'bg-gray-400 text-white' : idx === 2 ? 'bg-amber-600 text-white' : 'bg-muted text-muted-foreground'}`}>
                          {idx + 1}
                        </span>
                        <span className="font-medium">{state.estado}</span>
                      </div>
                      <span className={`font-bold ${state.taxaAtendimento >= 80 ? 'text-success' : state.taxaAtendimento >= 60 ? 'text-warning' : 'text-destructive'}`}>
                        {state.taxaAtendimento.toFixed(1)}%
                      </span>
                    </div>
                  ))}
              </div>
            </Card>
            <Card className="p-6 animate-fade-in">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Top Estados por Volume
              </h3>
              <div className="space-y-3">
                {filteredStateData
                  .sort((a, b) => b.totalChamadas - a.totalChamadas)
                  .slice(0, 5)
                  .map((state, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${idx === 0 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                          {idx + 1}
                        </span>
                        <span className="font-medium">{state.estado}</span>
                      </div>
                      <span className="font-bold">{state.totalChamadas.toLocaleString()}</span>
                    </div>
                  ))}
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Upload de Dados Agregados - Posicionado ao final */}
      <AggregatedDataUploader onUploadComplete={refreshRecords} />

      {/* Modal de confirmação de exclusão */}
      <DeleteConfirmationModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        onConfirm={handleDelete}
        records={allRecords}
      />
    </div>
  );
};
