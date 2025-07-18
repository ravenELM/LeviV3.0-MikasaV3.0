// commands/economy/transferitem.js
const fs   = require('fs');
const path = require('path');
const db   = require('../db/economy');        // <- must expose getInventory / setInventory

/* optional: pretty item names for the reply */
let SHOP = {};
try {
  SHOP = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'datamoney', 'shop.json'), 'utf8')
  );
} catch {
  /* no shop.json – fall back to ID only */
}

module.exports = {
  name: 'transferitem',
  aliases: ['titem'],
  description: 'Send ONE unit of an item in your inventory to another user',
  usage: '.transferitem <itemID> @user',
  category: 'economy',

  /** @param {import('@whiskeysockets/baileys').proto.WebMessageInfo} msg */
  async run(msg, { conn, args }) {
    const chatId   = msg.key.remoteJid;                     // current group
    const senderId = msg.key.participant || msg.key.remoteJid;

    /* ── 1. Parse mention & item ID ───────────────────────── */
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (mentioned.length === 0) {
      return conn.sendMessage(chatId,
        { text: '❌ Tag the user you want to send the item to, Baka!\nExample: *.titem 7 @user*' },
        { quoted: msg });
    }
    const targetId = mentioned[0];

    const idArg = args.find(a => /^\d+$/.test(a));
    if (!idArg) {
      return conn.sendMessage(chatId,
        { text: '❌ Provide a valid numeric *itemID*, Baka!' },
        { quoted: msg });
    }
    const itemId = idArg;

    if (targetId === senderId) {
      return conn.sendMessage(chatId,
        { text: '❌ You can’t transfer items to yourself, Baka!' },
        { quoted: msg });
    }

    /* ── 2. Inventory checks ─────────────────────────────── */
    const senderInv  = db.getInventory(senderId);   // { id: qty, ... }
    const receiverInv= db.getInventory(targetId);

    if (!senderInv[itemId] || senderInv[itemId] < 1) {
      return conn.sendMessage(chatId,
        { text: `❌ You don’t have item ID *${itemId}* to transfer, Baka!` },
        { quoted: msg });
    }

    /* ── 3. Execute transfer ─────────────────────────────── */
    // remove from sender
    senderInv[itemId] -= 1;
    if (senderInv[itemId] <= 0) delete senderInv[itemId];
    db.setInventory(senderId, senderInv);

    // add to receiver
    receiverInv[itemId] = (receiverInv[itemId] || 0) + 1;
    db.setInventory(targetId, receiverInv);

    /* ── 4. Notify both ──────────────────────────────────── */
    const itemName = SHOP[itemId]?.name || `Item ${itemId}`;
    await conn.sendMessage(chatId, {
      text:
        `🎁 @${senderId.split('@')[0]} sent **${itemName}** to ` +
        `@${targetId.split('@')[0]}!`,
      mentions: [senderId, targetId]
    }, { quoted: msg });
  }
};
