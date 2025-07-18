module.exports = {
  name: 'howbig',
  aliases: ['dsize', 'ppsize'],
  description: 'Check someone’s 🍆 size (just for fun)',
  
  /** 
   * @param {import('@whiskeysockets/baileys').proto.WebMessageInfo} msg 
   */
  async run(msg, { conn }) {
    const chatId = msg.key.remoteJid;
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;

    if (!mentioned || mentioned.length === 0) {
      return conn.sendMessage(chatId, {
        text: '❌ Mention someone to check their size, Baka!\nExample: *.howig @username*'
      }, { quoted: msg });
    }

    const target = mentioned[0];
    const size = Math.floor(Math.random() * 34); // 0 to 33 cm

    return conn.sendMessage(chatId, {
      text: `🍆 The size of @${target.split('@')[0]}'s dick is *${size}.cm*!`,
      mentions: [target]
    }, { quoted: msg });
  }
};
