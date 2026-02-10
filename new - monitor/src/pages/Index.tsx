import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { UserProfile } from "@/components/UserProfile";
import { ThemeControls } from "@/components/ThemeControls";
import { ChangePasswordDialog } from "@/components/ChangePasswordDialog";
import { toast } from "sonner";
import { Phone, PhoneCall, PhoneOff, Activity, Trophy, BarChart3, CheckCircle, AlertTriangle, RefreshCw, MessagesSquare, MessageSquareMore, MessageSquareX, TrendingUp, TrendingDown, Clock, GitCompare, LineChart as LineChartIcon, LayoutDashboard, Grid3x3, Users, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KPICard } from "@/components/KPICard";
import { PerformanceCard } from "@/components/PerformanceCard";
import { InsightCard } from "@/components/InsightCard";
import { DetailModal } from "@/components/DetailModal";
import { RankingTable } from "@/components/RankingTable";
import { EfficiencyBar } from "@/components/EfficiencyBar";
import { DetailTable } from "@/components/DetailTable";
import { DashboardFilters } from "@/components/DashboardFilters";
import { CallDetailsTab } from "@/components/CallDetailsTab";
import { PeriodComparison } from "@/components/PeriodComparison";
import { TrendAnalysis } from "@/components/TrendAnalysis";
import { ExecutiveDashboard } from "@/components/ExecutiveDashboard";
import { AlertSystem } from "@/components/AlertSystem";
import { PerformanceHeatmap } from "@/components/PerformanceHeatmap";
import { RealtimeIndicator } from "@/components/RealtimeIndicator";
import { QueueDetailsSection } from "@/components/QueueDetailsSection";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const phoneData = {
  "2025-06": [
    { queue: "Call Center assistencial", answered: 3152, abandoned: 861, channel: "phone" },
    { queue: "Credenciados", answered: 512, abandoned: 58, channel: "phone" },
    { queue: "Call Center Financeiro", answered: 902, abandoned: 91, channel: "phone" },
    { queue: "Call Center Cancelamento", answered: 180, abandoned: 23, channel: "phone" },
    { queue: "Marcação Mais Saúde", answered: 718, abandoned: 464, channel: "phone" },
    { queue: "Mais Saúde Unidade X", answered: 0, abandoned: 0, channel: "phone" },
    { queue: "Fortis Laboratório", answered: 0, abandoned: 0, channel: "phone" },
  ],
  "2025-07": [
    { queue: "Call Center assistencial", answered: 3732, abandoned: 880, channel: "phone" },
    { queue: "Credenciados", answered: 492, abandoned: 49, channel: "phone" },
    { queue: "Call Center Financeiro", answered: 983, abandoned: 64, channel: "phone" },
    { queue: "Call Center Cancelamento", answered: 162, abandoned: 18, channel: "phone" },
    { queue: "Marcação Mais Saúde", answered: 1115, abandoned: 437, channel: "phone" },
    { queue: "Mais Saúde Unidade X", answered: 0, abandoned: 0, channel: "phone" },
    { queue: "Fortis Laboratório", answered: 0, abandoned: 0, channel: "phone" },
  ],
  "2025-08": [
    { queue: "Call Center assistencial", answered: 6789, abandoned: 1245, channel: "phone" },
    { queue: "Credenciados", answered: 1036, abandoned: 94, channel: "phone" },
    { queue: "Call Center Financeiro", answered: 1586, abandoned: 142, channel: "phone" },
    { queue: "Call Center Cancelamento", answered: 458, abandoned: 53, channel: "phone" },
    { queue: "Marcação Mais Saúde", answered: 2443, abandoned: 1134, channel: "phone" },
    { queue: "Mais Saúde Unidade X", answered: 259, abandoned: 625, channel: "phone" },
    { queue: "Fortis Laboratório", answered: 66, abandoned: 108, channel: "phone" },
  ],
  "2025-09": [
    { queue: "Call Center assistencial", answered: 3340, abandoned: 683, channel: "phone" },
    { queue: "Credenciados", answered: 700, abandoned: 57, channel: "phone" },
    { queue: "Call Center Financeiro", answered: 807, abandoned: 62, channel: "phone" },
    { queue: "Call Center Cancelamento", answered: 220, abandoned: 26, channel: "phone" },
    { queue: "Marcação Mais Saúde", answered: 1355, abandoned: 439, channel: "phone" },
    { queue: "Mais Saúde Unidade X", answered: 129, abandoned: 355, channel: "phone" },
    { queue: "Fortis Laboratório", answered: 23, abandoned: 65, channel: "phone" },
  ],
  "2025-10": [
    { queue: "Call Center assistencial", answered: 3183, abandoned: 461, channel: "phone" },
    { queue: "Credenciados", answered: 724, abandoned: 47, channel: "phone" },
    { queue: "Call Center Financeiro", answered: 586, abandoned: 28, channel: "phone" },
    { queue: "Call Center Cancelamento", answered: 185, abandoned: 12, channel: "phone" },
    { queue: "Marcação Mais Saúde", answered: 1329, abandoned: 324, channel: "phone" },
    { queue: "Mais Saúde Unidade X", answered: 168, abandoned: 436, channel: "phone" },
    { queue: "Fortis Laboratório", answered: 23, abandoned: 76, channel: "phone" },
  ],
  "2025-11": [
    { queue: "Call Center assistencial", answered: 2706, abandoned: 531, channel: "phone" },
    { queue: "Credenciados", answered: 642, abandoned: 38, channel: "phone" },
    { queue: "Call Center Financeiro", answered: 627, abandoned: 33, channel: "phone" },
    { queue: "Call Center Cancelamento", answered: 127, abandoned: 13, channel: "phone" },
    { queue: "Marcação Mais Saúde", answered: 1249, abandoned: 242, channel: "phone" },
    { queue: "Mais Saúde Unidade X", answered: 115, abandoned: 390, channel: "phone" },
    { queue: "Fortis Laboratório", answered: 28, abandoned: 75, channel: "phone" },
  ],
};

