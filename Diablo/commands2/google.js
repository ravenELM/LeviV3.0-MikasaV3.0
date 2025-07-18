const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: "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", // put your key here
});

module.exports = {
  name: "google",
  description: "Ask GPT for an answer like a Google search",
  async run(m, { conn, args }) {
    const chatId = m.key.remoteJid;
    const query = args.join(" ").trim();

    if (!query) {
      return conn.sendMessage(chatId, { text: "❌ Please provide a search query." }, { quoted: m });
    }

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: "You are a helpful assistant who answers questions concisely." },
          { role: "user", content: query },
        ],
      });

      const answer = completion.choices[0].message.content;

      await conn.sendMessage(
        chatId,
        {
          text: `🔍 *Query:*\n${query}\n\n💡 *Answer:*\n${answer}`,
        },
        { quoted: m }
      );
    } catch (error) {
      console.error("[Google command] OpenAI error:", error.response?.data || error.message);
      await conn.sendMessage(chatId, { text: "❌ Failed to get answer. Please try again later." }, { quoted: m });
    }
  },
};
