import { Clock, FileText, TrendingUp, TrendingDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface UploadHistoryItem {
  fileName: string;
  uploadDate: Date;
  period: string;
  recordCount: number;
  states: string[];
  queue: string;
}

interface UploadHistoryProps {
  history: UploadHistoryItem[];
  currentStats?: {
    totalCalls: number;
    previousTotal?: number;
  };
}

const UploadHistory = ({ history, currentStats }: UploadHistoryProps) => {
  if (history.length === 0) return null;

  const latestUpload = history[history.length - 1];
  const percentChange = currentStats?.previousTotal 
    ? ((currentStats.totalCalls - currentStats.previousTotal) / currentStats.previousTotal) * 100
    : 0;

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-5 w-5 text-primary" />
        <h3 className="font-bold text-lg">Histórico de Atualizações</h3>
      </div>

      <div className="space-y-4">
        {/* Última atualização destacada */}
        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <span className="font-medium">Última Atualização</span>
            </div>
            <Badge variant="outline" className="bg-success/10 text-success border-success/20">
              Ativo
            </Badge>
          </div>
          
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Data:</span>{" "}
              <span className="font-medium">
                {latestUpload.uploadDate.toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </p>
            <p>
              <span className="text-muted-foreground">Período:</span>{" "}
              <span className="font-medium">{latestUpload.period}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Registros:</span>{" "}
              <span className="font-medium">{latestUpload.recordCount.toLocaleString()}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Estados:</span>{" "}
              <span className="font-medium">{latestUpload.states.join(', ')}</span>
            </p>
          </div>

          {percentChange !== 0 && (
            <div className="mt-3 pt-3 border-t border-primary/10">
              <div className="flex items-center gap-2">
                {percentChange > 0 ? (
                  <>
                    <TrendingUp className="h-4 w-4 text-success" />
                    <span className="text-sm font-semibold text-success">
                      +{percentChange.toFixed(1)}%
                    </span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-4 w-4 text-destructive" />
                    <span className="text-sm font-semibold text-destructive">
                      {percentChange.toFixed(1)}%
                    </span>
                  </>
                )}
                <span className="text-sm text-muted-foreground">
                  em relação ao período anterior
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Histórico anterior */}
        {history.length > 1 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Uploads Anteriores</p>
            {history.slice(0, -1).reverse().slice(0, 3).map((item, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-muted/30 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{item.fileName}</span>
                  <span className="text-xs text-muted-foreground">
                    {item.recordCount.toLocaleString()} registros
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {item.uploadDate.toLocaleDateString('pt-BR')} • {item.period}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

export default UploadHistory;