const chatData = {
  "2025-06": [{ queue: "Chat Online", answered: 2433, abandoned: 642, channel: "chat" }],
  "2025-07": [{ queue: "Chat Online", answered: 3064, abandoned: 1052, channel: "chat" }],
  "2025-08": [{ queue: "Chat Online", answered: 2650, abandoned: 744, channel: "chat" }],
  "2025-09": [{ queue: "Chat Online", answered: 3702, abandoned: 1286, channel: "chat" }],
  "2025-10": [{ queue: "Chat Online", answered: 2795, abandoned: 851, channel: "chat" }],
  "2025-11": [{ queue: "Chat Online", answered: 2219, abandoned: 556, channel: "chat" }],
};

const whatsappData = {
  "2025-06": [],
  "2025-07": [],
  "2025-08": [{ queue: "WhatsApp", answered: 969, abandoned: 19, channel: "whatsapp" }],
  "2025-09": [{ queue: "WhatsApp", answered: 1093, abandoned: 21, channel: "whatsapp" }],
  "2025-10": [{ queue: "WhatsApp", answered: 1031, abandoned: 22, channel: "whatsapp" }],
  "2025-11": [{ queue: "WhatsApp", answered: 793, abandoned: 13, channel: "whatsapp" }],
};

const combineChannelData = (month: string, channels: string[]) => {
  let combined: any[] = [];
  channels.forEach(channel => {
    if (channel === "phone") combined = [...combined, ...phoneData[month as keyof typeof phoneData]];
    else if (channel === "chat") combined = [...combined, ...chatData[month as keyof typeof chatData]];
    else if (channel === "whatsapp") combined = [...combined, ...whatsappData[month as keyof typeof whatsappData]];
  });
  return combined;
};

