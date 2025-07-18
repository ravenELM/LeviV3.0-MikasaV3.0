const axios = require('axios');

const validTtUrl = url => /https?:\/\/(www\.)?tiktok\.com\/.+/.test(url);

module.exports = {
  name: 'tiktok',
  aliases: ['tt', 'ttdown'],
  description: 'Download TikTok video by link',
  async run(m, { conn, args }) {
    const chatId = m.key.remoteJid;
    const input = args.join(' ').trim();

    if (!input || !validTtUrl(input)) {
      return conn.sendMessage(chatId, {
        text: '❌ Please provide a valid TikTok video URL.\nExample:\n`.tiktok https://www.tiktok.com/@user/video/1234567890`'
      }, { quoted: m });
    }

    try {
      // Example free TikTok API (replace with your preferred one)
      const apiURL = `https://api.tiktokdownloader.org/api?url=${encodeURIComponent(input)}`;

      const { data } = await axios.get(apiURL);

      // This depends on the API response format; adjust if necessary
      if (!data || !data.video) {
        throw new Error('No video URL found');
      }

      const videoUrl = data.video.no_watermark || data.video.watermark || data.video.no_wm;

      if (!videoUrl) {
        throw new Error('No downloadable video link found');
      }

      const videoBuffer = (await axios.get(videoUrl, { responseType: 'arraybuffer' })).data;

      await conn.sendMessage(chatId, {
        video: videoBuffer,
        caption: '🎵 TikTok video downloaded successfully.',
        mimetype: 'video/mp4'
      }, { quoted: m });

    } catch (err) {
      console.error('[TikTok Downloader]', err);
      await conn.sendMessage(chatId, {
        text: '❌ Failed to download TikTok video. The link might be invalid or the video is private.'
      }, { quoted: m });
    }
  }
};
