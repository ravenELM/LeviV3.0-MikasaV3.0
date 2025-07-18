// commands/food.js
const fs = require('fs');
const recipes = require('../data/recipes.json');
const ecoPath = './datamoney/economy.json';

function loadEco() {
  return JSON.parse(fs.readFileSync(ecoPath));
}
function saveEco(data) {
  fs.writeFileSync(ecoPath, JSON.stringify(data, null, 2));
}

module.exports = {
  name: 'cook',
  async run(msg, { conn, args }) {
    const chatId = msg.key.remoteJid;
    const sender = msg.key.participant || chatId;

    if (!args[0]) {
      let reply = '🍽️ *Available Dishes:*\n\n';
      for (const [dish, data] of Object.entries(recipes)) {
        reply += `🍳 *${dish}* ➜ ${Object.entries(data.ingredients)
          .map(([k, v]) => `${v} ${k.replace('_', ' ')}`)
          .join(', ')}\n`;
      }
      return conn.sendMessage(chatId, { text: reply }, { quoted: msg });
    }

    const dish = args[0].toLowerCase();
    const recipe = recipes[dish];
    if (!recipe) {
      return conn.sendMessage(chatId, { text: '❌ Unknown dish.' }, { quoted: msg });
    }

    const eco = loadEco();
    const user = eco[sender] || { balance: 0, fridge: {} };
    const fridge = user.fridge || {};

    for (const [item, qty] of Object.entries(recipe.ingredients)) {
      if ((fridge[item] || 0) < qty) {
        return conn.sendMessage(chatId, { text: `❌ Not enough ${item.replace('_', ' ')}.` }, { quoted: msg });
      }
    }

    for (const [item, qty] of Object.entries(recipe.ingredients)) {
      fridge[item] -= qty;
      if (fridge[item] <= 0) delete fridge[item];
    }

    user.fridge = fridge;
    eco[sender] = user;
    saveEco(eco);

    await conn.sendMessage(chatId, {
      text: `✅ You cooked *${dish}*! Bon appétit! 🍴`
    }, { quoted: msg });
  }
};
