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
  aliases: ['transfercard', 'tcard'],
  description: 'Transfer one or more cards to another user by tagging or replying.\nUsage: .tcard 1,5,8 @user',

  run: async (msg, { conn, args }) => {
    const chatId = msg.key.remoteJid;
    const senderId = (msg.key.participant || chatId).split(':')[0];

    if (args.length === 0) {
      return conn.sendMessage(chatId, {
        text: '❌ Usage: *.tcard <card_numbers> @user*\nExample: *.tcard 1,5,8* (with user reply or tag)'
      }, { quoted: msg });
    }

    // Extract card numbers
    const cardIndexes = args[0]
      .split(',')
      .map(n => parseInt(n.trim(), 10) - 1)
      .filter(n => !isNaN(n) && n >= 0);

    if (cardIndexes.length === 0) {
      return conn.sendMessage(chatId, {
        text: '❌ Please provide valid card numbers separated by commas.'
      }, { quoted: msg });
    }

    // Get target user (from reply or mention)
    let targetId = null;
    const isReply = msg.message?.extendedTextMessage?.contextInfo?.participant;
    if (isReply) {
      targetId = msg.message.extendedTextMessage.contextInfo.participant;
    }

    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (!targetId && mentioned.length > 0) {
      targetId = mentioned[0];
    }

    if (!targetId) {
      return conn.sendMessage(chatId, {
        text: '❌ Please reply to a user or mention them to transfer cards.'
      }, { quoted: msg });
    }

    if (targetId === senderId) {
      return conn.sendMessage(chatId, {
        text: '❌ You cannot transfer cards to yourself.'
      }, { quoted: msg });
    }

    const claims = loadClaims();
    const senderCards = claims[senderId] || {};
    const senderCardIds = Object.keys(senderCards);

    if (senderCardIds.length === 0) {
      return conn.sendMessage(chatId, {
        text: '❌ You have no cards to transfer.'
      }, { quoted: msg });
    }

    let transferred = [];
    let skipped = [];

    for (const index of cardIndexes) {
      const cardId = senderCardIds[index];
      if (!cardId) {
        skipped.push(`#${index + 1} ❌ (Invalid index)`);
        continue;
      }

      const cardData = senderCards[cardId];

      if (!claims[targetId]) claims[targetId] = {};
      if (claims[targetId][cardId]) {
        skipped.push(`${cardData.name} ❌ (Already owned)`);
        continue;
      }

      // Transfer
      delete claims[senderId][cardId];
      claims[targetId][cardId] = cardData;
      transferred.push(`${cardData.name} ✅`);
    }

    saveClaims(claims);

    let resultMsg = `🎴 *Transfer Report*\n`;
    if (transferred.length > 0) {
      resultMsg += `\n✅ Transferred:\n${transferred.map(t => '• ' + t).join('\n')}`;
    }
    if (skipped.length > 0) {
      resultMsg += `\n\n⚠️ Skipped:\n${skipped.map(s => '• ' + s).join('\n')}`;
    }

    return conn.sendMessage(chatId, {
      text: resultMsg,
      mentions: [targetId]
    }, { quoted: msg });
  }
};
