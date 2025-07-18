// getc.js
const fs = require('fs');
const path = require('path');
const db = require('../db/economy');

const claimedPath = path.join(__dirname, '..', 'data', 'claimed.json');
const cooldownPath = path.join(__dirname, '..', 'data', 'cooldown.json');

if (!fs.existsSync(claimedPath)) fs.writeFileSync(claimedPath, '{}');
if (!fs.existsSync(cooldownPath)) fs.writeFileSync(cooldownPath, '{}');

const loadJSON = (file) => JSON.parse(fs.readFileSync(file));
const saveJSON = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2));

const cooldownTimes = {
  T1: 2 * 60 * 60 * 1000,
  T2: 4 * 60 * 60 * 1000,
  T3: 6 * 60 * 60 * 1000,
  T4: 8 * 60 * 60 * 1000,
  T5: 10 * 60 * 60 * 1000,
  T6: 12 * 60 * 60 * 1000,
  TS: 24 * 60 * 60 * 1000
};

module.exports = {
  name: 'getc',
  run: async (msg, { conn, args }) => {
    try {
      const chatId = msg.key.remoteJid;
      const senderId = msg.key.participant || chatId;

      if (!args[0]) {
        return conn.sendMessage(chatId, { text: '❌ Usage: *.getc [captcha]*' }, { quoted: msg });
      }

      const captcha = args[0].toUpperCase();
      const activeCards = global.activeCards || {};

      if (!Object.values(activeCards).length) {
        return conn.sendMessage(chatId, { text: '⚠️ No active cards to claim.' }, { quoted: msg });
      }

      const card = Object.values(activeCards).find(c => c.captcha === captcha);

      if (!card) {
        return conn.sendMessage(chatId, { text: '❌ Invalid or expired captcha.' }, { quoted: msg });
      }

      if (card.groupId !== chatId) {
        return conn.sendMessage(chatId, { text: '❌ You can only claim cards from this group.' }, { quoted: msg });
      }

      const cooldowns = loadJSON(cooldownPath);
      const now = Date.now();

      // Single cooldown per user for all tiers:
      if (cooldowns[senderId] && cooldowns[senderId] > now) {
        const remaining = cooldowns[senderId] - now;
        const h = Math.floor(remaining / 3600000);
        const m = Math.floor((remaining % 3600000) / 60000);
        const s = Math.floor((remaining % 60000) / 1000);

        return conn.sendMessage(chatId, {
          text: `😵 Whooa, you have a cooldown active! Please wait *${h}h ${m}m ${s}s* before claiming another card.`
        }, { quoted: msg });
      }

      const userBal = await db.getBalance(senderId);
      if (userBal < card.price) {
        return conn.sendMessage(chatId, {
          text: `❌ Not enough coins to claim *${card.name}*.\n💰 Price: *${card.price.toLocaleString()}*\n🪙 Balance: *${userBal.toLocaleString()}*`
        }, { quoted: msg });
      }

      const claims = loadJSON(claimedPath);
      if (!claims[senderId]) claims[senderId] = {};

      if (claims[senderId][card.id]) {
        return conn.sendMessage(chatId, { text: '⚠️ You already claimed this card.' }, { quoted: msg });
      }

      await db.addBalance(senderId, -card.price);

      claims[senderId][card.id] = {
        name: card.name,
        tier: card.tier,
        img: card.img,
        captcha: card.captcha,
        price: card.price,
        url: `https://shoob.gg/cards/info/${card.id}`
      };
      saveJSON(claimedPath, claims);

      delete global.activeCards[card.id];

      // Set single cooldown per user based on claimed card's tier
      const tierCooldown = cooldownTimes[card.tier] || cooldownTimes.T1;
      cooldowns[senderId] = now + tierCooldown;
      saveJSON(cooldownPath, cooldowns);

      await conn.sendMessage(chatId, {
        text:
          `🎉 Congratulations! 🎉 You have successfully claimed:\n\n` +
          `🌟 Name: ${card.name}\n` +
          `💎 Tier: ${card.tier}\n` +
          `💰 Price: $${card.price}\n\n` +
          `Use *.vc <index>* to view your card.`
      }, { quoted: msg });

      const cooldownHours = Math.floor(tierCooldown / 3600000);
      const cooldownMinutes = Math.floor((tierCooldown % 3600000) / 60000);

      await conn.sendMessage(chatId, {
        text: `⏳ A cooldown of *${cooldownHours}h ${cooldownMinutes}m* has been applied.`
      }, { quoted: msg });

      console.log(`[cards] ${senderId} claimed ${card.name} (${card.captcha})`);

    } catch (err) {
      console.error('❌ getc error:', err);
      if (msg?.key?.remoteJid) {
        try {
          await conn.sendMessage(msg.key.remoteJid, { text: '❌ An error occurred while processing your request.' }, { quoted: msg });
        } catch {}
      }
    }
  }
};
