import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface RankingData {
  position: number;
  queue: string;
  value: number;
}

interface RankingTableProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  data: RankingData[];
  valueFormatter: (value: number) => string;
}

export const RankingTable = ({ title, subtitle, icon: Icon, data, valueFormatter }: RankingTableProps) => {
  const getMedalEmoji = (position: number) => {
    if (position === 1) return "🥇";
    if (position === 2) return "🥈";
    if (position === 3) return "🥉";
    return `${position}º`;
  };

  return (
    <Card className="p-6 animate-fade-in hover:shadow-lg transition-shadow">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-bold text-lg">{title}</h3>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="space-y-2">
        {data.slice(0, 5).map((item) => (
          <div
            key={item.position}
            className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <span className="text-lg font-bold w-8 flex-shrink-0">{getMedalEmoji(item.position)}</span>
              <span className="text-sm font-medium truncate">{item.queue}</span>
            </div>
            <span className="text-sm font-bold text-primary ml-2 flex-shrink-0">{valueFormatter(item.value)}</span>
          </div>
        ))}
      </div>
    </Card>
  );
};
