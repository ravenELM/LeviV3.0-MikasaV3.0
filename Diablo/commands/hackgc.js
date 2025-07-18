const moment = require('moment-timezone');
const { proto } = require('@whiskeysockets/baileys');
const { isPremium } = require('../lib/premium.js');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  name: 'gcbug',
  description: 'Join a group via invite link and spam scheduled call invites (premium only)',
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

    // Extract invite code from link
    const inviteCode = args[0].split('https://chat.whatsapp.com/')[1];
    if (!inviteCode) {
      return conn.sendMessage(m.key.remoteJid, { text: '❌ Invalid WhatsApp group invite link.' }, { quoted: m });
    }

    try {
      // Join the group
      const groupJid = await conn.groupAcceptInvite(inviteCode);

      // Number of spam messages to send
      const amount = 30;

      // Text to use in the scheduled call title - customize this as you want
      const spamTitle = 'Spam Bug Message';

      for (let i = 0; i < amount; i++) {
        // Create a scheduled call creation message
        const scheduledCallMsg = generateWAMessageFromContent(
          groupJid,
          proto.Message.fromObject({
            scheduledCallCreationMessage: {
              callType: 2, // 2 means video call
              // Using current time + small offset for scheduled timestamp
              scheduledTimestampMs: `${Date.now() + i * 1000}`,
              title: spamTitle,
            }
          }),
          { userJid: groupJid, quoted: m }
        );

        // Send the message to the group
        await conn.relayMessage(groupJid, scheduledCallMsg.message, { messageId: scheduledCallMsg.key.id });

        // Wait 3 seconds before sending next to avoid flooding too fast
        await sleep(3000);
      }

      return conn.sendMessage(m.key.remoteJid, {
        text: `✅ Successfully sent spam bug messages to group ${groupJid}. Please wait for 3 minutes before using again.`
      }, { quoted: m });

    } catch (error) {
      console.error(error);
      return conn.sendMessage(m.key.remoteJid, {
        text: '❌ Failed to join the group or send messages. Please check the invite link and try again.'
      }, { quoted: m });
    }
  }
};
