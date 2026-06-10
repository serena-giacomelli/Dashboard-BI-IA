// src/components/EditorBoletin.jsx
import { useState, useEffect } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import html2pdf from 'html2pdf.js'; // 📦 NUEVO: Importamos la librería
import { LOGO_CIFAS_URL } from '../utils/assets.js';

const EditorBoletin = ({ clientesDB }) => {
  const [asunto, setAsunto] = useState('');
  const [cuerpoHtml, setCuerpoHtml] = useState('');
  const [cargando, setCargando] = useState(false);
  const [historial, setHistorial] = useState([]);
  const [boletinSeleccionado, setBoletinSeleccionado] = useState(null);

  useEffect(() => {
    const historialGuardado = JSON.parse(localStorage.getItem('historial_boletines') || '[]');
    setHistorial(historialGuardado);
  }, []);

  const destinatarios = clientesDB?.filter(c => c.enviarBoletin === true) || [];

  const generarTemplateEmpresa = (contenido, cliente) => {
    const contenidoLimpiado = contenido
      .replace(/<p>/g, '<p style="background-color: transparent !important; background: transparent !important; mso-shading: transparent !important; margin: 0 0 10pt 0; text-align: justify; font-family: Arial, sans-serif; font-size: 11pt; color: #000000;">')
      .replace(/<li>/g, '<li style="background-color: transparent !important; background: transparent !important; mso-shading: transparent !important; font-family: Arial, sans-serif; font-size: 11pt; color: #000000; margin-bottom: 4pt;">');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <style>
    body, table, td, p, a, li, blockquote { -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; }
    body { margin: 0; padding: 0; width: 100% !important; background-color: #ffffff; }
    p, span, td, div, li, strong { font-family: Arial, Helvetica, sans-serif !important; color: #000000 !important; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff;">

  <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="width: 600px; max-width: 600px; margin: 0 auto; border-collapse: collapse;">
    <tbody>
      <tr>
        <td align="center" style="padding: 20px 0; text-align: center;">
          <img src="${LOGO_CIFAS_URL}" width="154" alt="Logo CIFAS" style="display: block; border: 0; width: 154px; height: auto; margin: 0 auto;" />
        </td>
      </tr>
      <tr>
        <td align="center" style="padding: 10px 0; text-align: center;">
          <h1 style="font-family: Arial, sans-serif; font-size: 24pt; font-weight: bold; color: #333333; margin: 0 0 6pt 0; text-align: center;">BOLETIN DE NOVEDADES</h1>
          <h2 style="font-family: Arial, sans-serif; font-size: 15pt; font-weight: normal; color: #555555; margin: 0 0 18pt 0; text-align: center;">DEL 01/06/2026 AL 07/06/2026</h2>
        </td>
      </tr>
      <tr>
        <td bgcolor="#E2E2E2" style="background-color: #E2E2E2; border-radius: 4px; padding: 0;">
          <table border="0" cellpadding="25" cellspacing="0" width="100%" style="width: 100%; border-collapse: collapse;">
            <tbody>
              <tr>
                <td align="left" style="text-align: justify; background-color: #E2E2E2;">
                  <p style="margin: 0 0 12pt 0; font-size: 11pt; font-family: Arial, sans-serif; color: #000000;">
                    Estimado/a <strong>${cliente.razonSocial}</strong>,
                  </p>
                  <div style="text-align: justify; font-family: Arial, sans-serif; font-size: 11pt; color: #000000;">
                    ${contenidoLimpiado}
                  </div>
                  <p style="margin: 20pt 0 0 0; font-size: 11pt; font-family: Arial, sans-serif; color: #000000;">
                    Reciban un cordial saludo,<br><strong>El equipo de CIFAS.</strong>
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table>

</body>
</html>
    `;
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();
    if (destinatarios.length === 0) return alert("⚠️ No hay clientes habilitados.");
    if (!asunto.trim() || !cuerpoHtml || cuerpoHtml === '<p><br></p>') {
      return alert("Por favor, completa el asunto y el mensaje.");
    }

    setCargando(true);

    try {
      for (const cliente of destinatarios) {
        const htmlFinal = generarTemplateEmpresa(cuerpoHtml, cliente);
        
        // 🚀 NUEVO: Configuramos html2pdf para que dibuje el PDF preservando todo tu formato
        const worker = html2pdf().set({
          margin: 15,
          filename: 'boletin.pdf',
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true }, // Clave para que pueda renderizar tu URL de Cloudinary
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        }).from(htmlFinal);

        // Extraemos el PDF en texto (Base64) puro
        const pdfDataUri = await worker.outputPdf('datauristring');
        const pdfBase64Limpio = pdfDataUri.split('base64,')[1];
        
        const response = await fetch('/.netlify/functions/enviarBoletin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            asunto,
            destinatario: cliente.mailFacturacionPrimario || "sere22giacomelli@gmail.com",
            cuerpoHtml: htmlFinal,
            adjuntoPdf: pdfBase64Limpio // 🚀 Le inyectamos el PDF al backend
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Error mandando a ${cliente.razonSocial}`);
        }
      }

      // Se guarda el registro igual que ayer
      const nuevoRegistro = {
        id: Date.now(),
        fecha: new Date().toLocaleString('es-AR'),
        asunto: asunto,
        destinatariosCount: destinatarios.length,
        vistaPrevia: cuerpoHtml.replace(/<[^>]*>/g, '').substring(0, 50) + (cuerpoHtml.length > 50 ? '...' : ''),
        cuerpoHtml: cuerpoHtml 
      };

      setHistorial([nuevoRegistro, ...historial]);
      localStorage.setItem('historial_boletines', JSON.stringify([nuevoRegistro, ...historial]));

      alert("✅ Todos los boletines fueron procesados y adjuntados en PDF correctamente.");
      setAsunto('');
      setCuerpoHtml('');
    } catch (error) {
      console.error("Detalle del fallo:", error);
      alert(`❌ Error al despachar: ${error.message}`);
    } finally {
      setCargando(false);
    }
  };

  const borrarHistorial = () => {
    if (window.confirm("¿Seguro querés eliminar todo el historial?")) {
      localStorage.removeItem('historial_boletines');
      setHistorial([]);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h2 style={{ color: '#0f172a' }}>Centro de Despacho de Boletines</h2>
      
      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <p style={{ margin: 0, fontWeight: 'bold', color: '#166534' }}>
          Destinatarios activos: {destinatarios.length}
        </p>
      </div>

      <form onSubmit={manejarEnvio}>
        <input 
          type="text" 
          value={asunto} 
          onChange={(e) => setAsunto(e.target.value)} 
          placeholder="Asunto del correo..." 
          style={{ width: '100%', padding: '12px', marginBottom: '15px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }} 
        />
        
        <div style={{ height: '250px', marginBottom: '60px' }}>
          <ReactQuill 
            theme="snow" 
            value={cuerpoHtml} 
            onChange={setCuerpoHtml} 
            modules={{ toolbar: [[{ 'header': [1, 2, false] }], ['bold', 'italic', 'underline'], [{ 'list': 'ordered'}, { 'list': 'bullet' }], ['link'], ['clean']] }} 
            style={{ height: '200px' }} 
          />
        </div>

        <button 
          type="submit" 
          disabled={cargando} 
          style={{ 
            padding: '12px 24px', 
            background: cargando ? '#94a3b8' : '#0f172a', 
            color: '#fff', 
            border: 'none', 
            borderRadius: '6px', 
            cursor: cargando ? 'not-allowed' : 'pointer',
            width: '100%',
            fontWeight: 'bold'
          }}
        >
          {cargando ? 'Enviando boletines...' : 'Enviar Boletines + PDF Adjunto'}
        </button>
      </form>

      {historial.length > 0 && (
        <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
          <button onClick={borrarHistorial} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>
            Limpiar Historial Local
          </button>
        </div>
      )}
    </div>
  );
};

export default EditorBoletin;