const fs = require('fs');
const path = require('path');

const PREFIX_FILE = path.join(__dirname, '..', 'data', 'prefix.json');

function savePrefix(prefix) {
  fs.writeFileSync(PREFIX_FILE, JSON.stringify({ prefix }, null, 2));
}

function loadPrefix() {
  try {
    return JSON.parse(fs.readFileSync(PREFIX_FILE)).prefix || '.';
  } catch {
    return '.';
  }
}

module.exports = {
  name: 'prefix',
  aliases: ['prefix'],
  description: 'Change the bot command prefix (owner only)',
  async run(msg, { conn, args, ownerIDs }) {
    const sender = msg.key.participant || msg.key.remoteJid;
    if (!ownerIDs.includes(sender)) {
      return conn.sendMessage(msg.key.remoteJid, { text: '*⁺‧₊˚ ཐི⋆This command is for my esteemed creator only. How exclusive!⋆ཋྀ ˚₊‧⁺*' }, { quoted: msg });
    }
    const newPrefix = args[0];
    if (!newPrefix || newPrefix.length > 3) {
      return conn.sendMessage(msg.key.remoteJid, { text: '❌ Usage: .setprefix <symbol/word> (max 3 chars)' }, { quoted: msg });
    }
    savePrefix(newPrefix);
    global.BOT_PREFIX = newPrefix;
    await conn.sendMessage(msg.key.remoteJid, { text: `✅ Prefix changed to: *${newPrefix}*` }, { quoted: msg });
  }
};