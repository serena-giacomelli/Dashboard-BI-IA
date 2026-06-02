import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { reportConfigs } from '../data/reportsData';
import styles from '../styles/Reports.module.css';

const reportEntries = Object.entries(reportConfigs).map(([value, config]) => ({
  value,
  label: config.label,
  description: config.description,
}));

function formatDate(value) {
  if (!value) {
    return '-';
  }

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

function buildPdfRows(reportConfig, rows) {
  return rows.map((row) => reportConfig.columns.map((column) => {
    if (column.key === 'fecha' || column.key === 'vencimiento') {
      return formatDate(row[column.key]);
    }

    return row[column.key] ?? '-';
  }));
}

function Informes() {
  const navigate = useNavigate();
  const [reportId, setReportId] = useState('tareas');
  const [filters, setFilters] = useState(() => createInitialFilters('tareas'));

  const reportConfig = reportConfigs[reportId];

  useEffect(() => {
    setFilters(createInitialFilters(reportId));
  }, [reportId]);

  const filteredRows = useMemo(
    () => filterRows(reportConfig.rows, reportId, filters),
    [filters, reportConfig.rows, reportId],
  );

  const filterSummary = useMemo(() => buildFilterSummary(reportConfig, filters), [filters, reportConfig]);

  const handleFilterChange = (key, value) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleMultiSelectChange = (key, event) => {
    const selectedValues = Array.from(event.target.selectedOptions).map((option) => option.value);
    handleFilterChange(key, selectedValues);
  };

  const toggleCheckboxValue = (key, option) => {
    setFilters((current) => {
      const currentValues = current[key] ?? [];
      const nextValues = currentValues.includes(option)
        ? currentValues.filter((value) => value !== option)
        : [...currentValues, option];

      return {
        ...current,
        [key]: nextValues,
      };
    });
  };

  const downloadFile = (blob, fileName) => {
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    const workbook = XLSX.utils.book_new();
    const summaryRows = [
      ['Informe', reportConfig.label],
      ['Generado', new Intl.DateTimeFormat('es-AR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date())],
      ['Cantidad de registros', filteredRows.length],
      [''],
      ...filterSummary.map((item) => [item.label, item.value]),
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
    const dataSheetRows = filteredRows.map((row) => {
      return reportConfig.columns.reduce((accumulator, column) => {
        accumulator[column.label] = column.key === 'fecha' || column.key === 'vencimiento' ? formatDate(row[column.key]) : row[column.key] ?? '-';
        return accumulator;
      }, {});
    });

    const dataSheet = XLSX.utils.json_to_sheet(dataSheetRows.length ? dataSheetRows : [
      reportConfig.columns.reduce((accumulator, column) => {
        accumulator[column.label] = '-';
        return accumulator;
      }, {}),
    ]);

    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');
    XLSX.utils.book_append_sheet(workbook, dataSheet, 'Datos');

    const workbookBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([workbookBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    downloadFile(blob, `informe_${reportId}_${formatFileDate()}.xlsx`);
  };

  const handleExportPdf = () => {
    const doc = new jsPDF();
    const now = new Intl.DateTimeFormat('es-AR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date());

    doc.setFontSize(18);
    doc.text(`Informe ${reportConfig.label}`, 14, 18);
    doc.setFontSize(10);
    doc.text(`Generado: ${now}`, 14, 26);
    doc.text(`Registros: ${filteredRows.length}`, 14, 32);

    let cursorY = 40;
    filterSummary.forEach((item) => {
      doc.text(`${item.label}: ${item.value}`, 14, cursorY);
      cursorY += 6;
    });

    if (filteredRows.length) {
      autoTable(doc, {
        startY: cursorY + 4,
        head: [reportConfig.columns.map((column) => column.label)],
        body: buildPdfRows(reportConfig, filteredRows),
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [22, 50, 79],
        },
      });
    } else {
      doc.text('No hay registros para exportar con los filtros seleccionados.', 14, cursorY + 8);
    }

    doc.save(`informe_${reportId}_${formatFileDate()}.pdf`);
  };

  return (
    <section className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroCopy}>
          <h1>Generacion de informes operativos</h1>
        </div>
      </header>

      <div className={styles.layout}>
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
            <select className={styles.select} value={reportId} onChange={(event) => setReportId(event.target.value)}>
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
            <button className={`${styles.button} ${styles.secondaryButton}`} type="button" onClick={() => navigate('/dashboard')}>
              Volver
            </button>
            <button className={`${styles.button} ${styles.secondaryButton}`} type="button" onClick={handleExportPdf}>
              PDF
            </button>
            <button className={`${styles.button} ${styles.primaryButton}`} type="button" onClick={handleExportExcel}>
              Excel
            </button>
          </div>
        </section>

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
                        <td key={column.key}>{column.key === 'fecha' || column.key === 'vencimiento' ? formatDate(row[column.key]) : row[column.key] ?? '-'}</td>
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
    </section>
  );
}

export default Informes;