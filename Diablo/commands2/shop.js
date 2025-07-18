// commands/shop.js
const fs = require('fs');
const path = require('path');

const shop = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'datamoney', 'shop.json'), 'utf8')
);

function formatPrice(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K';
  return n.toString();
}

module.exports = {
  name: 'shop',
  aliases: ['store', 'market'],
  description: 'List items available for purchase',

  async run(msg, { conn }) {
    const chatId = msg.key.remoteJid;

    let text = '🛒 *Available Items*\n';
    text += '────────────────────────\n';

    for (const [id, item] of Object.entries(shop)) {
      text += `🆔 *${id}* – ${item.name}\n💰 Price: ${formatPrice(item.price)}\n\n`;
    }

    await conn.sendMessage(chatId, { text }, { quoted: msg });
  }
};
