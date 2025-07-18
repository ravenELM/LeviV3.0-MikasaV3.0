// commands/owner-unban.js
const { unbanUser, isBanned } = require('../utils/bans');
const { ownerIDs, mods }      = require('../config');

module.exports = {
  name : 'unban',
  desc : 'Un‑ban a previously banned user',
  aliases : [],
  async run (msg, { conn }) {
    const sender  = msg.key.participant || msg.key.remoteJid;

    if (![...ownerIDs, ...mods].includes(sender))
      return conn.sendMessage(msg.key.remoteJid,
        { text: '*⁺‧₊˚ ཐི⋆This command is for my esteemed creator only. How exclusive!⋆ཋྀ ˚₊‧⁺*' },
        { quoted: msg });

    const mention = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid ?? [];
    const target  = mention[0] || msg.message?.conversation?.trim() || '';

    if (!target)
      return conn.sendMessage(msg.key.remoteJid,
        { text: '⚠️ Use `.unban @user` or reply to user.' },
        { quoted: msg });

    const jid = target.includes('@') ? target : `${target}@s.whatsapp.net`;
    if (!isBanned(jid))
      return conn.sendMessage(msg.key.remoteJid,
        { text: '🟢 User is not banned.' },
        { quoted: msg });

    unbanUser(jid);
    conn.sendMessage(msg.key.remoteJid,
      { text: `✅ User @${jid.split('@')[0]} has been *unbanned*.`, mentions: [jid] },
      { quoted: msg });
  }
};
