const cheerio = require('cheerio');

// Definimos sesiones FUERA del handler para intentar que persista entre llamadas
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

const normalizarTexto = (texto = '') => texto.replace(/\s+/g, ' ').trim();

const normalizarComparacion = (texto = '') => normalizarTexto(texto)
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9\s]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const recortarTexto = (texto = '', max = 5000) => normalizarTexto(texto).slice(0, max);

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

  return '';
};

const tomarFragmentos = (texto = '', cantidad = 4) => {
  const fragmentos = texto
    .split(/\n+/)
    .map((linea) => normalizarTexto(linea))
    .filter(Boolean)
    .filter((linea) => !/^bolet[ií]n oficial|^secci[oó]n|^edici[oó]n del|^fecha de publicaci[oó]n/i.test(linea));

  return fragmentos.slice(0, cantidad);
};

const limpiarTituloPresentacion = (titulo = '') => titulo
  .replace(/\bResoluciones?\s+Sintetizadas?\b/i, 'Resolución')
  .replace(/\bResoluciones?\s+Generales?\b/i, 'Resolución General')
  .replace(/\bResoluciones?\s+Conjuntas?\b/i, 'Resolución Conjunta')
  .replace(/\bDisposiciones?\b/i, 'Disposición')
  .replace(/\bAprobación\.?$/i, '');

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

const construirResumenCompacto = (items = []) => items.map((item, index) => {
  const fragmentos = tomarFragmentos(item.texto, 3);
  const textoBreve = fragmentos.join(' ');
  return `${index + 1}. ${item.organismo || 'Organismo no identificado'} | ${item.titulo || 'Título no identificado'}${item.fechaPublicacion ? ` | ${item.fechaPublicacion}` : ''} | ${recortarTexto(textoBreve, 650)}`;
}).join('\n');

