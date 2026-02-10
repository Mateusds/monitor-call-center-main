import { Check, ChevronDown, Search, Phone, MessageSquare, Download, FileSpreadsheet, FileText, Target } from "lucide-react";
import { TargetsPanel, HistoricalDataPoint } from "./TargetsPanel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { createExcelFile } from "@/utils/excelUtils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";

interface FilterOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface MultiSelectFilterProps {
  label: string;
  options: FilterOption[];
  selectedValues: string[];
  onValuesChange: (values: string[]) => void;
  placeholder?: string;
  searchable?: boolean;
}

export const MultiSelectFilter = ({
  label,
  options,
  selectedValues,
  onValuesChange,
  placeholder = "Selecione...",
  searchable = false,
}: MultiSelectFilterProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredOptions = searchable
    ? options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  const handleToggle = (value: string) => {
    if (selectedValues.includes(value)) {
      onValuesChange(selectedValues.filter((v) => v !== value));
    } else {
      onValuesChange([...selectedValues, value]);
    }
  };

  const handleSelectAll = () => {
    if (selectedValues.length === options.length) {
      onValuesChange([]);
    } else {
      onValuesChange(options.map((opt) => opt.value));
    }
  };

  const getDisplayText = () => {
    if (selectedValues.length === 0) return placeholder;
    if (selectedValues.length === options.length) return "Todos";
    if (selectedValues.length === 1) {
      return options.find((opt) => opt.value === selectedValues[0])?.label;
    }
    return `${selectedValues.length} selecionados`;
  };

  return (
    <div>
      <label className="text-sm font-medium mb-2 block">{label}</label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between text-left font-normal"
          >
            <span className="truncate">{getDisplayText()}</span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0 bg-popover z-50" align="start">
          <div className="max-h-80 overflow-auto">
            {searchable && (
              <div className="p-2 border-b sticky top-0 bg-popover z-10">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 h-9"
                  />
                </div>
              </div>
            )}
            <div className="p-2 border-b">
              <div
                className="flex items-center space-x-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer"
                onClick={handleSelectAll}
              >
                <Checkbox
                  checked={selectedValues.length === options.length}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm font-medium">
                  {selectedValues.length === options.length
                    ? "Desmarcar todos"
                    : "Selecionar todos"}
                </span>
              </div>
            </div>
            <div className="p-2">
              {filteredOptions.length === 0 ? (
                <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                  Nenhuma opção encontrada
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <div
                    key={option.value}
                    className="flex items-center space-x-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer"
                    onClick={() => handleToggle(option.value)}
                  >
                    <Checkbox
                      checked={selectedValues.includes(option.value)}
                      onCheckedChange={() => handleToggle(option.value)}
                    />
                    <span className="text-sm flex-1">{option.label}</span>
                    {option.icon && (
                      <span className="ml-auto">{option.icon}</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
      {selectedValues.length > 0 && selectedValues.length < options.length && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selectedValues.slice(0, 3).map((value) => {
            const option = options.find((opt) => opt.value === value);
            return (
              <Badge key={value} variant="secondary" className="text-xs flex items-center gap-1">
                {option?.icon && <span className="h-3 w-3">{option.icon}</span>}
                {option?.label}
              </Badge>
            );
          })}
          {selectedValues.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{selectedValues.length - 3}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

// DashboardFilters component for Index page
interface ExportData {
  queue: string;
  answered: number;
  abandoned: number;
  total: number;
  rate: number;
  channel: string;
}

interface TargetConfig {
  totalCalls: number;
  answered: number;
  abandoned: number;
  serviceRate: number;
}

interface DashboardFiltersProps {
  selectedMonths: string[];
  selectedQueues: string[];
  selectedChannelTypes: string[];
  onMonthsChange: (months: string[]) => void;
  onQueuesChange: (queues: string[]) => void;
  onChannelTypesChange: (types: string[]) => void;
  queues: string[];
  availableQueues: string[];
  exportData?: ExportData[];
  customTargets?: TargetConfig;
  onTargetsChange?: (targets: TargetConfig) => void;
  historicalData?: HistoricalDataPoint[];
}

export const DashboardFilters = ({
  selectedMonths,
  selectedQueues,
  selectedChannelTypes,
  onMonthsChange,
  onQueuesChange,
  onChannelTypesChange,
  queues,
  exportData = [],
  customTargets,
  onTargetsChange,
  historicalData = [],
}: DashboardFiltersProps) => {
  const uniqueQueues = Array.from(new Set(queues));
  
  // Identifica se cada fila é de telefone ou online
  const getQueueIcon = (queueName: string) => {
    const lowerName = queueName.toLowerCase();
    if (lowerName.includes("chat") || lowerName.includes("whatsapp")) {
      return <MessageSquare className="h-3 w-3 text-primary" />;
    }
    return <Phone className="h-3 w-3 text-success" />;
  };

  const queueOptions = uniqueQueues.map(queue => ({
    value: queue,
    label: queue,
    icon: getQueueIcon(queue)
  }));
  
  const exportToExcel = async () => {
    if (exportData.length === 0) {
      toast.error("Não há dados para exportar");
      return;
    }

    const worksheetData = exportData.map(item => ({
      "Fila": item.queue,
      "Canal": item.channel === "phone" ? "Telefone" : item.channel === "chat" ? "Chat" : "WhatsApp",
      "Total": item.total,
      "Atendidas": item.answered,
      "Abandonadas": item.abandoned,
      "Taxa de Atendimento (%)": item.rate.toFixed(1)
    }));

    try {
      await createExcelFile(
        [{ name: "Visão Geral", data: worksheetData }],
        `visao_geral_${new Date().toISOString().split("T")[0]}.xlsx`
      );
      toast.success("Excel exportado com sucesso!");
    } catch (error) {
      toast.error("Erro ao exportar Excel");
    }
  };

  const drawPieChart = (doc: jsPDF, centerX: number, centerY: number, radius: number, answered: number, abandoned: number) => {
    const total = answered + abandoned;
    if (total === 0) return;
    
    const answeredAngle = (answered / total) * 2 * Math.PI;
    
    // Draw answered slice (violet)
    doc.setFillColor(123, 92, 214);
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.5);
    
    // Answered slice
    let startAngle = -Math.PI / 2;
    let endAngle = startAngle + answeredAngle;
    
    const segments = 50;
    let points: [number, number][] = [[centerX, centerY]];
    
    for (let i = 0; i <= segments; i++) {
      const angle = startAngle + (answeredAngle * i) / segments;
      points.push([
        centerX + radius * Math.cos(angle),
        centerY + radius * Math.sin(angle)
      ]);
    }
    
    // Draw answered segment
    doc.setFillColor(123, 92, 214);
    const answeredPath = points.map((p, i) => (i === 0 ? `${p[0]} ${p[1]} m` : `${p[0]} ${p[1]} l`)).join(' ');
    doc.triangle(centerX, centerY, points[1][0], points[1][1], points[points.length - 1][0], points[points.length - 1][1], 'F');
    
    // Fill answered arc
    for (let i = 1; i < points.length - 1; i++) {
      doc.triangle(centerX, centerY, points[i][0], points[i][1], points[i + 1][0], points[i + 1][1], 'F');
    }
    
    // Abandoned slice (blue)
    doc.setFillColor(105, 184, 229);
    points = [[centerX, centerY]];
    startAngle = endAngle;
    const abandonedAngle = 2 * Math.PI - answeredAngle;
    
    for (let i = 0; i <= segments; i++) {
      const angle = startAngle + (abandonedAngle * i) / segments;
      points.push([
        centerX + radius * Math.cos(angle),
        centerY + radius * Math.sin(angle)
      ]);
    }
    
    for (let i = 1; i < points.length - 1; i++) {
      doc.triangle(centerX, centerY, points[i][0], points[i][1], points[i + 1][0], points[i + 1][1], 'F');
    }
  };

  const drawBarChart = (doc: jsPDF, startX: number, startY: number, width: number, height: number, data: ExportData[]) => {
    const top5 = [...data].sort((a, b) => b.total - a.total).slice(0, 5);
    if (top5.length === 0) return;
    
    const maxTotal = Math.max(...top5.map(d => d.total));
    const barHeight = (height - 20) / top5.length - 4;
    
    doc.setFontSize(8);
    doc.setTextColor(100);
    
    top5.forEach((item, index) => {
      const y = startY + 10 + index * (barHeight + 4);
      const answeredWidth = maxTotal > 0 ? (item.answered / maxTotal) * (width - 60) : 0;
      const abandonedWidth = maxTotal > 0 ? (item.abandoned / maxTotal) * (width - 60) : 0;
      
      // Queue name (truncated)
      const truncatedName = item.queue.length > 20 ? item.queue.substring(0, 17) + "..." : item.queue;
      doc.setTextColor(60);
      doc.text(truncatedName, startX, y + barHeight / 2 + 2);
      
      // Answered bar (violet)
      doc.setFillColor(123, 92, 214);
      doc.roundedRect(startX + 55, y, answeredWidth, barHeight, 1, 1, 'F');
      
      // Abandoned bar (blue) - stacked
      doc.setFillColor(105, 184, 229);
      doc.roundedRect(startX + 55 + answeredWidth, y, abandonedWidth, barHeight, 1, 1, 'F');
    });
  };

  const exportToPDF = () => {
    if (exportData.length === 0) {
      toast.error("Não há dados para exportar");
      return;
    }

    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(18);
    doc.setTextColor(123, 92, 214);
    doc.text("Visão Geral - Dashboard de Atendimento", 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")}`, 14, 28);

    const totalCalls = exportData.reduce((sum, item) => sum + item.total, 0);
    const totalAnswered = exportData.reduce((sum, item) => sum + item.answered, 0);
    const totalAbandoned = exportData.reduce((sum, item) => sum + item.abandoned, 0);
    const avgRate = totalCalls > 0 ? (totalAnswered / totalCalls) * 100 : 0;

    // Summary section
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text("Resumo Geral:", 14, 42);
    doc.setFontSize(10);
    doc.text(`Total de Atendimentos: ${totalCalls.toLocaleString()}`, 14, 50);
    doc.text(`Atendidas: ${totalAnswered.toLocaleString()} (${avgRate.toFixed(1)}%)`, 14, 56);
    doc.text(`Abandonadas: ${totalAbandoned.toLocaleString()} (${(100 - avgRate).toFixed(1)}%)`, 14, 62);

    // Pie Chart - Distribution
    doc.setFontSize(11);
    doc.setTextColor(60);
    doc.text("Distribuição de Atendimentos", 130, 42);
    
    drawPieChart(doc, 160, 65, 20, totalAnswered, totalAbandoned);
    
    // Pie chart legend
    doc.setFontSize(8);
    doc.setFillColor(123, 92, 214);
    doc.rect(135, 90, 6, 6, 'F');
    doc.setTextColor(60);
    doc.text(`Atendidas (${avgRate.toFixed(1)}%)`, 143, 95);
    
    doc.setFillColor(105, 184, 229);
    doc.rect(135, 98, 6, 6, 'F');
    doc.text(`Abandonadas (${(100 - avgRate).toFixed(1)}%)`, 143, 103);

    // Bar Chart - Top 5 Queues
    doc.setFontSize(11);
    doc.setTextColor(60);
    doc.text("Top 5 Filas por Volume", 14, 78);
    
    drawBarChart(doc, 14, 82, 110, 35, exportData);

    // Data Table
    const tableData = exportData.map(item => [
      item.queue,
      item.channel === "phone" ? "Telefone" : item.channel === "chat" ? "Chat" : "WhatsApp",
      item.total.toLocaleString(),
      item.answered.toLocaleString(),
      item.abandoned.toLocaleString(),
      `${item.rate.toFixed(1)}%`
    ]);

    autoTable(doc, {
      head: [["Fila", "Canal", "Total", "Atendidas", "Abandonadas", "Taxa"]],
      body: tableData,
      startY: 118,
      theme: "striped",
      headStyles: { 
        fillColor: [123, 92, 214],
        textColor: 255,
        fontStyle: "bold"
      },
      styles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 50 },
        2: { halign: "right" },
        3: { halign: "right" },
        4: { halign: "right" },
        5: { halign: "right" }
      }
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: "center" });
    }

    doc.save(`visao_geral_${new Date().toISOString().split("T")[0]}.pdf`);
    toast.success("PDF exportado com sucesso!");
  };

  return (
    <Card className="p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">Filtros</h3>
        <div className="flex gap-2">
          {customTargets && onTargetsChange && (
            <TargetsPanel targets={customTargets} onTargetsChange={onTargetsChange} historicalData={historicalData} />
          )}
          <Button onClick={exportToExcel} variant="outline" size="sm" className="gap-2" disabled={exportData.length === 0}>
            <FileSpreadsheet className="h-4 w-4" />
            Excel
          </Button>
          <Button onClick={exportToPDF} variant="outline" size="sm" className="gap-2" disabled={exportData.length === 0}>
            <FileText className="h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MultiSelectFilter
          label="Tipo de Canal"
          options={[
            { value: "phone", label: "Telefone", icon: <Phone className="h-3 w-3" /> },
            { value: "online", label: "Online", icon: <MessageSquare className="h-3 w-3" /> },
          ]}
          selectedValues={selectedChannelTypes}
          onValuesChange={onChannelTypesChange}
          placeholder="Todos os canais"
        />
        
        <MultiSelectFilter
          label="Fila"
          options={queueOptions}
          selectedValues={selectedQueues}
          onValuesChange={onQueuesChange}
          placeholder="Todas as filas"
          searchable={true}
        />
        
        <MultiSelectFilter
          label="Mês"
          options={[
            { value: "2025-06", label: "Junho 2025" },
            { value: "2025-07", label: "Julho 2025" },
            { value: "2025-08", label: "Agosto 2025" },
            { value: "2025-09", label: "Setembro 2025" },
            { value: "2025-10", label: "Outubro 2025" },
            { value: "2025-11", label: "Novembro 2025" },
          ]}
          selectedValues={selectedMonths}
          onValuesChange={onMonthsChange}
          placeholder="Todos os meses"
        />
      </div>
    </Card>
  );
};
