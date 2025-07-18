// commands/gift.js
const fs = require('fs');
const path = require('path');
const db = require('../db/economy');

// Location of the gift code storage
const GC_PATH = path.join(process.cwd(), 'datamoney', 'giftcodes.json');
fs.mkdirSync(path.dirname(GC_PATH), { recursive: true });

// Load & save helpers
const load = () => {
  try { return JSON.parse(fs.readFileSync(GC_PATH, 'utf8')); }
  catch { return {}; }
};
const save = data => fs.writeFileSync(GC_PATH, JSON.stringify(data, null, 2));

module.exports = {
  name: 'gift',
  description: 'Redeem a gift code (only once per user)',
  usage: '.gift <CODE>',

  async run(msg, { conn, args }) {
    const chatId = msg.key.remoteJid;
    const userId = msg.key.participant || msg.key.remoteJid;

    if (!args.length) {
      return conn.sendMessage(chatId,
        { text: '❌ Usage: *.gift CODE*' }, { quoted: msg });
    }

    const code = args[0].toUpperCase();
    const codes = load();

    if (!codes[code]) {
      return conn.sendMessage(chatId,
        { text: '❌ Invalid gift code.' }, { quoted: msg });
    }

    const entry = codes[code];
    if (!Array.isArray(entry.redeemed)) entry.redeemed = [];

    if (entry.redeemed.includes(userId)) {
      return conn.sendMessage(chatId,
        { text: '🚫 You have already claimed this gift code, Baka!' }, { quoted: msg });
    }

    // Give the user the coins
    db.addBalance(userId, entry.amount);
    entry.redeemed.push(userId);
    save(codes);

    return conn.sendMessage(chatId, {
      text: `🎁 You successfully claimed *${entry.amount.toLocaleString()}* coins from code *${code}*!`
    }, { quoted: msg });
  }
};
