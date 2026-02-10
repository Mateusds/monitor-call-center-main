import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, LineChart, Line } from "recharts";
import { ArrowUp, ArrowDown, Minus, FileSpreadsheet, FileText, Calendar, Filter, Phone, MessageSquare } from "lucide-react";
import { createExcelFile } from "@/utils/excelUtils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";

interface PeriodComparisonProps {
  phoneData: any;
  chatData: any;
  whatsappData: any;
}

const MONTHS = [
  { value: "2025-06", label: "Junho 2025" },
  { value: "2025-07", label: "Julho 2025" },
  { value: "2025-08", label: "Agosto 2025" },
  { value: "2025-09", label: "Setembro 2025" },
  { value: "2025-10", label: "Outubro 2025" },
  { value: "2025-11", label: "Novembro 2025" },
];

const COLORS = ['#5145C0', '#69B8E5', '#8779E6', '#7A6FE5', '#FB923C', '#4F43BE', '#A5DBFF'];

const CHANNELS = [
  { id: "phone", label: "Telefone", icon: Phone },
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "whatsapp", label: "WhatsApp", icon: MessageSquare },
];

export const PeriodComparison = ({ phoneData, chatData, whatsappData }: PeriodComparisonProps) => {
  const [period1, setPeriod1] = useState("2025-10");
  const [period2, setPeriod2] = useState("2025-11");
  const [selectedChannels, setSelectedChannels] = useState<string[]>(["phone", "chat", "whatsapp"]);

  const toggleChannel = (channelId: string) => {
    setSelectedChannels(prev => {
      if (prev.includes(channelId)) {
        // Don't allow deselecting all channels
        if (prev.length === 1) return prev;
        return prev.filter(c => c !== channelId);
      }
      return [...prev, channelId];
    });
  };

  const combineChannelData = (month: string, channels: string[] = selectedChannels) => {
    let combined: any[] = [];
    if (channels.includes("phone")) {
      combined = [...combined, ...phoneData[month as keyof typeof phoneData]];
    }
    if (channels.includes("chat")) {
      combined = [...combined, ...chatData[month as keyof typeof chatData]];
    }
    if (channels.includes("whatsapp")) {
      combined = [...combined, ...whatsappData[month as keyof typeof whatsappData]];
    }
    return combined;
  };

  const processData = (month: string) => {
    const data = combineChannelData(month);
    const aggregated: Record<string, any> = {};
    
    data.forEach((item) => {
      if (!aggregated[item.queue]) {
        aggregated[item.queue] = { answered: 0, abandoned: 0, channel: item.channel };
      }
      aggregated[item.queue].answered += item.answered;
      aggregated[item.queue].abandoned += item.abandoned;
    });
    
    return Object.entries(aggregated)
      .filter(([_, data]) => data.answered > 0 || data.abandoned > 0)
      .map(([queue, data]) => ({
        queue,
        answered: data.answered,
        abandoned: data.abandoned,
        total: data.answered + data.abandoned,
        rate: data.answered + data.abandoned > 0 ? ((data.answered / (data.answered + data.abandoned)) * 100) : 0,
      }));
  };

  const data1 = processData(period1);
  const data2 = processData(period2);

  // Dados de evolução temporal para todos os meses
  const getTemporalEvolutionData = () => {
    return MONTHS.map(({ value, label }) => {
      const monthData = combineChannelData(value, selectedChannels);
      const totals = monthData.reduce(
        (acc, item) => ({
          answered: acc.answered + item.answered,
          abandoned: acc.abandoned + item.abandoned,
        }),
        { answered: 0, abandoned: 0 }
      );
      
      const total = totals.answered + totals.abandoned;
      const rate = total > 0 ? (totals.answered / total) * 100 : 0;
      
      return {
        month: label.split(' ')[0].substring(0, 3),
        fullMonth: value,
        total,
        answered: totals.answered,
        abandoned: totals.abandoned,
        rate: Number(rate.toFixed(1)),
      };
    });
  };

  // Detailed variation table data
  const getDetailedVariationData = () => {
    const allQueues = [...new Set([...data1.map(d => d.queue), ...data2.map(d => d.queue)])];
    return allQueues.map(queue => {
      const d1 = data1.find(d => d.queue === queue);
      const d2 = data2.find(d => d.queue === queue);
      
      const volumeChange = (d2?.total || 0) - (d1?.total || 0);
      const volumeChangePercent = d1 && d1.total > 0 ? ((volumeChange / d1.total) * 100) : 0;
      const rateChange = (d2?.rate || 0) - (d1?.rate || 0);
      
      return {
        queue,
        period1Total: d1?.total || 0,
        period1Rate: d1?.rate || 0,
        period2Total: d2?.total || 0,
        period2Rate: d2?.rate || 0,
        volumeChange,
        volumeChangePercent,
        rateChange,
      };
    }).sort((a, b) => b.rateChange - a.rateChange);
  };

  const detailedVariationData = getDetailedVariationData();

  const temporalData = getTemporalEvolutionData();

  const calculateTotals = (data: any[]) => {
    const total = data.reduce((sum, item) => sum + item.total, 0);
    const answered = data.reduce((sum, item) => sum + item.answered, 0);
    const abandoned = data.reduce((sum, item) => sum + item.abandoned, 0);
    const rate = total > 0 ? (answered / total) * 100 : 0;
    return { total, answered, abandoned, rate };
  };

  const totals1 = calculateTotals(data1);
  const totals2 = calculateTotals(data2);

  const getChangeIndicator = (value1: number, value2: number, reverse = false) => {
    const diff = value2 - value1;
    const percentChange = value1 > 0 ? ((diff / value1) * 100) : 0;
    const isPositive = reverse ? diff < 0 : diff > 0;
    
    if (Math.abs(percentChange) < 0.1) {
      return { icon: Minus, color: "text-muted-foreground", text: "Sem mudança", value: "0%" };
    }
    
    return {
      icon: isPositive ? ArrowUp : ArrowDown,
      color: isPositive ? "text-success" : "text-destructive",
      text: isPositive ? "Aumento" : "Redução",
      value: `${Math.abs(percentChange).toFixed(1)}%`
    };
  };

  const ComparisonCard = ({ title, value1, value2, reverse = false }: any) => {
    const change = getChangeIndicator(value1, value2, reverse);
    const Icon = change.icon;
    
    return (
      <Card className="p-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">{title}</h3>
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground mb-1">{MONTHS.find(m => m.value === period1)?.label}</p>
            <p className="text-2xl font-bold">{typeof value1 === 'number' && value1 % 1 !== 0 ? value1.toFixed(1) : value1}{title.includes('Taxa') ? '%' : ''}</p>
          </div>
          <div className="flex flex-col items-center justify-center px-3 py-2 rounded-lg bg-muted/50">
            <Icon className={`h-4 w-4 ${change.color} mb-1`} />
            <span className={`text-xs font-medium ${change.color}`}>{change.value}</span>
          </div>
          <div className="flex-1 text-right">
            <p className="text-xs text-muted-foreground mb-1">{MONTHS.find(m => m.value === period2)?.label}</p>
            <p className="text-2xl font-bold">{typeof value2 === 'number' && value2 % 1 !== 0 ? value2.toFixed(1) : value2}{title.includes('Taxa') ? '%' : ''}</p>
          </div>
        </div>
      </Card>
    );
  };

  const pieData1 = data1.map(item => ({ name: item.queue, value: item.total }));
  const pieData2 = data2.map(item => ({ name: item.queue, value: item.total }));

  const exportToExcel = async () => {
    try {
      const period1Name = MONTHS.find(m => m.value === period1)?.label || period1;
      const period2Name = MONTHS.find(m => m.value === period2)?.label || period2;

      // Criar dados de resumo
      const summaryData = [
        { Métrica: "Total de Chamadas", [period1Name]: totals1.total, [period2Name]: totals2.total, "Variação %": ((totals2.total - totals1.total) / totals1.total * 100).toFixed(1) },
        { Métrica: "Atendidas", [period1Name]: totals1.answered, [period2Name]: totals2.answered, "Variação %": ((totals2.answered - totals1.answered) / totals1.answered * 100).toFixed(1) },
        { Métrica: "Abandonadas", [period1Name]: totals1.abandoned, [period2Name]: totals2.abandoned, "Variação %": ((totals2.abandoned - totals1.abandoned) / totals1.abandoned * 100).toFixed(1) },
        { Métrica: "Taxa de Atendimento", [period1Name]: `${totals1.rate.toFixed(1)}%`, [period2Name]: `${totals2.rate.toFixed(1)}%`, "Variação pp": (totals2.rate - totals1.rate).toFixed(1) },
      ];

      // Criar dados detalhados por fila
      const allQueues = [...new Set([...data1.map(d => d.queue), ...data2.map(d => d.queue)])];
      const detailedData = allQueues.map(queue => {
        const d1 = data1.find(d => d.queue === queue);
        const d2 = data2.find(d => d.queue === queue);
        return {
          Fila: queue,
          [`${period1Name} - Total`]: d1?.total || 0,
          [`${period1Name} - Taxa %`]: d1 ? d1.rate.toFixed(1) : "0",
          [`${period2Name} - Total`]: d2?.total || 0,
          [`${period2Name} - Taxa %`]: d2 ? d2.rate.toFixed(1) : "0",
          "Variação Volume": ((d2?.total || 0) - (d1?.total || 0)),
          "Variação Taxa pp": ((d2?.rate || 0) - (d1?.rate || 0)).toFixed(1),
        };
      });

      await createExcelFile(
        [
          { name: "Resumo", data: summaryData },
          { name: "Detalhamento por Fila", data: detailedData }
        ],
        `comparacao_${period1Name}_vs_${period2Name}.xlsx`
      );

      toast.success("Arquivo Excel exportado com sucesso!");
    } catch (error) {
      console.error("Erro ao exportar Excel:", error);
      toast.error("Erro ao exportar arquivo Excel");
    }
  };

  const exportToPDF = () => {
    try {
      const period1Name = MONTHS.find(m => m.value === period1)?.label || period1;
      const period2Name = MONTHS.find(m => m.value === period2)?.label || period2;

      const doc = new jsPDF();
      
      // Título
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("Comparação entre Períodos", 14, 20);
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`${period1Name} vs ${period2Name}`, 14, 28);

      // Resumo
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Resumo Geral", 14, 40);

      const summaryData = [
        ["Métrica", period1Name, period2Name, "Variação"],
        ["Total de Chamadas", totals1.total.toLocaleString(), totals2.total.toLocaleString(), `${((totals2.total - totals1.total) / totals1.total * 100).toFixed(1)}%`],
        ["Atendidas", totals1.answered.toLocaleString(), totals2.answered.toLocaleString(), `${((totals2.answered - totals1.answered) / totals1.answered * 100).toFixed(1)}%`],
        ["Abandonadas", totals1.abandoned.toLocaleString(), totals2.abandoned.toLocaleString(), `${((totals2.abandoned - totals1.abandoned) / totals1.abandoned * 100).toFixed(1)}%`],
        ["Taxa de Atendimento", `${totals1.rate.toFixed(1)}%`, `${totals2.rate.toFixed(1)}%`, `${(totals2.rate - totals1.rate).toFixed(1)}pp`],
      ];

      autoTable(doc, {
        startY: 45,
        head: [summaryData[0]],
        body: summaryData.slice(1),
        theme: 'striped',
        headStyles: { fillColor: [81, 69, 192] },
      });

      // Detalhamento por fila
      const finalY = (doc as any).lastAutoTable.finalY || 45;
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Detalhamento por Fila", 14, finalY + 15);

      const allQueues = [...new Set([...data1.map(d => d.queue), ...data2.map(d => d.queue)])];
      const detailedData = [
        ["Fila", `${period1Name} Total`, `${period1Name} Taxa`, `${period2Name} Total`, `${period2Name} Taxa`, "Var. Volume"],
        ...allQueues.map(queue => {
          const d1 = data1.find(d => d.queue === queue);
          const d2 = data2.find(d => d.queue === queue);
          return [
            queue,
            (d1?.total || 0).toLocaleString(),
            d1 ? `${d1.rate.toFixed(1)}%` : "0%",
            (d2?.total || 0).toLocaleString(),
            d2 ? `${d2.rate.toFixed(1)}%` : "0%",
            ((d2?.total || 0) - (d1?.total || 0)).toLocaleString(),
          ];
        })
      ];

      autoTable(doc, {
        startY: finalY + 20,
        head: [detailedData[0]],
        body: detailedData.slice(1),
        theme: 'striped',
        headStyles: { fillColor: [81, 69, 192] },
        styles: { fontSize: 8 },
      });

      doc.save(`comparacao_${period1Name}_vs_${period2Name}.pdf`);
      toast.success("Arquivo PDF exportado com sucesso!");
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
      toast.error("Erro ao exportar arquivo PDF");
    }
  };

  const exportEvolutionToExcel = async () => {
    try {
      const wsData = temporalData.map(item => ({
        'Mês': item.month + '/2025',
        'Total': item.total,
        'Atendidas': item.answered,
        'Abandonadas': item.abandoned,
        'Taxa %': item.rate
      }));
      
      await createExcelFile(
        [{ name: "Evolução Mensal", data: wsData }],
        'evolucao_mensal_jun_nov_2025.xlsx'
      );
      toast.success("Excel exportado com sucesso!");
    } catch (error) {
      console.error("Erro ao exportar Excel:", error);
      toast.error("Erro ao exportar Excel");
    }
  };

  const exportEvolutionToPDF = () => {
    try {
      const doc = new jsPDF('landscape', 'mm', 'a4');
      
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("Evolução Mensal - Junho a Novembro 2025", 14, 20);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 28);
      
      autoTable(doc, {
        startY: 40,
        head: [['Mês', 'Total', 'Atendidas', 'Abandonadas', 'Taxa %']],
        body: temporalData.map(item => [
          item.month + '/2025',
          item.total.toLocaleString(),
          item.answered.toLocaleString(),
          item.abandoned.toLocaleString(),
          `${item.rate}%`
        ]),
        theme: 'striped',
        headStyles: { fillColor: [81, 69, 192] },
        styles: { fontSize: 10 },
      });
      
      doc.save('evolucao_mensal_jun_nov_2025.pdf');
      toast.success("PDF exportado com sucesso!");
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
      toast.error("Erro ao exportar PDF");
    }
  };

  const comparisonBarData = [...new Set([...data1.map(d => d.queue), ...data2.map(d => d.queue)])].map(queue => {
    const d1 = data1.find(d => d.queue === queue);
    const d2 = data2.find(d => d.queue === queue);
    return {
      queue,
      [MONTHS.find(m => m.value === period1)?.label || period1]: d1?.rate || 0,
      [MONTHS.find(m => m.value === period2)?.label || period2]: d2?.rate || 0,
    };
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1">Comparação entre Períodos</h2>
            <p className="text-sm text-muted-foreground">Analise as diferenças de performance entre dois meses</p>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <Button onClick={exportToExcel} variant="outline" size="sm" className="gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Exportar Excel
            </Button>
            <Button onClick={exportToPDF} variant="outline" size="sm" className="gap-2">
              <FileText className="h-4 w-4" />
              Exportar PDF
            </Button>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Período 1</label>
              <Select value={period1} onValueChange={setPeriod1}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map(month => (
                    <SelectItem key={month.value} value={month.value} disabled={month.value === period2}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="pt-6">
              <span className="text-muted-foreground">vs</span>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Período 2</label>
              <Select value={period2} onValueChange={setPeriod2}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map(month => (
                    <SelectItem key={month.value} value={month.value} disabled={month.value === period1}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        {/* Channel Filter */}
        <Card className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filtrar por Canal:</span>
            </div>
            {CHANNELS.map(channel => (
              <label 
                key={channel.id}
                className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 px-3 py-2 rounded-lg transition-colors"
              >
                <Checkbox 
                  checked={selectedChannels.includes(channel.id)}
                  onCheckedChange={() => toggleChannel(channel.id)}
                />
                <channel.icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{channel.label}</span>
              </label>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ComparisonCard 
          title="Total de Chamadas" 
          value1={totals1.total.toLocaleString()} 
          value2={totals2.total.toLocaleString()} 
        />
        <ComparisonCard 
          title="Atendidas" 
          value1={totals1.answered.toLocaleString()} 
          value2={totals2.answered.toLocaleString()} 
        />
        <ComparisonCard 
          title="Abandonadas" 
          value1={totals1.abandoned.toLocaleString()} 
          value2={totals2.abandoned.toLocaleString()} 
          reverse={true}
        />
        <ComparisonCard 
          title="Taxa de Atendimento" 
          value1={totals1.rate} 
          value2={totals2.rate} 
        />
      </div>

      {/* Gráfico de Evolução Mensal */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <h3 className="text-xl font-bold">Evolução Mensal (Jun-Nov 2025)</h3>
          </div>
          <div className="flex gap-2">
            <Button onClick={exportEvolutionToExcel} variant="outline" size="sm" className="gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Excel
            </Button>
            <Button onClick={exportEvolutionToPDF} variant="outline" size="sm" className="gap-2">
              <FileText className="h-4 w-4" />
              PDF
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-4">Volume Total</h4>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={temporalData}>
                <defs>
                  <linearGradient id="colorAnsweredEvol" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorAbandonedEvol" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-lg p-3">
                          <p className="font-semibold mb-2">{label}/2025</p>
                          {payload.map((entry, index) => (
                            <p key={index} className="text-sm">
                              <span style={{ color: entry.color }}>{entry.name}:</span>{" "}
                              <span className="font-medium">{Number(entry.value).toLocaleString()}</span>
                            </p>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="answered" 
                  name="Atendidas" 
                  stroke="hsl(var(--success))" 
                  fillOpacity={1} 
                  fill="url(#colorAnsweredEvol)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="abandoned" 
                  name="Abandonadas" 
                  stroke="hsl(var(--destructive))" 
                  fillOpacity={1} 
                  fill="url(#colorAbandonedEvol)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-4">Taxa de Atendimento</h4>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={temporalData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" />
                <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = temporalData.find(d => d.month === label);
                      return (
                        <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-lg p-3">
                          <p className="font-semibold mb-2">{label}/2025</p>
                          <p className="text-sm">
                            Taxa: <span className="font-bold text-primary">{payload[0].value}%</span>
                          </p>
                          {data && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {data.answered.toLocaleString()} de {data.total.toLocaleString()} atendidas
                            </p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="rate" 
                  name="Taxa %" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 8, stroke: "hsl(var(--primary))", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>

      {/* Detailed Variation Table */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <ArrowUp className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Tabela de Variação Detalhada por Fila</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 font-bold">Fila</th>
                <th className="text-right p-3 font-bold">{MONTHS.find(m => m.value === period1)?.label} - Total</th>
                <th className="text-right p-3 font-bold">{MONTHS.find(m => m.value === period1)?.label} - Taxa</th>
                <th className="text-right p-3 font-bold">{MONTHS.find(m => m.value === period2)?.label} - Total</th>
                <th className="text-right p-3 font-bold">{MONTHS.find(m => m.value === period2)?.label} - Taxa</th>
                <th className="text-right p-3 font-bold">Var. Volume</th>
                <th className="text-right p-3 font-bold">Var. Taxa</th>
                <th className="text-center p-3 font-bold">Tendência</th>
              </tr>
            </thead>
            <tbody>
              {detailedVariationData.map((item, idx) => (
                <tr key={idx} className={`${idx % 2 === 0 ? "bg-muted/20" : ""} transition-all duration-200 hover:bg-muted/40`}>
                  <td className="p-3 font-medium">{item.queue}</td>
                  <td className="p-3 text-right">{item.period1Total.toLocaleString()}</td>
                  <td className="p-3 text-right">{item.period1Rate.toFixed(1)}%</td>
                  <td className="p-3 text-right font-semibold">{item.period2Total.toLocaleString()}</td>
                  <td className="p-3 text-right font-semibold">{item.period2Rate.toFixed(1)}%</td>
                  <td className={`p-3 text-right font-medium ${item.volumeChange >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {item.volumeChange >= 0 ? '+' : ''}{item.volumeChange.toLocaleString()} ({item.volumeChangePercent >= 0 ? '+' : ''}{item.volumeChangePercent.toFixed(1)}%)
                  </td>
                  <td className={`p-3 text-right font-medium ${item.rateChange >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {item.rateChange >= 0 ? '+' : ''}{item.rateChange.toFixed(1)}pp
                  </td>
                  <td className="p-3 text-center">
                    {item.rateChange > 1 ? (
                      <ArrowUp className="h-5 w-5 text-success inline" />
                    ) : item.rateChange < -1 ? (
                      <ArrowDown className="h-5 w-5 text-destructive inline" />
                    ) : (
                      <Minus className="h-5 w-5 text-muted-foreground inline" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Summary cards for improvements and declines */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <Card className="p-4 border-l-4 border-l-success">
            <h4 className="font-semibold text-success mb-2">🚀 Maiores Melhorias</h4>
            <div className="space-y-2">
              {detailedVariationData
                .filter(d => d.rateChange > 0)
                .slice(0, 3)
                .map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span>{item.queue}</span>
                    <span className="text-success font-medium">+{item.rateChange.toFixed(1)}pp</span>
                  </div>
                ))}
            </div>
          </Card>
          <Card className="p-4 border-l-4 border-l-destructive">
            <h4 className="font-semibold text-destructive mb-2">⚠️ Maiores Quedas</h4>
            <div className="space-y-2">
              {detailedVariationData
                .filter(d => d.rateChange < 0)
                .sort((a, b) => a.rateChange - b.rateChange)
                .slice(0, 3)
                .map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span>{item.queue}</span>
                    <span className="text-destructive font-medium">{item.rateChange.toFixed(1)}pp</span>
                  </div>
                ))}
            </div>
          </Card>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Comparativo de Taxas de Atendimento</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={comparisonBarData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="queue" angle={-45} textAnchor="end" height={120} interval={0} />
            <YAxis />
            <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Bar dataKey={MONTHS.find(m => m.value === period1)?.label} fill="#5145C0" />
            <Bar dataKey={MONTHS.find(m => m.value === period2)?.label} fill="#69B8E5" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-center">{MONTHS.find(m => m.value === period1)?.label}</h3>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={pieData1}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({ name, percent }) => percent > 0.05 ? `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%` : null}
                outerRadius={90}
                dataKey="value"
                animationBegin={0}
                animationDuration={800}
              >
                {pieData1.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0];
                    const total = pieData1.reduce((sum, item) => sum + item.value, 0);
                    const percentage = ((data.value as number) / total * 100).toFixed(1);
                    return (
                      <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-lg p-3">
                        <p className="font-semibold text-foreground mb-1">{data.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Total: <span className="font-medium text-foreground">{(data.value as number).toLocaleString()}</span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Percentual: <span className="font-medium text-foreground">{percentage}%</span>
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-center">{MONTHS.find(m => m.value === period2)?.label}</h3>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={pieData2}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({ name, percent }) => percent > 0.05 ? `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%` : null}
                outerRadius={90}
                dataKey="value"
                animationBegin={0}
                animationDuration={800}
              >
                {pieData2.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0];
                    const total = pieData2.reduce((sum, item) => sum + item.value, 0);
                    const percentage = ((data.value as number) / total * 100).toFixed(1);
                    return (
                      <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-lg p-3">
                        <p className="font-semibold text-foreground mb-1">{data.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Total: <span className="font-medium text-foreground">{(data.value as number).toLocaleString()}</span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Percentual: <span className="font-medium text-foreground">{percentage}%</span>
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
};
