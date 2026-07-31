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
        body: JSON.stringify(payload),});

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
            if (intento === maxIntentos) throw new Error("JSON malformado persistente");}
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
    }}
  throw new Error('No se pudo obtener respuesta válida de Groq.');};

const investigarConGroqCompound = async (puntosClave) => {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'groq/compound-mini',
      messages: [
        {
          role: 'user',
          content: `Buscá información actual y verificable en internet sobre: "${puntosClave}".
Priorizá fuentes oficiales, noticias recientes y sitios institucionales argentinos (gob.ar, ARCA, Boletín Oficial) si son relevantes al tema, pero no te limites solo a esos si no hay resultados ahí.
Devolveme los datos concretos que encontraste: fechas, organismos, montos, nombres de programas, links. Sé breve y concreto.`
        }
      ],
      search_settings: {
        max_results: 4 }})});

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq Compound respondió ${response.status}: ${errText}`);  }

  const data = await response.json();
  const investigacion = data.choices?.[0]?.message?.content || '';
  const fuentes = (data.choices?.[0]?.message?.executed_tools || [])
    .flatMap((t) => t.search_results || [])
    .map((r) => ({ titulo: r.title, url: r.url }));

  return { investigacion, fuentes };};

const generarNovedadDual = async (puntosClave, investigacion, fuentes) => {
  const listaFuentes = (fuentes || []).map((f) => `- ${f.titulo}: ${f.url}`).join('\n');

  const payload = {
    model: 'openai/gpt-oss-120b',
    temperature: 0.3,
    reasoning_effort: 'medium',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: [
          'Sos el redactor de comunicaciones de CIFAS, una consultora.',
          'Te paso información YA INVESTIGADA en internet. Usá SOLO esos datos, no inventes fechas, montos ni nombres que no estén ahí.',
          'Si la información encontrada es insuficiente o poco clara (o directamente no hay), redactá de forma más general en base a los puntos clave y no inventes para rellenar.',
          'Generá dos versiones en HTML:',
          '1) "resumenEmail": párrafo breve (2-4 líneas) para el cuerpo del mail.',
          '2) "boletinCompleto": versión detallada con <h3>/<p>/<ul> para el PDF adjunto.',
          'Si hay fuentes, al final de "boletinCompleto" agregá una sección "<h4>Fuentes</h4>" con los links.',
          'DEVOLVÉ SOLO EL JSON: {"resumenEmail":"...","boletinCompleto":"..."}'
        ].join('\n')},
      {
        role: 'user',
        content: `Puntos clave originales: ${puntosClave}\n\nInformación investigada en internet:\n${investigacion || '(sin resultados de búsqueda)'}\n\nFuentes:\n${listaFuentes || '(ninguna)'}`
      }]};
  return invocarGroqConReintentos(payload);};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  try {
    const body = JSON.parse(event.body || '{}');
    const { action, puntosClave } = body;

    if (!puntosClave || !puntosClave.trim()) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Faltan los puntos clave de la novedad.' }) };}

    if (action === 'investigar') {
      const { investigacion, fuentes } = await investigarConGroqCompound(puntosClave);
      return { statusCode: 200, body: JSON.stringify({ investigacion, fuentes }) };}

    if (action === 'redactar') {
      const { investigacion, fuentes } = body;
      const resultado = await generarNovedadDual(puntosClave, investigacion || '', fuentes || []);
      if (!resultado?.resumenEmail || !resultado?.boletinCompleto) {
        throw new Error('La IA no devolvió el formato dual esperado.');}
      return { statusCode: 200, body: JSON.stringify({ ...resultado, fuentes: fuentes || [] }) };}

    return { statusCode: 400, body: JSON.stringify({ error: 'Acción desconocida. Usá "investigar" o "redactar".' }) };
  } catch (error) {
    console.error('Error crítico en generarNovedadIA:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };}};