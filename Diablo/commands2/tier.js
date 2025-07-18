const fs = require('fs');
const path = require('path');

const claimedPath = path.join(__dirname, '..', 'data', 'claimed.json');
if (!fs.existsSync(claimedPath)) fs.writeFileSync(claimedPath, '{}');

function loadClaims() {
  return JSON.parse(fs.readFileSync(claimedPath));
}

module.exports = {
  name: 'tier',
  description: 'View all your cards of a specific tier. Usage: .tier <1–6|S>',

  run: async (msg, { conn, args }) => {
    const chatId = msg.key.remoteJid;
    const userId = (msg.key.participant || chatId).split(':')[0];

    let tierArg = args[0]?.toUpperCase();
    if (!tierArg) {
      return conn.sendMessage(chatId, {
        text: '❌ Usage: .tier <tier number 1-6 or S>\nExample: *.tier 3* or *.tier S*',
      }, { quoted: msg });
    }

    // Normalize input: remove leading "T" if present
    tierArg = tierArg.replace(/^T/, '');

    const validTiers = ['1', '2', '3', '4', '5', '6', 'S'];
    if (!validTiers.includes(tierArg)) {
      return conn.sendMessage(chatId, {
        text: '❌ Invalid tier. Use 1-6 or S.\nExample: *.tier 3* or *.tier S*',
      }, { quoted: msg });
    }

    const tierTag = tierArg === 'S' ? 'TS' : `T${tierArg}`;

    const claims = loadClaims();
    const userCards = claims[userId] || {};

    const filtered = Object.entries(userCards).filter(([_, card]) => {
      return (card.tier || '').toUpperCase() === tierTag;
    });

    if (!filtered.length) {
      return conn.sendMessage(chatId, {
        text: `❌ You don't have any cards in Tier ${tierTag}.`,
      }, { quoted: msg });
    }

    let message = `🎴 *Your Tier ${tierTag} Cards* — Total: ${filtered.length}\n\n`;

    for (const [_, card] of filtered) {
      message += `🌟 *${card.name}*\n💰 $${(card.price || 0).toLocaleString()}\n\n`;
    }

    await conn.sendMessage(chatId, {
      text: message.trim(),
    }, { quoted: msg });
  }
};
