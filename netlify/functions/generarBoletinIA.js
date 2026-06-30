export const handler = async (event) => {
    const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

    try {
        // Renombrados para que coincidan idéntico con tu Frontend
        const { fuentes, directivasExclusion } = JSON.parse(event.body);

        const responseIA = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json", 
                "Authorization": `Bearer ${process.env.GROQ_API_KEY}` 
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { 
                        role: "system", 
                        content: `Eres un asistente legal experto. Sigue estas instrucciones de exclusión: ${directivasExclusion.join(', ')}. Responde SOLO con un objeto JSON. Claves: "resumenEmail" y "boletinCompleto".` 
                    },
                    { role: "user", content: `Fuentes oficiales a analizar: ${JSON.stringify(fuentes)}` }
                ],
                temperature: 0.1
            })});

        const data = await responseIA.json();
        const content = data.choices[0].message.content.replace(/```json/g, '').replace(/```/g, '').trim();
        
        return { statusCode: 200, headers, body: content };

    } catch (error) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
    }
};