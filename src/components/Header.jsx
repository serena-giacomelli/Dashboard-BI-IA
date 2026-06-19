import { useState, useRef, useEffect } from 'react';
import '../styles/Header.css';

const notificacionesIniciales = [
  { 
    id: 1, 
    tipo: 'vencimiento', 
    titulo: 'Vencimiento Próximo', 
    mensaje: 'El certificado de la actividad ARCA de AgroTech S.A. vence en 15 días.', 
    leido: false, 
    fecha: 'Hoy, 10:30' 
  },
  { 
    id: 2, 
    tipo: 'alerta', 
    titulo: 'Acción Requerida', 
    mensaje: 'El cliente Frigorífico Sur tiene un servicio activo sin cuit vinculado.', 
    leido: false, 
    fecha: 'Ayer, 16:45' 
  },
  { 
    id: 3, 
    tipo: 'info', 
    titulo: 'Servicio Activado', 
    mensaje: 'Se aprobó la asignación de categorías para Lácteos del Valle.', 
    leido: true, 
    fecha: '15 Jun, 09:15' 
  }
];

const Header = () => {
  const [dropdownAbierto, setDropdownAbierto] = useState(false);
  const [notificaciones, setNotificaciones] = useState(notificacionesIniciales);
  const panelRef = useRef(null);

  const noLeidas = notificaciones.filter(n => !n.leido).length;

  useEffect(() => {
    const handleClickFuera = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setDropdownAbierto(false);
      }
    };
    document.addEventListener('mousedown', handleClickFuera);
    return () => document.removeEventListener('mousedown', handleClickFuera);
  }, []);

  const marcarTodasComoLeidas = () => {
    setNotificaciones(notificaciones.map(n => ({ ...n, leido: true })));
  };

  const getIcono = (tipo) => {
    switch (tipo) {
      case 'vencimiento': return <span className="icono-noti icono-vencimiento">⏳</span>;
      case 'alerta': return <span className="icono-noti icono-alerta">⚠️</span>;
      case 'info': return <span className="icono-noti icono-info">ℹ️</span>;
      default: return <span className="icono-noti">🔔</span>;
    }
  };

  return (
    <header className="topbar-container" ref={panelRef}>
      <div className="topbar-der">
        
        {/* CAMPANITA */}
        <div className="notificaciones-wrapper">
          <button className="btn-campana" onClick={() => setDropdownAbierto(!dropdownAbierto)}>
            🔔
            {noLeidas > 0 && <span className="badge-no-leido">{noLeidas}</span>}
          </button>

          {dropdownAbierto && (
            <div className="panel-desplegable">
              <div className="panel-header">
                <h3>Notificaciones y Alertas</h3>
                {noLeidas > 0 && (
                  <button className="btn-marcar-leido" onClick={marcarTodasComoLeidas}>
                    Marcar todo leído
                  </button>
                )}
              </div>

              <ul className="lista-notificaciones">
                {notificaciones.length > 0 ? (
                  notificaciones.map((noti) => (
                    <li key={noti.id} className={`item-notificacion ${!noti.leido ? 'no-leido' : ''}`}>
                      {getIcono(noti.tipo)}
                      <div className="noti-contenido">
                        <p className="noti-titulo">{noti.titulo}</p>
                        <p className="noti-mensaje">{noti.mensaje}</p>
                        <span className="noti-fecha">{noti.fecha}</span>
                      </div>
                    </li>
                  ))
                ) : (
                  <div className="panel-vacio">No hay alertas pendientes.</div>
                )}
              </ul>
            </div>
          )}
        </div>

        {/* PERFIL DE USUARIO */}
        <div className="user-profile">
          <div className="avatar">PM</div>
          <div className="user-info">
            <span className="user-name">Project Manager</span>
            <span className="user-role">Administrador</span>
          </div>
        </div>

      </div>
    </header>
  );
};

export default Header;