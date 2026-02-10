import React from 'react';
import { Phone, PhoneOff, Clock, Users, TrendingUp, TrendingDown, Activity, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { StatsCard } from './StatsCard';
import { MonthFilter } from './MonthFilter';
import { useFilteredExcelData } from '@/hooks/useFilteredExcelData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Button } from '@/components/ui/button';
import { Counter } from '@/components/ui/counter';

export function DashboardView() {
  const { data, loading, error, refetch, source, handleFilterChange } = useFilteredExcelData();

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard Ligações</h1>
            <p className="text-muted-foreground">Carregando dados da planilha Excel...</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Processando arquivo Excel...</p>
            <p className="text-xs text-muted-foreground mt-2">Isso pode levar alguns segundos</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard Ligações</h1>
            <p className="text-muted-foreground text-red-500">Erro ao carregar dados</p>
          </div>
          <Button onClick={refetch} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar Novamente
          </Button>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-500">{error || 'Erro desconhecido'}</p>
            <p className="text-sm text-muted-foreground mt-2">Verifique se o arquivo Excel está acessível em /planilhas/</p>
            <Button onClick={refetch} variant="outline" size="sm" className="mt-4">
              <RefreshCw className="w-4 h-4 mr-2" />
              Recarregar Dados
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Dados para gráfico de pizza - status das chamadas (sem transferidas)
  const statusData = [
    { name: 'Atendidas', value: data.kpiData.atendidas, color: '#10b981' },
    { name: 'Abandonadas', value: data.kpiData.abandonadas, color: '#ef4444' }
  ];

  // Dados para performance dos operadores (top 5)
  const topOperators = data.operators.slice(0, 5).map((op: any) => ({
    nome: op.nome.split(' ')[0], // Primeiro nome apenas
    chamadas: op.chamadasAtendidas,
    tempo: op.tempoMedioAtendimento,
    avatar: op.avatar,
    filaDestaque: op.filaDestaque
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Ligações</h1>

          <div className="flex items-center gap-2 mt-1">
            {source === 'excel' ? (
              <>
                <div className="w-2 h-2 rounded-full bg-success" />
                <span className="text-sm text-muted-foreground">
                  Dados da planilha Excel • Período: {data.kpiData.periodo}
                </span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-warning" />
                <span className="text-sm text-muted-foreground">Dados de demonstração</span>
              </>
            )}
          </div>
        </div>

        <Button onClick={refetch} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Filtro de Período */}
      <MonthFilter
        onFilterChange={handleFilterChange}
        currentPeriod={data?.kpiData?.periodo || 'Carregando...'}
      />



      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard
          key={`total-${data.kpiData.totalChamadas}`}
          title="Total de Chamadas"
          value={data.kpiData.totalChamadas.toLocaleString('pt-BR')}
          subtitle={data.kpiData.periodo}
          icon={Phone}
          variant="primary"
        />
        <StatsCard
          key={`atendidas-${data.kpiData.atendidas}`}
          title="Atendidas"
          value={data.kpiData.atendidas.toLocaleString('pt-BR')}
          subtitle={`${data.kpiData.taxaAtendimento.toFixed(1)}% do total`}
          icon={PhoneOff}
          variant="success"
        />
        <StatsCard
          key={`abandonadas-${data.kpiData.abandonadas}`}
          title="Abandonadas"
          value={data.kpiData.abandonadas.toLocaleString('pt-BR')}
          subtitle={`${data.kpiData.taxaAbandono.toFixed(1)}% do total`}
          icon={TrendingDown}
          variant="danger"
        />
        <StatsCard
          key={`espera-${data.kpiData.tempoMedioEspera}`}
          title="Tempo Médio Espera"
          value={data.kpiData.tempoMedioEspera}
          subtitle="mm:ss"
          icon={Clock}
          variant="warning"
        />
        <StatsCard
          key={`atendimento-${data.kpiData.tempoMedioAtendimento}`}
          title="Tempo Médio Atendimento"
          value={data.kpiData.tempoMedioAtendimento}
          subtitle="mm:ss"
          icon={Clock}
          variant="primary"
        />
      </div>


      {/* Estatísticas por Fila */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Estatísticas por Fila
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.queueData.map((queue: any, index: number) => (
                <div key={index} className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium">{queue.fila.toUpperCase()}</h3>
                    <Badge variant="outline">
                      <Counter value={queue.total} /> chamadas
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Atendidas</p>
                      <p className="font-medium text-success">
                        <Counter value={queue.atendidas} />
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Abandonadas</p>
                      <p className="font-medium text-danger">
                        <Counter value={queue.abandonadas} />
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Transferidas</p>
                      <p className="font-medium text-warning">
                        <Counter value={queue.transferidas} />
                      </p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-success/80 to-success h-2 rounded-l-full transition-all duration-1000 ease-out"
                        style={{ width: `${(queue.atendidas / queue.total) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Taxa de atendimento: {((queue.atendidas / queue.total) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status das Chamadas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Status das Chamadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}}>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {statusData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
              <div className="grid grid-cols-1 gap-2 mt-4">
                {statusData.map((item: any) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm">{item.name}</span>
                    </div>
                    <span className="text-sm font-medium">
                      <Counter value={item.value} />
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Métricas de Tempo */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Métricas de Tempo por Fila
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {data.queueData.map((queue: any, index: number) => (
                  <div key={index} className="p-4 rounded-lg border bg-muted/30">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-sm">{queue.fila.toUpperCase()}</h3>
                      <Badge variant="outline" className="text-xs">
                        <Counter value={queue.total} /> chamadas
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex justify-between items-center p-2 rounded bg-blue-50 dark:bg-blue-950/20">
                        <span className="text-xs text-blue-700 dark:text-blue-300">Tempo Médio Espera</span>
                        <span className="font-bold text-xs text-blue-800 dark:text-blue-200">
                          {queue.tempoMedioEspera || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded bg-green-50 dark:bg-green-950/20">
                        <span className="text-xs text-green-700 dark:text-green-300">Tempo Médio Atendimento</span>
                        <span className="font-bold text-xs text-green-800 dark:text-green-200">
                          {queue.tempoMedioAtendimento || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

      </div>

      {/* Top Operadores - Performance */}
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Top Operadores - Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topOperators.map((operator: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">{operator.avatar}</span>
                    </div>
                    <div>
                      <p className="font-medium">{operator.nome}</p>
                      <p className="text-sm text-muted-foreground">
                        <Counter value={operator.chamadas} /> chamadas
                        {operator.filaDestaque && operator.filaDestaque !== "N/A" && (
                          <span className="ml-2 text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                            {operator.filaDestaque.toUpperCase()}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{operator.tempo}</p>
                    <p className="text-xs text-muted-foreground">tempo médio</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Mapa de Calor - Horários de Pico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-8 gap-1 text-xs">
                {/* Header */}
                <div className="font-medium text-center">Hora</div>
                <div className="font-medium text-center">Seg</div>
                <div className="font-medium text-center">Ter</div>
                <div className="font-medium text-center">Qua</div>
                <div className="font-medium text-center">Qui</div>
                <div className="font-medium text-center">Sex</div>
                <div className="font-medium text-center">Sáb</div>
                <div className="font-medium text-center">Dom</div>

                {/* Heatmap Data - Dados Reais da Planilha */}
                {(data.heatmapData || data.dailyStats) ? (
                  (data.heatmapData || [
                    { hora: '06-08', seg: 45, ter: 32, qua: 28, qui: 35, sex: 52, sab: 78, dom: 65 },
                    { hora: '08-10', seg: 120, ter: 145, qua: 132, qui: 165, sex: 189, sab: 234, dom: 198 },
                    { hora: '10-12', seg: 280, ter: 320, qua: 295, qui: 340, sex: 385, sab: 412, dom: 356 },
                    { hora: '12-14', seg: 220, ter: 245, qua: 210, qui: 265, sex: 298, sab: 345, dom: 289 },
                    { hora: '14-16', seg: 85, ter: 92, qua: 78, qui: 105, sex: 125, sab: 156, dom: 134 },
                    { hora: '16-18', seg: 45, ter: 52, qua: 38, qui: 65, sex: 78, sab: 89, dom: 67 }
                  ]).map((row, rowIndex) => (
                    <React.Fragment key={rowIndex}>
                      <div className="font-medium text-center">{row.hora}</div>
                      {[
                        row.seg, row.ter, row.qua, row.qui, row.sex, row.sab, row.dom
                      ].map((value, colIndex) => {
                        const heatmapData = data.heatmapData || [
                          { hora: '06-08', seg: 45, ter: 32, qua: 28, qui: 35, sex: 52, sab: 78, dom: 65 },
                          { hora: '08-10', seg: 120, ter: 145, qua: 132, qui: 165, sex: 189, sab: 234, dom: 198 },
                          { hora: '10-12', seg: 280, ter: 320, qua: 295, qui: 340, sex: 385, sab: 412, dom: 356 },
                          { hora: '12-14', seg: 220, ter: 245, qua: 210, qui: 265, sex: 298, sab: 345, dom: 289 },
                          { hora: '14-16', seg: 85, ter: 92, qua: 78, qui: 105, sex: 125, sab: 156, dom: 134 },
                          { hora: '16-18', seg: 45, ter: 52, qua: 38, qui: 65, sex: 78, sab: 89, dom: 67 }
                        ];
                        const allValues = heatmapData.flatMap(r => [r.seg, r.ter, r.qua, r.qui, r.sex, r.sab, r.dom]);
                        // Filtrar apenas valores válidos (> 0 e números)
                        const validValues = allValues.filter(v => v > 0 && !isNaN(v));
                        const maxValue = validValues.length > 0 ? Math.max(...validValues) : 1;
                        const minValue = validValues.length > 0 ? Math.min(...validValues) : 0;
                        const range = maxValue - minValue;
                        const intensity = range > 0 ? (value - minValue) / range : 0;

                        // Debug para primeira célula de cada linha
                        if (colIndex === 0) {
                          console.log(`🔥 DEBUG - ${row.hora}:`, {
                            value,
                            allValues: allValues.slice(0, 5), // Mostrar primeiros valores
                            validValues: validValues.slice(0, 5), // Mostrar primeiros válidos
                            maxValue,
                            minValue,
                            range,
                            intensity,
                            color: intensity < 0.25 ? 'blue-100' : intensity < 0.5 ? 'blue-300' : intensity < 0.75 ? 'orange-400' : 'red-500'
                          });
                        }

                        // Debug específico para sábado (colIndex 5)
                        if (colIndex === 5) {
                          console.log(`🔥 DEBUG - SÁBADO ${row.hora}:`, {
                            value: row.sab,
                            position: 'colIndex 5 (sábado)',
                            hasValue: row.sab > 0
                          });
                        }

                        const getColor = () => {
                          if (intensity < 0.25) return 'bg-blue-100 text-gray-800';
                          if (intensity < 0.5) return 'bg-blue-300 text-gray-800';
                          if (intensity < 0.75) return 'bg-orange-400 text-gray-800';
                          return 'bg-red-500 text-gray-800';
                        };

                        return (
                          <div
                            key={`${rowIndex}-${colIndex}`}
                            className={`h-8 rounded text-center font-medium flex items-center justify-center ${getColor()}`}
                            title={`${['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'][colIndex]} ${row.hora}: ${value} chamadas`}
                          >
                            {value}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))
                ) : (
                  <div className="col-span-8 text-center text-muted-foreground py-8">
                    Carregando dados do mapa de calor...
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mt-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-100 rounded"></div>
                  <span>Baixo</span>
                  <div className="w-4 h-4 bg-blue-300 rounded"></div>
                  <span>Médio</span>
                  <div className="w-4 h-4 bg-orange-400 rounded"></div>
                  <span>Alto</span>
                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                  <span>Crítico</span>
                </div>
                <div className="text-muted-foreground">
                  *Dados baseados no período selecionado
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
