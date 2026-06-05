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
const HEADER_FONT = { bold: true, size: 10, color: { argb: 'FF16324F' } };
const TITLE_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF16324F' } };
const TITLE_FONT = { bold: true, size: 13, color: { argb: 'FFFFFFFF' } };
const META_FONT = { size: 9, color: { argb: 'FF555555' } };
const FILTER_FONT = { size: 9, italic: true, color: { argb: 'FF444444' } };
const THIN_BORDER = {
  top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
  left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
  bottom: { style: 'thin', color: 'FFD1D5DB' },
  right: { style: 'thin', color: 'FFD1D5DB' },
};
const ALT_ROW_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };

// ── Función principal ────────────────────────────────────────────────────────

export async function exportToExcel({ reportConfig, filteredRows, filterSummary, selectedColumnKeys, reportId }) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sistema de Informes';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Datos', {
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1 },
  });

  // ── Logo (Solo si está configurado) ──
  if (COMPANY_CONFIG.logo) {
    try {
      const logoId = workbook.addImage({
        base64: COMPANY_CONFIG.logo,
        extension: 'png',
      });
      sheet.addImage(logoId, 'A1:B3'); // Posiciona el logo
    } catch (e) {
      console.warn("No se pudo cargar el logo:", e);
    }
  }

  const exportColumns = reportConfig.allColumns.filter((col) => selectedColumnKeys.includes(col.key));
  const colCount = exportColumns.length;
  const now = new Intl.DateTimeFormat('es-AR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date());

  // ── Título ──
  sheet.addRow([`Informe: ${reportConfig.label}`]);
  sheet.mergeCells(1, 1, 1, colCount);
  const titleCell = sheet.getCell('A1');
  titleCell.font = TITLE_FONT;
  titleCell.fill = TITLE_FILL;
  titleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  sheet.getRow(1).height = 28;

  // ── Metadatos ──
  sheet.addRow([`Generado: ${now}    |    Registros: ${filteredRows.length}`]);
  sheet.mergeCells(2, 1, 2, colCount);
  const metaCell = sheet.getCell('A2');
  metaCell.font = META_FONT;
  metaCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  sheet.getRow(2).height = 18;

  // ── Filtros ──
  let currentRow = 3;
  filterSummary.forEach(({ label, value }) => {
    sheet.addRow([`${label}: ${value}`]);
    sheet.mergeCells(currentRow, 1, currentRow, colCount);
    const filterCell = sheet.getCell(`A${currentRow}`);
    filterCell.font = FILTER_FONT;
    filterCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    sheet.getRow(currentRow).height = 16;
    currentRow++;
  });

  sheet.addRow([]);
  currentRow++;

  // ── Encabezados ──
  const headerRowIndex = currentRow;
  const headerRow = sheet.addRow(exportColumns.map((col) => col.label));
  headerRow.height = 22;
  headerRow.eachCell((cell) => {
    cell.font = HEADER_FONT;
    cell.fill = HEADER_FILL;
    cell.border = THIN_BORDER;
    cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: false };
  });
  currentRow++;
  sheet.views = [{ state: 'frozen', ySplit: headerRowIndex }];

  // ── Filas de datos ──
  if (filteredRows.length === 0) {
    const emptyRow = sheet.addRow(['Sin registros para los filtros seleccionados.']);
    sheet.mergeCells(currentRow, 1, currentRow, colCount);
    emptyRow.getCell(1).font = { italic: true, color: { argb: 'FF999999' }, size: 10 };
    emptyRow.getCell(1).alignment = { horizontal: 'center' };
  } else {
    filteredRows.forEach((row, rowIndex) => {
      const values = exportColumns.map((col) => getCellValue(row, col.key));
      const dataRow = sheet.addRow(values);
      dataRow.height = 18;

      const isAlt = rowIndex % 2 === 1;

      dataRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const colKey = exportColumns[colNumber - 1].key;
        const cellValue = row[colKey];

        // Estilos base
        cell.border = THIN_BORDER;
        cell.font = { size: 10 };
        cell.alignment = { vertical: 'middle', wrapText: false };
        
        // Aplicar color de fila alterna, pero permite sobreescritura si es Estado/Vencimiento
        if (isAlt) cell.fill = ALT_ROW_FILL;

        // 1. Integración Estilo de Estado
        if (colKey === 'estado' && STATE_STYLES[cellValue]) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: STATE_STYLES[cellValue].bg } };
          cell.font = { size: 10, color: { argb: STATE_STYLES[cellValue].text }, bold: true };
        }

        // 2. Integración Estilo de Vencimiento
        if (['fecha', 'vencimiento', 'fechaVto'].includes(colKey) && cellValue) {
          const style = getDueDateStyle(cellValue);
          if (style) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: style.bg } };
            cell.font = { size: 10, color: { argb: style.text } };
          }
        }
      });
    });
  }

  // ── Ancho automático ──
  exportColumns.forEach((col, index) => {
    const colLetter = sheet.getColumn(index + 1);
    const headerLen = col.label.length;
    const maxDataLen = filteredRows.reduce((max, row) => Math.max(max, String(getCellValue(row, col.key)).length), 0);
    colLetter.width = Math.min(Math.max(headerLen, maxDataLen) + 4, 60);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  downloadBlob(blob, `informe_${reportId}_${formatFileDate()}.xlsx`);
}