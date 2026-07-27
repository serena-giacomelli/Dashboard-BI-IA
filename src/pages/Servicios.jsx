import { useState } from 'react';
import { supabase } from '../utils/supabase';
import { useCatalogos } from '../hooks/useCatalogos';
import '../styles/Global.css';

const Servicios = ({ servicios, setServicios }) => {
  const { arca: actividadesArca } = useCatalogos();
  const actividadesDisponibles = (actividadesArca || []).map(a => ({ codigo: a.codigo, descripcion: a.nombre }));
  
  const [editandoId, setEditandoId] = useState(null);
  const [busquedaArca, setBusquedaArca] = useState('');
  
  const [formData, setFormData] = useState({
    id_servicio: '',
    nombre: '',
    categoria: 'Regulaciones',
    modalidad: 'Por Proyecto',
    presupuesto: '',
    tramite: '',
    actividadesArca: [],
    descripcion: ''
  });

  const actividadesFiltradas = actividadesDisponibles.filter(act =>
    act.codigo.includes(busquedaArca) ||
    act.descripcion.toLowerCase().includes(busquedaArca.toLowerCase())
  );

  const iniciarNuevo = () => {
    setEditandoId('nuevo');
    setBusquedaArca('');
    setFormData({
      id_servicio: '',
      nombre: '', 
      categoria: 'Regulaciones', 
      modalidad: 'Por Proyecto', 
      presupuesto: '',
      tramite: '',
      actividadesArca: [],
      descripcion: ''
    });
  };

  const iniciarEditar = (servicio) => {
    setEditandoId(servicio.id);
    setBusquedaArca('');
    setFormData({
      id_servicio: servicio.id_servicio || '',
      nombre: servicio.nombre || servicio.servicio || '',
      categoria: servicio.categoria || 'Regulaciones',
      modalidad: servicio.modalidad || 'Por Proyecto',
      presupuesto: servicio.presupuesto || '',
      tramite: servicio.tramite || '',
      actividadesArca: servicio.actividades_arca || servicio.actividadesArca || [],
      descripcion: servicio.descripcion || ''
    });
  };

  const eliminarServicio = async (id) => {
    if (window.confirm('¿Seguro querés eliminar este servicio del portfolio comercial?')) {
      const { error } = await supabase.from('servicio').delete().eq('id', id);
      if (error) {
        console.error("Error al eliminar servicio:", error);
        alert('Hubo un error al eliminar el servicio.');
        return;
      }
      setServicios(servicios.filter(s => s.id !== id));
    }
  };

  const manejarCambioInput = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const manejarSeleccionArca = (e) => {
    const codigoSeleccionado = e.target.value;
    if (!codigoSeleccionado) return;
    setFormData(prev => {
      if (prev.actividadesArca.includes(codigoSeleccionado)) return prev;
      return { ...prev, actividadesArca: [...prev.actividadesArca, codigoSeleccionado] };
    });
    setBusquedaArca('');
    e.target.value = '';
  };

  const removerActividadArca = (codigo) => {
    setFormData(prev => ({
      ...prev,
      actividadesArca: prev.actividadesArca.filter(c => c !== codigo)
    }));
  };

  const guardarServicio = async (e) => {
    e.preventDefault();

    const payload = {
      id_servicio: formData.id_servicio,
      nombre: formData.nombre,
      categoria: formData.categoria,
      modalidad: formData.modalidad,
      presupuesto: formData.presupuesto ? parseFloat(formData.presupuesto) : null,
      tramite: formData.tramite,
      actividades_arca: formData.actividadesArca,
      descripcion: formData.descripcion
    };

    if (editandoId === 'nuevo') {
      const { data, error } = await supabase.from('servicio').insert([payload]).select();
      
      if (error) {
        console.error("Error insertando servicio:", error);
        alert('Error al crear el servicio en la base de datos.');
        return;
      }
      setServicios([...servicios, { ...payload, id: data[0].id }]);
    } else {
      const { error } = await supabase.from('servicio').update(payload).eq('id', editandoId);
      
      if (error) {
        console.error("Error actualizando servicio:", error);
        alert('Error al actualizar el servicio en la base de datos.');
        return;
      }
      setServicios(servicios.map(s => s.id === editandoId ? { ...s, ...payload } : s));
    }
    
    setEditandoId(null);
  };

  return (
    <>
      {!editandoId && (
        <div className="cifas-card">
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <p className="cifas-card__titulo">Módulo Comercial</p>
              <h2 className="cifas-card__main-name">Servicios</h2>
            </div>
            <button onClick={iniciarNuevo} className="cifas-btn cifas-btn--primary">
              + Crear Servicio
            </button>
          </header>

          <div className="cifas-table-wrap">
            <table className="cifas-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Servicio</th>
                  <th>Descripción</th>
                  <th>Actividades ARCA</th>
                  <th>Categoría</th>
                  <th>Modalidad</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {servicios.map((servicio) => (
                  <tr key={servicio.id}>
                    <td style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                      {servicio.id_servicio || '-'}
                    </td>
                    <td style={{ fontWeight: '600', color: '#1e293b' }}>
                      {servicio.nombre || servicio.servicio}
                    </td>
                    <td style={{ color: '#475569', lineHeight: '1.5', maxWidth: '300px' }}>
                      {servicio.descripcion}
                    </td>
                    <td>
                      <div className="cifas-chips">
                        {((servicio.actividades_arca || servicio.actividadesArca) || []).map(cod => (
                          <span key={cod} className="cifas-chip" style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>
                            {cod}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span className="cifas-chip" style={{ background: '#eff6ff', color: '#2563eb', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.3px', fontSize: '10px' }}>
                        {servicio.categoria}
                      </span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>{servicio.modalidad}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <button onClick={() => iniciarEditar(servicio)} className="cifas-btn cifas-btn--secondary" style={{ padding: '6px 12px', fontSize: '11px', marginRight: '8px' }}>
                        Editar
                      </button>
                      <button onClick={() => eliminarServicio(servicio.id)} className="cifas-btn cifas-btn--pdf" style={{ padding: '6px 12px', fontSize: '11px' }}>
                        Borrar
                      </button>
                    </td>
                  </tr>
                ))}
                {servicios.length === 0 && (
                  <tr>
                    <td colSpan="7" className="cifas-table-empty">
                      No hay servicios registrados en el portfolio.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editandoId && (
        <div className="cifas-card">
          <header style={{ marginBottom: '20px' }}>
            <p className="cifas-card__titulo">Módulo Comercial</p>
            <h2 className="cifas-card__main-name">
              {editandoId === 'nuevo' ? 'Añadir Nuevo Servicio' : 'Modificar Servicio'}
            </h2>
          </header>

          <form onSubmit={guardarServicio}>
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#334155', textTransform: 'uppercase', borderBottom: '1px solid #cbd5e1', paddingBottom: '12px', marginBottom: '16px' }}>
                Información Principal
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
                <label className="cifas-field">
                  <span>Código / ID Interno</span>
                  <input type="text" name="id_servicio" value={formData.id_servicio} onChange={manejarCambioInput} required className="cifas-input" placeholder="Ej: SRV-001" />
                </label>
                <label className="cifas-field">
                  <span>Nombre del Servicio</span>
                  <input type="text" name="nombre" value={formData.nombre} onChange={manejarCambioInput} required className="cifas-input" />
                </label>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#334155', textTransform: 'uppercase', borderBottom: '1px solid #cbd5e1', paddingBottom: '12px', marginBottom: '16px' }}>
                Datos Comerciales
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <label className="cifas-field">
                  <span>Categoría</span>
                  <select name="categoria" value={formData.categoria} onChange={manejarCambioInput} className="cifas-select">
                    <option value="Regulaciones">Regulaciones / Habilitaciones</option>
                    <option value="Ingeniería">Ingeniería & Termomecánica</option>
                    <option value="Calidad">Calidad & Inocuidad</option>
                    <option value="Estrategia">Gestión Estratégica</option>
                  </select>
                </label>
                <label className="cifas-field">
                  <span>Modalidad</span>
                  <select name="modalidad" value={formData.modalidad} onChange={manejarCambioInput} className="cifas-select">
                    <option value="Por Proyecto">Por Hito / Proyecto Cerrado</option>
                    <option value="Por Hora">Por Hora de Consultoría</option>
                  </select>
                </label>
                <label className="cifas-field">
                  <span>Honorarios Base ($)</span>
                  <input type="number" name="presupuesto" value={formData.presupuesto} onChange={manejarCambioInput} className="cifas-input" placeholder="0.00" />
                </label>
                <label className="cifas-field">
                  <span>Trámite Asociado</span>
                  <input type="text" name="tramite" value={formData.tramite} onChange={manejarCambioInput} className="cifas-input" placeholder="Ej: Inscripción RNPA" />
                </label>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#334155', textTransform: 'uppercase', borderBottom: '1px solid #cbd5e1', paddingBottom: '12px', marginBottom: '16px' }}>
                Vincular Actividades Oficiales ARCA (CLAE)
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <input
                  type="text"
                  placeholder="Filtrar por código o nombre..."
                  value={busquedaArca}
                  onChange={(e) => setBusquedaArca(e.target.value)}
                  className="cifas-input"
                  style={{ backgroundColor: '#fff' }}
                />
                <select onChange={manejarSeleccionArca} defaultValue="" className="cifas-select" style={{ backgroundColor: '#fff' }}>
                  <option value="" disabled>
                    {actividadesFiltradas.length === 0 ? 'No hay coincidencias' : `-- Seleccionar (${actividadesFiltradas.length} encontradas) --`}
                  </option>
                  {actividadesFiltradas.map(act => (
                    <option key={act.codigo} value={act.codigo}>
                      [{act.codigo}] {act.descripcion}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ marginTop: '16px' }}>
                <span className="cifas-field">
                  <span>Actividades seleccionadas para este servicio:</span>
                </span>
                <div className="cifas-chips">
                  {formData.actividadesArca.length > 0 ? (
                    formData.actividadesArca.map(codigo => {
                      const infoAct = actividadesDisponibles.find(a => a.codigo === codigo);
                      return (
                        <div key={codigo} className="cifas-chip" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <strong style={{ color: '#0f172a' }}>{codigo}</strong>
                          <span>{infoAct ? infoAct.descripcion : ''}</span>
                          <button type="button" onClick={() => removerActividadArca(codigo)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold', padding: '0 4px' }}>
                            ×
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <span className="cifas-helper" style={{ fontStyle: 'italic', marginTop: 0 }}>
                      Ninguna actividad vinculada. Usá el buscador de arriba.
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#334155', textTransform: 'uppercase', borderBottom: '1px solid #cbd5e1', paddingBottom: '12px', marginBottom: '16px' }}>
                Descripción
              </h3>
              <label className="cifas-field">
                <span>Descripción del servicio</span>
                <textarea name="descripcion" value={formData.descripcion} onChange={manejarCambioInput} placeholder="Descripción o alcance del servicio..." required rows="3" className="cifas-input" style={{ resize: 'vertical' }} />
              </label>
            </div>

            <div className="cifas-btn-group" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
              <button type="button" onClick={() => setEditandoId(null)} className="cifas-btn cifas-btn--secondary">
                Cancelar
              </button>
              <button type="submit" className="cifas-btn cifas-btn--primary">
                Guardar Cambios
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default Servicios;