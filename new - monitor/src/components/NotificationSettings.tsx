import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Bell, BellOff, CheckCircle2, XCircle, Info } from "lucide-react";
import { notificationManager } from "@/utils/notifications";
import { toast } from "sonner";

export const NotificationSettings = () => {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [criticalAlertsEnabled, setCriticalAlertsEnabled] = useState(true);
  const [warningAlertsEnabled, setWarningAlertsEnabled] = useState(true);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    if (!("Notification" in window)) {
      setIsSupported(false);
      return;
    }
    setPermission(notificationManager.getPermissionStatus());

    // Carregar preferências do localStorage
    const criticalPref = localStorage.getItem("notifications.critical");
    const warningPref = localStorage.getItem("notifications.warning");
    
    if (criticalPref !== null) setCriticalAlertsEnabled(criticalPref === "true");
    if (warningPref !== null) setWarningAlertsEnabled(warningPref === "true");
  }, []);

  const handleRequestPermission = async () => {
    const granted = await notificationManager.requestPermission();
    setPermission(notificationManager.getPermissionStatus());
    
    if (granted) {
      toast.success("Notificações ativadas com sucesso!");
      notificationManager.sendInfoNotification(
        "Notificações Ativas",
        "Você receberá alertas sobre problemas críticos de performance"
      );
    } else {
      toast.error("Permissão negada. Você não receberá notificações.");
    }
  };

  const handleTestNotification = () => {
    if (permission !== "granted") {
      toast.error("Permita notificações primeiro");
      return;
    }

    notificationManager.sendCriticalAlert({
      title: "Teste de Notificação",
      description: "Esta é uma notificação de teste do sistema de alertas",
      queue: "Dashboard de Atendimento",
      value: 45.5,
    });

    toast.success("Notificação de teste enviada!");
  };

  const handleToggleCritical = (enabled: boolean) => {
    setCriticalAlertsEnabled(enabled);
    localStorage.setItem("notifications.critical", enabled.toString());
    toast.success(
      enabled 
        ? "Alertas críticos ativados" 
        : "Alertas críticos desativados"
    );
  };

  const handleToggleWarning = (enabled: boolean) => {
    setWarningAlertsEnabled(enabled);
    localStorage.setItem("notifications.warning", enabled.toString());
    toast.success(
      enabled 
        ? "Avisos ativados" 
        : "Avisos desativados"
    );
  };

  if (!isSupported) {
    return (
      <Card className="p-6 bg-muted/50">
        <div className="flex items-center gap-3">
          <XCircle className="h-5 w-5 text-destructive" />
          <div>
            <h3 className="font-semibold">Notificações Não Suportadas</h3>
            <p className="text-sm text-muted-foreground">
              Este navegador não suporta notificações push
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const getPermissionBadge = () => {
    switch (permission) {
      case "granted":
        return (
          <Badge className="bg-success">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Permitido
          </Badge>
        );
      case "denied":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Bloqueado
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <Info className="h-3 w-3 mr-1" />
            Não Solicitado
          </Badge>
        );
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              permission === "granted" 
                ? "bg-success/10" 
                : "bg-muted"
            }`}>
              {permission === "granted" ? (
                <Bell className="h-5 w-5 text-success" />
              ) : (
                <BellOff className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-lg">Notificações Push</h3>
              <p className="text-sm text-muted-foreground">
                Receba alertas instantâneos no navegador
              </p>
            </div>
          </div>
          {getPermissionBadge()}
        </div>

        {permission !== "granted" && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg">
            <p className="text-sm text-amber-900 dark:text-amber-200 mb-3">
              {permission === "denied" 
                ? "As notificações foram bloqueadas. Para ativar, você precisa permitir notificações nas configurações do navegador."
                : "Clique no botão abaixo para permitir notificações push no navegador."
              }
            </p>
            {permission === "default" && (
              <Button 
                onClick={handleRequestPermission}
                className="w-full"
              >
                <Bell className="h-4 w-4 mr-2" />
                Permitir Notificações
              </Button>
            )}
          </div>
        )}

        {permission === "granted" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex-1">
                <Label htmlFor="critical-alerts" className="text-base font-medium cursor-pointer">
                  Alertas Críticos
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Notificar quando a taxa cair abaixo de 60% ou quedas &gt; 10pp
                </p>
              </div>
              <Switch
                id="critical-alerts"
                checked={criticalAlertsEnabled}
                onCheckedChange={handleToggleCritical}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex-1">
                <Label htmlFor="warning-alerts" className="text-base font-medium cursor-pointer">
                  Avisos
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Notificar sobre quedas moderadas (5-10pp) e tendências negativas
                </p>
              </div>
              <Switch
                id="warning-alerts"
                checked={warningAlertsEnabled}
                onCheckedChange={handleToggleWarning}
              />
            </div>

            <Button 
              onClick={handleTestNotification}
              variant="outline"
              className="w-full"
            >
              Testar Notificação
            </Button>
          </div>
        )}

        <div className="pt-4 border-t space-y-2 text-xs text-muted-foreground">
          <p><strong>Dica:</strong> As notificações funcionam mesmo com a aba fechada!</p>
          <p><strong>Privacidade:</strong> Apenas você verá as notificações, elas não são compartilhadas.</p>
        </div>
      </div>
    </Card>
  );
};
