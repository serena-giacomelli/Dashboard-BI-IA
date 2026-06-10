// src/components/EditorBoletin.jsx
import { useState, useEffect } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import html2pdf from 'html2pdf.js';
import { LOGO_CIFAS_BASE64, LOGO_CIFAS_URL } from '../utils/assets.js'; 

const EditorBoletin = ({ clientesDB }) => {
  const [asunto, setAsunto] = useState('');
  const [cuerpoHtml, setCuerpoHtml] = useState('');
  const [puntosClave, setPuntosClave] = useState(''); 
  const [cargando, setCargando] = useState(false);
  const [generandoIA, setGenerandoIA] = useState(false);
  const [envioActual, setEnvioActual] = useState(0); 
  
  const [historial, setHistorial] = useState([]);
  const [boletinSeleccionado, setBoletinSeleccionado] = useState(null); 

  useEffect(() => {
    const historialGuardado = JSON.parse(localStorage.getItem('historial_boletines') || '[]');
    setHistorial(historialGuardado);
  }, []);

  const destinatarios = clientesDB?.filter(c => c.enviarBoletin === true) || [];

  const obtenerRangoSemana = () => {
    const hoy = new Date();
    const diaSemana = hoy.getDay(); 
    const diferenciaLunes = hoy.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1);
    const lunes = new Date(hoy.setDate(diferenciaLunes));
    const domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 6);
    const formatoFecha = (fecha) => fecha.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return `DEL ${formatoFecha(lunes)} AL ${formatoFecha(domingo)}`;
  };

  const generarConIA = async () => {
    if (!puntosClave.trim()) return alert("Por favor, ingresa algunos puntos clave antes de generar.");
    setGenerandoIA(true);
    try {
      const response = await fetch('/.netlify/functions/generarBoletinIA', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ puntosClave })
      });
      const data = await response.json();
      if (data.contenido) {
        setCuerpoHtml(data.contenido);
      } else {
        throw new Error("No se pudo generar el contenido.");
      }
    } catch (error) {
      alert("Error al conectar con el asistente de IA: " + error.message);
    } finally {
      setGenerandoIA(false);
    }
  };

  const generarTemplateEmpresa = (contenido, cliente, paraPdf = false) => {
    const logoSeleccionado = paraPdf ? LOGO_CIFAS_BASE64 : LOGO_CIFAS_URL;
    return `
      <!DOCTYPE html>
      <html>
      <body>
        <table align="center" width="600" style="width: 600px; margin: 0 auto; font-family: Arial, Helvetica, sans-serif;">
          <tr><td align="center"><img src="${logoSeleccionado}" width="154" /></td></tr>
          <tr><td align="center"><h1>BOLETIN DE NOVEDADES</h1><h2>${obtenerRangoSemana()}</h2></td></tr>
          <tr><td bgcolor="#E2E2E2" style="padding: 30px;">
            <p>Estimado/a <strong>${cliente.razonSocial}</strong>,</p>
            <div>${contenido}</div>
            <p>Reciban un cordial saludo,<br><strong>El equipo de CIFAS.</strong></p>
          </td></tr>
        </table>
      </body>
      </html>
    `;
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();
    if (destinatarios.length === 0) return alert("⚠️ No hay clientes habilitados.");
    if (!asunto.trim() || !cuerpoHtml) return alert("Por favor, completa el asunto y el mensaje.");

    setCargando(true);
    try {
      for (const cliente of destinatarios) {
        setEnvioActual(prev => prev + 1);
        const htmlEmail = generarTemplateEmpresa(cuerpoHtml, cliente, false);
        const htmlPdf = generarTemplateEmpresa(cuerpoHtml, cliente, true);
        const workerContenedor = document.createElement('div');
        workerContenedor.innerHTML = htmlPdf.trim();
        const pdfBase64Uri = await html2pdf().from(workerContenedor).outputPdf('datauristring');
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
        destinatariosCount: destinatarios.length,
        vistaPrevia: cuerpoHtml.replace(/<[^>]*>/g, '').substring(0, 50),
        cuerpoHtml
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

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
      <h2>Centro de Despacho de Boletines</h2>
      
      {/* Sección IA */}
      <div style={{ background: '#f8fafc', padding: '15px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
        <h4>Generar con IA</h4>
        <textarea value={puntosClave} onChange={(e) => setPuntosClave(e.target.value)} placeholder="Puntos clave..." style={{ width: '100%', height: '80px', marginBottom: '10px' }} />
        <button onClick={generarConIA} disabled={generandoIA}>{generandoIA ? 'Generando...' : 'Generar Boletín'}</button>
      </div>

      <form onSubmit={manejarEnvio}>
        <input type="text" value={asunto} onChange={(e) => setAsunto(e.target.value)} placeholder="Asunto..." style={{ width: '100%', marginBottom: '10px' }} />
        <ReactQuill theme="snow" value={cuerpoHtml} onChange={setCuerpoHtml} style={{ height: '200px', marginBottom: '50px' }} />
        <button type="submit" disabled={cargando}>{cargando ? 'Enviando...' : 'Enviar Boletines'}</button>
      </form>

      {/* HISTORIAL RECUPERADO */}
      {historial.length > 0 && (
        <div style={{ marginTop: '50px', borderTop: '2px solid #e2e8f0', paddingTop: '20px' }}>
          <h3>Historial de Boletines Enviados</h3>
          <button onClick={borrarHistorial} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '5px' }}>Borrar Historial</button>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '10px' }}>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {historial.map(item => (
                <div key={item.id} onClick={() => setBoletinSeleccionado(item)} style={{ padding: '10px', borderBottom: '1px solid #ccc', cursor: 'pointer' }}>
                  <strong>{item.asunto}</strong><br/>{item.fecha}
                </div>
              ))}
            </div>
            <div style={{ border: '1px solid #ccc', padding: '10px' }}>
              {boletinSeleccionado ? (
                <div>
                  <h4>{boletinSeleccionado.asunto}</h4>
                  <div dangerouslySetInnerHTML={{ __html: boletinSeleccionado.cuerpoHtml }} />
                  <button onClick={() => { setAsunto(boletinSeleccionado.asunto); setCuerpoHtml(boletinSeleccionado.cuerpoHtml); }}>Cargar contenido</button>
                </div>
              ) : <p>Seleccioná un ítem.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditorBoletin;