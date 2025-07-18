// commands/group-promote.js
const { ownerIDs, mods } = require('../config');

const norm = jid => (jid || '').split(':')[0].replace(/[^0-9]/g, '');

module.exports = {
  name: 'promote',
  aliases: ['p'],
  desc: 'Promote mentioned / replied user(s) to admin',
  groupOnly: true,

  async run(msg, { conn }) {
    const chatId   = msg.key.remoteJid;
    const callerId = norm(msg.key.participant || msg.key.remoteJid);

    /* 1️⃣ current admins */
    const meta   = await conn.groupMetadata(chatId);
    const admins = meta.participants
      .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
      .map(p => norm(p.id));

    /* 2️⃣ permission gate */
    const callerOK =
      admins.includes(callerId) ||
      ownerIDs.map(norm).includes(callerId) ||
      mods.map(norm).includes(callerId);

    if (!callerOK) {
      return conn.sendMessage(chatId,
        { text: '❌ Only group admins (or my owner / mods) can use this, Baka!' },
        { quoted: msg });
    }

    /* 3️⃣ bot must be admin */
    const botId = norm(conn.user.id);
    if (!admins.includes(botId)) {
      return conn.sendMessage(chatId,
        { text: '⚠️ I need *admin* rights to promote members, Baka!' },
        { quoted: msg });
    }

    /* 4️⃣ targets (mentions or replied) */
    const mention = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid ?? [];
    const replied = msg.message?.extendedTextMessage?.contextInfo?.participant
      ? [msg.message.extendedTextMessage.contextInfo.participant] : [];

    const targets = [...new Set([...mention, ...replied].map(norm))];
    if (targets.length === 0) {
      return conn.sendMessage(chatId,
        { text: '⚠️ Tag or reply to someone to promote.\nExample: *.promote @user*' },
        { quoted: msg });
    }

    /* 5️⃣ promote loop */
    for (const rawId of targets) {
      const fullJid = `${rawId}@s.whatsapp.net`;

      if (rawId === botId) {                 // skip bot itself
        await conn.sendMessage(chatId,
          { text: '🤖 I cannot promote myself.', mentions: [fullJid] },
          { quoted: msg });
        continue;
      }

      if (admins.includes(rawId)) {          // already admin
        await conn.sendMessage(chatId,
          { text: `ℹ️ @${rawId} is already an admin.`, mentions: [fullJid] },
          { quoted: msg });
        continue;
      }

      try {
        await conn.groupParticipantsUpdate(chatId, [fullJid], 'promote');
        await conn.sendMessage(chatId,
          { text: `✅ @${rawId} has been promoted to admin! 🎉`, mentions: [fullJid] },
          { quoted: msg });
      } catch (err) {
        console.error('Promote failed:', err);
        await conn.sendMessage(chatId,
          { text: `❌ Failed to promote @${rawId}.`, mentions: [fullJid] },
          { quoted: msg });
      }
    }
  }
};
