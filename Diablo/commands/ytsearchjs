const ytSearch = require('yt-search');

module.exports = {
  name: 'ytsearch',
  description: 'Search YouTube for music or videos and return info',
  async run(m, { conn, args }) {
    const chatId = m.key.remoteJid;
    const query = args.join(' ').trim();

    if (!query) {
      return conn.sendMessage(chatId, { text: '❌ Please provide a search query.' }, { quoted: m });
    }

    try {
      const r = await ytSearch(query);
      const video = r.videos.length > 0 ? r.videos[0] : null;

      if (!video) {
        return conn.sendMessage(chatId, { text: '❌ No results found.' }, { quoted: m });
      }

      const info = 
        `🎵 *Title:* ${video.title}\n` +
        `👤 *Author:* ${video.author.name}\n` +
        `👁️ *Views:* ${video.views.toLocaleString()}\n` +
        `👍 *Likes:* ${video.likes ? video.likes.toLocaleString() : 'N/A'}\n` +
        `⏰ *Duration:* ${video.timestamp}\n` +
        `📅 *Uploaded:* ${video.ago}\n` +
        `🔗 *Link:* ${video.url}\n\n` +
        `📝 *Description:*\n${video.description ? video.description.slice(0, 300) + '...' : 'No description available.'}`;

      await conn.sendMessage(chatId, { text: info }, { quoted: m });

    } catch (error) {
      console.error('YT Search error:', error);
      await conn.sendMessage(chatId, { text: '❌ Failed to search YouTube.' }, { quoted: m });
    }
  }
};
