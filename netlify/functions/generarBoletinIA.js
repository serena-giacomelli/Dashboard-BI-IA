process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const cheerio = require('cheerio');
const sesiones = {}; 
const BOLETIN_BASE_URL = 'https://www.boletinoficial.gob.ar';
const DEFAULT_HEADERS = {
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'accept-language': 'es-AR,es;q=0.9,en;q=0.8',
};
const pdfParse = require('pdf-parse');
const PDFParser = require('pdf2json');


const ORGANISMO_ALIASES = {
  'Ministerio de Economía': ['Economía', 'Min. de Economía', 'Ministro de Economía', 'MEC'],
  'ARCA (Ex-AFIP) y Dirección de Aduanas': ['ARCA', 'AFIP', 'Aduana', 'Aduanas', 'Administración Federal de Ingresos Públicos'],
  'Ministerio de Capital Humano': ['Capital Humano', 'Min. de Capital Humano', 'MCH'],
  'Banco Central (BCRA) y CNV': ['BCRA', 'Banco Central', 'CNV', 'Comisión Nacional de Valores'],
  'Ministerio de Salud y ANMAT': ['Salud', 'ANMAT', 'Ministerio de Salud'],
  'Ministerios de Seguridad y Justicia': ['Seguridad', 'Justicia', 'Ministerio de Seguridad', 'Ministerio de Justicia'],
};

const SUBTOPICO_ALIASES = {
  'Designaciones, Estructura Interna y Renuncias': ['designacion', 'designaciones', 'renuncia', 'renuncias', 'estructura', 'organigrama', 'autoridades'],
  'Transferencias de Partidas y Subsidios Provinciales': ['transferencia', 'transferencias', 'subsidio', 'subsidios', 'partida', 'partidas', 'aporte', 'aportes'],
  'Licitaciones y Contratos Menores de Suministro': ['licitacion', 'licitaciones', 'contrato', 'contratos', 'suministro', 'compra', 'compras', 'adjudicacion'],
  'Cambios de Jefaturas y Funciones Internas': ['jefatura', 'jefaturas', 'funcion', 'funciones', 'autoridad', 'autoridades', 'designacion', 'designaciones'],
  'Prórrogas de Vencimientos Impositivos de Rutina': ['prorroga', 'prorrogas', 'vencimiento', 'vencimientos', 'impositivo', 'impositivos', 'tributario', 'tributarios'],
  'Contrataciones y Altas de Personal': ['contratacion', 'contrataciones', 'alta', 'altas', 'personal', 'ingreso', 'ingresos', 'nombramiento', 'nombramientos'],
  'Asignación de Fondos a Cooperativas y Planes Sociales': ['fondos', 'cooperativa', 'cooperativas', 'plan social', 'planes sociales', 'asignacion', 'asignaciones', 'subsidio', 'subsidios'],
  'Convenios e Internas Universitarias': ['convenio', 'convenios', 'universidad', 'universidades', 'academico', 'academica', 'educativo', 'educativa'],
  'Circulares de Comunicación Interna y Rutina': ['circular', 'circulares', 'comunicacion', 'comunicaciones', 'interna', 'internas', 'rutina'],
  'Sumarios Administrativos Menores a Entidades': ['sumario', 'sumarios', 'administrativo', 'administrativos', 'entidad', 'entidades', 'sancion', 'sanciones'],
  'Compras de Insumos y Equipamiento Hospitalario': ['insumo', 'insumos', 'equipamiento', 'hospitalario', 'hospitalaria', 'compra', 'compras', 'adquisicion'],
  'Inscripciones de Rutina en el Registro de Medicamentos': ['inscripcion', 'inscripciones', 'registro', 'medicamento', 'medicamentos', 'habilitacion', 'habilitaciones'],
  'Ascensos, Retiros y Movimientos de Fuerzas Federales': ['ascenso', 'ascensos', 'retiro', 'retiros', 'movimiento', 'movimientos', 'fuerza', 'fuerzas', 'federal', 'federales'],
  'Fe de Erratas y Avisos Oficiales de Juzgados': ['fe de erratas', 'errata', 'erratas', 'juzgado', 'juzgados', 'aviso oficial', 'avisos oficiales'],
};

const PALABRAS_CLAVES_PROVINCIALES = [
  'INGRESOS BRUTOS', 'GANADERÍA', 'INDUSTRIAS', 'INDUSTRIA FRIGORÍFICA',
  'IMPUESTOS', 'PLANES DE PAGO', 'CODIGO FISCAL', 'LEY IMPOSITIVA',
  'LEY TRIBUTARIA', 'ALICUOTAS'
];

const NOMBRES_MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const normalizarTexto = (texto = '') => {return texto.replace(/[ \t]+/g, ' ').replace(/\n\s*\n/g, '\n').trim();};
const normalizarComparacion = (texto = '') => normalizarTexto(texto).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
const recortarTexto = (texto = '', max = 5000) => normalizarTexto(texto).slice(0, max);
const escapeHtmlSeguro = (texto = '') => String(texto).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const chunkArray = (arr, size) => Array.from({ length: Math.ceil(arr.length / size) }, (v, i) => arr.slice(i * size, i * size + size));

const buscarCoincidencia = (texto = '', filtros = []) => {
  const base = normalizarComparacion(texto);
  return filtros.some((filtro) => {
    const buscado = normalizarComparacion(filtro);
    if (!buscado) return false;
    return base === buscado || base.includes(` ${buscado} `) || base.startsWith(`${buscado} `) || base.endsWith(` ${buscado}`);
  });
};

