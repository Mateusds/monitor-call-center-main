import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Wifi, WifiOff, Clock } from "lucide-react";
import { useRealtimeData } from "@/hooks/useRealtimeData";

export const RealtimeIndicator = () => {
  const { isListening, lastUpdate, updateCount } = useRealtimeData();

  const formatTime = (date: Date | null) => {
    if (!date) return "Nunca";
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  return (
    <Card className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            {isListening ? (
              <>
                <Wifi className="h-5 w-5 text-success" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-success"></span>
                </span>
              </>
            ) : (
              <WifiOff className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">Tempo Real</span>
              <Badge 
                variant={isListening ? "default" : "outline"}
                className={isListening ? "bg-success" : ""}
              >
                {isListening ? "Ativo" : "Desconectado"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Atualizações automáticas de métricas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm">
          {updateCount > 0 && (
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <div className="text-right">
                <p className="font-semibold">{updateCount}</p>
                <p className="text-xs text-muted-foreground">
                  {updateCount === 1 ? "atualização" : "atualizações"}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div className="text-right">
              <p className="font-medium text-xs">Última atualização</p>
              <p className="text-xs text-muted-foreground">
                {formatTime(lastUpdate)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
