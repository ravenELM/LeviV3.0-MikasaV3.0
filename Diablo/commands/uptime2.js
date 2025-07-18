// commands/core-uptime.js
const path = require('path');
const fs = require('fs');

module.exports = {
  name: 'uptime',
  aliases: ['botuptime', 'upt'],
  desc: 'Shows how long the bot has been online',
  async run(msg, { conn }) {
    const chatId = msg.key.remoteJid;

    // Calculate uptime
    const uptimeMs = process.uptime() * 1000;
    const totalSeconds = Math.floor(uptimeMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const text = `🟩 *𝕄𝕀𝕂𝔸𝕊𝔸*\n🟥 *𝔼𝕃𝔸𝕀ℕ𝔸* \n🟥 *𝕃𝔼𝕍𝕀*\n Uptime:\n⏳ ${hours}h ${minutes}m ${seconds}s`;

    // Replace this with your own file path if you want a different animation
    const gifPath = path.join(__dirname, '../media/uptime.gif');
    if (!fs.existsSync(gifPath)) {
      return conn.sendMessage(chatId, { text: text }, { quoted: msg });
    }

    await conn.sendMessage(chatId, {
      caption: text,
      video: fs.readFileSync(gifPath),
      gifPlayback: true
    }, { quoted: msg });
  }
};
