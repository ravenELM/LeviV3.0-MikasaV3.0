// commands/game-gw.js
const riddles = [
  { q: 'I speak without a mouth and hear without ears. What am I?',      a: 'echo' },
  { q: 'I have keys but no locks, space but no rooms. What am I?',       a: 'keyboard' },
  { q: 'What gets wetter the more it dries?',                            a: 'towel' },
  { q: 'The more you take, the more you leave behind. What are they?',   a: 'footsteps' },
  { q: 'What has to be broken before you can use it?',                   a: 'egg' },
  // …add the rest of your ~50 riddles
];

module.exports = {
  name: 'gw',
  aliases: ['guessword'],
  description: 'Guess‑the‑Word: answer with .<word> within 60 s',
  groupOnly: true,

  async run (msg, { conn, prefix }) {
    const chatId = msg.key.remoteJid;

    // pick a random riddle
    const { q, a } = riddles[Math.floor(Math.random() * riddles.length)];
    const clue = `🧠 *Guess‑the‑Word*\n\n${q}\n\n⌛ Type .answer within 60 s!`;

    // send riddle and save session
    const sent = await conn.sendMessage(chatId, { text: clue }, { quoted: msg });

    conn.gwSessions ??= {};
    conn.gwSessions[chatId] = {
      answer : a.toLowerCase(),
      askedAt: Date.now(),
      timeout: setTimeout(() => delete conn.gwSessions[chatId], 60_000)
    };
  }
};
