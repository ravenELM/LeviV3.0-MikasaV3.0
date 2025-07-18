const { ownerIDs, mods } = require('../config');

const norm = jid => (jid || '').split(':')[0].replace(/[^0-9]/g, '');

module.exports = {
  name: 'unmute',
  aliases: ['open'],
  groupOnly: true,
  desc: 'Unmute group so everyone can send messages (admin only)',

  async run(msg, { conn }) {
    const chatId = msg.key.remoteJid;
    const senderId = norm(msg.key.participant || msg.key.remoteJid);

    // Get group metadata and admins
    const meta = await conn.groupMetadata(chatId);
    const admins = meta.participants
      .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
      .map(p => norm(p.id));

    // Check caller permissions
    const callerOK =
      admins.includes(senderId) ||
      ownerIDs.map(norm).includes(senderId) ||
      mods.map(norm).includes(senderId);

    if (!callerOK) {
      return conn.sendMessage(chatId,
        { text: '❌ Only group admins, mods or owner can use this cmd, Baka!' },
        { quoted: msg });
    }

    // Check bot admin status
    const botId = norm(conn.user.id);
    if (!admins.includes(botId)) {
      return conn.sendMessage(chatId,
        { text: '⚠️ I need to be an admin to unmute the group, Baka!' },
        { quoted: msg });
    }

    // Unmute the group
    try {
      await conn.groupSettingUpdate(chatId, 'not_announcement'); // everyone can send messages
      return conn.sendMessage(chatId,
        { text: '🔊 Group unmuted. Everyone can send messages now, Baka!' },
        { quoted: msg });
    } catch (error) {
      console.error(error);
      return conn.sendMessage(chatId,
        { text: '❌ Failed to unmute the group, Baka!' },
        { quoted: msg });
    }
  }
};
