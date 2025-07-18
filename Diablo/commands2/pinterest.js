const axios = require('axios');

const GOOGLE_API_KEY = 'AIzaSyBkvso7NBJAK3kAhK9ow4FsMEH_yKXZYDc'; // Replace with your key
const GOOGLE_CSE_ID = '621f29523d8cf496d'; // Replace with your custom search engine ID

module.exports = {
  name: 'pint',
  aliases: ['pinterest'],
  description: 'Search Pinterest Images and return 5 images',
  async run(m, { conn, args }) {
    const chatId = m.key.remoteJid;
    const query = args.join(' ').trim();

    if (!query) {
      return conn.sendMessage(chatId, {
        text: '❌ Please provide a search term.\nExample: `.pint anime aesthetic`'
      }, { quoted: m });
    }

    try {
      const res = await axios.get('https://www.googleapis.com/customsearch/v1', {
        params: {
          key: GOOGLE_API_KEY,
          cx: GOOGLE_CSE_ID,
          q: query,
          searchType: 'image',
          num: 5
        }
      });

      const items = res.data.items;
      if (!items || items.length === 0) {
        return conn.sendMessage(chatId, {
          text: '⚠️ No images found on Pinterest.'
        }, { quoted: m });
      }

      for (const item of items) {
        await conn.sendMessage(chatId, {
          image: { url: item.link },
          caption: `🔍 ${query}`
        }, { quoted: m });
      }
    } catch (error) {
      console.error('[Google Image Search]', error);
      await conn.sendMessage(chatId, {
        text: '❌ Failed to fetch images from Pinterest.'
      }, { quoted: m });
    }
  }
};
