import { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import html2pdf from 'html2pdf.js';
import { LOGO_CIFAS_BASE64, LOGO_CIFAS_URL } from '../utils/assets.js';
import '../styles/EditorBoletin.css';

const ESTRUCTURA_ORGANISMOS_BORA = [
  { id: 'min_economia', label: 'Ministerio de Economía', subtopicos: [{ id: 'eco_personal', label: 'Designaciones, Estructura Interna y Renuncias' }, { id: 'eco_subsidios', label: 'Transferencias de Partidas y Subsidios Provinciales' }, { id: 'eco_licitaciones', label: 'Licitaciones y Contratos Menores de Suministro' }] },
  { id: 'arca_afip', label: 'ARCA (Ex-AFIP) y Dirección de Aduanas', subtopicos: [{ id: 'arca_personal', label: 'Cambios de Jefaturas y Funciones Internas' }, { id: 'arca_prorrogas', label: 'Prórrogas de Vencimientos Impositivos de Rutina' }] },
  { id: 'min_capital_humano', label: 'Ministerio de Capital Humano', subtopicos: [{ id: 'ch_personal', label: 'Contrataciones y Altas de Personal' }, { id: 'ch_planes', label: 'Asignación de Fondos a Cooperativas y Planes Sociales' }, { id: 'ch_universidades', label: 'Convenios e Internas Universitarias' }] },
  { id: 'bcra_cnv', label: 'Banco Central (BCRA) y CNV', subtopicos: [{ id: 'fin_comunicados', label: 'Circulares de Comunicación Interna y Rutina' }, { id: 'fin_sanciones', label: 'Sumarios Administrativos Menores a Entidades' }] },
  { id: 'min_salud_anmat', label: 'Ministerio de Salud y ANMAT', subtopicos: [{ id: 'salud_compras', label: 'Compras de Insumos y Equipamiento Hospitalario' }, { id: 'salud_autorizaciones', label: 'Inscripciones de Rutina en el Registro de Medicamentos' }] },
  { id: 'min_seguridad_justicia', label: 'Ministerios de Seguridad y Justicia', subtopicos: [{ id: 'seg_ascensos', label: 'Ascensos, Retiros y Movimientos de Fuerzas Federales' }, { id: 'seg_erratas', label: 'Fe de Erratas y Avisos Oficiales de Juzgados' }] }
];

const LISTA_PALABRAS_CLAVES = [
  'INGRESOS BRUTOS', 'GANADERÍA', 'INDUSTRIAS', 'INDUSTRIA FRIGORÍFICA',
  'IMPUESTOS', 'PLANES DE PAGO', 'CODIGO FISCAL', 'LEY IMPOSITIVA',
  'LEY TRIBUTARIA', 'ALICUOTAS'
];

const EditorBoletin = ({ clientesDB }) => {
  const [asunto, setAsunto] = useState('');
  const [cuerpoHtml, setCuerpoHtml] = useState('');
  const [boletinCompleto, setBoletinCompleto] = useState('');
  const [cargando, setCargando] = useState(false);
  const [generandoIA, setGenerandoIA] = useState(false);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [organismosExcluidos, setOrganismosExcluidos] = useState([]);
  const [subtopicosExcluidos, setSubtopicosExcluidos] = useState([]);
  const [modoOrganismo, setModoOrganismo] = useState('excluir');
  
  // Fuentes Activas
  const [incluirBora, setIncluirBora] = useState(true);
  const [incluirSantaFe, setIncluirSantaFe] = useState(true);
  const [incluirEntreRios, setIncluirEntreRios] = useState(true);
  const [palabrasSeleccionadas, setPalabrasSeleccionadas] = useState(LISTA_PALABRAS_CLAVES);

  const [dropdownsAbiertos, setDropdownsAbiertos] = useState({});
  const [envioActual, setEnvioActual] = useState(0);
  const [historial, setHistorial] = useState([]);
  const [boletinSeleccionado, setBoletinSeleccionado] = useState(null);
  const [verDestinatariosModal, setVerDestinatariosModal] = useState(false);
  const [busquedaDestinatario, setBusquedaDestinatario] = useState('');
  const [tabActivo, setTabActivo] = useState('resumen');
  const [filtroHistorial, setFiltroHistorial] = useState('');
  const [ordenHistorial, setOrdenHistorial] = useState('recientes');
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina, setItemsPorPagina] = useState(5);
  const [estadoGeneracion, setEstadoGeneracion] = useState('');
  const abortarGeneracion = useRef(false);

  useEffect(() => {
    const historialGuardado = JSON.parse(localStorage.getItem('historial_boletines') || '[]');
    setHistorial(historialGuardado);
  }, []);

  useEffect(() => {
    const cerrarDesplegablesAfuera = () => setDropdownsAbiertos({});
    window.addEventListener('click', cerrarDesplegablesAfuera);
    return () => window.removeEventListener('click', cerrarDesplegablesAfuera);
  }, []);

  const togglePalabra = (palabra) => {
    setPalabrasSeleccionadas(prev => 
      prev.includes(palabra) ? prev.filter(p => p !== palabra) : [...prev, palabra]
    );
  };

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

  const obtenerRangoSemana = () => {
    const hoy = new Date();
    const diaSemana = hoy.getDay() === 0 ? 7 : hoy.getDay();
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - (diaSemana - 1));
    const viernes = new Date(lunes);
    viernes.setDate(lunes.getDate() + 4);
    const formatoFecha = (fecha) => fecha.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return `DEL ${formatoFecha(lunes)} AL ${formatoFecha(viernes)}`;
  };

  const obtenerNombreArchivoPdf = () => {
    const hoy = new Date();
    const diaSemana = hoy.getDay() === 0 ? 7 : hoy.getDay();
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - (diaSemana - 1));
    const viernes = new Date(lunes);
    viernes.setDate(lunes.getDate() + 4);

    const meses = [
      'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 
      'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
    ];
    
    const mesInicio = meses[lunes.getMonth()];
    const mesFin = meses[viernes.getMonth()];
    const diaInicio = String(lunes.getDate()).padStart(2, '0');
    const diaFin = String(viernes.getDate()).padStart(2, '0');
    const anio = viernes.getFullYear();
    
    let etiquetaJur = '';
    if (incluirBora && (incluirSantaFe || incluirEntreRios)) etiquetaJur = 'INTEGRALES';
    else if (incluirBora) etiquetaJur = 'NACIONALES';
    else etiquetaJur = 'PROVINCIALES';
    
    return `NOVEDADES ${etiquetaJur} ${mesInicio} del ${diaInicio} AL ${diaFin} DE ${mesFin} ${anio}.pdf`;
  };

  const obtenerFechasSemana = () => {
    const fechas = [];
    const hoy = new Date();
    const diaSemana = hoy.getDay() === 0 ? 7 : hoy.getDay();
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - (diaSemana - 1));
    for (let i = 0; i < Math.min(diaSemana, 5); i++) {
      const fechaIteracion = new Date(lunes);
      fechaIteracion.setDate(lunes.getDate() + i);
      const yyyy = fechaIteracion.getFullYear();
      const mm = String(fechaIteracion.getMonth() + 1).padStart(2, '0');
      const dd = String(fechaIteracion.getDate()).padStart(2, '0');
      fechas.push(`${yyyy}${mm}${dd}`);
    }
    return fechas;
  };

  const manejarToggleOrganismo = (orgId) => {
    if (organismosExcluidos.includes(orgId)) {
      setOrganismosExcluidos(organismosExcluidos.filter(id => id !== orgId));
    } else {
      setOrganismosExcluidos([...organismosExcluidos, orgId]);
      const configOrg = ESTRUCTURA_ORGANISMOS_BORA.find(o => o.id === orgId);
      const subIds = configOrg.subtopicos.map(s => s.id);
      setSubtopicosExcluidos(subtopicosExcluidos.filter(id => !subIds.includes(id)));
      setDropdownsAbiertos(prev => ({ ...prev, [orgId]: false }));
    }
  };

  const manejarToggleSubtopico = (subId) => {
    if (subtopicosExcluidos.includes(subId)) {
      setSubtopicosExcluidos(subtopicosExcluidos.filter(id => id !== subId));
    } else {
      setSubtopicosExcluidos([...subtopicosExcluidos, subId]);
    }
  };

  const toggleDropdown = (e, orgId) => {
    e.stopPropagation();
    setDropdownsAbiertos(prev => ({
      ...Object.keys(prev).reduce((acc, key) => ({ ...acc, [key]: false }), {}),
      [orgId]: !prev[orgId]
    }));
  };

  const escapeHtml = (texto = '') => texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const formatearContenidoPdf = (contenido = '') => {
    const textoPlano = String(contenido)
      .replace(/\r\n/g, '\n')
      .replace(/\\n/g, '\n')
      .replace(/^\s*BOLETIN SEMANAL\s*\n+/i, '')
      .replace(/^\s*COMPILADO PROVINCIAL\s*\n+/i, '')
      .replace(/^\s*BOLETÍN INTEGRAL\s*\n+/i, '')
      .trim();
    if (!textoPlano) return '<p style="margin: 0; line-height: 1.6; color: #334155;">Sin contenido para mostrar.</p>';
    if (/<[a-z][\s\S]*>/i.test(textoPlano)) {
      return textoPlano;
    }
    const lineas = textoPlano.split('\n').map((linea) => linea.trim()).filter(Boolean);
    const partes = [];
    let listaAbierta = false;
    const cerrarLista = () => {
      if (listaAbierta) {
        partes.push('</ul>');
        listaAbierta = false;
      }
    };
    lineas.forEach((linea) => {
      if (/^#{1,3}\s+/.test(linea)) {
        cerrarLista();
        const nivel = linea.match(/^#{1,3}/)[0].length;
        const texto = escapeHtml(linea.replace(/^#{1,3}\s+/, ''));
        const tamanio = nivel === 1 ? '20px' : nivel === 2 ? '17px' : '15px';
        partes.push(`<h${Math.min(nivel + 1, 4)} style="margin: 18px 0 8px 0; font-size: ${tamanio}; color: #0f172a; line-height: 1.25;">${texto}</h${Math.min(nivel + 1, 4)}>`);
        return;
      }
      if (/^[-*•]\s+/.test(linea)) {
        if (!listaAbierta) {
          partes.push('<ul style="margin: 10px 0 14px 0; padding-left: 20px;">');
          listaAbierta = true;
        }
        partes.push(`<li style="margin: 0 0 8px 0; line-height: 1.55; color: #334155;">${escapeHtml(linea.replace(/^[-*•]\s+/, ''))}</li>`);
        return;
      }
      cerrarLista();
      partes.push(`<p style="margin: 0 0 12px 0; line-height: 1.65; color: #334155;">${escapeHtml(linea)}</p>`);
    });
    cerrarLista();
    return partes.join('');
  };

const generarConIA = async () => {
    if (!incluirBora && !incluirSantaFe && !incluirEntreRios) {
      return alert("Debes seleccionar al menos una fuente de boletines para generar el compilado.");
    }
    
    // Reseteamos el estado de cancelación al iniciar
    abortarGeneracion.current = false; 
    setGenerandoIA(true);
    const sessionId = Date.now().toString();

    const etiquetasOrganismosExcluidos = ESTRUCTURA_ORGANISMOS_BORA
      .filter(o => organismosExcluidos.includes(o.id))
      .map(o => o.label);
    const etiquetasSubtopicosExcluidos = ESTRUCTURA_ORGANISMOS_BORA
      .flatMap(o => o.subtopicos)
      .filter(s => subtopicosExcluidos.includes(s.id))
      .map(s => s.label);
      
    try {
      setEstadoGeneracion("Calculando rutas y consultando fuentes...");
      let todosLosLinks = new Set();

      // EXTRACCION NACIONAL
      if (incluirBora) {
         const fechas = obtenerFechasSemana();
         for (const fecha of fechas) {
           if (abortarGeneracion.current) throw new Error("CANCELADO_POR_USUARIO");
           setEstadoGeneracion(`Consultando índice BORA del ${fecha.slice(6,8)}/${fecha.slice(4,6)}...`);
           const urlBoletin = `https://www.boletinoficial.gob.ar/seccion/primera/${fecha}`;
           try {
             const res = await fetch('/.netlify/functions/generarBoletinIA', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ action: 'extraer_links', jurisdiccion: 'nacional', urlBoletin })
             });
             if (res.ok) {
                const data = await res.json();
                if (data.links) data.links.forEach(link => todosLosLinks.add(link));
             }
           } catch (e) { console.error(`Error BORA ${fecha}:`, e); }
         }
      }

      // EXTRACCION PROVINCIAL
      if (incluirSantaFe || incluirEntreRios) {
         if (abortarGeneracion.current) throw new Error("CANCELADO_POR_USUARIO");
         setEstadoGeneracion(`Consultando portales provinciales vigentes...`);
         try {
             const resProv = await fetch('/.netlify/functions/generarBoletinIA', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: 'extraer_links', 
                    jurisdiccion: 'provincial', 
                    provinciasActivas: { santaFe: incluirSantaFe, entreRios: incluirEntreRios }
                })
             });
             if (resProv.ok) {
                const dataProv = await resProv.json();
                if (dataProv.links) dataProv.links.forEach(l => todosLosLinks.add(l));
             }
         } catch(e) { console.error("Error provincial:", e); }
      }

      const listaLinks = Array.from(todosLosLinks);
      if (listaLinks.length === 0) {
        alert("No se encontraron normativas en los portales seleccionados.");
        setGenerandoIA(false);
        setEstadoGeneracion("");
        return;
      }

      if (abortarGeneracion.current) throw new Error("CANCELADO_POR_USUARIO");
      setEstadoGeneracion(`Iniciando filtrado inteligente de ${listaLinks.length} enlaces detectados...`);
      
      const resIniciar = await fetch('/.netlify/functions/generarBoletinIA', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            action: 'iniciar', 
            sessionId, 
            links: listaLinks, 
            organismosExcluidos: etiquetasOrganismosExcluidos, 
            subtopicosExcluidos: etiquetasSubtopicosExcluidos, 
            modoOrganismo,
            palabrasClaves: palabrasSeleccionadas
        }),
      });
      if (!resIniciar.ok) throw new Error(`No se pudo iniciar la sesión.`);
      
      let procesando = true;
      let iteracion = 0;
      const MAX_ITERACIONES = listaLinks.length + 5;
      
      while (procesando) {
        if (abortarGeneracion.current) throw new Error("CANCELADO_POR_USUARIO"); // Verifica en cada ciclo
        iteracion++;
        if (iteracion > MAX_ITERACIONES) throw new Error("Límite de lectura de enlaces alcanzado.");
        
        const res = await fetch('/.netlify/functions/generarBoletinIA', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'procesar_siguiente', sessionId }),
        });
        
        if (!res.ok) {
          await new Promise(r => setTimeout(r, 1000));
          continue;
        }
        const data = await res.json();
        if (data.progress >= data.total) {
          procesando = false;
        } else {
          setEstadoGeneracion(`Extrayendo texto base: ${data.progress} de ${data.total}...`);
        }
      }
      
      if (abortarGeneracion.current) throw new Error("CANCELADO_POR_USUARIO");
      setEstadoGeneracion("Ensamblando Boletín Integral con IA en Lotes de Alta Velocidad...");
      
      const finalRes = await fetch('/.netlify/functions/generarBoletinIA', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resumir', sessionId }),
      });
      const dataFinal = await finalRes.json();
      if (!finalRes.ok) throw new Error(dataFinal.error || "Error en la fase final de la IA");
      
      setCuerpoHtml(dataFinal.resumenEmail);
      setBoletinCompleto(dataFinal.boletinCompleto);
      setTabActivo('resumen');
      
    } catch (error) {
      if (error.message === "CANCELADO_POR_USUARIO") {
        console.log("Generación cancelada por el usuario.");
        // No mostramos el alert feo, solo actualizamos el estado
      } else {
        console.error(error);
        alert("Error crítico durante la generación: " + error.message);
      }
    } finally {
      setGenerandoIA(false);
      if (abortarGeneracion.current) {
        setEstadoGeneracion("Generación cancelada.");
        // Borramos el texto después de 3 segundos para limpiar la UI
        setTimeout(() => setEstadoGeneracion(""), 3000); 
      } else {
        setEstadoGeneracion("");
      }
    }
  };

  const generarTemplateEmpresa = (contenido, cliente, paraPdf = false) => {
    const logoSeleccionado = paraPdf ? LOGO_CIFAS_BASE64 : LOGO_CIFAS_URL;
    
    let etiquetaJur = '';
    if (incluirBora && (incluirSantaFe || incluirEntreRios)) etiquetaJur = 'INTEGRAL';
    else if (incluirBora) etiquetaJur = 'NACIONAL';
    else etiquetaJur = 'PROVINCIAL';

    if (paraPdf) {
      return `
        <div style="font-family: Arial, Helvetica, sans-serif; color: #333333; padding: 10px;">
          <style>
            .evitar-corte { page-break-inside: avoid !important; }
            h1, h2, h3, h4, strong { page-break-after: avoid !important; }
            p { orphans: 2; widows: 2; margin-bottom: 10px; font-size: 11pt; line-height: 1.5; color: #222222; text-align: justify; }
            .organismo-titulo { font-size: 13pt; font-weight: bold; color: #000000; text-transform: uppercase; margin-top: 30px; margin-bottom: 15px; border-bottom: 1px solid #000000; padding-bottom: 5px; }
          </style>

          <div style="text-align: center; margin-bottom: 25px;">
            <img src="${logoSeleccionado}" width="160" style="display: inline-block; margin-bottom: 15px;" />
            <h1 style="margin: 0 0 5px 0; font-size: 16pt; color: #000000; font-weight: bold;">BOLETÍN DE NOVEDADES ${etiquetaJur}</h1>
            <h2 style="margin: 0; font-size: 12pt; color: #333333; font-weight: normal;">Semana del ${obtenerRangoSemana()}</h2>
          </div>
          
          <div style="margin-bottom: 30px; text-align: justify;" class="evitar-corte">
            <p style="font-weight: bold; color: #000000;">Estimados Clientes de CIFAS:</p>
            <p>Desde CIFAS, como parte de nuestro servicio de asesoramiento, elaboramos un informe semanal con las actualizaciones más relevantes en materia impositiva y comercial, tanto a nivel nacional como provincial, del rubro y de aquellas que afectan a todos los sectores en general.</p>
            <p>En esta ocasión, queremos compartirlo también con ustedes, con el propósito de brindar información clave para la toma de decisiones y fortalecer el conocimiento dentro del sector.</p>
            <p>Si alguna de estas novedades es de su interés o desean profundizar en su impacto, estamos a disposición para asesorarlos.</p>
            <p style="margin-top: 25px; color: #000000; text-align: justify;">Saludos cordiales,<br><strong>El equipo de CIFAS</strong></p>
          </div>
          
          <div style="word-wrap: break-word; overflow-wrap: break-word; font-size: 11pt; line-height: 1.5; color: #222222;">
            ${formatearContenidoPdf(contenido)}
          </div>

          <div style="margin-top: 40px; padding-top: 20px; text-align: center !important;" class="evitar-corte">
            <img src="${logoSeleccionado}" width="140" style="display: inline-block; margin-bottom: 15px;" />
            <p style="font-size: 11pt; text-align: center !important; color: #000000; margin-bottom: 5px;"><strong>Referente Comercial:</strong></p>
            <p style="font-size: 11pt; text-align: center !important; color: #000000; margin-bottom: 5px;">valeriafabrizio@cifas.com.ar // +54 9 341 307-1907</p>
            <p style="font-size: 11pt; text-align: center !important; font-weight: bold; margin-bottom: 0;"><a href="http://www.cifas.com.ar" style="color: #000000; text-decoration: none;">www.cifas.com.ar</a></p>
          </div>
        </div>`;
    }
    const tablaCore = `
      <table align="center" width="600" style="width: 600px; margin: 0 auto; font-family: Arial, Helvetica, sans-serif; border-collapse: collapse;">
        <tr><td align="center" style="padding-bottom: 20px;"><img src="${logoSeleccionado}" width="154" style="display: block;" /></td></tr>
        <tr><td align="center" style="padding-bottom: 10px;"><h1 style="margin: 0; font-size: 24px; color: #333;">COMPILADO INFORMATIVO LEGAL</h1><h2 style="margin: 5px 0 20px 0; font-size: 16px; color: #666;">${obtenerRangoSemana()}</h2></td></tr>
        <tr><td bgcolor="#E2E2E2" style="padding: 30px; border-radius: 8px;">
          <p style="margin-top: 0;">Estimado/a <strong>${cliente.razonSocial}</strong>,</p>
          <div style="line-height: 1.6; color: #222;">${contenido}</div>
          <p style="margin-bottom: 0; margin-top: 20px;">Reciban un cordial saludo,<br><strong>El equipo de CIFAS.</strong></p>
        </td></tr></table>`;
    return `
      <!DOCTYPE html>
      <html><head><meta charset="utf-8"></head>
      <body style="margin: 0; padding: 20px; background-color: #f4f4f4;">
        ${tablaCore}</body></html>`;
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
        const htmlPdf = generarTemplateEmpresa(boletinCompleto || cuerpoHtml, cliente, true);
        const opcionesPdf = { 
              margin: [10, 10, 10, 10], 
              filename: obtenerNombreArchivoPdf(),
              image: { type: 'jpeg', quality: 0.98 }, 
              html2canvas: { scale: 1, useCORS: true, letterRendering: true, scrollY: 0, windowWidth: 1000 }, 
              jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true }, 
              pagebreak: { mode: ['css', 'legacy'] } 
            };
        const pdfBase64Uri = await html2pdf().set(opcionesPdf).from(htmlPdf).outputPdf('datauristring');
        const pdfBase64Limpio = pdfBase64Uri.split('base64,')[1];
        await fetch('/.netlify/functions/enviarBoletin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ asunto, destinatario: cliente.email, cuerpoHtml: htmlEmail, adjuntoPdf: pdfBase64Limpio }),
        });
      }
      const nuevoRegistro = { id: Date.now(), fecha: new Date().toLocaleString('es-AR'), asunto, cuerpoHtml, boletinCompleto, clientes: destinatarios.map(c => c.razonSocial) };
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
    <div className="eb-container">
      <h2>Centro de Despacho de Boletines</h2>
      
      <div className="eb-ia-section" style={{ background: '#f8fafc', padding: '16px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: mostrarFiltros ? '15px' : '0' }}>
          <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#1e293b' }}>Configuración de Extracción Integral</span>
          <button type="button"
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '6px 14px', borderRadius: '5px', fontSize: '13px', color: '#334155', cursor: 'pointer', fontWeight: '500', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
            {mostrarFiltros ? 'Ocultar Filtros' : 'Mostrar Filtros y Fuentes'}
          </button>
        </div>

      {mostrarFiltros && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
            
            {/* TARJETA 1: FUENTES */}
            <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '16px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>1. Fuentes a Consultar</h4>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', background: incluirBora ? '#eff6ff' : '#f8fafc', border: incluirBora ? '1px solid #bfdbfe' : '1px solid #e2e8f0', borderRadius: '6px', transition: 'all 0.2s' }}>
                  <input type="checkbox" checked={incluirBora} onChange={(e) => setIncluirBora(e.target.checked)} style={{ accentColor: '#2563eb', width: '16px', height: '16px' }} />
                  <span style={{ fontSize: '13px', fontWeight: incluirBora ? '600' : '500', color: incluirBora ? '#1e3a8a' : '#475569' }}>Nación (BORA)</span>
                </label>
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', background: incluirSantaFe ? '#eff6ff' : '#f8fafc', border: incluirSantaFe ? '1px solid #bfdbfe' : '1px solid #e2e8f0', borderRadius: '6px', transition: 'all 0.2s' }}>
                  <input type="checkbox" checked={incluirSantaFe} onChange={(e) => setIncluirSantaFe(e.target.checked)} style={{ accentColor: '#2563eb', width: '16px', height: '16px' }} />
                  <span style={{ fontSize: '13px', fontWeight: incluirSantaFe ? '600' : '500', color: incluirSantaFe ? '#1e3a8a' : '#475569' }}>Santa Fe</span>
                </label>
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', background: incluirEntreRios ? '#eff6ff' : '#f8fafc', border: incluirEntreRios ? '1px solid #bfdbfe' : '1px solid #e2e8f0', borderRadius: '6px', transition: 'all 0.2s' }}>
                  <input type="checkbox" checked={incluirEntreRios} onChange={(e) => setIncluirEntreRios(e.target.checked)} style={{ accentColor: '#2563eb', width: '16px', height: '16px' }} />
                  <span style={{ fontSize: '13px', fontWeight: incluirEntreRios ? '600' : '500', color: incluirEntreRios ? '#1e3a8a' : '#475569' }}>Entre Ríos</span>
                </label>
              </div>
            </div>

            {/* TARJETA 2: PROVINCIALES (Píldoras) */}
            {(incluirSantaFe || incluirEntreRios) && (
              <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '16px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h4 style={{ margin: 0, fontSize: '13px', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>2. Filtros Provinciales</h4>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Solo se incluyen normas con estos términos</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {LISTA_PALABRAS_CLAVES.map(palabra => {
                    const activo = palabrasSeleccionadas.includes(palabra);
                    return (
                      <button
                        type="button"
                        key={palabra}
                        onClick={() => togglePalabra(palabra)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '20px',
                          border: activo ? '1px solid #3b82f6' : '1px solid #cbd5e1',
                          background: activo ? '#eff6ff' : '#f8fafc',
                          color: activo ? '#1d4ed8' : '#475569',
                          fontSize: '11px',
                          fontWeight: activo ? '600' : '500',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.2s'
                        }}
                      >
                        {activo && <span style={{ fontSize: '10px' }}>✓</span>}
                        {palabra}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* TARJETA 3: NACIONAL */}
            {incluirBora && (
              <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '16px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                   <h4 style={{ margin: 0, fontSize: '13px', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>3. Exclusiones Nacionales (BORA)</h4>
                   <div style={{ display: 'flex', gap: '12px', fontSize: '12px', background: '#f8fafc', padding: '6px 12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: modoOrganismo === 'excluir' ? '600' : '400', color: modoOrganismo === 'excluir' ? '#0f172a' : '#64748b' }}>
                        <input type="radio" checked={modoOrganismo === 'excluir'} onChange={() => setModoOrganismo('excluir')} style={{ accentColor: '#2563eb' }} /> 
                        Excluir marcados
                      </label>
                      <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: modoOrganismo === 'incluir' ? '600' : '400', color: modoOrganismo === 'incluir' ? '#0f172a' : '#64748b' }}>
                        <input type="radio" checked={modoOrganismo === 'incluir'} onChange={() => setModoOrganismo('incluir')} style={{ accentColor: '#2563eb' }} /> 
                        Incluir solo marcados
                      </label>
                   </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '10px' }}>
                  {ESTRUCTURA_ORGANISMOS_BORA.map(org => {
                    const estaOrgExcluido = organismosExcluidos.includes(org.id);
                    const isOpen = !!dropdownsAbiertos[org.id];
                    let textoDesplegable = modoOrganismo === 'incluir' ? 'Se incluirá solo si está marcado' : 'Todos los temas incluidos';
                    if (modoOrganismo === 'excluir' && estaOrgExcluido) textoDesplegable = "Organismo omitido";
                    return (
                      <div key={org.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#334155' }}>{org.label}</span>
                          <label style={{ fontSize: '11px', color: '#ef4444', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input type="checkbox" checked={estaOrgExcluido} onChange={() => manejarToggleOrganismo(org.id)} style={{ accentColor: '#ef4444' }}/>
                            {modoOrganismo === 'incluir' ? 'Incluir' : 'Excluir'}
                          </label>
                        </div>
                        <div style={{ position: 'relative', width: '100%' }}>
                          <button type="button" disabled={modoOrganismo === 'excluir' && estaOrgExcluido} onClick={(e) => toggleDropdown(e, org.id)} style={{ width: '100%', padding: '6px 10px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'left', fontSize: '11px', color: '#475569', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>{textoDesplegable}</span>
                            <span style={{ fontSize: '9px', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
                          </button>
                          {isOpen && !(modoOrganismo === 'excluir' && estaOrgExcluido) && (
                            <div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#ffffff', border: '1px solid #94a3b8', borderRadius: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 100, maxHeight: '160px', overflowY: 'auto', marginTop: '4px' }}>
                              {org.subtopicos.map(sub => (
                                <label key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', cursor: 'pointer', fontSize: '11px', borderBottom: '1px solid #f1f5f9', color: '#334155' }}>
                                  <input type="checkbox" checked={subtopicosExcluidos.includes(sub.id)} onChange={() => manejarToggleSubtopico(sub.id)} style={{ accentColor: '#ef4444' }} />
                                  <span>Omitir: {sub.label}</span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        <button type="button"
          onClick={generarConIA}
          disabled={generandoIA}
          style={{ width: '100%', padding: '12px', background: '#0284c7', color: 'white', border: 'none', borderRadius: '4px', cursor: generandoIA ? 'not-allowed' : 'pointer', fontWeight: 'bold', marginTop: '15px', fontSize: '16px', letterSpacing: '0.5px' }}>
          {generandoIA ? estadoGeneracion : 'Generar compilado semanal'}
        </button>
        {generandoIA && (
            <button type="button"
              onClick={() => abortarGeneracion.current = true}
              style={{
                width: '100%',
                padding: '12px',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '16px',
                transition: 'background 0.2s',
                textAlign: 'center',
                marginTop: '10px',
              }}
              onMouseOver={(e) => e.target.style.background = '#dc2626'}
              onMouseOut={(e) => e.target.style.background = '#ef4444'}
            >Cancelar
            </button>
          )}
      </div>

      <form onSubmit={manejarEnvio} className="eb-form">
        <input type="text" value={asunto} onChange={(e) => setAsunto(e.target.value)} placeholder="Asunto del boletín..." className="eb-input-asunto" />
        <div className="eb-destinatarios-bar">
          <button type="button" onClick={() => setVerDestinatariosModal(true)} className="eb-btn-destinatarios">Destinatarios actuales ({destinatarios.length})</button>
        </div>
        <div className="eb-tabs-container">
          <div className="eb-tabs-header">
            <button type="button" onClick={() => setTabActivo('resumen')} className={`eb-tab-button ${tabActivo === 'resumen' ? 'eb-tab-button--active' : ''}`}>Resumen para el Email</button>
            <button type="button" onClick={() => setTabActivo('completo')} disabled={!boletinCompleto} className={`eb-tab-button ${tabActivo === 'completo' ? 'eb-tab-button--active' : ''}`}>Detalle para el PDF</button>
          </div>
          <div className="eb-tab-content">
            <div className={`eb-tab-panel ${tabActivo === 'resumen' ? '' : 'eb-tab-panel--hidden'}`}>
              <ReactQuill theme="snow" value={cuerpoHtml} onChange={setCuerpoHtml} className="eb-quill-editor" />
            </div>
            <div className={`eb-tab-panel ${tabActivo === 'completo' ? '' : 'eb-tab-panel--hidden'}`}>
              <ReactQuill theme="snow" value={boletinCompleto} onChange={setBoletinCompleto} className="eb-quill-editor" />
            </div>
          </div>
        </div>

        <button type="submit" disabled={cargando} className="eb-btn-submit">
          {cargando ? `Enviando (${envioActual}/${destinatarios.length})...` : 'Enviar Boletines'}
        </button>
      </form>
    </div>
  );
};

export default EditorBoletin;