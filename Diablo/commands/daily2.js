const db      = require('../db/economy');
const config  = require('../config');

module.exports = {
  name: 'daily',
  desc : 'Claim daily coins (only in owner economy group)',
  groupOnly: true,

  async run(msg, { conn }) {
    const chatId = msg.key.remoteJid;
    const userId = msg.key.participant || chatId;

    /* Allow only in whitelisted groups */
    if (!config.economyGroups.includes(chatId)) {
      return conn.sendMessage(
        chatId,
        { text: '❌ This command only works in the official economy groups.' },
        { quoted: msg }
      );
    }

    const now       = Date.now();
    const lastClaim = db.getDaily(userId);
    const COOLDOWN  = 24 * 60 * 60 * 1000; // 24 h

    if (now - lastClaim < COOLDOWN) {
      const minsLeft = Math.ceil((COOLDOWN - (now - lastClaim)) / 60000);
      return conn.sendMessage(
        chatId,
        { text: `⏳ Already claimed! Try again in *${minsLeft} min*.` },
        { quoted: msg }
      );
    }

    /* Reward */
    const reward = 10_000;
    db.addBalance(userId, reward);
    db.setDaily(userId, now);

    /* Send confirmation with preview */
    const promoLink = 'https://tinyurl.com/3627swpx';
    const text =
      `🎁 *Daily claimed!* +${reward} coins\n` +
      `🔗 More bonuses: ${promoLink}`;

    await conn.sendMessage(chatId, {
      text,
      contextInfo: {
        externalAdReply: {
          title: "DAILY BONUS CLAIMED",
          body: "Keep up your streak and earn more!",
          thumbnailUrl: 'https://img.freepik.com/premium-vector/money-vector-illustration-banknotes-gold-coins-with-dollar-sign-isolated-white-background_338371-2034.jpg',
          mediaType: 1,
          renderLargerThumbnail: false,
          showAdAttribution: false,
          sourceUrl: promoLink
        }
      }
    }, { quoted: msg });
  }
};
