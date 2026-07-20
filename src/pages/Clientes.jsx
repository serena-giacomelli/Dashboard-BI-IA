import { useState, useEffect, useRef } from 'react';
import { supabase } from '../utils/supabase.js';
import { useCatalogos } from '../hooks/useCatalogos.js';
import '../styles/Clientes.css';

const Clientes = ({ clientes, setClientes, serviciosData }) => {
  const { arca: actividadesArca, ruca: actividadesRuca, senasa: actividadesSenasa } = useCatalogos();

  const obtenerCodigoActividad = (act) => {
    if (!act) return '';
    if (typeof act === 'object') {
      const cod = act.codigo || act.id || act.actividadArca || act.actividad || '';
      return String(cod).split(' — ')[0].trim();
    }
    return String(act).split(' — ')[0].trim();
  };

  const getNombreActividadArca = (codigo) => {
    const limpia = String(codigo).split(' — ')[0].trim();
    const actividad = (actividadesArca || []).find(a => String(a.codigo) === limpia);
    return actividad ? actividad.nombre : limpia;
  };

  const getNombreActividadRuca = (codigo) => {
    const limpia = String(codigo).split(' — ')[0].trim();
    const actividad = (actividadesRuca || []).find(a => String(a.codigo) === limpia);
    return actividad ? actividad.nombre : limpia;
  };

  const getNombreActividadSenasa = (codigo) => {
    const limpia = String(codigo).split(' — ')[0].trim();
    const actividad = (actividadesSenasa || []).find(a => String(a.codigo) === limpia);
    return actividad ? actividad.nombre : limpia;
  };

  const obtenerActividadDeServicio = (s) => {
    if (!s) return null;
    
    if (s.actividadesCliente && s.actividadesCliente.arca) {
      return s.actividadesCliente.arca;
    }

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
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroGlobalEstados, setFiltroGlobalEstados] = useState([]);
  const [mostrarFiltroEstados, setMostrarFiltroEstados] = useState(false);
  const [filtroGlobalActividad, setFiltroGlobalActividad] = useState('');
  const [ordenarPor, setOrdenarPor] = useState('razonSocial');
  const [ordenDireccion, setOrdenDireccion] = useState('asc');
  const [filtroSrvNombre, setFiltroSrvNombre] = useState('');
  const [filtroSrvEstado, setFiltroSrvEstado] = useState('');
  const [filtroSrvActividad, setFiltroSrvActividad] = useState('');
  const [nuevoContacto, setNuevoContacto] = useState({ nombre: '', apellido: '', telefono: '', interno: '', celular: '', mail: '', cargo: 'TITULAR', obs: '' });
  const [nuevaHistoria, setNuevaHistoria] = useState({ descripcion: '', fecha: '18/03/2026', tipo: 'Historia' });
  const [nuevoServicio, setNuevoServicio] = useState({ servicio: '', estado: '1. Pendiente de asignacion', fechaInicio: '16/06/2026', actividadArca: '' });
  const [subTabServicios, setSubTabServicios] = useState('activos');
  const filtroEstadosRef = useRef(null);
  const [filtroCapaCliente, setFiltroCapaCliente] = useState('ARCA');

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filtroEstadosRef.current && !filtroEstadosRef.current.contains(event.target)) {
        setMostrarFiltroEstados(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => { document.removeEventListener('mousedown', handleClickOutside); };
  }, []);

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

  const manejarOrden = (campo) => {
    if (ordenarPor === campo) {
      setOrdenDireccion(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setOrdenarPor(campo);
      setOrdenDireccion('asc');
    }
  };

  const clientesFiltrados = clientes
    .filter(cliente => {
      const cumpleTexto = !filtroTexto ||
        cliente.razonSocial.toLowerCase().includes(filtroTexto.toLowerCase()) ||
        String(cliente.cuit || '').includes(filtroTexto);
      const cumpleEstado =
        filtroGlobalEstados.length === 0 || (cliente.servicios || []).some(s =>
          filtroGlobalEstados.includes(s.estado));

      const cumpleActividad = !filtroGlobalActividad ||
        (cliente.servicios || []).some(s => {
          const acts = obtenerActividadDeServicio(s);
          const actsArray = Array.isArray(acts) ? acts : (acts ? [acts] : []);
          return actsArray.some(act => obtenerCodigoActividad(act) === filtroGlobalActividad);
        });

      return cumpleTexto && cumpleEstado && cumpleActividad;
    })
    .sort((a, b) => {
      let valA = a[ordenarPor];
      let valB = b[ordenarPor];

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = (valB || '').toLowerCase();
        return ordenDireccion === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else {
        valA = valA || 0;
        valB = valB || 0;
        return ordenDireccion === 'asc' ? valA - valB : valB - valA;
      }
    });

  const getActividadesMulticapa = () => {
    const listaArca = new Set();
    const listaRuca = new Set();
    const listaSenasa = new Set();

    if (!formData) return { arca: [], ruca: [], senasa: [] };

    (formData.servicios || []).forEach(s => {
      if (s.actividadesCliente) {
        (s.actividadesCliente.arca || []).forEach(cod => listaArca.add(cod));
        (s.actividadesCliente.ruca || []).forEach(cod => listaRuca.add(cod));
        (s.actividadesCliente.senasa || []).forEach(cod => listaSenasa.add(cod));
      } else {
        const acts = obtenerActividadDeServicio(s);
        const actsArray = Array.isArray(acts) ? acts : (acts ? [acts] : []);
        actsArray.forEach(act => {
          const cod = obtenerCodigoActividad(act);
          if (cod) listaArca.add(cod);
        });
      }
    });

    return {
      arca: Array.from(listaArca).map(cod => ({ codigo: cod, nombre: getNombreActividadArca(cod) })),
      ruca: Array.from(listaRuca).map(cod => ({ codigo: cod, nombre: getNombreActividadRuca(cod) })),
      senasa: Array.from(listaSenasa).map(cod => ({ codigo: cod, nombre: getNombreActividadSenasa(cod) }))
    };
  };

  const limpiarFiltrosInternosServicios = () => {
    setFiltroSrvNombre('');
    setFiltroSrvEstado('');
    setFiltroSrvActividad('');
  };

  const limpiarTodosLosFiltrosGlobales = () => {
    setFiltroTexto('');
    setFiltroGlobalEstados([]);
    setFiltroGlobalActividad('');
  };

  const toggleEstadoGlobal = (estado) => {
    setFiltroGlobalEstados(prev =>
      prev.includes(estado)
        ? prev.filter(e => e !== estado)
        : [...prev, estado]);
  };

  const cambiarSubTabServicios = (tab) => {
    setSubTabServicios(tab);
    limpiarFiltrosInternosServicios();
  };

  const toggleBoletin = async (id) => {
    const cliente = clientes.find(c => c.id === id);
    const nuevoEstado = !cliente.enviarBoletin;
    await supabase.from('clientes').update({ enviar_boletin: nuevoEstado }).eq('id', id);
    setClientes(clientes.map(c => c.id === id ? { ...c, enviarBoletin: nuevoEstado } : c));
  };

  const toggleNovedades = async (id) => {
    const cliente = clientes.find(c => c.id === id);
    const nuevoEstado = !cliente.enviarNovedades;
    
    await supabase.from('clientes').update({ enviar_novedades: nuevoEstado }).eq('id', id);
    setClientes(clientes.map(c => c.id === id ? { ...c, enviarNovedades: nuevoEstado } : c));
  };

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
    limpiarFiltrosInternosServicios();
  };

  const manejarCambio = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const agregarContacto = () => {
    if (!nuevoContacto.nombre && !nuevoContacto.apellido) return;
    setFormData({ ...formData, contactos: [...formData.contactos, nuevoContacto] });
    setNuevoContacto({ nombre: '', apellido: '', telefono: '', interno: '', celular: '', mail: '', cargo: 'TITULAR', obs: '' });
  };

  const agregarHistoria = () => {
    if (!nuevaHistoria.descripcion) return;
    setFormData({ ...formData, historia: [...formData.historia, nuevaHistoria] });
    setNuevaHistoria({ descripcion: '', fecha: '18/03/2026', tipo: 'Historia' });
  };

