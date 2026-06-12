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

    // Payload para Resend
    const emailPayload = {
      from: "Prototipo Boletines <onboarding@resend.dev>",
      
      // ⚠️ RESTRICCIÓN TESTING: Mientras uses "onboarding@resend.dev", 
      // SOLO podés enviarte correos a vos misma. 
      // Cuando tengas dominio propio, cambiá esto por: to: destinatario
      to: "sere22giacomelli@gmail.com", 
      
      subject: asunto,
      html: cuerpoHtml, // El mail llega con HTML corporativo impecable
      attachments: []
    };

    // 🚀 ADJUNTAR PDF: Si recibimos el Base64 blindado, lo adjuntamos como PDF
    if (adjuntoPdf) {
      emailPayload.attachments.push({
        filename: "boletin-novedades.pdf", // 👈 Revisá que termine en .pdf y NO en .docx
        content: adjuntoPdf // Base64 del PDF blindado
      });
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