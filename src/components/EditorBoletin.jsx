// src/components/EditorBoletin.jsx
import { useState } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const EditorBoletin = ({ clientesDB }) => {
  const [asunto, setAsunto] = useState('');
  const [cuerpoHtml, setCuerpoHtml] = useState('');
  const [cargando, setCargando] = useState(false);

  // Filtramos la base de datos que viene por props para obtener solo los habilitados
  const destinatarios = clientesDB.filter(c => c.enviarBoletin === true);

  const manejarEnvio = async (e) => {
    e.preventDefault();
    
    if (destinatarios.length === 0) {
      alert("⚠️ No hay clientes habilitados. Habilitá el envío en la sección de Clientes.");
      return;
    }

    if (!asunto || !cuerpoHtml || cuerpoHtml === '<p><br></p>') {
      alert("Por favor completá el asunto y el cuerpo del boletín.");
      return;
    }

    setCargando(true);

    // Banner de simulación detallada para la empresa
    const listaMails = destinatarios.map(c => 
      `<li style="margin-bottom:5px;"><strong>${c.razonSocial}</strong>: ${c.mailFacturacionPrimario}</li>`
    ).join('');

    const bannerSimulacion = `
      <div style="background-color: #f8fafc; border-left: 5px solid #0f172a; padding: 20px; margin-bottom: 25px; font-family: sans-serif; color: #334155;">
        <h3 style="margin-top: 0; color: #0f172a;">⚙️ SIMULACIÓN DE ENVÍO</h3>
        <p>Este boletín se ha enviado a la lista de distribución configurada:</p>
        <ul style="margin: 0; padding-left: 20px;">${listaMails}</ul>
      </div>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-bottom: 25px;" />
    `;

    try {
      const response = await fetch('/.netlify/functions/enviarBoletin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asunto: asunto,
          cuerpoHtml: bannerSimulacion + cuerpoHtml,
          destinatarios: ['TU_MAIL_PARA_PROBAR@gmail.com'] // Cambialo por el tuyo real
        }),
      });

      if (response.ok) {
        alert(`✅ Boletín despachado exitosamente a ${destinatarios.length} clientes.`);
        setAsunto('');
        setCuerpoHtml('');
      } else {
        alert("❌ Error al enviar el boletín.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("❌ Error de conexión con el servidor.");
    } finally {
      setCargando(false);
    }
  };

  const modulosQuill = {
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link'],
      ['clean']
    ],
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h2 style={{ color: '#0f172a', marginBottom: '20px' }}>Centro de Despacho de Boletines</h2>
      
      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '15px', borderRadius: '8px', marginBottom: '25px' }}>
        <p style={{ margin: 0, fontWeight: 'bold', color: '#166534' }}>
          🎯 Destinatarios activos: {destinatarios.length} clientes seleccionados.
        </p>
        <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#15803d' }}>
          Listado dinámico basado en la configuración individual de cada ficha de cliente.
        </p>
      </div>

      <form onSubmit={manejarEnvio}>
        <div style={{ marginBottom: '15px' }}>
          <input 
            type="text" 
            value={asunto}
            onChange={(e) => setAsunto(e.target.value)}
            placeholder="Asunto del Boletín..."
            style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box', fontSize: '16px' }}
          />
        </div>
        
        {/* Contenedor del editor con margen inferior para el botón */}
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
            fontSize: '15px',
            fontWeight: 'bold',
            transition: 'background 0.2s'
          }}
        >
          {cargando ? 'Despachando...' : 'Enviar Boletín a la Selección'}
        </button>
      </form>
    </div>
  );
};

export default EditorBoletin;