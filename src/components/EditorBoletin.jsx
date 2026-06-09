// src/components/EditorBoletin.jsx
import { useState, useEffect } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { LOGO_CIFAS_URL } from '../utils/assets.js';

const EditorBoletin = ({ clientesDB }) => {
  const [asunto, setAsunto] = useState('');
  const [cuerpoHtml, setCuerpoHtml] = useState('');
  const [cargando, setCargando] = useState(false);
  
  // 📜 Estado para almacenar el histórico
  const [historial, setHistorial] = useState([]);
  
  // 👁️ Estado para controlar qué boletín se está mirando en el modal
  const [boletinSeleccionado, setBoletinSeleccionado] = useState(null);

  // Cargar el historial del localStorage al montar el componente
  useEffect(() => {
    const historialGuardado = JSON.parse(localStorage.getItem('historial_boletines') || '[]');
    setHistorial(historialGuardado);
  }, []);

  const destinatarios = clientesDB?.filter(c => c.enviarBoletin === true) || [];

  // BLINDADO PARA WORD: XML namespaces y forzado de Vista de Impresión (Print View)
  const generarTemplateEmpresa = (contenido, cliente) => {
    return `
<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <title>Boletín de Novedades</title>
  <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    body { margin: 0; padding: 0; background-color: #ffffff; }
    p, ul, ol { font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 1.5; color: #000000; text-align: justify; margin: 0 0 12px 0; }
    h1 { font-size: 28px; font-family: Arial, Helvetica, sans-serif; font-weight: bold; color: #333333; text-align: center; margin: 0 0 8px 0; }
    h2 { font-size: 18px; font-family: Arial, Helvetica, sans-serif; font-weight: normal; color: #555555; text-align: center; margin: 0 0 20px 0; }
    a { color: #11B4FF; text-decoration: underline; }
    
    /* Configuración de página física para el motor de Microsoft Word */
    @page {
      size: 8.5in 11in;
      margin: 1.0in 1.0in 1.0in 1.0in;
    }
    div.WordSection1 { page: WordSection1; }
    table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff;">
  <div class="WordSection1">
    <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="width: 600px; min-width: 600px; max-width: 600px; margin: 0 auto; border-collapse: collapse; table-layout: fixed;">
      <tbody>
        <tr>
          <td align="center" width="600" style="width: 600px; padding: 20px 0; text-align: center;">
            <img src="${LOGO_CIFAS_URL}" width="154" alt="Logo CIFAS" style="display: block; border: 0; width: 154px; height: auto; margin: 0 auto;" />
          </td>
        </tr>
        <tr>
          <td align="center" width="600" style="width: 600px; padding: 10px 0; text-align: center;">
            <h1 style="font-size: 28px; font-family: Arial, Helvetica, sans-serif; font-weight: bold; color: #333333; text-align: center; margin: 0 0 8px 0;"><strong>BOLETIN DE NOVEDADES</strong></h1>
          </td>
        </tr>
        <tr>
          <td bgcolor="#E2E2E2" align="left" width="600" style="background-color: #E2E2E2; width: 600px; padding: 30px 25px; border-radius: 4px; text-align: justify; box-sizing: border-box;">
            <p style="font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 1.5; color: #000000; margin: 0 0 15px 0; text-align: justify;">Estimado/a <strong>${cliente.razonSocial}</strong>,</p>
            
            <div style="font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 1.5; color: #000000; text-align: justify;">
              ${contenido}
            </div>
            
            <p style="font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 1.5; color: #000000; margin: 25px 0 0 0; text-align: justify;">Reciban un cordial saludo,<br><strong>El equipo de CIFAS.</strong></p>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
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
        
        const response = await fetch('/.netlify/functions/enviarBoletin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            asunto,
            cuerpoHtml: htmlFinal
          }),
        });

        if (!response.ok) throw new Error(`Error enviando a ${cliente.razonSocial}`);
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

      alert("✅ Todos los boletines fueron procesados correctamente.");
      setAsunto('');
      setCuerpoHtml('');
    } catch (error) {
      console.error(error);
      alert("❌ Hubo un error al despachar los boletines.");
    } finally {
      setCargando(false);
    }
  };

  const borrarHistorial = () => {
    if (window.confirm("¿Seguro querés eliminar todo el historial de envíos de este navegador?")) {
      localStorage.removeItem('historial_boletines');
      setHistorial([]);
    }
  };

  const modulosQuill = { 
    toolbar: [
      [{ 'header': [1, 2, false] }], 
      ['bold', 'italic', 'underline'], 
      [{ 'list': 'ordered'}, { 'list': 'bullet' }], 
      ['link'], 
      ['clean']
    ] 
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
            modules={modulosQuill} 
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
          {cargando ? 'Enviando boletines...' : 'Enviar Boletín + Word Adjunto'}
        </button>
      </form>

      {/* 📜 SECCIÓN: HISTORIAL DE ENVIADOS */}
      <div style={{ marginTop: '50px', paddingTop: '30px', borderTop: '2px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ margin: 0, color: '#1e293b' }}>Historial de Boletines Enviados</h3>
          {historial.length > 0 && (
            <button 
              onClick={borrarHistorial} 
              style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
            >
              Borrar Historial
            </button>
          )}
        </div>

        {historial.length === 0 ? (
          <p style={{ color: '#64748b', fontStyle: 'italic', fontSize: '14px' }}>No registrás boletines enviados recientemente en este equipo.</p>
        ) : (
          <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff', fontSize: '14px', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                  <th style={{ padding: '12px 16px' }}>Fecha / Hora</th>
                  <th style={{ padding: '12px 16px' }}>Asunto</th>
                  <th style={{ padding: '12px 16px' }}>Contenido de Referencia</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Impacto</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {historial.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9', color: '#334155' }}>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap', color: '#64748b' }}>{item.fecha}</td>
                    <td style={{ padding: '12px 16px', fontWeight: '600' }}>{item.asunto}</td>
                    <td style={{ padding: '12px 16px', color: '#64748b', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.vistaPrevia}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>
                        {item.destinatariosCount} clts.
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <button
                        onClick={() => setBoletinSeleccionado(item)}
                        style={{ background: '#0f172a', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                      >
                        Ver contenido
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 👁️ VENTANA MODAL DE VISUALIZACIÓN */}
      {boletinSeleccionado && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(2px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999
        }}>
          <div style={{
            background: '#fff', padding: '24px', borderRadius: '12px',
            maxWidth: '650px', width: '90%', maxHeight: '80vh', overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            fontFamily: 'sans-serif'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '15px' }}>
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#0f172a' }}>{boletinSeleccionado.asunto}</h4>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Enviado el: {boletinSeleccionado.fecha}</span>
              </div>
              <button 
                onClick={() => setBoletinSeleccionado(null)}
                style={{ background: '#f1f5f9', border: 'none', color: '#64748b', fontSize: '16px', fontWeight: 'bold', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div 
              className="ql-editor"
              style={{ padding: '15px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', minHeight: '150px', color: '#334155', textAlign: 'left' }}
              dangerouslySetInnerHTML={{ __html: boletinSeleccionado.cuerpoHtml || '<p style="color:#ef4444;">Sin contenido HTML registrado.</p>' }}
            />

            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button 
                onClick={() => setBoletinSeleccionado(null)}
                style={{ padding: '8px 16px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
              >
                Cerrar Vista
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditorBoletin;