// commands/owner-changebotname.js
// -----------------------------------------------------------------------------
// Usage:   .changebotname <new name here>
// Example: .changebotname Elaina ✨
//
// • Works in any chat (PM or group).
// • Only the JIDs listed in config.ownerIDs are allowed.
// • Updates the actual WhatsApp Business profile name via Baileys.
// -----------------------------------------------------------------------------

const { ownerIDs, botName: currentName } = require('../config');

/**
 * Normalizes a JID by stripping “:device” suffix, keeping bare user@server
 * @param {string} jid
 */
const norm = jid => (jid || '').split(':')[0];

module.exports = {
  name: 'changename',
  aliases: ['setname', 'botname'],
  description: 'Owner‑only: change the bot’s WhatsApp profile name',
  groupOnly: false,

  /**
   * @param {import('@whiskeysockets/baileys').proto.WebMessageInfo} msg
   * @param {{ conn: import('@whiskeysockets/baileys').WASocket, args: string[] }} ctx
   */
  async run (msg, { conn, args }) {
    const chatId   = msg.key.remoteJid;
    const senderId = norm(msg.key.participant || msg.key.remoteJid);

    /* --- 1. Owner‑only gate ------------------------------------------------ */
    if (!ownerIDs.map(norm).includes(senderId)) {
      return conn.sendMessage(chatId, {
        text: '*⁺‧₊˚ ཐི⋆This command is for my esteemed creator only. How exclusive!⋆ཋྀ ˚₊‧⁺*'
      }, { quoted: msg });
    }

    /* --- 2. Collect the new name ------------------------------------------ */
    const newName = args.join(' ').trim();
    if (!newName) {
      return conn.sendMessage(chatId, {
        text: '⚠️ Usage: .changebotname <new name>\nExample: .changebotname Elaina ✨'
      }, { quoted: msg });
    }

    /* --- 3. Attempt the update via Baileys -------------------------------- */
    try {
      // Baileys function; available in both Business & Personal accounts
      await conn.updateProfileName(newName);

      // (optional) update in‑memory config so commands that read botName reflect it
      require('../config').botName = newName;

      await conn.sendMessage(chatId, {
        text: `✅ Bot name changed from *${currentName}* ➜ *${newName}*`
      }, { quoted: msg });
    } catch (err) {
      console.error('[changebotname] failed:', err);
      await conn.sendMessage(chatId, {
        text: '❌ Failed to change profile name. Make sure the account is *not* rate‑limited and try again later.'
      }, { quoted: msg });
    }
  }
};
