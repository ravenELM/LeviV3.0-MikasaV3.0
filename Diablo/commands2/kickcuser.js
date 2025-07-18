// commands/kickcuser.js
const fs   = require('fs');
const path = require('path');
const DB   = path.join(process.cwd(), 'data', 'clans.json');

function loadClans ()  { return JSON.parse(fs.readFileSync(DB)); }
function saveClans (d) { fs.writeFileSync(DB, JSON.stringify(d, null, 2)); }

module.exports = {
  name: 'kickcuser',
  aliases: ['ckick'],
  description: 'Kick a member from your clan (owner or vice)',

  async run (msg, { conn }) {
    const chat   = msg.key.remoteJid;
    const me     = msg.key.participant || chat;
    const mention= msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

    if (mention.length === 0)
      return conn.sendMessage(chat,
        { text: '❌ Tag the user you want to kick.\nExample: *.kickcuser @user*' },
        { quoted: msg });

    const target = mention[0];

    /* ─ find clan ─ */
    const all = loadClans();
    const clan = Object.values(all).find(c => c.members.includes(me));

    if (!clan)
      return conn.sendMessage(chat, { text: '❌ You are not in any clan.' }, { quoted: msg });

    /* ─ permission ─ */
    if (clan.owner !== me && (!clan.vices || !clan.vices.includes(me)))
      return conn.sendMessage(chat, { text: '⛔ Only owner / vice can kick members.' }, { quoted: msg });

    if (!clan.members.includes(target))
      return conn.sendMessage(chat, { text: '❌ That user is not in your clan.' }, { quoted: msg });

    if (target === clan.owner)
      return conn.sendMessage(chat, { text: '❌ You cannot kick the owner.' }, { quoted: msg });

    /* ─ kick ─ */
    clan.members = clan.members.filter(u => u !== target);
    if (clan.vices) clan.vices = clan.vices.filter(u => u !== target);
    saveClans(all);

    return conn.sendMessage(chat, {
      text: `🚪 @${target.split('@')[0]} has been kicked from clan *${clan.name}*.`,
      mentions: [target]
    }, { quoted: msg });
  }
};
