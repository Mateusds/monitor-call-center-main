// Interfaces para dados do Excel
export interface ExcelCallData {
  fila: string;
  telefone: string;
  status: string;
  dataHoraChamada: string;
  dataHoraAtendimento: string;
  dataHoraEncerramento: string;
  tempoEspera: string;
  tempoAtendimentoSeg: number;
  tempoAtendimentoMin: number;
  ramal: string;
  operador: string;
}

export interface ProcessedCallData {
  id: string;
  fila: string;
  telefone: string;
  status: 'Abandonadas' | 'Atendidas' | 'Transferidas';
  dataHora: string;
  dataHoraBruta: any; // Data/hora bruta da planilha Excel
  tempoEspera: string;
  tempoAtendimento: string;
  ramal: string | null;
  operador: string | null;
}

export interface OperatorData {
  id: string;
  nome: string;
  ramal: string;
  avatar: string;
  chamadasAtendidas: number;
  tempoMedioAtendimento: string;
  tempoMedioEspera: string;
  disponivel: boolean;
  hojeAtendidas: number;
  filaDestaque?: string;
}

export interface DailyStatsData {
  data: string;
  total: number;
  abandonadas: number;
  atendidas: number;
  transferidas: number;
}

export interface HourlyStatsData {
  hora: string;
  chamadas: number;
  abandonadas: number;
  atendidas: number;
}

export interface QueueStatsData {
  fila: string;
  total: number;
  abandonadas: number;
  atendidas: number;
  transferidas: number;
  tempoMedioEspera?: string;
  tempoMedioAtendimento?: string;
}

export interface HeatmapData {
  hora: string;
  seg: number;
  ter: number;
  qua: number;
  qui: number;
  sex: number;
  sab: number;
  dom: number;
}

export interface KPIData {
  totalChamadas: number;
  abandonadas: number;
  atendidas: number;
  transferidas: number;
  taxaAbandono: number;
  taxaAtendimento: number;
  tempoMedioEspera: string;
  tempoMedioAtendimento: string;
  periodo: string;
}

