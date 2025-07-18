const { addPremium } = require('../lib/premium');
const { ownerIDs, mods } = require('../config');

module.exports = {
  name: 'addprem',
  run: async (m, { conn, args }) => {
    const sender = (m.key.participant || m.key.remoteJid || '').split(':')[0];

    if (![...ownerIDs, ...mods].includes(sender)) {
      return conn.sendMessage(m.key.remoteJid, {
        text: '🚫 Only owners and mods can use this command.'
      }, { quoted: m });
    }

    // Get mentioned JID(s) from context or args fallback
    let userId = null;

    // Check if replying to a message
    if (m.message?.extendedTextMessage?.contextInfo?.participant) {
      userId = m.message.extendedTextMessage.contextInfo.participant;
    }
    // Or get mentioned JIDs in message
    else if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
      userId = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
    }
    // Or fallback to args
    else if (args[0]) {
      userId = args[0].includes('@') ? args[0] : `${args[0]}@s.whatsapp.net`;
    }

    if (!userId) {
      return conn.sendMessage(m.key.remoteJid, {
        text: '❌ Please reply to a user or mention their ID, or provide user ID as argument.'
      }, { quoted: m });
    }

    if (addPremium(userId)) {
      return conn.sendMessage(m.key.remoteJid, {
        text: `✅ Added @${userId.split('@')[0]} to premium.`,
        mentions: [userId]
      }, { quoted: m });
    } else {
      return conn.sendMessage(m.key.remoteJid, {
        text: `⚠️ User @${userId.split('@')[0]} is already premium.`,
        mentions: [userId]
      }, { quoted: m });
    }
  }
};
