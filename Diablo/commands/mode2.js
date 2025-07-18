const config = require('../config');

module.exports = {
  name: 'mode',
  desc: 'Change bot mode (owner only)',
  async run(m, { conn, args }) {
    const chatId = m.key.remoteJid;
    const senderId = (m.key.participant || chatId).split(':')[0];

    if (!config.ownerIDs.includes(senderId)) {
      return conn.sendMessage(chatId, {
        text: '*⁺‧₊˚ ཐི⋆This command is for my esteemed creator only. How exclusive!⋆ཋྀ ˚₊‧⁺*'
      }, { quoted: m });
    }

    const newMode = args[0]?.toLowerCase();
    if (!['public', 'owner', 'team'].includes(newMode)) {
      return conn.sendMessage(chatId, {
        text: '❌ Usage: .mode <public|owner|team>'
      }, { quoted: m });
    }

    config.setMode(newMode);

    return conn.sendMessage(chatId, {
      text: `✅ Bot mode set to *${newMode.toUpperCase()}*`
    }, { quoted: m });
  }
};
