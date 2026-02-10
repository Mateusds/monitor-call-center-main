import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from "recharts";
import { TrendingUp, AlertCircle, Calendar } from "lucide-react";

interface TrendAnalysisProps {
  phoneData: any;
  chatData: any;
  whatsappData: any;
}

const MONTHS = [
  { value: "2025-06", label: "Jun/25" },
  { value: "2025-07", label: "Jul/25" },
  { value: "2025-08", label: "Ago/25" },
  { value: "2025-09", label: "Set/25" },
  { value: "2025-10", label: "Out/25" },
  { value: "2025-11", label: "Nov/25" },
];

const FORECAST_MONTHS = [
  { value: "2025-12", label: "Dez/25" },
  { value: "2026-01", label: "Jan/26" },
  { value: "2026-02", label: "Fev/26" },
];

export const TrendAnalysis = ({ phoneData, chatData, whatsappData }: TrendAnalysisProps) => {
  
  const combineChannelData = (month: string) => {
    const combined = [
      ...phoneData[month as keyof typeof phoneData],
      ...chatData[month as keyof typeof chatData],
      ...whatsappData[month as keyof typeof whatsappData],
    ];
    return combined;
  };

  const calculateMonthlyTotals = () => {
    return MONTHS.map((month, index) => {
      const data = combineChannelData(month.value);
      const total = data.reduce((sum, item) => sum + item.answered + item.abandoned, 0);
      const answered = data.reduce((sum, item) => sum + item.answered, 0);
      const abandoned = data.reduce((sum, item) => sum + item.abandoned, 0);
      const rate = total > 0 ? (answered / total) * 100 : 0;
      
      return {
        month: month.label,
        monthIndex: index,
        total,
        answered,
        abandoned,
        rate,
        isForecast: false,
      };
    });
  };

  // Regressão linear simples para previsão
  const linearRegression = (values: number[]) => {
    const n = values.length;
    const sumX = values.reduce((sum, _, i) => sum + i, 0);
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, i) => sum + i * val, 0);
    const sumXX = values.reduce((sum, _, i) => sum + i * i, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return { slope, intercept };
  };

  const historicalData = calculateMonthlyTotals();
  
  // Calcular previsões
  const totalValues = historicalData.map(d => d.total);
  const rateValues = historicalData.map(d => d.rate);
  const answeredValues = historicalData.map(d => d.answered);
  const abandonedValues = historicalData.map(d => d.abandoned);
  
  const totalRegression = linearRegression(totalValues);
  const rateRegression = linearRegression(rateValues);
  const answeredRegression = linearRegression(answeredValues);
  const abandonedRegression = linearRegression(abandonedValues);
  
  const forecastData = FORECAST_MONTHS.map((month, index) => {
    const forecastIndex = historicalData.length + index;
    const forecastTotal = Math.max(0, Math.round(totalRegression.slope * forecastIndex + totalRegression.intercept));
    const forecastRate = Math.max(0, Math.min(100, rateRegression.slope * forecastIndex + rateRegression.intercept));
    const forecastAnswered = Math.max(0, Math.round(answeredRegression.slope * forecastIndex + answeredRegression.intercept));
    const forecastAbandoned = Math.max(0, Math.round(abandonedRegression.slope * forecastIndex + abandonedRegression.intercept));
    
    return {
      month: month.label,
      monthIndex: forecastIndex,
      total: forecastTotal,
      answered: forecastAnswered,
      abandoned: forecastAbandoned,
      rate: forecastRate,
      isForecast: true,
    };
  });

  const allData = [...historicalData, ...forecastData];

  // Calcular tendências
  const avgGrowthRate = totalRegression.slope / (totalValues.reduce((a, b) => a + b, 0) / totalValues.length) * 100;
  const rateGrowthRate = rateRegression.slope;
  
  const getTrendIcon = (value: number) => {
    if (Math.abs(value) < 0.5) return { color: "text-muted-foreground", text: "Estável" };
    return value > 0 
      ? { color: "text-success", text: "Crescimento" }
      : { color: "text-destructive", text: "Declínio" };
  };

  const volumeTrend = getTrendIcon(avgGrowthRate);
  const rateTrend = getTrendIcon(rateGrowthRate);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold mb-1 flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" />
          Análise de Tendências e Previsão
        </h2>
        <p className="text-sm text-muted-foreground">Previsão baseada em regressão linear dos últimos 5 meses</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Tendência de Volume</p>
              <p className={`text-2xl font-bold ${volumeTrend.color}`}>
                {avgGrowthRate > 0 ? '+' : ''}{avgGrowthRate.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">{volumeTrend.text} mensal</p>
            </div>
            <TrendingUp className={`h-5 w-5 ${volumeTrend.color}`} />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Tendência de Taxa</p>
              <p className={`text-2xl font-bold ${rateTrend.color}`}>
                {rateGrowthRate > 0 ? '+' : ''}{rateGrowthRate.toFixed(2)}pp
              </p>
              <p className="text-xs text-muted-foreground mt-1">{rateTrend.text} mensal</p>
            </div>
            <TrendingUp className={`h-5 w-5 ${rateTrend.color}`} />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Previsão Próx. Mês</p>
              <p className="text-2xl font-bold text-primary">
                {forecastData[0].total.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Total estimado em {forecastData[0].month}</p>
            </div>
            <Calendar className="h-5 w-5 text-primary" />
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="h-5 w-5 text-amber-500" />
          <p className="text-sm text-muted-foreground">
            As áreas sombreadas representam previsões baseadas em dados históricos. Resultados reais podem variar.
          </p>
        </div>
        <h3 className="text-lg font-semibold mb-4">Volume Total de Chamadas - Histórico e Previsão</h3>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={allData}>
            <defs>
              <linearGradient id="historicalGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#5145C0" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#5145C0" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#69B8E5" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#69B8E5" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-lg p-3">
                      <p className="font-semibold text-foreground mb-2">
                        {data.month} {data.isForecast && <span className="text-xs text-amber-500">(Previsão)</span>}
                      </p>
                      <p className="text-sm">Total: <span className="font-medium">{data.total.toLocaleString()}</span></p>
                      <p className="text-sm">Atendidas: <span className="font-medium">{data.answered.toLocaleString()}</span></p>
                      <p className="text-sm">Abandonadas: <span className="font-medium">{data.abandoned.toLocaleString()}</span></p>
                      <p className="text-sm">Taxa: <span className="font-medium">{data.rate.toFixed(1)}%</span></p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="total" 
              stroke="#5145C0" 
              strokeWidth={2}
              fill="url(#historicalGradient)"
              name="Histórico"
              data={historicalData}
            />
            <Area 
              type="monotone" 
              dataKey="total" 
              stroke="#69B8E5" 
              strokeWidth={2}
              strokeDasharray="5 5"
              fill="url(#forecastGradient)"
              name="Previsão"
              data={forecastData}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Taxa de Atendimento - Histórico e Previsão</h3>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={allData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis domain={[0, 100]} />
            <Tooltip 
              formatter={(value: number) => `${value.toFixed(1)}%`}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-lg p-3">
                      <p className="font-semibold text-foreground mb-1">
                        {data.month} {data.isForecast && <span className="text-xs text-amber-500">(Previsão)</span>}
                      </p>
                      <p className="text-sm">Taxa: <span className="font-medium">{data.rate.toFixed(1)}%</span></p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="rate" 
              stroke="#5145C0" 
              strokeWidth={3}
              name="Taxa Histórica"
              data={historicalData}
              dot={{ r: 5 }}
            />
            <Line 
              type="monotone" 
              dataKey="rate" 
              stroke="#69B8E5" 
              strokeWidth={3}
              strokeDasharray="5 5"
              name="Taxa Prevista"
              data={forecastData}
              dot={{ r: 5, fill: "#69B8E5" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Tabela de Previsões</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-semibold">Mês</th>
                <th className="text-right py-3 px-4 font-semibold">Total Previsto</th>
                <th className="text-right py-3 px-4 font-semibold">Atendidas</th>
                <th className="text-right py-3 px-4 font-semibold">Taxa</th>
                <th className="text-right py-3 px-4 font-semibold">Abandonadas</th>
                <th className="text-right py-3 px-4 font-semibold">Taxa</th>
              </tr>
            </thead>
            <tbody>
              {forecastData.map((data) => {
                const abandonedRate = data.total > 0 ? (data.abandoned / data.total) * 100 : 0;
                return (
                  <tr key={data.month} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4 font-medium">{data.month}</td>
                    <td className="text-right py-3 px-4">{data.total.toLocaleString()}</td>
                    <td className="text-right py-3 px-4 text-success">{data.answered.toLocaleString()}</td>
                    <td className="text-right py-3 px-4 font-medium text-success">{data.rate.toFixed(1)}%</td>
                    <td className="text-right py-3 px-4 text-destructive">{data.abandoned.toLocaleString()}</td>
                    <td className="text-right py-3 px-4 font-medium text-destructive">{abandonedRate.toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
