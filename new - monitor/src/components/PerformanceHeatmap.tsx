import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PerformanceHeatmapProps {
  phoneData: any;
  chatData: any;
  whatsappData: any;
}

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const HOURS = Array.from({ length: 24 }, (_, i) => `${i}h`);

// Simular dados de performance por dia da semana e hora do dia
const generateHeatmapData = () => {
  const data: number[][] = [];
  
  for (let day = 0; day < 7; day++) {
    const dayData: number[] = [];
    for (let hour = 0; hour < 24; hour++) {
      // Simular padrões realistas:
      // - Horário comercial (8h-18h) tem maior performance
      // - Finais de semana têm menor performance
      // - Horários de pico (10h-12h, 14h-16h) têm performance variável
      
      let baseRate = 75; // Taxa base
      
      // Ajustar por dia da semana
      if (day === 0 || day === 6) {
        baseRate -= 15; // Fim de semana
      }
      
      // Ajustar por hora do dia
      if (hour >= 8 && hour <= 18) {
        baseRate += 10; // Horário comercial
      } else if (hour < 6 || hour > 22) {
        baseRate -= 20; // Madrugada
      }
      
      // Picos de demanda
      if ((hour >= 10 && hour <= 12) || (hour >= 14 && hour <= 16)) {
        baseRate -= Math.random() * 10; // Performance pode cair em picos
      }
      
      // Adicionar alguma variação aleatória
      const variation = (Math.random() - 0.5) * 10;
      const rate = Math.max(40, Math.min(95, baseRate + variation));
      
      dayData.push(Math.round(rate));
    }
    data.push(dayData);
  }
  
  return data;
};

export const PerformanceHeatmap = ({ phoneData, chatData, whatsappData }: PerformanceHeatmapProps) => {
  const heatmapData = generateHeatmapData();
  
  // Calcular estatísticas
  const allValues = heatmapData.flat();
  const avgRate = allValues.reduce((sum, val) => sum + val, 0) / allValues.length;
  const maxRate = Math.max(...allValues);
  const minRate = Math.min(...allValues);
  
  // Encontrar melhor e pior horário
  let bestTime = { day: 0, hour: 0, rate: 0 };
  let worstTime = { day: 0, hour: 0, rate: 100 };
  
  heatmapData.forEach((dayData, dayIndex) => {
    dayData.forEach((rate, hourIndex) => {
      if (rate > bestTime.rate) {
        bestTime = { day: dayIndex, hour: hourIndex, rate };
      }
      if (rate < worstTime.rate) {
        worstTime = { day: dayIndex, hour: hourIndex, rate };
      }
    });
  });
  
  const getColor = (value: number) => {
    // Escala de cores: vermelho (baixo) -> amarelo (médio) -> verde (alto)
    if (value >= 80) return "bg-success/90 hover:bg-success";
    if (value >= 70) return "bg-success/60 hover:bg-success/80";
    if (value >= 60) return "bg-amber-400/60 hover:bg-amber-400/80";
    if (value >= 50) return "bg-amber-500/60 hover:bg-amber-500/80";
    return "bg-destructive/60 hover:bg-destructive/80";
  };
  
  const getTextColor = (value: number) => {
    if (value >= 70) return "text-white";
    return "text-foreground";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold mb-1 flex items-center gap-2">
          <Clock className="h-6 w-6 text-primary" />
          Heatmap de Performance
        </h2>
        <p className="text-sm text-muted-foreground">
          Taxa de atendimento por dia da semana e hora do dia (dados simulados)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Taxa Média</p>
              <p className="text-3xl font-bold text-primary">{avgRate.toFixed(1)}%</p>
            </div>
            <Badge variant="outline">Geral</Badge>
          </div>
        </Card>

        <Card className="p-4 bg-success/5 border-success/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Melhor Horário</p>
              <p className="text-2xl font-bold text-success">{bestTime.rate}%</p>
              <p className="text-xs text-muted-foreground mt-1">
                {DAYS[bestTime.day]} às {bestTime.hour}h
              </p>
            </div>
            <Calendar className="h-5 w-5 text-success" />
          </div>
        </Card>

        <Card className="p-4 bg-destructive/5 border-destructive/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Pior Horário</p>
              <p className="text-2xl font-bold text-destructive">{worstTime.rate}%</p>
              <p className="text-xs text-muted-foreground mt-1">
                {DAYS[worstTime.day]} às {worstTime.hour}h
              </p>
            </div>
            <Calendar className="h-5 w-5 text-destructive" />
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Mapa de Calor - Performance por Período</h3>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-destructive/60 rounded" />
              <span className="text-muted-foreground">&lt; 50%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-amber-400/60 rounded" />
              <span className="text-muted-foreground">50-70%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-success/90 rounded" />
              <span className="text-muted-foreground">&gt; 80%</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <TooltipProvider>
            <div className="inline-block min-w-full">
              <div className="flex">
                {/* Header com dias da semana */}
                <div className="flex flex-col">
                  <div className="h-12 w-16" /> {/* Espaço vazio para alinhamento */}
                  {HOURS.map((hour, index) => (
                    <div
                      key={index}
                      className="h-8 w-16 flex items-center justify-end pr-2 text-xs text-muted-foreground"
                    >
                      {hour}
                    </div>
                  ))}
                </div>

                {/* Grid de heatmap */}
                {heatmapData.map((dayData, dayIndex) => (
                  <div key={dayIndex} className="flex flex-col">
                    <div className="h-12 flex items-center justify-center font-semibold text-sm">
                      {DAYS[dayIndex]}
                    </div>
                    {dayData.map((value, hourIndex) => (
                      <Tooltip key={hourIndex}>
                        <TooltipTrigger asChild>
                          <div
                            className={`h-8 w-12 m-0.5 rounded flex items-center justify-center text-xs font-medium transition-all cursor-pointer ${getColor(value)} ${getTextColor(value)}`}
                          >
                            {value}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-semibold">{DAYS[dayIndex]} às {hourIndex}h</p>
                          <p className="text-sm">Taxa de atendimento: {value}%</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </TooltipProvider>
        </div>
      </Card>

      <Card className="p-6 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-600" />
          Insights do Heatmap
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex gap-3 p-3 bg-background rounded-lg">
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-2 h-2 rounded-full bg-success" />
            </div>
            <div>
              <p className="font-medium mb-1">Horários de Pico Eficientes</p>
              <p className="text-muted-foreground">
                Segunda a Sexta, entre 8h-11h e 15h-17h apresentam as melhores taxas de atendimento.
              </p>
            </div>
          </div>

          <div className="flex gap-3 p-3 bg-background rounded-lg">
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-2 h-2 rounded-full bg-destructive" />
            </div>
            <div>
              <p className="font-medium mb-1">Períodos Críticos</p>
              <p className="text-muted-foreground">
                Finais de semana e horários noturnos (após 20h) precisam de reforço ou automação.
              </p>
            </div>
          </div>

          <div className="flex gap-3 p-3 bg-background rounded-lg">
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
            </div>
            <div>
              <p className="font-medium mb-1">Oportunidade de Melhoria</p>
              <p className="text-muted-foreground">
                Horário de almoço (12h-14h) mostra queda na performance. Considere escalonamento de pausas.
              </p>
            </div>
          </div>

          <div className="flex gap-3 p-3 bg-background rounded-lg">
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-2 h-2 rounded-full bg-primary" />
            </div>
            <div>
              <p className="font-medium mb-1">Recomendação</p>
              <p className="text-muted-foreground">
                Implementar chatbot para cobrir horários de baixa performance e reduzir abandonos.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
