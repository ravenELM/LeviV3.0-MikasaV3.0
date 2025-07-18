const db = require('../db/economy');   // already exports getTop()

module.exports = {
  name     : 'leaderboard',
  aliases  : ['lb', 'top', 'rich'],
  desc     : 'Display the top‑15 richest users',
  groupOnly: false,

  async run (msg, { conn }) {
    const chatId = msg.key.remoteJid;
    const top = db.getTop(15);   // [{ id, wallet, … }, …]

    if (top.length === 0) {
      return conn.sendMessage(chatId,
        { text: '❌ No economy data yet, Baka!' }, { quoted: msg });
    }

    // Format WhatsApp number for display: @+CC NNNN NNNNN
    function formatNumber(jid) {
      const num = jid.replace(/[^0-9]/g, '');
      if (num.length < 8) return '@' + num;
      if (num.length === 12)
        return `@+${num.slice(0,2)} ${num.slice(2,7)} ${num.slice(7)}`;
      if (num.length === 13)
        return `@+${num.slice(0,3)} ${num.slice(3,6)} ${num.slice(6,9)} ${num.slice(9)}`;
      if (num.length === 10)
        return `@+${num.slice(0,5)} ${num.slice(5)}`;
      return `@+${num}`;
    }

    const medals = ['🥇','🥈','🥉'];
    const rows = top.map((u, i) => {
      const medal = medals[i] || '🔹';
      // Mention user using @<number> (WhatsApp mention)
      const mentionTag = `@${u.id.split('@')[0]}`;
      return `${medal} Rank ${i+1} \n👤 User: ${mentionTag} (${formatNumber(u.id)})\n🏆 Credits: ${u.wallet.toLocaleString()}\n`;
    }).join('\n');

    const text =
`${rows}
─────────────────────
🎯 Use: .leaderboard `;

    await conn.sendMessage(chatId, {
      text,
      mentions: top.map(u => u.id)
    }, { quoted: msg });
  }
};