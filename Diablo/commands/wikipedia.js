const wiki = require('wikijs').default;

module.exports = {
  name: 'wikipedia',
  description: 'Search Wikipedia and get summary',
  async run(m, { conn, args }) {
    const chatId = m.key.remoteJid;
    const query = args.join(' ').trim();

    if (!query) {
      return conn.sendMessage(chatId, { text: '❌ Please provide a search term.' }, { quoted: m });
    }

    try {
      const page = await wiki().page(query);
      const summary = await page.summary();
      const url = page.url();

      const shortSummary = summary.length > 700 ? summary.slice(0, 700) + '...' : summary;

      const message =
        `📚 *${query}* - Wikipedia\n\n` +
        `${shortSummary}\n\n` +
        `🔗 Read more: ${url}`;

      await conn.sendMessage(chatId, { text: message }, { quoted: m });

    } catch (error) {
      console.error('Wikipedia search error:', error);
      await conn.sendMessage(chatId, { text: `❌ Could not find any results for "${query}".` }, { quoted: m });
    }
  }
};
