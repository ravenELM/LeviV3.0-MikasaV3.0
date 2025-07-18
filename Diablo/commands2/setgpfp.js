const { downloadMediaMessage } = require('@whiskeysockets/baileys');

module.exports = {
  name: 'setgpfp',
  aliases: ['setgrouppic', 'setgroupicon'],
  description: 'Set group profile picture (reply to an image)',
  groupOnly: true,
  modOnly: true,

  async run(msg, { conn }) {
    const from = msg.key.remoteJid;

    // Check if the command is a reply to an image
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const imageMsg = quoted?.imageMessage;
    if (!imageMsg) {
      return conn.sendMessage(from, { text: '❌ Reply to an image with .setgpfp' }, { quoted: msg });
    }

    // Download the image using Baileys utility
    let stream;
    try {
      stream = await downloadMediaMessage(
        { key: { ...msg.key, id: msg.message.extendedTextMessage.contextInfo.stanzaId }, message: { imageMessage: imageMsg } },
        'buffer'
      );
    } catch (e) {
      return conn.sendMessage(from, { text: '❌ Failed to download image.' }, { quoted: msg });
    }

    // Set group profile picture
    try {
      await conn.updateProfilePicture(from, stream);
      await conn.sendMessage(from, { text: '✅ Group profile picture updated!' }, { quoted: msg });
    } catch (e) {
      await conn.sendMessage(from, { text: '❌ Failed to set group profile picture.' }, { quoted: msg });
    }
  }
};