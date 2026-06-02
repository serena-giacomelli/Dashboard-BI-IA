import { useMemo, useState } from 'react';
import styles from '../styles/AIInsightsPanel.module.css';

const currencyFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

function summarizeRows(rows) {
  const totalFees = rows.reduce((sum, row) => sum + row.totalFees, 0);
  const byStatus = rows.reduce((accumulator, row) => {
    accumulator[row.status] = (accumulator[row.status] || 0) + 1;
    return accumulator;
  }, {});
  const topRow = rows.reduce((best, row) => (row.totalFees > best.totalFees ? row : best), rows[0]);
  const pendingRows = rows.filter((row) => row.status !== 'Enviado');

  return {
    totalFees,
    byStatus,
    topRow,
    pendingRows,
    count: rows.length,
  };
}

function generateExecutiveReport(stats, rows) {
  const pendingLabel = stats.pendingRows.length
    ? `${stats.pendingRows.length} requieren seguimiento`
    : 'todos los presupuestos están enviados';

  return [
    `Se analizaron ${stats.count} presupuestos por un total de ${currencyFormatter.format(stats.totalFees)}.`,
    `El presupuesto con mayor honorario es ${stats.topRow.client} (${stats.topRow.number}), con ${currencyFormatter.format(stats.topRow.totalFees)}.`,
    `Estado operativo: ${Object.entries(stats.byStatus)
      .map(([status, amount]) => `${amount} ${status.toLowerCase()}`)
      .join(', ')}.`,
    `Recomendación: priorizar los casos en revisión para evitar atrasos y sostener el ritmo de envío.`,
    `Alerta IA: ${pendingLabel}.`,
    `Contexto del tablero: los indicadores se leen junto con el reporte embebido de Looker para validar tendencias y desvíos.`,
  ].join(' ');
}

function answerQuestion(question, stats) {
  const normalized = question.toLowerCase();

  if (!normalized.trim()) {
    return 'Escribí una pregunta sobre los presupuestos, el total, el estado o la recomendación que quieras revisar.';
  }

  if (normalized.includes('informe') || normalized.includes('resumen')) {
    return generateExecutiveReport(stats);
  }

  if (normalized.includes('mayor') || normalized.includes('más alto') || normalized.includes('mas alto')) {
    return `${stats.topRow.client} (${stats.topRow.number}) tiene el mayor total de honorarios: ${currencyFormatter.format(stats.topRow.totalFees)}.`;
  }

  if (normalized.includes('revisión') || normalized.includes('revision')) {
    const revisions = stats.byStatus.Revisión || 0;
    return `Hay ${revisions} presupuesto${revisions === 1 ? '' : 's'} en estado Revisión.`;
  }

  if (normalized.includes('enviado')) {
    const sent = stats.byStatus.Enviado || 0;
    return `Hay ${sent} presupuesto${sent === 1 ? '' : 's'} enviado${sent === 1 ? '' : 's'}.`;
  }

  if (normalized.includes('total') || normalized.includes('honorarios') || normalized.includes('monto')) {
    return `El total de honorarios analizado es ${currencyFormatter.format(stats.totalFees)}.`;
  }

  if (normalized.includes('recomend') || normalized.includes('acción') || normalized.includes('accion')) {
    return 'La recomendación IA es priorizar los presupuestos en revisión, seguir el reporte de Looker y detectar desvíos antes de que impacten en la gestión.';
  }

  if (normalized.includes('cliente')) {
    return `Los clientes cargados son ${stats.count} registros. El principal por monto es ${stats.topRow.client}.`;
  }

  return 'Puedo responder sobre el total de honorarios, estados, cliente con mayor importe, recomendaciones y un informe ejecutivo. Probá con una pregunta más concreta.';
}

function AIInsightsPanel({ rows, suggestions = [] }) {
  const stats = useMemo(() => summarizeRows(rows), [rows]);
  const [question, setQuestion] = useState('');
  const [report, setReport] = useState('');
  const [answer, setAnswer] = useState(
    'Pedime un informe ejecutivo o preguntame algo sobre total de honorarios, estados y recomendaciones.',
  );

  const handleGenerateReport = () => {
    setReport(generateExecutiveReport(stats, rows));
  };

  const handleAsk = (nextQuestion = question) => {
    const nextAnswer = answerQuestion(nextQuestion, stats);
    setQuestion(nextQuestion);
    setAnswer(nextAnswer);
  };

  const handleSuggestion = (suggestion) => {
    setQuestion(suggestion);
    handleAsk(suggestion);
  };

  return (
    <section className={styles.panel}>
      <div className={styles.header}>
        <div>
          <p className={styles.kicker}>IA asistida</p>
          <h2>Generador de informes y preguntas</h2>
          <p className={styles.subtitle}>
            Te ayuda a resumir el tablero y responder consultas sobre los datos visibles.
          </p>
        </div>

        <div className={styles.metrics}>
          <div>
            <span>Total analizado</span>
            <strong>{currencyFormatter.format(stats.totalFees)}</strong>
          </div>
          <div>
            <span>Presupuestos</span>
            <strong>{stats.count}</strong>
          </div>
        </div>
      </div>

      <div className={styles.toolbar}>
        <button className={`${styles.button} ${styles.primaryButton}`} type="button" onClick={handleGenerateReport}>
          Generar informe IA
        </button>
        <button className={styles.button} type="button" onClick={() => handleAsk(question)}>
          Responder pregunta
        </button>
      </div>

      <label className={styles.field}>
        <span>Escribí tu pregunta</span>
        <textarea
          className={styles.textarea}
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ejemplo: ¿Qué cliente tiene el mayor total de honorarios?"
          rows={4}
        />
      </label>

      {suggestions.length ? (
        <div className={styles.suggestions}>
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              className={styles.suggestion}
              type="button"
              onClick={() => handleSuggestion(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      ) : null}

      <div className={styles.resultBox}>
        <p className={styles.resultLabel}>Respuesta IA</p>
        <p className={styles.resultText}>{answer}</p>
      </div>

      {report ? (
        <div className={styles.reportBox}>
          <p className={styles.resultLabel}>Informe generado</p>
          <p className={styles.resultText}>{report}</p>
        </div>
      ) : null}
    </section>
  );
}

export default AIInsightsPanel;