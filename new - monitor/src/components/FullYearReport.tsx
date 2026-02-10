import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";

interface FullYearReportProps {
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

export const FullYearReport = ({ phoneData, chatData, whatsappData }: FullYearReportProps) => {
  
  const combineChannelData = (month: string) => {
    return [
      ...phoneData[month as keyof typeof phoneData],
      ...chatData[month as keyof typeof chatData],
      ...whatsappData[month as keyof typeof whatsappData],
    ];
  };

  const calculateMonthlyMetrics = (month: string) => {
    const data = combineChannelData(month);
    const total = data.reduce((sum, item) => sum + item.answered + item.abandoned, 0);
    const answered = data.reduce((sum, item) => sum + item.answered, 0);
    const abandoned = data.reduce((sum, item) => sum + item.abandoned, 0);
    const rate = total > 0 ? (answered / total) * 100 : 0;
    return { total, answered, abandoned, rate };
  };

  const calculateChannelMetrics = (month: string) => {
    const phoneTotal = phoneData[month].reduce((sum: number, item: any) => sum + item.answered + item.abandoned, 0);
    const chatTotal = chatData[month].reduce((sum: number, item: any) => sum + item.answered + item.abandoned, 0);
    const whatsappTotal = whatsappData[month].reduce((sum: number, item: any) => sum + item.answered + item.abandoned, 0);
    const total = phoneTotal + chatTotal + whatsappTotal;
    
    return {
      phone: { total: phoneTotal, rate: phoneTotal > 0 ? (phoneData[month].reduce((s: number, i: any) => s + i.answered, 0) / phoneTotal * 100) : 0 },
      chat: { total: chatTotal, rate: chatTotal > 0 ? (chatData[month].reduce((s: number, i: any) => s + i.answered, 0) / chatTotal * 100) : 0 },
      whatsapp: { total: whatsappTotal, rate: whatsappTotal > 0 ? (whatsappData[month].reduce((s: number, i: any) => s + i.answered, 0) / whatsappTotal * 100) : 0 },
      total
    };
  };

  const getQueueMetrics = (month: string) => {
    const data = combineChannelData(month);
    const aggregated: Record<string, any> = {};
    
    data.forEach((item) => {
      if (!aggregated[item.queue]) {
        aggregated[item.queue] = { answered: 0, abandoned: 0 };
      }
      aggregated[item.queue].answered += item.answered;
      aggregated[item.queue].abandoned += item.abandoned;
    });
    
    return Object.entries(aggregated)
      .filter(([_, d]) => d.answered > 0 || d.abandoned > 0)
      .map(([queue, d]) => ({
        queue,
        total: d.answered + d.abandoned,
        answered: d.answered,
        abandoned: d.abandoned,
        rate: d.answered + d.abandoned > 0 ? (d.answered / (d.answered + d.abandoned)) * 100 : 0
      }));
  };

  const generatePDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // === CAPA ===
      doc.setFillColor(81, 69, 192);
      doc.rect(0, 0, pageWidth, 60, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text("Relatório de Atendimento", pageWidth / 2, 30, { align: "center" });
      
      doc.setFontSize(16);
      doc.setFont("helvetica", "normal");
      doc.text("Análise Comparativa 2025", pageWidth / 2, 42, { align: "center" });
      
      doc.setFontSize(12);
      doc.text("Junho a Novembro", pageWidth / 2, 52, { align: "center" });
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 14, 75);

      // === RESUMO EXECUTIVO ===
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("1. Resumo Executivo", 14, 90);

      const monthlyData = MONTHS.map(m => ({
        month: m.label,
        ...calculateMonthlyMetrics(m.value)
      }));

      const totalGeral = monthlyData.reduce((s, d) => s + d.total, 0);
      const answeredGeral = monthlyData.reduce((s, d) => s + d.answered, 0);
      const abandonedGeral = monthlyData.reduce((s, d) => s + d.abandoned, 0);
      const rateGeral = totalGeral > 0 ? (answeredGeral / totalGeral) * 100 : 0;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`• Total de atendimentos no período: ${totalGeral.toLocaleString()}`, 14, 100);
      doc.text(`• Chamadas/conversas atendidas: ${answeredGeral.toLocaleString()} (${rateGeral.toFixed(1)}%)`, 14, 107);
      doc.text(`• Chamadas/conversas abandonadas: ${abandonedGeral.toLocaleString()} (${(100 - rateGeral).toFixed(1)}%)`, 14, 114);

      // Melhor e pior mês
      const bestMonth = monthlyData.reduce((best, curr) => curr.rate > best.rate ? curr : best);
      const worstMonth = monthlyData.reduce((worst, curr) => curr.rate < worst.rate ? curr : worst);
      
      doc.text(`• Melhor desempenho: ${bestMonth.month} com ${bestMonth.rate.toFixed(1)}% de taxa`, 14, 121);
      doc.text(`• Pior desempenho: ${worstMonth.month} com ${worstMonth.rate.toFixed(1)}% de taxa`, 14, 128);

      // === EVOLUÇÃO MENSAL ===
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("2. Evolução Mensal", 14, 145);