const expandirFiltrosConAlias = (filtros = [], mapaAlias = {}) => {
  const expandido = new Set();
  filtros.forEach((filtro) => {
    if (!filtro) return;
    expandido.add(filtro);
    const aliases = mapaAlias[filtro] || [];
    aliases.forEach((alias) => expandido.add(alias));  
  });
  return Array.from(expandido);
};

const extraerFechaPublicacion = (texto = '', url = '') => {
  const matchTexto = texto.match(/Fecha de publicación\s*(\d{2}\/\d{2}\/\d{4})/i);
  if (matchTexto) return matchTexto[1];
  const matchUrl = url.match(/(\d{8})$/);
  if (matchUrl) {
    const raw = matchUrl[1];
    return `${raw.slice(6, 8)}/${raw.slice(4, 6)}/${raw.slice(0, 4)}`;  
  }
  return new Date().toLocaleDateString('es-AR');
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
    fechas.push(fechaIteracion);
  }
  return fechas;
};


const tomarFragmentos = (texto = '', cantidad = 4) => {
  return texto.split('\n')
    .map(linea => linea.trim())
    .filter(linea => linea.length > 20)
    .filter((linea) => !/^(bolet[ií]n oficial|secci[oó]n|edici[oó]n del|b[uú]squeda:|buscar:|men[uú]|navegaci[oó]n)/i.test(linea))
    .slice(0, cantidad);
};

const limpiarTituloPresentacion = (titulo = '') => titulo
  .replace(/^b[uú]squeda:\s*/i, '')
  .replace(/\bResoluciones?\s+Sintetizadas?\b/i, 'Resolución')
  .replace(/\bResoluciones?\s+Generales?\b/i, 'Resolución General')
  .replace(/\bAprobación\.?$/i, '')
  .trim();

const esLinkValido = (href) => {
  if (!href) return false;
  const invalido = ['mailto:', 'tel:', '#', 'javascript:', 'javascript:void(0)'];
  return !invalido.some(prefijo => href.toLowerCase().startsWith(prefijo));
};

const resolverUrl = (href, base) => {
  try {
    return new URL(href, base).toString();
  } catch (e) {
    return null;
  }
};

const esUrlPdf = (url = '') => /\.pdf(\?|$)/i.test(url) || /verpdf\.php/i.test(url);

const construirHtmlListado = (items = [], titulo, subtitulo, opciones = {}) => {
  const maxItems = opciones.maxItems ?? items.length;
  const maxParrafos = opciones.maxParrafos ?? 5;
  const estiloTexto = opciones.estiloTexto || 'line-height: 1.55; color: #1f2937;';
  const bloques = items.slice(0, maxItems).map((item) => {
    const parrafos = tomarFragmentos(item.texto, maxParrafos)
      .map((parrafo) => `<p style="margin: 0 0 10px 0; ${estiloTexto}">${parrafo}</p>`)
      .join('');
    return `
      <section style="margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb;">
        <h3 style="margin: 0 0 6px 0; font-size: 15px; color: #1e3a8a;">${item.organismo || 'Organismo no identificado'}</h3>
        <h4 style="margin: 0 0 10px 0; font-size: 13px; color: #334155; font-weight: 700;">${limpiarTituloPresentacion(item.titulo) || 'Título no identificado'}</h4>
        ${item.fechaPublicacion ? `<p style="margin: 0 0 10px 0; font-size: 12px; color: #64748b;"><strong>Fecha:</strong> ${item.fechaPublicacion}</p>` : ''}
        ${parrafos || `<p style="margin: 0; line-height: 1.55; color: #1f2937;">Sin texto adicional extraído.</p>`}
      </section>`;
  }).join('');
  return `
    <div style="font-family: Arial, Helvetica, sans-serif; color: #111827;">
      <h2 style="margin: 0 0 8px 0; font-size: 18px; color: #111827;">${titulo}</h2>
      <p style="margin: 0 0 18px 0; font-size: 13px; color: #4b5563;">${subtitulo}</p>
      ${bloques || '<p>No se extrajeron items para este boletín.</p>'}
    </div>`;
};

const acotarHtmlResumenEmail = (html = '') => {
  const $ = cheerio.load(`<div id="root">${html}</div>`, { decodeEntities: false });
  const root = $('#root');
  const permitidos = [];
  let parrafos = 0;
  let listas = 0;
  const children = root.children().toArray();
  children.forEach((node) => {
    const $node = $(node);
    const tag = (node.tagName || '').toLowerCase();
    if (/^h[1-4]$/.test(tag)) {
      if (permitidos.length === 0 || permitidos.length < 3) {
        permitidos.push($.html(node));      
      }
      return;    
    }
    if (tag === 'p') {
      if (parrafos < 2) {
        permitidos.push($.html(node));
        parrafos += 1;      
      }
      return;    
    }
    if (tag === 'ul' || tag === 'ol') {
      if (listas < 1) {
        const listTag = tag;
        const items = $node.children('li').slice(0, 2).toArray().map((li) => $.html(li)).join('');
        permitidos.push(`<${listTag}>${items}</${listTag}>`);
        listas += 1;      
      }    
    }  
  });
  if (permitidos.length === 0) {
    return html;  
  }
  return permitidos.join('');
};

