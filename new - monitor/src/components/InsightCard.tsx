import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LucideIcon } from "lucide-react";

interface InsightCardProps {
  title: string;
  queueName: string;
  value: string;
  icon: LucideIcon;
  iconBg: string;
  borderColor: string;
  tip: string;
  tooltipText: string;
  onClick?: () => void;
}

export const InsightCard = ({
  title,
  queueName,
  value,
  icon: Icon,
  iconBg,
  borderColor,
  tip,
  tooltipText,
  onClick,
}: InsightCardProps) => {
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
              <h3 className="font-semibold text-sm flex-1">{title}</h3>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground truncate">{queueName}</p>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground italic">{tip}</p>
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
