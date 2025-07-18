const { isPremium } = require('../lib/premium.js');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  name: 'hackreact',
  description: 'Spam react 🐛 to a replied message multiple times (premium only)',
  run: async (m, { conn, prefix, command }) => {
    const senderId = (m.key.participant || m.key.remoteJid || '').split(':')[0];
    if (!isPremium(senderId)) {
      return conn.sendMessage(m.chat, { text: '🚫 This command is for premium users only.' }, { quoted: m });
    }

    if (!m.quoted) {
      return conn.sendMessage(m.chat, { text: `❌ Please reply to a message.\nExample: ${prefix + command} 555` }, { quoted: m });
    }

    const args = m.text.trim().split(/\s+/).slice(1);
    if (args.length === 0) {
      return conn.sendMessage(m.chat, { text: `❌ Specify how many reacts you want.\nExample: ${prefix + command} 555` }, { quoted: m });
    }

    let amount = parseInt(args[0]);
    if (isNaN(amount) || amount <= 0) {
      return conn.sendMessage(m.chat, { text: '❌ Please provide a valid positive number.' }, { quoted: m });
    }

    if (amount > 1000) amount = 1000;

    const quotedKey = m.quoted.key;
    if (!quotedKey || !quotedKey.id || !quotedKey.remoteJid) {
      return conn.sendMessage(m.chat, { text: '❌ The replied message key is invalid.' }, { quoted: m });
    }

    // Properly build the reaction key
    let reactionKey = {
      remoteJid: quotedKey.remoteJid,
      id: quotedKey.id,
      fromMe: quotedKey.fromMe,
    };
    if (quotedKey.participant) reactionKey.participant = quotedKey.participant;

    await conn.sendMessage(m.chat, { text: `🪲 Sending ${amount} bug reacts...` }, { quoted: m });

    for (let i = 0; i < amount; i++) {
      try {
        await conn.sendMessage(m.chat, {
          react: {
            text: '🐛',
            key: reactionKey
          }
        });
        await sleep(200);
      } catch (error) {
        console.error('Error sending react:', error);
        break;
      }
    }

    await conn.sendMessage(m.chat, { text: `✅ Finished sending ${amount} bug reacts!` }, { quoted: m });
  }
};
