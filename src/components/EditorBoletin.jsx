import { useState, useEffect } from 'react';

import ReactQuill from 'react-quill-new';

import 'react-quill-new/dist/quill.snow.css';

import html2pdf from 'html2pdf.js';

import { LOGO_CIFAS_BASE64, LOGO_CIFAS_URL } from '../utils/assets.js';



const EditorBoletin = ({ clientesDB }) => {

  const [asunto, setAsunto] = useState('');

  const [cuerpoHtml, setCuerpoHtml] = useState(''); // Maneja el Resumen del Email

  const [boletinCompleto, setBoletinCompleto] = useState(''); // Maneja el PDF Detallado

  const [puntosClave, setPuntosClave] = useState('');

  const [cargando, setCargando] = useState(false);

  const [generandoIA, setGenerandoIA] = useState(false);

  const [envioActual, setEnvioActual] = useState(0);

 

  const [historial, setHistorial] = useState([]);

  const [boletinSeleccionado, setBoletinSeleccionado] = useState(null);



  const [verDestinatariosModal, setVerDestinatariosModal] = useState(false);

  const [busquedaDestinatario, setBusquedaDestinatario] = useState('');



  // ESTADO NUEVO PARA LAS PESTAÑAS

  const [tabActivo, setTabActivo] = useState('resumen');



  // Control de filtros, orden y paginación del historial

  const [filtroHistorial, setFiltroHistorial] = useState('');

  const [ordenHistorial, setOrdenHistorial] = useState('recientes');

  const [paginaActual, setPaginaActual] = useState(1);

  const [itemsPorPagina, setItemsPorPagina] = useState(5);



  useEffect(() => {

    const historialGuardado = JSON.parse(localStorage.getItem('historial_boletines') || '[]');

    setHistorial(historialGuardado);

  }, []);



  const destinatarios = clientesDB?.filter(c => c.enviarBoletin === true) || [];



  const destinatariosFiltrados = destinatarios.filter(c =>

    c.razonSocial?.toLowerCase().includes(busquedaDestinatario.toLowerCase()) ||

    c.email?.toLowerCase().includes(busquedaDestinatario.toLowerCase())

  );



  // 1. Filtrar historial por asunto

  const historialFiltrado = historial.filter(item =>

    item.asunto?.toLowerCase().includes(filtroHistorial.toLowerCase())

  );



  // 2. Ordenar historial según criterio

  const historialOrdenado = [...historialFiltrado].sort((a, b) => {

    switch (ordenHistorial) {

      case 'recientes':

        return b.id - a.id;

      case 'antiguos':

        return a.id - b.id;

      case 'alfa-asc':

        return (a.asunto || '').localeCompare(b.asunto || '');

      case 'alfa-desc':

        return (b.asunto || '').localeCompare(a.asunto || '');

      default:

        return 0;

    }

  });



  // 3. Calcular paginación de forma segura

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

     

      if (data.resumenEmail && data.boletinCompleto) {

        setCuerpoHtml(data.resumenEmail);

        setBoletinCompleto(data.boletinCompleto);

        setTabActivo('resumen'); // Para que vuelva a la vista principal por defecto al generar uno nuevo

      } else {

        throw new Error("La respuesta de la IA no contiene los bloques requeridos.");

      }

    } catch (error) {

      alert("Error al conectar con el asistente de IA: " + error.message);

    } finally {

      setGenerandoIA(false);

    }

  };



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

    if (destinatarios.length === 0) return alert("No hay clientes habilitados.");

    if (!asunto.trim() || !cuerpoHtml) return alert("Por favor, completa el asunto y el mensaje.");



    setCargando(true);

    try {

      for (const cliente of destinatarios) {

        setEnvioActual(prev => prev + 1);

       

        const htmlEmail = generarTemplateEmpresa(cuerpoHtml, cliente, false);

        // Usamos el boletín técnico detallado para el PDF adjunto (si está vacío, hace fallback al cuerpo)

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

        cuerpoHtml,       // Resumen guardado

        boletinCompleto,  // Detalle de PDF guardado en historial

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

    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>

      <h2>Centro de Despacho de Boletines</h2>

     

      {/* Sección IA */}

      <div style={{ background: '#f8fafc', padding: '15px', border: '1px solid #e2e8f0', marginBottom: '20px', borderRadius: '6px' }}>

        <h4 style={{ margin: '0 0 10px 0' }}>Generar con IA</h4>

        <textarea value={puntosClave} onChange={(e) => setPuntosClave(e.target.value)} placeholder="Puntos clave..." style={{ width: '100%', height: '80px', marginBottom: '10px', padding: '8px', boxSizing: 'border-box' }} />

        <button type="button" onClick={generarConIA} disabled={generandoIA} style={{ padding: '8px 12px', cursor: 'pointer' }}>{generandoIA ? 'Generando...' : 'Generar Boletín Dual'}</button>

      </div>



      {/* Formulario Principal */}

      <form onSubmit={manejarEnvio} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>

        <input

          type="text"

          value={asunto}

          onChange={(e) => setAsunto(e.target.value)}

          placeholder="Asunto del boletín..."

          style={{ width: '100%', padding: '10px', fontSize: '16px', boxSizing: 'border-box' }}

        />



        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '-5px' }}>

          <button

            type="button"

            onClick={() => {

              setBusquedaDestinatario('');

              setVerDestinatariosModal(true);

            }}

            style={{

              padding: '6px 12px', background: '#f1f5f9', border: '1px solid #cbd5e1',

              borderRadius: '16px', cursor: 'pointer', fontSize: '13px', color: '#334155',

              fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s'

            }}

            onMouseEnter={(e) => e.currentTarget.style.background = '#e2e8f0'}

            onMouseLeave={(e) => e.currentTarget.style.background = '#f1f5f9'}

          >

            Destinatarios actuales ({destinatarios.length})

          </button>

          <span style={{ fontSize: '12px', color: '#64748b' }}>Hacé clic para ver la lista filtrada de envío.</span>

        </div>



        {/* INTERFAZ DE PESTAÑAS (TABS) PARA LOS EDITORES */}

        <div style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1', overflow: 'hidden', marginBottom: '20px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>

         

          {/* Cabecera de las Pestañas */}

          <div style={{ display: 'flex', background: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>

            <button

              type="button"

              onClick={() => setTabActivo('resumen')}

              style={{

                flex: 1, padding: '14px', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: 'bold', transition: 'all 0.2s',

                background: tabActivo === 'resumen' ? '#ffffff' : 'transparent',

                color: tabActivo === 'resumen' ? '#0284c7' : '#64748b',

                borderBottom: tabActivo === 'resumen' ? '3px solid #0284c7' : '3px solid transparent',

                outline: 'none'

              }}

            >

              Resumen para el Email

            </button>

            <button

              type="button"

              onClick={() => setTabActivo('completo')}

              disabled={!boletinCompleto}

              style={{

                flex: 1, padding: '14px', border: 'none', cursor: boletinCompleto ? 'pointer' : 'not-allowed', fontSize: '15px', fontWeight: 'bold', transition: 'all 0.2s',

                background: tabActivo === 'completo' ? '#ffffff' : 'transparent',

                color: tabActivo === 'completo' ? '#0284c7' : (boletinCompleto ? '#64748b' : '#cbd5e1'),

                borderBottom: tabActivo === 'completo' ? '3px solid #0284c7' : '3px solid transparent',

                opacity: !boletinCompleto ? 0.6 : 1,

                outline: 'none'

              }}

            >

              Detalle para el PDF { !boletinCompleto && '(Generá con IA primero)' }

            </button>

          </div>



        {/* Contenedor del Editor Activo */}

          <div style={{ padding: '20px', background: '#ffffff', minHeight: '300px' }}>

           

            <div style={{ display: tabActivo === 'resumen' ? 'block' : 'none' }}>

              <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#475569' }}>

                Este texto irá directo en el cuerpo del correo. Mantenelo breve para invitar a abrir el adjunto.

              </p>

              <ReactQuill theme="snow" value={cuerpoHtml} onChange={setCuerpoHtml} style={{ height: '220px', marginBottom: '45px', background: '#fff' }} />

            </div>

           

            <div style={{ display: tabActivo === 'completo' ? 'block' : 'none' }}>

               <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#475569' }}>

                Este contenido se convertirá automáticamente en el PDF que los clientes descargarán.

              </p>

              <ReactQuill theme="snow" value={boletinCompleto} onChange={setBoletinCompleto} style={{ height: '220px', marginBottom: '45px', background: '#fff' }} />

            </div>



          </div>

        </div>

       

        <button type="submit" disabled={cargando} style={{ padding: '12px', background: '#0284c7', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>

          {cargando ? `Enviando (${envioActual}/${destinatarios.length})...` : 'Enviar Boletines'}

        </button>

      </form>



      {/* MODAL 1: BUSCADOR DE DESTINATARIOS */}

      {verDestinatariosModal && (

        <div style={{

          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',

          backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex',

          justifyContent: 'center', alignItems: 'center', zIndex: 10000, backdropFilter: 'blur(2px)'

        }}>

          <div style={{

            background: '#ffffff', borderRadius: '8px', width: '90%', maxWidth: '480px',

            maxHeight: '75vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'

          }}>

            <div style={{ padding: '15px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

              <div>

                <h4 style={{ margin: 0, color: '#0f172a' }}>Lista de Destinatarios Activos</h4>

                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>Clientes que recibirán este boletín</p>

              </div>

              <button type="button" onClick={() => setVerDestinatariosModal(false)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#94a3b8' }}>&times;</button>

            </div>

            <div style={{ padding: '12px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>

              <input

                type="text" value={busquedaDestinatario} onChange={(e) => setBusquedaDestinatario(e.target.value)}

                placeholder="Buscar por Empresa o Email..."

                style={{ width: '100%', padding: '8px 12px', fontSize: '14px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}

              />

            </div>

            <div style={{ padding: '10px 20px', overflowY: 'auto', flex: 1 }}>

              {destinatariosFiltrados.length > 0 ? (

                destinatariosFiltrados.map((cli) => (

                  <div key={cli.id || cli.email} style={{ padding: '10px 0', borderBottom: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column' }}>

                    <span style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>{cli.razonSocial}</span>

                    <span style={{ color: '#64748b', fontSize: '12px' }}>{cli.email}</span>

                  </div>

                ))

              ) : (

                <div style={{ padding: '30px 0', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>No se encontraron destinatarios activos.</div>

              )}

            </div>

            <div style={{ padding: '12px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', background: '#f8fafc', borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px' }}>

              <button type="button" onClick={() => setVerDestinatariosModal(false)} style={{ padding: '6px 16px', background: '#334155', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer', fontSize: '13px' }}>Entendido</button>

            </div>

          </div>

        </div>

      )}



      {/* SECCIÓN DEL HISTORIAL */}

      {historial.length > 0 && (

        <div style={{ marginTop: '50px', borderTop: '2px solid #e2e8f0', paddingTop: '20px' }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>

            <h3 style={{ margin: 0 }}>Historial de Boletines Enviados</h3>

            <button type="button" onClick={borrarHistorial} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: '500', fontSize: '13px' }}>Borrar Historial</button>

          </div>

         

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '15px', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>

            <div style={{ display: 'flex', gap: '10px', flex: 1, minWidth: '260px' }}>

              <input

                type="text"

                value={filtroHistorial}

                onChange={(e) => {

                  setFiltroHistorial(e.target.value);

                  setPaginaActual(1);

                }}

                placeholder="Filtrar historial por asunto..."

                style={{ flex: 1, padding: '6px 12px', fontSize: '14px', borderRadius: '4px', border: '1px solid #cbd5e1' }}

              />

            </div>

           

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>

              <label style={{ fontSize: '13px', color: '#475569', fontWeight: '500' }}>Ordenar por:</label>

              <select

                value={ordenHistorial}

                onChange={(e) => {

                  setOrdenHistorial(e.target.value);

                  setPaginaActual(1);

                }}

                style={{ padding: '6px 10px', fontSize: '13px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#fff' }}

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

                style={{ padding: '6px 6px', fontSize: '13px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#fff' }}

              >

                <option value={5}>Ver 5</option>

                <option value={10}>Ver 10</option>

                <option value={20}>Ver 20</option>

              </select>

            </div>

          </div>

         

          <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>

            {historialPaginado.length > 0 ? (

              historialPaginado.map((item, index) => (

                <div

                  key={item.id}

                  onClick={() => setBoletinSeleccionado(item)}

                  style={{

                    display: 'flex', justifyContent: 'space-between', padding: '12px 15px',

                    borderBottom: index === historialPaginado.length - 1 ? 'none' : '1px solid #e2e8f0',

                    cursor: 'pointer', background: '#ffffff', transition: 'background 0.2s'

                  }}

                  onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}

                  onMouseLeave={(e) => e.currentTarget.style.background = '#ffffff'}

                >

                  <span style={{ fontWeight: '500', color: '#1e293b' }}>{item.asunto}</span>

                  <span style={{ color: '#64748b', fontSize: '14px' }}>{item.fecha}</span>

                </div>

              ))

            ) : (

              <div style={{ padding: '30px', textAlign: 'center', color: '#64748b', background: '#fff', fontSize: '14px' }}>

                No se encontraron boletines en el historial.

              </div>

            )}

          </div>



          {totalPaginas > 1 && (

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px', padding: '0 5px' }}>

              <span style={{ fontSize: '13px', color: '#64748b' }}>

                Mostrando página <strong>{paginaValida}</strong> de <strong>{totalPaginas}</strong> ({historialFiltrado.length} resultados)

              </span>

              <div style={{ display: 'flex', gap: '6px' }}>

                <button

                  type="button"

                  disabled={paginaValida === 1}

                  onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))}

                  style={{

                    padding: '6px 12px', fontSize: '13px', borderRadius: '4px', border: '1px solid #cbd5e1',

                    background: paginaValida === 1 ? '#f1f5f9' : '#fff',

                    color: paginaValida === 1 ? '#94a3b8' : '#334155',

                    cursor: paginaValida === 1 ? 'not-allowed' : 'pointer', fontWeight: '500'

                  }}

                >

                  Anterior

                </button>

                <button

                  type="button"

                  disabled={paginaValida === totalPaginas}

                  onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))}

                  style={{

                    padding: '6px 12px', fontSize: '13px', borderRadius: '4px', border: '1px solid #cbd5e1',

                    background: paginaValida === totalPaginas ? '#f1f5f9' : '#fff',

                    color: paginaValida === totalPaginas ? '#94a3b8' : '#334155',

                    cursor: paginaValida === totalPaginas ? 'not-allowed' : 'pointer', fontWeight: '500'

                  }}

                >

                  Siguiente

                </button>

              </div>

            </div>

          )}

        </div>

      )}



      {/* MODAL 2: VISTA PREVIA HISTORIAL */}

      {boletinSeleccionado && (

        <div style={{

          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',

          backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex',

          justifyContent: 'center', alignItems: 'center', zIndex: 9999, backdropFilter: 'blur(2px)'

        }}>

          <div style={{

            background: '#ffffff', borderRadius: '8px', width: '90%', maxWidth: '750px',

            maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'

          }}>

            <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>

              <div style={{ width: '90%' }}>

                <h3 style={{ margin: '0 0 5px 0', color: '#0f172a' }}>{boletinSeleccionado.asunto}</h3>

                <span style={{ fontSize: '13px', color: '#64748b' }}>Enviado el: {boletinSeleccionado.fecha}</span>

               

                {boletinSeleccionado.clientes && boletinSeleccionado.clientes.length > 0 && (

                  <div style={{ marginTop: '12px' }}>

                    <strong style={{ fontSize: '12px', color: '#475569', display: 'block', marginBottom: '4px' }}>Destinatarios en ese momento:</strong>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '60px', overflowY: 'auto', paddingRight: '5px' }}>

                      {boletinSeleccionado.clientes.map((cli, idx) => (

                        <span key={idx} style={{ background: '#f1f5f9', color: '#334155', fontSize: '11px', padding: '2px 8px', borderRadius: '12px', border: '1px solid #cbd5e1', fontWeight: '500' }}>

                          {cli}

                        </span>

                      ))}

                    </div>

                  </div>

                )}

              </div>

              <button type="button" onClick={() => setBoletinSeleccionado(null)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#94a3b8', lineHeight: '1' }}>&times;</button>

            </div>



            <div style={{ padding: '20px', overflowY: 'auto', flex: 1, background: '#f1f5f9', display: 'flex', flexDirection: 'column', gap: '15px' }}>

              <div style={{ background: '#ffffff', padding: '20px', borderRadius: '6px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>

                <h5 style={{ margin: '0 0 10px 0', color: '#0284c7' }}>Cuerpo del Email Enviado:</h5>

                <div dangerouslySetInnerHTML={{ __html: boletinSeleccionado.cuerpoHtml }} />

              </div>

              {boletinSeleccionado.boletinCompleto && (

                <div style={{ background: '#ffffff', padding: '20px', borderRadius: '6px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>

                  <h5 style={{ margin: '0 0 10px 0', color: '#166534' }}>Contenido del PDF Adjunto:</h5>

                  <div dangerouslySetInnerHTML={{ __html: boletinSeleccionado.boletinCompleto }} />

                </div>

              )}

            </div>



            <div style={{ padding: '15px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>

              <button type="button" onClick={() => setBoletinSeleccionado(null)} style={{ padding: '8px 16px', background: '#e2e8f0', border: 'none', borderRadius: '4px', color: '#334155', cursor: 'pointer', fontWeight: '500' }}>Cerrar</button>

              <button type="button" onClick={() => cargarEnEditor(boletinSeleccionado)} style={{ padding: '8px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' }}>Cargar en Editor</button>

            </div>

          </div>

        </div>

      )}

    </div>

  );

};



export default EditorBoletin;