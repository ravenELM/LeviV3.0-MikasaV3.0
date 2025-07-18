const fs = require('fs');
const path = require('path');

const STORE = path.join(__dirname, '../data/antilink.json');

// In-memory warn tracking for antilink command
const antilinkWarns = {};
const WARN_LIMIT = 3;

// Helper to load/save persistent antilink groups
function loadAntilinkGroups() {
  try {
    return JSON.parse(fs.readFileSync(STORE));
  } catch {
    return {};
  }
}
function saveAntilinkGroups(obj) {
  fs.writeFileSync(STORE, JSON.stringify(obj, null, 2));
}

module.exports = {
  name: 'antilink',
  aliases: [],
  desc: 'Enable or disable anti-link for this group (owner/mod only)',
  async run(msg, { conn, ownerIDs, mods }) {
    const chatId = msg.key.remoteJid;
    const senderId = (msg.key.participant || chatId).split(':')[0];
    const isPrivileged = ownerIDs.includes(senderId) || (mods && mods.includes(senderId));

    // Only warn if user actually sent a link (http, https, www, .com, .eu, etc)
    const textMsg = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
    const linkRegex = /(https?:\/\/|www\.|\.com|\.net|\.org|\.eu|\.me|\.in|\.ru|\.xyz|\.seychelles)/i;

    if (!isPrivileged && sentLink) {
      antilinkWarns[senderId] = (antilinkWarns[senderId] || 0) + 1;
      const warnCount = antilinkWarns[senderId];
      const left = WARN_LIMIT - warnCount;

      let warnMsg = `────⬡⚠WARNING⚠⬡────\n`;
      warnMsg += `├▢ USER : @${senderId.split('@')[0]}\n`;
      warnMsg += `├▢ COUNT : ${warnCount}/${WARN_LIMIT}\n`;
      warnMsg += `├▢ WARN LIMIT : ${WARN_LIMIT}\n`;
      warnMsg += `├▢ LEFT : ${left} Warning${left !== 1 ? 's' : ''}\n`;
      warnMsg += `├▢ REASON : sent a link\n`;
      warnMsg += `╰────────────────\n`;
      warnMsg += `\nYou have ${WARN_LIMIT} warns before getting kicked.`;

      await conn.sendMessage(chatId, {
        text: warnMsg,
        mentions: [senderId]
      }, { quoted: msg });

      if (warnCount >= WARN_LIMIT) {
        await conn.sendMessage(chatId, {
          text: `🚫 @${senderId.split('@')[0]} has been *kicked* for spamming links!`,
          mentions: [senderId]
        }, { quoted: msg });
        // Kick the user from the group
        if (conn.groupParticipantsUpdate) {
          await conn.groupParticipantsUpdate(chatId, [senderId], "remove").catch(() => {});
        }
        antilinkWarns[senderId] = 0;
      }
      return;
    }

    const arg = (msg.message.conversation || msg.message.extendedTextMessage?.text || '').split(/\s+/)[1];
    if (!arg || !['on', 'off'].includes(arg.toLowerCase())) {
      return conn.sendMessage(chatId, { text: 'Usage: .antilink on/off' }, { quoted: msg });
    }

    let groups = loadAntilinkGroups();

    if (arg.toLowerCase() === 'on') {
      groups[chatId] = true;
      saveAntilinkGroups(groups);
      return conn.sendMessage(chatId, { text: '✅ Anti-link is now *enabled* for this group.' }, { quoted: msg });
    } else {
      delete groups[chatId];
      saveAntilinkGroups(groups);
      return conn.sendMessage(chatId, { text: '❌ Anti-link is now *disabled* for this group.' }, { quoted: msg });
    }
  }
};