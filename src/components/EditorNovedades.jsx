import { useState, useEffect } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import html2pdf from 'html2pdf.js';
import { LOGO_CIFAS_BASE64, LOGO_CIFAS_URL } from '../utils/assets.js'; 
import '../styles/EditorNovedades.css';

const EditorNovedades = ({ clientesDB }) => {
  const [asunto, setAsunto] = useState('');
  const [cuerpoHtml, setCuerpoHtml] = useState('');
  const [boletinCompleto, setBoletinCompleto] = useState('');
  const [puntosClave, setPuntosClave] = useState(''); 
  const [cargando, setCargando] = useState(false);
  const [generandoIA, setGenerandoIA] = useState(false);
  const [envioActual, setEnvioActual] = useState(0); 
  const [historial, setHistorial] = useState([]);
  const [novedadSeleccionada, setNovedadSeleccionada] = useState(null); 
  const [verDestinatariosModal, setVerDestinatariosModal] = useState(false);
  const [busquedaDestinatario, setBusquedaDestinatario] = useState('');
  const [tabActivo, setTabActivo] = useState('resumen');
  const [filtroHistorial, setFiltroHistorial] = useState('');
  const [ordenHistorial, setOrdenHistorial] = useState('recientes'); 
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina, setItemsPorPagina] = useState(5); 

  useEffect(() => {
    const historialGuardado = JSON.parse(localStorage.getItem('historial_novedades') || '[]');
    setHistorial(historialGuardado);}, []);

  const destinatarios = clientesDB?.filter(c => c.enviarNovedades === true) || [];
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
      case 'alfa-desc': return (b.asunto || '').localeCompare(a.asunto || '');
      default: return 0;}});

  const totalPaginas = Math.ceil(historialOrdenado.length / itemsPorPagina);
  const paginaValida = Math.min(paginaActual, totalPaginas || 1);
  const indiceInicial = (paginaValida - 1) * itemsPorPagina;
  const historialPaginado = historialOrdenado.slice(indiceInicial, indiceInicial + itemsPorPagina);

  const generarConIA = async () => {
    if (!puntosClave.trim()) return alert("Por favor, ingresa los puntos clave de la novedad.");
    setGenerandoIA(true);
    try {
      const response = await fetch('/.netlify/functions/generarNovedadIA', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ puntosClave })
      });
      const data = await response.json();
      if (data.resumenEmail && data.boletinCompleto) {
        setCuerpoHtml(data.resumenEmail);
        setBoletinCompleto(data.boletinCompleto);
        setTabActivo('resumen');
      } else {
        throw new Error("Respuesta incompleta de IA");
      }
    } catch (error) {
      alert("Error al conectar con la IA: " + error.message);
    } finally {
      setGenerandoIA(false);}};

  const generarTemplateEmpresa = (contenido, cliente, paraPdf = false) => {
    const logoSeleccionado = paraPdf ? LOGO_CIFAS_BASE64 : LOGO_CIFAS_URL;
    const fechaHoy = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });

    if (paraPdf) {
      return `
        <div style="font-family: Arial, Helvetica, sans-serif; max-width: 580px; margin: 0 auto; padding: 10px; background: #ffffff;">
          <style>
            .evitar-corte p, .evitar-corte li, .evitar-corte h1, .evitar-corte h2, .evitar-corte h3, .evitar-corte strong {
              page-break-inside: avoid !important;
              break-inside: avoid !important;}
          </style>
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="${logoSeleccionado}" width="154" style="display: inline-block;" />
          </div>
          <div style="text-align: center; margin-bottom: 25px;">
            <h1 style="margin: 0; font-size: 22px; color: #333; font-weight: bold;">NOVEDADES DIARIAS</h1>
            <h2 style="margin: 5px 0 0 0; font-size: 15px; color: #666; font-weight: normal;">FECHA: ${fechaHoy}</h2>
          </div>
          <div class="evitar-corte" style="background-color: #E2E2E2; padding: 30px; border-radius: 8px;">
            <p style="margin-top: 0; font-size: 15px;">Estimado/a <strong>${cliente.razonSocial}</strong>,</p>
            <div style="line-height: 1.6; font-size: 14px; color: #111; word-wrap: break-word; overflow-wrap: break-word;">
              ${contenido}
            </div>
            <p style="margin-bottom: 0; margin-top: 25px; font-size: 15px;">Reciban un cordial saludo,<br><strong>El equipo de CIFAS.</strong></p>
          </div>
        </div>`;}

    const tablaCore = `
      <table align="center" width="600" style="width: 600px; margin: 0 auto; font-family: Arial, Helvetica, sans-serif; border-collapse: collapse;">
        <tr><td align="center" style="padding-bottom: 20px;"><img src="${logoSeleccionado}" width="154" style="display: block;" /></td></tr>
        <tr><td align="center" style="padding-bottom: 10px;">
            <h1 style="margin: 0; font-size: 24px; color: #333;">NOVEDADES DIARIAS</h1>
            <h2 style="margin: 5px 0 20px 0; font-size: 16px; color: #666;">FECHA: ${fechaHoy}</h2>
        </td></tr>
        <tr><td bgcolor="#E2E2E2" style="padding: 30px; border-radius: 8px;">
          <p style="margin-top: 0;">Estimado/a <strong>${cliente.razonSocial}</strong>,</p>
          <div style="line-height: 1.6; color: #222;">${contenido}</div>
          <p style="margin-bottom: 0; margin-top: 20px;">Reciban un cordial saludo,<br><strong>El equipo de CIFAS.</strong></p>
        </td></tr>
      </table>`;

    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="margin: 0; padding: 20px; background-color: #f4f4f4;">
        ${tablaCore}
      </body>
      </html>`;};

  const manejarEnvio = async (e) => {
    e.preventDefault();
    
    if (!asunto || asunto.trim() === "") {
        return alert("Por favor, ingresá un asunto para la novedad.");}
    if (destinatarios.length === 0) return alert("No hay destinatarios habilitados.");
    if (!cuerpoHtml) return alert("Por favor, genera o escribe el contenido.");

    setCargando(true);
    try {
      for (const cliente of destinatarios) {
        setEnvioActual(prev => prev + 1);
        const htmlEmail = generarTemplateEmpresa(cuerpoHtml, cliente, false);
        const htmlPdf = generarTemplateEmpresa(boletinCompleto || cuerpoHtml, cliente, true);
        const opcionesPdf = {
          margin: [15, 15, 15, 15], 
          filename: 'novedad_cifas.pdf',
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, letterRendering: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: ['css', 'legacy'] }};

        const pdfBase64Uri = await html2pdf().set(opcionesPdf).from(htmlPdf).outputPdf('datauristring');
        const pdfBase64Limpio = pdfBase64Uri.split('base64,')[1];
        
        await fetch('/.netlify/functions/enviarNovedad', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            asunto, 
            destinatario: cliente.email, 
            cuerpoHtml: htmlEmail, 
            adjuntoPdf: pdfBase64Limpio,
            filename: 'Novedad_Diaria_CIFAS.pdf'}),});}

      const nuevoRegistro = {
        id: Date.now(),
        fecha: new Date().toLocaleString('es-AR'),
        asunto,
        cuerpoHtml,
        boletinCompleto,
        clientes: destinatarios.map(c => c.razonSocial)};

      const nuevoHistorial = [nuevoRegistro, ...historial];
      setHistorial(nuevoHistorial);
      localStorage.setItem('historial_novedades', JSON.stringify(nuevoHistorial));
      
      alert("Novedades enviadas correctamente a todos los clientes.");
      setAsunto('');
      setCuerpoHtml('');
      setBoletinCompleto('');
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setCargando(false);
      setEnvioActual(0);}};

  const borrarHistorial = () => {
    if (window.confirm("¿Seguro querés borrar el historial de novedades?")) {
      localStorage.removeItem('historial_novedades');
      setHistorial([]);}};

  const cargarEnEditor = (item) => {
    setAsunto(item.asunto);
    setCuerpoHtml(item.cuerpoHtml);
    setBoletinCompleto(item.boletinCompleto || '');
    setNovedadSeleccionada(null);};

  return (
    <div className="en-container">
      <h2>Centro de Despacho de Novedades</h2>
     <div className="en-ia-section">
        <h4 className="en-ia-title">Generar Novedad con IA</h4>
        <textarea 
          value={puntosClave} 
          onChange={(e) => setPuntosClave(e.target.value)} 
          placeholder="Escribí aquí: capacitaciones, charlas, congresos..." 
          className="en-ia-textarea"/>
        <button type="button" onClick={generarConIA} disabled={generandoIA} className="en-btn-generar-ia">
            {generandoIA ? 'Procesando...' : 'Generar Formato Dual'}
        </button>
      </div>

      <form onSubmit={manejarEnvio} className="en-form">
        <input 
          type="text" 
          value={asunto} 
          onChange={(e) => setAsunto(e.target.value)} 
          placeholder="Asunto de la novedad (obligatorio)..." 
          className="en-input-asunto" />

        <div className="en-destinatarios-bar">
          <button
            type="button"
            onClick={() => {
              setBusquedaDestinatario('');
              setVerDestinatariosModal(true);}}
            className="en-btn-destinatarios">
            Destinatarios actuales ({destinatarios.length})
          </button>
        </div>

        <div className="en-tabs-container">
          <div className="en-tabs-header">
            <button
              type="button"
              onClick={() => setTabActivo('resumen')}
              className={`en-tab-button ${tabActivo === 'resumen' ? 'en-tab-button--active' : ''}`}
            >
              Resumen para Email
            </button>
            <button
              type="button"
              onClick={() => setTabActivo('completo')}
              disabled={!boletinCompleto}
              className={`en-tab-button ${tabActivo === 'completo' ? 'en-tab-button--active' : ''} ${!boletinCompleto ? 'en-tab-button--disabled' : ''}`}
            >
              Detalle PDF
            </button>
          </div>

          <div className="en-tab-content">
            <div className={`en-tab-panel ${tabActivo === 'resumen' ? '' : 'en-tab-panel--hidden'}`}>
                <ReactQuill theme="snow" value={cuerpoHtml} onChange={setCuerpoHtml} className="en-quill-editor" />
            </div>
            <div className={`en-tab-panel ${tabActivo === 'completo' ? '' : 'en-tab-panel--hidden'}`}>
                <ReactQuill theme="snow" value={boletinCompleto} onChange={setBoletinCompleto} className="en-quill-editor" />
            </div>
          </div>
        </div>

        <button type="submit" disabled={cargando} className="en-btn-submit">
          {cargando ? `Enviando (${envioActual}/${destinatarios.length})...` : 'Enviar Novedades'}
        </button>
      </form>

      {verDestinatariosModal && (
        <div className="en-modal-overlay">
          <div className="en-modal-box">
            <div className="en-modal-header">
              <div>
                <h4 className="en-modal-title">Lista de Destinatarios Activos</h4>
                <p className="en-modal-subtitle">Clientes que recibirán esta novedad</p>
              </div>
              <button type="button" onClick={() => setVerDestinatariosModal(false)} className="en-modal-close-btn">&times;</button>
            </div>

            <div className="en-modal-search-bar">
              <input 
                type="text" 
                value={busquedaDestinatario}
                onChange={(e) => setBusquedaDestinatario(e.target.value)}
                placeholder="Buscar por Empresa o Email..."
                className="en-input-busqueda"/>
            </div>

            <div className="en-modal-list">
              {destinatariosFiltrados.length > 0 ? (
                destinatariosFiltrados.map((cli) => (
                  <div key={cli.id || cli.email} className="en-destinatario-item">
                    <span className="en-destinatario-nombre">{cli.razonSocial}</span>
                    <span className="en-destinatario-email">{cli.email}</span>
                  </div>))
              ) : (
                <div className="en-empty-state">No se encontraron destinatarios activos.</div>)}
            </div>

            <div className="en-modal-footer">
              <button type="button" onClick={() => setVerDestinatariosModal(false)} className="en-btn-entendido">
                Entendido
              </button>
            </div>
          </div>
        </div>)}

      {historial.length > 0 && (
        <div className="en-historial-section">
          <div className="en-historial-header">
            <h3>Historial de Novedades</h3>
            <button onClick={borrarHistorial} className="en-btn-borrar-historial">Borrar Historial</button>
          </div>

          <div className="en-historial-filtros">
            <input 
              type="text" 
              placeholder="Filtrar historial por asunto..." 
              value={filtroHistorial} 
              onChange={(e) => { setFiltroHistorial(e.target.value); setPaginaActual(1); }} 
              className="en-input-filtro"/>
            <select value={ordenHistorial} onChange={(e) => setOrdenHistorial(e.target.value)} className="en-select-filtro">
              <option value="recientes">Más recientes primero</option>
              <option value="antiguos">Más antiguos primero</option>
              <option value="alfa-asc">A-Z</option>
              <option value="alfa-desc">Z-A</option>
            </select>
            <select value={itemsPorPagina} onChange={(e) => { setItemsPorPagina(Number(e.target.value)); setPaginaActual(1); }} className="en-select-filtro">
              <option value={5}>Ver 5</option>
              <option value={10}>Ver 10</option>
            </select>
          </div>

          <div className="en-historial-list">
            {historialPaginado.map((item) => (
              <div key={item.id} onClick={() => setNovedadSeleccionada(item)} className="en-historial-item">
                <span>{item.asunto}</span>
                <span className="en-historial-item-fecha">{item.fecha}</span>
              </div>))}
          </div>

          <div className="en-paginacion-bar">
            <span>Mostrando página {paginaValida} de {totalPaginas || 1} ({historialOrdenado.length} resultados)</span>
            <div>
              <button disabled={paginaActual === 1} onClick={() => setPaginaActual(p => p - 1)} className="en-btn-paginacion">Anterior</button>
              <button disabled={paginaActual >= totalPaginas} onClick={() => setPaginaActual(p => p + 1)} className="en-btn-paginacion">Siguiente</button>
            </div>
          </div>
        </div>)}

      {novedadSeleccionada && (
        <div className="en-modal-overlay-preview">
          <div className="en-modal-box-preview">
              <h3>{novedadSeleccionada.asunto}</h3>
              <div dangerouslySetInnerHTML={{ __html: novedadSeleccionada.cuerpoHtml }} className="en-preview-content" />
              <div className="en-preview-footer">
                  <button onClick={() => setNovedadSeleccionada(null)} className="en-btn-cerrar">Cerrar</button>
                  <button onClick={() => cargarEnEditor(novedadSeleccionada)} className="en-btn-cargar-editor">Cargar en Editor</button>
              </div>
          </div>
        </div>)}
    </div>);};

export default EditorNovedades;