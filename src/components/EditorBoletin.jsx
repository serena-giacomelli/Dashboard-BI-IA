import { useState, useEffect } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import html2pdf from 'html2pdf.js';
import { LOGO_CIFAS_BASE64, LOGO_CIFAS_URL } from '../utils/assets.js';
import '../styles/EditorBoletin.css';

const ESTRUCTURA_ORGANISMOS_BORA = [  
  { id: 'min_economia', label: 'Ministerio de Economía', subtopicos: [{ id: 'eco_personal', label: 'Designaciones, Estructura Interna y Renuncias' }, { id: 'eco_subsidios', label: 'Transferencias de Partidas y Subsidios Provinciales' },{ id: 'eco_licitaciones', label: 'Licitaciones y Contratos Menores de Suministro' }]},
  { id: 'arca_afip', label: 'ARCA (Ex-AFIP) y Dirección de Aduanas', subtopicos: [{ id: 'arca_personal', label: 'Cambios de Jefaturas y Funciones Internas' },{ id: 'arca_prorrogas', label: 'Prórrogas de Vencimientos Impositivos de Rutina' }]},
  { id: 'min_capital_humano',label: 'Ministerio de Capital Humano', subtopicos: [{ id: 'ch_personal', label: 'Contrataciones y Altas de Personal' },{ id: 'ch_planes', label: 'Asignación de Fondos a Cooperativas y Planes Sociales' },{ id: 'ch_universidades', label: 'Convenios e Internas Universitarias' }]},
  { id: 'bcra_cnv', label: 'Banco Central (BCRA) y CNV', subtopicos: [{ id: 'fin_comunicados', label: 'Circulares de Comunicación Interna y Rutina' },{ id: 'fin_sanciones', label: 'Sumarios Administrativos Menores a Entidades' }]},
  { id: 'min_salud_anmat', label: 'Ministerio de Salud y ANMAT', subtopicos: [{ id: 'salud_compras', label: 'Compras de Insumos y Equipamiento Hospitalario' },{ id: 'salud_autorizaciones', label: 'Inscripciones de Rutina en el Registro de Medicamentos' }]},
  { id: 'min_seguridad_justicia', label: 'Ministerios de Seguridad y Justicia', subtopicos: [{ id: 'seg_ascensos', label: 'Ascensos, Retiros y Movimientos de Fuerzas Federales' },{ id: 'seg_erratas', label: 'Fe de Erratas y Avisos Oficiales de Juzgados' }]}];

