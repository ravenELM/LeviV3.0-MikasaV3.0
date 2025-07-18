/**
 * group-setdesc.js – Change group description
 * Usage: .setdesc <new description>
 */
const { ownerIDs, mods } = require('../config');
const norm = jid => (jid || '').split(':')[0].replace(/[^0-9]/g, '');

module.exports = {
  name: 'setdesc',
  aliases: ['gdesc', 'setdescription', 'desc'],
  desc: 'Change group description (admin only)',
  groupOnly: true,

  /** @param {import('@whiskeysockets/baileys').proto.WebMessageInfo} msg */
  async run(msg, { conn, args }) {
    const chatId = msg.key.remoteJid;
    const senderId = norm(msg.key.participant || msg.key.remoteJid);

    if (!chatId.endsWith('@g.us')) {
      return conn.sendMessage(chatId,
        { text: '❌ This command only works in groups.' },
        { quoted: msg });
    }

    const metadata = await conn.groupMetadata(chatId);
    const admins = metadata.participants
      .filter(p => p.admin)
      .map(p => norm(p.id));

    const isAllowed =
      admins.includes(senderId) ||
      ownerIDs.map(norm).includes(senderId) ||
      mods.map(norm).includes(senderId);

    if (!isAllowed) {
      return conn.sendMessage(chatId,
        { text: '❌ Only group admins or my owner/mods can use this!' },
        { quoted: msg });
    }

    const botId = norm(conn.user.id);
    const botIsAdmin = admins.includes(botId);
    if (!botIsAdmin) {
      return conn.sendMessage(chatId,
        { text: '⚠️ I need admin rights to update the description.' },
        { quoted: msg });
    }

    const newDesc = args.join(' ').trim();
    if (!newDesc) {
      return conn.sendMessage(chatId,
        { text: '⚠️ Usage: *.setdesc <description>*' },
        { quoted: msg });
    }
    if (newDesc.length > 512) {
      return conn.sendMessage(chatId,
        { text: '⚠️ Description can’t exceed 512 characters.' },
        { quoted: msg });
    }

    try {
      await conn.groupUpdateDescription(chatId, newDesc);
      await conn.sendMessage(chatId,
        { text: '✅ Group description updated!' },
        { quoted: msg });
    } catch (err) {
      console.error('[setdesc]', err);
      await conn.sendMessage(chatId,
        { text: '❌ Failed to update description. Try again later.' },
        { quoted: msg });
    }
  }
};
