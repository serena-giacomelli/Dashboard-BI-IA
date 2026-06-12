exports.handler = async (event) => {
  const apiKeyGroq = process.env.GROQ_API_KEY;
  const apiKeyTavily = process.env.TAVILY_API_KEY; 
  const { puntosClave } = JSON.parse(event.body);

  let contextoBusqueda = "";

  // 1. INTENTAR BUSCAR EN INTERNET (GRATIS CON TAVILY)
  if (apiKeyTavily) {
    try {
      const searchResponse = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: apiKeyTavily,
          query: puntosClave + " Argentina normativa boletin oficial",
          search_depth: "basic",
          max_results: 3
        })
      });

      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        contextoBusqueda = searchData.results.map((r) => {
          return "Fuente: " + r.url + "\nInformación encontrada: " + r.content;
        }).join("\n\n");
      }
    } catch (err) {
      console.error("⚠️ Falló la búsqueda en Tavily, se continuará solo con los apuntes:", err.message);
    }
  }

  // 2. CONECTAR CON GROQ SOLICITANDO FORMATO JSON ESTRUCTURADO
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + apiKeyGroq
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        response_format: { type: "json_object" }, // Forzamos modo JSON en Groq
        messages: [
          {
            role: "system",
            content: "Eres un analista senior y experto en comunicación corporativa de CIFAS, una consultora estratégica para industrias frigoríficas, alimentarias, logísticas y empresas agro-ganaderas en Argentina. Tu objetivo es transformar apuntes e información de internet en un objeto JSON con dos versiones de contenido: un resumen ejecutivo para el cuerpo de un email y el boletín completo desarrollado para un PDF.\n\n" +
                     "Debes responder UNICAMENTE con un objeto JSON estructurado exactamente con estas dos llaves:\n" +
                     "{\n" +
                     "  \"resumenEmail\": \"Texto HTML del resumen ejecutivo para el mail\",\n" +
                     "  \"boletinCompleto\": \"Texto HTML detallado para el PDF\"\n" +
                     "}\n\n" +
                     "REGLAS PARA EL RESUMEN DEL EMAIL (resumenEmail):\n" +
                     "- Redacta un saludo introductorio dinámico, fresco y original (prohibido usar siempre la misma frase).\n" +
                     "- Escribe un breve panorama de 1 o 2 párrafos en HTML conectando las novedades con la realidad industrial.\n" +
                     "- Menciona los títulos de forma muy macro y atractiva, invitando explícitamente al cliente a abrir el informe completo en el PDF adjunto para conocer detalles normativos e impactos operativos.\n\n" +
                     "REGLAS PARA EL BOLETÍN COMPLETO DEL PDF (boletinCompleto):\n" +
                     "- PROHIBIDO PARAFRASEAR. Usa la información de contexto de internet para expandir con datos técnicos reales, plazos o contextos macroeconómicos del sector agroindustrial argentino.\n" +
                     "- Por cada novedad, debes redactar obligatoriamente el IMPACTO OPERATIVO o comercial real en el día a día de un frigorífico, planta de alimentos o logística.\n" +
                     "- Estructura obligatoria por cada novedad usando estas etiquetas estrictas:\n" +
                     "<p><strong>TIPO DE NORMA NRO/AÑO – ORGANISMO EMISOR</strong></p>\n" +
                     "<p><strong>Título descriptivo de la novedad</strong></p>\n" +
                     "<p style=\"text-align: justify;\">Desarrollo explicativo profundo de la norma e impacto práctico. Redactar entre 2 y 4 párrafos sólidos, claros, en tercera persona, con terminología formal corporativa.</p>\n" +
                     "<a href=\"URL_REAL\">Ver normativa completa</a>\n\n" +
                     "REGLAS DE ESTILO VISUAL GENERAL:\n" +
                     "- Fuente general implícita: Georgia, serif, 17px, color #333333.\n" +
                     "- Texto estrictamente justificado donde se indica.\n" +
                     "- Si no hay URLs reales en el contexto, elimina por completo la etiqueta <a>.\n" +
                     "- No incluyas bloques de código markdown como ```json o ```html dentro del texto del JSON."
          },
          {
            role: "user",
            content: "INFORMACIÓN DE CONTEXTO ACTUALIZADA DE INTERNET:\n" + contextoBusqueda + "\n\n" +
                     "APUNTES DEL USUARIO:\n" + puntosClave + "\n\n" +
                     "Genera el objeto JSON con las propiedades 'resumenEmail' and 'boletinCompleto' para CIFAS."
          }
        ],
        temperature: 0.65
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || "Error HTTP " + response.status);
    }

    const data = await response.json();
    const rawContent = data.choices[0].message.content.trim();
    
    // Parseamos la respuesta estructurada de la IA
    const resultadoJson = JSON.parse(rawContent);

    // Devolvemos ambos bloques limpios e independientes al frontend
    return {
      statusCode: 200,
      body: JSON.stringify({
        resumenEmail: resultadoJson.resumenEmail,
        boletinCompleto: resultadoJson.boletinCompleto
      })
    };

  } catch (error) {
    console.error("❌ ERROR GENERAL EN FUNCIÓN:", error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};