import { useState, useEffect } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import html2pdf from 'html2pdf.js';
import { LOGO_CIFAS_BASE64, LOGO_CIFAS_URL } from '../utils/assets.js'; 

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
    setHistorial(historialGuardado);
  }, []);

  const destinatarios = clientesDB?.filter(c => c.enviarBoletin === true) || [];
  const destinatariosFiltrados = destinatarios.filter(c => 
    c.razonSocial?.toLowerCase().includes(busquedaDestinatario.toLowerCase()) ||
    c.email?.toLowerCase().includes(busquedaDestinatario.toLowerCase())
  );

  const historialFiltrado = historial.filter(item => 
    item.asunto?.toLowerCase().includes(filtroHistorial.toLowerCase())
  );

  const historialOrdenado = [...historialFiltrado].sort((a, b) => {
    switch (ordenHistorial) {
      case 'recientes': return b.id - a.id; 
      case 'antiguos': return a.id - b.id;
      case 'alfa-asc': return (a.asunto || '').localeCompare(b.asunto || '');
      case 'alfa-desc': return (b.asunto || '').localeCompare(a.asunto || '');
      default: return 0;
    }
  });

  const totalPaginas = Math.ceil(historialOrdenado.length / itemsPorPagina);
  const paginaValida = Math.min(paginaActual, totalPaginas || 1);
  const indiceInicial = (paginaValida - 1) * itemsPorPagina;
  const historialPaginado = historialOrdenado.slice(indiceInicial, indiceInicial + itemsPorPagina);

  const generarConIA = async () => {
    if (!puntosClave.trim()) return alert("Por favor, ingresa los puntos clave de la novedad.");
    setGenerandoIA(true);
    try {
      const response = await fetch('/.netlify/functions/generarBoletinIA', {
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
      setGenerandoIA(false);
    }
  };

  // FORMATO CORPORATIVO IGUAL AL DE BOLETINES
  const generarTemplateEmpresa = (contenido, cliente, paraPdf = false) => {
    const logoSeleccionado = paraPdf ? LOGO_CIFAS_BASE64 : LOGO_CIFAS_URL;
    const fechaHoy = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });

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
        </div>
      `;
    }

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
      </table>
    `;

    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="margin: 0; padding: 20px; background-color: #f4f4f4;">
        ${tablaCore}
      </body>
      </html>
    `;
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();
    
    // VALIDACIÓN DE ASUNTO
    if (!asunto || asunto.trim() === "") {
        return alert("Por favor, ingresá un asunto para la novedad.");
    }
    
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
          pagebreak: { mode: ['css', 'legacy'] } 
        };

        const pdfBase64Uri = await html2pdf().set(opcionesPdf).from(htmlPdf).outputPdf('datauristring');
        const pdfBase64Limpio = pdfBase64Uri.split('base64,')[1];
        
        await fetch('/.netlify/functions/enviarBoletin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            asunto, 
            destinatario: cliente.email, 
            cuerpoHtml: htmlEmail, 
            adjuntoPdf: pdfBase64Limpio,
            filename: 'Novedad_Diaria_CIFAS.pdf'
          }),
        });
      }

      const nuevoRegistro = { 
        id: Date.now(), 
        fecha: new Date().toLocaleString('es-AR'), 
        asunto, 
        cuerpoHtml, 
        boletinCompleto 
      };
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
      setEnvioActual(0);
    }
  };

  const borrarHistorial = () => {
    if (window.confirm("¿Seguro querés borrar el historial de novedades?")) {
      localStorage.removeItem('historial_novedades');
      setHistorial([]);
    }
  };

  const cargarEnEditor = (item) => {
    setAsunto(item.asunto);
    setCuerpoHtml(item.cuerpoHtml);
    setBoletinCompleto(item.boletinCompleto || '');
    setNovedadSeleccionada(null);
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>Centro de Despacho de Novedades</h2>
      
      {/* Sección IA */}
      <div style={{ background: '#f8fafc', padding: '15px', border: '1px solid #e2e8f0', marginBottom: '20px', borderRadius: '6px' }}>
        <h4 style={{ margin: '0 0 10px 0' }}>Generar Novedad con IA</h4>
        <textarea 
          value={puntosClave} 
          onChange={(e) => setPuntosClave(e.target.value)} 
          placeholder="Escribí aquí: capacitaciones, charlas, congresos..." 
          style={{ width: '100%', height: '80px', marginBottom: '10px', padding: '8px', boxSizing: 'border-box', border: '1px solid #cbd5e1', borderRadius: '4px' }} 
        />
        <button type="button" onClick={generarConIA} disabled={generandoIA} style={{ padding: '8px 12px', cursor: 'pointer', background: '#334155', color: 'white', border: 'none', borderRadius: '4px' }}>
            {generandoIA ? 'Procesando...' : 'Generar Formato Dual'}
        </button>
      </div>

      <form onSubmit={manejarEnvio} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input 
          type="text" 
          value={asunto} 
          onChange={(e) => setAsunto(e.target.value)} 
          placeholder="Asunto de la novedad (obligatorio)..." 
          style={{ width: '100%', padding: '10px', fontSize: '16px', boxSizing: 'border-box', border: '1px solid #cbd5e1', borderRadius: '4px' }} 
        />

        <div style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', background: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>
            <button
              type="button"
              onClick={() => setTabActivo('resumen')}
              style={{
                flex: 1, padding: '14px', border: 'none', cursor: 'pointer', fontWeight: 'bold',
                background: tabActivo === 'resumen' ? '#ffffff' : 'transparent',
                color: tabActivo === 'resumen' ? '#0284c7' : '#64748b',
                borderBottom: tabActivo === 'resumen' ? '3px solid #0284c7' : '3px solid transparent'
              }}
            >Resumen para Email</button>
            <button
              type="button"
              onClick={() => setTabActivo('completo')}
              disabled={!boletinCompleto}
              style={{
                flex: 1, padding: '14px', border: 'none', cursor: boletinCompleto ? 'pointer' : 'not-allowed', fontWeight: 'bold',
                background: tabActivo === 'completo' ? '#ffffff' : 'transparent',
                color: tabActivo === 'completo' ? '#0284c7' : '#94a3b8',
                borderBottom: tabActivo === 'completo' ? '3px solid #0284c7' : '3px solid transparent'
              }}
            >Detalle PDF</button>
          </div>

          <div style={{ padding: '20px', background: '#ffffff', minHeight: '300px' }}>
            <div style={{ display: tabActivo === 'resumen' ? 'block' : 'none' }}>
                <ReactQuill theme="snow" value={cuerpoHtml} onChange={setCuerpoHtml} style={{ height: '220px', marginBottom: '45px' }} />
            </div>
            <div style={{ display: tabActivo === 'completo' ? 'block' : 'none' }}>
                <ReactQuill theme="snow" value={boletinCompleto} onChange={setBoletinCompleto} style={{ height: '220px', marginBottom: '45px' }} />
            </div>
          </div>
        </div>

        <button type="submit" disabled={cargando} style={{ padding: '12px', background: '#0284c7', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>
          {cargando ? `Enviando (${envioActual}/${destinatarios.length})...` : 'Enviar Novedades'}
        </button>
      </form>

      {/* HISTORIAL SIMPLIFICADO ABAJO */}
      {historial.length > 0 && (
        <div style={{ marginTop: '50px', borderTop: '2px solid #e2e8f0', paddingTop: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3>Historial de Novedades</h3>
          <button onClick={borrarHistorial} style={{ color: '#fff', background: '#ef4444', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>Borrar Historial</button>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', alignItems: 'center', background: '#f8fafc', padding: '15px', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
          <input type="text" placeholder="Filtrar historial por asunto..." value={filtroHistorial} onChange={(e) => { setFiltroHistorial(e.target.value); setPaginaActual(1); }} style={{ flex: 1, padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
          <select value={ordenHistorial} onChange={(e) => setOrdenHistorial(e.target.value)} style={{ padding: '8px' }}>
            <option value="recientes">Más recientes primero</option>
            <option value="antiguos">Más antiguos primero</option>
            <option value="alfa-asc">A-Z</option>
            <option value="alfa-desc">Z-A</option>
          </select>
          <select value={itemsPorPagina} onChange={(e) => { setItemsPorPagina(Number(e.target.value)); setPaginaActual(1); }} style={{ padding: '8px' }}>
            <option value={5}>Ver 5</option>
            <option value={10}>Ver 10</option>
          </select>
        </div>

        <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
          {historialPaginado.map((item) => (
            <div key={item.id} onClick={() => setNovedadSeleccionada(item)} style={{ padding: '12px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', background: '#fff' }}>
              <span>{item.asunto}</span>
              <span style={{ color: '#64748b', fontSize: '13px' }}>{item.fecha}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px', fontSize: '14px', color: '#64748b' }}>
          <span>Mostrando página {paginaValida} de {totalPaginas || 1} ({historialOrdenado.length} resultados)</span>
          <div>
            <button disabled={paginaActual === 1} onClick={() => setPaginaActual(p => p - 1)} style={{ cursor: 'pointer', marginRight: '10px' }}>Anterior</button>
            <button disabled={paginaActual >= totalPaginas} onClick={() => setPaginaActual(p => p + 1)} style={{ cursor: 'pointer' }}>Siguiente</button>
          </div>
        </div>
      </div>
      )}

      {/* MODAL DE VISTA PREVIA */}
      {novedadSeleccionada && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div style={{ background: 'white', padding: '20px', borderRadius: '8px', width: '90%', maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto' }}>
                <h3>{novedadSeleccionada.asunto}</h3>
                <div dangerouslySetInnerHTML={{ __html: novedadSeleccionada.cuerpoHtml }} style={{ border: '1px solid #eee', padding: '15px' }} />
                <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button onClick={() => setNovedadSeleccionada(null)} style={{ padding: '8px 16px' }}>Cerrar</button>
                    <button onClick={() => cargarEnEditor(novedadSeleccionada)} style={{ padding: '8px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px' }}>Cargar en Editor</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default EditorNovedades;