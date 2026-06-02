import styles from '../styles/DetailPage.module.css';

function Detail() {
  return (
    <section className={styles.page}>
      <p className={styles.kicker}>Detalle</p>
      <h1>Gestión Estratégica</h1>
      <p className={styles.body}>
        Esta vista centraliza el análisis operativo y los comentarios de apoyo para la toma de decisiones.
      </p>
    </section>
  );
}

export default Detail;