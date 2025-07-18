const db = require('../db/economy');
const economyGroups = require('../data/economy-groups.json');

const FRUITS = ['🍒', '🍋', '🍊', '🍉', '🍇', '🍓'];
const JACKPOT = 10_000;
const TWO_MATCH = () => Math.floor(Math.random() * 500) + 1;
const DAILY_MAX = 2;

function resetIfNewDay(state) {
  const today = new Date().setUTCHours(0, 0, 0, 0);
  if (!state.lastUsed || state.lastUsed < today) {
    state.count = 0;
    state.lastUsed = Date.now();
  }
}

module.exports = {
  name: 'slot',
  aliases: ['slots'],
  description: 'Play the slot machine (max 2 spins/day)',
  groupOnly: true,

  async run(msg, { conn }) {
    const chatId = msg.key.remoteJid;
    const userId = msg.key.participant || chatId;

    if (!chatId.endsWith('@g.us')) {
      return conn.sendMessage(chatId, {
        text: '❌ Slots can only be played in groups!'
      }, { quoted: msg });
    }

    if (!economyGroups.includes(chatId)) {
      return conn.sendMessage(chatId, {
        text: '🚦Economy is not active in current group.'
      }, { quoted: msg });
    }

    let user = db.getUser(userId);
    if (!user.slot) user.slot = { count: 0, lastUsed: 0 };
    resetIfNewDay(user.slot);

    if (user.slot.count >= DAILY_MAX) {
      return conn.sendMessage(chatId, {
        text: '♻️ You have already used your 2 daily spins. Try again tomorrow!'
      }, { quoted: msg });
    }

    const spin = Array.from({ length: 3 }, () =>
      FRUITS[Math.floor(Math.random() * FRUITS.length)]
    );

    const allEqual = spin.every(fruit => fruit === spin[0]);
    const twoEqual = new Set(spin).size === 2;

    let win = 0;
    if (allEqual) win = JACKPOT;
    else if (twoEqual) win = TWO_MATCH();

    if (win) {
      db.addBalance(userId, win);
    }

    user.slot.count++;
    user.slot.lastUsed = Date.now();
    db.setUser(userId, user);

    const board = spin.join('  |  ');
    const result = win
      ? win === JACKPOT
        ? `🎉 *JACKPOT!* You won ${JACKPOT.toLocaleString()} coins! Go to owner to claim your prize!`
        : `✨ You won ${win.toLocaleString()} coins!`
      : '💔 No win this time. Better luck next spin!';

    const text = `🎰 *Slot Machine* 🎰\n${board}\n\n${result}`;
    await conn.sendMessage(chatId, { text }, { quoted: msg });
  }
};
