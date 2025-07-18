// commands/economy/transfer.js
const db = require('../db/economy');                                           // <-- uses getBalance / addBalance

module.exports = {
  name: 'transfer',
  aliases: [ 'pay'],
  description: 'Send coins from your wallet to another user',
  category: 'economy',

  /** @param {import('@whiskeysockets/baileys').proto.WebMessageInfo} msg */
  async run(msg, { conn, args }) {
    const chatId   = msg.key.remoteJid;                                // group JID
    const senderId = msg.key.participant || msg.key.remoteJid;         // who called the cmd

    /* ---------------------------------------------------------- *
     * 1. Parse arguments   (.transfer @target 250)               *
     * ---------------------------------------------------------- */
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (mentioned.length === 0) {
      return conn.sendMessage(chatId,
        { text: '❌ Tag the user you want to transfer to, Baka!\nExample: *.transfer @user 250*' },
        { quoted: msg });
    }
    const targetId = mentioned[0];

    const amountArg = args.find(a => /^\d+$/.test(a));
    const amount = Number(amountArg);
    if (!amountArg || !Number.isInteger(amount) || amount <= 0) {
      return conn.sendMessage(chatId,
        { text: '❌ Provide a valid positive amount, Baka!' },
        { quoted: msg });
    }

    if (targetId === senderId) {
      return conn.sendMessage(chatId,
        { text: '❌ You can’t transfer coins to yourself, Baka!' },
        { quoted: msg });
    }

    /* ---------------------------------------------------------- *
     * 2. Balance check                                           *
     * ---------------------------------------------------------- */
    const senderBal = await db.getBalance(senderId);
    if (senderBal < amount) {
      return conn.sendMessage(chatId,
        { text: `❌ You only have *${senderBal}* coins, Baka!` },
        { quoted: msg });
    }

    /* ---------------------------------------------------------- *
     * 3. Execute transfer                                        *
     * ---------------------------------------------------------- */
    await db.addBalance(senderId, -amount);   // subtract from sender
    await db.addBalance(targetId,  amount);   // add to receiver

    /* ---------------------------------------------------------- *
     * 4. Notify                                                  *
     * ---------------------------------------------------------- */
    const nice = n => n.toLocaleString();
    return conn.sendMessage(chatId, {
      text:
        `✅ Successfully transferred *${nice(amount)}* coins to ` +
        `@${targetId.split('@')[0]}.\n` +
        `💰 Your new balance: *${nice(senderBal - amount)}*`,
      mentions: [targetId]
    }, { quoted: msg });
  }
};
