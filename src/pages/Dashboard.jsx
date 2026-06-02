import IACard from '../components/IACard';
import LookerEmbed from '../components/LookerEmbed';
import styles from '../styles/Dashboard.module.css';

function Dashboard() {
  return (
    <section className={styles.page}>
      <header className={styles.hero}>
        <div>
          <p className={styles.kicker}>Business Intelligence</p>
          <h1>Dashboard estratégico</h1>
          <p className={styles.subtitle}>
            Indicadores clave para decisiones académicas y de gestión.
          </p>
        </div>
      </header>

      <div className={styles.grid}>
        <IACard text="El análisis detecta estabilidad operativa y una mejora progresiva en el seguimiento de indicadores. Se recomienda revisar alertas en matrículas y retención." />
        <LookerEmbed src="https://datastudio.google.com/embed/reporting/a0224742-cbbb-47f9-b975-2bf78f309c70/page/bt3zF" />
      </div>
    </section>
  );
}

export default Dashboard;