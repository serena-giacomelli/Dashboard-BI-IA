import AIInsightsPanel from '../components/AIInsightsPanel';
import LookerEmbed from '../components/LookerEmbed';
import styles from '../styles/Dashboard.module.css';
import { budgetRows, defaultQuestionSuggestions } from '../data/dashboardData';

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

      <div className={styles.sections}>
        <section className={styles.sectionBlock}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionKicker}>Reporte visual</p>
            </div>
          </div>

          <LookerEmbed src="https://datastudio.google.com/embed/reporting/a0224742-cbbb-47f9-b975-2bf78f309c70/page/bt3zF" />
        </section>

        <section className={styles.sectionBlock}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionKicker}>INFORMES IA</p>
            </div>
          </div>

          <AIInsightsPanel rows={budgetRows} suggestions={defaultQuestionSuggestions} />
        </section>
      </div>
    </section>
  );
}

export default Dashboard;