const guardarCambios = async (e) => {
    e.preventDefault();

    // 1. Actualizamos la tabla principal del cliente
    const { error: errCliente } = await supabase
      .from('clientes')
      .update({
        razon_social: formData.razonSocial,
        cuit: formData.cuit,
        condicion_fiscal: formData.condicionFiscal,
        domicilio_fiscal: formData.domicilioFiscal,
        localidad_fiscal: formData.localidadFiscal,
        mail_primario: formData.mailPrimario,
        mail_secundario: formData.mailSecundario,
        direccion_administrativa: formData.dirAdmin_direccion,
        localidad_admin: formData.dirAdmin_localidad
      })
      .eq('id', formData.id);

    if (errCliente) {
      console.error("Error al actualizar cliente:", errCliente);
      alert("Hubo un error al guardar los cambios principales.");
      return;
    }

    // 2. Sincronizamos Contactos (Borramos los anteriores e insertamos los nuevos)
    await supabase.from('cliente_contactos').delete().eq('cliente_id', formData.id);
    if (formData.contactos && formData.contactos.length > 0) {
      const contactosUpsert = formData.contactos.map(c => ({
        cliente_id: formData.id,
        nombre: c.nombre,
        apellido: c.apellido,
        telefono: c.telefono,
        interno: c.interno,
        celular: c.celular,
        mail: c.mail,
        cargo: c.cargo,
        obs: c.obs
      }));
      await supabase.from('cliente_contactos').insert(contactosUpsert);
    }

    // 3. Sincronizamos Historia
    await supabase.from('cliente_historia').delete().eq('cliente_id', formData.id);
    if (formData.historia && formData.historia.length > 0) {
      const historiaUpsert = formData.historia.map(h => ({
        cliente_id: formData.id,
        descripcion: h.descripcion,
        fecha: h.fecha,
        tipo: h.tipo
      }));
      await supabase.from('cliente_historia').insert(historiaUpsert);}

    setClientes(clientes.map(c => c.id === formData.id ? formData : c));
    setClienteEditando(null);
    setFormData(null);
    limpiarFiltrosInternosServicios();
  };

  const todosFiltradosMarcados = clientesFiltrados.length > 0 && clientesFiltrados.every(c => c.enviarBoletin);
  const todosFiltradosNovedades = clientesFiltrados.length > 0 && clientesFiltrados.every(c => c.enviarNovedades);

