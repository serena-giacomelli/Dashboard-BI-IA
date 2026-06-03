import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { reportConfigs } from '../data/reportsData';
import { allColumnsByReport } from '../data/allColumns';
import { exportToExcel } from '../utils/exportExcel.js';
import ExportModal from '../components/ExportModal.jsx';
import styles from '../styles/Reports.module.css';

// ── Helpers ───────────────────────────────────────────────────────────────────

const reportEntries = Object.entries(reportConfigs).map(([value, config]) => ({
  value,
  label: config.label,
  description: config.description,
}));

function formatDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('es-AR').format(new Date(`${value}T00:00:00`));
}

function formatFileDate(value = new Date()) {
  return value.toISOString().slice(0, 10);
}

function createInitialFilters(reportId) {
  return reportConfigs[reportId].filters.reduce((accumulator, filter) => {
    accumulator[filter.key] = filter.type === 'multiselect' ? [] : '';
    return accumulator;
  }, {});
}

function describeFilterValue(filter, value) {
  if (filter.type === 'multiselect') {
    return value.length ? value.join(', ') : 'Todos';
  }
  if (filter.type === 'date') {
    return value ? formatDate(value) : 'Sin definir';
  }
  return value || 'Todos';
}

function filterRows(rows, reportId, filters) {
  return rows.filter((row) => {
    if (reportId === 'tareas') {
      const estados = filters.estados || [];
      const usuarios = filters.usuario || [];
      return (
        (!filters.cliente || row.cliente === filters.cliente) &&
        (!usuarios.length || usuarios.includes(row.usuario)) &&
        (!filters.organismo || row.organismo === filters.organismo) &&
        (!filters.usuarioSeguimiento || row.usuarioSeguimiento === filters.usuarioSeguimiento) &&
        (!estados.length || estados.includes(row.estado))
      );
    }
    if (reportId === 'tramites') {
      return (
        (!filters.organismo || row.organismo === filters.organismo) &&
        (!filters.area || row.area === filters.area)
      );
    }
    if (reportId === 'vencimientos') {
      const rowDate = new Date(`${row.vencimiento}T00:00:00`).getTime();
      const fromDate = filters.fechaDesde ? new Date(`${filters.fechaDesde}T00:00:00`).getTime() : null;
      const toDate = filters.fechaHasta ? new Date(`${filters.fechaHasta}T23:59:59`).getTime() : null;
      const usuarios = filters.usuario || [];
      return (
        (!filters.cliente || row.cliente === filters.cliente) &&
        (!usuarios.length || usuarios.includes(row.usuario)) &&
        (!fromDate || rowDate >= fromDate) &&
        (!toDate || rowDate <= toDate)
      );
    }
    if (reportId === 'engordes') {
      const pertenencias = filters.pertenencia || [];
      return (
        (!filters.provincia || row.provincia === filters.provincia) &&
        (!filters.partido || row.partido === filters.partido) &&
        (!pertenencias.length || pertenencias.includes(row.pertenencia))
      );
    }
    if (reportId === 'pedidosPendientes') {
      const rowDate = new Date(`${row.fecha}T00:00:00`).getTime();
      const fromDate = filters.fechaDesde ? new Date(`${filters.fechaDesde}T00:00:00`).getTime() : null;
      const toDate = filters.fechaHasta ? new Date(`${filters.fechaHasta}T23:59:59`).getTime() : null;
      return (!fromDate || rowDate >= fromDate) && (!toDate || rowDate <= toDate);
    }
    return true;
  });
}

function buildFilterSummary(reportConfig, filters) {
  return reportConfig.filters.map((filter) => ({
    label: filter.label,
    value: describeFilterValue(filter, filters[filter.key] ?? ''),
  }));
}

// ── Componente ────────────────────────────────────────────────────────────────

