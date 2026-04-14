import express from "express";
import axios from "axios";

const app = express();
app.use(express.json());

app.post("/slack/events", async (req, res) => {
  const body = req.body;

  // 🔹 Verificación Slack
  if (body.type === "url_verification") {
    return res.json({ challenge: body.challenge });
  }

  if (body.event && body.event.type === "app_mention") {
    const text = body.event.text.replace(/<@[^>]+>/g, "").trim();
    const channel = body.event.channel;

    // 👉 Llamada a TU Flowise
    const response = await axios.post(
      "https://flowise-latest-hzw9.onrender.com/api/v1/prediction/8cae7ab4-cb27-4294-9784-2d21a13f4b37",
      {
        question: text,
        overrideConfig: {
          sessionId: body.event.user
        }
      }
    );

    const answer = response.data.text;

    // 👉 Responder en Slack
    await axios.post(
      "https://slack.com/api/chat.postMessage",
      {
        channel: channel,
        text: answer
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`
        }
      }
    );
  }

  res.sendStatus(200);
});

app.listen(3000, () => console.log("OK"));
