const invocarGroqConReintentos = async (payload) => {
  const maxIntentos = 3;
  const baseDelay = 500;

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
            const match = content.match(/\{[\s\S]*\}/);
            if (match) content = match[0];
            return JSON.parse(content);
          } catch (jsonError) {
            console.warn(`Intento ${intento}: JSON malformado de la IA.`);
            if (intento === maxIntentos) throw new Error("JSON malformado persistente");
          }
        }
      } else if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : baseDelay * Math.pow(2, intento - 1);
        await new Promise((resolve) => setTimeout(resolve, waitTime + 500));
        continue;
      } else {
        const errText = await response.text();
        console.warn(`Groq respondió ${response.status}: ${errText}`);
      }
    } catch (networkError) {
      console.warn(`Error de red en intento ${intento}: ${networkError.message}`);
    }
    if (intento < maxIntentos) {
      await new Promise((resolve) => setTimeout(resolve, baseDelay * intento));
    }
  }
  throw new Error('No se pudo obtener respuesta válida de Groq.');
};

const generarNovedadDual = async (puntosClave) => {
  const payload = {
    model: 'openai/gpt-oss-120b',
    temperature: 0.4,
    reasoning_effort: 'medium',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: [
          'Sos el redactor de comunicaciones de una consultora (CIFAS).',
          'A partir de puntos clave sueltos que te pasa el usuario (ej: capacitaciones, charlas, congresos, novedades internas), tenés que generar DOS versiones en HTML:',
          '',
          '1) "resumenEmail": un párrafo breve y profesional (2-4 líneas), en HTML simple (una o dos etiquetas <p>), pensado para ir directo en el cuerpo de un email a clientes. Cordial, claro, sin exagerar.',
          '2) "boletinCompleto": una versión más desarrollada y detallada en HTML (usá <h3>, <p>, <ul><li> si corresponde) pensada para el PDF adjunto, expandiendo cada punto clave con más contexto y valor para el cliente.',
          '',
          'No inventes datos concretos (fechas, montos, nombres) que el usuario no haya dado. Si el usuario no da fecha, no la pongas.',
          'DEVOLVÉ SOLO EL JSON, sin texto extra ni markdown: {"resumenEmail":"...","boletinCompleto":"..."}'
        ].join('\n')
      },
      { role: 'user', content: `Puntos clave de la novedad:\n${puntosClave.slice(0, 3000)}` }
    ],
  };

  return invocarGroqConReintentos(payload);
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  try {
    const { puntosClave } = JSON.parse(event.body || '{}');
    if (!puntosClave || !puntosClave.trim()) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Faltan los puntos clave de la novedad.' }) };
    }

    const resultado = await generarNovedadDual(puntosClave);

    if (!resultado?.resumenEmail || !resultado?.boletinCompleto) {
      throw new Error('La IA no devolvió el formato dual esperado.');
    }

    return { statusCode: 200, body: JSON.stringify(resultado) };
  } catch (error) {
    console.error('Error crítico en generarNovedadIA:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};