import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../utils/supabase.js';

export default function Presupuestos() {
  const [presupuestos, setPresupuestos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargarPresupuestos() {
      try {
        // ACTUALIZADO: Consultamos los trámites a través de la tabla intermedia 'tramite_presupuesto'
        const { data, error } = await supabase
          .from('presupuesto')
          .select(`
            id,
            tipo,
            created_at,
            clientes ( razon_social ),
            tramite_presupuesto ( 
              tramite ( id, nombre ) 
            )
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        setPresupuestos(data || []);
      } catch (error) {
        console.error("Error cargando presupuestos:", error);
      } finally {
        setCargando(false);
      }
    }

    cargarPresupuestos();
  }, []);

  if (cargando) {
    return <div style={{ padding: '24px' }}>Cargando presupuestos...</div>;
  }

  return (
    <div className="cifas-card"> 
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <p className="cifas-card__titulo">Gestión Comercial</p>
          <h2 className="cifas-card__main-name">Presupuestos</h2>
        </div>
        <Link to="/presupuestos/nuevo">
          <button className="cifas-btn cifas-btn--primary">+ Nuevo Presupuesto</button>
        </Link>
      </header>

      <div className="cifas-table-wrap">
        <table className="cifas-table">
          <thead>
            <tr>
              <th>ID Presupuesto</th>
              <th>Cliente</th>
              <th>Tipo</th>
              <th>Fecha de Creación</th>
              <th>Trámites Asociados</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {presupuestos.length > 0 ? (
              presupuestos.map((presu) => (
                <tr key={presu.id}>
                  {/* El ID ahora es numérico, ya no necesitamos substring(0,8) pero lo dejamos seguro por las dudas */}
                  <td style={{ fontFamily: 'monospace' }}>{presu.id}</td>
                  <td>{presu.clientes?.razon_social || 'Sin cliente'}</td>
                  <td>{presu.tipo}</td>
                  <td>{new Date(presu.created_at).toLocaleDateString('es-AR')}</td>
                  <td>
                    {/* ACTUALIZADO: Iteramos sobre tramite_presupuesto */}
                    {presu.tramite_presupuesto && presu.tramite_presupuesto.length > 0 ? (
                      <div className="cifas-chips">
                        {presu.tramite_presupuesto.map(tp => (
                          <span key={tp.tramite?.id} className="cifas-chip">{tp.tramite?.nombre}</span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Sin trámites</span>
                    )}
                  </td>
                  <td>
                    <Link to={`/presupuestos/${presu.id}`}>
                      <button className="cifas-btn cifas-btn--secondary" style={{ padding: '6px 12px', fontSize: '11px' }}>
                        Ver Detalle
                      </button>
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="cifas-table-empty">
                  No hay presupuestos registrados en el sistema.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}