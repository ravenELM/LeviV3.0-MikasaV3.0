module.exports = {
  name: 'rps',
  aliases: ['rockpaperscissors'],
  description: 'Play Rock Paper Scissors. Use `.rps 1` (rock), `.rps 2` (paper), `.rps 3` (scissors)',

  async run(msg, { conn, args }) {
    const chat = msg.key.remoteJid;

    const choices = [
      { name: 'rock', emoji: '🪨' },
      { name: 'paper', emoji: '📄' },
      { name: 'scissors', emoji: '✂️' }
    ];

    if (!args[0]) {
      return conn.sendMessage(chat, {
        text: '❌ You must specify 1 (rock 🪨), 2 (paper 📄), or 3 (scissors ✂️).\nExample: `.rps 1`'
      }, { quoted: msg });
    }

    const userNum = parseInt(args[0]);
    if (![1, 2, 3].includes(userNum)) {
      return conn.sendMessage(chat, {
        text: '❌ Invalid choice. Please pick 1 (rock 🪨), 2 (paper 📄), or 3 (scissors ✂️).'
      }, { quoted: msg });
    }

    const userChoice = choices[userNum - 1];
    const botNum = Math.floor(Math.random() * 3);
    const botChoice = choices[botNum];

    let result = '';
    if (userChoice.name === botChoice.name) {
      result = "It's a tie! 🤝";
    } else if (
      (userChoice.name === 'rock' && botChoice.name === 'scissors') ||
      (userChoice.name === 'paper' && botChoice.name === 'rock') ||
      (userChoice.name === 'scissors' && botChoice.name === 'paper')
    ) {
      result = 'You win! 🎉';
    } else {
      result = 'You lose! 😢';
    }

    await conn.sendMessage(chat, {
      text: `You chose: *${userChoice.name}* ${userChoice.emoji}\nBot chose: *${botChoice.name}* ${botChoice.emoji}\n\n${result}`
    }, { quoted: msg });
  }
};
