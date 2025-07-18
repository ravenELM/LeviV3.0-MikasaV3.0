const { ownerIDs, mods } = require('../config');

const norm = jid => (jid || '').split(':')[0].replace(/[^0-9]/g, '');

module.exports = {
  name: 'cmdidea',
  aliases: ['idea', 'suggestion'],
  groupOnly: false,
  description: 'Send a feature/command idea to the bot owner(s). Usage: .cmdidea <your idea>',

  /** @param {import('@whiskeysockets/baileys').proto.WebMessageInfo} msg
   *  @param {{ conn: import('@whiskeysockets/baileys').WASocket, args: string[] }} ctx */
  async run(msg, { conn, args }) {
    const chatId = msg.key.remoteJid;
    const senderId = norm(msg.key.participant || msg.key.remoteJid);
    const senderName = msg.pushName || 'Unknown';

    const idea = args.join(' ').trim();
    if (!idea) {
      return conn.sendMessage(chatId, {
        text: '💡 Please describe your idea.\nExample:\n.cmdidea Add a `.meme` command that fetches random memes.',
      }, { quoted: msg });
    }

    const message = 
`🧠 *New Command Idea Submitted*

👤 *User:* ${senderName}
🆔 *JID:* ${senderId}
💡 *Idea:* ${idea}`;

    const recipients = [...new Set([...ownerIDs, ...mods])];

    try {
      for (const jid of recipients) {
        await conn.sendMessage(jid, { text: message });
      }

      await conn.sendMessage(chatId, {
        text: '✅ Your idea has been sent to the owner(s)/mods. Thanks for your suggestion!',
      }, { quoted: msg });

    } catch (err) {
      console.error('[cmdidea] Failed to notify owners/mods:', err);
      await conn.sendMessage(chatId, {
        text: '❌ Something went wrong while sending your idea. Try again later.',
      }, { quoted: msg });
    }
  }
};
