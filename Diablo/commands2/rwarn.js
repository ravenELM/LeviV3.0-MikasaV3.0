// commands/group-rwarn.js
const fs = require('fs');
const path = require('path');

const WARN_FILE = path.join(process.cwd(), 'data', 'warns.json');
function loadWarns() {
  return fs.existsSync(WARN_FILE) ? JSON.parse(fs.readFileSync(WARN_FILE, 'utf-8')) : {};
}
function saveWarns(data) {
  fs.writeFileSync(WARN_FILE, JSON.stringify(data, null, 2));
}

module.exports = {
  name: 'rwarn',
  aliases: ['removewarn'],
  groupOnly: true,
  description: 'Remove one warning from a user',

  async run(msg, { conn }) {
    const chatId = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;

    // Must be a reply
    const target = msg.message?.extendedTextMessage?.contextInfo?.participant;
    if (!target) {
      return conn.sendMessage(chatId, { text: '⚠️ Reply to a user to remove a warning, Baka!' }, { quoted: msg });
    }

    // Get group metadata
    const metadata = await conn.groupMetadata(chatId);
    const participants = metadata?.participants || [];

    const isOwner = global.config?.ownerIDs?.includes(sender);
    const isMod = global.config?.modIDs?.includes(sender);
    const senderData = participants.find(p => p.id === sender);
    const targetData = participants.find(p => p.id === target);
    const senderAdmin = senderData?.admin !== null && senderData?.admin !== undefined;
    const targetAdmin = targetData?.admin !== null && targetData?.admin !== undefined;

    if (!isOwner && !isMod && !senderAdmin) {
      return conn.sendMessage(chatId, { text: '❌ Only my owner, mods, or group admins can use this command, Baka!' }, { quoted: msg });
    }


    // Load, update, and save warns
    const warns = loadWarns();
    if (!warns[chatId] || !warns[chatId][target] || warns[chatId][target] <= 0) {
      return conn.sendMessage(chatId, {
        text: `🚫 @${target.split('@')[0]} has no warnings to remove, Baka!`,
        mentions: [target]
      }, { quoted: msg });
    }

    warns[chatId][target] -= 1;
    if (warns[chatId][target] <= 0) {
      delete warns[chatId][target];
    }

    saveWarns(warns);

    await conn.sendMessage(chatId, {
      text: `✅ Removed 1 warning from @${target.split('@')[0]}, Baka!\n📉 Now at ${warns[chatId][target] || 0}/3.`,
      mentions: [target]
    }, { quoted: msg });
  }
};
