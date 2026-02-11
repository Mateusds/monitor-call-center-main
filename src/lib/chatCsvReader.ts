import { ProcessedCallData, OperatorData, DailyStatsData, HourlyStatsData, QueueStatsData, HeatmapData, KPIData } from './excelReader';

// Função para formatar data de YYYY-MM-DD para DD/MM/YYYY
const formatDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
};

// Interface para as linhas do CSV do Chat (baseada na estrutura observada)
export interface ChatCsvRow {
    BotId: string;
    Status: string;
    StorageDate: string;
    OpenDate: string;
    FirstResponseDate: string;
    CloseDate: string;
    ExpirationDate: string;
    Team: string; // Fila
    Closed: string;
    QueueTime: string; // Tempo de espera
    FirstResponseTime: string;
    AverageAgentResponseTime: string;
    OperationalTime: string; // Tempo de atendimento
    TicketTotalTime: string;
    AgentName: string;
    [key: string]: any;
}

// Reutilizando as interfaces de saída do excelReader.ts para manter compatibilidade
// ProcessedCallData, OperatorData, etc.

export async function readChatCsvFile(filePath: string): Promise<ChatCsvRow[]> {
    try {
        console.log('Iniciando leitura do arquivo CSV de Chat (Text Mode):', filePath);

        // Adicionar o basename para produção
        const basePath = import.meta.env.PROD ? '/monitor-call-center-main' : '';
        const fullFilePath = basePath + filePath;
        
        const response = await fetch(fullFilePath);

        if (!response.ok) {
            throw new Error(`Erro ao buscar arquivo: ${response.status} ${response.statusText}`);
        }

        const text = await response.text();
        console.log('Arquivo carregado, tamanho:', text.length);

        const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');

        if (lines.length === 0) return [];

        // Detectar separador
        const firstLine = lines[0];
        const separator = firstLine.includes(';') ? ';' : ',';
        console.log('Separador detectado:', separator);

        const headers = firstLine.split(separator).map(h => h.trim().replace(/^"|"$/g, ''));

        const jsonData = lines.slice(1).map(line => {
            const values = line.split(separator);
            const row: any = {};

            headers.forEach((header, index) => {
                let val = values[index]?.trim();
                // Remover aspas
                if (val && val.startsWith('"') && val.endsWith('"')) {
                    val = val.substring(1, val.length - 1);
                }
                row[header] = val;
            });

            return row;
        });

        console.log(`📊 Dados parseados manualmente: ${jsonData.length} linhas`);
        if (jsonData.length > 0) console.log('Exemplo:', jsonData[0]);

        return jsonData as ChatCsvRow[];
    } catch (error) {
        console.error('Erro detalhado ao ler arquivo CSV de Chat:', error);
        throw new Error(`Não foi possível ler o arquivo CSV: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
}

export function processChatData(chatData: ChatCsvRow[], startDate?: string, endDate?: string) {
    console.log('🔧 Processando dados do Chat...', chatData.length, 'registros');

    const parseCustomDate = (dateStr: string): Date | null => {
        if (!dateStr) return null;
        dateStr = dateStr.trim();

        // Tentar constructor padrão primeiro (ISO ou compatível)
        let d = new Date(dateStr);
        if (!isNaN(d.getTime())) return d;

        // Tentar formato BR: DD/MM/YYYY HH:MM:SS ou DD/MM/YYYY
        // Regex captura: 1=Dia, 2=Mes, 3=Ano, 4=Hora, 5=Min, 6=Sec
        const parts = dateStr.match(/(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
        if (parts) {
            const day = parseInt(parts[1], 10);
            const month = parseInt(parts[2], 10) - 1; // Mês 0-indexado
            const year = parseInt(parts[3], 10);
            const hour = parts[4] ? parseInt(parts[4], 10) : 0;
            const min = parts[5] ? parseInt(parts[5], 10) : 0;
            const sec = parts[6] ? parseInt(parts[6], 10) : 0;

            d = new Date(year, month, day, hour, min, sec);
            if (!isNaN(d.getTime())) return d;
        }

        return null;
    };

    // Normalizar dados para o formato ProcessedCallData
    const calls: ProcessedCallData[] = chatData.map((row, index) => {
        const dataHoraRaw = row.OpenDate || row.StorageDate || '';
        const dateObj = parseCustomDate(dataHoraRaw);

        // Converter tempo
        const formatTime = (timeVal: any): string => {
            if (!timeVal) return '00:00:00';
            let val = String(timeVal).trim();

            // Remove "0d " ou "1d " do início
            if (val.includes('d ')) {
                const parts = val.split('d ');
                if (parts.length > 1) val = parts[1].trim();
            }

            if (val.includes(':')) {
                const parts = val.split(':');
                if (parts.length === 3) return val;
                if (parts.length === 2) return `00:${val}`;
            }

            return '00:00:00';
        };

        const normalizeStatus = (statusRaw: string): 'Abandonadas' | 'Atendidas' | 'Transferidas' => {
            const s = String(statusRaw || '').toLowerCase();
            if (s.includes('closed') || s.includes('atendida')) return 'Atendidas';
            if (s.includes('abandoned') || s.includes('abandonada') || s.includes('canceled')) return 'Abandonadas';
            if (s.includes('transfer')) return 'Transferidas';
            return 'Atendidas';
        };

        return {
            id: `chat-${index}`,
            fila: row.Team || 'Geral',
            telefone: row.UserPhone || '',
            status: normalizeStatus(row.Status),
            dataHora: dateObj ? dateObj.toLocaleString('pt-BR') : '',
            dataHoraBruta: dateObj ? dateObj.toISOString() : null,
            tempoEspera: formatTime(row.QueueTime),
            tempoAtendimento: formatTime(row.OperationalTime),
            ramal: null,
            operador: row.AgentName || null
        };
    }).filter(call => call.dataHoraBruta !== null);

    console.log('✅ Registros válidos (com data processável):', calls.length);

    // Filtrar por período
    let filteredCalls = calls;
    if (startDate && endDate) {
        filteredCalls = calls.filter(call => {
            if (!call.dataHoraBruta) return false;
            const dateStr = call.dataHoraBruta.split('T')[0];
            return dateStr >= startDate && dateStr <= endDate;
        });
        console.log(`🔍 Chat filtrado: ${filteredCalls.length} registros`);
    }

    const totalChamadas = filteredCalls.length;
    const atendidas = filteredCalls.filter(c => c.status === 'Atendidas').length;
    const abandonadas = filteredCalls.filter(c => c.status === 'Abandonadas').length;
    const transferidas = filteredCalls.filter(c => c.status === 'Transferidas').length;

    const kpis: KPIData = {
        totalChamadas,
        atendidas,
        abandonadas,
        transferidas,
        taxaAbandono: totalChamadas > 0 ? (abandonadas / totalChamadas) * 100 : 0,
        taxaAtendimento: totalChamadas > 0 ? (atendidas / totalChamadas) * 100 : 0,
        tempoMedioEspera: calculateAverageTime(filteredCalls.map(c => c.tempoEspera)),
        tempoMedioAtendimento: calculateAverageTime(filteredCalls.map(c => c.tempoAtendimento)),
        periodo: startDate && endDate ? `${formatDate(startDate)} - ${formatDate(endDate)}` : 'Período Completo'
    };

    const operators = processChatOperators(filteredCalls);
    const queueData = processChatQueueStats(filteredCalls);
    const dailyStats = processChatDailyStats(filteredCalls);
    const hourlyData = processChatHourlyStats(filteredCalls);
    const heatmapData = processChatHeatmapData(filteredCalls);

    // Ordenar por data decrescente
    const callsList = [...filteredCalls].sort((a, b) =>
        // @ts-ignore
        new Date(b.dataHoraBruta).getTime() - new Date(a.dataHoraBruta).getTime()
    );

    return {
        kpis,
        operators,
        dailyStats,
        hourlyData,
        queueData,
        heatmapData,
        calls: callsList
    };
}

// Funções auxiliares copiadas/adaptadas de excelReader.ts para manter contexto local
// (Simplificadas para o contexto do Chat)

function calculateAverageTime(times: string[]): string {
    let totalSeconds = 0;
    let count = 0;

    times.forEach(t => {
        if (!t) return;
        let val = String(t).trim();

        // Handle "0d 00:00:00" format in case formatTime wasn't called
        if (val.includes('d ')) {
            val = val.split('d ')[1]?.trim() || val;
        }

        const parts = val.split(':').map(Number);
        if (parts.length === 3) {
            totalSeconds += parts[0] * 3600 + parts[1] * 60 + parts[2];
            count++;
        } else if (parts.length === 2) {
            totalSeconds += parts[0] * 60 + parts[1];
            count++;
        }
    });

    if (count === 0) return '00:00:00';
    const avg = Math.round(totalSeconds / count);
    const h = Math.floor(avg / 3600).toString().padStart(2, '0');
    const m = Math.floor((avg % 3600) / 60).toString().padStart(2, '0');
    const s = (avg % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
}

function processChatOperators(calls: ProcessedCallData[]): OperatorData[] {
    const opMap = new Map<string, any>();

    calls.forEach(call => {
        if (call.operador && (call.status === 'Atendidas' || call.status === 'Transferidas')) {
            if (!opMap.has(call.operador)) {
                opMap.set(call.operador, { chamadas: 0, nome: call.operador, filas: new Map(), tempos: [] });
            }
            const op = opMap.get(call.operador);
            op.chamadas++;
            // Contagem de filas
            const f = call.fila || 'N/A';
            op.filas.set(f, (op.filas.get(f) || 0) + 1);

            // Tempo (apenas convertendo para segundos para média)
            const parts = call.tempoAtendimento.split(':').map(Number);
            if (parts.length === 3) op.tempos.push(parts[0] * 3600 + parts[1] * 60 + parts[2]);
        }
    });

    return Array.from(opMap.values()).map((op: any, i) => {
        let filaDestaque = 'N/A';
        let max = 0;
        op.filas.forEach((v: number, k: string) => { if (v > max) { max = v; filaDestaque = k; } });

        const avgSec = op.tempos.length ? Math.round(op.tempos.reduce((a: number, b: number) => a + b, 0) / op.tempos.length) : 0;

        const h = Math.floor(avgSec / 3600).toString().padStart(2, '0');
        const m = Math.floor((avgSec % 3600) / 60).toString().padStart(2, '0');
        const s = (avgSec % 60).toString().padStart(2, '0');

        return {
            id: (i + 1).toString(),
            nome: op.nome,
            ramal: '',
            avatar: op.nome.substring(0, 2).toUpperCase(),
            chamadasAtendidas: op.chamadas,
            tempoMedioAtendimento: `${h}:${m}:${s}`,
            tempoMedioEspera: '00:00:00',
            disponivel: true,
            hojeAtendidas: 0,
            filaDestaque
        };
    }).sort((a, b) => b.chamadasAtendidas - a.chamadasAtendidas);
}

function processChatDailyStats(calls: ProcessedCallData[]): DailyStatsData[] {
    const map = new Map<string, DailyStatsData>();
    calls.forEach(c => {
        // Data formato ISO YYYY-MM-DD
        const date = new Date(c.dataHoraBruta).toISOString().split('T')[0];
        if (!map.has(date)) map.set(date, { data: date, total: 0, atendidas: 0, abandonadas: 0, transferidas: 0 });
        const stat = map.get(date)!;
        stat.total++;
        if (c.status === 'Atendidas') stat.atendidas++;
        else if (c.status === 'Abandonadas') stat.abandonadas++;
        else if (c.status === 'Transferidas') stat.transferidas++;
    });
    return Array.from(map.values()).sort((a, b) => a.data.localeCompare(b.data));
}

function processChatHourlyStats(calls: ProcessedCallData[]): HourlyStatsData[] {
    // Simplificado
    return [];
}

function processChatQueueStats(calls: ProcessedCallData[]): QueueStatsData[] {
    const map = new Map<string, QueueStatsData>();
    calls.forEach(c => {
        const f = c.fila;
        if (!map.has(f)) map.set(f, { fila: f, total: 0, atendidas: 0, abandonadas: 0, transferidas: 0, tempoMedioEspera: '00:00:00' });
        const stat = map.get(f)!;
        stat.total++;
        if (c.status === 'Atendidas') stat.atendidas++;
        else if (c.status === 'Abandonadas') stat.abandonadas++;
    });
    return Array.from(map.values());
}

function processChatHeatmapData(calls: ProcessedCallData[]): HeatmapData[] {
    // Retornar array vazio ou lógica similar
    return [];
}
