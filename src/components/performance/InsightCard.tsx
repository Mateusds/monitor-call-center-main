import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCounter } from "@/hooks/useCounter";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

interface InsightItem {
    label: string;
    subLabel?: string;
    value: string | number;
    isTime?: boolean;
}

interface InsightCardProps {
    title: string;
    queueName?: string;
    value?: string | number;
    items?: InsightItem[];
    pieData?: Array<{ name: string; value: number; color: string }>;
    icon: LucideIcon;
    iconBg: string;
    borderColor: string;
    tip: string;
    tooltipText: string;
    isPercentage?: boolean;
    isTime?: boolean;
}

export const InsightCard = ({
    title,
    queueName,
    value,
    items,
    pieData,
    icon: Icon,
    iconBg,
    borderColor,
    tip,
    tooltipText,
    isPercentage = false,
    isTime = false,
}: InsightCardProps) => {
    const numericValue = typeof value === 'number' ? value : parseFloat(value?.toString().replace(/[^\d.]/g, '') || '0') || 0;

    const { count } = useCounter({
        end: numericValue,
        duration: 1500,
        start: 0,
        key: `${title}-${numericValue}`
    });

    let displayValue = "";
    if (isTime && value) {
        displayValue = value.toString();
    } else if (isPercentage) {
        displayValue = `${count.toFixed(1)}%`;
    } else {
        displayValue = count.toLocaleString('pt-BR');
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className={cn(
                        "stat-card border-l-4 transition-all duration-300 hover:scale-[1.02] group cursor-pointer p-5 h-full flex flex-col",
                        borderColor
                    )}>
                        <div className="flex items-start gap-3 mb-4">
                            <div className={cn("p-2 rounded-lg shadow-md transition-transform group-hover:scale-110", iconBg)}>
                                <Icon className="h-5 w-5" />
                            </div>
                            <h3 className="font-bold text-sm tracking-tight text-white/90 group-hover:text-primary transition-colors flex-1">{title}</h3>
                        </div>

                        <div className="flex-1 min-h-0 flex flex-col justify-center space-y-4 relative z-10">
                            {pieData ? (
                                <div className="flex items-center gap-4 h-full">
                                    <div className="relative h-20 w-20 shrink-0">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={pieData}
                                                    innerRadius={28}
                                                    outerRadius={38}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                    stroke="none"
                                                >
                                                    {pieData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <RechartsTooltip
                                                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                                    itemStyle={{ color: '#fff', fontSize: '10px', fontWeight: 'bold' }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="h-10 w-10 text-[10px] bg-white/5 rounded-full flex items-center justify-center text-muted-foreground/50 font-black">
                                                %
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-1 min-w-0 flex-1">
                                        <div className="flex items-baseline gap-2">
                                            <p className="text-2xl font-black text-white leading-none">{displayValue}</p>
                                            <span className="text-[10px] font-bold text-muted-foreground/60 uppercase">Total</span>
                                        </div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 truncate">{queueName}</p>
                                        <div className="flex flex-wrap gap-2 pt-1">
                                            {pieData.map((item, idx) => (
                                                <div key={idx} className="flex items-center gap-1.5">
                                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                                                    <span className="text-[9px] font-bold text-muted-foreground/60 uppercase truncate max-w-[60px]">{item.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : items ? (
                                <div className="space-y-3">
                                    {items.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between group/item border-b border-white/5 pb-2 last:border-0 last:pb-0">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <span className="text-[10px] font-black text-muted-foreground/30">{idx + 1}º</span>
                                                <div className="min-w-0">
                                                    <p className="text-[11px] font-bold text-white/80 truncate uppercase">{item.label}</p>
                                                    {item.subLabel && <p className="text-[9px] font-bold text-muted-foreground/40 uppercase truncate">{item.subLabel}</p>}
                                                </div>
                                            </div>
                                            <span className="text-[12px] font-black text-white shrink-0 ml-2">
                                                {item.value}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 truncate">{queueName}</p>
                                    <p className="text-2xl font-black tracking-tight text-white">{displayValue}</p>
                                </div>
                            )}
                        </div>

                        <p className="text-[11px] text-muted-foreground/70 italic leading-relaxed border-t border-white/5 pt-3 mt-4">{tip}</p>
                    </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-popover/90 border-white/10 backdrop-blur-md max-w-xs">
                    <p className="text-xs font-medium">{tooltipText}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};
