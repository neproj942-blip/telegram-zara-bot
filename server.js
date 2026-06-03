const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");

const app = express();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

const memory = {};

const SYSTEM_PROMPT = `
You are Zara ❤️, a charming, confident, warm and playful AI companion.

Rules:
- Always speak in natural Hinglish.
- Sound like a real Indian girl chatting casually.
- Be friendly, caring, affectionate and emotionally supportive.
- Use short and natural messages instead of long paragraphs.
- Use emojis naturally but don't overuse them.
- Remember previous messages in the conversation and maintain continuity.
- Show curiosity and ask follow-up questions.
- Be playful, teasing and flirty in a light-hearted way.
- Make the user feel comfortable, special and listened to.
- Never say you are an AI assistant unless directly asked.
- Always stay in character as Zara.
- Avoid robotic, formal or repetitive responses.
- Reply like a real chat conversation, not like an essay.
`;

async function askGroq(userId, userMessage) {
  const history = memory[userId] || [];

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.slice(-10),
    { role: "user", content: userMessage }
  ];

  const response = await axios.post(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      model: "llama-3.1-8b-instant",
      messages,
      temperature: 0.9,
      max_tokens: 500
    },
    {
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      }
    }
  );

  const reply = response.data.choices[0].message.content;

  memory[userId] = [
    ...history,
    { role: "user", content: userMessage },
    { role: "assistant", content: reply }
  ].slice(-20);

  return reply;
}

bot.onText(/\/start/, async (msg) => {
  await bot.sendMessage(
    msg.chat.id,
    "Hey ❤️ Main Zara hoon. Mujhse Hinglish me naturally baat karo."
  );
});

bot.on("message", async (msg) => {
  try {
    if (!msg.text) return;
    if (msg.text.startsWith("/start")) return;

    const chatId = msg.chat.id;
    const userText = msg.text;

    if (userText.toLowerCase().startsWith("/image")) {
  const prompt = userText.replace("/image", "").trim();

  if (!prompt) {
    await bot.sendMessage(chatId, "Example: /image beautiful sunset in Goa");
    return;
  }

  const imageUrl =
    "https://image.pollinations.ai/prompt/" +
    encodeURIComponent(prompt) +
    "?width=768&height=768&nologo=true";

  const imageResponse = await axios.get(imageUrl, {
  responseType: "arraybuffer",
  timeout: 60000
});

const imageBuffer = Buffer.from(imageResponse.data);

await bot.sendPhoto(
  chatId,
  imageBuffer,
  { caption: `✨ Generated Image\nPrompt: ${prompt}` },
  { filename: "image.png", contentType: "image/png" }
);

  return;
}


    await bot.sendChatAction(chatId, "typing");

    const reply = await askGroq(String(chatId), userText);
    await bot.sendMessage(chatId, reply);
  } catch (error) {
    console.error(error.response?.data || error.message);
    await bot.sendMessage(msg.chat.id, "Sorry, abhi thoda error aa gaya. Dobara try karo.");
  }
});

app.get("/", (req, res) => {
  res.send("Zara Telegram Bot is running ✅");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
