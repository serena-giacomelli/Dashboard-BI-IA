import { useState } from 'react';
import { actividadesArca, serviciosData } from '../data/mockDB.js';
import '../styles/Servicios.css';

const Servicios = () => {
  const actividadesDisponibles = actividadesArca.map(a => ({ codigo: a.codigo, descripcion: a.nombre }));
  const [servicios, setServicios] = useState(serviciosData);

  const [editandoId, setEditandoId] = useState(null);
  const [busquedaArca, setBusquedaArca] = useState('');
  const [formData, setFormData] = useState({
    servicio: '',
    categoria: 'Regulaciones',
    modalidad: 'Por Proyecto',
    actividadesArca: [],
    usuarioAsignado: 'Valeria F.',
    estadoServicio: '1. Pendiente de asignacion',
    fechaInicio: '',
    fechaFin: '',
    contactoCliente: '',
    contactoOrganismo: '',
    directorTecnico: '',
    nroExpediente: '',
    nombreExpediente: '',
    fechaNotificacionRequeridos: '',
    fechaVtoRegistro: '',
    nroExpedienteSecundario: '',
    nombreExpedienteSecundario: '',
    marca: '',
    nroRegistro: '',
    establecimiento: '',
    descripcion: ''});

  const actividadesFiltradas = actividadesDisponibles.filter(act =>
    act.codigo.includes(busquedaArca) ||
    act.descripcion.toLowerCase().includes(busquedaArca.toLowerCase()));

  const iniciarNuevo = () => {
    setEditandoId('nuevo');
    setBusquedaArca('');
    setFormData({
      servicio: '', categoria: 'Regulaciones', modalidad: 'Por Proyecto', actividadesArca: [],
      usuarioAsignado: 'Valeria F.', estadoServicio: '1. Pendiente de asignacion', fechaInicio: '', fechaFin: '',
      contactoCliente: '', contactoOrganismo: '', directorTecnico: '', nroExpediente: '', nombreExpediente: '',
      fechaNotificacionRequeridos: '', fechaVtoRegistro: '', nroExpedienteSecundario: '', nombreExpedienteSecundario: '',
      marca: '', nroRegistro: '', establecimiento: '', descripcion: ''
    });};

  const iniciarEditar = (servicio) => {
    setEditandoId(servicio.id);
    setBusquedaArca('');
    setFormData({ ...servicio });};

  const eliminarServicio = (id) => {
    if (window.confirm('¿Seguro querés eliminar este servicio del portfolio comercial?')) {
      setServicios(servicios.filter(s => s.id !== id));
    }};

  const manejarCambioInput = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));};

  const manejarSeleccionArca = (e) => {
    const codigoSeleccionado = e.target.value;
    if (!codigoSeleccionado) return;

    setFormData(prev => {
      if (prev.actividadesArca.includes(codigoSeleccionado)) return prev;
      return { ...prev, actividadesArca: [...prev.actividadesArca, codigoSeleccionado] };
    });
    setBusquedaArca('');
    e.target.value = '';};

  const removerActividadArca = (codigo) => {
    setFormData(prev => ({
      ...prev,
      actividadesArca: prev.actividadesArca.filter(c => c !== codigo)
    }));};

  const guardarServicio = (e) => {
    e.preventDefault();
    if (editandoId === 'nuevo') {
      setServicios([...servicios, { ...formData, id: Date.now() }]);
    } else {
      setServicios(servicios.map(s => s.id === editandoId ? { ...formData } : s));}
    setEditandoId(null);};

  return (
    <div className="servicios-wrapper">
      <div className="servicios-header">
        <div>
          {!editandoId && <span className="servicios-eyebrow">Módulo Comercial</span>}
          <h2>
            {editandoId ? (editandoId === 'nuevo' ? 'Añadir Nuevo Servicio' : 'Modificar Servicio') : 'Portfolio de Servicios CIFAS'}
          </h2>
        </div>
        {!editandoId && (
          <button onClick={iniciarNuevo} className="btn-base btn-crear">
            + Crear Servicio
          </button>)}
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
                  <th className="th-acciones">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {servicios.map((servicio) => (
                  <tr key={servicio.id}>
                    <td className="td-nombre">{servicio.servicio}</td>
                    <td>
                      <div className="chips-container">
                        {(servicio.actividadesArca || []).map(cod => (
                          <span key={cod} className="chip-codigo">{cod}</span>))}
                      </div>
                    </td>
                    <td className="td-descripcion">{servicio.descripcion}</td>
                    <td>
                      <span className="badge-categoria">{servicio.categoria}</span>
                    </td>
                    <td className="td-modalidad">{servicio.modalidad}</td>
                    <td className="td-acciones">
                      <button onClick={() => iniciarEditar(servicio)} className="btn-tabla btn-tabla-editar">Editar</button>
                      <button onClick={() => eliminarServicio(servicio.id)} className="btn-tabla btn-tabla-borrar">Borrar</button>
                    </td>
                  </tr>))}
              </tbody>
            </table>
          </div>
        </div>)}

      {editandoId && (
        <form onSubmit={guardarServicio} className="form-panel-horizontal">
          <div className="form-header-interno">DATOS DEL SERVICIO</div>

          <div className="form-seccion-lineal">
            <h3 className="seccion-titulo-lineal">INFORMACIÓN PRINCIPAL</h3>
            <div className="grid-lineal-5">
              <div className="form-grupo">
                <label className="label-lineal">SERVICIO</label>
                <input type="text" name="servicio" value={formData.servicio} onChange={manejarCambioInput} required className="input-lineal" />
              </div>
              <div className="form-grupo">
                <label className="label-lineal">USUARIO ASIGNADO</label>
                <select name="usuarioAsignado" value={formData.usuarioAsignado} onChange={manejarCambioInput} className="input-lineal">
                  <option value="Valeria F.">Valeria F.</option>
                </select>
              </div>
              <div className="form-grupo">
                <label className="label-lineal">ESTADO DE SERVICIO</label>
                <select name="estadoServicio" value={formData.estadoServicio} onChange={manejarCambioInput} className="input-lineal">
                  <option value="1. Pendiente de asignacion">1. Pendiente de asignacion</option>
                  <option value="2. Asignada">2. Asignada</option>
                  <option value="3. Servicio no aceptado">3. Servicio no aceptado</option>
                  <option value="4. En curso">4. En curso</option>
                  <option value="5. En obra">5. En obra</option>
                  <option value="6. Presentada">6. Presentada</option>
                  <option value="7. Demorada por el cliente">7. Demorada por el cliente</option>
                  <option value="8. Demorada por el organismo">8. Demorada por el organismo</option>
                  <option value="9. Observada">9. Observada</option>
                  <option value="10. Finalizada">10. Finalizada</option>
                  <option value="11. Finalizada. no corresponde facturar">11. Finalizada. no corresponde facturar</option>
                  <option value="12. Anualidad">12. Anualidad</option>
                </select>
                <span className="helper-lineal">Estado "FACTURACIÓN PARCIAL" eliminado. 12 estados activos.</span>
              </div>
              <div className="form-grupo">
                <label className="label-lineal">FECHA INICIO <span className="badge-inline-auto">AUTO</span></label>
                <input type="date" name="fechaInicio" value={formData.fechaInicio} onChange={manejarCambioInput} className="input-lineal" />
                <span className="helper-lineal">Registro automático al pasar a "En Curso". No editable.</span>
              </div>
              <div className="form-grupo">
                <label className="label-lineal">FECHA FIN <span className="badge-inline-coordinadora">SOLO COORDINADORA</span></label>
                <input type="date" name="fechaFin" value={formData.fechaFin} onChange={manejarCambioInput} className="input-lineal" />
                <span className="helper-lineal">= Fecha Inicio + 15 días corridos por defecto.</span>
              </div>
            </div>
          </div>

          <div className="form-seccion-lineal">
            <h3 className="seccion-titulo-lineal">DATOS COMERCIALES</h3>
            <div className="grid-lineal-2">
              <div className="form-grupo">
                <label className="label-lineal">CATEGORÍA</label>
                <select name="categoria" value={formData.categoria} onChange={manejarCambioInput} className="input-lineal">
                  <option value="Regulaciones">Regulaciones / Habilitaciones</option>
                  <option value="Ingeniería">Ingeniería & Termomecánica</option>
                  <option value="Calidad">Calidad & Inocuidad</option>
                  <option value="Estrategia">Gestión Estratégica</option>
                </select>
              </div>
              <div className="form-grupo">
                <label className="label-lineal">MODALIDAD</label>
                <select name="modalidad" value={formData.modalidad} onChange={manejarCambioInput} className="input-lineal">
                  <option value="Por Proyecto">Por Hito / Proyecto Cerrado</option>
                  <option value="Por Hora">Por Hora de Consultoría</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-seccion-lineal">
            <h3 className="seccion-titulo-lineal">CONTACTOS Y DIRECTOR TÉCNICO</h3>
            <div className="grid-lineal-contactos">
              <div className="form-grupo">
                <label className="label-lineal">CONTACTO CLIENTE</label>
                <select name="contactoCliente" value={formData.contactoCliente} onChange={manejarCambioInput} className="input-lineal">
                  <option value="">— Sin contacto —</option>
                </select>
                <span className="helper-lineal">Trae contactos desde el módulo Cliente.</span>
              </div>
              <div className="form-grupo">
                <label className="label-lineal">CONTACTO ORGANISMO</label>
                <select name="contactoOrganismo" value={formData.contactoOrganismo} onChange={manejarCambioInput} className="input-lineal">
                  <option value="">— Sin contacto —</option>
                </select>
              </div>
              <div className="form-grupo flex-row-align">
                <div style={{ flex: 1 }}>
                  <label className="label-lineal">DIRECTOR TÉCNICO</label>
                  <input type="text" name="directorTecnico" placeholder="Buscar por nombre..." value={formData.directorTecnico} onChange={manejarCambioInput} className="input-lineal" />
                  <span className="helper-lineal">Autocompletado desde tabla secundaria.</span>
                </div>
                <button type="button" className="btn-lineal-redireccion">Ver Director Técnico →</button>
              </div>
            </div>
          </div>

          <div className="form-seccion-lineal">
            <h3 className="seccion-titulo-lineal">VINCULAR ACTIVIDADES OFICIALES ARCA (CLAE)</h3>
            <div className="grid-lineal-2">
              <input
                type="text"
                placeholder="Filtrar por código o nombre..."
                value={busquedaArca}
                onChange={(e) => setBusquedaArca(e.target.value)}
                className="input-lineal bg-white"
              />
              <select onChange={manejarSeleccionArca} defaultValue="" className="input-lineal bg-white">
                <option value="" disabled>
                  {actividadesFiltradas.length === 0 ? 'No hay coincidencias' : `-- Seleccionar (${actividadesFiltradas.length} encontradas) --`}
                </option>
                {actividadesFiltradas.map(act => (
                  <option key={act.codigo} value={act.codigo}>
                    [{act.codigo}] {act.descripcion}
                  </option>))}
              </select>
            </div>

            <label className="label-lineal subtle-mt">ACTIVIDADES SELECCIONADAS PARA ESTE SERVICIO:</label>
            <div className="chips-lineal-wrapper">
              {formData.actividadesArca.length > 0 ? (
                formData.actividadesArca.map(codigo => {
                  const infoAct = actividadesDisponibles.find(a => a.codigo === codigo);
                  return (
                    <div key={codigo} className="chip-lineal-item">
                      <span className="chip-lineal-code">{codigo}</span>
                      <span className="chip-lineal-text">{infoAct ? infoAct.descripcion : ''}</span>
                      <button type="button" onClick={() => removerActividadArca(codigo)} className="chip-lineal-remove">×</button>
                    </div>);})
              ) : (
                <span className="helper-lineal italic">Ninguna actividad vinculada. Usá el buscador de arriba.</span>)}
            </div>
          </div>

          <div className="form-seccion-lineal">
            <h3 className="seccion-titulo-lineal">EXPEDIENTE PRINCIPAL</h3>
            <div className="grid-lineal-4">
              <div className="form-grupo">
                <label className="label-lineal">N° EXPEDIENTE</label>
                <input type="text" name="nroExpediente" placeholder="EXP-2025-001" value={formData.nroExpediente} onChange={manejarCambioInput} className="input-lineal" />
                <span className="helper-lineal">Acepta letras y números.</span>
              </div>
              <div className="form-grupo">
                <label className="label-lineal">NOMBRE EXPEDIENTE</label>
                <input type="text" name="nombreExpediente" placeholder="Nombre descriptivo" value={formData.nombreExpediente} onChange={manejarCambioInput} className="input-lineal" />
                <span className="helper-lineal">Alfanumérico - carga manual.</span>
              </div>
              <div className="form-grupo">
                <label className="label-lineal">FECHA NOTIFICACIÓN REQUERIDOS</label>
                <input type="date" name="fechaNotificacionRequeridos" value={formData.fechaNotificacionRequeridos} onChange={manejarCambioInput} className="input-lineal" />
                <span className="helper-lineal">Notifica al usuario asignado 15 días antes.</span>
              </div>
              <div className="form-grupo">
                <label className="label-lineal">FECHA VTO REGISTRO</label>
                <input type="date" name="fechaVtoRegistro" value={formData.fechaVtoRegistro} onChange={manejarCambioInput} className="input-lineal" />
                <span className="helper-lineal">Notifica a cifas@cifas.com.ar 15 días antes.</span>
              </div>
            </div>
          </div>

          <div className="form-seccion-lineal">
            <h3 className="seccion-titulo-lineal">EXPEDIENTE SECUNDARIO</h3>
            <div className="grid-lineal-4">
              <div className="form-grupo">
                <label className="label-lineal">N° EXPEDIENTE SECUNDARIO</label>
                <input type="text" name="nroExpedienteSecundario" placeholder="Opcional" value={formData.nroExpedienteSecundario} onChange={manejarCambioInput} className="input-lineal" />
              </div>
              <div className="form-grupo">
                <label className="label-lineal">NOMBRE EXPEDIENTE SECUNDARIO</label>
                <input type="text" name="nombreExpedienteSecundario" placeholder="Opcional" value={formData.nombreExpedienteSecundario} onChange={manejarCambioInput} className="input-lineal" />
              </div>
              <div className="form-grupo">
                <label className="label-lineal">MARCA</label>
                <input type="text" name="marca" placeholder="Texto libre" value={formData.marca} onChange={manejarCambioInput} className="input-lineal" />
              </div>
              <div className="form-grupo">
                <label className="label-lineal">N° DE REGISTRO</label>
                <input type="text" name="nroRegistro" placeholder="Alfanumérico" value={formData.nroRegistro} onChange={manejarCambioInput} className="input-lineal" />
              </div>
            </div>
          </div>

          <div className="form-seccion-lineal">
            <h3 className="seccion-titulo-lineal">ESTABLECIMIENTO</h3>
            <div className="grid-lineal-establecimiento">
              <div className="form-grupo flex-row-align">
                <div style={{ flex: 1 }}>
                  <label className="label-lineal">ESTABLECIMIENTO</label>
                  <select name="establecimiento" value={formData.establecimiento} onChange={manejarCambioInput} className="input-lineal">
                    <option value="">— Seleccionar —</option>
                  </select>
                </div>
                <button type="button" className="btn-lineal-redireccion">Ver Establecimiento →</button>
              </div>
            </div>
          </div>

          <div className="form-seccion-lineal no-border">
            <h3 className="seccion-titulo-lineal">DESCRIPCIÓN</h3>
            <div className="form-grupo">
              <label className="label-lineal">DESCRIPCIÓN DEL SERVICIO</label>
              <textarea name="descripcion" value={formData.descripcion} onChange={manejarCambioInput} placeholder="Descripción interna..." required rows="3" className="input-lineal textarea-lineal" />
              <span className="helper-lineal">Uso interno. No se incluye en los reportes de cara al cliente.</span>
            </div>
          </div>

          <div className="form-acciones-lineal">
            <button type="button" onClick={() => setEditandoId(null)} className="btn-lineal-cancelar">Cancelar</button>
            <button type="submit" className="btn-lineal-guardar">Guardar Cambios</button>
          </div>
        </form>)}
    </div>);};

export default Servicios;