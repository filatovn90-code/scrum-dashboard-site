import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      route: "/api/ai/chat",
      message: "AI chat endpoint is ready."
    });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({
      ok: false,
      error: "Method not allowed."
    });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({
      ok: false,
      error: "OPENAI_API_KEY is missing on the server."
    });
  }

  try {
    const message = String(req.body?.message || "").trim();

    if (!message) {
      return res.status(400).json({
        ok: false,
        error: "Message is required."
      });
    }

    const response = await client.responses.create({
      model: "gpt-5.2",
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: "You are a helpful scrum master assistant. Answer clearly, simply, and in Russian unless the user asks for another language."
            }
          ]
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: message
            }
          ]
        }
      ],
      max_output_tokens: 400
    });

    return res.status(200).json({
      ok: true,
      reply: response.output_text || "Не удалось получить ответ.",
      model: "gpt-5.2"
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error?.message || "Unknown AI error."
    });
  }
}
