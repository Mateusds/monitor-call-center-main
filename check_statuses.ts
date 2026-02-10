import * as XLSX from 'xlsx';
import * as fs from 'fs';

const filePath = 'c:\\monitor-call-center-main\\public\\planilhas\\Relatório 01_10_25 a 10_01_26.xlsx';

async function analyzeStatuses() {
    const fileBuffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

    const dataRows = jsonData.slice(1);
    const statuses: Record<string, number> = {};

    dataRows.forEach(row => {
        const status = String(row[2] || 'VAZIO');
        statuses[status] = (statuses[status] || 0) + 1;
    });

    console.log('=== STATUS ÚNICOS NA PLANILHA ===');
    console.log(JSON.stringify(statuses, null, 2));
}

analyzeStatuses().catch(console.error);
