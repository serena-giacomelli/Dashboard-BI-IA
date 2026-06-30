const { ScrapingBeeClient } = require('scrapingbee');
const cheerio = require('cheerio');

// Definimos sesiones FUERA del handler para intentar que persista entre llamadas
const sesiones = {}; 

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  try {
    const body = JSON.parse(event.body);
    const { action, sessionId } = body;

    // --- ACCIÓN: EXTRAER LINKS ---
    if (action === 'extraer_links') {
      const { urlBoletin } = body;
      const client = new ScrapingBeeClient(process.env.SCRAPINGBEE_API_KEY);

      const response = await client.get({
        url: urlBoletin,
        params: { render_js: true, wait: 2000 },
      });

      const $ = cheerio.load(response.data);
      const links = [];
      $('a[href*="/detalleAviso/primera/"]').each((i, el) => {
        const href = $(el).attr('href');
        if (href) {
          const fullUrl = href.startsWith('http') ? href : `https://www.boletinoficial.gob.ar${href}`;
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
        sesiones[sessionId] = { links: body.links, index: 0, textos: [], fallidos: [] };
        return { statusCode: 200, body: JSON.stringify({ status: 'ok' }) };

      case 'procesar_siguiente':
        const state = sesiones[sessionId];
        if (!state) return { statusCode: 400, body: JSON.stringify({ error: "Sesión no encontrada (el servidor se reinició)" }) };
        if (state.index >= state.links.length) return { statusCode: 400, body: JSON.stringify({ error: "Fin de lista" }) };

        const targetUrl = state.links[state.index];
        const res = await fetch(`https://r.jina.ai/${targetUrl}`);
        const textoNorma = (await res.text()).slice(0, 4000); 

        const resIA = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            temperature: 0.1,
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: 'Sos analista legal. Extraé Título, Organismo y una síntesis. JSON: {"titulo": "...", "organismo": "...", "sintesis": "..."}' },
              { role: "user", content: textoNorma }
            ]
          })
        });

        const dataIA = await resIA.json();
        // Agregamos manejo de errores de la API de Groq
        if (!dataIA.choices) throw new Error("Error en respuesta de IA: " + JSON.stringify(dataIA));
        
        state.textos.push(JSON.parse(dataIA.choices[0].message.content));
        state.index += 1;
        
        return { statusCode: 200, body: JSON.stringify({ progress: state.index, total: state.links.length }) };

      case 'resumir':
        const finalState = sesiones[sessionId];
        if (!finalState) return { statusCode: 400, body: JSON.stringify({ error: "Sesión expirada" }) };
        
        const listado = finalState.textos.map(item => `Organismo: ${item.organismo} | Título: ${item.titulo} | ${item.sintesis}`).join("\n\n");

        const resFinal = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            temperature: 0.2,
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: 'Sos editor legal senior. Agrupá por organismo. Formato JSON: {"resumenEmail": "html", "boletinCompleto": "html"}' },
              { role: "user", content: `Consolidado:\n${listado}` }
            ]
          })
        });

        const resultado = JSON.parse((await resFinal.json()).choices[0].message.content);
        delete sesiones[sessionId]; // Limpiamos memoria
        return { statusCode: 200, body: JSON.stringify(resultado) };

      default:
        return { statusCode: 400, body: JSON.stringify({ error: "Acción desconocida" }) };
    }
  } catch (error) {
    console.error("Error crítico:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};