/**
 * group-setgname.js  –  Change the group’s name
 * Usage:  .setgname <new name>
 */
const { ownerIDs, mods } = require('../config');

// helper – strip “:device” & non‑digits (for admin checks)
const norm = jid => (jid || '').split(':')[0].replace(/[^0-9]/g, '');

module.exports = {
  name     : 'setname',
  aliases  : ['gname', 'setname'],
  desc     : 'Change group name (owner / mod / admin only)',
  groupOnly: true,

  /** @param {import('@whiskeysockets/baileys').proto.WebMessageInfo} msg */
  async run (msg, { conn, args }) {
    const chatId   = msg.key.remoteJid;
    const callerId = norm(msg.key.participant || chatId);

    /* 1️⃣  Ensure we’re in a group */
    if (!chatId.endsWith('@g.us')) {
      return conn.sendMessage(chatId,
        { text: '❌ This command only works in groups, Baka!' },
        { quoted: msg });
    }

    /* 2️⃣  Gather group admins */
    const meta        = await conn.groupMetadata(chatId);
    const participants= meta.participants;
    const admins      = participants
                          .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
                          .map(p => norm(p.id));

    /* 3️⃣  Permission gate for caller */
    const callerOK =
          admins.includes(callerId)
          || ownerIDs.map(norm).includes(callerId)
          || mods.map(norm).includes(callerId);

    if (!callerOK) {
      return conn.sendMessage(chatId,
        { text: '❌ Only group admins (or my owner / mods) can use this, Baka!' },
        { quoted: msg });
    }

    /* 4️⃣  Bot must be admin to change subject */
    const botId      = norm(conn.user.id);
    const botIsAdmin = admins.includes(botId);
    if (!botIsAdmin) {
      return conn.sendMessage(chatId,
        { text: '⚠️ I need *admin* rights to change the group name, Baka!' },
        { quoted: msg });
    }

    /* 5️⃣  New name provided? */
    const newName = args.join(' ').trim();
    if (!newName) {
      return conn.sendMessage(chatId,
        { text: '⚠️ Usage: *.setgname <new group name>*' },
        { quoted: msg });
    }
    if (newName.length > 75) {
      return conn.sendMessage(chatId,
        { text: '⚠️ Group names are limited to 75 characters, Baka!' },
        { quoted: msg });
    }

    /* 6️⃣  Attempt to update */
    try {
      await conn.groupUpdateSubject(chatId, newName);
      await conn.sendMessage(chatId,
        { text: `✅ Group name updated to:\n*${newName}*` },
        { quoted: msg });
    } catch (err) {
      console.error('[setgname] error:', err);
      await conn.sendMessage(chatId,
        { text: '❌ Failed to change group name (WhatsApp may rate‑limit).' },
        { quoted: msg });
    }
  }
};
