const path = require('path');
const fs = require('fs');
const antilinkCmd = require('./commands/antilink2.js');
const ariseCmd = require('./commands2/arise2.js');

// In-memory store for counts (or move to global if you want persistence)
global.userLinkCount = global.userLinkCount || {};

async function messageHandler(msg, conn) {
  if (!msg.message) return;

  const chatId = msg.key.remoteJid;
  const senderId = (msg.key.participant || msg.key.remoteJid || '').split(':')[0].replace(/[^0-9]/g, '');

  // --- PREFIX COMMAND: .arise ---
  const prefix = '.';
  let plainText = '';
  if (msg.message.conversation) plainText = msg.message.conversation;
  else if (msg.message.extendedTextMessage?.text) plainText = msg.message.extendedTextMessage.text;
  else if (msg.message.imageMessage?.caption) plainText = msg.message.imageMessage.caption;
  else if (msg.message.videoMessage?.caption) plainText = msg.message.videoMessage.caption;

  if (plainText.startsWith(prefix)) {
    const [cmdName, ...args] = plainText.slice(prefix.length).trim().split(/\s+/);
    if (cmdName.toLowerCase() === 'arise') {
      await ariseCmd.run(msg, { conn, args });
      return;
    }
    // ...add more prefix commands here if needed
  }

  // --- ANTI-LINK LOGIC ---
  if (!antilinkCmd.antlinkGroups || !antilinkCmd.antlinkGroups[chatId]) return; // antlink off for this group

  // Ignore bot's own messages
  if (senderId === (conn.user?.id || '').split(':')[0].replace(/[^0-9]/g, '')) return;

  // Check for links (same regex as before)
  const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|(\w+\.\w{2,}\/?)/i;
  if (!urlRegex.test(plainText)) return;

  // Get group admins
  const meta = await conn.groupMetadata(chatId);
  const admins = meta.participants
    .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
    .map(p => (p.id || '').split(':')[0].replace(/[^0-9]/g, ''));

  const { ownerIDs, mods } = require('./config');
  const norm = jid => (jid || '').split(':')[0].replace(/[^0-9]/g, '');

  const isOwner = ownerIDs.map(norm).includes(senderId);
  const isMod = mods.map(norm).includes(senderId);
  const isAdmin = admins.includes(senderId);

  if (!global.userLinkCount[chatId]) global.userLinkCount[chatId] = {};
  if (!global.userLinkCount[chatId][senderId]) global.userLinkCount[chatId][senderId] = 0;

  global.userLinkCount[chatId][senderId]++;

  // Delete the message
  await conn.sendMessage(chatId, { delete: msg.key }, { messageId: msg.key.id });

  if (global.userLinkCount[chatId][senderId] === 1) {
    // First warning
    await conn.sendMessage(chatId, {
      text: `⚠️ @${senderId.split('@')[0]}, you sent a link! This is your first warning, Baka! Don't do it again!`,
      mentions: [msg.key.participant || msg.key.remoteJid],
    }, { quoted: msg });
  } else if (global.userLinkCount[chatId][senderId] >= 2) {
    if (isOwner || isMod || isAdmin) {
      // Warn but no kick
      await conn.sendMessage(chatId, {
        text: `⚠️ @${senderId.split('@')[0]}, you sent another link but can't be kicked, Baka! Please stop!`,
        mentions: [msg.key.participant || msg.key.remoteJid],
      }, { quoted: msg });
    } else {
      // Kick user after 5 sec warning
      await conn.sendMessage(chatId, {
        text: `🚫 @${senderId.split('@')[0]} sent a second link and will be kicked in 5 seconds, Baka!`,
        mentions: [msg.key.participant || msg.key.remoteJid],
      }, { quoted: msg });

      setTimeout(async () => {
        try {
          await conn.groupRemove(chatId, [senderId]);
          delete global.userLinkCount[chatId][senderId];
        } catch (e) {
          console.error('Failed to kick user:', e);
        }
      }, 5000);
    }
  }
}

module.exports = messageHandler;
