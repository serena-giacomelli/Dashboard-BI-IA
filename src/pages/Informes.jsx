import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { allColumnsByReport, reportConfigs } from '../data/mockDB.js';
import { exportToExcel } from '../utils/exportExcel.js';
import ExportModal from '../components/ExportModal.jsx';
import { COMPANY_CONFIG } from '../styles/reportTheme';
import { LOGO_CIFAS_BASE64 } from '../utils/assets.js';
import { PDF_THEME } from '../styles/Pdftheme.js';

import '../styles/Global.css'; // Cargamos el core de diseño unificado

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
    if (reportId === 'servicios') {
      const estados = filters.estados || [];
      const usuarios = filters.usuarioAsignado || [];
      return (
        (!filters.contactoCliente || row.contactoCliente === filters.contactoCliente) &&
        (!usuarios.length || usuarios.includes(row.usuarioAsignado)) &&
        (!filters.contactoOrganismo || row.contactoOrganismo === filters.contactoOrganismo) &&
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

// ── Componente Principal ──────────────────────────────────────────────────────
function Informes() {
  const navigate = useNavigate();
  const [reportId, setReportId] = useState('servicios');
  const [filters, setFilters] = useState(() => createInitialFilters('servicios'));
  const [exportFormat, setExportFormat] = useState(null);

  const reportConfig = reportConfigs[reportId];
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

  const openExportModal = (format) => setExportFormat(format);
  const closeExportModal = () => setExportFormat(null);

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

  const handleExportPdf = (selectedColumnKeys) => {
    if (selectedColumnKeys.length > 15) {
       console.warn("Demasiadas columnas seleccionadas para PDF");
    }
    
    const exportColumns = allColumns.filter((col) => selectedColumnKeys.includes(col.key));
    const doc = new jsPDF({ orientation: 'landscape' });
    const now = new Intl.DateTimeFormat('es-AR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date());

    const addHeader = () => {
      if (LOGO_CIFAS_BASE64) {
        doc.addImage(LOGO_CIFAS_BASE64, 'PNG', 14, 10, 30, 15);
      }
      doc.setFont(COMPANY_CONFIG.font, 'bold');
      doc.setFontSize(PDF_THEME.header.companyName.fontSize);
      doc.setTextColor(PDF_THEME.colors.primary);
      doc.text(COMPANY_CONFIG.name, PDF_THEME.header.companyName.x, PDF_THEME.header.companyName.y);
      doc.setFont(COMPANY_CONFIG.font, 'normal');
      doc.setFontSize(PDF_THEME.header.reportTitle.fontSize);
      doc.text(`Informe: ${reportConfig.label}`, PDF_THEME.header.reportTitle.x, PDF_THEME.header.reportTitle.y);      
      doc.setDrawColor(...PDF_THEME.colors.divider);
      doc.line(PDF_THEME.header.dividerX1, PDF_THEME.header.dividerY, PDF_THEME.header.dividerX2, PDF_THEME.header.dividerY);
    };
    addHeader();

    let cursorY = PDF_THEME.body.startY;
    doc.setFont(COMPANY_CONFIG.font, 'normal');
    doc.setFontSize(PDF_THEME.body.metadataFontSize);
    doc.setTextColor(...PDF_THEME.colors.textSecondary);
    doc.text(`Generado el: ${now} | Registros: ${filteredRows.length}`, 14, cursorY);
    cursorY += PDF_THEME.body.metadataLineHeight;

    filterSummary.forEach((item) => {
      doc.text(`${item.label}: ${item.value}`, 14, cursorY);
      cursorY += PDF_THEME.body.filterLineHeight;
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
        startY: cursorY + PDF_THEME.body.tableOffset,
        head: [exportColumns.map((col) => col.label)],
        body: pdfRows,
        styles: {
          font: COMPANY_CONFIG.font,
          fontSize: PDF_THEME.table.fontSize,
          cellPadding: PDF_THEME.table.cellPadding,
        },
        headStyles: {
          fillColor: PDF_THEME.colors.primary,
          textColor: PDF_THEME.colors.white,
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: PDF_THEME.colors.rowAlternate,
        },
        margin: PDF_THEME.table.margin,
        horizontalPageBreak: true,
      });
    } else {
      doc.setFontSize(PDF_THEME.body.metadataFontSize);
      doc.setTextColor(...PDF_THEME.colors.textSecondary);
      doc.text('No hay registros para exportar con los filtros seleccionados.', 14, cursorY + PDF_THEME.body.tableOffset + 5);
    }

    doc.save(`informe_${reportId}_${formatFileDate()}.pdf`);
  };

  return (
    <section className="cifas-page">
      <header className="cifas-header">
        <h1>Generación de Informes Operativos</h1>
      </header>

      <div className="cifas-layout-split">
        
        {/* PANEL IZQUIERDO: CONFIGURACIÓN DE FILTROS */}
        <section className="cifas-card">
          <p className="cifas-card__titulo">Parámetros del reporte</p>
          <h2 className="cifas-card__main-name">{reportConfig.label}</h2>
          <p className="cifas-card__description">{reportConfig.description}</p>
          
          <label className="cifas-field">
            <span>Elegir informe</span>
            <select
              className="cifas-select"
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

          {/* Renderizado dinámico de filtros */}
          <div>
            {reportConfig.filters.map((filter) => {
              if (filter.type === 'date') {
                return (
                  <label key={filter.key} className="cifas-field">
                    <span>{filter.label}</span>
                    <input
                      className="cifas-input"
                      type="date"
                      value={filters[filter.key]}
                      onChange={(event) => handleFilterChange(filter.key, event.target.value)}
                    />
                  </label>
                );
              }
              if (filter.type === 'multiselect') {
                return (
                  <fieldset key={filter.key} className="cifas-fieldset">
                    <legend>{filter.label}</legend>
                    <div className="cifas-checkbox-group">
                      {filter.options.map((option) => (
                        <label key={option} className="cifas-checkbox-item">
                          <input
                            type="checkbox"
                            checked={(filters[filter.key] ?? []).includes(option)}
                            onChange={() => toggleCheckboxValue(filter.key, option)}
                          />
                          <span>{option}</span>
                        </label>
                      ))}
                    </div>
                    <small className="cifas-helper">Podés marcar más de una opción.</small>
                  </fieldset>
                );
              }
              return (
                <label key={filter.key} className="cifas-field">
                  <span>{filter.label}</span>
                  <select
                    className="cifas-select"
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

          <div className="cifas-btn-group">
            <button className="cifas-btn cifas-btn--secondary" type="button" onClick={() => navigate('/dashboard')}>
              Volver
            </button>
            <button className="cifas-btn cifas-btn--pdf" type="button" onClick={() => openExportModal('pdf')}>
              PDF
            </button>
            <button className="cifas-btn cifas-btn--primary" type="button" onClick={() => openExportModal('excel')}>
              Excel
            </button>
          </div>
        </section>

        {/* PANEL DERECHO: VISTA PREVIA DE TABLA */}
        <section className="cifas-card">
          <p className="cifas-card__titulo">Vista previa en tiempo real</p>
          <h2 className="cifas-card__main-name">Resultados filtrados</h2>
          <p className="cifas-card__description">
            El informe devuelve <strong>{filteredRows.length}</strong> registro{filteredRows.length === 1 ? '' : 's'}.
          </p>

          <div className="cifas-chips">
            {filterSummary.map((item) => (
              <span className="cifas-chip" key={item.label}>
                <strong>{item.label}:</strong> {item.value}
              </span>
            ))}
          </div>

          <div className="cifas-table-wrap">
            <table className="cifas-table">
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
                          {column.key === 'fecha' || column.key === 'vencimiento' || column.key === 'fechaInicio'
                            ? formatDate(row[column.key])
                            : row[column.key] ?? '-'}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="cifas-table-empty" colSpan={reportConfig.columns.length}>
                      No hay registros para los filtros seleccionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

      </div>

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