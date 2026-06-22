import { useState } from 'react';
import { actividadesArca, serviciosData } from '../data/mockDB.js';
import '../styles/Servicios.css';

const Servicios = () => {
  const actividadesDisponibles = actividadesArca.map(a => ({ codigo: a.codigo, descripcion: a.nombre }));
  const [servicios, setServicios] = useState(serviciosData);

  const [editandoId, setEditandoId] = useState(null); 
  const [busquedaArca, setBusquedaArca] = useState(''); 
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    categoria: 'Regulaciones',
    modalidad: 'Por Proyecto',
    precioBase: 0,
    actividadesArca: []
  });

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

    setBusquedaArca(''); 
    e.target.value = ''; 
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

  return (
    <div className="servicios-wrapper">
        <div className="servicios-header">
        <div>
          <h2>
            {editandoId ? (editandoId === 'nuevo' ? 'Añadir Nuevo Servicio' : 'Modificar Servicio') : 'Portfolio de Servicios CIFAS'}
          </h2>
        </div>
        {!editandoId && (
          <button onClick={iniciarNuevo} className="btn-base btn-crear">
            + Crear Servicio
          </button>
        )}
      </div>

      {!editandoId && (
        <div className="tabla-panel">
          <div className="tabla-scroll">
            <table className="tabla-portfolio">
              <thead>
                <tr>
                  <th className="th-servicio">Servicio</th>
                  <th className="th-arca">Actividades ARCA</th>
                  <th>Descripción</th>
                  <th className="th-categoria">Categoría</th>
                  <th className="th-modalidad">Modalidad</th>
                  <th className="th-precio">Precio Base</th>
                  <th className="th-acciones">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {servicios.map((servicio) => (
                  <tr key={servicio.id}>
                    <td className="td-nombre">
                      {servicio.servicio}
                    </td>
                    <td>
                      <div className="chips-container">
                        {(servicio.actividadesArca || []).map(cod => (
                          <span key={cod} className="chip-codigo">
                            {cod}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="td-descripcion">
                      {servicio.descripcion}
                    </td>
                    <td>
                      <span className="badge-categoria">
                        {servicio.categoria}
                      </span>
                    </td>
                    <td className="td-modalidad">
                      {servicio.modalidad}
                    </td>
                    <td className="td-precio">
                      ${(servicio.precioBase || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="td-acciones">
                      <button onClick={() => iniciarEditar(servicio)} className="btn-tabla btn-tabla-editar">
                        Editar
                      </button>
                      <button onClick={() => eliminarServicio(servicio.id)} className="btn-tabla btn-tabla-borrar">
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
      {editandoId && (
        <form onSubmit={guardarServicio} className="form-panel">
          
          <div className="form-grid-2-1">
            <div className="form-grupo">
              <label className="form-label">Nombre del Servicio</label>
              <input type="text" name="nombre" value={formData.nombre} onChange={manejarCambioInput} required className="form-input" />
            </div>
            <div className="form-grupo">
              <label className="form-label">Honorarios Base ($)</label>
              <input type="number" name="precioBase" value={formData.precioBase} onChange={manejarCambioInput} min="0" required className="form-input" />
            </div>
          </div>

          <div className="form-grupo">
            <label className="form-label">Descripción Operativa</label>
            <textarea name="descripcion" value={formData.descripcion} onChange={manejarCambioInput} required rows="3" className="form-input form-textarea" />
          </div>

          <div className="form-grid-1-1">
            <div className="form-grupo">
              <label className="form-label">Categoría</label>
              <select name="categoria" value={formData.categoria} onChange={manejarCambioInput} className="form-input">
                <option value="Regulaciones">Regulaciones / Habilitaciones</option>
                <option value="Ingeniería">Ingeniería & Termomecánica</option>
                <option value="Calidad">Calidad & Inocuidad</option>
                <option value="Estrategia">Gestión Estratégica</option>
              </select>
            </div>
            <div className="form-grupo">
              <label className="form-label">Modalidad</label>
              <select name="modalidad" value={formData.modalidad} onChange={manejarCambioInput} className="form-input">
                <option value="Por Proyecto">Por Hito / Proyecto Cerrado</option>
                <option value="Por Hora">Por Hora de Consultoría</option>
                <option value="Abono Mensual">Abono Fijo Mensual</option>
              </select>
            </div>
          </div>
          <div className="arca-vincular-seccion">
            <label className="form-label form-label-arca">
              Vincular Actividades Oficiales ARCA (CLAE)
            </label>
            
            <div className="arca-busqueda-row">
              <input 
                type="text" 
                placeholder="Filtrar por código o nombre..." 
                value={busquedaArca}
                onChange={(e) => setBusquedaArca(e.target.value)}
                className="form-input form-input--white arca-input-filtro"
              />
              
              <select 
                onChange={manejarSeleccionArca} 
                defaultValue="" 
                className="form-input form-input--white arca-select-filtro"
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
            <label className="form-label form-label-sub">
              Actividades seleccionadas para este servicio:
            </label>
            <div className="chips-seleccionados-lista">
              {formData.actividadesArca.length > 0 ? (
                formData.actividadesArca.map(codigo => {
                  const infoAct = actividadesDisponibles.find(a => a.codigo === codigo);
                  return (
                    <div key={codigo} className="chip-seleccionado-item">
                      <span className="chip-seleccionado__codigo">{codigo}</span>
                      <span className="chip-seleccionado__desc">
                        {infoAct ? infoAct.descripcion : ''}
                      </span>
                      <button 
                        type="button" 
                        onClick={() => removerActividadArca(codigo)}
                        className="chip-seleccionado__btn-remover"
                      >
                        ×
                      </button>
                    </div>
                  );
                })
              ) : (
                <span className="chips-vacio">Ninguna actividad vinculada. Usá el buscador de arriba.</span>
              )}
            </div>
          </div>
          <div className="form-acciones">
            <button type="button" onClick={() => setEditandoId(null)} className="btn-base btn-cancelar">
              Cancelar
            </button>
            <button type="submit" className="btn-base btn-guardar">
              {editandoId === 'nuevo' ? 'Agregar al Catálogo' : 'Guardar Cambios'}
            </button>
          </div>

        </form>
      )}

    </div>
  );
};

export default Servicios;