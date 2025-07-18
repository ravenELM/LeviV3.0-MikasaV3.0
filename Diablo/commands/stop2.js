const config = require('../config');

module.exports = {
  name: 'stop',
  aliases: ['botoff'],
  description: 'Owner only: stop the bot process (usage: .bot off)',

  async run(msg, { conn, args }) {
    const sender = msg.key.participant || msg.key.remoteJid;

    if (!config.ownerIDs.includes(sender)) {
      return conn.sendMessage(msg.key.remoteJid, { text: '*⁺‧₊˚ ཐི⋆This command is for my esteemed creator only. How exclusive!⋆ཋྀ ˚₊‧⁺*' }, { quoted: msg });
    }

    if (args.length === 1 && args[0].toLowerCase() === 'off') {
      await conn.sendMessage(msg.key.remoteJid, { text: '🛑 Bot is shutting down...' }, { quoted: msg });
      process.exit(0);  // stops the Node.js process
    } else {
      await conn.sendMessage(msg.key.remoteJid, { text: '❌ Invalid usage. Use `.bot off` to stop the bot.' }, { quoted: msg });
    }
  }
};
