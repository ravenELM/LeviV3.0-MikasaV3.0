const config = require('../config');

module.exports = {
  name: 'owner',
  aliases: ['creator', 'dev'],
  description: 'Show owner information.',
  async run(m, { conn, args }) {
    const ownerNumberClean = config.ownerNumber.replace(/[^0-9]/g, '');
    const ownerContact = `wa.me/${ownerNumberClean}`;
    const supportGroupUrl = 'https://chat.whatsapp.com/YourSupportGroupInviteLink'; // Replace with your actual group invite link

    const text = `
👤 _*𝔐𝔶 𝔐𝔞𝔰𝔱𝔢𝔯*_ 🪐
━━━━━━━━━━━━━━━━━━━━━━━━━
*Name*: 𝕽𝖆𝖛𝖊𝖓
*Number*: wa.me/40736676892
*Age*: 18
*Net worth*: 0$ (Ah shit)
*Creator*: 𝕽𝖆𝖛𝖊𝖓
*Support Gc*: https://chat.whatsapp.com/LT0CqCVSRkT0qVLG5gzNAP


> 🪐 *Powered by 𝕽𝖆𝖛𝖊𝖓 𝔅𝔬𝔱𝔰.* 🪐
    `.trim();

    const gifUrl = 'https://media.tenor.com/OZlsu3A8oJ8AAAPo/attack-on-titan-shingeki-no-kyojin.mp4'; // example GIF URL

    const buttons = [
      { buttonId: `chat_owner`, buttonText: { displayText: 'Chat with Owner' }, type: 1 },
      { buttonId: `support_gc`, buttonText: { displayText: 'Support Group' }, type: 1 }
    ];

    // Send video (GIF) with buttons
    await conn.sendMessage(
      m.key.remoteJid,
      {
        video: { url: gifUrl },
        gifPlayback: true,
        caption: text,
        footer: 'Powered by 𝕽𝖆𝖛𝖊𝖓 Bot',
        templateButtons: buttons
      },
      { quoted: m }
    );
  }
};
