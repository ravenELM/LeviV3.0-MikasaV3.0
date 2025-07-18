const fs = require('fs');
const path = require('path');

const claimedPath = path.join(__dirname, '..', 'data', 'claimed.json');
if (!fs.existsSync(claimedPath)) fs.writeFileSync(claimedPath, '{}');

function loadClaims() {
  return JSON.parse(fs.readFileSync(claimedPath));
}

module.exports = {
  name: 'collection',
  aliases: ['cl'],
  run: async (msg, { conn }) => {
    try {
      const chatId = msg.key.remoteJid;
      const senderId = msg.key.participant || msg.key.remoteJid;

      const claims = loadClaims();

      if (!claims[senderId] || Object.keys(claims[senderId]).length === 0) {
        return await conn.sendMessage(chatId, { text: '❌ You have no claimed cards yet.' }, { quoted: msg });
      }

      const userCards = Object.values(claims[senderId]);
      const total = userCards.length;

      let text = `🃏 *Your Card Collection:* 🃏\n`;
      text += `📦 Total Cards: *${total}*\n\n`;

      userCards.forEach((card, idx) => {
        text += `${idx + 1}. *${card.name}* \n   💎 ${card.tier}\n`;
      });

      await conn.sendMessage(chatId, {
        text,
        mentions: [senderId],
        contextInfo: {
          externalAdReply: {
            mediaType: 1,
            title: "Your Collection",
          }
        }
      }, { quoted: msg });
    } catch (error) {
      console.error('❌ collection error', error);
      if (msg.key && msg.key.remoteJid) {
        try {
          await conn.sendMessage(msg.key.remoteJid, { text: '❌ An error occurred while fetching your collection.' }, { quoted: msg });
        } catch {}
      }
    }
  }
};
