import AIInsightsPanel from '../components/AIInsightsPanel';
import LookerEmbed from '../components/LookerEmbed';
import Informes from './Informes';
import styles from '../styles/Dashboard.module.css';
import { budgetRows, defaultQuestionSuggestions } from '../data/mockDB.js';

function Dashboard() {
  return (
    <section className={styles.page}>
      <header className={styles.hero}>
        <div>
          <h1>Dashboard estratégico</h1>
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

        <section className={styles.sectionBlock}>
          <div className={styles.sectionHeader}>
          </div>
          <Informes />
        </section>
      </div>
    </section>
  );
}

export default Dashboard;