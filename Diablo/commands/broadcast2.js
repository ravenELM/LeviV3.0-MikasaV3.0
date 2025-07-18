const config = require('../config');

module.exports = {
  name: 'broadcast',
  aliases: ['bc'],
  description: 'Owner only: send a message to all groups',

  async run(msg, { conn, args }) {
    const sender = msg.key.participant || msg.key.remoteJid;
    if (!config.ownerIDs.includes(sender)) {
      return conn.sendMessage(msg.key.remoteJid, { text: '*⁺‧₊˚ ཐི⋆This command is for my esteemed creator only. How exclusive!⋆ཋྀ ˚₊‧⁺*' }, { quoted: msg });
    }

    const text = args.join(' ');
    if (!text) {
      return conn.sendMessage(msg.key.remoteJid, { text: '⚠️ Please provide a message to broadcast.' }, { quoted: msg });
    }

    let groups = [];
    try {
      const chats = await conn.groupFetchAllParticipating();
      groups = Object.keys(chats);
    } catch (e) {
      return conn.sendMessage(msg.key.remoteJid, { text: '⚠️ Failed to fetch groups.' }, { quoted: msg });
    }

    for (const groupId of groups) {
      try {
        await conn.sendMessage(groupId, { text });
      } catch (e) {
        console.error(`Failed to send to ${groupId}:`, e);
      }
    }

    await conn.sendMessage(msg.key.remoteJid, { text: `✅ Broadcast sent to ${groups.length} groups.` }, { quoted: msg });
  }
};