const Index = () => {
  const navigate = useNavigate();
  const { user, loading, isAdmin, profile, updatePasswordChangeStatus } = useAuth();
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [selectedQueues, setSelectedQueues] = useState<string[]>([]);
  const [selectedEfficiencyFilter, setSelectedEfficiencyFilter] = useState("all");
  const [selectedDetailFilter, setSelectedDetailFilter] = useState("all");
  const [selectedChannelTypes, setSelectedChannelTypes] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: "", content: null as React.ReactNode });
  const [refreshKey, setRefreshKey] = useState(0);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  
  // Custom targets state
  const [customTargets, setCustomTargets] = useState(() => {
    const saved = localStorage.getItem('dashboard-kpi-targets');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return { totalCalls: 10000, answered: 8500, abandoned: 1500, serviceRate: 85 };
      }
    }
    return { totalCalls: 10000, answered: 8500, abandoned: 1500, serviceRate: 85 };
  });

  useEffect(() => {
    localStorage.setItem('dashboard-kpi-targets', JSON.stringify(customTargets));
  }, [customTargets]);

  // Proteger rota
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Verificar se precisa trocar senha
  useEffect(() => {
    if (profile?.requires_password_change) {
      setShowPasswordChange(true);
    }
  }, [profile]);

  // Escutar eventos de atualização em tempo real
  useEffect(() => {
    const handleRealtimeUpdate = (event: CustomEvent) => {
      console.log('Dashboard recebeu atualização em tempo real:', event.detail);
      // Força re-renderização dos componentes
      setRefreshKey(prev => prev + 1);
    };

    window.addEventListener('realtimeUpdate', handleRealtimeUpdate as EventListener);
    
    return () => {
      window.removeEventListener('realtimeUpdate', handleRealtimeUpdate as EventListener);
    };
  }, []);

  const getRawData = () => {
    // Define months: se nenhum selecionado, usa todos
    const monthsToUse = selectedMonths.length === 0 
      ? ["2025-06", "2025-07", "2025-08", "2025-09", "2025-10", "2025-11"]
      : selectedMonths;

    // Define channels: se nenhum selecionado, usa todos
    let channels: string[] = [];
    if (selectedChannelTypes.length === 0) {
      // Se nada selecionado, usa todos os canais
      channels = ["phone", "chat", "whatsapp"];
    } else {
      // Usa os canais selecionados
      if (selectedChannelTypes.includes("phone")) {
        channels.push("phone");
      }
      if (selectedChannelTypes.includes("online")) {
        // Se "Online" está selecionado, inclui chat e whatsapp
        channels.push("chat", "whatsapp");
      }
    }
    
    // Agrega dados de todos os meses e canais selecionados
    const aggregated: Record<string, any> = {};
    
    monthsToUse.forEach(month => {
      const monthData = combineChannelData(month, channels);
      monthData.forEach((item) => {
        if (!aggregated[item.queue]) {
          aggregated[item.queue] = { answered: 0, abandoned: 0, channel: item.channel };
        }
        aggregated[item.queue].answered += item.answered;
        aggregated[item.queue].abandoned += item.abandoned;
      });
    });
    
    return Object.entries(aggregated).map(([queue, data]) => ({
      queue,
      answered: data.answered,
      abandoned: data.abandoned,
      channel: data.channel,
    }));
  };

  const rawData = getRawData();
  const processedData = rawData
    .filter(item => item.answered > 0 || item.abandoned > 0)
    .map((item) => ({
      ...item,
      total: item.answered + item.abandoned,
      rate: item.answered + item.abandoned > 0 ? ((item.answered / (item.answered + item.abandoned)) * 100) : 0,
    }));

  const filteredData = selectedQueues.length === 0 ? processedData : processedData.filter(d => selectedQueues.includes(d.queue));

  const totalCalls = filteredData.reduce((sum, item) => sum + item.total, 0);
  const totalAnswered = filteredData.reduce((sum, item) => sum + item.answered, 0);
  const totalAbandoned = filteredData.reduce((sum, item) => sum + item.abandoned, 0);
  const averageRate = totalCalls > 0 ? (totalAnswered / totalCalls) * 100 : 0;

  const rankingByEfficiency = [...filteredData].sort((a, b) => b.rate - a.rate).map((item, idx) => ({ position: idx + 1, queue: item.queue, value: item.rate }));
  const rankingByVolume = [...filteredData].sort((a, b) => b.total - a.total).map((item, idx) => ({ position: idx + 1, queue: item.queue, value: item.total }));
  const rankingByAnswered = [...filteredData].sort((a, b) => b.answered - a.answered).map((item, idx) => ({ position: idx + 1, queue: item.queue, value: item.answered }));

  const bestPerformance = filteredData.length > 0 ? filteredData.reduce((max, item) => (item.rate > max.rate ? item : max), filteredData[0]) : { queue: "-", rate: 0, total: 0, answered: 0, abandoned: 0 };
  const worstPerformance = filteredData.length > 0 ? filteredData.reduce((min, item) => (item.rate < min.rate ? item : min), filteredData[0]) : { queue: "-", rate: 0, total: 0, answered: 0, abandoned: 0 };
  const highestVolume = filteredData.length > 0 ? filteredData.reduce((max, item) => (item.total > max.total ? item : max), filteredData[0]) : { queue: "-", rate: 0, total: 0, answered: 0, abandoned: 0 };
  const mostAbandoned = filteredData.length > 0 ? filteredData.reduce((max, item) => (item.abandoned > max.abandoned ? item : max), filteredData[0]) : { queue: "-", rate: 0, total: 0, answered: 0, abandoned: 0 };

  const averageAbandonmentRate = totalCalls > 0 ? (totalAbandoned / totalCalls) * 100 : 0;
  const queuesAboveAverage = filteredData.filter(item => item.rate > averageRate).length;
  const queuesBelowAverage = filteredData.filter(item => item.rate < averageRate).length;
  const mostImprovedQueue = filteredData.length > 0 ? filteredData.reduce((max, item) => (item.rate > max.rate && item.total > 100 ? item : max), filteredData[0]) : { queue: "-", rate: 0 };
  const highPerformanceQueues = filteredData.filter(item => item.rate >= 80).length;
  const efficiencyRate = filteredData.length > 0 ? (highPerformanceQueues / filteredData.length) * 100 : 0;
  const performanceGap = bestPerformance.rate - worstPerformance.rate;

  const isOnlineChannel = selectedChannelTypes.includes("online") && !selectedChannelTypes.includes("phone");
  const chartData = filteredData.map(item => ({
    name: item.queue,
    [isOnlineChannel ? "Concluídas" : "Atendidas"]: item.answered,
    Abandonadas: item.abandoned,
  }));

  const pieData = filteredData.map(item => ({ name: item.queue, value: item.total }));
  const COLORS = ['#4F43BE', '#69B8E5', '#8779E6', '#7A6FE5', '#5145C0', '#FB923C', '#4F43BE'];

  const handleRefresh = () => window.location.reload();
  const openModal = (title: string, content: React.ReactNode) => {
    setModalContent({ title, content });
    setModalOpen(true);
  };

  const getFilteredDataByType = (filterType: string) => {
    let sortedData = [...filteredData];
    
    switch(filterType) {
      case "highest_answered":
        return sortedData.sort((a, b) => b.rate - a.rate);
      case "highest_abandoned":
        const dataWithAbandonRate = sortedData.map(item => ({
          ...item,
          abandonRate: item.total > 0 ? (item.abandoned / item.total) * 100 : 0
        }));
        return dataWithAbandonRate.sort((a, b) => b.abandonRate - a.abandonRate);
      case "highest_demand":
        return sortedData.sort((a, b) => b.total - a.total);
      case "lowest_demand":
        return sortedData.sort((a, b) => a.total - b.total);
      case "performance":
        return sortedData.sort((a, b) => b.rate - a.rate);
      default:
        return sortedData;
    }
  };

  const efficiencyData = getFilteredDataByType(selectedEfficiencyFilter);
  const detailData = getFilteredDataByType(selectedDetailFilter);

  // Auth loading gate - prevent any content render before auth check completes
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If not authenticated, render nothing while redirect happens
  if (!user) {
    return null;
  }

  return (
    <>
      <ChangePasswordDialog 
        open={showPasswordChange}
        onPasswordChanged={async () => {
          await updatePasswordChangeStatus();
          setShowPasswordChange(false);
          toast.success('Senha alterada com sucesso! Você já pode acessar o sistema normalmente.');
        }}
      />
      
      <div className="min-h-screen bg-background p-4 md:p-8" key={refreshKey}>
        <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl shadow-lg bg-gradient-to-br from-[#5B4FBE] to-[#7B6FE5] hover-scale">
              <Activity className="h-7 w-7 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#5B87D6]">
                Dashboard de Atendimento
              </h1>
              <p className="text-muted-foreground text-sm">Visão geral das filas e métricas de performance</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin() && (
              <Button
                onClick={() => navigate('/users')}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Usuários</span>
              </Button>
            )}
            <Button variant="outline" size="sm" className="gap-2" asChild>
              <Link to="/dashboard">
                <Radio className="h-4 w-4" />
                <span className="hidden sm:inline">Tempo Real</span>
              </Link>
            </Button>
            <UserProfile />
            <ThemeControls />
            <Button onClick={handleRefresh} variant="outline" size="icon" className="hover-scale">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Indicador de Tempo Real */}
        <RealtimeIndicator />
        {/* Tabs principais */}
        <Tabs defaultValue="executive" className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-6">
            <TabsTrigger value="executive" className="text-sm md:text-base flex items-center gap-1 md:gap-2">
              <LayoutDashboard className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden md:inline">Executivo</span>
              <span className="md:hidden">Exec</span>
            </TabsTrigger>
            <TabsTrigger value="overview" className="text-sm md:text-base">
              <span className="hidden md:inline">Visão Geral</span>
              <span className="md:hidden">Geral</span>
            </TabsTrigger>
            <TabsTrigger value="details" className="text-sm md:text-base">
              <span className="hidden md:inline">Detalhamento</span>
              <span className="md:hidden">Detalhe</span>
            </TabsTrigger>
            <TabsTrigger value="comparison" className="text-sm md:text-base flex items-center gap-1 md:gap-2">
              <GitCompare className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden md:inline">Comparação</span>
              <span className="md:hidden">Comp</span>
            </TabsTrigger>
            <TabsTrigger value="trends" className="text-sm md:text-base flex items-center gap-1 md:gap-2">
              <LineChartIcon className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden md:inline">Tendências</span>
              <span className="md:hidden">Tend</span>
            </TabsTrigger>
            <TabsTrigger value="heatmap" className="text-sm md:text-base flex items-center gap-1 md:gap-2">
              <Grid3x3 className="h-3 w-3 md:h-4 md:w-4" />
              Heatmap
            </TabsTrigger>
          </TabsList>

          <TabsContent value="executive" className="space-y-6">
            <AlertSystem 
              phoneData={phoneData}
              chatData={chatData}
              whatsappData={whatsappData}
            />
            <ExecutiveDashboard 
              phoneData={phoneData}
              chatData={chatData}
              whatsappData={whatsappData}
            />
          </TabsContent>

          <TabsContent value="overview" className="space-y-8">

        <DashboardFilters
          selectedMonths={selectedMonths}
          selectedQueues={selectedQueues}
          selectedChannelTypes={selectedChannelTypes}
          onMonthsChange={setSelectedMonths}
          onQueuesChange={setSelectedQueues}
          onChannelTypesChange={setSelectedChannelTypes}
          queues={processedData.map(d => d.queue)}
          availableQueues={processedData.map(d => d.queue)}
          exportData={filteredData}
          customTargets={customTargets}
          onTargetsChange={setCustomTargets}
          historicalData={["2025-06", "2025-07", "2025-08", "2025-09", "2025-10", "2025-11"].map(month => {
            const channels = selectedChannelTypes.length === 0 ? ["phone", "chat", "whatsapp"] : selectedChannelTypes.includes("online") ? ["chat", "whatsapp"] : selectedChannelTypes;
            const data = combineChannelData(month, channels);
            const answered = data.reduce((sum, item) => sum + item.answered, 0);
            const abandoned = data.reduce((sum, item) => sum + item.abandoned, 0);
            const total = answered + abandoned;
            return {
              month: month.replace("2025-", "").replace("06", "Jun").replace("07", "Jul").replace("08", "Ago").replace("09", "Set").replace("10", "Out").replace("11", "Nov") + "/25",
              totalCalls: total,
              answered,
              abandoned,
              serviceRate: total > 0 ? (answered / total) * 100 : 0
            };
          })}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title={isOnlineChannel ? "Total de Conversas" : selectedChannelTypes.length === 2 ? "Total de Atendimentos" : "Total de Chamadas"}
            value={totalCalls.toLocaleString()}
            icon={isOnlineChannel ? MessagesSquare : Phone}
            colorClass="text-primary"
            target={customTargets.totalCalls}
            currentValue={totalCalls}
            sparklineData={["2025-06", "2025-07", "2025-08", "2025-09", "2025-10", "2025-11"].map(month => {
              const data = combineChannelData(month, selectedChannelTypes.length === 0 ? ["phone", "chat", "whatsapp"] : selectedChannelTypes.includes("online") ? ["chat", "whatsapp"] : selectedChannelTypes);
              const total = data.reduce((sum, item) => sum + item.answered + item.abandoned, 0);
              return { value: total };
            })}
            showTrend={true}
            showTargetSelector={true}
            onTargetChange={(newTarget) => setCustomTargets(prev => ({ ...prev, totalCalls: newTarget }))}
          />
          <KPICard
            title={isOnlineChannel ? "Conversas Concluídas" : selectedChannelTypes.length === 2 ? "Atendimentos Concluídos" : "Chamadas Atendidas"}
            value={totalAnswered.toLocaleString()}
            subtitle={`${averageRate.toFixed(1)}%`}
            icon={isOnlineChannel ? MessageSquareMore : PhoneCall}
            colorClass="text-success"
            target={customTargets.answered}
            currentValue={totalAnswered}
            sparklineData={["2025-06", "2025-07", "2025-08", "2025-09", "2025-10", "2025-11"].map(month => {
              const data = combineChannelData(month, selectedChannelTypes.length === 0 ? ["phone", "chat", "whatsapp"] : selectedChannelTypes.includes("online") ? ["chat", "whatsapp"] : selectedChannelTypes);
              const answered = data.reduce((sum, item) => sum + item.answered, 0);
              return { value: answered };
            })}
            showTrend={true}
            showTargetSelector={true}
            onTargetChange={(newTarget) => setCustomTargets(prev => ({ ...prev, answered: newTarget }))}
          />
          <KPICard
            title={isOnlineChannel ? "Conversas Abandonadas" : selectedChannelTypes.length === 2 ? "Atendimentos Abandonados" : "Chamadas Abandonadas"}
            value={totalAbandoned.toLocaleString()}
            subtitle={`${((totalAbandoned / totalCalls) * 100).toFixed(1)}%`}
            icon={isOnlineChannel ? MessageSquareX : PhoneOff}
            colorClass="text-destructive"
            target={customTargets.abandoned}
            currentValue={totalAbandoned}
            sparklineData={["2025-06", "2025-07", "2025-08", "2025-09", "2025-10", "2025-11"].map(month => {
              const data = combineChannelData(month, selectedChannelTypes.length === 0 ? ["phone", "chat", "whatsapp"] : selectedChannelTypes.includes("online") ? ["chat", "whatsapp"] : selectedChannelTypes);
              const abandoned = data.reduce((sum, item) => sum + item.abandoned, 0);
              return { value: abandoned };
            })}
            showTrend={true}
            showTargetSelector={true}
            onTargetChange={(newTarget) => setCustomTargets(prev => ({ ...prev, abandoned: newTarget }))}
          />
          <KPICard
            title="Taxa de Atendimento"
            value={`${averageRate.toFixed(1)}%`}
            icon={CheckCircle}
            colorClass="text-chart-1"
            target={customTargets.serviceRate}
            currentValue={averageRate}
            isPercentage={true}
            sparklineData={["2025-06", "2025-07", "2025-08", "2025-09", "2025-10", "2025-11"].map(month => {
              const data = combineChannelData(month, selectedChannelTypes.length === 0 ? ["phone", "chat", "whatsapp"] : selectedChannelTypes.includes("online") ? ["chat", "whatsapp"] : selectedChannelTypes);
              const answered = data.reduce((sum, item) => sum + item.answered, 0);
              const total = data.reduce((sum, item) => sum + item.answered + item.abandoned, 0);
              return { value: total > 0 ? (answered / total) * 100 : 0 };
            })}
            showTrend={true}
            showTargetSelector={true}
            onTargetChange={(newTarget) => setCustomTargets(prev => ({ ...prev, serviceRate: newTarget }))}
          />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">Análise de Performance</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <PerformanceCard
              title="Melhor Performance"
              subtitle="Taxa de atendimento"
              queueName={bestPerformance.queue}
              value={`${bestPerformance.rate.toFixed(1)}%`}
              icon={Trophy}
              iconBg="bg-yellow-50"
              borderColor="border-yellow-500"
              tooltipText={`A fila "${bestPerformance.queue}" alcançou ${bestPerformance.rate.toFixed(1)}% de taxa de atendimento.`}
              onClick={() => openModal("Melhor Performance", <div><p>Detalhes sobre {bestPerformance.queue}</p></div>)}
            />
            <PerformanceCard
              title="Precisa Atenção"
              subtitle="Requer melhoria"
              queueName={worstPerformance.queue}
              value={`${worstPerformance.rate.toFixed(1)}%`}
              icon={AlertTriangle}
              iconBg="bg-red-50"
              borderColor="border-red-500"
              tooltipText={`A fila "${worstPerformance.queue}" tem ${worstPerformance.rate.toFixed(1)}% de taxa.`}
              onClick={() => openModal("Fila Crítica", <div><p>Análise de {worstPerformance.queue}</p></div>)}
            />
            <PerformanceCard
              title="Taxa Média Abandono"
              subtitle="Geral do período"
              queueName="Todas as filas"
              value={`${averageAbandonmentRate.toFixed(1)}%`}
              icon={TrendingDown}
              iconBg="bg-orange-50"
              borderColor="border-orange-500"
              tooltipText={`Em média, ${averageAbandonmentRate.toFixed(1)}% são abandonados.`}
              onClick={() => openModal("Taxa de Abandono", <div><p>Análise geral de abandono</p></div>)}
            />
            <PerformanceCard
              title="Eficiência Geral"
              subtitle="Filas com taxa ≥ 80%"
              queueName={`${highPerformanceQueues} de ${filteredData.length} filas`}
              value={`${efficiencyRate.toFixed(1)}%`}
              icon={CheckCircle}
              iconBg="bg-green-50"
              borderColor="border-green-500"
              tooltipText={`${efficiencyRate.toFixed(1)}% das filas alcançaram excelência.`}
              onClick={() => openModal("Eficiência Geral", <div><p>Análise de eficiência</p></div>)}
            />
            <PerformanceCard
              title="Filas Acima da Média"
              subtitle={`Taxa > ${averageRate.toFixed(1)}%`}
              queueName={`${queuesAboveAverage} de ${filteredData.length} filas`}
              value={`${filteredData.length > 0 ? ((queuesAboveAverage / filteredData.length) * 100).toFixed(0) : 0}%`}
              icon={TrendingUp}
              iconBg="bg-green-50"
              borderColor="border-green-500"
              tooltipText={`${queuesAboveAverage} filas estão acima da média.`}
              onClick={() => openModal("Filas Acima da Média", <div><p>Análise</p></div>)}
            />
            <PerformanceCard
              title="Filas Abaixo da Média"
              subtitle={`Taxa < ${averageRate.toFixed(1)}%`}
              queueName={`${queuesBelowAverage} de ${filteredData.length} filas`}
              value={`${filteredData.length > 0 ? ((queuesBelowAverage / filteredData.length) * 100).toFixed(0) : 0}%`}
              icon={TrendingDown}
              iconBg="bg-red-50"
              borderColor="border-red-500"
              tooltipText={`${queuesBelowAverage} filas estão abaixo da média.`}
              onClick={() => openModal("Filas Abaixo da Média", <div><p>Análise</p></div>)}
            />
            <PerformanceCard
              title="Destaque Positivo"
              subtitle="Alto volume + boa taxa"
              queueName={mostImprovedQueue.queue}
              value={`${mostImprovedQueue.rate.toFixed(1)}%`}
              icon={Trophy}
              iconBg="bg-purple-50"
              borderColor="border-purple-500"
              tooltipText={`${mostImprovedQueue.queue} mantém alta taxa com volume significativo.`}
              onClick={() => openModal("Destaque Positivo", <div><p>Caso de sucesso</p></div>)}
            />
            <PerformanceCard
              title="Variação de Performance"
              subtitle="Gap entre melhor e pior"
              queueName="Diferença máxima"
              value={`${performanceGap.toFixed(1)}%`}
              icon={BarChart3}
              iconBg="bg-blue-50"
              borderColor="border-blue-500"
              tooltipText={`Há ${performanceGap.toFixed(1)}pp de diferença entre filas.`}
              onClick={() => openModal("Variação de Performance", <div><p>Análise de dispersão</p></div>)}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">Insights</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <InsightCard
              title="Maior Volume"
              queueName={highestVolume.queue}
              value={highestVolume.total.toLocaleString()}
              icon={BarChart3}
              iconBg="bg-blue-50"
              borderColor="border-blue-500"
              tip="💡 Considere reforçar equipe nesta fila"
              tooltipText={`${highestVolume.queue} processa ${highestVolume.total.toLocaleString()} ${isOnlineChannel ? 'conversas' : 'chamadas'}.`}
              onClick={() => openModal("Maior Volume", <div><p>Análise de volume</p></div>)}
            />
            <InsightCard
              title="Mais Abandonos"
              queueName={mostAbandoned.queue}
              value={mostAbandoned.abandoned.toLocaleString()}
              icon={PhoneOff}
              iconBg="bg-red-50"
              borderColor="border-red-500"
              tip="⚠️ Taxa de abandono alta indica necessidade de otimização"
              tooltipText={`${mostAbandoned.queue} tem ${mostAbandoned.abandoned.toLocaleString()} abandonos.`}
              onClick={() => openModal("Mais Abandonos", <div><p>Análise de abandono</p></div>)}
            />
            <InsightCard
              title="Total Atendidos"
              queueName="Todas as filas"
              value={totalAnswered.toLocaleString()}
              icon={CheckCircle}
              iconBg="bg-green-50"
              borderColor="border-green-500"
              tip={`✅ ${totalAnswered > 10000 ? 'Excelente volume' : 'Mantenha o foco'}`}
              tooltipText={`Total de ${totalAnswered.toLocaleString()} atendimentos concluídos.`}
              onClick={() => openModal("Total Atendidos", <div><p>Visão geral</p></div>)}
            />
            <InsightCard
              title="Média Diária"
              queueName="Estimativa"
              value={Math.round(totalCalls / 30).toLocaleString()}
              icon={Clock}
              iconBg="bg-cyan-50"
              borderColor="border-cyan-500"
              tip="📊 Planeje recursos baseado neste volume"
              tooltipText={`Volume médio estimado de ${Math.round(totalCalls / 30).toLocaleString()} por dia.`}
              onClick={() => openModal("Média Diária", <div><p>Planejamento de recursos</p></div>)}
            />
            <InsightCard
              title="Gap de Performance"
              queueName="Diferença absoluta"
              value={`${performanceGap.toFixed(0)} pp`}
              icon={TrendingDown}
              iconBg="bg-pink-50"
              borderColor="border-pink-500"
              tip="📈 Trabalhe para reduzir essa diferença"
              tooltipText={`${performanceGap.toFixed(0)} pontos percentuais de diferença entre filas.`}
              onClick={() => openModal("Gap de Performance", <div><p>Análise de dispersão</p></div>)}
            />
            <InsightCard
              title="Filas Críticas"
              queueName="Taxa < 60%"
              value={filteredData.filter(item => item.rate < 60).length.toString()}
              icon={AlertTriangle}
              iconBg="bg-orange-50"
              borderColor="border-orange-500"
              tip="🔴 Priorize ações corretivas"
              tooltipText={`${filteredData.filter(item => item.rate < 60).length} filas precisam de atenção urgente.`}
              onClick={() => openModal("Filas Críticas", <div><p>Plano de ação</p></div>)}
            />
            <InsightCard
              title="Filas em Excelência"
              queueName="Taxa ≥ 80%"
              value={highPerformanceQueues.toString()}
              icon={TrendingUp}
              iconBg="bg-purple-50"
              borderColor="border-purple-500"
              tip={`🎯 ${highPerformanceQueues > filteredData.length / 2 ? 'Maioria performando bem' : 'Foque em elevar mais filas'}`}
              tooltipText={`${highPerformanceQueues} filas estão em nível de excelência.`}
              onClick={() => openModal("Filas em Excelência", <div><p>Análise</p></div>)}
            />
            <InsightCard
              title="Benchmark Interno"
              queueName="Meta sugerida"
              value={bestPerformance.rate > 85 ? '90%' : '85%'}
              icon={Trophy}
              iconBg="bg-indigo-50"
              borderColor="border-indigo-500"
              tip="🎖️ Use a melhor fila como referência"
              tooltipText="Meta baseada no desempenho da melhor fila."
              onClick={() => openModal("Benchmark Interno", <div><p>Meta de excelência</p></div>)}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">Rankings</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <RankingTable
              title="Ranking por Eficiência"
              subtitle="Taxa de atendimento"
              icon={Trophy}
              data={rankingByEfficiency}
              valueFormatter={(v) => `${v.toFixed(1)}%`}
            />
            <RankingTable
              title="Ranking por Volume"
              subtitle={isOnlineChannel ? "Total de conversas" : "Total de chamadas"}
              icon={BarChart3}
              data={rankingByVolume}
              valueFormatter={(v) => v.toLocaleString()}
            />
            <RankingTable
              title={isOnlineChannel ? "Ranking por Concluídas" : "Ranking por Atendidas"}
              subtitle={isOnlineChannel ? "Conversas concluídas" : "Chamadas atendidas"}
              icon={CheckCircle}
              data={rankingByAnswered}
              valueFormatter={(v) => v.toLocaleString()}
            />
          </div>
        </div>

        <Card className="p-6 animate-fade-in shadow-lg">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-muted rounded-lg">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Análise Comparativa</h2>
          </div>
          <Tabs defaultValue="comparison" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="comparison">Comparação</TabsTrigger>
              <TabsTrigger value="taxa">Taxa</TabsTrigger>
              <TabsTrigger value="distribuicao">Distribuição</TabsTrigger>
            </TabsList>
            <TabsContent value="comparison" className="mt-6">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={120} interval={0} />
                  <YAxis />
                  <Tooltip />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey={isOnlineChannel ? "Concluídas" : "Atendidas"} fill="#4F43BE" />
                  <Bar dataKey="Abandonadas" fill="#FB923C" />
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>
            <TabsContent value="taxa" className="mt-6">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={filteredData.map(d => ({ name: d.queue, Taxa: d.rate }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={120} interval={0} />
                  <YAxis />
                  <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="Taxa" fill="#69B8E5" />
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>
            <TabsContent value="distribuicao" className="mt-6">
              <ResponsiveContainer width="100%" height={500}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ cx, cy, midAngle, outerRadius, name, percent }) => {
                      const RADIAN = Math.PI / 180;
                      const radius = outerRadius + 55;
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);
                      const textAnchor = x > cx ? 'start' : 'end';
                      
                      // Only show label if percentage is above 1% to reduce clutter
                      if (percent < 0.01) return null;
                      
                      return (
                        <text 
                          x={x} 
                          y={y} 
                          fill="hsl(var(--foreground))"
                          textAnchor={textAnchor}
                          dominantBaseline="central"
                          className="text-sm font-medium"
                        >
                          <tspan x={x} dy="0">{name}</tspan>
                          <tspan x={x} dy="1.2em" className="text-xs opacity-70">{(percent * 100).toFixed(1)}%</tspan>
                        </text>
                      );
                    }}
                    outerRadius={110}
                    innerRadius={0}
                    paddingAngle={1}
                    dataKey="value"
                    animationBegin={0}
                    animationDuration={800}
                    animationEasing="ease-out"
                  >
                    {pieData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]}
                        className="transition-all duration-300 hover:opacity-80"
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0];
                        const total = pieData.reduce((sum, item) => sum + item.value, 0);
                        const percentage = ((data.value as number) / total * 100).toFixed(1);
                        
                        return (
                          <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-lg p-3 animate-fade-in">
                            <p className="font-semibold text-foreground mb-1">{data.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Total: <span className="font-medium text-foreground">{(data.value as number).toLocaleString()}</span>
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Percentual: <span className="font-medium text-foreground">{percentage}%</span>
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </TabsContent>
          </Tabs>
        </Card>

        <Card className="p-6 animate-fade-in shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-muted rounded-lg">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Comparativo de Eficiência</h2>
                <p className="text-sm text-muted-foreground">
                  Taxa média de atendimento: <span className="text-primary font-semibold">{averageRate.toFixed(1)}%</span>
                </p>
              </div>
            </div>
            <div className="w-56">
              <select
                value={selectedEfficiencyFilter}
                onChange={(e) => setSelectedEfficiencyFilter(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-background text-sm"
              >
                <option value="all">Todas as Filas</option>
                <option value="highest_answered">Maior Taxa de Atendidas</option>
                <option value="highest_abandoned">Maior Taxa de Abandonadas</option>
                <option value="highest_demand">Maior Demanda</option>
                <option value="lowest_demand">Menor Demanda</option>
                <option value="performance">Performance (Maior Taxa)</option>
              </select>
            </div>
          </div>
          <div className="space-y-4">
            {efficiencyData.map((item, index) => (
              <EfficiencyBar
                key={item.queue}
                queue={item.queue}
                answered={item.answered}
                abandoned={item.abandoned}
                total={item.total}
                rate={item.rate}
                averageRate={averageRate}
                isOnlineChannel={isOnlineChannel}
                queueIndex={index}
              />
            ))}
          </div>
        </Card>

        <Card className="p-6 animate-fade-in shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-muted rounded-lg">
                <CheckCircle className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Atendidos vs Abandonados</h2>
            </div>
            <div className="w-56">
              <select
                value={selectedDetailFilter}
                onChange={(e) => setSelectedDetailFilter(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-background text-sm"
              >
                <option value="all">Todas as Filas</option>
                <option value="highest_answered">Maior Taxa de Atendidas</option>
                <option value="highest_abandoned">Maior Taxa de Abandonadas</option>
                <option value="highest_demand">Maior Demanda</option>
                <option value="lowest_demand">Menor Demanda</option>
                <option value="performance">Performance (Maior Taxa)</option>
              </select>
            </div>
          </div>
          <DetailTable 
            data={detailData} 
             isOnlineChannel={isOnlineChannel} 
           />
         </Card>

          <DetailModal
            open={modalOpen}
            onOpenChange={setModalOpen}
            title={modalContent.title}
            content={modalContent.content}
          />
          </TabsContent>

          <TabsContent value="details" className="space-y-6">
            <QueueDetailsSection 
              phoneData={phoneData}
              chatData={chatData}
              whatsappData={whatsappData}
            />
            <CallDetailsTab />
          </TabsContent>

          <TabsContent value="comparison">
            <PeriodComparison 
              phoneData={phoneData}
              chatData={chatData}
              whatsappData={whatsappData}
            />
          </TabsContent>

          <TabsContent value="trends">
            <TrendAnalysis 
              phoneData={phoneData}
              chatData={chatData}
              whatsappData={whatsappData}
            />
          </TabsContent>

          <TabsContent value="heatmap">
            <PerformanceHeatmap 
              phoneData={phoneData}
              chatData={chatData}
              whatsappData={whatsappData}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
    </>
  );
};

export default Index;
