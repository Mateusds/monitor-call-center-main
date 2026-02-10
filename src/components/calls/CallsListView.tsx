import { useState } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight, Phone, PhoneOff } from 'lucide-react';

// Dados mockados para chamadas
const mockCalls = [
  {
    id: '1',
    fila: 'callcenter1',
    telefone: '82991592545',
    status: 'Atendidas',
    dataHora: '01/10/2025 06:05',
    tempoEspera: '00:00:09',
    tempoAtendimento: '00:00:50',
    ramal: '1040',
    operador: 'WINNY VIANA'
  },
  {
    id: '2',
    fila: 'callcenter1',
    telefone: '82991592545',
    status: 'Atendidas',
    dataHora: '01/10/2025 07:08',
    tempoEspera: '00:01:35',
    tempoAtendimento: '00:00:35',
    ramal: '1017',
    operador: 'KASSIA'
  },
  {
    id: '3',
    fila: 'callcenter1',
    telefone: '82991173908',
    status: 'Atendidas',
    dataHora: '01/10/2025 07:47',
    tempoEspera: '00:00:09',
    tempoAtendimento: '00:00:24',
    ramal: '1010',
    operador: 'JOCELAINE SANTOS'
  },
  {
    id: '4',
    fila: 'callcenter1',
    telefone: '8234365516',
    status: 'Atendidas',
    dataHora: '01/10/2025 07:51',
    tempoEspera: '00:01:17',
    tempoAtendimento: '00:02:30',
    ramal: '1013',
    operador: 'ALICIA RAMOS'
  },
  {
    id: '5',
    fila: 'callcenter1',
    telefone: '82994043126',
    status: 'Atendidas',
    dataHora: '01/10/2025 07:56',
    tempoEspera: '00:03:20',
    tempoAtendimento: '00:05:59',
    ramal: '1010',
    operador: 'JOCELAINE SANTOS'
  },
  {
    id: '6',
    fila: 'callcenter1',
    telefone: '82987592022',
    status: 'Atendidas',
    dataHora: '01/10/2025 08:00',
    tempoEspera: '00:00:50',
    tempoAtendimento: '00:11:53',
    ramal: '1038',
    operador: 'LAURA LEITE'
  },
  {
    id: '7',
    fila: 'callcenter1',
    telefone: '83988741997',
    status: 'Atendidas',
    dataHora: '01/10/2025 08:02',
    tempoEspera: '00:00:32',
    tempoAtendimento: '00:04:57',
    ramal: '1010',
    operator: 'JOCELAINE SANTOS'
  },
  {
    id: '8',
    fila: 'callcenter1',
    telefone: '83988296013',
    status: 'Transferidas',
    dataHora: '01/10/2025 08:04',
    tempoEspera: '00:00:14',
    tempoAtendimento: '00:15:26',
    ramal: '1013',
    operador: 'ALICIA RAMOS'
  },
  {
    id: '9',
    fila: 'callcenter1',
    telefone: '84987332255',
    status: 'Atendidas',
    dataHora: '01/10/2025 08:06',
    tempoEspera: '00:10:37',
    tempoAtendimento: '00:20:24',
    ramal: '1038',
    operador: 'LAURA LEITE'
  },
  {
    id: '10',
    fila: 'callcenter1',
    telefone: '82991799752',
    status: 'Abandonadas',
    dataHora: '01/10/2025 08:08',
    tempoEspera: '00:03:33',
    tempoAtendimento: '00:00:00',
    ramal: null,
    operador: null
  }
];

interface Call {
  id: string;
  fila: string;
  telefone: string;
  status: 'Atendidas' | 'Abandonadas' | 'Transferidas';
  dataHora: string;
  tempoEspera: string;
  tempoAtendimento: string;
  ramal: string | null;
  operador: string | null;
}

export function CallsListView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Atendidas' | 'Abandonadas' | 'Transferidas'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredCalls = mockCalls.filter((call) => {
    const matchesSearch = call.telefone.includes(searchTerm) || 
                         call.fila.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || call.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredCalls.length / itemsPerPage);
  const paginatedCalls = filteredCalls.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Lista de Chamadas</h1>
          <p className="text-muted-foreground">Registro detalhado de todas as chamadas</p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por telefone ou fila..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                statusFilter === 'all' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted/50 hover:bg-muted'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setStatusFilter('Atendidas')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                statusFilter === 'Atendidas' 
                  ? 'bg-success text-success-foreground' 
                  : 'bg-muted/50 hover:bg-muted'
              }`}
            >
              Atendidas
            </button>
            <button
              onClick={() => setStatusFilter('Abandonadas')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                statusFilter === 'Abandonadas' 
                  ? 'bg-destructive text-destructive-foreground' 
                  : 'bg-muted/50 hover:bg-muted'
              }`}
            >
              Abandonadas
            </button>
            <button
              onClick={() => setStatusFilter('Transferidas')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                statusFilter === 'Transferidas' 
                  ? 'bg-secondary text-secondary-foreground' 
                  : 'bg-muted/50 hover:bg-muted'
              }`}
            >
              Transferidas
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Fila</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Telefone</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Data/Hora</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Tempo Espera</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Operador</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCalls.map((call) => (
                <tr 
                  key={call.id} 
                  className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        call.status === 'Atendidas' ? 'bg-success/20' : 
                        call.status === 'Transferidas' ? 'bg-secondary/20' : 'bg-destructive/20'
                      }`}>
                        {call.status === 'Atendidas' || call.status === 'Transferidas' ? (
                          <Phone className="w-4 h-4 text-success" />
                        ) : (
                          <PhoneOff className="w-4 h-4 text-destructive" />
                        )}
                      </div>
                      <span className={
                        call.status === 'Atendidas' ? 'badge-success' : 
                        call.status === 'Transferidas' ? 'badge-warning' : 'badge-danger'
                      }>
                        {call.status}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="px-3 py-1 rounded-full bg-muted text-sm">{call.fila}</span>
                  </td>
                  <td className="p-4 font-mono">{call.telefone}</td>
                  <td className="p-4 text-muted-foreground">{call.dataHora}</td>
                  <td className="p-4">
                    <span className={`font-medium ${
                      parseInt(call.tempoEspera) > 5 ? 'text-destructive' : 'text-success'
                    }`}>
                      {call.tempoEspera}
                    </span>
                  </td>
                  <td className="p-4">
                    {call.operador ? (
                      <span className="text-primary">{call.operador}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between p-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Mostrando {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredCalls.length)} de {filteredCalls.length}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg bg-muted/50 hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg bg-muted/50 hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
