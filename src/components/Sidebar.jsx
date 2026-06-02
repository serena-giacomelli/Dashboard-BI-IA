import { NavLink } from 'react-router-dom';
import styles from '../styles/Sidebar.module.css';

const reportItems = [
  { to: '/dashboard', label: 'Dashboard estratégico' },
  { to: '/informes', label: 'Informes' },
];

const navItems = [
  { to: '/detalle', label: 'Gestión Estratégica' },
];

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
        <div className={styles.group}>
          <p className={styles.groupTitle}>Reportes</p>

          <div className={styles.groupLinks}>
            {reportItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `${styles.link} ${styles.subLink} ${isActive ? styles.active : ''}`}
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>

        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;