const fs = require('fs');
const path = require('path');
const warnFile = path.resolve('data/warns.json');

function loadWarns() {
  if (!fs.existsSync(warnFile)) return {};
  try {
    return JSON.parse(fs.readFileSync(warnFile, 'utf8'));
  } catch {
    return {};
  }
}

const norm = jid => (jid || '').split(':')[0].replace(/[^0-9]/g, '');

module.exports = {
  name: 'checkwarn',
  aliases: ['warns', 'warnings'],
  description: 'Check warnings for a user.',
  run: async (msg, { conn, args }) => {
    const warnsData = loadWarns();

    let userId = msg.key.participant || msg.key.remoteJid;
    if (args.length > 0) {
      userId = args[0];
      if (!userId.includes('@')) userId += '@s.whatsapp.net';
    }

    const userNorm = norm(userId);

    const warns = Array.isArray(warnsData[userNorm]) ? warnsData[userNorm] : [];

    if (warns.length === 0) {
      await conn.sendMessage(msg.key.remoteJid, { 
        text: `No warnings found for @${userNorm}.`,
        mentions: [userId]
      }, { quoted: msg });
      return;
    }

    let reply = `There are total ${warns.length} warning(s) for @${userNorm}.\n`;

    warns.forEach((w, i) => {
      const timeStr = new Date(w.time).toLocaleString();
      reply += `
${i + 1}
╭─────────────◆
│ 🍁 In Group: ${w.groupId}
│ 🔰 Time: ${timeStr}
│ ⚠️ Warned by: ${w.warnedBy || 'Automatic'}
│ 📍 Reason: ${w.reason}
╰─────────────◆
`;
    });

    await conn.sendMessage(msg.key.remoteJid, { text: reply, mentions: [userId] }, { quoted: msg });
  }
};
