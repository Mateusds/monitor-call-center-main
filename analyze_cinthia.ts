import * as XLSX from 'xlsx';
import * as fs from 'fs';

const filePath = 'c:\\monitor-call-center-main\\public\\planilhas\\Relatório 01_10_25 a 10_01_26.xlsx';

async function analyze() {
    const fileBuffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

    // Identificar colunas (assumindo a estrutura baseada no excelReader.ts)
    // 0: fila, 1: telefone, 2: status, 3: dataHoraChamada, 10: operador
    const dataRows = jsonData.slice(1);

    const cinthiaCalls = dataRows.filter(row => {
        const operator = String(row[10] || '').toUpperCase();
        const ramal = String(row[9] || '');
        const status = String(row[2] || '').toLowerCase();
        return operator.includes('CINTHIA') && ramal.includes('1033') && status.includes('atend');
    });

    const callsByDay: Record<string, number> = {};

    cinthiaCalls.forEach(row => {
        const excelDate = row[3];
        let dateStr = '';

        if (typeof excelDate === 'number') {
            const date = new Date((excelDate - 25569) * 86400 * 1000);
            dateStr = date.toLocaleDateString('pt-BR');
        } else {
            dateStr = String(excelDate).split(' ')[0];
        }

        if (dateStr) {
            callsByDay[dateStr] = (callsByDay[dateStr] || 0) + 1;
        }
    });

    const totalDays = Object.keys(callsByDay).length;
    const totalCalls = cinthiaCalls.length;
    const average = totalCalls / totalDays;

    console.log('RESULTADO_INICIO');
    console.log('OPERADOR: CINTHIA (1033)');
    console.log('TOTAL_CHAMADAS: ' + totalCalls);
    console.log('DIAS_TRABALHADOS: ' + totalDays);
    console.log('MEDIA_POR_DIA: ' + average.toFixed(2));
    console.log('RESULTADO_FIM');
}

analyze().catch(console.error);
