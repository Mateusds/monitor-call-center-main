/**
 * Secure Excel utilities using ExcelJS
 * Replaces vulnerable xlsx package with secure alternative
 */
import ExcelJS from 'exceljs';

// Security constants
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_CELL_LENGTH = 1000;
const FORMULA_PATTERN = /^[=+\-@]/;

/**
 * Sanitize cell value to prevent formula injection and limit length
 */
export const sanitizeCellValue = (value: any): string => {
  if (value === null || value === undefined) return '';
  const strValue = String(value).trim();
  
  // Strip potential formula injections
  if (FORMULA_PATTERN.test(strValue)) {
    return strValue.replace(FORMULA_PATTERN, "'");
  }
  
  // Limit cell length
  return strValue.slice(0, MAX_CELL_LENGTH);
};

/**
 * Safely parse numeric value
 */
export const safeParseInt = (value: any): number => {
  const sanitized = sanitizeCellValue(value);
  const parsed = parseInt(sanitized, 10);
  return isNaN(parsed) || parsed < 0 ? 0 : parsed;
};

/**
 * Parse Excel file and return rows as 2D array
 */
export const parseExcelFile = async (file: File): Promise<any[][]> => {
  // Security: Validate file size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`Arquivo muito grande. Tamanho máximo permitido: ${MAX_FILE_SIZE_MB}MB`);
  }

  const arrayBuffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error("Planilha não encontrada no arquivo");
  }

  const rows: any[][] = [];
  worksheet.eachRow({ includeEmpty: false }, (row) => {
    const rowValues: any[] = [];
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      // Pad array to handle sparse cells
      while (rowValues.length < colNumber - 1) {
        rowValues.push('');
      }
      // Get the value, avoiding formulas
      let value = cell.value;
      if (typeof value === 'object' && value !== null) {
        // Handle rich text, formulas, hyperlinks etc
        if ('result' in value) {
          value = value.result; // Formula result
        } else if ('text' in value) {
          value = value.text; // Rich text or hyperlink
        } else if ('richText' in value) {
          value = (value as ExcelJS.CellRichTextValue).richText.map(rt => rt.text).join('');
        }
      }
      rowValues.push(value);
    });
    rows.push(rowValues);
  });

  return rows;
};

/**
 * Create and download Excel file from data
 */
export const createExcelFile = async (
  sheets: Array<{
    name: string;
    data: Record<string, any>[] | any[][];
    columns?: Array<{ header: string; key: string; width?: number }>;
  }>,
  filename: string
): Promise<void> => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Call Center Analytics';
  workbook.created = new Date();

  for (const sheet of sheets) {
    const worksheet = workbook.addWorksheet(sheet.name);

    if (sheet.columns && Array.isArray(sheet.data) && sheet.data.length > 0 && typeof sheet.data[0] === 'object' && !Array.isArray(sheet.data[0])) {
      // Object array with column definitions
      worksheet.columns = sheet.columns.map(col => ({
        header: col.header,
        key: col.key,
        width: col.width || 15,
      }));
      
      (sheet.data as Record<string, any>[]).forEach(row => {
        worksheet.addRow(row);
      });
    } else if (Array.isArray(sheet.data) && sheet.data.length > 0) {
      if (Array.isArray(sheet.data[0])) {
        // 2D array (aoa format)
        (sheet.data as any[][]).forEach(row => {
          worksheet.addRow(row);
        });
      } else {
        // Object array without column definitions - infer from first row
        const firstRow = sheet.data[0] as Record<string, any>;
        const keys = Object.keys(firstRow);
        worksheet.columns = keys.map(key => ({
          header: key,
          key: key,
          width: 15,
        }));
        (sheet.data as Record<string, any>[]).forEach(row => {
          worksheet.addRow(row);
        });
      }
    }

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };
  }

  // Generate and download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

/**
 * Simple helper to create single-sheet Excel from object array
 */
export const exportToExcel = async (
  data: Record<string, any>[],
  sheetName: string,
  filename: string
): Promise<void> => {
  await createExcelFile([{ name: sheetName, data }], filename);
};
