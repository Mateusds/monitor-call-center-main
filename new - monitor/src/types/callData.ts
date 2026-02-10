export interface CallRecord {
  fila: string;
  chamadas: string;
  dataHoraLigacao: string;
  dataHoraAtendida: string;
  dataHoraEncerrada: string;
  duracaoSegundos: number;
  ramal: string;
  nomeOperador: string;
  duracaoChamada: string;
  tempoEspera: string;
  idChamada: string;
  motivo: string;
  telefone: string;
  estado: string;
  setor: string;
  periodo?: string;
  quantidade?: number;
}

export interface CallSummary {
  estado: string;
  setor: string;
  operador: string;
  totalChamadas: number;
  atendidas: number;
  abandonadas: number;
  transferidas: number;
  taxaAtendimento: number;
  taxaAbandono: number;
  tempoMedioEspera: number;
  duracaoMedia: number;
}

export interface StateAnalysis {
  estado: string;
  totalChamadas: number;
  atendidas: number;
  abandonadas: number;
  taxaAtendimento: number;
  regiao: string;
}

export interface OperatorRanking {
  operador: string;
  totalChamadas: number;
  atendidas: number;
  taxaAtendimento: number;
  duracaoMedia: number;
}

export interface QueuePerformance {
  fila: string;
  totalChamadas: number;
  taxaAbandono: number;
  tempoMedio: number;
}