const construirHtmlFactualFallback = (items = [], titulo, subtitulo) => {
  const agrupados = items.reduce((acc, item) => {
    const clave = item.organismo || 'Otros Organismos';
    if (!acc[clave]) acc[clave] = [];
    acc[clave].push(item);
    return acc;  
  }, {});

  const secciones = Object.entries(agrupados).map(([organismo, lista]) => {
    const bloques = lista.map((item) => {
      let primerParrafo = "Sin descripción disponible.";
      try {
        if (typeof tomarFragmentos === 'function') {
           const fragmentos = tomarFragmentos(item.texto || "", 1);
           primerParrafo = fragmentos && fragmentos[0] ? fragmentos[0] : primerParrafo;
        }
      } catch (e) {
        console.error("Error en tomarFragmentos:", e);
      }
      return `
        <li style="margin-bottom: 10px; line-height: 1.5; color: #334155;">
          <strong style="color: #1e3a8a;">${limpiarTituloPresentacion(item.titulo)}:</strong> ${primerParrafo}
        </li>`;    
    }).join('');
    
    return `
      <div style="margin-bottom: 25px; page-break-inside: avoid;">
        <h3 class="organismo-titulo" style="margin: 0 0 10px 0; font-size: 15px; color: #111827; border-bottom: 2px solid #e5e7eb; padding-bottom: 4px; font-weight: 700; text-transform: uppercase;">${organismo}</h3>
        <ul style="margin: 0; padding-left: 20px; list-style-type: square;">${bloques}</ul>
      </div>`;  
  }).join('');

return {
    resumenEmail: construirHtmlListado(items.slice(0, 4), titulo, subtitulo, {
      maxItems: 4,
      maxParrafos: 1,
      estiloTexto: 'line-height: 1.45; color: #1f2937;',    
    }),
    boletinCompleto: `
      <div style="font-family: Arial, Helvetica, sans-serif; color: #111827;">
        ${secciones.trim() !== '' ? secciones : '<p style="color: #64748b;">No hay contenido disponible para este período.</p>'}
      </div>`,  
  };
};

// ⚡ MODIFICACIÓN CRÍTICA 1: Manejo robusto del JSON y reducción de delays
const invocarGroqConReintentos = async (payload) => {
  const maxIntentos = 3;
  let baseDelay = 500; // Reducido drásticamente para evitar Timeout de Netlify

  for (let intento = 1; intento <= maxIntentos; intento++) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.choices?.[0]?.message?.content) {
          try {
            let content = data.choices[0].message.content.trim();
            // EXTRACCIÓN ROBUSTA: Buscar solo el bloque JSON, ignorando texto inicial o markdown
            const match = content.match(/\{[\s\S]*\}/);
            if (match) content = match[0];
            return JSON.parse(content);
          } catch (jsonError) {
            console.warn(`Intento ${intento}: Error parseando JSON de la IA. Formato inválido.`);
            if (intento === maxIntentos) throw new Error("JSON malformado persistente");
          }
        }
      } else if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : baseDelay * Math.pow(2, intento - 1);
        await new Promise((resolve) => setTimeout(resolve, waitTime + 500));
        continue;
      }
    } catch (networkError) {
      console.warn(`Error de red en intento ${intento}: ${networkError.message}`);
    }
    if (intento < maxIntentos) {
      await new Promise((resolve) => setTimeout(resolve, baseDelay * intento));
    }
  }
  throw new Error('Fallback crítico: No se pudo obtener respuesta válida de Groq.');
};

// ⚡ MODIFICACIÓN CRÍTICA 2: Cambio de modelo a llama3-8b (Extremadamente más rápido, evita timeouts)
const invocarGroqLoteNormas = async (lote) => {
  // Ajustamos el tamaño del texto dinámicamente: las normativas provinciales requieren más contexto para ser analizadas.
  const compactos = lote.map((item, idx) => `ID: ${idx}\nNORMA: ${item.titulo}\nEnlace: ${item.url}\nContenido: ${item.texto.substring(0, item.esProvincial ? 2500 : 1200)}`).join('\n---\n');
  const payload = {
    model: 'openai/gpt-oss-20b', 
    temperature: 0.1,
    reasoning_effort: 'low',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system',
        content: [
          'Sos un editor legal senior corporativo.',
          'Tu tarea es resumir un lote de normas en un JSON estricto.',
          'REGLA: Céntrate en la parte operativa ("RESUELVE", "DECRETA", "DISPONE", "SANCIONA", o la temática principal si es normativo provincial).',
          'Estructura requerida: {"normas": [{"titulo": "...", "resumen": "...", "url": "..."}]}',
          'El resumen debe ser MUY ESPECÍFICO (montos, plazos, números de expediente/resolución concretos) y ocupar como MÁXIMO 3 renglones (aprox. 35-40 palabras). Nada de generalidades tipo "se establecen disposiciones".',
          'IMPORTANTE: Debes devolver exactamente el mismo número de normas que se te envían en el lote, no omitas ninguna.',
          'NO digas "no se proporcionan detalles". DEVOLVÉ SOLO EL JSON, sin texto extra ni markdown.'
        ].join('\n')
      },
      { role: 'user', content: `Analizá y devolvé el JSON para las siguientes normas:\n\n${compactos}` }
    ]
  };
  
  const respuesta = await invocarGroqConReintentos(payload);
  return respuesta.normas || [];
};

