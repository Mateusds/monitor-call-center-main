import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Database, Calendar, MapPin } from "lucide-react";
import { CallRecord } from "@/types/callData";

interface DeleteConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  records: CallRecord[];
  loading?: boolean;
}

export const DeleteConfirmationModal = ({
  open,
  onOpenChange,
  onConfirm,
  records,
  loading = false
}: DeleteConfirmationModalProps) => {
  const [deleting, setDeleting] = useState(false);

  // Análise dos dados a serem excluídos
  const totalRecords = records.length;
  const atendidas = records.filter(r => r.chamadas === 'Atendidas').length;
  const abandonadas = records.filter(r => r.chamadas === 'Abandonadas').length;
  const uniqueQueues = Array.from(new Set(records.map(r => r.fila))).filter(Boolean);
  const uniqueStates = Array.from(new Set(records.map(r => r.estado))).filter(Boolean);

  // Preview dos primeiros registros
  const previewRecords = records.slice(0, 10);

  const handleConfirm = async () => {
    setDeleting(true);
    try {
      await onConfirm();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <AlertDialogTitle className="text-xl">
              Confirmar Exclusão de Dados
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base pt-4">
            Você está prestes a excluir <strong className="text-foreground">{totalRecords.toLocaleString()}</strong> registros de chamadas.
            Esta ação não pode ser desfeita, mas um backup será criado automaticamente.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex-1 overflow-hidden space-y-4">
          {/* Resumo dos dados */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-muted/50 border">
              <div className="flex items-center gap-2 mb-1">
                <Database className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium text-muted-foreground">Total</span>
              </div>
              <p className="text-lg font-bold">{totalRecords.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-lg bg-success/10 border border-success/20">
              <span className="text-xs font-medium text-muted-foreground">Atendidas</span>
              <p className="text-lg font-bold text-success">{atendidas.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <span className="text-xs font-medium text-muted-foreground">Abandonadas</span>
              <p className="text-lg font-bold text-destructive">{abandonadas.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 border">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium text-muted-foreground">Estados</span>
              </div>
              <p className="text-lg font-bold">{uniqueStates.length}</p>
            </div>
          </div>

          {/* Filas afetadas */}
          {uniqueQueues.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Filas afetadas:</p>
              <div className="flex flex-wrap gap-2">
                {uniqueQueues.map((queue, idx) => (
                  <Badge key={idx} variant="outline">
                    {queue}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Preview dos registros */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Preview dos registros (primeiros 10):</p>
            <ScrollArea className="h-48 rounded-md border bg-muted/30 p-3">
              <div className="space-y-2">
                {previewRecords.map((record, idx) => (
                  <div
                    key={idx}
                    className="text-xs p-2 rounded bg-background border space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{record.fila}</span>
                      <Badge
                        variant={record.chamadas === 'Atendidas' ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {record.chamadas}
                      </Badge>
                    </div>
                    <div className="text-muted-foreground">
                      {record.estado} | {record.telefone}
                    </div>
                  </div>
                ))}
                {totalRecords > 10 && (
                  <p className="text-xs text-center text-muted-foreground pt-2">
                    ... e mais {(totalRecords - 10).toLocaleString()} registros
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Aviso sobre backup */}
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-start gap-2">
              <Database className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-xs space-y-1">
                <p className="font-medium text-foreground">Backup automático será criado</p>
                <p className="text-muted-foreground">
                  Todos os dados serão salvos em backup antes da exclusão. 
                  Você poderá restaurá-los posteriormente se necessário.
                </p>
              </div>
            </div>
          </div>
        </div>

        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel disabled={deleting}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            disabled={deleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleting ? (
              <>
                <Database className="mr-2 h-4 w-4 animate-spin" />
                Criando backup e excluindo...
              </>
            ) : (
              <>
                <AlertTriangle className="mr-2 h-4 w-4" />
                Confirmar Exclusão
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};