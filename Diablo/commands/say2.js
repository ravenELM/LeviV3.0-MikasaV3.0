module.exports = {
  name: 'say',
  aliases: [],
  description: 'Bot repeats your message',

  /**
   * @param {import('@whiskeysockets/baileys').proto.WebMessageInfo} msg
   * @param {{ conn: import('@whiskeysockets/baileys').WASocket, args: string[] }} ctx
   */
  async run(msg, { conn, args }) {
    const chatId = msg.key.remoteJid;

    if (args.length === 0) {
      return conn.sendMessage(chatId, { text: '❌ Please provide a message for me to say!' }, { quoted: msg });
    }

    const text = args.join(' ');

    await conn.sendMessage(chatId, { text }, { quoted: msg });
  }
};
