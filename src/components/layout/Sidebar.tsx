import { Phone, LayoutDashboard, List, BarChart3, Users, MessageCircle, Trophy, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isCollapsed: boolean;
  onToggle: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: any;
  badge?: string;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard Ligações', icon: LayoutDashboard },
  { id: 'performance', label: 'Análise de Performance', icon: Trophy },
  // { id: 'analytics-chat', label: 'Analytics Chat', icon: BarChart3 },
  { id: 'operadores', label: 'Operadores', icon: Users },
  { id: 'chat', label: 'Dashboard WhatsApp', icon: MessageCircle, },
  // { id: 'integracao-take-blip', label: 'Integração Take Blip', icon: MessageCircle, },
  { id: 'relatorio-consolidado', label: 'Relatório Consolidado', icon: FileText },
];

export function Sidebar({ activeTab, onTabChange, isCollapsed, onToggle }: SidebarProps) {
  return (
    <aside className={cn(
      "fixed left-0 top-0 h-full glass-card border-r border-border/50 z-50 transition-all duration-300 ease-in-out",
      isCollapsed ? "w-20" : "w-64"
    )}>
      <div className="flex flex-col h-full overflow-hidden">
        {/* Logo Section */}
        <div className="p-4 border-b border-border/50 flex items-center justify-between min-h-[88px]">
          <div className={cn("flex items-center gap-3 transition-opacity duration-300", isCollapsed ? "opacity-0 invisible w-0" : "opacity-100 visible")}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center glow-primary shrink-0">
              <Phone className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="truncate">
              <h1 className="font-bold text-lg gradient-text">Monitor</h1>
              <p className="text-xs text-muted-foreground">Call Center</p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className={cn(
              "rounded-xl hover:bg-primary/10 hover:text-primary transition-all duration-300",
              isCollapsed ? "mx-auto" : ""
            )}
          >
            {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                'nav-item w-full flex items-center gap-3 group transition-all duration-200',
                activeTab === item.id && 'active',
                isCollapsed ? "justify-center px-0" : "px-4"
              )}
              title={isCollapsed ? item.label : ""}
            >
              <item.icon className={cn("w-5 h-5 shrink-0 transition-transform group-hover:scale-110", activeTab === item.id ? "text-primary" : "")} />
              {!isCollapsed && (
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="truncate animate-in fade-in slide-in-from-left-2 duration-300 font-medium">{item.label}</span>
                </div>
              )}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border/50">
          {!isCollapsed && (
            <div className="px-4 animate-in fade-in duration-500">
              <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/40">Fevereiro 2026</p>
              <p className="text-[10px] font-bold text-muted-foreground/30">Versão 1.3.0-Smile Saúde</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