const toggleTodosFiltrados = async () => {
    const nuevoEstado = !todosFiltradosMarcados;
    const idsVisibles = clientesFiltrados.map(c => c.id);
    await supabase.from('clientes').update({ enviar_boletin: nuevoEstado }).in('id', idsVisibles);
    setClientes(prev => prev.map(c => idsVisibles.includes(c.id) ? { ...c, enviarBoletin: nuevoEstado } : c));
  };

const toggleTodosFiltradosNovedades = async () => {
    const nuevoEstado = !todosFiltradosNovedades;
    const idsVisibles = clientesFiltrados.map(c => c.id);
    
    await supabase.from('clientes').update({ enviar_novedades: nuevoEstado }).in('id', idsVisibles);
    setClientes(prev => prev.map(c => idsVisibles.includes(c.id) ? { ...c, enviarNovedades: nuevoEstado } : c));
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
    return 'badge-servicio badge-servicio--default';
  };

  const serviciosSegunSubTab = (formData?.servicios || [])
    .filter(s => {
      const esHistorico = s.estado === "10. Finalizada" || s.estado === "11. Finalizada. no corresponde facturar";
      return subTabServicios === 'historico' ? esHistorico : !esHistorico;
    })
    .filter(s => {
      const cumpleNombre = !filtroSrvNombre || s.servicio.toLowerCase().includes(filtroSrvNombre.toLowerCase());
      const cumpleEstado = !filtroSrvEstado || s.estado === filtroSrvEstado;

      let cumpleActividad = !filtroSrvActividad;
      if (filtroSrvActividad) {
        const acts = obtenerActividadDeServicio(s);
        const actsArray = Array.isArray(acts) ? acts : (acts ? [acts] : []);
        cumpleActividad = actsArray.some(act => obtenerCodigoActividad(act) === filtroSrvActividad);
      }
      return cumpleNombre && cumpleEstado && cumpleActividad;
    });

  return (
    <div className="clientes-wrapper">
      {!clienteEditando && (
        <>
          <div className="clientes-header">
            <h2>Directorio de Clientes</h2>
          </div>

          <div className="filtros-toolbar" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="filtros-toolbar__main-row" style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div className="search-bar-container" style={{ flex: 2, minWidth: '300px', margin: 0 }}>
                <input
                  type="text"
                  placeholder="Buscar por Razón Social o CUIT..."
                  value={filtroTexto}
                  onChange={(e) => setFiltroTexto(e.target.value)}
                  className="search-bar-input" />
              </div>

              <div ref={filtroEstadosRef}
                style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
                <button type="button" onClick={() =>
                  setMostrarFiltroEstados(!mostrarFiltroEstados)}
                  className="form-input form-input--white"
                  style={{ height: '40px', width: '100%', textAlign: 'left', cursor: 'pointer' }}>
                  {filtroGlobalEstados.length === 0
                    ? 'Todos los Estados'
                    : `${filtroGlobalEstados.length} estado(s) seleccionado(s)`}
                </button>

                {mostrarFiltroEstados && (
                  <div style={{ position: 'absolute', top: '45px', left: 0, right: 0, background: '#fff', border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px', zIndex: 1000, maxHeight: '300px', overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                  >
                    {estadosServicios.map((estado) => (
                      <label
                        key={estado}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', cursor: 'pointer' }}
                      >
                        <input
                          type="checkbox"
                          checked={filtroGlobalEstados.includes(estado)}
                          onChange={() => toggleEstadoGlobal(estado)} />
                        {estado}
                      </label>))}
                  </div>)}
              </div>

              <div style={{ flex: 1, minWidth: '220px' }}>
                <select
                  value={filtroGlobalActividad}
                  onChange={(e) => setFiltroGlobalActividad(e.target.value)}
                  className="form-input form-input--white"
                  style={{ margin: 0, height: '40px' }}>
                  <option value="">Todas las Actividades ARCA</option>
                  {actividadesUnicas.map(codigo => (
                    <option key={codigo} value={codigo}>
                      [{codigo}] {getNombreActividadArca(codigo)}
                    </option>))}
                </select>
              </div>
            </div>

            <div className="filtros-toolbar__stats" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                {(filtroTexto || filtroGlobalEstados.length > 0 || filtroGlobalActividad) && (
                  <button type="button" onClick={limpiarTodosLosFiltrosGlobales} className="btn-clear-inline" style={{ marginRight: '15px' }}>
                    Limpiar Filtros
                  </button>)}
                <span className="results-count"><b>{clientesFiltrados.length}</b> {clientesFiltrados.length === 1 ? 'resultado' : 'resultados'}</span>
              </div>
            </div>
          </div>

          <div className="tabla-clientes-panel">
            <div className="tabla-clientes-panel__scroll">
              <table className="tabla-clientes">
                <thead>
                  <tr>
                    <th onClick={() => manejarOrden('razonSocial')}>
                      Razón Social
                    </th>
                    <th>CUIT</th>
                    <th>Servicios Registrados</th>
                    <th className="th-center" style={{ userSelect: 'none' }}>
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                          margin: 0
                        }}>
                        <input
                          type="checkbox"
                          checked={todosFiltradosMarcados}
                          onChange={toggleTodosFiltrados}
                          disabled={clientesFiltrados.length === 0} />
                        <span>Boletín</span>
                      </label>
                    </th>
                    <th className="th-center" style={{ userSelect: 'none' }}>
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                          margin: 0
                        }}>
                        <input
                          type="checkbox"
                          checked={todosFiltradosNovedades}
                          onChange={toggleTodosFiltradosNovedades}
                          disabled={clientesFiltrados.length === 0} />
                        <span>Novedades</span>
                      </label>
                    </th>
                    <th onClick={() => manejarOrden('saldo')} className="th-right">
                      Saldo
                    </th>
                    <th className="th-center">
                      Acciones</th>
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
                        <input type="checkbox" checked={cliente.enviarBoletin || false} onChange={() => toggleBoletin(cliente.id)} className="checkbox-boletin" />
                      </td>
                      <td className="td-center">
                        <input type="checkbox" checked={cliente.enviarNovedades || false}
                          onChange={() => toggleNovedades(cliente.id)} className="checkbox-boletin"
                        />
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
                          className="form-input" />
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
                        className="form-input" />
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
                    <input type="text" value={nuevaHistoria.descripcion} onChange={(e) => setNuevaHistoria({ ...nuevaHistoria, descripcion: e.target.value })} className="form-input" placeholder="Descripción..." />
                    <input type="text" value={nuevaHistoria.fecha} onChange={(e) => setNuevaHistoria({ ...nuevaHistoria, fecha: e.target.value })} className="form-input" />
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

            {tabActiva === 'Actividades' && (() => {
                const actividadesVista = [];
                
                // Lógica para agrupar y filtrar según la capa seleccionada
                if (filtroCapaCliente === 'ARCA') {
                  const mapaArca = {};
                  
                  // Recorremos los servicios para encontrar las vinculaciones directas
                  (formData.servicios || []).forEach(s => {
                    let arcas = s.actividadesCliente?.arca || [];
                    
                    // Fallback por si hay servicios guardados con el formato antiguo
                    if (arcas.length === 0) {
                      const actAntigua = obtenerActividadDeServicio(s);
                      const actArr = Array.isArray(actAntigua) ? actAntigua : (actAntigua ? [actAntigua] : []);
                      arcas = actArr.map(a => obtenerCodigoActividad(a)).filter(Boolean);
                    }
                    
                    const rucas = s.actividadesCliente?.ruca || [];
                    const senasas = s.actividadesCliente?.senasa || [];

                    // Vinculamos RUCA y SENASA a su actividad ARCA correspondiente dentro del mismo servicio
                    arcas.forEach(cod => {
                      if (!mapaArca[cod]) mapaArca[cod] = { ruca: new Set(), senasa: new Set() };
                      rucas.forEach(r => mapaArca[cod].ruca.add(r));
                      senasas.forEach(se => mapaArca[cod].senasa.add(se));
                    });
                  });

                  Object.keys(mapaArca).forEach(cod => {
                    actividadesVista.push({
                      codigo: cod,
                      nombre: getNombreActividadArca(cod),
                      ruca: Array.from(mapaArca[cod].ruca),
                      senasa: Array.from(mapaArca[cod].senasa)
                    });
                  });
                } else if (filtroCapaCliente === 'RUCA') {
                  const setRuca = new Set();
                  (formData.servicios || []).forEach(s => {
                    (s.actividadesCliente?.ruca || []).forEach(cod => setRuca.add(cod));
                  });
                  Array.from(setRuca).forEach(cod => actividadesVista.push({ codigo: cod, nombre: getNombreActividadRuca(cod) }));
                } else if (filtroCapaCliente === 'SENASA') {
                  const setSenasa = new Set();
                  (formData.servicios || []).forEach(s => {
                    (s.actividadesCliente?.senasa || []).forEach(cod => setSenasa.add(cod));
                  });
                  Array.from(setSenasa).forEach(cod => actividadesVista.push({ codigo: cod, nombre: getNombreActividadSenasa(cod) }));
                }

                return (
                  <div className="actividades-tabla-container" style={{ padding: '24px 16px' }}>
                    
                    <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', borderBottom: '1px solid #e2e8f0' }}>
                      {['ARCA', 'RUCA', 'SENASA'].map((capa) => (
                        <button
                          key={capa}
                          type="button"
                          onClick={() => setFiltroCapaCliente(capa)}
                          style={{
                            padding: '8px 16px',
                            background: 'none',
                            border: 'none',
                            borderBottom: `2px solid ${filtroCapaCliente === capa ? '#3b82f6' : 'transparent'}`,
                            color: filtroCapaCliente === capa ? '#0f172a' : '#64748b',
                            fontWeight: filtroCapaCliente === capa ? 'bold' : 'normal',
                            cursor: 'pointer',
                            fontSize: '14px',
                            transition: 'all 0.2s'
                          }}
                        >
                          {capa}
                        </button>
                      ))}
                    </div>

                    <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 16px 0' }}>
                      {filtroCapaCliente === 'ARCA' 
                        ? 'Actividades principales y sus vinculaciones (RUCA/SENASA) según los servicios contratados' 
                        : `Actividades registradas en el organismo ${filtroCapaCliente}`}
                    </p>
                    
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc' }}>
                          <th style={{ padding: '12px 16px', color: '#64748b', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', width: '60%', borderBottom: 'none' }}>
                            Actividad {filtroCapaCliente}
                          </th>
                          {filtroCapaCliente === 'ARCA' && (
                            <th style={{ padding: '12px 16px', color: '#64748b', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', borderBottom: 'none' }}>
                              Vinculaciones
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {actividadesVista.length === 0 ? (
                          <tr>
                            <td colSpan={filtroCapaCliente === 'ARCA' ? 2 : 1} style={{ padding: '20px 16px', textAlign: 'center', color: '#94a3b8', fontSize: '14px', borderBottom: '1px solid #f1f5f9' }}>
                              No hay actividades de {filtroCapaCliente} asignadas.
                            </td>
                          </tr>
                        ) : (
                          actividadesVista.map((act, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '16px', fontSize: '14px', color: '#334155', verticalAlign: 'top' }}>
                                <span style={{ fontWeight: 'bold', color: '#3b82f6', fontFamily: 'monospace', marginRight: '8px' }}>
                                  {act.codigo}
                                </span> 
                                {act.nombre}
                              </td>
                              {filtroCapaCliente === 'ARCA' && (
                                <td style={{ padding: '16px', fontSize: '13px', color: '#555', verticalAlign: 'top', lineHeight: '1.6' }}>
                                  <div>
                                    <strong>RUCA:</strong> {act.ruca.length > 0 ? act.ruca.join(', ') : <span style={{color: '#94a3b8'}}>-</span>}
                                  </div>
                                  <div>
                                    <strong>SENASA:</strong> {act.senasa.length > 0 ? act.senasa.join(', ') : <span style={{color: '#94a3b8'}}>-</span>}
                                  </div>
                                </td>
                              )}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                );
              })()}

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
                  <div className="servicios-local-filters" style={{ display: 'flex', gap: '10px', marginBottom: '15px', background: '#f8fafc', padding: '12px', borderRadius: '6px', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <input
                        type="text"
                        placeholder="Filtrar servicios por nombre..."
                        value={filtroSrvNombre}
                        onChange={(e) => setFiltroSrvNombre(e.target.value)}
                        className="form-input"
                        style={{ background: '#fff', margin: 0 }} />
                    </div>
                    <div style={{ minWidth: '180px' }}>
                      <select
                        value={filtroSrvEstado}
                        onChange={(e) => setFiltroSrvEstado(e.target.value)}
                        className="form-input form-input--white"
                        style={{ margin: 0 }}>
                        
                        <option value="">
                          {subTabServicios === 'historico' ? "Todos los finalizados" : "Todos los activos"}
                        </option>
                        {estadosServicios
                          .filter(est => subTabServicios === 'historico' 
                            ? (est === "10. Finalizada" || est === "11. Finalizada. no corresponde facturar") 
                            : (est !== "10. Finalizada" && est !== "11. Finalizada. no corresponde facturar"))
                          .map(est => (
                            <option key={est} value={est}>
                              {est}
                            </option>
                          ))
                        }
                      </select>
                    </div>
                    <div style={{ minWidth: '220px' }}>
                      <select
                        value={filtroSrvActividad}
                        onChange={(e) => setFiltroSrvActividad(e.target.value)}
                        className="form-input form-input--white"
                        style={{ margin: 0 }}>
                        <option value="">Todas las actividades ARCA</option>
                        {actividadesUnicas.map(codigo => (
                          <option key={codigo} value={codigo}>
                            [{codigo}] {getNombreActividadArca(codigo)}
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
                      <tr><th>Servicio</th><th>Estado</th><th>Actividades Asignadas (ARCA / RUCA / SENASA)</th></tr>
                    </thead>
                    <tbody>
                      {serviciosSegunSubTab.length > 0 ? (
                        serviciosSegunSubTab.map((s, i) => (
                            <tr key={i}>
                              <td style={{ fontWeight: '500' }}>{s.servicio}</td>
                              <td>
                                <span className={getBadgeServicioClass(s.estado)}>
                                  {s.estado || '1. Pendiente de asignacion'}
                                </span>
                              </td>
                              <td style={{ fontSize: '12px', color: '#334155' }}>
                                {s.actividadesCliente ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {s.actividadesCliente.arca?.length > 0 && <div><strong>ARCA:</strong> {s.actividadesCliente.arca.join(', ')}</div>}
                                    {s.actividadesCliente.ruca?.length > 0 && <div><strong>RUCA:</strong> {s.actividadesCliente.ruca.join(', ')}</div>}
                                    {s.actividadesCliente.senasa?.length > 0 && <div><strong>SENASA:</strong> {s.actividadesCliente.senasa.join(', ')}</div>}
                                    {!s.actividadesCliente.arca?.length && !s.actividadesCliente.ruca?.length && !s.actividadesCliente.senasa?.length && <span style={{ color: '#94a3b8' }}>Sin asignaciones</span>}
                                  </div>
                                ) : (
                                  <span className="td-na" style={{ color: '#94a3b8' }}>N/A (Formato antiguo)</span>
                                )}
                              </td>
                            </tr>
                          ))
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
    </div>);
};

export default Clientes;