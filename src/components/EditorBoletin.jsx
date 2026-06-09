// src/components/EditorBoletin.jsx
import { useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Importa los estilos de Word/Editor

const EditorBoletin = () => {
  const [asunto, setAsunto] = useState('');
  const [cuerpoHtml, setCuerpoHtml] = useState('');
  const [cargando, setCargando] = useState(false);

  const manejarEnvio = async (e) => {
    e.preventDefault();
    
    if (!asunto || !cuerpoHtml || cuerpoHtml === '<p><br></p>') {
      alert("Por favor completá el asunto y el cuerpo del boletín.");
      return;
    }

    setCargando(true);

    try {
      // Llamada a tu Netlify Function
      const response = await fetch('/.netlify/functions/enviarBoletin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          asunto: asunto,
          cuerpoHtml: cuerpoHtml,
          // REEMPLAZAR ACA POR TU MAIL REGISTRADO EN RESEND
          destinatarios: ['sere22giacomelli@gmail.com'] 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("✅ " + data.message);
        setAsunto('');
        setCuerpoHtml(''); // Limpiamos el form
      } else {
        alert("❌ Error al enviar: " + data.error);
      }
    } catch (error) {
      console.error("Error de red:", error);
      alert("❌ Error de red al intentar enviar el boletín.");
    } finally {
      setCargando(false);
    }
  };

  // Módulos para agregar opciones a la barra de herramientas del editor
  const modulosQuill = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link', 'image'],
      ['clean']
    ],
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h2>Crear Nuevo Boletín</h2>
      
      <form onSubmit={manejarEnvio}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Asunto del correo:
          </label>
          <input 
            type="text" 
            value={asunto}
            onChange={(e) => setAsunto(e.target.value)}
            placeholder="Ej: Novedades Anuales 2026..."
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Cuerpo del Boletín:
          </label>
          <div style={{ backgroundColor: 'white', color: 'black' }}>
            <ReactQuill 
              theme="snow" 
              value={cuerpoHtml} 
              onChange={setCuerpoHtml} 
              modules={modulosQuill}
              style={{ height: '300px', marginBottom: '40px' }}
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={cargando}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: cargando ? '#ccc' : '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: cargando ? 'not-allowed' : 'pointer',
            fontSize: '16px'
          }}
        >
          {cargando ? 'Enviando...' : 'Enviar Boletín'}
        </button>
      </form>
    </div>
  );
};

export default EditorBoletin;