const fs = require('fs');
const path = require('path');

const badwordFile = 'data/badwords.json';
const groupSettingFile = 'data/antibadword.json';
const warnFile = path.resolve('data/warns.json'); // global warn storage

const warnMemory = {}; // Temporary warnings per group session

// Load owner and mod IDs once
const { ownerIDs, mods } = require('../config');

function norm(jid) {
  return (jid || '').split(':')[0].replace(/[^0-9]/g, '');
}

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

module.exports = async function handleBadwords(msg, conn) {
  const chatId = msg.key.remoteJid;
  const sender = msg.key.participant || msg.key.remoteJid;

  if (!msg.message || !chatId.endsWith('@g.us')) return false;

  // Check if antibadword enabled
  const groupSettings = fs.existsSync(groupSettingFile)
    ? JSON.parse(fs.readFileSync(groupSettingFile, 'utf8'))
    : {};
  if (!groupSettings[chatId]) return false;

  // Load bad words
  const badwords = fs.existsSync(badwordFile)
    ? JSON.parse(fs.readFileSync(badwordFile, 'utf8'))
    : [];
  if (badwords.length === 0) return false;

  // Get text content
  const text =
    msg.message.conversation ||
    msg.message.extendedTextMessage?.text ||
    msg.message.imageMessage?.caption ||
    msg.message.videoMessage?.caption ||
    '';
  const lowered = text.toLowerCase();

  const match = badwords.find(word => lowered.includes(word));
  if (!match) return false;

  // Delete the message with bad word
  try {
    await conn.sendMessage(chatId, { delete: msg.key });
  } catch (e) {
    console.error('Failed to delete bad word message:', e);
  }

  const senderIdNorm = norm(sender);

  // Check if sender is owner or mod
  const isOwner = ownerIDs.map(norm).includes(senderIdNorm);
  const isMod = mods.map(norm).includes(senderIdNorm);

  // Load global warns
  const warnsData = loadWarns();
  if (!warnsData[senderIdNorm]) warnsData[senderIdNorm] = [];

  // Add new warn to global storage
  warnsData[senderIdNorm].push({
    groupId: chatId,
    time: new Date().toISOString(),
    reason: 'Bad language detected',
  });

  // Save updated warns
  saveWarns(warnsData);

  // Also track temporary warn count per group session
  warnMemory[chatId] = warnMemory[chatId] || {};
  warnMemory[chatId][sender] = (warnMemory[chatId][sender] || 0) + 1;

  const username = sender.split('@')[0];
  const totalWarns = warnsData[senderIdNorm].length;

  if (totalWarns === 1) {
    // First ever warning message
    await conn.sendMessage(chatId, {
      text: `⚠️ @${username}, bad words are not allowed!\nThis is your 1st warning overall.`,
      mentions: [sender],
    }, { quoted: msg });
  } else if (totalWarns < 5) {
    // Warn again, less than 5 warns total
    if (isOwner || isMod) {
      // Owners/mods get warning only
      await conn.sendMessage(chatId, {
        text: `⚠️ @${username}, you used bad language again but as an owner/mod, you won't be kicked. Please stop!`,
        mentions: [sender],
      }, { quoted: msg });
    } else {
      // Warn normal user
      await conn.sendMessage(chatId, {
        text: `⚠️ @${username}, warning #${totalWarns} out of 5 for bad language!`,
        mentions: [sender],
      }, { quoted: msg });
    }
  } else if (totalWarns === 5) {
    // 5th warning reached, kick user if not owner/mod
    if (isOwner || isMod) {
      await conn.sendMessage(chatId, {
        text: `⚠️ @${username}, you have reached 5 warnings but as owner/mod you will not be kicked. Please stop!`,
        mentions: [sender],
      }, { quoted: msg });
    } else {
      await conn.sendMessage(chatId, {
        text: `❌ @${username} has reached 5 warnings and will be removed from this group.`,
        mentions: [sender],
      }, { quoted: msg });

      try {
        await conn.groupParticipantsUpdate(chatId, [sender], 'remove');
      } catch (e) {
        console.error('Failed to kick user:', e);
      }
    }
  } else {
    // More than 5 warnings: just inform no kicks happen anymore
    await conn.sendMessage(chatId, {
      text: `⚠️ @${username}, you have more than 5 warnings but no further actions will be taken.`,
      mentions: [sender],
    }, { quoted: msg });
  }

  return true;
};
