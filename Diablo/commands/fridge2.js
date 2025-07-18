const fs = require('fs');
const path = require('path');

const ecoPath = './datamoney/economy.json';
const foodShopPath = path.join(__dirname, '..', 'data', 'foodshop.json');
const foodShop = JSON.parse(fs.readFileSync(foodShopPath));

function loadEco() {
  return JSON.parse(fs.readFileSync(ecoPath));
}

module.exports = {
  name: 'fridge',
  async run(msg, { conn }) {
    const chatId = msg.key.remoteJid;
    const sender = msg.key.participant || chatId;

    const eco = loadEco();
    const fridge = eco[sender]?.fridge || {};

    if (Object.keys(fridge).length === 0) {
      return conn.sendMessage(chatId, { text: '🧊 Your fridge is empty!' }, { quoted: msg });
    }

    let reply = '🧊 *Your Fridge:*\n\n';
    for (const [id, qty] of Object.entries(fridge)) {
      const itemName = foodShop[id]?.name || `Unknown (${id})`;
      reply += `🍴 ${itemName}: ${qty}\n`;
    }

    await conn.sendMessage(chatId, { text: reply }, { quoted: msg });
  }
};
