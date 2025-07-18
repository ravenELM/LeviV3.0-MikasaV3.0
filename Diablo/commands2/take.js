const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

module.exports = {
  name: 'take',
  aliases: [],
  description: 'Renames a sticker with your name and Raven Bots branding',

  /**
   * @param {import('@whiskeysockets/baileys').proto.WebMessageInfo} msg
   * @param {{ conn: import('@whiskeysockets/baileys').WASocket, args: string[] }} ctx
   */
  async run(msg, { conn }) {
    const chatId = msg.key.remoteJid;
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

    if (!quoted || !quoted.stickerMessage) {
      return conn.sendMessage(chatId, { text: '❌ Please reply to a sticker to rename it.' }, { quoted: msg });
    }

    try {
      const mediaType = 'sticker';
      const stream = await downloadContentFromMessage(quoted.stickerMessage, mediaType);
      const chunks = [];

      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      const buffer = Buffer.concat(chunks);

      const userName = msg.pushName || 'User';
      const authorText = `🌟 ${userName} | 𝓡𝓪𝓿𝓮𝓷 𝓑𝓸𝓽𝓼`;

      await conn.sendMessage(chatId, {
        sticker: buffer,
        packname: authorText,
        author: 'Raven Network'
      }, { quoted: msg });

    } catch (err) {
      console.error('take command error:', err);
      return conn.sendMessage(chatId, { text: '❌ Failed to rename the sticker.' }, { quoted: msg });
    }
  }
};
