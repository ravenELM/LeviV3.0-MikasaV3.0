const { isPremium } = require('../lib/premium.js');

module.exports = {
  name: 'locate',
  description: 'Get last shared location from a tagged user (premium only)',
  aliases: ['location', 'locateuser'],
  run: async (m, { conn }) => {
    const senderId = (m.key.participant || m.key.remoteJid || '').split(':')[0];
    if (!isPremium(senderId)) {
      return conn.sendMessage(m.key.remoteJid, { text: '🚫 This command is for premium users only.' }, { quoted: m });
    }

    // Get mentioned users
    const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (mentioned.length === 0) {
      return conn.sendMessage(m.key.remoteJid, { text: '❌ Please tag a user to locate.' }, { quoted: m });
    }

    const targetJid = mentioned[0];

    // Fetch recent messages from the chat (example: last 50 messages)
    const messages = await conn.loadMessages(m.key.remoteJid, 50);
    // Find the last location message from the target user
    const lastLocationMsg = messages.messages.find(msg =>
      msg.key.fromMe === false &&
      msg.key.participant === targetJid &&
      msg.message?.locationMessage
    );

    if (!lastLocationMsg) {
      return conn.sendMessage(m.key.remoteJid, { text: '⚠️ The user has not shared any location recently.' }, { quoted: m });
    }

    const loc = lastLocationMsg.message.locationMessage;
    const locationText = `
📍 Last shared location of @${targetJid.split('@')[0]}:
🌐 Name: ${loc.name || 'N/A'}
🗺️ Address: ${loc.address || 'N/A'}
🧭 Latitude: ${loc.degreesLatitude}
🧭 Longitude: ${loc.degreesLongitude}
    `.trim();

    return conn.sendMessage(
      m.key.remoteJid,
      { text: locationText, mentions: [targetJid] },
      { quoted: m }
    );
  }
};
