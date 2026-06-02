import { NavLink } from 'react-router-dom';
import styles from '../styles/Sidebar.module.css';

const navItems = [
  { to: '/dashboard', label: 'Reportes' },
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