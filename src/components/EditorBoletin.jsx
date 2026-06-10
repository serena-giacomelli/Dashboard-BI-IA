// src/components/EditorBoletin.jsx
import { useState, useEffect } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import html2pdf from 'html2pdf.js';
import { LOGO_CIFAS_BASE64 } from '../utils/assets.js'; 

const EditorBoletin = ({ clientesDB }) => {
  const [asunto, setAsunto] = useState('');
  const [cuerpoHtml, setCuerpoHtml] = useState('');
  const [cargando, setCargando] = useState(false);
  const [envioActual, setEnvioActual] = useState(0); 
  
  const [historial, setHistorial] = useState([]);
  const [boletinSeleccionado, setBoletinSeleccionado] = useState(null); 

  useEffect(() => {
    const historialGuardado = JSON.parse(localStorage.getItem('historial_boletines') || '[]');
    setHistorial(historialGuardado);
  }, []);

  const destinatarios = clientesDB?.filter(c => c.enviarBoletin === true) || [];

  // Template estructurado con tablas e inline-styles puros obligatorios para Gmail/Outlook
  const generarTemplateEmpresa = (contenido, cliente) => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Boletín de Novedades</title>
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-print-color-adjust: exact;">
  
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="width: 600px; margin: 0 auto; border-collapse: collapse; background-color: #ffffff; font-family: Arial, Helvetica, sans-serif;">
    <tbody>
      <tr>
        <td align="center" style="padding: 20px 0; text-align: center;">
          <img src="${LOGO_CIFAS_BASE64}" width="154" alt="Logo CIFAS" style="display: block; border: 0; width: 154px; height: auto; margin: 0 auto;" />
        </td>
      </tr>
      <tr>
        <td align="center" style="padding: 5px 0; text-align: center;">
          <h1 style="font-family: Arial, sans-serif; font-size: 24pt; font-weight: bold; color: #333333; margin: 0 0 6pt 0; text-align: center;">BOLETIN DE NOVEDADES</h1>
          <h2 style="font-family: Arial, sans-serif; font-size: 15pt; font-weight: normal; color: #555555; margin: 0 0 18pt 0; text-align: center;">DEL 01/06/2026 AL 07/06/2026</h2>
        </td>
      </tr>
      <tr>
        <td bgcolor="#E2E2E2" style="background-color: #E2E2E2 !important; padding: 30px; border-radius: 4px;">
          <p style="font-family: Arial, sans-serif; font-size: 11pt; color: #000000; line-height: 1.5; margin: 0 0 12pt 0; text-align: justify; background: transparent !important;">
            Estimado/a <strong>${cliente.razonSocial}</strong>,
          </p>
          
          <div style="font-family: Arial, sans-serif; font-size: 11pt; color: #000000; line-height: 1.5; text-align: justify; background: transparent !important;">
            ${contenido}
          </div>
          
          <p style="font-family: Arial, sans-serif; font-size: 11pt; color: #000000; line-height: 1.5; margin: 25pt 0 0 0; text-align: justify; background: transparent !important;">
            Reciban un cordial saludo,<br><strong>El equipo de CIFAS.</strong>
          </p>
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
    setEnvioActual(0);

    try {
      for (const cliente of destinatarios) {
        setEnvioActual(prev => prev + 1);

        const htmlFinal = generarTemplateEmpresa(cuerpoHtml, cliente);

        // 🛡️ CONTENEDOR SEGURO: Se monta abajo de todo en la pantalla del navegador (invisible para el ojo humano)
        const wrapperOculto = document.createElement('div');
        wrapperOculto.style.position = 'fixed';
        wrapperOculto.style.top = '100vh'; 
        wrapperOculto.style.left = '0';
        wrapperOculto.style.width = '600px'; 
        wrapperOculto.style.backgroundColor = '#ffffff';
        wrapperOculto.innerHTML = htmlFinal;
        document.body.appendChild(wrapperOculto);

        // 🚀 TIEMPO DE ESPERA CRUCIAL: Damos 150ms directos para que el microprocesador dibuje el Base64 en el DOM
        await new Promise(resolve => setTimeout(resolve, 150));

        const opt = {
          margin: [10, 10, 10, 10], 
          filename: `boletin_${cliente.razonSocial.replace(/ /g, '_')}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { 
            scale: 2, 
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
          },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        // Capturamos desde el elemento ya asimilado e hidratado por el navegador
        const pdfBase64Uri = await html2pdf().set(opt).from(wrapperOculto).outputPdf('datauristring');
        const pdfBase64Limpio = pdfBase64Uri.split('base64,')[1];

        // Desmontamos el clon temporal inmediatamente
        document.body.removeChild(wrapperOculto);

        // Envío al endpoint de Netlify
        const response = await fetch('/.netlify/functions/enviarBoletin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            asunto,
            destinatario: cliente.email, 
            cuerpoHtml: htmlFinal,
            adjuntoPdf: pdfBase64Limpio 
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Error mandando a ${cliente.razonSocial}`);
        }
      }

      // Guardado en el registro histórico
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

      alert("✅ ¡Perfecto! Los correos se enviaron con diseño intacto y los PDFs ya no vienen vacíos.");
      setAsunto('');
      setCuerpoHtml('');
    } catch (error) {
      console.error("Detalle del fallo:", error);
      alert(`❌ Error al despachar boletines: ${error.message}`);
    } finally {
      setCargando(false);
      setEnvioActual(0);
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
          {cargando ? `Despachando boletín ${envioActual} de ${destinatarios.length}...` : 'Enviar Boletines + PDF Adjunto'}
        </button>
      </form>

      {historial.length > 0 && (
        <div style={{ marginTop: '50px', paddingTop: '30px', borderTop: '2px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0, color: '#1e293b' }}>Historial de Boletines Enviados</h3>
            <button 
              onClick={borrarHistorial} 
              style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
            >
              Borrar Historial
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Columna Izquierda: Historial */}
            <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '6px', background: '#fff' }}>
              {historial.map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => setBoletinSeleccionado(item)}
                  style={{
                    padding: '12px',
                    borderBottom: '1px solid #e2e8f0',
                    cursor: 'pointer',
                    background: boletinSeleccionado?.id === item.id ? '#f1f5f9' : '#ffffff',
                    transition: 'background 0.2s'
                  }}
                >
                  <div style={{ fontWeight: 'bold', fontSize: '0.95rem', color: '#334155' }}>{item.asunto}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>📅 {item.fecha}</div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '4px' }}>"{item.vistaPrevia}"</div>
                </div>
              ))}
            </div>

            {/* Columna Derecha: Vista Previa */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '15px', background: '#f8fafc', maxHeight: '400px', overflowY: 'auto' }}>
              {boletinSeleccionado ? (
                <div>
                  <h4 style={{ margin: '0 0 5px 0' }}>{boletinSeleccionado.asunto}</h4>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Impacto: {boletinSeleccionado.destinatariosCount} clientes.</span>
                  <hr style={{ border: 'none', borderTop: '1px solid #cbd5e1', margin: '10px 0' }} />
                  
                  <div 
                    style={{ padding: '10px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '0.9rem' }}
                    dangerouslySetInnerHTML={{ __html: boletinSeleccionado.cuerpoHtml }}
                  />
                  
                  <button 
                    onClick={() => {
                      setAsunto(boletinSeleccionado.asunto);
                      setCuerpoHtml(boletinSeleccionado.cuerpoHtml);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    style={{ marginTop: '15px', width: '100%', padding: '10px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    📝 Cargar contenido en editor
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', height: '100%', minHeight: '150px', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontStyle: 'italic', fontSize: '0.9rem' }}>
                  Seleccioná un boletín del historial para inspeccionar su contenido.
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