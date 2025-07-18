const bans = require('../utils/bans');

module.exports = {
  name: 'banlist',
  aliases: ['banned', 'banlist'],
  desc: 'Show the list of banned users (owner only).',
  ownerOnly: true,
  async run(m, { conn, ownerIDs }) {
    const chatId = m.key.remoteJid;
    const senderId = (m.key.participant || chatId).split(':')[0];

    if (!ownerIDs.includes(senderId)) {
      return conn.sendMessage(chatId, {
        text: '*⁺‧₊˚ ཐི⋆This command is for my esteemed creator only. How exclusive!⋆ཋྀ ˚₊‧⁺*'
      }, { quoted: m });
    }

    const bannedData = bans.getAll();
    const entries = Object.entries(bannedData);

    if (!entries.length) {
      return conn.sendMessage(chatId, {
        text: '✅ No users are currently banned.'
      }, { quoted: m });
    }

    const list = entries.map(([jid, data], i) => {
      const bannedByName = data.bannedBy?.split('@')[0] || 'unknown';
      const date = new Date(data.timestamp).toLocaleString();
      return `${i + 1}. @${jid.split('@')[0]}\n   📝 Reason: ${data.reason}\n   👮 Banned by: @${bannedByName}\n   🕒 At: ${date}`;
    }).join('\n\n');

    // Mention banned users and those who banned them
    const mentions = entries.flatMap(([jid, data]) => [jid, data.bannedBy]);

    await conn.sendMessage(chatId, {
      text: `🚫 *Banned Users List:*\n\n${list}`,
      mentions
    }, { quoted: m });
  }
};
