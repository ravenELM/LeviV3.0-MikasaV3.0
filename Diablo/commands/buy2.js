// commands/buy.js
const fs = require('fs');
const path = require('path');
const db  = require('../db/economy');

const shopPath = path.join(process.cwd(), 'datamoney', 'shop.json');
const shopData = JSON.parse(fs.readFileSync(shopPath, 'utf8'));

module.exports = {
  name: 'buy',
  description: 'Buy exactly one unit of an item. Usage: .buy <itemID>',
  async run(msg, { conn, args }) {
    const chatId = msg.key.remoteJid;
    const userId = msg.key.participant || chatId;

    /* — Check syntax — */
    if (!args.length) {
      return conn.sendMessage(chatId,
        { text: 'Usage: .buy <itemID>' }, { quoted: msg });
    }

    const itemID = args[0];

    /* — Validate item — */
    const item = shopData[itemID];
    if (!item) {
      return conn.sendMessage(chatId,
        { text: '❌ Invalid item ID.' }, { quoted: msg });
    }

    /* — Check wallet balance — */
    const price  = item.price;          // one unit only
    const wallet = db.getBalance(userId);

    if (wallet < price) {
      return conn.sendMessage(chatId, {
        text: `❌ Not enough coins: need *${price.toLocaleString()}*, you have *${wallet.toLocaleString()}*.`
      }, { quoted: msg });
    }

    /* — Deduct and add to inventory — */
    db.addBalance(userId, -price);
    db.addItem(userId, itemID, 1);

    /* — Confirmation — */
    await conn.sendMessage(chatId, {
      text: `✅ Purchased *${item.name}* for *${price.toLocaleString()}* coins.`
    }, { quoted: msg });
  }
};
