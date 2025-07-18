const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const sharp = require('sharp');

module.exports = {
  name: 'toimg',
  aliases: ['img', 'image'],
  groupOnly: true,
  desc: 'Convert a replied sticker to a full image',

  async run(msg, { conn }) {
    const chatId = msg.key.remoteJid;

    const ctxInfo = msg.message.extendedTextMessage?.contextInfo;
    if (!ctxInfo || !ctxInfo.quotedMessage) {
      return conn.sendMessage(chatId,
        { text: '⚠️ Reply to the sticker you want to convert.' },
        { quoted: msg });
    }

    const quoted = ctxInfo.quotedMessage;

    if (!quoted.stickerMessage) {
      return conn.sendMessage(chatId,
        { text: '⚠️ The replied message is not a sticker.' },
        { quoted: msg });
    }

    try {
      // Download sticker as stream
      const stream = await downloadContentFromMessage(quoted.stickerMessage, 'sticker');
      let buffer = Buffer.alloc(0);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }

      // Convert to PNG with sharp
      const pngBuffer = await sharp(buffer).png().toBuffer();

      // Send image
      await conn.sendMessage(chatId, { image: pngBuffer }, { quoted: msg });

    } catch (error) {
      console.error('Failed to convert sticker:', error);
      await conn.sendMessage(chatId,
        { text: '❌ Failed to convert sticker to image.' },
        { quoted: msg });
    }
  }
};
