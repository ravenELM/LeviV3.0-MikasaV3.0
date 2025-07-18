const fs            = require('fs');
const path          = require('path');
const { ownerIDs, mods } = require('../config');

const STORE = path.join(__dirname, '..', 'data', 'allowedGambleGroup.json');
fs.mkdirSync(path.dirname(STORE), { recursive: true });

module.exports = {
  name       : 'ongamble',
  aliases    : ['enablegamble', 'act-gamble2'],
  description: 'Enable the .gamble command in **this** group (owner / mods only)',

  async run (msg, { conn }) {
    const from   = msg.key.remoteJid;                     // group id
    const sender = msg.key.participant || msg.key.remoteJid;

    if (!from.endsWith('@g.us'))
      return conn.sendMessage(from,
        { text: '⚠️  Use this inside the group you want to enable gambling in.' },
        { quoted: msg });

    if (![...ownerIDs, ...mods].includes(sender))
      return conn.sendMessage(from,
        { text: '*⁺‧₊˚ ཐི⋆This command is for my esteemed creator only. How exclusive!⋆ཋྀ ˚₊‧⁺*' },
        { quoted: msg });

    fs.writeFileSync(
      STORE,
      JSON.stringify({ enabled: true, groupId: from }, null, 2)
    );

    // Fetch all group participants for hidetag
    const groupMeta = await conn.groupMetadata(from);
    const allMembers = groupMeta.participants.map(p => p.id);

    await conn.sendMessage(from,
      {
        text: '✅  Gambling has been *ENABLED* in this group.',
        mentions: allMembers // hidetag everyone
      },
      { quoted: msg }
    );
  }
};