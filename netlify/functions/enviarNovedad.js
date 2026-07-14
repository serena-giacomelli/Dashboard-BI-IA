const obtenerNombreArchivoPdfNovedad = () => {
  const hoy = new Date();
  const meses = [
    'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
    'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
  ];

  const dia = String(hoy.getDate()).padStart(2, '0');
  const mes = meses[hoy.getMonth()];
  const anio = hoy.getFullYear();

  return `NOVEDAD DIARIA ${dia} DE ${mes} ${anio}.pdf`;
};

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Método no permitido" }) };
  }

  try {
    const { asunto, cuerpoHtml, destinatario, adjuntoPdf, filename } = JSON.parse(event.body);
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: "Falta configurar la API KEY en Netlify" }) };
    }

    const emailPayload = {
      from: "Prototipo Novedades <onboarding@resend.dev>",
      to: "sere22giacomelli@gmail.com",
      subject: asunto,
      html: cuerpoHtml,
      attachments: []
    };

    if (adjuntoPdf) {
      emailPayload.attachments.push({
        filename: filename || obtenerNombreArchivoPdfNovedad(),
        content: adjuntoPdf
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
      body: JSON.stringify({ success: true, message: "¡Novedad enviada!", id: data.id })
    };
  } catch (error) {
    console.error("Error en la función:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Error interno en el servidor" })
    };
  }
};