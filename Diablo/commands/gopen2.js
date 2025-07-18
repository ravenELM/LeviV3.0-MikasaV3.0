const { ownerIDs, mods } = require('../config');

const norm = jid => (jid || '').split(':')[0].replace(/[^0-9]/g, '');

module.exports = {
  name: 'gopen',
  aliases: ['gopen'],
  groupOnly: true,
  desc: 'Unmute group temporarily so everyone can send messages (admin only). Usage: .unmute <minutes>',

  async run(msg, { conn, args }) {
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
        { text: '❌ Only group admins, mods or owner can use this command, Baka!' },
        { quoted: msg });
    }

    // Check bot admin status
    const botId = norm(conn.user.id);
    if (!admins.includes(botId)) {
      return conn.sendMessage(chatId,
        { text: '⚠️ I need to be an admin to unmute the group, Baka!' },
        { quoted: msg });
    }

    // Parse duration argument (minutes)
    const minutes = parseInt(args[0]);
    if (!minutes || minutes <= 0) {
      return conn.sendMessage(chatId,
        { text: '❌ Please specify a valid time in minutes. Usage: .unmute <minutes>' },
        { quoted: msg });
    }

    try {
      // Unmute the group
      await conn.groupSettingUpdate(chatId, 'not_announcement'); // everyone can send messages
      await conn.sendMessage(chatId,
        { text: `🔊 Group unmuted for *${minutes}* minute(s). Everyone can send messages now, Baka!` },
        { quoted: msg });

      // Schedule to mute again after given time
      setTimeout(async () => {
        try {
          await conn.groupSettingUpdate(chatId, 'announcement'); // mute again
          await conn.sendMessage(chatId,
            { text: `🔇 Group has been muted again after ${minutes} minute(s), Baka!` });
        } catch (error) {
          console.error('Error re-muting group:', error);
        }
      }, minutes * 60 * 1000);

    } catch (error) {
      console.error(error);
      return conn.sendMessage(chatId,
        { text: '❌ Failed to unmute the group, Baka!' },
        { quoted: msg });
    }
  }
};
