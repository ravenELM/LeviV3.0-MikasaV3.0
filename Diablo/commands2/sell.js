// commands/sellcard.js
const claimedPath = require('path').join(__dirname, '..', 'data', 'claimed.json');
const fs = require('fs');
const db = require('../db/economy');

function loadClaims() {
  return JSON.parse(fs.readFileSync(claimedPath));
}
function saveClaims(data) {
  fs.writeFileSync(claimedPath, JSON.stringify(data, null, 2));
}

global.activeSales = global.activeSales || {}; // map: cardID → {owner, card, price, timeout}

module.exports = {
  name: 'sell',
  run: async (msg, { conn, args }) => {
    const chatId   = msg.key.remoteJid;
    const senderId = msg.key.participant || chatId;
    const cardNum  = parseInt(args[0], 10) - 1;
    const price    = parseInt(args[1], 10);

    if (isNaN(cardNum) || isNaN(price)) {
      return conn.sendMessage(chatId, {
        text: '❌ Usage: *.sellcard <card_number> <price>*'
      }, { quoted: msg });
    }

    const claims = loadClaims();
    const userCards = claims[senderId] || {};
    const cardIds = Object.keys(userCards);

    if (!cardIds[cardNum]) {
      return conn.sendMessage(chatId, { text: '❌ Invalid card number.' }, { quoted: msg });
    }

    const cardId = cardIds[cardNum];
    const card = userCards[cardId];

    delete claims[senderId][cardId];
    saveClaims(claims);

    // Set sale with 5 min expiry
    const timeout = setTimeout(() => {
      if (global.activeSales[cardId]) {
        // Sale expired, return card to seller
        const expired = global.activeSales[cardId];
        const c = loadClaims();
        if (!c[expired.owner]) c[expired.owner] = {};
        c[expired.owner][cardId] = expired.card;
        saveClaims(c);
        delete global.activeSales[cardId];
        console.log(`[⏱️] Sale expired for card ${card.name}`);
      }
    }, 5 * 60 * 1000); // 5 mins

    global.activeSales[cardId] = { owner: senderId, card, price, timeout };

    await conn.sendMessage(chatId, {
      text: `🛒 *Card Listed for Sale!*\n\n🎴 ${card.name} (Tier ${card.tier})\n💰 Price: $${price.toLocaleString()}\n⌛ Expires in 5 minutes\n🆔 Card ID: ${cardId}`,
      image: { url: card.img }
    }, { quoted: msg });
  }
};
