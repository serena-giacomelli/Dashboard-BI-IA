const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async (event) => {
  // Vamos a ver qué ve la función realmente
  const apiKey = process.env.GEMINI_API_KEY;
  console.log("DEBUG - Contenido de GEMINI_API_KEY:", apiKey); 

  if (!apiKey || apiKey === undefined) {
    console.error("ERROR: La variable GEMINI_API_KEY llega como undefined o nula.");
    return { statusCode: 500, body: JSON.stringify({ error: "La variable de entorno no existe en este scope" }) };
  }

  try {
    const { puntosClave } = JSON.parse(event.body);
    
    // Inicialización directa
    const genAI = new GoogleGenerativeAI(apiKey.trim());
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
    Actúa como un experto en comunicación corporativa de la empresa CIFAS.
    Redacta un boletín informativo profesional y claro basado en estos puntos:
    "${puntosClave}"
    
    Reglas:
    - Usa un tono cercano pero muy profesional.
    - No escribas saludos iniciales genéricos (ya tenemos el "Estimado/a...").
    - Ve directo a la información importante.
    - Asegúrate de que el texto sea coherente y fácil de leer.
    - Devuelve solo el texto del cuerpo del boletín en formato HTML (etiquetas <p>, <strong>, etc).
    `;

    const result = await model.generateContent(prompt);
    
    return {
      statusCode: 200,
      body: JSON.stringify({ contenido: result.response.text() }),
    };
  } catch (error) {
    console.error("ERROR DETALLADO:", error.message);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};