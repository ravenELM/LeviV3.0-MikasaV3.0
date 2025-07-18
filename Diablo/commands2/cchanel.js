const fs = require('fs');
const path = require('path');

async function createChannelCommand(m, { conn, args, ownerIDs }) {
  const senderId = (m.key.participant || m.key.remoteJid).split(':')[0];
  if (!ownerIDs.includes(senderId)) {
    await conn.sendMessage(m.key.remoteJid, { text: '❌ Only owner can create a channel.' }, { quoted: m });
    return;
  }

  const groupName = '𝐋𝚵𝐕𝐈-𝚪𝚨⋁𝚵𝚴  𝚩𝚯𝚻𝐒';  // Your original name
  const groupImagePath = path.join(__dirname, 'media', 'ravenlogo.png');

  try {
    // 1. Create the group with no participants initially (you can add participants later if you want)
    // WhatsApp requires at least one participant other than bot; so you can add the owner as participant
    const participants = [senderId];
    const response = await conn.groupCreate(groupName, participants);

    const groupJid = response.gid;  // group ID jid

    // 2. Set the group picture
    const imgBuffer = fs.readFileSync(groupImagePath);
    await conn.query({
      tag: 'iq',
      attrs: {
        to: groupJid,
        type: 'set',
        xmlns: 'w:profile:picture',
      },
      content: [{
        tag: 'picture',
        attrs: { type: 'image' },
        content: imgBuffer
      }]
    });

    // 3. Get the group invite code (link)
    const inviteInfo = await conn.groupInviteCode(groupJid);
    const inviteCode = inviteInfo.code; // e.g., "0029Vb60BldK5cDL3H07211q"
    const inviteLink = `https://chat.whatsapp.com/${inviteCode}`;

    // 4. Send invite link to the owner
    await conn.sendMessage(senderId, { text: `✅ Channel created!\n\nName: ${groupName}\nInvite Link: ${inviteLink}` });

  } catch (err) {
    console.error('Create channel error:', err);
    await conn.sendMessage(senderId, { text: `❌ Failed to create channel: ${err.message}` });
  }
}

module.exports = { createChannelCommand };
