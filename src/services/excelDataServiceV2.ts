// Versão 2 do serviço com tratamento melhor de erros e fallback mais robusto

import { readExcelFile, processExcelData, ProcessedCallData, KPIData, OperatorData, DailyStatsData, HourlyStatsData, QueueStatsData } from '@/lib/excelReader';

// Cache para evitar recarregar os dados toda vez
let cachedData: {
  calls: ProcessedCallData[];
  kpiData: KPIData;
  operators: OperatorData[];
  dailyStats: DailyStatsData[];
  hourlyData: HourlyStatsData[];
  queueData: QueueStatsData[];
  source: 'excel' | 'mock'; // Adicionar origem dos dados
} | null = null;

let isLoading = false;
let error: string | null = null;

export async function loadExcelDataV2(startDate?: string, endDate?: string) {
  // Desabilitar cache quando há filtros para garantir dados atualizados
  const hasFilter = startDate && endDate && startDate !== '' && endDate !== '';

  if (hasFilter) {
    console.log('📅 Filtro ativo, ignorando cache...');
  } else {
    // Limpar cache se existir e for de dados filtrados
    if (cachedData && (cachedData as any).kpiData?.periodo !== 'Out/2025 - Jan/2026') {
      console.log('🗑️ Cache de dados filtrados, limpando...');
      cachedData = null;
    }

    // Usar cache apenas quando não há filtros ou quando os filtros estão vazios
    if (cachedData) {
      console.log('📋 Usando dados em cache...');
      return cachedData;
    }
  }

  // Se já estiver carregando, aguarda
  if (isLoading) {
    return new Promise((resolve, reject) => {
      const checkData = () => {
        if (cachedData) {
          resolve(cachedData);
        } else if (error) {
          reject(new Error(error));
        } else if (!isLoading) {
          reject(new Error('Falha ao carregar dados'));
        } else {
          setTimeout(checkData, 100);
        }
      };
      checkData();
    });
  }

  isLoading = true;
  error = null;

  try {
    // Tentar ler o arquivo Excel
    console.log('🚀 Tentando carregar dados do arquivo Excel...');
    const excelPath = '/planilhas/Relatório 01_10_25 a 10_01_26.xlsx';

    const excelData = await readExcelFile(excelPath);
    console.log('✅ Arquivo Excel lido com sucesso, registros:', excelData.length);

    // Processar os dados
    const processedData = processExcelData(excelData, startDate, endDate);

    const dataWithSource = {
      calls: [], // Chamadas não são mais necessárias no cache
      kpiData: processedData.kpis,
      operators: processedData.operators,
      dailyStats: processedData.dailyStats,
      hourlyData: processedData.hourlyData,
      queueData: processedData.queueData,
      heatmapData: processedData.heatmapData,
      source: 'excel' as const
    };

    // Armazenar em cache
    cachedData = dataWithSource;
    isLoading = false;

    console.log('🎉 Dados do Excel carregados com sucesso:', {
      totalChamadas: processedData.kpis.totalChamadas,
      atendidas: processedData.kpis.atendidas,
      abandonadas: processedData.kpis.abandonadas,
      operadores: processedData.operators.length,
      periodo: processedData.kpis.periodo,
      source: 'excel'
    });

    return dataWithSource;

  } catch (err) {
    console.warn('⚠️ Não foi possível carregar o arquivo Excel, usando dados mockados...');
    console.error('Erro detalhado:', err);

    // Em caso de erro, retorna dados mockados
    const mockData = getMockData();
    const mockDataWithSource = {
      ...mockData,
      source: 'mock' as const
    };

    cachedData = mockDataWithSource;
    isLoading = false;
    error = `Usando dados mockados: ${err instanceof Error ? err.message : 'Erro desconhecido'}`;

    console.log('📊 Usando dados mockados como fallback:', {
      totalChamadas: mockData.kpiData.totalChamadas,
      operadores: mockData.operators.length,
      periodo: mockData.kpiData.periodo,
      source: 'mock'
    });

    return mockDataWithSource;
  }
}

export function getCachedDataV2() {
  return cachedData;
}

export function getLoadingStatusV2() {
  return { isLoading, error };
}

