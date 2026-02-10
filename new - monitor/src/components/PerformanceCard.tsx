import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LucideIcon } from "lucide-react";

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
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card
            className={`p-5 animate-fade-in border-l-4 ${borderColor} cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-[1.02]`}
            onClick={onClick}
          >
            <div className="flex items-start gap-3 mb-3">
              <div className={`p-2 rounded-lg ${iconBg}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm mb-1">{title}</h3>
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium truncate">{queueName}</p>
              <p className="text-2xl font-bold">{value}</p>
            </div>
          </Card>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
