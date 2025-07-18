const moment = require('moment-timezone');

module.exports = {
  name: 'info',
  aliases: ['ginfo'],
  description: 'Show information about this group',

  /**
   * @param {import('@whiskeysockets/baileys').proto.WebMessageInfo} msg
   * @param {{ conn: import('@whiskeysockets/baileys').WASocket }} ctx
   */
  async run(msg, { conn }) {
    const chatId = msg.key.remoteJid;

    if (!chatId.endsWith('@g.us')) {
      return conn.sendMessage(chatId, { text: '❌ This command only works in groups.' }, { quoted: msg });
    }

    const metadata = await conn.groupMetadata(chatId);
    const creationDate = metadata.creation
      ? moment(metadata.creation * 1000).tz('Asia/Kolkata').format('DD MMM YYYY, HH:mm')
      : 'Unknown';
    const creator = metadata.owner?.split('@')[0] || 'Unknown';

    const text = `
📄 *Group Info*
👥 Name: ${metadata.subject}
🧾 ID: ${metadata.id}
📆 Created: ${creationDate}
👑 Creator: @${creator}
👤 Participants: ${metadata.participants.length}
📝 Description: ${metadata.desc || 'No description'}
    `.trim();

    await conn.sendMessage(chatId, {
      text,
      mentions: [metadata.owner],
    }, { quoted: msg });
  }
};