const invocarGroqResumenEmail = async (textoBase) => {
  const payload = {
    model: 'openai/gpt-oss-120b',
    temperature: 0.3,
    reasoning_effort: 'medium',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system',
        content: [
          'Sos un editor senior de una consultora legal.',
          'Tu objetivo es redactar UN SOLO PÁRRAFO introductorio (3-4 líneas) que resuma los temas más críticos de este Boletín Oficial, de forma profesional y persuasiva.',
          'Finalizá con esta invitación clara: "Le sugerimos revisar el PDF adjunto para el detalle completo de las normativas".',
          'El resumen debe ser breve y directo.',
          'DEVOLVÉ SOLO EL JSON: {"resumenEmail":"<p>tu párrafo html aquí</p>"}'
        ].join(' ')
      },
      { role: 'user', content: `Temas destacados a resumir:\n${textoBase.slice(0, 2500)}` }
    ],  
  };
  return invocarGroqConReintentos(payload);
};

const obtenerHtml = async (url) => {
  const response = await fetch(url, { headers: DEFAULT_HEADERS });
  if (!response.ok) {
    throw new Error(`No se pudo obtener ${url} (HTTP ${response.status})`);  
  }
  return response.text();
};

const obtenerPdfTexto = async (url) => {
  let bufferData;
  try {
    const response = await fetch(url, { headers: DEFAULT_HEADERS });
    if (!response.ok) throw new Error(`No se pudo obtener PDF ${url} (HTTP ${response.status})`);
    
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      console.warn(`[Descarga] El archivo no es un PDF (posible feriado o 404). URL: ${url}`);
      return "";
    }

    const arrayBuffer = await response.arrayBuffer();
    bufferData = Buffer.isBuffer(arrayBuffer) ? arrayBuffer : Buffer.from(arrayBuffer);
  } catch (downloadError) {
    console.warn(`[Descarga] Fallo al descargar el PDF: ${downloadError.message}`);
    return "";
  }

  // 2. INTENTO PRIMARIO: Extracción local con pdf2json (Garantiza lectura de todas las páginas)
  console.log(`[PDF2JSON] Intentando extracción local completa para: ${url}`);
  
  let textoExtraido = "";
  try {
    textoExtraido = await new Promise((resolve, reject) => {
      const pdfParser = new PDFParser(this, 1); // El "1" es clave: fuerza la extracción a texto plano
      
      pdfParser.on("pdfParser_dataError", errData => {
         console.warn(`[PDF2JSON] Error en parseo: ${errData.parserError}`);
         resolve("");
      });
      
      pdfParser.on("pdfParser_dataReady", pdfData => {
         const texto = pdfParser.getRawTextContent();
         resolve(texto || "");
      });
      
      pdfParser.parseBuffer(bufferData);
    });

    if (textoExtraido.trim().length > 100) {
      console.log(`[PDF2JSON] Extracción exitosa. Caracteres: ${textoExtraido.length}`);
      return textoExtraido; // Al salir por acá, evitamos consumir recursos del OCR
    } else {
      console.log(`[PDF2JSON] Texto muy corto. Posible PDF protegido o imagen. Pasando al OCR...`);
    }
  } catch (localError) {
    console.warn(`[PDF2JSON] Fallo crítico: ${localError.message}. Intentando OCR...`);
  }

  // 3. FALLBACK: OCR externo (Se mantiene por si en el futuro suben un PDF escaneado)
  try {
    console.log(`[OCR] Iniciando extracción externa (base64) como respaldo...`);
    const apiKey = process.env.OCR_SPACE_KEY || 'helloworld';
    const ocrUrl = `https://api.ocr.space/parse/image`;
    const base64Pdf = `data:application/pdf;base64,${bufferData.toString('base64')}`;

    const formData = new URLSearchParams();
    formData.append('apikey', apiKey);
    formData.append('base64Image', base64Pdf);
    formData.append('language', 'spa');
    formData.append('isOverlayRequired', 'false');
    formData.append('filetype', 'PDF');
    formData.append('isCreateSearchablePdf', 'false');

    const response = await fetch(ocrUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString()
    });

    if (response.ok) {
      const data = await response.json();
      if (data.ParsedResults && data.ParsedResults.length > 0) {
        const textoExtraidoOcr = data.ParsedResults.map(r => r.ParsedText || '').join("\n");
        if (textoExtraidoOcr.trim().length > 50) {
          if (data.IsErroredOnProcessing) {
            console.warn(`[OCR] Éxito parcial (${data.ErrorMessage || 'límite de páginas'}). Caracteres: ${textoExtraidoOcr.length}`);
          } else {
            console.log(`[OCR] Extracción exitosa. Caracteres: ${textoExtraidoOcr.length}`);
          }
          return textoExtraidoOcr;
        }
      }
    }
  } catch (ocrError) {
    console.warn(`[OCR] Fallo de red en servicio externo: ${ocrError.message}`);
  }

  return "";
};

const extraerFechaDeUrlProvincial = (url = '') => {
  let m = url.match(/BO(\d{2})(\d{2})(\d{4})\.pdf/i); // Santa Fe: BOddmmyyyy.pdf
  if (m) return `${m[1]}/${m[2]}/${m[3]}`;
  m = url.match(/(\d{2})-(\d{2})-(\d{2})\.pdf/); // Entre Ríos: dd-mm-yy.pdf
  if (m) return `${m[1]}/${m[2]}/20${m[3]}`;
  return new Date().toLocaleDateString('es-AR');
};

