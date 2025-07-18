const fs = require('fs');
const path = require('path');

const claimedPath = path.join(__dirname, '..', 'data', 'claimed.json');
if (!fs.existsSync(claimedPath)) fs.writeFileSync(claimedPath, '{}');

function loadClaims() {
  return JSON.parse(fs.readFileSync(claimedPath));
}

function saveClaims(data) {
  fs.writeFileSync(claimedPath, JSON.stringify(data, null, 2));
}

module.exports = {
  name: 'tcard',
  aliases: ['tcard'],
  description: 'Transfer a card from your collection to another user. Use by tagging or replying.\nUsage: .transfercard <card_number> @user',

  run: async (msg, { conn, args }) => {
    const chatId = msg.key.remoteJid;
    const senderId = (msg.key.participant || chatId).split(':')[0];

    const cardIndex = parseInt(args[0], 10) - 1;

    // Get target from reply or mention
    let targetId = null;

    // Prioritize reply
    const isReply = msg.message?.extendedTextMessage?.contextInfo?.participant;
    if (isReply) {
      targetId = msg.message.extendedTextMessage.contextInfo.participant;
    }

    // Fallback to mention
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (!targetId && mentioned.length > 0) {
      targetId = mentioned[0];
    }

    if (isNaN(cardIndex) || !targetId) {
      return conn.sendMessage(chatId, {
        text: '❌ Usage: *.transfercard <card_number> @user* or reply to user\nExample: *.transfercard 1* (replying to user)'
      }, { quoted: msg });
    }

    if (targetId === senderId) {
      return conn.sendMessage(chatId, {
        text: '❌ You cannot transfer cards to yourself.'
      }, { quoted: msg });
    }

    const claims = loadClaims();
    const senderCards = claims[senderId] || {};
    const cardIds = Object.keys(senderCards);

    if (!cardIds[cardIndex]) {
      return conn.sendMessage(chatId, {
        text: '❌ Invalid card number. Use *.cl* to view your collection and pick a valid number.'
      }, { quoted: msg });
    }

    const cardId = cardIds[cardIndex];
    const cardData = senderCards[cardId];

    // Prevent duplicate
    if (!claims[targetId]) claims[targetId] = {};
    if (claims[targetId][cardId]) {
      return conn.sendMessage(chatId, {
        text: '⚠️ This user already owns that card.'
      }, { quoted: msg });
    }

    // Transfer logic
    delete claims[senderId][cardId];
    claims[targetId][cardId] = cardData;
    saveClaims(claims);

    await conn.sendMessage(chatId, {
      text: `✅ Transferred *${cardData.name}* (Tier ${cardData.tier}) to @${targetId.split('@')[0]}.`,
      mentions: [targetId]
    }, { quoted: msg });
  }
};
