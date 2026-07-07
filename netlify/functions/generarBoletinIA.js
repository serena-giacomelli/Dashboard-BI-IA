const cheerio = require('cheerio');
const sesiones = {}; 
const BOLETIN_BASE_URL = 'https://www.boletinoficial.gob.ar';
const DEFAULT_HEADERS = {
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'accept-language': 'es-AR,es;q=0.9,en;q=0.8',
};

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

const normalizarTexto = (texto = '') => {return texto.replace(/[ \t]+/g, ' ').replace(/\n\s*\n/g, '\n').trim();};
const normalizarComparacion = (texto = '') => normalizarTexto(texto).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
const recortarTexto = (texto = '', max = 5000) => normalizarTexto(texto).slice(0, max);

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
        <h3 style="margin: 0 0 10px 0; font-size: 15px; color: #111827; border-bottom: 2px solid #e5e7eb; padding-bottom: 4px; font-weight: 700; text-transform: uppercase;">${organismo}</h3>
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

const invocarGroqConReintentos = async (payload) => {
  const maxIntentos = 4;
  let baseDelay = 2000; // 2 segundos iniciales

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
            return JSON.parse(data.choices[0].message.content);
          } catch (jsonError) {
            console.warn(`Intento ${intento}: Error parseando JSON de la IA. Formato inválido.`);
            if (intento === maxIntentos) throw new Error("JSON malformado persistente");
          }
        }
      } else if (response.status === 429) {
        // Rate limit detectado. Buscar cabecera Retry-After o aplicar exponencial.
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : baseDelay * Math.pow(2, intento - 1);
        console.warn(`[Rate Limit] Intento ${intento}/${maxIntentos} falló. Esperando ${waitTime}ms...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime + 500)); // Buffer de 500ms
        continue;
      } else {
        console.warn(`Groq respondió con HTTP ${response.status}`);
      }
    } catch (networkError) {
      console.warn(`Error de red en intento ${intento}: ${networkError.message}`);
    }
    
    // Si no es 429, aplicamos espera exponencial general antes de reintentar
    if (intento < maxIntentos) {
      await new Promise((resolve) => setTimeout(resolve, baseDelay * intento));
    }
  }
  
  throw new Error('Fallback crítico: No se pudo obtener respuesta válida de Groq.');
};

const invocarGroqResumenEmail = async (textoBase, titulo, subtitulo) => {
  const payload = {
    model: 'openai/gpt-oss-120b',
    temperature: 0.3,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system',
        content: [
          'Sos un editor senior de una consultora legal.',
          'Tu objetivo es redactar un párrafo introductorio (3-4 líneas) que resuma los 2 temas más críticos del Boletín Oficial, redactado de forma profesional y persuasiva.',
          'Finalizá con una invitación clara: "Le sugerimos revisar el PDF adjunto para el detalle completo de las normativas".',
          'El resumen debe ser breve, directo y generar interés profesional.',
          'Devolvé JSON: {"resumenEmail":"html"}'
        ].join(' ')
      },
      { role: 'user', content: `Analizá estos temas y redactá la invitación:\n${textoBase.slice(0, 2000)}` }
    ],  
  };
  return invocarGroqConReintentos(payload);
};

const invocarGroqBoletinCompleto = async (itemsCompactos, titulo, subtitulo) => {
  const payload = {
    model: 'openai/gpt-oss-120b',
    temperature: 0.1, 
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system',
        content: [
          'Sos un editor legal senior. Tu tarea es resumir normas del Boletín Oficial.',
          'REGLA DE ORO: Si encuentras palabras como "RESUELVE", "DECRETA" o "DISPONE", ignora el resto del texto y céntrate en la parte operativa.',
          'Copia ESTRICTAMENTE este formato:',
          '1. Agrupá por Organismo usando: <h3 class="organismo-titulo" style="...">NOMBRE DEL ORGANISMO</h3>',
          '2. Estructura:',
          '   <div style="...">',
          '     <p style="text-transform: uppercase;">{{NORMA_EXACTA}}</p>',
          '     <p><b>Asunto:</b> Breve título.</p>',
          '     <p><b>Resumen:</b> Máximo 3 oraciones explicando el impacto, montos o alícuotas. NO digas "no se proporcionan detalles". Si el texto es técnico, resúmelo en lenguaje corporativo claro.</p>',
          '     <p><a href="{{ENLACE}}">{{ENLACE}}</a></p>',
          '   </div>',
          '3. Devolvé JSON: {"boletinCompleto":"html"}'
        ].join('\n'),      
      },
      { role: 'user',
        content: `Items factuales a sintetizar y agrupar:\n${itemsCompactos}`,  
      }, 
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
  
const extraerDatosDetalle = (html, url = '') => {
  const $ = cheerio.load(html);
  $('style, script, noscript, svg, link, meta, head').remove();
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

// ==========================================
// --- HANDLER PRINCIPAL ---
// ==========================================

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  try {
    const body = JSON.parse(event.body);
    const { action, sessionId } = body;

    if (action === 'extraer_links') {
      const { urlBoletin } = body;
      const html = await obtenerHtml(urlBoletin);
      const $ = cheerio.load(html);
      const links = [];
      $('a[href*="/detalleAviso/primera/"]').each((i, el) => {
        const href = $(el).attr('href');
        if (href) {
          const fullUrl = new URL(href, BOLETIN_BASE_URL).toString();
          links.push(fullUrl);        
        }      
      });
      return { statusCode: 200, body: JSON.stringify({ links: [...new Set(links)] }) };    
    }
    
    if (!sessionId) {
      return { statusCode: 400, body: JSON.stringify({ error: "Falta sessionId" }) };    
    }
    
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
        };
        return { statusCode: 200, body: JSON.stringify({ status: 'ok' }) };
        
      case 'procesar_siguiente':
        const stateProc = sesiones[sessionId];
        if (!stateProc) return { statusCode: 400, body: JSON.stringify({ error: "Sesión no encontrada (el servidor se reinició)" }) };
        
        if (!stateProc.links || stateProc.links.length === 0) {
          return { statusCode: 200, body: JSON.stringify({ progress: 1, total: 1, omitidos: 0 }) };
        }

        while (stateProc.index < stateProc.links.length) {
          const targetUrl = stateProc.links[stateProc.index];
          const htmlDetalle = await obtenerHtml(targetUrl);
          const { organismo, titulo, texto, textoInicial, fechaPublicacion } = extraerDatosDetalle(htmlDetalle, targetUrl);
          const organismoCoincide = buscarCoincidencia(organismo, stateProc.organismosExcluidos);
          const organismoPermitido = stateProc.modoOrganismo === 'incluir' ? organismoCoincide : !organismoCoincide;
          const textoSubtopico = `${titulo} ${textoInicial}`;
          const subtopicoOmitido = buscarCoincidencia(textoSubtopico, stateProc.subtopicosExcluidos);
          stateProc.index += 1;
          if (!organismoPermitido || subtopicoOmitido) {
            stateProc.omitidos.push({ url: targetUrl, organismo, titulo, fechaPublicacion });
            continue;
          }
          stateProc.textos.push({ titulo, organismo, texto, fechaPublicacion, url: targetUrl });
          return { statusCode: 200, body: JSON.stringify({ progress: stateProc.index, total: stateProc.links.length, omitidos: stateProc.omitidos.length }) };
        }
        return { statusCode: 200, body: JSON.stringify({ progress: stateProc.index, total: stateProc.links.length, omitidos: stateProc.omitidos.length }) };
        
      case 'resumir':
          const stateResum = sesiones[sessionId]; // Usamos 'state' para que coincida con todo el resto
          if (!stateResum) return { statusCode: 400, body: JSON.stringify({ error: "Sesión expirada" }) };

          stateResum.textos = stateResum.textos.filter(item => {
            const organismoCoincide = buscarCoincidencia(item.organismo, stateResum.organismosExcluidos);
            return stateResum.modoOrganismo === 'incluir' ? organismoCoincide : !organismoCoincide;
          });

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

          const rango = stateResum.textos.length
            ? `${stateResum.textos[0].fechaPublicacion || ''} - ${stateResum.textos[stateResum.textos.length - 1].fechaPublicacion || ''}`.replace(/^[\s-]+|[\s-]+$/g, '')
            : '';
          const tituloBase = 'BOLETIN SEMANAL';
          const subtituloBase = rango ? `Período: ${rango}` : 'Compilado generado desde fuentes oficiales';

          const fallbackEstructural = construirHtmlFactualFallback(stateResum.textos, tituloBase, subtituloBase);
          const textosParaIA = stateResum.textos.slice(0, 15);

          const itemsCompactosParaGroq = textosParaIA.map((item) => {
            const textoLimpio = item.texto.replace(/\n+/g, '\n').trim();
            const regexAccion = /\b(RESUELVE|DECRETA|DISPONE|SANCIONA|ACUERDA|ARTICULO 1|ARTICULO PRIMERO)\b/i;
            const indexAccion = textoLimpio.search(regexAccion);
            const inicio = indexAccion !== -1 ? indexAccion : 0;
            const textoUtil = textoLimpio.substring(inicio, inicio + 1200);

            return `Organismo: ${item.organismo}\nNORMA: ${item.titulo}\nEnlace: ${item.url || ''}\nContenido: ${textoUtil}\n---`;
          }).join('\n');

          let cuerpoEmailHtml = '';
          let cuerpoPdfHtml = '';

          try {
            const resultadoEmail = await invocarGroqResumenEmail(itemsCompactosParaGroq, tituloBase, subtituloBase);
            cuerpoEmailHtml = resultadoEmail?.resumenEmail || resultadoEmail;
          } catch (errorIA) {
            console.warn('IA falló para el email, usando Plan B:', errorIA);
            cuerpoEmailHtml = fallbackEstructural.resumenEmail;
          }

          try {
            const resultadoPdf = await invocarGroqBoletinCompleto(itemsCompactosParaGroq, tituloBase, subtituloBase);
            cuerpoPdfHtml = resultadoPdf?.boletinCompleto || resultadoPdf;
          } catch (errorIA) {
            console.warn('IA falló para el PDF, usando Plan B:', errorIA);
            cuerpoPdfHtml = fallbackEstructural.boletinCompleto;
          }

          if (cuerpoEmailHtml) cuerpoEmailHtml = acotarHtmlResumenEmail(cuerpoEmailHtml);

          const resultadoFinal = {
            resumenEmail: cuerpoEmailHtml,
            boletinCompleto: cuerpoPdfHtml,
          };

          if (resultadoFinal.resumenEmail && typeof resultadoFinal.resumenEmail === 'string') {
            resultadoFinal.resumenEmail = resultadoFinal.resumenEmail.replace(
              '<div style="font-family: Arial, Helvetica, sans-serif; color: #111827;">',
              '<div style="font-family: Arial, Helvetica, sans-serif; color: #111827; font-size: 13px; line-height: 1.6;">'
            );
          }

          delete sesiones[sessionId];
          return { statusCode: 200, body: JSON.stringify(resultadoFinal) };

      default:
        return { statusCode: 400, body: JSON.stringify({ error: "Acción desconocida" }) };    
    }
  } catch (error) {
    console.error("Error crítico:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };  
  }
};