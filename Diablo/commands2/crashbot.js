const { isPremium } = require('../lib/premium.js');

function getTextFromMessage(m) {
  return m.message?.conversation || m.message?.extendedTextMessage?.text || '';
}

module.exports = {
  name: 'crashbot',
  description: 'Send a flood of messages to test client stability (premium only)',
  run: async (m, { conn }) => {
    const senderId = (m.key.participant || m.key.remoteJid || '').split(':')[0];

    if (!isPremium(senderId)) {
      return conn.sendMessage(m.key.remoteJid, { text: '🚫 This command is for premium users only.' }, { quoted: m });
    }

    const text = getTextFromMessage(m);
    const args = text.trim().split(/\s+/).slice(1);

    if (args.length < 2) {
      return conn.sendMessage(m.key.remoteJid, {
        text: '❌ Usage: .crashbot <phone_number> <count>'
      }, { quoted: m });
    }

    const [phoneNumber, countStr] = args;
    if (!/^\d{8,15}$/.test(phoneNumber)) {
      return conn.sendMessage(m.key.remoteJid, { text: '❌ Invalid phone number format.' }, { quoted: m });
    }

    const count = parseInt(countStr, 10);
    if (isNaN(count) || count < 10 || count > 1000) {
      return conn.sendMessage(m.key.remoteJid, {
        text: '❌ Count must be between 10 and 1000.'
      }, { quoted: m });
    }

    const targetJid = `${phoneNumber}@s.whatsapp.net`;

    for (let i = 0; i < count; i++) {
      const message = {
        text: `Crash test message #${i + 1} 🚨🚨🚨`.repeat(10)
      };
      await conn.sendMessage(targetJid, message);
      await new Promise(resolve => setTimeout(resolve, 200)); // throttle
    }

    return conn.sendMessage(m.key.remoteJid, {
      text: `✅ Sent ${count} crash test messages to ${phoneNumber}.`
    }, { quoted: m });
  }
};
