import { useState } from 'react';
import { actividadesArca } from '../data/mockDB.js';
import '../styles/Clientes.css';

const Clientes = ({ clientes, setClientes, serviciosData }) => {
  const getNombreActividad = (codigo) => {
    const actividad = actividadesArca.find(a => a.codigo === codigo);
    return actividad ? actividad.nombre : codigo;  };

  const [clienteEditando, setClienteEditando] = useState(null);
  const [formData, setFormData] = useState(null);
  const [tabActiva, setTabActiva] = useState('Actividades');
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroServicio, setFiltroServicio] = useState('');
  const [filtroActividad, setFiltroActividad] = useState('');
  const [nuevoContacto, setNuevoContacto] = useState({    nombre: '', apellido: '', telefono: '', interno: '', celular: '', mail: '', cargo: 'TITULAR', obs: ''  });
  const [nuevaHistoria, setNuevaHistoria] = useState({    descripcion: '', fecha: '18/03/2026', tipo: 'Historia'  });
  const [nuevoServicio, setNuevoServicio] = useState({    nombre: '', abono: '', estado: 'Activo', fechaInicio: '16/06/2026', actividadArca: ''  });

  const tiposUnicos = Array.from(new Set(clientes.map(c => c.tipoCliente).filter(Boolean)));
  const serviciosUnicos = Array.from(new Set(
    clientes.flatMap(c => c.servicios || []).map(s => s.servicio).filter(Boolean)  ));

  const actividadesUnicas = Array.from(new Set(
    clientes.flatMap(cliente => {
      const actividadesDeServicios = (cliente.servicios || []).flatMap(servicio =>
        servicio.actividadesArca || servicio.actividadArca || servicio.actividades || servicio.actividad || []      );
      const actividadesDirectas = cliente.actividades || [];
      return [...actividadesDirectas, ...actividadesDeServicios];    }).map(actividad =>
      typeof actividad === 'object' ? (actividad.codigo || actividad.id || actividad.actividadArca) : actividad    ).filter(Boolean)  ));

  const clientesFiltrados = clientes.filter(cliente => {
    const cumpleTexto = !filtroTexto ||
      cliente.razonSocial.toLowerCase().includes(filtroTexto.toLowerCase()) ||
      cliente.cuit.includes(filtroTexto);
    const cumpleTipo = !filtroTipo || cliente.tipoCliente === filtroTipo;
    const cumpleServicio = !filtroServicio ||
      (cliente.servicios && cliente.servicios.some(s => s.servicio === filtroServicio));
    let cumpleActividad = !filtroActividad;
    if (filtroActividad) {
      const tieneDirecta = (cliente.actividades || []).some(act =>
        String(typeof act === 'object' ? (act.codigo || act.id || act.actividadArca) : act) === String(filtroActividad)      );
      const tieneEnServicio = (cliente.servicios || []).some(s => {
        const acts = s.actividadesArca || s.actividadArca || s.actividades || s.actividad || [];
        const actsArray = Array.isArray(acts) ? acts : [acts];
        return actsArray.some(act => {
          const codigo = typeof act === 'object' ? (act.codigo || act.id || act.actividadArca) : act;
          return String(codigo) === String(filtroActividad);        });      });
      cumpleActividad = tieneDirecta || tieneEnServicio;    }
    return cumpleTexto && cumpleTipo && cumpleServicio && cumpleActividad;  });

  const limpiarFiltros = () => {
    setFiltroTexto('');
    setFiltroTipo('');
    setFiltroServicio('');
    setFiltroActividad('');  };

  const toggleBoletin = (id) => {
    setClientes(clientes.map(c => c.id === id ? { ...c, enviarBoletin: !c.enviarBoletin } : c));  };

  const manejarEdicion = (cliente) => {
    setClienteEditando(cliente.id);
    setFormData({
      ...cliente,
      condicionFiscal: cliente.condicionFiscal || 'Responsable Inscripto',
      domicilioFiscal: cliente.domicilioFiscal || 'Av. Corrientes 1234',
      cp: cliente.cp || '2000',
      localidadFiscal: cliente.localidadFiscal || 'Rosario',
      mailPrimario: cliente.mailPrimario || 'mail@empresa.com',
      mailSecundario: cliente.mailSecundario || 'mail2@empresa.com',
      dirAdmin_direccion: cliente.dirAdmin_direccion || '',
      dirAdmin_localidad: cliente.dirAdmin_localidad || '',
      dirAdmin_cp: cliente.dirAdmin_cp || '',
      dirCorr_direccion: cliente.dirCorr_direccion || '',
      dirCorr_localidad: cliente.dirCorr_localidad || '',
      dirCorr_cp: cliente.dirCorr_cp || '',
      contactos: cliente.contactos || [],
      historia: cliente.historia || [],
      servicios: cliente.servicios || [],
      actividades: cliente.actividades || [
        "472110 — Venta al por menor de productos alimenticios",
        "620100 — Actividades de programación informática"      ]    });
    setTabActiva('Actividades');  };
  const manejarCambio = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });  };
  const manejarSeleccionServicio = (servicio) => {
    const servicioInfo = serviciosData.find(s => s.servicio === servicio);
    setNuevoServicio({
      ...nuevoServicio,
      servicio,
      abono: servicioInfo ? servicioInfo.precioBase : '',
      actividadArca: servicioInfo ? (servicioInfo.actividadesArca[0] || '') : ''});  };
  const agregarContacto = () => {
    if (!nuevoContacto.nombre && !nuevoContacto.apellido) return;
    setFormData({ ...formData, contactos: [...formData.contactos, nuevoContacto] });
    setNuevoContacto({ nombre: '', apellido: '', telefono: '', interno: '', celular: '', mail: '', cargo: 'TITULAR', obs: '' });  };
  const agregarHistoria = () => {
    if (!nuevaHistoria.descripcion) return;
    setFormData({ ...formData, historia: [...formData.historia, nuevaHistoria] });
    setNuevaHistoria({ descripcion: '', fecha: '18/03/2026', tipo: 'Historia' });  };
  const agregarServicio = () => {
    if (!nuevoServicio.servicio) return;
    setFormData({ ...formData, servicios: [...formData.servicios, nuevoServicio] });
    setNuevoServicio({ servicio: '', abono: '', estado: 'Activo', fechaInicio: '16/06/2026', actividadArca: '' });  };
  const guardarCambios = (e) => {
    e.preventDefault();
    setClientes(clientes.map(c => c.id === formData.id ? formData : c));
    setClienteEditando(null);
    setFormData(null);  };
  const todosFiltradosMarcados =
    clientesFiltrados.length > 0 && clientesFiltrados.every(c => c.enviarBoletin);
  const toggleTodosFiltrados = () => {
    const nuevoEstado = !todosFiltradosMarcados;
    const idsVisibles = clientesFiltrados.map(c => c.id);
    setClientes(prev =>
      prev.map(c => idsVisibles.includes(c.id) ? { ...c, enviarBoletin: nuevoEstado } : c)    );  };
  const getBadgeServicioClass = (estado) => {
    if (estado === 'Activo') return 'badge-servicio badge-servicio--activo';
    if (estado === 'Suspendido') return 'badge-servicio badge-servicio--suspendido';
    if (estado === 'Baja') return 'badge-servicio badge-servicio--baja';
    return 'badge-servicio badge-servicio--default';  };

 return (
    <div className="clientes-wrapper">
      {!clienteEditando && (        <>
          <div className="clientes-header">
            <h2>Directorio de Clientes</h2>
          </div>
          <div className="filtros-panel">
            <div className="filtros-panel__titulo">Filtros de Búsqueda Avanzada</div>
            <div className="filtros-panel__grid">
              <div>
                <label className="form-label">Buscar Cliente / CUIT</label>
                <input
                  type="text"
                  placeholder="ej. Lucena Bakery o CUIT..."
                  value={filtroTexto}
                  onChange={(e) => setFiltroTexto(e.target.value)}
                  className="form-input form-input--white"                />
              </div>
              <div>
                <label className="form-label">Tipo de Cliente</label>
                <select
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value)}
                  className="form-input form-input--white"                >
                  <option value="">Todos los tipos</option>
                  {tiposUnicos.map(tipo => <option key={tipo} value={tipo}>{tipo}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Por Servicio Contratado</label>
                <select
                  value={filtroServicio}
                  onChange={(e) => setFiltroServicio(e.target.value)}
                  className="form-input form-input--white"                >
                  <option value="">Todos los servicios</option>
                  {serviciosUnicos.map(srv => <option key={srv} value={srv}>{srv}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Por Actividad de ARCA</label>
                <select
                  value={filtroActividad}
                  onChange={(e) => setFiltroActividad(e.target.value)}
                  className="form-input form-input--white"                >
                  <option value="">Todas las actividades</option>
                  {actividadesUnicas.map(codigo => (
                    <option key={codigo} value={codigo}>
                      [{codigo}] {getNombreActividad(codigo) || 'Actividad sin nombre'}
                    </option>                  ))}
                </select>
              </div>
              {(filtroTexto || filtroTipo || filtroServicio || filtroActividad) && (
                <button type="button" onClick={limpiarFiltros} className="btn-limpiar">
                  Limpiar Filtros
                </button>              )}
            </div>
            <div className="filtros-panel__footer">
              <span>Mostrando {clientesFiltrados.length} de {clientes.length} clientes encontrados.</span>
              {clientesFiltrados.length > 0 && (
                <button
                  type="button"
                  onClick={toggleTodosFiltrados}
                  className={`btn-toggle-todos ${todosFiltradosMarcados ? 'btn-toggle-todos--activo' : 'btn-toggle-todos--inactivo'}`}                >
                  <input type="checkbox" checked={todosFiltradosMarcados} readOnly />
                  <span>Todos ({clientesFiltrados.length})</span>
                </button>              )}
            </div>
          </div>
          <div className="tabla-clientes-panel">
            <div className="tabla-clientes-panel__scroll">
              <table className="tabla-clientes">
                <thead>
                  <tr>
                    <th>Razón Social</th>
                    <th>CUIT</th>
                    <th>Tipo Cliente</th>
                    <th>Servicios Activos</th>
                    <th className="th-center">Boletín</th>
                    <th className="th-right">Saldo</th>
                    <th className="th-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {clientesFiltrados.map((cliente) => (
                    <tr key={cliente.id}>
                      <td className="td-razon-social">{cliente.razonSocial}</td>
                      <td className="td-cuit">{cliente.cuit}</td>
                      <td><span className="badge-tipo">{cliente.tipoCliente}</span></td>
                      <td className="td-servicios">
                        {cliente.servicios && cliente.servicios.length > 0 ? (
                          <div className="servicios-lista">
                            {cliente.servicios.map((srv, idx) => (
                              <span
                                key={idx}
                                title={srv.actividadArca ? `Actividad ARCA: ${srv.actividadArca}` : ''}
                                className={getBadgeServicioClass(srv.estado)}
                              >
                                {srv.servicio}
                              </span>                            ))}
                          </div>
                        ) : (
                          <span className="sin-servicios">Sin servicios</span>                        )}
                      </td>
                      <td className="td-center">
                        <input
                          type="checkbox"
                          checked={cliente.enviarBoletin || false}
                          onChange={() => toggleBoletin(cliente.id)}
                          className="checkbox-boletin"                        />
                      </td>
                      <td className={`td-right ${cliente.saldo < 0 ? 'td-right--negativo' : 'td-right--positivo'}`}>
                        ${cliente.saldo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="td-center">
                        <button onClick={() => manejarEdicion(cliente)} className="btn-editar">
                          Editar Ficha
                        </button>
                      </td>
                    </tr>                  ))}
                  {clientesFiltrados.length === 0 && (
                    <tr className="sin-resultados">
                      <td colSpan="7">No se encontraron clientes que coincidan con los criterios de búsqueda.</td>
                    </tr>                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>      )}
      {clienteEditando && formData && (
        <form onSubmit={guardarCambios} className="ficha-form">
          <div className="ficha-form__header">
            <h2 className="ficha-form__titulo">Editar Ficha</h2>
          </div>
          <div className="ficha-seccion">
            <div className="ficha-seccion__titulo">DATOS FISCALES</div>
            <div className="grid-2-1">
              <div>
                <label className="form-label">Razón Social</label>
                <input type="text" name="razonSocial" value={formData.razonSocial} onChange={manejarCambio} className="form-input" />
              </div>
              <div>
                <label className="form-label">CUIT</label>
                <input type="text" name="cuit" value={formData.cuit} onChange={manejarCambio} className="form-input" />
              </div>
            </div>
            <div className="grid-fiscal-medio">
              <div>
                <label className="form-label">Condición Fiscal</label>
                <input type="text" name="condicionFiscal" value={formData.condicionFiscal} onChange={manejarCambio} className="form-input" />
              </div>
              <div>
                <label className="form-label">Domicilio Fiscal</label>
                <input type="text" name="domicilioFiscal" value={formData.domicilioFiscal} onChange={manejarCambio} className="form-input" />
              </div>
              <div>
                <label className="form-label">CP</label>
                <input type="text" name="cp" value={formData.cp} onChange={manejarCambio} className="form-input" />
              </div>
              <div>
                <label className="form-label">Localidad</label>
                <input type="text" name="localidadFiscal" value={formData.localidadFiscal} onChange={manejarCambio} className="form-input" />
              </div>
            </div>

            <div className="grid-fiscal-bottom">
              <div>
                <label className="form-label">Mail Principal</label>
                <input type="email" name="mailPrimario" value={formData.mailPrimario} onChange={manejarCambio} className="form-input" />
              </div>
              <div>
                <label className="form-label">Mail Secundario</label>
                <input type="email" name="mailSecundario" value={formData.mailSecundario} onChange={manejarCambio} className="form-input" />
              </div>
              <div>
                <label className="form-label">Saldo</label>
                <div className={`form-input saldo-display`}>
                  <span className={`saldo-badge ${formData.saldo >= 0 ? 'saldo-badge--positivo' : 'saldo-badge--negativo'}`}>
                    ${formData.saldo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="ficha-tabs-panel">
            <div className="ficha-tabs__nav">
              {['Contactos', 'Direcciones', 'Historia', 'Actividades', 'Presupuestos', 'Establecimientos', 'Vencimientos', 'Servicios'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setTabActiva(tab)}
                  className={`ficha-tab-btn ${tabActiva === tab ? 'ficha-tab-btn--activa' : ''}`}                >
                  {tab}
                </button>              ))}
            </div>
            <div className="ficha-tabs__contenido">
              {tabActiva === 'Contactos' && (
                <div>
                  <div className="contactos-grid-top">
                    {[
                      { l: 'NOMBRE', k: 'nombre' }, { l: 'APELLIDO', k: 'apellido' },
                      { l: 'TELÉFONO', k: 'telefono' }, { l: 'INTERNO', k: 'interno' },
                      { l: 'CELULAR', k: 'celular' }, { l: 'MAIL', k: 'mail' }
                    ].map((item) => (
                      <div key={item.l}>
                        <label className="form-label">{item.l}</label>
                        <input
                          type="text"
                          value={nuevoContacto[item.k]}
                          onChange={(e) => setNuevoContacto({ ...nuevoContacto, [item.k]: e.target.value })}
                          className="form-input"                        />
                      </div>
                    ))}
                  </div>
                  <div className="contactos-grid-bottom">
                    <div>
                      <label className="form-label">CARGO</label>
                      <select
                        value={nuevoContacto.cargo}
                        onChange={(e) => setNuevoContacto({ ...nuevoContacto, cargo: e.target.value })}                        className="form-input form-input--white"
                      >
                        <option>TITULAR</option>
                        <option>APODERADO</option>
                        <option>CONTADOR</option>
                      </select>
                    </div>
                    <div>
                      <label className="form-label">OBS</label>
                      <input
                        type="text"
                        value={nuevoContacto.obs}
                        onChange={(e) => setNuevoContacto({ ...nuevoContacto, obs: e.target.value })}
                        className="form-input"                      />
                    </div>
                    <button type="button" onClick={agregarContacto} className="btn-agregar">Agregar</button>
                  </div>
                  {formData.contactos.length > 0 && (
                    <table className="tabla-contactos">
                      <thead>
                        <tr>
                          <th>Nombre</th><th>Cargo</th><th>Contacto</th><th>Observaciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.contactos.map((c, i) => (
                          <tr key={i}>
                            <td className="td-nombre">{c.nombre} {c.apellido}</td>
                            <td>{c.cargo}</td>
                            <td>{c.mail}</td>
                            <td>{c.obs}</td>
                          </tr>                        ))}
                      </tbody>
                    </table>                  )}
                </div>              )}
              {tabActiva === 'Direcciones' && (
                <div className="direcciones-grid">
                  <div className="direccion-bloque">
                    <h4>Dirección administrativa</h4>
                    <input type="text" name="dirAdmin_direccion" value={formData.dirAdmin_direccion} onChange={manejarCambio} className="form-input" placeholder="Calle..." />
                    <div className="grid-localidad-cp">
                      <input type="text" name="dirAdmin_localidad" value={formData.dirAdmin_localidad} onChange={manejarCambio} className="form-input" placeholder="Localidad" />
                      <input type="text" name="dirAdmin_cp" value={formData.dirAdmin_cp} onChange={manejarCambio} className="form-input" placeholder="CP" />
                    </div>
                  </div>
                  <div className="direccion-bloque">
                    <h4>Dirección de correspondencia</h4>
                    <input type="text" name="dirCorr_direccion" value={formData.dirCorr_direccion} onChange={manejarCambio} className="form-input" placeholder="Calle..." />
                    <div className="grid-localidad-cp">
                      <input type="text" name="dirCorr_localidad" value={formData.dirCorr_localidad} onChange={manejarCambio} className="form-input" placeholder="Localidad" />
                      <input type="text" name="dirCorr_cp" value={formData.dirCorr_cp} onChange={manejarCambio} className="form-input" placeholder="CP" />
                    </div>
                  </div>
                </div>              )}
              {tabActiva === 'Historia' && (
                <div>
                  <div className="historia-grid">
                    <input
                      type="text"
                      value={nuevaHistoria.descripcion}
                      onChange={(e) => setNuevaHistoria({ ...nuevaHistoria, descripcion: e.target.value })}
                      className="form-input"
                      placeholder="Descripción..."                    />
                    <input
                      type="text"
                      value={nuevaHistoria.fecha}
                      onChange={(e) => setNuevaHistoria({ ...nuevaHistoria, fecha: e.target.value })}
                      className="form-input"                    />
                    <select
                      value={nuevaHistoria.tipo}
                      onChange={(e) => setNuevaHistoria({ ...nuevaHistoria, tipo: e.target.value })}
                      className="form-input form-input--white"                    >
                      <option>Historia</option><option>Llamada</option><option>Reunión</option>
                    </select>
                    <button type="button" onClick={agregarHistoria} className="btn-agregar">Agregar</button>
                  </div>
                  {formData.historia.length > 0 && (
                    <table className="tabla-historia">
                      <tbody>
                        {formData.historia.map((h, i) => (
                          <tr key={i}>
                            <td className="td-fecha">{h.fecha}</td>
                            <td className="td-tipo">{h.tipo}</td>
                            <td>{h.descripcion}</td>
                          </tr>                        ))}
                      </tbody>
                    </table>                  )}
                </div>              )}
              {tabActiva === 'Actividades' && (
                <table className="tabla-actividades">
                  <thead>
                    <tr><th>TIPO</th><th>ACTIVIDAD REGISTRADA ARCA</th></tr>
                  </thead>
                  <tbody>
                    {formData.actividades.map((act, i) => (
                      <tr key={i}>
                        <td>{i === 0 ? 'Principal' : 'Secundaria'}</td>
                        <td className="td-actividad">{act}</td>
                      </tr>                    ))}
                  </tbody>
                </table>              )}
              {tabActiva === 'Presupuestos' && (
                <p style={{ fontSize: '13px', color: '#64748b' }}>Módulo Presupuestos vinculado al ID del cliente.</p>              )}
              {tabActiva === 'Establecimientos' && (
                <p style={{ fontSize: '13px', color: '#64748b' }}>Listado de plantas, locales y números RUCA/RNE asignados.</p>              )}
              {tabActiva === 'Vencimientos' && (
                <p style={{ fontSize: '13px', color: '#dc2626', fontWeight: 'bold' }}>Próximo vencimiento de tasa: 30/06/2026</p>              )}

              {tabActiva === 'Servicios' && (
                <div>
                  <div className="servicios-form-grid">
                    <div>
                      <label className="form-label">Nombre del Servicio</label>
                      <select
                        value={nuevoServicio?.servicio || ''}
                        onChange={(e) => manejarSeleccionServicio(e.target.value)}
                        className="form-input form-input--white"                      >
                        <option value="">Seleccione servicio...</option>
                        {(serviciosData || []).map(s => (
                          <option key={s.id} value={s.servicio}>{s.servicio}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="form-label">Abono</label>
                      <input
                        type="text"
                        placeholder="Monto..."
                        value={nuevoServicio?.abono || ''}
                        onChange={(e) => setNuevoServicio({ ...nuevoServicio, abono: e.target.value })}
                        className="form-input"                      />
                    </div>
                    <div>
                      <label className="form-label">Estado</label>
                      <select
                        value={nuevoServicio?.estado || 'Activo'}
                        onChange={(e) => setNuevoServicio({ ...nuevoServicio, estado: e.target.value })}
                        className="form-input form-input--white"
                      >
                        <option value="Activo">Activo</option>
                        <option value="Suspendido">Suspendido</option>
                        <option value="Baja">Baja</option>
                      </select>
                    </div>
                    <div>
                      <label className="form-label">Actividad ARCA</label>
                      <input
                        type="text"
                        value={nuevoServicio?.actividadArca || ''}
                        onChange={(e) => setNuevoServicio({ ...nuevoServicio, actividadArca: e.target.value })}
                        className="form-input"
                      />
                    </div>
                    <button type="button" onClick={agregarServicio} className="btn-agregar">Agregar</button>
                  </div>
                  <table className="tabla-servicios">
                    <thead>
                      <tr>
                        <th>Servicio</th><th>Abono</th><th>Estado</th><th>Actividad ARCA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(formData?.servicios || []).map((s, i) => (
                        <tr key={i}>
                          <td>{s.servicio}</td>
                          <td>${s.abono}</td>
                          <td>{s.estado}</td>
                          <td>{s.actividadArca || <span className="td-na">N/A</span>}</td>
                        </tr>                      ))}
                    </tbody>
                  </table>
                </div>              )}
            </div>
          </div>
          <div className="ficha-form__acciones">
            <button
              type="button"
              onClick={() => { setClienteEditando(null); setFormData(null); }}
              className="btn-cancelar">
              Cancelar
            </button>
            <button type="submit" className="btn-guardar">Guardar Cambios</button>
          </div>
        </form>      )}
    </div>  );};
export default Clientes;