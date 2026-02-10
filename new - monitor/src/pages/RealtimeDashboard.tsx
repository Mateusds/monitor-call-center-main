import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Headphones, 
  UserCheck, 
  Coffee,
  ArrowLeft,
  RefreshCw,
  Wifi,
  WifiOff
} from "lucide-react";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from "recharts";
import { toast } from "sonner";

interface AgentMetrics {
  logados: number;
  emChamada: number;
  disponiveis: number;
  emPausa: number;
}

interface CallMetrics {
  total: number;
  atendidas: number;
  abandonadas: number;
  tma: string;
  tme: string;
  taxaAbandono: number;
}

interface CallStatusData {
  name: string;
  value: number;
  color: string;
}

interface AgentPerformance {
  name: string;
  atendidas: number;
}

// Status colors using project palette
const STATUS_COLORS = {
  answered: "hsl(142, 76%, 36%)", // success
  abandoned: "hsl(0, 84%, 60%)", // destructive
  machineAnswer: "hsl(280, 65%, 60%)", // accent
  busy: "hsl(262, 52%, 47%)", // primary
  noAnswer: "hsl(38, 92%, 50%)", // warning
};

const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export default function RealtimeDashboard() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Simulated realtime data (in production, this would come from Supabase Realtime)
  const [agentMetrics, setAgentMetrics] = useState<AgentMetrics>({
    logados: 7,
    emChamada: 4,
    disponiveis: 2,
    emPausa: 1,
  });

  const [callMetrics, setCallMetrics] = useState<CallMetrics>({
    total: 750,
    atendidas: 421,
    abandonadas: 91,
    tma: formatTime(44),
    tme: formatTime(12),
    taxaAbandono: 12.0,
  });

  const [callStatusData, setCallStatusData] = useState<CallStatusData[]>([
    { name: "ANSWERED", value: 56.1, color: STATUS_COLORS.answered },
    { name: "MACHINEANSWER", value: 16.0, color: STATUS_COLORS.machineAnswer },
    { name: "ABANDONED", value: 12.1, color: STATUS_COLORS.abandoned },
    { name: "BUSY", value: 5.2, color: STATUS_COLORS.busy },
    { name: "NOANSWER", value: 10.4, color: STATUS_COLORS.noAnswer },
  ]);

  const [agentPerformance, setAgentPerformance] = useState<AgentPerformance[]>([
    { name: "mariana", atendidas: 95 },
    { name: "fernando", atendidas: 72 },
    { name: "jonas", atendidas: 58 },
    { name: "sabrina", atendidas: 55 },
    { name: "jessica", atendidas: 54 },
    { name: "adriano", atendidas: 45 },
    { name: "rodolfo", atendidas: 35 },
  ]);

  // Auth protection
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Simulate realtime connection
  useEffect(() => {
    const channel = supabase
      .channel('realtime-dashboard')
      .on('presence', { event: 'sync' }, () => {
        setIsConnected(true);
        setLastUpdate(new Date());
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          setIsLoading(false);
          setLastUpdate(new Date());
          toast.success('Dashboard em tempo real conectado!');
        }
      });

    // Simulate periodic updates
    const interval = setInterval(() => {
      setLastUpdate(new Date());
      // Simulate small variations in metrics
      setAgentMetrics(prev => ({
        ...prev,
        emChamada: Math.max(0, prev.emChamada + Math.floor(Math.random() * 3) - 1),
        disponiveis: Math.max(0, prev.disponiveis + Math.floor(Math.random() * 3) - 1),
      }));
      setCallMetrics(prev => ({
        ...prev,
        total: prev.total + Math.floor(Math.random() * 5),
        atendidas: prev.atendidas + Math.floor(Math.random() * 3),
      }));
    }, 5000);

    // Initial load delay
    setTimeout(() => setIsLoading(false), 1000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  const handleRefresh = () => {
    setLastUpdate(new Date());
    toast.info('Dashboard atualizado');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Dashboard em Tempo Real</h1>
            <p className="text-muted-foreground text-sm">Monitoramento ao vivo do call center</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ConnectionStatus isConnected={isConnected} lastUpdate={lastUpdate} />
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Agent Status Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <AgentStatusCard
          icon={<Users className="h-6 w-6" />}
          value={agentMetrics.logados}
          label="AGENTES LOGADOS"
          colorClass="bg-success text-success-foreground"
          isLoading={isLoading}
        />
        <AgentStatusCard
          icon={<Headphones className="h-6 w-6" />}
          value={agentMetrics.emChamada}
          label="AGENTES EM CHAMADA"
          colorClass="bg-warning text-warning-foreground"
          isLoading={isLoading}
        />
        <AgentStatusCard
          icon={<UserCheck className="h-6 w-6" />}
          value={agentMetrics.disponiveis}
          label="AGENTES DISPONÍVEIS"
          colorClass="bg-primary text-primary-foreground"
          isLoading={isLoading}
        />
        <AgentStatusCard
          icon={<Coffee className="h-6 w-6" />}
          value={agentMetrics.emPausa}
          label="AGENTES EM PAUSA"
          colorClass="bg-destructive text-destructive-foreground"
          isLoading={isLoading}
        />
      </div>

      {/* Call Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <MetricCard
          value={callMetrics.total.toLocaleString()}
          label="CH. TOTAL"
          colorClass="text-primary"
          isLoading={isLoading}
        />
        <MetricCard
          value={callMetrics.atendidas.toLocaleString()}
          label="CH. ATENDIDAS"
          colorClass="text-success"
          isLoading={isLoading}
        />
        <MetricCard
          value={callMetrics.abandonadas.toLocaleString()}
          label="CH. ABANDONADAS"
          colorClass="text-warning"
          isLoading={isLoading}
        />
        <MetricCard
          value={callMetrics.tma}
          label="TMA"
          colorClass="text-accent"
          isLoading={isLoading}
        />
        <MetricCard
          value={callMetrics.tme}
          label="TME"
          colorClass="text-accent"
          isLoading={isLoading}
        />
        <MetricCard
          value={`${callMetrics.taxaAbandono.toFixed(1)}%`}
          label="TAXA ABANDONO"
          colorClass="text-destructive"
          isLoading={isLoading}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut Chart - Call Status */}
        <Card className="p-6 card-violet">
          <h3 className="text-lg font-semibold mb-4">Chamadas x Status</h3>
          {isLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : (
            <div className="h-[300px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={callStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                    labelLine={true}
                  >
                    {callStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`${value.toFixed(1)}%`, 'Percentual']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <div className="text-2xl font-bold text-success">
                    {callStatusData[0].value.toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground">ANSWERED</div>
                </div>
              </div>
            </div>
          )}
          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {callStatusData.map((entry, index) => (
              <div key={index} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-xs text-muted-foreground">
                  {entry.name}: {entry.value.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Bar Chart - Agent Performance */}
        <Card className="p-6 card-violet">
          <h3 className="text-lg font-semibold mb-4">Agente x Atendidas</h3>
          {isLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={agentPerformance} layout="horizontal">
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Bar 
                  dataKey="atendidas" 
                  name="Atendidas"
                  radius={[4, 4, 0, 0]}
                >
                  {agentPerformance.map((_, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={index === 0 ? 'hsl(0, 84%, 60%)' : 
                            index === 1 ? 'hsl(38, 92%, 50%)' :
                            index === 2 ? 'hsl(262, 52%, 47%)' :
                            index === 3 ? 'hsl(280, 65%, 60%)' :
                            index === 4 ? 'hsl(262, 52%, 47%)' :
                            index === 5 ? 'hsl(280, 65%, 60%)' :
                            'hsl(200, 80%, 55%)'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </div>
  );
}

// Agent Status Card Component
interface AgentStatusCardProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  colorClass: string;
  isLoading?: boolean;
}

function AgentStatusCard({ icon, value, label, colorClass, isLoading }: AgentStatusCardProps) {
  if (isLoading) {
    return (
      <Card className="p-4">
        <Skeleton className="h-6 w-6 mb-2" />
        <Skeleton className="h-10 w-16 mb-1" />
        <Skeleton className="h-4 w-24" />
      </Card>
    );
  }

  return (
    <Card className={`p-4 ${colorClass} transition-all hover:scale-105`}>
      <div className="flex flex-col items-center text-center">
        <div className="mb-2 opacity-80">{icon}</div>
        <div className="text-3xl md:text-4xl font-bold">{value}</div>
        <div className="text-xs font-medium opacity-90 mt-1">{label}</div>
      </div>
    </Card>
  );
}

// Metric Card Component
interface MetricCardProps {
  value: string;
  label: string;
  colorClass: string;
  isLoading?: boolean;
}

function MetricCard({ value, label, colorClass, isLoading }: MetricCardProps) {
  if (isLoading) {
    return (
      <Card className="p-4">
        <Skeleton className="h-8 w-20 mb-1" />
        <Skeleton className="h-4 w-16" />
      </Card>
    );
  }

  return (
    <Card className="p-4 card-violet text-center">
      <div className={`text-2xl md:text-3xl font-bold ${colorClass}`}>{value}</div>
      <div className="text-xs text-muted-foreground font-medium mt-1">{label}</div>
    </Card>
  );
}

// Connection Status Component
interface ConnectionStatusProps {
  isConnected: boolean;
  lastUpdate: Date | null;
}

function ConnectionStatus({ isConnected, lastUpdate }: ConnectionStatusProps) {
  const formatTime = (date: Date | null) => {
    if (!date) return "Nunca";
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border">
      <div className="relative">
        {isConnected ? (
          <>
            <Wifi className="h-4 w-4 text-success" />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
            </span>
          </>
        ) : (
          <WifiOff className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
      <div className="text-xs">
        <Badge variant={isConnected ? "default" : "outline"} className={isConnected ? "bg-success" : ""}>
          {isConnected ? "Ao vivo" : "Desconectado"}
        </Badge>
        <p className="text-muted-foreground mt-0.5">{formatTime(lastUpdate)}</p>
      </div>
    </div>
  );
}
