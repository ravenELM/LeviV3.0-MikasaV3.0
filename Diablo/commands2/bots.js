// commands/bots.js
// -----------------------------------------------------------------------------
// Usage: .bots
// Simply confirms the bot is up and shows its configured name.
// -----------------------------------------------------------------------------

const { botName } = require('../config');

module.exports = {
  name: 'bots',
  aliases: ['online', 'status'],
  description: 'Check if the bot is alive – returns a green square and bot name',
  groupOnly: false,

  /**
   * @param {import('@whiskeysockets/baileys').proto.WebMessageInfo} msg
   * @param {{ conn: import('@whiskeysockets/baileys').WASocket }} ctx
   */
  async run (msg, { conn }) {
    const chatId = msg.key.remoteJid;
    await conn.sendMessage(
      chatId,
      { text: ` 🟩𝚳𝚰𝚱𝚨𝐒𝚨 𝚩𝚯𝚻 \n 🟩𝐋𝚵𝐕𝐈 𝚩𝚯𝚻  ` },
      { quoted: msg }
    );
  }
};
