const fs = require('fs');
const path = require('path');
const warnFile = path.resolve('data/warns.json');
const { ownerIDs, mods } = require('../config');

function loadWarns() {
  if (!fs.existsSync(warnFile)) return {};
  try {
    return JSON.parse(fs.readFileSync(warnFile, 'utf8'));
  } catch {
    return {};
  }
}

function saveWarns(data) {
  fs.writeFileSync(warnFile, JSON.stringify(data, null, 2));
}

const norm = jid => (jid || '').split(':')[0].replace(/[^0-9]/g, '');

module.exports = {
  name: 'warn',
  aliases: ['warnuser'],
  description: 'Warn a user in the group. Automatically kicks after 5 warns.',
  run: async (msg, { conn, args }) => {
    const chatId = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;
    const senderNorm = norm(sender);

    // Only owner or mods can warn
    const isOwner = ownerIDs.map(norm).includes(senderNorm);
    const isMod = mods.map(norm).includes(senderNorm);
    if (!isOwner && !isMod) {
      await conn.sendMessage(chatId, { text: "❌ You don't have permission to warn users." }, { quoted: msg });
      return;
    }

    if (args.length < 1) {
      await conn.sendMessage(chatId, { text: "Usage: .warn @user [reason]" }, { quoted: msg });
      return;
    }

    let userToWarn = args[0];
    if (!userToWarn.includes('@')) userToWarn += '@s.whatsapp.net';

    const userNorm = norm(userToWarn);
    const reason = args.slice(1).join(' ') || 'No reason specified';

    const warnsData = loadWarns();
    if (!Array.isArray(warnsData[userNorm])) warnsData[userNorm] = [];

    if (warnsData[userNorm].length >= 5) {
      warnsData[userNorm].push({
        groupId: chatId,
        time: new Date().toISOString(),
        reason,
        warnedBy: senderNorm,
      });
      saveWarns(warnsData);

      await conn.sendMessage(chatId, {
        text: `⚠️ @${userNorm}, you have been warned but already reached max warnings (5). No further kicks will happen.`,
        mentions: [userToWarn],
      }, { quoted: msg });

      return;
    }

    warnsData[userNorm].push({
      groupId: chatId,
      time: new Date().toISOString(),
      reason,
      warnedBy: senderNorm,
    });
    saveWarns(warnsData);

    const warnCount = warnsData[userNorm].length;

    await conn.sendMessage(chatId, {
      text: `⚠️ @${userNorm} has been warned.\nReason: ${reason}\nWarning #${warnCount} out of 5.`,
      mentions: [userToWarn],
    }, { quoted: msg });

    if (warnCount === 5) {
      await conn.sendMessage(chatId, {
        text: `❌ @${userNorm} has reached 5 warnings and will be removed from this group.`,
        mentions: [userToWarn],
      }, { quoted: msg });

      try {
        await conn.groupParticipantsUpdate(chatId, [userToWarn], 'remove');
      } catch (e) {
        console.error('Failed to kick user:', e);
      }
    }
  }
};