// Função para ler o arquivo Excel
export async function readExcelFile(filePath: string): Promise<ExcelCallData[]> {
  try {
    console.log('Iniciando leitura do arquivo Excel:', filePath);

    // Tentar ler o arquivo via fetch
    const response = await fetch(filePath);

    if (!response.ok) {
      throw new Error(`Erro ao buscar arquivo: ${response.status} ${response.statusText}`);
    }

    console.log('Arquivo encontrado, tamanho:', response.headers.get('content-length'));

    const arrayBuffer = await response.arrayBuffer();
    console.log('ArrayBuffer criado, tamanho:', arrayBuffer.byteLength);

    // Importar XLSX dinamicamente para evitar problemas de SSR
    const XLSX = await import('xlsx');
    console.log('XLSX importado com sucesso');

    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    console.log('Workbook criado, sheets:', workbook.SheetNames);

    // FORÇAR usar apenas a primeira planilha "Total chamadas receptivas"
    const sheetName = workbook.SheetNames[0];
    console.log('Usando APENAS a planilha:', sheetName);

    // NÃO verificar outras planilhas - usar apenas a primeira
    console.log('📋 Ignorando outras planilhas para evitar duplicação de dados');

    const worksheet = workbook.Sheets[sheetName];

    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    console.log('📊 Dados convertidos para JSON, linhas:', jsonData.length);

    // Pular cabeçalho (primeira linha)
    const dataRows = jsonData.slice(1);
    console.log('📊 Linhas de dados (sem cabeçalho):', dataRows.length);

    const processedData: ExcelCallData[] = dataRows.map((row, index) => {
      const processed = {
        fila: row[0] || '',
        telefone: row[1] || '',
        status: row[2] || '',
        dataHoraChamada: row[3] || '',
        dataHoraAtendimento: row[4] || '',
        dataHoraEncerramento: row[5] || '',
        tempoEspera: row[6] || '',
        tempoAtendimentoSeg: parseInt(row[7]) || 0,
        tempoAtendimentoMin: parseFloat(row[8]) || 0,
        ramal: row[9] || '',
        operador: row[10] || ''
      };

      // Debug primeira linha
      if (index === 0) {
        console.log('Primeira linha processada:', processed);
      }

      return processed;
    }).filter(row => row.telefone); // Filtrar linhas vazias

    console.log('Dados processados finais:', processedData.length, 'registros');

    if (processedData.length === 0) {
      throw new Error('Nenhum dado válido encontrado no arquivo Excel');
    }

    return processedData;
  } catch (error) {
    console.error('Erro detalhado ao ler arquivo Excel:', error);
    throw new Error(`Não foi possível ler o arquivo Excel: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}

// Função para processar os dados do Excel com filtro de período
export function processExcelData(excelData: ExcelCallData[], startDate?: string, endDate?: string) {
  console.log('🔧 Processando dados do Excel...', excelData.length, 'registros');

  if (startDate && endDate) {
    console.log(`📅 Filtrando período: ${startDate} a ${endDate}`);
  }

  // Processar chamadas
  const calls: ProcessedCallData[] = excelData.map((row, index) => {
    // Converter data/hora do formato Excel para formato legível
    const formatDateTime = (excelDate: any) => {
      if (typeof excelDate === 'number') {
        // Converter data Excel para Date usando UTC para evitar problemas de fuso horário
        const utcDate = new Date((excelDate - 25569) * 86400 * 1000);
        // Ajustar para o fuso horário local (Brasil UTC-3)
        const localDate = new Date(utcDate.getTime() + (utcDate.getTimezoneOffset() * 60000));

        return localDate.toLocaleString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'America/Sao_Paulo'
        });
      }
      return excelDate?.toString() || '';
    };

    // Converter tempo em formato decimal para HH:MM:SS
    const formatTimeFromDecimal = (timeDecimal: any) => {
      if (typeof timeDecimal === 'number' && timeDecimal > 0) {
        const totalSeconds = Math.round(timeDecimal * 86400); // 86400 segundos = 1 dia
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
      return '00:00:00';
    };

    // Usar a data/hora bruta da planilha para processamento horário
    const rawDateTime = formatDateTime(row.dataHoraChamada);

    const processedCall: ProcessedCallData = {
      id: (index + 1).toString(),
      fila: row.fila || '',
      telefone: row.telefone ? row.telefone.toString() : '',
      status: normalizeStatus(row.status),
      dataHora: rawDateTime,
      dataHoraBruta: row.dataHoraChamada, // Adicionar data bruta para processamento
      tempoEspera: formatTimeFromDecimal(row.tempoEspera),
      tempoAtendimento: formatTimeFromDecimal(row.tempoAtendimentoMin),
      ramal: row.ramal ? row.ramal.toString() : null,
      operador: row.operador ? row.operador.toString() : null
    };

    // Debug primeiras linhas
    if (index < 10) { // Mostrar mais linhas para debug
      console.log(`📋 Linha ${index + 1} processada:`, processedCall);
    }

    return processedCall;
  });

  console.log('✅ Chamadas processadas:', calls.length);

  // Filtrar por período se especificado
  let filteredCalls = calls;
  if (startDate && endDate) {
    console.log(`🔍 Aplicando filtro: ${startDate} a ${endDate}`);
    filteredCalls = calls.filter(call => {
      if (!call.dataHora) return false;

      // Extrair data do formato "DD/MM/YYYY, HH:MM"
      const datePart = call.dataHora.split(', ')[0];
      if (!datePart) return false;

      // Converter para formato YYYY-MM-DD para comparação
      const [day, month, year] = datePart.split('/').map(Number);
      const callDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

      const isInPeriod = callDate >= startDate && callDate <= endDate;

      // Debug para primeiras 10 chamadas
      if (calls.indexOf(call) < 10) {
        console.log(`📋 Chamada ${calls.indexOf(call) + 1}: ${call.dataHora} -> ${callDate} ${isInPeriod ? '✅' : '❌'}`);
      }

      return isInPeriod;
    });

    console.log(`📊 Chamadas após filtro: ${filteredCalls.length} (de ${calls.length})`);
    console.log(`📈 Redução de ${((calls.length - filteredCalls.length) / calls.length * 100).toFixed(1)}% nos dados`);
  } else {
    console.log('📋 Sem filtro aplicado, usando todos os dados');
  }

  // Calcular KPIs
  const totalChamadas = filteredCalls.length;
  const atendidas = filteredCalls.filter(call => call.status === 'Atendidas').length;
  const abandonadas = filteredCalls.filter(call => call.status === 'Abandonadas').length;
  const transferidas = filteredCalls.filter(call => call.status === 'Transferidas').length;

  // Usar apenas as chamadas "Atendidas" (sem incluir transferidas)
  const totalAtendidasEfetivas = atendidas;

  // Debug: Contar status exatos
  console.log('📊 Análise detalhada dos status:');
  const statusCounts = filteredCalls.reduce((acc, call) => {
    acc[call.status] = (acc[call.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('📊 Contagem bruta:', statusCounts);

  // Calcular KPIs corrigidos
  const kpis = {
    totalChamadas,
    atendidas,
    abandonadas,
    transferidas,
    totalAtendidasEfetivas,
    taxaAbandono: totalChamadas > 0 ? (abandonadas / totalChamadas) * 100 : 0,
    taxaAtendimento: totalChamadas > 0 ? (atendidas / totalChamadas) * 100 : 0,
    tempoMedioEspera: calculateAverageTime(filteredCalls.map(call => call.tempoEspera)),
    tempoMedioAtendimento: calculateAverageTime(filteredCalls.map(call => call.tempoAtendimento)),
    periodo: extractPeriodFromData(filteredCalls)
  };

  console.log('📊 KPIs calculados:', kpis);

  // Processar operadores
  const operators = processOperators(filteredCalls);
  console.log('👥 Operadores processados:', operators.length);

  // Processar estatísticas diárias
  const dailyStats = processDailyStats(filteredCalls);
  console.log('📅 Estatísticas diárias:', dailyStats.length);

  // Processar estatísticas horárias
  const hourlyData = processHourlyStats(filteredCalls);
  console.log('⏰ Estatísticas horárias:', hourlyData.length);

  // Processar estatísticas por fila
  const queueData = processQueueStats(filteredCalls);
  console.log('📋 Estatísticas por fila:', queueData.length);

  // Processar dados do mapa de calor
  const heatmapData = processHeatmapData(filteredCalls);
  console.log('🔥 Dados do mapa de calor:', heatmapData.length);

  return {
    kpis,
    operators,
    dailyStats,
    hourlyData,
    queueData,
    heatmapData
  };
}

// Funções auxiliares
function normalizeStatus(status: string): 'Abandonadas' | 'Atendidas' | 'Transferidas' {
  // Status vazios ou nulos devem ser contados como "Abandonadas"
  if (!status || status.toString().trim() === '') {
    console.log('⚠️ Status vazio encontrado, contando como Abandonadas');
    return 'Abandonadas';
  }

  const statusClean = status.toString().trim().toLowerCase();

  if (statusClean.includes('abandon')) return 'Abandonadas';
  if (statusClean.includes('transfer')) return 'Transferidas';
  if (statusClean.includes('atend')) return 'Atendidas';

  // Se não encontrar nenhuma palavra-chave, assume como Atendidas
  return 'Atendidas';
}

function formatDate(dateString: string): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateString;
  }
}

function formatTimeFromSeconds(seconds: number): string {
  if (!seconds || seconds === 0) return '00:00:00';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function calculateAverageTime(times: string[]): string {
  const validTimes = times.filter(time => time && time !== '00:00:00');
  if (validTimes.length === 0) return '00:00:00';

  const totalSeconds = validTimes.reduce((total, time) => {
    const parts = time.split(':');
    return total + (parseInt(parts[0]) * 3600) + (parseInt(parts[1]) * 60) + parseInt(parts[2]);
  }, 0);

  const averageSeconds = Math.round(totalSeconds / validTimes.length);
  return formatTimeFromSeconds(averageSeconds);
}

function extractPeriodFromData(calls: ProcessedCallData[]): string {
  if (calls.length === 0) return '';

  // Extrair datas do formato "DD/MM/YYYY, HH:MM"
  const dates = calls.map(call => {
    if (!call.dataHora) return null;
    const datePart = call.dataHora.split(', ')[0]; // "DD/MM/YYYY"
    if (!datePart) return null;

    // Converter para objeto Date
    const [day, month, year] = datePart.split('/').map(Number);
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;

    return new Date(year, month - 1, day);
  }).filter(date => date !== null && !isNaN(date.getTime()));

  if (dates.length === 0) return '';

  const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
  const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

  // Formatar como "Out/2025 - Jan/2026"
  const formatMonth = (date: Date) => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return months[date.getMonth()];
  };

  const formatYear = (date: Date) => date.getFullYear().toString();

  return `${formatMonth(minDate)}/${formatYear(minDate)} - ${formatMonth(maxDate)}/${formatYear(maxDate)}`;
}

function processOperators(calls: ProcessedCallData[]): OperatorData[] {
  console.log(`🔍 INÍCIO processOperators - Total de chamadas: ${calls.length}`);
  
  // Debug específico para CINTHIA - movido para o início
  const cinthiaCalls = calls.filter(call => 
    call.operador && call.operador.includes('CINTHIA') && 
    call.fila && call.fila.toLowerCase().includes('centraldemarcacao')
  );
  
  console.log(`🔍 DEBUG CINTHIA centraldemarcacao:`);
  console.log(`- Total de chamadas CINTHIA centraldemarcacao: ${cinthiaCalls.length}`);
  console.log(`- Status das chamadas:`, cinthiaCalls.map(c => ({ status: c.status, data: c.dataHora, operador: c.operador, fila: c.fila })));
  
  // Verificar chamadas atendidas
  const cinthiaAtendidas = cinthiaCalls.filter(call => call.status === 'Atendidas');
  console.log(`- Chamadas atendidas: ${cinthiaAtendidas.length}`);
  
  // Verificar apenas dezembro
  const cinthiaDezembro = cinthiaCalls.filter(call => {
    const datePart = call.dataHora.split(', ')[0];
    if (!datePart) return false;
    const [day, month, year] = datePart.split('/').map(Number);
    return month === 12 && year === 2025;
  });
  console.log(`- Chamadas dezembro/2025: ${cinthiaDezembro.length}`);
  console.log(`- Chamadas atendidas dezembro/2025: ${cinthiaDezembro.filter(c => c.status === 'Atendidas').length}`);

  // Debug: verificar todas as operadoras que contêm "CINTHIA"
  const todasCinthias = calls.filter(call => call.operador && call.operador.includes('CINTHIA'));
  console.log(`🔍 Todas as operadoras CINTHIA: ${todasCinthias.length}`);
  console.log(`- Nomes encontrados:`, [...new Set(todasCinthias.map(c => c.operador))]);
  
  // Debug: verificar todas as filas que contêm "central"
  const todasCentrais = calls.filter(call => call.fila && call.fila.toLowerCase().includes('central'));
  console.log(`🔍 Todas as filas com 'central': ${todasCentrais.length}`);
  console.log(`- Nomes de filas encontrados:`, [...new Set(todasCentrais.map(c => c.fila))]);

  const operatorMap = new Map<string, {
    chamadas: number;
    tempos: number[];
    temposEspera: number[];
    ramais: Set<string>;
    diasTrabalhados: Set<string>;
    filas: Map<string, number>;
  }>();

  const parseToSeconds = (timeStr: string = '00:00:00') => {
    if (!timeStr || timeStr === '00:00:00') return 0;
    const parts = timeStr.split(':').map(Number);
    if (parts.length === 3) return (parts[0] * 3600) + (parts[1] * 60) + (parts[2] || 0);
    if (parts.length === 2) return (parts[0] * 60) + (parts[1] || 0);
    if (parts.length === 1 && !isNaN(parts[0])) return parts[0];
    return 0;
  };

  calls.forEach(call => {
    if (call.operador && call.status === 'Atendidas') {
      if (!operatorMap.has(call.operador)) {
        operatorMap.set(call.operador, {
          chamadas: 0,
          tempos: [],
          temposEspera: [],
          ramais: new Set(),
          diasTrabalhados: new Set(),
          filas: new Map()
        });
      }

      const operator = operatorMap.get(call.operador)!;
      operator.chamadas++;

      if (call.fila) {
        const count = operator.filas.get(call.fila) || 0;
        operator.filas.set(call.fila, count + 1);
      }

      const tmaSec = parseToSeconds(call.tempoAtendimento);
      if (tmaSec > 0) {
        operator.tempos.push(tmaSec);
      }

      const tmeSec = parseToSeconds(call.tempoEspera);
      if (tmeSec > 0) {
        operator.temposEspera.push(tmeSec);
      }

      if (call.ramal) {
        operator.ramais.add(call.ramal);
      }

      if (call.dataHora) {
        const datePart = call.dataHora.split(',')[0].trim();
        if (datePart) operator.diasTrabalhados.add(datePart);
      }
    }
  });

  return Array.from(operatorMap.entries()).map(([nome, data], index) => {
    const validTempos = data.tempos.filter(t => !isNaN(t));
    const avgSeconds = validTempos.length > 0
      ? Math.round(validTempos.reduce((a, b) => a + b, 0) / validTempos.length)
      : 0;

    const validTemposEspera = data.temposEspera.filter(t => !isNaN(t));
    const avgWaitSeconds = validTemposEspera.length > 0
      ? Math.round(validTemposEspera.reduce((a, b) => a + b, 0) / validTemposEspera.length)
      : 0;

    const mediaDiaria = data.diasTrabalhados.size > 0
      ? Math.round(data.chamadas / data.diasTrabalhados.size)
      : 0;

    let filaDestaque = "N/A";
    let maxCalls = 0;
    data.filas.forEach((count, fila) => {
      if (count > maxCalls) {
        maxCalls = count;
        filaDestaque = fila;
      }
    });

    return {
      id: (index + 1).toString(),
      nome,
      ramal: Array.from(data.ramais).join('/'),
      avatar: nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
      chamadasAtendidas: data.chamadas,
      tempoMedioAtendimento: formatTimeFromSeconds(avgSeconds),
      tempoMedioEspera: formatTimeFromSeconds(avgWaitSeconds),
      disponivel: true,
      hojeAtendidas: mediaDiaria,
      filaDestaque
    };
  }).sort((a, b) => b.chamadasAtendidas - a.chamadasAtendidas);
}

function processDailyStats(calls: ProcessedCallData[]): DailyStatsData[] {
  const dailyMap = new Map<string, DailyStatsData>();

  calls.forEach(call => {
    const date = call.dataHora.split(' ')[0];
    if (!date) return;

    if (!dailyMap.has(date)) {
      dailyMap.set(date, {
        data: date,
        total: 0,
        abandonadas: 0,
        atendidas: 0,
        transferidas: 0
      });
    }

    const stats = dailyMap.get(date)!;
    stats.total++;

    switch (call.status) {
      case 'Abandonadas':
        stats.abandonadas++;
        break;
      case 'Atendidas':
        stats.atendidas++;
        break;
      case 'Transferidas':
        stats.transferidas++;
        break;
    }
  });

  return Array.from(dailyMap.values()).sort((a, b) => a.data.localeCompare(b.data));
}

function processHourlyStats(calls: ProcessedCallData[]): HourlyStatsData[] {
  const hourlyMap = new Map<string, HourlyStatsData>();

  console.log('🔍 DEBUG: Processando', calls.length, 'chamadas para estatísticas horárias');

  calls.forEach((call, index) => {
    // Usar a data/hora formatada (string) para extrair a hora
    if (!call.dataHora) {
      console.log(`⚠️ Linha ${index + 1} sem dataHora:`, call);
      return;
    }

    // Extrair hora do formato "DD/MM/YYYY, HH:MM"
    const dateTimeParts = call.dataHora.split(', ');
    if (dateTimeParts.length < 2) {
      console.log(`⚠️ Linha ${index + 1} formato inválido:`, call.dataHora);
      return;
    }

    const timePart = dateTimeParts[1]; // "HH:MM"
    const hour = timePart.split(':')[0]; // "HH"
    if (!hour) {
      console.log(`⚠️ Linha ${index + 1} hora inválida:`, timePart);
      return;
    }

    const hourKey = `${hour.padStart(2, '0')}:00`;

    if (!hourlyMap.has(hourKey)) {
      hourlyMap.set(hourKey, {
        hora: hourKey,
        chamadas: 0,
        abandonadas: 0,
        atendidas: 0
      });
    }

    const stats = hourlyMap.get(hourKey)!;
    stats.chamadas++;

    switch (call.status) {
      case 'Abandonadas':
        stats.abandonadas++;
        break;
      case 'Atendidas':
        stats.atendidas++;
        break;
    }

    // Debug para as primeiras 20 chamadas
    if (index < 20) {
      console.log(`� Linha ${index + 1}: ${call.dataHora} -> ${hourKey} (${call.status})`);
    }
  });

  // Debug: Mostrar detalhes por hora
  console.log('⏰ Estatísticas por hora (detalhado):');
  hourlyMap.forEach((stats, hora) => {
    console.log(`📊 ${hora}: Total=${stats.chamadas}, Atendidas=${stats.atendidas}, Abandonadas=${stats.abandonadas}`);
  });

  return Array.from(hourlyMap.values()).sort((a, b) => a.hora.localeCompare(b.hora));
}

function processQueueStats(calls: ProcessedCallData[]): QueueStatsData[] {
  const queueMap = new Map<string, {
    stats: QueueStatsData;
    temposEspera: number[];
    temposAtendimento: number[];
  }>();

  calls.forEach(call => {
    if (!call.fila) return;

    if (!queueMap.has(call.fila)) {
      queueMap.set(call.fila, {
        stats: {
          fila: call.fila,
          total: 0,
          abandonadas: 0,
          atendidas: 0,
          transferidas: 0,
          tempoMedioEspera: '00:00:00',
          tempoMedioAtendimento: '00:00:00'
        },
        temposEspera: [],
        temposAtendimento: []
      });
    }

    const { stats, temposEspera, temposAtendimento } = queueMap.get(call.fila)!;
    stats.total++;

    if (call.tempoEspera && call.tempoEspera !== '00:00:00') {
      const parts = call.tempoEspera.split(':');
      if (parts.length === 3) {
        const seconds = (parseInt(parts[0]) * 3600) + (parseInt(parts[1]) * 60) + parseInt(parts[2]);
        temposEspera.push(seconds);
      }
    }

    if (call.tempoAtendimento && call.tempoAtendimento !== '00:00:00') {
      const parts = call.tempoAtendimento.split(':');
      if (parts.length === 3) {
        const seconds = (parseInt(parts[0]) * 3600) + (parseInt(parts[1]) * 60) + parseInt(parts[2]);
        temposAtendimento.push(seconds);
      }
    }

    switch (call.status) {
      case 'Abandonadas':
        stats.abandonadas++;
        break;
      case 'Atendidas':
        stats.atendidas++;
        break;
      case 'Transferidas':
        stats.transferidas++;
        break;
    }
  });

  return Array.from(queueMap.values()).map(({ stats, temposEspera, temposAtendimento }) => {
    const avgWaitSeconds = temposEspera.length > 0
      ? Math.round(temposEspera.reduce((a, b) => a + b, 0) / temposEspera.length)
      : 0;

    const avgAtendimentoSeconds = temposAtendimento.length > 0
      ? Math.round(temposAtendimento.reduce((a, b) => a + b, 0) / temposAtendimento.length)
      : 0;

    return {
      ...stats,
      tempoMedioEspera: formatTimeFromSeconds(avgWaitSeconds),
      tempoMedioAtendimento: formatTimeFromSeconds(avgAtendimentoSeconds)
    };
  }).sort((a, b) => b.total - a.total);
}

// Função para processar dados do mapa de calor (dia da semana x hora)
export function processHeatmapData(calls: ProcessedCallData[]) {
  const heatmapMap = new Map<string, number>();

  // Inicializar mapa com todos os dias e períodos
  const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'];
  const periods = [
    { id: 'manha_06_08', label: '06-08', start: 6, end: 8 },
    { id: 'manha_08_10', label: '08-10', start: 8, end: 10 },
    { id: 'manha_10_12', label: '10-12', start: 10, end: 12 },
    { id: 'tarde_12_14', label: '12-14', start: 12, end: 14 },
    { id: 'tarde_14_16', label: '14-16', start: 14, end: 16 },
    { id: 'tarde_16_18', label: '16-18', start: 16, end: 18 }
  ];

  days.forEach(day => {
    periods.forEach(period => {
      heatmapMap.set(`${day}-${period.id}`, 0);
    });
  });

  calls.forEach((call, index) => {
    if (!call.dataHora) return;

    // Extrair data e hora - suporta ambos os formatos: "DD/MM/YYYY, HH:MM" e "DD/MM/YYYY HH:MM"
    let datePart, timePart;

    if (call.dataHora.includes(',')) {
      // Formato: "DD/MM/YYYY, HH:MM"
      const dateTimeParts = call.dataHora.split(', ');
      if (dateTimeParts.length < 2) return;
      datePart = dateTimeParts[0];
      timePart = dateTimeParts[1];
    } else {
      // Formato: "DD/MM/YYYY HH:MM"
      const dateTimeParts = call.dataHora.split(' ');
      if (dateTimeParts.length < 2) return;
      datePart = dateTimeParts[0];
      timePart = dateTimeParts[1];
    }

    // Extrair dia da semana - ajustando para fuso horário local
    const [day, month, year] = datePart.split('/');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

    // Ajustar para fuso horário local (Brasil UTC-3)
    const localDate = new Date(date.getTime() + (date.getTimezoneOffset() * 60000));
    const dayOfWeek = localDate.getDay(); // 0 = Domingo, 1 = Segunda, etc.

    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
    const dayName = dayNames[dayOfWeek];

    // Debug para verificar se o dia está correto
    if (index < 5) { // Apenas primeiras 5 chamadas para não poluir
      console.log(`📅 DEBUG DATA:`, {
        index,
        dataOriginal: call.dataHora,
        datePart,
        dateCriada: date.toString(),
        dayOfWeek,
        dayName,
        diaSemanaEsperado: date.toLocaleDateString('pt-BR', { weekday: 'long' })
      });
    }

    // Debug específico para sábado
    if (dayName === 'Sab') {
      console.log(`🔥 DEBUG SÁBADO ENCONTRADO:`, {
        index,
        dataHora: call.dataHora,
        datePart,
        dayOfWeek,
        dayName,
        timePart
      });
    }

    // Determinar o período mais próximo
    const hour = timePart.split(':')[0];
    const hourNum = parseInt(hour);

    let periodId = null;

    // Manhã
    if (hourNum >= 6 && hourNum < 8) periodId = 'manha_06_08';
    else if (hourNum >= 8 && hourNum < 10) periodId = 'manha_08_10';
    else if (hourNum >= 10 && hourNum < 12) periodId = 'manha_10_12';
    // Tarde
    else if (hourNum >= 12 && hourNum < 14) periodId = 'tarde_12_14';
    else if (hourNum >= 14 && hourNum < 16) periodId = 'tarde_14_16';
    else if (hourNum >= 16 && hourNum < 18) periodId = 'tarde_16_18';
    // Fora do horário comercial - ignorar
    else return;

    const key = `${dayName}-${periodId}`;
    const current = heatmapMap.get(key) || 0;
    heatmapMap.set(key, current + 1);
  });

  // Converter para o formato esperado pelo componente
  const heatmapData = periods.map(period => {
    const row: any = { hora: period.label };
    days.forEach(day => {
      const key = day.toLowerCase();
      const value = heatmapMap.get(`${day}-${period.id}`) || 0;
      row[key] = value;
    });
    return row;
  });

  // Debug para verificar os dados finais
  console.log('🔥 DEBUG FINAL - Dados do mapa de calor:', heatmapData.map(row => ({
    hora: row.hora,
    sab: row.sab,
    keys: Object.keys(row)
  })));

  console.log('🔥 Dados do mapa de calor processados:', heatmapData);
  return heatmapData;
}
