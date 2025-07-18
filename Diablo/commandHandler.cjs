const { ownerIDs, mods } = require('./config');
const norm = jid => (jid || '').split(':')[0].replace(/[^0-9]/g, '');
const antilinkCmd = require('./commands/antilink.js');

global.userLinkCount = global.userLinkCount || {};

async function messageHandler(msg, conn) {
  if (!msg.message) return;

  const chatId = msg.key.remoteJid;
  if (!chatId?.endsWith('@g.us')) return; // Only groups

  if (!antilinkCmd.antlinkGroups[chatId]) return; // antlink off

  const senderId = norm(msg.key.participant || msg.key.remoteJid);
  if (!senderId) return;

  // Ignore bot messages
  if (senderId === norm(conn.user?.id)) return;

  // Get message text (caption or text)
  const textMsg =
    msg.message.conversation ||
    msg.message.extendedTextMessage?.text ||
    msg.message.imageMessage?.caption ||
    msg.message.videoMessage?.caption ||
    '';

  const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|(\w+\.\w{2,}\/?)/i;
  if (!urlRegex.test(textMsg)) return;

  // Get group admins
  const meta = await conn.groupMetadata(chatId);
  const admins = meta.participants
    .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
    .map(p => norm(p.id));

  const isOwner = ownerIDs.map(norm).includes(senderId);
  const isMod = mods.map(norm).includes(senderId);
  const isAdmin = admins.includes(senderId);

  if (!global.userLinkCount[chatId]) global.userLinkCount[chatId] = {};
  if (!global.userLinkCount[chatId][senderId]) global.userLinkCount[chatId][senderId] = 0;

  global.userLinkCount[chatId][senderId]++;

  // Delete the message with the link
  try {
    await conn.sendMessage(chatId, { delete: msg.key }, { messageId: msg.key.id });
  } catch (e) {
    console.error('Failed to delete link message:', e);
  }

  if (global.userLinkCount[chatId][senderId] === 1) {
    // 1st warning
    await conn.sendMessage(chatId, {
      text: `⚠️ @${senderId.split('@')[0]}, you sent a link! This is your first warning, Baka! Don't do it again!`,
      mentions: [msg.key.participant || msg.key.remoteJid],
    }, { quoted: msg });
  } else if (global.userLinkCount[chatId][senderId] >= 2) {
    if (isOwner || isMod || isAdmin) {
      // Warn but no kick for privileged users
      await conn.sendMessage(chatId, {
        text: `⚠️ @${senderId.split('@')[0]}, you sent another link but you can't be kicked, Baka! Please stop!`,
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