const extraerTextoDesdeHtml = (html = '') => {
  const $ = cheerio.load(html);
  $('script, style, noscript').remove();
  return normalizarTexto($.text());
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

const limpiarHtmlParaPdf = (contenido = '') => {
  const texto = String(contenido || '').trim();
  if (!texto) return '<p>Sin contenido para mostrar.</p>';

  if (/<[a-z][\s\S]*>/i.test(texto)) {
    const $ = cheerio.load(texto, { decodeEntities: false });
    $('script, style, noscript').remove();
    $('h1').each((_, el) => {
      const textoTitulo = $(el).text().trim();
      if (textoTitulo.toLowerCase() === 'boletin semanal') {
        $(el).remove();
      }
    });
    const htmlLimpio = $.html();
    return htmlLimpio && htmlLimpio.trim() ? htmlLimpio : '<p>Sin contenido para mostrar.</p>';
  }

  const lineas = texto
    .replace(/\r\n/g, '\n')
    .replace(/\n\n+/g, '\n')
    .split('\n')
    .map((linea) => linea.trim())
    .filter(Boolean);

  if (lineas.length === 0) return '<p>Sin contenido para mostrar.</p>';

  const partes = [];
  let listaAbierta = false;
  const cerrarLista = () => {
    if (listaAbierta) {
      partes.push('</ul>');
      listaAbierta = false;
    }
  };

  lineas.forEach((linea) => {
    const limpia = escapeHtml(linea);
    if (/^#{1,3}\s+/.test(linea)) {
      cerrarLista();
      const nivel = Math.min((linea.match(/^#{1,3}/) || ['###'])[0].length + 1, 4);
      partes.push(`<h${nivel} style="margin: 18px 0 8px 0; font-size: ${nivel === 2 ? '20px' : nivel === 3 ? '17px' : '15px'}; color: #0f172a; line-height: 1.25;">${limpia.replace(/^#{1,3}\s+/, '')}</h${nivel}>`);
      return;
    }

    if (/^[-*•]\s+/.test(linea)) {
      if (!listaAbierta) {
        partes.push('<ul style="margin: 10px 0 14px 0; padding-left: 20px;">');
        listaAbierta = true;
      }
      partes.push(`<li style="margin: 0 0 8px 0; line-height: 1.55; color: #334155;">${limpia.replace(/^[-*•]\s+/, '')}</li>`);
      return;
    }

    cerrarLista();
    partes.push(`<p style="margin: 0 0 12px 0; line-height: 1.65; color: #334155;">${limpia}</p>`);
  });

  cerrarLista();
  return partes.join('');
};

const construirHtmlFactualFallback = (items = [], titulo, subtitulo, opciones = {}) => {
  const maxItems = opciones.maxItems ?? items.length;
  const maxFragmentos = opciones.maxFragmentos ?? 3;
  const agrupados = items.reduce((acc, item) => {
    const clave = item.organismo || 'Sin organismo';
    if (!acc[clave]) acc[clave] = [];
    acc[clave].push(item);
    return acc;
  }, {});

  const secciones = Object.entries(agrupados).sort(([a], [b]) => a.localeCompare(b)).map(([organismo, lista]) => {
    const bloques = lista.slice(0, maxItems).map((item) => {
      const fragmentos = tomarFragmentos(item.texto, maxFragmentos)
        .map((parrafo) => `<li style="margin-bottom: 6px; line-height: 1.45;">${parrafo}</li>`)
        .join('');

      return `
        <article style="margin-bottom: 14px; padding: 10px 12px; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h4 style="margin: 0 0 6px 0; font-size: 14px; color: #0f172a;">${limpiarTituloPresentacion(item.titulo) || 'Título no identificado'}</h4>
          ${item.fechaPublicacion ? `<p style="margin: 0 0 8px 0; font-size: 12px; color: #64748b;">Fecha: ${item.fechaPublicacion}</p>` : ''}
          <ul style="margin: 0; padding-left: 18px; color: #1f2937;">${fragmentos || '<li>Sin texto adicional extraído.</li>'}</ul>
        </article>`;
    }).join('');

    return `
      <section style="margin-bottom: 18px;">
        <h3 style="margin: 0 0 10px 0; padding-bottom: 6px; border-bottom: 1px solid #cbd5e1; color: #1e3a8a; font-size: 16px;">${organismo}</h3>
        ${bloques}
      </section>`;
  }).join('');

  return {
    resumenEmail: construirHtmlListado(items.slice(0, 4), titulo, subtitulo, {
      maxItems: 4,
      maxParrafos: 1,
      estiloTexto: 'line-height: 1.45; color: #1f2937;',
    }),
    boletinCompleto: `
      <div style="font-family: Arial, Helvetica, sans-serif; color: #111827; font-size: 12px; line-height: 1.45;">
        <h2 style="margin: 0 0 8px 0; font-size: 18px; color: #111827;">${titulo}</h2>
        <p style="margin: 0 0 16px 0; font-size: 13px; color: #4b5563;">${subtitulo}</p>
        ${secciones || '<p>No hay contenido para mostrar.</p>'}
      </div>`,
  };
};

const invocarGroqConReintentos = async (payload) => {
  const maxIntentos = 3;
  for (let intento = 1; intento <= maxIntentos; intento++) {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (response.ok && data.choices?.[0]?.message?.content) {
      return JSON.parse(data.choices[0].message.content);
    }

    const errorMsg = data.error?.message || `Groq respondió ${response.status}`;
    console.warn(`Intento ${intento}/${maxIntentos} falló:`, errorMsg);
    if (intento < maxIntentos) await new Promise((resolve) => setTimeout(resolve, 500 * intento));
  }

  throw new Error('No se pudo obtener respuesta válida de Groq tras varios intentos');
};

const invocarGroqResumenEmail = async (textoBase, titulo, subtitulo) => {
  const payload = {
    model: 'openai/gpt-oss-120b',
    temperature: 0.2,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: [
          'Sos editor legal senior.',
          'No inventes datos ni agregues contexto externo.',
          'Generá una sola salida HTML llamada resumenEmail.',
          'Debe resumir el contenido del PDF final en no más de 3 párrafos, con tono claro y profesional, y un cierre muy breve que invite a leer el PDF.',
          'Mantenelo breve: idealmente menos de 140 palabras.',
          'Usá solo la información factual provista en el texto del PDF.',
          'Devolvé exactamente JSON con esta clave: {"resumenEmail":"html"}'
        ].join(' '),
      },
      {
        role: 'user',
        content: `Título: ${titulo}\nSubtítulo: ${subtitulo}\n\nContenido del PDF:\n${textoBase}`,
      },
    ],
  };

  return invocarGroqConReintentos(payload);
};

const invocarGroqBoletinCompleto = async (itemsCompactos, titulo, subtitulo) => {
  const payload = {
    model: 'openai/gpt-oss-120b',
    temperature: 0.2,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: [
          'Sos editor legal senior.',
          'No inventes datos ni agregues contexto externo.',
          'Generá una sola salida HTML llamada boletinCompleto.',
          'Debe ser más desarrollado, con 2 a 4 bullets o párrafos por aviso, pensado para PDF de máximo 5 páginas A4 con fuente 12 y márgenes normales.',
          'Usá solo la información factual provista.',
          'Devolvé exactamente JSON con esta clave: {"boletinCompleto":"html"}'
        ].join(' '),
      },
      {
        role: 'user',
        content: `Título: ${titulo}\nSubtítulo: ${subtitulo}\n\nItems factuales:\n${itemsCompactos}`,
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

const extraerDatosDetalle = (html) => {
  const $ = cheerio.load(html);
  const encabezado = normalizarTexto($('h1').first().text());
  const subtitulo = normalizarTexto($('h2').first().text());
  const contenidoCompleto = normalizarTexto($('main').text() || $('article').text() || $('body').text());
  const contenidoInicial = recortarTexto(contenidoCompleto, 1800);

  return {
    organismo: encabezado,
    titulo: subtitulo,
    texto: recortarTexto(contenidoCompleto, 7000),
    textoInicial: contenidoInicial,
  };
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  try {
    const body = JSON.parse(event.body);
    const { action, sessionId } = body;

    // --- ACCIÓN: EXTRAER LINKS ---
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

    // --- LÓGICA DE SESIONES (Requiere sessionId) ---
    if (!sessionId) {
      return { statusCode: 400, body: JSON.stringify({ error: "Falta sessionId" }) };
    }

    switch (action) {
      case 'iniciar':
        sesiones[sessionId] = {
          links: body.links,
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
        const state = sesiones[sessionId];
        if (!state) return { statusCode: 400, body: JSON.stringify({ error: "Sesión no encontrada (el servidor se reinició)" }) };
        while (state.index < state.links.length) {
          const targetUrl = state.links[state.index];
          const htmlDetalle = await obtenerHtml(targetUrl);
          const { organismo, titulo, texto, textoInicial } = extraerDatosDetalle(htmlDetalle);
          const fechaPublicacion = extraerFechaPublicacion(texto, targetUrl);

          const organismoCoincide = buscarCoincidencia(organismo, state.organismosExcluidos);
          const organismoPermitido = state.modoOrganismo === 'incluir'
            ? organismoCoincide
            : !organismoCoincide;
          const textoSubtopico = `${titulo} ${textoInicial}`;
          const subtopicoOmitido = buscarCoincidencia(textoSubtopico, state.subtopicosExcluidos);

          state.index += 1;

          if (!organismoPermitido || subtopicoOmitido) {
            state.omitidos.push({ url: targetUrl, organismo, titulo, fechaPublicacion });
            continue;
          }
          state.textos.push({
            titulo,
            organismo,
            texto,
            fechaPublicacion,
            url: targetUrl,
          });

          return { statusCode: 200, body: JSON.stringify({ progress: state.index, total: state.links.length, omitidos: state.omitidos.length }) };
        }

        return { statusCode: 200, body: JSON.stringify({ progress: state.index, total: state.links.length, omitidos: state.omitidos.length }) };

      case 'resumir':
        const finalState = sesiones[sessionId];
        if (!finalState) return { statusCode: 400, body: JSON.stringify({ error: "Sesión expirada" }) };
        const rango = finalState.textos.length
          ? `${finalState.textos[0].fechaPublicacion || ''} - ${finalState.textos[finalState.textos.length - 1].fechaPublicacion || ''}`.replace(/^[\s-]+|[\s-]+$/g, '')
          : '';

        const tituloBase = 'BOLETIN SEMANAL';
        const subtituloBase = rango ? `Período: ${rango}` : 'Compilado generado desde el Boletín Oficial de la República Argentina';
        const resultadoPdf = construirHtmlFactualFallback(finalState.textos, tituloBase, subtituloBase, {
          maxItems: 3,
          maxFragmentos: 2,
        }).boletinCompleto;

        const textoPdfFinal = extraerTextoDesdeHtml(resultadoPdf);

        let resultadoEmail;
        try {
          resultadoEmail = await invocarGroqResumenEmail(textoPdfFinal, tituloBase, subtituloBase);
        } catch (errorIA) {
          console.error('IA caída en resumenEmail, uso fallback factual:', errorIA);
          resultadoEmail = construirHtmlListado(finalState.textos.slice(0, 3), tituloBase, subtituloBase, {
            maxItems: 3,
            maxParrafos: 1,
            estiloTexto: 'line-height: 1.45; color: #1f2937;',
          });
        }

        if (resultadoEmail?.resumenEmail) {
          resultadoEmail.resumenEmail = acotarHtmlResumenEmail(resultadoEmail.resumenEmail);
        }

        const resultadoFinal = {
          resumenEmail: resultadoEmail?.resumenEmail || resultadoEmail,
          boletinCompleto: resultadoPdf,
        };

        if (resultadoFinal?.resumenEmail) {
          resultadoFinal.resumenEmail = resultadoFinal.resumenEmail.replace(
            '<div style="font-family: Arial, Helvetica, sans-serif; color: #111827;">',
            '<div style="font-family: Arial, Helvetica, sans-serif; color: #111827; font-size: 13px; line-height: 1.6;">'
          );
          resultadoFinal.resumenEmail = resultadoFinal.resumenEmail.replace(
            '<p style="margin: 0 0 18px 0; font-size: 13px; color: #4b5563;">',
            '<p style="margin: 0 0 16px 0; font-size: 13px; color: #4b5563;">'
          );
        }

        delete sesiones[sessionId]; // Limpiamos memoria
        return { statusCode: 200, body: JSON.stringify(resultadoFinal) };

      default:
        return { statusCode: 400, body: JSON.stringify({ error: "Acción desconocida" }) };
    }
  } catch (error) {
    console.error("Error crítico:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};