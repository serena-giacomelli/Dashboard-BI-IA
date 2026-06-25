import { useState, useEffect } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import html2pdf from 'html2pdf.js';
import { LOGO_CIFAS_BASE64, LOGO_CIFAS_URL } from '../utils/assets.js';
import '../styles/EditorBoletin.css';

const EditorBoletin = ({ clientesDB }) => {
  const [asunto, setAsunto] = useState('');
  const [cuerpoHtml, setCuerpoHtml] = useState('');
  const [boletinCompleto, setBoletinCompleto] = useState(''); 
  const [puntosClave, setPuntosClave] = useState('');
  const [cargando, setCargando] = useState(false);
  const [generandoIA, setGenerandoIA] = useState(false);
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

  const destinatarios = clientesDB?.filter(c => c.enviarBoletin === true) || [];

  const destinatariosFiltrados = destinatarios.filter(c =>
    c.razonSocial?.toLowerCase().includes(busquedaDestinatario.toLowerCase()) ||
    c.email?.toLowerCase().includes(busquedaDestinatario.toLowerCase())  );

  const historialFiltrado = historial.filter(item =>
    item.asunto?.toLowerCase().includes(filtroHistorial.toLowerCase())  );

  const historialOrdenado = [...historialFiltrado].sort((a, b) => {
    switch (ordenHistorial) {
      case 'recientes': return b.id - a.id;
      case 'antiguos': return a.id - b.id;
      case 'alfa-asc': return (a.asunto || '').localeCompare(b.asunto || '');
      case 'alfa-desc': return (b.asunto || '').localeCompare(b.asunto || '');
      default: return 0;    }});

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
    return `DEL ${formatoFecha(lunes)} AL ${formatoFecha(domingo)}`;  };

  const generarConIA = async () => {
    if (!puntosClave.trim()) return alert("Por favor, ingresa algunos puntos clave antes de generar.");
    setGenerandoIA(true);
    try {
      const response = await fetch('/.netlify/functions/generarBoletinIA', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ puntosClave })});
      const data = await response.json();
    
      if (data.resumenEmail && data.boletinCompleto) {
        setCuerpoHtml(data.resumenEmail);
        setBoletinCompleto(data.boletinCompleto);
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
              break-inside: avoid !important;
            }
          </style>
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="${logoSeleccionado}" width="154" style="display: inline-block;" />
          </div>
          <div style="text-align: center; margin-bottom: 25px;">
            <h1 style="margin: 0; font-size: 22px; color: #333; font-weight: bold;">BOLETÍN DE NOVEDADES</h1>
            <h2 style="margin: 5px 0 0 0; font-size: 15px; color: #666; font-weight: normal;">${obtenerRangoSemana()}</h2>
          </div>
          <div class="evitar-corte" style="background-color: #E2E2E2; padding: 30px; border-radius: 8px;">
            <p style="margin-top: 0; font-size: 15px;">Estimado/a <strong>${cliente.razonSocial}</strong>,</p>
            <div style="line-height: 1.6; font-size: 14px; color: #111; word-wrap: break-word; overflow-wrap: break-word;">
              ${contenido}
            </div>
            <p style="margin-bottom: 0; margin-top: 25px; font-size: 15px;">Reciban un cordial saludo,<br><strong>El equipo de CIFAS.</strong></p>
          </div>
        </div>
      `;
    }

    const tablaCore = `
      <table align="center" width="600" style="width: 600px; margin: 0 auto; font-family: Arial, Helvetica, sans-serif; border-collapse: collapse;">
        <tr><td align="center" style="padding-bottom: 20px;"><img src="${logoSeleccionado}" width="154" style="display: block;" /></td></tr>
        <tr><td align="center" style="padding-bottom: 10px;"><h1 style="margin: 0; font-size: 24px; color: #333;">BOLETIN</h1><h2 style="margin: 5px 0 20px 0; font-size: 16px; color: #666;">${obtenerRangoSemana()}</h2></td></tr>
        <tr><td bgcolor="#E2E2E2" style="padding: 30px; border-radius: 8px;">
          <p style="margin-top: 0;">Estimado/a <strong>${cliente.razonSocial}</strong>,</p>
          <div style="line-height: 1.6; color: #222;">${contenido}</div>
          <p style="margin-bottom: 0; margin-top: 20px;">Reciban un cordial saludo,<br><strong>El equipo de CIFAS.</strong></p>
        </td></tr>
      </table>    `;

    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="margin: 0; padding: 20px; background-color: #f4f4f4;">
        ${tablaCore}
      </body>
      </html>    `;
  };

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
          pagebreak:    { mode: ['css', 'legacy'] }
        };

        const pdfBase64Uri = await html2pdf().set(opcionesPdf).from(htmlPdf).outputPdf('datauristring');
        const pdfBase64Limpio = pdfBase64Uri.split('base64,')[1];

        await fetch('/.netlify/functions/enviarBoletin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ asunto, destinatario: cliente.email, cuerpoHtml: htmlEmail, adjuntoPdf: pdfBase64Limpio }),
        });
      }

      const nuevoRegistro = {
        id: Date.now(),
        fecha: new Date().toLocaleString('es-AR'),
        asunto,
        cuerpoHtml,
        boletinCompleto,
        clientes: destinatarios.map(c => c.razonSocial)
      };

      const nuevoHistorial = [nuevoRegistro, ...historial];
      setHistorial(nuevoHistorial);
      localStorage.setItem('historial_boletines', JSON.stringify(nuevoHistorial));
      alert("Boletines enviados correctamente.");
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setCargando(false);
      setEnvioActual(0);
    }
  };

  const borrarHistorial = () => {
    if (window.confirm("¿Seguro querés borrar el historial?")) {
      localStorage.removeItem('historial_boletines');
      setHistorial([]);
      setBoletinSeleccionado(null);
    }
  };

  const cargarEnEditor = (boletin) => {
    setAsunto(boletin.asunto);
    setCuerpoHtml(boletin.cuerpoHtml);
    setBoletinCompleto(boletin.boletinCompleto || '');
    setBoletinSeleccionado(null);
  };

  return (
    <div className="eb-container">
      <h2>Centro de Despacho de Boletines</h2>
      
      {/* Sección IA */}
      <div className="eb-ia-section">
        <h4 className="eb-ia-title">Generar con IA</h4>
        <textarea 
          value={puntosClave} 
          onChange={(e) => setPuntosClave(e.target.value)} 
          placeholder="Puntos clave..." 
          className="eb-ia-textarea" 
        />
        <button 
          type="button" 
          onClick={generarConIA} 
          disabled={generandoIA} 
          className="eb-btn-generar-ia"
        >
          {generandoIA ? 'Generando...' : 'Generar Boletín Dual'}
        </button>
      </div>

      <form onSubmit={manejarEnvio} className="eb-form">
        <input
          type="text"
          value={asunto}
          onChange={(e) => setAsunto(e.target.value)}
          placeholder="Asunto del boletín..."
          className="eb-input-asunto"
        />
        
        <div className="eb-destinatarios-bar">
          <button
            type="button"
            onClick={() => {
              setBusquedaDestinatario('');
              setVerDestinatariosModal(true);
            }}
            className="eb-btn-destinatarios"
          >
            Destinatarios actuales ({destinatarios.length})
          </button>
          <span className="eb-destinatarios-hint">Hacé clic para ver la lista filtrada de envío.</span>
        </div>

        <div className="eb-tabs-container">
          {/* Cabecera de las Pestañas */}
          <div className="eb-tabs-header">
            <button
              type="button"
              onClick={() => setTabActivo('resumen')}
              className={`eb-tab-button ${tabActivo === 'resumen' ? 'eb-tab-button--active' : ''}`}
            >
              Resumen para el Email
            </button>
            <button
              type="button"
              onClick={() => setTabActivo('completo')}
              disabled={!boletinCompleto}
              className={`eb-tab-button ${tabActivo === 'completo' ? 'eb-tab-button--active' : ''} ${!boletinCompleto ? 'eb-tab-button--disabled' : ''}`}
            >
              Detalle para el PDF { !boletinCompleto && '(Generá con IA primero)' }
            </button>
          </div>

          <div className="eb-tab-content">
            <div className={`eb-tab-panel ${tabActivo === 'resumen' ? '' : 'eb-tab-panel--hidden'}`}>
              <p className="eb-tab-description">
                Este texto irá directo en el cuerpo del correo. Mantenelo breve para invitar a abrir el adjunto.
              </p>
              <ReactQuill theme="snow" value={cuerpoHtml} onChange={setCuerpoHtml} className="eb-quill-editor" />
            </div>
            
            <div className={`eb-tab-panel ${tabActivo === 'completo' ? '' : 'eb-tab-panel--hidden'}`}>
              <p className="eb-tab-description">
                Este contenido se convertirá automáticamente en el PDF que los clientes descargarán.
              </p>
              <ReactQuill theme="snow" value={boletinCompleto} onChange={setBoletinCompleto} className="eb-quill-editor" />
            </div>
          </div>
        </div>

        <button type="submit" disabled={cargando} className="eb-btn-submit">
          {cargando ? `Enviando (${envioActual}/${destinatarios.length})...` : 'Enviar Boletines'}
        </button>
      </form>

      {/* Modal de Destinatarios */}
      {verDestinatariosModal && (
        <div className="eb-modal-overlay">
          <div className="eb-modal-box">
            <div className="eb-modal-header">
              <div>
                <h4 className="eb-modal-title">Lista de Destinatarios Activos</h4>
                <p className="eb-modal-subtitle">Clientes que recibirán este boletín</p>
              </div>
              <button type="button" onClick={() => setVerDestinatariosModal(false)} className="eb-modal-close-btn">&times;</button>
            </div>
            
            <div className="eb-modal-search-bar">
              <input
                type="text" 
                value={busquedaDestinatario} 
                onChange={(e) => setBusquedaDestinatario(e.target.value)}
                placeholder="Buscar por Empresa o Email..."
                className="eb-input-busqueda"
              />
            </div>
            
            <div className="eb-modal-list">
              {destinatariosFiltrados.length > 0 ? (
                destinatariosFiltrados.map((cli) => (
                  <div key={cli.id || cli.email} className="eb-destinatario-item">
                    <span className="eb-destinatario-nombre">{cli.razonSocial}</span>
                    <span className="eb-destinatario-email">{cli.email}</span>
                  </div>
                ))
              ) : (
                <div className="eb-empty-state">No se encontraron destinatarios activos.</div>
              )}
            </div>
            
            <div className="eb-modal-footer">
              <button type="button" onClick={() => setVerDestinatariosModal(false)} className="eb-btn-entendido">Entendido</button>
            </div>
          </div>
        </div>
      )}

      {/* Sección Historial */}
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
                  setPaginaActual(1);
                }}
                placeholder="Filtrar historial por asunto..."
                className="eb-input-filtro"
              />
            </div>

            <div className="eb-orden-controls">
              <label className="eb-orden-label">Ordenar por:</label>
              <select
                value={ordenHistorial}
                onChange={(e) => {
                  setOrdenHistorial(e.target.value);
                  setPaginaActual(1);
                }}
                className="eb-select-orden"
              >
                <option value="recientes">Más recientes primero</option>
                <option value="antiguos">Más antiguos primero</option>
                <option value="alfa-asc">Asunto (A-Z)</option>
                <option value="alfa-desc">Asunto (Z-A)</option>
              </select>

              <select
                value={itemsPorPagina}
                onChange={(e) => {
                  setItemsPorPagina(Number(e.target.value));
                  setPaginaActual(1);
                }}
                className="eb-select-items-pagina"
              >
                <option value={5}>Ver 5</option>
                <option value={10}>Ver 10</option>
                <option value={20}>Ver 20</option>
              </select>
            </div>
          </div>

          <div className="eb-historial-list">
            {historialPaginado.length > 0 ? (
              historialPaginado.map((item, index) => (
                <div
                  key={item.id}
                  onClick={() => setBoletinSeleccionado(item)}
                  className={`eb-historial-item ${index === historialPaginado.length - 1 ? 'eb-historial-item--last' : ''}`}
                >
                  <span className="eb-historial-item-asunto">{item.asunto}</span>
                  <span className="eb-historial-item-fecha">{item.fecha}</span>
                </div>
              ))
            ) : (
              <div className="eb-historial-empty">
                No se encontraron boletines en el historial.
              </div>
            )}
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
                  className={`eb-btn-paginacion ${paginaValida === 1 ? 'eb-btn-paginacion--disabled' : ''}`}
                >
                  Anterior
                </button>
                <button
                  type="button"
                  disabled={paginaValida === totalPaginas}
                  onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))}
                  className={`eb-btn-paginacion ${paginaValida === totalPaginas ? 'eb-btn-paginacion--disabled' : ''}`}
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Detalle del Historial */}
      {boletinSeleccionado && (
        <div className="eb-modal-overlay eb-modal-overlay--detail">
          <div className="eb-modal-box eb-modal-box--large">
            <div className="eb-modal-header eb-modal-header--detail">
              <div className="eb-modal-title-wrapper">
                <h3 className="eb-modal-detail-title">{boletinSeleccionado.asunto}</h3>
                <span className="eb-modal-detail-fecha">Enviado el: {boletinSeleccionado.fecha}</span>
                {boletinSeleccionado.text !== '' && boletinSeleccionado.clientes && boletinSeleccionado.clientes.length > 0 && (
                  <div className="eb-modal-detail-destinatarios">
                    <strong className="eb-modal-detail-destinatarios-label">Destinatarios en ese momento:</strong>
                    <div className="eb-chips-container">
                      {boletinSeleccionado.clientes.map((cli, idx) => (
                        <span key={idx} className="eb-chip">
                          {cli}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
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
                </div>
              )}
            </div>
            
            <div className="eb-modal-detail-footer">
              <button type="button" onClick={() => setBoletinSeleccionado(null)} className="eb-btn-cerrar">Cerrar</button>
              <button type="button" onClick={() => cargarEnEditor(boletinSeleccionado)} className="eb-btn-cargar-editor">Cargar en Editor</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditorBoletin;