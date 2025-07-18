// commands/gc-prune.js
const config = require('../config');

/**
 * Helper: remove ":device" suffix, e.g., "123@s.whatsapp.net:2" → "123@s.whatsapp.net"
 */
const bare = jid => jid.split(':')[0];

module.exports = {
  name: 'leaveall',
  aliases: ['leaveextras', 'leaveallgc', 'prunegc'],
  description: 'Owner-only • Leave all groups except those whitelisted in config.economyGroups',

  /**
   * @param {import('@whiskeysockets/baileys').proto.WebMessageInfo} msg
   * @param {{ conn: import('@whiskeysockets/baileys').WASocket }} ctx
   */
  async run(msg, { conn }) {
    const from = bare(msg.key.remoteJid);
    const sender = bare(msg.key.participant || from);

    // Check if sender is owner
    const owners = (config.ownerIDs || []).map(bare);
    if (!owners.includes(sender)) {
      return conn.sendMessage(from,
        { text: '⛔ This command is reserved for the *bot owner*.' },
        { quoted: msg });
    }

    // Get list of all groups the bot is in
    const allGroups = await conn.groupFetchAllParticipating(); // { groupJid: metadata }
    const keepSet = new Set((config.economyGroups || []).map(bare));

    let left = 0, kept = 0;

    for (const gid of Object.keys(allGroups)) {
      if (keepSet.has(gid)) {
        kept++;
        continue;
      }

      try {
        await conn.groupLeave(gid);
        left++;
        await new Promise(res => setTimeout(res, 800)); // small delay
      } catch (err) {
        console.error('❌ Failed to leave group:', gid, err.message);
      }
    }

    // Send summary message
    const text =
      `✅ *Group Prune Complete*\n\n` +
      `👋 Left groups: *${left}*\n` +
      `📌 Kept groups: *${kept}*\n\n` +
      `✅ Staying in:\n${[...keepSet].map(j => `• ${j}`).join('\n')}`;

    await conn.sendMessage(from, { text }, { quoted: msg });
  }
};
