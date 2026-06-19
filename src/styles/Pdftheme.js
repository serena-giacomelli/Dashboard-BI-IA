// ── Tema PDF ──────────────────────────────────────────────────────────────────
// Centralizá acá todos los valores visuales usados al generar PDFs con jsPDF.

export const PDF_THEME = {
  colors: {
    /** Azul corporativo principal (títulos, encabezado de tabla) */
    primary: [22, 50, 79],
    /** Gris para texto secundario (metadata, filtros) */
    textSecondary: [80, 80, 80],
    /** Gris claro para líneas separadoras */
    divider: [200, 200, 200],
    /** Blanco para texto sobre fondo oscuro */
    white: 255,
    /** Azul muy claro para filas alternas de la tabla */
    rowAlternate: [245, 248, 255],
  },

  table: {
    fontSize: 8,
    cellPadding: 3,
    margin: { left: 14, right: 14 },
  },

  header: {
    logo: { x: 14, y: 10, width: 30, height: 15 },
    companyName: { x: 48, y: 18, fontSize: 16 },
    reportTitle: { x: 48, y: 24, fontSize: 14 },
    dividerY: 28,
    dividerX1: 14,
    dividerX2: 280,
  },

  body: {
    startY: 35,
    metadataFontSize: 9,
    filterLineHeight: 5,
    metadataLineHeight: 7,
    tableOffset: 5,
  },
};