import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCounter } from "@/hooks/useCounter";

interface PerformanceCardProps {
    title: string;
    subtitle: string;
    queueName: string;
    value: string;
    icon: LucideIcon;
    iconBg: string;
    borderColor: string;
    tooltipText: string;
    onClick?: () => void;
}

export const PerformanceCard = ({
    title,
    subtitle,
    queueName,
    value,
    icon: Icon,
    iconBg,
    borderColor,
    tooltipText,
    onClick,
}: PerformanceCardProps) => {
    // Extrai valor numérico para animação
    const isPercentage = value.includes('%');
    const numericValue = parseFloat(value.replace(/[^\d.]/g, '')) || 0;

    const { count, isAnimating } = useCounter({
        end: numericValue,
        duration: 1500,
        start: 0,
        key: `${title}-${numericValue}`
    });

    const displayValue = isPercentage ? `${count.toFixed(1)}%` : count.toLocaleString('pt-BR');

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div
                        className={cn(
                            "stat-card border-l-4 transition-all duration-300 hover:scale-[1.03] hover:shadow-primary/20 group cursor-pointer",
                            borderColor
                        )}
                        onClick={onClick}
                    >
                        {/* Background Glow Effect */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-primary/10 transition-colors" />

                        <div className="relative z-10">
                            <div className="flex items-start gap-4 mb-4">
                                <div className={cn("p-3 rounded-xl shadow-lg transition-transform group-hover:scale-110", iconBg)}>
                                    <Icon className="h-6 w-6" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-sm tracking-tight text-white/90 group-hover:text-primary transition-colors">{title}</h3>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{subtitle}</p>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <p className="text-xs font-black uppercase text-muted-foreground/40 tracking-tighter truncate">{queueName}</p>
                                <div className="flex items-baseline gap-2">
                                    <p className={cn(
                                        "text-3xl font-black tracking-tight gradient-text transition-all duration-300",
                                        isAnimating && "scale-105 brightness-125"
                                    )}>
                                        {displayValue}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Accent Line */}
                        <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-gradient-to-r from-primary to-secondary group-hover:w-full transition-all duration-500" />
                    </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-popover/90 border-white/10 backdrop-blur-md">
                    <p className="text-xs font-medium">{tooltipText}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};
