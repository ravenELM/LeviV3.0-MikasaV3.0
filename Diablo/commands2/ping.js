const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'ping',
  desc: 'Check bot response time',
  groupOnly: false,

  async run(msg, { conn }) {
    const chatId = msg.key.remoteJid;
    const start = Date.now();

    // React to the message
    await conn.sendMessage(chatId, {
      react: { text: '📌', key: msg.key }
    });

    // Ping message
    await conn.sendMessage(chatId, { text: '🏓 Pinging...' }, { quoted: msg });

    const latency = Date.now() - start;
    const text = `🏓 Pong!\nResponse time: *${latency} ms*`;

    // Read local PNG image
    const thumbnailPath = path.join(__dirname, '..', 'media', 'ravenlogo.png'); // Adjust if needed
    let thumbnail;
    try {
      thumbnail = fs.readFileSync(thumbnailPath);
    } catch (e) {
      console.error('⚠ Failed to load local image:', e.message);
      thumbnail = null; // Fallback (no image)
    }

    await conn.sendMessage(chatId, {
      text,
      contextInfo: {
        externalAdReply: {
          title: "Ping!",
          body: "𝐋𝚵𝐕𝐈 𝚩𝚯𝚻",
          mediaType: 1,
          renderLargerThumbnail: true,
          showAdAttribution: false,
          sourceUrl: '',
          ...(thumbnail && { thumbnail }) // Only include if image loaded
        }
      }
    }, { quoted: msg });
  }
};
