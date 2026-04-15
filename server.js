import express from "express";
import axios from "axios";

const app = express();
app.use(express.json());

// 🔹 Ruta de prueba
app.get("/", (req, res) => {
  res.send("Middleware Slack-Flowise funcionando 🚀");
});

app.post("/slack/events", async (req, res) => {
  const body = req.body;

  // 1️⃣ Verificación inicial de Slack (URL Verification)
  if (body.type === "url_verification") {
    return res.json({ challenge: body.challenge });
  }

  // 2️⃣ Responder rápido a Slack para evitar reintentos (HTTP 200)
  res.sendStatus(200);

  try {
    // 3️⃣ Validar que sea una mención y NO sea un bot para evitar bucles infinitos
    if (body.event && body.event.type === "app_mention" && !body.event.bot_id) {
      const rawText = body.event.text || "";
      const cleanText = rawText.replace(/<@[^>]+>/g, "").trim();
      const channel = body.event.channel;
      const user = body.event.user;

      console.log(`Mensaje recibido de ${user}: ${cleanText}`);

      // 4️⃣ Llamada a Flowise
      // Asegúrate de que esta URL sea la correcta para el nuevo bot
      const flowiseRes = await axios.post(
        "https://dev.flowiseai.com/v2/agentcanvas/af069ba3-0c60-4bfa-851b-57839d663f46",
        {
          question: cleanText,
          chatId: `slack_${channel}_${user}` // Ayuda a mantener la memoria del chat
        }
      );

      // 5️⃣ Extraer respuesta (Soporta formato texto simple o JSON del Agente)
      let answer = "Lo siento, no pude procesar tu solicitud.";
      
      if (flowiseRes.data) {
        answer = flowiseRes.data.text || flowiseRes.data.jsonResponse || (typeof flowiseRes.data === 'string' ? flowiseRes.data : answer);
      }

      // 6️⃣ Enviar respuesta de vuelta a Slack
      await axios.post(
        "https://slack.com/api/chat.postMessage",
        {
          channel: channel,
          text: answer
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`,
            "Content-Type": "application/json"
          }
        }
      );
    }
  } catch (error) {
    // Log detallado para depuración
    console.error("❌ Error en el proceso:");
    if (error.response) {
      console.error("Data:", error.response.data);
      console.error("Status:", error.response.status);
    } else {
      console.error("Mensaje:", error.message);
    }
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
