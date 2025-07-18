const fs = require('fs');
const path = require('path');
const { ownerIDs = [], mods = [] } = require('../config'); // your owner and mod lists

const FILE = path.join(__dirname, '..', 'data', 'allowedcardgcs.json');

const norm = jid => (jid || '').split(':')[0];

module.exports = {
  name: 'actcards',
  aliases: [],
  run: async (m, { conn }) => {
    const groupId = m.key.remoteJid;
    const sender = m.key.participant || m.key.remoteJid;
    const senderNorm = norm(sender);

    if (!groupId.endsWith('@g.us')) {
      await conn.sendMessage(groupId, { text: '⚠️ This command can only be used in group chats.' }, { quoted: m });
      return;
    }

    // Only bot owner or mods allowed
    const owners = ownerIDs.map(norm);
    const moderators = mods.map(norm);
    if (!owners.includes(senderNorm) && !moderators.includes(senderNorm)) {
      await conn.sendMessage(groupId, { text: '🚫 Only the bot owner or mods can use this command.' }, { quoted: m });
      return;
    }

    let list = [];
    try {
      list = JSON.parse(fs.readFileSync(FILE, 'utf8'));
    } catch (e) {}

    if (!list.includes(groupId)) {
      list.push(groupId);
      fs.writeFileSync(FILE, JSON.stringify(list, null, 2));
      await conn.sendMessage(groupId, { text: '✅ This group has been activated for card spawns.' }, { quoted: m });
    } else {
      await conn.sendMessage(groupId, { text: '⚠️ This group is already activated.' }, { quoted: m });
    }
  }
};
