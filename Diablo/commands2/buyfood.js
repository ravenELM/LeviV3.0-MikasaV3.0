const fs = require('fs');
const path = require('path');
const db = require('../db/economy'); // assumes addFridgeItem and getBalance exist

const foodShopPath = path.join(__dirname, '..', 'data', 'foodshop.json');
const foodShop = JSON.parse(fs.readFileSync(foodShopPath));

module.exports = {
  name: 'buyfood',
  aliases: ['bf'],
  description: 'Buy food ingredients for your fridge',
  async run(msg, { conn, args }) {
    const chatId = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;

    if (!args.length)
      return conn.sendMessage(chatId, { text: '⚠️ Usage: *.buyfood <food_id>*' }, { quoted: msg });

    const itemId = args[0].toLowerCase();
    const item = foodShop[itemId];

    if (!item)
      return conn.sendMessage(chatId, { text: '❌ Invalid food ID. Use *.food* to see list.' }, { quoted: msg });

    const price = item.price;
    const balance = db.getBalance(sender);

    if (balance < price)
      return conn.sendMessage(chatId, {
        text: `❌ You need *${price}* coins but only have *${balance}*.`
      }, { quoted: msg });

    db.addBalance(sender, -price);
    db.addFridgeItem(sender, itemId, 1);

    await conn.sendMessage(chatId, {
    text: `✅ Bought *${item.name}* for *${price}* coins.\nUse *.fridge* to check your ingredients!`
    }, { quoted: msg });
  }
};
