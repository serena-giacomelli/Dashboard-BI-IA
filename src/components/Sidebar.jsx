import { NavLink } from 'react-router-dom';
import styles from '../styles/Sidebar.module.css';

function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <span className={styles.badge}>BI</span>
        <div>
          <h1>CIFAS</h1>
        </div>
      </div>

      <nav className={styles.nav}>
        <NavLink
          to="/dashboard"
          className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
        >
          REPORTES
        </NavLink>
        <NavLink
          to="/detalle"
          className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
        >
          GESTIÓN ESTRATÉGICA
        </NavLink>
      </nav>
    </aside>
  );
}

export default Sidebar;