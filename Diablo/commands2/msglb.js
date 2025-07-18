const msgCounter = require('../utils/msgCounter');

module.exports = {
  name: 'msglb',
  aliases: ['mesgleaderboard', 'msgboard'],
  description: 'Global message leaderboard (top 10)',

  /** @param {import('@whiskeysockets/baileys').proto.WebMessageInfo} msg */
  async run(msg, { conn }) {
    const chatId   = msg.key.remoteJid;
    const top = msgCounter.top(10);        // [{jid,count}, …]

    if (top.length === 0)
      return conn.sendMessage(chatId,
        { text: 'No data yet – start chatting first!' }, { quoted: msg });

    const lines = top.map((u, i) =>
      `*${i + 1}. @${u.jid.split('@')[0]}*  —  ${u.count} msg${u.count !== 1 ? 's' : ''}`
    ).join('\n');

    const text =
`🏆 *Global Message Leaderboard* 🏆

${lines}

_Total users tracked: ${Object.keys(require('../utils/msgCounter').top(Infinity)).length}_`;

    const mentions = top.map(u => u.jid);
    await conn.sendMessage(chatId, { text, mentions }, { quoted: msg });
  }
};
