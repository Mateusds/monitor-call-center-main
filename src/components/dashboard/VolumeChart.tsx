import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface HourlyData {
  hora: string;
  chamadas: number;
  abandonadas: number;
  atendidas: number;
}

interface VolumeChartProps {
  hourlyData: HourlyData[];
}

export function VolumeChart({ hourlyData }: VolumeChartProps) {
  return (
    <div className="glass-card p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Volume de Chamadas</h3>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-muted-foreground">Total</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-destructive" />
            <span className="text-muted-foreground">Abandonadas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-success" />
            <span className="text-muted-foreground">Atendidas</span>
          </div>
        </div>
      </div>
      
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={hourlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorChamadas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(187 85% 53%)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="hsl(187 85% 53%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorAbandonadas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(0 84% 60%)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="hsl(0 84% 60%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorAtendidas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(142 71% 45%)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="hsl(142 71% 45%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 40% 20%)" />
            <XAxis 
              dataKey="hora" 
              stroke="hsl(215 20% 65%)" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="hsl(215 20% 65%)" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(222 47% 11%)',
                border: '1px solid hsl(222 40% 20%)',
                borderRadius: '8px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
              }}
              labelStyle={{ color: 'hsl(210 40% 98%)' }}
            />
            <Area
              type="monotone"
              dataKey="chamadas"
              stroke="hsl(187 85% 53%)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorChamadas)"
              name="Total"
            />
            <Area
              type="monotone"
              dataKey="abandonadas"
              stroke="hsl(0 84% 60%)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorAbandonadas)"
              name="Abandonadas"
            />
            <Area
              type="monotone"
              dataKey="atendidas"
              stroke="hsl(142 71% 45%)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorAtendidas)"
              name="Atendidas"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
