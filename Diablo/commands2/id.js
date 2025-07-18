// commands/group-id.js
// ───────────────────────────────────────────────────────────
// Shows the JID / WhatsApp ID of the current group chat
// Usage:  .id
// ───────────────────────────────────────────────────────────

module.exports = {
  name        : 'id',
  aliases     : ['groupid', 'jid'],
  description : 'Return the JID (WhatsApp ID) of this group.',
  groupOnly   : true,      // your loader will block DM use automatically
  ownerOnly   : false,
  modOnly     : false,

  /** @param {import('@whiskeysockets/baileys').proto.WebMessageInfo} msg
   *  @param {{ conn: import('@whiskeysockets/baileys').WASocket }} ctx */
  async run (msg, { conn }) {
    const chatId = msg.key.remoteJid;

    // Extra safety: if it somehow fires in a DM
    if (!chatId.endsWith('@g.us')) {
      return conn.sendMessage(
        chatId,
        { text: '❌ This command works only in group chats, Baka!' },
        { quoted: msg }
      );
    }

    await conn.sendMessage(
      chatId,
      { text: `🆔 *Group JID:*  \n${chatId}` },
      { quoted: msg }
    );
  }
};
