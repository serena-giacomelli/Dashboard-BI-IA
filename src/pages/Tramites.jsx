import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../utils/supabase.js';

export default function Tramites() {
  const [tramites, setTramites] = useState([]);
  const [cargando, setCargando] = useState(true);
  
  const [editandoId, setEditandoId] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [formData, setFormData] = useState(null);

  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 10;

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    setPaginaActual(1);
  }, [filtroTexto, filtroEstado]);

  async function cargarDatos() {
    try {
      setCargando(true);
      const { data, error } = await supabase
        .from('tramite')
        .select(`
          id,
          nombre,
          created_at,
          estado,
          observaciones,
          tramite_presupuesto ( presupuesto ( id, tipo, clientes ( razon_social ) ) ),
          tramite_servicio ( servicio ( id, nombre ) )
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

  const eliminarTramite = async (id) => {
    if (window.confirm('¿Seguro querés eliminar este trámite?')) {
      const { error } = await supabase.from('tramite').delete().eq('id', id);
      if (error) {
        console.error("Error al eliminar trámite:", error);
        alert('Hubo un error al eliminar el trámite.');
        return;
      }
      setTramites(tramites.filter(t => t.id !== id));
    }
  };

  const iniciarEdicion = (tram) => {
    setEditandoId(tram.id);
    setFormData({
      id: tram.id,
      nombre: tram.nombre || '',
      created_at: tram.created_at ? tram.created_at.split('T')[0] : '',
      estado: tram.estado || 'Pendiente',
      observaciones: tram.observaciones || '',
      tramite_presupuesto: tram.tramite_presupuesto || [],
      tramite_servicio: tram.tramite_servicio || []
    });
  };

  const manejarCambioInput = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const guardarCambios = async (e) => {
    e.preventDefault();
    setGuardando(true);

    try {
      const payload = {
        nombre: formData.nombre,
        estado: formData.estado,
        observaciones: formData.observaciones
      };

      if (formData.created_at) {
        payload.created_at = new Date(formData.created_at).toISOString();
      }

      const { error } = await supabase
        .from('tramite')
        .update(payload)
        .eq('id', formData.id);

      if (error) throw error;
      
      setEditandoId(null);
      setFormData(null);
      cargarDatos();
      alert('Trámite actualizado con éxito.');
    } catch (error) {
      console.error("Error al actualizar trámite:", error);
      alert('Hubo un error al guardar los cambios.');
    } finally {
      setGuardando(false);
    }
  };

  const tramitesFiltrados = tramites.filter((tram) => {
    const coincideTexto = !filtroTexto || 
      tram.id.toString().includes(filtroTexto) || 
      (tram.nombre || '').toLowerCase().includes(filtroTexto.toLowerCase());
      
    const coincideEstado = !filtroEstado || tram.estado === filtroEstado;
    
    return coincideTexto && coincideEstado;
  });

  const indiceUltimoItem = paginaActual * itemsPorPagina;
  const indicePrimerItem = indiceUltimoItem - itemsPorPagina;
  const tramitesPaginados = tramitesFiltrados.slice(indicePrimerItem, indiceUltimoItem);
  const totalPaginas = Math.ceil(tramitesFiltrados.length / itemsPorPagina);

  if (cargando) {
    return <div style={{ padding: '24px' }}>Cargando trámites...</div>;
  }

  return (
    <div className="cifas-card">
      
      {!editandoId && (
        <>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <p className="cifas-card__titulo">Gestión Operativa</p>
              <h2 className="cifas-card__main-name">Trámites</h2>
            </div>
            <Link to="/tramites/nuevo">
              <button className="cifas-btn cifas-btn--primary">+ Nuevo Trámite</button>
            </Link>
          </header>

          <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
            <div style={{ flex: '1', minWidth: '250px' }}>
              <input 
                type="text" 
                placeholder="Buscar trámite por ID o Nombre..." 
                className="cifas-input" 
                value={filtroTexto}
                onChange={(e) => setFiltroTexto(e.target.value)}
                style={{ margin: 0, backgroundColor: '#fff' }}
              />
            </div>
            <div style={{ width: '220px' }}>
              <select 
                className="cifas-select" 
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                style={{ margin: 0, backgroundColor: '#fff' }}
              >
                <option value="">Todos los Estados</option>
                <option value="Pendiente">Pendiente</option>
                <option value="En Proceso">En Proceso</option>
                <option value="Observado">Observado</option>
                <option value="Finalizado">Finalizado</option>
              </select>
            </div>
            {(filtroTexto || filtroEstado) && (
              <button 
                onClick={() => { setFiltroTexto(''); setFiltroEstado(''); }} 
                className="cifas-btn cifas-btn--secondary"
                style={{ whiteSpace: 'nowrap' }}
              >
                Limpiar Filtros
              </button>
            )}
          </div>

          {/* CONTROLES DE PAGINACIÓN - MOVIDOS ARRIBA */}
          {tramitesFiltrados.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', fontSize: '13px', color: '#64748b' }}>
              <span>
                Mostrando {indicePrimerItem + 1} a {Math.min(indiceUltimoItem, tramitesFiltrados.length)} de {tramitesFiltrados.length} trámites
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => setPaginaActual(p => Math.max(1, p - 1))} 
                  disabled={paginaActual === 1}
                  className="cifas-btn cifas-btn--secondary"
                  style={{ padding: '4px 12px' }}
                >
                  Anterior
                </button>
                <span style={{ padding: '4px 8px', fontWeight: 'bold', color: '#0f172a' }}>{paginaActual} / {totalPaginas}</span>
                <button 
                  onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))} 
                  disabled={paginaActual === totalPaginas}
                  className="cifas-btn cifas-btn--secondary"
                  style={{ padding: '4px 12px' }}
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}

          <div className="cifas-table-wrap">
            <table className="cifas-table">
              <thead>
                <tr>
                  <th>ID Trámite</th>
                  <th>Nombre del Trámite</th>
                  <th>Presupuesto Asoc.</th>
                  <th>Servicios Vinculados</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {tramitesPaginados.length > 0 ? (
                  tramitesPaginados.map((tram) => {
                    const primerPresupuestoInfo = tram.tramite_presupuesto?.[0]?.presupuesto;
                    
                    let presupuestoTipo = 'Sin presupuesto'; 
                    if (primerPresupuestoInfo) {
                      const tipo = primerPresupuestoInfo.tipo || 'Sin tipo';
                      presupuestoTipo = `ID: ${primerPresupuestoInfo.id} - ${tipo}`;
                    }
                    if (tram.tramite_presupuesto?.length > 1) {
                        presupuestoTipo += ` (+${tram.tramite_presupuesto.length - 1})`;
                    }
                    
                    return (
                      <tr key={tram.id}>
                        <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{tram.id}</td>
                        <td style={{ fontWeight: '600', color: '#1e293b' }}>{tram.nombre}</td>
                        <td style={{ fontSize: '13px' }}>{presupuestoTipo}</td>
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
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <button 
                            onClick={() => iniciarEdicion(tram)} 
                            className="cifas-btn cifas-btn--secondary" 
                            style={{ padding: '6px 12px', fontSize: '11px', marginRight: '8px' }}
                          >
                            Editar
                          </button>
                          <button 
                            onClick={() => eliminarTramite(tram.id)} 
                            className="cifas-btn cifas-btn--pdf" 
                            style={{ padding: '6px 12px', fontSize: '11px' }}
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="cifas-table-empty">
                      No se encontraron trámites con esos filtros.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {editandoId && formData && (
        <>
          <header style={{ marginBottom: '24px' }}>
            <p className="cifas-card__titulo">Gestión Operativa</p>
            <h2 className="cifas-card__main-name">Editar Trámite #{formData.id}</h2>
          </header>

          <form onSubmit={guardarCambios}>
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#334155', textTransform: 'uppercase', borderBottom: '1px solid #cbd5e1', paddingBottom: '12px', marginBottom: '16px' }}>
                Datos Principales
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                
                <label className="cifas-field">
                  <span>Nombre del Trámite</span>
                  <input type="text" name="nombre" value={formData.nombre} onChange={manejarCambioInput} className="cifas-input" required />
                </label>

                <label className="cifas-field">
                  <span>Fecha de Creación</span>
                  <input type="date" name="created_at" value={formData.created_at} onChange={manejarCambioInput} className="cifas-input" required />
                </label>

                <label className="cifas-field">
                  <span>Estado del Trámite</span>
                  <select name="estado" value={formData.estado} onChange={manejarCambioInput} className="cifas-select">
                    <option value="Pendiente">Pendiente</option>
                    <option value="En Proceso">En Proceso</option>
                    <option value="Observado">Observado</option>
                    <option value="Finalizado">Finalizado</option>
                  </select>
                </label>

              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#334155', textTransform: 'uppercase', borderBottom: '1px solid #cbd5e1', paddingBottom: '12px', marginBottom: '16px' }}>
                Notas y Observaciones
              </h3>
              <label className="cifas-field">
                <span>Observaciones Internas</span>
                <textarea 
                  name="observaciones" 
                  value={formData.observaciones} 
                  onChange={manejarCambioInput} 
                  className="cifas-input" 
                  rows="3" 
                  style={{ resize: 'vertical' }} 
                  placeholder="Detalles sobre el estado del trámite en el organismo, trabas, etc..."
                ></textarea>
              </label>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#334155', textTransform: 'uppercase', borderBottom: '1px solid #cbd5e1', paddingBottom: '12px', marginBottom: '16px' }}>
                Relaciones (Solo Lectura)
              </h3>
              
              <div style={{ marginBottom: '16px' }}>
                <span className="cifas-field"><span>Presupuestos Asociados</span></span>
                <div className="cifas-chips">
                  {formData.tramite_presupuesto.length > 0 ? (
                    formData.tramite_presupuesto.map((tp, idx) => {
                      const presu = tp.presupuesto;
                      const cliente = presu?.clientes?.razon_social || 'Sin cliente';
                      return (
                        <span key={idx} className="cifas-chip" style={{ background: '#f8fafc', border: '1px solid #cbd5e1' }}>
                          ID: {presu?.id} - {presu?.tipo} ({cliente})
                        </span>
                      );
                    })
                  ) : (
                    <span style={{ color: '#94a3b8', fontSize: '13px' }}>Sin presupuestos vinculados.</span>
                  )}
                </div>
              </div>

              <div>
                <span className="cifas-field"><span>Servicios Vinculados</span></span>
                <div className="cifas-chips">
                  {formData.tramite_servicio.length > 0 ? (
                    formData.tramite_servicio.map((ts, idx) => (
                      <span key={idx} className="cifas-chip" style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>
                        {ts.servicio?.nombre}
                      </span>
                    ))
                  ) : (
                    <span style={{ color: '#94a3b8', fontSize: '13px' }}>Sin servicios vinculados.</span>
                  )}
                </div>
              </div>

            </div>

            <div className="cifas-btn-group" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
              <button 
                type="button" 
                onClick={() => { setEditandoId(null); setFormData(null); }} 
                className="cifas-btn cifas-btn--secondary"
              >
                Cancelar
              </button>
              <button type="submit" disabled={guardando} className="cifas-btn cifas-btn--primary">
                {guardando ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}