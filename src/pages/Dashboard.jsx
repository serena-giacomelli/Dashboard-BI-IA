import AIInsightsPanel from '../components/AIInsightsPanel';
import LookerEmbed from '../components/LookerEmbed';
import Informes from './Informes';
import { budgetRows, defaultQuestionSuggestions } from '../data/mockDB.js';
import '../styles/Global.css'; 

function Dashboard() {
  return (
    <section className="cifas-page">
      
      <header className="cifas-header">
        <h1>Dashboard Estratégico</h1>
      </header>

      <div className="cifas-dashboard-grid">
        
        {/* BLOQUE 1: LOOKER */}
        <section className="cifas-card">
          <h2 className="cifas-card__titulo">Reporte Visual</h2>
          <LookerEmbed src="https://datastudio.google.com/embed/reporting/a0224742-cbbb-47f9-b975-2bf78f309c70/page/bt3zF" />
        </section>

        {/* BLOQUE 2: IA */}
        <section className="cifas-card">
          <h2 className="cifas-card__titulo">Informes IA</h2>
          <AIInsightsPanel rows={budgetRows} suggestions={defaultQuestionSuggestions} />
        </section>

        {/* BLOQUE 3: INFORMES */}
        <section className="cifas-card">
          <Informes />
        </section>

      </div>
      
    </section>
  );
}

export default Dashboard;