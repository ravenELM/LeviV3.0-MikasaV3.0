const path = require('path');
const fs = require('fs');

module.exports = {
  name: 'arise2',
  aliases: [],
  description: 'Play a random song from the songs folder',

  /** 
   * @param {import('@whiskeysockets/baileys').proto.WebMessageInfo} msg
   * @param {{ conn: import('@whiskeysockets/baileys').WASocket, args: string[] }} ctx 
   */
  async run(msg, { conn }) {
    const chatId = msg.key.remoteJid;

    // Define songs folder path
    const songsFolder = path.join(__dirname, '..', 'songs');

    // Get list of files in folder
    const files = fs.readdirSync(songsFolder).filter(f => f.endsWith('.mp3'));

    if (files.length === 0) {
      await conn.sendMessage(chatId, { text: '⚠️ No songs found in folder.' }, { quoted: msg });
      return;
    }

    // Pick a random file
    const randomFile = files[Math.floor(Math.random() * files.length)];
    const filePath = path.join(songsFolder, randomFile);

    // Send audio
    await conn.sendMessage(chatId, {
      audio: { url: filePath },
      mimetype: 'audio/mp4',
      ptt: false
    }, { quoted: msg });
  }
};
