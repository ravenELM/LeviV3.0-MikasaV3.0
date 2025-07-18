const { ownerIDs, mods } = require('../config');

const norm = jid => (jid || '').split(':')[0].replace(/[^0-9]/g, '');

module.exports = {
  name: 'purge',
  aliases: [],
  groupOnly: true,
  desc: 'Kick all group members whose number starts with the given prefix (admin/mod/owner only)',

  async run(msg, { conn, args }) {
    const chatId = msg.key.remoteJid;
    const senderId = norm(msg.key.participant || msg.key.remoteJid);

    // 1. Get group metadata and admin list
    const meta = await conn.groupMetadata(chatId);
    const participants = meta.participants;
    const admins = participants
      .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
      .map(p => norm(p.id));

    // 2. Check caller permissions
    const callerOK =
      admins.includes(senderId) ||
      ownerIDs.map(norm).includes(senderId) ||
      mods.map(norm).includes(senderId);

    if (!callerOK) {
      return conn.sendMessage(chatId,
        { text: '❌ Only group admins, mods or the owner can use this command!' },
        { quoted: msg });
    }

    // 3. Check if bot is admin
    const botJid = norm(conn.user.id);
    if (!admins.includes(botJid)) {
      return conn.sendMessage(chatId,
        { text: '⚠️ I need to be an admin to kick members!' },
        { quoted: msg });
    }

    // 4. Check prefix argument
    const prefix = args[0];
    if (!prefix) {
      return conn.sendMessage(chatId,
        { text: '⚠️ Please specify a number prefix. Example: purge 40' },
        { quoted: msg });
    }

    // 5. Filter participants by prefix
    const toKick = participants.filter(p => norm(p.id).startsWith(prefix) && !admins.includes(norm(p.id)));

    if (toKick.length === 0) {
      return conn.sendMessage(chatId,
        { text: `ℹ️ No members found with prefix "${prefix}" to kick.` },
        { quoted: msg });
    }

    // 6. Kick all matching participants
    try {
      for (const user of toKick) {
        await conn.groupParticipantsUpdate(chatId, [user.id], 'remove');
      }

      await conn.sendMessage(chatId,
        { text: `✅ Kicked ${toKick.length} member(s) with prefix "${prefix}".` },
        { quoted: msg });
    } catch (error) {
      console.error('Error kicking members:', error);
      await conn.sendMessage(chatId,
        { text: '❌ Failed to kick some members.' },
        { quoted: msg });
    }
  }
};
