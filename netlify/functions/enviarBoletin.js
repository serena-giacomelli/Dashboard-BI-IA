// netlify/functions/enviarBoletin.js

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Método no permitido" }) };
  }

  try {
    const { asunto, cuerpoHtml } = JSON.parse(event.body);
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: "Falta configurar la API KEY en Netlify" }) };
    }

    // Convertimos el contenido HTML a Base64 para enviarlo como adjunto
    const wordBase64 = Buffer.from(cuerpoHtml, 'utf-8').toString('base64');

    // Petición a la API de Resend
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "Prototipo Boletines <onboarding@resend.dev>",
        to: "sere22giacomelli@gmail.com", // Tu mail de prueba fijo
        subject: asunto,
        html: cuerpoHtml,
        attachments: [
          {
            filename: "boletin-novedades.doc", // CORREGIDO: .doc para que Word lo abra sin chistar
            content: wordBase64
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Error de Resend:", data);
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: data.message })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: "¡Boletín enviado!", id: data.id })
    };
  } catch (error) {
    console.error("Error en la función:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Error interno en el servidor" })
    };
  }
};