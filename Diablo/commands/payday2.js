const db = require('../db/economy');
const config = require('../config');

const COOLDOWN = 12 * 60 * 60 * 1000; // 12 hours cooldown
const REWARD = 5_000;

module.exports = {
  name: 'payday',
  description: 'Claim your payday coins (only in official economy groups)',
  groupOnly: true,

  async run(msg, { conn }) {
    const chatId = msg.key.remoteJid;
    const userId = msg.key.participant || chatId;

    // 1. Group validation
    if (!chatId.endsWith('@g.us')) {
      return conn.sendMessage(chatId, {
        text: '❌ Payday can only be claimed in a group, Baka!'
      }, { quoted: msg });
    }

    if (!config.economyGroups.includes(chatId)) {
      return conn.sendMessage(chatId, {
        text: '🚦Economy is not active in current group.'
      }, { quoted: msg });
    }

    // 2. Load user data and last payday claim
    const user = db.getUser(userId);
    const lastClaim = user.paydayLastClaim || 0;

    // 3. Check cooldown
    const now = Date.now();
    if (now - lastClaim < COOLDOWN) {
      const minsLeft = Math.ceil((COOLDOWN - (now - lastClaim)) / 60000);
      return conn.sendMessage(chatId, {
        text: `⏳ Payday already claimed! Try again in *${minsLeft} min*.`
      }, { quoted: msg });
    }

    // 4. Give reward
    db.addBalance(userId, REWARD);

    // 5. Update payday timestamp
    user.paydayLastClaim = now;
    db.setUser(userId, user);

    // 6. Send confirmation with preview
    const promoLink = 'https://tinyurl.com/3627swpx';
    const text =
      `💼 *Payday claimed!* +${REWARD.toLocaleString()} coins\n` +
      `🔗 Check bonuses: ${promoLink}`;

    await conn.sendMessage(chatId, {
      text,
      contextInfo: {
        externalAdReply: {
          title: "PAYDAY BONUS",
          body: "Earn your payday and keep hustling!",
          thumbnailUrl: 'https://thumbs.dreamstime.com/b/money-bag-filled-dollars-24929385.jpg',
          mediaType: 1,
          renderLargerThumbnail: false,
          showAdAttribution: false,
          sourceUrl: promoLink
        }
      }
    }, { quoted: msg });
  }
};
