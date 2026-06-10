// netlify/functions/enviarBoletin.js

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Método no permitido" }) };
  }

  try {
    const { asunto, cuerpoHtml, destinatario, adjuntoPdf } = JSON.parse(event.body);
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: "Falta configurar la API KEY en Netlify" }) };
    }

    const emailPayload = {
      from: "Prototipo Boletines <onboarding@resend.dev>",
      // Para tus pruebas, mantengo tu mail fijo para que Resend no te bloquee
      to: "sere22giacomelli@gmail.com", 
      subject: asunto,
      html: cuerpoHtml
    };

    // 🚀 NUEVO: Si recibimos el string del PDF desde el frontend, se adjunta con extensión .pdf
    if (adjuntoPdf) {
      emailPayload.attachments = [
        {
          filename: "boletin-novedades.pdf",
          content: adjuntoPdf 
        }
      ];
    }

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