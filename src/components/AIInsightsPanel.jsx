import { useMemo, useState } from 'react';
import styles from '../styles/AIInsightsPanel.module.css';

const currencyFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

function summarizeRows(rows) {
  const totalFees = rows.reduce((sum, row) => sum + (Number(row.honorarioMonto) || 0), 0);
  
  const byStatus = rows.reduce((accumulator, row) => {
    accumulator[row.estadoPresupuesto] = (accumulator[row.estadoPresupuesto] || 0) + 1;
    return accumulator;}, {});

  const topRow = rows.reduce((best, row) => (row.honorarioMonto > (best?.honorarioMonto || 0) ? row : best), rows[0]);
  const pendingRows = rows.filter((row) => row.estadoPresupuesto !== 'Enviado');

  return {
    totalFees,
    byStatus,
    topRow,
    pendingRows,
    count: rows.length,};}

function generateExecutiveReport(stats) {
  const pendingLabel = stats.pendingRows.length
    ? `${stats.pendingRows.length} requieren seguimiento`
    : 'todos los presupuestos están enviados';

  return [
    `Se analizaron ${stats.count} presupuestos por un total de ${currencyFormatter.format(stats.totalFees)}.`,
    `El presupuesto con mayor honorario es ${stats.topRow.cliente} (${stats.topRow.nroPresupuesto}), con ${currencyFormatter.format(stats.topRow.honorarioMonto)}.`,
    `Estado operativo: ${Object.entries(stats.byStatus)
      .map(([status, amount]) => `${amount} ${status.toLowerCase()}`)
      .join(', ')}.`,
    `Recomendación: priorizar los casos en revisión para evitar atrasos y sostener el ritmo de envío.`,
    `Alerta IA: ${pendingLabel}.`,
    `Contexto del tablero: los indicadores se leen junto con el reporte embebido para validar tendencias y desvíos.`,
  ].join(' ');}

function answerQuestion(question, stats) {
  const normalized = question.toLowerCase();

  if (!normalized.trim()) return 'Escribí una pregunta sobre los presupuestos...';

  if (normalized.includes('informe') || normalized.includes('resumen')) {
    return generateExecutiveReport(stats);  }

  if (normalized.includes('mayor') || normalized.includes('más alto')) {
    return `${stats.topRow.cliente} (${stats.topRow.nroPresupuesto}) tiene el mayor total de honorarios: ${currencyFormatter.format(stats.topRow.honorarioMonto)}.`;}

  if (normalized.includes('revisión') || normalized.includes('revision')) {
    const revisions = stats.byStatus.Revisión || 0;
    return `Hay ${revisions} presupuesto${revisions === 1 ? '' : 's'} en estado Revisión.`;}

  if (normalized.includes('enviado')) {
    const sent = stats.byStatus.Enviado || 0;
    return `Hay ${sent} presupuesto${sent === 1 ? '' : 's'} enviado${sent === 1 ? '' : 's'}.`;  }

  if (normalized.includes('total') || normalized.includes('honorarios') || normalized.includes('monto')) {
    return `El total de honorarios analizado es ${currencyFormatter.format(stats.totalFees)}.`;  }

  return 'Puedo responder sobre el total de honorarios, estados, cliente con mayor importe y recomendaciones.';}

function AIInsightsPanel({ rows, suggestions = [] }) {
  const stats = useMemo(() => summarizeRows(rows), [rows]);
  const [question, setQuestion] = useState('');
  const [report, setReport] = useState('');
  const [selectedSuggestion, setSelectedSuggestion] = useState(suggestions[0] ?? '');
  const [answer, setAnswer] = useState('Pedime un informe ejecutivo...');

  const handleGenerateReport = () => {
    setReport(generateExecutiveReport(stats));  };

  const handleAsk = (nextQuestion = question) => {
    const nextAnswer = answerQuestion(nextQuestion, stats);
    setQuestion(nextQuestion);
    setAnswer(nextAnswer);  };

  const handleUseSuggestion = () => {
    handleAsk(selectedSuggestion);  };

   return (
    <section className={styles.panel}>
      <div className={styles.workflowGrid}>
        <article className={styles.actionCard}>
          <div className={styles.cardHeader}>
            <div>
              <p className={styles.cardKicker}>Informe automático</p>
            </div>
            <button className={`${styles.button} ${styles.primaryButton}`} type="button" onClick={handleGenerateReport}>
              Generar informe
            </button>
          </div>
          <div className={styles.reportBox}>
            <p className={styles.resultLabel}>Informe generado</p>
            <p className={styles.resultText}>
              {report || 'Todavía no generaste un informe. Tocá “Generar informe” para crear uno.'}
            </p>
          </div>
        </article>
        <article className={styles.actionCard}>
          <div className={styles.cardHeader}>
            <div>
              <p className={styles.cardKicker}>Consulta conversacional</p>
            </div>
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
              rows={4}/>
          </label>
          {suggestions.length ? (
            <div className={styles.suggestionPicker}>
              <label className={styles.field}>
                <span>Preguntas posibles</span>
                <select
                  className={styles.select}
                  value={selectedSuggestion}
                  onChange={(event) => setSelectedSuggestion(event.target.value)} >
                  {suggestions.map((suggestion) => (
                    <option key={suggestion} value={suggestion}>
                      {suggestion}
                    </option>
                  ))}
                </select>
              </label>
              <button
                className={`${styles.button} ${styles.suggestionButton}`}
                type="button"
                onClick={handleUseSuggestion}
               disabled={!selectedSuggestion}>
                Usar pregunta
              </button>
            </div>
          ) : null}
          <div className={styles.resultBox}>
            <p className={styles.resultLabel}>Respuesta IA</p>
            <p className={styles.resultText}>{answer}</p>
          </div>
       </article>
      </div>
    </section>);}

export default AIInsightsPanel;