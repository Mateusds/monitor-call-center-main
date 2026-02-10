import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Target, Save, RotateCcw, Phone, CheckCircle, XCircle, Percent, TrendingUp, TrendingDown, BarChart3, Download, FileJson, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, ComposedChart } from "recharts";
import { createExcelFile } from "@/utils/excelUtils";

export interface TargetConfig {
  totalCalls: number;
  answered: number;
  abandoned: number;
  serviceRate: number;
}

export interface HistoricalDataPoint {
  month: string;
  totalCalls: number;
  answered: number;
  abandoned: number;
  serviceRate: number;
}

interface TargetsPanelProps {
  targets: TargetConfig;
  onTargetsChange: (targets: TargetConfig) => void;
  historicalData?: HistoricalDataPoint[];
}

const defaultTargets: TargetConfig = {
  totalCalls: 10000,
  answered: 8500,
  abandoned: 1500,
  serviceRate: 85,
};

const targetConfigs = [
  {
    key: 'totalCalls' as keyof TargetConfig,
    label: 'Total de Atendimentos',
    icon: Phone,
    description: 'Meta de chamadas totais recebidas',
    unit: '',
    min: 0,
    max: 1000000,
  },
  {
    key: 'answered' as keyof TargetConfig,
    label: 'Atendimentos Concluídos',
    icon: CheckCircle,
    description: 'Meta de chamadas atendidas com sucesso',
    unit: '',
    min: 0,
    max: 1000000,
  },
  {
    key: 'abandoned' as keyof TargetConfig,
    label: 'Atendimentos Abandonados',
    icon: XCircle,
    description: 'Limite máximo de chamadas abandonadas',
    unit: '',
    min: 0,
    max: 100000,
  },
  {
    key: 'serviceRate' as keyof TargetConfig,
    label: 'Taxa de Atendimento',
    icon: Percent,
    description: 'Meta percentual de taxa de atendimento',
    unit: '%',
    min: 0,
    max: 100,
  },
];

const kpiOptions = [
  { value: 'totalCalls', label: 'Total de Atendimentos' },
  { value: 'answered', label: 'Atendimentos Concluídos' },
  { value: 'abandoned', label: 'Atendimentos Abandonados' },
  { value: 'serviceRate', label: 'Taxa de Atendimento (%)' },
];

