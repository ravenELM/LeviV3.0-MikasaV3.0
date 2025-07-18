const { ownerIDs, mods } = require('../config');

const norm = jid => (jid || '').split(':')[0].replace(/[^0-9]/g, '');

module.exports = {
  name: 'demote',
  aliases: [],
  groupOnly: true,
  desc: 'Demote mentioned or replied admin(s)',

  async run(msg, { conn }) {
    const chatId = msg.key.remoteJid;
    const senderId = norm(msg.key.participant || msg.key.remoteJid);

    const meta = await conn.groupMetadata(chatId);
    const participants = meta.participants;
    const admins = participants
      .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
      .map(p => norm(p.id));

    const callerOK =
      admins.includes(senderId) ||
      ownerIDs.map(norm).includes(senderId) ||
      mods.map(norm).includes(senderId);

    if (!callerOK) {
      return conn.sendMessage(chatId,
        { text: '❌ Only group admins (or my owner/mods) can use this, Baka!' },
        { quoted: msg });
    }

    const botId = norm(conn.user.id);
    const botIsAdmin = admins.includes(botId);

    if (!botIsAdmin) {
      return conn.sendMessage(chatId,
        { text: '⚠️ I need *admin* rights to demote members, Baka!' },
        { quoted: msg });
    }

    const mention = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid ?? [];
    const replied = msg.message?.extendedTextMessage?.contextInfo?.participant
      ? [msg.message.extendedTextMessage.contextInfo.participant]
      : [];

    const targets = [...new Set([...mention, ...replied].map(norm))];

    if (targets.length === 0) {
      return conn.sendMessage(chatId,
        { text: '⚠️ Tag or reply to someone to demote.\nExample: *.demote @user*' },
        { quoted: msg });
    }

    for (const rawId of targets) {
      const fullJid = `${rawId}@s.whatsapp.net`;

      const isOwner = ownerIDs.map(norm).includes(rawId);
      const isMod = mods.map(norm).includes(rawId);
      const isBot = rawId === botId;
      const isAdmin = admins.includes(rawId);

      if (!isAdmin) {
        await conn.sendMessage(chatId,
          { text: `ℹ️ @${rawId} is not an admin.`, mentions: [fullJid] },
          { quoted: msg });
        continue;
      }

      if (isOwner || isMod || isBot) {
        await conn.sendMessage(chatId,
          { text: `🚫 Cannot demote my Master or Mods @${rawId} (protected).`, mentions: [fullJid] },
          { quoted: msg });
        continue;
      }

      try {
        await conn.groupParticipantsUpdate(chatId, [fullJid], 'demote');
        await conn.sendMessage(chatId,
          { text: `✅ @${rawId} has been demoted from admin.`, mentions: [fullJid] },
          { quoted: msg });
      } catch (err) {
        console.error('Demote failed:', err);
        await conn.sendMessage(chatId,
          { text: `❌ Failed to demote @${rawId}.`, mentions: [fullJid] },
          { quoted: msg });
      }
    }
  }
};
