import { Router } from "express";

export const aiRouter = Router();

aiRouter.post("/chat", async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "OpenRouter API Key is missing in server environment." });
    }

    const { message, context } = req.body;

    const systemPrompt = `You are an AI assistant for a Smart Classroom Scheduler application. 
You help users with scheduling questions.

Current context: ${JSON.stringify(context || {})}

Provide helpful, accurate responses about scheduling, timetable management, and educational administration.`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5000",
        "X-Title": "Smart Classroom",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-001",
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: message }],
      }),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      console.error("OpenRouter API Error:", JSON.stringify(data, null, 2));
      return res.status(response.status || 500).json({ error: data.error?.message || "AI Provider Error" });
    }

    res.json({ response: data.choices?.[0]?.message?.content || "I couldn't generate a response." });
  } catch (error) {
    console.error("AI Chat error:", error);
    res.status(500).json({ error: "Failed to process AI request" });
  }
});
