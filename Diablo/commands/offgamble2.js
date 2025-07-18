const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../data/allowedGambleGroup.json');

// Disable gambling in current group
module.exports = {
  name: 'offgamble',
  aliases: ['deact-gambleallowed gamble group2'],
  description: 'Disable gambling in this group',
  async run(msg, { conn, args }) {
    const from = msg.key.remoteJid;
    if (!from.endsWith('@g.us')) {
      return conn.sendMessage(from, { text: '⚠️ This command can only be used in a group.' }, { quoted: msg });
    }

    const groupMeta = await conn.groupMetadata(from);
    const sender = msg.key.participant;
    const isAdmin = groupMeta.participants.some(p => p.id === sender && (p.admin === 'admin' || p.admin === 'superadmin'));

    if (!isAdmin) {
      return conn.sendMessage(from, { text: '*⁺‧₊˚ ཐི⋆This command is for my esteemed creator only. How exclusive!⋆ཋྀ ˚₊‧⁺*' }, { quoted: msg });
    }

    if (fs.existsSync(file)) fs.unlinkSync(file);

    await conn.sendMessage(from, { text: '✅ Gambling has been *DISABLED* in this group.' }, { quoted: msg });
  }
};
