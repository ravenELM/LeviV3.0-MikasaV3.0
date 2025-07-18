const { ownerIDs, mods } = require('../config');

const norm = jid => (jid || '').split(':')[0].replace(/[^0-9]/g, '');

module.exports = {
  name: 'joinreq',
  aliases: ['joinbot', 'reqjoin'],
  groupOnly: false,
  description: 'Request the bot to join a group. Use: .joinreq <group-invite-link> | optional reason',

  /** @param {import('@whiskeysockets/baileys').proto.WebMessageInfo} msg
   *  @param {{ conn: import('@whiskeysockets/baileys').WASocket, args: string[] }} ctx */
  async run(msg, { conn, args }) {
    const chatId = msg.key.remoteJid;
    const senderId = norm(msg.key.participant || msg.key.remoteJid);
    const senderName = msg.pushName || 'Unknown';

    const input = args.join(' ').trim();
    if (!input || !input.includes('chat.whatsapp.com')) {
      return conn.sendMessage(chatId, {
        text: '⚠️ Please provide a valid WhatsApp group invite link.\nExample:\n.joinreq https://chat.whatsapp.com/AbCdeFGHijk | We play games daily!',
      }, { quoted: msg });
    }

    const [linkPart, reasonPart] = input.split('|').map(s => s.trim());
    const reason = reasonPart || 'No reason provided.';

    const notification = 
`📩 *Group Join Request*

👤 *User:* ${senderName}
🆔 *JID:* ${senderId}
🔗 *Invite Link:* ${linkPart}
📝 *Reason:* ${reason}`;

    // Notify owners + mods
    const recipients = [...new Set([...ownerIDs, ...mods])]; // Remove duplicates
    try {
      for (const jid of recipients) {
        await conn.sendMessage(jid, { text: notification });
      }

      await conn.sendMessage(chatId, {
        text: '✅ Your request has been sent to the owner(s) and mods. They’ll review and respond if approved.',
      }, { quoted: msg });

    } catch (err) {
      console.error('[joinreq] Error sending notification:', err);
      await conn.sendMessage(chatId, {
        text: '❌ Failed to send your join request. Please try again later.',
      }, { quoted: msg });
    }
  }
};
