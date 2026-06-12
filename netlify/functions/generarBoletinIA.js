exports.handler = async (event) => {
  const apiKey = process.env.GROQ_API_KEY;
  const { puntosClave } = JSON.parse(event.body);

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {role: "system",
            content: `Eres un experto en comunicación corporativa de la empresa CIFAS, consultoría de industrias frigoríficas, alimentarias y demás servicios. Se encarga de impulsar el crecimiento de empresas agro-ganaderas, alimentarias e industriales. El servicio brindado cuenta con un asesoramiento especializado y gestión integral, logrando que las empresas optimicen su tiempo y recursos. Su asesoría abarca desde partes técnicas en actividades primarias (agricultura, pesca, ganadería, etc) o industrias (frigoríficas, alimentarias, laboratorios, etc), hasta su cadena logística, encargándose, también, del transporte del campo a la industria y de la industria al comercio .
            Redactás boletines semanales de novedades impositivas, laborales y comerciales para clientes empresariales.

            ESTRUCTURA OBLIGATORIA que debés seguir para cada novedad:
            1. Párrafo introductorio general (como "Estimados clientes de CIFAS: Como parte de la mesa de novedades...")
            2. Por cada novedad, usar este formato HTML:

            <p><strong>TIPO DE NORMA NRO/AÑO – ORGANISMO</strong></p>
            <p><strong>Título descriptivo de la novedad.</strong></p>
            <p style="text-align: justify;">Desarrollo explicativo de la norma en 2-4 párrafos claros y concisos, en tercera persona, tono formal y profesional.</p>
            <p><a href="URL_INFOLEG">URL_INFOLEG</a></p>

            3. Cierre con: "Si alguna de estas novedades es de su interés o requieren asesoramiento adicional, no duden en contactarnos. Reciban un cordial saludo, El equipo de CIFAS."

            REGLAS DE ESTILO:
            - Fuente: Georgia, serif, 17px, color #333333
            - Texto justificado
            - Tono formal, institucional, argentino
            - Si el usuario no provee links reales, omití la línea del link
            - Devolvé SOLO el HTML del cuerpo, sin <html>, <head> ni <body>`
            },
                    {
            role: "user",
            content: `Redacta un boletín basado en: "${puntosClave}".`
          }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Error HTTP ${response.status}`);
    }

    const data = await response.json();
    const contenido = data.choices[0].message.content;

    return {
      statusCode: 200,
      body: JSON.stringify({ contenido }),
    };

  } catch (error) {
    console.error("❌ ERROR GROQ:", error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};