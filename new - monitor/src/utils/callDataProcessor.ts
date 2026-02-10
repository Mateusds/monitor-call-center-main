import { CallRecord, CallSummary, StateAnalysis, OperatorRanking, QueuePerformance } from "@/types/callData";

const REGIAO_MAP: Record<string, string> = {
  "Alagoas": "Nordeste",
  "Paraíba": "Nordeste",
  "Natal": "Nordeste",
  "Distrito Federal": "Centro-Oeste",
  "Desconhecido": "Desconhecido"
};

export const parseCallData = (rawData: string): CallRecord[] => {
  const lines = rawData.split('\n');
  const records: CallRecord[] = [];
  
  for (let i = 7; i < lines.length; i++) {
    const line = lines[i];
    if (!line || line.startsWith('#') || line.startsWith('|Fila|')) continue;
    
    const columns = line.split('|').filter(col => col.trim() !== '');
    if (columns.length < 13) continue;
    
    const fila = columns[0]?.trim() || '';
    if (!fila) continue;
    
    records.push({
      fila: fila,
      chamadas: columns[1]?.trim() || '',
      dataHoraLigacao: columns[2]?.trim() || '',
      dataHoraAtendida: columns[3]?.trim() || '',
      dataHoraEncerrada: columns[4]?.trim() || '',
      duracaoSegundos: parseInt(columns[5]?.trim() || '0'),
      ramal: columns[6]?.trim() || '',
      nomeOperador: columns[7]?.trim() || 'Não identificado',
      duracaoChamada: columns[8]?.trim() || '',
      tempoEspera: columns[9]?.trim() || '',
      idChamada: columns[10]?.trim() || '',
      motivo: columns[11]?.trim() || '',
      telefone: columns[12]?.trim() || '',
      estado: columns[13]?.trim() || 'Desconhecido',
      setor: fila
    });
  }
  
  return records;
};

export const analyzeByState = (records: CallRecord[]): StateAnalysis[] => {
  const stateMap = new Map<string, StateAnalysis>();
  
  records.forEach(record => {
    const estado = record.estado || 'Desconhecido';
    const quantidade = record.quantidade || 1;
    
    if (!stateMap.has(estado)) {
      stateMap.set(estado, {
        estado,
        totalChamadas: 0,
        atendidas: 0,
        abandonadas: 0,
        taxaAtendimento: 0,
        regiao: REGIAO_MAP[estado] || 'Desconhecido'
      });
    }
    
    const data = stateMap.get(estado)!;
    data.totalChamadas += quantidade;
    
    if (record.chamadas.toLowerCase().includes('atendida')) {
      data.atendidas += quantidade;
    } else if (record.chamadas.toLowerCase().includes('abandona')) {
      data.abandonadas += quantidade;
    }
  });
  
  const result = Array.from(stateMap.values());
  result.forEach(state => {
    state.taxaAtendimento = state.totalChamadas > 0 
      ? (state.atendidas / state.totalChamadas) * 100 
      : 0;
  });
  
  return result.sort((a, b) => b.totalChamadas - a.totalChamadas);
};

export const analyzeByOperator = (records: CallRecord[]): OperatorRanking[] => {
  const operatorMap = new Map<string, OperatorRanking>();
  
  records.forEach(record => {
    const operador = record.nomeOperador || 'Não identificado';
    const quantidade = record.quantidade || 1;
    if (operador === 'Não identificado') return;
    
    if (!operatorMap.has(operador)) {
      operatorMap.set(operador, {
        operador,
        totalChamadas: 0,
        atendidas: 0,
        taxaAtendimento: 0,
        duracaoMedia: 0
      });
    }
    
    const data = operatorMap.get(operador)!;
    data.totalChamadas += quantidade;
    
    if (record.chamadas.toLowerCase().includes('atendida')) {
      data.atendidas += quantidade;
    }
  });
  
  const result = Array.from(operatorMap.values());
  result.forEach(op => {
    op.taxaAtendimento = op.totalChamadas > 0 
      ? (op.atendidas / op.totalChamadas) * 100 
      : 0;
  });
  
  return result.sort((a, b) => b.taxaAtendimento - a.taxaAtendimento);
};

export const analyzeByQueue = (records: CallRecord[]): QueuePerformance[] => {
  const queueMap = new Map<string, QueuePerformance & { abandonadas: number }>();
  
  records.forEach(record => {
    const fila = record.fila;
    const quantidade = record.quantidade || 1;
    if (!fila) return;
    
    if (!queueMap.has(fila)) {
      queueMap.set(fila, {
        fila,
        totalChamadas: 0,
        abandonadas: 0,
        taxaAbandono: 0,
        tempoMedio: 0
      });
    }
    
    const data = queueMap.get(fila)!;
    data.totalChamadas += quantidade;
    
    if (record.chamadas.toLowerCase().includes('abandona')) {
      data.abandonadas += quantidade;
    }
  });
  
  const result = Array.from(queueMap.values()).map(queue => ({
    fila: queue.fila,
    totalChamadas: queue.totalChamadas,
    taxaAbandono: queue.totalChamadas > 0 
      ? (queue.abandonadas / queue.totalChamadas) * 100 
      : 0,
    tempoMedio: 0
  }));
  
  return result.sort((a, b) => b.totalChamadas - a.totalChamadas);
};

export const generateInsights = (
  stateData: StateAnalysis[],
  operatorData: OperatorRanking[],
  queueData: QueuePerformance[]
): string[] => {
  const insights: string[] = [];
  
  // Insight por estado
  if (stateData.length > 0) {
    const topState = stateData[0];
    const percentage = ((topState.totalChamadas / stateData.reduce((sum, s) => sum + s.totalChamadas, 0)) * 100).toFixed(0);
    insights.push(`📈 ${topState.estado} concentrou ${percentage}% das chamadas atendidas, sendo o estado com maior volume.`);
  }
  
  // Insight por região
  const regiaoNordeste = stateData.filter(s => s.regiao === "Nordeste");
  if (regiaoNordeste.length > 0) {
    const totalNordeste = regiaoNordeste.reduce((sum, s) => sum + s.totalChamadas, 0);
    const totalGeral = stateData.reduce((sum, s) => sum + s.totalChamadas, 0);
    const percentage = ((totalNordeste / totalGeral) * 100).toFixed(0);
    insights.push(`🧭 Operadores da Região Nordeste responderam por ${percentage}% do volume total de chamadas.`);
  }
  
  // Insight por fila
  if (queueData.length > 0) {
    const bestQueue = queueData.reduce((min, q) => q.taxaAbandono < min.taxaAbandono ? q : min);
    insights.push(`🧑‍💼 A fila ${bestQueue.fila} obteve a menor taxa de abandono (${bestQueue.taxaAbandono.toFixed(1)}%), destacando-se como a mais eficiente.`);
  }
  
  // Insight por estado com maior abandono
  const stateWithMostAbandoned = stateData.reduce((max, s) => s.abandonadas > max.abandonadas ? s : max, stateData[0]);
  if (stateWithMostAbandoned && stateWithMostAbandoned.abandonadas > 0) {
    insights.push(`🚨 ${stateWithMostAbandoned.estado} apresentou maior índice de ligações abandonadas, sugerindo revisão de escala operacional.`);
  }
  
  return insights;
};