function Informes() {
  const navigate = useNavigate();
  const [reportId, setReportId] = useState('tareas');
  const [filters, setFilters] = useState(() => createInitialFilters('tareas'));

  // Estado del modal: null = cerrado, 'pdf' | 'excel' = abierto con ese formato
  const [exportFormat, setExportFormat] = useState(null);

  const reportConfig = reportConfigs[reportId];

  // Todas las columnas disponibles para el informe actual (modal + exportación)
  const allColumns = allColumnsByReport[reportId] ?? reportConfig.columns;

  useEffect(() => {
    setFilters(createInitialFilters(reportId));
  }, [reportId]);

  const filteredRows = useMemo(
    () => filterRows(reportConfig.rows, reportId, filters),
    [filters, reportConfig.rows, reportId],
  );

  const filterSummary = useMemo(
    () => buildFilterSummary(reportConfig, filters),
    [filters, reportConfig],
  );

  // ── Handlers de filtros ─────────────────────────────────────────────────────

  const handleFilterChange = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const toggleCheckboxValue = (key, option) => {
    setFilters((current) => {
      const currentValues = current[key] ?? [];
      const nextValues = currentValues.includes(option)
        ? currentValues.filter((value) => value !== option)
        : [...currentValues, option];
      return { ...current, [key]: nextValues };
    });
  };

  // ── Abrir modal ─────────────────────────────────────────────────────────────

  const openExportModal = (format) => setExportFormat(format);
  const closeExportModal = () => setExportFormat(null);

  // ── Exportación efectiva (llamada desde el modal al confirmar) ───────────────

  const handleExportConfirm = async (selectedColumnKeys, format) => {
    const configForExport = { ...reportConfig, allColumns };

    if (format === 'excel') {
      await exportToExcel({
        reportConfig: configForExport,
        filteredRows,
        filterSummary,
        selectedColumnKeys,
        reportId,
      });
      return;
    }

    if (format === 'pdf') {
      handleExportPdf(selectedColumnKeys);
    }
  };

  // ── PDF con columnas seleccionadas ──────────────────────────────────────────

  const handleExportPdf = (selectedColumnKeys) => {
    const exportColumns = allColumns.filter((col) => selectedColumnKeys.includes(col.key));
    const doc = new jsPDF({ orientation: 'landscape' });
    const now = new Intl.DateTimeFormat('es-AR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date());

    doc.setFontSize(16);
    doc.setTextColor(22, 50, 79);
    doc.text(`Informe ${reportConfig.label}`, 14, 16);

    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generado: ${now}`, 14, 23);
    doc.text(`Registros: ${filteredRows.length}`, 14, 29);

    let cursorY = 36;
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    filterSummary.forEach((item) => {
      doc.text(`${item.label}: ${item.value}`, 14, cursorY);
      cursorY += 5;
    });

    const pdfRows = filteredRows.map((row) =>
      exportColumns.map((col) => {
        if (['fecha', 'vencimiento', 'fechaVto', 'ultimoCambio'].includes(col.key)) {
          return formatDate(row[col.key]);
        }
        return row[col.key] ?? '-';
      })
    );

    if (filteredRows.length) {
      autoTable(doc, {
        startY: cursorY + 4,
        head: [exportColumns.map((col) => col.label)],
        body: pdfRows,
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [22, 50, 79], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 248, 255] },
      });
    } else {
      doc.setFontSize(9);
      doc.setTextColor(150);
      doc.text('No hay registros para exportar con los filtros seleccionados.', 14, cursorY + 8);
    }

    doc.save(`informe_${reportId}_${formatFileDate()}.pdf`);
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <section className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroCopy}>
          <h1>Generacion de informes operativos</h1>
        </div>
      </header>

      <div className={styles.layout}>
        {/* Panel izquierdo: filtros */}
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.panelKicker}>Tipo de informe</p>
              <h2 className={styles.panelTitle}>{reportConfig.label}</h2>
              <p className={styles.panelDescription}>{reportConfig.description}</p>
            </div>
          </div>

          <label className={styles.field}>
            <span>Elegir informe</span>
            <select
              className={styles.select}
              value={reportId}
              onChange={(event) => setReportId(event.target.value)}
            >
              {reportEntries.map((entry) => (
                <option key={entry.value} value={entry.value}>
                  {entry.label}
                </option>
              ))}
            </select>
          </label>

          <div className={styles.formGrid}>
            {reportConfig.filters.map((filter) => {
              if (filter.type === 'date') {
                return (
                  <label key={filter.key} className={styles.field}>
                    <span>{filter.label}</span>
                    <input
                      className={styles.input}
                      type="date"
                      value={filters[filter.key]}
                      onChange={(event) => handleFilterChange(filter.key, event.target.value)}
                    />
                  </label>
                );
              }

              if (filter.type === 'multiselect') {
                return (
                  <fieldset key={filter.key} className={styles.fieldset}>
                    <legend>{filter.label}</legend>
                    <div className={styles.checkboxGroup}>
                      {filter.options.map((option) => (
                        <label key={option} className={styles.checkboxItem}>
                          <input
                            className={styles.checkboxInput}
                            type="checkbox"
                            checked={(filters[filter.key] ?? []).includes(option)}
                            onChange={() => toggleCheckboxValue(filter.key, option)}
                          />
                          <span>{option}</span>
                        </label>
                      ))}
                    </div>
                    <small className={styles.helper}>Podés marcar más de una opción.</small>
                  </fieldset>
                );
              }

              return (
                <label key={filter.key} className={styles.field}>
                  <span>{filter.label}</span>
                  <select
                    className={styles.select}
                    value={filters[filter.key]}
                    onChange={(event) => handleFilterChange(filter.key, event.target.value)}
                  >
                    {filter.options.map((option) => (
                      <option key={option} value={option === 'Todos' || option === 'Todas' ? '' : option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              );
            })}
          </div>

          <div className={styles.footerActions}>
            <button
              className={`${styles.button} ${styles.secondaryButton}`}
              type="button"
              onClick={() => navigate('/dashboard')}
            >
              Volver
            </button>
            <button
              className={`${styles.button} ${styles.secondaryButton}`}
              type="button"
              onClick={() => openExportModal('pdf')}
            >
              PDF
            </button>
            <button
              className={`${styles.button} ${styles.primaryButton}`}
              type="button"
              onClick={() => openExportModal('excel')}
            >
              Excel
            </button>
          </div>
        </section>

        {/* Panel derecho: vista previa */}
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.panelKicker}>Vista previa</p>
              <h2 className={styles.panelTitle}>Resultados filtrados</h2>
              <p className={styles.panelDescription}>
                El informe actual devuelve {filteredRows.length} registro{filteredRows.length === 1 ? '' : 's'}.
              </p>
            </div>
          </div>

          <div className={styles.chips}>
            {filterSummary.map((item) => (
              <span className={styles.chip} key={item.label}>
                <strong>{item.label}:</strong> {item.value}
              </span>
            ))}
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  {reportConfig.columns.map((column) => (
                    <th key={column.key}>{column.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.length ? (
                  filteredRows.map((row) => (
                    <tr key={row.id}>
                      {reportConfig.columns.map((column) => (
                        <td key={column.key}>
                          {column.key === 'fecha' || column.key === 'vencimiento'
                            ? formatDate(row[column.key])
                            : row[column.key] ?? '-'}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className={styles.emptyState} colSpan={reportConfig.columns.length}>
                      No hay registros para los filtros seleccionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Modal de selección de columnas */}
      <ExportModal
        isOpen={exportFormat !== null}
        onClose={closeExportModal}
        onConfirm={handleExportConfirm}
        format={exportFormat ?? 'excel'}
        columns={allColumns}
      />
    </section>
  );
}

export default Informes;