import {
  KPIData,
  OperatorData,
  DailyStatsData,
  HourlyStatsData,
  QueueStatsData,
  HeatmapData
} from './excelReader';

export interface BlipQueueRow {
  fila: string;
  ticketsFinalizados: number;
  tempoMedioPrimeiraResposta: string;
  tempoMedioEspera: string;
  tempoMedioResposta: string;
  tempoMedioAtendimento: string;
}

export interface BlipQueueStatsData extends QueueStatsData {
  tempoMedioPrimeiraResposta?: string;
  tempoMedioResposta?: string;
}

const normalizeHeader = (value: any): string => {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
};

const formatTimeFromDecimal = (timeDecimal: number): string => {
  if (typeof timeDecimal === 'number' && timeDecimal > 0) {
    const totalSeconds = Math.round(timeDecimal * 86400);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  }
  return '00:00:00';
};

const normalizeTime = (value: any): string => {
  if (value == null || value === '') return '00:00:00';
  if (typeof value === 'number') return formatTimeFromDecimal(value);

  let text = String(value).trim();
  if (!text) return '00:00:00';

  if (text.includes('d ')) {
    text = text.split('d ')[1]?.trim() || text;
  }

  const parts = text.split(':').map(part => part.trim());
  if (parts.length === 3) return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:${parts[2].padStart(2, '0')}`;
  if (parts.length === 2) return `00:${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
  return '00:00:00';
};

const parseTimeToSeconds = (value: string): number => {
  if (!value) return 0;
  const parts = value.split(':').map(Number);
  if (parts.length === 3) return (parts[0] * 3600) + (parts[1] * 60) + (parts[2] || 0);
  if (parts.length === 2) return (parts[0] * 60) + (parts[1] || 0);
  if (parts.length === 1 && !isNaN(parts[0])) return parts[0];
  return 0;
};

const formatTimeFromSeconds = (seconds: number): string => {
  if (!seconds || seconds <= 0) return '00:00:00';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs
    .toString()
    .padStart(2, '0')}`;
};

export async function readBlipQueuesExcelFile(filePath: string): Promise<BlipQueueRow[]> {
  try {
    console.log('Iniciando leitura do arquivo Excel (Blip Filas):', filePath);

    // Usar o caminho relativo direto, sem basename hardcoded
    const fullFilePath = filePath.startsWith('/') ? filePath : '/' + filePath;

    const response = await fetch(fullFilePath);
    console.log('🔍 Fetch response:', {
      url: fullFilePath,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar arquivo: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const XLSX = await import('xlsx');
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    if (!jsonData.length) return [];

    const headers = jsonData[0] || [];
    const headerMap: Record<number, keyof BlipQueueRow> = {};

    const headerToKey: Record<string, keyof BlipQueueRow> = {
      fila: 'fila',
      ticketsfinalizados: 'ticketsFinalizados',
      tempomedioda1aresposta: 'tempoMedioPrimeiraResposta',
      tempomedioda1resposta: 'tempoMedioPrimeiraResposta',
      tempomediodeespera: 'tempoMedioEspera',
      tempomedioderesposta: 'tempoMedioResposta',
      tempomediodatendimento: 'tempoMedioAtendimento'
    };

    headers.forEach((header, index) => {
      const normalized = normalizeHeader(header);
      if (headerToKey[normalized]) {
        headerMap[index] = headerToKey[normalized];
      }
    });

    const rows = jsonData.slice(1);
    const parsed: BlipQueueRow[] = rows
      .map((row) => {
        const result: Partial<BlipQueueRow> = {};

        Object.entries(headerMap).forEach(([colIndex, key]) => {
          const value = row[Number(colIndex)];
          if (key === 'ticketsFinalizados') {
            result[key] = Number(value) || 0;
          } else if (key === 'fila') {
            result[key] = String(value || '').trim();
          } else {
            result[key] = normalizeTime(value);
          }
        });

        return {
          fila: result.fila || '',
          ticketsFinalizados: result.ticketsFinalizados || 0,
          tempoMedioPrimeiraResposta: result.tempoMedioPrimeiraResposta || '00:00:00',
          tempoMedioEspera: result.tempoMedioEspera || '00:00:00',
          tempoMedioResposta: result.tempoMedioResposta || '00:00:00',
          tempoMedioAtendimento: result.tempoMedioAtendimento || '00:00:00'
        };
      })
      .filter(row => row.fila);

    console.log('Dados Blip Filas processados:', parsed.length);
    return parsed;
  } catch (error) {
    console.error('Erro ao ler arquivo Excel (Blip Filas):', error);
    throw new Error(`Nao foi possivel ler o arquivo Blip Filas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}

export function processBlipQueuesData(blipData: BlipQueueRow[]) {
  const totalTickets = blipData.reduce((sum, row) => sum + (row.ticketsFinalizados || 0), 0);

  const weightedAverageTime = (items: BlipQueueRow[], picker: (row: BlipQueueRow) => string): string => {
    let totalSeconds = 0;
    let totalWeight = 0;

    items.forEach(row => {
      const weight = row.ticketsFinalizados || 0;
      const seconds = parseTimeToSeconds(picker(row));
      if (weight > 0 && seconds > 0) {
        totalSeconds += seconds * weight;
        totalWeight += weight;
      }
    });

    if (totalWeight === 0) return '00:00:00';
    return formatTimeFromSeconds(Math.round(totalSeconds / totalWeight));
  };

  const kpis: KPIData = {
    totalChamadas: totalTickets,
    atendidas: totalTickets,
    abandonadas: 0,
    transferidas: 0,
    taxaAbandono: 0,
    taxaAtendimento: totalTickets > 0 ? 100 : 0,
    tempoMedioEspera: weightedAverageTime(blipData, row => row.tempoMedioEspera),
    tempoMedioAtendimento: weightedAverageTime(blipData, row => row.tempoMedioAtendimento),
    periodo: 'Planilha blip-filas.xlsx'
  };

  const queueData: BlipQueueStatsData[] = blipData.map(row => ({
    fila: row.fila,
    total: row.ticketsFinalizados || 0,
    atendidas: row.ticketsFinalizados || 0,
    abandonadas: 0,
    transferidas: 0,
    tempoMedioEspera: row.tempoMedioEspera,
    tempoMedioAtendimento: row.tempoMedioAtendimento,
    tempoMedioPrimeiraResposta: row.tempoMedioPrimeiraResposta,
    tempoMedioResposta: row.tempoMedioResposta
  }));

  const operators: OperatorData[] = [];
  const dailyStats: DailyStatsData[] = [];
  const hourlyData: HourlyStatsData[] = [];
  const heatmapData: HeatmapData[] = [];

  return {
    kpis,
    operators,
    dailyStats,
    hourlyData,
    queueData,
    heatmapData,
    calls: []
  };
}
