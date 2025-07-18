const { ownerIDs, mods } = require('../config');

// normalize JID helper
const norm = jid => (jid || '').split(':')[0].replace(/[^0-9]/g, '');

module.exports = {
  name: 'delete',
  aliases: ['del', 'd'],
  groupOnly: true,
  desc: 'Delete a replied message (admin only)',

  async run(msg, { conn }) {
    const chatId = msg.key.remoteJid;
    const senderId = norm(msg.key.participant || msg.key.remoteJid);

    // 1. Group metadata & admins
    const meta = await conn.groupMetadata(chatId);
    const admins = meta.participants
      .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
      .map(p => norm(p.id));

    // 2. Check caller permissions
    const callerOK =
      admins.includes(senderId) ||
      ownerIDs.map(norm).includes(senderId) ||
      mods.map(norm).includes(senderId);

    if (!callerOK) {
      return conn.sendMessage(chatId,
        { text: '❌ Only group admins, mods, or the owner can use this command, Baka!' },
        { quoted: msg });
    }

    // 3. Check bot admin status
    const botJid = norm(conn.user.id);
    if (!admins.includes(botJid)) {
      return conn.sendMessage(chatId,
        { text: '⚠️ I need to be admin to delete messages, Baka!' },
        { quoted: msg });
    }

    // 4. Get the quoted message key for deletion
    const ctx = msg.message.extendedTextMessage?.contextInfo;
    if (!ctx?.quotedMessage) {
      return conn.sendMessage(chatId,
        { text: '⚠️ You must reply to a message to delete it.' },
        { quoted: msg });
    }

    const keyToDelete = {
      remoteJid: chatId,
      fromMe: false,
      id: ctx.stanzaId,
      participant: ctx.participant || chatId
    };

    try {
      await conn.sendMessage(chatId, { delete: keyToDelete });
      await conn.sendMessage(chatId, { text: '✅ Message deleted.' }, { quoted: msg });
    } catch (e) {
      console.error('Delete error:', e);
      await conn.sendMessage(chatId, { text: '❌ Failed to delete the message.' }, { quoted: msg });
    }
  }
};
