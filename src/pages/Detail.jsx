import styles from '../styles/DetailPage.module.css';

function Detail() {
  return (
    <section className={styles.page}>
      <div className="system-header">
        <div>
          <p className={styles.kicker}>Detalle</p>
          <h1 className="system-title">Gestión Estratégica</h1>
        </div>
      </div>

      <div className="panel">
        <p className={styles.body}>
          Esta vista centraliza el análisis operativo y los comentarios de apoyo para la toma de decisiones.
        </p>
      </div>
    </section>
  );
}

export default Detail;