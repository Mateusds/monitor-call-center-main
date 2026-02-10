import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  AlertTriangle, 
  TrendingDown, 
  AlertCircle,
  X,
  Bell,
  BellOff,
  Mail,
  Send,
  Settings
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { notificationManager } from "@/utils/notifications";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { NotificationSettings } from "@/components/NotificationSettings";

interface AlertSystemProps {
  phoneData: any;
  chatData: any;
  whatsappData: any;
}

interface AlertItem {
  id: string;
  type: "critical" | "warning" | "info";
  title: string;
  description: string;
  queue?: string;
  metric?: string;
  value?: number;
  threshold?: number;
}

const MONTHS = [
  { value: "2025-06", label: "Jun" },
  { value: "2025-07", label: "Jul" },
  { value: "2025-08", label: "Ago" },
  { value: "2025-09", label: "Set" },
  { value: "2025-10", label: "Out" },
  { value: "2025-11", label: "Nov" },
];

export const AlertSystem = ({ phoneData, chatData, whatsappData }: AlertSystemProps) => {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [showAlerts, setShowAlerts] = useState(true);
  const [emailAddress, setEmailAddress] = useState("");
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  useEffect(() => {
    const newAlerts = analyzeData();
    setAlerts(newAlerts);

    // Enviar notificações push para alertas críticos
    const criticalAlertsEnabled = localStorage.getItem("notifications.critical") !== "false";
    const warningAlertsEnabled = localStorage.getItem("notifications.warning") !== "false";
    
    if (notificationManager.getPermissionStatus() === "granted") {
      newAlerts.forEach(alert => {
        if (alert.type === "critical" && criticalAlertsEnabled && !dismissedAlerts.has(alert.id)) {
          notificationManager.sendCriticalAlert({
            title: alert.title,
            description: alert.description,
            queue: alert.queue,
            value: alert.value,
          });
        } else if (alert.type === "warning" && warningAlertsEnabled && !dismissedAlerts.has(alert.id)) {
          notificationManager.sendWarningAlert({
            title: alert.title,
            description: alert.description,
            queue: alert.queue,
          });
        }
      });
    }
  }, [phoneData, chatData, whatsappData, dismissedAlerts]);

  const combineChannelData = (month: string) => {
    const combined = [
      ...phoneData[month as keyof typeof phoneData],
      ...chatData[month as keyof typeof chatData],
      ...whatsappData[month as keyof typeof whatsappData],
    ];
    return combined;
  };

  const analyzeData = (): AlertItem[] => {
    const detectedAlerts: AlertItem[] = [];
    
    // Analisar últimos 3 meses para detectar tendências
    const recentMonths = MONTHS.slice(-3);
    
    // Calcular métricas para cada mês
    const monthlyMetrics = recentMonths.map(month => {
      const data = combineChannelData(month.value);
      const aggregated: Record<string, any> = {};
      
      data.forEach((item) => {
        if (!aggregated[item.queue]) {
          aggregated[item.queue] = { answered: 0, abandoned: 0 };
        }
        aggregated[item.queue].answered += item.answered;
        aggregated[item.queue].abandoned += item.abandoned;
      });
      
      return {
        month: month.value,
        label: month.label,
        queues: Object.entries(aggregated).map(([queue, data]) => {
          const total = data.answered + data.abandoned;
          const rate = total > 0 ? (data.answered / total) * 100 : 0;
          return { queue, total, rate, answered: data.answered, abandoned: data.abandoned };
        })
      };
    });

    // Verificar quedas consecutivas de performance
    const currentMonth = monthlyMetrics[monthlyMetrics.length - 1];
    const previousMonth = monthlyMetrics[monthlyMetrics.length - 2];
    
    if (currentMonth && previousMonth) {
      currentMonth.queues.forEach(currentQueue => {
        const prevQueue = previousMonth.queues.find(q => q.queue === currentQueue.queue);
        
        if (prevQueue) {
          const rateDrop = prevQueue.rate - currentQueue.rate;
          
          // Alerta crítico: queda > 10pp
          if (rateDrop > 10) {
            detectedAlerts.push({
              id: `critical-${currentQueue.queue}-rate`,
              type: "critical",
              title: "Queda Crítica de Performance",
              description: `${currentQueue.queue} apresentou queda de ${rateDrop.toFixed(1)}pp na taxa de atendimento. Taxa atual: ${currentQueue.rate.toFixed(1)}%`,
              queue: currentQueue.queue,
              metric: "Taxa de Atendimento",
              value: currentQueue.rate,
              threshold: 80
            });
          }
          // Alerta warning: queda entre 5-10pp
          else if (rateDrop > 5) {
            detectedAlerts.push({
              id: `warning-${currentQueue.queue}-rate`,
              type: "warning",
              title: "Queda de Performance Detectada",
              description: `${currentQueue.queue} teve queda de ${rateDrop.toFixed(1)}pp. Monitorar de perto para evitar deterioração adicional.`,
              queue: currentQueue.queue,
              metric: "Taxa de Atendimento",
              value: currentQueue.rate,
              threshold: 80
            });
          }
          
          // Alertar sobre aumento significativo de abandonos
          const abandonIncrease = ((currentQueue.abandoned - prevQueue.abandoned) / prevQueue.abandoned) * 100;
          if (abandonIncrease > 20 && currentQueue.abandoned > 100) {
            detectedAlerts.push({
              id: `warning-${currentQueue.queue}-abandoned`,
              type: "warning",
              title: "Aumento de Chamadas Abandonadas",
              description: `${currentQueue.queue} teve aumento de ${abandonIncrease.toFixed(0)}% em abandonos. Total: ${currentQueue.abandoned}`,
              queue: currentQueue.queue,
              metric: "Abandonadas",
              value: currentQueue.abandoned
            });
          }
        }
        
        // Alertar sobre filas abaixo da meta
        if (currentQueue.rate < 60 && currentQueue.total > 50) {
          detectedAlerts.push({
            id: `critical-${currentQueue.queue}-below-target`,
            type: "critical",
            title: "Fila Crítica - Abaixo da Meta",
            description: `${currentQueue.queue} está com taxa de ${currentQueue.rate.toFixed(1)}%, muito abaixo da meta de 80%. Ação urgente necessária.`,
            queue: currentQueue.queue,
            metric: "Taxa de Atendimento",
            value: currentQueue.rate,
            threshold: 80
          });
        } else if (currentQueue.rate < 70 && currentQueue.total > 50) {
          detectedAlerts.push({
            id: `warning-${currentQueue.queue}-low-performance`,
            type: "warning",
            title: "Performance Abaixo do Esperado",
            description: `${currentQueue.queue} com taxa de ${currentQueue.rate.toFixed(1)}%, abaixo da meta de 80%. Implementar melhorias.`,
            queue: currentQueue.queue,
            metric: "Taxa de Atendimento",
            value: currentQueue.rate,
            threshold: 80
          });
        }
      });
    }

    // Verificar tendência de 3 meses consecutivos
    if (monthlyMetrics.length >= 3) {
      const allQueues = [...new Set(monthlyMetrics.flatMap(m => m.queues.map(q => q.queue)))];
      
      allQueues.forEach(queueName => {
        const queueHistory = monthlyMetrics.map(m => 
          m.queues.find(q => q.queue === queueName)
        ).filter(q => q !== undefined);
        
        if (queueHistory.length >= 3) {
          const rates = queueHistory.map(q => q!.rate);
          const isDecreasingTrend = rates[0] > rates[1] && rates[1] > rates[2];
          const totalDrop = rates[0] - rates[2];
          
          if (isDecreasingTrend && totalDrop > 8) {
            detectedAlerts.push({
              id: `trend-${queueName}`,
              type: "warning",
              title: "Tendência de Queda Detectada",
              description: `${queueName} mostra queda consecutiva por 3 meses (${rates[0].toFixed(1)}% → ${rates[2].toFixed(1)}%). Tendência negativa requer atenção.`,
              queue: queueName,
              metric: "Tendência",
              value: rates[2]
            });
          }
        }
      });
    }

    return detectedAlerts.sort((a, b) => {
      const order = { critical: 0, warning: 1, info: 2 };
      return order[a.type] - order[b.type];
    });
  };

  const dismissAlert = (alertId: string) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]));
  };

  const sendEmailAlerts = async () => {
    if (!emailAddress || !emailAddress.includes('@')) {
      toast.error("Por favor, insira um email válido");
      return;
    }

    const criticalAlerts = visibleAlerts.filter(a => a.type === "critical");
    if (criticalAlerts.length === 0) {
      toast.info("Nenhum alerta crítico para enviar");
      return;
    }

    setIsSendingEmail(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-alert-email', {
        body: {
          alerts: criticalAlerts.map(a => ({
            type: a.type,
            title: a.title,
            description: a.description,
            queue: a.queue,
            metric: a.metric,
            value: a.value
          })),
          recipientEmail: emailAddress
        }
      });

      if (error) throw error;

      toast.success(`Email enviado com sucesso para ${emailAddress}!`);
      setShowEmailInput(false);
    } catch (error: any) {
      console.error("Erro ao enviar email:", error);
      toast.error("Erro ao enviar email: " + error.message);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const visibleAlerts = alerts.filter(alert => !dismissedAlerts.has(alert.id));
  const criticalCount = visibleAlerts.filter(a => a.type === "critical").length;
  const warningCount = visibleAlerts.filter(a => a.type === "warning").length;

  if (!showAlerts) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BellOff className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Alertas Desativados</p>
              <p className="text-sm text-muted-foreground">
                {alerts.length} alerta{alerts.length !== 1 ? 's' : ''} oculto{alerts.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <Button onClick={() => setShowAlerts(true)} variant="outline" size="sm">
            Mostrar Alertas
          </Button>
        </div>
      </Card>
    );
  }

  if (visibleAlerts.length === 0) {
    return (
      <Card className="p-6 bg-success/5 border-success/20">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-success/10 rounded-full">
            <Bell className="h-6 w-6 text-success" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-success">Tudo em Ordem!</h3>
            <p className="text-sm text-muted-foreground">Nenhum alerta crítico ou warning detectado no momento.</p>
          </div>
          <Button onClick={() => setShowAlerts(false)} variant="ghost" size="sm">
            <BellOff className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-semibold">Sistema de Alertas Automáticos</h3>
              <p className="text-sm text-muted-foreground">
                {criticalCount} crítico{criticalCount !== 1 ? 's' : ''}, {warningCount} aviso{warningCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Settings className="h-4 w-4" />
                  Configurar Notificações
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Configurações de Notificações</DialogTitle>
                  <DialogDescription>
                    Configure como deseja receber alertas sobre problemas de performance
                  </DialogDescription>
                </DialogHeader>
                <NotificationSettings />
              </DialogContent>
            </Dialog>
            
            {criticalCount > 0 && (
              <Button 
                onClick={() => setShowEmailInput(!showEmailInput)} 
                variant="outline" 
                size="sm"
                className="gap-2"
              >
                <Mail className="h-4 w-4" />
                Enviar por Email
              </Button>
            )}
            <Button onClick={() => setShowAlerts(false)} variant="ghost" size="sm">
              <BellOff className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {showEmailInput && (
          <div className="mt-4 p-4 bg-muted/50 rounded-lg space-y-3">
            <div className="space-y-2">
              <Label htmlFor="alert-email">Email para receber alertas críticos</Label>
              <div className="flex gap-2">
                <Input
                  id="alert-email"
                  type="email"
                  placeholder="seu-email@exemplo.com"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendEmailAlerts()}
                />
                <Button 
                  onClick={sendEmailAlerts} 
                  disabled={isSendingEmail}
                  className="gap-2"
                >
                  <Send className="h-4 w-4" />
                  {isSendingEmail ? "Enviando..." : "Enviar"}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Apenas alertas críticos serão enviados. Certifique-se de que validou seu domínio no Resend.
            </p>
          </div>
        )}
      </Card>

      <div className="space-y-3">
        {visibleAlerts.map((alert) => (
          <Alert 
            key={alert.id} 
            variant={alert.type === "critical" ? "destructive" : "default"}
            className={alert.type === "warning" ? "border-amber-500 bg-amber-50 dark:bg-amber-950/20" : ""}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                {alert.type === "critical" ? (
                  <AlertTriangle className="h-5 w-5 mt-0.5" />
                ) : alert.type === "warning" ? (
                  <AlertCircle className="h-5 w-5 mt-0.5 text-amber-600" />
                ) : (
                  <TrendingDown className="h-5 w-5 mt-0.5" />
                )}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <AlertTitle className="text-base">{alert.title}</AlertTitle>
                    <Badge 
                      variant={alert.type === "critical" ? "destructive" : "outline"}
                      className={alert.type === "warning" ? "bg-amber-500 text-white" : ""}
                    >
                      {alert.type === "critical" ? "Crítico" : "Aviso"}
                    </Badge>
                  </div>
                  <AlertDescription className="text-sm">
                    {alert.description}
                  </AlertDescription>
                  {alert.queue && (
                    <div className="flex gap-2 mt-2 text-xs">
                      {alert.metric && <Badge variant="outline">Métrica: {alert.metric}</Badge>}
                      {alert.value !== undefined && (
                        <Badge variant="outline">
                          Valor: {alert.metric?.includes("Taxa") ? `${alert.value.toFixed(1)}%` : alert.value}
                        </Badge>
                      )}
                      {alert.threshold && (
                        <Badge variant="outline">Meta: {alert.threshold}%</Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 -mt-1"
                onClick={() => dismissAlert(alert.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </Alert>
        ))}
      </div>
    </div>
  );
};
