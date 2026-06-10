
exports.handler = async (event) => {
  const apiKey = process.env.OPENAI_API_KEY;
  const { puntosClave } = JSON.parse(event.body);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // Modelo rápido y económico
        messages: [
          {
            role: "system",
            content: "Actúa como un experto en comunicación corporativa de la empresa CIFAS. Devuelve solo el cuerpo del boletín en formato HTML."
          },
          {
            role: "user",
            content: `Redacta un boletín basado en: "${puntosClave}".`
          }
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Error al conectar con OpenAI");
    }

    const contenido = data.choices[0].message.content;

    return {
      statusCode: 200,
      body: JSON.stringify({ contenido: contenido }),
    };
  } catch (error) {
    console.error("❌ ERROR OPENAI:", error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: error.message }) 
    };
  }
};