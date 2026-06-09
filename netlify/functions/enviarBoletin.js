// netlify/functions/enviarBoletin.js

exports.handler = async (event, context) => {
  // Solo permitimos peticiones POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Método no permitido" }) };
  }

  try {
    // CORREGIDO: Traemos destinatario (singular) e incluirWord desde el frontend
    const { asunto, cuerpoHtml, destinatario, incluirWord } = JSON.parse(event.body);
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: "Falta configurar la API KEY en Netlify" }) };
    }

    // Armamos el cuerpo base para la API de Resend
    const emailPayload = {
      from: "Prototipo Boletines <onboarding@resend.dev>",
      to: destinatario || "sere22giacomelli@gmail.com", // Usa el mail del cliente o tu fallback de pruebas
      subject: asunto,
      html: cuerpoHtml
    };

    // CORREGIDO: Si el frontend pide incluir el Word, lo procesamos y adjuntamos
    if (incluirWord) {
      // Convertimos el HTML del boletín en un string Base64. 
      // Word interpreta nativamente el HTML estructurado si el archivo tiene extensión .docx
      const wordBase64 = Buffer.from(cuerpoHtml, 'utf-8').toString('base64');

      emailPayload.attachments = [
        {
          filename: "boletin-novedades.docx",
          content: wordBase64 // Pasamos el base64 puro requerido por la API REST de Resend
        }
      ];
    }

    // Petición a la API de Resend
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(emailPayload)
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
      body: JSON.stringify({ success: true, message: "¡Boletín enviado con éxito!", id: data.id })
    };
  } catch (error) {
    console.error("Error en la función:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Error interno en el servidor" })
    };
  }
};