import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingDown, AlertTriangle, Activity } from 'lucide-react';
import { useFilteredExcelData } from '@/hooks/useFilteredExcelData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function AnalyticsView() {
  const { data, loading } = useFilteredExcelData();

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const pieData = [
    { name: 'Abandonadas', value: data.kpiData.abandonadas, color: 'hsl(0 84% 60%)' },
    { name: 'Atendidas', value: data.kpiData.atendidas, color: 'hsl(142 71% 45%)' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Análise detalhada do atendimento - {data.kpiData.periodo}</p>
        </div>
      </div>

      {/* Abandonment Rate Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-card p-6 flex flex-col items-center justify-center">
          <div className="relative w-48 h-48">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="96"
                cy="96"
                r="80"
                stroke="hsl(222 40% 20%)"
                strokeWidth="12"
                fill="none"
              />
              <circle
                cx="96"
                cy="96"
                r="80"
                stroke="url(#gradient)"
                strokeWidth="12"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${(data.kpiData.taxaAbandono / 100) * 502} 502`}
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="hsl(0 84% 60%)" />
                  <stop offset="100%" stopColor="hsl(38 92% 50%)" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold text-destructive">{data.kpiData.taxaAbandono.toFixed(1)}%</span>
              <span className="text-sm text-muted-foreground">Taxa de Abandono</span>
            </div>
          </div>
          <div className="text-center mt-4">
            <p className="text-2xl font-bold">{data.kpiData.totalChamadas.toLocaleString('pt-BR')}</p>
            <p className="text-sm text-muted-foreground">Total de Chamadas</p>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-destructive" />
            Taxa de Abandono
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 rounded-lg bg-destructive/10">
              <span className="text-sm">Abandonadas</span>
              <span className="font-bold text-destructive">{data.kpiData.abandonadas.toLocaleString('pt-BR')}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-success/10">
              <span className="text-sm">Atendidas</span>
              <span className="font-bold text-success">{data.kpiData.atendidas.toLocaleString('pt-BR')}</span>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Métricas de Tempo
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
              <span className="text-sm">Tempo Médio Espera</span>
              <span className="font-bold">{data.kpiData.tempoMedioEspera}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
              <span className="text-sm">Tempo Médio Atendimento</span>
              <span className="font-bold">{data.kpiData.tempoMedioAtendimento}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Queue Comparison */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-4">Performance por Fila</h3>
        <div className="space-y-4">
          {data.queueData.map((queue: any) => {
            const abandonRate = (queue.abandonadas / queue.total) * 100;
            return (
              <div key={queue.fila}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{queue.fila}</span>
                  <span className="text-sm text-destructive">{abandonRate.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-destructive to-warning rounded-full transition-all"
                    style={{ width: `${abandonRate}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Daily Volume Chart */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold">Volume Diário de Chamadas</h3>
            <p className="text-sm text-muted-foreground">{data.kpiData.periodo}</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data.dailyStats}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="data" />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="total" stroke="hsl(142 71% 45%)" fill="hsl(142 71% 45%)" fillOpacity={0.3} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
