const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: "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",
});

module.exports = {
  name: "mikasa",
  description: "Chat with Levi bot using OpenAI GPT",
  async run(m, { conn, args }) {
    const chatId = m.key.remoteJid;
    const input = args.join(" ").trim();

    if (!input) {
      return conn.sendMessage(chatId, { text: "❌ Please type a message for Mikasa." }, { quoted: m });
    }

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4", // or 'gpt-3.5-turbo'
        messages: [
          { role: "system", content: "You are Levi, a helpful and serious chatbot." },
          { role: "user", content: input },
        ],
      });

      const reply = completion.choices[0].message.content;

      await conn.sendMessage(chatId, { text: ` Mikasa: ${reply}` }, { quoted: m });
    } catch (error) {
      console.error("[Levi Chatbot] OpenAI API error:", error.response?.data || error.message);
      await conn.sendMessage(chatId, { text: "❌ Mikasa is currently unavailable." }, { quoted: m });
    }
  },
};