export function clearCacheV2() {
  console.log('🧹 Limpando cache do Excel...');
  cachedData = null;
  error = null;
  isLoading = false;
}

// Dados mockados melhorados (baseados nos dados reais da planilha)
function getMockData() {
  const mockCalls: ProcessedCallData[] = [
    { id: '1', fila: 'callcenter1', telefone: '82991592545', status: 'Atendidas', dataHora: '01/10/2025 06:05', dataHoraBruta: 45931.25347222222, tempoEspera: '00:00:09', tempoAtendimento: '00:00:50', ramal: '1040', operador: 'WINNY VIANA' },
    { id: '2', fila: 'callcenter1', telefone: '82991592545', status: 'Atendidas', dataHora: '01/10/2025 07:08', dataHoraBruta: 45931.29722222222, tempoEspera: '00:01:35', tempoAtendimento: '00:00:35', ramal: '1017', operador: 'KASSIA' },
    { id: '3', fila: 'callcenter1', telefone: '82991173908', status: 'Atendidas', dataHora: '01/10/2025 07:47', dataHoraBruta: 45931.31944444444, tempoEspera: '00:00:09', tempoAtendimento: '00:00:24', ramal: '1010', operador: 'JOCELAINE SANTOS' },
    { id: '4', fila: 'callcenter1', telefone: '8234365516', status: 'Atendidas', dataHora: '01/10/2025 07:51', dataHoraBruta: 45931.32638888889, tempoEspera: '00:01:17', tempoAtendimento: '00:02:30', ramal: '1013', operador: 'ALICIA RAMOS' },
    { id: '5', fila: 'callcenter1', telefone: '82994043126', status: 'Atendidas', dataHora: '01/10/2025 07:56', dataHoraBruta: 45931.33333333333, tempoEspera: '00:03:20', tempoAtendimento: '00:05:59', ramal: '1010', operador: 'JOCELAINE SANTOS' },
    { id: '6', fila: 'callcenter1', telefone: '82987592022', status: 'Atendidas', dataHora: '01/10/2025 08:00', dataHoraBruta: 45931.33333333333, tempoEspera: '00:00:50', tempoAtendimento: '00:11:53', ramal: '1038', operador: 'LAURA LEITE' },
    { id: '7', fila: 'callcenter1', telefone: '83988741997', status: 'Atendidas', dataHora: '01/10/2025 08:02', dataHoraBruta: 45931.33472222222, tempoEspera: '00:00:32', tempoAtendimento: '00:04:57', ramal: '1010', operador: 'JOCELAINE SANTOS' },
    { id: '8', fila: 'callcenter1', telefone: '83988296013', status: 'Transferidas', dataHora: '01/10/2025 08:04', dataHoraBruta: 45931.33611111111, tempoEspera: '00:00:14', tempoAtendimento: '00:15:26', ramal: '1013', operador: 'ALICIA RAMOS' },
    { id: '9', fila: 'callcenter1', telefone: '84987332255', status: 'Atendidas', dataHora: '01/10/2025 08:06', dataHoraBruta: 45931.3375, tempoEspera: '00:10:37', tempoAtendimento: '00:20:24', ramal: '1038', operador: 'LAURA LEITE' },
    { id: '10', fila: 'callcenter1', telefone: '82991799752', status: 'Abandonadas', dataHora: '01/10/2025 08:08', dataHoraBruta: 45931.33888888889, tempoEspera: '00:03:33', tempoAtendimento: '00:00:00', ramal: null, operador: null },
  ];

  const mockKPI: KPIData = {
    totalChamadas: 26889,
    abandonadas: 5765,
    atendidas: 20627,
    transferidas: 497,
    taxaAbandono: 21.4,
    taxaAtendimento: 76.7,
    tempoMedioEspera: '01:42',
    tempoMedioAtendimento: '04:35',
    periodo: 'Out/2025 - Jan/2026'
  };

  const mockOperators: OperatorData[] = [
    { id: '1', nome: 'JOCELAINE SANTOS', ramal: '1010/1034', avatar: 'JS', chamadasAtendidas: 2847, tempoMedioAtendimento: '04:22', tempoMedioEspera: '00:01:20', disponivel: true, hojeAtendidas: 12, filaDestaque: 'callcenter1' },
    { id: '2', nome: 'LAURA LEITE', ramal: '1038', avatar: 'LL', chamadasAtendidas: 2156, tempoMedioAtendimento: '05:15', tempoMedioEspera: '00:02:10', disponivel: true, hojeAtendidas: 8, filaDestaque: 'callcenter1' },
    { id: '3', nome: 'STHEFANIE', ramal: '1039/1015', avatar: 'ST', chamadasAtendidas: 1923, tempoMedioAtendimento: '04:48', tempoMedioEspera: '00:01:45', disponivel: true, hojeAtendidas: 6, filaDestaque: 'callcenter1' },
    { id: '4', nome: 'KASSIA', ramal: '1017/1041', avatar: 'KA', chamadasAtendidas: 1654, tempoMedioAtendimento: '03:55', tempoMedioEspera: '00:01:10', disponivel: true, hojeAtendidas: 9, filaDestaque: 'callcenter1' },
    { id: '5', nome: 'ALICIA RAMOS', ramal: '1013/1031', avatar: 'AR', chamadasAtendidas: 1489, tempoMedioAtendimento: '06:12', tempoMedioEspera: '00:03:15', disponivel: false, hojeAtendidas: 0, filaDestaque: 'callcenter1' },
    { id: '6', nome: 'WINNY VIANA', ramal: '1040/2003', avatar: 'WV', chamadasAtendidas: 1234, tempoMedioAtendimento: '04:30', tempoMedioEspera: '00:01:50', disponivel: true, hojeAtendidas: 5, filaDestaque: 'callcenter1' },
    { id: '7', nome: 'LARISSA ARAUJO', ramal: '2018', avatar: 'LA', chamadasAtendidas: 2456, tempoMedioAtendimento: '05:02', tempoMedioEspera: '00:02:05', disponivel: true, hojeAtendidas: 11, filaDestaque: 'reversao' },
    { id: '8', nome: 'EDUARDA COSTA', ramal: '2015', avatar: 'EC', chamadasAtendidas: 2134, tempoMedioAtendimento: '04:18', tempoMedioEspera: '00:01:30', disponivel: true, hojeAtendidas: 7, filaDestaque: 'reversao' },
    { id: '9', nome: 'FERNANDA CAVALCANTE', ramal: '2016', avatar: 'FC', chamadasAtendidas: 1876, tempoMedioAtendimento: '03:45', tempoMedioEspera: '00:01:15', disponivel: true, hojeAtendidas: 10, filaDestaque: 'sac' },
    { id: '10', nome: 'JACIELLY SOUZA', ramal: '2017', avatar: 'JZ', chamadasAtendidas: 1543, tempoMedioAtendimento: '04:55', tempoMedioEspera: '00:02:40', disponivel: true, hojeAtendidas: 4, filaDestaque: 'sac' },
  ];

  const mockDailyStats: DailyStatsData[] = [
    { data: '01/10', total: 245, abandonadas: 52, atendidas: 186, transferidas: 7 },
    { data: '02/10', total: 312, abandonadas: 67, atendidas: 237, transferidas: 8 },
    { data: '03/10', total: 289, abandonadas: 61, atendidas: 220, transferidas: 8 },
    { data: '06/10', total: 334, abandonadas: 71, atendidas: 255, transferidas: 8 },
    { data: '07/10', total: 356, abandonadas: 76, atendidas: 271, transferidas: 9 },
    { data: '08/10', total: 298, abandonadas: 64, atendidas: 227, transferidas: 7 },
    { data: '09/10', total: 321, abandonadas: 69, atendidas: 244, transferidas: 8 },
    { data: '10/10', total: 278, abandonadas: 59, atendidas: 212, transferidas: 7 },
    { data: '13/10', total: 345, abandonadas: 74, atendidas: 263, transferidas: 8 },
    { data: '14/10', total: 367, abandonadas: 78, atendidas: 280, transferidas: 9 },
    { data: '15/10', total: 312, abandonadas: 67, atendidas: 237, transferidas: 8 },
    { data: '16/10', total: 289, abandonadas: 62, atendidas: 220, transferidas: 7 },
    { data: '17/10', total: 334, abandonadas: 71, atendidas: 255, transferidas: 8 },
    { data: '20/10', total: 356, abandonadas: 76, atendidas: 271, transferidas: 9 },
    { data: '21/10', total: 298, abandonadas: 64, atendidas: 227, transferidas: 7 },
    { data: '22/10', total: 321, abandonadas: 69, atendidas: 244, transferidas: 8 },
    { data: '23/10', total: 278, abandonadas: 59, atendidas: 212, transferidas: 7 },
    { data: '24/10', total: 345, abandonadas: 74, atendidas: 263, transferidas: 8 },
    { data: '27/10', total: 367, abandonadas: 78, atendidas: 280, transferidas: 9 },
    { data: '28/10', total: 312, abandonadas: 67, atendidas: 237, transferidas: 8 },
    { data: '29/10', total: 289, abandonadas: 62, atendidas: 220, transferidas: 7 },
    { data: '30/10', total: 334, abandonadas: 71, atendidas: 255, transferidas: 8 },
    { data: '31/10', total: 301, abandonadas: 64, atendidas: 229, transferidas: 8 },
  ];

  const mockHourlyStats: HourlyStatsData[] = [
    { hora: '06:00', chamadas: 156, abandonadas: 33, atendidas: 123 },
    { hora: '07:00', chamadas: 478, abandonadas: 102, atendidas: 376 },
    { hora: '08:00', chamadas: 1245, abandonadas: 266, atendidas: 979 },
    { hora: '09:00', chamadas: 2156, abandonadas: 461, atendidas: 1695 },
    { hora: '10:00', chamadas: 2534, abandonadas: 542, atendidas: 1992 },
    { hora: '11:00', chamadas: 2678, abandonadas: 573, atendidas: 2105 },
    { hora: '12:00', chamadas: 1567, abandonadas: 335, atendidas: 1232 },
    { hora: '13:00', chamadas: 1890, abandonadas: 404, atendidas: 1486 },
    { hora: '14:00', chamadas: 2345, abandonadas: 502, atendidas: 1843 },
    { hora: '15:00', chamadas: 2678, abandonadas: 573, atendidas: 2105 },
    { hora: '16:00', chamadas: 2456, abandonadas: 525, atendidas: 1931 },
    { hora: '17:00', chamadas: 1789, abandonadas: 383, atendidas: 1406 },
    { hora: '18:00', chamadas: 567, abandonadas: 121, atendidas: 446 },
  ];

  const mockQueueStats: QueueStatsData[] = [
    { fila: 'callcenter1', total: 18234, abandonadas: 3902, atendidas: 13990, transferidas: 342, tempoMedioEspera: '00:01:45' },
    { fila: 'reversao', total: 5678, abandonadas: 1215, atendidas: 4308, transferidas: 155, tempoMedioEspera: '00:02:10' },
    { fila: 'sac', total: 2977, abandonadas: 648, atendidas: 2329, transferidas: 0, tempoMedioEspera: '00:00:55' },
  ];

  const mockHeatmapData = [
    { hora: '06-08', seg: 45, ter: 32, qua: 28, qui: 35, sex: 52, sab: 78, dom: 65 },
    { hora: '08-10', seg: 120, ter: 145, qua: 132, qui: 165, sex: 189, sab: 234, dom: 198 },
    { hora: '10-12', seg: 280, ter: 320, qua: 295, qui: 340, sex: 385, sab: 412, dom: 356 },
    { hora: '12-14', seg: 220, ter: 245, qua: 210, qui: 265, sex: 298, sab: 345, dom: 289 },
    { hora: '14-16', seg: 85, ter: 92, qua: 78, qui: 105, sex: 125, sab: 156, dom: 134 },
    { hora: '16-18', seg: 45, ter: 52, qua: 38, qui: 65, sex: 78, sab: 89, dom: 67 }
  ];

  return {
    calls: mockCalls,
    kpiData: mockKPI,
    operators: mockOperators,
    dailyStats: mockDailyStats,
    hourlyData: mockHourlyStats,
    queueData: mockQueueStats,
    heatmapData: mockHeatmapData
  };
}
