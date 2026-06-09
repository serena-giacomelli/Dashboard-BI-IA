// netlify/functions/enviarBoletin.js

exports.handler = async (event, context) => {
  // Solo permitimos peticiones POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Método no permitido" }) };
  }

  try {
    const { asunto, cuerpoHtml, destinatarios } = JSON.parse(event.body);
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: "Falta configurar la API KEY en Netlify" }) };
    }

    // Petición a la API de Resend
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "Prototipo Boletines <onboarding@resend.dev>",
        to: destinatarios, // Acá va a llegar tu mail de prueba
        subject: asunto,
        html: cuerpoHtml
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