const extraerNormasDePdfProvincial = (textoPdf = '', urlOrigen = '', provinciaLabel = '') => {
  // 1. Limpiamos los saltos de línea rotos típicos de la extracción de PDFs
  const textoLimpio = textoPdf.replace(/\s+/g, ' '); 
  const items = [];
  const textoMayus = textoLimpio.toUpperCase();
  const coincidencias = [];

  // 2. Escaneamos TODO el PDF (sin recortar nada) buscando las palabras clave
  PALABRAS_CLAVES_PROVINCIALES.forEach(clave => {
    const claveMayus = clave.toUpperCase();
    let index = textoMayus.indexOf(claveMayus);
    while (index !== -1) {
      coincidencias.push({ clave: claveMayus, index });
      // Buscamos si la misma palabra aparece más adelante
      index = textoMayus.indexOf(claveMayus, index + claveMayus.length);
    }
  });

  // Si el PDF entero no tiene ninguna palabra clave, no devolvemos nada
  if (coincidencias.length === 0) return items;

  // 3. Agrupamos las coincidencias cercanas para no mandar texto duplicado a la IA
  coincidencias.sort((a, b) => a.index - b.index);
  const ventanas = [];
  coincidencias.forEach(c => {
     // Acercamos el índice de inicio para que la normativa real ingrese limpia dentro de los límites del chunk del LLM
     const inicio = Math.max(0, c.index - 300); 
     const fin = Math.min(textoLimpio.length, c.index + 3500); 
     
     if (ventanas.length > 0 && inicio < ventanas[ventanas.length - 1].fin) {
        // Si se superponen, unificamos la ventana
        ventanas[ventanas.length - 1].fin = Math.max(ventanas[ventanas.length - 1].fin, fin);
        if (!ventanas[ventanas.length - 1].clavePrincipal.includes(c.clave)) {
            ventanas[ventanas.length - 1].clavePrincipal += ` / ${c.clave}`;
        }
     } else {
        ventanas.push({ inicio, fin, clavePrincipal: c.clave });
     }
  });

  // 4. Construimos los fragmentos garantizados con información útil
  const fechaPublicacion = extraerFechaDeUrlProvincial(urlOrigen);
  ventanas.forEach((v, i) => {
     const fragmento = textoLimpio.substring(v.inicio, v.fin);
     items.push({
       organismo: `Boletín Oficial — ${provinciaLabel}`,
       titulo: `Normativa vinculada a: ${v.clavePrincipal} (${fechaPublicacion})`,
       texto: fragmento,
       textoInicial: fragmento.substring(0, 1800),
       fechaPublicacion,
       url: urlOrigen
     });
  });

  return items;
};
  
