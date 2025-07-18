module.exports = {
  name: 'gnumber',
  aliases: ['gn'],
  description: 'Guess a number between 1 and 10',

  /** @param {import('@whiskeysockets/baileys').proto.WebMessageInfo} msg
   *  @param {{ conn: import('@whiskeysockets/baileys').WASocket, args: string[] }} ctx */
  async run(msg, { conn, args }) {
    const chat = msg.key.remoteJid;

    let guess;

    // If user replied to a bot message, parse guess from reply text
    if (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
      const replyText = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
      guess = parseInt(replyText);
    } else {
      // Otherwise, parse guess from args
      guess = parseInt(args[0]);
    }

    if (!guess || guess < 1 || guess > 10) {
      return conn.sendMessage(chat, {
        text: '❌ Please guess a number between 1 and 10.\n\nExample:\n.guess 5\n\nOr reply to my prompt with your guess.'
      }, { quoted: msg });
    }

    const answer = Math.floor(Math.random() * 10) + 1;

    if (guess === answer) {
      await conn.sendMessage(chat, { text: `🎉 Congrats! You guessed it right: ${answer}` }, { quoted: msg });
    } else {
      await conn.sendMessage(chat, { text: `❌ Nope, the correct number was ${answer}. Try again!` }, { quoted: msg });
    }
  }
};
