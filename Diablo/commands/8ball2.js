module.exports = {
  name: '8ball',
  aliases: ['ask', 'fortune'],
  description: 'Ask the magic 8-ball a yes/no question',

  /** @param {import('@whiskeysockets/baileys').proto.WebMessageInfo} msg
   *  @param {{ conn: import('@whiskeysockets/baileys').WASocket, args: string[] }} ctx */
  async run(msg, { conn, args }) {
    const chat = msg.key.remoteJid;
    const question = args.join(' ');

    if (!question) {
      return conn.sendMessage(chat, {
        text: '🎱 Ask a yes/no question!\n\nExample:\n.8ball Will I be rich?'
      }, { quoted: msg });
    }

    const replies = [
      '✅ Yes, definitely!',
      '🤔 Maybe... who knows?',
      '❌ No, not likely!',
      '💭 Ask again later.',
      '🔮 The stars say yes.',
      '🙅‍♀️ I wouldn’t count on it.',
      '😐 It’s uncertain.',
      '🎯 Without a doubt.',
      '😅 Better not tell you now.',
    ];

    const result = replies[Math.floor(Math.random() * replies.length)];

    await conn.sendMessage(chat, {
      text: `🎱 *Question:* ${question}\n*Answer:* ${result}`
    }, { quoted: msg });
  }
};
