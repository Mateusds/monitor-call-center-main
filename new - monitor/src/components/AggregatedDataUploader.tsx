import { useState } from "react";
import { Upload, FileSpreadsheet, CheckCircle, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { parseExcelFile, sanitizeCellValue, safeParseInt } from "@/utils/excelUtils";
import { supabase } from "@/integrations/supabase/client";

interface AggregatedRecord {
  queue: string;
  atendidas: number;
  abandonadas: number;
}

interface AggregatedDataUploaderProps {
  onUploadComplete: () => void;
}

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const YEARS = ["2024", "2025", "2026"];

// Mapeamento de nomes de fila do Excel para nomes padronizados
const QUEUE_MAP: Record<string, string> = {
  "call center assistencial": "Call Center Assistencial",
  "credenciados": "Credenciados",
  "call center financeiro": "Call Center Financeiro",
  "call center cancelamento": "Call Center Cancelamento",
  "marcação mais saúde": "Marcação Mais Saúde",
  "mais saúde unidade x": "Mais Saúde Unidade X",
  "fortis laboratório": "Fortis Laboratório",
};

const normalizeQueueName = (name: string): string => {
  const lower = name.toLowerCase().trim();
  return QUEUE_MAP[lower] || sanitizeCellValue(name);
};

const AggregatedDataUploader = ({ onUploadComplete }: AggregatedDataUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("2025");
  const { toast } = useToast();

  const parseAggregatedExcel = async (file: File): Promise<AggregatedRecord[]> => {
    // Parse Excel file using secure utility
    const jsonData = await parseExcelFile(file);
    const records: AggregatedRecord[] = [];

    // Procurar linha de cabeçalho
    let headerIndex = -1;
    for (let i = 0; i < Math.min(10, jsonData.length); i++) {
      const row = jsonData[i];
      if (row && row.some((cell: any) => 
        typeof cell === 'string' && cell.toLowerCase().includes('fila')
      )) {
        headerIndex = i;
        break;
      }
    }

    if (headerIndex === -1) {
      throw new Error("Cabeçalho 'Fila' não encontrado no arquivo");
    }

    // Identificar índices das colunas
    const header = jsonData[headerIndex].map((h: any) => sanitizeCellValue(String(h)).toLowerCase());
    const filaIndex = header.findIndex((h: string) => h.includes('fila'));
    const atendidasIndex = header.findIndex((h: string) => h.includes('atendida'));
    const abandonadasIndex = header.findIndex((h: string) => h.includes('abandonada'));

    if (filaIndex === -1 || atendidasIndex === -1 || abandonadasIndex === -1) {
      throw new Error("Colunas obrigatórias não encontradas: Fila, Atendidas, Abandonadas");
    }

    // Processar dados with sanitization
    for (let i = headerIndex + 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row || !row[filaIndex]) continue;

      const queueName = sanitizeCellValue(row[filaIndex]);
      if (!queueName) continue;

      const atendidas = safeParseInt(row[atendidasIndex]);
      const abandonadas = safeParseInt(row[abandonadasIndex]);

      if (atendidas === 0 && abandonadas === 0) continue;

      records.push({
        queue: normalizeQueueName(queueName),
        atendidas,
        abandonadas
      });
    }

    if (records.length === 0) {
      throw new Error("Nenhum dado válido encontrado no arquivo");
    }

    return records;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (!selectedMonth) {
      toast({
        variant: "destructive",
        title: "Selecione o período",
        description: "Por favor, selecione o mês antes de fazer o upload",
      });
      return;
    }

    setUploading(true);
    setProgress(10);

    try {
      const file = files[0];
      const records = await parseAggregatedExcel(file);
      setProgress(40);

      const period = `${selectedMonth} de ${selectedYear}`;

      // Verificar se já existem dados para este período
      const { data: existingData, error: checkError } = await supabase
        .from('call_records')
        .select('id')
        .eq('period', period)
        .limit(1);

      if (checkError) throw checkError;

      if (existingData && existingData.length > 0) {
        toast({
          variant: "destructive",
          title: "Período já existe",
          description: `Já existem dados para ${period}. Delete os dados existentes antes de importar novos.`,
        });
        setUploading(false);
        return;
      }

      setProgress(60);

      // Inserir registros no banco
      const recordsToInsert = records.map(record => ({
        queue: record.queue,
        period: period,
        state: "Agregado",
        phone: "N/A",
        atendidas: record.atendidas,
        abandonadas: record.abandonadas,
        total_chamadas: record.atendidas + record.abandonadas,
        duracao_media: 0,
        taxa_atendimento: record.atendidas + record.abandonadas > 0 
          ? (record.atendidas / (record.atendidas + record.abandonadas)) * 100 
          : 0,
        file_name: file.name
      }));

      const { error: insertError } = await supabase
        .from('call_records')
        .insert(recordsToInsert);

      if (insertError) throw insertError;

      setProgress(100);

      const totalAtendidas = records.reduce((sum, r) => sum + r.atendidas, 0);
      const totalAbandonadas = records.reduce((sum, r) => sum + r.abandonadas, 0);

      toast({
        title: "✅ Dados importados com sucesso!",
        description: `${period}: ${records.length} filas, ${totalAtendidas} atendidas, ${totalAbandonadas} abandonadas`,
      });

      onUploadComplete();

    } catch (error) {
      console.error("Erro ao processar arquivo:", error);
      toast({
        title: "Erro ao processar arquivo",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setProgress(0);
      event.target.value = '';
    }
  };

  return (
    <Card className="p-6 border-2 border-dashed border-primary/30 bg-primary/5">
      <div className="flex flex-col items-center gap-4">
        <div className="p-4 rounded-full bg-primary/10">
          <FileSpreadsheet className="h-8 w-8 text-primary" />
        </div>
        
        <div className="text-center">
          <h3 className="font-bold text-lg mb-2">Upload de Dados Agregados</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Importe dados resumidos por fila (Atendidas/Abandonadas)
          </p>
        </div>

        <div className="flex gap-4 w-full max-w-md">
          <div className="flex-1">
            <Label htmlFor="month-select" className="text-xs text-muted-foreground">Mês</Label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger id="month-select">
                <SelectValue placeholder="Selecione o mês" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map(month => (
                  <SelectItem key={month} value={month}>{month}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-24">
            <Label htmlFor="year-select" className="text-xs text-muted-foreground">Ano</Label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger id="year-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {YEARS.map(year => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileUpload}
          disabled={uploading || !selectedMonth}
          className="hidden"
          id="aggregated-file-upload"
        />
        
        <label htmlFor="aggregated-file-upload">
          <Button 
            disabled={uploading || !selectedMonth} 
            asChild
            variant="default"
          >
            <span className="cursor-pointer">
              {uploading ? (
                <>Processando...</>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Selecionar Arquivo
                </>
              )}
            </span>
          </Button>
        </label>

        {uploading && (
          <div className="w-full space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-xs text-center text-muted-foreground">
              {Math.round(progress)}% concluído
            </p>
          </div>
        )}

        <div className="flex items-start gap-2 text-xs text-muted-foreground mt-2">
          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Formato esperado:</p>
            <ul className="list-disc list-inside ml-2 mt-1">
              <li>Coluna "Fila" com nome da fila</li>
              <li>Coluna "Atendidas" com total de chamadas atendidas</li>
              <li>Coluna "Abandonadas" com total de abandonos</li>
            </ul>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default AggregatedDataUploader;
