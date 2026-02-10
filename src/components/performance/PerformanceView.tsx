import React from 'react';
import { Trophy, AlertTriangle, TrendingDown, CheckCircle, TrendingUp, BarChart3, Activity, RefreshCw, Star, Target, ShieldAlert, Zap, Clock, PhoneOff, Users, Calendar } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useFilteredExcelData } from '@/hooks/useFilteredExcelData';
import { PerformanceCard } from './PerformanceCard';
import { InsightCard } from './InsightCard';
import { MonthFilter } from '../dashboard/MonthFilter';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { useCounter } from '@/hooks/useCounter';

const CountUp = ({ value, isPercentage = false, decimal = false }: { value: number, isPercentage?: boolean, decimal?: boolean }) => {
    const { count } = useCounter({
        end: value,
        duration: 1500,
        start: 0,
        key: `${value}`
    });

    if (isPercentage) {
        return <>{count.toFixed(1)}%</>;
    }
    if (decimal) {
        return <>{count.toFixed(1)}</>;
    }
    return <>{count.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</>;
};

export function PerformanceView() {
    const { data, loading, error, refetch, handleFilterChange } = useFilteredExcelData();

    if (loading || !data) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const queues = data.queueData;
    if (queues.length === 0) return <div>Sem dados para análise.</div>;

    // Cálculos de Performance
    const processedData = queues.map((q: any) => ({
        queue: q.fila,
        total: q.total,
        answered: q.atendidas,
        abandoned: q.abandonadas,
        rate: q.total > 0 ? (q.atendidas / q.total) * 100 : 0
    }));

    const sortedByRate = [...processedData].sort((a, b) => b.rate - a.rate);
    const bestPerformance = sortedByRate[0];
    const worstPerformance = sortedByRate[sortedByRate.length - 1];

    const totalCalls = processedData.reduce((sum, item) => sum + item.total, 0);
    const totalAnswered = processedData.reduce((sum, item) => sum + item.answered, 0);
    const totalAbandoned = processedData.reduce((sum, item) => sum + item.abandoned, 0);
    const averageAbandonmentRate = totalCalls > 0 ? (totalAbandoned / totalCalls) * 100 : 0;

    const averageRate = data.kpiData.taxaAtendimento || 0;
    const highPerformanceQueues = processedData.filter(q => q.rate >= 80).length;
    const efficiencyRate = processedData.length > 0 ? (highPerformanceQueues / processedData.length) * 100 : 0;

    const highestVolume = [...processedData].sort((a, b) => b.total - a.total)[0] || { queue: 'N/A', total: 0 };
    const mostAbandoned = [...processedData].sort((a, b) => b.abandoned - a.abandoned)[0] || { queue: 'N/A', abandoned: 0 };

    const queuesAboveAverage = processedData.filter(q => q.rate > averageRate).length;
    const queuesBelowAverage = processedData.filter(q => q.rate < averageRate).length;

    // Identificar filas que estão abaixo da meta de excelência (80%)
    const criticalThreshold = 80;
    const criticalQueuesCount = processedData.filter(q => q.rate < criticalThreshold && q.total > 0).length;


    // Destaque Positivo: Alto volume + boa taxa
    const mostImprovedQueue = [...processedData].sort((a, b) => (b.total * b.rate) - (a.total * a.rate))[0];
    const performanceGap = bestPerformance.rate - worstPerformance.rate;

    // Análise de Operadores
    const operators = (data.operators || []) as any[];
    const timeToSeconds = (timeStr: string = '00:00:00') => {
        if (!timeStr) return 0;
        const parts = timeStr.split(':').map(Number);
        if (parts.length === 3) return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
        if (parts.length === 2) return (parts[0] * 60) + parts[1];
        return 0;
    };

    const top5Productive = [...operators]
        .sort((a, b) => b.chamadasAtendidas - a.chamadasAtendidas)
        .slice(0, 5)
        .map(op => ({
            label: op.nome,
            subLabel: op.filaDestaque,
            value: op.chamadasAtendidas
        }));

    const bottom5Productive = [...operators]
        .filter(op => op.chamadasAtendidas > 0)
        .sort((a, b) => a.chamadasAtendidas - b.chamadasAtendidas)
        .slice(0, 5)
        .map(op => ({
            label: op.nome,
            subLabel: op.filaDestaque,
            value: op.chamadasAtendidas
        }));

    const temporalData = data.dailyStats ? data.dailyStats.map((stat: any) => ({
        month: stat.data,
        answered: stat.atendidas,
        abandoned: stat.abandonadas,
        total: stat.total
    })).slice(0, 7) : [];

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Dashboard WhatsApp</h1>
                    <p className="text-muted-foreground font-medium flex items-center gap-2 mt-1">
                        <span className="w-2 h-2 rounded-full bg-success" />
                        Dados da planilha Excel • Período: novembro/2025 a janeiro/2026
                    </p>
                </div>

                <Button onClick={refetch} variant="outline" size="sm">
                    <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
                    Atualizar
                </Button>
            </div>

            {/* Filtro de Período */}
            <MonthFilter
                onFilterChange={handleFilterChange}
                currentPeriod={data.kpiData.periodo}
            />





            {/* Detailed Ranking & Efficiency Section */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-3 stat-card p-6">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                                <BarChart3 className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold tracking-tight text-white/90">Ranking de Eficiência Operacional</h2>
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-1">Comparativo de conversão por fila de atendimento</p>
                            </div>
                        </div>
                        <div className="hidden md:flex items-center gap-4 text-[10px] font-black uppercase text-muted-foreground/40 italic">
                            <span>* Meta mínima: 80%</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {sortedByRate.map((item, idx) => (
                            <div key={idx} className="group relative p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all">
                                <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
                                    <div className="flex items-center gap-4 min-w-[200px]">
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black shadow-lg",
                                            idx === 0 ? "bg-yellow-500/20 text-yellow-500" :
                                                idx === processedData.length - 1 ? "bg-red-500/20 text-red-500" : "bg-white/5 text-muted-foreground"
                                        )}>
                                            {idx + 1}º
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-sm tracking-tight text-white/80 group-hover:text-primary transition-colors truncate uppercase">{item.queue}</p>
                                            <p className="text-[10px] font-bold text-muted-foreground/60 uppercase">
                                                <CountUp value={item.total} /> total
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex-1 space-y-2">
                                        <div className="flex justify-between items-end">
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] font-black uppercase text-muted-foreground/40">Status:</span>
                                                <span className={cn(
                                                    "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md",
                                                    item.rate >= 80 ? "bg-success/10 text-success" :
                                                        item.rate >= 60 ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive"
                                                )}>
                                                    {item.rate >= 80 ? 'Excelente' : item.rate >= 60 ? 'Estável' : 'Critico'}
                                                </span>
                                            </div>
                                            <span className="text-sm font-black gradient-text">
                                                <CountUp value={item.rate} isPercentage />
                                            </span>
                                        </div>
                                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className={cn(
                                                    "h-full rounded-full transition-all duration-1000 ease-out",
                                                    item.rate >= 80 ? "bg-gradient-to-r from-success to-primary" :
                                                        item.rate >= 60 ? "bg-gradient-to-r from-warning to-primary" : "bg-gradient-to-r from-destructive to-primary"
                                                )}
                                                style={{ width: `${item.rate}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6 text-center">
                                        <div>
                                            <p className="text-[10px] font-bold text-muted-foreground/40 uppercase">Atendidas</p>
                                            <p className="text-sm font-black text-white/70">
                                                <CountUp value={item.answered} />
                                            </p>
                                        </div>
                                        <div className="w-px h-8 bg-white/5" />
                                        <div>
                                            <p className="text-[10px] font-bold text-muted-foreground/40 uppercase">Abandoned</p>
                                            <p className="text-sm font-black text-destructive/70">
                                                <CountUp value={item.abandoned} />
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Evolução Mensal Chart */}
            <div className="stat-card p-6">
                <div className="flex items-center gap-2 mb-6">
                    <Calendar className="h-5 w-5 text-primary" />
                    <h3 className="text-xl font-bold text-white/90">Evolução Diária</h3>
                </div>

                <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={temporalData}>
                            <defs>
                                <linearGradient id="colorAnsweredEvol" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1} />
                                </linearGradient>
                                <linearGradient id="colorAbandonedEvol" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" className="opacity-10" />
                            <XAxis
                                dataKey="month"
                                stroke="#525252"
                                tick={{ fill: '#a3a3a3', fontSize: 12 }}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="#525252"
                                tick={{ fill: '#a3a3a3', fontSize: 12 }}
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip
                                content={({ active, payload, label }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl p-3 backdrop-blur-xl">
                                                <p className="font-bold text-white mb-2">{label}</p>
                                                {payload.map((entry: any, index: number) => (
                                                    <div key={index} className="flex items-center gap-2 text-xs mb-1">
                                                        <div
                                                            className="w-2 h-2 rounded-full"
                                                            style={{ backgroundColor: entry.color }}
                                                        />
                                                        <span className="text-gray-400">{entry.name}:</span>
                                                        <span className="font-bold text-white ml-auto">
                                                            {Number(entry.value).toLocaleString()}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Legend />
                            <Area
                                type="monotone"
                                dataKey="answered"
                                name="Atendidas"
                                stroke="#22c55e"
                                fillOpacity={1}
                                fill="url(#colorAnsweredEvol)"
                            />
                            <Area
                                type="monotone"
                                dataKey="abandoned"
                                name="Abandonadas"
                                stroke="#ef4444"
                                fillOpacity={1}
                                fill="url(#colorAbandonedEvol)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* AI Insights Section */}
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-secondary/10 text-secondary">
                        <Activity className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-white/90">Insights de Operação</h2>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-1">Análise automática de padrões e gargalos estruturais</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InsightCard
                        title="Maior Volume Operacional"
                        queueName={highestVolume.queue}
                        value={highestVolume.total}
                        pieData={[
                            { name: highestVolume.queue, value: highestVolume.total, color: '#3b82f6' },
                            { name: 'Outros', value: data.kpiData.totalChamadas - highestVolume.total, color: '#1e293b' }
                        ]}
                        icon={BarChart3}
                        iconBg="bg-blue-500/10 text-blue-500"
                        borderColor="border-blue-500"
                        tip="💡 Considere reforçar equipe nesta fila nos horários de pico."
                        tooltipText={`${highestVolume.queue} concentra o maior volume de tráfego do período.`}
                    />
                    <InsightCard
                        title="Gargalo de Abandono"
                        queueName={mostAbandoned.queue}
                        value={mostAbandoned.abandoned}
                        pieData={[
                            { name: mostAbandoned.queue, value: mostAbandoned.abandoned, color: '#ef4444' },
                            { name: 'Outros', value: data.kpiData.abandonadas - mostAbandoned.abandoned, color: '#1e293b' }
                        ]}
                        icon={PhoneOff}
                        iconBg="bg-red-500/10 text-red-500"
                        borderColor="border-red-500"
                        tip="⚠️ Nível crítico de desistência detectado. Revise o TMA."
                        tooltipText={`A fila ${mostAbandoned.queue} possui o maior volume absoluto de abandonos.`}
                    />
                </div>
            </div>

            {/* Operator Performance Section */}
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-white/90">Destaques de Operadores</h2>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-1">Análise de produtividade e eficiência individual</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InsightCard
                        title="Top 5: Líderes de Produtividade"
                        items={top5Productive}
                        icon={Trophy}
                        iconBg="bg-yellow-500/10 text-yellow-500"
                        borderColor="border-yellow-500"
                        tip="🏆 Operadores com maior volume de entregas no período."
                        tooltipText="Ranking dos 5 operadores com maior número de chamadas atendidas."
                    />
                    <InsightCard
                        title="Top 5: Baixa Produtividade"
                        items={bottom5Productive}
                        icon={TrendingDown}
                        iconBg="bg-destructive/10 text-destructive"
                        borderColor="border-destructive"
                        tip="📉 Menor volume de atendimentos registrados (ativo)."
                        tooltipText="Análise dos 5 operadores com menor volume de entregas para apoio técnico."
                    />
                </div>
            </div>
        </div>
    );
}