const EditorBoletin = ({ clientesDB }) => {
  const [asunto, setAsunto] = useState('');
  const [cuerpoHtml, setCuerpoHtml] = useState('');
  const [boletinCompleto, setBoletinCompleto] = useState(''); 
  const [cargando, setCargando] = useState(false);
  const [generandoIA, setGenerandoIA] = useState(false);
  const [jurisdiccion, setJurisdiccion] = useState('nacional');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [organismosExcluidos, setOrganismosExcluidos] = useState([]);
  const [subtopicosExcluidos, setSubtopicosExcluidos] = useState([]);
  const [dropdownsAbiertos, setDropdownsAbiertos] = useState({});
  const [logAuditoriaIA, setLogAuditoriaIA] = useState([]);
  const [envioActual, setEnvioActual] = useState(0);
  const [historial, setHistorial] = useState([]);
  const [boletinSeleccionado, setBoletinSeleccionado] = useState(null);
  const [verDestinatariosModal, setVerDestinatariosModal] = useState(false);
  const [busquedaDestinatario, setBusquedaDestinatario] = useState('');
  const [tabActivo, setTabActivo] = useState('resumen');
  const [filtroHistorial, setFiltroHistorial] = useState('');
  const [ordenHistorial, setOrdenHistorial] = useState('recientes');
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina, setItemsPorPagina] = useState(5);

  useEffect(() => {
    const historialGuardado = JSON.parse(localStorage.getItem('historial_boletines') || '[]');
    setHistorial(historialGuardado);}, []);

  useEffect(() => {
    const cerrarDesplegablesAfuera = () => setDropdownsAbiertos({});
    window.addEventListener('click', cerrarDesplegablesAfuera);
    return () => window.removeEventListener('click', cerrarDesplegablesAfuera);}, []);

  const destinatarios = clientesDB?.filter(c => c.enviarBoletin === true) || [];
  const destinatariosFiltrados = destinatarios.filter(c =>
    c.razonSocial?.toLowerCase().includes(busquedaDestinatario.toLowerCase()) ||
    c.email?.toLowerCase().includes(busquedaDestinatario.toLowerCase()));

  const historialFiltrado = historial.filter(item =>
    item.asunto?.toLowerCase().includes(filtroHistorial.toLowerCase()));

  const historialOrdenado = [...historialFiltrado].sort((a, b) => {
    switch (ordenHistorial) {
      case 'recientes': return b.id - a.id;
      case 'antiguos': return a.id - b.id;
      case 'alfa-asc': return (a.asunto || '').localeCompare(b.asunto || '');
      case 'alfa-desc': return (b.asunto || '').localeCompare(b.asunto || '');
      default: return 0;}});

  const totalPaginas = Math.ceil(historialOrdenado.length / itemsPorPagina);
  const paginaValida = Math.min(paginaActual, totalPaginas || 1);
  const indiceInicial = (paginaValida - 1) * itemsPorPagina;
  const historialPaginado = historialOrdenado.slice(indiceInicial, indiceInicial + itemsPorPagina);

  const obtenerRangoSemana = () => {
    const hoy = new Date();
    const diaSemana = hoy.getDay();
    const diferenciaLunes = hoy.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1);
    const lunes = new Date(hoy.setDate(diferenciaLunes));
    const domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 6);
    const formatoFecha = (fecha) => fecha.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return `DEL ${formatoFecha(lunes)} AL ${formatoFecha(domingo)}`;};

  const manejarToggleOrganismo = (orgId) => {
    if (organismosExcluidos.includes(orgId)) {
      setOrganismosExcluidos(organismosExcluidos.filter(id => id !== orgId));
    } else {setOrganismosExcluidos([...organismosExcluidos, orgId]);
      const configOrg = ESTRUCTURA_ORGANISMOS_BORA.find(o => o.id === orgId);
      const subIds = configOrg.subtopicos.map(s => s.id);
      setSubtopicosExcluidos(subtopicosExcluidos.filter(id => !subIds.includes(id)));
      setDropdownsAbiertos(prev => ({ ...prev, [orgId]: false }));}};

  const manejarToggleSubtopico = (subId) => {
    if (subtopicosExcluidos.includes(subId)) {
      setSubtopicosExcluidos(subtopicosExcluidos.filter(id => id !== subId));
    } else {setSubtopicosExcluidos([...subtopicosExcluidos, subId]);}};

  const toggleDropdown = (e, orgId) => {
    e.stopPropagation(); 
    setDropdownsAbiertos(prev => ({
      ...Object.keys(prev).reduce((acc, key) => ({ ...acc, [key]: false }), {}), // cerramos los demás
      [orgId]: !prev[orgId]}));};

  const generarConIA = async () => {
      setGenerandoIA(true);
      setLogAuditoriaIA([]);
      try {
        const instruccionesExclusion = [];
        ESTRUCTURA_ORGANISMOS_BORA.forEach(org => {
          if (organismosExcluidos.includes(org.id)) {
            instruccionesExclusion.push(`EXCLUIR POR COMPLETO cualquier acto, decreto o resolución emanado por: ${org.label}.`);
          } else {org.subtopicos.forEach(sub => {
              if (subtopicosExcluidos.includes(sub.id)) {
                instruccionesExclusion.push(`Del organismo [${org.label}], EXCLUIR los actos relacionados con: ${sub.label}.`);}});}});

        const payload = {
          fuentes: [
            "https://www.boletinoficial.gob.ar/seccion/primera",
            "https://www.infoleg.gob.ar/?page_id=216"],
          directivasExclusion: instruccionesExclusion,
          jurisdiccion,
          limitePaginas: 2,
          directivasFormato: {
            tipoDocumento: "Informe Ejecutivo Semanal y Compilado Legal",
            requiereSeccionesPorOrganismo: true,
            estiloContenido: "Estructurado, analítico y profesional. Cada medida debe indicar: Organismo Emisor, Número de Norma (Decreto/Resolución), Síntesis de la medida e Impacto estimado o relevancia para el sector privado.",
            estructuraEsperada: "Agrupar cronológicamente bajo títulos claros del organismo emisor (ej: '### MINISTERIO DE ECONOMÍA'). Si un organismo no tuvo novedades relevantes en la semana, no incluir su sección."}};

        const response = await fetch('/.netlify/functions/generarBoletinIA', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)});
        const data = await response.json();
      
        if (data.resumenEmail && data.boletinCompleto) {
          setCuerpoHtml(data.resumenEmail);
          setBoletinCompleto(data.boletinCompleto);
          
          if (data.auditoriaFiltros && Array.isArray(data.auditoriaFiltros)) {
            setLogAuditoriaIA(data.auditoriaFiltros);
          } else {
            setLogAuditoriaIA(["Compilado generado con éxito. Estructura de informe aplicada."]);}
          setTabActivo('resumen');
        } else {
          throw new Error("La respuesta de la IA no contiene los bloques requeridos.");}
      } catch (error) {
        alert("Error al conectar con el asistente de IA: " + error.message);
      } finally {
        setGenerandoIA(false);}};

  const generarTemplateEmpresa = (contenido, cliente, paraPdf = false) => {
    const logoSeleccionado = paraPdf ? LOGO_CIFAS_BASE64 : LOGO_CIFAS_URL;
    if (paraPdf) {
      return `
        <div style="font-family: Arial, Helvetica, sans-serif; max-width: 580px; margin: 0 auto; padding: 10px; background: #ffffff;">
          <style>
            .evitar-corte p, .evitar-corte li, .evitar-corte h1, .evitar-corte h2, .evitar-corte h3, .evitar-corte strong {
              page-break-inside: avoid !important;
              break-inside: avoid !important;            }
          </style>
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="${logoSeleccionado}" width="154" style="display: inline-block;" />
          </div>
          <div style="text-align: center; margin-bottom: 25px;">
            <h1 style="margin: 0; font-size: 22px; color: #333; font-weight: bold;">BOLETÍN</h1>
            <h2 style="margin: 5px 0 0 0; font-size: 15px; color: #666; font-weight: normal;">${obtenerRangoSemana()}</h2>
          </div>
          <div class="evitar-corte" style="background-color: #E2E2E2; padding: 30px; border-radius: 8px;">
            <p style="margin-top: 0; font-size: 15px;">Estimado/a <strong>${cliente.razonSocial}</strong>,</p>
            <div style="line-height: 1.6; font-size: 14px; color: #111; word-wrap: break-word; overflow-wrap: break-word;">
              ${contenido}
            </div>
            <p style="margin-bottom: 0; margin-top: 25px; font-size: 15px;">Reciban un cordial saludo,<br><strong>El equipo de CIFAS.</strong></p>
          </div>
        </div> `;}

    const tablaCore = `
      <table align="center" width="600" style="width: 600px; margin: 0 auto; font-family: Arial, Helvetica, sans-serif; border-collapse: collapse;">
        <tr><td align="center" style="padding-bottom: 20px;"><img src="${logoSeleccionado}" width="154" style="display: block;" /></td></tr>
        <tr><td align="center" style="padding-bottom: 10px;"><h1 style="margin: 0; font-size: 24px; color: #333;">BOLETÍN</h1><h2 style="margin: 5px 0 20px 0; font-size: 16px; color: #666;">${obtenerRangoSemana()}</h2></td></tr>
        <tr><td bgcolor="#E2E2E2" style="padding: 30px; border-radius: 8px;">
          <p style="margin-top: 0;">Estimado/a <strong>${cliente.razonSocial}</strong>,</p>
          <div style="line-height: 1.6; color: #222;">${contenido}</div>
          <p style="margin-bottom: 0; margin-top: 20px;">Reciban un cordial saludo,<br><strong>El equipo de CIFAS.</strong></p>
        </td></tr>
      </table> `;

    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="margin: 0; padding: 20px; background-color: #f4f4f4;">
        ${tablaCore}
      </body></html>`;};

  const manejarEnvio = async (e) => {
    e.preventDefault();
    if (destinatarios.length === 0) return alert("No hay clientes habilitados.");
    if (!asunto.trim() || !cuerpoHtml) return alert("Por favor, completa el asunto y el mensaje.");
    setCargando(true);
    try {
      for (const cliente of destinatarios) {
        setEnvioActual(prev => prev + 1);
        const htmlEmail = generarTemplateEmpresa(cuerpoHtml, cliente, false);
        const htmlPdf = generarTemplateEmpresa(boletinCompleto || cuerpoHtml, cliente, true);
        const opcionesPdf = {
          margin:       [15, 15, 15, 15],
          filename:     'boletin.pdf',
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
          jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak:    { mode: ['css', 'legacy'] }};
        const pdfBase64Uri = await html2pdf().set(opcionesPdf).from(htmlPdf).outputPdf('datauristring');
        const pdfBase64Limpio = pdfBase64Uri.split('base64,')[1];
        await fetch('/.netlify/functions/enviarBoletin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ asunto, destinatario: cliente.email, cuerpoHtml: htmlEmail, adjuntoPdf: pdfBase64Limpio }),});}
      const nuevoRegistro = {
        id: Date.now(),
        fecha: new Date().toLocaleString('es-AR'),
        asunto,
        cuerpoHtml,
        boletinCompleto,
        clientes: destinatarios.map(c => c.razonSocial)};
      const nuevoHistorial = [nuevoRegistro, ...historial];
      setHistorial(nuevoHistorial);
      localStorage.setItem('historial_boletines', JSON.stringify(nuevoHistorial));
      alert("Boletines enviados correctamente.");
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setCargando(false);
      setEnvioActual(0);}};

  const borrarHistorial = () => {
    if (window.confirm("¿Seguro querés borrar el historial?")) {
      localStorage.removeItem('historial_boletines');
      setHistorial([]);
      setBoletinSeleccionado(null);}};

  const cargarEnEditor = (boletin) => {
    setAsunto(boletin.asunto);
    setCuerpoHtml(boletin.cuerpoHtml);
    setBoletinCompleto(boletin.boletinCompleto || '');
    setBoletinSeleccionado(null);};

  return (
    <div className="eb-container">
      <h2>Centro de Despacho de Boletines</h2>
      <div className="eb-ia-section" style={{ background: '#f8fafc', padding: '12px 18px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b' }}>Compilado Semanal</span>
              <div style={{ display: 'flex', gap: '10px', fontSize: '12px' }}>
              <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <input 
                  type="radio" 
                  checked={jurisdiccion === 'nacional'} 
                  onChange={() => setJurisdiccion('nacional')} 
                  style={{ marginRight: '4px' }}/> 
                Nacional</label>
              <label style={{ color: '#94a3b8', cursor: 'not-allowed', display: 'flex', alignItems: 'center' }}>
                <input type="radio" disabled checked={jurisdiccion === 'provincial'} style={{ marginRight: '4px' }} /> 
                Provincial</label></div></div>
          <button
            type="button"
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              padding: '5px 12px',
              borderRadius: '5px',
              fontSize: '12px',
              color: '#334155',
              cursor: 'pointer',
              fontWeight: '500',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'}}>
            {mostrarFiltros ? 'Ocultar Filtros de Exclusión' : 'Configurar Exclusiones Avanzadas'}
          </button></div>
        {mostrarFiltros && (
          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed #cbd5e1' }}>
            <p style={{ margin: '0 0 10px 0', fontSize: '12px', fontWeight: '600', color: '#475569' }}>
              Seleccioná qué organismos o tópicos específicos querés que la IA ignore por completo:</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '8px' }}>
              {ESTRUCTURA_ORGANISMOS_BORA.map(org => {
                const estaOrgExcluido = organismosExcluidos.includes(org.id);
                const subIds = org.subtopicos.map(s => s.id);
                const cantidadOmitidos = subtopicosExcluidos.filter(id => subIds.includes(id)).length;
                const isOpen = !!dropdownsAbiertos[org.id];
                let textoDesplegable = "Todos los temas incluidos";
                if (estaOrgExcluido) textoDesplegable = "Organismo omitido por completo";
                else if (cantidadOmitidos > 0) textoDesplegable = `${cantidadOmitidos} tema${cantidadOmitidos > 1 ? 's' : ''} a omitir`;
                return (
                  <div key={org.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 'bold', color: estaOrgExcluido ? '#cbd5e1' : '#334155', textDecoration: estaOrgExcluido ? 'line-through' : 'none', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {org.label}</span>
                      <label style={{ fontSize: '11px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer', fontWeight: '500' }}>
                        <input 
                          type="checkbox" 
                          checked={estaOrgExcluido} 
                          onChange={() => manejarToggleOrganismo(org.id)}/>
                        Excluir</label></div>
                    <div style={{ position: 'relative', width: '100%' }}>
                      <button
                        type="button"
                        disabled={estaOrgExcluido}
                        onClick={(e) => toggleDropdown(e, org.id)}
                        style={{
                          width: '100%',
                          padding: '5px 8px',
                          background: estaOrgExcluido ? '#f8fafc' : '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '4px',
                          textAlign: 'left',
                          fontSize: '11px',
                          color: estaOrgExcluido ? '#cbd5e1' : '#64748b',
                          cursor: estaOrgExcluido ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'}}>
                        <span>{textoDesplegable}</span>
                        <span style={{ fontSize: '9px', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>▼</span>
                      </button>
                      {isOpen && !estaOrgExcluido && (
                        <div 
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            position: 'absolute', top: '100%', left: 0, right: 0,
                            backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.08)', zIndex: 100, marginTop: '2px',
                            maxHeight: '140px', overflowY: 'auto', padding: '4px 0'}}>
                          {org.subtopicos.map(sub => {
                            const estaSubOmitido = subtopicosExcluidos.includes(sub.id);
                            return (
                              <label key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', cursor: 'pointer', fontSize: '11px', backgroundColor: estaSubOmitido ? '#fffbeb' : 'transparent' }}>
                                <input 
                                  type="checkbox" 
                                  checked={estaSubOmitido} 
                                  onChange={() => manejarToggleSubtopico(sub.id)} />
                                <span style={{ color: estaSubOmitido ? '#b45309' : '#475569' }}>Omitir: {sub.label}</span>
                              </label>);})}
                        </div>)}</div></div>);})}</div></div>)}
        <button 
          type="button" 
          onClick={generarConIA} 
          disabled={generandoIA} 
          className="eb-btn-generar-ia"
          style={{ width: '100%', padding: '10px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: generandoIA ? 'not-allowed' : 'pointer', fontWeight: 'bold', marginTop: '12px', fontSize: '13px' }}   >
          {generandoIA ? 'Analizando fuentes oficiales...' : 'Generar Compilado de la Semana'}
        </button></div>
      <form onSubmit={manejarEnvio} className="eb-form">
        <input
          type="text"
          value={asunto}
          onChange={(e) => setAsunto(e.target.value)}
          placeholder="Asunto del boletín..."
          className="eb-input-asunto"/>
        <div className="eb-destinatarios-bar">
          <button
            type="button"
            onClick={() => {
              setBusquedaDestinatario('');
              setVerDestinatariosModal(true);}}
            className="eb-btn-destinatarios">
            Destinatarios actuales ({destinatarios.length})</button>
        </div>
        <div className="eb-tabs-container">
          <div className="eb-tabs-header">
            <button
              type="button"
              onClick={() => setTabActivo('resumen')}
              className={`eb-tab-button ${tabActivo === 'resumen' ? 'eb-tab-button--active' : ''}`} >
              Resumen para el Email</button>
            <button
              type="button"
              onClick={() => setTabActivo('completo')}
              disabled={!boletinCompleto}
              className={`eb-tab-button ${tabActivo === 'completo' ? 'eb-tab-button--active' : ''} ${!boletinCompleto ? 'eb-tab-button--disabled' : ''}`}>
              Detalle para el PDF { !boletinCompleto && '(Generá con IA primero)' }
            </button></div>
          <div className="eb-tab-content">
            <div className={`eb-tab-panel ${tabActivo === 'resumen' ? '' : 'eb-tab-panel--hidden'}`}>
              <ReactQuill theme="snow" value={cuerpoHtml} onChange={setCuerpoHtml} className="eb-quill-editor" />
            </div>
            <div className={`eb-tab-panel ${tabActivo === 'completo' ? '' : 'eb-tab-panel--hidden'}`}>
              <ReactQuill theme="snow" value={boletinCompleto} onChange={setBoletinCompleto} className="eb-quill-editor" />
            </div></div></div>
        <button type="submit" disabled={cargando} className="eb-btn-submit">
          {cargando ? `Enviando (${envioActual}/${destinatarios.length})...` : 'Enviar Boletines'}
        </button>
      </form>
      {verDestinatariosModal && (
        <div className="eb-modal-overlay">
          <div className="eb-modal-box">
            <div className="eb-modal-header">
              <div>
                <h4 className="eb-modal-title">Lista de Destinatarios Activos</h4>
                <p className="eb-modal-subtitle">Clientes que recibirán este boletín</p></div>
              <button type="button" onClick={() => setVerDestinatariosModal(false)} className="eb-modal-close-btn">&times;</button>
            </div>
            <div className="eb-modal-search-bar">
              <input
                type="text" 
                value={busquedaDestinatario} 
                onChange={(e) => setBusquedaDestinatario(e.target.value)}
                placeholder="Buscar por Empresa o Email..."
                className="eb-input-busqueda"/></div>
            <div className="eb-modal-list">
              {destinatariosFiltrados.length > 0 ? (
                destinatariosFiltrados.map((cli) => (
                  <div key={cli.id || cli.email} className="eb-destinatario-item">
                    <span className="eb-destinatario-nombre">{cli.razonSocial}</span>
                    <span className="eb-destinatario-email">{cli.email}</span>
                  </div>))) : (
                <div className="eb-empty-state">No se encontraron destinatarios activos.</div>)}
            </div>
            <div className="eb-modal-footer">
              <button type="button" onClick={() => setVerDestinatariosModal(false)} className="eb-btn-entendido">Entendido</button>
            </div>
          </div></div>)}
      {historial.length > 0 && (
        <div className="eb-historial-section">
          <div className="eb-historial-header">
            <h3 className="eb-historial-title">Historial de Boletines Enviados</h3>
            <button type="button" onClick={borrarHistorial} className="eb-btn-borrar-historial">Borrar Historial</button>
          </div>
          <div className="eb-historial-filtros">
            <div className="eb-filtro-input-wrapper">
              <input
                type="text"
                value={filtroHistorial}
                onChange={(e) => {
                  setFiltroHistorial(e.target.value);
                  setPaginaActual(1);                }}
                placeholder="Filtrar historial por asunto..."
                className="eb-input-filtro"/></div>
            <div className="eb-orden-controls">
              <label className="eb-orden-label">Ordenar por:</label>
              <select
                value={ordenHistorial}
                onChange={(e) => {
                  setOrdenHistorial(e.target.value);
                  setPaginaActual(1);                }}
                className="eb-select-orden"              >
                <option value="recientes">Más recientes primero</option>
                <option value="antiguos">Más antiguos primero</option>
                <option value="alfa-asc">Asunto (A-Z)</option>
                <option value="alfa-desc">Asunto (Z-A)</option>
              </select>
              <select
                value={itemsPorPagina}
                onChange={(e) => {
                  setItemsPorPagina(Number(e.target.value));
                  setPaginaActual(1);                }}
                className="eb-select-items-pagina">
                <option value={5}>Ver 5</option>
                <option value={10}>Ver 10</option>
                <option value={20}>Ver 20</option>
              </select>
            </div></div>
          <div className="eb-historial-list">
            {historialPaginado.length > 0 ? (
              historialPaginado.map((item, index) => (
                <div
                  key={item.id}
                  onClick={() => setBoletinSeleccionado(item)}
                  className={`eb-historial-item ${index === historialPaginado.length - 1 ? 'eb-historial-item--last' : ''}`}>
                  <span className="eb-historial-item-asunto">{item.asunto}</span>
                  <span className="eb-historial-item-fecha">{item.fecha}</span>
                </div>))) : (
              <div className="eb-historial-empty">
                No se encontraron boletines en el historial.
              </div>            )}
          </div>
          {totalPaginas > 1 && (
            <div className="eb-paginacion-bar">
              <span className="eb-paginacion-info">
                Mostrando página <strong>{paginaValida}</strong> de <strong>{totalPaginas}</strong> ({historialFiltrado.length} resultados)
              </span>
              <div className="eb-paginacion-buttons">
                <button
                  type="button"
                  disabled={paginaValida === 1}
                  onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))}
                  className={`eb-btn-paginacion ${paginaValida === 1 ? 'eb-btn-paginacion--disabled' : ''}`}>
                  Anterior
                </button>
                <button
                  type="button"
                  disabled={paginaValida === totalPaginas}
                  onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))}
                  className={`eb-btn-paginacion ${paginaValida === totalPaginas ? 'eb-btn-paginacion--disabled' : ''}`}>
                  Siguiente
                </button>
              </div>
            </div>)}
        </div>)}
      {boletinSeleccionado && (
        <div className="eb-modal-overlay eb-modal-overlay--detail">
          <div className="eb-modal-box eb-modal-box--large">
            <div className="eb-modal-header eb-modal-header--detail">
              <div className="eb-modal-title-wrapper">
                <h3 className="eb-modal-detail-title">{boletinSeleccionado.asunto}</h3>
                <span className="eb-modal-detail-fecha">Enviado el: {boletinSeleccionado.fecha}</span>
                {boletinSeleccionado.clientes && boletinSeleccionado.clientes.length > 0 && (
                  <div className="eb-modal-detail-destinatarios">
                    <strong className="eb-modal-detail-destinatarios-label">Destinatarios en ese momento:</strong>
                    <div className="eb-chips-container">
                      {boletinSeleccionado.clientes.map((cli, idx) => (
                        <span key={idx} className="eb-chip">
                          {cli}
                        </span>))}
                    </div></div>)}
              </div>
              <button type="button" onClick={() => setBoletinSeleccionado(null)} className="eb-modal-close-btn--large">&times;</button>
            </div>
            <div className="eb-modal-detail-body">
              <div className="eb-content-card">
                <h5 className="eb-content-card-title--email">Cuerpo del Email Enviado:</h5>
                <div dangerouslySetInnerHTML={{ __html: boletinSeleccionado.cuerpoHtml }} />
              </div>
              {boletinSeleccionado.boletinCompleto && (
                <div className="eb-content-card">
                  <h5 className="eb-content-card-title--pdf">Contenido del PDF Adjunto:</h5>
                  <div dangerouslySetInnerHTML={{ __html: boletinSeleccionado.boletinCompleto }} />
                </div>)}</div>
            <div className="eb-modal-detail-footer">
              <button type="button" onClick={() => setBoletinSeleccionado(null)} className="eb-btn-cerrar">Cerrar</button>
              <button type="button" onClick={() => cargarEnEditor(boletinSeleccionado)} className="eb-btn-cargar-editor">Cargar en Editor</button>
            </div></div>
        </div>      )}
    </div>  );};

export default EditorBoletin;