import IACard from '../components/IACard';
import LookerEmbed from '../components/LookerEmbed';
import styles from '../styles/Dashboard.module.css';

function Dashboard() {
  return (
    <section className={styles.page}>
      <div className="system-header">
        <div>
          <p className={styles.kicker}>Business Intelligence</p>
          <h1 className="system-title">Listado de Presupuestos</h1>
        </div>

        <div className="controls">
          <input className="control-input" placeholder="Buscar por cliente, número..." />
          <select className="control-select">
            <option>Todos los estados</option>
            <option>Enviado</option>
            <option>Revisión</option>
          </select>
          <button className="btn">Reporte por Cliente</button>
          <button className="btn primary">+ Nuevo Presupuesto</button>
        </div>
      </div>

      <div className="panel">
        <table className="list-table">
          <thead>
            <tr>
              <th>NRO.</th>
              <th>CLIENTE</th>
              <th>TIPO</th>
              <th>ESTADO</th>
              <th>FECHA</th>
              <th>TOTAL HONORARIOS</th>
              <th>OPCIONES</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><a href="#">10234</a></td>
              <td>ALBERTO BERARDI S.A.</td>
              <td>SENASA</td>
              <td><span className="pill ok">Enviado</span></td>
              <td>12/05/2025</td>
              <td>$ 107.000</td>
              <td className="options">
                <button className="btn">Editar</button>
                <button className="btn">Resumen</button>
                <button className="btn">PDF</button>
              </td>
            </tr>
            <tr>
              <td>10233</td>
              <td>BERARDI JOSE</td>
              <td>ANMAT</td>
              <td><span className="pill warn">Revisión</span></td>
              <td>08/05/2025</td>
              <td>$ 54.000</td>
              <td className="options">
                <button className="btn">Editar</button>
                <button className="btn">Resumen</button>
                <button className="btn">PDF</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ height: 18 }} />

      <div className={styles.grid}>
        <IACard text="El análisis detecta estabilidad operativa y una mejora progresiva en el seguimiento de indicadores. Se recomienda revisar alertas en matrículas y retención." />
        <LookerEmbed url="" />
      </div>
    </section>
  );
}

export default Dashboard;