import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
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
    const response = await client.responses.create({
      model: "gpt-5.2",
      input: "Reply in one short Russian sentence that the AI endpoint is working."
    });

    return res.status(200).json({
      ok: true,
      reply: response.output_text || "AI endpoint is working.",
      model: "gpt-5.2"
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error?.message || "Unknown AI error."
    });
  }
}
