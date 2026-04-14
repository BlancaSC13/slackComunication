import express from "express";
import axios from "axios";

const app = express();
app.use(express.json());

// 🔹 Ruta principal (opcional, útil para pruebas)
app.get("/", (req, res) => {
  res.send("Slack-Flowise middleware activo");
});

app.post("/slack/events", async (req, res) => {
  const body = req.body;

  // 🔹 Verificación inicial de Slack
  if (body.type === "url_verification") {
    return res.json({ challenge: body.challenge });
  }

  // 🔹 Evitar que Slack reintente (responder rápido)
  res.sendStatus(200);

  try {
    if (body.event && body.event.type === "app_mention") {
      const rawText = body.event.text || "";
      const cleanText = rawText.replace(/<@[^>]+>/g, "").trim();
      const channel = body.event.channel;
      const user = body.event.user;

      // 🔹 Llamada a Flowise
      const flowiseRes = await axios.post(
        "https://flowise-latest-hzw9.onrender.com/api/v1/prediction/8cae7ab4-cb27-4294-9784-2d21a13f4b37",
        {
          question: cleanText,
          overrideConfig: {
            sessionId: user
          }
        }
      );

      const answer = flowiseRes.data.text || "No tengo respuesta 😅";

      // 🔹 Responder en Slack
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
    console.error("Error:", error.response?.data || error.message);
  }
});

// 🔴 IMPORTANTE para Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
