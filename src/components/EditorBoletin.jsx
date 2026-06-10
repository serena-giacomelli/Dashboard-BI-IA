// src/components/EditorBoletin.jsx
import { useState, useEffect } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import html2pdf from 'html2pdf.js';
// Importamos tu constante en Base64 real para el logo:
import { LOGO_CIFAS_BASE64 } from '../utils/assets.js'; 

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
    return `
<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <style>
    body { margin: 0; padding: 0; background-color: #ffffff; -webkit-print-color-adjust: exact; }
    p, td, span, div, li {
      font-family: Arial, Helvetica, sans-serif !important;
      color: #000000 !important;
      font-size: 11pt !important;
      line-height: 1.5 !important;
      word-break: break-word !important;
    }
    p { margin: 0 0 10pt 0 !important; padding: 0 !important; background: transparent !important; }
    h1 { font-size: 22pt !important; font-weight: bold !important; color: #222222 !important; text-align: center !important; margin: 0 0 4pt 0 !important; }
    h2 { font-size: 14pt !important; font-weight: normal !important; color: #555555 !important; text-align: center !important; margin: 0 0 15pt 0 !important; }
    ul, ol { margin: 0 0 10pt 0 !important; padding-left: 20pt !important; }
    li { margin-bottom: 4pt !important; background: transparent !important; }
  </style>
</head>
<body style="background-color: #ffffff;">
  
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="width: 600px; margin: 0 auto; border-collapse: collapse; background-color: #ffffff;">
    <tbody>
      <tr>
        <td align="center" style="padding: 15px 0; text-align: center;">
          <img src="${LOGO_CIFAS_BASE64}" width="150" alt="Logo CIFAS" style="display: block; border: 0; width: 150px; height: auto; margin: 0 auto;" />
        </td>
      </tr>
      <tr>
        <td align="center" style="padding: 5px 0; text-align: center;">
          <h1 style="margin: 0 0 4pt 0; text-align: center;">BOLETIN DE NOVEDADES</h1>
          <h2 style="margin: 0 0 15pt 0; text-align: center;">DEL 01/06/2026 AL 07/06/2026</h2>
        </td>
      </tr>
      <tr>
        <td bgcolor="#E2E2E2" style="background-color: #E2E2E2 !important; border-radius: 6px; padding: 0;">
          <table border="0" cellpadding="20" cellspacing="0" width="100%" style="width: 100%; border-collapse: collapse;">
            <tbody>
              <tr>
                <td align="left" style="text-align: justify; background-color: #E2E2E2 !important;">
                  <p style="margin: 0 0 12pt 0;">Estimado/a <strong>${cliente.razonSocial}</strong>,</p>
                  <div style="text-align: justify; background: transparent !important;">
                    ${contenido}
                  </div>
                  <p style="margin: 25pt 0 0 0;">Reciban un cordial saludo,<br><strong>El equipo de CIFAS.</strong></p>
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

        // 🛠️ CORRECCIÓN: Posicionado absoluto en (0,0) pero enviado al fondo del eje Z
        const contenedorOculto = document.createElement('div');
        contenedorOculto.style.width = '640px'; 
        contenedorOculto.style.position = 'absolute';
        contenedorOculto.style.left = '0'; 
        contenedorOculto.style.top = '0';
        contenedorOculto.style.zIndex = '-9999'; // Oculto detrás de la UI real
        contenedorOculto.innerHTML = htmlFinal;
        document.body.appendChild(contenedorOculto);

        const opcionesPdf = {
          margin: [10, 10, 10, 10], 
          filename: `boletin_${cliente.razonSocial.replace(/ /g, '_')}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { 
            scale: 2, 
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            scrollX: 0, // 🛠️ CORRECCIÓN: Ignora el scroll horizontal del usuario
            scrollY: 0  // 🛠️ CORRECCIÓN: Ignora el scroll vertical del usuario
          },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        const pdfDataUri = await html2pdf().set(opcionesPdf).from(contenedorOculto).outputPdf('datauristring');
        const base64Limpio = pdfDataUri.split('base64,')[1];

        document.body.removeChild(contenedorOculto);

        // Despachamos al backend de Netlify
        const response = await fetch('/.netlify/functions/enviarBoletin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            asunto,
            destinatario: "sere22giacomelli@gmail.com", 
            cuerpoHtml: htmlFinal, 
            adjuntoPdf: base64Limpio 
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Error mandando a ${cliente.razonSocial}`);
        }
      }

      const nuevoRegistro = {
        id: Date.now(),
        fecha: new Date().toLocaleString('es-AR'),
        asunto: asunto,
        destinatariosCount: destinatarios.length,
        vistaPrevia: cuerpoHtml.replace(/<[^>]*>/g, '').substring(0, 50) + (cuerpoHtml.length > 50 ? '...' : ''),
        cuerpoHtml: cuerpoHtml 
      };

      const historialActualizado = [nuevoRegistro, ...historial];
      setHistorial(historialActualizado);
      localStorage.setItem('historial_boletines', JSON.stringify(historialActualizado));

      alert("✅ Todos los PDFs fueron generados a escala y enviados con éxito.");
      setAsunto('');
      setCuerpoHtml('');
    } catch (error) {
      console.error("Fallo:", error);
      alert(`❌ Error al procesar: ${error.message}`);
    } finally {
      setCargando(false);
    }
  };

  const borrarHistorial = () => {
    if (window.confirm("¿Seguro querés eliminar todo el historial de este navegador?")) {
      localStorage.removeItem('historial_boletines');
      setHistorial([]);
      setBoletinSeleccionado(null);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h2 style={{ color: '#0f172a' }}>Centro de Despacho de Boletines (Calibración PDF)</h2>
      
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
          {cargando ? 'Compilando PDFs perfectos...' : 'Enviar Boletines en PDF'}
        </button>
      </form>

      {historial.length > 0 && (
        <div style={{ marginTop: '50px', paddingTop: '30px', borderTop: '2px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ color: '#1e293b', margin: 0 }}>Historial de Boletines Enviados</h3>
            <button 
              onClick={borrarHistorial} 
              style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              Limpiar Historial Local
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '6px', background: '#fff' }}>
              {historial.map((boletin) => (
                <div 
                  key={boletin.id} 
                  onClick={() => setBoletinSeleccionado(boletin)}
                  style={{
                    padding: '12px',
                    borderBottom: '1px solid #e2e8f0',
                    cursor: 'pointer',
                    background: boletinSeleccionado?.id === boletin.id ? '#f1f5f9' : '#ffffff',
                    transition: 'background 0.2s'
                  }}
                >
                  <div style={{ fontWeight: 'bold', fontSize: '0.95rem', color: '#334155' }}>{boletin.asunto}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
                    📅 {boletin.fecha} | 👥 {boletin.destinatariosCount} destinatarios
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '6px', fontStyle: 'italic', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    "{boletin.vistaPrevia}"
                  </div>
                </div>
              ))}
            </div>

            <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '15px', background: '#f8fafc', maxHeight: '400px', overflowY: 'auto' }}>
              {boletinSeleccionado ? (
                <div>
                  <h4 style={{ margin: '0 0 5px 0', color: '#1e293b' }}>{boletinSeleccionado.asunto}</h4>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Despachado: {boletinSeleccionado.fecha}</span>
                  <hr style={{ border: 'none', borderTop: '1px solid #cbd5e1', margin: '10px 0' }} />
                  
                  <div 
                    style={{ 
                      padding: '12px', 
                      background: '#ffffff', 
                      border: '1px solid #e2e8f0', 
                      borderRadius: '4px',
                      fontSize: '0.9rem',
                      maxHeight: '200px',
                      overflowY: 'auto'
                    }}
                    dangerouslySetInnerHTML={{ __html: boletinSeleccionado.cuerpoHtml }}
                  />
                  
                  <button 
                    onClick={() => {
                      setAsunto(boletinSeleccionado.asunto);
                      setCuerpoHtml(boletinSeleccionado.cuerpoHtml);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    style={{ 
                      marginTop: '15px', 
                      width: '100%', 
                      padding: '10px', 
                      background: '#2563eb', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '4px', 
                      cursor: 'pointer', 
                      fontWeight: 'bold',
                      fontSize: '0.9rem' 
                    }}
                  >
                    📝 Cargar contenido en el editor
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', height: '100%', minHeight: '150px', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontStyle: 'italic', fontSize: '0.9rem', textAlign: 'center' }}>
                  Seleccioná un boletín del historial para inspeccionar su contenido o recargarlo.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditorBoletin;