const db = require('../db/economy');
const economyGroups = require('../data/economy-groups.json');

const NUMBERS = ['🎱', '🎯', '🎲', '🎳', '🎰', '🎮'];
const JACKPOT = 200_000;
const TWO_MATCH_PRIZE = () => Math.floor(Math.random() * 1000) + 500;
const DAILY_MAX = 2;

function resetIfNewDay(lottery) {
  const today = new Date().setUTCHours(0, 0, 0, 0);
  if (!lottery.lastUsed || lottery.lastUsed < today) {
    lottery.count = 0;
    lottery.lastUsed = Date.now();
  }
}

module.exports = {
  name: 'lottery',
  aliases: ['lotto', 'lot'],
  description: 'Play the lottery (max 2 times/day)',

  async run(msg, { conn }) {
    const chatId = msg.key.remoteJid;
    const senderId = msg.key.participant || chatId;

    if (!chatId.endsWith('@g.us')) {
      return conn.sendMessage(chatId, { text: '❌ Lottery can only be played in groups!' }, { quoted: msg });
    }

    if (economyGroups.length && !economyGroups.includes(chatId)) {
      return conn.sendMessage(chatId, { text: '🚦Economy is not active in current group.' }, { quoted: msg });
    }

    let user = db.getUser(senderId);
    if (!user.lottery) user.lottery = { count: 0, lastUsed: 0 };
    resetIfNewDay(user.lottery);

    if (user.lottery.count >= DAILY_MAX) {
      return conn.sendMessage(chatId, { text: '♻️ You have used your 2 lottery chances today. Try again tomorrow!' }, { quoted: msg });
    }

    const draw = Array.from({ length: 3 }, () =>
      NUMBERS[Math.floor(Math.random() * NUMBERS.length)]
    );

    const allEqual = draw.every(e => e === draw[0]);
    const twoEqual = new Set(draw).size === 2;
    let reward = 0;

    if (allEqual) reward = JACKPOT;
    else if (twoEqual) reward = TWO_MATCH_PRIZE();

    if (reward > 0) {
      db.addBalance(senderId, reward);
    }

    user.lottery.count++;
    user.lottery.lastUsed = Date.now();
    db.setUser(senderId, user);

    const board = draw.join('  |  ');
    const resultText = reward
      ? reward === JACKPOT
        ? `🎉 *JACKPOT!* You won ${reward.toLocaleString()} coins!\nContact the owner to claim your prize!`
        : `✨ You won ${reward.toLocaleString()} coins!`
      : '💔 No luck this time. Try again later.';

    const text = `🎟️ *Lottery* 🎟️\n${board}\n\n${resultText}`;

    await conn.sendMessage(chatId, { text }, { quoted: msg });
  }
};
