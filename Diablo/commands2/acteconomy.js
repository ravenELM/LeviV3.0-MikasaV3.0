const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'acteconomy',
  aliases: [],
  description: 'Activate economy in this group (owner only)',

  async run(msg, { conn, ownerIDs }) {
    const sender = msg.key.participant || msg.key.remoteJid;
    const from = msg.key.remoteJid;

    if (!ownerIDs.includes(sender)) {
      return conn.sendMessage(from, {
        text: '*⁺‧₊˚ ཐི⋆This command is for my esteemed creator only. How exclusive!⋆ཋྀ ˚₊‧⁺*'
      }, { quoted: msg });
    }

    // Use the data folder path here:
    const file = path.join(__dirname, '..', 'data', 'economy-groups.json');

    let groups = [];
    try {
      groups = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (e) {
      groups = [];
    }

    if (groups.includes(from)) {
      return conn.sendMessage(from, {
        text: '✅ This group is already activated for economy.'
      }, { quoted: msg });
    }

    groups.push(from);
    fs.writeFileSync(file, JSON.stringify(groups, null, 2), 'utf8');

    return conn.sendMessage(from, {
      text: '✅ Economy activated for this group!'
    }, { quoted: msg });
  }
};
