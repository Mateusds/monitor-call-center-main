import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { DashboardView } from '@/components/dashboard/DashboardView';
import { CallsListView } from '@/components/calls/CallsListView';
import { AnalyticsView } from '@/components/analytics/AnalyticsView';
import { OperatorsView } from '@/components/operators/OperatorsView';
import { ChatView } from '@/components/chat/ChatView';
import { AnalyticsChatView } from '@/components/analytics-chat/AnalyticsChatView';
import { PerformanceView } from '@/components/performance/PerformanceView';
import { RelatorioConsolidadoView } from '@/components/relatorio/RelatorioConsolidadoView';
import { TakeBlipIntegrationView } from '@/components/take-blip/TakeBlipIntegrationView';
import { cn } from '@/lib/utils';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const renderView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'performance':
        return <PerformanceView />;
      case 'chat':
        return <ChatView />;
      case 'chamadas':
        return <CallsListView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'analytics-chat':
        return <AnalyticsChatView />;
      case 'operadores':
        return <OperatorsView />;
      case 'relatorio-consolidado':
        return <RelatorioConsolidadoView />;
      case 'integracao-take-blip':
        return <TakeBlipIntegrationView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      <main className={cn(
        "flex-1 p-8 transition-all duration-300 ease-in-out",
        isSidebarCollapsed ? "ml-20" : "ml-64"
      )}>
        {renderView()}
      </main>
    </div>
  );
};

export default Index;
