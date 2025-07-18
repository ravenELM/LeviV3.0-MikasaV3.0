// commands/ban-review.js
// ------------------------------------------------------------
// .banreview <your text here>
// Sends the appeal to all owners & mods.
// ------------------------------------------------------------
const { ownerIDs, mods, botName } = require('../config');   // adjust path if needed

module.exports = {
  name: 'banreview',
  aliases: ['review', 'banappeal'],
  description: 'Send an unban appeal to owners & mods',
  usage: '.banreview <your message>',
  groupOnly: false,

  /**
   * @param {import('@whiskeysockets/baileys').WAMessage} msg
   * @param {{ conn: import('@whiskeysockets/baileys').WASocket, args: string[] }} ctx
   */
  async run (msg, { conn, args }) {
    const from     = msg.key.remoteJid;
    const senderId = msg.key.participant || msg.key.remoteJid;
    const text     = args.join(' ').trim();

    // 1. Validate content
    if (!text) {
      return conn.sendMessage(from, {
        text: '❌ Usage:\n.banreview <why we should unban you>\nExample:\n.banreview I am sorry and will follow the rules.'
      }, { quoted: msg });
    }

    // 2. Compose the appeal
    const appeal =
`📥 *New Un‑Ban Review Request*
────────────────────────
👤 From : @${senderId.split('@')[0]}
💬 Message:
${text}
────────────────────────
🤖 *${botName}*`;

    // 3. Send to each owner & mod (avoid duplicates)
    const reviewers = [...new Set([...ownerIDs, ...mods])];

    for (const jid of reviewers) {
      try {
        await conn.sendMessage(jid, {
          text: appeal,
          mentions: [senderId]          // clickable @ mention
        });
      } catch (err) {
        console.error('Failed to deliver review to', jid, err);
      }
    }

    // 4. Confirm to the requester
    await conn.sendMessage(from, {
      text: '✅ Your un‑ban request has been sent to the moderation team. Please wait for a response.',
    }, { quoted: msg });
  }
};
