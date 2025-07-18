const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'userclogs',
  description: 'Show money logs for all users',
  ownerOnly: true,
  run: async (m, { conn }) => {
    const econFile = path.join(__dirname, '../datamoney/economy.json');
    let economy;

    try {
      const raw = fs.readFileSync(econFile, 'utf8');
      economy = JSON.parse(raw);

      if (typeof economy !== 'object' || economy === null) {
        return await conn.sendMessage(m.key.remoteJid, { text: '❌ Economy data is invalid.' }, { quoted: m });
      }
    } catch (e) {
      return await conn.sendMessage(m.key.remoteJid, { text: '❌ Failed to read economy data.' }, { quoted: m });
    }

    if (Object.keys(economy).length === 0) {
      return await conn.sendMessage(m.key.remoteJid, { text: '⚠️ No users found in economy data.' }, { quoted: m });
    }

    // Build output text
    let text = '*User Money Logs:*\n\n';
    for (const [userId, money] of Object.entries(economy)) {
      text += `• ${userId}: ${money} coins\n`;
    }

    await conn.sendMessage(m.key.remoteJid, { text }, { quoted: m });
  }
};
