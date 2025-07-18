// commands/group-afk.js
module.exports = {
  name     : 'akf',
  aliases  : [],
  groupOnly: true,
  desc     : 'Set yourself AFK with an optional reason',

  /** @param {import('@whiskeysockets/baileys').proto.WebMessageInfo} m */
  async run (m, { conn, args }) {
    const chatId = m.key.remoteJid;                    // grup
    const me     = (m.key.participant || chatId)       // JID complet
                     .split(':')[0];                   // fără sufix device
    const reason = args.join(' ').trim() || 'No reason';

    conn.afkMap ??= {};                // iniţializează dacă nu există
    conn.afkMap[me] = { reason, since: Date.now() };

    await conn.sendMessage(chatId, {
      text: `🔕  You are now *AFK*.\n📝 Reason: _${reason}_`
    }, { quoted: m });
  }
};
