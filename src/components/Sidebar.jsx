// src/components/Sidebar.jsx
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import styles from '../styles/Sidebar.module.css';

function Sidebar() {
  const [isPresupuestosOpen, setIsPresupuestosOpen] = useState(false);
  const [isTramitesOpen, setIsTramitesOpen] = useState(false);
  const [isContactosOpen, setIsContactosOpen] = useState(false);

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <span className={styles.badge}>BI</span>
        <div>
          <h1>CIFAS</h1>
        </div>
      </div>

      <nav className={styles.nav}>
        <NavLink to="/dashboard" className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}>
          REPORTES
        </NavLink>
        <NavLink to="/detalle" className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}>
          GESTIÓN ESTRATÉGICA
        </NavLink>
        <NavLink to="/clientes" className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}>
          CLIENTES
        </NavLink>
        <NavLink to="/actividades" className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}>
          ACTIVIDADES
        </NavLink>

        <div className={styles.group}>
          
          <NavLink 
            to="/presupuestos" 
            className={({ isActive }) => `${styles.link} ${styles.toggleBtn} ${isActive ? styles.active : ''}`}
            onClick={() => setIsPresupuestosOpen(!isPresupuestosOpen)}
          >
            <span>PRESUPUESTOS</span>
            <span className={styles.arrowIcon}>
              {isPresupuestosOpen ? '▲' : '▼'}
            </span>
          </NavLink>

          {isPresupuestosOpen && (
            <div className={styles.groupLinks}>
              
              <div className={styles.group}>
                <NavLink 
                  to="/tramites" 
                  className={({ isActive }) => `${styles.link} ${styles.subLink} ${styles.toggleBtn} ${isActive ? styles.active : ''}`}
                  onClick={() => setIsTramitesOpen(!isTramitesOpen)}
                >
                  <span>TRÁMITES</span>
                  <span className={styles.arrowIcon}>
                    {isTramitesOpen ? '▲' : '▼'}
                  </span>
                </NavLink>

                {isTramitesOpen && (
                  <div className={styles.groupLinks}>
                    <NavLink 
                      to="/servicios" 
                      className={({ isActive }) => `${styles.link} ${styles.subLink} ${isActive ? styles.active : ''}`}
                      style={{ paddingLeft: '2.5rem' }} 
                    >
                      SERVICIOS
                    </NavLink>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>

        <div className={styles.group}>
          <div 
            className={`${styles.link} ${styles.toggleBtn}`}
            onClick={() => setIsContactosOpen(!isContactosOpen)}
            style={{ cursor: 'pointer' }}
          >
            <span>CONTACTOS</span>
            <span className={styles.arrowIcon}>
              {isContactosOpen ? '▲' : '▼'}
            </span>
          </div>

          {isContactosOpen && (
            <div className={styles.groupLinks}>
              <NavLink 
                to="/directores-tecnicos" 
                className={({ isActive }) => `${styles.link} ${styles.subLink} ${isActive ? styles.active : ''}`}
              >
                Directores Técnicos
              </NavLink>
              
              {/* Ruta corregida para Organismos y Regionales */}
              <NavLink 
                to="/organismos-regionales" 
                className={({ isActive }) => `${styles.link} ${styles.subLink} ${isActive ? styles.active : ''}`}
              >
                Organismos y Regionales
              </NavLink>
            </div>
          )}
        </div>
        <NavLink to="/boletines" className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}>
          BOLETINES
        </NavLink>
        <NavLink to="/novedades" className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}>
          NOVEDADES
        </NavLink>
      </nav>
    </aside>
  );
}

export default Sidebar;