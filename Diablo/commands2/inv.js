const db = require('../db/economy');
const fs = require('fs');
const path = require('path');
const shopData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'datamoney', 'shop.json')));

module.exports = {
  name: 'inv',
  aliases  : ['bag', 'inv'],
  description: 'Show your bought items and quantities',
  async run(msg, { conn }) {
    const from = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;

    const inventory = db.getInventory(sender);
    if (!inventory || Object.keys(inventory).length === 0) {
      return conn.sendMessage(from, { text: 'Your inventory is empty. Buy something from the shop!' }, { quoted: msg });
    }

    let message = '🎒 *Your Inventory* 🎒\n\n';
    for (const [itemID, amount] of Object.entries(inventory)) {
      const itemName = shopData[itemID]?.name || 'Unknown Item';
      message += `• ${itemName}: ${amount}\n`;
    }

    await conn.sendMessage(from, { text: message }, { quoted: msg });
  }
};
