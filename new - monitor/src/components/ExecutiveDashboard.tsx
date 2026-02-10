import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FullYearReport } from "@/components/FullYearReport";
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  Phone, 
  MessageSquare,
  Target,
  Clock,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from "lucide-react";

interface ExecutiveDashboardProps {
  phoneData: any;
  chatData: any;
  whatsappData: any;
}

const MONTHS = [
  { value: "2025-06", label: "Jun" },
  { value: "2025-07", label: "Jul" },
  { value: "2025-08", label: "Ago" },
  { value: "2025-09", label: "Set" },
  { value: "2025-10", label: "Out" },
  { value: "2025-11", label: "Nov" },
];

export const ExecutiveDashboard = ({ phoneData, chatData, whatsappData }: ExecutiveDashboardProps) => {
  
  const combineChannelData = (month: string) => {
    const combined = [
      ...phoneData[month as keyof typeof phoneData],
      ...chatData[month as keyof typeof chatData],
      ...whatsappData[month as keyof typeof whatsappData],
    ];
    return combined;
  };

  const calculateMetrics = () => {
    const currentMonth = "2025-11";
    const previousMonth = "2025-10";
    
    const currentData = combineChannelData(currentMonth);
    const previousData = combineChannelData(previousMonth);
    
    const calculateTotals = (data: any[]) => {
      const total = data.reduce((sum, item) => sum + item.answered + item.abandoned, 0);
      const answered = data.reduce((sum, item) => sum + item.answered, 0);
      const abandoned = data.reduce((sum, item) => sum + item.abandoned, 0);
      const rate = total > 0 ? (answered / total) * 100 : 0;
      return { total, answered, abandoned, rate };
    };
    
    const current = calculateTotals(currentData);
    const previous = calculateTotals(previousData);
    
    return {
      current,
      previous,
      growth: {
        total: previous.total > 0 ? ((current.total - previous.total) / previous.total * 100) : 0,
        answered: previous.answered > 0 ? ((current.answered - previous.answered) / previous.answered * 100) : 0,
        rate: current.rate - previous.rate,
      }
    };
  };

  const calculateChannelMetrics = () => {
    const currentMonth = "2025-11";
    const phoneTotal = phoneData[currentMonth].reduce((sum: number, item: any) => sum + item.answered + item.abandoned, 0);
    const chatTotal = chatData[currentMonth].reduce((sum: number, item: any) => sum + item.answered + item.abandoned, 0);
    const whatsappTotal = whatsappData[currentMonth].reduce((sum: number, item: any) => sum + item.answered + item.abandoned, 0);
    
    const total = phoneTotal + chatTotal + whatsappTotal;
    
    return {
      phone: { total: phoneTotal, percentage: total > 0 ? (phoneTotal / total * 100) : 0 },
      chat: { total: chatTotal, percentage: total > 0 ? (chatTotal / total * 100) : 0 },
      whatsapp: { total: whatsappTotal, percentage: total > 0 ? (whatsappTotal / total * 100) : 0 },
    };
  };

  const getTopBottomQueues = () => {
    const currentMonth = "2025-11";
    const data = combineChannelData(currentMonth);
    
    const processedData = data
      .filter(item => item.answered > 0 || item.abandoned > 0)
      .map((item) => ({
        queue: item.queue,
        total: item.answered + item.abandoned,
        rate: item.answered + item.abandoned > 0 ? ((item.answered / (item.answered + item.abandoned)) * 100) : 0,
      }));
    
    const sortedByRate = [...processedData].sort((a, b) => b.rate - a.rate);
    
    return {
      top: sortedByRate.slice(0, 3),
      bottom: sortedByRate.slice(-3).reverse(),
    };
  };

  const metrics = calculateMetrics();
  const channels = calculateChannelMetrics();
  const queues = getTopBottomQueues();

  const getTrendIcon = (value: number) => {
    if (Math.abs(value) < 0.5) return { Icon: Minus, color: "text-muted-foreground" };
    return value > 0 
      ? { Icon: ArrowUpRight, color: "text-success" }
      : { Icon: ArrowDownRight, color: "text-destructive" };
  };

  const totalTrend = getTrendIcon(metrics.growth.total);
  const rateTrend = getTrendIcon(metrics.growth.rate);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard Executivo</h1>
          <p className="text-muted-foreground">Visão consolidada de performance - Novembro 2025</p>
        </div>
        <FullYearReport phoneData={phoneData} chatData={chatData} whatsappData={whatsappData} />
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Phone className="h-6 w-6 text-primary" />
            </div>
            <div className={`flex items-center gap-1 ${totalTrend.color}`}>
              <totalTrend.Icon className="h-4 w-4" />
              <span className="text-sm font-medium">{Math.abs(metrics.growth.total).toFixed(1)}%</span>
            </div>
          </div>
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Volume Total</h3>
          <p className="text-3xl font-bold">{metrics.current.total.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-2">vs {metrics.previous.total.toLocaleString()} mês anterior</p>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-success/10 rounded-lg">
              <CheckCircle2 className="h-6 w-6 text-success" />
            </div>
            <Badge variant={metrics.current.rate >= 80 ? "default" : "destructive"} className="text-xs">
              {metrics.current.rate >= 80 ? "Meta" : "Abaixo"}
            </Badge>
          </div>
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Taxa de Atendimento</h3>
          <p className="text-3xl font-bold">{metrics.current.rate.toFixed(1)}%</p>
          <div className="flex items-center gap-2 mt-2">
            <Progress value={metrics.current.rate} className="flex-1" />
            <span className={`text-xs font-medium ${rateTrend.color}`}>
              {metrics.growth.rate > 0 ? '+' : ''}{metrics.growth.rate.toFixed(1)}pp
            </span>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <Target className="h-6 w-6 text-blue-500" />
            </div>
            <Badge variant="outline" className="text-xs">80% meta</Badge>
          </div>
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Atendidas</h3>
          <p className="text-3xl font-bold text-success">{metrics.current.answered.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-2">
            {((metrics.current.answered / metrics.current.total) * 100).toFixed(1)}% do total
          </p>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-destructive/10 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <Badge variant="outline" className="text-xs text-destructive">-{metrics.growth.rate.toFixed(1)}%</Badge>
          </div>
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Abandonadas</h3>
          <p className="text-3xl font-bold text-destructive">{metrics.current.abandoned.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-2">
            {((metrics.current.abandoned / metrics.current.total) * 100).toFixed(1)}% do total
          </p>
        </Card>
      </div>

      {/* Distribuição por Canal */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          Distribuição por Canal
        </h3>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Telefone</span>
              </div>
              <span className="text-sm font-bold">{channels.phone.percentage.toFixed(1)}%</span>
            </div>
            <Progress value={channels.phone.percentage} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">{channels.phone.total.toLocaleString()} chamadas</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Chat Online</span>
              </div>
              <span className="text-sm font-bold">{channels.chat.percentage.toFixed(1)}%</span>
            </div>
            <Progress value={channels.chat.percentage} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">{channels.chat.total.toLocaleString()} conversas</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-success" />
                <span className="text-sm font-medium">WhatsApp</span>
              </div>
              <span className="text-sm font-bold">{channels.whatsapp.percentage.toFixed(1)}%</span>
            </div>
            <Progress value={channels.whatsapp.percentage} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">{channels.whatsapp.total.toLocaleString()} mensagens</p>
          </div>
        </div>
      </Card>

      {/* Top e Bottom Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-success">
            <TrendingUp className="h-5 w-5" />
            Top 3 Performers
          </h3>
          <div className="space-y-3">
            {queues.top.map((queue, index) => (
              <div key={queue.queue} className="flex items-center justify-between p-3 rounded-lg bg-success/5 border border-success/20">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-success text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{queue.queue}</p>
                    <p className="text-xs text-muted-foreground">{queue.total.toLocaleString()} chamadas</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-success">{queue.rate.toFixed(1)}%</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-destructive">
            <TrendingDown className="h-5 w-5" />
            Filas que Precisam de Atenção
          </h3>
          <div className="space-y-3">
            {queues.bottom.map((queue, index) => (
              <div key={queue.queue} className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-destructive text-white font-bold text-sm">
                    !
                  </div>
                  <div>
                    <p className="font-medium text-sm">{queue.queue}</p>
                    <p className="text-xs text-muted-foreground">{queue.total.toLocaleString()} chamadas</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-destructive">{queue.rate.toFixed(1)}%</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Insights Acionáveis */}
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Insights Acionáveis
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex gap-3 p-4 bg-background rounded-lg">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Target className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-1">Priorizar Recursos</h4>
              <p className="text-xs text-muted-foreground">
                {queues.bottom[0].queue} está {(80 - queues.bottom[0].rate).toFixed(1)}pp abaixo da meta. 
                Considere realocar agentes de filas com melhor desempenho.
              </p>
            </div>
          </div>

          <div className="flex gap-3 p-4 bg-background rounded-lg">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-1">Replicar Sucesso</h4>
              <p className="text-xs text-muted-foreground">
                {queues.top[0].queue} alcançou {queues.top[0].rate.toFixed(1)}% de atendimento. 
                Analise práticas desta equipe para implementar em outras filas.
              </p>
            </div>
          </div>

          <div className="flex gap-3 p-4 bg-background rounded-lg">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-1">Otimizar Horários</h4>
              <p className="text-xs text-muted-foreground">
                Canais online representam {(channels.chat.percentage + channels.whatsapp.percentage).toFixed(1)}% do volume. 
                Considere expandir horário de atendimento digital.
              </p>
            </div>
          </div>

          <div className="flex gap-3 p-4 bg-background rounded-lg">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-1">Monitorar Tendência</h4>
              <p className="text-xs text-muted-foreground">
                Taxa geral {metrics.growth.rate > 0 ? 'aumentou' : 'diminuiu'} {Math.abs(metrics.growth.rate).toFixed(1)}pp. 
                {metrics.growth.rate < 0 ? 'Investigar causas e implementar ações corretivas.' : 'Manter práticas atuais.'}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