export function TargetsPanel({ targets, onTargetsChange, historicalData = [] }: TargetsPanelProps) {
  const [open, setOpen] = useState(false);
  const [localTargets, setLocalTargets] = useState<TargetConfig>(targets);
  const [selectedKPI, setSelectedKPI] = useState<keyof TargetConfig>('serviceRate');

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setLocalTargets(targets);
    }
    setOpen(isOpen);
  };

  const handleSave = () => {
    onTargetsChange(localTargets);
    setOpen(false);
    toast.success("Metas atualizadas com sucesso!");
  };

  const handleReset = () => {
    setLocalTargets(defaultTargets);
  };

  const handleInputChange = (key: keyof TargetConfig, value: string) => {
    const numValue = parseFloat(value) || 0;
    setLocalTargets(prev => ({
      ...prev,
      [key]: numValue,
    }));
  };

  // Calculate statistics for the selected KPI
  const calculateStats = () => {
    if (historicalData.length === 0) return { trend: 0, achieved: 0, average: 0 };
    
    const values = historicalData.map(d => d[selectedKPI]);
    const target = targets[selectedKPI];
    const average = values.reduce((a, b) => a + b, 0) / values.length;
    
    // For abandoned, lower is better
    const achieved = selectedKPI === 'abandoned'
      ? values.filter(v => v <= target).length
      : values.filter(v => v >= target).length;
    
    // Calculate trend (comparing last value to first)
    const trend = values.length >= 2 
      ? ((values[values.length - 1] - values[0]) / values[0]) * 100
      : 0;
    
    return { trend, achieved, average };
  };

  // Export functions
  const exportToJSON = () => {
    const exportData = {
      metas: {
        totalCalls: targets.totalCalls,
        answered: targets.answered,
        abandoned: targets.abandoned,
        serviceRate: targets.serviceRate,
      },
      historico: historicalData.map(d => ({
        mes: d.month,
        totalChamadas: d.totalCalls,
        atendidas: d.answered,
        abandonadas: d.abandoned,
        taxaAtendimento: d.serviceRate,
      })),
      exportadoEm: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `metas-historico-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Arquivo JSON exportado com sucesso!");
  };

  const exportToExcel = async () => {
    const metasData = [
      { "Métrica": "Total de Atendimentos", "Meta Definida": targets.totalCalls },
      { "Métrica": "Atendimentos Concluídos", "Meta Definida": targets.answered },
      { "Métrica": "Atendimentos Abandonados", "Meta Definida": targets.abandoned },
      { "Métrica": "Taxa de Atendimento (%)", "Meta Definida": targets.serviceRate },
    ];

    const sheets: Array<{ name: string; data: Record<string, any>[] }> = [{ name: "Metas", data: metasData }];
    
    if (historicalData.length > 0) {
      const historicoData = historicalData.map(d => ({
        "Mês": d.month,
        "Total Chamadas": d.totalCalls,
        "Atendidas": d.answered,
        "Abandonadas": d.abandoned,
        "Taxa Atendimento (%)": d.serviceRate,
      }));
      sheets.push({ name: "Histórico", data: historicoData });
    }

    try {
      await createExcelFile(sheets, `metas-historico-${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success("Arquivo Excel exportado com sucesso!");
    } catch (error) {
      toast.error("Erro ao exportar Excel");
    }
  };

  const stats = calculateStats();
  const isPercentageKPI = selectedKPI === 'serviceRate';
  const isAbandonedKPI = selectedKPI === 'abandoned';

  // Prepare chart data
  const chartData = historicalData.map(d => ({
    month: d.month,
    value: d[selectedKPI],
    target: targets[selectedKPI],
  }));

  const formatValue = (value: number) => {
    if (isPercentageKPI) return `${value.toFixed(1)}%`;
    return value.toLocaleString('pt-BR');
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Target className="h-4 w-4" />
          Gerenciar Metas
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Painel de Metas
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="config" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="config">Configuração</TabsTrigger>
            <TabsTrigger value="evolution">Evolução</TabsTrigger>
          </TabsList>
          
          <TabsContent value="config" className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">
              Configure as metas de desempenho para acompanhar o progresso dos KPIs do dashboard.
            </p>

            <div className="space-y-4">
              {targetConfigs.map((config) => {
                const Icon = config.icon;
                return (
                  <div
                    key={config.key}
                    className="flex items-start gap-4 p-4 rounded-lg border bg-card"
                  >
                    <div className="p-2 rounded-md bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor={config.key} className="font-medium">
                          {config.label}
                        </Label>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {config.description}
                      </p>
                      <div className="flex items-center gap-2">
                        <Input
                          id={config.key}
                          type="number"
                          min={config.min}
                          max={config.max}
                          value={localTargets[config.key]}
                          onChange={(e) => handleInputChange(config.key, e.target.value)}
                          className="w-32"
                        />
                        {config.unit && (
                          <span className="text-sm text-muted-foreground">{config.unit}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="gap-2 text-muted-foreground"
              >
                <RotateCcw className="h-4 w-4" />
                Restaurar Padrão
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={exportToJSON}
                  className="gap-2"
                >
                  <FileJson className="h-4 w-4" />
                  JSON
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={exportToExcel}
                  className="gap-2"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Excel
                </Button>
                <Button onClick={handleSave} className="gap-2">
                  <Save className="h-4 w-4" />
                  Salvar
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="evolution" className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Selecionar Métrica
              </Label>
              <Select value={selectedKPI} onValueChange={(v) => setSelectedKPI(v as keyof TargetConfig)}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {kpiOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {historicalData.length > 0 ? (
              <>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fontSize: 12 }} 
                        className="fill-muted-foreground"
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }} 
                        className="fill-muted-foreground"
                        tickFormatter={(v) => isPercentageKPI ? `${v}%` : v.toLocaleString('pt-BR')}
                      />
                      <Tooltip 
                        formatter={(value: number) => [formatValue(value), selectedKPI === 'serviceRate' ? 'Taxa' : 'Valor']}
                        labelFormatter={(label) => `Mês: ${label}`}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--popover))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <ReferenceLine 
                        y={targets[selectedKPI]} 
                        stroke="hsl(var(--muted-foreground))" 
                        strokeDasharray="5 5"
                        label={{ 
                          value: `Meta: ${formatValue(targets[selectedKPI])}`, 
                          position: 'right',
                          fontSize: 10,
                          fill: 'hsl(var(--muted-foreground))'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        fill="url(#colorValue)" 
                        stroke="none"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, strokeWidth: 2 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg border bg-card text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      {stats.trend >= 0 ? (
                        <TrendingUp className={`h-4 w-4 ${isAbandonedKPI ? 'text-destructive' : 'text-success'}`} />
                      ) : (
                        <TrendingDown className={`h-4 w-4 ${isAbandonedKPI ? 'text-success' : 'text-destructive'}`} />
                      )}
                      <span className={`text-sm font-semibold ${
                        isAbandonedKPI 
                          ? (stats.trend <= 0 ? 'text-success' : 'text-destructive')
                          : (stats.trend >= 0 ? 'text-success' : 'text-destructive')
                      }`}>
                        {stats.trend >= 0 ? '+' : ''}{stats.trend.toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Tendência</p>
                  </div>
                  
                  <div className="p-3 rounded-lg border bg-card text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-sm font-semibold">
                        {stats.achieved}/{historicalData.length}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Meses Atingidos</p>
                  </div>
                  
                  <div className="p-3 rounded-lg border bg-card text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <BarChart3 className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold">
                        {formatValue(stats.average)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Média</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-0.5 bg-primary rounded" />
                    <span>Desempenho Real</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-0.5 bg-muted-foreground rounded" style={{ borderStyle: 'dashed' }} />
                    <span>Meta Definida</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                <p className="text-sm">Nenhum dado histórico disponível</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
