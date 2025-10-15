// pages/api/generate-cv.js
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { userData } = req.body || {};
  if (!userData) return res.status(400).json({ error: "Missing userData" });

  // Construye un prompt con los datos del usuario
  const prompt = `
Eres una IA que resume experiencia laboral para crear un CV en español.
Recibes datos en formato JSON: ${JSON.stringify(userData)}
Devuelve un JSON con secciones: { "name", "desired_position", "summary", "experience": [...], "education": [...], "skills": [...] } y además un campo "text" con el CV listo para copiar/pegar.
  `;

  try {
    const hfResp = await fetch("https://api-inference.huggingface.co/models/google/flan-t5-small", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ inputs: prompt, parameters: { max_new_tokens: 400 } })
    });

    const data = await hfResp.json();
    // Ajuste: los modelos devuelven distintos formatos; intentamos interpretar
    let text = "";
    if (Array.isArray(data) && data[0]) {
      text = data[0].generated_text || data[0].text || JSON.stringify(data[0]);
    } else if (data.generated_text) {
      text = data.generated_text;
    } else {
      text = JSON.stringify(data);
    }

    // Intentamos devolver lo que necesitamos (el front-end debe parsear)
    res.status(200).json({ text });
  } catch (err) {
    console.error("AI error", err);
    res.status(500).json({ error: "AI request failed", details: err.message });
  }
}
