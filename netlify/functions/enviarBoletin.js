// 1. Definimos la función aquí mismo en este archivo para que la reconozca
const obtenerNombreArchivoPdf = () => {
  const hoy = new Date();
  const diaSemana = hoy.getDay() === 0 ? 7 : hoy.getDay();
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() - (diaSemana - 1));
  const viernes = new Date(lunes);
  viernes.setDate(lunes.getDate() + 4);

  const meses = [
    'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 
    'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
  ];
  
  const mesInicio = meses[lunes.getMonth()];
  const mesFin = meses[viernes.getMonth()];
  const diaInicio = String(lunes.getDate()).padStart(2, '0');
  const diaFin = String(viernes.getDate()).padStart(2, '0');
  const anio = viernes.getFullYear();

  return `NOVEDADES ${mesInicio} del ${diaInicio} AL ${diaFin} DE ${mesFin} ${anio}.pdf`;
};

// 2. El handler que procesa el envío
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
      from: "Prototipo Boletines <onboarding@resend.dev>",
      to: "sere22giacomelli@gmail.com", 
      subject: asunto,
      html: cuerpoHtml, 
      attachments: []
    };

    if (adjuntoPdf) {
      emailPayload.attachments.push({
        filename: obtenerNombreArchivoPdf(), // Ahora sí la va a encontrar sin problemas
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