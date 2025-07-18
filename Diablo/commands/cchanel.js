// commands2/creategc.js
const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'creategc',
  run: async (m, { conn, ownerIDs }) => {
    const senderId = (m.key.participant || m.key.remoteJid).split(':')[0];
    if (!ownerIDs.includes(senderId)) {
      await conn.sendMessage(m.key.remoteJid, { text: '🚫 Only owner can use this command.' }, { quoted: m });
      return;
    }

    const groupName = '𝐋𝚵𝐕𝐈-𝚪𝚨⋁𝚵𝚴  𝚩𝚯𝚻𝐒';
    const participants = [senderId]; // Add more IDs if needed, must be full WhatsApp IDs

    try {
      // Create group with the sender as participant
      const res = await conn.groupCreate(groupName, participants);

      // Read your logo image
      const buffer = fs.readFileSync(path.join(__dirname, '..', 'media', 'ravenlogo.png'));

      // Set group icon
      await conn.query({
        tag: 'iq',
        attrs: {
          to: res.gid,
          type: 'set',
          xmlns: 'w:profile:picture'
        },
        content: [
          {
            tag: 'picture',
            attrs: { type: 'image' },
            content: buffer
          }
        ]
      });

      // Get invite code/link
      const inviteCode = res.gid.split('@')[0];
      const inviteLink = `https://chat.whatsapp.com/${inviteCode}`;

      // Send success message with group link
      await conn.sendMessage(m.key.remoteJid, {
        text: `✅ Group created successfully!\n\nName: ${groupName}\nLink: ${inviteLink}`
      }, { quoted: m });

    } catch (error) {
      console.error('Error creating group:', error);
      await conn.sendMessage(m.key.remoteJid, {
        text: '❌ Failed to create group. Please try again later.'
      }, { quoted: m });
    }
  }
};
