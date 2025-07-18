module.exports = {
  name: 'userinfo',
  aliases: ['whois', 'user'],
  desc: 'Get info about a user by replying or mentioning, Baka!',
  groupOnly: true,

  async run(msg, { conn, args }) {
    const chatId = msg.key.remoteJid;
    const senderId = msg.key.participant || msg.key.remoteJid;

    // Determine target user: replied or mentioned or sender
    let targetId = null;
    if (msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
      targetId = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
    } else if (msg.message.extendedTextMessage?.contextInfo?.quotedMessage) {
      targetId = msg.message.extendedTextMessage.contextInfo.participant || senderId;
    } else {
      targetId = senderId;
    }

    try {
      // Get profile picture URL
      let pfpUrl = null;
      try {
        pfpUrl = await conn.profilePictureUrl(targetId, 'image');
      } catch {
        pfpUrl = null; // no profile pic
      }

      // Get status message (presence)
      let status = 'No status available';
      try {
        const statusObj = await conn.getStatus(targetId);
        if (statusObj?.status) status = statusObj.status;
      } catch {}

      // Get group metadata to find when user joined (optional)
      let joinDate = 'Unknown';
      try {
        const meta = await conn.groupMetadata(chatId);
        const participant = meta.participants.find(p => p.id === targetId);
        if (participant?.joinedTimestamp) {
          joinDate = new Date(participant.joinedTimestamp * 1000).toLocaleString();
        }
      } catch {}

      // Compose info text
      const infoText =
        `👤 *User Info*\n\n` +
        `• *WhatsApp ID:* ${targetId}\n` +
        `• *Status:* ${status}\n` +
        `• *Joined Group:* ${joinDate}\n`;

      // Send with profile picture if available
      if (pfpUrl) {
        await conn.sendMessage(chatId, {
          image: { url: pfpUrl },
          caption: infoText,
        }, { quoted: msg });
      } else {
        await conn.sendMessage(chatId, { text: infoText }, { quoted: msg });
      }
    } catch (e) {
      console.error('Userinfo error:', e);
      await conn.sendMessage(chatId, { text: '❌ Failed to fetch user info, Baka!' }, { quoted: msg });
    }
  }
};