      const evolutionData = [
        ["Mês", "Total", "Atendidas", "Taxa Atend.", "Abandonadas", "Taxa Aband."],
        ...monthlyData.map(d => [
          d.month,
          d.total.toLocaleString(),
          d.answered.toLocaleString(),
          `${d.rate.toFixed(1)}%`,
          d.abandoned.toLocaleString(),
          `${(100 - d.rate).toFixed(1)}%`
        ])
      ];

      autoTable(doc, {
        startY: 150,
        head: [evolutionData[0]],
        body: evolutionData.slice(1),
        theme: 'striped',
        headStyles: { fillColor: [81, 69, 192] },
        styles: { fontSize: 9 },
      });

      // === ANÁLISE POR CANAL ===
      let currentY = (doc as any).lastAutoTable.finalY + 15;
      
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("3. Análise por Canal", 14, currentY);

      const channelEvolution = MONTHS.map(m => {
        const ch = calculateChannelMetrics(m.value);
        return [
          m.label,
          ch.phone.total.toLocaleString(),
          `${ch.phone.rate.toFixed(1)}%`,
          ch.chat.total.toLocaleString(),
          `${ch.chat.rate.toFixed(1)}%`,
          ch.whatsapp.total.toLocaleString(),
          `${ch.whatsapp.rate.toFixed(1)}%`
        ];
      });

      autoTable(doc, {
        startY: currentY + 5,
        head: [["Mês", "Tel. Vol.", "Tel. Taxa", "Chat Vol.", "Chat Taxa", "WhatsApp Vol.", "WhatsApp Taxa"]],
        body: channelEvolution,
        theme: 'striped',
        headStyles: { fillColor: [81, 69, 192] },
        styles: { fontSize: 8 },
      });

      // === NOVA PÁGINA - ANÁLISE POR FILA ===
      doc.addPage();
      
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("4. Performance por Fila", 14, 20);

      // Dados do último mês (Nov/25)
      const latestQueues = getQueueMetrics("2025-11").sort((a, b) => b.rate - a.rate);
      
      const queueData = latestQueues.map(q => [
        q.queue,
        q.total.toLocaleString(),
        q.answered.toLocaleString(),
        `${q.rate.toFixed(1)}%`,
        q.abandoned.toLocaleString(),
        `${((q.abandoned / q.total) * 100).toFixed(1)}%`
      ]);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Dados de Novembro/2025 (ordenado por taxa de atendimento)", 14, 30);

      autoTable(doc, {
        startY: 35,
        head: [["Fila", "Total", "Atendidas", "Taxa Atend.", "Abandonadas", "Taxa Aband."]],
        body: queueData,
        theme: 'striped',
        headStyles: { fillColor: [81, 69, 192] },
        styles: { fontSize: 9 },
      });

      // === COMPARAÇÃO MENSAL POR FILA ===
      currentY = (doc as any).lastAutoTable.finalY + 15;

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("5. Evolução por Fila (Taxa de Atendimento)", 14, currentY);

      // Obter todas as filas únicas
      const allQueues = [...new Set(MONTHS.flatMap(m => getQueueMetrics(m.value).map(q => q.queue)))];
      
      const queueEvolution = allQueues.map(queue => {
        const row = [queue];
        MONTHS.forEach(m => {
          const qData = getQueueMetrics(m.value).find(q => q.queue === queue);
          row.push(qData ? `${qData.rate.toFixed(1)}%` : "-");
        });
        return row;
      });

      autoTable(doc, {
        startY: currentY + 5,
        head: [["Fila", ...MONTHS.map(m => m.label)]],
        body: queueEvolution,
        theme: 'striped',
        headStyles: { fillColor: [81, 69, 192] },
        styles: { fontSize: 7 },
        columnStyles: { 0: { cellWidth: 45 } }
      });

      // === INSIGHTS E RECOMENDAÇÕES ===
      currentY = (doc as any).lastAutoTable.finalY + 15;

      // Verificar se precisa nova página
      if (currentY > 240) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("6. Insights e Recomendações", 14, currentY);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      
      const insights = [
        `• Taxa média de atendimento no período: ${rateGeral.toFixed(1)}%`,
        `• Filas com melhor desempenho: ${latestQueues.slice(0, 3).map(q => q.queue).join(", ")}`,
        `• Filas que precisam de atenção: ${latestQueues.slice(-3).map(q => q.queue).join(", ")}`,
        "",
        "Recomendações:",
        "• Analisar práticas das filas com melhor desempenho para replicar em outras",
        "• Priorizar recursos para filas com taxa abaixo de 80%",
        "• Considerar expansão de canais digitais que apresentam bom desempenho",
        "• Monitorar tendências mensais para identificar padrões sazonais"
      ];

      insights.forEach((insight, idx) => {
        doc.text(insight, 14, currentY + 10 + (idx * 7));
      });

      // Rodapé
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(`Página ${i} de ${pageCount}`, pageWidth - 30, doc.internal.pageSize.getHeight() - 10);
        doc.text("Dashboard de Atendimento - Relatório Anual", 14, doc.internal.pageSize.getHeight() - 10);
      }

      doc.save("relatorio_atendimento_jun-nov_2025.pdf");
      toast.success("Relatório PDF gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar relatório PDF");
    }
  };

  return (
    <Button onClick={generatePDF} className="gap-2">
      <FileText className="h-4 w-4" />
      <Download className="h-4 w-4" />
      Relatório Completo (PDF)
    </Button>
  );
};
