import * as XLSX from 'xlsx';
import * as fs from 'fs';

const filePath = 'c:\\monitor-call-center-main\\public\\planilhas\\Relatório 01_10_25 a 10_01_26.xlsx';

async function analyze() {
    const fileBuffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

    const dataRows = jsonData.slice(1);

    const cinthiaAtendidas = dataRows.filter(row => {
        const operator = String(row[10] || '').toUpperCase();
        const ramal = String(row[9] || '');
        const status = String(row[2] || '').toLowerCase();
        return operator.includes('CINTHIA') && ramal.includes('1033') && status.includes('atend');
    });

    const cinthiaTransferidas = dataRows.filter(row => {
        const operator = String(row[10] || '').toUpperCase();
        const ramal = String(row[9] || '');
        const status = String(row[2] || '').toLowerCase();
        return operator.includes('CINTHIA') && ramal.includes('1033') && status.includes('transfer');
    });

    const cinthiaAbandonadas = dataRows.filter(row => {
        const operator = String(row[10] || '').toUpperCase();
        const ramal = String(row[9] || '');
        const status = String(row[2] || '').toLowerCase();
        return operator.includes('CINTHIA') && ramal.includes('1033') && (status.includes('abandon') || status === '');
    });

    console.log('--- DETALHE CINTHIA ---');
    console.log('Atendidas (puro):', cinthiaAtendidas.length);
    console.log('Transferidas:', cinthiaTransferidas.length);
    console.log('Abandonadas:', cinthiaAbandonadas.length);
    console.log('Total:', cinthiaAtendidas.length + cinthiaTransferidas.length + cinthiaAbandonadas.length);
}

analyze().catch(console.error);
