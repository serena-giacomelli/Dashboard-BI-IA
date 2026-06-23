import { useState } from 'react';
import { actividadesArca } from '../data/mockDB.js';
import '../styles/Clientes.css';

const Clientes = ({ clientes, setClientes, serviciosData }) => {
  // 1. Extrae el código limpio (ej: "472110")
  const obtenerCodigoActividad = (act) => {
    if (!act) return '';
    if (typeof act === 'object') {
      const cod = act.codigo || act.id || act.actividadArca || act.actividad || '';
      return String(cod).split(' — ')[0].trim();
    }
    return String(act).split(' — ')[0].trim();
  };

  // 2. Busca el nombre descriptivo a partir del código
  const getNombreActividad = (codigo) => {
    const limpia = String(codigo).split(' — ')[0].trim();
    const actividad = actividadesArca.find(a => String(a.codigo) === limpia);
    return actividad ? actividad.nombre : limpia;
  };

  // 3. Resuelve la actividad buscando en el servicio o haciendo fallback a serviciosData
  const obtenerActividadDeServicio = (s) => {
    if (!s) return null;
    let actVal = s.actividadArca || s.actividadesArca || s.actividades || s.actividad;
    
    if (!actVal && serviciosData) {
      const srvInfo = serviciosData.find(sd => sd.servicio === s.servicio);
      if (srvInfo) {
        actVal = srvInfo.actividadesArca || srvInfo.actividadArca || srvInfo.actividades || srvInfo.actividad;
      }
    }
    return actVal;
  };

  const estadosServicios = [
    "1. Pendiente de asignacion",
    "2. Asignada",
    "3. Servicio no aceptado",
    "4. En curso",
    "5. En obra",
    "6. Presentada",
    "7. Demorada por el cliente",
    "8. Demorada por el organismo",
    "9. Observada",
    "10. Finalizada",
    "11. Finalizada. no corresponde facturar",
    "12. Anualidad"
  ];

  const [clienteEditando, setClienteEditando] = useState(null);
  const [formData, setFormData] = useState(null);
  const [tabActiva, setTabActiva] = useState('Actividades');
  
  // Filtro del Directorio Principal (Solo Texto)
  const [filtroTexto, setFiltroTexto] = useState('');
  
  // Filtros Locales de la Ficha Interna (Pestaña Servicios)
  const [filtroSrvNombre, setFiltroSrvNombre] = useState('');
  const [filtroSrvEstado, setFiltroSrvEstado] = useState('');
  const [filtroSrvActividad, setFiltroSrvActividad] = useState('');

  const [nuevoContacto, setNuevoContacto] = useState({ nombre: '', apellido: '', telefono: '', interno: '', celular: '', mail: '', cargo: 'TITULAR', obs: '' });
  const [nuevaHistoria, setNuevaHistoria] = useState({ descripcion: '', fecha: '18/03/2026', tipo: 'Historia' });
  const [nuevoServicio, setNuevoServicio] = useState({ servicio: '', estado: '1. Pendiente de asignacion', fechaInicio: '16/06/2026', actividadArca: '' });
  const [subTabServicios, setSubTabServicios] = useState('activos');

  const actividadesUnicas = Array.from(new Set(
    clientes.flatMap(cliente => {
      const actividadesDeServicios = (cliente.servicios || []).flatMap(servicio => {
        const acts = obtenerActividadDeServicio(servicio);
        return Array.isArray(acts) ? acts : (acts ? [acts] : []);
      });
      const actividadesDirectas = cliente.actividades || [];
      return [...actividadesDirectas, ...actividadesDeServicios];
    }).map(act => obtenerCodigoActividad(act)).filter(Boolean)
  ));

  // LÓGICA DE FILTRADO DEL DIRECTORIO GENERAL (Simplificada a Búsqueda Global)
  const clientesFiltrados = clientes.filter(cliente => {
    return !filtroTexto ||
      cliente.razonSocial.toLowerCase().includes(filtroTexto.toLowerCase()) ||
      String(cliente.cuit || '').includes(filtroTexto);
  });

  // Unifica las actividades del cliente para la pestaña local Actividades
  const getActividadesDeFichaActual = () => {
    const lista = [];
    if (!formData) return lista;

    // 1. Actividades directas
    (formData.actividades || []).forEach(act => {
      const cod = obtenerCodigoActividad(act);
      if (cod) {
        lista.push({
          codigo: cod,
          nombre: getNombreActividad(cod),
                }); }});

    // 2. Actividades de servicios
    (formData.servicios || []).forEach(s => {
      const acts = obtenerActividadDeServicio(s);
      const actsArray = Array.isArray(acts) ? acts : (acts ? [acts] : []);
      actsArray.forEach(act => {
        const cod = obtenerCodigoActividad(act);
        if (cod) {
          lista.push({
            codigo: cod,
            nombre: getNombreActividad(cod),
          });}
      });});

    const vistas = new Set();
    return lista.filter(item => {
      const clave = `${item.codigo}`;
      if (vistas.has(clave)) return false;
      vistas.add(clave);
      return true;});};

  const limpiarFiltrosInternosServicios = () => {
    setFiltroSrvNombre('');
    setFiltroSrvEstado('');
    setFiltroSrvActividad('');};

  const cambiarSubTabServicios = (tab) => {
    setSubTabServicios(tab);
    limpiarFiltrosInternosServicios();};

  const toggleBoletin = (id) => {
    setClientes(clientes.map(c => c.id === id ? { ...c, enviarBoletin: !c.enviarBoletin } : c));};

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
      actividades: cliente.actividades || []
    });
    setTabActiva('Actividades');
    setSubTabServicios('activos');
    limpiarFiltrosInternosServicios();};

  const manejarCambio = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });};

  const manejarSeleccionServicio = (servicio) => {
    const servicioInfo = serviciosData?.find(s => s.servicio === servicio);
    let actAsignada = '';
    
    if (servicioInfo) {
      const posibles = servicioInfo.actividadesArca || servicioInfo.actividadArca || servicioInfo.actividades || servicioInfo.actividad;
      if (Array.isArray(posibles)) {
        actAsignada = posibles[0] || '';
      } else {
        actAsignada = posibles || '';}}

    setNuevoServicio({
      ...nuevoServicio,
      servicio,
      actividadArca: actAsignada
    });};

  const agregarContacto = () => {
    if (!nuevoContacto.nombre && !nuevoContacto.apellido) return;
    setFormData({ ...formData, contactos: [...formData.contactos, nuevoContacto] });
    setNuevoContacto({ nombre: '', apellido: '', telefono: '', interno: '', celular: '', mail: '', cargo: 'TITULAR', obs: '' });};

  const agregarHistoria = () => {
    if (!nuevaHistoria.descripcion) return;
    setFormData({ ...formData, historia: [...formData.historia, nuevaHistoria] });
    setNuevaHistoria({ descripcion: '', fecha: '18/03/2026', tipo: 'Historia' });};

  const agregarServicio = () => {
    if (!nuevoServicio.servicio) return;
    setFormData({ ...formData, servicios: [...formData.servicios, nuevoServicio] });
    setNuevoServicio({ servicio: '', estado: '1. Pendiente de asignacion', fechaInicio: '16/06/2026', actividadArca: '' });};

  const guardarCambios = (e) => {
    e.preventDefault();
    setClientes(clientes.map(c => c.id === formData.id ? formData : c));
    setClienteEditando(null);
    setFormData(null);
    limpiarFiltrosInternosServicios();};

  const todosFiltradosMarcados = clientesFiltrados.length > 0 && clientesFiltrados.every(c => c.enviarBoletin);
  
  const toggleTodosFiltrados = () => {
    const nuevoEstado = !todosFiltradosMarcados;
    const idsVisibles = clientesFiltrados.map(c => c.id);
    setClientes(prev => prev.map(c => idsVisibles.includes(c.id) ? { ...c, enviarBoletin: nuevoEstado } : c));
  };

  const getBadgeServicioClass = (estado) => {
    if (!estado) return 'badge-servicio badge-servicio--default';
    const est = estado.toLowerCase();
    if (est.includes('pendiente') || est.includes('asignada')) return 'badge-servicio badge-servicio--pendiente';
    if (est.includes('no aceptado')) return 'badge-servicio badge-servicio--rechazado';
    if (est.includes('obra')) return 'badge-servicio badge-servicio--obra';
    if (est.includes('presentada')) return 'badge-servicio badge-servicio--presentada';
    if (est.includes('demorada') || est.includes('observada')) return 'badge-servicio badge-servicio--alerta';
    if (est.includes('finalizada')) return 'badge-servicio badge-servicio--finalizada';
    if (est.includes('anualidad')) return 'badge-servicio badge-servicio--anualidad';
    return 'badge-servicio badge-servicio--default';};

  const serviciosSegunSubTab = (formData?.servicios || [])
    .filter(s => {
      const esHistorico = s.estado === "10. Finalizada" || s.estado === "11. Finalizada. no corresponde facturar";
      return subTabServicios === 'historico' ? esHistorico : !esHistorico;})
    .filter(s => {
      const cumpleNombre = !filtroSrvNombre || s.servicio.toLowerCase().includes(filtroSrvNombre.toLowerCase());
      const cumpleEstado = !filtroSrvEstado || s.estado === filtroSrvEstado;
      
      let cumpleActividad = !filtroSrvActividad;
      if (filtroSrvActividad) {
        const acts = obtenerActividadDeServicio(s);
        const actsArray = Array.isArray(acts) ? acts : (acts ? [acts] : []);
        cumpleActividad = actsArray.some(act => obtenerCodigoActividad(act) === filtroSrvActividad);}
      return cumpleNombre && cumpleEstado && cumpleActividad;});

  const actividadesFichaActual = getActividadesDeFichaActual();

  return (
    <div className="clientes-wrapper">
      {!clienteEditando && (
        <>
          <div className="clientes-header">
            <h2>Directorio de Clientes</h2>
          </div>

          <div className="filtros-toolbar">
            <div className="filtros-toolbar__main-row">
              <div className="search-bar-container" style={{ flex: 1, maxWidth: '600px' }}>
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Buscar cliente por Razón Social o CUIT..."
                  value={filtroTexto}
                  onChange={(e) => setFiltroTexto(e.target.value)}
                  className="search-bar-input"/>
              </div>

              <div className="filtros-toolbar__stats">
                {filtroTexto && (
                  <button type="button" onClick={() => setFiltroTexto('')} className="btn-clear-inline" style={{ marginRight: '15px' }}>
                    Limpiar Búsqueda
                  </button>)}
                <span className="results-count"><b>{clientesFiltrados.length}</b> {clientesFiltrados.length === 1 ? 'resultado' : 'resultados'}</span>
                {clientesFiltrados.length > 0 && (
                  <button
                    type="button"
                    onClick={toggleTodosFiltrados}
                    className={`btn-bulk-toggle ${todosFiltradosMarcados ? 'btn-bulk-toggle--active' : ''}`}>
                    <input type="checkbox" checked={todosFiltradosMarcados} readOnly />
                    <span>Marcar visibles</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="tabla-clientes-panel">
            <div className="tabla-clientes-panel__scroll">
              <table className="tabla-clientes">
                <thead>
                  <tr>
                    <th>Razón Social</th><th>CUIT</th><th>Servicios Registrados</th><th className="th-center">Boletín</th><th className="th-right">Saldo</th><th className="th-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {clientesFiltrados.map((cliente) => (
                    <tr key={cliente.id}>
                      <td className="td-razon-social">{cliente.razonSocial}</td>
                      <td className="td-cuit">{cliente.cuit}</td>
                      <td className="td-servicios">
                        {cliente.servicios && cliente.servicios.length > 0 ? (
                          <div className="servicios-lista">
                            {cliente.servicios.map((srv, idx) => (
                              <span key={idx} title={srv.estado ? `Estado: ${srv.estado}` : ''} className={getBadgeServicioClass(srv.estado)}>
                                {srv.servicio}
                              </span>))}
                          </div>
                        ) : <span className="sin-servicios">Sin servicios</span>}
                      </td>
                      <td className="td-center">
                        <input type="checkbox" checked={cliente.enviarBoletin || false} onChange={() => toggleBoletin(cliente.id)} className="checkbox-boletin"/>
                      </td>
                      <td className={`td-right ${cliente.saldo < 0 ? 'td-right--negativo' : 'td-right--positivo'}`}>
                        ${cliente.saldo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="td-center">
                        <button onClick={() => manejarEdicion(cliente)} className="btn-editar">Editar Ficha</button>
                      </td>
                    </tr>))}
                </tbody>
              </table>
            </div>
          </div>
        </>)}

      {clienteEditando && formData && (
        <form onSubmit={guardarCambios} className="ficha-form">
          <div className="ficha-form__header">
            <h2 className="ficha-form__titulo">Editar Ficha — {formData.razonSocial}</h2>
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
                <div className="form-input saldo-display">
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
                  className={`ficha-tab-btn ${tabActiva === tab ? 'ficha-tab-btn--activa' : ''}`}>
                  {tab}
                </button>))}
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
                          className="form-input"/>
                      </div>))}
                  </div>
                  <div className="contactos-grid-bottom">
                    <div>
                      <label className="form-label">CARGO</label>
                      <select
                        value={nuevoContacto.cargo}
                        onChange={(e) => setNuevoContacto({ ...nuevoContacto, cargo: e.target.value })}
                        className="form-input form-input--white">
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
                        className="form-input"/>
                    </div>
                    <button type="button" onClick={agregarContacto} className="btn-agregar">Agregar</button>
                  </div>
                  {formData.contactos.length > 0 && (
                    <table className="tabla-contactos">
                      <thead>
                        <tr><th>Nombre</th><th>Cargo</th><th>Contacto</th><th>Observaciones</th></tr>
                      </thead>
                      <tbody>
                        {formData.contactos.map((c, i) => (
                          <tr key={i}>
                            <td className="td-nombre">{c.nombre} {c.apellido}</td>
                            <td>{c.cargo}</td>
                            <td>{c.mail}</td>
                            <td>{c.obs}</td>
                          </tr>))}
                      </tbody>
                    </table>)}
                </div>)}

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
                </div>)}

              {tabActiva === 'Historia' && (
                <div>
                  <div className="historia-grid">
                    <input type="text" value={nuevaHistoria.descripcion} onChange={(e) => setNuevaHistoria({ ...nuevaHistoria, descripcion: e.target.value })} className="form-input" placeholder="Descripción..."/>
                    <input type="text" value={nuevaHistoria.fecha} onChange={(e) => setNuevaHistoria({ ...nuevaHistoria, fecha: e.target.value })} className="form-input"/>
                    <select value={nuevaHistoria.tipo} onChange={(e) => setNuevaHistoria({ ...nuevaHistoria, tipo: e.target.value })} className="form-input form-input--white">
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
                          </tr>))}
                      </tbody>
                    </table>)}
                </div>)}

              {tabActiva === 'Actividades' && (
                <div className="actividades-tab-panel">
                  <table className="tabla-actividades">
                    <thead>
                      <tr>
                        <th style={{ width: '120px' }}>Código</th>
                        <th>Actividad</th>
                      </tr>
                    </thead>
                    <tbody>
                      {actividadesFichaActual.length > 0 ? (
                        actividadesFichaActual.map((act, i) => (
                          <tr key={i}>
                            <td style={{ fontWeight: '600', color: '#1e293b' }}>
                              {act.codigo}
                            </td>
                            <td className="td-actividad" style={{ fontSize: '13px', color: '#334155' }}>
                              {act.nombre}
                            </td>
                          </tr>))
                      ) : (
                        <tr>
                          <td colSpan="3" style={{ textAlign: 'center', color: '#64748b', padding: '15px' }}>
                            No hay actividades registradas directas ni vinculadas a servicios activos.
                          </td>
                        </tr>)}
                    </tbody>
                  </table>
                </div>)}

              {tabActiva === 'Presupuestos' && <p style={{ fontSize: '13px', color: '#64748b', padding: '10px' }}>Módulo Presupuestos vinculado al ID del cliente.</p>}
              {tabActiva === 'Establecimientos' && <p style={{ fontSize: '13px', color: '#64748b', padding: '10px' }}>Listado de plantas, locales y números RUCA/RNE asignados.</p>}
              {tabActiva === 'Vencimientos' && <p style={{ fontSize: '13px', color: '#dc2626', fontWeight: 'bold', padding: '10px' }}>Próximo vencimiento de tasa: 30/06/2026</p>}

              {tabActiva === 'Servicios' && (
                <div>
                  <div className="servicios-subtabs" style={{ display: 'flex', gap: '10px', marginBottom: '15px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                    <button
                      type="button"
                      onClick={() => cambiarSubTabServicios('activos')}
                      className={`ficha-tab-btn ${subTabServicios === 'activos' ? 'ficha-tab-btn--activa' : ''}`}
                      style={{ fontSize: '12px', padding: '6px 12px' }}>
                      Servicios Activos
                    </button>
                    <button
                      type="button"
                      onClick={() => cambiarSubTabServicios('historico')}
                      className={`ficha-tab-btn ${subTabServicios === 'historico' ? 'ficha-tab-btn--activa' : ''}`}
                      style={{ fontSize: '12px', padding: '6px 12px' }}>
                      Histórico
                    </button>
                  </div>

                  {/* BARRA DE FILTROS LOCALES */}
                  <div className="servicios-local-filters" style={{ display: 'flex', gap: '10px', marginBottom: '15px', background: '#f8fafc', padding: '12px', borderRadius: '6px', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <input
                        type="text"
                        placeholder="Filtrar servicios por nombre..."
                        value={filtroSrvNombre}
                        onChange={(e) => setFiltroSrvNombre(e.target.value)}
                        className="form-input"
                        style={{ background: '#fff', margin: 0 }}/>
                    </div>
                    <div style={{ minWidth: '180px' }}>
                      <select
                        value={filtroSrvEstado}
                        onChange={(e) => setFiltroSrvEstado(e.target.value)}
                        className="form-input form-input--white"
                        style={{ margin: 0 }}>
                        <option value="">Todos los finalizados</option>
                        {estadosServicios
                          .filter(est => subTabServicios === 'historico' 
                            ? (est === "10. Finalizada" || est === "11. Finalizada. no corresponde facturar")
                            : (est !== "10. Finalizada" && est !== "11. Finalizada. no corresponde facturar"))
                          .map(est => <option key={est} value={est}>{est}</option>)}
                      </select>
                    </div>
                    <div style={{ minWidth: '220px' }}>
                      <select
                        value={filtroSrvActividad}
                        onChange={(e) => setFiltroSrvActividad(e.target.value)}
                        className="form-input form-input--white"
                        style={{ margin: 0 }}
                      >
                        <option value="">Todas las actividades</option>
                        {actividadesUnicas.map(codigo => (
                          <option key={codigo} value={codigo}>
                            [{codigo}] {getNombreActividad(codigo)}
                          </option>))}
                      </select>
                    </div>
                    {(filtroSrvNombre || filtroSrvEstado || filtroSrvActividad) && (
                      <button type="button" onClick={limpiarFiltrosInternosServicios} className="btn-clear-inline" style={{ padding: '6px 12px', height: 'auto', margin: 0 }}>
                        Limpiar
                      </button>)}
                  </div>

                 <table className="tabla-servicios">
                    <thead>
                      <tr><th>Servicio</th><th>Estado</th><th>Actividad ARCA Asignada</th></tr>
                    </thead>
                    <tbody>
                      {serviciosSegunSubTab.length > 0 ? (
                        serviciosSegunSubTab.map((s, i) => {
                          const actVal = obtenerActividadDeServicio(s);
                          let textoActividad = 'N/A';

                          if (actVal) {
                            const transformarActividad = (act) => {
                              if (!act) return '';
                              const cod = obtenerCodigoActividad(act);
                              if (!cod) return typeof act === 'object' ? (act.nombre || '') : String(act);
                              const nombre = getNombreActividad(cod);
                              return nombre !== cod ? `[${cod}] ${nombre}` : cod;};

                            if (Array.isArray(actVal)) {
                              textoActividad = actVal.map(transformarActividad).filter(Boolean).join(', ');
                            } else {
                              textoActividad = transformarActividad(actVal);
                            }}
                          
                          return (
                            <tr key={i}>
                              <td style={{ fontWeight: '500' }}>{s.servicio}</td>
                              <td>
                                <span className={getBadgeServicioClass(s.estado)}>
                                  {s.estado || '1. Pendiente de asignacion'}
                                </span>
                              </td>
                              <td style={{ fontSize: '12px', color: '#334155' }}>
                                {textoActividad === 'N/A' ? <span className="td-na" style={{ color: '#94a3b8' }}>N/A</span> : textoActividad}
                              </td>
                            </tr>);})
                      ) : (
                        <tr>
                          <td colSpan="3" style={{ textAlign: 'center', color: '#64748b', fontSize: '13px', padding: '15px' }}>
                            No se encontraron servicios que coincidan con los filtros locales.
                          </td>
                        </tr>)}
                    </tbody>
                  </table>
                </div>)}
            </div>
          </div>

          <div className="ficha-form__acciones">
            <button type="button" onClick={() => { setClienteEditando(null); setFormData(null); limpiarFiltrosInternosServicios(); }} className="btn-cancelar">
              Cancelar
            </button>
            <button type="submit" className="btn-guardar">Guardar Cambios</button>
          </div>
        </form>)}
    </div>);};

export default Clientes;