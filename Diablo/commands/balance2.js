const db = require('../db/economy'); // Your JSON economy DB
const config = require('../config'); // Reuse config for economy group list

module.exports = {
  name: 'balance',
  aliases: ['bal', 'wallet'],
  description: 'Check your wallet balance',
  groupOnly: true,

  async run(msg, { conn }) {
    const chatId = msg.key.remoteJid;
    const senderId = msg.key.participant || chatId;

    // Restrict to official economy groups
    if (!config.economyGroups.includes(chatId)) {
      return conn.sendMessage(chatId, {
        text: '🚦Economy is not active in current group.'
      }, { quoted: msg });
    }

    // Get user data (wallet) from db
    const user = db.getUser(senderId);
    const wallet = user?.wallet || 0;

    const text =
      `🏦 *Your Balance*\n` +
      `────────────────────\n` +
      `💰 Wallet: *${wallet.toLocaleString()}* coins`;

    await conn.sendMessage(chatId, {
      text,
      contextInfo: {
        externalAdReply: {
          title: "YOUR WALLET",
          body: "Economy System",
          thumbnailUrl: 'https://t4.ftcdn.net/jpg/00/61/06/27/240_F_61062796_NF87GPnWV0fQ2LhoYNlyjev0PocRwZj9.jpg',
          mediaType: 1,
          renderLargerThumbnail: false,
          showAdAttribution: false,
          sourceUrl: ''
        }
      }
    }, { quoted: msg });
  }
};
