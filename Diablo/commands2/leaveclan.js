// commands/leaveclan.js
const fs   = require('fs');
const path = require('path');
const DB   = path.join(process.cwd(), 'data', 'clans.json');

function loadClans ()  { return JSON.parse(fs.readFileSync(DB)); }
function saveClans (d) { fs.writeFileSync(DB, JSON.stringify(d, null, 2)); }

module.exports = {
  name: 'leaveclan',
  description: 'Leave the clan you are in',

  async run (msg, { conn }) {
    const chat   = msg.key.remoteJid;
    const me     = msg.key.participant || chat;

    const all = loadClans();
    const clan = Object.values(all).find(c => c.members.includes(me));

    if (!clan)
      return conn.sendMessage(chat, { text: '❌ You are not in any clan.' }, { quoted: msg });

    /* ─ owner tries to leave ───────────────────────────── */
    if (clan.owner === me) {
      if (clan.members.length > 1)
        return conn.sendMessage(chat, {
          text: '❌ You’re the owner. Transfer ownership or delete the clan first.'
        }, { quoted: msg });

      // the owner is also the only member → delete clan
      delete all[clan.id];
      saveClans(all);
      return conn.sendMessage(chat,
        { text: `🗑️ Clan *${clan.name}* deleted because you were the last member.` },
        { quoted: msg });
    }

    /* ─ normal member leaves ───────────────────────────── */
    clan.members = clan.members.filter(u => u !== me);
    saveClans(all);

    return conn.sendMessage(chat,
      { text: `🏳️ You have left clan *${clan.name}*.` },
      { quoted: msg });
  }
};
