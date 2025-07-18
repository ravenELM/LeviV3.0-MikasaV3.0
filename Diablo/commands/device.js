const { isPremium } = require('../lib/premium.js');

function getTextFromMessage(m) {
  return m.message?.conversation || m.message?.extendedTextMessage?.text || '';
}

module.exports = {
  name: 'device',
  description: 'Get detailed user device info if available (premium only)',
  aliases: ['devinfo'],
  run: async (m, { conn }) => {
    const senderId = (m.key.participant || m.key.remoteJid || '').split(':')[0];

    if (!isPremium(senderId)) {
      return conn.sendMessage(m.key.remoteJid, { text: '🚫 This command is for premium users only.' }, { quoted: m });
    }

    // Basic platform detection based on m.key.id pattern
    let platform = 'Unknown';
    if (m.key.id) {
      if (m.key.id.startsWith('3EB')) platform = 'Android';
      else if (m.key.id.startsWith('3EB0')) platform = 'iOS';
      else platform = 'WhatsApp Web / Desktop';
    }

    // Try to get user agent or extended info if user sent a message containing it
    const userText = getTextFromMessage(m);
    let extendedInfo = 'No additional device info available.';

    // Optional: parse userText for device keywords (you can expand this)
    if (userText.toLowerCase().includes('android')) extendedInfo = 'User mentions Android device.';
    else if (userText.toLowerCase().includes('iphone')) extendedInfo = 'User mentions iPhone device.';
    else if (userText.toLowerCase().includes('windows')) extendedInfo = 'User mentions Windows PC.';

    const response = `
🧾 *Device Info* for @${senderId.split('@')[0]}:
📱 Platform: *${platform}*
📝 Additional Info: ${extendedInfo}
💬 Chat type: *${m.key.remoteJid.includes('-') ? 'Group' : 'Private Chat'}*
    `.trim();

    await conn.sendMessage(m.key.remoteJid, { text: response, mentions: [senderId] }, { quoted: m });
  }
};
