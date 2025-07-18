const axios = require('axios');
const cheerio = require('cheerio');

const validIgUrl = url =>
  /(?:https?:\/\/)?(?:www\.)?instagram\.com\/reel\//.test(url);

module.exports = {
  name: 'ig',
  aliases: ['reel', 'igdl'],
  description: 'Download Instagram Reels by link',
  async run(m, { conn, args }) {
    const chatId = m.key.remoteJid;
    const input = args.join(' ').trim();

    if (!input || !validIgUrl(input)) {
      return conn.sendMessage(chatId, {
        text: '📸 Please provide a valid Instagram Reel URL.\nExample:\n`.ig https://www.instagram.com/reel/abc123/`',
      }, { quoted: m });
    }

    try {
      const headers = { 'User-Agent': 'Mozilla/5.0' };

      // 1. Try main page
      let response = await axios.get(input, { headers });
      let $ = cheerio.load(response.data);
      let videoUrl = $('meta[property="og:video"]').attr('content');

      // 2. Try embed fallback
      if (!videoUrl) {
        const embedUrl = input.replace(/\/$/, '') + '/embed/';
        const embedResp = await axios.get(embedUrl, { headers });
        $ = cheerio.load(embedResp.data);
        videoUrl = $('meta[property="og:video"]').attr('content');
      }

      if (videoUrl) {
        const buffer = (await axios.get(videoUrl, { responseType: 'arraybuffer' })).data;
        await conn.sendMessage(chatId, {
          video: buffer,
          caption: '🎬 Instagram Reel downloaded successfully.',
          mimetype: 'video/mp4',
        }, { quoted: m });
      } else {
        // Show warning if only image is present
        return conn.sendMessage(chatId, {
          text: '❌ No video found in this Reel. It might be restricted or blocked from download.',
        }, { quoted: m });
      }
    } catch (err) {
      console.error('[IG Downloader]', err);
      await conn.sendMessage(chatId, {
        text: '❌ Failed to fetch Reel. Make sure the link is correct and public.',
      }, { quoted: m });
    }
  },
};
