// commands/listgc.js
module.exports = {
  name: 'listgc',
  aliases: ['groups', 'gclist'],
  description: 'Show all groups the bot is participating in',

  async run(msg, { conn }) {
    const chatId = msg.key.remoteJid;

    // Fetch metadata for all joined groups
    const groups = await conn.groupFetchAllParticipating(); // returns { jid: metadata }
    const list   = Object.values(groups)
                  .sort((a, b) => a.subject.localeCompare(b.subject));

    if (!list.length) {
      return conn.sendMessage(chatId, { text: '🤖 I am not in any groups!' }, { quoted: msg });
    }

    // Build message
    let text = '📜 *Groups I\'m in:*\n─────────────────\n';
    list.forEach((g, i) => {
      const count = g.participants?.length || 0;
      text += `${i + 1}. ${g.subject}  _(${count} members)_\n`;
    });

    await conn.sendMessage(chatId, { text }, { quoted: msg });
  }
};
