// commands/owner-addgift.js
const fs = require('fs');
const path = require('path');
const { ownerIDs } = require('../config');      // make sure config exports ownerIDs

const GC_PATH = path.join(process.cwd(), 'datamoney', 'giftcodes.json');
fs.mkdirSync(path.dirname(GC_PATH), { recursive: true });

function loadCodes() {
  try { return JSON.parse(fs.readFileSync(GC_PATH, 'utf8')); }
  catch { return {}; }
}
function saveCodes(obj) {
  fs.writeFileSync(GC_PATH, JSON.stringify(obj, null, 2));
}

module.exports = {
  name: 'addgift',
  aliases: [],
  description: 'Create a new gift code (owner only)',
  usage: '.addgift <CODE> <amount>',
  category: 'economy',

  async run(msg, { conn, args }) {
    const chat = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;

    if (!ownerIDs.includes(sender)) {
      return conn.sendMessage(chat,
        { text: '⛔ Only my Master can create gift codes, Baka!' }, { quoted: msg });
    }

    if (args.length < 2 || !/^\d+$/.test(args[1])) {
      return conn.sendMessage(chat,
        { text: '❌ Usage: *.addgift CODE amount*  (amount must be numeric)' }, { quoted: msg });
    }

    const code   = args[0].toUpperCase();
    const amount = parseInt(args[1]);

    const codes = loadCodes();
    codes[code] = { amount, redeemed: false };
    saveCodes(codes);

    return conn.sendMessage(chat,
      { text: `✅ Gift code *${code}* worth *${amount.toLocaleString()}* coins is now active.` },
      { quoted: msg });
  }
};
