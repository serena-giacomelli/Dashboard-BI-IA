import ExcelJS from 'exceljs';
import { STATE_STYLES, BUDGET_STATE_STYLES, FAT_STYLES, getDueDateStyle, COMPANY_CONFIG } from '../styles/reportTheme';

// ── Helpers de formato ────────────────────────────────────────────────────────

function formatDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('es-AR').format(new Date(`${value}T00:00:00`));
}

function formatFileDate(value = new Date()) {
  return value.toISOString().slice(0, 10);
}

function getCellValue(row, columnKey) {
  if (['fecha', 'vencimiento', 'fechaVto', 'ultimoCambio', 'fechaInicio', 'fechaFin'].includes(columnKey)) {
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
const TITLE_FILL  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF16324F' } };
const META_FONT   = { size: 10, color: { argb: 'FF555555' } };
const FILTER_FONT = { size: 10, italic: true, color: { argb: 'FF444444' } };
const THIN_BORDER = {
  top:    { style: 'thin', color: { argb: 'FFD1D5DB' } },
  left:   { style: 'thin', color: { argb: 'FFD1D5DB' } },
  bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
  right:  { style: 'thin', color: { argb: 'FFD1D5DB' } },
};
const ALT_ROW_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };

// ── Función principal ─────────────────────────────────────────────────────────

export async function exportToExcel({ reportConfig, filteredRows, filterSummary, selectedColumnKeys, reportId }) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sistema de Informes';

  const sheet = workbook.addWorksheet('Datos', {
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true },
  });

  const exportColumns = reportConfig.allColumns.filter((col) => selectedColumnKeys.includes(col.key));
  const colCount = exportColumns.length;
  const now = new Intl.DateTimeFormat('es-AR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date());

  // ── Filas reservadas para el logo (filas 1 a 4) ──
  sheet.addRow([]); sheet.getRow(1).height = 20;
  sheet.addRow([]); sheet.getRow(2).height = 20;
  sheet.addRow([]); sheet.getRow(3).height = 20;
  sheet.addRow([]); sheet.getRow(4).height = 20;

  // ── Logo ──
  if (COMPANY_CONFIG.logo) {
    try {
      const logoId = workbook.addImage({ base64: COMPANY_CONFIG.logo, extension: 'png' });
      sheet.addImage(logoId, {
      tl: { col: 0, row: 0, nativeColOff: 9525 * 3, nativeRowOff: 9525 * 3 },
      ext: { width: 200, height: 98 },
      editAs: 'absolute',
    });
    } catch (e) { console.warn('Logo error:', e); }
  }

  // ── Nombre empresa y título (a la derecha del logo) ──
  sheet.getCell('C2').value = COMPANY_CONFIG.name;
  sheet.getCell('C2').font = { bold: true, size: 14, color: { argb: 'FF16324F' } };
  sheet.getCell('C2').alignment = { vertical: 'middle' };

  sheet.getCell('C3').value = `Informe: ${reportConfig.label}`;
  sheet.getCell('C3').font = { size: 12, color: { argb: 'FF16324F' } };
  sheet.getCell('C3').alignment = { vertical: 'middle' };

  // ── Línea divisoria azul ──
  sheet.addRow([]); // fila 5
  sheet.getRow(5).height = 6;
  for (let col = 1; col <= colCount; col++) {
    sheet.getRow(5).getCell(col).fill = TITLE_FILL;
  }

  // ── Metadatos ──
  sheet.addRow([`Generado: ${now}    |    Registros: ${filteredRows.length}`]);
  sheet.mergeCells(6, 1, 6, colCount);
  sheet.getCell('A6').font = META_FONT;
  sheet.getRow(6).height = 20;

  // ── Filtros ──
  let currentRow = 7;
  filterSummary.forEach(({ label, value }) => {
    sheet.addRow([`${label}: ${value}`]);
    sheet.mergeCells(currentRow, 1, currentRow, colCount);
    sheet.getCell(`A${currentRow}`).font = FILTER_FONT;
    sheet.getRow(currentRow).height = 18;
    currentRow++;
  });

  // ── Fila vacía separadora ──
  sheet.addRow([]);
  currentRow++;

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
      const cellValue = String(row[colKey] ?? '').trim();

      cell.border = THIN_BORDER;
      cell.font = { size: 10 };
      cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };

      if (isAlt) cell.fill = ALT_ROW_FILL;

      // Estilo Estado de tarea
      if (colKey === 'estado' && STATE_STYLES[cellValue]) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: STATE_STYLES[cellValue].bg } };
        cell.font = { size: 10, color: { argb: STATE_STYLES[cellValue].text }, bold: false };
      }

      // Estilo Estado de presupuesto
      if (colKey === 'estadoPresupuesto' && BUDGET_STATE_STYLES[cellValue]) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BUDGET_STATE_STYLES[cellValue].bg } };
        cell.font = { size: 10, color: { argb: BUDGET_STATE_STYLES[cellValue].text }, bold: false };
      }

      // Estilo Vencimiento / Fecha
      if (['fecha', 'vencimiento', 'fechaVto', 'fechaInicio', 'fechaFin', 'fechaVtoRegistro'].includes(colKey) && cellValue) {
        const style = getDueDateStyle(cellValue);
        if (style) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: style.bg } };
          cell.font = { size: 10, color: { argb: style.text } };
        }

      // Estilo para estados de engorde
      } else if (colKey === 'estado' && FAT_STYLES[cellValue]) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: FAT_STYLES[cellValue].bg } };
        cell.font = { size: 10, color: { argb: FAT_STYLES[cellValue].text }, bold: false };
      }
    });
  });

  // ── Ancho de columnas ──
  exportColumns.forEach((_col, index) => {
    sheet.getColumn(index + 1).width = 25;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  downloadBlob(blob, `informe_${reportId}_${formatFileDate()}.xlsx`);
}