const extraerDatosDetalle = (html, url = '', jurisdiccion = 'nacional') => {
  const $ = cheerio.load(html);
  $('style, script, noscript, svg, link, meta, head').remove();

  const esProvincial = url.includes('santafe.gob.ar') || url.includes('entrerios.gov.ar');

  if (esProvincial) {
     let textoCompleto = normalizarTexto($('body').text()).replace(/[ \t]+/g, ' ');
     return {
       organismo: url.includes('santafe') ? 'Boletín Oficial - Provincia de Santa Fe' : 'Boletín Oficial - Provincia de Entre Ríos',
       titulo: 'Normativa Provincial',
       texto: recortarTexto(textoCompleto, 8000),
       textoInicial: recortarTexto(textoCompleto, 2000),
       fechaPublicacion: new Date().toLocaleDateString('es-AR')
     };
  }

  const encabezado = $('h1').first().text().trim() || 'Organismo no especificado';
  let textoCompleto = normalizarTexto($('body').text())
    .replace(/table\s*\{[\s\S]*?\}/gi, '')
    .replace(/table\s*tr\s*td\s*\{[\s\S]*?\}/gi, '')
    .replace(/[ \t]+/g, ' '); 

  const indiceInicio = textoCompleto.indexOf(encabezado);
  let cuerpo = indiceInicio !== -1 ? textoCompleto.slice(indiceInicio + encabezado.length) : textoCompleto;
  const marcadoresFin = ['fecha de publicación', 'compartir por email', 'biblioteca de normativas'];
  let indiceFin = cuerpo.length;
  const cuerpoMin = cuerpo.toLowerCase();
  marcadoresFin.forEach((marcador) => {
    const idx = cuerpoMin.indexOf(marcador);
    if (idx !== -1 && idx < indiceFin) indiceFin = idx;
  });
  cuerpo = cuerpo.slice(0, indiceFin).trim();

  const tituloPagina = ($('meta[property="og:title"]').attr('content') || $('title').text() || '').trim();
  let tituloNorma = '';
  if (tituloPagina) {
    let resto = tituloPagina.replace(/^BOLET[IÍ]N OFICIAL REPUBLICA ARGENTINA\s*-\s*/i, '').trim();
    if (resto.toLowerCase().startsWith(encabezado.toLowerCase())) {
      resto = resto.slice(encabezado.length).replace(/^[\s\-–]+/, '').trim();
    }
    if (/^(Resoluci[oó]n|Disposici[oó]n|Decreto|Comunicaci[oó]n|Circular|Decisi[oó]n\s+Administrativa|Instrucci[oó]n|Nota)\b/i.test(resto)) {
      tituloNorma = resto;
    }
  }

  if (!tituloNorma) {
    const matchIdentificador = cuerpo.match(
      /(Resoluci[oó]n(?:\s+General)?\s*N?[°ºo]?\.?\s*[\d/\-A-Z]+|Disposici[oó]n\s*N?[°ºo]?\.?\s*[\d/\-A-Z]+|Decreto\s*N?[°ºo]?\.?\s*[\d/\-A-Z]+|Comunicaci[oó]n\s*[“"]?[A-Z][”"]?\s*[\d/]+|RESOL-[\w-]+)/i
    );
    tituloNorma = matchIdentificador ? matchIdentificador[0].trim() : '';
  }

  const anclasCorteLegal = [
    "contra la medida dispuesta",
    "son oponibles los siguientes recursos",
    "queda usted debidamente notificado",
    "publíquese por el término",
    "regístrese, comuníquese",
    "vías de impugnación",
  ];
  let textoLimpio = cuerpo;
  const textoMinuscula = cuerpo.toLowerCase();
  for (const ancla of anclasCorteLegal) {
    const indiceAncla = textoMinuscula.indexOf(ancla);
    if (indiceAncla !== -1) {
      textoLimpio = cuerpo.slice(0, indiceAncla).trim();
      break;
    }
  }

  const fechaPublicacion = extraerFechaPublicacion(textoCompleto, url);
  const contenidoInicial = recortarTexto(textoLimpio, 1800);

  return {
    organismo: normalizarTexto(encabezado),
    titulo: limpiarTituloPresentacion(tituloNorma || 'Aviso Oficial'),
    texto: recortarTexto(textoLimpio, 7000),
    textoInicial: contenidoInicial,
    fechaPublicacion,
  };
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  try {
    const body = JSON.parse(event.body);
    const { action, sessionId } = body;

    if (action === 'extraer_links') {
      const { jurisdiccion, provinciasActivas, urlBoletin } = body;
      let links = [];

    if (jurisdiccion === 'provincial') {
        const fechasSemana = obtenerFechasSemana(); // Obtiene los días de Lunes a Hoy (Viernes max)
        const promesasScraping = [];

        fechasSemana.forEach(fechaObj => {
          const dd = String(fechaObj.getDate()).padStart(2, '0');
          const mm = String(fechaObj.getMonth() + 1).padStart(2, '0');
          const yyyy = fechaObj.getFullYear();

          // BÚSQUEDA SANTA FE
          // FIX: el patrón de URL es correcto (verificado contra el sitio real), pero el chequeo
          // previo por HEAD fallaba: verPdf.php es un script dinámico (no un archivo estático) y
          // muchos de estos endpoints PHP basados en readfile() no responden bien a HEAD aunque
          // el archivo exista y el GET funcione perfecto. Se agrega el link directo y se deja que
          // 'procesar_siguiente' descarte con gracia los días sin boletín publicado (ya lo hace).
          if (provinciasActivas?.santaFe) {
            const urlDirectaPdf = `https://www.santafe.gob.ar/boletinoficial/verPdf.php?archivo=recursos/boletines/pdf/${yyyy}/${mm}/BO${dd}${mm}${yyyy}.pdf`;
            if (!links.includes(urlDirectaPdf)) {
              links.push(urlDirectaPdf);
            }
          }

          // BÚSQUEDA ENTRE RÍOS
          if (provinciasActivas?.entreRios) {
            promesasScraping.push((async () => {
              const mesNombre = NOMBRES_MESES[fechaObj.getMonth()];
              const yy = String(yyyy).slice(-2);
              
              // Construimos el patrón exacto: YYYY/Mes/dd-mm-aa.pdf
              const urlDirectaPdfER = `https://www.entrerios.gov.ar/boletin/calendario/Boletin/${yyyy}/${mesNombre}/${dd}-${mm}-${yy}.pdf`;
              
              try {
                // Usamos GET para bypass de firewalls institucionales
                const res = await fetch(urlDirectaPdfER, { method: 'GET', headers: DEFAULT_HEADERS });
                
                if (res.ok && !links.includes(urlDirectaPdfER)) {
                   console.log(`[Entre Ríos] ¡Encontrado!: ${urlDirectaPdfER}`);
                   links.push(urlDirectaPdfER);
                } else {
                   console.log(`[Entre Ríos] No disponible (HTTP ${res.status}) para: ${dd}-${mm}-${yyyy}`);
                }
              } catch(e) { 
                console.error(`[Entre Ríos] Error de red en ${dd}-${mm}:`, e.message); 
              }
            })());
          }
        });

        // Ejecutamos la búsqueda de todos los días de la semana en paralelo
        await Promise.all(promesasScraping);
      } else {
        try {
          const html = await obtenerHtml(urlBoletin);
          const $ = cheerio.load(html);
          $('a[href*="/detalleAviso/primera/"]').each((i, el) => {
            const href = $(el).attr('href');
            if (esLinkValido(href)) {
              const fullUrl = resolverUrl(href, BOLETIN_BASE_URL);
              if (fullUrl && !links.includes(fullUrl)) links.push(fullUrl);
            }
          });
        } catch (e) { console.error('Error extrayendo BORA:', e.message); }
      }
      return { statusCode: 200, body: JSON.stringify({ links: [...new Set(links)] }) };
    }
    
    if (!sessionId) return { statusCode: 400, body: JSON.stringify({ error: "Falta sessionId" }) };
    
    switch (action) {
      case 'iniciar':
        sesiones[sessionId] = {
          links: body.links || [],
          index: 0,
          textos: [],
          fallidos: [],
          omitidos: [],
          organismosExcluidos: expandirFiltrosConAlias(body.organismosExcluidos || [], ORGANISMO_ALIASES),
          subtopicosExcluidos: expandirFiltrosConAlias(body.subtopicosExcluidos || [], SUBTOPICO_ALIASES),
          modoOrganismo: body.modoOrganismo || 'excluir',
         palabrasClaves: body.palabrasClaves || []
        };
        return { statusCode: 200, body: JSON.stringify({ status: 'ok' }) };
        
      case 'procesar_siguiente':
        const stateProc = sesiones[sessionId];
        if (!stateProc) return { statusCode: 400, body: JSON.stringify({ error: "Sesión no encontrada" }) };
        if (!stateProc.links || stateProc.links.length === 0) return { statusCode: 200, body: JSON.stringify({ progress: 1, total: 1 }) };

        while (stateProc.index < stateProc.links.length) {
          const targetUrl = stateProc.links[stateProc.index];
          const esProvincialUrl = targetUrl.includes('santafe.gob.ar') || targetUrl.includes('entrerios.gov.ar');
          
          // FIX C: Lógica bifurcada (Si es PDF provincial, lo parsea y desglosa en partes)
          if (esProvincialUrl && esUrlPdf(targetUrl)) {
                    const provinciaLabel = targetUrl.includes('santafe') ? 'Santa Fe' : 'Entre Ríos';
                    let textoPdf = '';
                    
                    try {
                      textoPdf = await obtenerPdfTexto(targetUrl);
                      console.log(`\n[${provinciaLabel}] PDF descargado. Caracteres extraídos: ${textoPdf ? textoPdf.length : 0}`);
                    } catch (e) {
                      console.error(`\n[${provinciaLabel}] Error al descargar/parsear:`, e.message);
                      stateProc.omitidos.push({ url: targetUrl });
                      stateProc.index += 1;
                      continue;
                    }

                    if (textoPdf && textoPdf.trim().length > 50) {
                      const normasEncontradas = extraerNormasDePdfProvincial(textoPdf, targetUrl, provinciaLabel);

                      if (normasEncontradas.length > 0) {
                        console.log(`[${provinciaLabel}] ${normasEncontradas.length} normativa(s) relevante(s) detectada(s) por palabras clave.`);
                        normasEncontradas.forEach(norma => {
                          stateProc.textos.push({ ...norma, esProvincial: true });
                        });
                      } else {
                        console.log(`[${provinciaLabel}] Texto extraído (${textoPdf.length} caracteres) pero sin coincidencias de palabras clave provinciales.`);
                        stateProc.omitidos.push({ url: targetUrl });
                      }
                    } else {
                      console.warn(`[${provinciaLabel}] Alerta: El proceso terminó pero el texto está vacío (¿PDF escaneado como imagen?)`);
                      stateProc.omitidos.push({ url: targetUrl });
                    }

                    stateProc.index += 1;
                    return { statusCode: 200, body: JSON.stringify({ progress: stateProc.index, total: stateProc.links.length }) };
                  }

          let htmlDetalle = '';
          try {
             htmlDetalle = await obtenerHtml(targetUrl);
          } catch (e) {
             console.warn(`Error HTML (${targetUrl}):`, e);
             stateProc.omitidos.push({ url: targetUrl });
             stateProc.index += 1;
             continue;
          }

          const { organismo, titulo, texto, textoInicial, fechaPublicacion } = extraerDatosDetalle(htmlDetalle, targetUrl);
          
          let debeOmitirse = false;
          const organismoCoincide = buscarCoincidencia(organismo, stateProc.organismosExcluidos);
          const organismoPermitido = stateProc.modoOrganismo === 'incluir' ? organismoCoincide : !organismoCoincide;
          const subtopicoOmitido = buscarCoincidencia(`${titulo} ${textoInicial}`, stateProc.subtopicosExcluidos);
          if (!organismoPermitido || subtopicoOmitido) debeOmitirse = true;

          stateProc.index += 1;
          
          if (debeOmitirse) {
            stateProc.omitidos.push({ url: targetUrl });
            continue;
          }
          
          // Aseguramos que la bandera `esProvincial` se guarde de forma correcta cuando se trata de una página HTML provincial
          stateProc.textos.push({ titulo, organismo, texto, fechaPublicacion, url: targetUrl, esProvincial: esProvincialUrl });
          return { statusCode: 200, body: JSON.stringify({ progress: stateProc.index, total: stateProc.links.length }) };
        }
        return { statusCode: 200, body: JSON.stringify({ progress: stateProc.index, total: stateProc.links.length }) };
        
      case 'resumir':
          const stateResum = sesiones[sessionId]; 
          if (!stateResum) return { statusCode: 400, body: JSON.stringify({ error: "Sesión expirada" }) };

          let textosLimpios = stateResum.textos.map(item => ({
            ...item,
            organismo: item.organismo.replace(/^Búsqueda:\s*/gi, '').trim(),
            titulo: item.titulo.replace(/^Búsqueda:\s*/gi, '').trim(),
            texto: item.texto.replace(/table\s*tr\s*td\s*\{[\s\S]*?\}/gi, '').replace(/[ \t]+/g, ' ').trim() 
          }));

          const titulosUnicos = new Set();
          stateResum.textos = textosLimpios.filter(item => {
            const tituloNorm = normalizarComparacion(item.titulo);
            if (titulosUnicos.has(tituloNorm)) return false;
            titulosUnicos.add(tituloNorm);
            return true;
          });

          const tieneProvinciales = stateResum.textos.some(t => t.esProvincial);
          const tieneNacionales = stateResum.textos.some(t => !t.esProvincial);
          
          let tituloBase = 'BOLETÍN SEMANAL';
          if (tieneProvinciales && tieneNacionales) tituloBase = 'BOLETÍN INTEGRAL';
          else if (tieneProvinciales) tituloBase = 'COMPILADO PROVINCIAL';

          const rango = stateResum.textos.length
            ? `${stateResum.textos[0].fechaPublicacion || ''} - ${stateResum.textos[stateResum.textos.length - 1].fechaPublicacion || ''}`.replace(/^[\s-]+|[\s-]+$/g, '')
            : '';
          const subtituloBase = rango ? `Período: ${rango}` : 'Compilado generado desde fuentes oficiales';

          const agrupados = stateResum.textos.reduce((acc, item) => {
            const org = item.organismo || 'Otros Organismos';
            if (!acc[org]) acc[org] = [];
            acc[org].push(item);
            return acc;
          }, {});

          let cuerpoPdfHtml = '';
          const fallbackEstructural = construirHtmlFactualFallback(stateResum.textos, tituloBase, subtituloBase);

          const procesarOrganismo = async (org) => {
              let htmlOrg = `<h3 class="organismo-titulo" style="margin-top: 30px; margin-bottom: 15px; border-bottom: 1px solid #000000; padding-bottom: 5px;">${org}</h3>`;
              const items = agrupados[org];
              const lotes = chunkArray(items, 4); 

              const promesasLotes = lotes.map(async (lote) => {
                  let bloqueHtml = '';
                  try {
                      const normasJson = await invocarGroqLoteNormas(lote);
                      normasJson.forEach((norma, idx) => {
                          // Cruce inteligente por si el JSON regresa elementos desfasados
                          const itemOriginal = lote.find(i => i.titulo === norma.titulo) || lote[idx] || {};
                          const urlOriginal = itemOriginal.url || norma.url || '#';
                          const tituloMostrar = norma.titulo || itemOriginal.titulo || 'Normativa';
                          
                          bloqueHtml += `
                            <div style="margin-bottom: 20px;">
                              <p style="text-transform: uppercase; margin: 0 0 5px 0;"><b>${escapeHtmlSeguro(tituloMostrar)}</b></p>
                              <p style="margin: 0 0 5px 0; color: #333333; line-height: 1.5;"><b>Resumen:</b> ${escapeHtmlSeguro(norma.resumen || 'Sin resumen detallado disponible.')}</p>
                              <p style="margin: 0;"><a href="${urlOriginal}" style="color: #2563eb; text-decoration: none;">${urlOriginal}</a></p>
                            </div>
                          `;
                      });
                  } catch (errorLote) {
                      console.error(`Error en lote de ${org}:`, errorLote);
                      lote.forEach(item => {
                          bloqueHtml += `<div style="margin-bottom: 20px;"><p style="text-transform: uppercase; margin: 0 0 5px 0;"><b>${item.titulo}</b></p><p style="margin: 0;"><a href="${item.url}" style="color: #2563eb; text-decoration: none;">Ver Norma</a></p></div>`;
                      });
                  }
                  return bloqueHtml;
              });

              const htmlLotesResueltos = await Promise.all(promesasLotes);
              htmlOrg += htmlLotesResueltos.join('');
              return htmlOrg;
          };

          const orgsProvinciales = Object.keys(agrupados).filter(o => /santa fe|entre r[ií]os|provincia/i.test(o));
          const orgsNacionales = Object.keys(agrupados).filter(o => !orgsProvinciales.includes(o));

          if (orgsNacionales.length > 0) {
              if (tieneProvinciales && tieneNacionales) cuerpoPdfHtml += `<h2 style="color: #0f172a; margin-top: 10px; border-bottom: 3px solid #334155; padding-bottom: 8px; font-size: 18px;">NORMATIVAS NACIONALES</h2>`;
              for (const org of orgsNacionales) cuerpoPdfHtml += await procesarOrganismo(org);
          }
          
          // FIX D: Encabezado para la sección provincial
          if (orgsProvinciales.length > 0) {
              cuerpoPdfHtml += `
                <h2 style="color: #0f172a; margin-top: 10px; border-bottom: 3px solid #334155; padding-bottom: 8px; font-size: 18px;">NORMATIVAS PROVINCIALES
                </h2>
              `;
              for (const org of orgsProvinciales) {
                cuerpoPdfHtml += await procesarOrganismo(org);
              }
          }

          if (cuerpoPdfHtml === '') cuerpoPdfHtml = fallbackEstructural.boletinCompleto;

          const topItems = stateResum.textos.slice(0, 4).map(i => `NORMA: ${i.titulo} - ${i.texto.substring(0, 300)}`).join('\n');
          let cuerpoEmailHtml = '';
          try {
             const resEmail = await invocarGroqResumenEmail(topItems);
             cuerpoEmailHtml = resEmail?.resumenEmail || '';
          } catch (e) { 
             console.error("Fallo IA Email, usando fallback");
             cuerpoEmailHtml = fallbackEstructural.resumenEmail; 
          }

          delete sesiones[sessionId];
          return { statusCode: 200, body: JSON.stringify({ resumenEmail: cuerpoEmailHtml, boletinCompleto: cuerpoPdfHtml }) };

      default:
        return { statusCode: 400, body: JSON.stringify({ error: "Acción desconocida" }) };    
    }
  } catch (error) {
    console.error("Error crítico:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };  
  }
};