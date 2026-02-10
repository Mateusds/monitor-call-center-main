import { useState } from "react";
import { Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { parseExcelFile, sanitizeCellValue } from "@/utils/excelUtils";
import { CallRecord } from "@/types/callData";

interface FileUploadResult {
  fileName: string;
  uploadDate: Date;
  period: string;
  recordCount: number;
  states: string[];
  queue: string;
}

interface FileUploaderProps {
  onDataProcessed: (records: CallRecord[], metadata: FileUploadResult) => void;
  onSaveRecords: (records: CallRecord[], fileName: string) => Promise<{ success: boolean; error?: string }>;
}

const FileUploader = ({ onDataProcessed, onSaveRecords }: FileUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const detectQueueFromFilename = (filename: string): string => {
    const lower = filename.toLowerCase();
    if (lower.includes("assistencial")) return "Call Center Assistencial";
    if (lower.includes("financeiro")) return "Call Center Financeiro";
    if (lower.includes("cancelamento")) return "Call Center Cancelamento";
    if (lower.includes("credenciado")) return "Credenciados";
    if (lower.includes("marcação") || lower.includes("marcacao")) return "Marcação Mais Saúde";
    return "Desconhecido";
  };

  const detectPeriodFromFilename = (filename: string): string => {
    const monthMatch = filename.match(/(Janeiro|Fevereiro|Março|Abril|Maio|Junho|Julho|Agosto|Setembro|Outubro|Novembro|Dezembro)/i);
    const yearMatch = filename.match(/20\d{2}/);
    if (monthMatch) {
      const month = monthMatch[1].toLowerCase();
      const year = yearMatch ? yearMatch[0] : '2025';
      return `${month} de ${year}`;
    }
    return new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  const mapPhoneToState = (phone: string): string => {
    if (!phone || phone === 'anonymous') return 'Desconhecido';
    
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('082') || cleanPhone.startsWith('82')) return 'Alagoas';
    if (cleanPhone.startsWith('083') || cleanPhone.startsWith('83')) return 'Paraíba';
    if (cleanPhone.startsWith('084') || cleanPhone.startsWith('84')) return 'Natal';
    if (cleanPhone.startsWith('061') || cleanPhone.startsWith('61')) return 'Distrito Federal';
    
    return 'Desconhecido';
  };

  const validateExcelStructure = (data: any[][]): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Verificar se o arquivo não está vazio
    if (!data || data.length === 0) {
      errors.push("Arquivo vazio ou sem dados");
      return { valid: false, errors };
    }

    // Procurar cabeçalho
    let headerIndex = -1;
    for (let i = 0; i < Math.min(10, data.length); i++) {
      const row = data[i];
      if (row && row.some((cell: any) => 
        typeof cell === 'string' && cell.toLowerCase().includes('fila')
      )) {
        headerIndex = i;
        break;
      }
    }

    if (headerIndex === -1) {
      errors.push("Cabeçalho não encontrado. Certifique-se que há uma coluna 'Fila'");
    }

    // Verificar se há linhas de dados após o cabeçalho
    if (headerIndex !== -1 && data.length <= headerIndex + 1) {
      errors.push("Não há dados após o cabeçalho");
    }

    // Validar estrutura mínima de colunas
    const dataRows = data.slice(headerIndex + 1).filter(row => row && row.length > 0);
    if (dataRows.length === 0) {
      errors.push("Nenhuma linha de dados encontrada");
    }

    // Verificar se as linhas têm número mínimo de colunas
    const minColumns = 13;
    const invalidRows = dataRows.filter(row => row.length < minColumns);
    if (invalidRows.length > 0) {
      errors.push(`${invalidRows.length} linha(s) com menos de ${minColumns} colunas`);
    }

    // Validar tipos de dados essenciais
    let validDataRows = 0;
    for (const row of dataRows) {
      if (row.length >= minColumns) {
        // Verificar se duração é numérica
        const duracao = row[5];
        if (duracao && !isNaN(Number(duracao))) {
          validDataRows++;
        }
      }
    }

    if (validDataRows === 0) {
      errors.push("Nenhuma linha com dados válidos encontrada");
    }

    return { 
      valid: errors.length === 0, 
      errors 
    };
  };

  const processExcelFile = async (file: File): Promise<{ records: CallRecord[], metadata: FileUploadResult }> => {
    // Parse Excel file using secure utility
    const jsonData = await parseExcelFile(file);

    // VALIDAÇÃO: Verificar estrutura do arquivo
    const validation = validateExcelStructure(jsonData);
    if (!validation.valid) {
      throw new Error(`Arquivo inválido:\n${validation.errors.join('\n')}`);
    }

    const records: CallRecord[] = [];
    const detectedQueue = detectQueueFromFilename(file.name);
    const statesSet = new Set<string>();

    // Procurar a linha de cabeçalho
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
      throw new Error("Cabeçalho não encontrado no arquivo");
    }

    // Processar linhas de dados
    for (let i = headerIndex + 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row || row.length < 13) continue;

      // Security: Sanitize all cell values
      const fila = sanitizeCellValue(row[0]) || detectedQueue;
      if (!fila) continue;

      const telefone = sanitizeCellValue(row[12]);
      const estado = sanitizeCellValue(row[13]) || mapPhoneToState(telefone);
      
      statesSet.add(estado);

      records.push({
        fila,
        chamadas: sanitizeCellValue(row[1]),
        dataHoraLigacao: sanitizeCellValue(row[2]),
        dataHoraAtendida: sanitizeCellValue(row[3]),
        dataHoraEncerrada: sanitizeCellValue(row[4]),
        duracaoSegundos: parseInt(sanitizeCellValue(row[5]) || '0'),
        ramal: sanitizeCellValue(row[6]),
        nomeOperador: sanitizeCellValue(row[7]) || 'Não identificado',
        duracaoChamada: sanitizeCellValue(row[8]),
        tempoEspera: sanitizeCellValue(row[9]),
        idChamada: sanitizeCellValue(row[10]),
        motivo: sanitizeCellValue(row[11]),
        telefone,
        estado,
        setor: fila
      });
    }

    const metadata: FileUploadResult = {
      fileName: file.name,
      uploadDate: new Date(),
      period: detectPeriodFromFilename(file.name),
      recordCount: records.length,
      states: Array.from(statesSet),
      queue: detectedQueue
    };

    return { records, metadata };
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setProgress(0);

    try {
      const allRecords: CallRecord[] = [];
      const allMetadata: FileUploadResult[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProgress(((i + 1) / files.length) * 100);

        const { records, metadata } = await processExcelFile(file);
        allRecords.push(...records);
        allMetadata.push(metadata);
      }

      // Remover duplicatas por ID
      const uniqueRecords = Array.from(
        new Map(allRecords.map(r => [r.idChamada, r])).values()
      );

      // Salvar no banco de dados
      for (let i = 0; i < files.length; i++) {
        const result = await onSaveRecords(allRecords, files[i].name);
        
        if (!result.success) {
          toast({
            variant: "destructive",
            title: "Erro ao salvar",
            description: result.error || "Não foi possível salvar os dados no banco",
          });
          setUploading(false);
          return;
        }
      }

      onDataProcessed(uniqueRecords, allMetadata[allMetadata.length - 1]);

      toast({
        title: "✅ Dados salvos com sucesso!",
        description: `${uniqueRecords.length} registros importados e armazenados de ${files.length} arquivo(s)`,
      });

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
    <Card className="p-6 border-2 border-dashed">
      <div className="flex flex-col items-center gap-4">
        <div className="p-4 rounded-full bg-primary/10">
          <Upload className="h-8 w-8 text-primary" />
        </div>
        
        <div className="text-center">
          <h3 className="font-bold text-lg mb-2">Upload de Planilhas</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Arraste arquivos Excel (.xlsx) ou clique para selecionar
          </p>
        </div>

        <input
          type="file"
          accept=".xlsx,.xls"
          multiple
          onChange={handleFileUpload}
          disabled={uploading}
          className="hidden"
          id="file-upload"
        />
        
        <label htmlFor="file-upload">
          <Button disabled={uploading} asChild>
            <span className="cursor-pointer">
              {uploading ? (
                <>
                  <AlertCircle className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Selecionar Arquivos
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

        <div className="flex items-start gap-2 text-xs text-muted-foreground mt-4">
          <CheckCircle className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Detecção automática de:</p>
            <ul className="list-disc list-inside ml-2 mt-1">
              <li>Tipo de fila (Assistencial, Financeiro, etc.)</li>
              <li>Período de referência</li>
              <li>Estados por DDD</li>
              <li>Remoção de duplicatas</li>
            </ul>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default FileUploader;
