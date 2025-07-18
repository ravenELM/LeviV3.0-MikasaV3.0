const fetch = require('node-fetch'); // make sure you have node-fetch installed
const fs = require('fs');

module.exports = {
  name: 'emojimix',
  description: 'Combine two emojis into sticker mix',
  run: async (m, { conn, prefix, command }) => {
    const text = m.text || '';
    const reply = (text) => conn.sendMessage(m.chat, { text }, { quoted: m });

    // Parse emojis separated by '+'
    let [emoji1, emoji2] = text.split(' ').slice(1).join(' ').split('+');

    if (!emoji1 || !emoji2) {
      return reply(`❌ Example usage:\n${prefix + command} 😅+🤔`);
    }

    reply('⏳ Please wait...');

    try {
      // Fetch combined emoji stickers from Google Emoji Kitchen API (via Tenor endpoint)
      const url = `https://tenor.googleapis.com/v2/featured?key=AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ&contentfilter=high&media_filter=png_transparent&component=proactive&collection=emoji_kitchen_v5&q=${encodeURIComponent(emoji1)}_${encodeURIComponent(emoji2)}`;
      const response = await fetch(url);
      const data = await response.json();

      if (!data.results || data.results.length === 0) {
        return reply('❌ No sticker mix found for those emojis.');
      }

      // Send each sticker as a sticker message
      for (const result of data.results) {
        const stickerUrl = result.url;

        // Download the image temporarily
        const res = await fetch(stickerUrl);
        const buffer = await res.buffer();
        const tempFile = `./temp/emojimix_${Date.now()}.png`;
        fs.writeFileSync(tempFile, buffer);

        // Send as sticker
        await conn.sendMessage(m.chat, {
          sticker: { url: tempFile }
        }, { quoted: m });

        // Delete temp file
        fs.unlinkSync(tempFile);
      }
    } catch (error) {
      console.error(error);
      reply('❌ Failed to get emoji mix stickers.');
    }
  }
};
