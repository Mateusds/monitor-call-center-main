interface EfficiencyBarProps {
  queue: string;
  answered: number;
  abandoned: number;
  total: number;
  rate: number;
  averageRate: number;
  isOnlineChannel: boolean;
  queueIndex: number;
}

export const EfficiencyBar = ({
  queue,
  answered,
  abandoned,
  total,
  rate,
  averageRate,
  isOnlineChannel,
  queueIndex,
}: EfficiencyBarProps) => {
  const answeredPercentage = total > 0 ? (answered / total) * 100 : 0;
  const abandonedPercentage = total > 0 ? (abandoned / total) * 100 : 0;
  const isAboveAverage = rate >= averageRate;

  // Detecta se é Chat Online ou WhatsApp para aplicar gradiente azul
  const isOnlineQueue = queue.toLowerCase().includes('chat') || queue.toLowerCase().includes('whatsapp');
  
  const gradient = isOnlineQueue
    ? 'linear-gradient(90deg, #7AC7F5 0%, #A5DBFF 100%)' // Gradiente azul para online
    : 'linear-gradient(90deg, #5145C0 0%, #7B6FE5 100%)'; // Gradiente violeta para telefone

  return (
    <div className="space-y-2 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="font-semibold text-sm truncate">{queue}</span>
          {isAboveAverage && (
            <span className="text-xs px-2 py-1 rounded-full bg-success/10 text-success font-medium flex-shrink-0">
              Acima da média
            </span>
          )}
        </div>
        <span className="font-bold text-lg text-primary ml-2 flex-shrink-0">{rate.toFixed(1)}%</span>
      </div>
      
      <div className="flex gap-1 h-8 rounded-lg overflow-hidden bg-background">
        <div
          className="transition-all duration-500 flex items-center justify-center"
          style={{ 
            width: `${answeredPercentage}%`,
            background: gradient
          }}
        >
          {answeredPercentage > 10 && (
            <span className="text-xs font-bold text-white px-2">{answered.toLocaleString()}</span>
          )}
        </div>
        <div
          className="bg-gray-300 transition-all duration-500 flex items-center justify-center"
          style={{ width: `${abandonedPercentage}%` }}
        >
          {abandonedPercentage > 10 && (
            <span className="text-xs font-bold text-gray-700 px-2">{abandoned.toLocaleString()}</span>
          )}
        </div>
      </div>

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>
          {isOnlineChannel ? "Concluídas" : "Atendidas"}: {answered.toLocaleString()} ({answeredPercentage.toFixed(1)}%)
        </span>
        <span>
          Abandonadas: {abandoned.toLocaleString()} ({abandonedPercentage.toFixed(1)}%)
        </span>
      </div>
    </div>
  );
};
