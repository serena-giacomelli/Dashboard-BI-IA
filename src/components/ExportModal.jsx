import { useState, useEffect } from 'react';
import styles from '../styles/ExportModal.module.css';

function ExportModal({ isOpen, onClose, onConfirm, format, columns }) {
  const [selected, setSelected] = useState([]);
  const MAX_COLUMNS = 15;

  useEffect(() => {
    if (isOpen) {
      setSelected(columns.map((col) => col.key));}
  }, [isOpen, columns]);

  if (!isOpen) return null;

  const toggleColumn = (key) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );};

  const toggleAll = () => {
    setSelected(selected.length === columns.length ? [] : columns.map((c) => c.key));};

  const handleConfirm = () => {
    if (selected.length === 0) return;
    const ordered = columns.filter((col) => selected.includes(col.key)).map((col) => col.key);
    onConfirm(ordered, format);
    onClose();};

  const isOverLimit = format === 'pdf' && selected.length > MAX_COLUMNS;
  const allChecked = selected.length === columns.length;
  const someChecked = selected.length > 0 && !allChecked;
  const formatLabel = format === 'pdf' ? 'PDF' : 'Excel';

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.formatBadge} data-format={format}>
              {formatLabel}
            </span>
            <h2 className={styles.title}>Seleccionar columnas</h2>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </header>

        <p className={styles.subtitle}>
          Elegí qué columnas incluir en el archivo exportado.
          {format === 'pdf' && (
            <span style={{ display: 'block', color: isOverLimit ? '#c0392b' : '#666', fontWeight: isOverLimit ? 'bold' : 'normal', marginTop: '5px' }}>
              {isOverLimit 
                ? `Límite excedido: ${selected.length}/${MAX_COLUMNS} columnas seleccionadas. El PDF podría verse desordenado.`
                : `Máximo recomendado para PDF: ${MAX_COLUMNS} columnas.`}
            </span>)}
        </p>

        <div className={styles.selectAllRow}>
          <label className={styles.checkItem}>
            <input
              type="checkbox"
              checked={allChecked}
              ref={(el) => { if (el) el.indeterminate = someChecked; }}
              onChange={toggleAll}
            />
            <span className={styles.checkLabel}>
              {allChecked ? 'Deseleccionar todas' : 'Seleccionar todas'}
            </span>
          </label>
          <span className={styles.counter}>{selected.length} / {columns.length}</span>
        </div>
        <div className={styles.columnGrid}>
          {columns.map((col) => (
            <label key={col.key} className={styles.checkItem}>
              <input
                type="checkbox"
                checked={selected.includes(col.key)}
                onChange={() => toggleColumn(col.key)}
              />
              <span className={styles.checkLabel}>{col.label}</span>
            </label>))}
        </div>

        <footer className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>
            Cancelar
          </button>
          <button
            className={styles.confirmBtn}
            onClick={handleConfirm}
            disabled={selected.length === 0 || isOverLimit}
            data-format={format}
          >
            {isOverLimit ? 'Demasiadas columnas' : `Exportar ${formatLabel}`}
          </button>
        </footer>
      </div>
    </div>);}

export default ExportModal;