const { ownerNumber, supportGroupLinks = [] } = require('../config');

const norm = jid => jid.split(':')[0];

module.exports = {
  name: 'support',
  aliases: ['info'],
  description: 'Send owner and support group info via DM, then notify in group',

  async run(msg, { conn }) {
    const from = msg.key.remoteJid;
    const sender = norm(msg.key.participant || msg.key.remoteJid);
    const userJid = sender.endsWith('@s.whatsapp.net') ? sender : `${sender}@s.whatsapp.net`;

    const lines = [
      `📞 *Owner:* wa.me/${ownerNumber.replace(/[^0-9]/g, '')}`,
      '\n👥 Support Group Links:\n\n' +
      '🪐 𝕽𝖆𝖛𝖊𝖓 𝔅𝔬𝔱𝔰 🫧: https://tinyurl.com/bdeztsjt\n\n' +
      '🪙 𝕽𝖆𝖛𝖊𝖓 𝔅𝔬𝔱𝔰 ℭ𝔞𝔰𝔦𝔫𝔬 🎰: https://tinyurl.com/2hffahu2\n\n' +
      '🫧 𝕽𝖆𝖛𝖊𝖓 𝔅𝔬𝔱𝔰 𝔖𝔲𝔭𝔭𝔬𝔯𝔱🦩: https://tinyurl.com/5cfrapju',
      ...supportGroupLinks.map((link, i) => `${i + 1}. ${link}`)
    ];

    const supportText = lines.join('\n');

    try {
      // Send DM
      await conn.sendMessage(userJid, { text: supportText });

      // Notify in group
      if (from.endsWith('@g.us')) {
        await conn.sendMessage(from, { text: '📬 Check your DMs, Baka!' }, { quoted: msg });
      }
    } catch (err) {
      console.error('support ➤ DM failed:', err);
      await conn.sendMessage(from, { text: '❌ I couldn’t send you a DM. Check your privacy settings.' }, { quoted: msg });
    }
  }
};
