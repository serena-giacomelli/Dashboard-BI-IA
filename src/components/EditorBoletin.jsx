// src/components/EditorBoletin.jsx
import { useState } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { LOGO_CIFAS_URL } from '../utils/assets.js';

const EditorBoletin = ({ clientesDB }) => {
  const [asunto, setAsunto] = useState('');
  const [cuerpoHtml, setCuerpoHtml] = useState('');
  const [cargando, setCargando] = useState(false);

  const destinatarios = clientesDB?.filter(c => c.enviarBoletin === true) || [];

  const generarTemplateEmpresa = (contenido, cliente) => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <style>
    .main-content * { box-sizing: border-box; }
    .main-content h1 { font-size: 36px; font-family: Arial, Helvetica, sans-serif; font-weight: 400; line-height: 1.3em; margin-top: 0px; margin-bottom: 0.5em; text-align: center !important; color: rgb(51, 51, 51); }
    .main-content h2 { font-size: 31px; font-family: Arial, Helvetica, sans-serif; font-weight: 400; line-height: 1.3em; margin-top: 0px; margin-bottom: 0.5em; text-align: center !important; color: rgb(51, 51, 51); }
    .main-content p, .main-content ul, .main-content ol { font-family: Lato, sans-serif; font-size: 17px; margin-top: 0px; margin-bottom: 0.5em; line-height: 1.3em; color: rgb(0, 0, 0); text-align: justify !important; }
    .main-content a, .main-content .link { font-family: inherit; font-size: inherit; color: rgb(17, 180, 255); text-decoration: underline; }
    .main-content table { border-collapse: collapse; }
    .main-content td { padding: 0px; }
    .main-content .table-responsive { width: 100%; background-color: rgb(255,255,255) !important; }
    .main-content .table-responsive > table { width: 600px; max-width: 100%; margin: 0 auto; table-layout: fixed; }
    @media (max-width: 600px) {
      .main-content .table-responsive > table { width: 100% !important; }
    }
  </style>
</head>
<body>
  <div class="main-content">
    <div class="table-responsive">
      <table align="center" border="0" cellpadding="0" cellspacing="0">
        <tbody>
          <tr>
            <td style="padding: 20px; text-align: center;">
              <img src="${LOGO_CIFAS_URL}" width="154" alt="Logo CIFAS" style="max-width: 100% !important; vertical-align: middle !important; width: 154px; height: auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 20px;">
              <h1><strong>BOLETIN DE NOVEDADES</strong></h1>
              <h2>DEL 01/06/2026 AL 07/06/2026</h2>
            </td>
          </tr>
          <tr>
            <td style="background-color: rgb(226,226,226) !important; padding: 30px 28px; border-radius: 4px;">
              <p>Estimado/a <strong>${cliente.razonSocial}</strong>,</p>
              
              ${contenido}
              
              <p>Reciban un cordial saludo,<br><strong>El equipo de CIFAS.</strong></p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
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
      const promesasEnvio = destinatarios.map(async (cliente) => {
        const htmlFinal = generarTemplateEmpresa(cuerpoHtml, cliente);
        
        const response = await fetch('/.netlify/functions/enviarBoletin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            asunto,
            cuerpoHtml: htmlFinal,
            destinatario: cliente.mailFacturacionPrimario,
            incluirWord: true
          }),
        });

        if (!response.ok) throw new Error(`Error enviando a ${cliente.razonSocial}`);
        return response;
      });

      await Promise.all(promesasEnvio);
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
            width: '100%' 
          }}
        >
          {cargando ? 'Enviando boletines...' : 'Enviar Boletín + Word Adjunto'}
        </button>
      </form>
    </div>
  );
};

export default EditorBoletin;