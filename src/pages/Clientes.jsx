import { useState } from 'react';
import { actividadesArca } from '../data/actividadesDB';

const Clientes = ({ clientes, setClientes, catalogoServicios }) => {
  const getNombreActividad = (codigo) => {
    const actividad = actividadesArca.find(a => a.codigo === codigo);
    return actividad ? actividad.nombre : codigo;
  };
  
  const [clienteEditando, setClienteEditando] = useState(null);
  const [formData, setFormData] = useState(null);
  const [tabActiva, setTabActiva] = useState('Actividades');
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroServicio, setFiltroServicio] = useState('');
  const [filtroActividad, setFiltroActividad] = useState('');
  
  const [nuevoContacto, setNuevoContacto] = useState({
    nombre: '', apellido: '', telefono: '', interno: '', celular: '', mail: '', cargo: 'TITULAR', obs: ''  });
  
  const [nuevaHistoria, setNuevaHistoria] = useState({
    descripcion: '', fecha: '18/03/2026', tipo: 'Historia'  });
  
  const [nuevoServicio, setNuevoServicio] = useState({
    nombre: '', abono: '', estado: 'Activo', fechaInicio: '16/06/2026', actividadArca: ''  });
  
  const tiposUnicos = Array.from(new Set(clientes.map(c => c.tipoCliente).filter(Boolean)));
  const serviciosUnicos = Array.from(new Set(
    clientes.flatMap(c => c.servicios || []).map(s => s.nombre).filter(Boolean)  ));
  
  const actividadesUnicas = Array.from(new Set([
    ...clientes.flatMap(c => c.actividades || []),
    ...clientes.flatMap(c => c.servicios || []).map(s => s.actividadArca)
  ].filter(Boolean)));

  const clientesFiltrados = clientes.filter(cliente => {
    const cumpleTexto = !filtroTexto || 
      cliente.razonSocial.toLowerCase().includes(filtroTexto.toLowerCase()) ||
      cliente.cuit.includes(filtroTexto);
    const cumpleTipo = !filtroTipo || cliente.tipoCliente === filtroTipo;
    const cumpleServicio = !filtroServicio || 
      (cliente.servicios && cliente.servicios.some(s => s.nombre === filtroServicio)); 
    const cumpleActividad = !filtroActividad || 
      (cliente.actividades && cliente.actividades.includes(filtroActividad)) ||
      (cliente.servicios && cliente.servicios.some(s => s.actividadArca === filtroActividad));
    return cumpleTexto && cumpleTipo && cumpleServicio && cumpleActividad;  });

  const limpiarFiltros = () => {
    setFiltroTexto('');
    setFiltroTipo('');
    setFiltroServicio('');
    setFiltroActividad('');  };

  const toggleBoletin = (id) => {
    setClientes(clientes.map(c => 
      c.id === id ? { ...c, enviarBoletin: !c.enviarBoletin } : c    ));  };

  const manejarEdicion = (cliente) => {
    setClienteEditando(cliente.id);
    setFormData({
      ...cliente,
      condicionFiscal: cliente.condicionFiscal || 'Responsable Inscripto',
      domicilioFiscal: cliente.domicilioFiscal || 'Av. Corrientes 1234',
      cp: cliente.cp || '2000',
      localidadFiscal: cliente.localidadFiscal || 'Rosario',
      mailFacturacionPrimario: cliente.mailFacturacionPrimario || 'mail@empresa.com',
      mailFacturacionSecundario: cliente.mailFacturacionSecundario || 'mail2@empresa.com',
      dirAdmin_direccion: cliente.dirAdmin_direccion || '',
      dirAdmin_localidad: cliente.dirAdmin_localidad || '',
      dirAdmin_cp: cliente.dirAdmin_cp || '',
      dirCorr_direccion: cliente.dirCorr_direccion || '',
      dirCorr_localidad: cliente.dirCorr_localidad || '',
      dirCorr_cp: cliente.dirCorr_cp || '',
      contactos: cliente.contactos || [],
      historia: cliente.historia || [],
      servicios: cliente.servicios || [],
      actividades: cliente.actividades || ["472110 — Venta al por menor de productos alimenticios", "620100 — Actividades de programación informática"]
    });
    setTabActiva('Actividades');  };

  const manejarCambio = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value    });  };

  const manejarSeleccionServicio = (nombre) => {
  const servicioInfo = catalogoServicios.find(s => s.nombre === nombre);
  setNuevoServicio({
    ...nuevoServicio,
    nombre: nombre,
    abono: servicioInfo ? servicioInfo.precioBase : '', 
    actividadArca: servicioInfo ? (servicioInfo.actividadesArca[0] || '') : ''  });};

  const agregarContacto = () => {
    if (!nuevoContacto.nombre && !nuevoContacto.apellido) return;
    setFormData({ ...formData, contactos: [...formData.contactos, nuevoContacto] });
    setNuevoContacto({ nombre: '', apellido: '', telefono: '', interno: '', celular: '', mail: '', cargo: 'TITULAR', obs: '' });  };

  const agregarHistoria = () => {
    if (!nuevaHistoria.descripcion) return;
    setFormData({ ...formData, historia: [...formData.historia, nuevaHistoria] });
    setNuevaHistoria({ descripcion: '', fecha: '18/03/2026', tipo: 'Historia' });  };

  const agregarServicio = () => {
    if (!nuevoServicio.nombre) return;
    setFormData({ ...formData, servicios: [...formData.servicios, nuevoServicio] });
    setNuevoServicio({ nombre: '', abono: '', estado: 'Activo', fechaInicio: '16/06/2026', actividadArca: '' });  };

  const guardarCambios = (e) => {
    e.preventDefault();
    setClientes(clientes.map(c => c.id === formData.id ? formData : c));
    setClienteEditando(null);
    setFormData(null);  };

  const estiloLabelForm = {
    display: 'block',
    fontSize: '11px',
    fontWeight: 'bold',
    color: '#94a3b8',
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'  };

  const estiloInputForm = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid #e2e8f0',
    backgroundColor: '#f8fafc',
    color: '#334155',
    fontSize: '14px',
    boxSizing: 'border-box',
    outline: 'none'  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif', color: '#334155', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {!clienteEditando && (
        <>
          <div style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '10px', marginBottom: '25px' }}>
            <h2 style={{ margin: 0, color: '#0f172a' }}>Directorio de Clientes</h2>
            <p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '14px' }}>
              Gestión integral de cuentas, condiciones fiscales y preferencias de comunicación.
            </p>
          </div>
          <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Filtros de Búsqueda Avanzada
            </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', alignItems: 'end' }}>
              <div>
                <label style={estiloLabelForm}>Buscar Cliente / CUIT</label>
                <input 
                  type="text" 
                  placeholder="ej. Lucena Bakery o CUIT..." 
                  value={filtroTexto}
                  onChange={(e) => setFiltroTexto(e.target.value)}
                  style={{ ...estiloInputForm, backgroundColor: '#fff' }}
                />
              </div>
              <div>
                <label style={estiloLabelForm}>Tipo de Cliente</label>
                <select 
                  value={filtroTipo} 
                  onChange={(e) => setFiltroTipo(e.target.value)}
                  style={{ ...estiloInputForm, backgroundColor: '#fff' }}
                >
                  <option value="">Todos los tipos</option>
                  {tiposUnicos.map(tipo => <option key={tipo} value={tipo}>{tipo}</option>)}
                </select>
              </div>
              <div>
                <label style={estiloLabelForm}>Por Servicio Contratado</label>
                <select 
                  value={filtroServicio} 
                  onChange={(e) => setFiltroServicio(e.target.value)}
                  style={{ ...estiloInputForm, backgroundColor: '#fff' }}
                >
                  <option value="">Todos los servicios</option>
                  {serviciosUnicos.map(srv => <option key={srv} value={srv}>{srv}</option>)}
                </select>
              </div>
              <div>
                <label style={estiloLabelForm}>Por Actividad de ARCA</label>
                <select 
                  value={filtroActividad} 
                  onChange={(e) => setFiltroActividad(e.target.value)}
                  style={{ ...estiloInputForm, backgroundColor: '#fff' }}
                >
                  <option value="">Todas las actividades</option>
                  {actividadesUnicas.map(act => <option key={act} value={act}>{act}</option>)}
                </select>
              </div>
              {(filtroTexto || filtroTipo || filtroServicio || filtroActividad) && (
                <button
                  type="button"
                  onClick={limpiarFiltros}
                  style={{ padding: '10px 14px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', height: '40px', transition: 'background-color 0.2s' }}
                >
                  Limpiar Filtros
                </button>
              )}
            </div>
            <div style={{ marginTop: '12px', fontSize: '12px', color: '#94a3b8', fontWeight: '500' }}>
              Mostrando {clientesFiltrados.length} de {clientes.length} clientes encontrados.
            </div>
          </div>
          <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #cbd5e1', color: '#475569', backgroundColor: '#f8fafc' }}>
                    <th style={{ padding: '12px' }}>Razón Social</th>
                    <th style={{ padding: '12px' }}>CUIT</th>
                    <th style={{ padding: '12px' }}>Tipo Cliente</th>
                    <th style={{ padding: '12px' }}>Servicios Activos</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Boletín</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Saldo</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {clientesFiltrados.map((cliente) => (
                    <tr key={cliente.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '12px', fontWeight: '600', color: '#1e293b' }}>{cliente.razonSocial}</td>
                      <td style={{ padding: '12px', color: '#64748b' }}>{cliente.cuit}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: '#f1f5f9', fontSize: '11px', fontWeight: 'bold', color: '#475569' }}>
                          {cliente.tipoCliente}
                        </span>
                      </td>
                                            <td style={{ padding: '12px', verticalAlign: 'middle' }}>
                        {cliente.servicios && cliente.servicios.length > 0 ? (
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', maxWidth: '300px' }}>
                            {cliente.servicios.map((srv, idx) => {
                              let bgStyle = '#f1f5f9'; let txStyle = '#475569'; let borderStyle = '1px solid #cbd5e1';
                              if (srv.estado === 'Activo') { bgStyle = '#e0f2fe'; txStyle = '#0369a1'; borderStyle = '1px solid #bae6fd'; }
                              else if (srv.estado === 'Suspendido') { bgStyle = '#fef3c7'; txStyle = '#b45309'; borderStyle = '1px solid #fde68a'; }
                              else if (srv.estado === 'Baja') { bgStyle = '#ffe4e6'; txStyle = '#9f1239'; borderStyle = '1px solid #fecdd3'; }

                              return (
                                <span key={idx} title={srv.actividadArca ? `Actividad ARCA: ${srv.actividadArca}` : ''} style={{
                                  padding: '2px 8px', borderRadius: '9999px', backgroundColor: bgStyle, color: txStyle, border: borderStyle, fontSize: '11px', fontWeight: '500', whiteSpace: 'nowrap'
                                }}>
                                  {srv.nombre}
                                </span>                              );                            })}
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '12px' }}>Sin servicios</span>
                        )}
                      </td>

                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <input 
                          type="checkbox" 
                          checked={cliente.enviarBoletin || false} 
                          onChange={() => toggleBoletin(cliente.id)}
                          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: cliente.saldo < 0 ? '#dc2626' : '#16a34a' }}>
                        ${cliente.saldo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <button 
                          onClick={() => manejarEdicion(cliente)}
                          style={{ padding: '6px 12px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                        >
                          Editar Ficha
                        </button>
                      </td>
                    </tr>                  ))}
                  {clientesFiltrados.length === 0 && (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', fontStyle: 'italic' }}>
                        No se encontraron clientes que coincidan con los criterios de búsqueda.
                      </td>
                    </tr>                  )}
                </tbody>
              </table>
            </div>
          </div>        </>)}

      {clienteEditando && formData && (
        <form onSubmit={guardarCambios} style={{ backgroundColor: '#f8fafc', padding: '10px' }}>
          
          <div style={{ marginBottom: '20px' }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#94a3b8', letterSpacing: '0.5px' }}>MÓDULO CLIENTES</span>
            <h2 style={{ margin: '2px 0 0 0', color: '#0f172a', fontSize: '24px', fontWeight: '600' }}>Editar Ficha</h2>
          </div>
          <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '24px', marginBottom: '20px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#94a3b8', marginBottom: '16px', letterSpacing: '0.5px' }}>DATOS FISCALES</div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={estiloLabelForm}>Razón Social</label>
                <input type="text" name="razonSocial" value={formData.razonSocial} onChange={manejarCambio} style={estiloInputForm} />
              </div>
              <div>
                <label style={estiloLabelForm}>CUIT</label>
                <input type="text" name="cuit" value={formData.cuit} onChange={manejarCambio} style={estiloInputForm} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr 0.6fr 1.4fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={estiloLabelForm}>Condición Fiscal</label>
                <input type="text" name="condicionFiscal" value={formData.condicionFiscal} onChange={manejarCambio} style={estiloInputForm} />
              </div>
              <div>
                <label style={estiloLabelForm}>Domicilio Fiscal</label>
                <input type="text" name="domicilioFiscal" value={formData.domicilioFiscal} onChange={manejarCambio} style={estiloInputForm} />
              </div>
              <div>
                <label style={estiloLabelForm}>CP</label>
                <input type="text" name="cp" value={formData.cp} onChange={manejarCambio} style={estiloInputForm} />
              </div>
              <div>
                <label style={estiloLabelForm}>Localidad</label>
                <input type="text" name="localidadFiscal" value={formData.localidadFiscal} onChange={manejarCambio} style={estiloInputForm} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1.5fr', gap: '16px' }}>
              <div>
                <label style={estiloLabelForm}>Mail Principal</label>
                <input type="email" name="mailFacturacionPrimario" value={formData.mailFacturacionPrimario} onChange={manejarCambio} style={estiloInputForm} />
              </div>
              <div>
                <label style={estiloLabelForm}>Mail Secundario</label>
                <input type="email" name="mailFacturacionSecundario" value={formData.mailFacturacionSecundario} onChange={manejarCambio} style={estiloInputForm} />
              </div>
              <div>
                <label style={estiloLabelForm}>Saldo</label>
                <div style={{ ...estiloInputForm, display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc' }}>
                  <span style={{ padding: '2px 8px', borderRadius: '12px', backgroundColor: formData.saldo >= 0 ? '#dcfce7' : '#fee2e2', color: formData.saldo >= 0 ? '#15803d' : '#b91c1c', fontSize: '12px', fontWeight: 'bold' }}>
                    ${formData.saldo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)', overflow: 'hidden', marginBottom: '25px' }}>
            <div style={{ display: 'flex', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '0 10px', overflowX: 'auto' }}>
              {['Contactos', 'Direcciones', 'Historia', 'Actividades', 'Presupuestos', 'Establecimientos', 'Vencimientos', 'Servicios'].map((tab) => {
                const esActiva = tabActiva === tab;
                return (
                  <button key={tab} type="button" onClick={() => setTabActiva(tab)} style={{ padding: '14px 20px', backgroundColor: 'transparent', border: 'none', borderBottom: esActiva ? '2px solid #3b82f6' : '2px solid transparent', color: esActiva ? '#3b82f6' : '#64748b', fontWeight: esActiva ? '600' : 'normal', fontSize: '14px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    {tab}
                  </button>                );              })}
            </div>
            <div style={{ padding: '24px' }}>
              {tabActiva === 'Contactos' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px', marginBottom: '16px' }}>
                    {[
                      { l: 'NOMBRE', k: 'nombre' }, { l: 'APELLIDO', k: 'apellido' }, { l: 'TELÉFONO', k: 'telefono' },
                      { l: 'INTERNO', k: 'interno' }, { l: 'CELULAR', k: 'celular' }, { l: 'MAIL', k: 'mail' }
                    ].map((item) => (
                      <div key={item.l}>
                        <label style={estiloLabelForm}>{item.l}</label>
                        <input type="text" value={nuevoContacto[item.k]} onChange={(e) => setNuevoContacto({ ...nuevoContacto, [item.k]: e.target.value })} style={estiloInputForm} />
                      </div>                    ))}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 3.5fr 1fr', gap: '12px', alignItems: 'end' }}>
                    <div>
                      <label style={estiloLabelForm}>CARGO</label>
                      <select value={nuevoContacto.cargo} onChange={(e) => setNuevoContacto({ ...nuevoContacto, cargo: e.target.value })} style={{ ...estiloInputForm, backgroundColor: '#fff' }}>
                        <option>TITULAR</option><option>APODERADO</option><option>CONTADOR</option>
                      </select>
                    </div>
                    <div>
                      <label style={estiloLabelForm}>OBS</label>
                      <input type="text" value={nuevoContacto.obs} onChange={(e) => setNuevoContacto({ ...nuevoContacto, obs: e.target.value })} style={estiloInputForm} />
                    </div>
                    <button type="button" onClick={agregarContacto} style={{ padding: '10px 0', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Agregar</button>
                  </div>
                  {formData.contactos.length > 0 && (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginTop: '20px', border: '1px solid #e2e8f0' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}><th style={{ padding: '8px' }}>Nombre</th><th style={{ padding: '8px' }}>Cargo</th><th style={{ padding: '8px' }}>Contacto</th><th style={{ padding: '8px' }}>Observaciones</th></tr>
                      </thead>
                      <tbody>
                        {formData.contactos.map((c, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}><td style={{ padding: '8px', fontWeight: '500' }}>{c.nombre} {c.apellido}</td><td style={{ padding: '8px' }}>{c.cargo}</td><td style={{ padding: '8px' }}>{c.mail}</td><td style={{ padding: '8px' }}>{c.obs}</td></tr>
                        ))}
                      </tbody>
                    </table>                  )}
                </div>              )}
              {tabActiva === 'Direcciones' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                  <div>
                    <h4 style={{ margin: '0 0 14px 0', fontSize: '13px', color: '#b45309' }}>Dirección administrativa</h4>
                    <input type="text" name="dirAdmin_direccion" value={formData.dirAdmin_direccion} onChange={manejarCambio} style={{ ...estiloInputForm, marginBottom: '12px' }} placeholder="Calle..." />
                    <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '12px' }}>
                      <input type="text" name="dirAdmin_localidad" value={formData.dirAdmin_localidad} onChange={manejarCambio} style={estiloInputForm} placeholder="Localidad" />
                      <input type="text" name="dirAdmin_cp" value={formData.dirAdmin_cp} onChange={manejarCambio} style={estiloInputForm} placeholder="CP" />
                    </div>
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 14px 0', fontSize: '13px', color: '#b45309' }}>Dirección de correspondencia</h4>
                    <input type="text" name="dirCorr_direccion" value={formData.dirCorr_direccion} onChange={manejarCambio} style={{ ...estiloInputForm, marginBottom: '12px' }} placeholder="Calle..." />
                    <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '12px' }}>
                      <input type="text" name="dirCorr_localidad" value={formData.dirCorr_localidad} onChange={manejarCambio} style={estiloInputForm} placeholder="Localidad" />
                      <input type="text" name="dirCorr_cp" value={formData.dirCorr_cp} onChange={manejarCambio} style={estiloInputForm} placeholder="CP" />
                    </div>
                  </div>
                </div>              )}
              {tabActiva === 'Historia' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '3fr 1.2fr 1.2fr 0.8fr', gap: '12px', alignItems: 'end' }}>
                    <input type="text" value={nuevaHistoria.descripcion} onChange={(e) => setNuevaHistoria({ ...nuevaHistoria, descripcion: e.target.value })} style={estiloInputForm} placeholder="Descripción..." />
                    <input type="text" value={nuevaHistoria.fecha} onChange={(e) => setNuevaHistoria({ ...nuevaHistoria, fecha: e.target.value })} style={estiloInputForm} />
                    <select value={nuevaHistoria.tipo} onChange={(e) => setNuevaHistoria({ ...nuevaHistoria, tipo: e.target.value })} style={{ ...estiloInputForm, backgroundColor: '#fff' }}><option>Historia</option><option>Llamada</option><option>Reunión</option></select>
                    <button type="button" onClick={agregarHistoria} style={{ padding: '10px 0', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Agregar</button>
                  </div>
                  {formData.historia.length > 0 && (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginTop: '20px', border: '1px solid #e2e8f0' }}>
                      <tbody>
                        {formData.historia.map((h, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}><td style={{ padding: '8px', width: '100px' }}>{h.fecha}</td><td style={{ padding: '8px', width: '100px' }}>{h.tipo}</td><td style={{ padding: '8px' }}>{h.descripcion}</td></tr>
                        ))}
                      </tbody>
                    </table>                  )}
                </div>              )}
              {tabActiva === 'Actividades' && (
                <div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}><th style={{ padding: '10px' }}>TIPO</th><th style={{ padding: '10px' }}>ACTIVIDAD REGISTRADA ARCA</th></tr>
                    </thead>
                    <tbody>
                      {formData.actividades.map((act, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px 10px' }}>{i === 0 ? 'Principal' : `Secundaria`}</td>
                          <td style={{ padding: '12px 10px', fontWeight: '500' }}>{act}</td>
                        </tr>                      ))}
                    </tbody>
                  </table>
                </div>              )}
              {tabActiva === 'Presupuestos' && <div><p style={{ fontSize: '13px', color: '#64748b' }}>Módulo Presupuestos vinculado al ID del cliente.</p></div>}
              {tabActiva === 'Establecimientos' && <div><p style={{ fontSize: '13px', color: '#64748b' }}>Listado de plantas, locales y números RUCA/RNE asignados.</p></div>}
              {tabActiva === 'Vencimientos' && <div><p style={{ fontSize: '13px', color: '#dc2626', fontWeight: 'bold' }}>Próximo vencimiento de tasa: 30/06/2026</p></div>}
              {tabActiva === 'Servicios' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.5fr 0.8fr', gap: '12px', alignItems: 'end', marginBottom: '16px' }}>
                    <div>
                      <label style={estiloLabelForm}>Nombre del Servicio</label>
                      <select 
                        value={nuevoServicio?.nombre || ''} 
                        onChange={(e) => manejarSeleccionServicio(e.target.value)} 
                        style={{ ...estiloInputForm, backgroundColor: '#fff' }}
                      >
                        <option value="">Seleccione servicio...</option>
                        {(catalogoServicios || []).map(s => (
                          <option key={s.id} value={s.nombre}>{s.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={estiloLabelForm}>Abono</label>
                      <input type="text" placeholder="Monto..." value={nuevoServicio?.abono || ''} onChange={(e) => setNuevoServicio({ ...nuevoServicio, abono: e.target.value })} style={estiloInputForm} />
                    </div>
                    <div>
                      <label style={estiloLabelForm}>Estado</label>
                      <select value={nuevoServicio?.estado || 'Activo'} onChange={(e) => setNuevoServicio({ ...nuevoServicio, estado: e.target.value })} style={{ ...estiloInputForm, backgroundColor: '#fff' }}>
                        <option value="Activo">Activo</option>
                        <option value="Suspendido">Suspendido</option>
                        <option value="Baja">Baja</option>
                      </select>
                    </div>
                    <div>
                      <label style={estiloLabelForm}>Actividad ARCA</label>
                      <input type="text" value={nuevoServicio?.actividadArca || ''} onChange={(e) => setNuevoServicio({ ...nuevoServicio, actividadArca: e.target.value })} style={estiloInputForm} />
                    </div>
                    <button type="button" onClick={agregarServicio} style={{ padding: '10px 0', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Agregar</button>
                  </div>
                  
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', border: '1px solid #e2e8f0', marginTop: '10px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc' }}>
                        <th style={{ padding: '8px' }}>Servicio</th>
                        <th style={{ padding: '8px' }}>Abono</th>
                        <th style={{ padding: '8px' }}>Estado</th>
                        <th style={{ padding: '8px' }}>Actividad ARCA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(formData?.servicios || []).map((s, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '8px' }}>{s.nombre}</td>
                          <td style={{ padding: '8px' }}>${s.abono}</td>
                          <td style={{ padding: '8px' }}>{s.estado}</td>
                          <td style={{ padding: '8px' }}>{s.actividadArca || <span style={{ color: '#ccc', fontStyle: 'italic' }}>N/A</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>              )}
                          </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingBottom: '40px' }}>
            <button type="button" onClick={() => { setClienteEditando(null); setFormData(null); }} style={{ padding: '10px 20px', backgroundColor: '#fff', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Cancelar</button>
            <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Guardar Cambios</button>
          </div>
        </form>      )}
    </div> );};
export default Clientes;