const shop = require('../data/foodshop.json');

module.exports = {
  name: 'foodshop',
  run: async (msg, { conn }) => {
    let text = '🛍️ *Food Shop:*\n\n';
    for (const [_, item] of Object.entries(shop)) {
      text += `🍴 ${item.name} — $${item.price}\n`;
    }

    await conn.sendMessage(msg.key.remoteJid, { text }, { quoted: msg });
  }
};
