# Integração com Planilha Excel

## 📋 Visão Geral

O Dashboard Ligações agora lê os dados diretamente da planilha Excel `Relatório - ligações - 01_10_25 a 10_01_26.xlsx`, eliminando a necessidade de dados mockados.

## 🗂️ Estrutura de Arquivos

```
src/
├── lib/
│   └── excelReader.ts          # Funções para ler e processar Excel
├── services/
│   └── excelDataService.ts     # Serviço de gerenciamento de dados
├── hooks/
│   └── useExcelData.ts         # Hook customizado para estado
└── components/dashboard/
    └── DashboardView.tsx       # Dashboard atualizado

public/
└── planilhas/
    └── Relatório - ligações - 01_10_25 a 10_01_26.xlsx
```

## 📊 Colunas da Planilha

O sistema lê as seguintes colunas da planilha:

1. **Fila** - Nome da fila de atendimento
2. **Telefone da Chamada** - Número de telefone
3. **Status da Chamada** - Atendidas/Abandonadas/Transferidas
4. **Data e Hora Chamada** - Início da chamada
5. **Data e Hora Atendimento chamada** - Início do atendimento
6. **Data e Hora Encerramento chamada** - Fim da chamada
7. **Tempo de Espera** - Tempo em fila
8. **Tempo de Atendimento (seg)** - Duração em segundos
9. **Tempo de Atendimento (min)** - Duração em minutos
10. **Ramal** - Ramal do operador
11. **Operador** - Nome do operador

## 🔧 Como Funciona

### 1. Leitura do Excel
```typescript
// excelReader.ts
export async function readExcelFile(filePath: string): Promise<ExcelCallData[]>
```

### 2. Processamento de Dados
```typescript
// Converte dados brutos em estruturas processadas
export function processExcelData(excelData: ExcelCallData[])
```

### 3. Cache e Estado
```typescript
// Gerencia cache e estado de loading/erro
export function useExcelData(): UseExcelDataReturn
```

## 🚀 Funcionalidades

### ✅ **Carregamento Automático**
- Lê o arquivo Excel ao carregar o Dashboard
- Mostra loading durante o processamento
- Cache inteligente para evitar recarregamento

### ✅ **Tratamento de Erros**
- Fallback automático para dados mockados
- Mensagens de erro claras
- Botão de retry manual

### ✅ **Dados Processados**
- **KPIs**: Totais, taxas, tempos médios
- **Operadores**: Performance individual
- **Estatísticas**: Diárias, horárias, por fila
- **Chamadas**: Lista detalhada com todas as colunas

### ✅ **Interface Rica**
- Indicador visual de dados da planilha
- Botão de atualização manual
- Status de loading/erro
- Tooltips e gráficos interativos

## 📦 Dependências

```bash
npm install xlsx @types/xlsx
```

## 🔄 Atualização de Dados

### Manual
Clique no botão "Atualizar" no header do Dashboard.

### Automático
- Cache evita recarregamento desnecessário
- Dados mantidos em memória durante a sessão

## 🛠️ Troubleshooting

### Arquivo Não Encontrado
```
Erro: Não foi possível ler o arquivo Excel
```
**Solução**: Verifique se o arquivo está em `public/planilhas/`

### Erro de Formato
```
Erro: Formato de arquivo inválido
```
**Solução**: Verifique se as colunas correspondem ao esperado

### Performance
- Arquivos grandes (>10MB) podem demorar para processar
- Considere otimizar a planilha removendo dados desnecessários

## 🎯 Benefícios

1. **Dados Reais**: Usa dados reais da planilha
2. **Atualização Simples**: Basta atualizar o arquivo Excel
3. **Flexibilidade**: Aceita diferentes períodos e dados
4. **Performance**: Cache inteligente e processamento otimizado
5. **UX**: Loading states e tratamento de erros

## 📈 Métricas Calculadas

O sistema calcula automaticamente:
- Taxa de atendimento e abandono
- Tempos médios de espera e atendimento
- Performance por operador
- Distribuição por hora e dia
- Estatísticas por fila

## 🔮 Futuras Melhorias

- [ ] Upload dinâmico de arquivos
- [ ] Suporte para múltiplas planilhas
- [ ] Processamento em Web Worker
- [ ] Validação avançada de dados
- [ ] Exportação de relatórios personalizados
