import React from 'react';
import { Phone, Clock, CheckCircle, Activity, TrendingUp, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useFilteredExcelData } from '@/hooks/useFilteredExcelData';
import { MonthFilter } from '../dashboard/MonthFilter';
import { Button } from '@/components/ui/button';
import { Counter } from '@/components/ui/counter';

export function OperatorsView() {
  const { data, loading, error, refetch, handleFilterChange } = useFilteredExcelData();

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Performance dos Operadores</h1>
            <p className="text-muted-foreground">Carregando dados reais da planilha...</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Processando arquivo Excel...</p>
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
            <h1 className="text-2xl font-bold">Performance dos Operadores</h1>
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
            <Button onClick={refetch} variant="outline" size="sm" className="mt-4">
              <RefreshCw className="w-4 h-4 mr-2" />
              Recarregar Dados
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Dados reais dos operadores
  const operators = data.operators;

  // Atividade por hora (equipe total)
  const teamActivity = data.hourlyData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Performance dos Operadores</h1>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-2 h-2 rounded-full bg-success" />
            <span className="text-sm text-muted-foreground">
              Dados Reais • Período: {data.kpiData.periodo}
            </span>
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

      {/* Notificação sobre fonte dos dados */}
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm text-blue-700 dark:text-blue-300">
            📊 Dados obtidos dos relatórios exportados da plataforma <strong>VoipforAll</strong>
          </span>
        </div>
      </div>

      {/* Operator Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {operators.map((operator: any, index: number) => (
          <div key={index} className="glass-card p-6 animate-fade-in">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-2xl font-bold text-primary-foreground glow-primary">
                  {operator.avatar}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{operator.nome}</h3>
                  <p className="text-muted-foreground">Ramal {operator.ramal}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-muted/30 text-center">
                <Phone className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold">
                  <Counter value={operator.chamadasAtendidas} />
                </p>
                <p className="text-xs text-muted-foreground">Total Atendidas</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/30 text-center">
                <Clock className="w-6 h-6 text-secondary mx-auto mb-2" />
                <p className="text-2xl font-bold">{operator.tempoMedioAtendimento}</p>
                <p className="text-xs text-muted-foreground">TMA</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/30 text-center">
                <CheckCircle className="w-6 h-6 text-success mx-auto mb-2" />
                <p className="text-2xl font-bold">
                  <Counter value={operator.hojeAtendidas} />
                </p>
                <p className="text-xs text-muted-foreground">Média/Dia</p>
              </div>
            </div>

            {/* Performance Bar - Comparação com o melhor operador ou meta fixa */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Percentual do volume total</span>
                <span className="font-medium">
                  {((operator.chamadasAtendidas / data.kpiData.atendidas) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all"
                  style={{ width: `${Math.min((operator.chamadasAtendidas / (data.kpiData.atendidas / operators.length) * 50), 100)}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Activity Chart - Real Team Activity */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold">Atividade da Equipe por Hora</h3>
            <p className="text-sm text-muted-foreground">Distribuição de chamadas atendidas ao longo do dia</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-sm text-muted-foreground">Atendidas</span>
            </div>
          </div>
        </div>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={teamActivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 40% 20%)" />
              <XAxis dataKey="hora" stroke="hsl(215 20% 65%)" fontSize={12} />
              <YAxis stroke="hsl(215 20% 65%)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(222 47% 11%)',
                  border: '1px solid hsl(222 40% 20%)',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="atendidas" fill="hsl(187 85% 53%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                <Counter value={data.kpiData.atendidas} />
              </p>
              <p className="text-sm text-muted-foreground">Total atendidas pela equipe</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center">
              <Activity className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{data.kpiData.tempoMedioAtendimento}</p>
              <p className="text-sm text-muted-foreground">Tempo médio de atendimento (TMA)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
