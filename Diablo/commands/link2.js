const { ownerIDs, mods } = require('../config');   // ← adjust path if needed

// helper to normalize jid
const norm = jid => (jid || '').split(':')[0].replace(/[^0-9]/g, '');

module.exports = {
  name      : 'link',
  aliases   : ['grouplink', 'invitelink'],
  groupOnly : true,
  desc      : 'Send the current group invite link',

  /** @param {import('@whiskeysockets/baileys').proto.WebMessageInfo} msg
   *  @param {{ conn: import('@whiskeysockets/baileys').WASocket }} ctx */
  async run (msg, { conn }) {
    const chatId = msg.key.remoteJid;

    // Fetch metadata to get admin list
    const meta = await conn.groupMetadata(chatId);
    const admins = meta.participants
      .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
      .map(p => norm(p.id));

    // Check if bot is admin (required to fetch link)
    const botId = norm(conn.user.id);
    const botAdmin = admins.includes(botId);

    if (!botAdmin) {
      return conn.sendMessage(
        chatId,
        { text: '⚠️ I need admin rights to fetch the invite link, Baka!' },
        { quoted: msg }
      );
    }

    try {
      const code = await conn.groupInviteCode(chatId);
      const link = `https://chat.whatsapp.com/${code}`;
      await conn.sendMessage(
        chatId,
        { text: `🔗 *Group Invite Link:*\n${link}` },
        { quoted: msg }
      );
    } catch (err) {
      console.error('[link] error:', err);
      await conn.sendMessage(
        chatId,
        { text: '❌ Failed to fetch the link. Make sure I am still an admin.' },
        { quoted: msg }
      );
    }
  }
};
