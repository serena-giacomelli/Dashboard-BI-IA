import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../utils/supabase.js';

export default function Presupuestos() {
  const [presupuestos, setPresupuestos] = useState([]);
  const [clientesDb, setClientesDb] = useState([]);
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
      const { data: presuData, error: presuError } = await supabase
        .from('presupuesto')
        .select(`
          *,
          clientes ( id, razon_social ),
          tramite_presupuesto ( tramite ( id, nombre ) )
        `)
        .order('created_at', { ascending: false });

      if (presuError) throw presuError;
      
      const { data: cliData, error: cliError } = await supabase
        .from('clientes')
        .select('id, razon_social')
        .order('razon_social', { ascending: true });

      if (cliError) throw cliError;

      setPresupuestos(presuData || []);
      setClientesDb(cliData || []);
    } catch (error) {
      console.error("Error cargando presupuestos:", error);
    } finally {
      setCargando(false);
    }
  }

  const eliminarPresupuesto = async (id) => {
    if (window.confirm('¿Seguro querés eliminar este presupuesto?')) {
      const { error } = await supabase.from('presupuesto').delete().eq('id', id);
      if (error) {
        console.error("Error al eliminar presupuesto:", error);
        alert('Hubo un error al eliminar el presupuesto.');
        return;
      }
      setPresupuestos(presupuestos.filter(p => p.id !== id));
    }
  };

  const iniciarEdicion = (presu) => {
    setEditandoId(presu.id);
    setFormData({
      id: presu.id,
      cliente_id: presu.cliente_id || presu.clientes?.id || '', 
      created_at: presu.created_at ? presu.created_at.split('T')[0] : '',
      tipo: presu.tipo || '',
      estado: presu.estado || 'Borrador',
      monto_total: presu.monto_total || '',
      fecha_vencimiento: presu.fecha_vencimiento ? presu.fecha_vencimiento.split('T')[0] : '',
      condiciones_pago: presu.condiciones_pago || '',
      observaciones: presu.observaciones || '',
      tramites_asociados: presu.tramite_presupuesto || [] 
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
        cliente_id: formData.cliente_id || null,
        tipo: formData.tipo,
        estado: formData.estado,
        monto_total: formData.monto_total ? parseFloat(formData.monto_total) : null,
        fecha_vencimiento: formData.fecha_vencimiento || null,
        condiciones_pago: formData.condiciones_pago,
        observaciones: formData.observaciones
      };

      if (formData.created_at) {
        payload.created_at = new Date(formData.created_at).toISOString();
      }

      const { error } = await supabase
        .from('presupuesto')
        .update(payload)
        .eq('id', formData.id);

      if (error) throw error;
      
      setEditandoId(null);
      setFormData(null);
      cargarDatos(); 
      alert('Presupuesto actualizado con éxito.');
    } catch (error) {
      console.error("Error al actualizar:", error);
      alert('Hubo un error al guardar los cambios.');
    } finally {
      setGuardando(false);
    }
  };

  const presupuestosFiltrados = presupuestos.filter((p) => {
    const coincideTexto = !filtroTexto || 
      p.id.toString().includes(filtroTexto) || 
      (p.tipo || '').toLowerCase().includes(filtroTexto.toLowerCase()) ||
      (p.clientes?.razon_social || '').toLowerCase().includes(filtroTexto.toLowerCase());
      
    const coincideEstado = !filtroEstado || p.estado === filtroEstado;
    
    return coincideTexto && coincideEstado;
  });

  const indiceUltimoItem = paginaActual * itemsPorPagina;
  const indicePrimerItem = indiceUltimoItem - itemsPorPagina;
  const presupuestosPaginados = presupuestosFiltrados.slice(indicePrimerItem, indiceUltimoItem);
  const totalPaginas = Math.ceil(presupuestosFiltrados.length / itemsPorPagina);

  if (cargando) {
    return <div style={{ padding: '24px' }}>Cargando datos del módulo comercial...</div>;
  }

  return (
    <div className="cifas-card"> 
      
      {!editandoId && (
        <>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <p className="cifas-card__titulo">Gestión Comercial</p>
              <h2 className="cifas-card__main-name">Presupuestos</h2>
            </div>
            <Link to="/presupuestos/nuevo">
              <button className="cifas-btn cifas-btn--primary">+ Nuevo Presupuesto</button>
            </Link>
          </header>

          <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
            <div style={{ flex: '1', minWidth: '250px' }}>
              <input 
                type="text" 
                placeholder="Buscar por ID, Tipo o Cliente..." 
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
                <option value="Borrador">Borrador</option>
                <option value="Enviado">Enviado</option>
                <option value="Aceptado">Aceptado</option>
                <option value="Rechazado">Rechazado</option>
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
          {presupuestosFiltrados.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', fontSize: '13px', color: '#64748b' }}>
              <span>
                Mostrando {indicePrimerItem + 1} a {Math.min(indiceUltimoItem, presupuestosFiltrados.length)} de {presupuestosFiltrados.length} presupuestos
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
                  <th>ID</th>
                  <th>Tipo</th>
                  <th>Trámites Asociados</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {presupuestosPaginados.length > 0 ? (
                  presupuestosPaginados.map((presu) => (
                    <tr key={presu.id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{presu.id}</td>
                      <td>{presu.tipo}</td>
                      <td>
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
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <button 
                          onClick={() => iniciarEdicion(presu)} 
                          className="cifas-btn cifas-btn--secondary" 
                          style={{ padding: '6px 12px', fontSize: '11px', marginRight: '8px' }}
                        >
                          Editar
                        </button>
                        <button 
                          onClick={() => eliminarPresupuesto(presu.id)} 
                          className="cifas-btn cifas-btn--pdf" 
                          style={{ padding: '6px 12px', fontSize: '11px' }}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="cifas-table-empty">
                      No se encontraron presupuestos.
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
            <p className="cifas-card__titulo">Gestión Comercial</p>
            <h2 className="cifas-card__main-name">Editar Presupuesto #{formData.id}</h2>
          </header>

          <form onSubmit={guardarCambios}>
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#334155', textTransform: 'uppercase', borderBottom: '1px solid #cbd5e1', paddingBottom: '12px', marginBottom: '16px' }}>
                Atributos Principales
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                
                <label className="cifas-field">
                  <span>Cliente (Razón Social)</span>
                  <select name="cliente_id" value={formData.cliente_id} onChange={manejarCambioInput} className="cifas-select" required>
                    <option value="">-- Seleccionar Cliente --</option>
                    {clientesDb.map(cli => (
                      <option key={cli.id} value={cli.id}>{cli.razon_social}</option>
                    ))}
                  </select>
                </label>

                <label className="cifas-field">
                  <span>Fecha de Creación</span>
                  <input type="date" name="created_at" value={formData.created_at} onChange={manejarCambioInput} className="cifas-input" required />
                </label>

                <label className="cifas-field">
                  <span>Tipo de Presupuesto</span>
                  <input type="text" name="tipo" value={formData.tipo} onChange={manejarCambioInput} className="cifas-input" placeholder="Ej: Standard, Express..." />
                </label>
                
                <label className="cifas-field">
                  <span>Estado Administrativo</span>
                  <select name="estado" value={formData.estado} onChange={manejarCambioInput} className="cifas-select">
                    <option value="Borrador">Borrador</option>
                    <option value="Enviado">Enviado</option>
                    <option value="Aceptado">Aceptado</option>
                    <option value="Rechazado">Rechazado</option>
                  </select>
                </label>

              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#334155', textTransform: 'uppercase', borderBottom: '1px solid #cbd5e1', paddingBottom: '12px', marginBottom: '16px' }}>
                Detalles Económicos y Tiempos
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <label className="cifas-field">
                  <span>Monto Total ($)</span>
                  <input type="number" step="0.01" name="monto_total" value={formData.monto_total} onChange={manejarCambioInput} className="cifas-input" placeholder="0.00" />
                </label>
                
                <label className="cifas-field">
                  <span>Fecha de Vencimiento</span>
                  <input type="date" name="fecha_vencimiento" value={formData.fecha_vencimiento} onChange={manejarCambioInput} className="cifas-input" />
                </label>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#334155', textTransform: 'uppercase', borderBottom: '1px solid #cbd5e1', paddingBottom: '12px', marginBottom: '16px' }}>
                Notas y Condiciones
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                <label className="cifas-field">
                  <span>Condiciones de Pago</span>
                  <input type="text" name="condiciones_pago" value={formData.condiciones_pago} onChange={manejarCambioInput} className="cifas-input" placeholder="Ej: 50% anticipo, 50% al finalizar" />
                </label>
                <label className="cifas-field">
                  <span>Observaciones Internas</span>
                  <textarea name="observaciones" value={formData.observaciones} onChange={manejarCambioInput} className="cifas-input" rows="3" style={{ resize: 'vertical' }} placeholder="Observaciones sobre el presupuesto..."></textarea>
                </label>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#334155', textTransform: 'uppercase', borderBottom: '1px solid #cbd5e1', paddingBottom: '12px', marginBottom: '16px' }}>
                Trámites Vinculados
              </h3>
              <div className="cifas-chips">
                {formData.tramites_asociados.length > 0 ? (
                  formData.tramites_asociados.map(tp => (
                    <span key={tp.tramite?.id} className="cifas-chip" style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>
                      {tp.tramite?.nombre}
                    </span>
                  ))
                ) : (
                  <span style={{ color: '#94a3b8', fontSize: '13px' }}>No hay trámites vinculados a este presupuesto.</span>
                )}
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