// commands/acceptcard.js
const fs = require('fs');
const path = require('path');
const db = require('../db/economy');

const marketPath = path.join(__dirname, '..', 'data', 'market.json');
const claimedPath = path.join(__dirname, '..', 'data', 'claimed.json');

function loadMarket() {
  return JSON.parse(fs.readFileSync(marketPath));
}

function saveMarket(data) {
  fs.writeFileSync(marketPath, JSON.stringify(data, null, 2));
}

function loadClaims() {
  return JSON.parse(fs.readFileSync(claimedPath));
}

function saveClaims(data) {
  fs.writeFileSync(claimedPath, JSON.stringify(data, null, 2));
}

module.exports = {
  name: 'acceptcard',
  run: async (msg, { conn, args }) => {
    const chatId = msg.key.remoteJid;
    const buyerId = msg.key.participant || chatId;

    const saleId = args[0];
    if (!saleId) {
      return conn.sendMessage(chatId, {
        text: '❌ Usage: *.acceptcard <card_id>*'
      }, { quoted: msg });
    }

    const market = loadMarket();
    const sale = market[saleId];
    if (!sale) {
      return conn.sendMessage(chatId, {
        text: '❌ Card not found or no longer for sale.'
      }, { quoted: msg });
    }

    if (sale.owner === buyerId) {
      return conn.sendMessage(chatId, {
        text: '❌ You can’t buy your own card.'
      }, { quoted: msg });
    }

    const buyerBal = await db.getBalance(buyerId);
    if (buyerBal < sale.price) {
      return conn.sendMessage(chatId, {
        text: `❌ Not enough coins. You need *${sale.price}*, you have *${buyerBal}*.`
      }, { quoted: msg });
    }

    const claims = loadClaims();
    if (!claims[buyerId]) claims[buyerId] = {};
    if (!claims[sale.owner]) claims[sale.owner] = {};

    // Transfer funds and ownership
    await db.addBalance(buyerId, -sale.price);
    await db.addBalance(sale.owner, sale.price);

    claims[buyerId][saleId] = sale.card;
    delete market[saleId];

    saveClaims(claims);
    saveMarket(market);

    await conn.sendMessage(chatId, {
      text:
        `✅ You bought *${sale.card.name}* for *${sale.price.toLocaleString()}* coins.\n` +
        `🆔 Card ID: ${saleId}`,
      image: { url: sale.card.img }
    }, { quoted: msg });
  }
};
