import ExcelJS from 'exceljs';
import { STATE_STYLES, getDueDateStyle, COMPANY_CONFIG } from '../styles/reportTheme';

// ── Helpers de formato ────────────────────────────────────────────────────────

function formatDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('es-AR').format(new Date(`${value}T00:00:00`));
}

function formatFileDate(value = new Date()) {
  return value.toISOString().slice(0, 10);
}

function getCellValue(row, columnKey) {
  if (['fecha', 'vencimiento', 'fechaVto', 'ultimoCambio'].includes(columnKey)) {
    return formatDate(row[columnKey]);
  }
  return row[columnKey] ?? '-';
}

function downloadBlob(blob, fileName) {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  window.URL.revokeObjectURL(url);
}

// ── Estilos constantes ────────────────────────────────────────────────────────

const HEADER_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
const HEADER_FONT = { bold: true, size: 11, color: { argb: 'FF16324F' } };
const TITLE_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF16324F' } };
const TITLE_FONT = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
const META_FONT = { size: 10, color: { argb: 'FF555555' } };
const FILTER_FONT = { size: 10, italic: true, color: { argb: 'FF444444' } };
const THIN_BORDER = {
  top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
  left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
  bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
  right: { style: 'thin', color: { argb: 'FFD1D5DB' } },
};
const ALT_ROW_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } }; // Gris muy clarito

// ── Función principal ────────────────────────────────────────────────────────

export async function exportToExcel({ reportConfig, filteredRows, filterSummary, selectedColumnKeys, reportId }) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sistema de Informes';
  
  const sheet = workbook.addWorksheet('Datos', {
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true },
  });

  // ── Logo ──
  if (COMPANY_CONFIG.logo) {
    try {
      const logoId = workbook.addImage({ base64: COMPANY_CONFIG.logo, extension: 'png' });
      sheet.addImage(logoId, 'A1:B3');
    } catch (e) { console.warn("Logo error:", e); }
  }

  const exportColumns = reportConfig.allColumns.filter((col) => selectedColumnKeys.includes(col.key));
  const colCount = exportColumns.length;
  const now = new Intl.DateTimeFormat('es-AR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date());

  // ── Encabezado (Título, Metadatos, Filtros) ──
  sheet.addRow([`Informe: ${reportConfig.label}`]);
  sheet.mergeCells(1, 1, 1, colCount);
  sheet.getCell('A1').font = TITLE_FONT;
  sheet.getCell('A1').fill = TITLE_FILL;
  sheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  sheet.getRow(1).height = 30;

  sheet.addRow([`Generado: ${now}    |    Registros: ${filteredRows.length}`]);
  sheet.mergeCells(2, 1, 2, colCount);
  sheet.getCell('A2').font = META_FONT;
  sheet.getRow(2).height = 20;

  let currentRow = 3;
  filterSummary.forEach(({ label, value }) => {
    sheet.addRow([`${label}: ${value}`]);
    sheet.mergeCells(currentRow, 1, currentRow, colCount);
    sheet.getCell(`A${currentRow}`).font = FILTER_FONT;
    sheet.getRow(currentRow).height = 18;
    currentRow++;
  });

  sheet.addRow([]); currentRow++;

  // ── Encabezados de tabla ──
  const headerRowIndex = currentRow;
  const headerRow = sheet.addRow(exportColumns.map((col) => col.label));
  headerRow.height = 25;
  headerRow.eachCell((cell) => {
    cell.font = HEADER_FONT;
    cell.fill = HEADER_FILL;
    cell.border = THIN_BORDER;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });
  currentRow++;
  sheet.views = [{ state: 'frozen', ySplit: headerRowIndex }];

  // ── Filas de datos ──
  filteredRows.forEach((row, rowIndex) => {
    const values = exportColumns.map((col) => getCellValue(row, col.key));
    const dataRow = sheet.addRow(values);
    dataRow.height = 22;

    const isAlt = rowIndex % 2 === 1;

    dataRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const colKey = exportColumns[colNumber - 1].key;
      // .trim() por seguridad, en caso de espacios accidentales en la base de datos
      const cellValue = String(row[colKey] ?? '').trim(); 

      // Estilos base
      cell.border = THIN_BORDER;
      cell.font = { size: 10 };
      cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      
      if (isAlt) cell.fill = ALT_ROW_FILL;

      // 1. Estilo Estado
      if (colKey === 'estado' && STATE_STYLES[cellValue]) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: STATE_STYLES[cellValue].bg } };
        cell.font = { size: 10, color: { argb: STATE_STYLES[cellValue].text }, bold: true };
      }

      // 2. Estilo Vencimiento
      if (['fecha', 'vencimiento', 'fechaVto'].includes(colKey) && cellValue) {
        const style = getDueDateStyle(cellValue);
        if (style) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: style.bg } };
          cell.font = { size: 10, color: { argb: style.text } };
        }
      }
    });
  });

  // ── Ancho de columnas optimizado ──
  exportColumns.forEach((col, index) => {
    const colLetter = sheet.getColumn(index + 1);
    // Mínimo 25, máximo 50. Esto evita que se vea amontonado.
    colLetter.width = 25; 
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  downloadBlob(blob, `informe_${reportId}_${formatFileDate()}.xlsx`);
}