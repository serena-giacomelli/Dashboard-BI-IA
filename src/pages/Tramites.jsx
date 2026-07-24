import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../utils/supabase.js';

export default function Tramites() {
  const [tramites, setTramites] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargarTramites() {
      try {
        // Hacemos el fetch de los trámites con toda su info anidada
        const { data, error } = await supabase
          .from('tramite')
          .select(`
            id,
            nombre,
            created_at,
            presupuesto (
              id,
              tipo,
              clientes (
                razon_social
              )
            ),
            tramite_servicio (
              servicio (
                id,
                nombre
              )
            )
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        setTramites(data || []);
      } catch (error) {
        console.error("Error cargando trámites:", error);
      } finally {
        setCargando(false);
      }
    }

    cargarTramites();
  }, []);

  if (cargando) {
    return <div style={{ padding: '24px' }}>Cargando trámites...</div>;
  }

  return (
    <div className="cifas-card">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <p className="cifas-card__titulo">Gestión Operativa</p>
          <h2 className="cifas-card__main-name">Trámites</h2>
        </div>
        <Link to="/tramites/nuevo">
          <button className="cifas-btn cifas-btn--primary">+ Nuevo Trámite</button>
        </Link>
      </header>

      <div className="cifas-table-wrap">
        <table className="cifas-table">
          <thead>
            <tr>
              <th>ID Trámite</th>
              <th>Nombre del Trámite</th>
              <th>Cliente</th>
              <th>Presupuesto Asoc.</th>
              <th>Servicios Vinculados</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {tramites.length > 0 ? (
              tramites.map((tram) => {
                // Extraemos la información de forma segura por si algún dato es null
                const clienteNombre = tram.presupuesto?.clientes?.razon_social || 'Sin asignar';
                const presupuestoTipo = tram.presupuesto?.tipo || 'N/A';
                
                return (
                  <tr key={tram.id}>
                    <td style={{ fontFamily: 'monospace' }}>{tram.id.substring(0, 8)}</td>
                    <td style={{ fontWeight: '600', color: '#1e293b' }}>{tram.nombre}</td>
                    <td>{clienteNombre}</td>
                    <td>{presupuestoTipo}</td>
                    <td>
                      {tram.tramite_servicio && tram.tramite_servicio.length > 0 ? (
                        <div className="cifas-chips">
                          {tram.tramite_servicio.map(ts => (
                            <span key={ts.servicio.id} className="cifas-chip">
                              {ts.servicio.nombre}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Sin servicios</span>
                      )}
                    </td>
                    <td>{new Date(tram.created_at).toLocaleDateString('es-AR')}</td>
                    <td>
                      <Link to={`/tramites/${tram.id}`}>
                        <button className="cifas-btn cifas-btn--secondary" style={{ padding: '6px 12px', fontSize: '11px' }}>
                          Ver Detalle
                        </button>
                      </Link>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="cifas-table-empty">
                  No hay trámites registrados en el sistema.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}