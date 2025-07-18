/**
 * commands/mutegc.js
 * Close the group so ONLY admins can send messages.
 *
 * Usage:  .mutegc     (alias: .close / .muteall)
 * Must be used **inside** the group and by an admin / mod / owner.
 */

const { ownerIDs, mods } = require('../config');

// helper – normalize JIDs (strip :device plus non‑digits)
const norm = jid => (jid || '').split(':')[0].replace(/[^0-9]/g, '');

module.exports = {
  name     : 'mute',
  aliases  : ['close', 'muteall'],
  desc     : 'Mute the group (only admins can chat)',
  groupOnly: true,

  /** @param {import('@whiskeysockets/baileys').proto.WebMessageInfo} msg
   *  @param {{ conn: import('@whiskeysockets/baileys').WASocket }} ctx */
  async run (msg, { conn }) {

    const chatId   = msg.key.remoteJid;
    const senderId = norm(msg.key.participant || chatId);

    /* 1) gather admin list */
    const meta   = await conn.groupMetadata(chatId);
    const admins = meta.participants
                       .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
                       .map(p => norm(p.id));

    /* 2) permission check */
    const callerOK =
          admins.includes(senderId) ||
          ownerIDs.map(norm).includes(senderId) ||
          mods.map(norm).includes(senderId);

    if (!callerOK) {
      await conn.sendMessage(chatId,
        { text: '❌ Only group admins, mods or the owner can use this cmd, Baka!' },
        { quoted: msg });
      return;
    }

    /* 3) verify bot is admin */
    const botId = norm(conn.user.id);
    if (!admins.includes(botId)) {
      await conn.sendMessage(chatId,
        { text: '⚠️ I need to be an admin to mute the group, Baka!' },
        { quoted: msg });
      return;
    }

    /* 4) close the group */
    try {
      await conn.groupSettingUpdate(chatId, 'announcement'); // only admins may send
      await conn.sendMessage(chatId,
        { text: '🔇 Group muted. Only admins can send messages now, Baka!' },
        { quoted: msg });
    } catch (err) {
      console.error('mutegc error:', err);
      await conn.sendMessage(chatId,
        { text: '❌ Failed to mute the group, Baka!' },
        { quoted: msg });
    }
  }
};
