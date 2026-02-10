import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, XCircle } from "lucide-react";

interface DetailData {
  queue: string;
  answered: number;
  abandoned: number;
  total: number;
  rate: number;
}

interface DetailTableProps {
  data: DetailData[];
  isOnlineChannel: boolean;
}

export const DetailTable = ({ data, isOnlineChannel }: DetailTableProps) => {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-bold">Fila</TableHead>
            <TableHead className="text-right font-bold">{isOnlineChannel ? "Concluídas" : "Atendidas"}</TableHead>
            <TableHead className="text-right font-bold">Taxa</TableHead>
            <TableHead className="text-right font-bold">Abandonadas</TableHead>
            <TableHead className="text-right font-bold">Taxa</TableHead>
            <TableHead className="text-right font-bold">Total</TableHead>
            <TableHead className="text-center font-bold">Performance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, index) => {
            const answeredRate = item.total > 0 ? (item.answered / item.total) * 100 : 0;
            const abandonedRate = item.total > 0 ? (item.abandoned / item.total) * 100 : 0;
            
            return (
              <TableRow key={item.queue} className={index % 2 === 0 ? "bg-muted/20" : ""}>
                <TableCell className="font-medium">{item.queue}</TableCell>
                <TableCell className="text-right font-semibold">{item.answered.toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  <span className="text-success font-semibold">{answeredRate.toFixed(1)}%</span>
                </TableCell>
                <TableCell className="text-right font-semibold">{item.abandoned.toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  <span className="text-warning font-semibold">{abandonedRate.toFixed(1)}%</span>
                </TableCell>
                <TableCell className="text-right font-semibold">{item.total.toLocaleString()}</TableCell>
                <TableCell className="text-center">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      item.rate >= 80
                        ? "text-success"
                        : item.rate >= 60
                        ? "text-warning"
                        : "text-destructive"
                    }`}
                  >
                    {item.rate >= 80 ? (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Excelente
                      </>
                    ) : item.rate >= 60 ? (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Bom
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4" />
                        Crítico
                      </>
                    )}
                  </span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
