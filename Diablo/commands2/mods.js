// commands/mods.js
const config = require('../config');          // adjust path if different

module.exports = {
  name       : 'mods',
  aliases    : ['moderators'],
  description: 'Show the list of bot moderators',

  /** 
   * @param {import('@whiskeysockets/baileys').proto.WebMessageInfo} msg
   * @param {{ conn: import('@whiskeysockets/baileys').WASocket }} ctx
   */
  async run(msg, { conn }) {
    const chatId = msg.key.remoteJid;

    /* If no mods configured */
    if (!Array.isArray(config.mods) || config.mods.length === 0) {
      return conn.sendMessage(chatId,
        { text: '🚫 No moderators are configured yet.' },
        { quoted: msg });
    }

    /* Build caption & mention array */
    const mentions = [];
    let caption = '*🔮 𝕽𝖆𝖛𝖊𝖓‑BOTS MODS 🔮*\n\n';

    for (const jid of config.mods) {
      mentions.push(jid);
      caption += `🎗 @${jid.split('@')[0]}\n`;
    }

    caption += '\n📛 *Please do not spam them!*';

    await conn.sendMessage(
      chatId,
      { text: caption, mentions },
      { quoted: msg }
    );
  }
};
