// commands/deleteclan.js
const clans = require('../db/clans');
const fs    = require('fs');
const path  = require('path');

module.exports = {
  name: 'deleteclan',
  description: 'Delete your clan (owner only)',

  async run(msg, { conn }) {
    const chat = msg.key.remoteJid;
    const me   = msg.key.participant || chat;
    const clan = clans.clanOf(me);

    if (!clan)
      return conn.sendMessage(chat, { text: '❌ You are not in a clan.' }, { quoted: msg });

    if (clan.owner !== me)
      return conn.sendMessage(chat, { text: '❌ Only the clan owner can delete the clan.' }, { quoted: msg });

    // Remove clan
    const all = clans.allClans();
    delete all[clan.id];

    // Save changes
    fs.writeFileSync(
      path.join(process.cwd(), 'data', 'clans.json'),
      JSON.stringify(all, null, 2)
    );

    // Delete logo if present
    if (clan.logo && fs.existsSync(clan.logo)) {
      try { fs.unlinkSync(clan.logo); } catch {}
    }

    return conn.sendMessage(chat, {
      text: `🗑️ Clan *${clan.name}* has been deleted successfully.`,
    }, { quoted: msg });
  }
};
