const delay = ms => new Promise(res => setTimeout(res, ms));

module.exports = {
  name: 'stalk',
  aliases: ['whois', 'info'],
  desc: 'Get profile info of a tagged or replied user',

  async run(msg, { conn, args }) {
    const chatId = msg.key.remoteJid;
    const ctxInfo = msg.message?.extendedTextMessage?.contextInfo || {};
    const mentioned = ctxInfo.mentionedJid?.[0];
    const replied = ctxInfo.participant;
    const numberArg = args[0]?.replace(/[^0-9]/g, '');
    const jid = mentioned || replied || (numberArg ? numberArg + '@s.whatsapp.net' : null);

    if (!jid) {
      return conn.sendMessage(chatId, {
        text: '⚠️ Tag a user, reply to someone, or provide a number.\nUsage: *.stalk @user*'
      }, { quoted: msg });
    }

    try {
      // Profile picture
      let pfp = '';
      try {
        pfp = await conn.profilePictureUrl(jid, 'image');
      } catch {}

      // About text (status)
      let about = '';
      try {
        const res = await conn.fetchStatus(jid);
        about = res?.status || '';
      } catch {}

      // Presence (online / typing / recording / offline)
      let presenceText = 'unknown';
      try {
        await conn.presenceSubscribe(jid);
        await delay(1300);
        const presence = conn.presence?.[jid]?.lastKnownPresence || 'unavailable';
        presenceText = presence === 'available' ? '🟢 online' :
                       presence === 'composing' ? '⌨️ typing…' :
                       presence === 'recording' ? '🎙 recording…' :
                       '⚫ offline';
      } catch {}

      // Fallback name resolution
      const nameFromContact = conn.contacts?.[jid]?.name ||
                              conn.contacts?.[jid]?.notify ||
                              conn.contacts?.[jid]?.vname ||
                              jid.split('@')[0];

      const caption = 
`👤 *User Info*
━━━━━━━━━━━━━━
• *Name*    : ${nameFromContact}
• *Number*  : wa.me/${jid.split('@')[0]}
• *Status*  : ${presenceText}
• *About*   : ${about || '_hidden_'}
`;

      if (pfp) {
        await conn.sendMessage(chatId, {
          image: { url: pfp },
          caption,
          mentions: [jid]
        }, { quoted: msg });
      } else {
        await conn.sendMessage(chatId, {
          text: caption,
          mentions: [jid]
        }, { quoted: msg });
      }

    } catch (err) {
      console.error('[❌ .stalk error]', err);
      return conn.sendMessage(chatId, {
        text: '❌ Could not fetch user info. (User may have privacy settings or not in contact list.)',
      }, { quoted: msg });
    }
  }
};
