const { ownerIDs } = require('../config');

module.exports = {
  name: 'modreq',
  aliases: ['become-mod2', 'submit_mod'],
  description: 'Request to become a moderator with: .rmod Name | Phone | Experience | Rating (number)',

  async run(msg, { conn, args }) {
    const chatId = msg.key.remoteJid;
    const senderId = msg.key.participant || chatId;
    const senderName = msg.pushName || 'Unknown User';

    const input = args.join(' ').trim();

    if (!input.includes('|')) {
      return conn.sendMessage(chatId, { 
        text: '⚠️ Please provide details in the format:\n.rmod Name | Phone | Experience | Rating (1-5)\nExample:\n.rmod Anith | 919136529523 | no | 5' 
      }, { quoted: msg });
    }

    const parts = input.split('|').map(p => p.trim());

    if (parts.length < 4) {
      return conn.sendMessage(chatId, { 
        text: '⚠️ Please provide all four details: Name | Phone | Experience | Rating (1-5)' 
      }, { quoted: msg });
    }

    const [name, phone, experience, ratingStr] = parts;

    const ratingNum = parseInt(ratingStr, 10);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return conn.sendMessage(chatId, { 
        text: '⚠️ Rating must be a number between 1 and 5.' 
      }, { quoted: msg });
    }

    const stars = '⭐'.repeat(ratingNum);

    const notif = 
`👤 *Moderator Request*

From: ${name}
User ID: ${senderId}

Username: ${senderName}
Phone: ${phone}
Past Mod Experience: ${experience}
Rating: ${stars} (${ratingNum}/5)

*Reason:*
Requesting to become a moderator.`;

    try {
      for (const ownerJid of ownerIDs) {
        await conn.sendMessage(ownerJid, { text: notif });
      }
      await conn.sendMessage(chatId, { text: '✅ Your moderator request has been sent to the owner(s).' }, { quoted: msg });
    } catch (error) {
      console.error('Failed to send mod request:', error);
      await conn.sendMessage(chatId, { text: '❌ Failed to send your moderator request. Please try again later.' }, { quoted: msg });
    }
  }
};
