const { banUser, isBanned } = require('../utils/bans');
const { ownerIDs, mods } = require('../config');

module.exports = {
  name: 'ban',
  desc: 'Ban a user from using commands',
  aliases: [],
  async run(msg, { conn }) {
    const sender = msg.key.participant || msg.key.remoteJid;

    // Check owner/mod
    if (![...ownerIDs, ...mods].includes(sender)) {
      return conn.sendMessage(msg.key.remoteJid, {
        text: '*⁺‧₊˚ ཐི⋆This command is for my esteemed creator only. How exclusive!⋆ཋྀ ˚₊‧⁺*'
      }, { quoted: msg });
    }

    // Get mentioned user
    const mention = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid ?? [];
    const target = mention[0] || msg.message?.conversation?.trim() || '';

    if (!target) {
      return conn.sendMessage(msg.key.remoteJid, {
        text: '⚠️ Use `.ban @user reason` or reply to a user.'
      }, { quoted: msg });
    }

    const jid = target.includes('@') ? target : `${target}@s.whatsapp.net`;

    if (isBanned(jid)) {
      return conn.sendMessage(msg.key.remoteJid, {
        text: '🚫 User is already banned.'
      }, { quoted: msg });
    }

    // Get reason
    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
    const parts = text.trim().split(/\s+/);
    const reasonIndex = mention.length ? 2 : 1;
    const reason = parts.slice(reasonIndex).join(' ') || 'No reason provided';

    banUser(jid, reason, sender);

    conn.sendMessage(msg.key.remoteJid, {
      text: `✅ User @${jid.split('@')[0]} has been *banned*.\n\n📝 Reason: ${reason}\n👮 Banned by: @${sender.split('@')[0]}`,
      mentions: [jid, sender]
    }, { quoted: msg });
  }
};
