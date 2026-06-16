// src/pages/Servicios.jsx
import { useState } from 'react';
import { actividadesArca } from '../data/actividadesDB';

const Servicios = () => {
  // Simulación de un nomenclador ARCA extenso
  const actividadesDisponibles = actividadesArca.map(a => ({ codigo: a.codigo, descripcion: a.nombre }));

  // 1. READ: Estado inicial del catálogo de servicios
  const [servicios, setServicios] = useState([
    {
      id: 1,
      nombre: 'Gestión de Habilitaciones e Inscripciones',
      descripcion: 'Trámites integrales y registros ante SENASA, RUCA, RNE y RNPA para plantas e industrias.',
      categoria: 'Regulaciones',
      modalidad: 'Por Proyecto',
      precioBase: 450000,
      actividadesArca: ['016119', '749009']
    },
    {
      id: 2,
      nombre: 'Auditoría de Ingeniería Térmica y Sistemas de Frío',
      descripcion: 'Evaluación técnica de eficiencia energética en cámaras frigoríficas y túneles de congelado.',
      categoria: 'Ingeniería',
      modalidad: 'Por Hora',
      precioBase: 25000,
      actividadesArca: ['101011', '711003']
    }
  ]);

  // Estados del formulario y el nuevo buscador
  const [editandoId, setEditandoId] = useState(null); 
  const [busquedaArca, setBusquedaArca] = useState(''); // <--- Estado para el filtro de texto
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    categoria: 'Regulaciones',
    modalidad: 'Por Proyecto',
    precioBase: 0,
    actividadesArca: []
  });

  // Filtrado lógico en tiempo real del nomenclador
  const actividadesFiltradas = actividadesDisponibles.filter(act => 
    act.codigo.includes(busquedaArca) || 
    act.descripcion.toLowerCase().includes(busquedaArca.toLowerCase())
  );

  const iniciarNuevo = () => {
    setEditandoId('nuevo');
    setBusquedaArca('');
    setFormData({ nombre: '', descripcion: '', categoria: 'Regulaciones', modalidad: 'Por Proyecto', precioBase: 0, actividadesArca: [] });
  };

  const iniciarEditar = (servicio) => {
    setEditandoId(servicio.id);
    setBusquedaArca('');
    setFormData({ ...servicio });
  };

  const eliminarServicio = (id) => {
    if (window.confirm('¿Seguro querés eliminar este servicio del portfolio comercial?')) {
      setServicios(servicios.filter(s => s.id !== id));
    }
  };

  const manejarCambioInput = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'precioBase' ? parseFloat(value) || 0 : value
    }));
  };

  // AGREGAR actividad y limpiar el buscador
  const manejarSeleccionArca = (e) => {
    const codigoSeleccionado = e.target.value;
    if (!codigoSeleccionado) return;

    setFormData(prev => {
      if (prev.actividadesArca.includes(codigoSeleccionado)) return prev; 
      return {
        ...prev,
        actividadesArca: [...prev.actividadesArca, codigoSeleccionado]
      };
    });

    setBusquedaArca(''); // Resetea el texto escrito para la próxima búsqueda
    e.target.value = ''; // Resetea el select
  };

  const removerActividadArca = (codigo) => {
    setFormData(prev => ({
      ...prev,
      actividadesArca: prev.actividadesArca.filter(c => c !== codigo)
    }));
  };

  const guardarServicio = (e) => {
    e.preventDefault();
    if (editandoId === 'nuevo') {
      setServicios([...servicios, { ...formData, id: Date.now() }]);
    } else {
      setServicios(servicios.map(s => s.id === editandoId ? { ...formData } : s));
    }
    setEditandoId(null);
  };

  const estiloLabel = { display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#94a3b8', marginBottom: '6px', letterSpacing: '0.5px' };
  const estiloInput = { width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', color: '#334155', fontSize: '14px', boxSizing: 'border-box', outline: 'none' };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif', color: '#334155', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '16px', marginBottom: '25px' }}>
        <div>
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#94a3b8', letterSpacing: '0.5px' }}>MÓDULO COMERCIAL</span>
          <h2 style={{ margin: '2px 0 0 0', color: '#0f172a', fontSize: '24px' }}>
            {editandoId ? (editandoId === 'nuevo' ? 'Añadir Nuevo Servicio' : 'Modificar Servicio') : 'Portfolio de Servicios CIFAS'}
          </h2>
        </div>
        {!editandoId && (
          <button onClick={iniciarNuevo} style={{ padding: '10px 20px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>
            + Crear Servicio
          </button>
        )}
      </div>

      {/* VISTA TABLA */}
      {!editandoId && (
        <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #cbd5e1', color: '#475569', backgroundColor: '#f8fafc' }}>
                  <th style={{ padding: '12px', width: '220px' }}>Servicio</th>
                  <th style={{ padding: '12px', width: '180px' }}>Actividades ARCA</th>
                  <th style={{ padding: '12px' }}>Descripción</th>
                  <th style={{ padding: '12px', width: '110px' }}>Categoría</th>
                  <th style={{ padding: '12px', width: '110px' }}>Modalidad</th>
                  <th style={{ padding: '12px', textAlign: 'right', width: '120px' }}>Precio Base</th>
                  <th style={{ padding: '12px', textAlign: 'center', width: '140px' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {servicios.map((servicio) => (
                  <tr key={servicio.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '12px', fontWeight: 'bold', color: '#0f172a', verticalAlign: 'top' }}>
                      {servicio.nombre}
                    </td>
                    <td style={{ padding: '12px', verticalAlign: 'top' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {servicio.actividadesArca.map(cod => (
                          <span key={cod} style={{ padding: '2px 5px', borderRadius: '4px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', fontFamily: 'monospace', fontSize: '11px', fontWeight: 'bold', color: '#3b82f6' }}>
                            {cod}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '12px', color: '#64748b', lineHeight: '1.4', verticalAlign: 'top' }}>
                      {servicio.descripcion}
                    </td>
                    <td style={{ padding: '12px', verticalAlign: 'top' }}>
                      <span style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: '#eff6ff', fontSize: '11px', fontWeight: 'bold', color: '#2563eb', textTransform: 'uppercase' }}>
                        {servicio.categoria}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: '#475569', fontWeight: '500', verticalAlign: 'top' }}>
                      {servicio.modalidad}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: '#0f172a', fontSize: '14px', verticalAlign: 'top' }}>
                      ${servicio.precioBase.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                      <button onClick={() => iniciarEditar(servicio)} style={{ marginRight: '8px', padding: '5px 10px', backgroundColor: '#fff', color: '#2563eb', border: '1px solid #2563eb', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                        Editar
                      </button>
                      <button onClick={() => eliminarServicio(servicio.id)} style={{ padding: '5px 10px', backgroundColor: '#fff', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                        Borrar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FORMULARIO */}
      {editandoId && (
        <form onSubmit={guardarServicio} style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={estiloLabel}>Nombre del Servicio</label>
              <input type="text" name="nombre" value={formData.nombre} onChange={manejarCambioInput} required style={estiloInput} />
            </div>
            <div>
              <label style={estiloLabel}>Honorarios Base ($)</label>
              <input type="number" name="precioBase" value={formData.precioBase} onChange={manejarCambioInput} min="0" required style={estiloInput} />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={estiloLabel}>Descripción Operativa</label>
            <textarea name="descripcion" value={formData.descripcion} onChange={manejarCambioInput} required rows="3" style={{ ...estiloInput, resize: 'none', fontFamily: 'sans-serif' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px' }}>
            <div>
              <label style={estiloLabel}>Categoría</label>
              <select name="categoria" value={formData.categoria} onChange={manejarCambioInput} style={estiloInput}>
                <option value="Regulaciones">Regulaciones / Habilitaciones</option>
                <option value="Ingeniería">Ingeniería & Termomecánica</option>
                <option value="Calidad">Calidad & Inocuidad</option>
                <option value="Estrategia">Gestión Estratégica</option>
              </select>
            </div>
            <div>
              <label style={estiloLabel}>Modalidad</label>
              <select name="modalidad" value={formData.modalidad} onChange={manejarCambioInput} style={estiloInput}>
                <option value="Por Proyecto">Por Hito / Proyecto Cerrado</option>
                <option value="Por Hora">Por Hora de Consultoría</option>
                <option value="Abono Mensual">Abono Fijo Mensual</option>
              </select>
            </div>
          </div>

          {/* DESPLEGABLE CON FILTRADO ACTIVO */}
          <div style={{ marginBottom: '30px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
            <label style={{ ...estiloLabel, color: '#475569', marginBottom: '10px' }}>
              Vincular Actividades Oficiales ARCA (CLAE)
            </label>
            
            {/* Input Buscador + Select al lado */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <input 
                type="text" 
                placeholder="🔍 Filtrar por código o nombre..." 
                value={busquedaArca}
                onChange={(e) => setBusquedaArca(e.target.value)}
                style={{ ...estiloInput, backgroundColor: '#fff', flex: '1' }}
              />
              
              <select 
                onChange={manejarSeleccionArca} 
                defaultValue="" 
                style={{ ...estiloInput, backgroundColor: '#fff', flex: '2' }}
              >
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

            {/* Listado de Chips */}
            <label style={{ ...estiloLabel, color: '#94a3b8', fontSize: '10px', marginBottom: '8px' }}>
              Actividades seleccionadas para este servicio:
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {formData.actividadesArca.length > 0 ? (
                formData.actividadesArca.map(codigo => {
                  const infoAct = actividadesDisponibles.find(a => a.codigo === codigo);
                  return (
                    <div key={codigo} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '20px', fontSize: '12px' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#3b82f6' }}>{codigo}</span>
                      <span style={{ color: '#64748b', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {infoAct ? infoAct.descripcion : ''}
                      </span>
                      <button 
                        type="button" 
                        onClick={() => removerActividadArca(codigo)}
                        style={{ border: 'none', background: 'none', color: '#ef4444', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', padding: '0 2px' }}
                      >
                        ×
                      </button>
                    </div>
                  );
                })
              ) : (
                <span style={{ color: '#94a3b8', fontSize: '12px', fontStyle: 'italic' }}>Ninguna actividad vinculada. Usá el buscador de arriba.</span>
              )}
            </div>
          </div>

          {/* CONTROL BOTONES */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
            <button type="button" onClick={() => setEditandoId(null)} style={{ padding: '10px 24px', backgroundColor: '#fff', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>
              Cancelar
            </button>
            <button type="submit" style={{ padding: '10px 32px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>
              {editandoId === 'nuevo' ? 'Agregar al Catálogo' : 'Guardar Cambios'}
            </button>
          </div>

        </form>
      )}

    </div>
  );
};

export default Servicios;