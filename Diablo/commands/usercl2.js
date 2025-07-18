const fs = require('fs');
const path = require('path');

const claimedPath = path.join(__dirname, '..', 'data', 'claimed.json');
if (!fs.existsSync(claimedPath)) fs.writeFileSync(claimedPath, '{}');

function loadClaims() {
  return JSON.parse(fs.readFileSync(claimedPath));
}

module.exports = {
  name: 'usercl',
  aliases: ['ucl', 'viewcl'],
  description: 'View someone else’s claimed card collection',
  run: async (msg, { conn, args }) => {
    const chatId = msg.key.remoteJid;

    // Identify the target user from reply or mention
    let targetId =
      msg.message?.extendedTextMessage?.contextInfo?.participant || 
      (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [])[0];

    if (!targetId) {
      return conn.sendMessage(chatId, {
        text: '❌ Usage: *.usercl @user* or reply to their message.'
      }, { quoted: msg });
    }

    const claims = loadClaims();
    const userCards = claims[targetId];

    if (!userCards || Object.keys(userCards).length === 0) {
      return conn.sendMessage(chatId, {
        text: `❌ That user has no cards in their collection.`
      }, { quoted: msg });
    }

    let index = 1;
    const list = Object.values(userCards).map(card => {
      return `#${index++}. ${card.name} | 💎 Tier: ${card.tier} `;
    }).join('\n');

    return conn.sendMessage(chatId, {
      text:
        `📦 *Collection for @${targetId.split('@')[0]}*\n\n` +
        list,
      mentions: [targetId]
    }, { quoted: msg });
  }
};
