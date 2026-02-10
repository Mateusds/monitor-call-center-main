import { Card } from "@/components/ui/card";
import { LucideIcon, TrendingUp, TrendingDown, Minus, Target, CheckCircle, XCircle } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { Progress } from "@/components/ui/progress";
import { TargetSelector } from "./TargetSelector";

interface SparklineData {
  value: number;
}

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  colorClass: string;
  sparklineData?: SparklineData[];
  target?: number;
  currentValue?: number;
  showTrend?: boolean;
  onTargetChange?: (target: number) => void;
  showTargetSelector?: boolean;
  targetUnit?: string;
  isPercentage?: boolean;
}

export const KPICard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  colorClass,
  sparklineData,
  target,
  currentValue,
  showTrend = false,
  onTargetChange,
  showTargetSelector = false,
  targetUnit,
  isPercentage = false
}: KPICardProps) => {
  // Detect if this is a percentage target based on target value
  const isPercent = isPercentage || (target !== undefined && target <= 100 && title.toLowerCase().includes("taxa"));
  const unit = targetUnit || (isPercent ? "%" : "");
  
  // Calculate trend from sparkline data
  const getTrend = () => {
    if (!sparklineData || sparklineData.length < 2) return null;
    const lastValue = sparklineData[sparklineData.length - 1].value;
    const previousValue = sparklineData[sparklineData.length - 2].value;
    const diff = lastValue - previousValue;
    const percentChange = previousValue > 0 ? ((diff / previousValue) * 100) : 0;
    
    if (Math.abs(percentChange) < 0.5) {
      return { icon: Minus, color: "text-muted-foreground", text: "Estável" };
    }
    return diff > 0 
      ? { icon: TrendingUp, color: "text-success", text: `+${percentChange.toFixed(1)}%` }
      : { icon: TrendingDown, color: "text-destructive", text: `${percentChange.toFixed(1)}%` };
  };

  const trend = showTrend ? getTrend() : null;
  const TrendIcon = trend?.icon;

  // Calculate progress towards target
  const progressValue = target && currentValue !== undefined 
    ? Math.min((currentValue / target) * 100, 100) 
    : null;
  const targetMet = progressValue !== null && progressValue >= 100;
  
  // Calculate remaining amount
  const remaining = target && currentValue !== undefined ? target - currentValue : 0;

  return (
    <Card className="p-6 animate-fade-in hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-1">
            <p className="text-sm text-muted-foreground mb-2">{title}</p>
            {showTargetSelector && target !== undefined && onTargetChange && (
              <TargetSelector
                currentTarget={target}
                onTargetChange={onTargetChange}
                label="Definir Meta"
                unit={unit}
              />
            )}
          </div>
          <div className="flex items-center gap-2">
            <h3 className="text-3xl font-bold mb-1">{value}</h3>
            {trend && TrendIcon && (
              <div className={`flex items-center gap-1 ${trend.color}`}>
                <TrendIcon className="h-4 w-4" />
                <span className="text-xs font-medium">{trend.text}</span>
              </div>
            )}
          </div>
          {subtitle && <p className={`text-sm font-semibold ${colorClass}`}>{subtitle}</p>}
          
          {/* Target Progress Bar */}
          {target !== undefined && progressValue !== null && (
            <div className="mt-3 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1">
                  <Target className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Meta: {target.toLocaleString()}{unit}
                  </span>
                </div>
                {targetMet ? (
                  <div className="flex items-center gap-1 text-success">
                    <CheckCircle className="h-3 w-3" />
                    <span>Atingida</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-destructive">
                    <XCircle className="h-3 w-3" />
                    <span>
                      Faltam {isPercent ? `${remaining.toFixed(1)}pp` : remaining.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
              <Progress 
                value={progressValue} 
                className={`h-2 ${targetMet ? '[&>div]:bg-success' : '[&>div]:bg-primary'}`}
              />
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-muted ${colorClass}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      
      {/* Sparkline Chart */}
      {sparklineData && sparklineData.length > 0 && (
        <div className="mt-4 h-12">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparklineData}>
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
};
