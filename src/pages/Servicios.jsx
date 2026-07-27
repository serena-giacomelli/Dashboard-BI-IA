import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { useCatalogos } from '../hooks/useCatalogos';
import '../styles/Global.css';

const Servicios = ({ servicios, setServicios }) => {
  const { arca: actividadesArca } = useCatalogos();
  const actividadesDisponibles = (actividadesArca || []).map(a => ({ codigo: a.codigo, descripcion: a.nombre }));
  
  const [editandoId, setEditandoId] = useState(null);
  const [busquedaArca, setBusquedaArca] = useState('');
  const [tabActiva, setTabActiva] = useState('Observaciones Internas');
  
  const [formData, setFormData] = useState({
    id_servicio: '',
    nombre: '',
    usuario_asignado: '',
    estado: '4. En Curso',
    fecha_inicio: '',
    fecha_fin: '',
    contacto_cliente: '',
    contacto_organismo: '',
    director_tecnico: '',
    nro_expediente: '',
    nombre_expediente: '',
    fecha_notificacion: '',
    fecha_vto_registro: '',
    nro_expediente_sec: '',
    nombre_expediente_sec: '',
    marca: '',
    nro_registro: '',
    establecimiento: '',
    categoria: 'Regulaciones',
    modalidad: 'Por Proyecto',
    presupuesto: '',
    tramite: '',
    actividadesArca: [],
    descripcion: ''
  });

  // Filtros y Paginación para el listado
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 10;

  useEffect(() => {
    setPaginaActual(1);
  }, [filtroTexto, filtroCategoria]);

  const actividadesFiltradas = actividadesDisponibles.filter(act =>
    act.codigo.includes(busquedaArca) ||
    act.descripcion.toLowerCase().includes(busquedaArca.toLowerCase())
  );

  const iniciarNuevo = () => {
    setEditandoId('nuevo');
    setBusquedaArca('');
    setTabActiva('Observaciones Internas');
    setFormData({
      id_servicio: '',
      nombre: '', 
      usuario_asignado: '',
      estado: '4. En Curso',
      fecha_inicio: '',
      fecha_fin: '',
      contacto_cliente: '',
      contacto_organismo: '',
      director_tecnico: '',
      nro_expediente: '',
      nombre_expediente: '',
      fecha_notificacion: '',
      fecha_vto_registro: '',
      nro_expediente_sec: '',
      nombre_expediente_sec: '',
      marca: '',
      nro_registro: '',
      establecimiento: '',
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
    setTabActiva('Observaciones Internas');
    setFormData({
      id_servicio: servicio.id_servicio || '',
      nombre: servicio.nombre || servicio.servicio || '',
      usuario_asignado: servicio.usuario_asignado || '',
      estado: servicio.estado || '4. En Curso',
      fecha_inicio: servicio.fecha_inicio || '',
      fecha_fin: servicio.fecha_fin || '',
      contacto_cliente: servicio.contacto_cliente || '',
      contacto_organismo: servicio.contacto_organismo || '',
      director_tecnico: servicio.director_tecnico || '',
      nro_expediente: servicio.nro_expediente || '',
      nombre_expediente: servicio.nombre_expediente || '',
      fecha_notificacion: servicio.fecha_notificacion || '',
      fecha_vto_registro: servicio.fecha_vto_registro || '',
      nro_expediente_sec: servicio.nro_expediente_sec || '',
      nombre_expediente_sec: servicio.nombre_expediente_sec || '',
      marca: servicio.marca || '',
      nro_registro: servicio.nro_registro || '',
      establecimiento: servicio.establecimiento || '',
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
      usuario_asignado: formData.usuario_asignado,
      estado: formData.estado,
      fecha_inicio: formData.fecha_inicio,
      fecha_fin: formData.fecha_fin,
      contacto_cliente: formData.contacto_cliente,
      contacto_organismo: formData.contacto_organismo,
      director_tecnico: formData.director_tecnico,
      nro_expediente: formData.nro_expediente,
      nombre_expediente: formData.nombre_expediente,
      fecha_notificacion: formData.fecha_notificacion,
      fecha_vto_registro: formData.fecha_vto_registro,
      nro_expediente_sec: formData.nro_expediente_sec,
      nombre_expediente_sec: formData.nombre_expediente_sec,
      marca: formData.marca,
      nro_registro: formData.nro_registro,
      establecimiento: formData.establecimiento,
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

  const serviciosFiltrados = servicios.filter((s) => {
    const searchString = `${s.id_servicio || ''} ${s.nombre || s.servicio || ''}`.toLowerCase();
    const coincideTexto = !filtroTexto || searchString.includes(filtroTexto.toLowerCase());
    const coincideCategoria = !filtroCategoria || s.categoria === filtroCategoria;
    
    return coincideTexto && coincideCategoria;
  });

  const indiceUltimoItem = paginaActual * itemsPorPagina;
  const indicePrimerItem = indiceUltimoItem - itemsPorPagina;
  const serviciosPaginados = serviciosFiltrados.slice(indicePrimerItem, indiceUltimoItem);
  const totalPaginas = Math.ceil(serviciosFiltrados.length / itemsPorPagina);

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

          <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
            <div style={{ flex: '1', minWidth: '250px' }}>
              <input 
                type="text" 
                placeholder="Buscar por ID o Nombre del servicio..." 
                className="cifas-input" 
                value={filtroTexto}
                onChange={(e) => setFiltroTexto(e.target.value)}
                style={{ margin: 0, backgroundColor: '#fff' }}
              />
            </div>
            <div style={{ width: '220px' }}>
              <select 
                className="cifas-select" 
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                style={{ margin: 0, backgroundColor: '#fff' }}
              >
                <option value="">Todas las Categorías</option>
                <option value="Regulaciones">Regulaciones / Habilitaciones</option>
                <option value="Ingeniería">Ingeniería & Termomecánica</option>
                <option value="Calidad">Calidad & Inocuidad</option>
                <option value="Estrategia">Gestión Estratégica</option>
              </select>
            </div>
            {(filtroTexto || filtroCategoria) && (
              <button 
                onClick={() => { setFiltroTexto(''); setFiltroCategoria(''); }} 
                className="cifas-btn cifas-btn--secondary"
                style={{ whiteSpace: 'nowrap' }}
              >
                Limpiar Filtros
              </button>
            )}
          </div>

          {serviciosFiltrados.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', fontSize: '13px', color: '#64748b' }}>
              <span>
                Mostrando {indicePrimerItem + 1} a {Math.min(indiceUltimoItem, serviciosFiltrados.length)} de {serviciosFiltrados.length} servicios
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
                  <th>Servicio</th>
                  <th>Descripción</th>
                  <th>Actividades ARCA</th>
                  <th>Categoría</th>
                  <th>Modalidad</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {serviciosPaginados.map((servicio) => (
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
                {serviciosFiltrados.length === 0 && (
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
        <div className="cifas-card" style={{ maxWidth: '1400px', margin: '0 auto' }}>
          
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
            <div>
              <p className="cifas-card__titulo">Módulo Comercial</p>
              <h2 className="cifas-card__main-name" style={{ fontSize: '20px', color: '#1e3a8a' }}>
                {editandoId === 'nuevo' ? 'Añadir Nuevo Servicio' : `Editar Servicio — N° ${editandoId}`}
              </h2>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" onClick={() => setEditandoId(null)} className="cifas-btn cifas-btn--secondary">
                ← Volver
              </button>
              <button type="submit" form="form-servicio" className="cifas-btn cifas-btn--primary">
                Guardar cambios
              </button>
            </div>
          </header>

          <form id="form-servicio" onSubmit={guardarServicio}>
            
            {/* INFORMACIÓN PRINCIPAL */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '12px' }}>
                Información Principal
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 2fr 1.5fr 1fr 1fr', gap: '16px' }}>
                <label className="cifas-field">
                  <span>Código / ID Interno</span>
                  <input type="text" name="id_servicio" value={formData.id_servicio} onChange={manejarCambioInput} required className="cifas-input" placeholder="Ej: SRV-001" />
                </label>
                <label className="cifas-field">
                  <span>Nombre del Servicio</span>
                  <input type="text" name="nombre" value={formData.nombre} onChange={manejarCambioInput} required className="cifas-input" />
                </label>
                <label className="cifas-field">
                  <span>Usuario Asignado</span>
                  <input type="text" name="usuario_asignado" value={formData.usuario_asignado} onChange={manejarCambioInput} className="cifas-input" />
                </label>
                <label className="cifas-field">
                  <span>Fecha Inicio</span>
                  <input type="date" name="fecha_inicio" value={formData.fecha_inicio} onChange={manejarCambioInput} className="cifas-input" />
                </label>
                <label className="cifas-field">
                  <span>Fecha Fin</span>
                  <input type="date" name="fecha_fin" value={formData.fecha_fin} onChange={manejarCambioInput} className="cifas-input" />
                </label>
              </div>
            </div>

            {/* DATOS COMERCIALES Y ESTADO */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '12px' }}>
                Datos Comerciales y Estado
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
                  <span>Estado del Servicio</span>
                  <select name="estado" value={formData.estado} onChange={manejarCambioInput} className="cifas-select">
                    <option value="1. Pendiente de asignacion">1. Pendiente de asignacion</option>
                    <option value="4. En Curso">4. En Curso</option>
                    <option value="6. Presentada">6. Presentada</option>
                    <option value="10. Finalizada">10. Finalizada</option>
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

            {/* CONTACTOS Y DIRECTOR TÉCNICO */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '12px' }}>
                Contactos y Director Técnico
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr auto', gap: '16px', alignItems: 'flex-end' }}>
                <label className="cifas-field">
                  <span>Contacto Cliente</span>
                  <input type="text" name="contacto_cliente" value={formData.contacto_cliente} onChange={manejarCambioInput} className="cifas-input" />
                </label>
                <label className="cifas-field">
                  <span>Contacto Organismo</span>
                  <input type="text" name="contacto_organismo" value={formData.contacto_organismo} onChange={manejarCambioInput} className="cifas-input" />
                </label>
                <label className="cifas-field">
                  <span>Director Técnico</span>
                  <input type="text" name="director_tecnico" value={formData.director_tecnico} onChange={manejarCambioInput} className="cifas-input" placeholder="Buscar por nombre..." />
                </label>
                <button type="button" className="cifas-btn cifas-btn--secondary" style={{ height: '38px', whiteSpace: 'nowrap' }}>
                  Ver Director Técnico →
                </button>
              </div>
            </div>

            {/* EXPEDIENTE PRINCIPAL */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '12px' }}>
                Expediente Principal
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr', gap: '16px' }}>
                <label className="cifas-field">
                  <span>Nº Expediente</span>
                  <input type="text" name="nro_expediente" value={formData.nro_expediente} onChange={manejarCambioInput} className="cifas-input" />
                </label>
                <label className="cifas-field">
                  <span>Nombre Expediente</span>
                  <input type="text" name="nombre_expediente" value={formData.nombre_expediente} onChange={manejarCambioInput} className="cifas-input" />
                </label>
                <label className="cifas-field">
                  <span>Fecha Notificación Requeridos</span>
                  <input type="date" name="fecha_notificacion" value={formData.fecha_notificacion} onChange={manejarCambioInput} className="cifas-input" />
                </label>
                <label className="cifas-field">
                  <span>Fecha Vto Registro</span>
                  <input type="date" name="fecha_vto_registro" value={formData.fecha_vto_registro} onChange={manejarCambioInput} className="cifas-input" />
                </label>
              </div>
            </div>

            {/* EXPEDIENTE SECUNDARIO */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '12px' }}>
                Expediente Secundario
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr', gap: '16px' }}>
                <label className="cifas-field">
                  <span>Nº Expediente Secundario</span>
                  <input type="text" name="nro_expediente_sec" value={formData.nro_expediente_sec} onChange={manejarCambioInput} className="cifas-input" />
                </label>
                <label className="cifas-field">
                  <span>Nombre Expediente Secundario</span>
                  <input type="text" name="nombre_expediente_sec" value={formData.nombre_expediente_sec} onChange={manejarCambioInput} className="cifas-input" />
                </label>
                <label className="cifas-field">
                  <span>Marca</span>
                  <input type="text" name="marca" value={formData.marca} onChange={manejarCambioInput} className="cifas-input" />
                </label>
                <label className="cifas-field">
                  <span>Nº de Registro</span>
                  <input type="text" name="nro_registro" value={formData.nro_registro} onChange={manejarCambioInput} className="cifas-input" />
                </label>
              </div>
            </div>

            {/* ESTABLECIMIENTO */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '12px' }}>
                Establecimiento
              </h3>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
                <label className="cifas-field" style={{ flex: 1 }}>
                  <span>Establecimiento</span>
                  <input type="text" name="establecimiento" value={formData.establecimiento} onChange={manejarCambioInput} className="cifas-input" />
                </label>
                <button type="button" className="cifas-btn cifas-btn--secondary" style={{ height: '38px' }}>
                  Ver Establecimiento →
                </button>
              </div>
            </div>

            {/* VINCULACIÓN ACTIVIDADES ARCA */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '12px' }}>
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

            {/* DESCRIPCIÓN */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '12px' }}>
                Descripción
              </h3>
              <label className="cifas-field">
                <span>Descripción del Servicio</span>
                <textarea name="descripcion" value={formData.descripcion} onChange={manejarCambioInput} placeholder="Descripción o alcance del servicio..." required rows="3" className="cifas-input" style={{ resize: 'vertical' }} />
              </label>
            </div>

            {/* SOLAPAS INFERIORES */}
            <div style={{ marginTop: '32px', borderTop: '2px solid #e2e8f0', paddingTop: '16px' }}>
              <div style={{ display: 'flex', gap: '20px', borderBottom: '1px solid #cbd5e1', paddingBottom: '8px', marginBottom: '16px' }}>
                {['Observaciones Internas', 'Aranceles', 'Honorarios', 'Facturas', 'Porcentajes'].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setTabActiva(tab)}
                    style={{
                      background: 'none',
                      border: 'none',
                      borderBottom: `2px solid ${tabActiva === tab ? '#2563eb' : 'transparent'}`,
                      color: tabActiva === tab ? '#2563eb' : '#64748b',
                      fontWeight: tabActiva === tab ? 'bold' : 'normal',
                      cursor: 'pointer',
                      paddingBottom: '8px',
                      fontSize: '14px'
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {tabActiva === 'Observaciones Internas' && (
                <div>
                  <p style={{ color: '#64748b', fontSize: '13px' }}>Gestión de observaciones internas para el seguimiento del servicio.</p>
                </div>
              )}

              {tabActiva === 'Aranceles' && (
                <div>
                  <p style={{ color: '#64748b', fontSize: '13px' }}>Los aranceles son calculados automáticamente por el sistema según la tabla interna de CIFAS.</p>
                </div>
              )}

              {tabActiva === 'Honorarios' && (
                <div>
                  <p style={{ color: '#64748b', fontSize: '13px' }}>Administración de honorarios profesionales del servicio.</p>
                </div>
              )}

              {tabActiva === 'Facturas' && (
                <div>
                  <p style={{ color: '#64748b', fontSize: '13px' }}>Control de porcentajes de facturación y subcompañías.</p>
                </div>
              )}

              {tabActiva === 'Porcentajes' && (
                <div>
                  <p style={{ color: '#64748b', fontSize: '13px' }}>Asignación de porcentaje de facturación por usuario y costos comerciales.</p>
                </div>
              )}
            </div>

          </form>
        </div>
      )}
    </>
  );
};

export default Servicios;