import { useState, useEffect } from 'react';
import { BarChart3, MessageCircle, Clock, Users, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { readChatCsvFile, processChatData } from '@/lib/chatCsvReader';

export function AnalyticsChatView() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorV, setErrorV] = useState<string | null>(null);
  const [periodo, setPeriodo] = useState('Geral');

  const loadData = async () => {
    setLoading(true);
    setErrorV(null);
    try {
      const csvData = await readChatCsvFile('/planilhas/novobotdralis.csv');
      const processed = processChatData(csvData);
      setData(processed);
    } catch (error: any) {
      console.error("Failed to load analytics chat data", error);
      setErrorV(error.message || "Erro desconhecido ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Activity className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (errorV) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-destructive gap-4">
        <Activity className="w-12 h-12" />
        <div className="text-lg font-bold">Erro ao carregar Analytics</div>
        <div className="text-sm font-mono bg-muted p-2 rounded max-w-lg text-center break-words">{errorV}</div>
        <Button onClick={loadData} variant="outline">Tentar Novamente</Button>
      </div>
    );
  }

  if (!data) return <div>Dados não encontrados.</div>;

  const { kpis, operators, dailyStats } = data;

  const satisfactionData = [
    { name: 'Excelente', value: 45, color: '#10b981' },
    { name: 'Bom', value: 30, color: '#3b82f6' },
    { name: 'Regular', value: 18, color: '#f59e0b' },
    { name: 'Ruim', value: 7, color: '#ef4444' }
  ];

  // Agrupar dailyStats por mês para o gráfico de volume
  const monthlyDataMap = new Map();
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  dailyStats.forEach((s: any) => {
    // s.data está no formato YYYY-MM-DD
    const [year, month] = s.data.split('-');
    const monthIndex = parseInt(month, 10) - 1;
    const monthKey = `${year}-${month}`;
    const monthLabel = `${monthNames[monthIndex]}/${year.slice(-2)}`;

    if (!monthlyDataMap.has(monthKey)) {
      monthlyDataMap.set(monthKey, {
        monthKey,
        monthLabel,
        total: 0,
        atendidas: 0,
        abandonadas: 0
      });
    }

    const item = monthlyDataMap.get(monthKey);
    item.total += s.total;
    item.atendidas += s.atendidas;
    item.abandonadas += s.abandonadas;
  });

  const volumeChartData = Array.from(monthlyDataMap.values())
    .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
    .map(item => ({
      day: item.monthLabel, // Mantendo 'day' como chave para não quebrar o gráfico
      total: item.total,
      atendidas: item.atendidas,
      abandonadas: item.abandonadas
    }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics Chat</h1>
          <p className="text-muted-foreground">Análise detalhada do atendimento via chat</p>
        </div>

      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Chats</p>
                <p className="text-2xl font-bold text-primary">{kpis.totalChamadas}</p>
              </div>
              <MessageCircle className="w-8 h-8 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Atendimento</p>
                <p className="text-2xl font-bold text-success">{kpis.taxaAtendimento.toFixed(1)}%</p>
              </div>
              <Activity className="w-8 h-8 text-success opacity-20" />
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
                  <Clock className="w-8 h-8 text-info opacity-20" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Tempo Médio de Espera na Fila</p>
              </TooltipContent>
            </Tooltip>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">T.M.A</p>
                <p className="text-2xl font-bold text-primary">{kpis.tempoMedioAtendimento}</p>
                <p className="text-xs text-muted-foreground mt-1">Tempo Médio Atendimento</p>
              </div>
              <Activity className="w-8 h-8 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6">
        {/* Volume de Chats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Volume de Chats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={volumeChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="atendidas" fill="#10b981" name="Atendidas" />
                  <Bar dataKey="abandonadas" fill="#ef4444" name="Abandonadas" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Performance dos Operadores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {operators.map((operator: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">{operator.avatar}</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{operator.nome}</p>
                      <p className="text-xs text-muted-foreground">{operator.chamadasAtendidas} chats atendidos</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm font-medium">⭐ 4.8</p>
                      <p className="text-[10px] text-muted-foreground">Satisfação</p>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div tabIndex={0} className="text-right cursor-helper outline-none">
                          <p className="text-sm font-medium font-mono">{operator.tempoMedioAtendimento}</p>
                          <p className="text-[10px] text-muted-foreground">T.M.A</p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Tempo Médio de Atendimento</p>
                      </TooltipContent>
                    </Tooltip>
                    <Badge variant="outline" className="text-[10px] bg-success/5 text-success border-success/20">
                      Excelente
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
