const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

module.exports = {
  name: 'sticker',
  aliases: ['s', 'stiker'],
  desc: 'Convert image to sticker (no FFmpeg needed)',

  async run(msg, { conn }) {
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const chatId = msg.key.remoteJid;

    if (!quoted || !quoted.imageMessage) {
      return conn.sendMessage(chatId, { text: '⚠️ Reply to an image to create a sticker!' }, { quoted: msg });
    }

    try {
      const media = quoted.imageMessage;
      const stream = await downloadContentFromMessage(media, 'image');
      const buffer = [];

      for await (const chunk of stream) {
        buffer.push(chunk);
      }

      const imageBuffer = Buffer.concat(buffer);
      const stickerBuffer = await sharp(imageBuffer)
        .resize(512, 512, { fit: 'cover', position: 'center' })
        .webp({ quality: 80 })
        .toBuffer();

      await conn.sendMessage(chatId, { sticker: stickerBuffer }, { quoted: msg });

    } catch (err) {
      console.error('Sticker error:', err);
      await conn.sendMessage(chatId, { text: '❌ Failed to create sticker.' }, { quoted: msg });
    }
  }
};
