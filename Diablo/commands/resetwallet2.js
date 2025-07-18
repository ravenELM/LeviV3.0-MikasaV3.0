// commands/economy/resetwallet.js
const db      = require('../db/economy');       // <- uses getBalance / addBalance
const { ownerIDs, mods } = require('../config');

const norm = jid => jid.split(':')[0];  // strip device part

module.exports = {
  name     : 'resetwallet',
  aliases  : ['rwallet', 'rw'],
  desc     : '❗ Owner / mod only –‑ set a user’s wallet to 0',
  category : 'economy',

  /** @param {import('@whiskeysockets/baileys').proto.WebMessageInfo} msg */
  async run (msg, { conn }) {
    const chatId   = msg.key.remoteJid;                       // where cmd was used
    const callerId = norm(msg.key.participant || msg.key.remoteJid);

    /* -------------------------------------------------------- *
     * 1. Permission check (owner or mod)                       *
     * -------------------------------------------------------- */
    if (![...ownerIDs, ...mods].map(norm).includes(callerId)) {
      return conn.sendMessage(chatId,
        { text: '*⁺‧₊˚ ཐི⋆This command is for my esteemed creator only. How exclusive!⋆ཋྀ ˚₊‧⁺*' },
        { quoted: msg });
    }

    /* -------------------------------------------------------- *
     * 2. Determine the target user                             *
     * -------------------------------------------------------- */
    const mention  = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const replied  = msg.message?.extendedTextMessage?.contextInfo?.participant
                   ? [msg.message.extendedTextMessage.contextInfo.participant] : [];

    const targetRaw = mention[0] || replied[0];
    if (!targetRaw) {
      return conn.sendMessage(chatId,
        { text: '⚠️ Tag or reply to the user whose wallet you want to reset.\nExample: *.resetwallet @user*' },
        { quoted: msg });
    }
    const target = norm(targetRaw);

    /* -------------------------------------------------------- *
     * 3. Reset wallet                                          *
     * -------------------------------------------------------- */
    const currentBal = await db.getBalance(target);
    if (currentBal === 0) {
      return conn.sendMessage(chatId,
        { text: `ℹ️ @${target} already has 0 coins.`, mentions: [`${target}@s.whatsapp.net`] },
        { quoted: msg });
    }

    // subtract current balance to bring wallet to zero
    await db.addBalance(target, -currentBal);

    /* -------------------------------------------------------- *
     * 4. Confirmation message                                  *
     * -------------------------------------------------------- */
    return conn.sendMessage(chatId, {
      text : `✅ Wallet of @${target} has been reset to 0 coins.`,
      mentions: [`${target}@s.whatsapp.net`]
    }, { quoted: msg });
  }
};
