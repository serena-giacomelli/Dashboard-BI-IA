// ── Tema PDF ──────────────────────────────────────────────────────────────────
export const PDF_THEME = {
  colors: {
    primary: [22, 50, 79],
    textSecondary: [80, 80, 80],
    divider: [200, 200, 200],
    white: 255,
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